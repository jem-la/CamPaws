package edu.scu.campaws;


import edu.scu.campaws.domain.DogProfile;

import java.lang.reflect.Field;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class DogProfileTest {
    private DogProfile dog() {
        return new DogProfile(1, "Luna", "Golden Retriever",
                "Friendly", true, "Daily", 37.3496f, -121.9390f);
    }

    @Test
    void createProfile() {
        DogProfile dog = dog();
        assertEquals(1, dog.getDogId());
        assertEquals("Luna", dog.getName());
        assertEquals(0, dog.getLikeCount());
    }

    @Test
    void viewDetails() {
        assertTrue(dog().viewDetails().contains("Luna"));
        assertTrue(dog().viewDetails().contains("Golden Retriever"));
    }

    @Test
    void updatesFields() {
        DogProfile dog = dog();
        dog.inputDetails("Luna", "Golden Retriever", "Calm", false, "Weekly");
        assertEquals("Calm", dog.getTemperament());
        assertFalse(dog.isCanBePetted());
        assertEquals("Weekly", dog.getCampusFrequency());
    }

    @Test
    void addLike() {
        DogProfile dog = dog();
        dog.addLike();
        dog.addLike();
        assertEquals(2, dog.getLikeCount());
    }

    @Test
    void rejectsZeroDogId() {
        assertThrows(IllegalArgumentException.class,
                () -> new DogProfile(0, "Luna", "Breed", "Friendly",
                        true, "Daily", 0, 0));
    }

    @Test
    void rejectsNullName() {
        assertThrows(IllegalArgumentException.class,
                () -> new DogProfile(1, null, "Breed", "Friendly",
                        true, "Daily", 0, 0));
    }

    @Test
    void rejectsBlankName() {
        assertThrows(IllegalArgumentException.class,
                () -> new DogProfile(1, "  ", "Breed", "Friendly",
                        true, "Daily", 0, 0));
    }

    @Test
    void testCoordinateRangeValidation() {
        assertThrows(IllegalArgumentException.class,
                () -> DogProfile.validateCoordinates(90.1, 0));

        assertThrows(IllegalArgumentException.class,
                () -> DogProfile.validateCoordinates(0, 180.1));
    }

    @Test
    void testCoordinateBoundaries() {
        assertDoesNotThrow(
                () -> DogProfile.validateCoordinates(-90, -180));

        assertDoesNotThrow(
                () -> DogProfile.validateCoordinates(90, 180));
    }

    @Test
    void testNameLengthLimit() {
        String validName = "A".repeat(80);

        assertDoesNotThrow(() -> new DogProfile(
                1, validName, "Breed", "Friendly",
                true, "Daily", 0, 0));

        assertThrows(IllegalArgumentException.class, () ->
                new DogProfile(
                        1, "A".repeat(81), "Breed", "Friendly",
                        true, "Daily", 0, 0));
    }

    @Test
    void testNameTrimming() {
        DogProfile dog = new DogProfile(
                1, " Luna ", " Golden Retriever ",
                " Friendly ", true, " Daily ", 0, 0);

        assertEquals("Luna", dog.getName());
        assertEquals("Golden Retriever", dog.getBreed());
        assertEquals("Friendly", dog.getTemperament());
        assertEquals("Daily", dog.getCampusFrequency());
    }

    @Test
    void testPhotoUrlValidation() {
        DogProfile dog = new DogProfile(
                1, "Luna", "Breed", "Friendly",
                true, "Daily", 0, 0);

        dog.setPhotoUrl(" HTTPS://example.com/dog.jpg ");

        assertEquals("HTTPS://example.com/dog.jpg",
                dog.getPhotoUrl());

        assertThrows(IllegalArgumentException.class,
                () -> dog.setPhotoUrl("ftp://example.com/dog.jpg"));

        assertThrows(IllegalArgumentException.class,
                () -> dog.setPhotoUrl(null));

        assertThrows(IllegalArgumentException.class,
                () -> dog.setPhotoUrl(" "));
    }

    @Test
    void testLikeCountOverflow() throws Exception {
        DogProfile dog = new DogProfile(
                1, "Luna", "Breed", "Friendly",
                true, "Daily", 0, 0);

        Field field = DogProfile.class.getDeclaredField("likeCount");
        field.setAccessible(true);
        field.setInt(dog, Integer.MAX_VALUE);

        assertThrows(IllegalStateException.class, dog::addLike);
    }
}