import { cn } from '@/lib/utils'
import { Image, LayoutGrid, Film, Images } from 'lucide-react'

export type AppMode = 'single' | 'carousel' | 'video' | 'batch'

type Props = {
  mode: AppMode
  onChange: (mode: AppMode) => void
}

const MODES: { id: AppMode; label: string; icon: React.ElementType }[] = [
  { id: 'single',   label: 'Imagem',    icon: Image },
  { id: 'carousel', label: 'Carrossel', icon: LayoutGrid },
  { id: 'video',    label: 'Vídeo',     icon: Film },
  { id: 'batch',    label: 'Lote',      icon: Images },
]

export function AppModeSwitcher({ mode, onChange }: Props) {
  return (
    <div className="grid w-full grid-cols-4 gap-0.5 rounded-lg border border-gray-200 bg-gray-100 p-0.5 sm:w-auto sm:inline-flex">
      {MODES.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={cn(
            'flex flex-col items-center gap-0.5 rounded-md px-2 py-2 text-xs font-medium transition-all sm:flex-row sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-sm',
            mode === id
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700',
          )}
        >
          <Icon className="h-4 w-4 shrink-0 sm:h-3.5 sm:w-3.5" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}
