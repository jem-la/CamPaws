package edu.scu.campaws;


import edu.scu.campaws.domain.DogProfile;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class DogProfileTest {

    @Test
    void testCreateDogProfile() {
        DogProfile dog = new DogProfile(
                1, "Luna", "Golden Retriever",
                "Friendly", true, "Daily",
                37.3496f, -121.9390f
        );

        assertEquals(1, dog.getDogId());
        assertEquals("Luna", dog.getName());
        assertEquals(0, dog.getLikeCount());
    }

    @Test
    void testViewDogDetails() {
        DogProfile dog = new DogProfile(
                1, "Luna", "Golden Retriever",
                "Friendly", true, "Daily",
                30f, 30f
        );

        assertTrue(dog.viewDetails().contains("Luna"));
        assertTrue(dog.viewDetails().contains("Golden Retriever"));
    }

    @Test
    void testInputDetailsUpdatesProfile() {
        DogProfile dog = new DogProfile(
                1, "Luna", "Golden Retriever",
                "Friendly", true, "Daily",
                30f, 30f
        );
        dog.inputDetails(
                "Luna", "Golden Retriever",
                "Calm", false, "Weekly"
        );

        assertEquals("Calm", dog.getTemperament());
        assertFalse(dog.isCanBePetted());
        assertEquals("Weekly", dog.getCampusFrequency());
    }

    @Test
    void testAddLike() {
        DogProfile dog = new DogProfile(
                1, "Luna", "Golden Retriever",
                "Friendly", true, "Daily",
                30f, 30f
        );
        dog.addLike();
        dog.addLike();

        assertEquals(2, dog.getLikeCount());
    }

    @Test
    void testInvalidDogId() {
        assertThrows(IllegalArgumentException.class, () ->
                new DogProfile(
                        0, "Luna", "Golden Retriever",
                        "Friendly", true, "Daily",
                        30f, 30f
                )
        );
    }

    @Test
    void testBlankDogName() {
        assertThrows(IllegalArgumentException.class, () ->
                new DogProfile(
                        1, " ", "Golden Retriever",
                        "Friendly", true, "Daily",
                        30f, 30f
                )
        );
    }
}