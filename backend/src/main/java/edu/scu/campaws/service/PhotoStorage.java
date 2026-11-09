package edu.scu.campaws.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.regex.Pattern;

/** Stores uploaded dog photos on local disk. Swap for S3/GCS when the app is deployed. */
@Service
public class PhotoStorage {
    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/webp", "webp",
            "image/heic", "heic",
            "image/heif", "heif",
            "image/gif", "gif"
    );
    private static final Pattern STORED_NAME =
            Pattern.compile("[0-9a-f\\-]{36}\\.(jpg|png|webp|heic|heif|gif)");

    private final Path directory;

    public PhotoStorage(@Value("${campaws.photos.dir:uploads}") String directory) {
        this.directory = Path.of(directory).toAbsolutePath().normalize();
    }

    /** Saves the image and returns its generated file name. */
    public String store(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Choose a photo to upload.");
        }
        String type = file.getContentType() == null
                ? ""
                : file.getContentType().toLowerCase(java.util.Locale.ROOT);
        String extension = EXTENSIONS.get(type);
        if (extension == null) {
            throw new IllegalArgumentException(
                    "Photos must be JPEG, PNG, WebP, HEIC or GIF images."
            );
        }

        Files.createDirectories(directory);
        String name = UUID.randomUUID() + "." + extension;
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, directory.resolve(name), StandardCopyOption.REPLACE_EXISTING);
        }
        return name;
    }

    /** Resolves a stored photo, rejecting anything that isn't a name this class generated. */
    public Path load(String name) {
        if (name == null || !STORED_NAME.matcher(name).matches()) {
            throw new NoSuchElementException("Photo not found.");
        }
        Path path = directory.resolve(name);
        if (!Files.isRegularFile(path)) {
            throw new NoSuchElementException("Photo not found.");
        }
        return path;
    }
}
