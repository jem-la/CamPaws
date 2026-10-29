package edu.scu.campaws;

import edu.scu.campaws.domain.Photo;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class PhotoTest {
    @Test
    void testCreatePhoto() {
        Photo photo = new Photo(1);

        assertEquals(1, photo.getPhotoId());
        assertNull(photo.getImageUrl());
    }

    @Test
    void testUploadPhoto() {
        Photo photo = new Photo(1);
        photo.uploadPhoto("https://example.com/luna.jpg");

        assertEquals(
                "https://example.com/luna.jpg",
                photo.getImageUrl()
        );
    }

    @Test
    void testUploadPhotoWithWhitespace() {
        Photo photo = new Photo(1);
        photo.uploadPhoto("  https://example.com/luna.jpg  ");

        assertEquals(
                "https://example.com/luna.jpg",
                photo.getImageUrl()
        );
    }

    @Test
    void testRejectsNullImageUrl() {
        Photo photo = new Photo(1);

        assertThrows(IllegalArgumentException.class, () ->
                photo.uploadPhoto(null)
        );
    }

    @Test
    void testRejectsBlankImageUrl() {
        Photo photo = new Photo(1);

        assertThrows(IllegalArgumentException.class, () ->
                photo.uploadPhoto("   ")
        );
    }

    @Test
    void testUploadPhotoReplacesPreviousUrl() {
        Photo photo = new Photo(1);

        photo.uploadPhoto("https://example.com/old.jpg");
        photo.uploadPhoto("https://example.com/new.jpg");

        assertEquals(
                "https://example.com/new.jpg",
                photo.getImageUrl()
        );
    }
}