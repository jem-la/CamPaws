package edu.scu.campaws.domain;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;


public class User {
    private String username;
    private String email;
    private final List<Integer> friendUserIds = new ArrayList<>();
    private final List<Integer> likedDogIds = new ArrayList<>();
    private final List<Integer> followedDogIds = new ArrayList<>();

    public User(String username, String email) {
        validateUsername(username);
        validateEmail(email);

        this.username = username.trim();
        this.email = email.trim();
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public void setUsername(String username) {
        validateUsername(username);
        this.username = username.trim();
    }

    public void setEmail(String email) {
        validateEmail(email);
        this.email = email.trim();
    }

    public void addFriend(int userId) {
        addUniquePositiveId(friendUserIds, userId);
    }

    public void likeDog(int dogId) {
        addUniquePositiveId(likedDogIds, dogId);
    }

    public void followDog(int dogId) {
        addUniquePositiveId(followedDogIds, dogId);
    }

    public void unlikeDog(int dogId) {
        likedDogIds.remove(Integer.valueOf(dogId));
    }

    public List<Integer> getFriendUserIds() {
        return Collections.unmodifiableList(friendUserIds);
    }

    public List<Integer> getLikedDogIds() {
        return Collections.unmodifiableList(likedDogIds);
    }

    public List<Integer> getFollowedDogIds() {
        return Collections.unmodifiableList(followedDogIds);
    }

    private static void validateUsername(String username) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException(
                    "Username is required."
            );
        }

        if (username.trim().length() > 80) {
            throw new IllegalArgumentException(
                    "Username must be at most 80 characters."
            );
        }
    }

    private static void validateEmail(String email) {
        if (email == null || email.isBlank()
                || !email.trim().matches(
                "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new IllegalArgumentException(
                    "A valid email address is required."
            );
        }

        if (email.trim().length() > 254) {
            throw new IllegalArgumentException(
                    "Email must be at most 254 characters."
            );
        }
    }

    private void addUniquePositiveId(
            List<Integer> values, int id) {
        if (id <= 0) {
            throw new IllegalArgumentException(
                    "ID must be positive."
            );
        }

        if (!values.contains(id)) {
            values.add(id);
        }
    }
}