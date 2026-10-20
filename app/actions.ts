'use server'

import { readData, update, newId, normalize, writeData } from '../lib/db'
import { revalidatePath } from 'next/cache'

export async function getDashboardData() {
  const data = readData()

  const spools = [...data.spools].sort((a, b) => a.spool_number - b.spool_number)

  // Équivalent du `select('*, spools (price, weight_initial)')` de Supabase
  const logs = [...data.consumption_logs]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 500)
    .map(log => {
      const spool = data.spools.find(s => s.id === log.spool_id)
      return { ...log, spools: spool ? { price: spool.price, weight_initial: spool.weight_initial } : null }
    })

  return { spools, logs, settings: data.settings, groupSettings: data.group_settings }
}

export async function addSpool(formData: FormData) {
  const brand = formData.get('brand') as string
  const material = formData.get('material') as string
  const color = formData.get('color') as string
  const color_hex = formData.get('color_hex') as string
  const weight_initial = parseInt(formData.get('initial_weight') as string)
  const price = parseFloat(formData.get('price') as string)
  const date_opened = formData.get('date_opened') as string
  const quantity = parseInt(formData.get('quantity') as string) || 1

  update(data => {
    const lastNumber = Math.max(0, ...data.spools.map(s => s.spool_number || 0))

    for (let i = 0; i < quantity; i++) {
      data.spools.push({
        id: newId(),
        brand,
        material,
        color_name: color,
        color_hex,
        weight_initial,
        weight_used: 0,
        price: isNaN(price) ? 0 : price,
        date_opened: date_opened || null,
        spool_number: lastNumber + 1 + i,
        archived: false,
        is_hidden: false,
        finished_at: null,
        created_at: new Date().toISOString(),
      })
    }
  })
  revalidatePath('/')
}

function setSpoolFields(id: FormDataEntryValue | null, fields: Record<string, any>) {
  update(data => {
    const spool = data.spools.find(s => s.id === String(id))
    if (spool) Object.assign(spool, fields)
  })
}

export async function deleteSpool(formData: FormData) {
  setSpoolFields(formData.get('id'), { archived: true, finished_at: new Date().toISOString() })
  revalidatePath('/')
}

export async function restoreSpool(formData: FormData) {
  setSpoolFields(formData.get('id'), { archived: false, finished_at: null })
  revalidatePath('/')
}

export async function hideSpool(formData: FormData) {
  setSpoolFields(formData.get('id'), { is_hidden: true })
  revalidatePath('/')
}

export async function hardDeleteSpool(formData: FormData) {
  const id = String(formData.get('id'))

  update(data => {
    data.consumption_logs = data.consumption_logs.filter(l => l.spool_id !== id)
    data.spools = data.spools.filter(s => s.id !== id)
  })
  revalidatePath('/')
}

export async function consumeSpool(formData: FormData) {
  const id = String(formData.get('id'))
  const amount = parseInt(formData.get('amount') as string)
  if (isNaN(amount)) return

  update(data => {
    const spool = data.spools.find(s => s.id === id)
    if (!spool) return

    spool.weight_used = (spool.weight_used || 0) + amount
    data.consumption_logs.push({
      id: newId(),
      spool_id: id,
      spool_name: `${spool.brand} ${spool.material} ${spool.color_name} (#${spool.spool_number})`,
      amount,
      created_at: new Date().toISOString(),
    })
  })
  revalidatePath('/')
}

export async function updateSpool(formData: FormData) {
  const price = parseFloat(formData.get('price') as string)

  setSpoolFields(formData.get('id'), {
    brand: formData.get('brand'),
    material: formData.get('material'),
    color_name: formData.get('color'),
    color_hex: formData.get('color_hex'),
    weight_initial: parseInt(formData.get('initial_weight') as string),
    price: isNaN(price) ? 0 : price,
    date_opened: formData.get('date_opened') || null
  })
  revalidatePath('/')
}

export async function updateSettings(formData: FormData) {
  const threshold = parseInt(formData.get('threshold') as string)

  const custom_brands = JSON.parse(formData.get('custom_brands') as string || '[]')
  const custom_materials = JSON.parse(formData.get('custom_materials') as string || '[]')
  const custom_colors = JSON.parse(formData.get('custom_colors') as string || '[]')

  // Préréglages par marque
  const brand_presets = JSON.parse(formData.get('brand_presets') as string || '{}')

  update(data => {
    data.settings = {
      low_stock_threshold: threshold || 200,
      custom_brands,
      custom_materials,
      custom_colors,
      brand_presets
    }
  })
  revalidatePath('/')
}

export async function revertConsumption(formData: FormData) {
  const logId = String(formData.get('log_id'))

  update(data => {
    const log = data.consumption_logs.find(l => l.id === logId)
    if (!log) return

    const spool = log.spool_id ? data.spools.find(s => s.id === log.spool_id) : null
    if (spool) spool.weight_used = Math.max(0, spool.weight_used - log.amount)

    data.consumption_logs = data.consumption_logs.filter(l => l.id !== logId)
  })
  revalidatePath('/')
}

export async function updateGroupThreshold(formData: FormData) {
  const brand = formData.get('brand') as string
  const material = formData.get('material') as string
  const color_name = formData.get('color_name') as string
  const min_spools = parseInt(formData.get('min_spools') as string)

  update(data => {
    const existing = data.group_settings.find(g => g.brand === brand && g.material === material && g.color_name === color_name)
    if (existing) existing.min_spools = min_spools
    else data.group_settings.push({ brand, material, color_name, min_spools })
  })
  revalidatePath('/')
}

// --- SAUVEGARDE / RESTAURATION ---

export async function exportData() {
  return JSON.stringify({ ...readData(), exported_at: new Date().toISOString() }, null, 2)
}

// Remplace toutes les données par celles du fichier (export de l'appli ou export Supabase)
export async function importData(json: string) {
  let data
  try {
    data = normalize(JSON.parse(json))
  } catch (e: any) {
    return { ok: false, error: e.message || 'Fichier illisible.' }
  }

  writeData(data)
  revalidatePath('/')
  return { ok: true, count: data.spools.length }
}
