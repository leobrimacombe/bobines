import { createClient } from '../utils/supabase/server'
import LandingClient from '../components/LandingClient'

// --- METADATA POUR LE RÉFÉRENCEMENT GOOGLE ---
export const metadata = {
  title: 'SpoolTracker | Gestionnaire de stock de filaments 3D',
  description: 'Le meilleur outil gratuit pour gérer vos bobines de filament 3D. Suivez le poids, anticipez les ruptures et analysez vos coûts d\'impression.',
  keywords: 'impression 3d, filaments, pla, petg, bambu lab, gestion stock, outil gratuit',
}

export default async function Page() {
  // On vérifie côté serveur si l'utilisateur est connecté
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // On passe l'information au composant interactif
  return <LandingClient user={user} />
}

