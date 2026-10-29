package edu.scu.campaws.dto;

// The walk token must not be public.
public record StartWalkResponse(
        int walkId,
        String shareToken,
        boolean publicSharing,
        String message
) { }