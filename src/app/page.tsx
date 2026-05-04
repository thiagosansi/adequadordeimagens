import Link from 'next/link'

// ── Platform brand logos (inline SVG — no external dependencies) ───────────
function MetaLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.5 20.1c0 2 .4 3.5 1 4.5.7 1.2 1.8 1.8 3 1.8 1.5 0 2.8-.7 4.4-2.8.8-1.1 1.7-2.5 2.5-3.8l1.1-1.8c.8-1.2 1.6-2.4 2.4-3.2C20.1 12.8 21.7 12 23.4 12c2.6 0 4.7 1.6 6.2 4.7.9 1.8 1.4 4 1.4 6.5 0 1.8-.3 3.2-1 4.3h-3.4c.8-1.1 1.3-2.7 1.3-4.4 0-1.9-.4-3.5-1.1-4.7-.7-1.2-1.7-1.9-3-1.9-1.4 0-2.7.9-4.2 3.1-.7 1-1.5 2.3-2.3 3.7l-1 1.7c-1.7 2.8-3.1 4.7-4.5 5.8-1.4 1.1-2.9 1.6-4.6 1.6C4.4 32.4 2 29.5 2 24.4c0-2 .4-3.8 1.1-5.4L6 20.2c-.3.8-.5 1.6-.5 2.5L4.5 20.1z" fill="#0081FB"/>
      <path d="M5.1 18.9C6.6 15.4 9.2 12 12.6 12c1.7 0 3.3.6 5 2.2.8.8 1.7 2 2.7 3.5l-2.7 2.6c-.7-1.2-1.4-2.2-2-2.9-.9-.9-1.8-1.4-3-1.4-2 0-3.7 1.7-4.9 4.8L5.1 18.9z" fill="url(#meta-gradient)"/>
      <defs>
        <linearGradient id="meta-gradient" x1="5" y1="15" x2="18" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0064E1"/>
          <stop offset="1" stopColor="#0081FB"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

function TikTokLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M26.5 8.5c-1.5-1-2.5-2.5-2.8-4.2h-4.2v17.3c-.1 2-1.7 3.6-3.8 3.6a3.8 3.8 0 01-3.8-3.8 3.8 3.8 0 013.8-3.8c.4 0 .7.1 1 .1V13.4c-.3 0-.7-.1-1-.1C10.2 13.3 6.5 17 6.5 21.5S10.2 29.7 15.7 29.7s9.2-3.7 9.2-9.2V14c1.7 1.2 3.7 1.8 5.8 1.8V11.6c-1.6-.1-3.1-.8-4.2-3.1z" fill="white"/>
      <path d="M26.5 8.5c-1.5-1-2.5-2.5-2.8-4.2h-4.2v17.3c-.1 2-1.7 3.6-3.8 3.6a3.8 3.8 0 01-3.8-3.8 3.8 3.8 0 013.8-3.8c.4 0 .7.1 1 .1V13.4c-.3 0-.7-.1-1-.1C10.2 13.3 6.5 17 6.5 21.5S10.2 29.7 15.7 29.7s9.2-3.7 9.2-9.2V14c1.7 1.2 3.7 1.8 5.8 1.8V11.6c-1.6-.1-3.1-.8-4.2-3.1z" fill="url(#tiktok-g)"/>
      <defs>
        <linearGradient id="tiktok-g" x1="6" y1="4" x2="31" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#69C9D0"/>
          <stop offset="0.5" stopColor="#ffffff"/>
          <stop offset="1" stopColor="#EE1D52"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

function GoogleAdsLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 26.5L13.5 9.5l5 8.7-9.5 16.5L4 26.5z" fill="#FBBC04"/>
      <path d="M22.5 9.5L13 26.5l5 8.7L27.5 18.2 22.5 9.5z" fill="#4285F4"/>
      <circle cx="29" cy="27" r="5.5" fill="#34A853"/>
    </svg>
  )
}

function LinkedInLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="32" height="32" rx="6" fill="#0A66C2"/>
      <path d="M10 14h3.5v12H10V14zm1.75-5.5a2 2 0 110 4 2 2 0 010-4zM16 14h3.3v1.6h.1c.5-.9 1.6-1.9 3.4-1.9 3.6 0 4.2 2.4 4.2 5.5V26H23.5v-6.1c0-1.5 0-3.4-2.1-3.4s-2.4 1.6-2.4 3.3V26H16V14z" fill="white"/>
    </svg>
  )
}

function YouTubeLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M33.5 10.5s-.4-2.5-1.5-3.5c-1.4-1.5-3-.5-3-.5S24.5 6 18 6s-11 .5-11 .5-1.6-1-3 .5C2.9 8 2.5 10.5 2.5 10.5S2 13.3 2 16.2v2.6c0 2.9.5 5.7.5 5.7s.4 2.5 1.5 3.5c1.4 1.5 3.4 1.4 4.2 1.5C10.7 30 18 30 18 30s6.6 0 11-.5c0 0 1.6-.1 3-1.6 1.1-1 1.5-3.5 1.5-3.5s.5-2.8.5-5.7v-2.6c0-2.9-.5-5.7-.5-5.7z" fill="#FF0000"/>
      <path d="M14.5 23V13l9.5 5-9.5 5z" fill="white"/>
    </svg>
  )
}

const PLATFORMS = [
  {
    name: 'Meta',
    logo: MetaLogo,
    cardBg: 'bg-blue-50 border-blue-100',
    logoBg: 'bg-white',
    nameCls: 'text-blue-700',
    formatsCls: 'text-blue-500',
    tagCls: 'bg-blue-100 text-blue-700',
    formats: '10 formatos · Imagem e Vídeo',
    items: ['Feed', 'Stories', 'Reels', 'Carrossel'],
  },
  {
    name: 'TikTok',
    logo: TikTokLogo,
    cardBg: 'bg-gray-950 border-gray-800',
    logoBg: 'bg-gray-800',
    nameCls: 'text-white',
    formatsCls: 'text-gray-400',
    tagCls: 'bg-gray-800 text-gray-200',
    formats: '6 formatos · Imagem e Vídeo',
    items: ['In-Feed', 'TopView', 'Quadrado'],
  },
  {
    name: 'Google Ads',
    logo: GoogleAdsLogo,
    cardBg: 'bg-white border-gray-200',
    logoBg: 'bg-gray-50',
    nameCls: 'text-gray-900',
    formatsCls: 'text-gray-500',
    tagCls: 'bg-gray-100 text-gray-700',
    formats: '7 formatos · Display e YouTube',
    items: ['Responsive', 'Leaderboard', 'Half Page'],
  },
  {
    name: 'LinkedIn',
    logo: LinkedInLogo,
    cardBg: 'bg-sky-50 border-sky-100',
    logoBg: 'bg-white',
    nameCls: 'text-sky-800',
    formatsCls: 'text-sky-500',
    tagCls: 'bg-sky-100 text-sky-700',
    formats: '7 formatos · Imagem e Vídeo',
    items: ['Sponsored Content', 'Message Ad'],
  },
  {
    name: 'YouTube',
    logo: YouTubeLogo,
    cardBg: 'bg-red-50 border-red-100',
    logoBg: 'bg-white',
    nameCls: 'text-gray-900',
    formatsCls: 'text-red-500',
    tagCls: 'bg-red-100 text-red-700',
    formats: '4 formatos · Vídeo',
    items: ['In-Stream', 'Bumper', 'Shorts'],
  },
]

