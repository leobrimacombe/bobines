import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Politique de confidentialité | SpoolTracker',
  robots: { index: false },
}

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 font-sans">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors mb-10"
        >
          <ArrowLeft size={15} /> Retour à l&apos;accueil
        </Link>

        <h1 className="text-3xl font-black tracking-tight mb-2">Politique de confidentialité</h1>
        <p className="text-gray-400 text-sm mb-10">Dernière mise à jour : juin 2026</p>

        <div className="space-y-8 text-[15px] leading-relaxed text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Responsable du traitement</h2>
            <p>
              Les données collectées sur SpoolTracker sont traitées par l&apos;éditeur du site
              (voir les{' '}
              <Link href="/mentions-legales" className="text-blue-500 hover:underline">
                mentions légales
              </Link>
              ). Pour toute question, contactez : <strong>leo.brimacombe@free.fr</strong>.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Données collectées</h2>
            <p>Lors de la création d&apos;un compte et de l&apos;utilisation du service :</p>
            <ul className="mt-3 space-y-1 list-disc pl-5">
              <li>votre <strong>adresse email</strong> ;</li>
              <li>votre <strong>nom d&apos;utilisateur</strong> (pseudo) ;</li>
              <li>
                votre <strong>mot de passe</strong>, stocké de façon chiffrée (nous n&apos;y avons
                jamais accès en clair) ;
              </li>
              <li>
                les <strong>données que vous saisissez</strong> : bobines, matières, poids,
                impressions, prix, seuils d&apos;alerte.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Finalités</h2>
            <p>Vos données servent uniquement à :</p>
            <ul className="mt-3 space-y-1 list-disc pl-5">
              <li>créer et sécuriser votre compte ;</li>
              <li>vous permettre de gérer votre stock de filaments ;</li>
              <li>répondre à vos messages si vous nous contactez.</li>
            </ul>
            <p className="mt-3">
              Nous ne vendons, ne louons et ne cédons vos données à personne. Aucune publicité.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Sous-traitants</h2>
            <p>Pour fonctionner, le service s&apos;appuie sur des prestataires techniques :</p>
            <ul className="mt-3 space-y-1 list-disc pl-5">
              <li><strong>Supabase</strong> : authentification et base de données ;</li>
              <li><strong>Vercel</strong> : hébergement du site ;</li>
              <li><strong>Cloudflare Turnstile</strong> : protection anti-robot du formulaire d&apos;inscription ;</li>
              <li><strong>Resend</strong> : envoi des emails (ex. messages de feedback).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Durée de conservation</h2>
            <p>
              Vos données sont conservées tant que votre compte est actif. Si vous demandez la
              suppression de votre compte, elles sont effacées.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Vos droits</h2>
            <p>
              Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification,
              de suppression et de portabilité de vos données. Pour les exercer, écrivez à{' '}
              <strong>leo.brimacombe@free.fr</strong>. Vous pouvez aussi introduire une
              réclamation auprès de la CNIL (cnil.fr).
            </p>
          </section>

          <section>
            <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Cookies</h2>
            <p>
              SpoolTracker utilise uniquement des cookies techniques nécessaires à la connexion
              (gestion de votre session). Aucun cookie publicitaire ni de suivi.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
