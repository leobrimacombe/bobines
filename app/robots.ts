import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // Remplace cette URL par ton URL Vercel actuelle ou ton vrai nom de domaine plus tard
  const baseUrl = 'https://bobines.vercel.app' 

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/login/'], // On bloque l'accès aux pages privées
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}