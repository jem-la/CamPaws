package edu.scu.campaws.repository;

import edu.scu.campaws.domain.UserAccount;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<UserAccount, Integer> {
    @Query("SELECT u FROM UserAccount u WHERE LOWER(u.email) = :email")
    Optional<UserAccount> findByEmail(@Param("email") String email);
}
