// Point d'entrée de l'appli Mac : lance le serveur Next.js embarqué puis l'affiche dans une fenêtre
const { app, BrowserWindow, Menu, dialog, shell, utilityProcess } = require('electron')
const fs = require('fs')
const path = require('path')
const net = require('net')
const http = require('http')

const GITHUB_REPO = 'leobrimacombe/bobines'
const PREFERRED_PORT = 47123 // port fixe pour que le thème (localStorage) soit conservé d'un lancement à l'autre
const BACKUPS_TO_KEEP = 30

let mainWindow = null
let server = null

if (!app.requestSingleInstanceLock()) app.quit()

app.on('second-instance', () => {
  if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus() }
})

// --- DONNÉES & SAUVEGARDES ---

const dataDir = () => app.getPath('userData') // ~/Library/Application Support/SpoolTracker

// Une copie de data.json par jour d'utilisation, on garde les 30 dernières
function backupData() {
  const file = path.join(dataDir(), 'data.json')
  if (!fs.existsSync(file)) return
  const dir = path.join(dataDir(), 'sauvegardes')
  fs.mkdirSync(dir, { recursive: true })
  const today = path.join(dir, `data-${new Date().toISOString().split('T')[0]}.json`)
  if (!fs.existsSync(today)) fs.copyFileSync(file, today)
  const old = fs.readdirSync(dir).filter(f => f.startsWith('data-')).sort().reverse().slice(BACKUPS_TO_KEEP)
  for (const f of old) fs.unlinkSync(path.join(dir, f))
}

// --- SERVEUR NEXT.JS EMBARQUÉ ---

function freePort(port) {
  return new Promise(resolve => {
    const srv = net.createServer()
    srv.once('error', () => resolve(port === 0 ? null : freePort(0)))
    srv.listen(port, '127.0.0.1', () => {
      const { port: p } = srv.address()
      srv.close(() => resolve(p))
    })
  })
}

function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const attempt = () => {
      http.get(url, res => { res.resume(); resolve() }).on('error', () => {
        if (Date.now() - start > timeoutMs) reject(new Error('Le serveur interne ne répond pas.'))
        else setTimeout(attempt, 200)
      })
    }
    attempt()
  })
}

async function startServer() {
  const serverDir = app.isPackaged
    ? path.join(process.resourcesPath, 'server')
    : path.join(__dirname, '..', '.next', 'standalone')
  const port = await freePort(PREFERRED_PORT)
  const log = fs.createWriteStream(path.join(dataDir(), 'serveur.log'))

  server = utilityProcess.fork(path.join(serverDir, 'server.js'), [], {
    cwd: serverDir,
    stdio: 'pipe',
    env: { ...process.env, NODE_ENV: 'production', PORT: String(port), HOSTNAME: '127.0.0.1', BOBINES_DATA_DIR: dataDir() },
  })
  server.stdout.pipe(log)
  server.stderr.pipe(log)

  const url = `http://127.0.0.1:${port}`
  await waitForServer(url)
  return url
}

// --- FENÊTRE ---

function createWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#F5F5F7',
    show: false,
    webPreferences: { contextIsolation: true, sandbox: true },
  })

  // Les liens externes s'ouvrent dans le navigateur, jamais dans l'appli
  mainWindow.webContents.setWindowOpenHandler(({ url: target }) => { shell.openExternal(target); return { action: 'deny' } })
  mainWindow.webContents.on('will-navigate', (e, target) => {
    if (!target.startsWith(url)) { e.preventDefault(); shell.openExternal(target) }
  })

  // Export de sauvegarde : on propose le dossier Documents
  mainWindow.webContents.session.on('will-download', (e, item) => {
    item.setSaveDialogOptions({ defaultPath: path.join(app.getPath('documents'), item.getFilename()) })
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.on('closed', () => { mainWindow = null })
  mainWindow.loadURL(`${url}/dashboard`)
}

// --- MISES À JOUR (via les Releases GitHub) ---

const versionOf = tag => tag.replace(/^app-v/, '')

function isNewer(latest, current) {
  const a = versionOf(latest).split('.').map(Number)
  const b = current.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) > (b[i] || 0)
  }
  return false
}

