import { useState } from 'react'
import { Deal, Contact } from '../lib/supabase'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  deals: Deal[]
  contacts: Contact[]
  onRefresh: () => void
}

const stages = ['lead', 'interessent', 'verhandlung', 'abschluss']

const stageConfig: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  lead: { label: 'Lead', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-400' },
  interessent: { label: 'Interessent', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', dot: 'bg-purple-400' },
  verhandlung: { label: 'Verhandlung', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-400' },
  abschluss: { label: 'Abschluss', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', dot: 'bg-green-500' },
}

export default function KanbanBoard({ deals: _deals, contacts, onRefresh }: Props) {
  const [movingId, setMovingId] = useState<string | null>(null)

  const moveContact = (contact: Contact, direction: 'left' | 'right') => {
    const currentIdx = stages.indexOf(contact.status || 'lead')
    const newIdx = direction === 'right' ? currentIdx + 1 : currentIdx - 1
    if (newIdx < 0 || newIdx >= stages.length) return
    setMovingId(contact.id)
    const existing: Contact[] = JSON.parse(localStorage.getItem('crm_contacts') || '[]')
    localStorage.setItem('crm_contacts', JSON.stringify(
      existing.map(c => c.id === contact.id ? { ...c, status: stages[newIdx] } : c)
    ))
    setTimeout(() => { setMovingId(null); onRefresh() }, 150)
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-min">
        {stages.map(stage => {
          const cfg = stageConfig[stage]
          const stageContacts = contacts.filter(c => (c.status || 'lead') === stage)
          const totalValue = stageContacts.reduce((sum, c) => sum + ((c as any).price || 0), 0)
          const stageIdx = stages.indexOf(stage)

          return (
            <div key={stage} className="flex-shrink-0 w-72 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden flex flex-col shadow-sm">
              {/* Column Header */}
              <div className={`${cfg.bg} ${cfg.border} border-b p-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                    <h3 className={`font-bold text-sm ${cfg.color}`}>{cfg.label}</h3>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white/80 ${cfg.color} border ${cfg.border} shadow-sm`}>
                    {stageContacts.length}
                  </span>
                </div>
                <div className="mt-1.5 text-xs text-gray-500">
                  Gesamt: <span className="font-bold text-gray-700">
                    {totalValue > 0 ? `${totalValue.toLocaleString('de-DE')} €` : '—'}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ maxHeight: '520px' }}>
                {stageContacts.map(contact => {
                  const price = (contact as any).price
                  return (
                    <div
                      key={contact.id}
                      className={`bg-white rounded-lg border border-gray-200 p-3.5 hover:shadow-md hover:border-indigo-200 transition-all ${movingId === contact.id ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-gray-900 text-sm leading-snug truncate">{contact.name}</h4>
                          {contact.company && <p className="text-xs text-gray-400 truncate">{contact.company}</p>}
                        </div>
                      </div>

                      {(contact as any).product && (
                        <div className="mt-2 text-xs text-gray-500 truncate">{(contact as any).product}</div>
                      )}

                      {price > 0 && (
                        <div className="mt-1.5 text-xs font-bold text-indigo-600">
                          {price.toLocaleString('de-DE')} €
                        </div>
                      )}

                      {/* Stage navigation */}
                      <div className="flex items-center gap-1 mt-2.5 pt-2.5 border-t border-gray-100">
                        <button
                          onClick={() => moveContact(contact, 'left')}
                          disabled={stageIdx === 0}
                          className={`flex items-center gap-0.5 text-xs transition-colors px-1.5 py-0.5 rounded ${
                            stageIdx === 0 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'
                          }`}
                        >
                          <ChevronLeft size={13} />
                          <span>{stageIdx > 0 ? stageConfig[stages[stageIdx - 1]].label : ''}</span>
                        </button>
                        <div className="flex-1" />
                        <button
                          onClick={() => moveContact(contact, 'right')}
                          disabled={stageIdx === stages.length - 1}
                          className={`flex items-center gap-0.5 text-xs transition-colors px-1.5 py-0.5 rounded ${
                            stageIdx === stages.length - 1 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'
                          }`}
                        >
                          <span>{stageIdx < stages.length - 1 ? stageConfig[stages[stageIdx + 1]].label : ''}</span>
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  )
                })}

                {stageContacts.length === 0 && (
                  <div className="text-center py-8 text-gray-300 text-xs">
                    Keine Kontakte
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
