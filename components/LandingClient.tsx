'use client'

import Link from 'next/link'
import { ArrowRight, Moon, Sun } from 'lucide-react'
import { useState } from 'react'

export default function LandingClient({ user }: { user: any }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (saved === 'dark') document.documentElement.classList.add('dark')
    return saved ?? 'light'
  })

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    if (newTheme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">

      {/* NAVBAR */}
      <nav className="fixed w-full top-0 z-50 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-900">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-blue-500 font-black text-xl">●</span>
            <span className="font-bold text-base tracking-tight">SpoolTracker</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors rounded-lg">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            {user ? (
              <Link href="/dashboard" className="text-sm font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                Mon dashboard
              </Link>
            ) : (
              <Link href="/login" className="text-sm font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                Connexion
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <main className="pt-28 pb-24 px-6 max-w-5xl mx-auto">

        {/* Badge */}
        <div className="mb-8">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900">
            Gratuit · Sans pub · Open data
          </span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6 max-w-3xl">
          Fini les bobines entamées<br />
          <span className="text-blue-500">qu&apos;on retrouve jamais.</span>
        </h1>

        <p className="text-gray-500 dark:text-gray-400 text-lg max-w-xl mb-10 leading-relaxed">
          SpoolTracker, c&apos;est un carnet de bord pour vos filaments. Vous notez ce que vous utilisez, l&apos;appli fait le reste — stock restant, alertes, coût par impression.
        </p>

        {user ? (
          <Link href="/dashboard" className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm">
            Accéder à mon stock <ArrowRight size={16} />
          </Link>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/login?tab=signup" className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm">
              Créer un compte gratuit <ArrowRight size={16} />
            </Link>
            <Link href="/login" className="text-sm font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
              J&apos;ai déjà un compte →
            </Link>
          </div>
        )}
      </main>

      {/* SÉPARATEUR */}
      <div className="border-t border-gray-100 dark:border-gray-900" />

      {/* FEATURES — style liste, pas cartes */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-10">Ce que ça fait concrètement</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          <div>
            <div className="text-2xl mb-3">📦</div>
            <h3 className="font-bold text-base mb-2">Inventaire en temps réel</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              Entrez le poids de départ, soustrayez vos impressions. Le pourcentage restant se met à jour automatiquement.
            </p>
          </div>

          <div>
            <div className="text-2xl mb-3">🔔</div>
            <h3 className="font-bold text-base mb-2">Alertes sur seuil</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              Définissez un seuil par bobine (ex. 150g). Vous êtes prévenu avant d&apos;être à sec en pleine impression.
            </p>
          </div>

          <div>
            <div className="text-2xl mb-3">💸</div>
            <h3 className="font-bold text-base mb-2">Coût par impression</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              Renseignez le prix d&apos;achat de vos bobines. SpoolTracker calcule combien vous a coûté chaque pièce imprimée.
            </p>
          </div>

        </div>
      </section>

      {/* SÉPARATEUR */}
      <div className="border-t border-gray-100 dark:border-gray-900" />

      {/* CTA BAS DE PAGE */}
      <section className="py-20 px-6 max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div>
          <h2 className="text-2xl font-black mb-2">Prêt à tout savoir sur votre stock ?</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Gratuit, sans carte bancaire, sans engagement.</p>
        </div>
        {!user && (
          <Link href="/login?tab=signup" className="shrink-0 inline-flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-black font-bold px-6 py-3 rounded-xl transition-colors hover:opacity-80 text-sm">
            Commencer maintenant <ArrowRight size={16} />
          </Link>
        )}
      </section>

      {/* FOOTER */}
      <div className="border-t border-gray-100 dark:border-gray-900" />
      <footer className="py-8 px-6 text-center text-gray-400 text-xs">
        SpoolTracker · fait pour la communauté impression 3D · {new Date().getFullYear()}
      </footer>

    </div>
  )
}
