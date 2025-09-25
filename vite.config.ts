import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

import { info } from "./src/configs/default";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      injectRegister: false,

      pwaAssets: {
        disabled: true,
      },

      manifest: {
        name: info.pwa.name,
        short_name: info.pwa.name,
        description: info.pwa.description,
        theme_color: "#000",
        start_url: "/~",
        icons: [
          {
            src: "/pwa/icon-48x48.png",
            sizes: "48x48",
            type: "image/png",
          },
          {
            src: "/pwa/icon-72x72.png",
            sizes: "72x72",
            type: "image/png",
          },
          {
            src: "/pwa/icon-96x96.png",
            sizes: "96x96",
            type: "image/png",
          },
          {
            src: "/pwa/icon-144x144.png",
            sizes: "144x144",
            type: "image/png",
          },
          {
            src: "/pwa/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },

      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
      },

      devOptions: {
        enabled: false,
        navigateFallback: "index.html",
        suppressWarnings: true,
        type: "module",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
