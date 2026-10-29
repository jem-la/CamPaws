package edu.scu.campaws;

import edu.scu.campaws.domain.User;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class UserTest {
    @Test
    void testCreateUser() {
        User user = new User("jerry", "jerry@scu.edu");

        assertNotNull(user);
    }

    @Test
    void testGetUsername() {
        User user = new User("jerry", "jerry@scu.edu");

        assertEquals("jerry", user.getUsername());
    }

    @Test
    void testGetEmail() {
        User user = new User("jerry", "jerry@scu.edu");

        assertEquals("jerry@scu.edu", user.getEmail());
    }

    @Test
    void testSetUsername() {
        User user = new User("jerry", "jerry@scu.edu");
        user.setUsername("patrick");

        assertEquals("patrick", user.getUsername());
    }

    @Test
    void testSetEmail() {
        User user = new User("jerry", "jerry@scu.edu");
        user.setEmail("patrick@scu.edu");

        assertEquals("patrick@scu.edu", user.getEmail());
    }
}