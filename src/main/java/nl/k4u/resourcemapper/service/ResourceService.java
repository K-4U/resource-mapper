package nl.k4u.resourcemapper.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.k4u.resourcemapper.dao.GroupInfoDao;
import nl.k4u.resourcemapper.dao.ServiceDefinitionDao;
import nl.k4u.resourcemapper.model.GroupInfo;
import nl.k4u.resourcemapper.model.ServiceDefinition;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

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
}

