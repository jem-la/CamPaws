package edu.scu.campaws.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** A login session. The app sends the token in the "Authorization: Bearer ..." header. */
@Entity
@Table(name = "auth_tokens")
public class AuthToken {
    @Id
    @Column(length = 64)
    private String token;

    @Column(name = "user_id", nullable = false)
    private int userId;

    protected AuthToken() { }

    public AuthToken(String token, int userId) {
        this.token = token;
        this.userId = userId;
    }

    public String getToken() { return token; }
    public int getUserId() { return userId; }
}
