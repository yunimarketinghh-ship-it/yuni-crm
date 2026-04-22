import { useState, useEffect } from 'react'
import { supabase, Contact, Deal, Activity } from './lib/supabase'
import Navigation from './components/Navigation'
import Dashboard from './components/Dashboard'
import ContactTable from './components/ContactTable'
import KanbanBoard from './components/KanbanBoard'
import ActivityLog from './components/ActivityLog'
import ContactModal from './components/ContactModal'
import ImportLeads from './components/ImportLeads'
import Login from './components/Login'
import { Plus, LogOut, Upload } from 'lucide-react'

type View = 'dashboard' | 'contacts' | 'pipeline' | 'activities'

export default function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [view, setView] = useState<View>('dashboard')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('yuni-crm-authenticated') === 'true'
    setAuthenticated(isAuthenticated)
  }, [])

  useEffect(() => {
    if (!authenticated) return
    fetchData()
    const channel = supabase.channel('contacts-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, () => { fetchContacts() }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [authenticated])

  const fetchData = async () => { setLoading(true); await Promise.all([fetchContacts(), fetchDeals(), fetchActivities()]); setLoading(false) }
  const fetchContacts = async () => { const { data, error } = await supabase.from('contacts').select('*').order('created_at', { ascending: false }); if (!error && data) setContacts(data) }
  const fetchDeals = async () => { const { data, error } = await supabase.from('deals').select('*').order('created_at', { ascending: false }); if (!error && data) setDeals(data) }
  const fetchActivities = async () => { const { data, error } = await supabase.from('activities').select('*').order('created_at', { ascending: false }).limit(50); if (!error && data) setActivities(data) }
  const handleLogout = () => { localStorage.removeItem('yuni-crm-authenticated'); setAuthenticated(false) }
  const handleSelectContact = (contact: Contact) => { setSelectedContact(contact); setShowContactModal(true) }

  const stats = {
    totalContacts: contacts.length, totalDeals: deals.length,
    wonDeals: deals.filter(d => d.stage === 'abschluss').length,
    revenue: deals.filter(d => d.stage === 'abschluss').reduce((sum, d) => sum + (d.value || 0), 0),
    activeLeads: contacts.filter(c => (c.status || c.pipeline_status) === 'lead').length,
    pipelineValue: deals.reduce((sum, d) => sum + (d.value || 0), 0),
  }

  if (!authenticated) return <Login onLogin={() => setAuthenticated(true)} />

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md"><span className="text-white font-bold text-lg">Y</span></div>
              <div><h1 className="text-xl font-bold text-gray-900 leading-none">YUNI CRM</h1><p className="text-xs text-gray-500">Lead Management</p></div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setSelectedContact(null); setShowContactModal(true) }} className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-1.5 text-sm font-medium transition-colors shadow-sm"><Plus size={16} /><span className="hidden sm:inline">Kontakt</span></button>
              <button onClick={() => setShowImportModal(true)} className="bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-1.5 text-sm font-medium transition-colors shadow-sm"><Upload size={16} /><span className="hidden sm:inline">Import</span></button>
              <button onClick={handleLogout} className="text-gray-500 px-3 py-2 rounded-lg hover:bg-gray-100 flex items-center gap-1.5 text-sm font-medium transition-colors"><LogOut size={16} /><span className="hidden sm:inline">Abmelden</span></button>
            </div>
          </div>
        </div>
      </header>
      <Navigation view={view} setView={setView} />
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {loading ? (<div className="flex flex-col items-center justify-center py-24 gap-3"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div><p className="text-gray-500 text-sm">Daten werden geladen...</p></div>) : (<>
          {view === 'dashboard' && <Dashboard stats={stats} contacts={contacts} deals={deals} activities={activities} />}
          {view === 'contacts' && <ContactTable contacts={contacts} onSelectContact={handleSelectContact} onRefresh={fetchContacts} />}
          {view === 'pipeline' && <KanbanBoard deals={deals} contacts={contacts} onRefresh={fetchDeals} />}
          {view === 'activities' && <ActivityLog activities={activities} contacts={contacts} onRefresh={fetchActivities} />}
        </>)}
      </main>
      {showContactModal && <ContactModal contact={selectedContact} onClose={() => { setShowContactModal(false); setSelectedContact(null) }} onSave={() => { fetchData(); setShowContactModal(false); setSelectedContact(null) }} />}
      {showImportModal && <ImportLeads onClose={() => setShowImportModal(false)} onComplete={() => { fetchData() }} />}
    </div>
  )
}
