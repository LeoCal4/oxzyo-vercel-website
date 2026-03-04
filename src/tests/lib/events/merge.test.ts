import { describe, it, expect } from 'vitest'
import { mergeAndSortEvents } from '@/lib/events/merge'
import type { Event, RecurringRule } from '@/lib/db/schema'
import type { RecurringInstance } from '@/types/events'

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'event-1',
    titleIt: 'Evento IT',
    titleEn: 'Event EN',
    descriptionIt: null,
    descriptionEn: null,
    eventType: 'game_night',
    date: '2024-01-15',
    startTime: null,
    endTime: null,
    locationText: null,
    useFixedVenue: false,
    imageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

function makeInstance(dateStr: string, titleIt = 'Serata', titleEn = 'Game Night'): RecurringInstance {
  const rule: RecurringRule = {
    id: 'rule-1',
    titleIt,
    titleEn,
    descriptionIt: null,
    descriptionEn: null,
    eventType: 'game_night',
    rrule: 'FREQ=WEEKLY;BYDAY=FR',
    dtstart: '2024-01-05',
    until: null,
    startTime: null,
    endTime: null,
    locationText: null,
    useFixedVenue: true,
    imageUrl: null,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  return { rule, date: new Date(dateStr + 'T00:00:00Z'), exception: null }
}

describe('mergeAndSortEvents', () => {
  it('sorts events ascending by date', () => {
    const oneOff = [
      makeEvent({ id: 'e1', date: '2024-01-20' }),
      makeEvent({ id: 'e2', date: '2024-01-10' }),
    ]
    const result = mergeAndSortEvents(oneOff, [], 'it')
    expect(result[0].date?.toISOString().slice(0, 10)).toBe('2024-01-10')
    expect(result[1].date?.toISOString().slice(0, 10)).toBe('2024-01-20')
  })

  it('places dateless announcements last', () => {
    const oneOff = [
      makeEvent({ id: 'a', date: null, eventType: 'announcement' }),
      makeEvent({ id: 'b', date: '2024-01-10' }),
    ]
    const result = mergeAndSortEvents(oneOff, [], 'it')
    expect(result[0].date).not.toBeNull()
    expect(result[result.length - 1].date).toBeNull()
  })

  it('places multiple dateless announcements all after dated events', () => {
    const oneOff = [
      makeEvent({ id: 'a1', date: null, eventType: 'announcement' }),
      makeEvent({ id: 'b',  date: '2024-01-10' }),
      makeEvent({ id: 'a2', date: null, eventType: 'announcement' }),
    ]
    const result = mergeAndSortEvents(oneOff, [], 'it')
    const firstNullIdx = result.findIndex((e) => e.date === null)
    // All items before firstNullIdx should have a date
    for (let i = 0; i < firstNullIdx; i++) {
      expect(result[i].date).not.toBeNull()
    }
  })

  it('uses Italian fields for locale "it"', () => {
    const oneOff = [makeEvent({ titleIt: 'Italiano', titleEn: 'English' })]
    const result = mergeAndSortEvents(oneOff, [], 'it')
    expect(result[0].title).toBe('Italiano')
  })

  it('uses English fields for locale "en"', () => {
    const oneOff = [makeEvent({ titleIt: 'Italiano', titleEn: 'English' })]
    const result = mergeAndSortEvents(oneOff, [], 'en')
    expect(result[0].title).toBe('English')
  })

  it('falls back to Italian when English title is null', () => {
    const oneOff = [makeEvent({ titleIt: 'Solo Italiano', titleEn: null })]
    const result = mergeAndSortEvents(oneOff, [], 'en')
    expect(result[0].title).toBe('Solo Italiano')
  })

  it('merges one-off and recurring events into one sorted list', () => {
    const oneOff = [makeEvent({ id: 'e1', date: '2024-01-17' })]
    const recurring = [makeInstance('2024-01-12'), makeInstance('2024-01-19')]
    const result = mergeAndSortEvents(oneOff, recurring, 'it')

    expect(result).toHaveLength(3)
    expect(result[0].date?.toISOString().slice(0, 10)).toBe('2024-01-12')
    expect(result[1].date?.toISOString().slice(0, 10)).toBe('2024-01-17')
    expect(result[2].date?.toISOString().slice(0, 10)).toBe('2024-01-19')
  })

  it('applies exception overrides in locale-aware title resolution', () => {
    const instance = makeInstance('2024-01-12', 'Default IT', 'Default EN')
    instance.exception = {
      id: 'exc-1',
      ruleId: 'rule-1',
      exceptionDate: '2024-01-12',
      isCancelled: false,
      titleItOverride: 'Override IT',
      titleEnOverride: 'Override EN',
      descriptionItOverride: null,
      descriptionEnOverride: null,
      locationTextOverride: null,
      useFixedVenueOverride: null,
      startTimeOverride: null,
      endTimeOverride: null,
      createdAt: new Date(),
    }
    const result = mergeAndSortEvents([], [instance], 'en')
    expect(result[0].title).toBe('Override EN')
  })
})
