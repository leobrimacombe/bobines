'use client'

import Link from 'next/link'
import { ArrowRight, Moon, Sun, Disc3, Scale, BellRing, Coins } from 'lucide-react'
import { useState, useEffect } from 'react'

const FEATURES = [
  {
    icon: Scale,
    title: 'Tu sais ce qu’il te reste',
    desc: 'Tu pèses la bobine au début, tu retires les grammes à chaque impression. Le reste se calcule tout seul, plus besoin de soupeser dans le noir.',
  },
  {
    icon: BellRing,
    title: 'Plus de panne sèche à 2h du mat’',
    desc: 'Tu fixes un seuil par bobine. Dès qu’elle passe en dessous, tu le sais. Avant de lancer un print de 14 heures, pas pendant.',
  },
  {
    icon: Coins,
    title: 'Le vrai prix de tes pièces',
    desc: 'Le prix de la bobine, divisé par les grammes utilisés. Tu vois enfin ce que t’a coûté chaque impression. Spoiler : c’est rarement zéro.',
  },
]

const STEPS = [
  { n: '01', title: 'Tu rentres tes bobines', desc: 'Marque, matière, couleur, poids de départ. Deux minutes, montre en main.' },
  { n: '02', title: 'Tu notes tes impressions', desc: 'Les grammes utilisés, à chaque pièce. Le stock se met à jour sans que tu calcules.' },
  { n: '03', title: 'Tu arrêtes de deviner', desc: 'Ce qu’il reste, ce qui va manquer, ce que ça t’a coûté. Tout au même endroit.' },
]

export default function LandingClient({ user }: { user: any }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  // On lit le thème UNIQUEMENT après le montage côté client
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (saved === 'dark') {
      setTheme('dark')
      document.documentElement.classList.add('dark')
    }
  }, [])

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
      <nav className="fixed w-full top-0 z-50 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-900">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Disc3 size={18} className="text-blue-500" />
            <span className="font-bold text-base tracking-tight">SpoolTracker</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Changer de thème"
              className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors rounded-lg"
            >
              {!mounted ? (
                <span className="block w-[18px] h-[18px]" />
              ) : theme === 'light' ? (
                <Moon size={18} />
              ) : (
                <Sun size={18} />
              )}
            </button>
            {user ? (
              <Link href="/dashboard" className="text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg transition-colors">
                Mon stock
              </Link>
            ) : (
              <Link href="/login" className="text-sm font-semibold text-gray-900 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 transition-colors px-2">
                Connexion
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <main className="pt-36 pb-20 px-6 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.05] mb-6">
          Combien il te reste<br />
          de noir, déjà&nbsp;?
        </h1>

        <p className="text-gray-500 dark:text-gray-400 text-lg max-w-xl mb-4 leading-relaxed">
          Tu sais jamais. Du coup t&apos;en rachètes. Et t&apos;as fini avec six bobines de PLA noir
          à moitié vides dans un tiroir.
        </p>
        <p className="text-gray-900 dark:text-gray-100 text-lg font-semibold max-w-xl mb-10 leading-relaxed">
          SpoolTracker, c&apos;est juste pour arrêter ça.
        </p>

        {user ? (
          <Link href="/dashboard" className="group inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-3.5 rounded-xl transition-colors text-sm">
            Voir mon stock
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        ) : (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link href="/login?tab=signup" className="group inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-3.5 rounded-xl transition-colors text-sm">
              Créer mon compte
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/login" className="text-sm font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
              J&apos;ai déjà un compte
            </Link>
          </div>
        )}

        <p className="mt-6 text-xs text-gray-400">Gratuit, et sans te demander ta carte bancaire.</p>
      </main>

      {/* FEATURES : liste éditoriale, pas des cartes */}
      <section className="px-6 max-w-4xl mx-auto">
        <div className="border-t border-gray-100 dark:border-gray-900">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex gap-5 py-8 border-b border-gray-100 dark:border-gray-900"
            >
              <Icon size={22} className="shrink-0 mt-0.5 text-blue-500" strokeWidth={2} />
              <div>
                <h3 className="font-bold text-lg mb-1.5 tracking-tight">{title}</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed max-w-xl">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-12">
          En gros, ça tient en trois gestes.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-10">
          {STEPS.map(({ n, title, desc }) => (
            <div key={n}>
              <div className="text-gray-300 dark:text-gray-700 font-black text-3xl mb-3 tabular-nums">{n}</div>
              <h3 className="font-bold text-base mb-2 tracking-tight">{title}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BAS DE PAGE */}
      <section className="px-6 max-w-4xl mx-auto pb-24">
        <div className="border-t border-gray-100 dark:border-gray-900 pt-16 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
              Bon, on range ce tiroir&nbsp;?
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Crée ton compte, ajoute ta première bobine. Tu verras bien.
            </p>
          </div>
          {!user && (
            <Link
              href="/login?tab=signup"
              className="group shrink-0 inline-flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold px-6 py-3.5 rounded-xl hover:opacity-85 transition-opacity text-sm"
            >
              C&apos;est parti
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-100 dark:border-gray-900 py-8 px-6 max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-400 text-xs">
        <div className="flex items-center gap-2">
          <Disc3 size={14} className="text-blue-500" />
          <span>SpoolTracker · {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/mentions-legales" className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            Mentions légales
          </Link>
          <Link href="/confidentialite" className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            Confidentialité
          </Link>
        </div>
      </footer>
    </div>
  )
}
