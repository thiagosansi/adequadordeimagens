'use client'

import { useRef, useState } from 'react'
import { Film, Upload } from 'lucide-react'
import { isVideoFileAccepted } from '@/lib/meta-video-formats'
import { cn } from '@/lib/utils'

type Props = {
  onVideoLoad: (file: File) => void
}

export function VideoUploader({ onVideoLoad }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleFile(file: File) {
    setError(null)
    if (!isVideoFileAccepted(file)) {
      const isImage = file.type.startsWith('image/')
      const msg = isImage
        ? 'Este é um arquivo de imagem, não um vídeo. Se for um Live Photo do iPhone, selecione o arquivo .MOV (não o .JPG).'
        : `Formato não suportado: ${file.type || file.name.split('.').pop()?.toUpperCase() || 'desconhecido'}. Use MP4, MOV, HEVC ou WebM.`
      setError(msg)
      return
    }
    onVideoLoad(file)
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

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 transition-colors',
        isDragging
          ? 'border-blue-400 bg-blue-50'
          : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50',
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
        <Film className="h-7 w-7 text-gray-400" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-700">
          Arraste um vídeo ou{' '}
          <span className="text-blue-600 underline">clique para selecionar</span>
        </p>
        <p className="mt-1 text-xs text-gray-400">MP4, MOV, HEVC · até 4 GB · Live Photo: selecione o .MOV</p>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <Upload className="h-3.5 w-3.5" />
        Processamento 100% no seu dispositivo — nenhum arquivo é enviado
      </div>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,video/hevc,video/x-m4v,.mp4,.mov,.webm,.m4v,.hevc,.3gp"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  )
}
