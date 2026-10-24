package edu.scu.campaws;

import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class DogCatalogTest {

    private DogProfile makeDog(
            int id,
            String name,
            String breed,
            boolean canBePetted,
            float lat,
            float lon) {

        return new DogProfile(
                id, name, breed, "Friendly",
                canBePetted, "Daily", lat, lon
        );
    }

    @Test
    void testCreateDogProfile() {
        DogCatalog catalog = new DogCatalog();
        catalog.createDogProfile(
                makeDog(1, "Luna", "Golden Retriever",
                        true, 37.3496f, -121.9390f)
        );

        assertEquals(1, catalog.getDogCount());
    }

    @Test
    void testSearchByNameIgnoresCase() {
        DogCatalog catalog = new DogCatalog();
        catalog.createDogProfile(
                makeDog(1, "Luna", "Golden Retriever",
                        true, 37.3496f, -121.9390f)
        );
        List<DogProfile> results = catalog.searchByName("lUnA");

        assertEquals(1, results.size());
        assertEquals("Luna", results.get(0).getName());
    }

    @Test
    void testSearchByNameReturnsEmptyWhenNotFound() {
        DogCatalog catalog = new DogCatalog();
        catalog.createDogProfile(
                makeDog(1, "Luna", "Golden Retriever",
                        true, 37.3496f, -121.9390f)
        );

        assertEquals(1, catalog.searchByName("Luna").size());
        assertTrue(catalog.searchByName("Unknown").isEmpty());
    }

    @Test
    void testFilterByBreedAndPettingPermission() {
        DogCatalog catalog = new DogCatalog();
        catalog.createDogProfile(
                makeDog(1, "Luna", "Golden Retriever",
                        true, 37.3496f, -121.9390f)
        );
        catalog.createDogProfile(
                makeDog(2, "Max", "Beagle",
                        false, 37.3496f, -121.9390f)
        );
        List<DogProfile> results =
                catalog.filterByAttributes("Golden Retriever", true);

        assertEquals(1, results.size());
        assertEquals("Luna", results.get(0).getName());
    }

    @Test
    void testFindNearbyDogs() {
        DogCatalog catalog = new DogCatalog();
        catalog.createDogProfile(
                makeDog(1, "Nearby Dog", "Beagle",
                        true, 37.3496f, -121.9390f)
        );
        catalog.createDogProfile(
                makeDog(2, "Far Dog", "Beagle",
                        true, 38.0000f, -122.0000f)
        );

        List<DogProfile> results =
                catalog.findNearbyDogs(37.3496f, -121.9390f);

        assertEquals(1, results.size());
        assertEquals("Nearby Dog", results.get(0).getName());
    }

    @Test
    void testLeaderboardSortsByLikes() {
        DogCatalog catalog = new DogCatalog();
        DogProfile luna = makeDog(
                1, "Luna", "Golden Retriever",
                true, 37.3496f, -121.9390f
        );
        DogProfile max = makeDog(
                2, "Max", "Beagle",
                true, 37.3496f, -121.9390f
        );

        luna.addLike();
        max.addLike();
        max.addLike();
        max.addLike();

        catalog.createDogProfile(luna);
        catalog.createDogProfile(max);
        List<DogProfile> results = catalog.viewLeaderboard();

        assertEquals(2, results.size());
        assertEquals("Max", results.get(0).getName());
        assertEquals("Luna", results.get(1).getName());
    }
}