import { Contact, Deal, Activity } from '../lib/supabase'
import { Users, TrendingUp, CheckCircle, Wallet, ArrowUpRight, Clock, Target } from 'lucide-react'

interface Stats {
  totalContacts: number
  totalDeals: number
  wonDeals: number
  revenue: number
  activeLeads: number
  pipelineValue: number
}

interface Props {
  stats: Stats
  contacts: Contact[]
  deals: Deal[]
  activities: Activity[]
  userName?: string
  onNavigateToContacts?: () => void
}

const statusColors: Record<string, string> = {
  nicht_kontaktiert: 'bg-ink-100 text-ink-500',
  lead:              'bg-brand-50 text-brand-600',
  in_kontakt:        'bg-sky-50 text-sky-600',
  nicht_erreicht:    'bg-orange-50 text-orange-600',
  angebot:           'bg-amber-50 text-amber-600',
  gewonnen:          'bg-emerald-50 text-emerald-600',
  verloren:          'bg-red-50 text-red-500',
}

const statusDots: Record<string, string> = {
  nicht_kontaktiert: 'bg-ink-400',
  lead:              'bg-brand-500',
  in_kontakt:        'bg-sky-500',
  nicht_erreicht:    'bg-orange-500',
  angebot:           'bg-amber-500',
  gewonnen:          'bg-emerald-500',
  verloren:          'bg-red-500',
}

const statusLabels: Record<string, string> = {
  nicht_kontaktiert: 'Nicht kontaktiert',
  lead:              'Lead',
  in_kontakt:        'In Kontakt',
  nicht_erreicht:    'Nicht erreicht',
  angebot:           'Angebot',
  gewonnen:          'Gewonnen',
  verloren:          'Verloren',
}

const stageOrder = ['lead', 'in_kontakt', 'nicht_erreicht', 'angebot', 'gewonnen', 'verloren']

const MONTH_LABELS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

function greeting(): string {
  const h = new Date().getHours()
  if (h < 11) return 'Guten Morgen'
  if (h < 18) return 'Guten Tag'
  return 'Guten Abend'
}

