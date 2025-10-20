package nl.k4u.resourcemapper.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/**
 * Represents a connection from one service to another.
 *
 * Service connections define the dependencies between services, including the type
 * of connection and a description of the connection's purpose. These connections help
 * visualize service topology and understand system dependencies.
 */
@Data
@Schema(description = "Defines a connection from one service to another")
public class ServiceConnection {

    @Schema(description = "Type of connection (TCP, PUBLISHES, CALLS, TRIGGERS)", example = "TCP")
    @NotNull
    private ConnectionType connectionType;

    @Schema(description = "Fully qualified identifier of the target service in format 'group/service-id'",
            example = "web/database")
    @NotNull
    @Pattern(regexp = "^[a-z][a-z0-9-]*/[a-z][a-z0-9-]*$",
             message = "Target identifier must be in format 'group-name/service-identifier' with lowercase and dashes only")
    private String targetIdentifier;

    @Schema(description = "Human-readable description of what this connection is used for",
            example = "MySQL database connection for user data")
    @NotNull
    private String description;
}
