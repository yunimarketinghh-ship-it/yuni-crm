import { useState } from 'react'
import { Lock, Mail, CheckCircle, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'

type Mode = 'login' | 'forgot' | 'sent'

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-surface flex items-center justify-center p-4 relative overflow-hidden">
      {/* Weiche Farbflächen im Hintergrund */}
      <div className="absolute -top-32 -left-24 w-96 h-96 rounded-full bg-brand-200/50 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-24 w-[28rem] h-[28rem] rounded-full bg-sky-200/40 blur-3xl pointer-events-none" />
      <div className="w-full max-w-md relative animate-fadeUp">
        {children}
      </div>
    </div>
  )
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<Mode>('login')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) setError(err.message)
    setLoading(false)
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { setError('Bitte E-Mail eingeben.'); return }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://yunimarketinghh-ship-it.github.io/yuni-crm',
    })
    if (err) { setError(err.message); setLoading(false); return }
    setMode('sent')
    setLoading(false)
  }

  if (mode === 'sent') {
    return (
      <AuthShell>
        <div className="card shadow-pop p-8 text-center">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="text-emerald-500" size={26} />
          </div>
          <h2 className="text-xl font-extrabold text-ink-900 mb-2 tracking-tight">E-Mail gesendet</h2>
          <p className="text-ink-700 text-sm mb-2">
            Wir haben eine E-Mail an <strong>{email}</strong> geschickt.
          </p>
          <p className="text-ink-500 text-sm mb-6">
            Bitte schaue in deinen Posteingang (und Spam-Ordner) und klicke auf den Link,
            um ein neues Passwort zu setzen.
          </p>
          <button
            onClick={() => { setMode('login'); setError('') }}
            className="text-brand-500 text-sm font-semibold hover:text-brand-700 inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14} /> Zurück zum Login
          </button>
        </div>
      </AuthShell>
    )
  }

  if (mode === 'forgot') {
    return (
      <AuthShell>
        <div className="card shadow-pop p-8">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center shadow-btn">
              <span className="text-white font-extrabold text-2xl">Y</span>
            </div>
          </div>
          <h1 className="text-xl font-extrabold text-center text-ink-900 mb-2 tracking-tight">Passwort zurücksetzen</h1>
          <p className="text-center text-ink-500 mb-8 text-sm">
            Wir senden dir einen Link an deine E-Mail-Adresse.
          </p>
          <form onSubmit={handleForgot} className="space-y-4">
            <div>
              <label className="label">E-Mail</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" size={17} />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  placeholder="deine@email.de"
                  className="input !pl-10"
                  autoFocus
                />
              </div>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Wird gesendet…' : 'Reset-Link senden'}
            </button>
          </form>
          <div className="text-center mt-5">
            <button
              onClick={() => { setMode('login'); setError('') }}
              className="text-brand-500 text-sm font-semibold hover:text-brand-700 inline-flex items-center gap-1.5"
            >
              <ArrowLeft size={14} /> Zurück zum Login
            </button>
          </div>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className="card shadow-pop p-8">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center shadow-btn">
            <span className="text-white font-extrabold text-2xl">Y</span>
          </div>
        </div>
        <h1 className="text-2xl font-extrabold text-center text-ink-900 mb-1.5 tracking-tight">Willkommen zurück</h1>
        <p className="text-center text-ink-500 mb-8 text-sm">Melde dich bei YUNI CRM an</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="label">E-Mail</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" size={17} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="deine@email.de"
                className="input !pl-10"
                autoFocus
              />
            </div>
          </div>
          <div>
            <label className="label">Passwort</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" size={17} />
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="Passwort eingeben…"
                className="input !pl-10"
              />
            </div>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Anmelden…' : 'Anmelden'}
          </button>
        </form>
        <div className="text-center mt-5">
          <button
            onClick={() => { setMode('forgot'); setError('') }}
            className="text-brand-500 text-sm font-semibold hover:text-brand-700"
          >
            Passwort vergessen?
          </button>
        </div>
        <p className="text-center text-ink-400 text-xs mt-8">
          YUNI CRM · Sicheres Lead-Management
        </p>
      </div>
    </AuthShell>
  )
}
