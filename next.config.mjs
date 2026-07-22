/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Les SDK des fournisseurs LLM ne tournent QUE côté serveur.
  // On les marque comme "externals" pour éviter tout bundling côté client.
  experimental: {
    serverComponentsExternalPackages: ["@anthropic-ai/sdk", "openai", "@google/genai"],
  },
};

export default nextConfig;
