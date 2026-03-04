import type { Event } from '@/lib/db/schema'
import type { RecurringInstance, DisplayEvent } from '@/types/events'
import type { Locale } from '@/types/content'

/** Pick the locale-appropriate string, falling back to Italian if English is null/undefined */
function pickLocale(it: string | null, en: string | null | undefined, locale: Locale): string | null {
  if (locale === 'en' && en) return en
  return it
}

function oneOffToDisplay(event: Event, locale: Locale): DisplayEvent {
  return {
    id: event.id,
    key: `oneoff-${event.id}`,
    title: pickLocale(event.titleIt, event.titleEn, locale) ?? event.titleIt,
    description: pickLocale(event.descriptionIt, event.descriptionEn, locale),
    eventType: event.eventType,
    date: event.date ? new Date(event.date + 'T00:00:00Z') : null,
    startTime: event.startTime,
    endTime: event.endTime,
    locationText: event.locationText,
    useFixedVenue: event.useFixedVenue,
    imageUrl: event.imageUrl,
    source: 'oneoff',
  }
}

function recurringToDisplay(instance: RecurringInstance, locale: Locale): DisplayEvent {
  const { rule, date, exception } = instance

  // Apply exception overrides on top of rule defaults
  const titleIt = exception?.titleItOverride ?? rule.titleIt
  const titleEn = exception?.titleEnOverride ?? rule.titleEn
  const descriptionIt = exception?.descriptionItOverride ?? rule.descriptionIt
  const descriptionEn = exception?.descriptionEnOverride ?? rule.descriptionEn
  const locationText = exception?.locationTextOverride ?? rule.locationText
  const useFixedVenue = exception?.useFixedVenueOverride ?? rule.useFixedVenue
  const startTime = exception?.startTimeOverride ?? rule.startTime
  const endTime = exception?.endTimeOverride ?? rule.endTime

  const dateStr = date.toISOString().slice(0, 10)

  return {
    id: rule.id,
    key: `recurring-${rule.id}-${dateStr}`,
    title: pickLocale(titleIt, titleEn, locale) ?? titleIt,
    description: pickLocale(descriptionIt ?? null, descriptionEn ?? null, locale),
    eventType: rule.eventType,
    date,
    startTime,
    endTime,
    locationText,
    useFixedVenue,
    imageUrl: rule.imageUrl,
    source: 'recurring',
    ruleId: rule.id,
  }
}

/**
 * Merge one-off events and recurring instances into a sorted DisplayEvent list.
 * Events with dates are sorted ascending; dateless announcements appear last.
 */
export function mergeAndSortEvents(
  oneOff: Event[],
  recurring: RecurringInstance[],
  locale: Locale,
): DisplayEvent[] {
  const all: DisplayEvent[] = [
    ...oneOff.map((e) => oneOffToDisplay(e, locale)),
    ...recurring.map((r) => recurringToDisplay(r, locale)),
  ]

  all.sort((a, b) => {
    if (a.date === null && b.date === null) return 0
    if (a.date === null) return 1
    if (b.date === null) return -1
    return a.date.getTime() - b.date.getTime()
  })

  return all
}
