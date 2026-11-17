package edu.scu.campaws.dto;

import java.time.Instant;

/** One comment on a dog profile. {@code authorName} is the author's current display name. */
public record CommentResponse(int commentId, int dogId, int userId, String authorName, String body, Instant createdAt) { }
