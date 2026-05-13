import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, Contact, Activity, Profile } from '../lib/supabase'
import { LogOut, Phone, Mail, Building2, MessageSquare, TrendingUp, CheckCircle, Clock, AlertCircle, Plus, X, PhoneCall } from 'lucide-react'
import Dashboard from './Dashboard'

const STATUS_LABELS: Record<string, { label: string; color: string; activeColor: string; icon: React.ReactNode }> = {
  nicht_kontaktiert: { label: 'Nicht kontaktiert', color: 'bg-gray-100 text-gray-700',    activeColor: 'bg-gray-600 text-white',    icon: <Clock className="w-3 h-3" /> },
  lead:              { label: 'Lead',               color: 'bg-blue-100 text-blue-700',    activeColor: 'bg-blue-600 text-white',    icon: <TrendingUp className="w-3 h-3" /> },
  in_kontakt:        { label: 'In Kontakt',         color: 'bg-indigo-100 text-indigo-700', activeColor: 'bg-indigo-600 text-white', icon: <MessageSquare className="w-3 h-3" /> },
  nicht_erreicht:    { label: 'Nicht erreicht',     color: 'bg-orange-100 text-orange-700', activeColor: 'bg-orange-500 text-white', icon: <AlertCircle className="w-3 h-3" /> },
  angebot:           { label: 'Angebot',            color: 'bg-yellow-100 text-yellow-700', activeColor: 'bg-yellow-500 text-white', icon: <Plus className="w-3 h-3" /> },
  gewonnen:          { label: 'Gewonnen',           color: 'bg-green-100 text-green-700',   activeColor: 'bg-green-600 text-white',  icon: <CheckCircle className="w-3 h-3" /> },
  verloren:          { label: 'Verloren',           color: 'bg-red-100 text-red-700',       activeColor: 'bg-red-600 text-white',    icon: <X className="w-3 h-3" /> },
}

// ─── ContactDetail ────────────────────────────────────────────────────────────
interface ContactDetailProps {
  contact: Contact
  onClose: () => void
  onUpdated: () => void
  userId: string
}

