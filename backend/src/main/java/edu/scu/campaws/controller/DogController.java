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
            @RequestParam(required = false) Boolean canBePetted) {

        return catalog.findDogs(q, canBePetted)
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

    /** Dogs last seen near a point, closest first. {@code radiusMeters} defaults to 1 km. */
    @GetMapping("/nearby")
    public List<DogProfileResponse> nearbyDogs(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "1000") double radiusMeters) {

        return catalog.findNearbyDogs(lat, lng, radiusMeters)
                .stream()
                .map(DogProfileResponse::from)
                .toList();
    }

    /** Used before creating a profile to suggest an existing one instead (alternative flow 2). */
    @GetMapping("/duplicates")
    public List<DogProfileResponse> possibleDuplicates(
            @RequestParam String name,
            @RequestParam(required = false) String furColor,
            @RequestParam(required = false) Integer ignoreDogId) {

        return catalog.findPossibleDuplicates(name, furColor, ignoreDogId)
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
        List<String> photoUrls = validatedPhotoUrls(request);

        // Build and validate the whole profile first; it is only stored once everything is valid.
        DogProfile profile = catalog.newDogProfile(
                request.name(),
                request.temperament(),
                Boolean.TRUE.equals(request.canBePetted()),
                request.campusFrequency()
        );

        applyDetails(profile, request, photoUrls);
        profile.setLastSeenLocation(request.latitude(), request.longitude());
        profile.setAddedBy(request.addedBy());

        return DogProfileResponse.from(catalog.createDogProfile(profile));
    }

    /** Updates a profile. Omitting latitude/longitude keeps the current location. */
    @PutMapping("/{dogId}")
    public DogProfileResponse updateDog(
            @PathVariable int dogId,
            @RequestBody DogProfileRequest request) {

        validateRequest(request);
        List<String> photoUrls = validatedPhotoUrls(request);

        DogProfile profile = catalog.requireById(dogId);

        profile.inputDetails(
                request.name(),
                request.temperament(),
                Boolean.TRUE.equals(request.canBePetted()),
                request.campusFrequency()
        );

        applyDetails(profile, request, photoUrls);

        if (request.latitude() != null || request.longitude() != null) {
            profile.setLastSeenLocation(request.latitude(), request.longitude());
        }

        return DogProfileResponse.from(catalog.save(profile));
    }

    @PostMapping("/{dogId}/likes")
    public DogProfileResponse likeDog(
            @PathVariable int dogId) {
        return DogProfileResponse.from(
                catalog.likeDog(dogId)
        );
    }

    private List<String> validatedPhotoUrls(DogProfileRequest request) {
        List<String> urls = request.resolvedPhotoUrls();
        if (urls.size() > DogProfile.MAX_PHOTOS) {
            throw new IllegalArgumentException(
                    "A dog profile can have at most " + DogProfile.MAX_PHOTOS + " photos."
            );
        }
        int photoId = 1;
        for (String url : urls) {
            new Photo(photoId++).uploadPhoto(url);
        }
        return urls;
    }

    private void applyDetails(
            DogProfile profile, DogProfileRequest request, List<String> photoUrls) {
        profile.inputAppearance(
                request.furColor(),
                request.location(),
                request.about(),
                request.pettingPolicy()
        );
        profile.setPhotoUrls(photoUrls);
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

        if (request.resolvedPhotoUrls().isEmpty()) {
            throw new IllegalArgumentException(
                    "At least one accessible photo URL is required."
            );
        }
    }
}