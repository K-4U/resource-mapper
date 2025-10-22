# Resource Mapper

A tool to visualize and document service dependencies from YAML files, similar to EventCatalog.

## Installation

```bash
npm install @resource-mapper/core
```

## Usage

### Initialize a project

Create a new directory for your documentation project:

```bash
mkdir my-services-docs
cd my-services-docs
npm init -y
npm install @resource-mapper/core
```

### Create a configuration file

Create `resource-mapper.config.json`:

```json
{
  "title": "My Services Documentation",
  "description": "Documentation for our microservices architecture",
  "servicesDir": "./services",
  "teamsDir": "./teams"
}
```

### Define your services

Create YAML files in the `services` directory organized by groups:

```yaml
# services/api/api-gateway.yaml
friendlyName: "API Gateway"
description: |
  RESTful API Gateway managing HTTP requests and routing to backend Lambda functions.
  Provides request/response transformation, authorization, throttling, and API versioning.
serviceType: API_GATEWAY
outgoingConnections:
  - targetIdentifier: "api/lambda-users"
    description: "Routes user management requests"
    connectionType: CALLS
  - targetIdentifier: "compute/user-service"
    description: "Routes to user service"
    connectionType: CALLS
```

**Important Notes:**
- The filename (without `.yaml`) becomes the service identifier (e.g., `api-gateway.yaml` → `api-gateway`)
- Filenames must be lowercase with dashes only (e.g., `my-service.yaml`)
- The folder name becomes the group name (e.g., `services/api/` → group `api`)
- Full identifier is `groupName/identifier` (e.g., `api/api-gateway`)
- Use full identifiers in `targetIdentifier` for connections

### Define group information

Create `group-info.yaml` in each service group directory:

```yaml
# services/api/group-info.yaml
name: "API Services"
description: |
  Manages serverless API infrastructure with API Gateway and Lambda functions.
  This group handles RESTful API endpoints, authentication, and request routing.
teamId: "interface-architects"
```

### Define teams

Create team files in the `teams` directory:

```yaml
# teams/backend-team.yaml
name: "Backend Team"
description: |
  Responsible for backend services, APIs, and business logic.
  This team owns the compute and API service groups.
teamLead: "Jane Smith"
email: "backend-team@company.com"
slackChannel: "#team-backend"
oncallPhone: "+31 20 765 4321"
```

**Note:** The filename (without `.yaml`) becomes the team ID (e.g., `backend-team.yaml` → `backend-team`)

### Generate documentation

Run the generate command to create a static site:

```bash
npx resource-mapper generate
```

This will create a static site in `./.resource-mapper/out` that you can deploy to any static hosting service.

### Development mode

For development with hot reload:

```bash
npx resource-mapper dev
```

## Commands

- `resource-mapper dev` - Start development server with hot reload
- `resource-mapper generate` - Generate static site
- `resource-mapper build` - Alias for generate

## Service Definition Schema

```typescript
// Connection types
type ConnectionType = 'TCP' | 'PUBLISHES' | 'CALLS' | 'TRIGGERS';

// Service types
type ServiceType = 
  | 'VALKEY' | 'ECS' | 'EC2' | 'API_GATEWAY' | 'ALB' | 'NLB' | 'RDS' | 'ROUTE53'
  | 'LAMBDA' | 'S3' | 'SQS' | 'SNS' | 'DYNAMODB' | 'ELASTICACHE' | 'CLOUDFRONT'
  | 'EVENTBRIDGE' | 'EVENTBRIDGE_RULE' | 'KINESIS' | 'STEP_FUNCTIONS'
  | 'EKS' | 'ECR' | 'SECRETS_MANAGER' | 'COGNITO';

interface ServiceConnection {
  connectionType: ConnectionType  // Required
  targetIdentifier: string         // Required (format: "group/service-id")
  description: string               // Required
}

interface ServiceDefinition {
  friendlyName: string              // Required - human-readable name
  description?: string              // Optional - multi-line description
  serviceType: ServiceType          // Required - type of service
  identifier: string                // Auto-set from filename
  outgoingConnections?: ServiceConnection[]
  incomingConnections?: ServiceConnection[]  // Auto-calculated
  groupName: string                 // Auto-set from folder structure
}
```

**Validation Rules:**
- `friendlyName` and `serviceType` are required in YAML
- `identifier` must be lowercase with dashes only (validated from filename)
- `targetIdentifier` must be in format `group-name/service-identifier`
- `groupName` and `identifier` are automatically set from file location

## Group Info Schema

```typescript
interface GroupInfo {
  name: string          // Required - display name
  description?: string  // Optional - multi-line description
  teamId?: string       // Optional - references team ID
  groupName: string     // Auto-set from folder name
}
```

## Team Schema

```typescript
interface Team {
  name: string          // Required - display name
  description?: string  // Optional - multi-line description
  teamLead?: string     // Optional - team lead name
  email?: string        // Optional - team contact email
  slackChannel?: string // Optional - Slack channel
  oncallPhone?: string  // Optional - on-call phone number
  teamId: string        // Auto-set from filename
}
```

## License

MIT
