'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Trash2, Loader2, Upload, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Color { name: string; hex: string }
interface Font  { name: string; url: string; weight: string }

interface BrandKit {
  id: string
  name: string
  logo_url: string | null
  logoUrl: string | null
  colors: Color[]
  fonts: Font[]
}

const FONT_WEIGHTS = ['300', '400', '500', '600', '700', '800']

export default function BrandKitPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const fileRef = useRef<HTMLInputElement>(null)

  const [kit, setKit] = useState<BrandKit | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Editable state (synced from kit on load)
  const [colors, setColors] = useState<Color[]>([])
  const [fonts, setFonts] = useState<Font[]>([])
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoPath, setLogoPath] = useState<string | null>(null)

  const loadKit = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/org/${orgId}/brand-kit`)
      const data = await res.json() as { kit?: BrandKit }
      if (data.kit) {
        setKit(data.kit)
        setColors(data.kit.colors ?? [])
        setFonts(data.kit.fonts ?? [])
        setLogoUrl(data.kit.logoUrl ?? null)
        setLogoPath(data.kit.logo_url ?? null)
      }
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => { void loadKit() }, [loadKit])

  // ── Logo upload ───────────────────────────────────────────────────────────

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Logo deve ter no máximo 5 MB.')
      return
    }

    setUploadingLogo(true)
    setError('')
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'png'
      const path = `${orgId}/logo.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('brand-kits')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      // Get signed URL for preview
      const { data: signed } = await supabase.storage
        .from('brand-kits')
        .createSignedUrl(path, 3600)

      setLogoPath(path)
      setLogoUrl(signed?.signedUrl ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar logo')
    } finally {
      setUploadingLogo(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  // ── Colors ────────────────────────────────────────────────────────────────

  function addColor() {
    setColors((prev) => [...prev, { name: '', hex: '#2563eb' }])
  }

  function updateColor(index: number, field: keyof Color, value: string) {
    setColors((prev) => prev.map((c, i) => i === index ? { ...c, [field]: value } : c))
  }

  function removeColor(index: number) {
    setColors((prev) => prev.filter((_, i) => i !== index))
  }

  // ── Fonts ─────────────────────────────────────────────────────────────────

  function addFont() {
    setFonts((prev) => [...prev, { name: '', url: '', weight: '400' }])
  }

  function updateFont(index: number, field: keyof Font, value: string) {
    setFonts((prev) => prev.map((f, i) => i === index ? { ...f, [field]: value } : f))
  }

  function removeFont(index: number) {
    setFonts((prev) => prev.filter((_, i) => i !== index))
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/org/${orgId}/brand-kit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colors, fonts, logoPath }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Erro ao salvar')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!kit) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Brand Kit não encontrado.</p>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-gray-50">
      <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Brand Kit</h1>
          <p className="mt-1 text-sm text-gray-500">
            Identidade visual centralizada da sua organização.
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {/* Logo */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Logo</h2>
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              {uploadingLogo ? (
                <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
              ) : logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-1" />
              ) : (
                <Upload className="h-6 w-6 text-gray-300" />
              )}
            </div>
            <div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingLogo}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                {uploadingLogo ? 'Enviando...' : 'Escolher arquivo'}
              </button>
              <p className="mt-1.5 text-xs text-gray-400">PNG, JPG ou SVG. Máx 5 MB.</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                className="hidden"
                onChange={handleLogoChange}
              />
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Paleta de cores</h2>
            <button
              onClick={addColor}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar cor
            </button>
          </div>

          {colors.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhuma cor adicionada ainda.</p>
          ) : (
            <div className="space-y-2">
              {colors.map((color, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color.hex}
                    onChange={(e) => updateColor(i, 'hex', e.target.value)}
                    className="h-9 w-9 cursor-pointer rounded-lg border border-gray-200 p-0.5"
                  />
                  <input
                    type="text"
                    value={color.hex}
                    onChange={(e) => updateColor(i, 'hex', e.target.value)}
                    placeholder="#2563eb"
                    className="w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-sm font-mono outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={color.name}
                    onChange={(e) => updateColor(i, 'name', e.target.value)}
                    placeholder="Ex: Azul primário"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => removeColor(i)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fonts */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Tipografia</h2>
            <button
              onClick={addFont}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar fonte
            </button>
          </div>

          {fonts.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhuma fonte adicionada ainda.</p>
          ) : (
            <div className="space-y-3">
              {fonts.map((font, i) => (
                <div key={i} className="rounded-xl border border-gray-100 p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={font.name}
                        onChange={(e) => updateFont(i, 'name', e.target.value)}
                        placeholder="Nome da fonte (ex: Inter)"
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                      />
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={font.url}
                          onChange={(e) => updateFont(i, 'url', e.target.value)}
                          placeholder="URL (Google Fonts, CDN...)"
                          className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                        />
                        <select
                          value={font.weight}
                          onChange={(e) => updateFont(i, 'weight', e.target.value)}
                          className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                        >
                          {FONT_WEIGHTS.map((w) => (
                            <option key={w} value={w}>{w}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFont(i)}
                      className="mt-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saved ? (
            <><Check className="h-4 w-4" />Salvo!</>
          ) : saving ? 'Salvando...' : 'Salvar Brand Kit'}
        </button>
      </div>
    </div>
  )
}
