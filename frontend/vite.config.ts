import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // stellar-wallets-kit ships ESM; let Vite pre-bundle it for the dev server.
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 5181,
    host: true,
    allowedHosts: true,
  },
  optimizeDeps: {
    include: ["@creit.tech/stellar-wallets-kit", "@stellar/stellar-sdk"],
  },
  build: {
    target: "es2020",
    sourcemap: true,
  },
});
