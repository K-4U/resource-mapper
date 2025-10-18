package nl.k4u.resourcemapper.dao;

import jakarta.annotation.PostConstruct;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.k4u.resourcemapper.model.GroupInfo;
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
public class GroupInfoDao extends AbstractYamlDao<GroupInfo> {
    private final Validator validator;
    private final Map<String, GroupInfo> groupInfoByGroup = new ConcurrentHashMap<>();

    @PostConstruct
    public void loadGroupInfo() throws IOException {
        log.info("Loading group info from services folder...");

        final PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        final Resource[] groupInfoResources = resolver.getResources("classpath:services/**/group-info.yaml");

        for (final Resource resource : groupInfoResources) {
            loadGroupInfoFromResource(resource);
        }

        log.info("Loaded {} groups", groupInfoByGroup.size());
    }

    private void loadGroupInfoFromResource(final Resource resource) {
        try {
            final String path = resource.getURL().getPath();
            final String groupName = extractGroupNameFromPath(path);

            final GroupInfo groupInfo = loadYamlResource(resource, GroupInfo.class);
            groupInfo.setGroupName(groupName);

            // Validate the group info
            final Set<ConstraintViolation<GroupInfo>> violations = validator.validate(groupInfo);
            if (!violations.isEmpty()) {
                final String errors = violations.stream()
                    .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                    .collect(Collectors.joining(", "));
                throw new IllegalArgumentException(
                    "Invalid group info in " + resource.getFilename() + ": " + errors
                );
            }

            groupInfoByGroup.put(groupName, groupInfo);
            log.info("Loaded group info: {} (group: {})", groupInfo.getName(), groupName);

        } catch (final Exception e) {
            log.error("Failed to load group info from {}: {}", resource.getFilename(), e.getMessage());
            throw new RuntimeException("Failed to load group info", e);
        }
    }

    public Optional<GroupInfo> findByGroupName(final String groupName) {
        return Optional.ofNullable(groupInfoByGroup.get(groupName));
    }

    public Map<String, GroupInfo> findAll() {
        return new HashMap<>(groupInfoByGroup);
    }
}

