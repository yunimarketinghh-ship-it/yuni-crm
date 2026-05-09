import { useState, useEffect } from 'react'
import { supabase, Contact } from '../lib/supabase'
import { X, Save, Trash2 } from 'lucide-react'

const PIPELINE_OPTIONS = [
  { value: 'nicht_kontaktiert', label: 'Nicht kontaktiert' },
  { value: 'lead',              label: 'Lead' },
  { value: 'in_kontakt',        label: 'In Kontakt' },
  { value: 'nicht_erreicht',    label: 'Nicht erreicht' },
  { value: 'angebot',           label: 'Angebot' },
  { value: 'gewonnen',          label: 'Gewonnen' },
  { value: 'verloren',          label: 'Verloren' },
]

type Props = {
  contact: Contact | null
  onClose: () => void
  onSave: () => void
}

export default function ContactModal({ contact, onClose, onSave }: Props) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    pipeline_status: 'nicht_kontaktiert',
    price: '',
    notes: '',
    source: '',
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (contact) {
      setForm({
        name: contact.name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        company: contact.company || '',
        pipeline_status: contact.pipeline_status || 'nicht_kontaktiert',
        price: contact.price != null ? String(contact.price) : '',
        notes: contact.notes || '',
        source: contact.source || '',
      })
    }
  }, [contact])

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name ist erforderlich.'); return }
    setSaving(true)
    setError('')

    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      company: form.company.trim() || null,
      pipeline_status: form.pipeline_status,
      price: form.price ? parseFloat(form.price) : null,
      notes: form.notes.trim() || null,
      source: form.source.trim() || null,
    }

    if (contact) {
      const { error } = await supabase.from('contacts').update(payload).eq('id', contact.id)
      if (error) { setError('Fehler beim Speichern.'); setSaving(false); return }
    } else {
      const { error } = await supabase.from('contacts').insert({ ...payload, id: crypto.randomUUID() })
      if (error) { setError('Fehler beim Erstellen.'); setSaving(false); return }
    }

    setSaving(false)
    onSave()
  }

  const handleDelete = async () => {
    if (!contact) return
    if (!confirm('Kontakt wirklich löschen?')) return
    setDeleting(true)
    await supabase.from('contacts').delete().eq('id', contact.id)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold text-gray-900">
            {contact ? 'Kontakt bearbeiten' : 'Neuer Kontakt'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
              <input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Max Mustermann"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Firma</label>
              <input
                value={form.company}
                onChange={e => set('company', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Musterfirma GmbH"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">E-Mail</label>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="max@beispiel.de"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Telefon</label>
              <input
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="+49 170 1234567"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={form.pipeline_status}
                onChange={e => set('pipeline_status', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {PIPELINE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Angebotswert (€)</label>
              <input
                type="number"
                value={form.price}
                onChange={e => set('price', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="1499"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Quelle</label>
              <input
                value={form.source}
                onChange={e => set('source', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="facebook, website, empfehlung..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notizen</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Interne Notizen..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex items-center gap-3">
          {contact && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 text-red-600 hover:text-red-800 text-sm font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} /> Löschen
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              <Save size={14} /> {saving ? 'Speichert...' : 'Speichern'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
