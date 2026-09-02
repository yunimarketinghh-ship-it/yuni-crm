import { useState } from 'react'
import { Contact, supabase } from '../lib/supabase'
import { Upload, CheckCircle, AlertCircle, X } from 'lucide-react'

interface ImportLeadsProps {
  onClose: () => void
  onComplete: () => void
}

export default function ImportLeads({ onClose, onComplete }: ImportLeadsProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null)
  const [productType, setProductType] = useState<'standard' | 'c3'>('standard')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0])
    }
  }

  const parseCSV = (text: string) => {
    const lines = text.split('\n')
    const headers = lines[0].split('\t').map(h => h.trim().toLowerCase())
    const rows = []
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue
      const values = lines[i].split('\t').map(v => v.trim().replace(/^"|"$/g, ''))
      const row: { [key: string]: string } = {}
      headers.forEach((header, idx) => {
        row[header] = values[idx] || ''
      })
      rows.push(row)
    }
    return rows
  }

  const getProductInfo = () => {
    if (productType === 'standard') {
      return { name: 'Standard Erklaervideo', price: 500 }
    } else {
      return { name: 'C3 3D Video', price: 850 }
    }
  }

  const handleImport = async () => {
    if (!file) return
    setLoading(true)
    const errors: string[] = []
    let successCount = 0
    let failedCount = 0

    try {
      const text = await file.text()
      const rows = parseCSV(text)
      const productInfo = getProductInfo()

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const email = row['e-mail-adresse'] || row['email'] || row['e-mail']
        const name = ([row['vorname'], row['nachname']].filter(Boolean).join(' ').trim()) || row['full_name'] || row['name'] || row['first_name'] || row['firstname']
        const company = row['firmenname'] || row['name_des_unternehmens'] || row['company_name'] || row['firma'] || row['company'] || row['unternehmensname'] || row['organization']
        const phone = (row['telefonnummer'] || row['phone_number'] || row['phone'] || '').replace('p:', '')
        const statusMap = row['lead_status'] === 'complete' ? 'interessent' : 'lead'

        if (!email || !name) {
          errors.push(`Zeile ${i + 2}: Email oder Name fehlt`)
          failedCount++
          continue
        }

        const contact: Contact = {
          id: crypto.randomUUID(),
          email,
          name,
          phone: phone || null,
          company: company || null,
          address: null,
          tags: null,
          produkt: productInfo.name,
          price: productInfo.price,
          pipeline_status: statusMap,
          startzeitpunkt: null,
          verwendungszweck: null,
          lead_date: null,
          notes: null,
          assigned_to: null,
          created_at: new Date().toISOString(),
          source: 'import',
        }

        try {
          // Check if contact with same phone already exists → update name/company
          if (phone) {
            const { data: existing } = await supabase.from('contacts').select('id').eq('phone', phone).maybeSingle()
            if (existing) {
              const { error: upErr } = await supabase.from('contacts').update({ name, company: company || null }).eq('id', existing.id)
              if (upErr) throw upErr
              successCount++
              continue
            }
          }
          const { error } = await supabase.from('contacts').insert(contact)
          if (error) throw error
          successCount++
        } catch (err) {
          errors.push(`Zeile ${i + 2} (${email}): ${err instanceof Error ? err.message : 'Fehler'}`)
          failedCount++
        }
      }

      setResult({ success: successCount, failed: failedCount, errors: errors.slice(0, 10) })
    } catch (err) {
      setResult({
        success: 0,
        failed: 1,
        errors: [err instanceof Error ? err.message : 'Unbekannter Fehler'],
      })
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="card shadow-pop p-6 max-w-md w-full animate-fadeUp">
          <div className="flex items-center gap-3 mb-4">
            {result.failed === 0 ? (
              <>
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <CheckCircle size={20} className="text-emerald-500" />
                </div>
                <h2 className="text-lg font-bold text-ink-900 tracking-tight">Import abgeschlossen</h2>
              </>
            ) : (
              <>
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <AlertCircle size={20} className="text-amber-500" />
                </div>
                <h2 className="text-lg font-bold text-ink-900 tracking-tight">Import teilweise erfolgt</h2>
              </>
            )}
          </div>
          <div className="bg-surface rounded-xl p-4 mb-4">
            <p className="text-emerald-600 font-semibold text-sm num">{result.success} Leads importiert</p>
            {result.failed > 0 && <p className="text-red-600 font-semibold text-sm num mt-1">{result.failed} fehlgeschlagen</p>}
          </div>
          {result.errors.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3.5 mb-4">
              <p className="text-sm font-semibold text-red-700 mb-2">Fehler:</p>
              <ul className="text-xs text-red-600 space-y-1">
                {result.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={() => { onComplete(); onClose() }}
            className="btn-primary w-full"
          >
            Abgeschlossen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card shadow-pop p-6 max-w-md w-full animate-fadeUp">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-ink-900 tracking-tight">Leads importieren</h2>
          <button onClick={onClose} className="p-2 text-ink-400 hover:text-ink-700 hover:bg-surface rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Produkttyp</label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value as 'standard' | 'c3')}
              className="input cursor-pointer"
            >
              <option value="standard">Standard Erklärvideo – 500 €</option>
              <option value="c3">C3 3D Video – 850 €</option>
            </select>
          </div>
          <div>
            <label className="label">CSV-Datei</label>
            <div className="border-2 border-dashed border-ink-200 hover:border-brand-300 rounded-xl p-6 text-center transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer">
                <Upload size={22} className="mx-auto mb-2 text-ink-400" />
                <p className="text-sm text-ink-700 font-medium">
                  {file ? file.name : 'CSV-Datei auswählen'}
                </p>
              </label>
            </div>
          </div>
          <div className="bg-brand-50 rounded-xl p-3.5 text-xs text-brand-800">
            <p className="font-semibold mb-1">CSV-Format erforderlich:</p>
            <p>Spalten: Email, Vorname, Firma, Telefon, Status</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-ink-200 rounded-xl text-sm font-semibold text-ink-700 hover:bg-surface transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleImport}
              disabled={!file || loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Importiere…' : 'Importieren'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
