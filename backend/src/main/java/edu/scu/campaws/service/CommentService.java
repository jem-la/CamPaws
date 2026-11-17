package edu.scu.campaws.service;

import edu.scu.campaws.dto.CommentResponse;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

/** Comments on dog profiles. Anyone logged in can comment; only the author can delete a comment. */
@Service
public class CommentService {
    static final int MAX_LENGTH = 500;

    private static final String SELECT = """
            SELECT c.comment_id, c.dog_id, c.user_id, u.display_name, c.body, c.created_at
            FROM dog_comments c JOIN users u ON u.user_id = c.user_id
            """;

    private static final RowMapper<CommentResponse> ROW = (rs, i) -> new CommentResponse(
            rs.getInt("comment_id"),
            rs.getInt("dog_id"),
            rs.getInt("user_id"),
            rs.getString("display_name"),
            rs.getString("body"),
            rs.getTimestamp("created_at").toInstant());

    private final JdbcTemplate jdbc;
    private final DogCatalog catalog;

    public CommentService(JdbcTemplate jdbc, DogCatalog catalog) {
        this.jdbc = jdbc;
        this.catalog = catalog;
    }

    /** Oldest first, like a conversation. */
    @Transactional(readOnly = true)
    public List<CommentResponse> forDog(int dogId) {
        catalog.requireById(dogId);
        return jdbc.query(SELECT + " WHERE c.dog_id = ? ORDER BY c.created_at, c.comment_id", ROW, dogId);
    }

    @Transactional
    public CommentResponse add(int dogId, int userId, String body) {
        catalog.requireById(dogId);
        String text = body == null ? "" : body.trim();
        if (text.isEmpty()) {
            throw new IllegalArgumentException("Write something before posting.");
        }
        if (text.length() > MAX_LENGTH) {
            throw new IllegalArgumentException("Comments can be at most " + MAX_LENGTH + " characters.");
        }
        Integer id = jdbc.queryForObject(
                "INSERT INTO dog_comments (dog_id, user_id, body) VALUES (?, ?, ?) RETURNING comment_id",
                Integer.class, dogId, userId, text);
        return jdbc.queryForObject(SELECT + " WHERE c.comment_id = ?", ROW, id);
    }

    @Transactional
    public void delete(int dogId, int commentId, int userId) {
        List<Integer> authors = jdbc.queryForList(
                "SELECT user_id FROM dog_comments WHERE comment_id = ? AND dog_id = ?", Integer.class, commentId, dogId);
        if (authors.isEmpty()) {
            throw new NoSuchElementException("Comment not found.");
        }
        if (authors.get(0) != userId) {
            throw new SecurityException("You can only delete your own comments.");
        }
        jdbc.update("DELETE FROM dog_comments WHERE comment_id = ?", commentId);
    }
}
