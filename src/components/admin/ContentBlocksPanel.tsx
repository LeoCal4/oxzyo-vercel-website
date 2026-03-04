'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ContentBlock } from '@/lib/db/schema'
import ContentBlockEditor from './ContentBlockEditor'

interface ContentBlocksPanelProps {
  token: string
  blocks: ContentBlock[]
}

const PAGE_LABELS: Record<string, string> = {
  'homepage.hero.tagline': 'Homepage — Hero Tagline',
  'homepage.hero.cta': 'Homepage — Hero CTA',
  'homepage.intro': 'Homepage — Intro',
  'about.story': 'Chi Siamo — Story',
  'about.values': 'Chi Siamo — Values',
  'join.process': 'Unisciti — Join Process',
  'join.benefits': 'Unisciti — Benefits',
  'join.fee_note': 'Unisciti — Fee Note',
}

export default function ContentBlocksPanel({ token, blocks }: ContentBlocksPanelProps) {
  const router = useRouter()
  const [expandedKey, setExpandedKey] = useState<string | null>(null)

  function toggle(key: string) {
    setExpandedKey((prev) => (prev === key ? null : key))
  }

  return (
    <div className="space-y-2">
      {blocks.map((block) => (
        <div key={block.key} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <button
            onClick={() => toggle(block.key)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-800/50 transition-colors"
          >
            <div>
              <div className="font-medium text-gray-200">
                {PAGE_LABELS[block.key] ?? block.key}
              </div>
              <div className="text-xs text-gray-600 mt-0.5 font-mono">{block.key}</div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className={`text-xs px-2 py-0.5 rounded ${
                block.contentType === 'markdown'
                  ? 'bg-blue-400/10 text-blue-400'
                  : 'bg-gray-700 text-gray-400'
              }`}>
                {block.contentType}
              </span>
              <span className="text-xs text-gray-600">
                {new Date(block.updatedAt).toLocaleDateString('it-IT')}
              </span>
              <span className="text-gray-500 text-sm">
                {expandedKey === block.key ? '▲' : '▼'}
              </span>
            </div>
          </button>
          {expandedKey === block.key && (
            <div className="border-t border-gray-800 px-5 py-5">
              <ContentBlockEditor
                token={token}
                block={block}
                onSaved={() => {
                  router.refresh()
                  setExpandedKey(null)
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
