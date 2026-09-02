import { Activity, Contact, supabase } from '../lib/supabase'
import { MessageSquare, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import { useState } from 'react'

interface Props {
  activities: Activity[]
  contacts: Contact[]
  onRefresh: () => void
}

export default function ActivityLog({ activities, contacts, onRefresh }: Props) {
  const [newActivityText, setNewActivityText] = useState('')
  const [saving, setSaving] = useState(false)

  const getContactName = (contactId: string | null) => {
    if (!contactId) return 'Allgemein'
    return contacts.find(c => c.id === contactId)?.name || 'Unbekannt'
  }

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newActivityText.trim()) return

    setSaving(true)
    try {
      await supabase.from('activities').insert([
        {
          type: 'note',
          text: newActivityText,
          created_at: new Date().toISOString(),
        },
      ])
      setNewActivityText('')
      onRefresh()
    } catch (error) {
      console.error('Error adding activity:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteActivity = async (activityId: string) => {
    try {
      await supabase.from('activities').delete().eq('id', activityId)
      onRefresh()
    } catch (error) {
      console.error('Error deleting activity:', error)
    }
  }

  return (
    <div className="space-y-5 animate-fadeUp">
      {/* Add New Activity */}
      <form onSubmit={handleAddActivity} className="card p-6">
        <label className="label !text-sm !text-ink-900 font-bold mb-3">
          Neue Aktivität
        </label>
        <div className="flex gap-2.5">
          <input
            type="text"
            value={newActivityText}
            onChange={e => setNewActivityText(e.target.value)}
            placeholder="Was ist gerade passiert?"
            className="input flex-1"
          />
          <button
            type="submit"
            disabled={saving || !newActivityText.trim()}
            className="btn-primary !px-6"
          >
            {saving ? 'Speichert…' : 'Hinzufügen'}
          </button>
        </div>
      </form>

      {/* Activity Timeline */}
      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="card text-center py-12">
            <MessageSquare className="mx-auto text-ink-300 mb-2" size={32} />
            <p className="text-ink-500 text-sm">Keine Aktivitäten vorhanden</p>
          </div>
        ) : (
          activities.map(activity => (
            <div
              key={activity.id}
              className="card !rounded-xl p-4 hover:shadow-pop transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageSquare size={13} className="text-brand-500" />
                    </div>
                    <span className="font-semibold text-ink-900 text-sm truncate">
                      {getContactName(activity.contact_id)}
                    </span>
                    <span className="text-xs text-ink-400 flex-shrink-0">
                      {formatDistanceToNow(new Date(activity.created_at), {
                        addSuffix: true,
                        locale: de,
                      })}
                    </span>
                  </div>
                  <p className="text-ink-700 text-sm pl-9">{activity.text}</p>
                </div>
                <button
                  onClick={() => handleDeleteActivity(activity.id)}
                  className="ml-4 p-1.5 text-ink-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
