import type { RecurringInstance } from '@/types/events'
import type { RecurringException } from '@/lib/db/schema'

/** Format a Date to 'YYYY-MM-DD' using UTC components */
export function toDateString(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Given generated instances (exception: null) and a list of exception rows,
 * attach matching exceptions and remove cancelled instances.
 * Exceptions for non-existent dates are silently ignored.
 */
export function applyExceptions(
  instances: RecurringInstance[],
  exceptions: RecurringException[],
): RecurringInstance[] {
  // Build lookup: "ruleId:YYYY-MM-DD" -> exception
  const exceptionMap = new Map<string, RecurringException>()
  for (const exc of exceptions) {
    exceptionMap.set(`${exc.ruleId}:${exc.exceptionDate}`, exc)
  }

  const result: RecurringInstance[] = []

  for (const instance of instances) {
    const dateStr = toDateString(instance.date)
    const exception = exceptionMap.get(`${instance.rule.id}:${dateStr}`) ?? null

    if (exception?.isCancelled) continue

    result.push({ ...instance, exception })
  }

  return result
}
