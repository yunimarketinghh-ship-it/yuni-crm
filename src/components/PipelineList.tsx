import { useState } from 'react'
import { Contact, Profile, supabase } from '../lib/supabase'
import AssignModal from './AssignModal'
import { Phone, Search, Inbox, ArrowUpDown, ChevronDown, UserPlus, Trash2, X } from 'lucide-react'

// ── Stage config ──────────────────────────────────────────────────────────────
const STAGE_CONFIG: Record<string, { label: string; badge: string; dot: string; hint: string }> = {
  lead:            { label: 'Neu',            badge: 'bg-brand-50 text-brand-600',     dot: 'bg-brand-500',   hint: 'Neu reingekommen, noch nicht angerufen' },
  in_kontakt:      { label: 'In Kontakt',     badge: 'bg-sky-50 text-sky-600',         dot: 'bg-sky-500',     hint: 'Gespräch läuft' },
  nicht_erreicht:  { label: 'Nicht erreicht', badge: 'bg-orange-50 text-orange-600',   dot: 'bg-orange-500',  hint: 'Angerufen, aber nicht erreicht — nochmal probieren' },
  angebot:         { label: 'Angebot',        badge: 'bg-amber-50 text-amber-600',     dot: 'bg-amber-500',   hint: 'Angebot ist raus, wartet auf Antwort' },
  gewonnen:        { label: 'Gewonnen',       badge: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500', hint: 'Abgeschlossen — Kunde' },
  verloren:        { label: 'Verloren',       badge: 'bg-red-50 text-red-500',         dot: 'bg-red-500',     hint: 'Kein Interesse oder abgesprungen' },
}

const STAGE_KEYS = ['lead', 'in_kontakt', 'nicht_erreicht', 'angebot', 'gewonnen', 'verloren']

function normalizeStage(s: string | null | undefined): string {
  if (!s || s === 'nicht_kontaktiert') return 'lead'
  return s
}

type SortKey = 'date_desc' | 'date_asc' | 'name_asc' | 'price_desc'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'date_desc',  label: 'Neueste zuerst' },
  { value: 'date_asc',   label: 'Älteste zuerst' },
  { value: 'name_asc',   label: 'Name A–Z' },
  { value: 'price_desc', label: 'Höchster Deal-Wert' },
]

type Props = {
  contacts: Contact[]
  onRefresh: () => void
  onSelectContact: (c: Contact) => void
  initialStage?: string | null
  salesReps?: Profile[]   // wenn gesetzt (Admin): Vertriebler-Filter + Mehrfachauswahl
}

