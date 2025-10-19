package nl.k4u.resourcemapper.dao;

import jakarta.annotation.PostConstruct;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.k4u.resourcemapper.model.Team;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Repository;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Repository
@Slf4j
@RequiredArgsConstructor
public class TeamDao extends AbstractYamlDao<Team> {
    private static final Pattern VALID_TEAM_ID_PATTERN = Pattern.compile("^[a-z0-9]+(-[a-z0-9]+)*$");

    private final Validator validator;
    private final Map<String, Team> teamsByTeamId = new ConcurrentHashMap<>();

    @PostConstruct
    public void loadTeams() throws IOException {
        log.info("Loading teams from teams folder...");

        final PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        final Resource[] teamResources = resolver.getResources("classpath:teams/*.yaml");

        for (final Resource resource : teamResources) {
            loadTeamFromResource(resource);
        }

        log.info("Loaded {} teams", teamsByTeamId.size());
    }

    private void loadTeamFromResource(final Resource resource) {
        try {
            final String filename = resource.getFilename();
            if (filename == null) {
                throw new IllegalArgumentException("Resource has no filename");
            }

            final String teamId = filename.replace(".yaml", "");

            // Validate team ID format (lowercase with dashes only)
            if (!VALID_TEAM_ID_PATTERN.matcher(teamId).matches()) {
                throw new IllegalArgumentException(
                    "Invalid team ID format: " + teamId +
                    ". Team IDs must be lowercase with dashes (no spaces or underscores)"
                );
            }

            final Team team = loadYamlResource(resource, Team.class);
            team.setTeamId(teamId);

            // Validate the team
            final Set<ConstraintViolation<Team>> violations = validator.validate(team);
            if (!violations.isEmpty()) {
                final String errors = violations.stream()
                    .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                    .collect(Collectors.joining(", "));
                throw new IllegalArgumentException(
                    "Invalid team in " + filename + ": " + errors
                );
            }

            teamsByTeamId.put(teamId, team);
            log.info("Loaded team: {} (id: {})", team.getName(), teamId);

        } catch (final Exception e) {
            log.error("Failed to load team from {}: {}", resource.getFilename(), e.getMessage());
            throw new RuntimeException("Failed to load team", e);
        }
    }

    public Optional<Team> findByTeamId(final String teamId) {
        return Optional.ofNullable(teamsByTeamId.get(teamId));
    }

    public Map<String, Team> findAll() {
        return new HashMap<>(teamsByTeamId);
    }
}

