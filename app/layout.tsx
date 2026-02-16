import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // <--- Vérifie que cette ligne est bien là !

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Stock Filaments",
  description: "Gestion de stock",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      {/* On force la couleur de fond ici pour éviter les bugs d'affichage */}
      <body className={`${inter.className} bg-slate-50 dark:bg-[#1A1A2E] text-slate-900 dark:text-[#EAEAEA]`}>
        {children}
      </body>
    </html>
  );
}