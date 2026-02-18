'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, AlertTriangle } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  isDanger?: boolean // Si vrai, le bouton sera rouge (pour supprimer)
}

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, isDanger = false }: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Bloque le scroll quand la modale est ouverte
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  if (!mounted || !isOpen) return null

  // On utilise createPortal pour "téléporter" la modale à la racine du site (body)
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade">
      <div className="bg-white dark:bg-[#1C1C1E] w-full max-w-sm p-6 rounded-3xl shadow-2xl border dark:border-gray-800 scale-100 animate-modal">
        
        <div className="flex flex-col items-center text-center">
          <div className={`p-4 rounded-full mb-4 ${isDanger ? 'bg-red-50 text-red-500 dark:bg-red-900/20' : 'bg-blue-50 text-blue-500 dark:bg-blue-900/20'}`}>
            <AlertTriangle size={32} />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {title}
          </h3>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
            {message}
          </p>

          <div className="flex gap-3 w-full">
            <button 
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Annuler
            </button>
            <button 
              onClick={onConfirm}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition-transform active:scale-95 ${
                isDanger 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-black dark:bg-white dark:text-black hover:opacity-90'
              }`}
            >
              Confirmer
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  )
}