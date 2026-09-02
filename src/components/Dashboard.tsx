import { useState } from 'react'
import { Contact, Deal, Activity } from '../lib/supabase'
import { Users, TrendingUp, CheckCircle, Wallet, ArrowUpRight, Clock, Target, X, ArrowRight } from 'lucide-react'

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
  onSelectContact?: (contact: Contact) => void
  onGoToPipeline?: (stage?: string) => void
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
  lead:              'Neu',
  in_kontakt:        'In Kontakt',
  nicht_erreicht:    'Nicht erreicht',
  angebot:           'Angebot',
  gewonnen:          'Gewonnen',
  verloren:          'Verloren',
}

const stageOrder = ['lead', 'in_kontakt', 'nicht_erreicht', 'angebot', 'gewonnen', 'verloren']

const MONTH_LABELS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
const MONTH_FULL = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

function greeting(): string {
  const h = new Date().getHours()
  if (h < 11) return 'Guten Morgen'
  if (h < 18) return 'Guten Tag'
  return 'Guten Abend'
}

export default function Dashboard({ stats, contacts, deals: _deals, userName, onNavigateToContacts, onSelectContact, onGoToPipeline }: Props) {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)

  const recentContacts = [...contacts]
    .sort((a, b) => {
      const dateA = a.lead_date || a.created_at
      const dateB = b.lead_date || b.created_at
      return new Date(dateB).getTime() - new Date(dateA).getTime()
    })
    .slice(0, 6)

  const statCards = [
    { title: 'Leads gesamt',    value: String(stats.totalContacts), icon: Users,       chip: 'bg-brand-50 text-brand-500',     hint: 'Alle Leads öffnen',         action: () => onNavigateToContacts?.() },
    { title: 'Neue Leads',      value: String(stats.activeLeads),   icon: Target,      chip: 'bg-sky-50 text-sky-500',         hint: 'Neue, unbearbeitete Leads öffnen', action: () => onGoToPipeline?.('lead') },
    { title: 'Abschlüsse',      value: String(stats.wonDeals),      icon: CheckCircle, chip: 'bg-emerald-50 text-emerald-500', hint: 'Gewonnene Deals öffnen',    action: () => onGoToPipeline?.('gewonnen'), subtitle: (stats.revenue / 1000).toFixed(1) + ' k€ Umsatz' },
    { title: 'Pipeline-Wert',   value: `${(stats.pipelineValue / 1000).toFixed(1)} k€`, icon: Wallet, chip: 'bg-amber-50 text-amber-500', hint: 'Pipeline öffnen', action: () => onGoToPipeline?.() },
  ]

  // ── Leads pro Monat (letzte 12 Monate) ──
  const now = new Date()
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
    return { y: d.getFullYear(), m: d.getMonth(), label: MONTH_LABELS[d.getMonth()], contacts: [] as Contact[] }
  })
  contacts.forEach(c => {
    const d = new Date(c.lead_date || c.created_at)
    const slot = months.find(s => s.y === d.getFullYear() && s.m === d.getMonth())
    if (slot) slot.contacts.push(c)
  })
  const maxMonth = Math.max(...months.map(s => s.contacts.length), 1)
  const peakIdx = months.reduce((best, s, i) => (s.contacts.length > months[best].contacts.length ? i : best), 0)
  const labeledIdx = selectedMonth ?? peakIdx

  const monthDetail = selectedMonth != null ? months[selectedMonth] : null
  const monthDetailContacts = monthDetail
    ? [...monthDetail.contacts].sort((a, b) => new Date(b.lead_date || b.created_at).getTime() - new Date(a.lead_date || a.created_at).getTime())
    : []

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
          <button
            key={card.title}
            onClick={card.action}
            title={card.hint}
            className="card text-left p-5 hover:shadow-pop hover:-translate-y-0.5 transition-all duration-300 animate-fadeUp group cursor-pointer"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.chip} w-9 h-9 rounded-xl flex items-center justify-center`}>
                <card.icon size={17} />
              </div>
              <ArrowUpRight size={15} className="text-ink-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-[26px] leading-none font-extrabold text-ink-900 num tracking-tight">{card.value}</div>
            <div className="text-[13px] text-ink-500 font-medium mt-1.5">{card.title}</div>
            {card.subtitle && <div className="text-xs mt-0.5 text-emerald-600 font-semibold num">{card.subtitle}</div>}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Leads pro Monat — klickbares Balkendiagramm */}
        <div className="card p-6 lg:col-span-3 animate-fadeUp" style={{ animationDelay: '120ms' }}>
          <div className="flex items-center gap-2 mb-6">
            <h2 className="font-bold text-ink-900">Leads pro Monat</h2>
            <span className="ml-auto text-xs text-ink-400 font-medium">Monat anklicken für Details</span>
          </div>
          <div className="flex items-end gap-1.5 sm:gap-2.5 h-44 pt-2">
            {months.map((s, i) => {
              const pct = Math.max((s.contacts.length / maxMonth) * 100, 3)
              const isLabeled = i === labeledIdx && s.contacts.length > 0
              const isSelected = i === selectedMonth
              return (
                <button
                  key={`${s.y}-${s.m}`}
                  onClick={() => setSelectedMonth(selectedMonth === i ? null : i)}
                  title={`${MONTH_FULL[s.m]} ${s.y}: ${s.contacts.length} Leads anzeigen`}
                  className="flex-1 flex flex-col items-center gap-2 min-w-0 group relative cursor-pointer"
                >
                  {isLabeled && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-ink-900 text-white text-[11px] font-bold px-2 py-1 rounded-lg num whitespace-nowrap shadow-pop z-10 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-ink-900">
                      {s.contacts.length} Leads
                    </div>
                  )}
                  <div className="w-full h-36 flex items-end rounded-lg overflow-hidden">
                    <div
                      className={`w-full rounded-lg origin-bottom animate-grow transition-colors ${
                        isSelected || (selectedMonth === null && i === peakIdx)
                          ? 'bg-brand-500'
                          : 'bg-brand-100 group-hover:bg-brand-300'
                      }`}
                      style={{ height: `${pct}%`, animationDelay: `${150 + i * 40}ms` }}
                    />
                  </div>
                  <span className={`text-[11px] font-semibold ${isSelected || (selectedMonth === null && i === peakIdx) ? 'text-brand-600' : 'text-ink-400 group-hover:text-ink-700'}`}>{s.label}</span>
                </button>
              )
            })}
          </div>

          {/* Monats-Drilldown */}
          {monthDetail && (
            <div className="mt-5 pt-5 border-t border-ink-100 animate-fadeUp">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-bold text-ink-900">
                  {MONTH_FULL[monthDetail.m]} {monthDetail.y}
                </h3>
                <span className="pill bg-brand-50 text-brand-600 num">{monthDetail.contacts.length} Leads</span>
                <span className="text-xs font-bold text-emerald-600 num ml-1">
                  {(monthDetail.contacts.reduce((s, c) => s + (c.price || 0), 0) / 1000).toFixed(1)} k€ Wert
                </span>
                <button onClick={() => setSelectedMonth(null)} title="Schließen" className="ml-auto p-1.5 text-ink-400 hover:text-ink-700 hover:bg-surface rounded-lg transition-colors">
                  <X size={15} />
                </button>
              </div>
              {monthDetailContacts.length === 0 ? (
                <p className="text-sm text-ink-400 py-3">Keine Leads in diesem Monat.</p>
              ) : (
                <div className="max-h-64 overflow-y-auto divide-y divide-ink-100 -mx-2">
                  {monthDetailContacts.map(contact => {
                    const status = contact.pipeline_status || 'nicht_kontaktiert'
                    const date = new Date(contact.lead_date || contact.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
                    return (
                      <button
                        key={contact.id}
                        onClick={() => onSelectContact ? onSelectContact(contact) : onNavigateToContacts?.()}
                        className="w-full flex items-center justify-between py-2 px-2 hover:bg-surface rounded-lg transition-colors text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="avatar w-7 h-7 text-[11px]">{contact.name.charAt(0).toUpperCase()}</div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-ink-900 leading-tight truncate">{contact.name}</p>
                            {contact.company && <p className="text-[11px] text-ink-400 truncate">{contact.company}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          {contact.price != null && contact.price > 0 && (
                            <span className="text-[11px] font-bold text-emerald-600 num hidden sm:block">{contact.price.toLocaleString('de-DE')} €</span>
                          )}
                          <span className="text-[11px] text-ink-400 num">{date}</span>
                          <span className={`pill !text-[10px] !px-2 ${statusColors[status] || 'bg-ink-100 text-ink-500'}`}>
                            <span className={`pill-dot ${statusDots[status] || 'bg-ink-400'}`} />
                            {statusLabels[status] || status}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pipeline Übersicht */}
        <div className="card p-6 lg:col-span-2 animate-fadeUp" style={{ animationDelay: '180ms' }}>
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={17} className="text-brand-500" />
            <h2 className="font-bold text-ink-900">Pipeline</h2>
            {onGoToPipeline && (
              <button onClick={() => onGoToPipeline()} className="ml-auto text-xs font-semibold text-brand-500 hover:text-brand-700 inline-flex items-center gap-1">
                Öffnen <ArrowRight size={12} />
              </button>
            )}
          </div>
          <div className="space-y-1.5">
            {stagesWithContacts.length === 0 ? (
              <p className="text-sm text-ink-400 text-center py-4">Keine Leads vorhanden</p>
            ) : (
              stagesWithContacts.map(({ stage, contacts: stageContacts }) => {
                const value = stageContacts.reduce((s, c) => s + (c.price || 0), 0)
                const pct = Math.round((stageContacts.length / maxCount) * 100)
                return (
                  <button
                    key={stage}
                    onClick={() => onGoToPipeline?.(stage)}
                    title={`${statusLabels[stage]} in der Pipeline öffnen`}
                    className="w-full text-left px-2.5 py-2 -mx-2.5 rounded-xl hover:bg-surface transition-colors cursor-pointer group"
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[13px] font-semibold text-ink-700 group-hover:text-brand-600 transition-colors">{statusLabels[stage]}</span>
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
                  </button>
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
            <h2 className="font-bold text-ink-900">Neueste Leads</h2>
            {onNavigateToContacts && (
              <button onClick={onNavigateToContacts} className="ml-auto text-xs font-semibold text-brand-500 hover:text-brand-700 inline-flex items-center gap-1">
                Alle ansehen <ArrowUpRight size={13} />
              </button>
            )}
          </div>
          {recentContacts.length === 0 ? (
            <div className="text-center py-8 text-ink-400">
              <Users size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Noch keine Leads</p>
            </div>
          ) : (
            <div className="divide-y divide-ink-100">
              {recentContacts.map(contact => {
                const status = contact.pipeline_status || 'nicht_kontaktiert'
                const date = new Date(contact.lead_date || contact.created_at)
                  .toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })
                return (
                  <button
                    key={contact.id}
                    className="w-full flex items-center justify-between group py-2.5 cursor-pointer hover:bg-surface rounded-xl px-2 -mx-2 transition-colors text-left"
                    title="Kontakt öffnen"
                    onClick={() => onSelectContact ? onSelectContact(contact) : onNavigateToContacts?.()}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="avatar w-9 h-9 text-sm">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink-900 leading-tight truncate group-hover:text-brand-600 transition-colors">{contact.name}</p>
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
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Status Verteilung */}
        <div className="card p-6 lg:col-span-2 animate-fadeUp" style={{ animationDelay: '300ms' }}>
          <h2 className="font-bold text-ink-900 mb-5">Status-Verteilung</h2>
          {contacts.length === 0 ? (
            <p className="text-ink-400 text-sm text-center py-4">Noch keine Leads vorhanden</p>
          ) : (
            <div className="space-y-1">
              {stageOrder.map(status => {
                const count = contacts.filter(c => (c.pipeline_status || 'nicht_kontaktiert') === status).length
                const pct = Math.round((count / contacts.length) * 100)
                return (
                  <button
                    key={status}
                    onClick={() => onGoToPipeline?.(status === 'nicht_kontaktiert' ? 'lead' : status)}
                    title={`${statusLabels[status]} in der Pipeline öffnen`}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface transition-colors cursor-pointer text-left group"
                  >
                    <span className={`pill-dot ${statusDots[status]}`} />
                    <span className="text-[13px] font-semibold text-ink-700 flex-1 group-hover:text-brand-600 transition-colors">{statusLabels[status]}</span>
                    <span className="text-xs text-ink-400 num w-9 text-right">{pct} %</span>
                    <span className="text-sm font-bold text-ink-900 num w-10 text-right">{count}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
