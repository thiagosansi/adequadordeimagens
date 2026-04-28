import { cn } from '@/lib/utils'
import { Image, LayoutGrid } from 'lucide-react'

export type AppMode = 'single' | 'carousel'

type Props = {
  mode: AppMode
  onChange: (mode: AppMode) => void
}

export function AppModeSwitcher({ mode, onChange }: Props) {
  return (
    <div className="flex rounded-xl border border-gray-200 bg-white p-1">
      <button
        onClick={() => onChange('single')}
        className={cn(
          'flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all',
          mode === 'single'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-800',
        )}
      >
        <Image className="h-4 w-4" />
        Imagem única
      </button>
      <button
        onClick={() => onChange('carousel')}
        className={cn(
          'flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all',
          mode === 'carousel'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-800',
        )}
      >
        <LayoutGrid className="h-4 w-4" />
        Carrossel
      </button>
    </div>
  )
}
