package nl.k4u.resourcemapper.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import nl.k4u.resourcemapper.service.TeamService;
import nl.k4u.resourcemapper.model.Team;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
@Tag(name = "Teams", description = "Team information API")
public class TeamController {
    private final TeamService teamService;

    @GetMapping("/{teamId}")
    @Operation(
            summary = "Get team information by ID",
            description = "Retrieves team information for a specific team ID (e.g., platform-team, web-team)"
    )
    @ApiResponse(responseCode = "200", description = "Successfully retrieved team info")
    @ApiResponse(responseCode = "404", description = "Team not found")
    public ResponseEntity<Team> getTeamById(
            @Parameter(description = "Team ID (lowercase with dashes)", example = "platform-team")
            @PathVariable final String teamId) {
        return teamService.getTeamById(teamId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    @Operation(
            summary = "Get all teams",
            description = "Retrieves all team information"
    )
    @ApiResponse(responseCode = "200", description = "Successfully retrieved all teams")
    public ResponseEntity<Map<String, Team>> getAllTeams() {
        return ResponseEntity.ok(teamService.getAllTeams());
    }
}

