package edu.scu.campaws.dto;

public record StartWalkResponse(
        int walkId,
        boolean publicSharing,
        String message
) { }
