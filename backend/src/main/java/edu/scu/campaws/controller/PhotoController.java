package edu.scu.campaws.controller;

import edu.scu.campaws.dto.PhotoUploadResponse;
import edu.scu.campaws.service.AuthService;
import edu.scu.campaws.service.PhotoStorage;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.nio.file.Path;
import java.time.Duration;

@RestController
@RequestMapping("/api/photos")
public class PhotoController {
    private final PhotoStorage storage;
    private final AuthService auth;

    public PhotoController(PhotoStorage storage, AuthService auth) {
        this.storage = storage;
        this.auth = auth;
    }

    // URL is built from the request host so it works from a phone on the same network.
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public PhotoUploadResponse upload(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @RequestParam("file") MultipartFile file) throws IOException {
        auth.currentUser(authorization);
        String name = storage.store(file);
        String url = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/photos/{name}")
                .buildAndExpand(name)
                .toUriString();
        return new PhotoUploadResponse(url);
    }

    @GetMapping("/{name}")
    public ResponseEntity<Resource> download(@PathVariable String name) {
        Path path = storage.load(name);
        MediaType type = MediaTypeFactory.getMediaType(path.getFileName().toString())
                .orElse(MediaType.APPLICATION_OCTET_STREAM);
        return ResponseEntity.ok()
                .contentType(type)
                .cacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePublic())
                .body(new FileSystemResource(path));
    }
}
