package edu.scu.campaws;

import java.util.ArrayList;
import java.util.List;

public class DogCatalog {

    public void createDogProfile(DogProfile dog) {
        // TODO: Add the profile to the catalog.
    }

    public List<DogProfile> searchByName(String name) {
        // TODO: Search dog profiles by name.
        return new ArrayList<>();
    }

    public List<DogProfile> filterByAttributes(
            String breed, Boolean canBePetted) {
        // TODO: Filter profiles by breed and petting permission.
        return new ArrayList<>();
    }

    public List<DogProfile> findNearbyDogs(float lat, float lon) {
        // TODO: Find dogs within the chosen radius.
        return new ArrayList<>();
    }

    public List<DogProfile> viewLeaderboard() {
        // TODO: Sort profiles by like count.
        return new ArrayList<>();
    }

    public int getDogCount() {
        // TODO: Return the number of profiles in the catalog.
        return 0;
    }
}