import { useState } from 'react'
import { Lock, Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) setError(err.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-3xl">Y</span>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">YUNI CRM</h1>
          <p className="text-center text-gray-600 mb-8">Bitte melden Sie sich an</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">E-Mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ihre@email.de"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Passwort</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="Passwort eingeben..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Anmelden...' : 'Anmelden'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-xs mt-6">
            YUNI CRM - Sicheres Lead-Management System
          </p>
        </div>
      </div>
    </div>
  )
}
