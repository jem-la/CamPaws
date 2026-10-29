package edu.scu.campaws.service;

import edu.scu.campaws.domain.DogProfile;
import edu.scu.campaws.domain.Walk;
import edu.scu.campaws.dto.MapMarkerResponse;
import edu.scu.campaws.dto.StartWalkResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.atomic.AtomicInteger;


@Service
public class WalkSessionService {
    static final Duration PUBLIC_LOCATION_MAX_AGE =
            Duration.ofMinutes(5);

    private static final String PUBLIC_LABEL = "Dog nearby";

    private final DogCatalog catalog;
    private final double gridDegrees;
    private final Clock clock;

    private final AtomicInteger nextWalkId = new AtomicInteger(1);

    private final ConcurrentMap<Integer, Session> sessions =
            new ConcurrentHashMap<>();

    @Autowired
    public WalkSessionService(
            DogCatalog catalog,
            @Value("${campaws.map.grid-degrees:0.003}")
            double gridDegrees) {
        this(catalog, gridDegrees, Clock.systemUTC());
    }

    WalkSessionService(
            DogCatalog catalog,
            double gridDegrees,
            Clock clock) {

        if (!Double.isFinite(gridDegrees)
                || gridDegrees <= 0
                || gridDegrees > 1) {
            throw new IllegalArgumentException(
                    "Map privacy grid must be greater than 0 and at most 1 degree."
            );
        }

        if (catalog == null || clock == null) {
            throw new IllegalArgumentException(
                    "Catalog and clock are required."
            );
        }

        this.catalog = catalog;
        this.gridDegrees = gridDegrees;
        this.clock = clock;
    }

    public StartWalkResponse startWalk(
            int dogId,
            boolean publicSharing,
            Double latitude,
            Double longitude) {

        if (dogId <= 0) {
            throw new IllegalArgumentException(
                    "Dog ID must be positive."
            );
        }

        catalog.requireById(dogId);

        Double acceptedLatitude = null;
        Double acceptedLongitude = null;
        Instant now = clock.instant();

        if (publicSharing) {
            if (latitude == null || longitude == null) {
                throw new IllegalArgumentException(
                        "Coordinates are required when public sharing is enabled."
                );
            }

            DogProfile.validateCoordinates(latitude, longitude);

            acceptedLatitude = latitude;
            acceptedLongitude = longitude;
        }


        int id = nextWalkId.getAndIncrement();

        Walk walk = new Walk(id);
        walk.startWalk(
                LocalDateTime.ofInstant(now, ZoneOffset.UTC)
        );

        String token =
                UUID.randomUUID() + "." + UUID.randomUUID();

        Session session = new Session(
                id,
                dogId,
                walk,
                token,
                UUID.randomUUID().toString(),
                publicSharing,
                acceptedLatitude,
                acceptedLongitude,
                publicSharing ? now : null
        );

        sessions.put(id, session);

        String message = publicSharing
                ? "Public sharing is on. Only an approximate anonymous marker is returned on the map."
                : "Private walk started; no coordinates are retained or shown on the public map.";

        return new StartWalkResponse(
                id, token, publicSharing, message
        );
    }

    public void updateLocation(
            int walkId,
            String token,
            Double latitude,
            Double longitude) {

        Session session = requireSession(walkId);
        authorize(session, token);

        synchronized (session) {
            if (!session.walk.isActive()) {
                throw new IllegalStateException(
                        "This walk has ended."
                );
            }

            if (!session.publicSharing) {
                throw new IllegalStateException(
                        "Location sharing is off for this walk."
                );
            }

            if (latitude == null || longitude == null) {
                throw new IllegalArgumentException(
                        "Latitude and longitude are required."
                );
            }

            DogProfile.validateCoordinates(latitude, longitude);

            session.latitude = latitude;
            session.longitude = longitude;
            session.lastUpdatedAt = clock.instant();
        }
    }

