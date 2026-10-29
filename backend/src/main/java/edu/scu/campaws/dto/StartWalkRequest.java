package edu.scu.campaws.dto;

public record StartWalkRequest(
        int dogId,
        boolean publicSharing,
        Double latitude,
        Double longitude
) { }