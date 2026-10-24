package edu.scu.campaws;

 class DogProfile {
    private int dogId;
    private String name;
    private String breed;
    private String temperament;
    private boolean canBePetted;
    private String campusFrequency;
    private float lastSeenLatitude;
    private float lastSeenLongitude;
    private int likeCount;

    public DogProfile(
            int dogId, String name, String breed,
            String temperament, boolean canBePetted,
            String campusFrequency,
            float lastSeenLatitude, float lastSeenLongitude) {
        // TODO: Initialize and validate the dog profile.
    }

    public void inputDetails(
            String name, String breed, String temperament,
            boolean canBePetted, String campusFrequency) {
        // TODO: Implement updating dog details.
    }

    public String viewDetails() {
        // TODO: Return the dog's details.
        return "";
    }

    public void addLike() {
        // TODO: Increase the like count.
    }

    public int getDogId() {
        return dogId;
    }

    public String getName() {
        return name;
    }

    public String getBreed() {
        return breed;
    }

    public String getTemperament() {
        return temperament;
    }

    public boolean isCanBePetted() {
        return canBePetted;
    }

    public String getCampusFrequency() {
        return campusFrequency;
    }

    public float getLastSeenLatitude() {
        return lastSeenLatitude;
    }

    public float getLastSeenLongitude() {
        return lastSeenLongitude;
    }

    public int getLikeCount() {
        return likeCount;
    }
}