import { useState } from 'react'
import { Contact, Profile } from '../lib/supabase'
import { supabase } from '../lib/supabase'
import AssignModal from './AssignModal'
import { Search, UserPlus, Trash2, ChevronDown, X } from 'lucide-react'

const STATUS_LABELS: Record<string, { label: string; color: string; dot: string }> = {
  nicht_kontaktiert: { label: 'Nicht kontaktiert', color: 'bg-ink-100 text-ink-500',       dot: 'bg-ink-400' },
  lead:              { label: 'Lead',              color: 'bg-brand-50 text-brand-600',    dot: 'bg-brand-500' },
  in_kontakt:        { label: 'In Kontakt',        color: 'bg-sky-50 text-sky-600',        dot: 'bg-sky-500' },
  nicht_erreicht:    { label: 'Nicht erreicht',    color: 'bg-orange-50 text-orange-600',  dot: 'bg-orange-500' },
  angebot:           { label: 'Angebot',           color: 'bg-amber-50 text-amber-600',    dot: 'bg-amber-500' },
  gewonnen:          { label: 'Gewonnen',          color: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' },
  verloren:          { label: 'Verloren',          color: 'bg-red-50 text-red-500',        dot: 'bg-red-500' },
}

type Props = {
  contacts: Contact[]
  onSelectContact: (contact: Contact) => void
  onRefresh: () => void
  salesReps: Profile[]
}

export default function ContactTable({ contacts, onSelectContact, onRefresh, salesReps }: Props) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('alle')
  const [filterRep, setFilterRep] = useState('alle')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showAssign, setShowAssign] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const filtered = contacts.filter(c => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.company || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || '').includes(search)
    const matchStatus = filterStatus === 'alle' || (c.pipeline_status || '') === filterStatus
    const matchRep = filterRep === 'alle'
      ? true
      : filterRep === 'unassigned'
      ? !c.assigned_to
      : c.assigned_to === filterRep
    return matchSearch && matchStatus && matchRep
  })

  const allSelected = filtered.length > 0 && filtered.every(c => selected.has(c.id))

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(c => c.id)))
    }
  }

  const toggleOne = (id: string) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  const handleDelete = async () => {
    if (!selected.size) return
    if (!confirm(`${selected.size} Kontakt(e) wirklich löschen?`)) return
    setDeleting(true)
    await supabase.from('contacts').delete().in('id', Array.from(selected))
    setSelected(new Set())
    onRefresh()
    setDeleting(false)
  }

  const repName = (id: string | null) => {
    if (!id) return '–'
    return salesReps.find(r => r.id === id)?.name || 'Unbekannt'
  }

  return (
    <div className="space-y-4 animate-fadeUp">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Name, E-Mail, Telefon oder Firma…"
            className="input !pl-10"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="input appearance-none !pr-9 cursor-pointer"
            >
              <option value="alle">Alle Status</option>
              {Object.entries(STATUS_LABELS).filter(([k]) => k !== 'nicht_kontaktiert').map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={filterRep}
              onChange={e => setFilterRep(e.target.value)}
              className="input appearance-none !pr-9 cursor-pointer"
            >
              <option value="alle">Alle Vertriebler</option>
              <option value="unassigned">Nicht zugewiesen</option>
              {salesReps.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2.5 card !rounded-xl px-4 py-2.5 animate-fadeUp">
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

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100">
                <th className="px-5 py-3.5 text-left w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded border-ink-300 text-brand-500 focus:ring-brand-400 cursor-pointer"
                  />
                </th>
                <th className="th !px-2">Name</th>
                <th className="th hidden md:table-cell">Firma</th>
                <th className="th hidden lg:table-cell">Telefon</th>
                <th className="th hidden sm:table-cell">Status</th>
                <th className="th hidden xl:table-cell">Vertriebler</th>
                <th className="th hidden xl:table-cell">Quelle</th>
                <th className="th hidden lg:table-cell">Lead-Datum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-ink-400">
                    Keine Kontakte gefunden.
                  </td>
                </tr>
              ) : (
                filtered.map(contact => {
                  const st = STATUS_LABELS[contact.pipeline_status || ''] || STATUS_LABELS.nicht_kontaktiert
                  return (
                    <tr
                      key={contact.id}
                      className={`hover:bg-surface transition-colors ${selected.has(contact.id) ? 'bg-brand-50/60' : ''}`}
                    >
                      <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(contact.id)}
                          onChange={() => toggleOne(contact.id)}
                          className="rounded border-ink-300 text-brand-500 focus:ring-brand-400 cursor-pointer"
                        />
                      </td>
                      <td className="px-2 py-3 cursor-pointer" onClick={() => onSelectContact(contact)}>
                        <div className="flex items-center gap-2.5">
                          <div className="avatar w-8 h-8 text-xs">
                            {contact.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-ink-900 truncate">{contact.name}</p>
                            {contact.email && <p className="text-xs text-ink-400 truncate">{contact.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="td text-ink-700 hidden md:table-cell">
                        {contact.company || '–'}
                      </td>
                      <td className="td text-ink-700 num hidden lg:table-cell">
                        {contact.phone || '–'}
                      </td>
                      <td className="td hidden sm:table-cell">
                        <span className={`pill ${st.color}`}>
                          <span className={`pill-dot ${st.dot}`} />
                          {st.label}
                        </span>
                      </td>
                      <td className="td text-ink-700 hidden xl:table-cell">
                        {repName(contact.assigned_to)}
                      </td>
                      <td className="td text-ink-500 text-xs hidden xl:table-cell capitalize">
                        {contact.source || '–'}
                      </td>
                      <td className="td text-ink-400 text-xs num hidden lg:table-cell">
                        {new Date(contact.lead_date || contact.created_at).toLocaleDateString('de-DE')}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-ink-100 text-xs text-ink-400 num">
          {filtered.length} von {contacts.length} Kontakten
        </div>
      </div>

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
