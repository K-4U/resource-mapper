package nl.k4u.resourcemapper.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Email;

/**
 * Represents a team responsible for managing services and groups.
 *
 * Teams are defined in YAML files in the teams directory.
 * Team IDs must be lowercase with dashes (e.g., platform-team, web-team).
 */
@Data
@Schema(description = "Information about a team responsible for managing services")
public class Team {

    @Schema(description = "Display name of the team", example = "Platform Team")
    @NotNull
    private String name;

    @Schema(description = "Multi-line description of the team's responsibilities and scope")
    private String description;

    @Schema(description = "Name of the team lead", example = "John Smith")
    private String teamLead;

    @Schema(description = "Team contact email", example = "platform-team@k4u.nl")
    @Email
    private String email;

    @Schema(description = "Slack channel for the team", example = "#team-platform")
    private String slackChannel;

    @Schema(description = "On-call phone number", example = "+31 20 765 4321")
    private String oncallPhone;

    @Schema(description = "Team identifier (filename without .yaml)", example = "platform-team")
    private String teamId;
}

