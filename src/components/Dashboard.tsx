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
  lead: 'bg-blue-100 text-blue-700',
  interessent: 'bg-purple-100 text-purple-700',
  verhandlung: 'bg-amber-100 text-amber-700',
  abschluss: 'bg-green-100 text-green-700',
}

const stageOrder = ['interessent', 'verhandlung', 'abschluss']
const stageLabels: Record<string, string> = {
  interessent: 'Interessent',
  verhandlung: 'Verhandlung',
  abschluss: 'Abschluss',
}

export default function Dashboard({ stats, contacts, deals: _deals, onNavigateToContacts }: Props) {
  const recentContacts = [...contacts]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
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
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Overview */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={18} className="text-indigo-600" />
            <h2 className="font-semibold text-gray-900">{'Pipeline Übersicht'}</h2>
            <span className="ml-auto text-xs text-gray-400">{contacts.length} Kontakte</span>
          </div>
          <div className="space-y-4">
            {stageOrder.map(stage => {
              const stageContacts = contacts.filter(c => (c.pipeline_status || '') === stage)
              const value = stageContacts.reduce((s, c) => s + (c.price || 0), 0)
              const maxCount = Math.max(...stageOrder.map(s => contacts.filter(c => (c.pipeline_status || '') === s).length), 1)
              const pct = contacts.length > 0 ? Math.round((stageContacts.length / maxCount) * 100) : 0
              return (
                <div key={stage}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium text-gray-700">{stageLabels[stage]}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{stageContacts.length} Kontakte</span>
                      <span className="text-xs font-bold text-gray-800">{(value / 1000).toFixed(1)}k{'€'}</span>
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
            })}
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
                const status = contact.pipeline_status || 'lead'
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
                        <p className="text-xs text-gray-400 mt-0.5">{contact.company || contact.email || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${statusColors[status] || 'bg-gray-100 text-gray-600'}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
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
        <h2 className="font-semibold text-gray-900 mb-4">{'Kontakt-Status Verteilung'}</h2>
        {contacts.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">Noch keine Kontakte vorhanden</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['interessent', 'verhandlung', 'abschluss'].map(status => {
              const count = contacts.filter(c => c.pipeline_status === status).length
              const pct = Math.round((count / contacts.length) * 100)
              const colorMap: Record<string, string> = {
                lead: 'bg-blue-50 border-blue-100',
                interessent: 'bg-purple-50 border-purple-100',
                verhandlung: 'bg-amber-50 border-amber-100',
                abschluss: 'bg-green-50 border-green-100',
              }
              const textMap: Record<string, string> = {
                lead: 'text-blue-700',
                interessent: 'text-purple-700',
                verhandlung: 'text-amber-700',
                abschluss: 'text-green-700',
              }
              return (
                <div key={status} className={`rounded-xl p-4 border ${colorMap[status]}`}>
                  <div className={`text-2xl font-bold ${textMap[status]}`}>{count}</div>
                  <div className={`text-sm font-semibold mt-0.5 ${textMap[status]}`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </div>
                  <div className={`text-xs mt-1 opacity-60 ${textMap[status]}`}>{pct}%</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