const FEATURES = [
  {
    title: 'Score de qualidade',
    description: 'Cada criativo recebe uma nota A–D com análise de contraste, saturação, brilho, cobertura de texto e conformidade técnica — antes do download.',
    color: 'bg-green-50 text-green-600',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
  },
  {
    title: 'Alertas de performance',
    description: 'Benchmarks de CPC e CPM por formato com base em diretrizes públicas. Saiba antes de publicar se o formato escolhido tende a custar mais.',
    color: 'bg-amber-50 text-amber-600',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
  {
    title: 'Detecção de rostos',
    description: 'Modelo de visão computacional identifica o rosto principal e posiciona o recorte automaticamente — sem cortar cabeças.',
    color: 'bg-purple-50 text-purple-600',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
      </svg>
    ),
  },
  {
    title: 'Safe zones por plataforma',
    description: 'Análise de pixels detecta conteúdo nas áreas bloqueadas pela UI de cada plataforma — perfil, CTA, ícones — e alerta antes do download.',
    color: 'bg-blue-50 text-blue-600',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: 'Processamento de vídeo',
    description: 'Upload de MP4, MOV e HEVC. Recorte automático para Stories, Reels, Shorts e TikTok — processado no seu dispositivo via Canvas ou FFmpeg.',
    color: 'bg-rose-50 text-rose-600',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
  {
    title: '100% no seu dispositivo',
    description: 'Nenhum arquivo é enviado para servidores. Todo o processamento acontece no browser — imagens, vídeos, detecção de rostos e análise de pixels.',
    color: 'bg-gray-100 text-gray-600',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
]

const STEPS = [
  { step: '1', title: 'Suba seu criativo', description: 'Imagem ou vídeo — arraste ou clique para selecionar.' },
  { step: '2', title: 'Escolha a plataforma e o formato', description: 'Meta, TikTok, Google, LinkedIn ou YouTube. O sistema valida os requisitos automaticamente.' },
  { step: '3', title: 'Ajuste, analise e baixe', description: 'Score de qualidade, alertas de performance e recorte inteligente — tudo antes do download.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900">AdFrame</span>
          </div>
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Entrar →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-gray-100 bg-gradient-to-b from-blue-50 to-white">
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <span className="mb-4 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            Meta · TikTok · Google Ads · LinkedIn · YouTube
          </span>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Seus criativos prontos<br />para qualquer plataforma
          </h1>
          <p className="mb-8 text-lg text-gray-500">
            Redimensione imagens e vídeos, valide requisitos técnicos, analise qualidade e receba alertas de performance — sem enviar nada para nenhum servidor.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Acessar ferramenta
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Platforms */}
      <section className="border-b border-gray-100 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-8 text-center text-sm font-semibold uppercase tracking-widest text-gray-400">
            Plataformas suportadas
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {PLATFORMS.map((p) => (
              <div key={p.name} className={`rounded-xl border p-4 ${p.cardBg}`}>
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${p.logoBg}`}>
                  <p.logo className="h-6 w-6" />
                </div>
                <p className={`text-sm font-bold ${p.nameCls}`}>{p.name}</p>
                <p className={`mt-0.5 mb-2 text-[10px] font-medium ${p.formatsCls}`}>{p.formats}</p>
                <div className="flex flex-wrap gap-1">
                  {p.items.map((item) => (
                    <span key={item} className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${p.tagCls}`}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-gray-100 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-10 text-center text-sm font-semibold uppercase tracking-widest text-gray-400">
            Funcionalidades
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border border-gray-200 p-6">
                <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="mb-1 text-sm font-semibold text-gray-900">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-gray-100 py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-10 text-center text-sm font-semibold uppercase tracking-widest text-gray-400">
            Como funciona
          </h2>
          <div className="space-y-6">
            {STEPS.map((s, i) => (
              <div key={s.step} className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {s.step}
                </div>
                <div className="pt-0.5">
                  <p className="text-sm font-semibold text-gray-900">{s.title}</p>
                  <p className="text-sm text-gray-500">{s.description}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="absolute left-[2.75rem] mt-8 h-6 w-px bg-gray-200" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="bg-gray-50 py-20 text-center">
        <h2 className="mb-3 text-2xl font-bold text-gray-900">Pronto para começar?</h2>
        <p className="mb-8 text-gray-500">
          Acesse a ferramenta e ajuste seu primeiro criativo agora — é gratuito.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Acessar ferramenta →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} AdFrame · Meta · TikTok · Google Ads · LinkedIn · YouTube
      </footer>
    </div>
  )
}
