package edu.scu.campaws.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * A campus dog. Stored in the {@code dogs} table (see db/migration). The last-seen
 * latitude/longitude also feed a PostGIS {@code last_seen_point} column used for
 * nearby-dog queries; that column is computed by the database, not mapped here.
 */
@Entity
@Table(name = "dogs")
public class DogProfile {
    public static final int MAX_PHOTOS = 5;
    private static final Set<String> PETTING_POLICIES = Set.of("ask", "yes", "no");

    @Id
    @Column(name = "dog_id")
    private int dogId;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(length = 120)
    private String temperament;

    @Column(name = "can_be_petted", nullable = false)
    private boolean canBePetted;

    @Column(name = "campus_frequency", length = 120)
    private String campusFrequency;

    @Column(name = "last_seen_latitude")
    private Double lastSeenLatitude;

    @Column(name = "last_seen_longitude")
    private Double lastSeenLongitude;

    @Column(name = "like_count", nullable = false)
    private int likeCount;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "dog_photos", joinColumns = @JoinColumn(name = "dog_id"))
    @OrderColumn(name = "sort_order")
    @Column(name = "url", nullable = false, length = 2048)
    private List<String> photoUrls = new ArrayList<>();

    @Column(name = "fur_color", length = 120)
    private String furColor;

    /** Human-readable spot such as "Library lawn". */
    @Column(length = 120)
    private String location;

    @Column(length = 120)
    private String about;

    @Column(name = "petting_policy", nullable = false, length = 3)
    private String pettingPolicy;

    @Column(name = "added_by", length = 120)
    private String addedBy;

    /** Required by JPA. */
    protected DogProfile() {
    }

    /** A profile without a known location. */
    public DogProfile(
            int dogId,
            String name,
            String temperament,
            boolean canBePetted,
            String campusFrequency) {

        if (dogId <= 0) {
            throw new IllegalArgumentException(
                    "Dog ID must be positive."
            );
        }

        validateName(name);

        this.dogId = dogId;
        this.name = name.trim();
        this.temperament = normalizeOptional(temperament);
        this.canBePetted = canBePetted;
        this.campusFrequency = normalizeOptional(campusFrequency);
        this.likeCount = 0;
        this.pettingPolicy = canBePetted ? "yes" : "ask";
    }

    /**
     * A profile last seen at the given coordinates. For backwards compatibility,
     * (0, 0) means "location unknown".
     */
    public DogProfile(
            int dogId,
            String name,
            String temperament,
            boolean canBePetted,
            String campusFrequency,
            double lastSeenLatitude,
            double lastSeenLongitude) {

        this(dogId, name, temperament, canBePetted, campusFrequency);
        validateCoordinates(lastSeenLatitude, lastSeenLongitude);

        if (lastSeenLatitude != 0.0 || lastSeenLongitude != 0.0) {
            this.lastSeenLatitude = lastSeenLatitude;
            this.lastSeenLongitude = lastSeenLongitude;
        }
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
            String temperament,
            boolean canBePetted,
            String campusFrequency) {

        validateName(name);

        this.name = name.trim();
        this.temperament = normalizeOptional(temperament);
        this.canBePetted = canBePetted;
        this.campusFrequency = normalizeOptional(campusFrequency);
    }

    /**
     * Records where the dog was last seen. Pass both values, or both null to clear it.
     */
    public void setLastSeenLocation(Double latitude, Double longitude) {
        if (latitude == null && longitude == null) {
            this.lastSeenLatitude = null;
            this.lastSeenLongitude = null;
            return;
        }

        if (latitude == null || longitude == null) {
            throw new IllegalArgumentException(
                    "Latitude and longitude must be given together."
            );
        }

        validateCoordinates(latitude, longitude);
        this.lastSeenLatitude = latitude;
        this.lastSeenLongitude = longitude;
    }

    public String viewDetails() {
        return "Name: " + name
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

    public String getTemperament() {
        return temperament;
    }

    public boolean isCanBePetted() {
        return canBePetted;
    }

    public String getCampusFrequency() {
        return campusFrequency;
    }

    /** Null when the location is unknown. */
    public Double getLastSeenLatitude() {
        return lastSeenLatitude;
    }

    /** Null when the location is unknown. */
    public Double getLastSeenLongitude() {
        return lastSeenLongitude;
    }

    public boolean hasLastSeenLocation() {
        return lastSeenLatitude != null && lastSeenLongitude != null;
    }

    public int getLikeCount() {
        return likeCount;
    }

    /** The profile photo: the first of {@link #getPhotoUrls()}. */
    public String getPhotoUrl() {
        return photoUrls.isEmpty() ? null : photoUrls.get(0);
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

        // Mutate in place so JPA keeps tracking the same collection.
        this.photoUrls.clear();
        this.photoUrls.addAll(normalized);
    }

    public List<String> getPhotoUrls() {
        return Collections.unmodifiableList(photoUrls);
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

        if (normalized.length() > 2048) {
            throw new IllegalArgumentException(
                    "Photo URL must be at most 2048 characters."
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
