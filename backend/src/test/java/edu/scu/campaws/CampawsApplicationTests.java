package edu.scu.campaws;

import edu.scu.campaws.domain.DogProfile;
import edu.scu.campaws.dto.DogProfileResponse;
import edu.scu.campaws.repository.DogRepository;
import edu.scu.campaws.service.DogCatalog;
import edu.scu.campaws.service.SampleDogSeeder;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Full app against PostgreSQL + PostGIS: seeding and the dog HTTP API. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(PostgisTestDatabase.class)
@Testcontainers(disabledWithoutDocker = true)
class CampawsApplicationTests {

    @Autowired
    private DogCatalog catalog;

    @Autowired
    private DogRepository repository;

    @Autowired
    private SampleDogSeeder seeder;

    @Autowired
    private MockMvc mvc;

    @Test
    void seedsSampleDogsOnceWithPhotosAndLocations() {
        repository.deleteAll();
        seeder.run(null);
        seeder.run(null); // second run must not duplicate anything

        List<DogProfile> dogs = catalog.getAllDogProfiles();
        assertEquals(11, dogs.size());
        for (DogProfile dog : dogs) {
            assertFalse(dog.getPhotoUrls().isEmpty(), dog.getName() + " has no photo");
            assertNotNull(dog.getFurColor(), dog.getName() + " has no fur color");
            assertTrue(dog.hasLastSeenLocation(), dog.getName() + " has no location");
        }
        assertFalse(catalog.searchByName("mochi").isEmpty());
        // Every sample dog is on campus, so all are within 1 km of its center.
        assertEquals(11, catalog.findNearbyDogs(37.3490, -121.9395).size());
    }

    @Test
    void responseNoLongerExposesBreed() {
        boolean hasBreed = Arrays.stream(DogProfileResponse.class.getRecordComponents())
                .anyMatch(c -> c.getName().equals("breed"));
        assertFalse(hasBreed);
    }

    @Test
    void createUpdateAndFindNearbyOverHttp() throws Exception {
        repository.deleteAll();

        String created = mvc.perform(post("/api/dogs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "Rex", "photoUrls": ["https://x.test/rex.jpg"],
                                 "pettingPolicy": "yes", "latitude": 37.3496, "longitude": -121.939}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.latitude").value(37.3496))
                .andExpect(jsonPath("$.longitude").value(-121.939))
                .andExpect(jsonPath("$.breed").doesNotExist())
                .andReturn().getResponse().getContentAsString();
        int id = Integer.parseInt(created.replaceAll("(?s).*\"dogId\":(\\d+).*", "$1"));

        mvc.perform(get("/api/dogs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Rex"));
        mvc.perform(get("/api/dogs").param("q", "re").param("canBePetted", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Rex"));
        mvc.perform(get("/api/dogs/leaderboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Rex"));

        mvc.perform(get("/api/dogs/nearby").param("lat", "37.35").param("lng", "-121.94"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Rex"));

        // Editing without coordinates keeps the saved location.
        mvc.perform(put("/api/dogs/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "Rex II", "photoUrls": ["https://x.test/rex.jpg"], "pettingPolicy": "ask"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Rex II"))
                .andExpect(jsonPath("$.latitude").value(37.3496));

        mvc.perform(post("/api/dogs/" + id + "/likes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.likeCount").value(1));
    }

    @Test
    void invalidRequestsAreRejectedAndNothingIsSaved() throws Exception {
        repository.deleteAll();

        mvc.perform(post("/api/dogs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "Rex", "photoUrls": ["https://x.test/rex.jpg"], "latitude": 37.3}
                                """))
                .andExpect(status().isBadRequest());

        mvc.perform(post("/api/dogs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "Rex", "photoUrls": ["https://x.test/rex.jpg"], "pettingPolicy": "maybe"}
                                """))
                .andExpect(status().isBadRequest());

        mvc.perform(get("/api/dogs/nearby").param("lat", "95").param("lng", "0"))
                .andExpect(status().isBadRequest());

        assertEquals(0, catalog.getDogCount());
    }
}
