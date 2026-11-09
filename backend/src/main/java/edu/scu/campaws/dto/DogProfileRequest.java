package edu.scu.campaws.dto;

import java.util.List;

/**
 * Body for creating or updating a dog profile. Only {@code name} and at least one photo
 * (via {@code photoUrls}, or the older single {@code photoUrl}) are required.
 */
public record DogProfileRequest(
        String name,
        String temperament,
        Boolean canBePetted,
        String campusFrequency,
        String photoUrl,
        List<String> photoUrls,
        String furColor,
        String location,
        String about,
        String pettingPolicy,
        String addedBy,
        /** Where the dog was last seen. Send both, or neither. */
        Double latitude,
        Double longitude
) {
    /** Photos to save: {@code photoUrls} when given, otherwise the single {@code photoUrl}. */
    public List<String> resolvedPhotoUrls() {
        if (photoUrls != null && !photoUrls.isEmpty()) {
            return photoUrls;
        }
        return photoUrl == null || photoUrl.isBlank() ? List.of() : List.of(photoUrl);
    }
}
