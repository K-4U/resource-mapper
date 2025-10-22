import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { ServiceDefinition, GroupInfo, Team, ResourceMapperConfig } from '../types.js';

export async function loadConfig(cwd: string): Promise<ResourceMapperConfig> {
  const configPath = path.join(cwd, 'resource-mapper.config.json');
  
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    // Return defaults if config doesn't exist
    return {
      title: 'Resource Mapper',
      description: 'Service Architecture Documentation',
      servicesDir: './services',
      teamsDir: './teams'
    };
  }
}

export async function loadYamlFile<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, 'utf-8');
  return yaml.load(content) as T;
}

export async function findYamlFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const subFiles = await findYamlFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile() && (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Directory doesn't exist, return empty array
  }
  
  return files;
}

function extractGroupNameFromPath(filePath: string, servicesDir: string): string {
  const relativePath = path.relative(servicesDir, filePath);
  const parts = relativePath.split(path.sep);
  return parts[0]; // First directory is the group name
}

export async function loadServices(servicesDir: string): Promise<Map<string, ServiceDefinition>> {
  const services = new Map<string, ServiceDefinition>();
  const yamlFiles = await findYamlFiles(servicesDir);
  
  for (const file of yamlFiles) {
    // Skip group-info.yaml files
    if (file.endsWith('group-info.yaml') || file.endsWith('group-info.yml')) {
      continue;
    }
    
    try {
      const groupName = extractGroupNameFromPath(file, servicesDir);
      const filename = path.basename(file);
      const identifier = filename.replace('.yaml', '').replace('.yml', '');
      
      // Validate identifier format (must be lowercase with dashes only)
      if (!/^[a-z][a-z0-9-]*$/.test(identifier)) {
        console.warn(`Invalid filename '${filename}': must be lowercase and use only dashes (e.g., 'my-service.yaml')`);
        continue;
      }
      
      const service = await loadYamlFile<Partial<ServiceDefinition>>(file);
      
      // Validate required fields
      if (!service.friendlyName) {
        console.warn(`Service in ${filename} is missing required field: friendlyName`);
        continue;
      }
      if (!service.serviceType) {
        console.warn(`Service in ${filename} is missing required field: serviceType`);
        continue;
      }
      
      // Set fields from file path
      service.groupName = groupName;
      service.identifier = identifier;
      
      const fullIdentifier = `${groupName}/${identifier}`;
      
      // Check for duplicates
      if (services.has(fullIdentifier)) {
        throw new Error(`Duplicate service identifier: ${fullIdentifier}`);
      }
      
      services.set(fullIdentifier, service as ServiceDefinition);
      console.log(`Loaded service: ${service.friendlyName} (${fullIdentifier})`);
      
    } catch (error) {
      console.error(`Failed to load service from ${file}:`, error);
    }
  }
  
  // Calculate incoming connections
  calculateIncomingConnections(services);
  
  console.log(`Loaded ${services.size} services`);
  return services;
}

function calculateIncomingConnections(services: Map<string, ServiceDefinition>): void {
  console.log('Calculating incoming connections for all services...');
  
  // Clear any existing incoming connections
  for (const service of services.values()) {
    service.incomingConnections = [];
  }
  
  // For each service, process its outgoing connections
  for (const sourceService of services.values()) {
    if (!sourceService.outgoingConnections) {
      continue;
    }
    
    for (const outgoingConnection of sourceService.outgoingConnections) {
      const targetId = outgoingConnection.targetIdentifier;
      const targetService = services.get(targetId);
      
      if (targetService) {
        // Create an incoming connection for the target service
        if (!targetService.incomingConnections) {
          targetService.incomingConnections = [];
        }
        
        targetService.incomingConnections.push({
          connectionType: outgoingConnection.connectionType,
          targetIdentifier: `${sourceService.groupName}/${sourceService.identifier}`,
          description: outgoingConnection.description
        });
      } else {
        console.warn(`Service ${sourceService.groupName}/${sourceService.identifier} has connection to non-existent service: ${targetId}`);
      }
    }
  }
  
  const servicesWithIncoming = Array.from(services.values())
    .filter(s => s.incomingConnections && s.incomingConnections.length > 0).length;
  console.log(`Calculated incoming connections: ${servicesWithIncoming} services have incoming connections`);
}

export async function loadGroups(servicesDir: string): Promise<Map<string, GroupInfo>> {
  const groups = new Map<string, GroupInfo>();
  
  try {
    const entries = await fs.readdir(servicesDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const groupName = entry.name;
        const groupInfoPath = path.join(servicesDir, groupName, 'group-info.yaml');
        
        try {
          const groupInfo = await loadYamlFile<Partial<GroupInfo>>(groupInfoPath);
          
          // Validate required fields
          if (!groupInfo.name) {
            console.warn(`Group info in ${groupName}/group-info.yaml is missing required field: name`);
            continue;
          }
          
          // Set groupName from folder structure
          groupInfo.groupName = groupName;
          
          groups.set(groupName, groupInfo as GroupInfo);
          console.log(`Loaded group: ${groupInfo.name} (${groupName})`);
        } catch (error) {
          // group-info.yaml doesn't exist for this directory, skip silently
        }
      }
    }
  } catch (error) {
    // Services directory doesn't exist
  }
  
  return groups;
}

export async function loadTeams(teamsDir: string): Promise<Map<string, Team>> {
  const teams = new Map<string, Team>();
  const yamlFiles = await findYamlFiles(teamsDir);
  
  for (const file of yamlFiles) {
    try {
      const filename = path.basename(file);
      const teamId = filename.replace('.yaml', '').replace('.yml', '');
      
      const team = await loadYamlFile<Partial<Team>>(file);
      
      // Validate required fields
      if (!team.name) {
        console.warn(`Team in ${filename} is missing required field: name`);
        continue;
      }
      
      // Set teamId from filename
      team.teamId = teamId;
      
      teams.set(teamId, team as Team);
      console.log(`Loaded team: ${team.name} (${teamId})`);
    } catch (error) {
      console.error(`Failed to load team from ${file}:`, error);
    }
  }
  
  return teams;
}

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function copyDir(src: string, dest: string): Promise<void> {
  await ensureDir(dest);
  const entries = await fs.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

