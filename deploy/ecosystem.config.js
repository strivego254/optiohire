module.exports = {
  apps: [
    {
      name: 'optiohire-backend',
      script: './backend/dist/server.js',
      cwd: '/home/optiohire/optiohire',
      instances: 1,
      exec_mode: 'fork',
      env_file: '/home/optiohire/optiohire/backend/.env',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        // IMPORTANT:
        // Do NOT hardcode secrets here. Put them in backend/.env on the server.
        // This repo should never contain API keys, DATABASE_URL passwords, JWT secrets, etc.
      },
      error_file: '/home/optiohire/logs/backend-error.log',
      out_file: '/home/optiohire/logs/backend-out.log',
      log_file: '/home/optiohire/logs/backend-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
    },
    {
      name: 'optiohire-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/home/optiohire/optiohire/frontend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/home/optiohire/logs/frontend-error.log',
      out_file: '/home/optiohire/logs/frontend-out.log',
      log_file: '/home/optiohire/logs/frontend-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '800M',
    },
  ],
}

