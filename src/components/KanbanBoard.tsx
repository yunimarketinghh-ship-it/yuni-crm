import { useState } from 'react'
import { Contact, Deal, supabase } from '../lib/supabase'

const COLUMNS = [
  { key: 'nicht_kontaktiert', label: 'Nicht kontaktiert', color: 'bg-gray-100',   dot: 'bg-gray-400' },
  { key: 'lead',              label: 'Lead',               color: 'bg-blue-50',   dot: 'bg-blue-400' },
  { key: 'in_kontakt',        label: 'In Kontakt',         color: 'bg-indigo-50', dot: 'bg-indigo-400' },
  { key: 'nicht_erreicht',    label: 'Nicht erreicht',     color: 'bg-orange-50', dot: 'bg-orange-400' },
  { key: 'angebot',           label: 'Angebot',            color: 'bg-yellow-50', dot: 'bg-yellow-400' },
  { key: 'gewonnen',          label: 'Gewonnen',           color: 'bg-green-50',  dot: 'bg-green-400' },
  { key: 'verloren',          label: 'Verloren',           color: 'bg-red-50',    dot: 'bg-red-400' },
]

type Props = {
  contacts: Contact[]
  deals: Deal[]
  onRefresh: () => void
  onSelectContact: (contact: Contact) => void
}

export default function KanbanBoard({ contacts, onRefresh, onSelectContact }: Props) {
  const [dragging, setDragging] = useState<string | null>(null)

  const byStatus = (key: string) =>
    contacts.filter(c => (c.pipeline_status || 'nicht_kontaktiert') === key)

  const handleDragStart = (id: string) => setDragging(id)
  const handleDragEnd = () => setDragging(null)

  const handleDrop = async (key: string) => {
    if (!dragging) return
    await supabase.from('contacts').update({ pipeline_status: key }).eq('id', dragging)
    setDragging(null)
    onRefresh()
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {COLUMNS.map(col => {
          const cards = byStatus(col.key)
          return (
            <div
              key={col.key}
              className="w-64 flex flex-col gap-2"
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(col.key)}
            >
              {/* Column Header */}
              <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${col.color}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                  <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                </div>
                <span className="text-xs font-medium text-gray-500 bg-white/70 px-2 py-0.5 rounded-full">
                  {cards.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2 min-h-[200px]">
                {cards.map(contact => (
                  <div
                    key={contact.id}
                    draggable
                    onDragStart={() => handleDragStart(contact.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onSelectContact(contact)}
                    className={`bg-white rounded-xl border border-gray-200 p-3 cursor-pointer hover:border-indigo-300 hover:shadow-sm transition-all select-none ${
                      dragging === contact.id ? 'opacity-50 scale-95' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{contact.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 truncate">{contact.name}</p>
                    </div>
                    {contact.company && (
                      <p className="text-xs text-gray-400 truncate mb-1">{contact.company}</p>
                    )}
                    {contact.phone && (
                      <p className="text-xs text-gray-400 truncate">{contact.phone}</p>
                    )}
                    {contact.price != null && contact.price > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <span className="text-xs font-semibold text-emerald-600">
                          {contact.price.toLocaleString('de-DE')} €
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Column total */}
              {cards.length > 0 && (
                <div className="text-xs text-gray-400 text-center py-1">
                  {cards.reduce((sum, c) => sum + (c.price || 0), 0).toLocaleString('de-DE')} € Potenzial
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
