'use client'

import { useState } from 'react'
import { MessageSquare, X, Send, Loader2, CheckCircle, Star } from 'lucide-react'
import { submitFeedback } from '../app/feedback/action'

const STARS = [1, 2, 3, 4, 5]

export default function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [hover, setHover] = useState<number | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')

  async function handleSubmit() {
    if (!message.trim()) return
    setStatus('loading')
    await submitFeedback(message, rating)
    setStatus('done')
    setTimeout(() => {
      setOpen(false)
      setMessage('')
      setRating(null)
      setStatus('idle')
    }, 2000)
  }

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-black text-sm font-semibold px-4 py-2.5 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer"
      >
        <MessageSquare size={16} />
        Feedback
      </button>

      {/* Overlay + modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-4 sm:p-6">
          {/* Fond cliquable */}
          <div className="absolute inset-0 bg-black/20 dark:bg-black/50" onClick={() => setOpen(false)} />

          <div className="relative w-full sm:w-[360px] bg-white dark:bg-[#1c1c1e] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-5 animate-in slide-in-from-bottom-4 duration-200">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-sm text-gray-900 dark:text-white">Votre avis compte</p>
                <p className="text-xs text-gray-400 mt-0.5">Bug, idée, remarque ? Tout est bon à prendre !</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {status === 'done' ? (
              <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
                <CheckCircle size={32} className="text-green-500" />
                <p className="font-semibold text-sm text-gray-900 dark:text-white">Merci pour le retour !</p>
              </div>
            ) : (
              <>
                {/* Étoiles */}
                <div className="flex gap-1 mb-3">
                  {STARS.map(s => (
                    <button
                      key={s}
                      onClick={() => setRating(s)}
                      onMouseEnter={() => setHover(s)}
                      onMouseLeave={() => setHover(null)}
                      className="cursor-pointer p-0.5"
                    >
                      <Star
                        size={22}
                        className={s <= (hover ?? rating ?? 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
                      />
                    </button>
                  ))}
                </div>

                {/* Textarea */}
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Décrivez votre retour..."
                  rows={4}
                  className="w-full text-sm bg-gray-50 dark:bg-[#2c2c2e] border border-gray-200 dark:border-gray-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/30 resize-none text-gray-900 dark:text-white placeholder:text-gray-400 transition-all"
                />

                {/* Bouton envoyer */}
                <button
                  onClick={handleSubmit}
                  disabled={!message.trim() || status === 'loading'}
                  className="mt-3 w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  {status === 'loading' ? (
                    <><Loader2 size={15} className="animate-spin" /> Envoi...</>
                  ) : (
                    <><Send size={15} /> Envoyer</>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
