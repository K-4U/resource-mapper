# Quick Start Guide - Resource Mapper Frontend

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure API Endpoint
Edit `.env` file:
```env
API_BASE_URL=http://localhost:8080/api
```

### 3. Start Development Server
```bash
npm run dev
```

Application runs at: **http://localhost:3000**

---

## 🔧 Backend Configuration Required

### Enable CORS in Spring Boot

Add this configuration to your Spring Boot application:

```java
package nl.k4u.resourcemapper.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;

@Configuration
public class CorsConfig {
    
    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.setAllowedOrigins(Arrays.asList("http://localhost:3000"));
        config.setAllowedHeaders(Arrays.asList("*"));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        
        return new CorsFilter(source);
    }
}
```

Or add to your `ServiceController.java`:
```java
@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api")
public class ServiceController {
    // ... existing code
}
```

---

## 📋 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run generate` - Generate static site

---

## 🎨 Features

### ✅ What Works Out of the Box

1. **Full CSS Control** - Every element is fully stylable
2. **Draggable Groups & Nodes** - Move everything around
3. **Attached Labels** - Labels stick to the top of groups
4. **Interactive Legend** - Shows in bottom-right corner
5. **Themes** - PrimeVue theme support
6. **Vue Compatible** - Built with Vue 3 + Nuxt 3
7. **No Overlaps** - Smart positioning with Vue Flow
8. **Modern Browsers** - Works everywhere

### 🎯 Navigation

- **Index Page** (`/`) - Shows all groups and their connections
- **Group Page** (`/group/{groupName}`) - Shows services within a group
- Click on any group to drill down

### 🎨 Customization

Edit `assets/css/main.css` to change colors:

```css
:root {
  --group-internal-bg: rgba(227, 242, 253, 0.4);
  --group-internal-border: #1976d2;
  /* Change any color variable */
}
```

---

## 🐛 Troubleshooting

### API Connection Failed

1. Make sure Spring Boot is running on port 8080
2. Check CORS is configured (see above)
3. Verify API_BASE_URL in `.env`

### TypeScript Errors in IDE

These are expected before the dev server starts. Nuxt auto-imports Vue composables, so they resolve at runtime.

### Port Already in Use

Change the port:
```bash
PORT=3001 npm run dev
```

---

## 📦 Dependencies

- **@vue-flow/core** - Main graph library
- **@vue-flow/background** - Background patterns
- **@vue-flow/controls** - Zoom/pan controls
- **@vue-flow/minimap** - Mini overview map
- **primevue** - UI components
- **@primevue/nuxt-module** - Nuxt integration

---

## 🔄 Migration from Cytoscape

### What's Better?

| Feature | Cytoscape | Vue Flow |
|---------|-----------|----------|
| Label positioning | Limited (top-center only) | **Full control** |
| CSS customization | Basic | **Complete** |
| Group styling | Limited | **Full HTML/CSS** |
| Draggable groups | No | **Yes** |
| Vue integration | Wrapper needed | **Native** |
| Theming | Manual | **Built-in** |
| Bundle size | ~400KB | **~70KB** |

### Your Requirements ✅

- ✅ Groups - Full support
- ✅ Full CSS control - Yes
- ✅ Labels attached to groups - Yes
- ✅ Draggable groups - Yes
- ✅ Legend - Custom component
- ✅ Browser support - All modern browsers
- ✅ Themes - PrimeVue themes
- ✅ Vue compatible - Built with Vue 3

---

## 🚀 Next Steps

1. Start the dev server
2. Add CORS config to Spring Boot
3. Start Spring Boot backend
4. Visit http://localhost:3000
5. Customize colors/styling as needed

Enjoy your new Vue Flow-based Resource Mapper! 🎉

