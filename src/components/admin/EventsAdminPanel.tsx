'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Event, RecurringRule, RecurringException } from '@/lib/db/schema'
import { deleteEvent, deleteRecurringRule, toggleRuleActive } from '@/app/admin/[token]/events/actions'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import EventForm from './EventForm'
import RecurringRuleForm from './RecurringRuleForm'
import ExceptionManager from './ExceptionManager'

interface EventsAdminPanelProps {
  token: string
  events: Event[]
  rules: RecurringRule[]
  exceptions: RecurringException[]
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  game_night: 'Game Night',
  tournament: 'Tournament',
  special: 'Special',
  announcement: 'Announcement',
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  game_night: 'bg-blue-400/10 text-blue-400',
  tournament: 'bg-purple-400/10 text-purple-400',
  special: 'bg-yellow-400/10 text-yellow-400',
  announcement: 'bg-gray-400/10 text-gray-400',
}

export default function EventsAdminPanel({
  token,
  events,
  rules,
  exceptions,
}: EventsAdminPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // One-off events
  const [eventDialog, setEventDialog] = useState<{ mode: 'create' | 'edit'; event?: Event } | null>(null)

  // Recurring rules
  const [ruleDialog, setRuleDialog] = useState<{ mode: 'create' | 'edit'; rule?: RecurringRule } | null>(null)
  const [exceptionsFor, setExceptionsFor] = useState<RecurringRule | null>(null)

  function exceptionsForRule(ruleId: string) {
    return exceptions.filter((e) => e.ruleId === ruleId)
  }

  function handleDeleteEvent(ev: Event) {
    if (!confirm(`Delete "${ev.titleIt}"?`)) return
    startTransition(async () => {
      const result = await deleteEvent(token, ev.id)
      if (result.success) {
        toast.success('Event deleted')
        router.refresh()
      } else {
        toast.error('Failed to delete')
      }
    })
  }

  function handleDeleteRule(rule: RecurringRule) {
    if (!confirm(`Delete rule "${rule.titleIt}" and all its exceptions?`)) return
    startTransition(async () => {
      const result = await deleteRecurringRule(token, rule.id)
      if (result.success) {
        toast.success('Rule deleted')
        router.refresh()
      } else {
        toast.error('Failed to delete')
      }
    })
  }

  function handleToggleActive(rule: RecurringRule) {
    startTransition(async () => {
      const result = await toggleRuleActive(token, rule.id, rule.active)
      if (result.success) {
        router.refresh()
      } else {
        toast.error('Failed to toggle')
      }
    })
  }

  return (
    <div>
      <Tabs defaultValue="oneoff">
        <TabsList className="bg-gray-800 border border-gray-700 mb-6">
          <TabsTrigger value="oneoff" className="data-[state=active]:bg-gray-700 text-gray-400 data-[state=active]:text-white">
            One-off Events ({events.length})
          </TabsTrigger>
          <TabsTrigger value="recurring" className="data-[state=active]:bg-gray-700 text-gray-400 data-[state=active]:text-white">
            Recurring Rules ({rules.length})
          </TabsTrigger>
        </TabsList>

        {/* ── One-off Events ── */}
        <TabsContent value="oneoff">
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => setEventDialog({ mode: 'create' })}
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm"
            >
              + Create Event
            </Button>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-800">
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Title</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Time</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No events yet
                    </td>
                  </tr>
                )}
                {events.map((ev) => (
                  <tr key={ev.id} className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs whitespace-nowrap">
                      {ev.date ?? '—'}
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <div className="font-medium text-gray-200 truncate">{ev.titleIt}</div>
                      {ev.titleEn && (
                        <div className="text-xs text-gray-600 truncate">{ev.titleEn}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${EVENT_TYPE_COLORS[ev.eventType]}`}>
                        {EVENT_TYPE_LABELS[ev.eventType]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {ev.startTime ? `${ev.startTime}${ev.endTime ? `-${ev.endTime}` : ''}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEventDialog({ mode: 'edit', event: ev })}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(ev)}
                          disabled={isPending}
                          className="text-xs text-red-500 hover:text-red-400"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── Recurring Rules ── */}
        <TabsContent value="recurring">
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => setRuleDialog({ mode: 'create' })}
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm"
            >
              + Create Rule
            </Button>
          </div>
          <div className="space-y-3">
            {rules.length === 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg px-6 py-8 text-center text-gray-500">
                No recurring rules yet
              </div>
            )}
            {rules.map((rule) => {
              const ruleExceptions = exceptionsForRule(rule.id)
              return (
                <div
                  key={rule.id}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-200 truncate">{rule.titleIt}</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium flex-shrink-0 ${EVENT_TYPE_COLORS[rule.eventType]}`}>
                          {EVENT_TYPE_LABELS[rule.eventType]}
                        </span>
                        <button
                          onClick={() => handleToggleActive(rule)}
                          disabled={isPending}
                          className={`text-xs px-2 py-0.5 rounded font-medium flex-shrink-0 transition-colors ${
                            rule.active
                              ? 'bg-green-400/10 text-green-400 hover:bg-green-400/20'
                              : 'bg-gray-700 text-gray-500 hover:bg-gray-600'
                          }`}
                        >
                          {rule.active ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 font-mono mb-2">
                        {rule.rrule} · from {rule.dtstart}
                        {rule.until && ` until ${rule.until}`}
                        {rule.startTime && ` · ${rule.startTime}${rule.endTime ? `-${rule.endTime}` : ''}`}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => setRuleDialog({ mode: 'edit', rule })}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setExceptionsFor(exceptionsFor?.id === rule.id ? null : rule)}
                        className="text-xs text-yellow-400 hover:text-yellow-300"
                      >
                        Exceptions {ruleExceptions.length > 0 ? `(${ruleExceptions.length})` : ''}
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule)}
                        disabled={isPending}
                        className="text-xs text-red-500 hover:text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {exceptionsFor?.id === rule.id && (
                    <div className="border-t border-gray-800 mt-3 pt-3">
                      <ExceptionManager
                        token={token}
                        rule={rule}
                        exceptions={ruleExceptions}
                        onChanged={() => router.refresh()}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* One-off event create/edit dialog */}
      {eventDialog && (
        <Dialog open onOpenChange={() => setEventDialog(null)}>
          <DialogContent className="bg-gray-900 border-gray-700 text-gray-100 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-gray-100">
                {eventDialog.mode === 'create' ? 'Create Event' : 'Edit Event'}
              </DialogTitle>
            </DialogHeader>
            <EventForm
              token={token}
              event={eventDialog.event}
              onSaved={() => {
                setEventDialog(null)
                router.refresh()
              }}
              onCancel={() => setEventDialog(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Recurring rule create/edit dialog */}
      {ruleDialog && (
        <Dialog open onOpenChange={() => setRuleDialog(null)}>
          <DialogContent className="bg-gray-900 border-gray-700 text-gray-100 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-gray-100">
                {ruleDialog.mode === 'create' ? 'Create Recurring Rule' : 'Edit Recurring Rule'}
              </DialogTitle>
            </DialogHeader>
            <RecurringRuleForm
              token={token}
              rule={ruleDialog.rule}
              onSaved={() => {
                setRuleDialog(null)
                router.refresh()
              }}
              onCancel={() => setRuleDialog(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
