'use client'

import { useState, useEffect, useTransition } from 'react'
import { BggSyncJob } from '@/lib/db/schema'
import { Button } from '@/components/ui/button'

interface SyncPanelProps {
  token: string
  recentJobs: BggSyncJob[]
}

export default function SyncPanel({ token, recentJobs }: SyncPanelProps) {
  const [jobs, setJobs] = useState<BggSyncJob[]>(recentJobs)
  const [polling, setPolling] = useState(false)
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const latestJob = jobs[0] ?? null
  const isSyncing =
    latestJob?.status === 'pending' || latestJob?.status === 'in_progress'

  // Poll every 3s while a sync is running
  useEffect(() => {
    if (!isSyncing) {
      setPolling(false)
      return
    }
    setPolling(true)
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/admin/bgg-sync/status', {
          headers: { 'x-admin-token': token },
        })
        if (!res.ok) return
        const data = await res.json()
        if (data) {
          setJobs((prev) => [data, ...prev.slice(1)])
        }
      } catch {
        // ignore transient fetch errors
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [isSyncing, token])

  function handleSync() {
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/bgg-sync', {
          method: 'POST',
          headers: { 'x-admin-token': token },
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error ?? 'Failed to start sync')
          return
        }
        // Immediately poll for status to show pending state
        const statusRes = await fetch('/api/admin/bgg-sync/status', {
          headers: { 'x-admin-token': token },
        })
        if (statusRes.ok) {
          const data = await statusRes.json()
          if (data) setJobs((prev) => [data, ...prev])
        }
      } catch (e) {
        setError('Network error')
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Trigger section */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-2">Synchronize from BoardGameGeek</h2>
        <p className="text-sm text-gray-400 mb-4">
          Imports the <strong className="text-gray-200">orizzontiludici</strong> BGG collection into the database.
          Existing custom fields (times played, club rating, staff pick, lending) are preserved.
        </p>
        {isSyncing && (
          <div className="flex items-center gap-3 mb-4 text-sm text-yellow-400">
            <span className="animate-pulse">●</span>
            <span>
              Sync in progress ({latestJob?.status})
              {latestJob?.gamesTotal ? ` — ${latestJob.gamesTotal} games found` : ''}…
            </span>
          </div>
        )}
        {error && (
          <div className="text-sm text-red-400 mb-4">{error}</div>
        )}
        <Button
          onClick={handleSync}
          disabled={isSyncing}
          className="bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
        >
          {isSyncing ? 'Sync in progress…' : 'Start BGG Sync'}
        </Button>
        {polling && (
          <span className="ml-3 text-xs text-gray-500">Polling every 3s…</span>
        )}
      </div>

      {/* Recent jobs */}
      {jobs.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Recent Jobs</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-800">
                <th className="px-6 py-3 text-left font-medium">Started</th>
                <th className="px-6 py-3 text-left font-medium">Status</th>
                <th className="px-6 py-3 text-left font-medium">Imported</th>
                <th className="px-6 py-3 text-left font-medium">Updated</th>
                <th className="px-6 py-3 text-left font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b border-gray-800/50 last:border-0">
                  <td className="px-6 py-3 text-gray-300">
                    {new Date(job.startedAt).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-6 py-3">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="px-6 py-3 text-gray-300">{job.gamesImported ?? '—'}</td>
                  <td className="px-6 py-3 text-gray-300">{job.gamesUpdated ?? '—'}</td>
                  <td className="px-6 py-3 text-gray-500 max-w-xs truncate text-xs">
                    {job.errorMessage ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'text-yellow-400 bg-yellow-400/10',
    in_progress: 'text-blue-400 bg-blue-400/10',
    completed: 'text-green-400 bg-green-400/10',
    failed: 'text-red-400 bg-red-400/10',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] ?? 'text-gray-400 bg-gray-400/10'}`}>
      {status}
    </span>
  )
}
