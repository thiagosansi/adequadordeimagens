// Static benchmarks based on Meta's public guidelines, industry reports (WordStream,
// AdEspresso, Hootsuite 2023–2024), and Meta Ads Manager benchmark data.
// These are directional averages — actual performance varies by audience, creative,
// bid strategy, and industry vertical.

export type CpcTendency = 'baixo' | 'médio' | 'alto'

export type FormatBenchmark = {
  formatId: string
  cpcTendency: CpcTendency
  avgCpm: string                                      // combined CPM range shown in the badge
  costBreakdown?: Array<{ label: string; cpm: string }> // per-placement breakdown (optional)
  strengths: string[]
  watchouts: string[]
  tip: string
}

const BENCHMARKS: FormatBenchmark[] = [
  // ── Meta ──────────────────────────────────────────────────────────────────
  {
    formatId: 'meta-feed-square',
    cpcTendency: 'médio',
    avgCpm: 'R$ 10–20',
    strengths: ['Alcance amplo', 'Funciona bem em feed e Explore', 'Alta compatibilidade'],
    watchouts: ['Competição alta no feed', 'Pode ser interrompido por texto excessivo'],
    tip: 'Use cores vibrantes e rosto visível no primeiro frame para aumentar o stop-scroll.',
  },
  {
    formatId: 'meta-feed-portrait',
    cpcTendency: 'baixo',
    avgCpm: 'R$ 8–16',
    strengths: ['Maior área de tela no mobile', 'CPM 30% menor que paisagem em média', 'Ideal para produto + contexto'],
    watchouts: ['Placements 1:1 cortam topo e base — respeite as safe zones', 'Pode ser cortado no desktop'],
    tip: 'Mantenha o elemento principal centralizado — alguns placements recortam para 1:1.',
  },
  {
    formatId: 'meta-feed-landscape',
    cpcTendency: 'alto',
    avgCpm: 'R$ 15–28',
    strengths: ['Ótimo em desktop e Audience Network', 'Ideal para banners de produto'],
    watchouts: ['CPM mais alto', 'Área menor no mobile — risco de aparecer pequena'],
    tip: 'Priorize outros formatos no mobile; use paisagem para campanhas com foco em desktop.',
  },
  {
    formatId: 'meta-stories',
    cpcTendency: 'baixo',
    avgCpm: 'R$ 5–14',
    costBreakdown: [
      { label: 'Stories', cpm: 'R$ 6–14' },
      { label: 'Reels',   cpm: 'R$ 5–12' },
    ],
    strengths: ['CPM entre os mais baixos do portfólio Meta', 'Tela cheia — imersivo', 'Alto volume de impressões e alcance orgânico'],
    watchouts: ['Safe zones: 14% topo e 20% base cobertos pela UI', 'Reels exigem criativo nativo — sem bordas pretas', 'Taxa de skip alta (< 3s)'],
    tip: 'Coloque a mensagem principal no centro e nos primeiros 3s. Criativos sem moldura de anúncio óbvia têm CTR até 2× maior.',
  },

  // ── TikTok ────────────────────────────────────────────────────────────────
  {
    formatId: 'tiktok-in-feed',
    cpcTendency: 'baixo',
    avgCpm: 'R$ 7–15',
    strengths: ['CPM competitivo', 'Alto potencial de viralização', 'Público jovem e engajado'],
    watchouts: ['Safe zones são rígidas — 13% topo e 25% base bloqueados pela UI', 'Criativo muito "produzido" performa pior'],
    tip: 'Conteúdo UGC (User Generated Content) tem CTR até 3× maior que criativo polido no TikTok.',
  },
  {
    formatId: 'tiktok-square',
    cpcTendency: 'médio',
    avgCpm: 'R$ 10–18',
    strengths: ['Versatilidade — funciona em múltiplos placements', 'Menor risco de corte'],
    watchouts: ['Menos imerivo que 9:16', 'Pode parecer "importado" de outras plataformas'],
    tip: 'Use legenda e CTA nativos do TikTok para parecer mais orgânico.',
  },
  {
    formatId: 'tiktok-landscape',
    cpcTendency: 'alto',
    avgCpm: 'R$ 14–22',
    strengths: ['Funciona bem em Pangle (Audience Network do TikTok)'],
    watchouts: ['Não é nativo do TikTok — menor engajamento', 'Público espera conteúdo vertical'],
    tip: 'Evite 16:9 no TikTok salvo para campanhas de Audience Network (Pangle).',
  },
  {
    formatId: 'tiktok-video-in-feed',
    cpcTendency: 'baixo',
    avgCpm: 'R$ 7–15',
    strengths: ['Formato nativo', 'Alto alcance orgânico + pago'],
    watchouts: ['Os primeiros 3s definem o resultado — hook é tudo', 'Safe zones bloqueiam 38% da altura'],
    tip: 'Inicie com movimento ou fala direta — vídeos que começam com texto estático têm 40% mais skip.',
  },
  {
    formatId: 'tiktok-video-topview',
    cpcTendency: 'alto',
    avgCpm: 'R$ 35–70',
    strengths: ['Primeiro anúncio ao abrir o app', 'Máxima visibilidade e impacto'],
    watchouts: ['Custo muito mais alto', 'Exige produção de alta qualidade'],
    tip: 'Reserve para lançamentos e campanhas de brand awareness de alto orçamento.',
  },

  // ── LinkedIn ──────────────────────────────────────────────────────────────
  {
    formatId: 'linkedin-landscape',
    cpcTendency: 'alto',
    avgCpm: 'R$ 40–80',
    strengths: ['Público B2B qualificado', 'Alta intenção de compra em nichos profissionais'],
    watchouts: ['CPM/CPC mais alto do mercado', 'Criativos genéricos têm CTR muito baixo'],
    tip: 'Mencione cargo ou indústria do público no criativo — personalização aumenta CTR em até 2×.',
  },
  {
    formatId: 'linkedin-square',
    cpcTendency: 'alto',
    avgCpm: 'R$ 38–72',
    strengths: ['Boa presença no feed mobile', 'Mais espaço visual que paisagem'],
    watchouts: ['Mesmo CPM alto do LinkedIn', 'Público espera conteúdo profissional'],
    tip: 'Dados e estatísticas no criativo têm CTR 37% maior em campanhas B2B no LinkedIn.',
  },
  {
    formatId: 'linkedin-video-landscape',
    cpcTendency: 'alto',
    avgCpm: 'R$ 45–90',
    strengths: ['Vídeo tem 5× mais engajamento que estático no LinkedIn', 'Ideal para thought leadership'],
    watchouts: ['Produção mais cara', 'Autoplay sem áudio — legenda obrigatória'],
    tip: 'Adicione legendas — 80% dos vídeos no LinkedIn são assistidos sem som.',
  },

  // ── Google ────────────────────────────────────────────────────────────────
  {
    formatId: 'google-landscape',
    cpcTendency: 'médio',
    avgCpm: 'R$ 8–18',
    strengths: ['Alta compatibilidade com Responsive Display', 'Alcance enorme na Display Network'],
    watchouts: ['Google redimensiona — mantenha margem de 5%', 'CTR de display em geral < 0.5%'],
    tip: 'Imagens com pessoas têm CTR até 35% maior que imagens só de produto na Display.',
  },
  {
    formatId: 'google-square',
    cpcTendency: 'médio',
    avgCpm: 'R$ 8–18',
    strengths: ['Formato mais flexível do Responsive Display', 'Aparece em mais placements'],
    watchouts: ['Pode ser combinado com outros assets — mantenha simplicidade'],
    tip: 'Mantenha uma mensagem por criativo — anúncios simples convertem melhor no Display.',
  },
  {
    formatId: 'google-medium-rectangle',
    cpcTendency: 'médio',
    avgCpm: 'R$ 6–14',
    strengths: ['Placement mais comum da Display Network (300×250)', 'Altíssimo volume de impressões'],
    watchouts: ['Muito competido — CTR baixo', 'Pequeno — texto mínimo'],
    tip: 'Use contraste máximo e CTA claro — o usuário tem < 1s de atenção neste formato.',
  },
  {
    formatId: 'google-youtube-thumbnail',
    cpcTendency: 'médio',
    avgCpm: 'R$ 12–25',
    strengths: ['Define o CTR do vídeo no YouTube', 'Pode aumentar views orgânicos'],
    watchouts: ['Thumbnails clickbait causam alta taxa de abandono e penalizam o canal'],
    tip: 'Rosto com expressão + texto curto (< 4 palavras) = combinação de maior CTR no YouTube.',
  },

  // ── YouTube ───────────────────────────────────────────────────────────────
  {
    formatId: 'youtube-in-stream',
    cpcTendency: 'médio',
    avgCpm: 'R$ 12–25',
    strengths: ['Alto alcance', 'Skippable reduz custo — paga só por quem assiste > 30s'],
    watchouts: ['67% dos usuários pulam após 5s — hook é crítico', 'Brand recall exige 15s+'],
    tip: 'Apresente a marca nos primeiros 5 segundos mesmo que o usuário vá pular.',
  },
  {
    formatId: 'youtube-bumper',
    cpcTendency: 'baixo',
    avgCpm: 'R$ 8–16',
    strengths: ['Não pode ser pulado — 100% de view', 'CPM menor', 'Ótimo para remarketing'],
    watchouts: ['Apenas 6s — sem tempo para storytelling', 'Exige mensagem ultra-direta'],
    tip: 'Bumpers funcionam melhor combinados com In-Stream — use para reforçar mensagem já vista.',
  },
  {
    formatId: 'youtube-shorts',
    cpcTendency: 'baixo',
    avgCpm: 'R$ 5–12',
    strengths: ['Crescimento acelerado do Shorts', 'CPM baixo', 'Público jovem e mobile'],
    watchouts: ['Formato muito novo — benchmarks ainda instáveis', 'Safe zones similares ao Reels'],
    tip: 'Conteúdo nativo (filmado em vertical, sem bordas) performa significativamente melhor.',
  },
  {
    formatId: 'youtube-discovery',
    cpcTendency: 'médio',
    avgCpm: 'R$ 10–20',
    strengths: ['Aparece na busca — alta intenção', 'Paga apenas por clique (CPV)'],
    watchouts: ['Thumbnail e título são o criativo — produção do vídeo é secundária aqui'],
    tip: 'Otimize thumbnail e título para busca — é o principal driver de CTR em Discovery.',
  },
]

const benchmarkMap = new Map(BENCHMARKS.map((b) => [b.formatId, b]))

export function getFormatBenchmark(formatId: string): FormatBenchmark | null {
  return benchmarkMap.get(formatId) ?? null
}

export const CPC_TENDENCY_META: Record<CpcTendency, { label: string; color: string; bg: string }> = {
  baixo:  { label: 'CPC baixo', color: 'text-green-700', bg: 'bg-green-50' },
  médio:  { label: 'CPC médio', color: 'text-amber-700', bg: 'bg-amber-50' },
  alto:   { label: 'CPC alto',  color: 'text-red-700',   bg: 'bg-red-50'   },
}
