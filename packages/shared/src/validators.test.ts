import { describe, it, expect } from 'vitest'
import {
  parseServiceIdentifier,
  validateServiceDefinition,
  validateGroupInfo,
  validateTeam,
} from './validators.js'

// ─── parseServiceIdentifier ───────────────────────────────────────────────────

describe('parseServiceIdentifier', () => {
  describe('string format', () => {
    it.each([
      ['api/gateway',     { groupId: 'api',  serviceId: 'gateway'     }],
      ['data/my-database',{ groupId: 'data', serviceId: 'my-database' }],
      ['frontend/site',   { groupId: 'frontend', serviceId: 'site'    }],
    ])('parses "%s" into the correct ServiceIdentifier', (input, expected) => {
      expect(parseServiceIdentifier(input, 'test')).toEqual(expected)
    })

    it.each([
      ['gateway{api}', 'conn 0', "legacy 'service{group}' format is not supported"],
      ['just-a-name',  'conn 1', "must be in format 'group/service-id'"],
      ['/service',     'conn 2', "must be in format 'group/service-id'"],
      ['group/',       'conn 3', "must be in format 'group/service-id'"],
    ])('throws for invalid string "%s": %s', (input, label, expectedMessage) => {
      expect(() => parseServiceIdentifier(input, label)).toThrow(expectedMessage)
    })
  })

  describe('object format', () => {
    it('accepts a valid { groupId, serviceId } object', () => {
      expect(parseServiceIdentifier({ groupId: 'api', serviceId: 'gateway' }, 'test'))
        .toEqual({ groupId: 'api', serviceId: 'gateway' })
    })

    it.each([
      [{ serviceId: 'gateway' },           'conn 4', 'missing groupId'],
      [{ groupId: 'api' },                 'conn 5', 'missing serviceId'],
      [{ groupId: '', serviceId: 'gateway' }, 'conn 6', 'empty groupId'],
    ])('throws for invalid object (%s)', (input, label) => {
      expect(() => parseServiceIdentifier(input, label)).toThrow(`Invalid targetIdentifier for ${label}`)
    })
  })

  describe('invalid types', () => {
    it.each([
      [null,      'conn 7'],
      [42,        'conn 8'],
      [undefined, 'conn 9'],
      [true,      'conn 10'],
      [[],        'conn 11'],
    ])('throws for %s', (input, label) => {
      expect(() => parseServiceIdentifier(input, label)).toThrow(`Invalid targetIdentifier for ${label}`)
    })
  })
})

// ─── validateServiceDefinition ───────────────────────────────────────────────

describe('validateServiceDefinition', () => {
  const validInput = {
    friendlyName: 'API Gateway',
    serviceType: 'LAMBDA',
    description: 'Handles routing',
  }

  it('returns a correct ServiceDefinition for valid minimal input', () => {
    const result = validateServiceDefinition(validInput, 'api/gateway')
    expect(result.friendlyName).toBe('API Gateway')
    expect(result.serviceType).toBe('LAMBDA')
    expect(result.identifier).toBe('api/gateway')
    expect(result.groupId).toBe('')
    expect(result.incomingConnections).toEqual([])
    expect(result.description).toBe('Handles routing')
  })

  it('description is undefined when not provided', () => {
    const result = validateServiceDefinition({ friendlyName: 'X', serviceType: 'S3' }, 'data/bucket')
    expect(result.description).toBeUndefined()
  })

  it.each([
    [null,    'Invalid service definition for api/x: must be an object'],
    ['bad',   'Invalid service definition for api/x: must be an object'],
    [42,      'Invalid service definition for api/x: must be an object'],
  ])('throws for invalid root input %s', (input, expectedMessage) => {
    expect(() => validateServiceDefinition(input, 'api/x')).toThrow(expectedMessage)
  })

  it.each([
    [{ serviceType: 'S3' },                  'Invalid friendlyName for api/x: must be a non-empty string'],
    [{ friendlyName: '', serviceType: 'S3' }, 'Invalid friendlyName for api/x: must be a non-empty string'],
    [{ friendlyName: 42, serviceType: 'S3' }, 'Invalid friendlyName for api/x: must be a non-empty string'],
    [{ friendlyName: 'X' },                  'Invalid serviceType for api/x'],
    [{ friendlyName: 'X', serviceType: 'UNKNOWN' }, 'Invalid serviceType for api/x'],
  ])('throws for invalid field in %o', (input, expectedMessage) => {
    expect(() => validateServiceDefinition(input, 'api/x')).toThrow(expectedMessage)
  })

  describe('outgoingConnections', () => {
    it('parses valid outgoing connections', () => {
      const result = validateServiceDefinition({
        ...validInput,
        outgoingConnections: [
          { connectionType: 'CALLS', targetIdentifier: 'data/warehouse', description: 'Gets data' },
        ],
      }, 'api/gateway')

      expect(result.outgoingConnections).toHaveLength(1)
      expect(result.outgoingConnections![0]).toEqual({
        connectionType: 'CALLS',
        targetIdentifier: { groupId: 'data', serviceId: 'warehouse' },
        description: 'Gets data',
      })
    })

    it.each([
      [
        { ...validInput, outgoingConnections: 'bad' },
        'Invalid outgoingConnections for api/x: must be an array',
      ],
      [
        { ...validInput, outgoingConnections: [{ connectionType: 'UNKNOWN', targetIdentifier: 'data/x', description: 'x' }] },
        'Invalid connectionType for api/x connection 0',
      ],
      [
        { ...validInput, outgoingConnections: [{ connectionType: 'CALLS', targetIdentifier: 'no-slash', description: 'x' }] },
        "Invalid targetIdentifier for api/x connection 0: must be in format 'group/service-id'",
      ],
      [
        { ...validInput, outgoingConnections: [{ connectionType: 'CALLS', targetIdentifier: 'data/x' }] },
        'Invalid description for api/x connection 0: must be a non-empty string',
      ],
    ])('throws for invalid connection in %o', (input, expectedMessage) => {
      expect(() => validateServiceDefinition(input, 'api/x')).toThrow(expectedMessage)
    })
  })
})

