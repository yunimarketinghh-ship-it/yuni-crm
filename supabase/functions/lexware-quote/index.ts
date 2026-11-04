// Lexware Office ↔ YUNI CRM: Angebote aus dem CRM erstellen
// Der Lexware-API-Schlüssel liegt nur hier als Secret LEXWARE_API_KEY – nie im Frontend.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const LEX = 'https://api.lexware.io'
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function lex(path: string, init: RequestInit = {}, accept = 'application/json'): Promise<Response> {
  const key = Deno.env.get('LEXWARE_API_KEY')
  if (!key) throw new Error('LEXWARE_API_KEY fehlt')
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(LEX + path, {
      ...init,
      headers: { Authorization: `Bearer ${key}`, Accept: accept, 'Content-Type': 'application/json', ...(init.headers || {}) },
    })
    if (res.status === 429) { await sleep(700 * (attempt + 1)); continue }
    return res
  }
  throw new Error('Lexware: zu viele Anfragen, bitte gleich nochmal versuchen')
}
async function lexJson(path: string, init: RequestInit = {}) {
  const res = await lex(path, init)
  const text = await res.text()
  if (!res.ok) throw new Error(`Lexware ${res.status}: ${text.slice(0, 400)}`)
  return text ? JSON.parse(text) : {}
}

type LineItem = Record<string, any>
function cleanItem(it: LineItem): LineItem {
  const out: LineItem = { type: it.type, name: it.name }
  if (it.description != null) out.description = it.description
  if (it.type === 'text') return out
  if ((it.type === 'material' || it.type === 'service') && it.id) out.id = it.id
  for (const k of ['quantity', 'unitName', 'discountPercentage', 'optional', 'alternative']) if (it[k] != null) out[k] = it[k]
  if (it.unitPrice) {
    out.unitPrice = { currency: it.unitPrice.currency || 'EUR', taxRatePercentage: it.unitPrice.taxRatePercentage }
    if (it.unitPrice.netAmount != null) out.unitPrice.netAmount = it.unitPrice.netAmount
    else out.unitPrice.grossAmount = it.unitPrice.grossAmount
  }
  if (Array.isArray(it.subItems) && it.subItems.length) out.subItems = it.subItems.map(cleanItem)
  return out
}

function splitName(full: string) {
  const parts = (full || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return { firstName: '', lastName: '' }
  if (parts.length === 1) return { firstName: '', lastName: parts[0] }
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] }
}

