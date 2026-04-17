import { Contact } from '../lib/supabase'
import { Phone, Mail } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

interface Props {
  contacts: Contact[]
  onSelectContact: (contact: Contact) => void
}

const statusColors: Record<string, string> = {
  lead: 'bg-blue-100 text-blue-800',
  interessent: 'bg-purple-100 text-purple-800',
  verhandlung: 'bg-yellow-100 text-yellow-800',
  abschluss: 'bg-green-100 text-green-800',
}

export default function ContactTable({ contacts, onSelectContact }: Props) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Firma</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Kontakt</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Produkt (Preis)</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Hinzugefügt</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {contacts.map(contact => (
              <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-semibold">
                      {contact.name.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-900">{contact.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{contact.company || '—'}</td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex flex-col gap-1">
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className="text-indigo-600 hover:underline flex items-center gap-1">
                        <Mail size={14} />
                        {contact.email}
                      </a>
                    )}
                    {contact.phone && (
                      <a href={`tel:${contact.phone}`} className="text-indigo-600 hover:underline flex items-center gap-1">
                        <Phone size={14} />
                        {contact.phone}
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColors[contact.status || contact.pipeline_status || ''] || 'bg-gray-100 text-gray-800'}`}>
                    {(contact.status || contact.pipeline_status || 'lead').charAt(0).toUpperCase() + (contact.status || contact.pipeline_status || 'lead').slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {(contact.product || contact.produkt) ? `${contact.product || contact.produkt}${contact.price ? ` (${contact.price}€)` : ''}` : '—'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {formatDistanceToNow(new Date(contact.created_at), { addSuffix: true, locale: de })}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onSelectContact(contact)}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {contacts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Keine Kontakte vorhanden</p>
        </div>
      )}
    </div>
  )
}
