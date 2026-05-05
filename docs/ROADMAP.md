# Roadmap Técnico — AdFrame

> Documento de referência para planejamento de produto e apresentação a investidores.
> Última atualização: maio de 2026.

---

## Estado Atual (Produção)

| Módulo | Status |
|---|---|
| Adequação de imagens (auto-crop, face-crop, expand, fit, mirror) | ✅ Produção |
| Corte interativo manual (imagem e vídeo) | ✅ Produção |
| Expansão com IA (Cloudinary smart crop + generative fill) | ✅ Produção |
| Pool de credenciais Cloudinary (rotação de contas) | ✅ Produção |
| Safe zone analysis (imagem e vídeo) | ✅ Produção |
| Processamento de vídeo (Canvas + FFmpeg.wasm ultrafast) | ✅ Produção |
| Carrossel multi-imagem | ✅ Produção |
| Processamento em lote (batch export multi-formato) | ✅ Produção |
| Multi-plataforma (Meta, TikTok, Google Ads, LinkedIn, YouTube) | ✅ Produção |
| Validação de requisitos por plataforma | ✅ Produção |
| Detecção de faces para crop inteligente | ✅ Produção |
| Detecção automática de cobertura de texto | ✅ Produção |
| Score de qualidade geral | ✅ Produção |
| Auth real — Supabase (email/senha, recuperação de senha) | ✅ Produção |
| Histórico de projetos (Supabase Storage) | ✅ Produção |
| Injeção de metadados EXIF no download (JPEG) | ✅ Produção |
| App mobile-first responsivo | ✅ Produção |
| Google Analytics | ✅ Produção |
| Deploy Vercel — adframe-app.vercel.app | ✅ Produção |

---

## Fase 1 — Fundação de Produto

> ✅ **Concluída** (exceto Google OAuth)

- ✅ Supabase Auth — email/senha, sessões persistentes, recuperação de senha
- ✅ Histórico de projetos — exports salvos no Supabase Storage por usuário
- ✅ Multi-plataforma — TikTok, Google Ads, LinkedIn, YouTube além do Meta
- ✅ Validação de requisitos por plataforma (limites, formatos aceitos, resolução mínima)
- ⬜ Login com Google OAuth

---

## Fase 2 — Expansão do Core

> 🔄 **Em andamento**

- ✅ Processamento em lote — exportar todos os formatos de uma plataforma com um clique
- ✅ Detecção de faces — posicionamento inteligente do recorte
- ✅ Verificação de cobertura de texto — detecção automática ao carregar a imagem
- ✅ Score de qualidade geral antes do download
- ✅ Injeção de metadados EXIF (Descrição, Autor, Copyright) no JPEG
- ⬜ Saída em WebP e AVIF além de JPEG/PNG
- ⬜ Vídeo: conversão HEVC → H.264 (desbloqueio para Chrome/Windows com iPhone)
- ⬜ Vídeo: processamento server-side via Cloudinary (substitui FFmpeg.wasm para vídeos longos)

---

## Fase 3 — Colaboração e Times

> Habilita venda para agências e equipes de marketing.

### Workspaces de equipe
- Múltiplos usuários por workspace com roles (admin, editor, viewer)
- Compartilhamento de projetos dentro do time

### Brand Kit
- Salvar paleta de cores, logos e fontes por cliente
- Aplicar marca automaticamente nos ajustes de fundo

### Fluxo de aprovação
- Editor envia para aprovação, gestor aprova ou solicita ajuste
- Notificação por email em cada etapa

---

## Fase 4 — Automação e Integração

> Diferencial competitivo para médias e grandes contas.

### API REST
- Endpoints para enviar imagem/vídeo e receber output processado
- Ideal para integrar em ferramentas internas de agências

### Integrações nativas
- Zapier / Make (n8n): acionar processamento a partir de Google Drive, Dropbox, Notion
- Upload direto para o Meta Business Manager via Graph API

### Processamento em background
- Fila de jobs para arquivos grandes (Vercel Queues ou Upstash)
- Notificação por email quando o arquivo estiver pronto

---

## Fase 5 — Inteligência e Diferenciação

> Barreira de entrada alta para concorrentes.

### Sugestão inteligente de recorte
- Modelo de saliência visual para identificar o ponto focal da imagem
- Posicionar o recorte automaticamente preservando o sujeito principal

### Predição de performance
- Score estimado de engajamento baseado nas diretrizes das plataformas
- Alertas contextuais: formatos com tendência de CPC mais alto

### Geração de variantes A/B
- A partir de uma imagem, gerar 3–5 variantes de recorte e composição
- Exportar todas para teste direto no Meta Ads Manager

---

## Fase 6 — Monetização (SaaS)

> Infraestrutura de receita via Stripe com medição de uso.

| Tier | Perfil | Funcionalidades |
|---|---|---|
| **Free** | Teste / criador individual | 10 exports/mês, 1 usuário, formatos básicos |
| **Pro** | Profissional autônomo | Ilimitado, todos os formatos, histórico, brand kit |
| **Teams** | Agências pequenas | Workspace compartilhado, aprovações, API básica |
| **Enterprise** | Agências e marcas | SLA, API completa, white-label, onboarding dedicado |

---

## Sequência Recomendada de Execução

```
Fase 1 ✅ → Fase 2 🔄 → Fase 6 → Fase 3 → Fase 4 → Fase 5
```

**Rationale:** faturar cedo (Fase 6 junto com Fase 2) valida o modelo de negócio antes de investir nas fases mais complexas de colaboração, automação e inteligência.

---

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript (strict mode) |
| Estilização | Tailwind CSS |
| Processamento de imagem | Canvas API + Cloudinary AI |
| Processamento de vídeo | Canvas + MediaRecorder / FFmpeg.wasm (ultrafast) |
| Detecção de faces | face-api.js (client-side) |
| Metadados EXIF | piexifjs (client-side) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Banco de dados | Supabase (PostgreSQL + RLS) |
| Deploy | Vercel (adframe-app.vercel.app) |
| Analytics | Google Analytics (G-3Q75FYB598) |
| Billing (futuro) | Stripe |
