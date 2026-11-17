package edu.scu.campaws;

import edu.scu.campaws.repository.DogRepository;
import edu.scu.campaws.service.SampleDogSeeder;

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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Comments on dog profiles over HTTP. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(PostgisTestDatabase.class)
@Testcontainers(disabledWithoutDocker = true)
class CommentApiTest {
    @Autowired
    private MockMvc mvc;

    @Autowired
    private DogRepository dogs;

    @Autowired
    private SampleDogSeeder seeder;

    private String bearer(String name) throws Exception {
        String body = mvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "c%d@scu.edu", "displayName": "%s", "password": "password123",
                                 "securityQuestion": "What is your favorite food at the SCU cafeteria?",
                                 "securityAnswer": "pizza"}
                                """.formatted(System.nanoTime(), name)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return "Bearer " + body.replaceAll("(?s).*\"token\":\"([^\"]+)\".*", "$1");
    }

    private String comment(String text) {
        return "{\"body\": \"" + text + "\"}";
    }

    @Test
    void postListAndDeleteComments() throws Exception {
        seeder.run(null); // other tests may have emptied the dogs table
        int dogId = dogs.findAll().get(0).getDogId();
        String url = "/api/dogs/" + dogId + "/comments";
        String alex = bearer("Alex");
        String sam = bearer("Sam");

        String created = mvc.perform(post(url).header("Authorization", alex)
                        .contentType(MediaType.APPLICATION_JSON).content(comment("  Such a good dog!  ")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.body").value("Such a good dog!"))
                .andExpect(jsonPath("$.authorName").value("Alex"))
                .andReturn().getResponse().getContentAsString();
        String commentId = created.replaceAll("(?s).*\"commentId\":(\\d+).*", "$1");

        mvc.perform(get(url))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[-1].body").value("Such a good dog!"));

        // Not logged in, empty text, and someone else's comment are all refused.
        mvc.perform(post(url).contentType(MediaType.APPLICATION_JSON).content(comment("hi")))
                .andExpect(status().isUnauthorized());
        mvc.perform(post(url).header("Authorization", alex)
                        .contentType(MediaType.APPLICATION_JSON).content(comment("   ")))
                .andExpect(status().isBadRequest());
        mvc.perform(delete(url + "/" + commentId).header("Authorization", sam))
                .andExpect(status().isForbidden());

        mvc.perform(delete(url + "/" + commentId).header("Authorization", alex))
                .andExpect(status().isNoContent());
        mvc.perform(delete(url + "/" + commentId).header("Authorization", alex))
                .andExpect(status().isNotFound());
    }

    @Test
    void unknownDogIsNotFound() throws Exception {
        mvc.perform(get("/api/dogs/999999/comments")).andExpect(status().isNotFound());
    }
}
