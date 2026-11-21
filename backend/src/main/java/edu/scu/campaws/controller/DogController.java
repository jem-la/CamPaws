package edu.scu.campaws.controller;

import edu.scu.campaws.domain.DogProfile;
import edu.scu.campaws.domain.Photo;
import edu.scu.campaws.dto.DogProfileRequest;
import edu.scu.campaws.dto.DogProfileResponse;
import edu.scu.campaws.domain.UserAccount;
import edu.scu.campaws.service.AuthService;
import edu.scu.campaws.service.DogCatalog;
import edu.scu.campaws.service.DogPhotoMatcher;
import edu.scu.campaws.service.LikeService;
import edu.scu.campaws.dto.DogPhotoMatch;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/dogs")
public class DogController {
    private final DogCatalog catalog;
    private final AuthService auth;
    private final LikeService likes;
    private final DogPhotoMatcher matcher;

    public DogController(DogCatalog catalog, AuthService auth, LikeService likes, DogPhotoMatcher matcher) {
        this.catalog = catalog;
        this.auth = auth;
        this.likes = likes;
        this.matcher = matcher;
    }

    @PostMapping(value = "/match-photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public List<DogPhotoMatch> matchPhoto(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @RequestParam("file") MultipartFile file) throws IOException {
        auth.currentUser(authorization);
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Choose a photo to check.");
        }
        return matcher.match(file.getBytes());
    }

    @GetMapping
    public List<DogProfileResponse> listDogs(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Boolean canBePetted) {
        return catalog.findDogs(q, canBePetted).stream().map(DogProfileResponse::from).toList();
    }

    @GetMapping("/leaderboard")
    public List<DogProfileResponse> leaderboard() {
        return catalog.leaderboard().stream().map(DogProfileResponse::from).toList();
    }

    @GetMapping("/nearby")
    public List<DogProfileResponse> nearbyDogs(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "1000") double radiusMeters) {
        return catalog.findNearbyDogs(lat, lng, radiusMeters).stream().map(DogProfileResponse::from).toList();
    }

    @GetMapping("/duplicates")
    public List<DogProfileResponse> possibleDuplicates(
            @RequestParam String name,
            @RequestParam(required = false) String furColor,
            @RequestParam(required = false) Integer ignoreDogId) {
        return catalog.findDuplicates(name, furColor, ignoreDogId).stream().map(DogProfileResponse::from).toList();
    }

    @GetMapping("/{dogId}")
    public DogProfileResponse getDog(@PathVariable int dogId) {
        return DogProfileResponse.from(catalog.requireById(dogId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DogProfileResponse createDog(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @RequestBody DogProfileRequest request) {
        UserAccount user = auth.currentUser(authorization);
        validateRequest(request);
        List<String> photoUrls = checkPhotos(request);

        // Build and validate the whole profile first; it is only stored once everything is valid.
        DogProfile profile = catalog.newDog(
                request.name(), request.temperament(), Boolean.TRUE.equals(request.canBePetted()),
                request.campusFrequency());

        applyDetails(profile, request, photoUrls);
        profile.setLastSeenLocation(request.latitude(), request.longitude());
        profile.setAddedBy(user.getDisplayName());
        profile.setOwnerId(user.getUserId());

        return DogProfileResponse.from(catalog.addDog(profile));
    }

    @PutMapping("/{dogId}")
    public DogProfileResponse updateDog(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable int dogId,
            @RequestBody DogProfileRequest request) {
        UserAccount user = auth.currentUser(authorization);
        validateRequest(request);
        List<String> photoUrls = checkPhotos(request);

        DogProfile profile = catalog.requireById(dogId);
        if (profile.getOwnerId() == null || profile.getOwnerId() != user.getUserId()) {
            throw new SecurityException("Only the person who added this dog can edit its profile.");
        }

        profile.inputDetails(
                request.name(), request.temperament(), Boolean.TRUE.equals(request.canBePetted()),
                request.campusFrequency());

        applyDetails(profile, request, photoUrls);

        if (request.latitude() != null || request.longitude() != null) {
            profile.setLastSeenLocation(request.latitude(), request.longitude());
        }

        return DogProfileResponse.from(catalog.save(profile));
    }

    @DeleteMapping("/{dogId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDog(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable int dogId) {
        UserAccount user = auth.currentUser(authorization);
        DogProfile profile = catalog.requireById(dogId);
        if (profile.getOwnerId() == null || profile.getOwnerId() != user.getUserId()) {
            throw new SecurityException("Only the person who added this dog can delete its profile.");
        }
        catalog.delete(profile);
    }

    @PostMapping("/{dogId}/likes")
    public DogProfileResponse likeDog(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable int dogId) {
        UserAccount user = auth.currentUser(authorization);
        return DogProfileResponse.from(likes.like(dogId, user.getUserId()));
    }

    @DeleteMapping("/{dogId}/likes")
    public DogProfileResponse unlikeDog(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable int dogId) {
        UserAccount user = auth.currentUser(authorization);
        return DogProfileResponse.from(likes.unlike(dogId, user.getUserId()));
    }

    @GetMapping("/liked")
    public List<Integer> likedDogIds(
            @RequestHeader(name = "Authorization", required = false) String authorization) {
        return likes.likedDogIds(auth.currentUser(authorization).getUserId());
    }

    private List<String> checkPhotos(DogProfileRequest request) {
        List<String> urls = request.photos();
        if (urls.size() > DogProfile.MAX_PHOTOS) {
            throw new IllegalArgumentException("A dog profile can have at most " + DogProfile.MAX_PHOTOS + " photos.");
        }
        int photoId = 1;
        for (String url : urls) {
            new Photo(photoId++).uploadPhoto(url);
        }
        return urls;
    }

    private void applyDetails(DogProfile profile, DogProfileRequest request, List<String> photoUrls) {
        profile.inputAppearance(request.furColor(), request.location(), request.about(), request.pettingPolicy());
        profile.setPhotoUrls(photoUrls);
    }

    private void validateRequest(DogProfileRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Dog profile details are required.");
        }
        if (request.name() == null || request.name().isBlank()) {
            throw new IllegalArgumentException("Dog name is required.");
        }
        if (request.photos().isEmpty()) {
            throw new IllegalArgumentException("At least one accessible photo URL is required.");
        }
    }
}
