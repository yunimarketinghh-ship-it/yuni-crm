import { useState, useRef } from 'react'
import { Contact, Deal, supabase } from '../lib/supabase'
import { ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'

const COLUMNS = [
  { key: 'lead',           label: 'Lead',           color: 'bg-blue-50',   dot: 'bg-blue-400',   dropKey: 'lead' },
  { key: 'in_kontakt',     label: 'In Kontakt',     color: 'bg-indigo-50', dot: 'bg-indigo-400', dropKey: 'in_kontakt' },
  { key: 'nicht_erreicht', label: 'Nicht erreicht', color: 'bg-orange-50', dot: 'bg-orange-400', dropKey: 'nicht_erreicht' },
  { key: 'angebot',        label: 'Angebot',        color: 'bg-yellow-50', dot: 'bg-yellow-400', dropKey: 'angebot' },
  { key: 'gewonnen',       label: 'Gewonnen',       color: 'bg-green-50',  dot: 'bg-green-400',  dropKey: 'gewonnen' },
  { key: 'verloren',       label: 'Verloren',       color: 'bg-red-50',    dot: 'bg-red-400',    dropKey: 'verloren' },
]

type SortKey = 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'date_desc', label: 'Neueste zuerst' },
  { value: 'date_asc',  label: 'Älteste zuerst' },
  { value: 'name_asc',  label: 'Name A–Z' },
  { value: 'name_desc', label: 'Name Z–A' },
]

const getDate = (c: Contact) => new Date(c.lead_date || c.created_at).getTime()

const sortContacts = (list: Contact[], sort: SortKey) => {
  return [...list].sort((a, b) => {
    if (sort === 'date_desc') return getDate(b) - getDate(a)
    if (sort === 'date_asc')  return getDate(a) - getDate(b)
    if (sort === 'name_asc')  return a.name.localeCompare(b.name, 'de')
    if (sort === 'name_desc') return b.name.localeCompare(a.name, 'de')
    return 0
  })
}

const byStatus = (contacts: Contact[], key: string) => {
  if (key === 'lead') {
    return contacts.filter(c => {
      const s = c.pipeline_status || 'nicht_kontaktiert'
      return s === 'lead' || s === 'nicht_kontaktiert'
    })
  }
  return contacts.filter(c => (c.pipeline_status || 'nicht_kontaktiert') === key)
}

type Props = {
  contacts: Contact[]
  deals: Deal[]
  onRefresh: () => void
  onSelectContact: (contact: Contact) => void
}

export default function KanbanBoard({ contacts, onRefresh, onSelectContact }: Props) {
  const [dragging, setDragging] = useState<string | null>(null)
  const [sort, setSort] = useState<SortKey>('date_desc')
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' })
  }

  const handleDragStart = (id: string) => setDragging(id)
  const handleDragEnd = () => setDragging(null)

  const handleDrop = async (dropKey: string) => {
    if (!dragging) return
    await supabase.from('contacts').update({ pipeline_status: dropKey }).eq('id', dragging)
    setDragging(null)
    onRefresh()
  }

  return (
    <div>
      {/* Toolbar: sort + scroll buttons — always visible at top */}
      <div className="flex items-center gap-2 mb-3">
        <ArrowUpDown size={14} className="text-gray-400 flex-shrink-0" />
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <div className="ml-auto flex gap-1">
          <button
            onClick={() => scroll('left')}
            className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-1 text-sm text-gray-600"
          >
            <ChevronLeft size={16} /> Links
          </button>
          <button
            onClick={() => scroll('right')}
            className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-1 text-sm text-gray-600"
          >
            Rechts <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Kanban board */}
      <div ref={scrollRef} className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {COLUMNS.map(col => {
            const cards = sortContacts(byStatus(contacts, col.key), sort)
            return (
              <div
                key={col.key}
                className="w-64 flex flex-col gap-2"
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDrop(col.dropKey)}
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
                  {cards.map(contact => {
                    const leadDate = new Date(contact.lead_date || contact.created_at)
                    const dateStr = leadDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
                    return (
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
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">{contact.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 truncate flex-1">{contact.name}</p>
                        </div>
                        {contact.company && (
                          <p className="text-xs text-gray-400 truncate mb-1">{contact.company}</p>
                        )}
                        {contact.phone && (
                          <p className="text-xs text-gray-400 truncate">{contact.phone}</p>
                        )}
                        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-xs text-gray-300">{dateStr}</span>
                          {contact.price != null && contact.price > 0 && (
                            <span className="text-xs font-semibold text-emerald-600">
                              {contact.price.toLocaleString('de-DE')} €
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
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
    </div>
  )
}
