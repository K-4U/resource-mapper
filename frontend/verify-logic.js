import { resourceService } from './services/ResourceService'
import { useGroupGraph } from './composables/useGroupGraph'

// Mock fetch for ResourceService
global.fetch = async (path) => {
  if (path.includes('group-info.yaml')) {
    return { text: async () => 'name: Test Group\ndescription: Test Description' }
  }
  if (path.includes('api-gateway.yaml')) {
    return { text: async () => 'friendlyName: API Gateway\noutgoingConnections:\n  - targetIdentifier: compute/alb\n    connectionType: HTTP' }
  }
  if (path.includes('alb.yaml')) {
    return { text: async () => 'friendlyName: ALB\noutgoingConnections: []' }
  }
  return { text: async () => '' }
}

async function testLogic() {
  console.log('--- Testing ResourceService ---')
  const allServices = await resourceService.getAllServices()
  const apiServices = allServices['api'] || []
  const computeServices = allServices['compute'] || []
  
  console.log('API Services:', apiServices.map(s => s.identifier))
  console.log('Compute Services:', computeServices.map(s => s.identifier))
  
  const gateway = apiServices.find(s => s.identifier === 'api-gateway')
  const alb = computeServices.find(s => s.identifier === 'alb')
  
  console.log('ALB Incoming:', alb?.incomingConnections)
  
  console.log('\n--- Testing useGroupGraph ---')
  const { buildGraph } = useGroupGraph()
  const graph = buildGraph(apiServices, allServices, 'api', 'Api')
  
  console.log('Nodes count:', graph.nodes.length)
  console.log('Edges count:', graph.edges.length)
  
  const edges = graph.edges.map(e => `${e.source} -> ${e.target}`)
  console.log('Edges:', edges)
}

testLogic().catch(console.error)
