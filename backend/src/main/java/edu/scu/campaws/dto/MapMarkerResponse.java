package edu.scu.campaws.dto;

import java.time.Instant;

public record MapMarkerResponse(
        String markerId,
        double latitude,
        double longitude,
        String label,
        Instant lastUpdatedAt,
        boolean approximate
) { }