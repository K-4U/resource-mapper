import { ServicesGroupsApi, Configuration } from '~/generated/api/src'
import type { ServiceDefinition, GroupInfo } from '~/generated/api/src'

export const useApi = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase

  // Create API client instance with configuration
  const apiConfig = new Configuration({
    basePath: apiBase.replace('/api', ''), // Remove /api since it's in the OpenAPI spec
  })

  const api = new ServicesGroupsApi(apiConfig)

  const getAllServices = async () => {
    try {
      return await api.getAllServices()
    } catch (error: any) {
      console.error('Failed to fetch all services:', error)
      throw new Error(`API Error: ${error.message || 'Could not connect to backend'}`)
    }
  }

  const getServicesByGroup = async (groupName: string) => {
    try {
      return await api.getServicesByGroup({ groupName })
    } catch (error: any) {
      console.error(`Failed to fetch services for group ${groupName}:`, error)
      throw new Error(`API Error: ${error.message || 'Could not connect to backend'}`)
    }
  }

  const getServiceByIdentifier = async (serviceIdentifier: string) => {
    try {
      return await api.getServiceByIdentifier({ serviceIdentifier })
    } catch (error: any) {
      console.error(`Failed to fetch service ${serviceIdentifier}:`, error)
      throw new Error(`API Error: ${error.message || 'Could not connect to backend'}`)
    }
  }

  const getServicesConnectedTo = async (serviceIdentifier: string) => {
    try {
      return await api.getServicesConnectedTo({ serviceIdentifier })
    } catch (error: any) {
      console.error(`Failed to fetch connected services for ${serviceIdentifier}:`, error)
      throw new Error(`API Error: ${error.message || 'Could not connect to backend'}`)
    }
  }

  const getAllGroupInfo = async () => {
    try {
      return await api.getAllGroupInfo()
    } catch (error: any) {
      console.error('Failed to fetch all group info:', error)
      throw new Error(`API Error: ${error.message || 'Could not connect to backend'}`)
    }
  }

  const getGroupInfo = async (groupName: string) => {
    try {
      return await api.getGroupInfo({ groupName })
    } catch (error: any) {
      console.error(`Failed to fetch group info for ${groupName}:`, error)
      throw new Error(`API Error: ${error.message || 'Could not connect to backend'}`)
    }
  }

  const getAllGroupConnections = async () => {
    try {
      return await api.getAllGroupConnections()
    } catch (error: any) {
      console.error('Failed to fetch group connections:', error)
      throw new Error(`API Error: ${error.message || 'Could not connect to backend'}`)
    }
  }

  return {
    getAllServices,
    getServicesByGroup,
    getServiceByIdentifier,
    getServicesConnectedTo,
    getAllGroupInfo,
    getGroupInfo,
    getAllGroupConnections
  }
}

// Re-export types from generated API
export type { ServiceDefinition, GroupInfo, ServiceConnection } from '~/generated/api/src'
