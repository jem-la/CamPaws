package edu.scu.campaws;

import edu.scu.campaws.domain.DogProfile;
import edu.scu.campaws.service.PhotoStorage;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.NoSuchElementException;

import static org.junit.jupiter.api.Assertions.*;

/** Covers the "create a dog profile" use case: appearance fields and photos (duplicates: DogCatalogTest). */
class DogProfileCreationTest {
    private DogProfile dog() {
        return new DogProfile(1, "Mochi", "Friendly", false, "Most weekdays", 0f, 0f);
    }

    @Test
    void appearanceFieldsAreTrimmedAndOptional() {
        DogProfile dog = dog();
        dog.inputAppearance(" Tan and white ", " ", "Loves sun", "ASK");
        assertEquals("Tan and white", dog.getFurColor());
        assertNull(dog.getLocation());
        assertEquals("Loves sun", dog.getAbout());
        assertEquals("ask", dog.getPettingPolicy());
        assertFalse(dog.isCanBePetted());
    }

    @Test
    void pettingPolicyYesMeansCanBePetted() {
        DogProfile dog = dog();
        dog.inputAppearance(null, null, null, "yes");
        assertTrue(dog.isCanBePetted());
        assertEquals("yes", dog.getPettingPolicy());
    }

    @Test
    void rejectsUnknownPettingPolicy() {
        assertThrows(IllegalArgumentException.class,
                () -> dog().inputAppearance(null, null, null, "maybe"));
    }

    @Test
    void multiplePhotosFirstIsProfilePhoto() {
        DogProfile dog = dog();
        dog.setPhotoUrls(List.of("https://x.test/a.jpg", " http://x.test/b.jpg "));
        assertEquals(List.of("https://x.test/a.jpg", "http://x.test/b.jpg"), dog.getPhotoUrls());
        assertEquals("https://x.test/a.jpg", dog.getPhotoUrl());
    }

    @Test
    void requiresAtLeastOnePhotoAndAtMostFive() {
        DogProfile dog = dog();
        assertThrows(IllegalArgumentException.class, () -> dog.setPhotoUrls(List.of()));
        assertThrows(IllegalArgumentException.class, () -> dog.setPhotoUrls(
                List.of("https://a", "https://b", "https://c", "https://d", "https://e", "https://f")));
        assertThrows(IllegalArgumentException.class,
                () -> dog.setPhotoUrls(List.of("https://ok.test/a.jpg", "file:///local.jpg")));
    }

    @Test
    void storesAndLoadsUploadedPhoto(@TempDir Path dir) throws Exception {
        PhotoStorage storage = new PhotoStorage(dir.toString());
        String name = storage.store(
                new MockMultipartFile("file", "dog.jpg", "image/jpeg", new byte[]{1, 2, 3}));
        assertTrue(name.endsWith(".jpg"));
        assertArrayEquals(new byte[]{1, 2, 3}, Files.readAllBytes(storage.load(name)));
    }

    @Test
    void rejectsNonImagesAndUnknownNames(@TempDir Path dir) {
        PhotoStorage storage = new PhotoStorage(dir.toString());
        assertThrows(IllegalArgumentException.class, () -> storage.store(
                new MockMultipartFile("file", "notes.txt", "text/plain", new byte[]{1})));
        assertThrows(NoSuchElementException.class, () -> storage.load("../secret.jpg"));
        assertThrows(NoSuchElementException.class,
                () -> storage.load("00000000-0000-0000-0000-000000000000.jpg"));
    }
}
