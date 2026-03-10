import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import FeedbackButton from "../components/FeedbackButton";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SpoolTracker",
  description: "Gérez votre stock de filaments 3D.",
  verification: {
    google: 'Z6b3mENNU_iAX1LacUW_TH-xRsrZiOx4cZ4bKMX6jzc',
  },
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
        <FeedbackButton />
      </body>
    </html>
  );
}