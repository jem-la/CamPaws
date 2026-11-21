package edu.scu.campaws.service;

import edu.scu.campaws.domain.DogProfile;
import edu.scu.campaws.repository.DogRepository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class LikeService {
    private final JdbcTemplate jdbc;
    private final DogRepository dogs;
    private final DogCatalog catalog;

    public LikeService(JdbcTemplate jdbc, DogRepository dogs, DogCatalog catalog) {
        this.jdbc = jdbc;
        this.dogs = dogs;
        this.catalog = catalog;
    }

    @Transactional
    public DogProfile like(int dogId, int userId) {
        catalog.requireById(dogId);
        int inserted = jdbc.update(
                "INSERT INTO dog_likes (dog_id, user_id) VALUES (?, ?) ON CONFLICT DO NOTHING", dogId, userId);
        if (inserted == 1) {
            dogs.incrementLikes(dogId);
        }
        return catalog.requireById(dogId);
    }

    @Transactional
    public DogProfile unlike(int dogId, int userId) {
        catalog.requireById(dogId);
        int removed = jdbc.update("DELETE FROM dog_likes WHERE dog_id = ? AND user_id = ?", dogId, userId);
        if (removed == 1) {
            dogs.decrementLikes(dogId);
        }
        return catalog.requireById(dogId);
    }

    @Transactional(readOnly = true)
    public List<Integer> likedDogIds(int userId) {
        return jdbc.queryForList(
                "SELECT dog_id FROM dog_likes WHERE user_id = ? ORDER BY dog_id", Integer.class, userId);
    }
}
