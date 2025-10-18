package nl.k4u.resourcemapper.dao;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.yaml.snakeyaml.Yaml;

import java.io.IOException;

@Slf4j
public abstract class AbstractYamlDao<T> {
    protected final Yaml yaml = new Yaml();

    protected T loadYamlResource(final Resource resource, final Class<T> type) throws IOException {
        return yaml.loadAs(resource.getInputStream(), type);
    }

    protected String extractGroupNameFromPath(final String path) {
        // Extract group name from path like: /services/Web/apache.yaml -> Web
        final String[] parts = path.split("/services/");
        if (parts.length < 2) {
            throw new IllegalArgumentException("Invalid path structure: " + path);
        }
        final String afterServices = parts[1];
        final int slashIndex = afterServices.indexOf('/');
        if (slashIndex == -1) {
            throw new IllegalArgumentException("Invalid path structure: " + path);
        }
        return afterServices.substring(0, slashIndex);
    }
}

