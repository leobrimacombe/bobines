'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {}
        },
      },
    }
  )
}

export async function addSpool(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const quantity = parseInt(formData.get('quantity') as string) || 1
  
  const newSpoolBase = {
    brand: formData.get('brand') as string,
    material: formData.get('material') as string,
    color_name: formData.get('color') as string,
    color_hex: formData.get('color_hex') as string,
    weight_initial: parseInt(formData.get('initial_weight') as string) || 1000,
    weight_used: 0,
    price: parseFloat(formData.get('price') as string) || 0,
    date_opened: formData.get('date_opened') as string || new Date().toISOString().split('T')[0],
    user_id: user.id
  }

  const newSpools = Array.from({ length: quantity }).map(() => ({ ...newSpoolBase }))

  await supabase.from('spools').insert(newSpools)
  revalidatePath('/')
}

export async function updateSpool(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  
  const updates = {
    brand: formData.get('brand') as string,
    material: formData.get('material') as string,
    color_name: formData.get('color') as string,
    color_hex: formData.get('color_hex') as string,
    weight_initial: parseInt(formData.get('initial_weight') as string),
    price: parseFloat(formData.get('price') as string) || 0,
    date_opened: formData.get('date_opened') as string,
  }

  await supabase.from('spools').update(updates).eq('id', id)
  revalidatePath('/')
}

export async function deleteSpool(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  await supabase.from('spools').delete().eq('id', id)
  revalidatePath('/')
}

export async function consumeSpool(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const id = formData.get('id') as string
  const amount = parseInt(formData.get('amount') as string)
  const projectName = formData.get('project_name') as string || "Impression sans nom"

  // 1. Récupérer la bobine
  const { data: spool } = await supabase.from('spools').select('*').eq('id', id).single()
  
  if (spool) {
    // 2. Mettre à jour le poids
    await supabase.from('spools').update({ weight_used: spool.weight_used + amount }).eq('id', id)

    // 3. Ajouter l'entrée dans l'historique
    await supabase.from('consumption_logs').insert({
      user_id: user.id,
      spool_id: id,
      spool_name: `${spool.brand} ${spool.material} ${spool.color_name} (#${spool.spool_number})`,
      amount: amount,
      project_name: projectName
    })
  }
  revalidatePath('/')
}

export async function updateThreshold(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const lowStock = parseInt(formData.get('threshold') as string)
  const similarStock = parseInt(formData.get('similar_threshold') as string)
  
  await supabase.from('user_settings').upsert({ 
    user_id: user.id, 
    low_stock_threshold: lowStock,
    similar_stock_threshold: similarStock
  })

  revalidatePath('/')
}