package nl.k4u.resourcemapper.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import jakarta.validation.constraints.NotNull;

/**
 * Represents metadata and information about a group of services.
 *
 * Groups organize related services together, typically by team, project, or functional area.
 * Group information is loaded from 'group-info.yaml' files within each group's directory.
 */
@Data
@Schema(description = "Metadata about a group of services including description and team reference")
public class GroupInfo {

    @Schema(description = "Display name of the group", example = "Web Services Team")
    @NotNull
    private String name;

    @Schema(description = "Multi-line description explaining the group's purpose, responsibilities, and scope")
    private String description;

    @Schema(description = "Team ID responsible for this group (references a team in the teams folder)",
            example = "platform-team")
    private String teamId;

    // The group folder name (set by loader)
    @Schema(description = "Internal group identifier (folder name)", example = "web")
    private String groupName;
}
