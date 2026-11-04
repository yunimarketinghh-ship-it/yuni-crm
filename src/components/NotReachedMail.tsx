import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase, Contact } from '../lib/supabase'
import { PhoneMissed, X, Copy, Check } from 'lucide-react'

const WORK_URL = 'https://www.yuni-marketing.de/unsere-arbeit'
const BOOKING_URL = 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ3HQWy6b0oKx12VdNahoTGn2evXdjGqARrN8wPJbfmttIStf4U5OjeZEOFRe-O4YqqxlzgTTwlO'
export type Signature = { name: string; phone: string; email: string }

// Thema aus dem Lead-Formular: 3D-Modellierung oder Erklärvideo
export function topicFor(contact: Contact) {
  const p = (contact.produkt || '').toLowerCase()
  if (p.includes('3d modellierung') || p.includes('3d-modellierung')) return { subject: 'Ihre Anfrage für eine 3D-Modellierung', short: 'eine 3D-Modellierung' }
  return { subject: 'Ihre Anfrage für ein Erklärvideo', short: 'ein Erklärvideo' }
}

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))

// E-Mail-taugliches HTML: Tabellen + Inline-Styles, damit Gmail/Outlook es sauber darstellen
export function notReachedHtml(name: string, sig: Signature, topic: { subject: string; short: string }) {
  const greeting = name.trim() ? `Guten Tag ${esc(name.trim())},` : 'Guten Tag,'
  const font = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;"
  const btn = (href: string, label: string, primary: boolean) =>
    `<a href="${href}" target="_blank" style="${font}display:inline-block;white-space:nowrap;padding:14px 26px;border-radius:12px;font-size:15px;font-weight:600;text-decoration:none;${primary
      ? 'background-color:#5A5CE6;color:#ffffff;border:1px solid #5A5CE6;'
      : 'background-color:#ffffff;color:#3D3CB2;border:1px solid #C9CCFB;'}">${label}</a>`
  const tel = sig.phone.replace(/[^+0-9]/g, '')
  const sigLines = [
    sig.phone.trim() ? `Tel. <a href="tel:${tel}" style="color:#3A3F5C;text-decoration:none;">${esc(sig.phone.trim())}</a>` : '',
    sig.email.trim() ? `<a href="mailto:${esc(sig.email.trim())}" style="color:#5A5CE6;text-decoration:none;">${esc(sig.email.trim())}</a>` : '',
    `<a href="https://www.yuni-marketing.de" style="color:#5A5CE6;text-decoration:none;">www.yuni-marketing.de</a>`,
  ].filter(Boolean).join('<br>')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F3F5FB;padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #E2E4FD;">
<tr><td style="background-color:#171B33;background-image:linear-gradient(135deg,#2C2D71 0%,#171B33 70%);padding:26px 32px 28px 32px;">
<span style="${font}font-size:22px;font-weight:800;letter-spacing:3px;color:#ffffff;">YUNI</span>
<span style="${font}font-size:12px;color:#A7ABF6;letter-spacing:1px;padding-left:10px;white-space:nowrap;">ERKLÄRVIDEOS</span>
<p style="${font}margin:18px 0 0 0;font-size:21px;line-height:1.3;font-weight:700;color:#ffffff;">${esc(topic.subject)}</p>
</td></tr>
<tr><td style="padding:34px 32px 8px 32px;${font}">
<p style="margin:0 0 18px 0;font-size:17px;font-weight:600;color:#171B33;">${greeting}</p>
<p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;color:#3A3F5C;">vielen Dank für Ihre Anfrage für ${esc(topic.short)}! Wir haben eben versucht, Sie telefonisch zu erreichen – leider ohne Erfolg.</p>
<p style="margin:0 0 26px 0;font-size:15px;line-height:1.65;color:#3A3F5C;">Damit Sie sich schon vorab ein Bild machen können, finden Sie unten eine Auswahl unserer Arbeiten. Und wenn es Ihnen besser passt, buchen Sie sich einfach direkt einen Termin – 30 Minuten, unverbindlich, per Google Meet.</p>
</td></tr>
<tr><td style="padding:0 32px 8px 32px;">
<div style="font-size:0;"><div style="display:inline-block;margin:0 10px 12px 0;">${btn(WORK_URL, 'Beispielvideos ansehen', false)}</div><div style="display:inline-block;margin:0 0 12px 0;">${btn(BOOKING_URL, 'Termin buchen', true)}</div></div>
</td></tr>
<tr><td style="padding:14px 32px 30px 32px;${font}">
<p style="margin:0 0 22px 0;font-size:14px;line-height:1.6;color:#6B7194;">Oder antworten Sie einfach auf diese E-Mail mit einer Uhrzeit, zu der wir Sie gut erreichen – wir rufen dann zurück.</p>
<p style="margin:0 0 10px 0;font-size:15px;line-height:1.6;color:#3A3F5C;">Viele Grüße</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="border-left:3px solid #5A5CE6;padding:2px 0 2px 14px;${font}">
<p style="margin:0;font-size:15px;font-weight:700;color:#171B33;">${esc(sig.name || 'Ihr YUNI-Team')}</p>
<p style="margin:2px 0 6px 0;font-size:13px;color:#6B7194;">YUNI GmbH · Cremon 11 · 20457 Hamburg</p>
<p style="margin:0;font-size:13px;line-height:1.6;color:#3A3F5C;">${sigLines}</p>
</td></tr></table>
</td></tr>
</table>
</td></tr></table>`
}

function notReachedText(name: string, sig: Signature, topic: { subject: string; short: string }) {
  return `${name.trim() ? `Guten Tag ${name.trim()},` : 'Guten Tag,'}

vielen Dank für Ihre Anfrage für ${topic.short}! Wir haben eben versucht, Sie telefonisch zu erreichen – leider ohne Erfolg.

Unsere Arbeiten: ${WORK_URL}
Termin buchen (30 Min., Google Meet): ${BOOKING_URL}

Oder antworten Sie einfach mit einer Uhrzeit, zu der wir Sie gut erreichen.

Viele Grüße
${sig.name || 'Ihr YUNI-Team'}
YUNI GmbH · Cremon 11 · 20457 Hamburg
${[sig.phone && 'Tel. ' + sig.phone, sig.email, 'www.yuni-marketing.de'].filter(Boolean).join('\n')}`
}

type Props = { contact: Contact; userId?: string; className?: string; onSent?: () => void }

export default function NotReachedMail({ contact, userId, className, onSent }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(contact.name || '')
  const [sig, setSig] = useState<Signature>({ name: '', phone: '', email: '' })
  const topic = topicFor(contact)
  const subject = `${topic.subject} – wir haben Sie leider nicht erreicht`
  const [myEmail, setMyEmail] = useState('')
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setMyEmail(data.user?.email || '')
      if (data.user) {
        const { data: p } = await supabase.from('profiles').select('name,phone,signature_email').eq('id', data.user.id).single()
        setSig({
          name: p?.name && p.name !== 'Admin' && p.name !== 'YUNI' ? p.name : 'Ihr YUNI-Team',
          phone: p?.phone || '',
          email: p?.signature_email || data.user.email || '',
        })
      }
    })
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false) } }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open])

  const html = useMemo(() => notReachedHtml(name, sig, topic), [name, sig, topic.subject])

  const copyAndOpen = async () => {
    setErr('')
    try {
      await navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([notReachedText(name, sig, topic)], { type: 'text/plain' }),
      })])
    } catch {
      setErr('Kopieren hat nicht geklappt – bitte Chrome verwenden.')
      return
    }
    const to = contact.email || ''
    const company = myEmail.endsWith('@yuni-gmbh.de') ? myEmail : 'erklaervideo@yuni-gmbh.de' // Admin: Firmen-Hauptkonto
    const href = company
      ? `https://mail.google.com/mail/?authuser=${encodeURIComponent(company)}&view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}`
      : `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}`
    window.open(href, '_blank')
    setDone(true)
    await supabase.from('activities').insert({
      id: crypto.randomUUID(), contact_id: contact.id, type: 'email', user_id: userId,
      text: 'Nicht-erreicht-Mail vorbereitet (Beispielvideos + Terminlink)',
    })
    onSent?.()
  }

  return (
    <>
      <button onClick={() => { setOpen(true); setDone(false); setErr('') }} disabled={!contact.email}
        title={contact.email ? 'Vorgefertigte Mail, wenn der Kunde nicht erreichbar war' : 'Keine E-Mail-Adresse hinterlegt'}
        className={className || 'w-full flex items-center justify-center gap-2 py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl font-semibold text-sm transition-colors disabled:opacity-40'}>
        <PhoneMissed className="w-4 h-4" /> Nicht erreicht – Mail
      </button>

      {open && createPortal(
        <div className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white w-full max-w-2xl rounded-2.5xl shadow-pop max-h-[92vh] flex flex-col animate-fadeUp" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-ink-100">
              <div>
                <h3 className="font-bold text-ink-900">Nicht erreicht – Mail</h3>
                <p className="text-xs text-ink-400">an {contact.email}</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 hover:bg-surface rounded-xl"><X className="w-5 h-5 text-ink-400" /></button>
            </div>

            <div className="p-5 space-y-3 overflow-y-auto">
              <div>
                <label className="label">Anrede (Name)</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="z. B. Herr Müller" className="input" autoFocus />
                <p className="text-[11px] text-ink-400 mt-1">Ergibt „Guten Tag {name.trim() || '…'},“. Leer lassen für „Guten Tag,“.</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><label className="label">Unterschrift</label><input value={sig.name} onChange={e => setSig({ ...sig, name: e.target.value })} className="input" /></div>
                <div><label className="label">Telefon</label><input value={sig.phone} onChange={e => setSig({ ...sig, phone: e.target.value })} className="input" /></div>
                <div><label className="label">E-Mail</label><input value={sig.email} onChange={e => setSig({ ...sig, email: e.target.value })} className="input" /></div>
              </div>
              <div className="rounded-xl border border-ink-100 overflow-hidden">
                <div className="text-[11px] text-ink-400 px-3 py-1.5 bg-surface border-b border-ink-100">Betreff: {subject}</div>
                <div className="max-h-[46vh] overflow-y-auto" dangerouslySetInnerHTML={{ __html: html }} />
              </div>
              {err && <p className="text-xs text-red-600">{err}</p>}
              {done && (
                <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  <p className="font-bold mb-1">✓ Mail ist kopiert – Gmail ist offen.</p>
                  <p>Gmail ist zuerst leer. Im Gmail-Fenster ins Textfeld oben klicken und <strong>Cmd + V</strong> drücken – dann erscheint die fertige Mail. Danach senden.</p>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-ink-100">
              <button onClick={copyAndOpen} className="btn-primary w-full py-3">
                {done ? <><Check className="w-4 h-4" /> Nochmal kopieren & Gmail öffnen</> : <><Copy className="w-4 h-4" /> Kopieren & Gmail öffnen (danach Cmd + V)</>}
              </button>
            </div>
          </div>
        </div>, document.body)}
    </>
  )
}
