// Exporte les données d'un utilisateur de l'ancienne version en ligne (Supabase) vers un fichier JSON
// importable dans l'appli (Config → Sauvegarde des données → Importer un fichier).
//
// Usage :
//   node --env-file=../gestion-bobines/.env.local scripts/export-supabase.mjs <pseudo>
//
// Variables nécessaires (dans le .env.local du site) :
//   NEXT_PUBLIC_SUPABASE_URL      déjà présente
//   SUPABASE_SERVICE_ROLE_KEY     Supabase → Project Settings → API Keys → service_role (secret, ne pas commiter)

import fs from 'fs'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const username = process.argv[2]

if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définies (voir en-tête du script).')
  process.exit(1)
}

const headers = { apikey: key, Authorization: `Bearer ${key}` }

// Récupère toutes les lignes d'une table, page par page (Supabase limite à 1000 lignes par requête)
async function fetchAll(table, filter = '') {
  const rows = []
  const pageSize = 1000
  for (let from = 0; ; from += pageSize) {
    const res = await fetch(`${url}/rest/v1/${table}?select=*${filter}`, {
      headers: { ...headers, Range: `${from}-${from + pageSize - 1}` },
    })
    if (!res.ok) throw new Error(`${table} : ${res.status} ${await res.text()}`)
    const page = await res.json()
    rows.push(...page)
    if (page.length < pageSize) return rows
  }
}

if (!username) {
  const profiles = await fetchAll('profiles')
  console.log('Précisez le pseudo à exporter. Comptes existants :')
  for (const p of profiles) console.log(`  - ${p.username} (${p.email})`)
  process.exit(1)
}

const [profile] = await fetchAll('profiles', `&username=ilike.${encodeURIComponent(username)}`)
if (!profile) {
  console.error(`Aucun compte avec le pseudo "${username}".`)
  process.exit(1)
}

const byUser = `&user_id=eq.${profile.id}`
const spools = await fetchAll('spools', byUser)
const consumption_logs = await fetchAll('consumption_logs', byUser)
const [settings] = await fetchAll('user_settings', byUser)
const group_settings = await fetchAll('group_settings', byUser)

const file = `export-${profile.username}-${new Date().toISOString().split('T')[0]}.json`
fs.writeFileSync(file, JSON.stringify({
  version: 1,
  source: 'supabase',
  exported_at: new Date().toISOString(),
  spools,
  consumption_logs,
  settings: settings ?? null,
  group_settings,
}, null, 2))

console.log(`${spools.length} bobines, ${consumption_logs.length} consommations → ${file}`)
