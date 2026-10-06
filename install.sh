#!/usr/bin/env bash

# DeepSite Installer Script
# Usage: bash install-deepsite.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }

# Check for required commands
require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    error "Required command '$1' not found. Please install it first."
    exit 1
  fi
}

info "Checking prerequisites..."
require_cmd git
require_cmd node
require_cmd npm

# Recommend yarn but fallback to npm
if command -v yarn >/dev/null 2>&1; then
  PKG_MGR="yarn"
else
  warn "'yarn' not found. Falling back to 'npm'."
  PKG_MGR="npm"
fi

info "Using package manager: $PKG_MGR"
info "Node version: $(node -v)"
info "NPM version:  $(npm -v)"

# Clone repository
REPO_URL="https://github.com/asukaa2/deepsite.git"
TARGET_DIR="deepsite"

if [ -d "$TARGET_DIR" ]; then
  warn "Directory '$TARGET_DIR' already exists. Skipping clone."
else
  info "Cloning $REPO_URL ..."
  git clone "$REPO_URL"
  ok "Repository cloned."
fi

cd "$TARGET_DIR"

# Install dependencies
info "Installing dependencies with $PKG_MGR ..."
if [ "$PKG_MGR" = "yarn" ]; then
  yarn install
else
  npm install
fi
ok "Dependencies installed."

# Set up .env
if [ -f ".env" ]; then
  warn ".env already exists. Skipping copy."
elif [ -f ".env.example" ]; then
  cp .env.example .env
  ok "Created .env from .env.example"
  warn "Please edit '.env' and configure at least one provider before starting."
else
  warn ".env.example not found. You may need to create .env manually."
fi

# Prompt user to edit .env
echo
info "Current directory: $(pwd)"
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Edit the .env file and configure at least one provider:"
echo "       nano .env    # or your preferred editor"
echo "  2. Start the development server with:"
if [ "$PKG_MGR" = "yarn" ]; then
  echo "       yarn start:dev"
else
  echo "       npm run start:dev"
fi
echo

# Ask if user wants to start now
read -r -p "Do you want to open .env in an editor now? [y/N] " answer
case "$answer" in
  [yY][eE][sS]|[yY])
    EDITOR="${EDITOR:-nano}"
    if command -v "$EDITOR" >/dev/null 2>&1; then
      "$EDITOR" .env
    else
      warn "Editor '$EDITOR' not found. Please edit .env manually."
    fi
    ;;
  *)
    info "Skipping editor."
    ;;
esac

read -r -p "Start the dev server now? [y/N] " start_now
case "$start_now" in
  [yY][eE][sS]|[yY])
    info "Starting dev server..."
    if [ "$PKG_MGR" = "yarn" ]; then
      yarn start:dev
    else
      npm run start:dev
    fi
    ;;
  *)
    ok "Setup complete. Run the start command when ready."
    ;;
esac
