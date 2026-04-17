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
    <div className="space-y-6">
      {/* Add New Activity */}
      <form onSubmit={handleAddActivity} className="bg-white rounded-lg border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Neue Aktivität
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newActivityText}
            onChange={e => setNewActivityText(e.target.value)}
            placeholder="Was ist gerade passiert?"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
          <button
            type="submit"
            disabled={saving || !newActivityText.trim()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Speichert...' : 'Hinzufügen'}
          </button>
        </div>
      </form>

      {/* Activity Timeline */}
      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <MessageSquare className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-gray-500">Keine Aktivitäten vorhanden</p>
          </div>
        ) : (
          activities.map(activity => (
            <div
              key={activity.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare size={16} className="text-indigo-600" />
                    <span className="font-medium text-gray-900">
                      {getContactName(activity.contact_id)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(activity.created_at), {
                        addSuffix: true,
                        locale: de,
                      })}
                    </span>
                  </div>
                  <p className="text-gray-700">{activity.text}</p>
                </div>
                <button
                  onClick={() => handleDeleteActivity(activity.id)}
                  className="ml-4 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
