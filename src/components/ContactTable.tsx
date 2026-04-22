import { useState } from 'react'
import { Contact, supabase } from '../lib/supabase'
import { Phone, Mail, Search, Filter, Trash2, Edit2, UserPlus } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

interface Props {
  contacts: Contact[]
  onSelectContact: (contact: Contact) => void
  onRefresh: () => void
}

const statusColors: Record<string, string> = {
  lead: 'bg-blue-100 text-blue-700',
  interessent: 'bg-purple-100 text-purple-700',
  verhandlung: 'bg-amber-100 text-amber-700',
  abschluss: 'bg-green-100 text-green-700',
}

export default function ContactTable({ contacts, onSelectContact, onRefresh }: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deleting, setDeleting] = useState<string | null>(null)

  const filtered = contacts.filter(c => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.company || '').toLowerCase().includes(search.toLowerCase())
    const status = c.status || c.pipeline_status || 'lead'
    const matchStatus = statusFilter === 'all' || status === statusFilter
    return matchSearch && matchStatus
  })

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Kontakt wirklich löschen?')) return
    setDeleting(id)
    try {
      await supabase.from('contacts').delete().eq('id', id)
      onRefresh()
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Name, Email oder Firma suchen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
          >
            <option value="all">Alle Status</option>
            <option value="lead">Lead</option>
            <option value="interessent">Interessent</option>
            <option value="verhandlung">Verhandlung</option>
            <option value="abschluss">Abschluss</option>
          </select>
          <span className="text-sm text-gray-400 font-medium">{filtered.length} Kontakte</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Firma</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kontakt</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Produkt</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Hinzugefügt</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(contact => {
                const status = contact.status || contact.pipeline_status || 'lead'
                return (
                  <tr
                    key={contact.id}
                    className="hover:bg-indigo-50/30 transition-colors cursor-pointer"
                    onClick={() => onSelectContact(contact)}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-900 text-sm">{contact.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">{contact.company || '—'}</td>
                    <td className="px-5 py-4 text-sm">
                      <div className="flex flex-col gap-0.5">
                        {contact.email && (
                          <a
                            href={`mailto:${contact.email}`}
                            onClick={e => e.stopPropagation()}
                            className="text-indigo-600 hover:underline flex items-center gap-1 text-xs"
                          >
                            <Mail size={11} /> {contact.email}
                          </a>
                        )}
                        {contact.phone && (
                          <a
                            href={`tel:${contact.phone}`}
                            onClick={e => e.stopPropagation()}
                            className="text-indigo-600 hover:underline flex items-center gap-1 text-xs"
                          >
                            <Phone size={11} /> {contact.phone}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[status] || 'bg-gray-100 text-gray-600'}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {(contact.product || contact.produkt)
                        ? `${contact.product || contact.produkt}${contact.price ? ` · ${contact.price}€` : ''}`
                        : '—'}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-400">
                      {formatDistanceToNow(new Date(contact.created_at), { addSuffix: true, locale: de })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectContact(contact)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Bearbeiten"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(contact.id, e)}
                          disabled={deleting === contact.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Löschen"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <UserPlus className="mx-auto text-gray-200 mb-3" size={48} />
            <p className="text-gray-500 font-semibold">
              {search || statusFilter !== 'all' ? 'Keine Kontakte gefunden' : 'Noch keine Kontakte'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {search || statusFilter !== 'all'
                ? 'Suchkriterien anpassen'
                : 'Klicke auf "Kontakt" oben rechts, um loszulegen'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
