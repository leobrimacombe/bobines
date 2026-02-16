'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()
  
  const username = formData.get('username') as string
  const password = formData.get('password') as string
  
  // 1. On cherche l'email correspondant au pseudo dans notre table 'profiles'
  const { data: profile, error: searchError } = await supabase
    .from('profiles')
    .select('email')
    .ilike('username', username) // 'ilike' permet d'ignorer les majuscules/minuscules
    .single()

  if (searchError || !profile) {
    redirect('/error?message=Utilisateur introuvable')
  }

  // 2. Maintenant qu'on a l'email, on connecte normalement
  const { error } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password,
  })

  if (error) {
    redirect(`/error?message=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string
  
  // 1. On vérifie si le pseudo n'est pas déjà pris
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('username')
    .ilike('username', username)
    .single()

  if (existingUser) {
    redirect('/error?message=Ce pseudo est déjà pris !')
  }

  // 2. On crée le compte Auth (Utilisateur système)
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) {
    redirect(`/error?message=${encodeURIComponent(authError.message)}`)
  }

  if (authData.user) {
    // 3. On enregistre le lien Pseudo <-> Email dans notre table 'profiles'
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        username: username,
        email: email
      })

    if (profileError) {
      // Si ça plante ici, c'est embêtant, mais on redirige quand même
      console.error(profileError)
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}