package edu.scu.campaws;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * A throwaway PostGIS database for tests, matching the image in compose.yaml.
 * The container is a bean, so every test class sharing the Spring context shares one database.
 * Test classes using it should also be annotated
 * {@code @Testcontainers(disabledWithoutDocker = true)} so they are skipped without Docker.
 */
@TestConfiguration(proxyBeanMethods = false)
public class PostgisTestDatabase {
    static final DockerImageName POSTGIS =
            DockerImageName.parse("imresamu/postgis:17-3.5").asCompatibleSubstituteFor("postgres");

    @Bean
    @ServiceConnection
    PostgreSQLContainer postgis() {
        return new PostgreSQLContainer(POSTGIS);
    }
}
