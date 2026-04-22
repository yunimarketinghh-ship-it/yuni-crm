import { useState } from 'react'
import { Deal, Contact } from '../lib/supabase'
import { DollarSign, Plus, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'

interface Props {
  deals: Deal[]
  contacts: Contact[]
  onRefresh: () => void
}

const stages = ['lead', 'interessent', 'verhandlung', 'abschluss']

const stageConfig: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  lead: {
    label: 'Lead',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    dot: 'bg-blue-400',
  },
  interessent: {
    label: 'Interessent',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    dot: 'bg-purple-400',
  },
  verhandlung: {
    label: 'Verhandlung',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    dot: 'bg-amber-400',
  },
  abschluss: {
    label: 'Abschluss',
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    dot: 'bg-green-500',
  },
}

interface NewDeal {
  title: string
  value: string
  contact_id: string
}

export default function KanbanBoard({ deals, contacts, onRefresh }: Props) {
  const [addingToStage, setAddingToStage] = useState<string | null>(null)
  const [newDeal, setNewDeal] = useState<NewDeal>({ title: '', value: '', contact_id: '' })
  const [saving, setSaving] = useState(false)

  const getContactName = (contactId: string | null) => {
    if (!contactId) return null
    return contacts.find(c => c.id === contactId)?.name || null
  }

  const moveStage = (deal: Deal, direction: 'left' | 'right') => {
    const currentIdx = stages.indexOf(deal.stage)
    const newIdx = direction === 'right' ? currentIdx + 1 : currentIdx - 1
    if (newIdx < 0 || newIdx >= stages.length) return
    const existing: Deal[] = JSON.parse(localStorage.getItem('crm_deals') || '[]')
    localStorage.setItem('crm_deals', JSON.stringify(existing.map(d => d.id === deal.id ? { ...d, stage: stages[newIdx] } : d)))
    onRefresh()
  }

  const deleteDeal = (dealId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Deal wirklich lÃ¶schen?')) return
    const existing: Deal[] = JSON.parse(localStorage.getItem('crm_deals') || '[]')
    localStorage.setItem('crm_deals', JSON.stringify(existing.filter(d => d.id !== dealId)))
    onRefresh()
  }

  const handleAddDeal = (stage: string) => {
    if (!newDeal.title.trim()) return
    setSaving(true)
    const deal: Deal = {
      id: Math.random().toString(36).substr(2, 9),
      title: newDeal.title,
      value: newDeal.value ? parseFloat(newDeal.value) : null,
      contact_id: newDeal.contact_id || null,
      stage,
      created_at: new Date().toISOString(),
    }
    const existing: Deal[] = JSON.parse(localStorage.getItem('crm_deals') || '[]')
    existing.push(deal)
    localStorage.setItem('crm_deals', JSON.stringify(existing))
    setNewDeal({ title: '', value: '', contact_id: '' })
    setAddingToStage(null)
    setSaving(false)
    onRefresh()
  }

  const cancelAdd = () => {
    setAddingToStage(null)
    setNewDeal({ title: '', value: '', contact_id: '' })
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-min">
        {stages.map(stage => {
          const cfg = stageConfig[stage]
          const stageDeals = deals.filter(d => d.stage === stage)
          const totalValue = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0)
          const stageIdx = stages.indexOf(stage)

          return (
            <div
              key={stage}
              className="flex-shrink-0 w-72 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden flex flex-col shadow-sm"
            >
              {/* Column Header */}
              <div className={`${cfg.bg} ${cfg.border} border-b p-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                    <h3 className={`font-bold text-sm ${cfg.color}`}>{cfg.label}</h3>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white/80 ${cfg.color} border ${cfg.border} shadow-sm`}>
                    {stageDeals.length}
                  </span>
                </div>
                <div className="mt-1.5 text-xs text-gray-500">
                  Gesamt: <span className="font-bold text-gray-700">
                    {totalValue > 0 ? `${totalValue.toLocaleString('de-DE')}â¬` : 'â'}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ maxHeight: '520px' }}>
                {stageDeals.map(deal => {
                  const contactName = getContactName(deal.contact_id)
                  return (
                    <div
                      key={deal.id}
                      className="bg-white rounded-lg border border-gray-200 p-3.5 hover:shadow-md hover:border-indigo-200 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-gray-900 text-sm leading-snug">{deal.title}</h4>
                        <button
                          onClick={(e) => deleteDeal(deal.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-300 hover:text-red-500 transition-all flex-shrink-0 mt-0.5"
                          title="Deal lÃ¶schen"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {contactName && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-indigo-300 to-purple-400 flex items-center justify-center text-white text-[9px] font-bold">
                            {contactName.charAt(0)}
                          </div>
                          <span className="text-xs text-gray-500">{contactName}</span>
                        </div>
                      )}

                      {deal.value && (
                        <div className="flex items-center gap-1 mt-2 text-xs font-bold text-indigo-600">
                          <DollarSign size={11} />
                          {deal.value.toLocaleString('de-DE')}â¬
                        </div>
                      )}

                      {/* Stage navigation arrows */}
                      <div className="flex items-center gap-1 mt-2.5 pt-2.5 border-t border-gray-100">
                        <button
                          onClick={() => moveStage(deal, 'left')}
                          disabled={stageIdx === 0}
                          className={`flex items-center gap-0.5 text-xs transition-colors px-1.5 py-0.5 rounded ${
                            stageIdx === 0
                              ? 'text-gray-200 cursor-not-allowed'
                              : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'
                          }`}
                          title={stageIdx > 0 ? `â ${stageConfig[stages[stageIdx - 1]].label}` : ''}
                        >
                          <ChevronLeft size={13} />
                          <span>{stageIdx > 0 ? stageConfig[stages[stageIdx - 1]].label : ''}</span>
                        </button>
                        <div className="flex-1" />
                        <button
                          onClick={() => moveStage(deal, 'right')}
                          disabled={stageIdx === stages.length - 1}
                          className={`flex items-center gap-0.5 text-xs transition-colors px-1.5 py-0.5 rounded ${
                            stageIdx === stages.length - 1
                              ? 'text-gray-200 cursor-not-allowed'
                              : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'
                          }`}
                          title={stageIdx < stages.length - 1 ? `${stageConfig[stages[stageIdx + 1]].label} â` : ''}
                        >
                          <span>{stageIdx < stages.length - 1 ? stageConfig[stages[stageIdx + 1]].label : ''}</span>
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  )
                })}

                {/* Add deal inline form */}
                {addingToStage === stage ? (
                  <div className="bg-white rounded-lg border-2 border-indigo-300 p-3 space-y-2 shadow-sm">
                    <input
                      type="text"
                      placeholder="Deal-Titel *"
                      value={newDeal.title}
                      onChange={e => setNewDeal({ ...newDeal, title: e.target.value })}
                      onKeyDown={e => e.key === 'Enter' && handleAddDeal(stage)}
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      autoFocus
                    />
                    <input
                      type="number"
                      placeholder="Wert in â¬ (optional)"
                      value={newDeal.value}
                      onChange={e => setNewDeal({ ...newDeal, value: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <select
                      value={newDeal.contact_id}
                      onChange={e => setNewDeal({ ...newDeal, contact_id: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                    >
                      <option value="">Kein Kontakt</option>
                      {contacts.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={cancelAdd}
                        className="flex-1 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                      >
                        Abbrechen
                      </button>
                      <button
                        onClick={() => handleAddDeal(stage)}
                        disabled={!newDeal.title.trim() || saving}
                        className="flex-1 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-semibold"
                      >
                        {saving ? '...' : 'HinzufÃ¼gen'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingToStage(stage)}
                    className="w-full py-2.5 text-xs text-gray-400 hover:text-indigo-600 hover:bg-white border border-dashed border-gray-300 hover:border-indigo-400 rounded-lg transition-all flex items-center justify-center gap-1.5 font-medium"
                  >
                    <Plus size={13} />
                    Deal hinzufÃ¼gen
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
