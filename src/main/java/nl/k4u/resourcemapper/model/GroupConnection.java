package nl.k4u.resourcemapper.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

/**
 * Represents a group and its connections to other groups.
 * Used for rendering the high-level group overview on the index page.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Group with its connections to other groups")
public class GroupConnection {

    @Schema(description = "Name of the group", example = "web")
    private String groupName;

    @Schema(description = "Optional description of the group")
    private String description;

    @Schema(description = "Set of group names that this group has connections to", example = "[\"pt\", \"database\"]")
    private Set<String> connectedToGroups;

    @Schema(description = "Number of services in this group", example = "5")
    private int serviceCount;
}

