#!/usr/bin/env node

import { preview } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  try {
    const server = await preview({
      root: path.resolve(__dirname, 'client'),
      build: {
        outDir: path.resolve(__dirname, 'dist/public'),
      },
      preview: {
        port: 5000,
        host: '0.0.0.0',
        allowedHosts: [
          'podcastguestlaunch.replit.app',
          '.replit.dev',
          '.repl.co',
          '.replit.app',
          'localhost',
          process.env.REPLIT_DEV_DOMAIN
        ].filter(Boolean)
      }
    });

    console.log('Production server started successfully');
    server.printUrls();
  } catch (error) {
    console.error('Failed to start production server:', error);
    process.exit(1);
  }
}

startServer();