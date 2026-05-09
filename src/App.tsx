import { useState, useEffect, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, Contact, Deal, Activity, Profile } from './lib/supabase'
import Dashboard from './components/Dashboard'
import ContactTable from './components/ContactTable'
import KanbanBoard from './components/KanbanBoard'
import ActivityLog from './components/ActivityLog'
import ContactModal from './components/ContactModal'
import ImportLeads from './components/ImportLeads'
import Login from './components/Login'
import SalesRepView from './components/SalesRepView'
import { Plus, LogOut, Upload, Users, RefreshCw } from 'lucide-react'

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🔒</span>
        </div>
        <h2 className="text-xl font-bold text-center text-gray-900 mb-2">Neues Passwort setzen</h2>
        <p className="text-sm text-gray-500 text-center mb-6">Setze jetzt dein Passwort für zukünftige Anmeldungen.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Neues Passwort"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            type="password"
            placeholder="Passwort bestätigen"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
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
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Neuen Vertriebler anlegen</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-800 font-medium mb-1">So legst du einen Vertriebler an:</p>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Gehe zu <a href="https://supabase.com/dashboard/project/ffylxadhegvvwxrmyktt/auth/users" target="_blank" rel="noreferrer" className="underline font-medium">Supabase → Authentication → Users</a></li>
            <li>Klicke auf <strong>"Add user" → "Create new user"</strong></li>
            <li>Trage E-Mail und Passwort ein und speichere</li>
            <li>Komme hierher zurück und klicke "Neu laden"</li>
          </ol>
        </div>
        <button onClick={fetchData} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors">
          Neu laden
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Dein Team</h2>
        {loading ? (
          <p className="text-gray-400 text-sm">Lädt...</p>
        ) : members.length === 0 ? (
          <p className="text-gray-400 text-sm italic">Noch keine Vertriebler angelegt.</p>
        ) : (
          <div className="space-y-3">
            {members.map(m => (
              <div key={m.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{(m.name || 'V').charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{m.name || 'Vertriebler'}</p>
                    <p className="text-xs text-gray-500">{assignedCounts[m.id] || 0} Leads zugewiesen</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">Vertriebler</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Haupt-App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [showSetPassword, setShowSetPassword] = useState(false)

  const [view, setView] = useState<View>('dashboard')
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

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" /></div>
  if (!user || !profile) return <Login />
  if (showSetPassword) return <SetPasswordModal onDone={() => setShowSetPassword(false)} />
  if (profile.role === 'sales_rep') return <SalesRepView profile={profile} />

  const stats = {
    totalContacts: contacts.length, totalDeals: deals.length,
    wonDeals: contacts.filter(c => c.pipeline_status === 'abschluss').length,
    revenue: contacts.filter(c => c.pipeline_status === 'abschluss').reduce((sum, c) => sum + (c.price || 0), 0),
    activeLeads: contacts.filter(c => ['interessent', 'lead', 'nicht_kontaktiert'].includes(c.pipeline_status || '')).length,
    pipelineValue: contacts.reduce((sum, c) => sum + (c.price || 0), 0),
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md"><span className="text-white font-bold text-lg">Y</span></div>
              <div><h1 className="text-xl font-bold text-gray-900 leading-none">YUNI CRM</h1><p className="text-xs text-gray-500">Admin — {profile.name}</p></div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchData} title="Daten neu laden" className="text-gray-500 px-3 py-2 rounded-lg hover:bg-gray-100 flex items-center gap-1.5 text-sm font-medium transition-colors"><RefreshCw size={16} /></button>
              <button onClick={() => { setSelectedContact(null); setShowContactModal(true) }} className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-1.5 text-sm font-medium transition-colors shadow-sm"><Plus size={16} /><span className="hidden sm:inline">Kontakt</span></button>
              <button onClick={() => setShowImportModal(true)} className="bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-1.5 text-sm font-medium transition-colors shadow-sm"><Upload size={16} /><span className="hidden sm:inline">Import</span></button>
              <button onClick={handleLogout} className="text-gray-500 px-3 py-2 rounded-lg hover:bg-gray-100 flex items-center gap-1.5 text-sm font-medium transition-colors"><LogOut size={16} /><span className="hidden sm:inline">Abmelden</span></button>
            </div>
          </div>
        </div>
      </header>
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {([{id:'dashboard',label:'Dashboard'},{id:'contacts',label:'Kontakte'},{id:'pipeline',label:'Pipeline'},{id:'activities',label:'Aktivitäten'},{id:'team',label:'Team'}] as {id:View;label:string}[]).map(tab => (
              <button key={tab.id} onClick={() => setView(tab.id)} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${view===tab.id?'border-indigo-600 text-indigo-600':'border-transparent text-gray-500 hover:text-gray-800'}`}>
                {tab.id==='team'&&<Users size={14} className="inline mr-1" />}{tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>
      {fetchError&&<div className="max-w-7xl mx-auto px-4 pt-4 sm:px-6 lg:px-8"><div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between"><p className="text-red-700 text-sm">⚠️ {fetchError}</p><button onClick={fetchData} className="text-red-600 text-sm underline">Erneut</button></div></div>}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {dataLoading?(
          <div className="flex flex-col items-center justify-center py-24 gap-3"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" /><p className="text-gray-500 text-sm">Daten werden geladen...</p></div>
        ):(
          <>
            {view==='dashboard'&&<Dashboard stats={stats} contacts={contacts} deals={deals} activities={activities} onNavigateToContacts={()=>setView('contacts')} />}
            {view==='contacts'&&<ContactTable contacts={contacts} onSelectContact={handleSelectContact} onRefresh={fetchContacts} salesReps={salesReps} />}
            {view==='pipeline'&&<KanbanBoard deals={deals} contacts={contacts} onRefresh={fetchContacts} onSelectContact={handleSelectContact} />}
            {view==='activities'&&<ActivityLog activities={activities} contacts={contacts} onRefresh={fetchActivities} />}
            {view==='team'&&<TeamView />}
          </>
        )}
      </main>
      {showContactModal&&<ContactModal contact={selectedContact} onClose={()=>{setShowContactModal(false);setSelectedContact(null)}} onSave={()=>{fetchData();setShowContactModal(false);setSelectedContact(null)}} />}
      {showImportModal&&<ImportLeads onClose={()=>setShowImportModal(false)} onComplete={fetchData} />}
    </div>
  )
}
