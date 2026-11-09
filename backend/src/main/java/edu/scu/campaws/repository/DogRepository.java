package edu.scu.campaws.repository;

import edu.scu.campaws.domain.DogProfile;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DogRepository extends JpaRepository<DogProfile, Integer> {

    /** Reserves the next dog ID from the database sequence. */
    @Query(value = "SELECT nextval('dogs_dog_id_seq')", nativeQuery = true)
    long nextDogId();

    List<DogProfile> findAllByOrderByDogIdAsc();

    List<DogProfile> findAllByOrderByLikeCountDescDogIdAsc();

    /*
     * Name searches. {@code namePattern} is lower-cased and LIKE-escaped with '\\';
     * an empty pattern matches every dog. (No nullable parameters: Postgres can't infer
     * the type of a null bind value.)
     */
    @Query("""
            SELECT d FROM DogProfile d
            WHERE LOWER(d.name) LIKE CONCAT('%', :namePattern, '%') ESCAPE '\\'
            ORDER BY d.dogId
            """)
    List<DogProfile> searchByName(@Param("namePattern") String namePattern);

    @Query("""
            SELECT d FROM DogProfile d
            WHERE LOWER(d.name) LIKE CONCAT('%', :namePattern, '%') ESCAPE '\\'
              AND d.canBePetted = :canBePetted
            ORDER BY d.dogId
            """)
    List<DogProfile> searchByNameAndPetting(
            @Param("namePattern") String namePattern,
            @Param("canBePetted") boolean canBePetted);

    @Query("SELECT d FROM DogProfile d WHERE LOWER(d.name) = :name ORDER BY d.dogId")
    List<DogProfile> findByNameIgnoreCase(@Param("name") String lowerCaseName);

    /** Dogs last seen within {@code meters} of the point, closest first (PostGIS). */
    @Query(value = """
            SELECT d.* FROM dogs d
            WHERE d.last_seen_point IS NOT NULL
              AND ST_DWithin(
                    d.last_seen_point,
                    ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
                    :meters)
            ORDER BY ST_Distance(
                    d.last_seen_point,
                    ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography),
                    d.dog_id
            """, nativeQuery = true)
    List<DogProfile> findWithinMeters(
            @Param("latitude") double latitude,
            @Param("longitude") double longitude,
            @Param("meters") double meters);

    /** Adds one like in a single UPDATE so concurrent likes are never lost. */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE DogProfile d SET d.likeCount = d.likeCount + 1 "
            + "WHERE d.dogId = :dogId AND d.likeCount < 2147483647")
    int incrementLikes(@Param("dogId") int dogId);
}
