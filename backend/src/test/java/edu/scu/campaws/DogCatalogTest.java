package edu.scu.campaws;

import edu.scu.campaws.domain.DogProfile;
import edu.scu.campaws.repository.DogRepository;
import edu.scu.campaws.service.DogCatalog;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;
import java.util.NoSuchElementException;

import static org.junit.jupiter.api.Assertions.*;

/** DogCatalog against a real PostgreSQL + PostGIS database. */
@SpringBootTest
@Import(PostgisTestDatabase.class)
@Testcontainers(disabledWithoutDocker = true)
class DogCatalogTest {
    // Santa Clara University, and a point about 70 km away in San Francisco.
    private static final double SCU_LAT = 37.3496, SCU_LON = -121.9390;
    private static final double SF_LAT = 37.7749, SF_LON = -122.4194;

    @Autowired
    private DogCatalog catalog;

    @Autowired
    private DogRepository repository;

    @BeforeEach
    void emptyDatabase() {
        repository.deleteAll();
    }

    /** Creates and stores a dog with one photo, optionally at a location. */
    private DogProfile store(String name, boolean pet, Double lat, Double lon) {
        DogProfile dog = catalog.newDogProfile(name, "Friendly", pet, "Daily");
        dog.setPhotoUrl("https://images.example/" + name + ".jpg");
        dog.setLastSeenLocation(lat, lon);
        return catalog.createDogProfile(dog);
    }

    private DogProfile store(String name, boolean pet) {
        return store(name, pet, null, null);
    }

    @Test
    void createsProfileAndCountsIt() {
        store("Luna", true);
        assertEquals(1, catalog.getDogCount());
    }

    @Test
    void savedFieldsSurviveAReload() {
        DogProfile dog = catalog.newDogProfile(" Mochi ", "Calm", false, "Every day");
        dog.inputAppearance("Tan and white", "Library lawn", "Naps a lot", "ask");
        dog.setPhotoUrls(List.of("https://x.test/a.jpg", "https://x.test/b.jpg"));
        dog.setLastSeenLocation(SCU_LAT, SCU_LON);
        dog.setAddedBy("Alex Lee");
        dog.addLike();
        catalog.createDogProfile(dog);

        DogProfile loaded = catalog.requireById(dog.getDogId());
        assertEquals("Mochi", loaded.getName());
        assertEquals("Calm", loaded.getTemperament());
        assertEquals("Tan and white", loaded.getFurColor());
        assertEquals("Library lawn", loaded.getLocation());
        assertEquals("ask", loaded.getPettingPolicy());
        assertEquals("Alex Lee", loaded.getAddedBy());
        assertEquals(1, loaded.getLikeCount());
        assertEquals(List.of("https://x.test/a.jpg", "https://x.test/b.jpg"), loaded.getPhotoUrls());
        assertEquals("https://x.test/a.jpg", loaded.getPhotoUrl());
        assertEquals(SCU_LAT, loaded.getLastSeenLatitude());
        assertEquals(SCU_LON, loaded.getLastSeenLongitude());
    }

    @Test
    void savingReplacesPhotosInOrder() {
        DogProfile dog = store("Luna", true);
        dog.setPhotoUrls(List.of("https://x.test/2.jpg", "https://x.test/1.jpg"));
        catalog.save(dog);
        assertEquals(List.of("https://x.test/2.jpg", "https://x.test/1.jpg"),
                catalog.requireById(dog.getDogId()).getPhotoUrls());
    }

    @Test
    void searchIgnoresCase() {
        store("Luna", true);
        assertEquals("Luna", catalog.searchByName("lUnA").get(0).getName());
    }

    @Test
    void unknownSearchReturnsEmpty() {
        store("Luna", true);
        assertTrue(catalog.searchByName("Unknown").isEmpty());
    }

    @Test
    void searchTreatsWildcardsLiterally() {
        store("Luna", true);
        store("100% Good Boy", true);
        assertEquals(List.of("100% Good Boy"),
                catalog.searchByName("0%").stream().map(DogProfile::getName).toList());
        assertTrue(catalog.searchByName("_").isEmpty());
    }

    @Test
    void filtersNameAndPettingTogether() {
        store("Luna", true);
        store("Lucky", false);
        store("Max", true);
        List<DogProfile> found = catalog.findDogs("lu", true);
        assertEquals(1, found.size());
        assertEquals("Luna", found.get(0).getName());
        assertEquals(2, catalog.filterByAttributes(true).size());
        assertEquals(1, catalog.filterByAttributes(false).size());
        // No filters at all: what GET /api/dogs does on every page load.
        assertEquals(List.of("Luna", "Lucky", "Max"),
                catalog.findDogs(null, null).stream().map(DogProfile::getName).toList());
    }

