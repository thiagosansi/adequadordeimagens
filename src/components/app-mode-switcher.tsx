import { cn } from '@/lib/utils'
import { Image, LayoutGrid } from 'lucide-react'

export type AppMode = 'single' | 'carousel'

type Props = {
  mode: AppMode
  onChange: (mode: AppMode) => void
}

export function AppModeSwitcher({ mode, onChange }: Props) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-0.5 gap-0.5">
      <button
        onClick={() => onChange('single')}
        className={cn(
          'flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all',
          mode === 'single'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700',
        )}
      >
        <Image className="h-3.5 w-3.5 shrink-0" />
        Imagem única
      </button>
      <button
        onClick={() => onChange('carousel')}
        className={cn(
          'flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all',
          mode === 'carousel'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700',
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
        Carrossel
      </button>
    </div>
  )
}
