#!/bin/bash
# URGENT FIX: Ensure Email Reader Starts Automatically
# This script fixes the email reader not starting issue

set -e

echo "=========================================="
echo "🔧 FIXING EMAIL READER - URGENT"
echo "=========================================="
echo ""

APP_DIR="$HOME/optiohire"
[ ! -d "$APP_DIR" ] && APP_DIR="/opt/optiohire"

cd "$APP_DIR"

# Step 1: Ensure .env file has ENABLE_EMAIL_READER=true
echo "Step 1: Ensuring email reader is enabled in .env..."
if [ ! -f "$APP_DIR/backend/.env" ]; then
    echo "❌ ERROR: backend/.env file not found!"
    echo "Please create it with all required credentials."
    exit 1
fi

# Remove any ENABLE_EMAIL_READER=false lines
sed -i '/^ENABLE_EMAIL_READER=false/d' "$APP_DIR/backend/.env" 2>/dev/null || true

# Add or update ENABLE_EMAIL_READER=true
if grep -q "^ENABLE_EMAIL_READER=" "$APP_DIR/backend/.env"; then
    sed -i 's/^ENABLE_EMAIL_READER=.*/ENABLE_EMAIL_READER=true/' "$APP_DIR/backend/.env"
    echo "✅ Updated ENABLE_EMAIL_READER=true"
else
    echo "" >> "$APP_DIR/backend/.env"
    echo "# Email Reader - MUST BE TRUE for automatic processing" >> "$APP_DIR/backend/.env"
    echo "ENABLE_EMAIL_READER=true" >> "$APP_DIR/backend/.env"
    echo "✅ Added ENABLE_EMAIL_READER=true"
fi

# Ensure IMAP_POLL_MS is set to 1000 (1 second)
if grep -q "^IMAP_POLL_MS=" "$APP_DIR/backend/.env"; then
    sed -i 's/^IMAP_POLL_MS=.*/IMAP_POLL_MS=1000/' "$APP_DIR/backend/.env"
else
    echo "IMAP_POLL_MS=1000" >> "$APP_DIR/backend/.env"
fi

echo ""

# Step 2: Update PM2 ecosystem config to explicitly pass ENABLE_EMAIL_READER
echo "Step 2: Updating PM2 configuration..."
cd "$APP_DIR"

# Backup original
cp deploy/ecosystem.config.js deploy/ecosystem.config.js.backup 2>/dev/null || true

# Read current ecosystem config and update it
NODE_SCRIPT=$(cat << 'NODE_EOF'
const fs = require('fs');
const path = require('path');

const configPath = process.argv[2];
const backendEnvPath = process.argv[3];

// Read current config
const config = require(configPath);

// Update backend app config
const backendApp = config.apps.find(app => app.name === 'optiohire-backend');
if (backendApp) {
  // Ensure ENABLE_EMAIL_READER is explicitly set to true
  backendApp.env = backendApp.env || {};
  backendApp.env.ENABLE_EMAIL_READER = 'true';
  
  // Keep env_file for other variables
  backendApp.env_file = backendEnvPath;
  
  // Ensure script points to dist/server.js (not wrapper)
  backendApp.script = path.join(backendApp.cwd || path.dirname(configPath) + '/backend', 'dist', 'server.js');
  delete backendApp.interpreter; // Remove interpreter if it was set
}

// Write updated config
fs.writeFileSync(configPath, `// PM2 Ecosystem Configuration for Production
// Auto-updated to ensure email reader is enabled
const path = require('path');
const fs = require('fs');

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
  APP_ROOT = path.resolve(__dirname);
}

const BACKEND_DIR = path.join(APP_ROOT, 'backend');
const FRONTEND_DIR = path.join(APP_ROOT, 'frontend');
const LOGS_DIR = process.env.HOME ? path.join(process.env.HOME, 'logs') : path.join(APP_ROOT, 'logs');

if (!fs.existsSync(LOGS_DIR)) {
  try {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  } catch (err) {
    console.warn(\`Warning: Could not create logs directory: \${LOGS_DIR}\`);
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
      env_file: '${backendEnvPath}',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        ENABLE_EMAIL_READER: 'true', // CRITICAL: Explicitly enabled
      },
      error_file: path.join(LOGS_DIR, 'backend-error.log'),
      out_file: path.join(LOGS_DIR, 'backend-out.log'),
      log_file: path.join(LOGS_DIR, 'backend-combined.log'),
      time: true,
      autorestart: true,
      watch: false,
      max_restarts: 50,
      min_uptime: '10s',
      max_memory_restart: '500M',
      restart_delay: 4000,
      exp_backoff_restart_delay: 100,
      kill_timeout: 5000,
      listen_timeout: 10000,
      shutdown_with_message: true,
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
`);
NODE_EOF
)

# Run Node script to update config
node -e "$NODE_SCRIPT" "$APP_DIR/deploy/ecosystem.config.js" "$APP_DIR/backend/.env"

echo "✅ Updated PM2 ecosystem config with ENABLE_EMAIL_READER=true"
echo ""

# Step 4: Restart backend with new configuration
echo "Step 4: Restarting backend with email reader enabled..."
pm2 stop optiohire-backend 2>/dev/null || true
pm2 delete optiohire-backend 2>/dev/null || true

# Start with new config
pm2 start deploy/ecosystem.config.js --only optiohire-backend --update-env

# Wait a moment
sleep 3

# Check if it's running
if pm2 list | grep -q "optiohire-backend.*online"; then
    echo "✅ Backend restarted successfully"
else
    echo "❌ ERROR: Backend failed to start"
    pm2 logs optiohire-backend --lines 20
    exit 1
fi

echo ""

# Step 5: Verify email reader is enabled
echo "Step 5: Verifying email reader status..."
sleep 2

EMAIL_READER_STATUS=$(curl -s http://localhost:3001/health/email-reader 2>/dev/null || echo "{}")

if echo "$EMAIL_READER_STATUS" | grep -q '"enabled":true'; then
    echo "✅ Email reader is ENABLED and running!"
    echo ""
    echo "Email Reader Status:"
    echo "$EMAIL_READER_STATUS" | python3 -m json.tool 2>/dev/null || echo "$EMAIL_READER_STATUS"
else
    echo "⚠️  Email reader status check:"
    echo "$EMAIL_READER_STATUS" | python3 -m json.tool 2>/dev/null || echo "$EMAIL_READER_STATUS"
    echo ""
    echo "Checking backend logs for email reader initialization..."
    pm2 logs optiohire-backend --lines 30 --nostream | grep -i "email\|imap" || echo "No email-related logs found"
fi

echo ""

# Step 6: Save PM2 configuration
echo "Step 6: Saving PM2 configuration..."
pm2 save --force
echo "✅ PM2 configuration saved"
echo ""

echo "=========================================="
echo "✅ FIX COMPLETE!"
echo "=========================================="
echo ""
echo "The email reader should now be running automatically."
echo ""
echo "Monitor email processing:"
echo "  pm2 logs optiohire-backend | grep -i email"
echo ""
echo "Check email reader status:"
echo "  curl http://localhost:3001/health/email-reader"
echo ""
echo "View all logs:"
echo "  pm2 logs optiohire-backend"
echo ""
