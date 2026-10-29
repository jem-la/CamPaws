package edu.scu.campaws.dto;

public record WalkLocationUpdateRequest(
        Double latitude,
        Double longitude
) { }