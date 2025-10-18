package nl.k4u.resourcemapper.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.util.List;

/**
 * Represents a service definition within the resource mapper system.
 *
 * A service definition contains metadata about a specific service including its type,
 * connections to other services, and organizational grouping. Services are loaded
 * from YAML files in the resources directory and organized by groups (folders).
 */
@Data
@Schema(description = "Complete definition of a service including its configuration and connections")
public class ServiceDefinition {

    @Schema(description = "Human-readable name of the service", example = "MySQL Database")
    @NotNull
    private String friendlyName;

    @Schema(description = "Multi-line description explaining the service's purpose, configuration, and role in the system")
    private String description;

    @Schema(description = "Type of service (e.g., ALB, ECS, DNS, VALKEY)", example = "ECS")
    @NotNull
    private ServiceType serviceType;

    // Identifier is set automatically from filename by the loader
    @Schema(description = "Unique identifier for the service within its group (derived from filename)",
            example = "database")
    @Pattern(regexp = "^[a-z][a-z0-9-]*$",
             message = "Identifier must be lowercase and use only dashes")
    private String identifier;

    @Schema(description = "List of connections this service makes to other services")
    @Valid
    private List<ServiceConnection> outgoingConnections;

    // Set by the loader from folder structure
    @Schema(description = "Name of the group (folder) this service belongs to", example = "web")
    private String groupName;

    /**
     * Gets the fully qualified identifier of this service.
     *
     * @return The full identifier in format "groupName/identifier"
     */
    @Schema(description = "Fully qualified identifier in format 'group/service-id'",
            example = "web/database")
    public String getFullIdentifier() {
        return groupName + "/" + identifier;
    }
}