export default function PipelineList({ contacts, onRefresh, onSelectContact, initialStage, salesReps }: Props) {
  const [activeStage, setActiveStage] = useState(initialStage && STAGE_KEYS.includes(initialStage) ? initialStage : 'all')
  const [search, setSearch]           = useState('')
  const [sort, setSort]               = useState<SortKey>('date_desc')
  const [filterRep, setFilterRep]     = useState('alle')
  const [selected, setSelected]       = useState<Set<string>>(new Set())
  const [showAssign, setShowAssign]   = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [noteValue, setNoteValue]     = useState('')
  const [editingPrice, setEditingPrice] = useState<string | null>(null)
  const [priceValue, setPriceValue]   = useState('')

  const adminTools = !!salesReps

  // ── Counts ──────────────────────────────────────────────────────────────────
  const counts: Record<string, number> = { all: contacts.length }
  contacts.forEach(c => {
    const s = normalizeStage(c.pipeline_status)
    counts[s] = (counts[s] || 0) + 1
  })

  // ── Filter + Sort ─────────────────────────────────────────────────────────────
  const getDate = (c: Contact) => new Date(c.lead_date || c.created_at).getTime()
  const filtered = contacts
    .filter(c => {
      const stage = normalizeStage(c.pipeline_status)
      if (activeStage !== 'all' && stage !== activeStage) return false
      if (filterRep !== 'alle') {
        if (filterRep === 'unassigned' ? !!c.assigned_to : c.assigned_to !== filterRep) return false
      }
      if (search) {
        const q = search.toLowerCase()
        return (
          (c.name    || '').toLowerCase().includes(q) ||
          (c.company || '').toLowerCase().includes(q) ||
          (c.email   || '').toLowerCase().includes(q) ||
          (c.phone   || '').toLowerCase().includes(q)
        )
      }
      return true
    })
    .sort((a, b) => {
      if (sort === 'date_desc')  return getDate(b) - getDate(a)
      if (sort === 'date_asc')   return getDate(a) - getDate(b)
      if (sort === 'name_asc')   return a.name.localeCompare(b.name, 'de')
      if (sort === 'price_desc') return (b.price || 0) - (a.price || 0)
      return 0
    })

  const filteredValue = filtered.reduce((s, c) => s + (c.price || 0), 0)
  const activeCfg = activeStage !== 'all' ? STAGE_CONFIG[activeStage] : null

  const repName = (id: string | null) => {
    if (!id) return null
    return salesReps?.find(r => r.id === id)?.name || 'Unbekannt'
  }

  // ── Auswahl ──────────────────────────────────────────────────────────────────
  const allSelected = filtered.length > 0 && filtered.every(c => selected.has(c.id))
  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(filtered.map(c => c.id)))
  }
  const toggleOne = (id: string) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  const handleDelete = async () => {
    if (!selected.size) return
    if (!confirm(`${selected.size} Lead(s) wirklich löschen?`)) return
    setDeleting(true)
    await supabase.from('contacts').delete().in('id', Array.from(selected))
    setSelected(new Set())
    onRefresh()
    setDeleting(false)
  }

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
    { key: 'all', label: 'Alle', hint: 'Alle Leads' },
    ...STAGE_KEYS.map(k => ({ key: k, label: STAGE_CONFIG[k].label, hint: STAGE_CONFIG[k].hint })),
  ]

  return (
    <div className="card overflow-hidden">

      {/* ── Search + Filter + Sort ───────────────────────────────────────────── */}
      <div className="px-5 py-3.5 border-b border-ink-100 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Name, Firma, E-Mail oder Telefon…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-soft !py-2 !pl-9"
          />
        </div>
        {adminTools && (
          <div className="relative">
            <select
              value={filterRep}
              onChange={e => setFilterRep(e.target.value)}
              title="Nach Vertriebler filtern"
              className="text-[13px] font-semibold text-ink-700 border border-ink-200 rounded-lg pl-2.5 pr-7 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer appearance-none"
            >
              <option value="alle">Alle Vertriebler</option>
              <option value="unassigned">Nicht zugewiesen</option>
              {salesReps!.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          </div>
        )}
        <div className="relative flex items-center gap-1.5">
          <ArrowUpDown size={13} className="text-ink-400" />
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
            className="text-[13px] font-semibold text-ink-700 border border-ink-200 rounded-lg pl-2 pr-7 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer appearance-none"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-ink-500 font-semibold bg-surface px-3 py-1.5 rounded-full num">
            {filtered.length} Leads
          </span>
          <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-full num">
            {(filteredValue / 1000).toFixed(1)} k€
          </span>
        </div>
      </div>

      {/* ── Stage tabs ────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 px-3 py-2 border-b border-ink-100 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveStage(tab.key)}
            title={tab.hint}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap rounded-full transition-colors ${
              activeStage === tab.key
                ? 'bg-brand-500 text-white shadow-btn'
                : 'text-ink-500 hover:text-ink-700 hover:bg-surface'
            }`}
          >
            {tab.key !== 'all' && <span className={`pill-dot ${activeStage === tab.key ? 'bg-white' : STAGE_CONFIG[tab.key].dot}`} />}
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

      {/* ── Erklärung der aktiven Stage ─────────────────────────────────────── */}
      {activeCfg && (
        <div className="px-5 py-2.5 bg-surface/60 border-b border-ink-100 flex items-center gap-2">
          <span className={`pill-dot ${activeCfg.dot}`} />
          <p className="text-xs text-ink-500"><span className="font-bold text-ink-700">{activeCfg.label}:</span> {activeCfg.hint}</p>
        </div>
      )}

      {/* ── Bulk-Aktionen ────────────────────────────────────────────────────── */}
      {adminTools && selected.size > 0 && (
        <div className="px-5 py-2.5 bg-brand-50/60 border-b border-brand-100 flex items-center gap-2.5 animate-fadeUp">
          <span className="text-sm font-semibold text-ink-700 num">{selected.size} ausgewählt</span>
          <button onClick={() => setShowAssign(true)} className="btn-primary !py-1.5 !px-3 text-xs">
            <UserPlus size={13} /> Zuweisen
          </button>
          <button onClick={handleDelete} disabled={deleting} className="btn-danger !py-1.5 !px-3 text-xs">
            <Trash2 size={13} /> Löschen
          </button>
          <button onClick={() => setSelected(new Set())} className="btn-ghost !py-1.5 !px-3 text-xs ml-auto">
            <X size={13} /> Aufheben
          </button>
        </div>
      )}

      {/* ── Table / Empty state ─────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center text-ink-400">
          <Inbox size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Keine Leads gefunden</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100">
                {adminTools && (
                  <th className="px-5 py-3.5 text-left w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      title="Alle auswählen"
                      className="rounded border-ink-300 text-brand-500 focus:ring-brand-400 cursor-pointer"
                    />
                  </th>
                )}
                <th className={`th w-40 ${adminTools ? '!px-2' : ''}`}>Status</th>
                <th className="th">Name / Firma</th>
                <th className="th w-44">Telefon</th>
                <th className="th w-24">Datum</th>
                {adminTools && <th className="th w-28 hidden lg:table-cell">Vertriebler</th>}
                <th className="th min-w-[160px]">Notiz</th>
                <th className="th w-28">Deal-Wert</th>
                <th className="th w-44">Status ändern</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filtered.map(contact => {
                const stage = normalizeStage(contact.pipeline_status)
                const cfg   = STAGE_CONFIG[stage] ?? STAGE_CONFIG.lead
                const date  = new Date(contact.lead_date || contact.created_at)
                  .toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
                const price = contact.price ?? 0
                const rep = adminTools ? repName(contact.assigned_to) : null

                return (
                  <tr
                    key={contact.id}
                    onClick={() => onSelectContact(contact)}
                    title="Lead öffnen"
                    className={`hover:bg-surface group transition-colors cursor-pointer ${selected.has(contact.id) ? 'bg-brand-50/60' : ''}`}
                  >

                    {/* Checkbox */}
                    {adminTools && (
                      <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(contact.id)}
                          onChange={() => toggleOne(contact.id)}
                          className="rounded border-ink-300 text-brand-500 focus:ring-brand-400 cursor-pointer"
                        />
                      </td>
                    )}

                    {/* Stage badge */}
                    <td className={`td ${adminTools ? '!px-2' : ''}`}>
                      <span className={`pill ${cfg.badge}`} title={cfg.hint}>
                        <span className={`pill-dot ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </td>

                    {/* Name + Company/Email */}
                    <td className="td">
                      <p className="font-semibold text-ink-900 group-hover:text-brand-600 transition-colors leading-tight">
                        {contact.name}
                      </p>
                      {(contact.company || contact.email) && (
                        <p className="text-xs text-ink-400 mt-0.5 truncate max-w-[220px]">{contact.company || contact.email}</p>
                      )}
                    </td>

                    {/* Phone */}
                    <td className="td" onClick={e => e.stopPropagation()}>
                      {contact.phone ? (
                        <a
                          href={`tel:${contact.phone}`}
                          title="Anrufen"
                          className="inline-flex items-center gap-1.5 text-ink-700 bg-surface hover:bg-emerald-50 hover:text-emerald-600 px-2.5 py-1.5 rounded-lg transition-colors text-xs font-semibold num"
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

                    {/* Vertriebler */}
                    {adminTools && (
                      <td className="td hidden lg:table-cell">
                        {rep ? (
                          <span className="text-xs font-semibold text-ink-700">{rep}</span>
                        ) : (
                          <span className="text-xs text-ink-300">–</span>
                        )}
                      </td>
                    )}

                    {/* Note — inline edit */}
                    <td className="td max-w-[180px]" onClick={e => e.stopPropagation()}>
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
                          title="Notiz bearbeiten"
                          className="text-left w-full"
                        >
                          {contact.notes ? (
                            <span className="block text-xs text-ink-700 truncate max-w-[160px] px-1.5 py-1 rounded-lg hover:bg-ink-100 transition-colors">
                              {contact.notes}
                            </span>
                          ) : (
                            <span className="block text-xs text-ink-300 px-1.5 py-1 rounded-lg hover:bg-ink-100 hover:text-ink-500 transition-colors">
                              + Notiz
                            </span>
                          )}
                        </button>
                      )}
                    </td>

                    {/* Price — inline edit */}
                    <td className="td" onClick={e => e.stopPropagation()}>
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
                          title="Deal-Wert bearbeiten"
                          className="text-left"
                        >
                          {price > 0 ? (
                            <span className="text-xs font-bold text-emerald-600 hover:text-emerald-700 px-1.5 py-1 rounded-lg hover:bg-emerald-50 transition-colors num">
                              {price.toLocaleString('de-DE')} €
                            </span>
                          ) : (
                            <span className="text-xs text-ink-300 px-1.5 py-1 rounded-lg hover:bg-ink-100 hover:text-ink-500 transition-colors">
                              + Wert
                            </span>
                          )}
                        </button>
                      )}
                    </td>

                    {/* Status ändern — immer sichtbar */}
                    <td className="td" onClick={e => e.stopPropagation()}>
                      <select
                        value={stage}
                        onChange={e => changeStage(contact.id, e.target.value)}
                        title="Status dieses Leads ändern"
                        className="text-xs font-semibold border border-ink-200 rounded-lg px-2 py-1.5 bg-white text-ink-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer hover:border-brand-300 transition-colors"
                      >
                        {STAGE_KEYS.map(k => (
                          <option key={k} value={k}>{STAGE_CONFIG[k].label}</option>
                        ))}
                      </select>
                    </td>

                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAssign && (
        <AssignModal
          contactIds={Array.from(selected)}
          onClose={() => setShowAssign(false)}
          onDone={() => { setSelected(new Set()); onRefresh() }}
        />
      )}
    </div>
  )
}