export default function Dashboard({ stats, contacts, deals: _deals, userName, onNavigateToContacts }: Props) {
  const recentContacts = [...contacts]
    .sort((a, b) => {
      const dateA = a.lead_date || a.created_at
      const dateB = b.lead_date || b.created_at
      return new Date(dateB).getTime() - new Date(dateA).getTime()
    })
    .slice(0, 6)

  const statCards = [
    { title: 'Kontakte gesamt', value: String(stats.totalContacts), icon: Users,       chip: 'bg-brand-50 text-brand-500' },
    { title: 'Aktive Leads',    value: String(stats.activeLeads),   icon: Target,      chip: 'bg-sky-50 text-sky-500' },
    { title: 'Abschlüsse',      value: String(stats.wonDeals),      icon: CheckCircle, chip: 'bg-emerald-50 text-emerald-500', subtitle: (stats.revenue / 1000).toFixed(1) + ' k€ Umsatz' },
    { title: 'Pipeline-Wert',   value: `${(stats.pipelineValue / 1000).toFixed(1)} k€`, icon: Wallet, chip: 'bg-amber-50 text-amber-500' },
  ]

  // ── Leads pro Monat (letzte 12 Monate) ──
  const now = new Date()
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
    return { y: d.getFullYear(), m: d.getMonth(), label: MONTH_LABELS[d.getMonth()], count: 0 }
  })
  contacts.forEach(c => {
    const d = new Date(c.lead_date || c.created_at)
    const slot = months.find(s => s.y === d.getFullYear() && s.m === d.getMonth())
    if (slot) slot.count++
  })
  const maxMonth = Math.max(...months.map(s => s.count), 1)
  const peakIdx = months.reduce((best, s, i) => (s.count > months[best].count ? i : best), 0)

  // ── Pipeline-Übersicht ──
  const stagesWithContacts = stageOrder
    .map(stage => ({
      stage,
      contacts: contacts.filter(c => (c.pipeline_status || 'nicht_kontaktiert') === stage),
    }))
    .filter(s => s.contacts.length > 0)
    .sort((a, b) => b.contacts.length - a.contacts.length)
    .slice(0, 5)

  const maxCount = Math.max(...stagesWithContacts.map(s => s.contacts.length), 1)

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div className="animate-fadeUp">
        <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-ink-900" style={{ textWrap: 'balance' } as React.CSSProperties}>
          {greeting()}{userName ? `, ${userName}` : ''}
        </h1>
        <p className="text-sm text-ink-500 mt-1">Das ist dein aktueller Lead-Report</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div
            key={card.title}
            className="card p-5 hover:shadow-pop hover:-translate-y-0.5 transition-all duration-300 animate-fadeUp"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.chip} w-9 h-9 rounded-xl flex items-center justify-center`}>
                <card.icon size={17} />
              </div>
            </div>
            <div className="text-[26px] leading-none font-extrabold text-ink-900 num tracking-tight">{card.value}</div>
            <div className="text-[13px] text-ink-500 font-medium mt-1.5">{card.title}</div>
            {card.subtitle && <div className="text-xs mt-0.5 text-emerald-600 font-semibold num">{card.subtitle}</div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Leads pro Monat — Balkendiagramm */}
        <div className="card p-6 lg:col-span-3 animate-fadeUp" style={{ animationDelay: '120ms' }}>
          <div className="flex items-center gap-2 mb-6">
            <h2 className="font-bold text-ink-900">Leads pro Monat</h2>
            <span className="ml-auto text-xs text-ink-400 font-medium">letzte 12 Monate</span>
          </div>
          <div className="flex items-end gap-1.5 sm:gap-2.5 h-44">
            {months.map((s, i) => {
              const pct = Math.max((s.count / maxMonth) * 100, 3)
              const isPeak = i === peakIdx && s.count > 0
              return (
                <div key={`${s.y}-${s.m}`} className="flex-1 flex flex-col items-center gap-2 min-w-0 group relative">
                  {isPeak && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-ink-900 text-white text-[11px] font-bold px-2 py-1 rounded-lg num whitespace-nowrap shadow-pop z-10 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-ink-900">
                      {s.count} Leads
                    </div>
                  )}
                  <div className="w-full h-36 flex items-end rounded-lg overflow-hidden">
                    <div
                      title={`${s.label} ${s.y}: ${s.count} Leads`}
                      className={`w-full rounded-lg origin-bottom animate-grow transition-colors ${isPeak ? 'bg-brand-500' : 'bg-brand-100 group-hover:bg-brand-300'}`}
                      style={{ height: `${pct}%`, animationDelay: `${150 + i * 40}ms` }}
                    />
                  </div>
                  <span className={`text-[11px] font-semibold ${isPeak ? 'text-brand-600' : 'text-ink-400'}`}>{s.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Pipeline Übersicht */}
        <div className="card p-6 lg:col-span-2 animate-fadeUp" style={{ animationDelay: '180ms' }}>
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={17} className="text-brand-500" />
            <h2 className="font-bold text-ink-900">Pipeline</h2>
            <span className="ml-auto text-xs text-ink-400 font-medium num">{contacts.length} Kontakte</span>
          </div>
          <div className="space-y-4">
            {stagesWithContacts.length === 0 ? (
              <p className="text-sm text-ink-400 text-center py-4">Keine Kontakte vorhanden</p>
            ) : (
              stagesWithContacts.map(({ stage, contacts: stageContacts }) => {
                const value = stageContacts.reduce((s, c) => s + (c.price || 0), 0)
                const pct = Math.round((stageContacts.length / maxCount) * 100)
                return (
                  <div key={stage}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[13px] font-semibold text-ink-700">{statusLabels[stage]}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-ink-400 num">{stageContacts.length}</span>
                        <span className="text-xs font-bold text-ink-900 num">{(value / 1000).toFixed(1)} k€</span>
                      </div>
                    </div>
                    <div className="h-2 bg-surface rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${statusDots[stage] || 'bg-brand-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Neueste Kontakte */}
        <div className="card p-6 lg:col-span-3 animate-fadeUp" style={{ animationDelay: '240ms' }}>
          <div className="flex items-center gap-2 mb-5">
            <Clock size={17} className="text-brand-500" />
            <h2 className="font-bold text-ink-900">Neueste Kontakte</h2>
            {onNavigateToContacts && (
              <button onClick={onNavigateToContacts} className="ml-auto text-xs font-semibold text-brand-500 hover:text-brand-700 inline-flex items-center gap-1">
                Alle ansehen <ArrowUpRight size={13} />
              </button>
            )}
          </div>
          {recentContacts.length === 0 ? (
            <div className="text-center py-8 text-ink-400">
              <Users size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Noch keine Kontakte</p>
            </div>
          ) : (
            <div className="divide-y divide-ink-100">
              {recentContacts.map(contact => {
                const status = contact.pipeline_status || 'nicht_kontaktiert'
                const date = new Date(contact.lead_date || contact.created_at)
                  .toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })
                return (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between group py-2.5 cursor-pointer hover:bg-surface rounded-xl px-2 -mx-2 transition-colors"
                    onClick={() => onNavigateToContacts?.()}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="avatar w-9 h-9 text-sm">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink-900 leading-tight truncate">{contact.name}</p>
                        <p className="text-xs text-ink-400 mt-0.5 truncate">{contact.company || contact.email || '–'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-ink-400 num hidden sm:block">{date}</span>
                      <span className={`pill ${statusColors[status] || 'bg-ink-100 text-ink-500'}`}>
                        <span className={`pill-dot ${statusDots[status] || 'bg-ink-400'}`} />
                        {statusLabels[status] || status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Status Verteilung */}
        <div className="card p-6 lg:col-span-2 animate-fadeUp" style={{ animationDelay: '300ms' }}>
          <h2 className="font-bold text-ink-900 mb-5">Status-Verteilung</h2>
          {contacts.length === 0 ? (
            <p className="text-ink-400 text-sm text-center py-4">Noch keine Kontakte vorhanden</p>
          ) : (
            <div className="space-y-2.5">
              {stageOrder.map(status => {
                const count = contacts.filter(c => (c.pipeline_status || 'nicht_kontaktiert') === status).length
                const pct = Math.round((count / contacts.length) * 100)
                return (
                  <div key={status} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface transition-colors">
                    <span className={`pill-dot ${statusDots[status]}`} />
                    <span className="text-[13px] font-semibold text-ink-700 flex-1">{statusLabels[status]}</span>
                    <span className="text-xs text-ink-400 num w-9 text-right">{pct} %</span>
                    <span className="text-sm font-bold text-ink-900 num w-10 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
