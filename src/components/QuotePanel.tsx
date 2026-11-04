import { useCallback, useEffect, useState } from 'react'
import { supabase, Contact } from '../lib/supabase'
import { FileText, Download, Send, Plus, Loader2 } from 'lucide-react'

export type QuoteTemplate = { id: string; name: string; net_amount: number | null; active: boolean; sort: number; lexware_quotation_id: string | null; category?: string | null }
type Quote = { id: string; voucher_number: string | null; net_amount: number | null; gross_amount: number | null; pdf_path: string | null; created_at: string; template_id: string | null }

export async function callQuote<T = any>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke('lexware-quote', { body: { action, ...payload } })
  if (error) {
    // Fehlertext aus der Edge Function lesen, falls vorhanden
    let msg = error.message
    try { const ctx = (error as any).context; if (ctx?.json) { const j = await ctx.json(); if (j?.error) msg = j.error } } catch { /* ignore */ }
    throw new Error(msg)
  }
  if (data?.error) throw new Error(data.error)
  return data as T
}

const eur = (n: number | null | undefined) =>
  n == null ? '–' : n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 })

export const QUOTE_EARLY_STATUSES = ['lead', 'nicht_kontaktiert', 'nicht_erreicht', 'in_kontakt', 'verloren']
export type QuoteResult = { number: string; net: number | null; gross: number | null }
type Props = { contact: Contact; onChanged?: (r: QuoteResult) => void }

