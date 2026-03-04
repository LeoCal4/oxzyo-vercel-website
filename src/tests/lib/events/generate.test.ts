import { describe, it, expect } from 'vitest'
import { generateRecurringInstances } from '@/lib/events/generate'
import type { RecurringRule } from '@/lib/db/schema'

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

const from = new Date('2024-01-01T00:00:00Z')
const to   = new Date('2024-02-29T23:59:59Z')

describe('generateRecurringInstances', () => {
  it('generates weekly Friday dates in a 2-month window', () => {
    const instances = generateRecurringInstances([makeRule()], [], from, to)
    expect(instances.length).toBeGreaterThan(0)
    for (const inst of instances) {
      expect(inst.date.getUTCDay()).toBe(5) // Friday
    }
  })

  it('generates correct bi-weekly Wednesday dates (INTERVAL=2)', () => {
    const rule = makeRule({ rrule: 'FREQ=WEEKLY;INTERVAL=2;BYDAY=WE', dtstart: '2024-01-03' })
    const instances = generateRecurringInstances([rule], [], from, to)
    expect(instances.length).toBeGreaterThan(0)
    for (const inst of instances) {
      expect(inst.date.getUTCDay()).toBe(3) // Wednesday
    }
    // Each consecutive pair should be 14 days apart
    for (let i = 1; i < instances.length; i++) {
      const diffDays = (instances[i].date.getTime() - instances[i - 1].date.getTime()) / 86_400_000
      expect(diffDays).toBe(14)
    }
  })

  it('stops generating at the until date', () => {
    const rule = makeRule({ until: '2024-01-19' })
    const instances = generateRecurringInstances([rule], [], from, to)
    expect(instances.length).toBeGreaterThan(0)
    for (const inst of instances) {
      expect(inst.date.getTime()).toBeLessThanOrEqual(new Date('2024-01-19T23:59:59Z').getTime())
    }
  })

  it('generates no instances for inactive rules', () => {
    const instances = generateRecurringInstances([makeRule({ active: false })], [], from, to)
    expect(instances).toHaveLength(0)
  })

  it('attaches exception: null on generated instances (before exceptions are applied)', () => {
    // No exceptions passed — all instances should have exception: null
    const instances = generateRecurringInstances([makeRule()], [], from, to)
    expect(instances.every((i) => i.exception === null)).toBe(true)
  })

  it('handles multiple rules in one call', () => {
    const r1 = makeRule({ id: 'rule-1', rrule: 'FREQ=WEEKLY;BYDAY=FR' })
    const r2 = makeRule({ id: 'rule-2', rrule: 'FREQ=WEEKLY;BYDAY=SA', dtstart: '2024-01-06' })
    const instances = generateRecurringInstances([r1, r2], [], from, to)
    const r1Instances = instances.filter((i) => i.rule.id === 'rule-1')
    const r2Instances = instances.filter((i) => i.rule.id === 'rule-2')
    expect(r1Instances.length).toBeGreaterThan(0)
    expect(r2Instances.length).toBeGreaterThan(0)
    for (const inst of r2Instances) {
      expect(inst.date.getUTCDay()).toBe(6) // Saturday
    }
  })
})
