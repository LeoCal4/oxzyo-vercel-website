'use client'

import { useState, useTransition } from 'react'
import { RecurringRule } from '@/lib/db/schema'
import {
  RecurringRuleData,
  createRecurringRule,
  updateRecurringRule,
} from '@/app/admin/[token]/events/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import ImageUploader from './ImageUploader'

interface RecurringRuleFormProps {
  token: string
  rule?: RecurringRule
  onSaved: () => void
  onCancel: () => void
}

const EVENT_TYPES = [
  { value: 'game_night', label: 'Game Night' },
  { value: 'tournament', label: 'Tournament' },
  { value: 'special', label: 'Special' },
  { value: 'announcement', label: 'Announcement' },
] as const

const DAYS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] as const
const DAY_LABELS: Record<string, string> = {
  MO: 'Mon',
  TU: 'Tue',
  WE: 'Wed',
  TH: 'Thu',
  FR: 'Fri',
  SA: 'Sat',
  SU: 'Sun',
}

// Parse RRULE string into simple fields
function parseRrule(rrule: string) {
  const parts: Record<string, string> = {}
  rrule.split(';').forEach((part) => {
    const [k, v] = part.split('=')
    if (k && v) parts[k] = v
  })
  return {
    freq: parts['FREQ'] ?? 'WEEKLY',
    interval: parts['INTERVAL'] ?? '1',
    byday: parts['BYDAY'] ? parts['BYDAY'].split(',') : [],
  }
}

// Build RRULE string from simple fields
function buildRrule(freq: string, interval: string, byday: string[]): string {
  let rrule = `FREQ=${freq}`
  if (interval && interval !== '1') rrule += `;INTERVAL=${interval}`
  if (freq === 'WEEKLY' && byday.length > 0) rrule += `;BYDAY=${byday.join(',')}`
  return rrule
}

