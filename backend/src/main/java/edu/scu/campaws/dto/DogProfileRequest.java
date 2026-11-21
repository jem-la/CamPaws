package edu.scu.campaws.dto;

import java.util.List;

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
        Double latitude,
        Double longitude
) {
    public List<String> photos() {
        if (photoUrls != null && !photoUrls.isEmpty()) {
            return photoUrls;
        }
        return photoUrl == null || photoUrl.isBlank() ? List.of() : List.of(photoUrl);
    }
}
