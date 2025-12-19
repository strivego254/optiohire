// PM2 Ecosystem Configuration for Production
// This file is used by PM2 to manage both backend and frontend processes
// Paths are dynamically resolved at runtime

const path = require('path');
const fs = require('fs');

// Detect the application root directory
// Try multiple common locations
const possibleRoots = [
  process.env.OPTIOHIRE_ROOT,
  process.cwd(),
  path.resolve(__dirname),
  path.resolve(__dirname, '..'),
  '/home/optiohire/optiohire',
  '/opt/optiohire',
  process.env.HOME ? path.join(process.env.HOME, 'optiohire') : null,
].filter(Boolean);

let APP_ROOT = null;
for (const root of possibleRoots) {
  if (fs.existsSync(root) && fs.existsSync(path.join(root, 'backend')) && fs.existsSync(path.join(root, 'frontend'))) {
    APP_ROOT = root;
    break;
  }
}

if (!APP_ROOT) {
  // Fallback to current directory
  APP_ROOT = path.resolve(__dirname);
}

const BACKEND_DIR = path.join(APP_ROOT, 'backend');
const FRONTEND_DIR = path.join(APP_ROOT, 'frontend');
const LOGS_DIR = process.env.HOME ? path.join(process.env.HOME, 'logs') : path.join(APP_ROOT, 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  try {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  } catch (err) {
    console.warn(`Warning: Could not create logs directory: ${LOGS_DIR}`);
  }
}

module.exports = {
  apps: [
    {
      name: 'optiohire-backend',
      script: path.join(BACKEND_DIR, 'dist', 'server.js'),
      cwd: BACKEND_DIR,
      instances: 1,
      exec_mode: 'fork',
      env_file: path.join(BACKEND_DIR, '.env'),
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        // CRITICAL: Explicitly enable email reader for automatic email processing
        ENABLE_EMAIL_READER: 'true',
        // IMPORTANT: All other secrets should be in backend/.env file
        // Do NOT hardcode API keys, passwords, or secrets here
      },
      error_file: path.join(LOGS_DIR, 'backend-error.log'),
      out_file: path.join(LOGS_DIR, 'backend-out.log'),
      log_file: path.join(LOGS_DIR, 'backend-combined.log'),
      time: true,
      autorestart: true,
      watch: false,
      max_restarts: 50, // Increased for production stability
      min_uptime: '10s',
      max_memory_restart: '500M',
      restart_delay: 4000,
      exp_backoff_restart_delay: 100,
      // Health check configuration
      kill_timeout: 5000,
      listen_timeout: 10000,
      shutdown_with_message: true,
      // Auto-restart on file changes (disabled in production)
      ignore_watch: ['node_modules', 'logs', '.git'],
    },
    {
      name: 'optiohire-frontend',
      script: 'npm',
      args: 'start',
      cwd: FRONTEND_DIR,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NODE_OPTIONS: '--max-old-space-size=2048',
      },
      error_file: path.join(LOGS_DIR, 'frontend-error.log'),
      out_file: path.join(LOGS_DIR, 'frontend-out.log'),
      log_file: path.join(LOGS_DIR, 'frontend-combined.log'),
      time: true,
      autorestart: true,
      watch: false,
      max_restarts: 50,
      min_uptime: '10s',
      max_memory_restart: '800M',
      restart_delay: 4000,
      exp_backoff_restart_delay: 100,
      kill_timeout: 5000,
      listen_timeout: 10000,
      shutdown_with_message: true,
      ignore_watch: ['node_modules', 'logs', '.git', '.next'],
    },
  ],
};