async function buildQuote(tpl: any, address: Record<string, unknown>) {
  const t = tpl.payload ?? await lexJson(`/v1/quotations/${tpl.lexware_quotation_id}`)
  const now = new Date()
  const exp = new Date(now.getTime() + 14 * 86400000)
  const q: any = {
    voucherDate: now.toISOString(),
    expirationDate: exp.toISOString(),
    address,
    lineItems: (t.lineItems || []).map(cleanItem),
    totalPrice: { currency: 'EUR' },
    taxConditions: t.taxConditions ? { taxType: t.taxConditions.taxType } : { taxType: 'net' },
  }
  for (const k of ['title', 'introduction', 'remark']) if (t[k]) q[k] = t[k]
  if (t.paymentConditions) q.paymentConditions = t.paymentConditions
  return q
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const authHeader = req.headers.get('Authorization') || ''
    const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } })
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return json({ error: 'Nicht angemeldet' }, 401)
    const { data: profile } = await admin.from('profiles').select('role,name').eq('id', user.id).single()
    const isAdmin = profile?.role === 'admin'

    const body = await req.json().catch(() => ({}))
    const action = body.action as string

    if (action === 'status') return json({ configured: !!Deno.env.get('LEXWARE_API_KEY'), isAdmin })

    // ---------- Admin: Lexware-Angebote als Vorlagen auswählen ----------
    if (action === 'list_lexware_quotes') {
      if (!isAdmin) return json({ error: 'Nur Admin' }, 403)
      const data = await lexJson('/v1/voucherlist?voucherType=quotation&voucherStatus=open,accepted,rejected,draft&size=60&sort=voucherDate,DESC')
      return json({ items: (data.content || []).map((v: any) => ({
        id: v.id, number: v.voucherNumber, contact: v.contactName, date: v.voucherDate, total: v.totalAmount, status: v.voucherStatus,
      })) })
    }
    if (action === 'selftest') {
      if (!isAdmin) return json({ error: 'Nur Admin' }, 403)
      const out: Record<string, number> = {}
      for (const p of ['/v1/profile', '/v1/contacts?email=test@example.com', '/v1/articles?size=1', '/v1/voucherlist?voucherType=quotation&voucherStatus=open&size=1']) {
        const r = await lex(p); out[p] = r.status; await r.text(); await sleep(600)
      }
      return json(out)
    }
    if (action === 'dryrun_template') {
      // Legt nur einen ENTWURF ohne Angebotsnummer an, um eine Vorlage zu prüfen
      if (!isAdmin) return json({ error: 'Nur Admin' }, 403)
      const { data: tpl } = await admin.from('quote_templates').select('*').eq('id', body.template_id).single()
      if (!tpl) return json({ error: 'Vorlage nicht gefunden' }, 404)
      const q = await buildQuote(tpl, { name: 'VORLAGEN-TEST CRM (bitte löschen)', countryCode: 'DE' })
      const created = await lexJson('/v1/quotations', { method: 'POST', body: JSON.stringify(q) })
      const full = await lexJson(`/v1/quotations/${created.id}`)
      return json({ id: created.id, net: full.totalPrice?.totalNetAmount, status: full.voucherStatus })
    }
    if (action === 'preview_lexware_quote') {
      if (!isAdmin) return json({ error: 'Nur Admin' }, 403)
      const q = await lexJson(`/v1/quotations/${body.id}`)
      return json({
        title: q.title, introduction: q.introduction, remark: q.remark,
        items: (q.lineItems || []).map((i: any) => ({ type: i.type, name: i.name, quantity: i.quantity, net: i.unitPrice?.netAmount })),
        totalNet: q.totalPrice?.totalNetAmount, totalGross: q.totalPrice?.totalGrossAmount,
        raw: { lineItems: q.lineItems, paymentConditions: q.paymentConditions, taxConditions: q.taxConditions },
      })
    }

    // ---------- Angebot erstellen ----------
    if (action === 'create') {
      const { contact_id, template_id, customer = {} } = body
      // Zugriff prüfen: Admin oder zugewiesener Vertriebler
      const { data: contact } = await admin.from('contacts').select('*').eq('id', contact_id).single()
      if (!contact) return json({ error: 'Lead nicht gefunden' }, 404)
      if (!isAdmin && contact.assigned_to !== user.id) return json({ error: 'Kein Zugriff auf diesen Lead' }, 403)
      const { data: tpl } = await admin.from('quote_templates').select('*').eq('id', template_id).single()
      if (!tpl || (!tpl.active && !isAdmin)) return json({ error: 'Vorlage nicht gefunden' }, 404)

      const email = (customer.email ?? contact.email ?? '').trim()
      const companyName = (customer.company ?? contact.company ?? '').trim()
      const personName = (customer.name ?? contact.name ?? '').trim()
      const phone = (contact.phone || '').trim()
      const addr = { street: (customer.street || '').trim(), zip: (customer.zip || '').trim(), city: (customer.city || '').trim() }

      // 1) Lexware-Kontakt finden oder anlegen
      let lexContactId: string | null = contact.lexware_contact_id || null
      if (!lexContactId && email) {
        const found = await lexJson(`/v1/contacts?email=${encodeURIComponent(email)}&customer=true`)
        lexContactId = found.content?.[0]?.id || null
      }
      if (!lexContactId) {
        const { firstName, lastName } = splitName(personName)
        const payload: any = { version: 0, roles: { customer: {} } }
        if (companyName) {
          payload.company = { name: companyName }
          if (lastName) payload.company.contactPersons = [{ firstName: firstName || undefined, lastName, emailAddress: email || undefined, phoneNumber: phone || undefined, primary: true }]
        } else {
          if (!lastName) return json({ error: 'Name oder Firma fehlt – bitte eintragen' }, 400)
          payload.person = { firstName: firstName || undefined, lastName }
        }
        if (addr.street || addr.zip || addr.city) payload.addresses = { billing: [{ ...addr, countryCode: 'DE' }] }
        if (email) payload.emailAddresses = { business: [email] }
        if (phone) payload.phoneNumbers = { business: [phone] }
        const created = await lexJson('/v1/contacts', { method: 'POST', body: JSON.stringify(payload) })
        lexContactId = created.id
      }

      // 2) Vorlage laden (CRM-Vorlage oder Lexware-Angebot) und Angebot anlegen (abgeschlossen = mit Angebotsnummer)
      const q = await buildQuote(tpl, { contactId: lexContactId })
      const createdQ = await lexJson('/v1/quotations?finalize=true', { method: 'POST', body: JSON.stringify(q) })
      const quotationId = createdQ.id
      const full = await lexJson(`/v1/quotations/${quotationId}`)
      const number = full.voucherNumber || quotationId.slice(0, 8)
      const net = full.totalPrice?.totalNetAmount ?? null
      const gross = full.totalPrice?.totalGrossAmount ?? null

      // 3) PDF holen (Lexware rendert ggf. kurz)
      let pdf: ArrayBuffer | null = null
      for (let i = 0; i < 5 && !pdf; i++) {
        const r = await lex(`/v1/quotations/${quotationId}/file`, {}, 'application/pdf')
        if (r.ok) { pdf = await r.arrayBuffer(); break }
        if (r.status === 404 || r.status === 405 || r.status === 406) {
          // Fallback auf älteren Weg
          const d = await lex(`/v1/quotations/${quotationId}/document`)
          if (d.ok) {
            const { documentFileId } = await d.json()
            const f = await lex(`/v1/files/${documentFileId}`, {}, 'application/pdf')
            if (f.ok) { pdf = await f.arrayBuffer(); break }
          }
        }
        await sleep(1200)
      }
      let pdfPath: string | null = null
      if (pdf) {
        pdfPath = `${contact_id}/${number}.pdf`
        const up = await admin.storage.from('quotes').upload(pdfPath, new Uint8Array(pdf), { contentType: 'application/pdf', upsert: true })
        if (up.error) pdfPath = null
      }

      // 4) CRM aktualisieren
      const { data: row } = await admin.from('quotes').insert({
        contact_id, template_id: tpl.id, lexware_id: quotationId, voucher_number: number,
        net_amount: net, gross_amount: gross, pdf_path: pdfPath, created_by: user.id,
      }).select().single()
      const upd: any = { lexware_contact_id: lexContactId, price: net }
      if (['lead', 'nicht_kontaktiert', 'nicht_erreicht', 'in_kontakt', 'verloren'].includes(contact.pipeline_status)) upd.pipeline_status = 'angebot'
      await admin.from('contacts').update(upd).eq('id', contact_id)
      await admin.from('activities').insert({
        id: crypto.randomUUID(), contact_id, type: 'note', user_id: user.id,
        text: `Angebot ${number} erstellt (${tpl.name}, ${net ?? '?'} EUR netto)`,
      })
      return json({ ok: true, quote: row, number, net, gross, hasPdf: !!pdfPath })
    }

    // ---------- PDF-Link ----------
    if (action === 'pdf') {
      const { data: row } = await userClient.from('quotes').select('*').eq('id', body.quote_id).single() // RLS prüft Zugriff
      if (!row?.pdf_path) return json({ error: 'Kein PDF vorhanden' }, 404)
      const { data, error } = await admin.storage.from('quotes').createSignedUrl(row.pdf_path, 60 * 60, { download: `Angebot_${row.voucher_number}.pdf` })
      if (error) return json({ error: error.message }, 500)
      return json({ url: data.signedUrl })
    }

    return json({ error: 'Unbekannte Aktion' }, 400)
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500)
  }
})
