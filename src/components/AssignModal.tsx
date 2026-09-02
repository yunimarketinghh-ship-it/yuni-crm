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
    <div className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card shadow-pop w-full max-w-md animate-fadeUp">
        <div className="flex items-center justify-between p-6 border-b border-ink-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
              <UserCheck size={19} className="text-brand-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink-900 tracking-tight">Vertriebler zuweisen</h2>
              <p className="text-sm text-ink-500 num">{contactIds.length} Lead{contactIds.length !== 1 ? 's' : ''} ausgewählt</p>
            </div>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 hover:bg-surface rounded-xl p-2 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500 border-t-transparent" />
            </div>
          ) : salesReps.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-ink-500 text-sm">Keine Vertriebler gefunden.</p>
              <p className="text-ink-400 text-xs mt-1">Lege zuerst einen Vertriebler im Team-Bereich an.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-ink-700 mb-3">Vertriebler auswählen:</p>
              {salesReps.map(rep => (
                <label key={rep.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selected === rep.id ? 'border-brand-400 bg-brand-50/60' : 'border-ink-200 hover:border-ink-300 hover:bg-surface'}`}>
                  <input type="radio" name="salesRep" value={rep.id} checked={selected === rep.id} onChange={() => setSelected(rep.id)} className="text-brand-500 focus:ring-brand-400" />
                  <div className="avatar w-9 h-9 text-sm">
                    {(rep.name || 'V').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-ink-900 text-sm">{rep.name || 'Vertriebler'}</p>
                    <p className="text-xs text-ink-500">Vertriebler</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-ink-200 rounded-xl text-sm font-semibold text-ink-700 hover:bg-surface transition-colors">
            Abbrechen
          </button>
          <button onClick={handleAssign} disabled={!selected || saving || salesReps.length === 0} className="btn-primary flex-1">
            {saving ? 'Wird zugewiesen…' : 'Zuweisen'}
          </button>
        </div>
      </div>
    </div>
  )
}
