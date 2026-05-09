import { useState, useEffect } from 'react'
import { X, UserCheck } from 'lucide-react'
import { supabase, Profile } from '../lib/supabase'

type Props = {
  contactIds: string[]
  onClose: () => void
  onDone: () => void
}

export default function AssignModal({ contactIds, onClose, onDone }: Props) {
  const [salesReps, setSalesReps] = useState<Profile[]>([])
  const [selected, setSelected] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .eq('role', 'sales_rep')
      .then(({ data }) => {
        setSalesReps(data || [])
        setLoading(false)
      })
  }, [])

  const handleAssign = async () => {
    if (!selected) return
    setSaving(true)
    await supabase
      .from('contacts')
      .update({ assigned_to: selected })
      .in('id', contactIds)
    onDone()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <UserCheck size={20} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Vertriebler zuweisen</h2>
              <p className="text-sm text-gray-500">{contactIds.length} Kontakt{contactIds.length !== 1 ? 'e' : ''} ausgewÃ¤hlt</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : salesReps.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">Keine Vertriebler gefunden.</p>
              <p className="text-gray-400 text-xs mt-1">Lege zuerst einen Vertriebler im Team-Bereich an.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 mb-3">Vertriebler auswaehlen:</p>
              {salesReps.map(rep => (
                <label key={rep.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selected === rep.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                  <input type="radio" name="salesRep" value={rep.id} checked={selected === rep.id} onChange={() => setSelected(rep.id)} className="text-indigo-600" />
                  <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">{(rep.name || 'V').charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{rep.name || 'Vertriebler'}</p>
                    <p className="text-xs text-gray-500">Vertriebler</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Abbrechen
          </button>
          <button onClick={handleAssign} disabled={!selected || saving || salesReps.length === 0} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {saving ? 'Wird zugewiesen...' : 'Zuweisen'}
          </button>
        </div>
      </div>
    </div>
  )
}
