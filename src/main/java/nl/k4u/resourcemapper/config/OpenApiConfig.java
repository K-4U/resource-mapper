package nl.k4u.resourcemapper.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI resourceMapperOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Resource Mapper API")
                .description("API for managing and querying service definitions and their connections")
                .version("1.0.0")
                .contact(new Contact()
                    .name("K-4U")
                    .email("info@k-4u.nl")));
    }
}

