import { LayoutDashboard, Users, TrendingUp, Activity } from 'lucide-react'

type View = 'dashboard' | 'contacts' | 'pipeline' | 'activities'

interface Props {
  view: View
  setView: (view: View) => void
}

export default function Navigation({ view, setView }: Props) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'contacts', label: 'Kontakte', icon: Users },
    { id: 'pipeline', label: 'Pipeline', icon: TrendingUp },
    { id: 'activities', label: 'Aktivitäten', icon: Activity },
  ]

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-0 overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setView(id as View)}
              className={`px-5 py-3.5 font-medium text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
                view === id
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
