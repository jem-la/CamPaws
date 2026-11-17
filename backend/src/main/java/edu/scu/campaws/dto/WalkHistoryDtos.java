package edu.scu.campaws.dto;

import java.time.Instant;
import java.util.List;

public final class WalkHistoryDtos {
    private WalkHistoryDtos() { }

    public record SaveWalkRequest(
            Integer dogId, Instant startedAt, Instant endedAt, double distanceMeters, boolean publicSharing) { }

    public record WalkSummary(
            int walkId, Integer dogId, String dogName, Instant startedAt, Instant endedAt,
            double distanceMeters, long durationSeconds, boolean publicSharing) { }

    public record WalkStats(
            int walkCount, double totalDistanceMeters, long totalDurationSeconds, List<WalkSummary> recent) { }
}
