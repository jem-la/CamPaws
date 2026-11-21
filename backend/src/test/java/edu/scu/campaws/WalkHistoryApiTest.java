package edu.scu.campaws;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Instant;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(PostgisTestDatabase.class)
@Testcontainers(disabledWithoutDocker = true)
class WalkHistoryApiTest {
    @Autowired
    private MockMvc mvc;

    private String bearer() throws Exception {
        String body = mvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "walker%d@scu.edu", "displayName": "Walker", "password": "password123",
                                 "securityQuestion": "What is your favorite food at the SCU cafeteria?",
                                 "securityAnswer": "pizza"}
                                """.formatted(System.nanoTime())))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return "Bearer " + body.replaceAll("(?s).*\"token\":\"([^\"]+)\".*", "$1");
    }

    private String walk(Instant start, Instant end, double meters) {
        return "{\"startedAt\": \"%s\", \"endedAt\": \"%s\", \"distanceMeters\": %s, \"publicSharing\": false}"
                .formatted(start, end, meters);
    }

    @Test
    void savesWalksAndSumsStatistics() throws Exception {
        String auth = bearer();
        Instant now = Instant.now();

        mvc.perform(post("/api/walks/history").header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(walk(now.minusSeconds(1800), now.minusSeconds(600), 1500)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.durationSeconds").value(1200));
        mvc.perform(post("/api/walks/history").header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(walk(now.minusSeconds(300), now, 500)))
                .andExpect(status().isCreated());

        mvc.perform(get("/api/walks/stats").header("Authorization", auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.walkCount").value(2))
                .andExpect(jsonPath("$.totalDistanceMeters").value(2000.0))
                .andExpect(jsonPath("$.totalDurationSeconds").value(1500))
                .andExpect(jsonPath("$.recent.length()").value(2));
    }

    @Test
    void rejectsImpossibleWalksAndAnonymousUse() throws Exception {
        String auth = bearer();
        Instant now = Instant.now();

        mvc.perform(post("/api/walks/history").header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(walk(now, now.minusSeconds(60), 10)))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/walks/history").header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(walk(now.minusSeconds(60), now, -5)))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/walks/stats")).andExpect(status().isUnauthorized());
    }
}
