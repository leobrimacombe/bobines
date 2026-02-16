'use client'

import { useState } from 'react'
import { login, signup } from './actions'
import { User, Lock, Mail, Printer, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [isLoginMode, setIsLoginMode] = useState(true)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A1A2E] p-4 font-sans text-[#EAEAEA]">
      {/* Effet de halo lumineux en arrière-plan */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#2D7DD2]/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="bg-[#16213E] border border-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10">
        
        {/* --- LOGO / TITRE --- */}
        <div className="pt-10 pb-6 text-center">
          <div className="inline-flex items-center justify-center bg-[#2D7DD2] p-3 rounded-2xl mb-4 shadow-lg shadow-blue-500/20">
            <Printer size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter uppercase">Atelier 3D</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">Gestion de stock de filaments</p>
        </div>

        {/* --- ONGLETS --- */}
        <div className="flex p-1 bg-[#1A1A2E] mx-8 rounded-xl border border-gray-800">
          <button 
            onClick={() => setIsLoginMode(true)}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${isLoginMode ? 'bg-[#2D7DD2] text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Connexion
          </button>
          <button 
            onClick={() => setIsLoginMode(false)}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${!isLoginMode ? 'bg-[#2D7DD2] text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Inscription
          </button>
        </div>

        {/* --- FORMULAIRE --- */}
        <div className="p-8">
          <form className="space-y-5">
            
            {/* Champ Email (Seulement inscription) */}
            {!isLoginMode && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1 tracking-widest">Adresse Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                  <input 
                    name="email" 
                    type="email" 
                    placeholder="papa@exemple.com" 
                    className="w-full bg-[#1A1A2E] border border-gray-800 p-4 pl-12 rounded-2xl outline-none focus:border-[#2D7DD2] focus:ring-1 focus:ring-[#2D7DD2] transition font-medium placeholder:text-gray-700"
                    required
                  />
                </div>
              </div>
            )}

            {/* Champ Pseudo */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 tracking-widest">
                {isLoginMode ? "Nom d'utilisateur" : "Choisir un pseudo"}
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                <input 
                  name="username" 
                  type="text" 
                  placeholder="ex: Papa" 
                  className="w-full bg-[#1A1A2E] border border-gray-800 p-4 pl-12 rounded-2xl outline-none focus:border-[#2D7DD2] focus:ring-1 focus:ring-[#2D7DD2] transition font-medium placeholder:text-gray-700"
                  required
                />
              </div>
            </div>

            {/* Champ Mot de passe */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 tracking-widest">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                <input 
                  name="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full bg-[#1A1A2E] border border-gray-800 p-4 pl-12 rounded-2xl outline-none focus:border-[#2D7DD2] focus:ring-1 focus:ring-[#2D7DD2] transition font-medium placeholder:text-gray-700"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Bouton d'action */}
            <div className="pt-4">
              <button 
                formAction={isLoginMode ? login : signup} 
                className="w-full bg-[#2D7DD2] hover:bg-blue-600 text-white font-black py-4 rounded-2xl transition-all transform active:scale-[0.98] shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 group"
              >
                {isLoginMode ? 'Entrer dans l\'Atelier' : 'Créer mon compte'}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

          </form>
          
          <p className="text-center text-gray-600 text-xs mt-8">
            {isLoginMode 
              ? "Prêt à lancer une impression ?" 
              : "L'organisation du stock commence ici."}
          </p>
        </div>
      </div>
    </div>
  )
}