export default function RecurringRuleForm({
  token,
  rule,
  onSaved,
  onCancel,
}: RecurringRuleFormProps) {
  const [isPending, startTransition] = useTransition()

  const parsed = rule ? parseRrule(rule.rrule) : null

  const [titleIt, setTitleIt] = useState(rule?.titleIt ?? '')
  const [titleEn, setTitleEn] = useState(rule?.titleEn ?? '')
  const [descIt, setDescIt] = useState(rule?.descriptionIt ?? '')
  const [descEn, setDescEn] = useState(rule?.descriptionEn ?? '')
  const [eventType, setEventType] = useState<RecurringRuleData['eventType']>(
    rule?.eventType ?? 'game_night'
  )
  const [freq, setFreq] = useState(parsed?.freq ?? 'WEEKLY')
  const [interval, setInterval] = useState(parsed?.interval ?? '1')
  const [byday, setByday] = useState<string[]>(parsed?.byday ?? [])
  const [rawRrule, setRawRrule] = useState(rule?.rrule ?? '')
  const [useRawRrule, setUseRawRrule] = useState(false)
  const [dtstart, setDtstart] = useState(rule?.dtstart ?? '')
  const [until, setUntil] = useState(rule?.until ?? '')
  const [startTime, setStartTime] = useState(rule?.startTime ?? '')
  const [endTime, setEndTime] = useState(rule?.endTime ?? '')
  const [location, setLocation] = useState(rule?.locationText ?? '')
  const [useFixedVenue, setUseFixedVenue] = useState(rule?.useFixedVenue ?? false)
  const [imageUrl, setImageUrl] = useState(rule?.imageUrl ?? '')
  const [active, setActive] = useState(rule?.active ?? true)

  function toggleDay(day: string) {
    setByday((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const computedRrule = useRawRrule ? rawRrule : buildRrule(freq, interval, byday)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titleIt.trim()) {
      toast.error('Italian title is required')
      return
    }
    if (!dtstart) {
      toast.error('Start date (dtstart) is required')
      return
    }
    if (!computedRrule) {
      toast.error('RRULE is required')
      return
    }
    const data: RecurringRuleData = {
      titleIt: titleIt.trim(),
      titleEn: titleEn || null,
      descriptionIt: descIt || null,
      descriptionEn: descEn || null,
      eventType,
      rrule: computedRrule,
      dtstart,
      until: until || null,
      startTime: startTime || null,
      endTime: endTime || null,
      locationText: location || null,
      useFixedVenue,
      imageUrl: imageUrl || null,
      active,
    }
    startTransition(async () => {
      const result = rule
        ? await updateRecurringRule(token, rule.id, data)
        : await createRecurringRule(token, data)
      if (result.success) {
        toast.success(rule ? 'Rule updated' : 'Rule created')
        onSaved()
      } else {
        toast.error('Failed: ' + (result as { success: false; error: string }).error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-400 text-xs mb-1 block">Title (IT) *</Label>
          <Input
            value={titleIt}
            onChange={(e) => setTitleIt(e.target.value)}
            required
            className="bg-gray-800 border-gray-700 text-gray-100"
          />
        </div>
        <div>
          <Label className="text-gray-400 text-xs mb-1 block">Title (EN)</Label>
          <Input
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            className="bg-gray-800 border-gray-700 text-gray-100"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-400 text-xs mb-1 block">Description (IT)</Label>
          <Textarea
            value={descIt}
            onChange={(e) => setDescIt(e.target.value)}
            rows={3}
            className="bg-gray-800 border-gray-700 text-gray-100 resize-none"
          />
        </div>
        <div>
          <Label className="text-gray-400 text-xs mb-1 block">Description (EN)</Label>
          <Textarea
            value={descEn}
            onChange={(e) => setDescEn(e.target.value)}
            rows={3}
            className="bg-gray-800 border-gray-700 text-gray-100 resize-none"
          />
        </div>
      </div>

      {/* Event type */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-400 text-xs mb-1 block">Event Type</Label>
          <Select
            value={eventType}
            onValueChange={(v) => setEventType(v as RecurringRuleData['eventType'])}
          >
            <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {EVENT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value} className="text-gray-100 focus:bg-gray-700">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3 mt-5">
          <input
            id="active"
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="w-4 h-4 rounded accent-orange-500"
          />
          <Label htmlFor="active" className="text-gray-300 cursor-pointer">Active</Label>
        </div>
      </div>

      {/* RRULE builder */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-gray-300 text-sm font-medium">Recurrence Rule</Label>
          <button
            type="button"
            onClick={() => {
              if (!useRawRrule) setRawRrule(computedRrule)
              setUseRawRrule(!useRawRrule)
            }}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            {useRawRrule ? 'Use builder' : 'Use raw RRULE'}
          </button>
        </div>

        {useRawRrule ? (
          <div>
            <Input
              value={rawRrule}
              onChange={(e) => setRawRrule(e.target.value)}
              placeholder="FREQ=WEEKLY;BYDAY=FR"
              className="bg-gray-800 border-gray-700 text-gray-100 font-mono text-sm"
            />
            <p className="text-xs text-gray-600 mt-1">
              Examples: FREQ=WEEKLY;BYDAY=FR · FREQ=WEEKLY;INTERVAL=2;BYDAY=WE
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-400 text-xs mb-1 block">Frequency</Label>
                <Select value={freq} onValueChange={setFreq}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="DAILY" className="text-gray-100 focus:bg-gray-700">Daily</SelectItem>
                    <SelectItem value="WEEKLY" className="text-gray-100 focus:bg-gray-700">Weekly</SelectItem>
                    <SelectItem value="MONTHLY" className="text-gray-100 focus:bg-gray-700">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-400 text-xs mb-1 block">Interval</Label>
                <Input
                  type="number"
                  min={1}
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-gray-100"
                />
              </div>
            </div>
            {freq === 'WEEKLY' && (
              <div>
                <Label className="text-gray-400 text-xs mb-2 block">Days of Week</Label>
                <div className="flex gap-2 flex-wrap">
                  {DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        byday.includes(day)
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      {DAY_LABELS[day]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-600 font-mono pt-1">
          RRULE: <span className="text-gray-400">{computedRrule || '(empty)'}</span>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-400 text-xs mb-1 block">Start Date (dtstart) *</Label>
          <Input
            type="date"
            value={dtstart}
            onChange={(e) => setDtstart(e.target.value)}
            required
            className="bg-gray-800 border-gray-700 text-gray-100"
          />
        </div>
        <div>
          <Label className="text-gray-400 text-xs mb-1 block">End Date (until, optional)</Label>
          <Input
            type="date"
            value={until}
            onChange={(e) => setUntil(e.target.value)}
            className="bg-gray-800 border-gray-700 text-gray-100"
          />
        </div>
      </div>

      {/* Times */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-400 text-xs mb-1 block">Start Time</Label>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="bg-gray-800 border-gray-700 text-gray-100"
          />
        </div>
        <div>
          <Label className="text-gray-400 text-xs mb-1 block">End Time</Label>
          <Input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="bg-gray-800 border-gray-700 text-gray-100"
          />
        </div>
      </div>

      {/* Venue */}
      <div className="flex items-center gap-3">
        <input
          id="fixedVenueRule"
          type="checkbox"
          checked={useFixedVenue}
          onChange={(e) => setUseFixedVenue(e.target.checked)}
          className="w-4 h-4 rounded accent-orange-500"
        />
        <Label htmlFor="fixedVenueRule" className="text-gray-300 cursor-pointer text-sm">
          Use fixed venue (Via Bonanno Pisano 20)
        </Label>
      </div>
      {!useFixedVenue && (
        <div>
          <Label className="text-gray-400 text-xs mb-1 block">Location</Label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="bg-gray-800 border-gray-700 text-gray-100"
          />
        </div>
      )}

      {/* Image */}
      <div>
        <Label className="text-gray-400 text-xs mb-2 block">Image URL</Label>
        <Input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://… or upload below"
          className="bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-600 mb-2"
        />
        <ImageUploader onUpload={(url) => setImageUrl(url)} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} className="text-gray-400 hover:text-white">
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} className="bg-orange-500 hover:bg-orange-600 text-white">
          {isPending ? 'Saving…' : rule ? 'Update Rule' : 'Create Rule'}
        </Button>
      </div>
    </form>
  )
}
