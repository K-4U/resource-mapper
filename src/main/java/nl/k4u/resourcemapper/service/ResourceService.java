package nl.k4u.resourcemapper.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.k4u.resourcemapper.dao.GroupInfoDao;
import nl.k4u.resourcemapper.dao.ServiceDefinitionDao;
import nl.k4u.resourcemapper.model.GroupConnection;
import nl.k4u.resourcemapper.model.GroupInfo;
import nl.k4u.resourcemapper.model.ServiceDefinition;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class ResourceService {
    private final ServiceDefinitionDao serviceDefinitionDao;
    private final GroupInfoDao groupInfoDao;

    @PostConstruct
    public void validateConnections() {
        log.info("Validating service connections...");

        for (final ServiceDefinition service : serviceDefinitionDao.findAllServices()) {
            if (service.getOutgoingConnections() != null) {
                for (final var connection : service.getOutgoingConnections()) {
                    if (serviceDefinitionDao.findByIdentifier(connection.getTargetIdentifier()).isEmpty()) {
                        log.warn("Service {} references non-existent target: {}",
                                service.getFullIdentifier(),
                                connection.getTargetIdentifier());
                    }
                }
            }
        }
    }

    public List<ServiceDefinition> getServicesByGroup(final String groupName) {
        return serviceDefinitionDao.findByGroupName(groupName);
    }

    public List<ServiceDefinition> getServicesConnectedTo(final String serviceIdentifier) {
        return serviceDefinitionDao.findByTargetIdentifier(serviceIdentifier);
    }

    public Optional<ServiceDefinition> getServiceByIdentifier(final String identifier) {
        return serviceDefinitionDao.findByIdentifier(identifier);
    }

    public Map<String, List<ServiceDefinition>> getAllServices() {
        return serviceDefinitionDao.findAll();
    }

    public Optional<GroupInfo> getGroupInfo(final String groupName) {
        return groupInfoDao.findByGroupName(groupName);
    }

    public Map<String, GroupInfo> getAllGroupInfo() {
        return groupInfoDao.findAll();
    }

    public List<GroupConnection> getAllGroupConnections() {
        final Map<String, List<ServiceDefinition>> allServices = serviceDefinitionDao.findAll();
        final Map<String, GroupInfo> allGroupInfo = groupInfoDao.findAll();

        return allServices.entrySet().stream()
                .map(entry -> {
                    final String groupName = entry.getKey();
                    final List<ServiceDefinition> services = entry.getValue();

                    // Find all groups this group connects to
                    final java.util.Set<String> connectedToGroups = services.stream()
                            .filter(service -> service.getOutgoingConnections() != null)
                            .flatMap(service -> service.getOutgoingConnections().stream())
                            .map(connection -> connection.getTargetIdentifier().split("/")[0])
                            .filter(targetGroup -> !targetGroup.equals(groupName))
                            .collect(java.util.stream.Collectors.toSet());

                    // Get display name and description from GroupInfo if available
                    final GroupInfo groupInfo = allGroupInfo.get(groupName);
                    final String description = groupInfo != null ? groupInfo.getDescription() : null;

                    return new GroupConnection(
                            groupName,
                            description,
                            connectedToGroups,
                            services.size()
                    );
                })
                .sorted(java.util.Comparator.comparing(GroupConnection::getGroupName))
                .toList();
    }

    public List<ServiceDefinition> getServicesByTeamId(final String teamId) {
        log.debug("Retrieving services for team: {}", teamId);

        // Find all groups managed by this team
        final List<String> teamGroups = groupInfoDao.findAll().entrySet().stream()
                .filter(entry -> teamId.equals(entry.getValue().getTeamId()))
                .map(Map.Entry::getKey)
                .toList();

        log.debug("Found {} groups for team {}: {}", teamGroups.size(), teamId, teamGroups);

        // Get all services from those groups
        return teamGroups.stream()
                .flatMap(groupName -> serviceDefinitionDao.findByGroupName(groupName).stream())
                .collect(Collectors.toList());
    }

    public List<GroupInfo> getGroupsByTeamId(final String teamId) {
        log.debug("Retrieving groups for team: {}", teamId);

        return groupInfoDao.findAll().values().stream()
                .filter(groupInfo -> teamId.equals(groupInfo.getTeamId()))
                .collect(Collectors.toList());
    }
}
