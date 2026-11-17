package edu.scu.campaws.service;

import edu.scu.campaws.dto.WalkHistoryDtos.SaveWalkRequest;
import edu.scu.campaws.dto.WalkHistoryDtos.WalkStats;
import edu.scu.campaws.dto.WalkHistoryDtos.WalkSummary;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

/** Saves finished walks and computes a user's walk statistics. */
@Service
public class WalkHistoryService {
    /** Sanity limits: no walk is longer than a day or 100 km. */
    static final Duration MAX_DURATION = Duration.ofHours(24);
    static final double MAX_DISTANCE_METERS = 100_000;
    private static final int RECENT = 10;

    private final JdbcTemplate jdbc;
    private final DogCatalog catalog;

    public WalkHistoryService(JdbcTemplate jdbc, DogCatalog catalog) {
        this.jdbc = jdbc;
        this.catalog = catalog;
    }

    @Transactional
    public WalkSummary save(int userId, SaveWalkRequest request) {
        if (request == null || request.startedAt() == null || request.endedAt() == null) {
            throw new IllegalArgumentException("Walk start and end times are required.");
        }
        Instant now = Instant.now();
        if (request.endedAt().isBefore(request.startedAt())) {
            throw new IllegalArgumentException("A walk can't end before it starts.");
        }
        if (request.endedAt().isAfter(now.plusSeconds(300))) {
            throw new IllegalArgumentException("A walk can't end in the future.");
        }
        if (Duration.between(request.startedAt(), request.endedAt()).compareTo(MAX_DURATION) > 0) {
            throw new IllegalArgumentException("Walks can be at most 24 hours long.");
        }
        double distance = request.distanceMeters();
        if (!Double.isFinite(distance) || distance < 0 || distance > MAX_DISTANCE_METERS) {
            throw new IllegalArgumentException("Walk distance must be between 0 and 100 km.");
        }
        if (request.dogId() != null) {
            catalog.requireById(request.dogId());
        }

        Integer id = jdbc.queryForObject("""
                INSERT INTO walk_history (user_id, dog_id, started_at, ended_at, distance_meters, public_sharing)
                VALUES (?, ?, ?, ?, ?, ?) RETURNING walk_id
                """, Integer.class, userId, request.dogId(), Timestamp.from(request.startedAt()),
                Timestamp.from(request.endedAt()), distance, request.publicSharing());
        return recent(userId, 1, id).get(0);
    }

    @Transactional(readOnly = true)
    public WalkStats stats(int userId) {
        return jdbc.queryForObject("""
                SELECT count(*) AS n,
                       coalesce(sum(distance_meters), 0) AS dist,
                       coalesce(sum(extract(epoch FROM (ended_at - started_at))), 0) AS secs
                FROM walk_history WHERE user_id = ?
                """, (rs, i) -> new WalkStats(
                        rs.getInt("n"), rs.getDouble("dist"), Math.round(rs.getDouble("secs")),
                        recent(userId, RECENT, null)),
                userId);
    }

    private List<WalkSummary> recent(int userId, int limit, Integer onlyWalkId) {
        return jdbc.query("""
                SELECT w.walk_id, w.dog_id, d.name, w.started_at, w.ended_at, w.distance_meters, w.public_sharing
                FROM walk_history w LEFT JOIN dogs d ON d.dog_id = w.dog_id
                WHERE w.user_id = ? AND (?::int IS NULL OR w.walk_id = ?)
                ORDER BY w.started_at DESC LIMIT ?
                """, (rs, i) -> {
                    Instant start = rs.getTimestamp("started_at").toInstant();
                    Instant end = rs.getTimestamp("ended_at").toInstant();
                    int dogId = rs.getInt("dog_id");
                    return new WalkSummary(
                            rs.getInt("walk_id"), rs.wasNull() ? null : dogId, rs.getString("name"),
                            start, end, rs.getDouble("distance_meters"),
                            Duration.between(start, end).getSeconds(), rs.getBoolean("public_sharing"));
                }, userId, onlyWalkId, onlyWalkId, limit);
    }
}
