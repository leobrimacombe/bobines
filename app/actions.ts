'use server'

import { createClient } from '@/utils/supabase/server' // <--- Import du nouveau connecteur
import { revalidatePath } from 'next/cache'

export async function addSpool(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const brand = formData.get('brand') as string
  const material = formData.get('material') as string
  const color = formData.get('color') as string
  const color_hex = formData.get('color_hex') as string
  const weight = parseInt(formData.get('initial_weight') as string) || 1000
  // On récupère la quantité (par défaut 1)
  const quantity = parseInt(formData.get('quantity') as string) || 1

  // On prépare un tableau d'objets à insérer
  const newSpools = Array.from({ length: quantity }).map(() => ({
    brand,
    material,
    color_name: color,
    color_hex,
    weight_initial: weight,
    weight_used: 0,
    user_id: user.id
  }))

  await supabase.from('spools').insert(newSpools)
  revalidatePath('/')
}

export async function deleteSpool(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  
  // RLS nous protège : on ne peut supprimer que nos propres bobines
  await supabase.from('spools').delete().eq('id', id)
  
  revalidatePath('/')
}

export async function consumeSpool(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  // On récupère la valeur tapée par l'utilisateur
  const amount = parseInt(formData.get('amount') as string)
  
  if (isNaN(amount) || amount <= 0) return

  const { data: bobine } = await supabase
    .from('spools')
    .select('weight_used')
    .eq('id', id)
    .single()
    
  if (bobine) {
    const newUsed = (bobine.weight_used || 0) + amount
    await supabase.from('spools').update({ weight_used: newUsed }).eq('id', id)
    revalidatePath('/')
  }
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
  }

  await supabase.from('spools').update(updates).eq('id', id)
  revalidatePath('/')
}