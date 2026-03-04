'use server'

import { db } from '@/lib/db'
import { events, recurringRules, recurringExceptions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/utils/admin'
import { revalidatePath } from 'next/cache'

type ActionResult = { success: true } | { success: false; error: string }

// ─── One-off Events ───────────────────────────────────────────────────────────

export interface EventData {
  titleIt: string
  titleEn: string | null
  descriptionIt: string | null
  descriptionEn: string | null
  eventType: 'game_night' | 'tournament' | 'special' | 'announcement'
  date: string | null
  startTime: string | null
  endTime: string | null
  locationText: string | null
  useFixedVenue: boolean
  imageUrl: string | null
}

export async function createEvent(token: string, data: EventData): Promise<ActionResult> {
  try {
    requireAdmin(token)
    await db.insert(events).values({
      titleIt: data.titleIt,
      titleEn: data.titleEn,
      descriptionIt: data.descriptionIt,
      descriptionEn: data.descriptionEn,
      eventType: data.eventType,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      locationText: data.locationText,
      useFixedVenue: data.useFixedVenue,
      imageUrl: data.imageUrl,
    })
    revalidatePath('/admin', 'layout')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function updateEvent(
  token: string,
  id: string,
  data: EventData
): Promise<ActionResult> {
  try {
    requireAdmin(token)
    await db
      .update(events)
      .set({
        titleIt: data.titleIt,
        titleEn: data.titleEn,
        descriptionIt: data.descriptionIt,
        descriptionEn: data.descriptionEn,
        eventType: data.eventType,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        locationText: data.locationText,
        useFixedVenue: data.useFixedVenue,
        imageUrl: data.imageUrl,
        updatedAt: new Date(),
      })
      .where(eq(events.id, id))
    revalidatePath('/admin', 'layout')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function deleteEvent(token: string, id: string): Promise<ActionResult> {
  try {
    requireAdmin(token)
    await db.delete(events).where(eq(events.id, id))
    revalidatePath('/admin', 'layout')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// ─── Recurring Rules ─────────────────────────────────────────────────────────

export interface RecurringRuleData {
  titleIt: string
  titleEn: string | null
  descriptionIt: string | null
  descriptionEn: string | null
  eventType: 'game_night' | 'tournament' | 'special' | 'announcement'
  rrule: string
  dtstart: string
  until: string | null
  startTime: string | null
  endTime: string | null
  locationText: string | null
  useFixedVenue: boolean
  imageUrl: string | null
  active: boolean
}

export async function createRecurringRule(
  token: string,
  data: RecurringRuleData
): Promise<ActionResult> {
  try {
    requireAdmin(token)
    await db.insert(recurringRules).values({
      titleIt: data.titleIt,
      titleEn: data.titleEn,
      descriptionIt: data.descriptionIt,
      descriptionEn: data.descriptionEn,
      eventType: data.eventType,
      rrule: data.rrule,
      dtstart: data.dtstart,
      until: data.until,
      startTime: data.startTime,
      endTime: data.endTime,
      locationText: data.locationText,
      useFixedVenue: data.useFixedVenue,
      imageUrl: data.imageUrl,
      active: data.active,
    })
    revalidatePath('/admin', 'layout')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function updateRecurringRule(
  token: string,
  id: string,
  data: RecurringRuleData
): Promise<ActionResult> {
  try {
    requireAdmin(token)
    await db
      .update(recurringRules)
      .set({
        titleIt: data.titleIt,
        titleEn: data.titleEn,
        descriptionIt: data.descriptionIt,
        descriptionEn: data.descriptionEn,
        eventType: data.eventType,
        rrule: data.rrule,
        dtstart: data.dtstart,
        until: data.until,
        startTime: data.startTime,
        endTime: data.endTime,
        locationText: data.locationText,
        useFixedVenue: data.useFixedVenue,
        imageUrl: data.imageUrl,
        active: data.active,
        updatedAt: new Date(),
      })
      .where(eq(recurringRules.id, id))
    revalidatePath('/admin', 'layout')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function deleteRecurringRule(token: string, id: string): Promise<ActionResult> {
  try {
    requireAdmin(token)
    await db.delete(recurringRules).where(eq(recurringRules.id, id))
    revalidatePath('/admin', 'layout')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function toggleRuleActive(
  token: string,
  id: string,
  active: boolean
): Promise<ActionResult> {
  try {
    requireAdmin(token)
    await db
      .update(recurringRules)
      .set({ active: !active, updatedAt: new Date() })
      .where(eq(recurringRules.id, id))
    revalidatePath('/admin', 'layout')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// ─── Exceptions ───────────────────────────────────────────────────────────────

export interface ExceptionData {
  exceptionDate: string
  isCancelled: boolean
  titleItOverride: string | null
  titleEnOverride: string | null
  descriptionItOverride: string | null
  descriptionEnOverride: string | null
  locationTextOverride: string | null
  useFixedVenueOverride: boolean | null
  startTimeOverride: string | null
  endTimeOverride: string | null
}

export async function createException(
  token: string,
  ruleId: string,
  data: ExceptionData
): Promise<ActionResult> {
  try {
    requireAdmin(token)
    await db.insert(recurringExceptions).values({
      ruleId,
      exceptionDate: data.exceptionDate,
      isCancelled: data.isCancelled,
      titleItOverride: data.titleItOverride,
      titleEnOverride: data.titleEnOverride,
      descriptionItOverride: data.descriptionItOverride,
      descriptionEnOverride: data.descriptionEnOverride,
      locationTextOverride: data.locationTextOverride,
      useFixedVenueOverride: data.useFixedVenueOverride,
      startTimeOverride: data.startTimeOverride,
      endTimeOverride: data.endTimeOverride,
    })
    revalidatePath('/admin', 'layout')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function updateException(
  token: string,
  id: string,
  data: Partial<ExceptionData>
): Promise<ActionResult> {
  try {
    requireAdmin(token)
    await db
      .update(recurringExceptions)
      .set(data)
      .where(eq(recurringExceptions.id, id))
    revalidatePath('/admin', 'layout')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function deleteException(token: string, id: string): Promise<ActionResult> {
  try {
    requireAdmin(token)
    await db.delete(recurringExceptions).where(eq(recurringExceptions.id, id))
    revalidatePath('/admin', 'layout')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
