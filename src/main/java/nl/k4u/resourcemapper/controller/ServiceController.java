package nl.k4u.resourcemapper.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import nl.k4u.resourcemapper.model.ServiceDefinition;
import nl.k4u.resourcemapper.model.GroupInfo;
import nl.k4u.resourcemapper.service.ResourceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Services & Groups", description = "Service and group management API")
public class ServiceController {
    private final ResourceService resourceService;

    @GetMapping("/services/group/{groupName}")
    @Operation(
        summary = "Get all services for a group",
        description = "Retrieves all service definitions for a specific group (folder)"
    )
    @ApiResponse(responseCode = "200", description = "Successfully retrieved services")
    public ResponseEntity<List<ServiceDefinition>> getServicesByGroup(
            @Parameter(description = "Name of the group (folder name)")
            @PathVariable final String groupName) {
        final List<ServiceDefinition> services = resourceService.getServicesByGroup(groupName);
        return ResponseEntity.ok(services);
    }

    @GetMapping("/services/connected-to/{serviceIdentifier}")
    @Operation(
        summary = "Get all services connected to a specific service",
        description = "Retrieves all services that have connections to the specified service identifier (format: group/service-id)"
    )
    @ApiResponse(responseCode = "200", description = "Successfully retrieved connected services")
    public ResponseEntity<List<ServiceDefinition>> getServicesConnectedTo(
            @Parameter(description = "Service identifier in format: group/service-id")
            @PathVariable final String serviceIdentifier) {
        final List<ServiceDefinition> services = resourceService.getServicesConnectedTo(serviceIdentifier);
        return ResponseEntity.ok(services);
    }

    @GetMapping("/services/{serviceIdentifier}")
    @Operation(
        summary = "Get a specific service by identifier",
        description = "Retrieves a service definition by its full identifier (format: group/service-id)"
    )
    @ApiResponse(responseCode = "200", description = "Successfully retrieved service")
    @ApiResponse(responseCode = "404", description = "Service not found")
    public ResponseEntity<ServiceDefinition> getServiceByIdentifier(
            @Parameter(description = "Service identifier in format: group/service-id")
            @PathVariable final String serviceIdentifier) {
        return resourceService.getServiceByIdentifier(serviceIdentifier)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/services")
    @Operation(
        summary = "Get all services grouped by group",
        description = "Retrieves all service definitions organized by group"
    )
    @ApiResponse(responseCode = "200", description = "Successfully retrieved all services")
    public ResponseEntity<Map<String, List<ServiceDefinition>>> getAllServices() {
        return ResponseEntity.ok(resourceService.getAllServices());
    }

    @GetMapping("/groups/{groupName}")
    @Operation(
        summary = "Get group information",
        description = "Retrieves metadata for a specific group"
    )
    @ApiResponse(responseCode = "200", description = "Successfully retrieved group info")
    @ApiResponse(responseCode = "404", description = "Group info not found")
    public ResponseEntity<GroupInfo> getGroupInfo(
            @Parameter(description = "Name of the group")
            @PathVariable final String groupName) {
        return resourceService.getGroupInfo(groupName)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/groups")
    @Operation(
        summary = "Get all group information",
        description = "Retrieves metadata for all groups"
    )
    @ApiResponse(responseCode = "200", description = "Successfully retrieved all group info")
    public ResponseEntity<Map<String, GroupInfo>> getAllGroupInfo() {
        return ResponseEntity.ok(resourceService.getAllGroupInfo());
    }
}

