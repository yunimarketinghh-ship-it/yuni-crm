import { useState } from 'react'
import { Contact, supabase } from '../lib/supabase'
import { Phone } from 'lucide-react'

// ââ Stage config ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const STAGE_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
  lead:            { label: 'Lead',           badge: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
  in_kontakt:      { label: 'In Kontakt',     badge: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500'   },
  nicht_erreicht:  { label: 'Nicht erreicht', badge: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500'  },
  angebot:         { label: 'Angebot',        badge: 'bg-orange-100 text-orange-700',dot: 'bg-orange-500' },
  gewonnen:        { label: 'Gewonnen',       badge: 'bg-green-100 text-green-700',  dot: 'bg-green-500'  },
  verloren:        { label: 'Verloren',       badge: 'bg-red-100 text-red-700',      dot: 'bg-red-500'    },
}

const STAGE_KEYS = ['lead', 'in_kontakt', 'nicht_erreicht', 'angebot', 'gewonnen', 'verloren']

function normalizeStage(s: string | null | undefined): string {
  if (!s || s === 'nicht_kontaktiert') return 'lead'
  return s
}

type Props = {
  contacts: Contact[]
  onRefresh: () => void
  onSelectContact: (c: Contact) => void
}

export default function PipelineList({ contacts, onRefresh, onSelectContact }: Props) {
  const [activeStage, setActiveStage] = useState('all')
  const [search, setSearch]           = useState('')
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [noteValue, setNoteValue]     = useState('')
  const [editingPrice, setEditingPrice] = useState<string | null>(null)
  const [priceValue, setPriceValue]   = useState('')

  // ââ Counts ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  const counts: Record<string, number> = { all: contacts.length }
  contacts.forEach(c => {
    const s = normalizeStage(c.pipeline_status)
    counts[s] = (counts[s] || 0) + 1
  })

  // ââ Filter âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  const filtered = contacts.filter(c => {
    const stage = normalizeStage(c.pipeline_status)
    if (activeStage !== 'all' && stage !== activeStage) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        (c.name    || '').toLowerCase().includes(q) ||
        (c.company || '').toLowerCase().includes(q) ||
        (c.phone   || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  // ââ Supabase actions âââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  const saveNote = async (id: string, value: string) => {
    setEditingNote(null)
    await supabase.from('contacts').update({ notes: value }).eq('id', id)
    onRefresh()
  }

  const savePrice = async (id: string, value: string) => {
    setEditingPrice(null)
    const price = parseFloat(value) || 0
    await supabase.from('contacts').update({ price }).eq('id', id)
    onRefresh()
  }

  const changeStage = async (id: string, stage: string) => {
    await supabase.from('contacts').update({ pipeline_status: stage }).eq('id', id)
    onRefresh()
  }

  // ââ Tabs config âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  const tabs = [
    { key: 'all', label: 'Alle' },
    ...STAGE_KEYS.map(k => ({ key: k, label: STAGE_CONFIG[k].label })),
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

      {/* ââ Search bar âââââââââââââââââââââââââââââââââââââââââââââââââââââââ */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">ð</span>
          <input
            type="text"
            placeholder="Name, Firma oder Telefonâ¦"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-colors"
          />
        </div>
        <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
          {filtered.length} Kontakte
        </span>
      </div>

      {/* ââ Stage tabs ââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */}
      <div className="flex border-b border-gray-100 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveStage(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeStage === tab.key
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              activeStage === tab.key
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-500'
            }`}>
              {counts[tab.key] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* ââ Table / Empty state âââââââââââââââââââââââââââââââââââââââââââââââ */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center text-gray-400">
          <p className="text-4xl mb-3">ð­</p>
          <p className="text-sm">Keine Kontakte gefunden</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs uppercase tracking-wide text-gray-400 font-semibold">
                <th className="text-left px-5 py-3 w-36">Stage</th>
                <th className="text-left px-5 py-3">Name / Firma</th>
                <th className="text-left px-5 py-3 w-44">Telefon</th>
                <th className="text-left px-5 py-3 w-24">Datum</th>
                <th className="text-left px-5 py-3 min-w-[180px]">Notiz</th>
                <th className="text-left px-5 py-3 w-28">Deal-Wert</th>
                <th className="text-left px-5 py-3 w-52">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(contact => {
                const stage = normalizeStage(contact.pipeline_status)
                const cfg   = STAGE_CONFIG[stage] ?? STAGE_CONFIG.lead
                const date  = new Date(contact.lead_date || contact.created_at)
                  .toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
                const price = contact.price ?? 0

                return (
                  <tr key={contact.id} className="hover:bg-indigo-50/30 group transition-colors">

                    {/* Stage badge */}
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </td>

                    {/* Name + Company */}
                    <td className="px-5 py-3.5">
                      <button onClick={() => onSelectContact(contact)} className="text-left">
                        <p className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors leading-tight">
                          {contact.name}
                        </p>
                        {contact.company && (
                          <p className="text-xs text-gray-400 mt-0.5">{contact.company}</p>
                        )}
                      </button>
                    </td>

                    {/* Phone */}
                    <td className="px-5 py-3.5">
                      {contact.phone ? (
                        <a
                          href={`tel:${contact.phone}`}
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-gray-700 bg-gray-100 hover:bg-indigo-100 hover:text-indigo-700 px-2.5 py-1.5 rounded-lg transition-colors text-xs font-medium"
                        >
                          <Phone size={11} />
                          {contact.phone}
                        </a>
                      ) : (
                        <span className="text-gray-300 text-xs">â</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5 text-xs text-gray-400 tabular-nums">{date}</td>

                    {/* Note â inline edit */}
                    <td className="px-5 py-3.5 max-w-[200px]">
                      {editingNote === contact.id ? (
                        <input
                          autoFocus
                          type="text"
                          value={noteValue}
                          onChange={e => setNoteValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter')  saveNote(contact.id, noteValue)
                            if (e.key === 'Escape') setEditingNote(null)
                          }}
                          onBlur={() => saveNote(contact.id, noteValue)}
                          className="w-full text-xs border border-indigo-400 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          placeholder="Notiz eingebenâ¦"
                        />
                      ) : (
                        <button
                          onClick={() => { setEditingNote(contact.id); setNoteValue(contact.notes || '') }}
                          className="text-left w-full"
                        >
                          {contact.notes ? (
                            <span className="block text-xs text-gray-600 truncate max-w-[180px] px-1.5 py-1 rounded hover:bg-gray-100 transition-colors">
                              {contact.notes}
                            </span>
                          ) : (
                            <span className="block text-xs text-gray-300 italic px-1.5 py-1 rounded hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100">
                              + Notiz
                            </span>
                          )}
                        </button>
                      )}
                    </td>

                    {/* Price â inline edit */}
                    <td className="px-5 py-3.5">
                      {editingPrice === contact.id ? (
                        <input
                          autoFocus
                          type="number"
                          value={priceValue}
                          onChange={e => setPriceValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter')  savePrice(contact.id, priceValue)
                            if (e.key === 'Escape') setEditingPrice(null)
                          }}
                          onBlur={() => savePrice(contact.id, priceValue)}
                          className="w-24 text-xs border border-indigo-400 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          min="0"
                          placeholder="0"
                        />
                      ) : (
                        <button
                          onClick={() => { setEditingPrice(contact.id); setPriceValue(String(price || '')) }}
                          className="text-left"
                        >
                          {price > 0 ? (
                            <span className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 px-1.5 py-1 rounded hover:bg-gray-100 transition-colors">
                              {price.toLocaleString('de-DE')} â¬
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300 italic px-1.5 py-1 rounded hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100">
                              + Wert
                            </span>
                          )}
                        </button>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">

                        <select
                          value={stage}
                          onChange={e => { e.stopPropagation(); changeStage(contact.id, e.target.value) }}
                          onClick={e => e.stopPropagation()}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer"
                        >
                          {STAGE_KEYS.map(k => (
                            <option key={k} value={k}>{STAGE_CONFIG[k].label}</option>
                          ))}
                        </select>
                      </div>
                    </td>

                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
