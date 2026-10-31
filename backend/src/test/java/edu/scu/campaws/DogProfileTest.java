package edu.scu.campaws;


import edu.scu.campaws.domain.DogProfile;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class DogProfileTest {
    private DogProfile dog() {
        return new DogProfile(1, "Luna", "Golden Retriever",
                "Friendly", true, "Daily", 37.3496f, -121.9390f);
    }

    @Test
    void createProfileStoresExpectedFields() {
        DogProfile dog = dog();
        assertEquals(1, dog.getDogId());
        assertEquals("Luna", dog.getName());
        assertEquals(0, dog.getLikeCount());
    }

    @Test
    void viewDetailsIncludesDogNameAndBreed() {
        assertTrue(dog().viewDetails().contains("Luna"));
        assertTrue(dog().viewDetails().contains("Golden Retriever"));
    }

    @Test
    void inputDetailsUpdatesFields() {
        DogProfile dog = dog();
        dog.inputDetails("Luna", "Golden Retriever", "Calm", false, "Weekly");
        assertEquals("Calm", dog.getTemperament());
        assertFalse(dog.isCanBePetted());
        assertEquals("Weekly", dog.getCampusFrequency());
    }

    @Test
    void addLikeIncrementsCount() {
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
    void acceptsBoundaryCoordinates() {
        assertDoesNotThrow(() -> DogProfile.validateCoordinates(90, 180));
        assertDoesNotThrow(() -> DogProfile.validateCoordinates(-90, -180));
    }

    @Test
    void rejectsLatitudeOutsideRange() {
        assertThrows(IllegalArgumentException.class,
                () -> DogProfile.validateCoordinates(90.0001, 0));
    }

    @Test
    void rejectsNonFiniteLongitude() {
        assertThrows(IllegalArgumentException.class,
                () -> DogProfile.validateCoordinates(0, Double.NaN));
    }

    @Test
    void trimsNameAndOptionalFields() {
        DogProfile dog = new DogProfile(1, " Luna ", " Retriever ",
                " Friendly ", true, " Daily ", 0, 0);
        assertEquals("Luna", dog.getName());
        assertEquals("Retriever", dog.getBreed());
    }
}