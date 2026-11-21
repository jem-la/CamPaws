package edu.scu.campaws;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(PostgisTestDatabase.class)
@Testcontainers(disabledWithoutDocker = true)
class AuthApiTest {
    private static final String QUESTION = "What is your favorite food at the SCU cafeteria?";

    @Autowired
    private MockMvc mvc;

    private String signUp(String email, String password) throws Exception {
        String body = mvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s", "displayName": "Bronco", "password": "%s",
                                 "securityQuestion": "%s", "securityAnswer": " Pizza "}
                                """.formatted(email, password, QUESTION)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return body.replaceAll("(?s).*\"token\":\"([^\"]+)\".*", "$1");
    }

    @Test
    void signUpLoginLogoutFlow() throws Exception {
        String email = "flow" + System.nanoTime() + "@scu.edu";
        String token = signUp(email, "password123");

        mvc.perform(get("/api/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email));

        mvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s", "displayName": "Dup", "password": "password123",
                                 "securityQuestion": "%s", "securityAnswer": "x"}
                                """.formatted(email.toUpperCase(), QUESTION)))
                .andExpect(status().isConflict());

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"" + email + "\", \"password\": \"wrong-pass\"}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"" + email + "\", \"password\": \"password123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());

        mvc.perform(post("/api/auth/logout").header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void weakPasswordAndBadEmailAreRejected() throws Exception {
        mvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "a@scu.edu", "displayName": "A", "password": "short",
                                 "securityQuestion": "%s", "securityAnswer": "x"}
                                """.formatted(QUESTION)))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "not-an-email", "displayName": "A", "password": "password123",
                                 "securityQuestion": "%s", "securityAnswer": "x"}
                                """.formatted(QUESTION)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void resetPasswordWithSecurityAnswer() throws Exception {
        String email = "reset" + System.nanoTime() + "@scu.edu";
        String oldToken = signUp(email, "password123");

        mvc.perform(get("/api/auth/reset-question").param("email", email))
                .andExpect(jsonPath("$.question").value(QUESTION));

        mvc.perform(post("/api/auth/reset-password").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"" + email + "\", \"securityAnswer\": \"sushi\", \"newPassword\": \"newpassword1\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/auth/reset-password").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"" + email + "\", \"securityAnswer\": \"PIZZA\", \"newPassword\": \"newpassword1\"}"))
                .andExpect(status().isNoContent());

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"" + email + "\", \"password\": \"newpassword1\"}"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/me").header("Authorization", "Bearer " + oldToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void editAndDeleteAccount() throws Exception {
        String email = "edit" + System.nanoTime() + "@scu.edu";
        String auth = "Bearer " + signUp(email, "password123");

        mvc.perform(put("/api/me").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"displayName\": \"New Name\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("New Name"));

        mvc.perform(delete("/api/me").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\": \"wrong\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(delete("/api/me").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\": \"password123\"}"))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/me").header("Authorization", auth))
                .andExpect(status().isUnauthorized());
    }
}
