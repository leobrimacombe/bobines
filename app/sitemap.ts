import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  // Remplace cette URL par ton URL Vercel actuelle
  const baseUrl = 'https://bobines.vercel.app'

  return [
    {
      url: baseUrl, // La page d'accueil
      lastModified: new Date(),
      changeFrequency: 'monthly', // Dit à Google que la page d'accueil change peu
      priority: 1, // Priorité maximale
    },
    // Si un jour tu crées une page /contact ou /tarifs, tu les ajouteras ici !
  ]
}