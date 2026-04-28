'use client'

import { useRef, useState, useEffect } from 'react'
import { Upload, ImageIcon, Clipboard } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  onImageLoad: (file: File, url: string) => void
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function ImageUploader({ onImageLoad }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [isPasting, setIsPasting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    setError(null)
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Formato não suportado. Use JPG, PNG ou WebP.')
      return
    }
    const url = URL.createObjectURL(file)
    onImageLoad(file, url)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  // Global paste listener — works anywhere on the page, not just when focused
  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items
      if (!items) return

      for (const item of items) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (!file) continue
          setIsPasting(true)
          // Rename pasted images since they have no meaningful filename
          const ext = item.type.split('/')[1] ?? 'png'
          const namedFile = new File([file], 'imagem-colada.' + ext, { type: item.type })
          handleFile(namedFile)
          setTimeout(() => setIsPasting(false), 800)
          break
        }
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isActive = isDragging || isPasting

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Área de upload de imagem"
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-16 transition-colors cursor-pointer select-none',
        isActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100',
      )}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />
      <div className="flex flex-col items-center gap-4 text-center">
        <div className={cn('rounded-full p-5', isActive ? 'bg-blue-100' : 'bg-white shadow-sm')}>
          {isPasting ? (
            <Clipboard className="h-10 w-10 text-blue-500" />
          ) : isDragging ? (
            <ImageIcon className="h-10 w-10 text-blue-500" />
          ) : (
            <Upload className="h-10 w-10 text-gray-400" />
          )}
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-700">
            {isPasting
              ? 'Colando imagem...'
              : isDragging
              ? 'Solte a imagem aqui'
              : 'Arraste, clique ou cole uma imagem'}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            JPG, PNG ou WebP — máximo 30 MB —{' '}
            <kbd className="rounded bg-gray-200 px-1 py-0.5 font-mono text-xs text-gray-600">
              Ctrl+V
            </kbd>{' '}
            para colar
          </p>
        </div>
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      </div>
    </div>
  )
}