async function checkForUpdates({ silent }) {
  let release
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=30`, { headers: { Accept: 'application/vnd.github+json' } })
    if (!res.ok) throw new Error(`GitHub a répondu ${res.status}`)
    // Le dépôt héberge aussi le site : on ne regarde que les versions de l'appli (tags app-v…), la plus récente en premier
    release = (await res.json()).find(r => r.tag_name.startsWith('app-v') && !r.draft && !r.prerelease)
  } catch (e) {
    // Pas d'Internet : on n'embête personne au démarrage
    if (!silent) dialog.showMessageBox(mainWindow, { type: 'warning', message: 'Impossible de vérifier les mises à jour.', detail: 'Vérifiez la connexion Internet et réessayez.' })
    return
  }

  const current = app.getVersion()
  const dmg = release?.assets?.find(a => a.name.endsWith('.dmg'))
  if (!dmg || !isNewer(release.tag_name, current)) {
    if (!silent) dialog.showMessageBox(mainWindow, { type: 'info', message: 'SpoolTracker est à jour.', detail: `Version installée : ${current}` })
    return
  }

  const { response } = await dialog.showMessageBox(mainWindow, {
    type: 'info',
    message: `Une nouvelle version est disponible (${versionOf(release.tag_name)})`,
    detail: `Vous avez la version ${current}.${release.body ? `\n\nNouveautés :\n${release.body}` : ''}`,
    buttons: ['Mettre à jour', 'Plus tard'],
    defaultId: 0,
    cancelId: 1,
  })
  if (response !== 0) return

  try {
    const file = await downloadUpdate(dmg)
    await dialog.showMessageBox(mainWindow, {
      type: 'info',
      message: 'Mise à jour téléchargée',
      detail: 'Une fenêtre va s\'ouvrir : faites glisser SpoolTracker dans le dossier Applications, puis choisissez « Remplacer ».\n\nSpoolTracker va se fermer. Vos données sont conservées.',
      buttons: ['OK'],
    })
    await shell.openPath(file)
    app.quit()
  } catch (e) {
    mainWindow?.setProgressBar(-1)
    dialog.showMessageBox(mainWindow, { type: 'error', message: 'Le téléchargement a échoué.', detail: String(e.message || e) })
  }
}

async function downloadUpdate(asset) {
  const res = await fetch(asset.browser_download_url)
  if (!res.ok || !res.body) throw new Error(`Téléchargement impossible (${res.status})`)

  const file = path.join(app.getPath('downloads'), asset.name)
  const out = fs.createWriteStream(file)
  const total = asset.size || Number(res.headers.get('content-length')) || 0
  let received = 0

  for await (const chunk of res.body) {
    received += chunk.length
    if (total) mainWindow?.setProgressBar(received / total)
    if (!out.write(chunk)) await new Promise(r => out.once('drain', r))
  }
  await new Promise((resolve, reject) => out.end(err => (err ? reject(err) : resolve())))
  mainWindow?.setProgressBar(-1)
  return file
}

// --- MENU ---

function buildMenu() {
  const template = [
    {
      label: app.name,
      submenu: [
        { role: 'about', label: `À propos de ${app.name}` },
        { label: 'Rechercher des mises à jour…', click: () => checkForUpdates({ silent: false }) },
        { label: 'Ouvrir le dossier des données', click: () => shell.openPath(dataDir()) },
        { type: 'separator' },
        { role: 'hide', label: `Masquer ${app.name}` },
        { role: 'hideOthers', label: 'Masquer les autres' },
        { type: 'separator' },
        { role: 'quit', label: `Quitter ${app.name}` },
      ],
    },
    {
      label: 'Édition',
      submenu: [
        { role: 'undo', label: 'Annuler' }, { role: 'redo', label: 'Rétablir' }, { type: 'separator' },
        { role: 'cut', label: 'Couper' }, { role: 'copy', label: 'Copier' }, { role: 'paste', label: 'Coller' },
        { role: 'selectAll', label: 'Tout sélectionner' },
      ],
    },
    {
      label: 'Présentation',
      submenu: [
        { role: 'reload', label: 'Actualiser' }, { type: 'separator' },
        { role: 'resetZoom', label: 'Taille réelle' }, { role: 'zoomIn', label: 'Agrandir' }, { role: 'zoomOut', label: 'Réduire' },
        { type: 'separator' }, { role: 'togglefullscreen', label: 'Plein écran' },
      ],
    },
    { role: 'windowMenu', label: 'Fenêtre' },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// --- DÉMARRAGE ---

app.whenReady().then(async () => {
  buildMenu()
  try {
    fs.mkdirSync(dataDir(), { recursive: true })
    backupData()
    const url = await startServer()
    createWindow(url)
    if (app.isPackaged) setTimeout(() => checkForUpdates({ silent: true }), 3000)
  } catch (e) {
    dialog.showErrorBox('SpoolTracker n\'a pas pu démarrer', `${e.message}\n\nJournal : ${path.join(dataDir(), 'serveur.log')}`)
    app.quit()
  }
})

app.on('window-all-closed', () => app.quit())
app.on('will-quit', () => { server?.kill() })
