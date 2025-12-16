module.exports = {
  apps: [{
    name: 'backend',
    script: './dist/server.js',
    cwd: '/home/optiohire/optiohire/backend',
    instances: 1,
    exec_mode: 'fork',
    env_file: '.env',
    watch: false,
    autorestart: true,
    max_memory_restart: '500M',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
  }]
}


