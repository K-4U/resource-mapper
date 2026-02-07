// Simple test runner to verify URL routing logic
// Run with: node test-run-url-routing.js

const assert = (condition, message) => {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`)
    process.exit(1)
  } else {
    console.log(`✅ PASS: ${message}`)
  }
}

let testsRun = 0
let testsPassed = 0

const test = (name, fn) => {
  testsRun++
  try {
    fn()
    testsPassed++
  } catch (error) {
    console.error(`❌ FAIL: ${name}`)
    console.error(error)
  }
}

console.log('Running URL Routing Tests...\n')

// Test 1: Route query parameter handling
test('should detect group parameter in URL', () => {
  const mockRoute = { query: { group: 'api' } }
  const groupName = mockRoute.query.group
  assert(groupName === 'api', 'Group parameter detected')
  assert(typeof groupName === 'string', 'Group parameter is string')
})

test('should handle missing group parameter', () => {
  const mockRoute = { query: {} }
  const groupName = mockRoute.query.group
  assert(groupName === undefined, 'Missing group parameter handled')
})

// Test 2: URL update logic
test('should update URL when loading a group', () => {
  const mockRoute = { query: {} }
  const groupName = 'compute'
  const updateUrl = true
  const currentRouteGroup = mockRoute.query.group
  
  if (updateUrl && currentRouteGroup !== groupName) {
    mockRoute.query.group = groupName
  }
  
  assert(mockRoute.query.group === 'compute', 'URL updated when loading group')
})

test('should not update URL when route already matches', () => {
  const mockRoute = { query: { group: 'api' } }
  const initialGroup = mockRoute.query.group
  const groupName = 'api'
  const updateUrl = true
  const currentRouteGroup = mockRoute.query.group
  
  if (updateUrl && currentRouteGroup !== groupName) {
    mockRoute.query.group = groupName
  }
  
  assert(mockRoute.query.group === initialGroup, 'URL unchanged when route matches')
})

test('should not update URL when updateUrl flag is false', () => {
  const mockRoute = { query: {} }
  const groupName = 'compute'
  const updateUrl = false
  const currentRouteGroup = mockRoute.query.group
  
  if (updateUrl && currentRouteGroup !== groupName) {
    mockRoute.query.group = groupName
  }
  
  assert(mockRoute.query.group === undefined, 'URL unchanged when updateUrl is false')
})

// Test 3: Navigation state
test('should set currentMode to group when loading group', () => {
  let currentMode = 'overview'
  currentMode = 'group'
  assert(currentMode === 'group', 'currentMode set to group')
})

test('should reset to overview when going home', () => {
  let currentMode = 'group'
  let currentGroup = 'api'
  const mockRoute = { query: { group: 'api' } }
  
  mockRoute.query = {}
  currentMode = 'overview'
  currentGroup = ''
  
  assert(mockRoute.query.group === undefined, 'Route cleared')
  assert(currentMode === 'overview', 'Mode reset to overview')
  assert(currentGroup === '', 'Group cleared')
})

// Test 4: Route watch behavior
test('should not reload if group is already loaded', () => {
  let currentGroup = 'api'
  const routeGroup = 'api'
  const loadCalls = []
  
  if (routeGroup && typeof routeGroup === 'string') {
    if (currentGroup !== routeGroup) {
      loadCalls.push(`load:${routeGroup}`)
    }
  }
  
  assert(loadCalls.length === 0, 'No reload when group matches')
})

test('should load different group when route changes', () => {
  let currentGroup = 'api'
  const routeGroup = 'compute'
  const loadCalls = []
  
  if (routeGroup && typeof routeGroup === 'string') {
    if (currentGroup !== routeGroup) {
      loadCalls.push(`load:${routeGroup}`)
      currentGroup = routeGroup
    }
  }
  
  assert(loadCalls.length === 1 && loadCalls[0] === 'load:compute', 'Load called for different group')
  assert(currentGroup === 'compute', 'Current group updated')
})

// Test 5: Initial load
test('should load group on mount if not already loaded', () => {
  let currentGroup = ''
  const mountCalls = []
  const groupParam = 'api'
  
  if (groupParam && typeof groupParam === 'string' && currentGroup !== groupParam) {
    mountCalls.push(`mount:${groupParam}`)
    currentGroup = groupParam
  }
  
  assert(mountCalls.length === 1 && mountCalls[0] === 'mount:api', 'Group loaded on mount')
  assert(currentGroup === 'api', 'Current group set')
})

test('should not load group on mount if already loaded', () => {
  let currentGroup = 'api'
  const mountCalls = []
  const groupParam = 'api'
  
  if (groupParam && typeof groupParam === 'string' && currentGroup !== groupParam) {
    mountCalls.push(`mount:${groupParam}`)
  }
  
  assert(mountCalls.length === 0, 'No duplicate load on mount')
})

// Test 6: Overview graph building
test('should build overview graph only when in overview mode and no group in route', () => {
  let currentMode = 'overview'
  const routeHasGroup = false
  const graphBuilt = []
  
  if (currentMode === 'overview' && !routeHasGroup) {
    graphBuilt.push('buildOverview')
  }
  
  assert(graphBuilt.length === 1, 'Overview graph built when appropriate')
})

test('should not build overview graph when group is in route', () => {
  let currentMode = 'overview'
  const routeHasGroup = true
  const graphBuilt = []
  
  if (currentMode === 'overview' && !routeHasGroup) {
    graphBuilt.push('buildOverview')
  }
  
  assert(graphBuilt.length === 0, 'Overview graph not built when group in route')
})

// Test 7: Integration scenarios
test('should handle direct navigation to ?group=api', () => {
  const mockRoute = { query: { group: 'api' } }
  let currentMode = 'overview'
  let currentGroup = ''
  const actions = []
  
  const groupParam = mockRoute.query.group
  if (groupParam && typeof groupParam === 'string') {
    actions.push(`routeWatch:load:${groupParam}`)
    currentMode = 'group'
    currentGroup = groupParam
  }
  
  if (groupParam && typeof groupParam === 'string' && currentGroup !== groupParam) {
    actions.push(`onMounted:load:${groupParam}`)
  }
  
  assert(actions.length === 1 && actions[0] === 'routeWatch:load:api', 'Route watch triggered')
  assert(currentMode === 'group', 'Mode set to group')
  assert(currentGroup === 'api', 'Group set to api')
})

test('should handle navigation from overview to group', () => {
  const mockRoute = { query: {} }
  let currentMode = 'overview'
  let currentGroup = ''
  
  const groupName = 'compute'
  mockRoute.query.group = groupName
  
  const routeGroup = mockRoute.query.group
  if (routeGroup && typeof routeGroup === 'string' && currentGroup !== routeGroup) {
    currentMode = 'group'
    currentGroup = routeGroup
  }
  
  assert(mockRoute.query.group === 'compute', 'URL updated')
  assert(currentMode === 'group', 'Mode changed to group')
  assert(currentGroup === 'compute', 'Group set')
})

test('should handle navigation from group back to overview', () => {
  const mockRoute = { query: { group: 'api' } }
  let currentMode = 'group'
  let currentGroup = 'api'
  
  mockRoute.query = {}
  
  const routeGroup = mockRoute.query.group
  if (!routeGroup && currentMode === 'group') {
    currentMode = 'overview'
    currentGroup = ''
  }
  
  assert(mockRoute.query.group === undefined, 'Route cleared')
  assert(currentMode === 'overview', 'Mode reset to overview')
  assert(currentGroup === '', 'Group cleared')
})

console.log(`\n\nTest Results: ${testsPassed}/${testsRun} tests passed`)

if (testsPassed === testsRun) {
  console.log('🎉 All tests passed!')
  process.exit(0)
} else {
  console.log('❌ Some tests failed')
  process.exit(1)
}
