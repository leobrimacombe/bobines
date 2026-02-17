'use server'

import { createClient } from '../utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addSpool(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const brand = formData.get('brand')
  const material = formData.get('material')
  const color = formData.get('color')
  const color_hex = formData.get('color_hex')
  const weight_initial = parseInt(formData.get('initial_weight') as string)
  const price = parseFloat(formData.get('price') as string)
  const date_opened = formData.get('date_opened')
  const quantity = parseInt(formData.get('quantity') as string) || 1

  // Récupérer le dernier numéro de bobine pour incrémenter
  const { data: lastSpool } = await supabase
    .from('spools')
    .select('spool_number')
    .order('spool_number', { ascending: false })
    .limit(1)
    .single()

  let nextNumber = (lastSpool?.spool_number || 0) + 1

  // Créer un tableau pour l'insertion en masse
  const spoolsToInsert = []
  for (let i = 0; i < quantity; i++) {
    spoolsToInsert.push({
      user_id: user.id,
      brand,
      material,
      color_name: color,
      color_hex,
      weight_initial,
      weight_used: 0,
      price,
      date_opened,
      spool_number: nextNumber + i
    })
  }

  await supabase.from('spools').insert(spoolsToInsert)
  revalidatePath('/')
}

export async function deleteSpool(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id')
  
  await supabase.from('spools').delete().eq('id', id)
  revalidatePath('/')
}

export async function consumeSpool(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const id = formData.get('id')
  const amount = parseInt(formData.get('amount') as string)

  // 1. Lire la bobine actuelle
  const { data: spool } = await supabase.from('spools').select('*').eq('id', id).single()
  
  if (spool) {
    // 2. Mettre à jour le poids utilisé
    const newUsed = (spool.weight_used || 0) + amount
    await supabase.from('spools').update({ weight_used: newUsed }).eq('id', id)

    // 3. Ajouter une entrée dans l'historique
    await supabase.from('consumption_logs').insert({
      user_id: user.id,
      spool_id: id,
      spool_name: `${spool.brand} ${spool.material} ${spool.color_name} (#${spool.spool_number})`,
      amount: amount
    })
  }
  
  revalidatePath('/')
}

export async function updateSpool(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id')

  const updates = {
    brand: formData.get('brand'),
    material: formData.get('material'),
    color_name: formData.get('color'),
    color_hex: formData.get('color_hex'),
    weight_initial: parseInt(formData.get('initial_weight') as string),
    price: parseFloat(formData.get('price') as string),
    date_opened: formData.get('date_opened')
  }

  await supabase.from('spools').update(updates).eq('id', id)
  revalidatePath('/')
}

export async function updateThreshold(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const threshold = parseInt(formData.get('threshold') as string)
  const similarThreshold = parseInt(formData.get('similar_threshold') as string)

  // Upsert : met à jour si existe, sinon crée
  await supabase.from('user_settings').upsert({ 
    user_id: user.id, 
    low_stock_threshold: threshold,
    similar_stock_threshold: similarThreshold
  })
  
  revalidatePath('/')
}

// --- LA NOUVELLE FONCTION QUI MANQUAIT ---
export async function revertConsumption(formData: FormData) {
  const supabase = await createClient() // Utilise le client serveur correct
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const logId = formData.get('log_id')

  // 1. On récupère les infos du log avant de le supprimer
  const { data: log } = await supabase
    .from('consumption_logs')
    .select('*')
    .eq('id', logId)
    .single()

  if (!log) return

  // 2. Si la bobine existe encore, on lui "rend" son filament
  if (log.spool_id) {
    const { data: spool } = await supabase
      .from('spools')
      .select('weight_used')
      .eq('id', log.spool_id)
      .single()

    if (spool) {
      const newUsed = Math.max(0, spool.weight_used - log.amount)
      await supabase
        .from('spools')
        .update({ weight_used: newUsed })
        .eq('id', log.spool_id)
    }
  }

  // 3. On supprime le log de l'historique
  await supabase.from('consumption_logs').delete().eq('id', logId)
  
  revalidatePath('/')
}