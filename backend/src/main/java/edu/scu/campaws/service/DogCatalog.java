package edu.scu.campaws.service;

import edu.scu.campaws.domain.DogProfile;
import edu.scu.campaws.repository.DogRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.NoSuchElementException;
import java.util.Optional;

/** Dog profiles, stored in PostgreSQL. */
@Service
@Transactional(readOnly = true)
public class DogCatalog {
    /** Default radius for {@link #findNearbyDogs(double, double)}. */
    public static final double DEFAULT_NEARBY_METERS = 1000;
    public static final double MAX_NEARBY_METERS = 50_000;

    private final DogRepository dogs;

    public DogCatalog(DogRepository dogs) {
        this.dogs = dogs;
    }

    /**
     * Builds an unsaved profile with a fresh ID. Fill in the rest, then pass it to
     * {@link #createDogProfile(DogProfile)}. Nothing is stored if you never do.
     */
    @Transactional
    public DogProfile newDogProfile(
            String name,
            String temperament,
            boolean canBePetted,
            String campusFrequency) {

        return new DogProfile(
                Math.toIntExact(dogs.nextDogId()),
                name,
                temperament,
                canBePetted,
                campusFrequency
        );
    }

    /** Stores a new profile created with {@link #newDogProfile}. */
    @Transactional
    public DogProfile createDogProfile(DogProfile dog) {
        if (dog == null) {
            throw new IllegalArgumentException(
                    "Dog profile cannot be null."
            );
        }

        if (dogs.existsById(dog.getDogId())) {
            throw new IllegalArgumentException(
                    "A dog with this ID already exists."
            );
        }

        return dogs.save(dog);
    }

    /** Shortcut: create and store a profile with just the basic details. */
    @Transactional
    public DogProfile createDogProfile(
            String name,
            String temperament,
            boolean canBePetted,
            String campusFrequency) {

        return createDogProfile(
                newDogProfile(name, temperament, canBePetted, campusFrequency)
        );
    }

    /** Saves changes made to an existing profile. */
    @Transactional
    public DogProfile save(DogProfile dog) {
        if (dog == null || !dogs.existsById(dog.getDogId())) {
            throw new NoSuchElementException(
                    "Dog profile not found."
            );
        }

        return dogs.save(dog);
    }

    public Optional<DogProfile> findById(int dogId) {
        return dogs.findById(dogId);
    }

    public DogProfile requireById(int dogId) {
        if (dogId <= 0) {
            throw new NoSuchElementException(
                    "Dog profile not found."
            );
        }

        return findById(dogId).orElseThrow(
                () -> new NoSuchElementException(
                        "Dog profile not found."
                )
        );
    }

    public List<DogProfile> getAllDogProfiles() {
        return dogs.findAllByOrderByDogIdAsc();
    }

    public List<DogProfile> findDogs(String query, Boolean canBePetted) {
        String q = normalizeFilter(query);
        String pattern = q == null ? "" : escapeLike(q);
        return canBePetted == null
                ? dogs.searchByName(pattern)
                : dogs.searchByNameAndPetting(pattern, canBePetted);
    }

    public List<DogProfile> searchByName(String name) {
        return findDogs(name, null);
    }

    public List<DogProfile> filterByAttributes(Boolean canBePetted) {
        return findDogs(null, canBePetted);
    }

    /** Dogs last seen within 1 km, closest first. */
    public List<DogProfile> findNearbyDogs(double latitude, double longitude) {
        return findNearbyDogs(latitude, longitude, DEFAULT_NEARBY_METERS);
    }

    /** Dogs last seen within {@code radiusMeters}, closest first. */
    public List<DogProfile> findNearbyDogs(
            double latitude, double longitude, double radiusMeters) {

        DogProfile.validateCoordinates(latitude, longitude);

        if (!Double.isFinite(radiusMeters)
                || radiusMeters <= 0
                || radiusMeters > MAX_NEARBY_METERS) {
            throw new IllegalArgumentException(
                    "Radius must be greater than 0 and at most "
                            + (int) MAX_NEARBY_METERS + " meters."
            );
        }

        return dogs.findWithinMeters(latitude, longitude, radiusMeters);
    }

    public List<DogProfile> viewLeaderboard() {
        return dogs.findAllByOrderByLikeCountDescDogIdAsc();
    }

    /**
     * Profiles that are probably the same dog: the name matches (ignoring case and spacing)
     * and the fur colors don't contradict each other (either one blank, or equal).
     */
    public List<DogProfile> findPossibleDuplicates(
            String name, String furColor, Integer ignoreDogId) {

        String wantedName = normalizeFilter(name);
        if (wantedName == null) {
            return List.of();
        }
        String wantedFur = normalizeFilter(furColor);

        List<DogProfile> results = new ArrayList<>();
        for (DogProfile dog : dogs.findByNameIgnoreCase(wantedName)) {
            if (ignoreDogId != null && dog.getDogId() == ignoreDogId) {
                continue;
            }
            String dogFur = normalizeFilter(dog.getFurColor());
            if (wantedFur == null || dogFur == null || dogFur.equals(wantedFur)) {
                results.add(dog);
            }
        }
        return results;
    }

    @Transactional
    public DogProfile likeDog(int dogId) {
        requireById(dogId);

        if (dogs.incrementLikes(dogId) == 0) {
            throw new IllegalStateException(
                    "Like count has reached its maximum value."
            );
        }

        return requireById(dogId);
    }

    public long getDogCount() {
        return dogs.count();
    }

    private static String normalizeFilter(String value) {
        return value == null || value.isBlank()
                ? null
                : value.trim().toLowerCase(Locale.ROOT);
    }

    /** Escapes LIKE wildcards so a search for "50%" matches literally. */
    private static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
