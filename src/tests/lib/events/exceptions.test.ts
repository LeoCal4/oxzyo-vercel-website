import { describe, it, expect } from 'vitest'
import { applyExceptions } from '@/lib/events/exceptions'
import type { RecurringInstance } from '@/types/events'
import type { RecurringRule, RecurringException } from '@/lib/db/schema'

function makeRule(overrides: Partial<RecurringRule> = {}): RecurringRule {
  return {
    id: 'rule-1',
    titleIt: 'Serata Giochi',
    titleEn: null,
    descriptionIt: null,
    descriptionEn: null,
    eventType: 'game_night',
    rrule: 'FREQ=WEEKLY;BYDAY=FR',
    dtstart: '2024-01-05',
    until: null,
    startTime: '20:00:00',
    endTime: null,
    locationText: null,
    useFixedVenue: true,
    imageUrl: null,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

function makeInstance(dateStr: string, rule: RecurringRule = makeRule()): RecurringInstance {
  return { rule, date: new Date(dateStr + 'T00:00:00Z'), exception: null }
}

function makeException(overrides: Partial<RecurringException> = {}): RecurringException {
  return {
    id: 'exc-1',
    ruleId: 'rule-1',
    exceptionDate: '2024-01-12',
    isCancelled: true,
    titleItOverride: null,
    titleEnOverride: null,
    descriptionItOverride: null,
    descriptionEnOverride: null,
    locationTextOverride: null,
    useFixedVenueOverride: null,
    startTimeOverride: null,
    endTimeOverride: null,
    createdAt: new Date(),
    ...overrides,
  }
}

describe('applyExceptions', () => {
  it('removes a cancelled instance', () => {
    const instances = [
      makeInstance('2024-01-05'),
      makeInstance('2024-01-12'),
      makeInstance('2024-01-19'),
    ]
    const exceptions = [makeException({ exceptionDate: '2024-01-12', isCancelled: true })]
    const result = applyExceptions(instances, exceptions)

    expect(result).toHaveLength(2)
    expect(result.map((i) => i.date.toISOString().slice(0, 10))).not.toContain('2024-01-12')
  })

  it('attaches override data to a modified (non-cancelled) instance', () => {
    const instances = [makeInstance('2024-01-12')]
    const exceptions = [
      makeException({
        isCancelled: false,
        titleItOverride: 'Serata Speciale',
        locationTextOverride: 'Nuovo posto',
        startTimeOverride: '19:00:00',
      }),
    ]
    const result = applyExceptions(instances, exceptions)

    expect(result).toHaveLength(1)
    expect(result[0].exception?.titleItOverride).toBe('Serata Speciale')
    expect(result[0].exception?.locationTextOverride).toBe('Nuovo posto')
    expect(result[0].exception?.startTimeOverride).toBe('19:00:00')
  })

  it('ignores exceptions for dates not present in instances', () => {
    const instances = [makeInstance('2024-01-05')]
    const exceptions = [makeException({ exceptionDate: '2024-01-20' })]
    const result = applyExceptions(instances, exceptions)

    // Instance survives; exception for non-existent date is ignored
    expect(result).toHaveLength(1)
    expect(result[0].exception).toBeNull()
  })

  it('passes through instances with no matching exception', () => {
    const instances = [makeInstance('2024-01-05'), makeInstance('2024-01-12')]
    const result = applyExceptions(instances, [])

    expect(result).toHaveLength(2)
    expect(result.every((i) => i.exception === null)).toBe(true)
  })

  it('handles exceptions for different rules independently', () => {
    const rule2 = makeRule({ id: 'rule-2' })
    const instances = [
      makeInstance('2024-01-12', makeRule()),  // rule-1
      makeInstance('2024-01-12', rule2),       // rule-2
    ]
    // Cancels only rule-1's 2024-01-12
    const exceptions = [makeException({ ruleId: 'rule-1', exceptionDate: '2024-01-12' })]
    const result = applyExceptions(instances, exceptions)

    expect(result).toHaveLength(1)
    expect(result[0].rule.id).toBe('rule-2')
  })
})
