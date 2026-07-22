import type { Config } from "tailwindcss";

/**
 * Charte graphique tirée du logo VoiCit (tornade dégradée vert→jaune sur « ocit » noir).
 * Ces tokens sont la seule source de vérité des couleurs de marque.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Vert institutionnel — couleur primaire de confiance (haut de la tornade)
        brand: {
          50: "#e8f5ee",
          100: "#c6e7d3",
          500: "#0E7A3B",
          600: "#0b6331",
          700: "#084d26",
        },
        // Niveaux de verdict (repris du dégradé du logo)
        verdict: {
          fiable: "#0E7A3B", // vert
          douteux: "#F5871F", // orange
          faux: "#E23B26", // rouge
          insuffisant: "#6B7280", // gris ardoise
        },
        accent: {
          yellow: "#FBC02D", // pointe de la tornade
          orange: "#F5871F",
          red: "#E23B26",
        },
        ink: "#111827", // texte, comme le « ocit »
      },
      backgroundImage: {
        // Signature visuelle : le dégradé de la tornade
        tornado:
          "linear-gradient(160deg, #0E7A3B 0%, #4c8a2b 35%, #E23B26 62%, #F5871F 80%, #FBC02D 100%)",
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(17,24,39,0.08), 0 1px 2px rgba(17,24,39,0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
