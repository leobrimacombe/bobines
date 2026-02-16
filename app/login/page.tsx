'use client'

import { useState } from 'react'
import { login, signup } from './actions'

export default function LoginPage() {
  const [isLoginMode, setIsLoginMode] = useState(true)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        
        {/* Onglets */}
        <div className="flex border-b">
          <button 
            onClick={() => setIsLoginMode(true)}
            className={`flex-1 py-4 text-center font-bold transition ${isLoginMode ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
          >
            Se connecter
          </button>
          <button 
            onClick={() => setIsLoginMode(false)}
            className={`flex-1 py-4 text-center font-bold transition ${!isLoginMode ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
          >
            Créer un compte
          </button>
        </div>

        {/* Formulaire */}
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            {isLoginMode ? 'Connexion 🔐' : 'Nouveau Compte 🚀'}
          </h2>

          <form className="space-y-4">
            
            {/* --- CHAMP EMAIL ---
                Visible SEULEMENT si on crée un compte */}
            {!isLoginMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse Email</label>
                <input 
                  name="email" 
                  type="email" 
                  placeholder="papa@gmail.com" 
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}

            {/* --- CHAMP PSEUDO ---
                Visible TOUT LE TEMPS (sert à se connecter OU à s'inscrire) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur</label>
              <input 
                name="username" 
                type="text" 
                placeholder="ex: Papa" 
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* --- CHAMP MOT DE PASSE --- */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <input 
                name="password" 
                type="password" 
                placeholder="******" 
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                minLength={6}
              />
            </div>

            <div className="pt-4">
              <button 
                formAction={isLoginMode ? login : signup} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition transform active:scale-95 shadow-lg shadow-blue-500/30"
              >
                {isLoginMode ? 'Entrer' : 'S\'inscrire'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}