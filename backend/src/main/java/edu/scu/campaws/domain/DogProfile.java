package edu.scu.campaws.domain;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

public class DogProfile {
    private final int dogId;
    private String name;
    private String breed;
    private String temperament;
    private boolean canBePetted;
    private String campusFrequency;
    private final float lastSeenLatitude;
    private final float lastSeenLongitude;
    private int likeCount;
    private String photoUrl;
    private List<String> photoUrls = List.of();
    private String furColor;
    private String location;
    private String about;
    private String pettingPolicy;
    private String addedBy;

    public static final int MAX_PHOTOS = 5;
    private static final Set<String> PETTING_POLICIES = Set.of("ask", "yes", "no");

    public DogProfile(
            int dogId,
            String name,
            String breed,
            String temperament,
            boolean canBePetted,
            String campusFrequency,
            float lastSeenLatitude,
            float lastSeenLongitude) {

        if (dogId <= 0) {
            throw new IllegalArgumentException(
                    "Dog ID must be positive."
            );
        }

        validateName(name);
        validateCoordinates(lastSeenLatitude, lastSeenLongitude);

        this.dogId = dogId;
        this.name = name.trim();
        this.breed = normalizeOptional(breed);
        this.temperament = normalizeOptional(temperament);
        this.canBePetted = canBePetted;
        this.campusFrequency = normalizeOptional(campusFrequency);
        this.lastSeenLatitude = lastSeenLatitude;
        this.lastSeenLongitude = lastSeenLongitude;
        this.likeCount = 0;
        this.pettingPolicy = canBePetted ? "yes" : "ask";
    }

    /**
     * Sets the descriptive fields shown on the profile page. All are optional.
     * {@code pettingPolicy} is one of "ask", "yes" or "no"; null keeps it derived from canBePetted.
     */
    public void inputAppearance(
            String furColor,
            String location,
            String about,
            String pettingPolicy) {

        this.furColor = normalizeOptional(furColor);
        this.location = normalizeOptional(location);
        this.about = normalizeOptional(about);

        if (pettingPolicy != null && !pettingPolicy.isBlank()) {
            String policy = pettingPolicy.trim().toLowerCase(Locale.ROOT);
            if (!PETTING_POLICIES.contains(policy)) {
                throw new IllegalArgumentException(
                        "Petting policy must be one of ask, yes or no."
                );
            }
            this.pettingPolicy = policy;
            this.canBePetted = policy.equals("yes");
        } else {
            this.pettingPolicy = canBePetted ? "yes" : "ask";
        }
    }

    public void inputDetails(
            String name,
            String breed,
            String temperament,
            boolean canBePetted,
            String campusFrequency) {

        validateName(name);

        this.name = name.trim();
        this.breed = normalizeOptional(breed);
        this.temperament = normalizeOptional(temperament);
        this.canBePetted = canBePetted;
        this.campusFrequency = normalizeOptional(campusFrequency);
    }

    public String viewDetails() {
        return "Name: " + name
                + ", Breed: " + displayOptional(breed)
                + ", Temperament: " + displayOptional(temperament)
                + ", Can be petted: " + canBePetted
                + ", Campus frequency: "
                + displayOptional(campusFrequency);
    }

    public void addLike() {
        if (likeCount == Integer.MAX_VALUE) {
            throw new IllegalStateException(
                    "Like count has reached its maximum value."
            );
        }

        likeCount++;
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

    public String getPhotoUrl() {
        return photoUrl;
    }

    public void setPhotoUrl(String photoUrl) {
        setPhotoUrls(photoUrl == null ? null : List.of(photoUrl));
    }

    /** Replaces the dog's photos. The first URL becomes the profile photo. */
    public void setPhotoUrls(List<String> photoUrls) {
        if (photoUrls == null || photoUrls.isEmpty()) {
            throw new IllegalArgumentException(
                    "At least one dog photo URL is required."
            );
        }

        if (photoUrls.size() > MAX_PHOTOS) {
            throw new IllegalArgumentException(
                    "A dog profile can have at most " + MAX_PHOTOS + " photos."
            );
        }

        List<String> normalized = new ArrayList<>();
        for (String url : photoUrls) {
            normalized.add(normalizePhotoUrl(url));
        }

        this.photoUrls = List.copyOf(normalized);
        this.photoUrl = normalized.get(0);
    }

    public List<String> getPhotoUrls() {
        return photoUrls;
    }

    public String getFurColor() {
        return furColor;
    }

    public String getLocation() {
        return location;
    }

    public String getAbout() {
        return about;
    }

    public String getPettingPolicy() {
        return pettingPolicy;
    }

    public String getAddedBy() {
        return addedBy;
    }

    public void setAddedBy(String addedBy) {
        this.addedBy = normalizeOptional(addedBy);
    }

    private static String normalizePhotoUrl(String photoUrl) {
        if (photoUrl == null || photoUrl.isBlank()) {
            throw new IllegalArgumentException(
                    "At least one dog photo URL is required."
            );
        }

        String normalized = photoUrl.trim();

        if (!(normalized.regionMatches(
                true, 0, "https://", 0, 8)
                || normalized.regionMatches(
                true, 0, "http://", 0, 7))) {
            throw new IllegalArgumentException(
                    "Photo URL must start with http:// or https://."
            );
        }

        return normalized;
    }

    private static void validateName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Dog name is required.");
        }

        if (name.trim().length() > 80) {
            throw new IllegalArgumentException(
                    "Dog name must be at most 80 characters."
            );
        }
    }

    public static void validateCoordinates(
            double latitude, double longitude) {
        if (!Double.isFinite(latitude)
                || latitude < -90 || latitude > 90) {
            throw new IllegalArgumentException(
                    "Latitude must be between -90 and 90."
            );
        }

        if (!Double.isFinite(longitude)
                || longitude < -180 || longitude > 180) {
            throw new IllegalArgumentException(
                    "Longitude must be between -180 and 180."
            );
        }
    }

    private static String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String trimmed = value.trim();

        if (trimmed.length() > 120) {
            throw new IllegalArgumentException(
                    "Optional dog profile fields must be at most 120 characters."
            );
        }

        return trimmed;
    }

    private static String displayOptional(String value) {
        return value == null ? "Not provided" : value;
    }
}