export default function QuotePanel({ contact, onChanged }: Props) {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [templates, setTemplates] = useState<QuoteTemplate[]>([])
  const [open, setOpen] = useState(false)
  const [templateId, setTemplateId] = useState('')
  const [form, setForm] = useState({ company: contact.company || '', name: contact.name || '', email: contact.email || '', street: '', zip: '', city: '' })
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [err, setErr] = useState('')
  const [myEmail, setMyEmail] = useState('')
  const [myName, setMyName] = useState('')

  const load = useCallback(async () => {
    const [q, t] = await Promise.all([
      supabase.from('quotes').select('*').eq('contact_id', contact.id).order('created_at', { ascending: false }),
      supabase.from('quote_templates').select('*').eq('active', true).order('sort').order('name'),
    ])
    setQuotes((q.data as Quote[]) || [])
    setTemplates((t.data as QuoteTemplate[]) || [])
  }, [contact.id])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setMyEmail(data.user?.email || '')
      if (data.user) {
        const { data: p } = await supabase.from('profiles').select('name').eq('id', data.user.id).single()
        setMyName(p?.name || '')
      }
    })
  }, [])

  const create = async () => {
    if (!templateId) { setErr('Bitte eine Leistung auswählen'); return }
    if (!form.email.trim()) { setErr('E-Mail des Kunden fehlt'); return }
    if (!confirming) { setConfirming(true); setErr(''); return }
    setBusy(true); setErr('')
    try {
      const res = await callQuote<QuoteResult>('create', { contact_id: contact.id, template_id: templateId, customer: form })
      setOpen(false); setTemplateId(''); setConfirming(false)
      await load()
      onChanged?.(res)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const getUrl = async (q: Quote) => (await callQuote<{ url: string }>('pdf', { quote_id: q.id })).url

  const download = async (q: Quote) => {
    setErr('')
    try {
      const url = await getUrl(q)
      const a = document.createElement('a'); a.href = url; a.download = `Angebot_${q.voucher_number}.pdf`
      document.body.appendChild(a); a.click(); a.remove()
    } catch (e) { setErr((e as Error).message) }
  }

  const sendMail = async (q: Quote) => {
    await download(q)
    const tplName = templates.find(t => t.id === q.template_id)?.name
    const to = form.email || contact.email || ''
    const subject = `Ihr Angebot ${q.voucher_number} – YUNI GmbH`
    const greeting = contact.name ? `Guten Tag ${contact.name},` : 'Guten Tag,'
    const body = `${greeting}\n\nvielen Dank für das angenehme Gespräch. Anbei erhalten Sie wie besprochen unser Angebot ${q.voucher_number}${tplName ? ` für ${tplName}` : ''}.\n\nDas Angebot ist 14 Tage gültig. Bei Fragen erreichen Sie mich jederzeit gerne.\n\nMit freundlichen Grüßen\n${myName}\nYUNI GmbH`
    const company = myEmail.endsWith('@yuni-gmbh.de') ? myEmail : ''
    const href = company
      ? `https://mail.google.com/mail/?authuser=${encodeURIComponent(company)}&view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      : `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(href, '_blank')
  }

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div>
      <p className="label uppercase tracking-wider">Angebote</p>

      {err && <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-xl mb-2">{err}</p>}

      {quotes.length > 0 && (
        <div className="space-y-2 mb-2.5">
          {quotes.map(q => (
            <div key={q.id} className="flex items-center gap-3 p-3 bg-surface rounded-xl">
              <FileText className="w-4 h-4 text-brand-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink-900">{q.voucher_number || 'Angebot'}</p>
                <p className="text-xs text-ink-400 num">{eur(q.net_amount)} netto · {new Date(q.created_at).toLocaleDateString('de-DE')}</p>
              </div>
              {q.pdf_path && (
                <>
                  <button onClick={() => download(q)} className="p-2 rounded-lg hover:bg-ink-100 text-ink-500" title="PDF herunterladen"><Download className="w-4 h-4" /></button>
                  <button onClick={() => sendMail(q)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600" title="PDF laden und Gmail öffnen">
                    <Send className="w-3.5 h-3.5" /> Senden
                  </button>
                </>
              )}
            </div>
          ))}
          <p className="text-[11px] text-ink-400">„Senden“ lädt das PDF herunter und öffnet Gmail mit fertigem Text – PDF dort nur noch anhängen.</p>
        </div>
      )}

      {!open ? (
        <button onClick={() => { setOpen(true); setErr('') }} className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-brand-300 text-brand-600 px-4 py-2.5 text-sm font-semibold hover:bg-brand-50">
          <Plus className="w-4 h-4" /> Angebot erstellen
        </button>
      ) : (
        <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-4 space-y-3">
          {templates.length === 0 ? (
            <p className="text-sm text-ink-500">Es sind noch keine Angebotsvorlagen freigegeben. Der Admin legt sie unter „Team“ an.</p>
          ) : (
            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              <p className="text-xs font-semibold text-ink-500">Leistung</p>
              {templates.map((t, i) => (<div key={t.id}>
                {t.category && t.category !== templates[i - 1]?.category && <p className="text-[11px] font-bold uppercase tracking-wide text-brand-600 pt-2 pb-0.5">{t.category}</p>}
                <button onClick={() => { setTemplateId(t.id); setConfirming(false) }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-left transition-all ${templateId === t.id ? 'bg-brand-500 text-white shadow-btn' : 'bg-white text-ink-700 hover:bg-ink-50'}`}>
                  <span className="font-semibold">{t.name}</span>
                  <span className="num">{eur(t.net_amount)} netto</span>
                </button>
              </div>))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <input value={form.company} onChange={e => set('company', e.target.value)} placeholder="Firma" className="input col-span-2" />
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ansprechpartner" className="input" />
            <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="E-Mail *" className="input" />
            <input value={form.street} onChange={e => set('street', e.target.value)} placeholder="Straße + Nr." className="input col-span-2" />
            <input value={form.zip} onChange={e => set('zip', e.target.value)} placeholder="PLZ" className="input" />
            <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Ort" className="input" />
          </div>
          <p className="text-[11px] text-ink-400">Ist der Kunde in Lexware schon angelegt (gleiche E-Mail), wird der bestehende Kontakt verwendet.</p>

          {confirming && (() => { const tpl = templates.find(t => t.id === templateId); return (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
              „{tpl?.name}“ für <strong>{form.company || form.name}</strong> ({eur(tpl?.net_amount)} netto) wird in Lexware angelegt und bekommt sofort eine Angebotsnummer.
            </p>) })()}
          <div className="flex gap-2">
            <button onClick={() => { setOpen(false); setConfirming(false) }} disabled={busy} className="flex-1 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-ink-500 hover:bg-ink-50">Abbrechen</button>
            <button onClick={create} disabled={busy || !templateId} className="btn-primary flex-[2]">
              {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Wird in Lexware erstellt…</> : confirming ? 'Ja, jetzt erstellen' : 'In Lexware erstellen'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