    @Test
    void findsDogsWithinOneKilometerClosestFirst() {
        store("Far", true, SF_LAT, SF_LON);
        store("Close", true, SCU_LAT + 0.004, SCU_LON);   // ~450 m north
        store("Closest", true, SCU_LAT + 0.001, SCU_LON); // ~110 m north
        store("Unknown spot", true);

        List<String> nearby = catalog.findNearbyDogs(SCU_LAT, SCU_LON)
                .stream().map(DogProfile::getName).toList();
        assertEquals(List.of("Closest", "Close"), nearby);

        // San Francisco is ~70 km away: outside even the 50 km maximum radius.
        assertEquals(2, catalog.findNearbyDogs(SCU_LAT, SCU_LON, 50_000).size());
        assertEquals(List.of("Far"),
                catalog.findNearbyDogs(SF_LAT, SF_LON).stream().map(DogProfile::getName).toList());
    }

    @Test
    void rejectsBadNearbyArguments() {
        assertThrows(IllegalArgumentException.class, () -> catalog.findNearbyDogs(91, 0));
        assertThrows(IllegalArgumentException.class, () -> catalog.findNearbyDogs(0, 0, 0));
        assertThrows(IllegalArgumentException.class, () -> catalog.findNearbyDogs(0, 0, 50_001));
    }

    @Test
    void leaderboardSortsByLikes() {
        DogProfile luna = store("Luna", true);
        DogProfile max = store("Max", true);
        catalog.likeDog(max.getDogId());
        catalog.likeDog(max.getDogId());
        catalog.likeDog(luna.getDogId());

        List<DogProfile> board = catalog.viewLeaderboard();
        assertEquals("Max", board.get(0).getName());
        assertEquals(2, board.get(0).getLikeCount());
        assertEquals(1, board.get(1).getLikeCount());
    }

    @Test
    void likesArePersisted() {
        DogProfile dog = store("Luna", true);
        assertEquals(1, catalog.likeDog(dog.getDogId()).getLikeCount());
        assertEquals(1, catalog.requireById(dog.getDogId()).getLikeCount());
    }

    @Test
    void autoAssignsIncreasingIds() {
        DogProfile a = catalog.createDogProfile("Luna", "Friendly", true, "Daily");
        DogProfile b = catalog.createDogProfile("Max", "Calm", false, "Weekly");
        assertTrue(a.getDogId() > 0);
        assertEquals(a.getDogId() + 1, b.getDogId());
    }

    @Test
    void rejectsDuplicateId() {
        DogProfile luna = store("Luna", true);
        DogProfile copy = new DogProfile(luna.getDogId(), "Max", "Calm", true, "Daily");
        copy.setPhotoUrl("https://x.test/max.jpg");
        assertThrows(IllegalArgumentException.class, () -> catalog.createDogProfile(copy));
    }

    @Test
    void unknownIdThrows() {
        assertThrows(NoSuchElementException.class, () -> catalog.requireById(999_999));
        assertThrows(NoSuchElementException.class, () -> catalog.likeDog(999_999));
    }

    @Test
    void findsDuplicatesByNameAndCompatibleFurColor() {
        DogProfile mochi = catalog.newDogProfile("Mochi", null, false, null);
        mochi.inputAppearance("Tan and white", null, null, null);
        mochi.setPhotoUrl("https://x.test/mochi.jpg");
        catalog.createDogProfile(mochi);
        store("Luna", false);

        assertEquals(List.of(mochi.getDogId()), ids(catalog.findPossibleDuplicates(" mochi ", null, null)));
        assertEquals(List.of(mochi.getDogId()), ids(catalog.findPossibleDuplicates("Mochi", "tan and white", null)));
        assertTrue(catalog.findPossibleDuplicates("Mochi", "Black", null).isEmpty());
        assertTrue(catalog.findPossibleDuplicates("Mochi", null, mochi.getDogId()).isEmpty());
        assertTrue(catalog.findPossibleDuplicates(" ", null, null).isEmpty());
    }

    private static List<Integer> ids(List<DogProfile> dogs) {
        return dogs.stream().map(DogProfile::getDogId).toList();
    }
}
