package edu.scu.campaws.dto;


public record DogProfileRequest(
        String name,
        String breed,
        String temperament,
        Boolean canBePetted,
        String campusFrequency,
        String photoUrl
) { }