'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'

interface ImageUploaderProps {
  onUpload: (url: string) => void
  token: string
}

export default function ImageUploader({ onUpload, token }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setError(null)
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'x-admin-token': token },
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Upload failed')
      } else {
        onUpload(data.url)
      }
    } catch {
      setError('Network error')
    } finally {
      setUploading(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="border-gray-700 text-gray-400 hover:text-white text-xs"
      >
        {uploading ? 'Uploading…' : 'Upload image'}
      </Button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}