// ─── validateGroupInfo ────────────────────────────────────────────────────────

describe('validateGroupInfo', () => {
  it('returns a correct GroupInfo for valid input', () => {
    expect(validateGroupInfo({ name: 'API Team' }, 'api')).toEqual({
      id: 'api',
      name: 'API Team',
      description: undefined,
      teamId: undefined,
      groupName: 'api',
    })
  })

  it('includes optional description and teamId when provided', () => {
    const result = validateGroupInfo({ name: 'API Team', description: 'Owns the gateway', teamId: 'team-a' }, 'api')
    expect(result.description).toBe('Owns the gateway')
    expect(result.teamId).toBe('team-a')
  })

  it('sets both id and groupName to the groupId argument', () => {
    const result = validateGroupInfo({ name: 'X' }, 'my-group')
    expect(result.id).toBe('my-group')
    expect(result.groupName).toBe('my-group')
  })

  it.each([
    [null, 'Invalid group info for api: must be an object'],
    [42,   'Invalid group info for api: must be an object'],
  ])('throws for invalid root input %s', (input, expectedMessage) => {
    expect(() => validateGroupInfo(input, 'api')).toThrow(expectedMessage)
  })

  it.each([
    [{},          'Invalid name for group api: must be a non-empty string'],
    [{ name: '' }, 'Invalid name for group api: must be a non-empty string'],
    [{ name: 42 }, 'Invalid name for group api: must be a non-empty string'],
  ])('throws for invalid name in %o', (input, expectedMessage) => {
    expect(() => validateGroupInfo(input, 'api')).toThrow(expectedMessage)
  })
})

// ─── validateTeam ─────────────────────────────────────────────────────────────

describe('validateTeam', () => {
  it('returns a correct Team for valid minimal input', () => {
    expect(validateTeam({ name: 'Cloud Shepherds' }, 'cloud-shepherds')).toEqual({
      name: 'Cloud Shepherds',
      description: undefined,
      teamLead: undefined,
      reachability: [],
      teamId: 'cloud-shepherds',
    })
  })

  it('includes optional description and teamLead when provided', () => {
    const result = validateTeam({ name: 'X', description: 'Desc', teamLead: 'Alice' }, 'team-x')
    expect(result.description).toBe('Desc')
    expect(result.teamLead).toBe('Alice')
  })

  it('sets teamId to the teamId argument', () => {
    expect(validateTeam({ name: 'X' }, 'my-team').teamId).toBe('my-team')
  })

  it.each([
    [null,  'Invalid team data for team-x: must be an object'],
    ['bad', 'Invalid team data for team-x: must be an object'],
  ])('throws for invalid root input %s', (input, expectedMessage) => {
    expect(() => validateTeam(input, 'team-x')).toThrow(expectedMessage)
  })

  it.each([
    [{},           'Invalid name for team team-x: must be a non-empty string'],
    [{ name: '' }, 'Invalid name for team team-x: must be a non-empty string'],
  ])('throws for invalid name in %o', (input, expectedMessage) => {
    expect(() => validateTeam(input, 'team-x')).toThrow(expectedMessage)
  })

  describe('reachability', () => {
    it.each([
      [
        [{ channel: 'slack', detail: '#cloud-shepherds' }],
        [{ channel: 'slack', detail: '#cloud-shepherds' }],
      ],
      [
        [{ channel: 'slack', detail: '#team' }, { channel: 'email', detail: 'team@co.com' }],
        [{ channel: 'slack', detail: '#team' }, { channel: 'email', detail: 'team@co.com' }],
      ],
    ])('parses reachability entries %o correctly', (reachability, expected) => {
      const result = validateTeam({ name: 'X', reachability }, 'team-x')
      expect(result.reachability).toEqual(expected)
    })

    it('returns empty reachability when the field is absent', () => {
      expect(validateTeam({ name: 'X' }, 'team-x').reachability).toEqual([])
    })

    it.each([
      [
        ['bad'],
        'Invalid reachability entry #0 for team team-x: must be an object',
      ],
      [
        [{ detail: '#x' }],
        'Invalid reachability channel for team team-x entry #0: must be a non-empty string',
      ],
      [
        [{ channel: 'carrier-pigeon', detail: 'x' }],
        "Invalid reachability channel 'carrier-pigeon' for team team-x entry #0",
      ],
      [
        [{ channel: 'slack' }],
        'Invalid reachability detail for team team-x entry #0: must be a non-empty string',
      ],
      [
        [{ channel: 'slack', detail: '' }],
        'Invalid reachability detail for team team-x entry #0: must be a non-empty string',
      ],
    ])('throws for invalid reachability %o', (reachability, expectedMessage) => {
      expect(() => validateTeam({ name: 'X', reachability }, 'team-x')).toThrow(expectedMessage)
    })

    it('includes the list of allowed channels in the error for an unknown channel', () => {
      expect(() =>
        validateTeam({ name: 'X', reachability: [{ channel: 'fax', detail: 'x' }] }, 'team-x')
      ).toThrow('allowed channels are')
    })
  })
})
