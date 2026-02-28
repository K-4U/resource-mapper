# Resource mapper - Architecture Atlas

The resource mapper is a tool that helps you to map your resources and their relationships in a visual way. It allows you to create a visual representation of your resources and their relationships, making it easier to understand and manage your resources.
While tools like mermaiduml and graphviz are great for creating diagrams, they can be complex and time-consuming to use. The resource mapper simplifies the process by holding the data in a simple format and generating the diagrams automatically. This allows you to focus on the content of your resources rather than the technical details of creating diagrams.

## Features
- Automatic diagram generation
- Automatic relationship mapping
- Contextual information display

## Usage
See examples in the [examples](examples) folder.

## Installing
TODO: add installation instructions


### Folder structure
All files have their own id. We're using the file system to prevent duplicates.
The folder structure is as follows:
```
data/
 |-- services/
 |       |-- group1/
 |           |-- group-info.yaml
 |           |-- service1.yaml
 |-- teams/
        |-- team1.yaml
```
So for example, if we have a service called "service1" in the "Group1" group, its id would be `group1/service1`.

group-info.yaml example:
```yaml
name: "API Services"
description: |
  Manages serverless API infrastructure with API Gateway and Lambda functions.
  This group handles RESTful API endpoints, authentication, request routing,
  and serverless compute for business logic.
teamId: "interface-architects"
```

This is in itself referring to a team called "interface-architects". The team file would look like this:
```yaml
name: "The Interface Architects"
description: |
  Building bridges between humans and machines since the dawn of APIs.
  From pixels to payloads, we design the experiences that users love.
  Frontend, APIs, and everything in between.
teamLead: "Jordan Lee"
reachability:
  - channel: email
    detail: "interface-architects@k4u.nl"
  - channel: slack
    detail: "#team-interface-architects"
  - channel: phone
    detail: "+31 20 300 4000"
  - channel: pagerduty
    detail: "pagerduty://interface-architects"
  - channel: teams
    detail: "teams://interface-architects-room"
  - channel: pigeon
    detail: "Release the red pigeon from HQ rooftop"
```
There are several channels for reachability. The idea is to have a way to contact the team in case of emergencies or just general questions.

A service file would look like this:
```yaml
friendlyName: "API Gateway"
description: |
  RESTful API Gateway managing HTTP requests and routing to backend Lambda functions.
  
  Provides request/response transformation, authorization, throttling, and API versioning.
  Configured with custom domain, CORS, and request validation.
serviceType: API_GATEWAY
outgoingConnections:
  - targetIdentifier: "api/lambda-users"
    description: "Routes user management requests"
    connectionType: CALLS
  - targetIdentifier: "api/lambda-orders"
    description: "Routes order processing requests"
    connectionType: CALLS
  - targetIdentifier: "api/lambda-products"
    description: "Routes product catalog requests"
    connectionType: CALLS
```
The important part here are the outgoing connections. This is where we define the relationships between the resources. In this case, the API Gateway is calling three Lambda functions: users, orders, and products.
These relationships will be automatically mapped and displayed in the generated diagrams, allowing you to easily see how your resources are connected and interact with each other.

There are several possible connection types and service types. See them all in the [code](packages/shared/src/types.ts) for more details. 

## Contributing
Contributions are welcome! If you have any ideas for new features or improvements, please feel free to submit a pull request or open an issue.

### Getting to run locally
1. Clone the repository
2. Run `npm install` to install the dependencies and build the engine.
3. cd into the examples folder and run `npm run dev` to start the development server.


### Structure
The project is structured as a monorepo with the following packages:
- `shared`: Contains shared types and utilities used across the project.
- `engine`: Contains cli tools to build the resource mapper and transpile the yaml into a json.
- `core`: Contains the core logic for the resource mapper and diagram generation. Also the website.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details