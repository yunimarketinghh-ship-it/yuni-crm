import { useState } from 'react'
import { Contact, Profile } from '../lib/supabase'
import { supabase } from '../lib/supabase'
import AssignModal from './AssignModal'
import { Search, UserPlus, Trash2, ChevronDown } from 'lucide-react'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  nicht_kontaktiert: { label: 'Nicht kontaktiert', color: 'bg-gray-100 text-gray-700' },
  lead:              { label: 'Lead',               color: 'bg-blue-100 text-blue-700' },
  in_kontakt:        { label: 'In Kontakt',         color: 'bg-indigo-100 text-indigo-700' },
  nicht_erreicht:    { label: 'Nicht erreicht',     color: 'bg-orange-100 text-orange-700' },
  angebot:           { label: 'Angebot',            color: 'bg-yellow-100 text-yellow-700' },
  gewonnen:          { label: 'Gewonnen',           color: 'bg-green-100 text-green-700' },
  verloren:          { label: 'Verloren',           color: 'bg-red-100 text-red-700' },
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

  // const selectedContacts = contacts.filter(c => selected.has(c.id))

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
    if (!id) return '-'
    return salesReps.find(r => r.id === id)?.name || 'Unbekannt'
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Name, E-Mail, Telefon oder Firma..."
            className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="appearance-none border border-gray-300 rounded-lg pl-3 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="alle">Alle Status</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={filterRep}
              onChange={e => setFilterRep(e.target.value)}
              className="appearance-none border border-gray-300 rounded-lg pl-3 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="alle">Alle Vertriebler</option>
              <option value="unassigned">Nicht zugewiesen</option>
              {salesReps.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2.5">
          <span className="text-sm font-medium text-indigo-700">{selected.size} ausgewählt</span>
          <button
            onClick={() => setShowAssign(true)}
            className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <UserPlus size={14} /> Zuweisen
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 bg-red-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <Trash2 size={14} /> Löschen
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-sm text-indigo-500 hover:text-indigo-700 ml-auto"
          >
            Auswahl aufheben
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 hidden md:table-cell">Firma</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 hidden lg:table-cell">Telefon</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 hidden sm:table-cell">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 hidden xl:table-cell">Vertriebler</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 hidden xl:table-cell">Quelle</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 hidden lg:table-cell">Lead-Datum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-gray-400 italic">
                    Keine Kontakte gefunden.
                  </td>
                </tr>
              ) : (
                filtered.map(contact => {
                  const st = STATUS_LABELS[contact.pipeline_status || ''] || STATUS_LABELS.nicht_kontaktiert
                  return (
                    <tr
                      key={contact.id}
                      className={`hover:bg-gray-50 transition-colors ${selected.has(contact.id) ? 'bg-indigo-50' : ''}`}
                    >
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(contact.id)}
                          onChange={() => toggleOne(contact.id)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td
                        className="px-4 py-3 cursor-pointer"
                        onClick={() => onSelectContact(contact)}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-xs">{contact.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{contact.name}</p>
                            {contact.email && <p className="text-xs text-gray-400">{contact.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                        {contact.company || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                        {contact.phone || '–'}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${st.color}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden xl:table-cell">
                        {repName(contact.assigned_to)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden xl:table-cell capitalize">
                        {contact.source || '–'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                        {new Date(contact.lead_date || contact.created_at).toLocaleDateString('de-DE')}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
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
