// Complète le build Next.js « standalone » pour qu'il soit embarqué dans l'appli Electron.
// Next ne copie pas lui-même les fichiers statiques ni le dossier public.
import fs from 'fs'

const out = '.next/standalone'
if (!fs.existsSync(`${out}/server.js`)) {
  console.error('Lancez d\'abord `next build`.')
  process.exit(1)
}

fs.cpSync('.next/static', `${out}/.next/static`, { recursive: true })
fs.cpSync('public', `${out}/public`, { recursive: true })

// Sécurité : aucun fichier d'environnement (clés, secrets) ne doit partir dans l'appli
for (const f of fs.readdirSync(out)) {
  if (f.startsWith('.env')) fs.rmSync(`${out}/${f}`)
}

console.log('Serveur prêt dans', out)
