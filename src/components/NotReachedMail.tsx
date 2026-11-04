import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase, Contact } from '../lib/supabase'
import { PhoneMissed, X, Copy, Check } from 'lucide-react'

const WORK_URL = 'https://www.yuni-marketing.de/unsere-arbeit'
const BOOKING_URL = 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ3HQWy6b0oKx12VdNahoTGn2evXdjGqARrN8wPJbfmttIStf4U5OjeZEOFRe-O4YqqxlzgTTwlO'
export const NOT_REACHED_SUBJECT = 'Wir haben Sie leider nicht erreicht – Ihre Anfrage bei YUNI'

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))

// E-Mail-taugliches HTML: Tabellen + Inline-Styles, damit Gmail/Outlook es sauber darstellen
export function notReachedHtml(name: string, sender: string) {
  const greeting = name.trim() ? `Guten Tag ${esc(name.trim())},` : 'Guten Tag,'
  const font = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;"
  const btn = (href: string, label: string, primary: boolean) =>
    `<a href="${href}" target="_blank" style="${font}display:inline-block;padding:14px 26px;border-radius:12px;font-size:15px;font-weight:600;text-decoration:none;${primary
      ? 'background-color:#5A5CE6;color:#ffffff;border:1px solid #5A5CE6;'
      : 'background-color:#ffffff;color:#3D3CB2;border:1px solid #C9CCFB;'}">${label}</a>`
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F3F5FB;padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #E2E4FD;">
<tr><td style="background-color:#171B33;background-image:linear-gradient(135deg,#2C2D71 0%,#171B33 70%);padding:26px 32px;">
<span style="${font}font-size:22px;font-weight:800;letter-spacing:3px;color:#ffffff;">YUNI</span>
<span style="${font}font-size:12px;color:#A7ABF6;letter-spacing:1px;padding-left:10px;">ERKLÄRVIDEOS &amp; PERFORMANCE</span>
</td></tr>
<tr><td style="padding:34px 32px 8px 32px;${font}">
<p style="margin:0 0 18px 0;font-size:17px;font-weight:600;color:#171B33;">${greeting}</p>
<p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;color:#3A3F5C;">wir haben eben versucht, Sie telefonisch zu erreichen – leider ohne Erfolg. Vielen Dank für Ihre Anfrage bei YUNI!</p>
<p style="margin:0 0 26px 0;font-size:15px;line-height:1.65;color:#3A3F5C;">Damit Sie sich schon vorab ein Bild machen können, finden Sie unten eine Auswahl unserer Arbeiten. Und wenn es Ihnen besser passt, buchen Sie sich einfach direkt einen Termin – 30 Minuten, unverbindlich, per Google Meet.</p>
</td></tr>
<tr><td style="padding:0 32px 8px 32px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="padding:0 10px 12px 0;">${btn(WORK_URL, 'Beispielvideos ansehen', false)}</td>
<td style="padding:0 0 12px 0;">${btn(BOOKING_URL, 'Termin buchen', true)}</td>
</tr></table>
</td></tr>
<tr><td style="padding:14px 32px 30px 32px;${font}">
<p style="margin:0 0 22px 0;font-size:14px;line-height:1.6;color:#6B7194;">Oder antworten Sie einfach auf diese E-Mail mit einer Uhrzeit, zu der wir Sie gut erreichen – wir rufen dann zurück.</p>
<p style="margin:0;font-size:15px;line-height:1.6;color:#3A3F5C;">Viele Grüße<br><strong style="color:#171B33;">${esc(sender || 'Ihr YUNI-Team')}</strong><br><span style="font-size:13px;color:#6B7194;">YUNI GmbH · <a href="https://www.yuni-marketing.de" style="color:#5A5CE6;text-decoration:none;">yuni-marketing.de</a></span></p>
</td></tr>
</table>
</td></tr></table>`
}

function notReachedText(name: string, sender: string) {
  return `${name.trim() ? `Guten Tag ${name.trim()},` : 'Guten Tag,'}

wir haben eben versucht, Sie telefonisch zu erreichen – leider ohne Erfolg. Vielen Dank für Ihre Anfrage bei YUNI!

Unsere Arbeiten: ${WORK_URL}
Termin buchen (30 Min., Google Meet): ${BOOKING_URL}

Oder antworten Sie einfach mit einer Uhrzeit, zu der wir Sie gut erreichen.

Viele Grüße
${sender || 'Ihr YUNI-Team'}
YUNI GmbH`
}

type Props = { contact: Contact; userId?: string; className?: string; onSent?: () => void }

export default function NotReachedMail({ contact, userId, className, onSent }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(contact.name || '')
  const [sender, setSender] = useState('')
  const [myEmail, setMyEmail] = useState('')
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setMyEmail(data.user?.email || '')
      if (data.user) {
        const { data: p } = await supabase.from('profiles').select('name').eq('id', data.user.id).single()
        setSender(p?.name && p.name !== 'Admin' && p.name !== 'YUNI' ? p.name : '')
      }
    })
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false) } }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open])

  const html = useMemo(() => notReachedHtml(name, sender), [name, sender])

  const copyAndOpen = async () => {
    setErr('')
    try {
      await navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([notReachedText(name, sender)], { type: 'text/plain' }),
      })])
    } catch {
      setErr('Kopieren hat nicht geklappt – bitte Chrome verwenden.')
      return
    }
    const to = contact.email || ''
    const company = myEmail.endsWith('@yuni-gmbh.de') ? myEmail : ''
    const href = company
      ? `https://mail.google.com/mail/?authuser=${encodeURIComponent(company)}&view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(NOT_REACHED_SUBJECT)}`
      : `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(NOT_REACHED_SUBJECT)}`
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
              <div>
                <label className="label">Unterschrift</label>
                <input value={sender} onChange={e => setSender(e.target.value)} placeholder="Ihr YUNI-Team" className="input" />
              </div>
              <div className="rounded-xl border border-ink-100 overflow-hidden">
                <div className="text-[11px] text-ink-400 px-3 py-1.5 bg-surface border-b border-ink-100">Betreff: {NOT_REACHED_SUBJECT}</div>
                <div className="max-h-[46vh] overflow-y-auto" dangerouslySetInnerHTML={{ __html: html }} />
              </div>
              {err && <p className="text-xs text-red-600">{err}</p>}
              {done && (
                <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">
                  Gmail ist offen und die Mail ist kopiert: ins Textfeld klicken und <strong>Cmd + V</strong> drücken, dann senden.
                </p>
              )}
            </div>

            <div className="p-5 border-t border-ink-100">
              <button onClick={copyAndOpen} className="btn-primary w-full py-3">
                {done ? <><Check className="w-4 h-4" /> Nochmal kopieren & Gmail öffnen</> : <><Copy className="w-4 h-4" /> Kopieren & Gmail öffnen</>}
              </button>
            </div>
          </div>
        </div>, document.body)}
    </>
  )
}
