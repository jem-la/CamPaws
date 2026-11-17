package edu.scu.campaws.service;

import edu.scu.campaws.domain.AuthToken;
import edu.scu.campaws.domain.UserAccount;
import edu.scu.campaws.dto.AuthDtos.AuthResponse;
import edu.scu.campaws.dto.AuthDtos.SignUpRequest;
import edu.scu.campaws.dto.AuthDtos.UserResponse;
import edu.scu.campaws.exception.UnauthorizedException;
import edu.scu.campaws.repository.AuthTokenRepository;
import edu.scu.campaws.repository.UserRepository;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class AuthService {
    public static final List<String> QUESTIONS = List.of(
            "What is your favorite food at the SCU cafeteria?",
            "What is your favorite spot on the SCU campus?",
            "What was the name of your first-year residence hall at SCU?",
            "Which SCU class has been your favorite so far?"
    );

    private final UserRepository users;
    private final AuthTokenRepository tokens;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository users, AuthTokenRepository tokens) {
        this.users = users;
        this.tokens = tokens;
    }

    @Transactional
    public AuthResponse signUp(SignUpRequest req) {
        if (req == null) {
            throw new IllegalArgumentException("Sign-up details are required.");
        }
        String email = checkEmail(req.email());
        String name = required(req.displayName(), "Name");
        checkPassword(req.password());
        if (!QUESTIONS.contains(req.securityQuestion())) {
            throw new IllegalArgumentException("Choose one of the security questions.");
        }
        String answer = required(req.securityAnswer(), "Security answer");
        if (users.findByEmail(email).isPresent()) {
            throw new IllegalStateException("An account with this email already exists. Try logging in.");
        }

        var user = new UserAccount(email, name, encoder.encode(req.password()), req.securityQuestion(), answer);
        users.saveAndFlush(user);
        return new AuthResponse(newToken(user), toResponse(user));
    }

    @Transactional
    public AuthResponse login(String email, String password) {
        UserAccount user = users.findByEmail(lower(email)).orElse(null);
        if (user == null || password == null || !encoder.matches(password, user.getPasswordHash())) {
            throw new UnauthorizedException("Wrong email or password.");
        }
        return new AuthResponse(newToken(user), toResponse(user));
    }

    /** Finds the user behind an "Authorization: Bearer ..." header, or throws a 401. */
    @Transactional(readOnly = true)
    public UserAccount currentUser(String header) {
        return tokens.findById(tokenFrom(header))
                .flatMap(token -> users.findById(token.getUserId()))
                .orElseThrow(() -> new UnauthorizedException("Please log in again."));
    }

    @Transactional
    public void logout(String header) {
        tokens.deleteById(tokenFrom(header));
    }

    @Transactional
    public UserAccount updateProfile(UserAccount user, String name, String email) {
        if (name != null) {
            user.setDisplayName(required(name, "Name"));
        }
        if (email != null) {
            String clean = checkEmail(email);
            users.findByEmail(clean).ifPresent(other -> {
                if (other.getUserId() != user.getUserId()) {
                    throw new IllegalStateException("Another account already uses this email.");
                }
            });
            user.setEmail(clean);
        }
        return users.save(user);
    }

    @Transactional
    public void changePassword(UserAccount user, String oldPassword, String newPassword) {
        if (oldPassword == null || !encoder.matches(oldPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Your current password is incorrect.");
        }
        checkPassword(newPassword);
        user.setPasswordHash(encoder.encode(newPassword));
        users.save(user);
    }

    @Transactional
    public void deleteAccount(UserAccount user, String password) {
        if (password == null || !encoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Password is incorrect.");
        }
        // The database removes tokens and likes, and clears the owner on their dogs.
        users.delete(user);
    }

    public String resetQuestion(String email) {
        return findUser(email).getSecurityQuestion();
    }

    @Transactional
    public void resetPassword(String email, String answer, String newPassword) {
        UserAccount user = findUser(email);
        if (answer == null || !answer.trim().equalsIgnoreCase(user.getSecurityAnswer())) {
            throw new IllegalArgumentException("That answer doesn't match.");
        }
        checkPassword(newPassword);
        user.setPasswordHash(encoder.encode(newPassword));
        users.save(user);
        // Log out every device that was using the old password.
        tokens.deleteByUser(user.getUserId());
    }

    public static UserResponse toResponse(UserAccount user) {
        return new UserResponse(user.getUserId(), user.getEmail(), user.getDisplayName());
    }

    private UserAccount findUser(String email) {
        return users.findByEmail(lower(email))
                .orElseThrow(() -> new NoSuchElementException("No account found with that email."));
    }

    private String newToken(UserAccount user) {
        String token = UUID.randomUUID().toString();
        tokens.save(new AuthToken(token, user.getUserId()));
        return token;
    }

    private static String tokenFrom(String header) {
        if (header == null || !header.startsWith("Bearer ")) {
            throw new UnauthorizedException("Please log in to continue.");
        }
        return header.substring(7).trim();
    }

    private static String lower(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private static String checkEmail(String email) {
        String clean = lower(email);
        if (!clean.contains("@")) {
            throw new IllegalArgumentException("Enter a valid email address.");
        }
        return clean;
    }

    private static String required(String value, String label) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(label + " is required.");
        }
        return value.trim();
    }

    private static void checkPassword(String password) {
        if (password == null || password.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters.");
        }
    }
}
