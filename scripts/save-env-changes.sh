#!/bin/bash
# Script to help save .env changes and resolve conflicts

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="backend/.env"
BACKUP_FILE="backend/.env.backup.$(date +%Y%m%d_%H%M%S)"

echo "🔧 Resolving .env save conflict..."
echo ""

# Create backup
if [ -f "$ENV_FILE" ]; then
  cp "$ENV_FILE" "$BACKUP_FILE"
  echo "✅ Backup created: $BACKUP_FILE"
fi

# Check if file is writable
if [ ! -w "$ENV_FILE" ]; then
  echo "⚠️  Making .env writable..."
  chmod +w "$ENV_FILE"
fi

echo ""
echo "✅ .env file is ready for your changes"
echo ""
echo "📝 Next steps:"
echo "1. In VS Code, click 'Overwrite' when you see the conflict dialog"
echo "2. Or manually add your changes:"
echo "   - GROQ_API_KEY=your_groq_key"
echo "   - REPORT_AI_MODEL=llama-3.3-70b-versatile"
echo "   - SCORING_MODEL=gemini-2.0-flash"
echo "   - RESUME_PARSER_MODEL=gemini-2.0-flash"
echo ""
echo "3. Save the file (Ctrl+S)"
echo "4. Verify changes were saved"

