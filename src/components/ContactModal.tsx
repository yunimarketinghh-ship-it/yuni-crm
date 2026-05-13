import { useState, useEffect } from 'react'
import { supabase, Contact } from '../lib/supabase'
import { X, Save, Trash2, UserMinus } from 'lucide-react'

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
  const [unassigning, setUnassigning] = useState(false)
  const [error, setError] = useState('')

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))

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

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name ist erforderlich'); return }
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
      if (error) { setError(error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('contacts').insert({ ...payload, id: crypto.randomUUID() })
      if (error) { setError(error.message); setSaving(false); return }
    }
    setSaving(false)
    onSave()
  }

  const handleDelete = async () => {
    if (!contact) return
    if (!confirm('Kontakt wirklich endgültig löschen?')) return
    setDeleting(true)
    await supabase.from('contacts').delete().eq('id', contact.id)
    onSave()
  }

  const handleUnassign = async () => {
    if (!contact) return
    if (!confirm('Zuweisung entfernen? Der Kontakt bleibt erhalten, wird aber keinem Mitarbeiter mehr zugewiesen.')) return
    setUnassigning(true)
    await supabase.from('contacts').update({ assigned_to: null }).eq('id', contact.id)
    setUnassigning(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {contact ? 'Kontakt bearbeiten' : 'Neuer Kontakt'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Firma</label>
              <input value={form.company} onChange={e => set('company', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">E-Mail</label>
              <input value={form.email} onChange={e => set('email', e.target.value)} type="email"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Telefon</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} type="tel"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select value={form.pipeline_status} onChange={e => set('pipeline_status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400">
                {PIPELINE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Angebotswert (€)</label>
              <input value={form.price} onChange={e => set('price', e.target.value)} type="number"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Quelle</label>
              <input value={form.source} onChange={e => set('source', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Notizen</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 resize-none" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 space-y-3">
          {/* Save button */}
          <button onClick={handleSave} disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            <Save className="w-4 h-4" />
            {saving ? 'Wird gespeichert...' : 'Speichern'}
          </button>

          {/* Unassign button — only for existing contacts with assignment */}
          {contact && contact.assigned_to && (
            <button onClick={handleUnassign} disabled={unassigning}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-sm font-medium hover:bg-orange-100 disabled:opacity-50 transition-colors">
              <UserMinus className="w-4 h-4" />
              {unassigning ? 'Wird entfernt...' : 'Zuweisung aufheben'}
            </button>
          )}

          {/* Delete button — only for existing contacts */}
          {contact && (
            <button onClick={handleDelete} disabled={deleting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition-colors">
              <Trash2 className="w-4 h-4" />
              {deleting ? 'Wird gelöscht...' : 'Kontakt endgültig löschen'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
