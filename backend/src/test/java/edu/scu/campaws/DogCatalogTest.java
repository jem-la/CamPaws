package edu.scu.campaws;

import edu.scu.campaws.service.DogCatalog;
import edu.scu.campaws.domain.DogProfile;

import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class DogCatalogTest {
    private DogProfile makeDog(int id, String name, String breed,
                               boolean pet, float lat, float lon) {
        return new DogProfile(id, name, breed, "Friendly",
                pet, "Daily", lat, lon);
    }

    @Test
    void createsProfileAndCountsIt() {
        DogCatalog c = new DogCatalog();
        c.createDogProfile(makeDog(1, "Luna", "Golden Retriever",
                true, 37.3496f, -121.939f));
        assertEquals(1, c.getDogCount());
    }

    @Test
    void searchIgnoresCase() {
        DogCatalog c = new DogCatalog();
        c.createDogProfile(makeDog(1, "Luna", "Retriever", true, 0, 0));
        assertEquals("Luna", c.searchByName("lUnA").get(0).getName());
    }

    @Test
    void unknownSearchReturnsEmpty() {
        DogCatalog c = new DogCatalog();
        c.createDogProfile(makeDog(1, "Luna", "Retriever", true, 0, 0));
        assertTrue(c.searchByName("Unknown").isEmpty());
    }

    @Test
    void filtersBreedAndPettingTogether() {
        DogCatalog c = new DogCatalog();
        c.createDogProfile(makeDog(1, "Luna", "Retriever", true, 0, 0));
        c.createDogProfile(makeDog(2, "Max", "Beagle", false, 0, 0));
        assertEquals("Luna", c.findDogs("lu", "retriever", true)
                .get(0).getName());
    }

    @Test
    void findsDogWithinOneKilometer() {
        DogCatalog c = new DogCatalog();
        c.createDogProfile(makeDog(1, "Nearby", "Beagle",
                true, 37.3496f, -121.939f));
        c.createDogProfile(makeDog(2, "Far", "Beagle",
                true, 38.0f, -122.0f));
        assertEquals(1, c.findNearbyDogs(37.3496f, -121.939f).size());
    }

    @Test
    void leaderboardSortsByLikes() {
        DogCatalog c = new DogCatalog();
        DogProfile a = makeDog(1, "Luna", "Retriever", true, 0, 0);
        DogProfile b = makeDog(2, "Max", "Beagle", true, 0, 0);
        b.addLike();
        b.addLike();
        c.createDogProfile(a);
        c.createDogProfile(b);
        assertEquals("Max", c.viewLeaderboard().get(0).getName());
    }

    @Test
    void storesLargeCollection() {
        DogCatalog c = new DogCatalog();
        for (int i = 1; i <= 1000; i++) {
            c.createDogProfile(makeDog(i, "Dog" + i, "Mixed",
                    true, 0, 0));
        }
        assertEquals(1000, c.getDogCount());
    }

    @Test
    void rejectsDuplicateId() {
        DogCatalog c = new DogCatalog();
        c.createDogProfile(makeDog(1, "Luna", "Retriever", true, 0, 0));
        assertThrows(IllegalArgumentException.class,
                () -> c.createDogProfile(
                        makeDog(1, "Max", "Beagle", true, 0, 0)));
    }

    @Test
    void unknownIdThrows() {
        assertThrows(java.util.NoSuchElementException.class,
                () -> new DogCatalog().requireById(999));
    }

    @Test
    void autoAssignsIncreasingIds() {
        DogCatalog c = new DogCatalog();
        DogProfile a = c.createDogProfile(
                "Luna", "Retriever", "Friendly", true, "Daily");
        DogProfile b = c.createDogProfile(
                "Max", "Beagle", "Calm", false, "Weekly");
        assertEquals(1, a.getDogId());
        assertEquals(2, b.getDogId());
    }
}