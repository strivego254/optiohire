#!/bin/bash
# Sync environment variables across all .env files

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "🔄 Syncing environment variables across all files..."
echo ""

# Read all keys from backend/.env
if [ ! -f "backend/.env" ]; then
  echo "❌ backend/.env not found"
  exit 1
fi

# Extract all variable names from backend/.env
BACKEND_KEYS=$(grep -v "^#" backend/.env | grep -v "^$" | grep "=" | cut -d'=' -f1 | sort)

echo "📋 Found $(echo "$BACKEND_KEYS" | wc -l) variables in backend/.env"
echo ""

# Create root .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
  echo "📝 Creating root .env.local..."
  touch .env.local
fi

# Create root .env if it doesn't exist (as master)
if [ ! -f ".env" ]; then
  echo "📝 Creating root .env (master)..."
  cp env.example .env 2>/dev/null || touch .env
fi

# Function to add missing keys to a file
add_missing_keys() {
  local target_file=$1
  local source_file=$2
  local description=$3
  
  if [ ! -f "$target_file" ]; then
    echo "   ⚠️  $target_file not found, skipping..."
    return
  fi
  
  local missing_count=0
  while IFS= read -r key; do
    if [ -z "$key" ]; then
      continue
    fi
    
    # Check if key exists in target file
    if ! grep -q "^${key}=" "$target_file" 2>/dev/null; then
      # Get value from source file
      local value=$(grep "^${key}=" "$source_file" 2>/dev/null | cut -d'=' -f2- | head -1)
      
      if [ -n "$value" ]; then
        # Add to target file
        echo "${key}=${value}" >> "$target_file"
        missing_count=$((missing_count + 1))
      fi
    fi
  done <<< "$BACKEND_KEYS"
  
  if [ $missing_count -gt 0 ]; then
    echo "   ✅ Added $missing_count missing keys to $description"
  else
    echo "   ✅ $description already has all keys"
  fi
}

# Sync backend keys to root .env.local (all keys with values)
echo "📝 Syncing backend/.env values to root .env.local..."
add_missing_keys ".env.local" "backend/.env" "root .env.local"

# Ensure backend/.env has all keys from env.example
echo "📝 Ensuring backend/.env has all keys from env.example..."
if [ -f "env.example" ]; then
  BACKEND_EXAMPLE_KEYS=$(grep -v "^#" env.example | grep -v "^$" | grep "=" | grep -v "NEXT_PUBLIC" | grep -v "NEXTAUTH" | cut -d'=' -f1 | sort)
  
  missing_count=0
  while IFS= read -r key; do
    if [ -z "$key" ]; then
      continue
    fi
    
    if ! grep -q "^${key}=" "backend/.env" 2>/dev/null; then
      example_value=$(grep "^${key}=" "env.example" 2>/dev/null | cut -d'=' -f2- | head -1)
      if [ -n "$example_value" ]; then
        echo "${key}=${example_value}" >> "backend/.env"
        missing_count=$((missing_count + 1))
      fi
    fi
  done <<< "$BACKEND_EXAMPLE_KEYS"
  
  if [ $missing_count -gt 0 ]; then
    echo "   ✅ Added $missing_count missing keys to backend/.env"
  else
    echo "   ✅ backend/.env already has all keys"
  fi
fi

# Sync frontend keys to frontend/.env.local
echo "📝 Syncing frontend keys to frontend/.env.local..."
if [ -f "frontend/.env.local" ]; then
  FRONTEND_KEYS=$(grep -v "^#" env.example | grep -v "^$" | grep "=" | grep -E "^(NEXT_PUBLIC|NEXTAUTH)" | cut -d'=' -f1 | sort)
  
  missing_count=0
  while IFS= read -r key; do
    if [ -z "$key" ]; then
      continue
    fi
    
    if ! grep -q "^${key}=" "frontend/.env.local" 2>/dev/null; then
      value=$(grep "^${key}=" "env.example" 2>/dev/null | cut -d'=' -f2- | head -1)
      if [ -n "$value" ]; then
        echo "${key}=${value}" >> "frontend/.env.local"
        missing_count=$((missing_count + 1))
      fi
    fi
  done <<< "$FRONTEND_KEYS"
  
  if [ $missing_count -gt 0 ]; then
    echo "   ✅ Added $missing_count missing keys to frontend/.env.local"
  else
    echo "   ✅ Frontend keys already synced"
  fi
else
  echo "   ⚠️  frontend/.env.local not found"
fi

echo ""
echo "✅ Sync complete!"
