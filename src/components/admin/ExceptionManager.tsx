'use client'

import { useState, useTransition } from 'react'
import { RecurringException, RecurringRule } from '@/lib/db/schema'
import {
  ExceptionData,
  createException,
  updateException,
  deleteException,
} from '@/app/admin/[token]/events/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface ExceptionManagerProps {
  token: string
  rule: RecurringRule
  exceptions: RecurringException[]
  onChanged: () => void
}

function emptyExceptionData(ruleId: string): ExceptionData & { ruleId: string } {
  return {
    ruleId,
    exceptionDate: '',
    isCancelled: true,
    titleItOverride: null,
    titleEnOverride: null,
    descriptionItOverride: null,
    descriptionEnOverride: null,
    locationTextOverride: null,
    useFixedVenueOverride: null,
    startTimeOverride: null,
    endTimeOverride: null,
  }
}

interface ExceptionFormState {
  exceptionDate: string
  isCancelled: boolean
  titleItOverride: string
  titleEnOverride: string
  startTimeOverride: string
  endTimeOverride: string
  locationTextOverride: string
}

export default function ExceptionManager({
  token,
  rule,
  exceptions,
  onChanged,
}: ExceptionManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingException, setEditingException] = useState<RecurringException | null>(null)

  function initForm(ex?: RecurringException): ExceptionFormState {
    return {
      exceptionDate: ex?.exceptionDate ?? '',
      isCancelled: ex?.isCancelled ?? true,
      titleItOverride: ex?.titleItOverride ?? '',
      titleEnOverride: ex?.titleEnOverride ?? '',
      startTimeOverride: ex?.startTimeOverride ?? '',
      endTimeOverride: ex?.endTimeOverride ?? '',
      locationTextOverride: ex?.locationTextOverride ?? '',
    }
  }

  const [form, setForm] = useState<ExceptionFormState>(initForm())

  function openCreate() {
    setEditingException(null)
    setForm(initForm())
    setDialogOpen(true)
  }

  function openEdit(ex: RecurringException) {
    setEditingException(ex)
    setForm(initForm(ex))
    setDialogOpen(true)
  }

  function handleDelete(ex: RecurringException) {
    if (!confirm(`Delete exception for ${ex.exceptionDate}?`)) return
    startTransition(async () => {
      const result = await deleteException(token, ex.id)
      if (result.success) {
        toast.success('Exception deleted')
        onChanged()
      } else {
        toast.error('Failed to delete')
      }
    })
  }

  function handleSave() {
    if (!form.exceptionDate) {
      toast.error('Date is required')
      return
    }
    const data: ExceptionData = {
      exceptionDate: form.exceptionDate,
      isCancelled: form.isCancelled,
      titleItOverride: form.isCancelled ? null : form.titleItOverride || null,
      titleEnOverride: form.isCancelled ? null : form.titleEnOverride || null,
      descriptionItOverride: null,
      descriptionEnOverride: null,
      locationTextOverride: form.isCancelled ? null : form.locationTextOverride || null,
      useFixedVenueOverride: null,
      startTimeOverride: form.isCancelled ? null : form.startTimeOverride || null,
      endTimeOverride: form.isCancelled ? null : form.endTimeOverride || null,
    }
    startTransition(async () => {
      const result = editingException
        ? await updateException(token, editingException.id, data)
        : await createException(token, rule.id, data)
      if (result.success) {
        toast.success(editingException ? 'Exception updated' : 'Exception added')
        setDialogOpen(false)
        onChanged()
      } else {
        toast.error('Failed: ' + (result as { success: false; error: string }).error)
      }
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-300">
          Exceptions ({exceptions.length})
        </span>
        <Button
          size="sm"
          onClick={openCreate}
          className="bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs"
        >
          + Add Exception
        </Button>
      </div>

      {exceptions.length === 0 ? (
        <p className="text-xs text-gray-600 py-2">No exceptions defined</p>
      ) : (
        <div className="space-y-1">
          {exceptions.map((ex) => (
            <div
              key={ex.id}
              className="flex items-center justify-between py-2 px-3 rounded bg-gray-800/50 text-sm"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-gray-300">{ex.exceptionDate}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    ex.isCancelled
                      ? 'bg-red-400/10 text-red-400'
                      : 'bg-yellow-400/10 text-yellow-400'
                  }`}
                >
                  {ex.isCancelled ? 'Cancelled' : 'Modified'}
                </span>
                {ex.titleItOverride && (
                  <span className="text-xs text-gray-500 truncate max-w-[150px]">
                    → {ex.titleItOverride}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(ex)}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(ex)}
                  disabled={isPending}
                  className="text-xs text-red-500 hover:text-red-400"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-gray-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-100">
              {editingException ? 'Edit Exception' : 'Add Exception'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-gray-400 text-xs mb-1 block">Date *</Label>
              <Input
                type="date"
                value={form.exceptionDate}
                onChange={(e) => setForm({ ...form, exceptionDate: e.target.value })}
                className="bg-gray-800 border-gray-700 text-gray-100"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                id="isCancelled"
                type="checkbox"
                checked={form.isCancelled}
                onChange={(e) => setForm({ ...form, isCancelled: e.target.checked })}
                className="w-4 h-4 rounded accent-red-500"
              />
              <Label htmlFor="isCancelled" className="text-gray-300 cursor-pointer text-sm">
                Cancel this occurrence
              </Label>
            </div>
            {!form.isCancelled && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-gray-400 text-xs mb-1 block">Title Override (IT)</Label>
                    <Input
                      value={form.titleItOverride}
                      onChange={(e) => setForm({ ...form, titleItOverride: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-gray-100"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400 text-xs mb-1 block">Title Override (EN)</Label>
                    <Input
                      value={form.titleEnOverride}
                      onChange={(e) => setForm({ ...form, titleEnOverride: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-gray-100"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-gray-400 text-xs mb-1 block">Start Time Override</Label>
                    <Input
                      type="time"
                      value={form.startTimeOverride}
                      onChange={(e) => setForm({ ...form, startTimeOverride: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-gray-100"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400 text-xs mb-1 block">End Time Override</Label>
                    <Input
                      type="time"
                      value={form.endTimeOverride}
                      onChange={(e) => setForm({ ...form, endTimeOverride: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-gray-400 text-xs mb-1 block">Location Override</Label>
                  <Input
                    value={form.locationTextOverride}
                    onChange={(e) => setForm({ ...form, locationTextOverride: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-gray-100"
                  />
                </div>
              </>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDialogOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isPending}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isPending ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