    public void endWalk(int walkId, String token) {
        Session session = requireSession(walkId);
        authorize(session, token);

        synchronized (session) {
            if (!session.walk.isActive()) {
                throw new IllegalStateException(
                        "This walk has already ended."
                );
            }

            session.walk.endWalk(
                    LocalDateTime.ofInstant(
                            clock.instant(), ZoneOffset.UTC
                    )
            );

            session.publicSharing = false;
            session.latitude = null;
            session.longitude = null;
            session.lastUpdatedAt = null;
        }
    }

    public List<MapMarkerResponse> getPublicMarkers() {
        expireStalePublicLocations();

        List<MapMarkerResponse> markers = new ArrayList<>();

        for (Session session : sessions.values()) {
            synchronized (session) {
                if (!session.walk.isActive()
                        || !session.publicSharing
                        || session.latitude == null
                        || session.longitude == null
                        || session.lastUpdatedAt == null) {
                    continue;
                }

                markers.add(new MapMarkerResponse(
                        session.publicMarkerId,
                        roundCoordinate(
                                session.latitude,
                                gridDegrees, -90, 90
                        ),
                        roundCoordinate(
                                session.longitude,
                                gridDegrees, -180, 180
                        ),
                        PUBLIC_LABEL,
                        session.lastUpdatedAt.truncatedTo(
                                ChronoUnit.MINUTES
                        ),
                        true
                ));
            }
        }

        markers.sort(
                Comparator.comparing(MapMarkerResponse::markerId)
        );

        return markers;
    }

    @Scheduled(
            fixedDelayString =
                    "${campaws.map.cleanup-interval-ms:30000}"
    )
    public void expireStalePublicLocations() {
        Instant cutoff =
                clock.instant().minus(PUBLIC_LOCATION_MAX_AGE);

        for (Session session : sessions.values()) {
            synchronized (session) {
                if (session.publicSharing
                        && (session.lastUpdatedAt == null
                        || session.lastUpdatedAt.isBefore(cutoff))) {

                    session.publicSharing = false;
                    session.latitude = null;
                    session.longitude = null;
                    session.lastUpdatedAt = null;
                }
            }
        }
    }

    private Session requireSession(int id) {
        Session session = sessions.get(id);

        if (session == null) {
            throw new NoSuchElementException(
                    "Walk session not found."
            );
        }

        return session;
    }

    private void authorize(
            Session session, String suppliedToken) {

        if (suppliedToken == null || suppliedToken.isBlank()) {
            throw new SecurityException(
                    "A valid X-Walk-Token header is required."
            );
        }

        byte[] expected =
                session.shareToken.getBytes(StandardCharsets.UTF_8);

        byte[] supplied =
                suppliedToken.getBytes(StandardCharsets.UTF_8);

        if (!MessageDigest.isEqual(expected, supplied)) {
            throw new SecurityException(
                    "The walk token is invalid."
            );
        }
    }

    private double roundCoordinate(
            double coordinate,
            double grid,
            double min,
            double max) {

        double rounded =
                Math.round(coordinate / grid) * grid;

        return Math.max(min, Math.min(max, rounded));
    }

    private static final class Session {
        @SuppressWarnings("unused")
        private final int walkId;

        // Stored internally, never copied into public responses.
        @SuppressWarnings("unused")
        private final int dogId;

        private final Walk walk;
        private final String shareToken;
        private final String publicMarkerId;

        private boolean publicSharing;
        private Double latitude;
        private Double longitude;
        private Instant lastUpdatedAt;

        private Session(
                int walkId,
                int dogId,
                Walk walk,
                String shareToken,
                String publicMarkerId,
                boolean publicSharing,
                Double latitude,
                Double longitude,
                Instant lastUpdatedAt) {

            this.walkId = walkId;
            this.dogId = dogId;
            this.walk = walk;
            this.shareToken = shareToken;
            this.publicMarkerId = publicMarkerId;
            this.publicSharing = publicSharing;
            this.latitude = latitude;
            this.longitude = longitude;
            this.lastUpdatedAt = lastUpdatedAt;
        }
    }
}