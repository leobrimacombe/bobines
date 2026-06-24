import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Mentions légales | SpoolTracker',
  robots: { index: false },
}

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 font-sans">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors mb-10"
        >
          <ArrowLeft size={15} /> Retour à l&apos;accueil
        </Link>

        <h1 className="text-3xl font-black tracking-tight mb-2">Mentions légales</h1>
        <p className="text-gray-400 text-sm mb-10">Dernière mise à jour : juin 2026</p>

        <div className="space-y-8 text-[15px] leading-relaxed text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Éditeur du site</h2>
            <p>
              Le site SpoolTracker est édité par un particulier dans le cadre d&apos;un projet
              personnel et non commercial.
            </p>
            <ul className="mt-3 space-y-1">
              <li>Responsable de la publication : <strong>Brimacombe Léo</strong></li>
              <li>Contact : <strong>leo.brimacombe@free.fr</strong></li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Hébergement</h2>
            <p>Le site est hébergé par :</p>
            <ul className="mt-3 space-y-1">
              <li>
                <strong>Vercel Inc.</strong> — 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis
                — vercel.com
              </li>
              <li>
                Base de données et authentification : <strong>Supabase</strong> — supabase.com
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Propriété intellectuelle</h2>
            <p>
              Sauf mention contraire, le contenu du site (textes, interface) est la propriété de
              l&apos;éditeur. Les données que vous saisissez (bobines, impressions) restent les
              vôtres.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Données personnelles</h2>
            <p>
              Le traitement de vos données est décrit dans notre{' '}
              <Link href="/confidentialite" className="text-blue-500 hover:underline">
                politique de confidentialité
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
