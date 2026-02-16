'use client'

import { useState } from 'react'
import { login, signup } from './actions'
import { User, Lock, Mail, Disc3, ArrowRight, ChevronRight } from 'lucide-react'

export default function LoginPage() {
  const [isLoginMode, setIsLoginMode] = useState(true)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] dark:bg-black p-6 font-sans transition-colors duration-500">
      
      {/* Conteneur principal style Apple Card */}
      <div className="bg-white dark:bg-[#1C1C1E] w-full max-w-[440px] rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-none border border-gray-100 dark:border-gray-800 overflow-hidden relative z-10 animate-fade">
        
        {/* --- HEADER --- */}
        <div className="pt-12 pb-8 text-center px-10">
          <div className="inline-flex items-center justify-center bg-black dark:bg-white p-4 rounded-[1.25rem] mb-6 shadow-lg shadow-black/10 dark:shadow-white/5">
            <Disc3 size={32} className="text-white dark:text-black animate-[spin_8s_linear_infinite]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
            Stock Filaments
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            {isLoginMode ? 'Connectez-vous à votre inventaire' : 'Créez votre compte de gestion'}
          </p>
        </div>

        {/* --- SÉLECTEUR (TABS) ANIMÉ --- */}
        <div className="mx-10 mb-8 p-1.5 bg-gray-100 dark:bg-[#2C2C2E] rounded-2xl border border-gray-200/50 dark:border-gray-700/50 relative">
          {/* Indicateur de fond glissant */}
          <div
            className={`absolute top-1.5 left-1.5 w-[calc(50%-0.375rem)] h-[calc(100%-0.75rem)] bg-white dark:bg-[#3A3A3C] rounded-[10px] shadow-sm transition-transform duration-300 ease-in-out ${
              isLoginMode ? 'translate-x-0' : 'translate-x-full'
            }`}
          />
          <div className="relative z-10 flex">
            <button 
              onClick={() => setIsLoginMode(true)}
              className={`flex-1 py-2 text-xs font-bold rounded-[10px] transition-colors duration-300 cursor-pointer ${isLoginMode ? 'text-black dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Connexion
            </button>
            <button 
              onClick={() => setIsLoginMode(false)}
              className={`flex-1 py-2 text-xs font-bold rounded-[10px] transition-colors duration-300 cursor-pointer ${!isLoginMode ? 'text-black dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Inscription
            </button>
          </div>
        </div>

        {/* --- FORMULAIRE AVEC TRANSITION --- */}
        <div className="p-10 pt-0 overflow-hidden">
          <div className="relative w-full transition-all duration-500 ease-in-out" style={{ height: isLoginMode ? '280px' : '360px' }}>
            {/* Formulaire Connexion */}
            <div className={`absolute top-0 left-0 w-full transition-all duration-500 ease-in-out ${isLoginMode ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full pointer-events-none'}`}>
              <form className="space-y-5">
                <div className="group">
                  <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-widest ml-1">Utilisateur</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                      name="username" 
                      type="text" 
                      placeholder="Nom ou Pseudo" 
                      className="w-full bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 p-4 pl-12 rounded-2xl outline-none focus:bg-white dark:focus:bg-[#3A3A3C] focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-gray-900 dark:text-white placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>
                <div className="group">
                  <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-widest ml-1">Sécurité</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                      name="password" 
                      type="password" 
                      placeholder="••••••••" 
                      className="w-full bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 p-4 pl-12 rounded-2xl outline-none focus:bg-white dark:focus:bg-[#3A3A3C] focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-gray-900 dark:text-white placeholder:text-gray-400"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <div className="pt-4">
                  <button 
                    formAction={login} 
                    className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-4 rounded-2xl transition-all transform active:scale-[0.98] shadow-xl hover:opacity-90 flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    Accéder au stock
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </form>
            </div>

            {/* Formulaire Inscription */}
            <div className={`absolute top-0 left-0 w-full transition-all duration-500 ease-in-out ${!isLoginMode ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'}`}>
              <form className="space-y-5">
                <div className="group">
                  <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-widest ml-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                      name="email" 
                      type="email" 
                      placeholder="exemple@cloud.com" 
                      className="w-full bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 p-4 pl-12 rounded-2xl outline-none focus:bg-white dark:focus:bg-[#3A3A3C] focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-gray-900 dark:text-white placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>
                <div className="group">
                  <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-widest ml-1">Utilisateur</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                      name="username" 
                      type="text" 
                      placeholder="Nom ou Pseudo" 
                      className="w-full bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 p-4 pl-12 rounded-2xl outline-none focus:bg-white dark:focus:bg-[#3A3A3C] focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-gray-900 dark:text-white placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>
                <div className="group">
                  <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-widest ml-1">Sécurité</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                      name="password" 
                      type="password" 
                      placeholder="••••••••" 
                      className="w-full bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 p-4 pl-12 rounded-2xl outline-none focus:bg-white dark:focus:bg-[#3A3A3C] focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-gray-900 dark:text-white placeholder:text-gray-400"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <div className="pt-4">
                  <button 
                    formAction={signup} 
                    className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-4 rounded-2xl transition-all transform active:scale-[0.98] shadow-xl hover:opacity-90 flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    Créer mon compte
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Style additionnel pour l'animation d'entrée */}
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  )
}