package edu.scu.campaws.dto;

public final class AuthDtos {
    private AuthDtos() { }

    public record SignUpRequest(
            String email, String displayName, String password,
            String securityQuestion, String securityAnswer) { }

    public record LoginRequest(String email, String password) { }

    public record UserResponse(int userId, String email, String displayName) { }

    public record AuthResponse(String token, UserResponse user) { }

    public record UpdateProfileRequest(String displayName, String email) { }

    public record PasswordRequest(String currentPassword, String newPassword) { }

    public record DeleteRequest(String password) { }

    public record QuestionResponse(String question) { }

    public record ResetPasswordRequest(String email, String securityAnswer, String newPassword) { }
}
