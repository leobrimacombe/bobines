'use client'

import { useState } from 'react'
import { login, signup } from './actions'
import { User, Lock, Mail, Disc3, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [isLoginMode, setIsLoginMode] = useState(true)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A1A2E] p-4 font-sans text-[#EAEAEA]">
      {/* Halo lumineux discret */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#2D7DD2]/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="bg-[#16213E] border border-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10">
        
        {/* --- HEADER --- */}
        <div className="pt-12 pb-8 text-center px-8">
          <div className="inline-flex items-center justify-center bg-gradient-to-br from-[#2D7DD2] to-blue-600 p-4 rounded-2xl mb-6 shadow-xl shadow-blue-500/20">
            <Disc3 size={38} className="text-white animate-spin-slow" />
          </div>
          {/* Nouveau titre principal (l'ancien sous-titre) */}
          <h1 className="text-xl font-black tracking-tight uppercase leading-tight text-white">
            Gestion de stock de filaments
          </h1>
        </div>

        {/* --- ONGLETS --- */}
        <div className="flex p-1 bg-[#1A1A2E] mx-10 rounded-xl border border-gray-800">
          <button 
            onClick={() => setIsLoginMode(true)}
            className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all duration-300 ${isLoginMode ? 'bg-[#2D7DD2] text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Connexion
          </button>
          <button 
            onClick={() => setIsLoginMode(false)}
            className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all duration-300 ${!isLoginMode ? 'bg-[#2D7DD2] text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Inscription
          </button>
        </div>

        {/* --- FORMULAIRE --- */}
        <div className="p-10">
          <form className="space-y-6">
            
            {/* Email (Inscription uniquement) */}
            {!isLoginMode && (
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                  <input 
                    name="email" 
                    type="email" 
                    placeholder="Email" 
                    className="w-full bg-[#1A1A2E] border border-gray-800 p-4 pl-12 rounded-2xl outline-none focus:border-[#2D7DD2] transition font-bold placeholder:text-gray-700"
                    required
                  />
                </div>
              </div>
            )}

            {/* Pseudo */}
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                <input 
                  name="username" 
                  type="text" 
                  placeholder="Nom d'utilisateur" 
                  className="w-full bg-[#1A1A2E] border border-gray-800 p-4 pl-12 rounded-2xl outline-none focus:border-[#2D7DD2] transition font-bold placeholder:text-gray-700"
                  required
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                <input 
                  name="password" 
                  type="password" 
                  placeholder="Mot de passe" 
                  className="w-full bg-[#1A1A2E] border border-gray-800 p-4 pl-12 rounded-2xl outline-none focus:border-[#2D7DD2] transition font-bold placeholder:text-gray-700"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Bouton */}
            <div className="pt-2">
              <button 
                formAction={isLoginMode ? login : signup} 
                className="w-full bg-gradient-to-r from-[#2D7DD2] to-blue-600 hover:from-blue-600 hover:to-[#2D7DD2] text-white font-black py-4 rounded-2xl transition-all transform active:scale-[0.98] shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 group"
              >
                {isLoginMode ? 'ACCÉDER AU STOCK' : 'CRÉER LE COMPTE'}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}