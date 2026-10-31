package edu.scu.campaws;

import edu.scu.campaws.domain.Walk;

import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;
import static org.junit.jupiter.api.Assertions.*;

class WalkTest {
    @Test
    void startWalkMarksActive() {
        Walk walk = new Walk(1);
        LocalDateTime t = LocalDateTime.of(2026, 10, 24, 10, 0);
        walk.startWalk(t);
        assertTrue(walk.isActive());
        assertEquals(t, walk.getStartTime());
    }

    @Test
    void endWalkMarksInactive() {
        Walk w = new Walk(1);
        LocalDateTime s = LocalDateTime.of(2026, 10, 24, 10, 0);
        LocalDateTime e = s.plusMinutes(30);
        w.startWalk(s);
        w.endWalk(e);
        assertFalse(w.isActive());
        assertEquals(e, w.getEndTime());
    }

    @Test
    void calculatesDuration() {
        Walk w = new Walk(1);
        LocalDateTime s = LocalDateTime.of(2026, 10, 24, 10, 0);
        w.startWalk(s);
        w.endWalk(s.plusMinutes(45));
        assertEquals(45, w.getDurationMinutes());
    }

    @Test
    void rejectsEndBeforeStart() {
        Walk w = new Walk(1);
        LocalDateTime s = LocalDateTime.of(2026, 10, 24, 10, 30);
        w.startWalk(s);
        assertThrows(IllegalArgumentException.class,
                () -> w.endWalk(s.minusMinutes(1)));
    }

    @Test
    void rejectsEndWithoutStart() {
        Walk w = new Walk(1);
        assertThrows(IllegalStateException.class,
                () -> w.endWalk(LocalDateTime.now()));
    }

    @Test
    void allowsZeroDurationBoundary() {
        Walk w = new Walk(1);
        LocalDateTime t = LocalDateTime.of(2026, 10, 24, 10, 0);
        w.startWalk(t);
        w.endWalk(t);
        assertEquals(0, w.getDurationMinutes());
    }

    @Test
    void rejectsNullStartTime() {
        assertThrows(IllegalArgumentException.class,
                () -> new Walk(1).startWalk(null));
    }

    @Test
    void rejectsNullEndTime() {
        Walk w = new Walk(1);
        w.startWalk(LocalDateTime.now());
        assertThrows(IllegalArgumentException.class, () -> w.endWalk(null));
    }

    @Test
    void rejectsStartingTwice() {
        Walk w = new Walk(1);
        LocalDateTime t = LocalDateTime.now();
        w.startWalk(t);
        assertThrows(IllegalStateException.class,
                () -> w.startWalk(t.plusMinutes(1)));
    }

    @Test
    void rejectsEndingTwice() {
        Walk w = new Walk(1);
        LocalDateTime t = LocalDateTime.now();
        w.startWalk(t);
        w.endWalk(t);
        assertThrows(IllegalStateException.class, () -> w.endWalk(t));
    }

    @Test
    void rejectsInvalidWalkId() {
        assertThrows(IllegalArgumentException.class, () -> new Walk(0));
    }
}