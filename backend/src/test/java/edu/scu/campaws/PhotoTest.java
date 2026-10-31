package edu.scu.campaws;

import edu.scu.campaws.domain.Photo;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class PhotoTest {
    @Test
    void createPhotoStartsWithoutUrl() {
        Photo photo = new Photo(1);
        assertEquals(1, photo.getPhotoId());
        assertNull(photo.getImageUrl());
    }

    @Test
    void uploadHttpsUrl() {
        Photo photo = new Photo(1);
        photo.uploadPhoto("https://example.com/dog.jpg");
        assertEquals("https://example.com/dog.jpg", photo.getImageUrl());
    }

    @Test
    void uploadTrimsWhitespace() {
        Photo photo = new Photo(1);
        photo.uploadPhoto("  https://example.com/dog.jpg  ");
        assertEquals("https://example.com/dog.jpg", photo.getImageUrl());
    }

    @Test
    void rejectsNullUrl() {
        Photo photo = new Photo(1);
        assertThrows(IllegalArgumentException.class,
                () -> photo.uploadPhoto(null));
    }

    @Test
    void rejectsBlankUrl() {
        Photo photo = new Photo(1);
        assertThrows(IllegalArgumentException.class,
                () -> photo.uploadPhoto("   "));
    }

    @Test
    void rejectsEmptyUrl() {
        Photo photo = new Photo(1);
        assertThrows(IllegalArgumentException.class,
                () -> photo.uploadPhoto(""));
    }

    @Test
    void rejectsFileScheme() {
        Photo photo = new Photo(1);
        assertThrows(IllegalArgumentException.class,
                () -> photo.uploadPhoto("file:///tmp/dog.jpg"));
    }

    @Test
    void replacesUrl() {
        Photo photo = new Photo(1);
        photo.uploadPhoto("https://example.com/old.jpg");
        photo.uploadPhoto("https://example.com/new.jpg");
        assertEquals("https://example.com/new.jpg", photo.getImageUrl());
    }

    @Test
    void rejectsNonPositiveId() {
        assertThrows(IllegalArgumentException.class, () -> new Photo(0));
    }
}