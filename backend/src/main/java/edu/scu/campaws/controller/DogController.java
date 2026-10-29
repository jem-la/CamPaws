package edu.scu.campaws.controller;

import edu.scu.campaws.domain.DogProfile;
import edu.scu.campaws.domain.Photo;
import edu.scu.campaws.dto.DogProfileRequest;
import edu.scu.campaws.dto.DogProfileResponse;
import edu.scu.campaws.service.DogCatalog;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dogs")
public class DogController {
    private final DogCatalog catalog;

    public DogController(DogCatalog catalog) {
        this.catalog = catalog;
    }

    @GetMapping
    public List<DogProfileResponse> listDogs(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String breed,
            @RequestParam(required = false) Boolean canBePetted) {

        return catalog.findDogs(q, breed, canBePetted)
                .stream()
                .map(DogProfileResponse::from)
                .toList();
    }

    @GetMapping("/leaderboard")
    public List<DogProfileResponse> leaderboard() {
        return catalog.viewLeaderboard()
                .stream()
                .map(DogProfileResponse::from)
                .toList();
    }

    @GetMapping("/{dogId}")
    public DogProfileResponse getDog(
            @PathVariable int dogId) {
        return DogProfileResponse.from(
                catalog.requireById(dogId)
        );
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DogProfileResponse createDog(
            @RequestBody DogProfileRequest request) {

        validateRequest(request);

        Photo photo = new Photo(1);
        photo.uploadPhoto(request.photoUrl());

        DogProfile profile = catalog.createDogProfile(
                request.name(),
                request.breed(),
                request.temperament(),
                Boolean.TRUE.equals(request.canBePetted()),
                request.campusFrequency()
        );

        profile.setPhotoUrl(photo.getImageUrl());

        return DogProfileResponse.from(profile);
    }

    @PutMapping("/{dogId}")
    public DogProfileResponse updateDog(
            @PathVariable int dogId,
            @RequestBody DogProfileRequest request) {

        validateRequest(request);

        Photo photo = new Photo(1);
        photo.uploadPhoto(request.photoUrl());

        DogProfile profile = catalog.requireById(dogId);

        profile.inputDetails(
                request.name(),
                request.breed(),
                request.temperament(),
                Boolean.TRUE.equals(request.canBePetted()),
                request.campusFrequency()
        );

        profile.setPhotoUrl(photo.getImageUrl());

        return DogProfileResponse.from(profile);
    }

    @PostMapping("/{dogId}/likes")
    public DogProfileResponse likeDog(
            @PathVariable int dogId) {
        return DogProfileResponse.from(
                catalog.likeDog(dogId)
        );
    }

    private void validateRequest(DogProfileRequest request) {
        if (request == null) {
            throw new IllegalArgumentException(
                    "Dog profile details are required."
            );
        }

        if (request.name() == null || request.name().isBlank()) {
            throw new IllegalArgumentException(
                    "Dog name is required."
            );
        }

        if (request.photoUrl() == null
                || request.photoUrl().isBlank()) {
            throw new IllegalArgumentException(
                    "At least one accessible photo URL is required."
            );
        }
    }
}