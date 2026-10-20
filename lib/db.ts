import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

// Toutes les données de l'appli tiennent dans un seul fichier JSON sur le Mac.
// En mode appli, Electron fournit BOBINES_DATA_DIR (~/Library/Application Support/SpoolTracker).
// En dev, on stocke dans ./.data

export type Spool = {
  id: string
  spool_number: number
  brand: string
  material: string
  color_name: string
  color_hex: string
  weight_initial: number
  weight_used: number
  price: number
  date_opened: string | null
  archived: boolean
  is_hidden: boolean
  finished_at: string | null
  created_at: string
  [key: string]: any
}

export type ConsumptionLog = {
  id: string
  spool_id: string | null
  spool_name: string
  amount: number
  created_at: string
  [key: string]: any
}

export type Settings = {
  low_stock_threshold: number
  custom_brands: string[]
  custom_materials: string[]
  custom_colors: { name: string, hex: string }[]
  brand_presets: Record<string, { materials: string[], colors: { name: string, hex: string }[] }>
}

export type GroupSetting = {
  brand: string
  material: string
  color_name: string
  min_spools: number
}

export type Data = {
  version: number
  spools: Spool[]
  consumption_logs: ConsumptionLog[]
  settings: Settings | null
  group_settings: GroupSetting[]
}

const EMPTY: Data = { version: 1, spools: [], consumption_logs: [], settings: null, group_settings: [] }

function dataDir() {
  return process.env.BOBINES_DATA_DIR || path.join(process.cwd(), '.data')
}

function dataFile() {
  return path.join(dataDir(), 'data.json')
}

// On relit le fichier à chaque opération : il est petit, et ça évite toute désynchro entre les modules Next
export function readData(): Data {
  try {
    const raw = fs.readFileSync(dataFile(), 'utf8')
    return normalize(JSON.parse(raw))
  } catch (e: any) {
    if (e.code === 'ENOENT') return structuredClone(EMPTY)
    throw e
  }
}

// Écriture atomique : fichier temporaire puis renommage, pour ne jamais laisser un data.json à moitié écrit
export function writeData(data: Data) {
  fs.mkdirSync(dataDir(), { recursive: true })
  const tmp = dataFile() + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2))
  fs.renameSync(tmp, dataFile())
}

export function update<T>(fn: (data: Data) => T): T {
  const data = readData()
  const result = fn(data)
  writeData(data)
  return result
}

export function newId() {
  return randomUUID()
}

// Accepte aussi bien un export de l'appli qu'un export Supabase (scripts/export-supabase.mjs)
export function normalize(input: any): Data {
  if (!input || typeof input !== 'object' || !Array.isArray(input.spools)) {
    throw new Error('Fichier invalide : aucune liste de bobines trouvée.')
  }

  const spools: Spool[] = input.spools.map((s: any) => ({
    ...s,
    id: String(s.id ?? newId()),
    spool_number: Number(s.spool_number) || 0,
    weight_initial: Number(s.weight_initial) || 1000,
    weight_used: Number(s.weight_used) || 0,
    price: Number(s.price) || 0,
    archived: !!s.archived,
    is_hidden: !!s.is_hidden,
    finished_at: s.finished_at ?? null,
    date_opened: s.date_opened ?? null,
    created_at: s.created_at ?? new Date().toISOString(),
  }))

  const consumption_logs: ConsumptionLog[] = (input.consumption_logs || []).map((l: any) => ({
    ...l,
    id: String(l.id ?? newId()),
    spool_id: l.spool_id != null ? String(l.spool_id) : null,
    amount: Number(l.amount) || 0,
    created_at: l.created_at ?? new Date().toISOString(),
  }))

  const s = input.settings || input.user_settings || null
  const settings: Settings | null = s ? {
    low_stock_threshold: Number(s.low_stock_threshold) || 200,
    custom_brands: s.custom_brands || [],
    custom_materials: s.custom_materials || [],
    custom_colors: s.custom_colors || [],
    brand_presets: s.brand_presets || {},
  } : null

  const group_settings: GroupSetting[] = (input.group_settings || []).map((g: any) => ({
    brand: g.brand,
    material: g.material,
    color_name: g.color_name,
    min_spools: Number(g.min_spools) || 0,
  }))

  return { version: 1, spools, consumption_logs, settings, group_settings }
}
