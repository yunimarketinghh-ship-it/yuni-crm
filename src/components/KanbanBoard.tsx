import { Deal, Contact } from '../lib/supabase'
import { DollarSign } from 'lucide-react'

interface Props {
  deals: Deal[]
  contacts: Contact[]
  onRefresh: () => void
}

const stages = ['lead', 'interessent', 'verhandlung', 'abschluss']
const stageLabels: Record<string, string> = {
  lead: '🔵 Lead',
  interessent: '🟣 Interessent',
  verhandlung: '🟡 Verhandlung',
  abschluss: '✅ Abschluss',
}

export default function KanbanBoard({ deals, contacts }: Props) {
  const getContactName = (contactId: string | null) => {
    if (!contactId) return 'Kein Kontakt'
    return contacts.find(c => c.id === contactId)?.name || 'Unbekannt'
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-min">
        {stages.map(stage => {
          const stageDeal = deals.filter(d => d.stage === stage)
          const totalValue = stageDeal.reduce((sum, d) => sum + (d.value || 0), 0)

          return (
            <div
              key={stage}
              className="flex-shrink-0 w-80 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-white border-b border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900">{stageLabels[stage]}</h3>
                <div className="mt-2 text-sm text-gray-600">
                  {stageDeal.length} Deals · {(totalValue / 1000).toFixed(1)}k€
                </div>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {stageDeal.map(deal => (
                  <div
                    key={deal.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 cursor-move hover:shadow-md transition-shadow"
                  >
                    <h4 className="font-medium text-gray-900 mb-2">{deal.title}</h4>
                    <div className="text-sm text-gray-600 mb-2">
                      {getContactName(deal.contact_id)}
                    </div>
                    {deal.value && (
                      <div className="flex items-center gap-1 text-sm font-semibold text-indigo-600">
                        <DollarSign size={16} />
                        {(deal.value / 1000).toFixed(1)}k€
                      </div>
                    )}
                  </div>
                ))}

                {stageDeal.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Keine Deals
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
