import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Serveur autonome embarqué dans l'appli Electron (voir electron/main.js)
  output: "standalone",
  images: { unoptimized: true },
  experimental: {
    // Un import de sauvegarde peut dépasser la limite par défaut de 1 Mo
    serverActions: { bodySizeLimit: "50mb" },
  },
};

export default nextConfig;
