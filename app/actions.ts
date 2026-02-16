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

  const brand = formData.get('brand') as string
  const material = formData.get('material') as string
  const color = formData.get('color') as string
  const color_hex = formData.get('color_hex') as string
  const weight = parseInt(formData.get('initial_weight') as string) || 1000
  const price = parseFloat(formData.get('price') as string) || 0
  const quantity = parseInt(formData.get('quantity') as string) || 1

  const newSpools = Array.from({ length: quantity }).map(() => ({
    brand,
    material,
    color_name: color,
    color_hex,
    weight_initial: weight,
    weight_used: 0,
    price: price,
    user_id: user.id
  }))

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
  const id = formData.get('id') as string
  const amount = parseInt(formData.get('amount') as string)

  const { data: spool } = await supabase.from('spools').select('weight_used').eq('id', id).single()
  if (spool) {
    await supabase.from('spools').update({ weight_used: spool.weight_used + amount }).eq('id', id)
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

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) { console.error(error); return }
  revalidatePath('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string
  const { error } = await supabase.auth.signUp({ email, password, options: { data: { username } } })
  if (error) { console.error(error); return }
  revalidatePath('/')
}