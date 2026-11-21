package edu.scu.campaws.controller;

import edu.scu.campaws.domain.UserAccount;
import edu.scu.campaws.dto.AuthDtos.*;
import edu.scu.campaws.service.AuthService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class AuthController {
    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    @GetMapping("/auth/security-questions")
    public List<String> securityQuestions() {
        return AuthService.QUESTIONS;
    }

    @PostMapping("/auth/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse signUp(@RequestBody SignUpRequest request) {
        return auth.signUp(request);
    }

    @PostMapping("/auth/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Email and password are required.");
        }
        return auth.login(request.email(), request.password());
    }

    @PostMapping("/auth/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@RequestHeader(name = "Authorization", required = false) String authorization) {
        auth.logout(authorization);
    }

    @GetMapping("/auth/reset-question")
    public QuestionResponse resetQuestion(@RequestParam String email) {
        return new QuestionResponse(auth.resetQuestion(email));
    }

    @PostMapping("/auth/reset-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@RequestBody ResetPasswordRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Reset details are required.");
        }
        auth.resetPassword(request.email(), request.securityAnswer(), request.newPassword());
    }

    @GetMapping("/me")
    public UserResponse me(@RequestHeader(name = "Authorization", required = false) String authorization) {
        return AuthService.toResponse(auth.currentUser(authorization));
    }

    @PutMapping("/me")
    public UserResponse updateMe(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @RequestBody UpdateProfileRequest request) {
        UserAccount user = auth.currentUser(authorization);
        return AuthService.toResponse(auth.updateProfile(user, request.displayName(), request.email()));
    }

    @PutMapping("/me/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @RequestBody PasswordRequest request) {
        auth.changePassword(auth.currentUser(authorization), request.currentPassword(), request.newPassword());
    }

    @DeleteMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMe(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @RequestBody DeleteRequest request) {
        auth.deleteAccount(auth.currentUser(authorization), request.password());
    }
}
