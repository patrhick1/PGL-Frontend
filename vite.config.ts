import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5000,
    hmr: {
      clientPort: 443,
    },
    allowedHosts: [
      "localhost",
      "localhost:5173",
      "localhost:5000",
      "podcastguestlaunch.replit.app",
      "podcastguestlaunch.onrender.com",
      ".replit.dev",
      ".repl.co",
      ".replit.app",
    ],
  },
  preview: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: [
      "localhost:5173",
      "podcastguestlaunch.replit.app",
      "podcastguestlaunch.onrender.com",
      ".replit.dev",
      ".repl.co",
      ".replit.app",
    ],
  },
});
