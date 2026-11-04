import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { callQuote, QuoteTemplate } from './QuotePanel'
import { FileText, Trash2, Plus, Loader2, Eye, EyeOff } from 'lucide-react'

type LexQuote = { id: string; number: string; contact: string; date: string; total: number; status: string }
type Preview = { title?: string; introduction?: string; remark?: string; items: { type: string; name: string; quantity?: number; net?: number }[]; totalNet?: number; totalGross?: number }

const eur = (n: number | null | undefined) =>
  n == null ? '–' : n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 })

export default function QuoteTemplates() {
  const [templates, setTemplates] = useState<QuoteTemplate[]>([])
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [adding, setAdding] = useState(false)
  const [lexQuotes, setLexQuotes] = useState<LexQuote[]>([])
  const [pick, setPick] = useState<LexQuote | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const load = async () => {
    const { data } = await supabase.from('quote_templates').select('*').order('sort').order('name')
    setTemplates((data as QuoteTemplate[]) || [])
  }
  useEffect(() => {
    load()
    callQuote<{ configured: boolean }>('status').then(r => setConfigured(r.configured)).catch(() => setConfigured(false))
  }, [])

  const startAdd = async () => {
    setAdding(true); setErr(''); setBusy(true)
    try { setLexQuotes((await callQuote<{ items: LexQuote[] }>('list_lexware_quotes')).items) }
    catch (e) { setErr((e as Error).message) }
    finally { setBusy(false) }
  }

  const choose = async (q: LexQuote) => {
    setPick(q); setPreview(null); setErr(''); setBusy(true)
    try {
      const p = await callQuote<Preview>('preview_lexware_quote', { id: q.id })
      setPreview(p)
      const firstPriced = p.items.find(i => i.net != null)
      setName(firstPriced?.name?.split('\n')[0]?.slice(0, 60) || p.title || '')
    } catch (e) { setErr((e as Error).message) }
    finally { setBusy(false) }
  }

  const save = async () => {
    if (!pick || !name.trim()) return
    const { error } = await supabase.from('quote_templates').insert({
      name: name.trim(), lexware_quotation_id: pick.id, net_amount: preview?.totalNet ?? null, sort: templates.length,
    })
    if (error) { setErr(error.message); return }
    setAdding(false); setPick(null); setPreview(null); setName('')
    load()
  }

  const toggle = async (t: QuoteTemplate) => { await supabase.from('quote_templates').update({ active: !t.active }).eq('id', t.id); load() }
  const remove = async (t: QuoteTemplate) => { await supabase.from('quote_templates').delete().eq('id', t.id); load() }

  return (
    <div className="card p-6">
      <h2 className="text-lg font-bold text-ink-900 mb-1">Angebotsvorlagen (Lexware)</h2>
      <p className="text-sm text-ink-500 mb-4">Vertriebler können nur diese Leistungen zum hinterlegten Preis anbieten. Eine Vorlage ist ein bestehendes Lexware-Angebot – Positionen, Texte und Preis werden 1:1 übernommen.</p>

      {configured === false && (
        <p className="text-sm text-orange-700 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 mb-4">
          Lexware ist noch nicht verbunden: Der API-Schlüssel fehlt. Lexware → Einstellungen → Erweiterungen → „Öffentliche API“ → Schlüssel erstellen, dann in <a className="underline font-semibold" href="https://supabase.com/dashboard/project/ffylxadhegvvwxrmyktt/functions/secrets" target="_blank" rel="noreferrer">Supabase → Edge Functions → Secrets</a> als <code>LEXWARE_API_KEY</code> eintragen.
        </p>
      )}
      {err && <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3.5 py-2.5 rounded-xl mb-3">{err}</p>}

      <div className="space-y-2 mb-4">
        {templates.length === 0 && <p className="text-sm text-ink-400 italic">Noch keine Vorlagen.</p>}
        {templates.map(t => (
          <div key={t.id} className={`flex items-center gap-3 p-3.5 rounded-xl ${t.active ? 'bg-surface' : 'bg-surface opacity-50'}`}>
            <FileText className="w-4 h-4 text-brand-500" />
            <span className="flex-1 text-sm font-semibold text-ink-900">{t.name}</span>
            <span className="text-sm num text-ink-600">{eur(t.net_amount)} netto</span>
            <button onClick={() => toggle(t)} className="p-2 rounded-lg hover:bg-ink-100 text-ink-500" title={t.active ? 'Für Vertriebler ausblenden' : 'Wieder anzeigen'}>
              {t.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button onClick={() => remove(t)} className="p-2 rounded-lg hover:bg-red-50 text-red-500" title="Vorlage löschen"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>

      {!adding ? (
        <button onClick={startAdd} disabled={configured === false} className="btn-primary"><Plus size={15} /> Vorlage aus Lexware-Angebot</button>
      ) : (
        <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-4 space-y-3">
          {busy && <p className="text-sm text-ink-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Lädt aus Lexware…</p>}
          {!pick && lexQuotes.length > 0 && (
            <div className="max-h-72 overflow-y-auto space-y-1">
              <p className="text-xs font-semibold text-ink-500 mb-1">Welches Angebot soll als Vorlage dienen?</p>
              {lexQuotes.map(q => (
                <button key={q.id} onClick={() => choose(q)} className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white hover:bg-ink-50 text-sm text-left">
                  <span><strong>{q.number}</strong> · {q.contact}</span>
                  <span className="num text-ink-500">{eur(q.total)} brutto</span>
                </button>
              ))}
            </div>
          )}
          {pick && preview && (
            <div className="space-y-3">
              <div className="bg-white rounded-xl p-3 text-sm space-y-1">
                <p className="text-xs text-ink-400">Vorlage aus {pick.number} ({pick.contact})</p>
                {preview.introduction && <p className="text-ink-500 italic text-xs whitespace-pre-line">{preview.introduction}</p>}
                {preview.items.map((i, idx) => (
                  <p key={idx} className="flex justify-between gap-3"><span className="whitespace-pre-line">{i.name}</span><span className="num">{i.net != null ? `${i.quantity ?? 1} × ${eur(i.net)}` : ''}</span></p>
                ))}
                <p className="font-semibold pt-1 border-t border-ink-100 flex justify-between"><span>Summe netto</span><span className="num">{eur(preview.totalNet)}</span></p>
              </div>
              <p className="text-xs text-orange-700">Prüfe, dass Einleitung und Positionen keinen Kundennamen enthalten – sie gehen 1:1 an jeden neuen Kunden.</p>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Name für Vertriebler, z. B. Erklärvideo 60 Sek." className="input" />
              <div className="flex gap-2">
                <button onClick={() => { setPick(null); setPreview(null) }} className="flex-1 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-ink-500">Zurück</button>
                <button onClick={save} disabled={!name.trim()} className="btn-primary flex-[2]">Als Vorlage speichern</button>
              </div>
            </div>
          )}
          {!pick && <button onClick={() => setAdding(false)} className="text-sm text-ink-500 underline">Abbrechen</button>}
        </div>
      )}
    </div>
  )
}
