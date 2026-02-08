import { describe, expect, it } from 'vitest'
import { TEAM_REACH_CHANNELS, validateTeam } from '~/types'

describe('validateTeam', () => {
  const baseData = {
    name: 'Ops Guardians',
    description: 'Keeps production happy',
    teamLead: 'Alex'
  }

  it('accepts valid reachability entries', () => {
    const result = validateTeam(
      {
        ...baseData,
        reachability: [
          { channel: 'email', detail: 'ops@example.com' },
          { channel: 'phone', detail: '+1-555-0100' }
        ]
      },
      'ops-guardians'
    )

    expect(result.reachability).toEqual([
      { channel: 'email', detail: 'ops@example.com' },
      { channel: 'phone', detail: '+1-555-0100' }
    ])
  })

  it('rejects invalid reachability channel with allowed list', () => {
    const attempt = () =>
      validateTeam(
        {
          ...baseData,
          reachability: [
            { channel: 'fax', detail: '12345' }
          ]
        },
        'bad-team'
      )

    expect(attempt).toThrow(
      `allowed channels are ${TEAM_REACH_CHANNELS.join(', ')}`
    )
  })

  it('rejects reachability entries missing detail', () => {
    const attempt = () =>
      validateTeam(
        {
          ...baseData,
          reachability: [
            { channel: 'email', detail: '' }
          ]
        },
        'missing-detail'
      )

    expect(attempt).toThrow('Invalid reachability detail for team missing-detail entry #0')
  })

  it('rejects reachability entry that is not an object', () => {
    const attempt = () =>
      validateTeam(
        {
          ...baseData,
          reachability: ['email']
        },
        'bad-entry'
      )

    expect(attempt).toThrow('Invalid reachability entry #0 for team bad-entry: must be an object')
  })
})
