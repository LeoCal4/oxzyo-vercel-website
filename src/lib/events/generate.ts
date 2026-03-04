import { RRule } from 'rrule'
import type { RecurringRule, RecurringException } from '@/lib/db/schema'
import type { RecurringInstance } from '@/types/events'
import { applyExceptions } from './exceptions'

/**
 * Generate recurring event instances within [from, to] for all active rules,
 * then apply exceptions (remove cancelled dates, attach override data).
 */
export function generateRecurringInstances(
  rules: RecurringRule[],
  exceptions: RecurringException[],
  from: Date,
  to: Date,
): RecurringInstance[] {
  const rawInstances: RecurringInstance[] = []

  for (const rule of rules) {
    if (!rule.active) continue

    // dtstart is stored as 'YYYY-MM-DD' string; parse as UTC midnight
    const dtstart = new Date(rule.dtstart + 'T00:00:00Z')

    // Parse the RRULE string and merge with dtstart (and optional until from DB)
    const rruleOptions = RRule.parseString(rule.rrule)
    const rruleObj = new RRule({
      ...rruleOptions,
      dtstart,
      ...(rule.until ? { until: new Date(rule.until + 'T23:59:59Z') } : {}),
    })

    const dates = rruleObj.between(from, to, true /* inclusive */)

    for (const date of dates) {
      rawInstances.push({ rule, date, exception: null })
    }
  }

  return applyExceptions(rawInstances, exceptions)
}
