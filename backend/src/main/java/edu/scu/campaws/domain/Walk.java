package edu.scu.campaws.domain;

import java.time.Duration;
import java.time.LocalDateTime;

public class Walk {
    private final int walkId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    public Walk(int walkId) {
        if (walkId <= 0) {
            throw new IllegalArgumentException(
                    "Walk ID must be positive."
            );
        }

        this.walkId = walkId;
    }

    public void startWalk(LocalDateTime time) {
        if (time == null) {
            throw new IllegalArgumentException(
                    "Start time cannot be null."
            );
        }

        if (startTime != null) {
            throw new IllegalStateException(
                    "This walk has already been started."
            );
        }

        startTime = time;
    }

    public void endWalk(LocalDateTime time) {
        if (time == null) {
            throw new IllegalArgumentException(
                    "End time cannot be null."
            );
        }

        if (startTime == null) {
            throw new IllegalStateException(
                    "The walk must be started first."
            );
        }

        if (endTime != null) {
            throw new IllegalStateException(
                    "This walk has already ended."
            );
        }

        if (time.isBefore(startTime)) {
            throw new IllegalArgumentException(
                    "End time cannot be before start time."
            );
        }

        endTime = time;
    }

    public boolean isActive() {
        return startTime != null && endTime == null;
    }

    public long getDurationMinutes() {
        if (startTime == null || endTime == null) {
            throw new IllegalStateException(
                    "A completed walk is required to calculate duration."
            );
        }

        return Duration.between(startTime, endTime).toMinutes();
    }

    public int getWalkId() {
        return walkId;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }
}