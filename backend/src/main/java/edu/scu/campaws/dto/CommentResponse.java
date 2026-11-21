package edu.scu.campaws.dto;

import java.time.Instant;

public record CommentResponse(
        int commentId, int dogId, int userId, String authorName, String body, Instant createdAt) { }
