import { useState } from 'react'
import { Contact, supabase } from '../lib/supabase'
import { Phone, Search, Inbox } from 'lucide-react'

// ── Stage config ──────────────────────────────────────────────────────────────
const STAGE_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
  lead:            { label: 'Lead',           badge: 'bg-brand-50 text-brand-600',     dot: 'bg-brand-500' },
  in_kontakt:      { label: 'In Kontakt',     badge: 'bg-sky-50 text-sky-600',         dot: 'bg-sky-500' },
  nicht_erreicht:  { label: 'Nicht erreicht', badge: 'bg-orange-50 text-orange-600',   dot: 'bg-orange-500' },
  angebot:         { label: 'Angebot',        badge: 'bg-amber-50 text-amber-600',     dot: 'bg-amber-500' },
  gewonnen:        { label: 'Gewonnen',       badge: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' },
  verloren:        { label: 'Verloren',       badge: 'bg-red-50 text-red-500',         dot: 'bg-red-500' },
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

  // ── Counts ──────────────────────────────────────────────────────────────────
  const counts: Record<string, number> = { all: contacts.length }
  contacts.forEach(c => {
    const s = normalizeStage(c.pipeline_status)
    counts[s] = (counts[s] || 0) + 1
  })

  // ── Filter ───────────────────────────────────────────────────────────────────
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

  // ── Supabase actions ─────────────────────────────────────────────────────────
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

  // ── Tabs config ───────────────────────────────────────────────────────────────
  const tabs = [
    { key: 'all', label: 'Alle' },
    ...STAGE_KEYS.map(k => ({ key: k, label: STAGE_CONFIG[k].label })),
  ]

  return (
    <div className="card overflow-hidden">

      {/* ── Search bar ───────────────────────────────────────────────────────── */}
      <div className="px-5 py-3.5 border-b border-ink-100 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Name, Firma oder Telefon…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-soft !py-2 !pl-9"
          />
        </div>
        <span className="ml-auto text-xs text-ink-500 font-semibold bg-surface px-3 py-1.5 rounded-full num">
          {filtered.length} Kontakte
        </span>
      </div>

      {/* ── Stage tabs ────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 px-3 py-2 border-b border-ink-100 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveStage(tab.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap rounded-full transition-colors ${
              activeStage === tab.key
                ? 'bg-brand-500 text-white shadow-btn'
                : 'text-ink-500 hover:text-ink-700 hover:bg-surface'
            }`}
          >
            {tab.label}
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold num ${
              activeStage === tab.key
                ? 'bg-white/20 text-white'
                : 'bg-surface text-ink-500'
            }`}>
              {counts[tab.key] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* ── Table / Empty state ─────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center text-ink-400">
          <Inbox size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Keine Kontakte gefunden</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100">
                <th className="th w-36">Stage</th>
                <th className="th">Name / Firma</th>
                <th className="th w-44">Telefon</th>
                <th className="th w-24">Datum</th>
                <th className="th min-w-[180px]">Notiz</th>
                <th className="th w-28">Deal-Wert</th>
                <th className="th w-52">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filtered.map(contact => {
                const stage = normalizeStage(contact.pipeline_status)
                const cfg   = STAGE_CONFIG[stage] ?? STAGE_CONFIG.lead
                const date  = new Date(contact.lead_date || contact.created_at)
                  .toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
                const price = contact.price ?? 0

                return (
                  <tr key={contact.id} className="hover:bg-surface group transition-colors">

                    {/* Stage badge */}
                    <td className="td">
                      <span className={`pill ${cfg.badge}`}>
                        <span className={`pill-dot ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </td>

                    {/* Name + Company */}
                    <td className="td">
                      <button onClick={() => onSelectContact(contact)} className="text-left">
                        <p className="font-semibold text-ink-900 hover:text-brand-600 transition-colors leading-tight">
                          {contact.name}
                        </p>
                        {contact.company && (
                          <p className="text-xs text-ink-400 mt-0.5">{contact.company}</p>
                        )}
                      </button>
                    </td>

                    {/* Phone */}
                    <td className="td">
                      {contact.phone ? (
                        <a
                          href={`tel:${contact.phone}`}
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-ink-700 bg-surface hover:bg-brand-50 hover:text-brand-600 px-2.5 py-1.5 rounded-lg transition-colors text-xs font-semibold num"
                        >
                          <Phone size={11} />
                          {contact.phone}
                        </a>
                      ) : (
                        <span className="text-ink-300 text-xs">–</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="td text-xs text-ink-400 num">{date}</td>

                    {/* Note — inline edit */}
                    <td className="td max-w-[200px]">
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
                          className="w-full text-xs border border-brand-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                          placeholder="Notiz eingeben…"
                        />
                      ) : (
                        <button
                          onClick={() => { setEditingNote(contact.id); setNoteValue(contact.notes || '') }}
                          className="text-left w-full"
                        >
                          {contact.notes ? (
                            <span className="block text-xs text-ink-700 truncate max-w-[180px] px-1.5 py-1 rounded-lg hover:bg-ink-100 transition-colors">
                              {contact.notes}
                            </span>
                          ) : (
                            <span className="block text-xs text-ink-300 px-1.5 py-1 rounded-lg hover:bg-ink-100 transition-colors opacity-0 group-hover:opacity-100">
                              + Notiz
                            </span>
                          )}
                        </button>
                      )}
                    </td>

                    {/* Price — inline edit */}
                    <td className="td">
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
                          className="w-24 text-xs border border-brand-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                          min="0"
                          placeholder="0"
                        />
                      ) : (
                        <button
                          onClick={() => { setEditingPrice(contact.id); setPriceValue(String(price || '')) }}
                          className="text-left"
                        >
                          {price > 0 ? (
                            <span className="text-xs font-bold text-emerald-600 hover:text-emerald-700 px-1.5 py-1 rounded-lg hover:bg-emerald-50 transition-colors num">
                              {price.toLocaleString('de-DE')} €
                            </span>
                          ) : (
                            <span className="text-xs text-ink-300 px-1.5 py-1 rounded-lg hover:bg-ink-100 transition-colors opacity-0 group-hover:opacity-100">
                              + Wert
                            </span>
                          )}
                        </button>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="td">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <select
                          value={stage}
                          onChange={e => { e.stopPropagation(); changeStage(contact.id, e.target.value) }}
                          onClick={e => e.stopPropagation()}
                          className="text-xs border border-ink-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
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
