package edu.scu.campaws.service;

import edu.scu.campaws.domain.DogProfile;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;


@Service
public class DogCatalog {
    private final Map<Integer, DogProfile> dogProfiles =
            new LinkedHashMap<>();

    private int nextDogId = 1;

    public synchronized void createDogProfile(DogProfile dog) {
        if (dog == null) {
            throw new IllegalArgumentException(
                    "Dog profile cannot be null."
            );
        }

        if (dogProfiles.containsKey(dog.getDogId())) {
            throw new IllegalArgumentException(
                    "A dog with this ID already exists."
            );
        }

        dogProfiles.put(dog.getDogId(), dog);
        nextDogId = Math.max(nextDogId, dog.getDogId() + 1);
    }

    public synchronized DogProfile createDogProfile(
            String name,
            String breed,
            String temperament,
            boolean canBePetted,
            String campusFrequency) {

        DogProfile profile = new DogProfile(
                nextDogId,
                name,
                breed,
                temperament,
                canBePetted,
                campusFrequency,
                0.0f,
                0.0f
        );

        createDogProfile(profile);
        return profile;
    }

    public synchronized Optional<DogProfile> findById(int dogId) {
        return Optional.ofNullable(dogProfiles.get(dogId));
    }

    public synchronized DogProfile requireById(int dogId) {
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

    public synchronized List<DogProfile> getAllDogProfiles() {
        return new ArrayList<>(dogProfiles.values());
    }

    public synchronized List<DogProfile> findDogs(
            String query,
            String breed,
            Boolean canBePetted) {

        String q = normalizeFilter(query);
        String requestedBreed = normalizeFilter(breed);
        List<DogProfile> results = new ArrayList<>();

        for (DogProfile dog : dogProfiles.values()) {
            boolean nameMatches =
                    q == null
                            || dog.getName().toLowerCase(Locale.ROOT)
                            .contains(q);

            boolean breedMatches =
                    requestedBreed == null
                            || (dog.getBreed() != null
                            && dog.getBreed().toLowerCase(Locale.ROOT)
                            .equals(requestedBreed));

            boolean pettingMatches =
                    canBePetted == null
                            || dog.isCanBePetted() == canBePetted;

            if (nameMatches && breedMatches && pettingMatches) {
                results.add(dog);
            }
        }

        return results;
    }

    public synchronized List<DogProfile> searchByName(String name) {
        return findDogs(name, null, null);
    }

    public synchronized List<DogProfile> filterByAttributes(
            String breed, Boolean canBePetted) {
        return findDogs(null, breed, canBePetted);
    }


    public synchronized List<DogProfile> findNearbyDogs(
            float latitude, float longitude) {

        DogProfile.validateCoordinates(latitude, longitude);
        List<DogProfile> results = new ArrayList<>();

        for (DogProfile dog : dogProfiles.values()) {
            if (dog.getLastSeenLatitude() == 0.0f
                    && dog.getLastSeenLongitude() == 0.0f) {
                continue;
            }

            if (distanceKm(
                    latitude,
                    longitude,
                    dog.getLastSeenLatitude(),
                    dog.getLastSeenLongitude()) <= 1.0) {
                results.add(dog);
            }
        }

        return results;
    }

    public synchronized List<DogProfile> viewLeaderboard() {
        List<DogProfile> result =
                new ArrayList<>(dogProfiles.values());

        result.sort(
                Comparator.comparingInt(DogProfile::getLikeCount)
                        .reversed()
                        .thenComparingInt(DogProfile::getDogId)
        );

        return result;
    }

    public synchronized DogProfile likeDog(int dogId) {
        DogProfile dog = requireById(dogId);
        dog.addLike();
        return dog;
    }

    public synchronized int getDogCount() {
        return dogProfiles.size();
    }

    private String normalizeFilter(String value) {
        return value == null || value.isBlank()
                ? null
                : value.trim().toLowerCase(Locale.ROOT);
    }

    private double distanceKm(
            double lat1,
            double lon1,
            double lat2,
            double lon2) {

        double radius = 6371.0088;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a =
                Math.pow(Math.sin(dLat / 2), 2)
                        + Math.cos(Math.toRadians(lat1))
                        * Math.cos(Math.toRadians(lat2))
                        * Math.pow(Math.sin(dLon / 2), 2);

        double bounded = Math.max(0.0, Math.min(1.0, a));

        return radius * 2 * Math.atan2(
                Math.sqrt(bounded),
                Math.sqrt(1 - bounded)
        );
    }
}