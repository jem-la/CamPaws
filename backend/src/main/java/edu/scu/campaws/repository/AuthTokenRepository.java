package edu.scu.campaws.repository;

import edu.scu.campaws.domain.AuthToken;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuthTokenRepository extends JpaRepository<AuthToken, String> {
    @Modifying
    @Query("DELETE FROM AuthToken t WHERE t.userId = :userId")
    void deleteByUser(@Param("userId") int userId);
}
