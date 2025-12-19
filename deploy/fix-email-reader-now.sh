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

# Create a wrapper script that loads .env and starts the server
cat > "$APP_DIR/backend/start-with-env.sh" << 'EOF'
#!/bin/bash
# Wrapper script to ensure .env is loaded before starting server

cd "$(dirname "$0")"

# Load .env file explicitly
if [ -f .env ]; then
    export $(grep -v '^#' .env | grep -v '^$' | xargs)
fi

# Explicitly set email reader to enabled if not set
export ENABLE_EMAIL_READER=${ENABLE_EMAIL_READER:-true}

# Start the server
exec node dist/server.js
EOF

chmod +x "$APP_DIR/backend/start-with-env.sh"
echo "✅ Created wrapper script to load .env"
echo ""

# Step 3: Update ecosystem.config.js to use the wrapper
echo "Step 3: Updating PM2 ecosystem config..."
cd "$APP_DIR"

# Backup original
cp deploy/ecosystem.config.js deploy/ecosystem.config.js.backup

# Update the backend script to use wrapper and explicitly set ENABLE_EMAIL_READER
cat > deploy/ecosystem.config.js << 'ECOSYSTEM_EOF'
// PM2 Ecosystem Configuration for Production
// This file is used by PM2 to manage both backend and frontend processes
// Paths are dynamically resolved at runtime

const path = require('path');
const fs = require('fs');

// Detect the application root directory
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
      script: path.join(BACKEND_DIR, 'start-with-env.sh'),
      interpreter: 'bash',
      cwd: BACKEND_DIR,
      instances: 1,
      exec_mode: 'fork',
      env_file: path.join(BACKEND_DIR, '.env'),
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        // CRITICAL: Explicitly enable email reader
        ENABLE_EMAIL_READER: 'true',
        // IMPORTANT: All other secrets should be in backend/.env file
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
ECOSYSTEM_EOF

echo "✅ Updated PM2 ecosystem config"
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
