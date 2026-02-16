import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Stock Filaments",
  description: "Gestion de stock simplifiée",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      {/* Fond gris clair Apple et texte sombre par défaut */}
      <body className={`${inter.className} bg-[#F5F5F7] text-[#1D1D1F] antialiased`}>
        {children}
      </body>
    </html>
  );
}