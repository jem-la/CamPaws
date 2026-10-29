package edu.scu.campaws;

import edu.scu.campaws.domain.Walk;
import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;
import static org.junit.jupiter.api.Assertions.*;

class WalkTest {
    @Test
    void testStartWalk() {
        Walk walk = new Walk(1);
        LocalDateTime start = LocalDateTime.of(
                2026, 10, 24, 10, 0
        );
        walk.startWalk(start);

        assertTrue(walk.isActive());
        assertEquals(start, walk.getStartTime());
    }

    @Test
    void testEndWalk() {
        Walk walk = new Walk(1);
        LocalDateTime start = LocalDateTime.of(
                2026, 10, 24, 10, 0
        );
        LocalDateTime end = LocalDateTime.of(
                2026, 10, 24, 10, 30
        );
        walk.startWalk(start);
        walk.endWalk(end);

        assertFalse(walk.isActive());
        assertEquals(start, walk.getStartTime());
        assertEquals(end, walk.getEndTime());
    }

    @Test
    void testCalculateWalkDuration() {
        Walk walk = new Walk(1);
        walk.startWalk(LocalDateTime.of(
                2026, 10, 24, 10, 0
        ));
        walk.endWalk(LocalDateTime.of(
                2026, 10, 24, 10, 45
        ));

        assertEquals(45, walk.getDurationMinutes());
    }

    @Test
    void testInvalidEndWalkWithoutStart() {
        Walk walk = new Walk(1);

        assertThrows(IllegalStateException.class, () ->
                walk.endWalk(LocalDateTime.of(
                        2026, 10, 24, 10, 30
                ))
        );
    }

    @Test
    void testInvalidEndWalkBeforeStartTime() {
        Walk walk = new Walk(1);
        walk.startWalk(LocalDateTime.of(
                2026, 10, 24, 10, 30
        ));

        assertThrows(IllegalArgumentException.class, () ->
                walk.endWalk(LocalDateTime.of(
                        2026, 10, 24, 10, 0
                ))
        );
    }

    @Test
    void testZeroDurationWalk() {
        Walk walk = new Walk(1);
        LocalDateTime time = LocalDateTime.of(
                2026, 10, 24, 10, 0
        );
        walk.startWalk(time);
        walk.endWalk(time);

        assertEquals(0, walk.getDurationMinutes());
    }

    @Test
    void testCannotStartWalkTwice() {
        Walk walk = new Walk(1);
        LocalDateTime start = LocalDateTime.of(
                2026, 10, 24, 10, 0
        );
        walk.startWalk(start);

        assertThrows(IllegalStateException.class, () ->
                walk.startWalk(start.plusMinutes(5))
        );
    }
}