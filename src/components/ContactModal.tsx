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
    <div className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card shadow-pop w-full max-w-lg max-h-[90vh] flex flex-col animate-fadeUp">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-ink-100">
          <h2 className="text-lg font-bold text-ink-900 tracking-tight">
            {contact ? 'Kontakt bearbeiten' : 'Neuer Kontakt'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-surface rounded-xl transition-colors">
            <X className="w-5 h-5 text-ink-400" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3.5 py-2.5 rounded-xl">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} className="input" />
            </div>
            <div className="col-span-2">
              <label className="label">Firma</label>
              <input value={form.company} onChange={e => set('company', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">E-Mail</label>
              <input value={form.email} onChange={e => set('email', e.target.value)} type="email" className="input" />
            </div>
            <div>
              <label className="label">Telefon</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} type="tel" className="input" />
            </div>
            <div>
              <label className="label">Status</label>
              <select value={form.pipeline_status} onChange={e => set('pipeline_status', e.target.value)} className="input cursor-pointer">
                {PIPELINE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Angebotswert (€)</label>
              <input value={form.price} onChange={e => set('price', e.target.value)} type="number" className="input num" />
            </div>
            <div className="col-span-2">
              <label className="label">Quelle</label>
              <input value={form.source} onChange={e => set('source', e.target.value)} className="input" />
            </div>
            <div className="col-span-2">
              <label className="label">Notizen</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} className="input resize-none" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-ink-100 space-y-3">
          <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3">
            <Save className="w-4 h-4" />
            {saving ? 'Wird gespeichert…' : 'Speichern'}
          </button>

          {contact && contact.assigned_to && (
            <button onClick={handleUnassign} disabled={unassigning}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-orange-50 text-orange-700 border border-orange-100 rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-orange-100 transition-colors">
              <UserMinus className="w-4 h-4" />
              {unassigning ? 'Wird entfernt…' : 'Zuweisung aufheben'}
            </button>
          )}

          {contact && (
            <button onClick={handleDelete} disabled={deleting} className="btn-danger w-full">
              <Trash2 className="w-4 h-4" />
              {deleting ? 'Wird gelöscht…' : 'Kontakt endgültig löschen'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
