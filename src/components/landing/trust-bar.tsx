'use client'

import { motion } from 'framer-motion'

const EASE = [0.16, 1, 0.3, 1] as const

function MetaLogo() {
  return (
    <svg viewBox="0 0 36 36" fill="none" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.5 20.1c0 2 .4 3.5 1 4.5.7 1.2 1.8 1.8 3 1.8 1.5 0 2.8-.7 4.4-2.8.8-1.1 1.7-2.5 2.5-3.8l1.1-1.8c.8-1.2 1.6-2.4 2.4-3.2C20.1 12.8 21.7 12 23.4 12c2.6 0 4.7 1.6 6.2 4.7.9 1.8 1.4 4 1.4 6.5 0 1.8-.3 3.2-1 4.3h-3.4c.8-1.1 1.3-2.7 1.3-4.4 0-1.9-.4-3.5-1.1-4.7-.7-1.2-1.7-1.9-3-1.9-1.4 0-2.7.9-4.2 3.1-.7 1-1.5 2.3-2.3 3.7l-1 1.7c-1.7 2.8-3.1 4.7-4.5 5.8-1.4 1.1-2.9 1.6-4.6 1.6C4.4 32.4 2 29.5 2 24.4c0-2 .4-3.8 1.1-5.4L6 20.2c-.3.8-.5 1.6-.5 2.5L4.5 20.1z" fill="#0081FB" />
      <path d="M5.1 18.9C6.6 15.4 9.2 12 12.6 12c1.7 0 3.3.6 5 2.2.8.8 1.7 2 2.7 3.5l-2.7 2.6c-.7-1.2-1.4-2.2-2-2.9-.9-.9-1.8-1.4-3-1.4-2 0-3.7 1.7-4.9 4.8L5.1 18.9z" fill="#0064E1" />
    </svg>
  )
}

function TikTokLogo() {
  return (
    <svg viewBox="0 0 36 36" fill="none" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
      <path d="M26.5 8.5c-1.5-1-2.5-2.5-2.8-4.2h-4.2v17.3c-.1 2-1.7 3.6-3.8 3.6a3.8 3.8 0 01-3.8-3.8 3.8 3.8 0 013.8-3.8c.4 0 .7.1 1 .1V13.4c-.3 0-.7-.1-1-.1C10.2 13.3 6.5 17 6.5 21.5S10.2 29.7 15.7 29.7s9.2-3.7 9.2-9.2V14c1.7 1.2 3.7 1.8 5.8 1.8V11.6c-1.6-.1-3.1-.8-4.2-3.1z" fill="#0F172A" />
    </svg>
  )
}

function GoogleAdsLogo() {
  return (
    <svg viewBox="0 0 36 36" fill="none" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 26.5L13.5 9.5l5 8.7-9.5 16.5L4 26.5z" fill="#FBBC04" />
      <path d="M22.5 9.5L13 26.5l5 8.7L27.5 18.2 22.5 9.5z" fill="#4285F4" />
      <circle cx="29" cy="27" r="5.5" fill="#34A853" />
    </svg>
  )
}

function LinkedInLogo() {
  return (
    <svg viewBox="0 0 36 36" fill="none" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="32" height="32" rx="6" fill="#0A66C2" />
      <path d="M10 14h3.5v12H10V14zm1.75-5.5a2 2 0 110 4 2 2 0 010-4zM16 14h3.3v1.6h.1c.5-.9 1.6-1.9 3.4-1.9 3.6 0 4.2 2.4 4.2 5.5V26H23.5v-6.1c0-1.5 0-3.4-2.1-3.4s-2.4 1.6-2.4 3.3V26H16V14z" fill="white" />
    </svg>
  )
}

function YouTubeLogo() {
  return (
    <svg viewBox="0 0 36 36" fill="none" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
      <path d="M33.5 10.5s-.4-2.5-1.5-3.5c-1.4-1.5-3-.5-3-.5S24.5 6 18 6s-11 .5-11 .5-1.6-1-3 .5C2.9 8 2.5 10.5 2.5 10.5S2 13.3 2 16.2v2.6c0 2.9.5 5.7.5 5.7s.4 2.5 1.5 3.5c1.4 1.5 3.4 1.4 4.2 1.5C10.7 30 18 30 18 30s6.6 0 11-.5c0 0 1.6-.1 3-1.6 1.1-1 1.5-3.5 1.5-3.5s.5-2.8.5-5.7v-2.6c0-2.9-.5-5.7-.5-5.7z" fill="#FF0000" />
      <path d="M14.5 23V13l9.5 5-9.5 5z" fill="white" />
    </svg>
  )
}

const PLATFORMS = [
  { name: 'Meta Ads', Logo: MetaLogo },
  { name: 'TikTok Ads', Logo: TikTokLogo },
  { name: 'Google Ads', Logo: GoogleAdsLogo },
  { name: 'LinkedIn Ads', Logo: LinkedInLogo },
  { name: 'YouTube Ads', Logo: YouTubeLogo },
]

const METRICS = [
  { value: '50k+', label: 'assets adaptados' },
  { value: '12×', label: 'mais velocidade operacional' },
  { value: '5', label: 'plataformas suportadas' },
]

export function TrustBar() {
  return (
    <section
      className="relative border-y"
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: '#E2E8F0',
      }}
    >
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mb-7 text-center text-xs font-semibold uppercase tracking-widest"
          style={{ color: '#94A3B8' }}
        >
          Compatível com as principais plataformas de mídia paga
        </motion.p>

        {/* Platform logos */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
          className="mb-10 flex items-center justify-center gap-4 flex-wrap"
        >
          {PLATFORMS.map(({ name, Logo }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.07, ease: EASE }}
              className="flex items-center gap-2 rounded-xl border px-4 py-2.5 transition-all duration-200 hover:border-blue-200 hover:shadow-sm"
              style={{
                borderColor: '#E2E8F0',
                backgroundColor: '#F8FAFC',
              }}
            >
              <Logo />
              <span className="text-sm font-medium" style={{ color: '#475569' }}>{name}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Divider */}
        <div
          className="mb-8 h-px mx-auto"
          style={{
            maxWidth: 480,
            background: 'linear-gradient(90deg, transparent, #E2E8F0, transparent)',
          }}
        />

        {/* Metrics */}
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-16">
          {METRICS.map(({ value, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1, ease: EASE }}
              className="flex flex-col items-center gap-0.5"
            >
              <span
                className="font-display text-3xl font-bold"
                style={{ color: '#2563EB' }}
              >
                {value}
              </span>
              <span className="text-sm" style={{ color: '#64748B' }}>{label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
