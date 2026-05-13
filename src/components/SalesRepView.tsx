import { useState, useEffect, useCallback } from 'react'
import { supabase, Contact, Activity, Profile } from '../lib/supabase'
import { LogOut, Phone, Mail, Building2, MessageSquare, TrendingUp, CheckCircle, Clock, AlertCircle, Plus, X } from 'lucide-react'

const STATUS_LABELS: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  nicht_kontaktiert: { label: 'Nicht kontaktiert', color: 'bg-gray-100 text-gray-700', icon: Clock },
  in_kontakt:        { label: 'In Kontakt',         color: 'bg-indigo-100 text-indigo-700', icon: AlertCircle },
  angebot:           { label: 'Angebot',            color: 'bg-yellow-100 text-yellow-700', icon: TrendingUp },
  gewonnen:          { label: 'Gewonnen',           color: 'bg-green-100 text-green-700',  icon: CheckCircle },
  verloren:          { label: 'Verloren',            color: 'bg-red-100 text-red-700',      icon: X },
}

type ContactDetailProps = {
  contact: Contact
  onClose: () => void
  onUpdated: () => void
  userId: string
}

function ContactDetail({ contact, onClose, onUpdated, userId }: ContactDetailProps) {
  const [status, setStatus] = useState(contact.pipeline_status || 'nicht_kontaktiert')
  const [activities, setActivities] = useState<Activity[]>([])
  const [newNote, setNewNote] = useState('')
  const [activityType, setActivityType] = useState('note')
  const [saving, setSaving] = useState(false)
  const [loadingActs, setLoadingActs] = useState(true)

  useEffect(() => {
    fetchActivities()
  }, [contact.id])

  const fetchActivities = async () => {
import { supabase, Contact, Activity, Profile } from '../lib/supabase'
import { LogOut, Phone, Mail, Building2, MessageSquare, TrendingUp, CheckCircle, Clock, AlertCircle, Plus, X } from 'lucide-react'
import Dashboard from './Dashboard'

const STATUS_LABELS: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  nicht_kontaktiert: { label: 'Nicht kontaktiert', color: 'bg-gray-100 text-gray-700', icon: Clock },
  lead:              { label: 'Lead',               color: 'bg-blue-100 text-blue-700',  icon: Clock },
  in_kontakt:        { label: 'In Kontakt',         color: 'bg-indigo-100 text-indigo-700', icon: AlertCircle },
  nicht_erreicht:    { label: 'Nicht erreicht',     color: 'bg-orange-100 text-orange-700', icon: Clock },
  angebot:           { label: 'Angebot',            color: 'bg-yellow-100 text-yellow-700', icon: TrendingUp },
  gewonnen:          { label: 'Gewonnen',           color: 'bg-green-100 text-green-700',  icon: CheckCircle },
  verloren:          { label: 'Verloren',           color: 'bg-red-100 text-red-700',      icon: X },
}

type ContactDetailProps = {
  contact: Contact
  onClose: () => void
  onUpdated: () => void
  userId: string
}

function ContactDetail({ contact, onClose, onUpdated, userId }: ContactDetailProps) {
  const [status, setStatus] = useState(contact.pipeline_status || 'nicht_kontaktiert')
  const [activities, setActivities] = useState<Activity[]>([])
  const [newNote, setNewNote] = useState('')
  const [activityType, setActivityType] = useState('note')
  const [saving, setSaving] = useState(false)
  const [loadingActs, setLoadingActs] = useState(true)

  useEffect(() => { fetchActivities() }, [contact.id])

  const fetchActivities = async () => {
    setLoadingActs(true)
    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('contact_id', contact.id)
      .order('created_at', { ascending: false })
    setActivities(data || [])
    setLoadingActs(false)
  }

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus)
    await supabase.from('contacts').update({ pipeline_status: newStatus }).eq('id', contact.id)
    onUpdated()
  }

  const handleAddActivity = async () => {
    if (!newNote.trim()) return
    setSaving(true)
    await supabase.from('activities').insert({
      id: crypto.randomUUID(),
      contact_id: contact.id,
      type: activityType,
      text: newNote.trim(),
      user_id: userId,
    })
    setNewNote('')
    await fetchActivities()
    setSaving(false)
  }

  const activityTypeIcon = (type: string) => {
    const icons: Record<string, string> = { note: '📝', call: '📞', email: '📧', meeting: '🤝', other: '📌' }
    return icons[type] || '📌'
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{contact.name}</h2>
            {contact.company && <p className="text-sm text-gray-500 mt-0.5">{contact.company}</p>}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-sm text-indigo-600 hover:underline">
                <Mail size={16} />{contact.email}
              </a>
            )}
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-sm text-indigo-600 hover:underline">
                <Phone size={16} />{contact.phone}
              </a>
            )}
            {contact.company && (
              <span className="flex items-center gap-2 text-sm text-gray-600">
                <Building2 size={16} />{contact.company}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Status ändern</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(STATUS_LABELS).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => handleStatusChange(key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border-2 ${
                    status === key
                      ? `${val.color} border-current shadow-sm`
                      : 'bg-gray-50 text-gray-500 border-transparent hover:border-gray-300'
                  }`}
                >
                  {val.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Aktivität / Notiz</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                {['note', 'call', 'email', 'meeting'].map(t => (
                  <button
                    key={t}
                    onClick={() => setActivityType(t)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activityType === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {activityTypeIcon(t)} {t === 'note' ? 'Notiz' : t === 'call' ? 'Anruf' : t === 'email' ? 'E-Mail' : 'Meeting'}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddActivity()}
                  placeholder="Notiz eingeben..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleAddActivity}
                  disabled={saving || !newNote.trim()}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <MessageSquare size={14} /> Verlauf
            </h3>
            {loadingActs ? (
              <p className="text-sm text-gray-400">Lädt...</p>
            ) : activities.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Noch keine Aktivitäten.</p>
            ) : (
              <div className="space-y-2">
                {activities.map(act => (
                  <div key={act.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-lg">{activityTypeIcon(act.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">{act.text}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(act.created_at).toLocaleDateString('de-DE', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

type Props = { profile: Profile }

export default function SalesRepView({ profile }: Props) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Contact | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('alle')
  const [activeTab, setActiveTab] = useState<'dashboard' | 'contacts'>('dashboard')

  const fetchContacts = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .eq('assigned_to', profile.id)
      .order('lead_date', { ascending: false, nullsFirst: false })
    setContacts(data || [])
    setLoading(false)
  }, [profile.id])

  const fetchActivities = useCallback(async () => {
    const { data } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false })
    setActivities(data || [])
  }, [])

  useEffect(() => {
    fetchContacts()
    fetchActivities()
  }, [fetchContacts, fetchActivities])

  const handleLogout = async () => { await supabase.auth.signOut() }

  const stats = {
    totalContacts: contacts.length,
    totalDeals: contacts.length,
    wonDeals: contacts.filter(c => c.pipeline_status === 'gewonnen').length,
    revenue: contacts.filter(c => c.pipeline_status === 'gewonnen').reduce((sum, c) => sum + (c.price || 0), 0),
    activeLeads: contacts.filter(c => c.pipeline_status === 'lead').length,
    pipelineValue: contacts.filter(c => c.pipeline_status === 'lead').length * 850,
  }

  const filtered = contacts.filter(c => {
    const matchSearch = !search
      || c.name.toLowerCase().includes(search.toLowerCase())
      || (c.email || '').toLowerCase().includes(search.toLowerCase())
      || (c.company || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'alle' || (c.pipeline_status || '') === filterStatus
    return matchSearch && matchStatus
  })

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'contacts',  label: 'Kontakte' },
  ] as const

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Y</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">YUNI CRM</h1>
                <p className="text-xs text-gray-500">Admin — {profile.name}</p>
              </div>
            </div>
            <nav className="flex gap-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <LogOut size={16} /> Abmelden
            </button>
          </div>
        </div>
      </header>

      {activeTab === 'dashboard' ? (
        <Dashboard
          stats={stats}
          contacts={contacts}
          deals={[]}
          activities={activities}
          onNavigateToContacts={() => setActiveTab('contacts')}
        />
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Name, E-Mail oder Firma suchen..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="alle">Alle Status</option>
              {Object.entries(STATUS_LABELS).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-lg">Keine Kontakte gefunden.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(contact => {
                const st = STATUS_LABELS[contact.pipeline_status || ''] || STATUS_LABELS.nicht_kontaktiert
                return (
                  <button
                    key={contact.id}
                    onClick={() => setSelected(contact)}
                    className="w-full bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-sm transition-all text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-sm">{contact.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{contact.name}</p>
                          <p className="text-xs text-gray-500 truncate">{contact.company || contact.email || ''}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${st.color}`}>
                        {st.label}
                      </span>
                    </div>
                    {(contact.phone || contact.email) && (
                      <div className="flex gap-4 mt-2">
                        {contact.phone && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Phone size={11} /> {contact.phone}
                          </span>
                        )}
                        {contact.email && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Mail size={11} /> {contact.email}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </main>
      )}

      {selected && (
        <ContactDetail
          contact={selected}
          onClose={() => setSelected(null)}
          onUpdated={fetchContacts}
          userId={profile.id}
        />
      )}
    </div>
  )
}
