package edu.scu.campaws.controller;

import edu.scu.campaws.dto.CommentResponse;
import edu.scu.campaws.service.AuthService;
import edu.scu.campaws.service.CommentService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dogs/{dogId}/comments")
public class CommentController {
    public record CommentRequest(String body) { }

    private final CommentService comments;
    private final AuthService auth;

    public CommentController(CommentService comments, AuthService auth) {
        this.comments = comments;
        this.auth = auth;
    }

    @GetMapping
    public List<CommentResponse> list(@PathVariable int dogId) {
        return comments.forDog(dogId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CommentResponse add(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable int dogId,
            @RequestBody CommentRequest request) {
        int userId = auth.currentUser(authorization).getUserId();
        return comments.add(dogId, userId, request == null ? null : request.body());
    }

    @DeleteMapping("/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable int dogId,
            @PathVariable int commentId) {
        comments.delete(dogId, commentId, auth.currentUser(authorization).getUserId());
    }
}
