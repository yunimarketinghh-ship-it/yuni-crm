import { useState } from 'react'
import { Contact } from '../lib/supabase'
import { X } from 'lucide-react'

interface Props {
  contact: Contact | null
  onClose: () => void
  onSave: () => void
}

const STATUS_OPTIONS = [
  { value: 'lead', label: 'Lead' },
  { value: 'interessent', label: 'Interessent' },
  { value: 'verhandlung', label: 'Verhandlung' },
  { value: 'abschluss', label: 'Abschluss' },
]

const PRODUCT_PRICES: Record<string, number> = {
  'Standard Erklärvideo': 500,
  'C3 3D Video': 850,
}

export default function ContactModal({ contact, onClose, onSave }: Props) {
  const c = contact as any
  const [formData, setFormData] = useState({
    name: c?.name || '',
    email: c?.email || '',
    phone: c?.phone || '',
    company: c?.company || '',
    product: c?.product || c?.produkt || '',
    price: String(c?.price || ''),
    status: c?.status || c?.pipeline_status || 'lead',
    startzeitpunkt: c?.startzeitpunkt || '',
    notes: c?.notes || '',
  })
  const [saving, setSaving] = useState(false)

  const handleProductChange = (product: string) => {
    const autoPrice = PRODUCT_PRICES[product]
    setFormData(prev => ({
      ...prev,
      product,
      price: autoPrice ? String(autoPrice) : (product === 'Sonstiges' ? prev.price : ''),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const existing: any[] = JSON.parse(localStorage.getItem('crm_contacts') || '[]')
      const price = formData.price ? Number(formData.price) : (PRODUCT_PRICES[formData.product] || 0)
      if (contact?.id) {
        const updated = existing.map(x =>
          x.id === contact.id
            ? {
                ...x,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                company: formData.company,
                product: formData.product,
                produkt: formData.product,
                price,
                status: formData.status,
                pipeline_status: formData.status,
                startzeitpunkt: formData.startzeitpunkt,
                notes: formData.notes,
                updated_at: new Date().toISOString(),
              }
            : x
        )
        localStorage.setItem('crm_contacts', JSON.stringify(updated))
      } else {
        const newContact = {
          id: Math.random().toString(36).substr(2, 9),
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          product: formData.product,
          produkt: formData.product,
          price,
          status: formData.status,
          pipeline_status: formData.status,
          startzeitpunkt: formData.startzeitpunkt,
          notes: formData.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          source: 'manual',
        }
        existing.push(newContact)
        localStorage.setItem('crm_contacts', JSON.stringify(existing))
      }
      onSave()
    } catch (err) {
      console.error('Error saving contact:', err)
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {contact ? 'Kontakt bearbeiten' : 'Neuer Kontakt'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input type="text" required value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className={inputClass} placeholder="Vollständiger Name" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className={inputClass} placeholder="email@example.com" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input type="tel" value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className={inputClass} placeholder="+49 123 456789" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Firma</label>
            <input type="text" value={formData.company}
              onChange={e => setFormData({ ...formData, company: e.target.value })}
              className={inputClass} placeholder="Firmenname" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status / Phase</label>
            <select value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              className={inputClass + ' bg-white'}>
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Produkt</label>
            <select value={formData.product} onChange={e => handleProductChange(e.target.value)}
              className={inputClass + ' bg-white'}>
              <option value="">{'-- Produkt wählen --'}</option>
              <option value="Standard Erklärvideo">{'Standard Erklärvideo · 500€'}</option>
              <option value="C3 3D Video">{'C3 3D Video · 850€'}</option>
              <option value="Sonstiges">Sonstiges</option>
            </select>
          </div>

          {formData.product === 'Sonstiges' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Umsatz (€)
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                className={inputClass}
                placeholder="z.B. 1200"
                min="0"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Startzeitpunkt</label>
            <input type="text" value={formData.startzeitpunkt}
              onChange={e => setFormData({ ...formData, startzeitpunkt: e.target.value })}
              className={inputClass} placeholder="z.B. Innerhalb 2 Wochen" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notizen</label>
            <textarea value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              rows={3} className={inputClass + ' resize-none'}
              placeholder="Interne Notizen..." />
          </div>

          <div className="flex gap-2 pt-4">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50">
              Abbrechen
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Speichert...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
