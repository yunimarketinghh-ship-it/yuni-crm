import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, Contact, Activity, Profile } from '../lib/supabase'
import { LogOut, Phone, Mail, Building2, MessageSquare, TrendingUp, CheckCircle, Clock, AlertCircle, Plus, X, PhoneCall } from 'lucide-react'
import Dashboard from './Dashboard'
import PipelineList from './PipelineList'

const STATUS_LABELS: Record<string, { label: string; color: string; activeColor: string; icon: React.ReactNode }> = {
  nicht_kontaktiert: { label: 'Nicht kontaktiert', color: 'bg-ink-100 text-ink-500', activeColor: 'bg-ink-700 text-white', icon: <Clock className="w-3 h-3" /> },
  lead: { label: 'Lead', color: 'bg-brand-50 text-brand-600', activeColor: 'bg-brand-500 text-white', icon: <TrendingUp className="w-3 h-3" /> },
  in_kontakt: { label: 'In Kontakt', color: 'bg-sky-50 text-sky-600', activeColor: 'bg-sky-500 text-white', icon: <MessageSquare className="w-3 h-3" /> },
  nicht_erreicht: { label: 'Nicht erreicht', color: 'bg-orange-50 text-orange-600', activeColor: 'bg-orange-500 text-white', icon: <AlertCircle className="w-3 h-3" /> },
  angebot: { label: 'Angebot', color: 'bg-amber-50 text-amber-600', activeColor: 'bg-amber-500 text-white', icon: <Plus className="w-3 h-3" /> },
  gewonnen: { label: 'Gewonnen', color: 'bg-emerald-50 text-emerald-600', activeColor: 'bg-emerald-500 text-white', icon: <CheckCircle className="w-3 h-3" /> },
  verloren: { label: 'Verloren', color: 'bg-red-50 text-red-500', activeColor: 'bg-red-500 text-white', icon: <X className="w-3 h-3" /> },
}

// ─── ContactDetail ───────────────────────────────────────────────────────────
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
    <div className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2.5xl rounded-t-2.5xl max-h-[92vh] flex flex-col shadow-pop animate-fadeUp">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-ink-100">
          <div className="flex items-center gap-3">
            <div className="avatar w-10 h-10 text-sm">
              {contact.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-ink-900">{contact.name}</h3>
              {contact.company && <p className="text-xs text-ink-500">{contact.company}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface rounded-xl transition-colors">
            <X className="w-5 h-5 text-ink-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Quick action buttons */}
          <div className="flex gap-2.5">
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-colors shadow-btn">
                <PhoneCall className="w-4 h-4" />
                Anrufen
              </a>
            )}
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="flex-1 flex items-center justify-center gap-2 py-3 bg-brand-50 hover:bg-brand-100 text-brand-600 rounded-xl font-semibold text-sm transition-colors">
                <Mail className="w-4 h-4" />
                E-Mail
              </a>
            )}
          </div>

          {/* Contact info */}
          <div className="space-y-2">
            {contact.phone && (
              <div className="flex items-center gap-3 p-3 bg-surface rounded-xl">
                <Phone className="w-4 h-4 text-ink-400 flex-shrink-0" />
                <span className="text-sm text-ink-700 num">{contact.phone}</span>
              </div>
            )}
            {contact.email && (
              <div className="flex items-center gap-3 p-3 bg-surface rounded-xl">
                <Mail className="w-4 h-4 text-ink-400 flex-shrink-0" />
                <span className="text-sm text-ink-700">{contact.email}</span>
              </div>
            )}
            {contact.company && (
              <div className="flex items-center gap-3 p-3 bg-surface rounded-xl">
                <Building2 className="w-4 h-4 text-ink-400 flex-shrink-0" />
                <span className="text-sm text-ink-700">{contact.company}</span>
              </div>
            )}
          </div>

          {/* Status selector */}
          <div>
            <p className="label uppercase tracking-wider">Status setzen</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(STATUS_LABELS).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => updateStatus(key)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    status === key ? val.activeColor + ' shadow-btn' : 'bg-surface text-ink-500 hover:bg-ink-100'
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
            <p className="label uppercase tracking-wider">Gesprächsnotiz</p>
            <textarea
              ref={noteRef}
              value={note}
              onChange={e => setNote(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && e.ctrlKey && saveNote()}
              placeholder={"Was wurde besprochen? Rückruf wann? Interesse woran?\n(Strg+Enter zum Speichern)"}
              rows={3}
              className="input-soft resize-none"
            />
            <button
              onClick={saveNote}
              disabled={saving || !note.trim()}
              className="btn-primary w-full mt-2.5"
            >
              {saving ? 'Wird gespeichert…' : 'Notiz speichern'}
            </button>
          </div>

          {/* Activity log */}
          {activities.length > 0 && (
            <div>
              <p className="label uppercase tracking-wider">Verlauf</p>
              <div className="space-y-2">
                {activities.map(act => (
                  <div key={act.id} className="p-3.5 bg-surface rounded-xl border-l-2 border-brand-300">
                    <p className="text-sm text-ink-700">{act.description}</p>
                    <p className="text-xs text-ink-400 mt-1 num">
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

// ─── Types ───────────────────────────────────────────────────────────────────
type Props = { profile: Profile }

// ─── SalesRepView ────────────────────────────────────────────────────────────
export default function SalesRepView({ profile }: Props) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Contact | null>(null)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'contacts'>('dashboard')
  const [listStage, setListStage] = useState<string | null>(null)

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

  return (
    <div className="min-h-[100dvh] bg-surface">
      <header className="sticky top-0 z-40 bg-surface/85 backdrop-blur-lg border-b border-ink-200/60 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center shadow-btn">
              <span className="text-white font-extrabold text-base">Y</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-extrabold text-ink-900 leading-none tracking-tight">YUNI CRM</h1>
              <p className="text-xs text-ink-500 mt-0.5">{profile.full_name || profile.name || profile.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-white rounded-full p-1 shadow-card">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`navpill !py-1.5 ${activeTab === 'dashboard' ? 'navpill-active' : ''}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`navpill !py-1.5 ${activeTab === 'contacts' ? 'navpill-active' : ''}`}
            >
              Telefonliste
              {contacts.length > 0 && (
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold num ${activeTab === 'contacts' ? 'bg-white/20 text-white' : 'bg-surface text-ink-500'}`}>
                  {contacts.length}
                </span>
              )}
            </button>
          </div>
          <button onClick={handleSignOut} title="Abmelden" className="btn-ghost !px-2.5">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeTab === 'dashboard' ? (
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <Dashboard
            stats={stats}
            contacts={contacts}
            deals={[]}
            activities={activities}
            userName={profile.full_name || profile.name}
            onNavigateToContacts={() => { setListStage(null); setActiveTab('contacts') }}
            onSelectContact={setSelected}
            onGoToPipeline={(stage?: string) => { setListStage(stage || null); setActiveTab('contacts') }}
          />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 pt-4 pb-6 sm:px-6 lg:px-8">
          <PipelineList
            key={listStage || 'all'}
            contacts={contacts}
            onRefresh={fetchContacts}
            onSelectContact={setSelected}
            initialStage={listStage}
          />
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