function ContactDetail({ contact, onClose, onUpdated, userId }: ContactDetailProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [note, setNote] = useState('')
  const [status, setStatus] = useState(contact.pipeline_status || 'lead')
  const [saving, setSaving] = useState(false)
  const noteRef = useRef<HTMLTextAreaElement>(null)

  const fetchActivities = useCallback(async () => {
    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('contact_id', contact.id)
      .order('created_at', { ascending: false })
    setActivities(data || [])
  }, [contact.id])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  const saveNote = async () => {
    if (!note.trim()) return
    setSaving(true)
    await supabase.from('activities').insert({
      contact_id: contact.id,
      type: 'note',
      description: note.trim(),
      created_by: userId,
    })
    setNote('')
    await fetchActivities()
    setSaving(false)
    onClose()
  }

  const updateStatus = async (newStatus: string) => {
    setStatus(newStatus)
    await supabase.from('contacts').update({ pipeline_status: newStatus }).eq('id', contact.id)
    onUpdated()
    onClose()
  }


  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">{contact.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{contact.name}</h3>
              {contact.company && <p className="text-xs text-gray-500">{contact.company}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Quick action buttons */}
          <div className="flex gap-2">
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium text-sm transition-colors"
              >
                <PhoneCall className="w-4 h-4" />
                Anrufen
              </a>
            )}
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-medium text-sm transition-colors"
              >
                <Mail className="w-4 h-4" />
                E-Mail
              </a>
            )}
          </div>

          {/* Contact info */}
          <div className="space-y-2">
            {contact.phone && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-600">{contact.phone}</span>
              </div>
            )}
            {contact.email && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-600">{contact.email}</span>
              </div>
            )}
            {contact.company && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-600">{contact.company}</span>
              </div>
            )}
          </div>

          {/* Status selector */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Status setzen</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(STATUS_LABELS).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => updateStatus(key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    status === key ? val.activeColor + ' ring-2 ring-offset-1 ring-current' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {val.icon}
                  {val.label}
                </button>
              ))}
            </div>
          </div>

          {/* Note input */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Gesprächsnotiz</p>
            <textarea
              ref={noteRef}
              value={note}
              onChange={e => setNote(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && e.ctrlKey && saveNote()}
              placeholder={"Was wurde besprochen? Rückruf wann? Interesse woran?\n(Strg+Enter zum Speichern)"}
              rows={3}
              className="w-full px-3 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-indigo-300 resize-none"
            />
            <button
              onClick={saveNote}
              disabled={saving || !note.trim()}
              className="mt-2 w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-indigo-700 transition-colors"
            >
              {saving ? 'Wird gespeichert...' : 'Notiz speichern'}
            </button>
          </div>

          {/* Activity log */}
          {activities.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Verlauf</p>
              <div className="space-y-2">
                {activities.map(act => (
                  <div key={act.id} className="p-3 bg-gray-50 rounded-xl border-l-2 border-indigo-200">
                    <p className="text-sm text-gray-700">{act.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(act.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Props = { profile: Profile }

// ─── SalesRepView ─────────────────────────────────────────────────────────────
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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const stats = {
    totalContacts: contacts.length,
    totalDeals: contacts.length,
    wonDeals: contacts.filter(c => c.pipeline_status === 'gewonnen').length,
    revenue: contacts.filter(c => c.pipeline_status === 'gewonnen').reduce((sum, c) => sum + (c.price || 0), 0),
    activeLeads: contacts.filter(c => c.pipeline_status === 'lead').length,
    pipelineValue: contacts.filter(c => c.pipeline_status === 'lead').length * 850,
  }

  const statusCounts: Record<string, number> = { alle: contacts.length }
  for (const c of contacts) {
    const s = c.pipeline_status || 'lead'
    statusCounts[s] = (statusCounts[s] || 0) + 1
  }

  const filtered = contacts.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.company || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'alle' || c.pipeline_status === filterStatus
    return matchSearch && matchStatus
  })

  const visibleStatusTabs = Object.entries(STATUS_LABELS).filter(([key]) => (statusCounts[key] || 0) > 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">Y</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">YUNI CRM</h1>
              <p className="text-xs text-gray-500">{profile.full_name || profile.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'dashboard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'contacts' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Kontakte{contacts.length > 0 && <span className="ml-1 bg-indigo-100 text-indigo-700 rounded-full px-1.5 py-0.5">{contacts.length}</span>}
            </button>
          </div>
          <button onClick={handleSignOut} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeTab === 'dashboard' ? (
        <Dashboard
          stats={stats}
          contacts={contacts}
          deals={[]}
          activities={activities}
          onNavigateToContacts={() => setActiveTab('contacts')}
        />
      ) : (
        <div className="max-w-7xl mx-auto px-4 pt-4 pb-6">
          <div className="mb-3">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Name oder Firma suchen..."
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-300 shadow-sm"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            <button
              onClick={() => setFilterStatus('alle')}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filterStatus === 'alle' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              Alle
              <span className={`rounded-full px-1.5 py-0.5 text-xs ${filterStatus === 'alle' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {statusCounts.alle}
              </span>
            </button>
            {visibleStatusTabs.map(([key, val]) => (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filterStatus === key ? val.activeColor : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                }`}
              >
                {val.icon}
                {val.label}
                <span className={`rounded-full px-1.5 py-0.5 text-xs ${filterStatus === key ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                  {statusCounts[key] || 0}
                </span>
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg font-medium">Keine Kontakte gefunden</p>
              <p className="text-sm mt-1">{search ? 'Suchbegriff anpassen' : 'Noch keine Leads in diesem Status'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(contact => {
                const st = STATUS_LABELS[contact.pipeline_status || 'lead'] || STATUS_LABELS['lead']
                return (
                  <div key={contact.id} className="bg-white rounded-xl border border-gray-200 hover:border-indigo-200 hover:shadow-sm transition-all">
                    <button onClick={() => setSelected(contact)} className="w-full p-4 text-left">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-sm">{contact.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate text-sm">{contact.name}</p>
                            {contact.company && <p className="text-xs text-gray-500 truncate">{contact.company}</p>}
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${st.color}`}>
                          {st.icon}
                          {st.label}
                        </span>
                      </div>
                    </button>
                    {(contact.phone || contact.email) && (
                      <div className="flex border-t border-gray-100">
                        {contact.phone && (
                          <a
                            href={`tel:${contact.phone}`}
                            onClick={e => e.stopPropagation()}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-green-700 hover:bg-green-50 transition-colors rounded-bl-xl"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            {contact.phone}
                          </a>
                        )}
                        {contact.email && contact.phone && <div className="w-px bg-gray-100" />}
                        {contact.email && (
                          <a
                            href={`mailto:${contact.email}`}
                            onClick={e => e.stopPropagation()}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors rounded-br-xl"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            E-Mail
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
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
