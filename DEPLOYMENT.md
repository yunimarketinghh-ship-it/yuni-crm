# 🚀 YUNI CRM Pro - Deployment Guide

Willkommen! Diese Anleitung hilft dir, das neue CRM zu deployen.

## Option 1: Drag & Drop zu Netlify (Einfach!) 🎯

Das ist die schnellste Methode:

1. **Entpacke die ZIP-Datei** auf deinem Computer
2. Gehe zu https://app.netlify.com/drop und ziehe den Ordner (drag & drop) dahin
3. Netlify baut und deployed automatisch! ✅

**Aber Achtung:** Das deployt ohne Environment Variables!

## Option 2: Mit GitHub + Netlify (Empfohlen) ⭐

Diese Methode ist besser für zukünftige Updates:

### Step 1: GitHub Repo erstellen

```bash
# Im Projektordner öffnen:
git init
git add .
git commit -m "Initial commit: YUNI CRM Pro"
```

Dann:
1. Gehe zu https://github.com/new
2. Erstelle ein neues Repository (z.B. "yuni-crm-pro")
3. Push deinen Code (die Befehle siehe GitHub)

### Step 2: Netlify mit GitHub verbinden

1. Gehe zu https://app.netlify.com und melde dich an
2. Klick auf "New site from Git"
3. Wähle GitHub und dein "yuni-crm-pro" Repository
4. Klick auf "Deploy site"

### Step 3: Environment Variables setzen

1. In Netlify: Settings → Build & deploy → Environment
2. Füge diese Variables hinzu:
   - `VITE_SUPABASE_URL`: `https://ffylxadhegvvwxrmyktt.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: [Dein Anon Key von Supabase]

3. Klick auf "Deploy site" nochmal

## Option 3: Lokal entwickeln & testen

Wenn du lokal entwickeln möchtest:

```bash
# Dependencies installieren
npm install

# Development Server starten
npm run dev

# Für Produktion bauen
npm run build
```

## 🔗 Meta-Integration einrichten

Deine Meta-Webhook URL (für automatische Leads):
```
https://ffylxadhegvvwxrmyktt.supabase.co/functions/v1/meta-webhook
```

### In Meta einrichten:
1. Gehe zu Meta Business Suite → Formulare
2. Gehe zu Formular-Einstellungen
3. Webhooks hinzufügen:
   - URL: `https://ffylxadhegvvwxrmyktt.supabase.co/functions/v1/meta-webhook`
   - Verifizier Token: Beliebig (z.B. "yuni-crm-webhook")
4. Subscribe zu: `lead` events

Done! Ab jetzt kommen deine Leads automatisch ins CRM! 🎉

## 🔐 Sicherheit

- **Alle sensitive Daten gehören in Environment Variables!**
- `.env` Dateien NICHT zu Git pushen
- Nur `VITE_SUPABASE_ANON_KEY` verwenden (read-only), nicht den service role key!

## 🆘 Probleme?

- **Leads kommen nicht rein?** → Webhook URL in Meta überprüfen
- **App lädt nicht?** → Supabase Keys in Environment Variables?
- **Stil/Layout ist kaputt?** → Cache clearen (Ctrl+Shift+Delete)

---

Viel Spaß mit deinem neuen CRM! 🚀
