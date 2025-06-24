#!/usr/bin/env node
import { createServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const server = await createServer({
    configFile: resolve(__dirname, 'vite.config.ts'),
    server: {
      host: '0.0.0.0',
      port: 5000
    }
  });
  
  await server.listen();
  console.log('Development server running on http://0.0.0.0:5000');
}

startServer().catch(console.error);