import { Contact, Deal, Activity } from '../lib/supabase'
import { Users, TrendingUp, CheckCircle, DollarSign, ArrowUpRight, Clock, Target } from 'lucide-react'

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
  onNavigateToContacts?: () => void
}

const statusColors: Record<string, string> = {
  nicht_kontaktiert: 'bg-gray-100 text-gray-700',
  lead:              'bg-blue-100 text-blue-700',
  in_kontakt:        'bg-indigo-100 text-indigo-700',
  nicht_erreicht:    'bg-orange-100 text-orange-700',
  angebot:           'bg-yellow-100 text-yellow-700',
  gewonnen:          'bg-green-100 text-green-700',
  verloren:          'bg-red-100 text-red-700',
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

const stageColors: Record<string, string> = {
  nicht_kontaktiert: 'bg-gray-50 border-gray-100',
  lead:              'bg-blue-50 border-blue-100',
  in_kontakt:        'bg-indigo-50 border-indigo-100',
  nicht_erreicht:    'bg-orange-50 border-orange-100',
  angebot:           'bg-yellow-50 border-yellow-100',
  gewonnen:          'bg-green-50 border-green-100',
  verloren:          'bg-red-50 border-red-100',
}

const stageTextColors: Record<string, string> = {
  nicht_kontaktiert: 'text-gray-700',
  lead:              'text-blue-700',
  in_kontakt:        'text-indigo-700',
  nicht_erreicht:    'text-orange-700',
  angebot:           'text-yellow-700',
  gewonnen:          'text-green-700',
  verloren:          'text-red-700',
}

export default function Dashboard({ stats, contacts, deals: _deals, onNavigateToContacts }: Props) {
  const recentContacts = [...contacts]
    .sort((a, b) => {
      const dateA = a.lead_date || a.created_at
      const dateB = b.lead_date || b.created_at
      return new Date(dateB).getTime() - new Date(dateA).getTime()
    })
    .slice(0, 6)

  const statCards = [
    {
      title: 'Kontakte gesamt',
      value: stats.totalContacts,
      icon: Users,
      light: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
    },
    {
      title: 'Aktive Leads',
      value: stats.activeLeads,
      icon: Target,
      light: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-100',
    },
    {
      title: 'Abschlüsse',
      value: stats.wonDeals,
      subtitle: (stats.revenue/1000).toFixed(1) + 'k€ Umsatz',
      icon: CheckCircle,
      light: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
    },
    {
      title: 'Pipeline-Wert',
      value: `${(stats.pipelineValue / 1000).toFixed(1)}k€`,
      icon: DollarSign,
      light: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
    },
  ]

  // Only show stages with contacts for the pipeline overview (top 5 by count)
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
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={String(card.title)}
            className={`bg-white rounded-xl border ${card.border} p-5 shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{card.title}</span>
              <div className={`${card.light} p-2 rounded-lg`}>
                <card.icon size={16} className={card.text} />
              </div>
            </div>
            <div className={`text-3xl font-bold ${card.text}`}>{card.value}</div>
              {(card as any).subtitle && <div className={`text-xs mt-1 ${card.text} opacity-70 font-semibold`}>{(card as any).subtitle}</div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Overview */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={18} className="text-indigo-600" />
            <h2 className="font-semibold text-gray-900">Pipeline Übersicht</h2>
            <span className="ml-auto text-xs text-gray-400">{contacts.length} Kontakte</span>
          </div>
          <div className="space-y-4">
            {stagesWithContacts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Keine Kontakte vorhanden</p>
            ) : (
              stagesWithContacts.map(({ stage, contacts: stageContacts }) => {
                const value = stageContacts.reduce((s, c) => s + (c.price || 0), 0)
                const pct = Math.round((stageContacts.length / maxCount) * 100)
                return (
                  <div key={stage}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-medium text-gray-700">{statusLabels[stage]}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">{stageContacts.length} Kontakte</span>
                        <span className="text-xs font-bold text-gray-800">{(value / 1000).toFixed(1)}k€</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Recent Contacts */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Clock size={18} className="text-indigo-600" />
            <h2 className="font-semibold text-gray-900">Neueste Kontakte</h2>
          </div>
          {recentContacts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Users size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Noch keine Kontakte</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentContacts.map(contact => {
                const status = contact.pipeline_status || 'nicht_kontaktiert'
                return (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between group py-1 cursor-pointer hover:bg-indigo-50/40 rounded-lg px-2 -mx-2 transition-colors"
                    onClick={() => onNavigateToContacts?.()}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 leading-none">{contact.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{contact.company || contact.email || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${statusColors[status] || 'bg-gray-100 text-gray-600'}`}>
                        {statusLabels[status] || status}
                      </span>
                      <ArrowUpRight size={13} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Status Distribution */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Kontakt-Status Verteilung</h2>
        {contacts.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">Noch keine Kontakte vorhanden</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {stageOrder.map(status => {
              const count = contacts.filter(c => (c.pipeline_status || 'nicht_kontaktiert') === status).length
              const pct = Math.round((count / contacts.length) * 100)
              return (
                <div key={status} className={`rounded-xl p-4 border ${stageColors[status]}`}>
                  <div className={`text-2xl font-bold ${stageTextColors[status]}`}>{count}</div>
                  <div className={`text-xs font-semibold mt-0.5 ${stageTextColors[status]}`}>
                    {statusLabels[status]}
                  </div>
                  <div className={`text-xs mt-1 opacity-60 ${stageTextColors[status]}`}>{pct}%</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
