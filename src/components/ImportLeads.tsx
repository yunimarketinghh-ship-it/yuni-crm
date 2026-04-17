import { useState } from 'react'
import { supabase, Contact } from '../lib/supabase'
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
      return { name: 'Standard Erklärvideo', price: 500 }
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

        // Map column names (flexible for different CSV formats)
        const email = row['e-mail-adresse'] || row['email'] || row['e-mail']
        const name = row['vorname'] || row['name'] || row['firstname']
        const company = row['name_des_unternehmens'] || row['firma'] || row['company']
        const phone = (row['telefonnummer'] || row['phone'] || '').replace('p:', '')
        const statusMap = row['lead_status'] === 'complete' ? 'interessent' : 'lead'

        if (!email || !name) {
          errors.push(`Zeile ${i + 2}: Email oder Name fehlt`)
          failedCount++
          continue
        }

        const contact: Contact = {
          id: Math.random().toString(36),
          email,
          name,
          phone: phone || '',
          company: company || '',
          product: productInfo.name,
          price: productInfo.price,
          status: statusMap,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          source: 'import',
        }

        const { error } = await supabase
          .from('contacts')
          .insert([contact])

        if (error) {
          errors.push(`Zeile ${i + 2} (${email}): ${error.message}`)
          failedCount++
        } else {
          successCount++
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center gap-3 mb-4">
            {result.failed === 0 ? (
              <>
                <CheckCircle size={24} className="text-green-600" />
                <h2 className="text-xl font-bold text-gray-900">Import erfolgreich!</h2>
              </>
            ) : (
              <>
                <AlertCircle size={24} className="text-yellow-600" />
                <h2 className="text-xl font-bold text-gray-900">Import teilweise erfolgt</h2>
              </>
            )}
          </div>

          <div className="bg-gray-50 rounded p-4 mb-4">
            <p className="text-green-700 font-semibold">✓ {result.success} Leads importiert</p>
            {result.failed > 0 && <p className="text-red-700 font-semibold">✗ {result.failed} fehlgeschlagen</p>}
          </div>

          {result.errors.length > 0 && (
            <div className="bg-red-50 rounded p-3 mb-4">
              <p className="text-sm font-semibold text-red-800 mb-2">Fehler:</p>
              <ul className="text-xs text-red-700 space-y-1">
                {result.errors.map((err, idx) => (
                  <li key={idx}>• {err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => {
                onComplete()
                onClose()
              }}
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              Abgeschlossen
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Leads importieren</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Produkttyp</label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value as 'standard' | 'c3')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="standard">Standard Erklärvideo - 500€</option>
              <option value="c3">C3 3D Video - 850€</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CSV-Datei</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer">
                <Upload size={24} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {file ? file.name : 'CSV-Datei auswählen'}
                </p>
              </label>
            </div>
          </div>

          <div className="bg-blue-50 rounded p-3 text-xs text-blue-800">
            <p className="font-semibold mb-1">CSV-Format erforderlich:</p>
            <p>Spalten: Email, Vorname, Firma, Telefon, Status</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
            >
              Abbrechen
            </button>
            <button
              onClick={handleImport}
              disabled={!file || loading}
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Importiere...' : 'Importieren'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
