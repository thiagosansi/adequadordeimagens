'use client'

import { useRef } from 'react'
import { Plus } from 'lucide-react'

type Props = {
  onFilesSelected: (files: File[]) => void
  currentCount: number
  maxCount: number
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function CarouselUploader({ onFilesSelected, currentCount, maxCount }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const remaining = maxCount - currentCount

  function handleFiles(fileList: FileList) {
    const valid = Array.from(fileList)
      .filter((f) => ACCEPTED_TYPES.includes(f.type))
      .slice(0, remaining)
    if (valid.length > 0) onFilesSelected(valid)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) handleFiles(e.target.files)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files)
  }

  if (remaining === 0) return null

  return (
    <button
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="flex h-32 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 text-sm text-gray-500 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleChange}
      />
      <Plus className="h-5 w-5" />
      Adicionar imagens ({currentCount}/{maxCount})
    </button>
  )
}
