package edu.scu.campaws.dto;

import edu.scu.campaws.domain.DogProfile;

import java.util.List;

public record DogProfileResponse(
        int dogId,
        String name,
        String breed,
        String temperament,
        boolean canBePetted,
        String campusFrequency,
        String photoUrl,
        int likeCount,
        List<String> photoUrls,
        String furColor,
        String location,
        String about,
        String pettingPolicy,
        String addedBy
) {
    public static DogProfileResponse from(DogProfile dog) {
        return new DogProfileResponse(
                dog.getDogId(),
                dog.getName(),
                dog.getBreed(),
                dog.getTemperament(),
                dog.isCanBePetted(),
                dog.getCampusFrequency(),
                dog.getPhotoUrl(),
                dog.getLikeCount(),
                dog.getPhotoUrls(),
                dog.getFurColor(),
                dog.getLocation(),
                dog.getAbout(),
                dog.getPettingPolicy(),
                dog.getAddedBy()
        );
    }
}
