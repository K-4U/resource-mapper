package nl.k4u.resourcemapper.dao;

import jakarta.annotation.PostConstruct;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.k4u.resourcemapper.model.ServiceDefinition;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Repository;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Repository
@Slf4j
@RequiredArgsConstructor
public class ServiceDefinitionDao extends AbstractYamlDao<ServiceDefinition> {
    private final Validator validator;
    private final Map<String, List<ServiceDefinition>> servicesByGroup = new ConcurrentHashMap<>();
    private final Map<String, ServiceDefinition> servicesByIdentifier = new ConcurrentHashMap<>();

    @PostConstruct
    public void loadServices() throws IOException {
        log.info("Loading service definitions from services folder...");

        final PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        final Resource[] serviceResources = resolver.getResources("classpath:services/**/*.yaml");

        for (final Resource resource : serviceResources) {
            // Skip group-info.yaml files
            if (!resource.getFilename().equals("group-info.yaml")) {
                loadServiceFromResource(resource);
            }
        }

        calculateIncomingConnections();

        log.info("Loaded {} services across {} groups", servicesByIdentifier.size(), servicesByGroup.size());
    }

    private void loadServiceFromResource(final Resource resource) {
        try {
            final String path = resource.getURL().getPath();
            final String groupName = extractGroupNameFromPath(path);

            // Extract identifier from filename (e.g., "apache.yaml" -> "apache")
            final String filename = resource.getFilename();
            if (filename == null) {
                throw new IllegalArgumentException("Resource has no filename");
            }
            final String identifier = filename.replace(".yaml", "").replace(".yml", "");

            // Validate identifier format
            if (!identifier.matches("^[a-z][a-z0-9-]*$")) {
                throw new IllegalArgumentException(
                        "Invalid filename '" + filename + "': must be lowercase and use only dashes (e.g., 'my-service.yaml')"
                );
            }

            final ServiceDefinition service = loadYamlResource(resource, ServiceDefinition.class);
            service.setGroupName(groupName);
            service.setIdentifier(identifier);

            // Validate the service definition
            final Set<ConstraintViolation<ServiceDefinition>> violations = validator.validate(service);
            if (!violations.isEmpty()) {
                final String errors = violations.stream()
                        .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                        .collect(Collectors.joining(", "));
                throw new IllegalArgumentException(
                        "Invalid service definition in " + resource.getFilename() + ": " + errors
                );
            }

            // Check for duplicate identifiers
            final String fullIdentifier = service.getFullIdentifier();
            if (servicesByIdentifier.containsKey(fullIdentifier)) {
                throw new IllegalArgumentException(
                        "Duplicate service identifier: " + fullIdentifier
                );
            }

            servicesByGroup.computeIfAbsent(groupName, k -> new ArrayList<>()).add(service);
            servicesByIdentifier.put(fullIdentifier, service);

            log.info("Loaded service: {} ({})", service.getFriendlyName(), fullIdentifier);

        } catch (final Exception e) {
            log.error("Failed to load service from {}: {}", resource.getFilename(), e.getMessage());
            throw new RuntimeException("Failed to load service definitions", e);
        }
    }

    private void calculateIncomingConnections() {
        log.info("Calculating incoming connections for all services...");

        // Clear any existing incoming connections
        servicesByIdentifier.values().forEach(service ->
                service.setIncomingConnections(new ArrayList<>())
        );

        // For each service, process its outgoing connections
        for (final ServiceDefinition sourceService : servicesByIdentifier.values()) {
            if (sourceService.getOutgoingConnections() == null) {
                continue;
            }

            for (final var outgoingConnection : sourceService.getOutgoingConnections()) {
                final String targetId = outgoingConnection.getTargetIdentifier();
                final ServiceDefinition targetService = servicesByIdentifier.get(targetId);

                if (targetService != null) {
                    // Create an incoming connection for the target service
                    final var incomingConnection = new nl.k4u.resourcemapper.model.ServiceConnection();
                    incomingConnection.setConnectionType(outgoingConnection.getConnectionType());
                    incomingConnection.setTargetIdentifier(sourceService.getFullIdentifier());
                    incomingConnection.setDescription(outgoingConnection.getDescription());

                    targetService.getIncomingConnections().add(incomingConnection);
                } else {
                    log.warn("Service {} has connection to non-existent service: {}",
                            sourceService.getFullIdentifier(), targetId);
                }
            }
        }

        final long servicesWithIncoming = servicesByIdentifier.values().stream()
                .filter(s -> s.getIncomingConnections() != null && !s.getIncomingConnections().isEmpty())
                .count();
        log.info("Calculated incoming connections: {} services have incoming connections", servicesWithIncoming);
    }

    public List<ServiceDefinition> findByGroupName(final String groupName) {
        return servicesByGroup.getOrDefault(groupName, Collections.emptyList());
    }

    public Optional<ServiceDefinition> findByIdentifier(final String identifier) {
        return Optional.ofNullable(servicesByIdentifier.get(identifier));
    }

    public List<ServiceDefinition> findByTargetIdentifier(final String targetIdentifier) {
        return servicesByIdentifier.values().stream()
                .filter(service -> service.getOutgoingConnections() != null &&
                        service.getOutgoingConnections().stream()
                                .anyMatch(conn -> conn.getTargetIdentifier().equals(targetIdentifier)))
                .toList();
    }

    public Map<String, List<ServiceDefinition>> findAll() {
        return new HashMap<>(servicesByGroup);
    }

    public Collection<ServiceDefinition> findAllServices() {
        return new ArrayList<>(servicesByIdentifier.values());
    }
}
