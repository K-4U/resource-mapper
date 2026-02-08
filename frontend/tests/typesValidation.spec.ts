import { describe, expect, it } from 'vitest'
import {
  parseServiceIdentifier,
  validateGroupInfo,
  validateServiceDefinition
} from '~/types'

describe('parseServiceIdentifier', () => {
  it('parses valid string identifiers', () => {
    const result = parseServiceIdentifier('group-a/service-1', 'unit-test')
    expect(result).toEqual({ groupId: 'group-a', serviceId: 'service-1' })
  })

  it('throws when missing service id', () => {
    expect(() => parseServiceIdentifier('group-a', 'unit-test')).toThrow(
      "Invalid targetIdentifier for unit-test: must be in format 'group/service-id'"
    )
  })

  it('throws for legacy brace notation', () => {
    expect(() => parseServiceIdentifier('service{group}', 'unit-test')).toThrow(
      "Invalid targetIdentifier for unit-test: legacy 'service{group}' format is not supported"
    )
  })

  it('throws when object is missing required properties', () => {
    expect(() => parseServiceIdentifier({ groupId: 'group-a' }, 'unit-test')).toThrow(
      "Invalid targetIdentifier for unit-test: must be a string 'group/service' or an object with groupId and serviceId"
    )
  })
})

describe('validateServiceDefinition', () => {
  const baseService = {
    friendlyName: 'Gateway',
    serviceType: 'LAMBDA',
    description: 'Handles requests'
  }

  it('returns normalized service with empty outgoing connections when none provided', () => {
    const result = validateServiceDefinition(baseService, 'api/gateway')
    expect(result).toEqual({
      friendlyName: 'Gateway',
      description: 'Handles requests',
      serviceType: 'LAMBDA',
      identifier: 'api/gateway',
      outgoingConnections: undefined,
      incomingConnections: [],
      groupName: ''
    })
  })

  it('throws when friendlyName missing', () => {
    expect(() => validateServiceDefinition({ serviceType: 'LAMBDA' }, 'api/bad')).toThrow(
      'Invalid friendlyName for api/bad: must be a non-empty string'
    )
  })

  it('throws when serviceType invalid', () => {
    expect(() => validateServiceDefinition({ friendlyName: 'Bad', serviceType: 'UNKNOWN' }, 'api/bad')).toThrow(
      /Invalid serviceType for api\/bad: must be one of/
    )
  })

  it('normalizes and validates outgoing connections', () => {
    const result = validateServiceDefinition(
      {
        ...baseService,
        outgoingConnections: [
          {
            connectionType: 'CALLS',
            targetIdentifier: 'core/data-service',
            description: 'Requests data'
          }
        ]
      },
      'api/gateway'
    )

    expect(result.outgoingConnections).toEqual([
      {
        connectionType: 'CALLS',
        targetIdentifier: { groupId: 'core', serviceId: 'data-service' },
        description: 'Requests data'
      }
    ])
  })

  it('rejects outgoingConnections when not an array', () => {
    expect(() =>
      validateServiceDefinition(
        { ...baseService, outgoingConnections: 'invalid' },
        'api/gateway'
      )
    ).toThrow('Invalid outgoingConnections for api/gateway: must be an array')
  })

  it('rejects outgoing connection with invalid connectionType', () => {
    expect(() =>
      validateServiceDefinition(
        {
          ...baseService,
          outgoingConnections: [
            { connectionType: 'BAD', targetIdentifier: 'team/service', description: 'bad' }
          ]
        },
        'api/gateway'
      )
    ).toThrow(/Invalid connectionType for api\/gateway connection 0: must be one of/)
  })

  it('rejects outgoing connection without description', () => {
    expect(() =>
      validateServiceDefinition(
        {
          ...baseService,
          outgoingConnections: [
            { connectionType: 'CALLS', targetIdentifier: 'team/service' }
          ]
        },
        'api/gateway'
      )
    ).toThrow('Invalid description for api/gateway connection 0: must be a non-empty string')
  })
})

describe('validateGroupInfo', () => {
  it('returns normalized group info when valid', () => {
    const result = validateGroupInfo({ name: 'API', description: 'Handles APIs', teamId: 'api-team' }, 'api')
    expect(result).toEqual({ name: 'API', description: 'Handles APIs', teamId: 'api-team', groupName: 'api' })
  })

  it('throws when name missing', () => {
    expect(() => validateGroupInfo({}, 'bad-group')).toThrow(
      'Invalid name for group bad-group: must be a non-empty string'
    )
  })
})
