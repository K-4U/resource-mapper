package nl.k4u.resourcemapper.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.k4u.resourcemapper.dao.TeamDao;
import nl.k4u.resourcemapper.model.Team;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

/**
 * Service layer for team-related operations.
 * Provides business logic and coordination between controllers and data access.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class TeamService {
    private final TeamDao teamDao;

    /**
     * Retrieves a team by its ID.
     *
     * @param teamId The team identifier (e.g., "platform-team")
     * @return Optional containing the team if found
     */
    public Optional<Team> getTeamById(final String teamId) {
        log.debug("Retrieving team by ID: {}", teamId);
        return teamDao.findByTeamId(teamId);
    }

    /**
     * Retrieves all teams.
     *
     * @return Map of team IDs to Team objects
     */
    public Map<String, Team> getAllTeams() {
        log.debug("Retrieving all teams");
        return teamDao.findAll();
    }
}

