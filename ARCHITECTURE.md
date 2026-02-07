# Resource Mapper - Architecture Transformation

## Overview

The Resource Mapper has been transformed from a Spring Boot + Nuxt application into a standalone npm package, similar to EventCatalog. Users can now install the package, define their services in YAML files, and generate a static website for documentation.

## Package Structure

### `packages/resource-mapper/`
The main npm package that will be published.

- **bin/resource-mapper.js** - CLI entry point
- **src/** - TypeScript source code
  - **cli.ts** - Main CLI program with commands
  - **commands/** - Command implementations
    - **dev.ts** - Development server command
    - **generate.ts** - Static site generation command
    - **build.ts** - Build command (alias for generate)
  - **utils/loader.ts** - YAML loading and data processing utilities
  - **types.ts** - TypeScript type definitions
  - **index.ts** - Package exports
- **templates/** - Nuxt frontend templates
  - Frontend code (components, composables, pages, etc.)
  - **services/ResourceService.ts** - Direct data loading and business logic
  - **nuxt.config.ts** - Configured for static site generation
  - **package.json** - Template dependencies (Nuxt, Vue Flow, Quasar, etc.)

## How It Works

### 1. User Project Setup
Users create a project with:
- `package.json` - Depends on `@resource-mapper/core`
- `resource-mapper.config.json` - Configuration (title, directories, etc.)
- `services/` directory - Service YAML files organized by groups
- `teams/` directory - Team YAML files

### 2. Development Workflow
```bash
npm install @resource-mapper/core
resource-mapper dev    # Start dev server with hot reload
```

The `dev` command:
1. Reads configuration from `resource-mapper.config.json`
2. Loads all service and team YAML files
3. Processes them into structured data (services, groups, teams)
4. Copies template files to `.resource-mapper/dev/`
5. Writes JSON data files to `.resource-mapper/dev/data/`
6. Starts Nuxt dev server

### 3. Static Site Generation
```bash
resource-mapper generate   # Generate static HTML/JS/CSS
```

The `generate` command:
1. Loads and processes YAML files (same as dev)
2. Copies templates to `.resource-mapper/temp/`
3. Writes JSON data files
4. Runs `nuxt generate` to create static files
5. Outputs to `.resource-mapper/out/`

The generated site can be deployed to any static hosting (Netlify, Vercel, GitHub Pages, S3, etc.)

## Key Changes from Original Architecture

### Before (Spring Boot + Nuxt)
- Spring Boot backend served REST API
- Generated OpenAPI specification
- Frontend called API at runtime
- Required Java + Node.js to run
- Database/backend needed for hosting

### After (npm Package + Static Site)
- No backend required
- YAML files are the data source
- Static JSON files generated at build time
- Frontend reads from JSON files
- Pure static HTML/JS/CSS output
- Deploy anywhere static files can be hosted

## Frontend Modifications

### `services/ResourceService.ts`
**Direct Data Loading:**
- Loads YAML files directly from `/services/` and `/teams/` directories
- Performs all business logic client-side (connections, contextual incoming)
- Singleton service with comprehensive caching and data processing
- No API wrapper layer - components use ResourceService directly

### `nuxt.config.ts`
**Before:**
- Had runtime config for API base URL
- Dev server on port 3001

**After:**
- No runtime config needed
- All data is static
- Optimized for static generation

## Example Project

Located in `example/`:
- Demonstrates how end-users would use the package
- Contains sample service architecture (API Gateway, services, databases)
- Shows the expected directory structure and YAML format
- Can be used to test the package

## YAML File Formats

### Service Definition (`services/**/*.yaml`)
```yaml
name: api-gateway
displayName: API Gateway
type: gateway
description: Main entry point for all external API requests
connections:
  - target: user-service
    type: uses
    description: Routes user management requests
```

### Group Info (`services/*/group-info.yaml`)
```yaml
name: api
displayName: API Layer
description: Public-facing API services
color: "#3498db"
```

### Team (`teams/*.yaml`)
```yaml
id: backend-team
name: Backend Team
description: Responsible for backend services
groups:
  - api
  - compute
```

## Next Steps to Complete

1. **Install Dependencies** in `packages/resource-mapper/`:
   ```bash
   cd packages/resource-mapper
   npm install
   ```

2. **Build the Package**:
   ```bash
   npm run build
   ```

3. **Test with Example Project**:
   ```bash
   cd ../../example
   npm install
   npm run generate
   ```

4. **Add Missing Functionality**:
   - Implement `nuxt-dev.ts` for dev server
   - Handle Nuxt process spawning correctly
   - Add better error handling
   - Add progress indicators
   - Add file watching for dev mode

5. **Polish**:
   - Add better logging with colors (using chalk)
   - Add validation for YAML schemas
   - Add tests
   - Create CI/CD for publishing to npm

6. **Documentation**:
   - Add more examples
   - Create getting started guide
   - Add deployment guides for various platforms

## Publishing

Once ready, the package can be published to npm:
```bash
cd packages/resource-mapper
npm publish --access public
```

Then users can install it globally or locally:
```bash
npm install -g @resource-mapper/core
# or
npm install --save-dev @resource-mapper/core
```

## Benefits of This Approach

1. **No Backend Required** - Pure static site, easy to host
2. **Fast** - No runtime API calls, everything is pre-generated
3. **Portable** - Works anywhere static files can be served
4. **Simple** - YAML files are easy to write and version control
5. **EventCatalog-style** - Familiar pattern for documentation tools
6. **Offline-capable** - Static site works without internet
7. **Cost-effective** - Can host on free static hosting platforms

## Migration Path

For existing users:
1. Move service definitions from database/backend to YAML files
2. Install the npm package
3. Run generate command
4. Deploy static output
5. Decommission Spring Boot backend

## Hosting Constraint

The generated application must remain a fully static site (HTML/JS/CSS + JSON data) so it can be deployed straight to S3 or any static host. All service and team data needs to be transformed at build time; no runtime backend, serverless functions, or APIs will be available once deployed.
