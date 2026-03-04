'use client'

import { useState, useTransition } from 'react'
import dynamic from 'next/dynamic'
import { ContentBlock } from '@/lib/db/schema'
import { updateContentBlock } from '@/app/admin/[token]/content/actions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

// Lazy-load the markdown editor (avoids SSR issues)
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false,
  loading: () => <div className="h-40 bg-gray-800 rounded animate-pulse" />,
})

interface ContentBlockEditorProps {
  token: string
  block: ContentBlock
  onSaved: () => void
}

export default function ContentBlockEditor({ token, block, onSaved }: ContentBlockEditorProps) {
  const [isPending, startTransition] = useTransition()
  const [contentIt, setContentIt] = useState(block.contentIt)
  const [contentEn, setContentEn] = useState(block.contentEn ?? '')

  function handleSave() {
    startTransition(async () => {
      const result = await updateContentBlock(token, block.key, contentIt, contentEn || null)
      if (result.success) {
        toast.success('Content saved')
        onSaved()
      } else {
        toast.error('Save failed: ' + (result as { success: false; error: string }).error)
      }
    })
  }

  return (
    <div className="space-y-4">
      {block.contentType === 'markdown' ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-400 text-xs mb-2 block">Italian</Label>
            <div data-color-mode="dark">
              <MDEditor
                value={contentIt}
                onChange={(v) => setContentIt(v ?? '')}
                height={250}
                preview="edit"
              />
            </div>
          </div>
          <div>
            <Label className="text-gray-400 text-xs mb-2 block">English</Label>
            <div data-color-mode="dark">
              <MDEditor
                value={contentEn}
                onChange={(v) => setContentEn(v ?? '')}
                height={250}
                preview="edit"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-400 text-xs mb-1 block">Italian</Label>
            <Textarea
              value={contentIt}
              onChange={(e) => setContentIt(e.target.value)}
              rows={3}
              className="bg-gray-800 border-gray-700 text-gray-100 resize-none"
            />
          </div>
          <div>
            <Label className="text-gray-400 text-xs mb-1 block">English</Label>
            <Textarea
              value={contentEn}
              onChange={(e) => setContentEn(e.target.value)}
              rows={3}
              className="bg-gray-800 border-gray-700 text-gray-100 resize-none"
            />
          </div>
        </div>
      )}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          {isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  )
}
