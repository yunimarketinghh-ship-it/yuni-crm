import { Users, TrendingUp, Activity } from 'lucide-react'

type View = 'contacts' | 'pipeline' | 'activities'

interface Props {
  view: View
  setView: (view: View) => void
}

export default function Navigation({ view, setView }: Props) {
  const tabs = [
    { id: 'contacts', label: 'Kontakte', icon: Users },
    { id: 'pipeline', label: 'Pipeline', icon: TrendingUp },
    { id: 'activities', label: 'Aktivitäten', icon: Activity },
  ]

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-0">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setView(id as View)}
              className={`px-4 py-4 font-medium text-sm flex items-center gap-2 border-b-2 transition-all ${
                view === id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
