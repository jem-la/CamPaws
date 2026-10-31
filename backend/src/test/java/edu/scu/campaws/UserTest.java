package edu.scu.campaws;

import edu.scu.campaws.domain.User;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class UserTest {
    @Test
    void createUser() {
        assertNotNull(new User("jerry", "jerry@scu.edu"));
    }

    @Test
    void getUsername() {
        assertEquals("jerry", new User("jerry", "jerry@scu.edu").getUsername());
    }

    @Test
    void getEmail() {
        assertEquals("jerry@scu.edu", new User("jerry", "jerry@scu.edu").getEmail());
    }

    @Test
    void setUsername() {
        User user = new User("jerry", "jerry@scu.edu");
        user.setUsername("alex");
        assertEquals("alex", user.getUsername());
    }

    @Test
    void setEmail() {
        User user = new User("jerry", "jerry@scu.edu");
        user.setEmail("alex@scu.edu");
        assertEquals("alex@scu.edu", user.getEmail());
    }

    @Test
    void rejectsBlankUsername() {
        assertThrows(IllegalArgumentException.class,
                () -> new User("  ", "a@scu.edu"));
    }

    @Test
    void rejectsMalformedEmail() {
        assertThrows(IllegalArgumentException.class,
                () -> new User("alex", "not-an-email"));
    }

    @Test
    void friendIdsAreUnique() {
        User user = new User("alex", "a@scu.edu");
        user.addFriend(2);
        user.addFriend(2);
        assertEquals(1, user.getFriendUserIds().size());
    }

    @Test
    void rejectsNonPositiveFriendId() {
        User user = new User("alex", "a@scu.edu");
        assertThrows(IllegalArgumentException.class, () -> user.addFriend(0));
    }
}