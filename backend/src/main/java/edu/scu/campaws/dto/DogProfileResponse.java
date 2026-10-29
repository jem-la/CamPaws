package edu.scu.campaws.dto;

import edu.scu.campaws.domain.DogProfile;

public record DogProfileResponse(
        int dogId,
        String name,
        String breed,
        String temperament,
        boolean canBePetted,
        String campusFrequency,
        String photoUrl,
        int likeCount
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
                dog.getLikeCount()
        );
    }
}