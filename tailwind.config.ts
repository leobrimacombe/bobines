import type { Config } from "tailwindcss";

const config: Config = {
  // On peut laisser ça, mais c'est le CSS qui commande maintenant
  darkMode: 'selector', 
  
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  plugins: [],
};
export default config;