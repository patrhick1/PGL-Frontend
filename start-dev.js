#!/usr/bin/env node
import { spawn } from 'child_process';

// Start Vite with correct host and port for Replit
const vite = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', '5000'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  env: {
    ...process.env,
    HOST: '0.0.0.0',
    PORT: '5000'
  }
});

process.on('SIGTERM', () => vite.kill());
process.on('SIGINT', () => vite.kill());