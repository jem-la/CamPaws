package edu.scu.campaws;

import java.time.LocalDateTime;

public class Walk {
    private int walkId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    public Walk(int walkId) {
        // TODO: Validate and initialize the walk.
    }

    public void startWalk(LocalDateTime time) {
        // TODO: Record the start time and validate walk state.
    }

    public void endWalk(LocalDateTime time) {
        // TODO: Record the end time and validate walk state.
    }

    public boolean isActive() {
        // TODO: Return whether the walk is active.
        return false;
    }

    public long getDurationMinutes() {
        // TODO: Calculate the completed walk's duration.
        return 0;
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