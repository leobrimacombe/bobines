'use server'

import { createClient } from '../../utils/supabase/server'
import { Resend } from 'resend'
import { verifyTurnstile } from '../../utils/turnstile'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function submitFeedback(message: string, rating: number | null, turnstileToken: string) {
  const valid = await verifyTurnstile(turnstileToken)
  if (!valid) throw new Error('Vérification anti-robot échouée')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Sauvegarde dans Supabase
  await supabase.from('feedbacks').insert({
    message,
    rating,
    user_id: user?.id ?? null,
    user_email: user?.email ?? null,
  })

  // Envoi par email
  await resend.emails.send({
    from: 'SpoolTracker <onboarding@resend.dev>',
    to: process.env.FEEDBACK_EMAIL!,
    subject: `💬 Nouveau feedback SpoolTracker${rating ? ` — ${rating}/5 ⭐` : ''}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="margin-bottom:4px">Nouveau feedback</h2>
        ${rating ? `<p style="color:#6b7280;margin-top:0">Note : ${'⭐'.repeat(rating)} (${rating}/5)</p>` : ''}
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:16px 0;white-space:pre-wrap">${message}</div>
        ${user?.email ? `<p style="color:#9ca3af;font-size:13px">De : ${user.email}</p>` : '<p style="color:#9ca3af;font-size:13px">Utilisateur non connecté</p>'}
      </div>
    `,
  })
}
