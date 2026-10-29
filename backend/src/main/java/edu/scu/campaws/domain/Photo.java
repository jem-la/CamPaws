package edu.scu.campaws.domain;

public class Photo {
    private final int photoId;
    private String imageUrl;

    public Photo(int photoId) {
        if (photoId <= 0) {
            throw new IllegalArgumentException(
                    "Photo ID must be positive."
            );
        }

        this.photoId = photoId;
    }

    public void uploadPhoto(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            throw new IllegalArgumentException(
                    "Image URL cannot be empty."
            );
        }

        String value = imageUrl.trim();

        if (!(value.regionMatches(
                true, 0, "https://", 0, 8)
                || value.regionMatches(
                true, 0, "http://", 0, 7))) {
            throw new IllegalArgumentException(
                    "Image URL must start with http:// or https://."
            );
        }

        this.imageUrl = value;
    }

    public int getPhotoId() {
        return photoId;
    }

    public String getImageUrl() {
        return imageUrl;
    }
}