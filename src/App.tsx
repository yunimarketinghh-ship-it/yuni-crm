import { useState, useEffect, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, Contact, Deal, Activity, Profile } from './lib/supabase'
import Dashboard from './components/Dashboard'
import ContactTable from './components/ContactTable'
import KanbanBoard from './components/KanbanBoard'
import PipelineList from './components/PipelineList'
import ActivityLog from './components/ActivityLog'
import ContactModal from './components/ContactModal'
import ImportLeads from './components/ImportLeads'
import Login from './components/Login'
import SalesRepView from './components/SalesRepView'
import { Plus, LogOut, Upload, Users, RefreshCw, LayoutGrid, Contact2, GitBranch, MessageSquare, KeyRound, List, Columns } from 'lucide-react'

type View = 'dashboard' | 'contacts' | 'pipeline' | 'activities' | 'team'

// ─── Passwort setzen nach Recovery-Link ──────────────────────────────────────
function SetPasswordModal({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwörter stimmen nicht überein.'); return }
    if (password.length < 6) { setError('Passwort muss mind. 6 Zeichen haben.'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) { setError(err.message); setLoading(false); return }
    onDone()
  }

  return (
    <div className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card shadow-pop w-full max-w-md p-8 animate-fadeUp">
        <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mx-auto mb-4">
          <KeyRound size={22} className="text-brand-500" />
        </div>
        <h2 className="text-xl font-bold text-center text-ink-900 mb-2">Neues Passwort setzen</h2>
        <p className="text-sm text-ink-500 text-center mb-6">Setze jetzt dein Passwort für zukünftige Anmeldungen.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Neues Passwort"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input"
            required
          />
          <input
            type="password"
            placeholder="Passwort bestätigen"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className="input"
            required
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Wird gespeichert…' : 'Passwort speichern'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Admin: Vertriebler verwalten ────────────────────────────────────────────
function TeamView() {
  const [members, setMembers] = useState<Profile[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [profilesRes, contactsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'sales_rep'),
        supabase.from('contacts').select('*'),
      ])
      if (profilesRes.error) console.error('Team-Profile-Fehler:', profilesRes.error)
      if (contactsRes.error) console.error('Team-Kontakte-Fehler:', contactsRes.error)
      setMembers(profilesRes.data || [])
      setContacts(contactsRes.data || [])
    } catch (err) {
      console.error('Team-Fetch-Fehler:', err)
    } finally {
      setLoading(false)
    }
  }

  const assignedCounts = members.reduce((acc, m) => {
    acc[m.id] = contacts.filter(c => c.assigned_to === m.id).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6 animate-fadeUp">
      <div className="card p-6">
        <h2 className="text-lg font-bold text-ink-900 mb-4">Neuen Vertriebler anlegen</h2>
        <div className="bg-brand-50 rounded-xl p-4 mb-4">
          <p className="text-sm text-brand-800 font-semibold mb-1.5">So legst du einen Vertriebler an:</p>
          <ol className="text-sm text-brand-700 space-y-1 list-decimal list-inside">
            <li>Gehe zu <a href="https://supabase.com/dashboard/project/ffylxadhegvvwxrmyktt/auth/users" target="_blank" rel="noreferrer" className="underline font-semibold">Supabase → Authentication → Users</a></li>
            <li>Klicke auf <strong>"Add user" → "Create new user"</strong></li>
            <li>Trage E-Mail und Passwort ein und speichere</li>
            <li>Komme hierher zurück und klicke "Neu laden"</li>
          </ol>
        </div>
        <button onClick={fetchData} className="btn-primary">
          <RefreshCw size={15} /> Neu laden
        </button>
      </div>
      <div className="card p-6">
        <h2 className="text-lg font-bold text-ink-900 mb-4">Dein Team</h2>
        {loading ? (
          <p className="text-ink-400 text-sm">Lädt…</p>
        ) : members.length === 0 ? (
          <p className="text-ink-400 text-sm italic">Noch keine Vertriebler angelegt.</p>
        ) : (
          <div className="space-y-3">
            {members.map(m => (
              <div key={m.id} className="flex items-center justify-between p-4 bg-surface rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="avatar w-10 h-10 text-sm">
                    {(m.name || 'V').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-ink-900">{m.name || 'Vertriebler'}</p>
                    <p className="text-xs text-ink-500 num">{assignedCounts[m.id] || 0} Leads zugewiesen</p>
                  </div>
                </div>
                <span className="pill bg-brand-50 text-brand-600">Vertriebler</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Haupt-App ───────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [showSetPassword, setShowSetPassword] = useState(false)

  const [view, setView] = useState<View>('dashboard')
  const [pipelineMode, setPipelineMode] = useState<'kanban' | 'list'>('list')
  const [pipelineStage, setPipelineStage] = useState<string | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [salesReps, setSalesReps] = useState<Profile[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)

  // ── Auth State überwachen ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setUser(session?.user ?? null)
        setShowSetPassword(true)
      } else {
        setUser(session?.user ?? null)
      }
      if (!session) {
        setProfile(null)
        setContacts([])
        setDeals([])
        setActivities([])
        setShowSetPassword(false)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  // ── Profil laden wenn User eingeloggt ──
  useEffect(() => {
    if (!user) {
      setAuthLoading(false)
      return
    }

    const loadProfile = async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()

      if (error && error.code !== 'PGRST116') {
        console.error('Profil-Fehler:', error)
      }

      if (!data) {
        const { data: allProfiles } = await supabase.from('profiles').select('id')
        const isFirstUser = !allProfiles || allProfiles.length === 0
        const newProfile: Profile = {
          id: user.id,
          name: user.email?.split('@')[0] || 'Admin',
          role: isFirstUser ? 'admin' : 'sales_rep',
          created_at: new Date().toISOString(),
        }
        const { error: insertErr } = await supabase.from('profiles').insert(newProfile)
        if (insertErr) {
          const { data: retry } = await supabase.from('profiles').select('*').eq('id', user.id).single()
          setProfile((retry as Profile) || newProfile)
        } else {
          setProfile(newProfile)
        }
      } else {
        setProfile(data as Profile)
      }
      setAuthLoading(false)
    }

    loadProfile()
  }, [user])

  const fetchContacts = useCallback(async () => {
    const { data, error } = await supabase.from('contacts').select('*').order('created_at', { ascending: false })
    if (error) { console.error('Kontakte-Fehler:', error); setFetchError('Kontakte: ' + error.message) } else { setFetchError(null) }
    setContacts(data || [])
  }, [])

  const fetchDeals = useCallback(async () => {
    const { data, error } = await supabase.from('deals').select('*').order('created_at', { ascending: false })
    if (error) console.error('Deals-Fehler:', error)
    setDeals(data || [])
  }, [])

  const fetchActivities = useCallback(async () => {
    const { data, error } = await supabase.from('activities').select('*').order('created_at', { ascending: false }).limit(100)
    if (error) console.error('Aktivitaeten-Fehler:', error)
    setActivities(data || [])
  }, [])

  const fetchSalesReps = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'sales_rep')
    setSalesReps(data || [])
  }, [])

  const fetchData = useCallback(async () => {
    setDataLoading(true)
    await Promise.all([fetchContacts(), fetchDeals(), fetchActivities(), fetchSalesReps()])
    setDataLoading(false)
  }, [fetchContacts, fetchDeals, fetchActivities, fetchSalesReps])

  useEffect(() => {
    if (profile?.role === 'admin') { fetchData() }
  }, [profile, fetchData])

  const handleLogout = async () => { await supabase.auth.signOut() }
  const handleSelectContact = (contact: Contact) => { setSelectedContact(contact); setShowContactModal(true) }
  const handleGoToPipeline = (stage?: string) => {
    setPipelineStage(stage || null)
    setPipelineMode('list')
    setView('pipeline')
  }

  if (authLoading) return <div className="min-h-[100dvh] flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-500 border-t-transparent" /></div>
  if (!user || !profile) return <Login />
  if (showSetPassword) return <SetPasswordModal onDone={() => setShowSetPassword(false)} />
  if (profile.role === 'sales_rep') return <SalesRepView profile={profile} />

  const stats = {
    totalContacts: contacts.length, totalDeals: deals.length,
    wonDeals: contacts.filter(c => c.pipeline_status === 'gewonnen').length,
    revenue: contacts.filter(c => c.pipeline_status === 'gewonnen').reduce((sum, c) => sum + (c.price || 0), 0),
    activeLeads: contacts.filter(c => c.pipeline_status === 'lead').length,
    pipelineValue: contacts.filter(c => c.pipeline_status === 'lead').length * 850,
  }

  const navItems: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard',  label: 'Dashboard',   icon: <LayoutGrid size={15} /> },
    { id: 'contacts',   label: 'Kontakte',    icon: <Contact2 size={15} /> },
    { id: 'pipeline',   label: 'Pipeline',    icon: <GitBranch size={15} /> },
    { id: 'activities', label: 'Aktivitäten', icon: <MessageSquare size={15} /> },
    { id: 'team',       label: 'Team',        icon: <Users size={15} /> },
  ]

  return (
    <div className="min-h-[100dvh] bg-surface">
      <header className="sticky top-0 z-40 bg-surface/85 backdrop-blur-lg border-b border-ink-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center shadow-btn"><span className="text-white font-extrabold text-lg">Y</span></div>
              <div className="hidden md:block">
                <h1 className="text-base font-extrabold text-ink-900 leading-none tracking-tight">YUNI CRM</h1>
                <p className="text-xs text-ink-500 mt-0.5">Admin · {profile.name}</p>
              </div>
            </div>

            <nav className="flex items-center gap-1 bg-white rounded-full p-1 shadow-card overflow-x-auto">
              {navItems.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { if (tab.id === 'pipeline') setPipelineStage(null); setView(tab.id) }}
                  aria-current={view === tab.id ? 'page' : undefined}
                  className={`navpill ${view === tab.id ? 'navpill-active' : ''}`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={fetchData} title="Daten neu laden" className="btn-ghost !px-2.5"><RefreshCw size={16} /></button>
              <button onClick={() => setShowImportModal(true)} className="btn-soft !px-2.5 sm:!px-4"><Upload size={15} /><span className="hidden lg:inline">Import</span></button>
              <button onClick={() => { setSelectedContact(null); setShowContactModal(true) }} className="btn-primary !px-2.5 sm:!px-4"><Plus size={15} /><span className="hidden lg:inline">Kontakt</span></button>
              <button onClick={handleLogout} title="Abmelden" className="btn-ghost !px-2.5"><LogOut size={16} /></button>
            </div>
          </div>
        </div>
      </header>

      {fetchError && (
        <div className="max-w-7xl mx-auto px-4 pt-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center justify-between">
            <p className="text-red-700 text-sm font-medium">{fetchError}</p>
            <button onClick={fetchData} className="text-red-600 text-sm font-semibold underline">Erneut</button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {dataLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-500 border-t-transparent" />
            <p className="text-ink-500 text-sm">Daten werden geladen…</p>
          </div>
        ) : (
          <>
            {view === 'dashboard' && <Dashboard stats={stats} contacts={contacts} deals={deals} activities={activities} userName={profile.name} onNavigateToContacts={() => setView('contacts')} onSelectContact={handleSelectContact} onGoToPipeline={handleGoToPipeline} />}
            {view === 'contacts' && <ContactTable contacts={contacts} onSelectContact={handleSelectContact} onRefresh={fetchContacts} salesReps={salesReps} />}
            {view === 'pipeline' && (
              <div className="animate-fadeUp">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 bg-white p-1 rounded-full shadow-card">
                    <button
                      onClick={() => setPipelineMode('list')}
                      className={`navpill !py-1.5 ${pipelineMode === 'list' ? 'navpill-active' : ''}`}
                    >
                      <List size={14} /> Telefonliste
                    </button>
                    <button
                      onClick={() => setPipelineMode('kanban')}
                      className={`navpill !py-1.5 ${pipelineMode === 'kanban' ? 'navpill-active' : ''}`}
                    >
                      <Columns size={14} /> Kanban
                    </button>
                  </div>
                </div>
                {pipelineMode === 'list'
                  ? <PipelineList key={pipelineStage || 'all'} contacts={contacts} onRefresh={fetchContacts} onSelectContact={handleSelectContact} initialStage={pipelineStage} />
                  : <KanbanBoard deals={deals} contacts={contacts} onRefresh={fetchContacts} onSelectContact={handleSelectContact} />
                }
              </div>
            )}
            {view === 'activities' && <ActivityLog activities={activities} contacts={contacts} onRefresh={fetchActivities} />}
            {view === 'team' && <TeamView />}
          </>
        )}
      </main>
      {showContactModal && <ContactModal contact={selectedContact} onClose={() => { setShowContactModal(false); setSelectedContact(null) }} onSave={() => { fetchData(); setShowContactModal(false); setSelectedContact(null) }} />}
      {showImportModal && <ImportLeads onClose={() => setShowImportModal(false)} onComplete={fetchData} />}
    </div>
  )
}
