import { useState, useEffect } from 'react'
import { supabase, Contact, Deal, Activity } from './lib/supabase'
import Navigation from './components/Navigation'
import ContactTable from './components/ContactTable'
import KanbanBoard from './components/KanbanBoard'
import ActivityLog from './components/ActivityLog'
import ContactModal from './components/ContactModal'
import ImportLeads from './components/ImportLeads'
import Login from './components/Login'
import { Plus, LogOut, Upload } from 'lucide-react'

type View = 'contacts' | 'pipeline' | 'activities'

export default function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [view, setView] = useState<View>('contacts')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated
    const isAuthenticated = localStorage.getItem('yuni-crm-authenticated') === 'true'
    setAuthenticated(isAuthenticated)
  }, [])

  useEffect(() => {
    if (!authenticated) return

    fetchData()

    // Subscribe to real-time updates using channel-based approach
    const channel = supabase
      .channel('contacts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, () => {
        fetchContacts()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [authenticated])

  const fetchData = async () => {
    setLoading(true)
    await Promise.all([fetchContacts(), fetchDeals(), fetchActivities()])
    setLoading(false)
  }

  const fetchContacts = async () => {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setContacts(data)
    }
  }

  const fetchDeals = async () => {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setDeals(data)
    }
  }

  const fetchActivities = async () => {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && data) {
      setActivities(data)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('yuni-crm-authenticated')
    setAuthenticated(false)
  }

  const stats = {
    totalContacts: contacts.length,
    totalDeals: deals.length,
    wonDeals: deals.filter(d => d.stage === 'gewonnen').length,
    revenue: deals.reduce((sum, d) => sum + (d.value || 0), 0),
  }

  if (!authenticated) {
    return <Login onLogin={() => setAuthenticated(true)} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Y</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">YUNI CRM Pro</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowContactModal(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <Plus size={20} />
                Kontakt hinzufügen
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Upload size={20} />
                Importieren
              </button>
              <button
                onClick={handleLogout}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 flex items-center gap-2"
              >
                <LogOut size={20} />
                Abmelden
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <Navigation view={view} setView={setView} />

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-gray-600 text-sm">Kontakte</div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalContacts}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-gray-600 text-sm">Deals</div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalDeals}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-gray-600 text-sm">Gewonnen</div>
            <div className="text-3xl font-bold text-green-600">{stats.wonDeals}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-gray-600 text-sm">Revenue</div>
            <div className="text-3xl font-bold text-gray-900">{(stats.revenue / 1000).toFixed(1)}k€</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : (
          <>
            {view === 'contacts' && (
              <ContactTable contacts={contacts} onSelectContact={setSelectedContact} />
            )}
            {view === 'pipeline' && (
              <KanbanBoard deals={deals} contacts={contacts} onRefresh={fetchDeals} />
            )}
            {view === 'activities' && (
              <ActivityLog activities={activities} contacts={contacts} onRefresh={fetchActivities} />
            )}
          </>
        )}
      </main>

      {/* Contact Modal */}
      {showContactModal && (
        <ContactModal
          contact={selectedContact}
          onClose={() => {
            setShowContactModal(false)
            setSelectedContact(null)
          }}
          onSave={() => {
            fetchData()
            setShowContactModal(false)
          }}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportLeads
          onClose={() => setShowImportModal(false)}
          onComplete={() => {
            fetchData()
          }}
        />
      )}
    </div>
  )
}
