#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
# SPDX-License-Identifier: Apache-2.0
set -e

# script to publish all packages to npm
# this script changes the package.json to the new version and publishes to npm with the fork tag
# it also restores the original package.json after publishing
# this way we can publish zetra packages to npm with the fork tag and still use local packages

# ─────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────
ZETRA_SCOPE="@zetra"
CITRINE_SCOPE="@citrineos"
FORK_VERSION="${1#v}"
NPM_TAG="${NPM_TAG:-dev}"


if [ -z "$FORK_VERSION" ]; then
  echo "❌ No version provided. Usage: bash publish-all.sh <version>"
  exit 1
fi

echo "📌 Publishing version: $FORK_VERSION"

PACKAGES=(
  "00_Base"
  "01_Data"
  "02_Util"
  "03_Modules/Certificates"
  "03_Modules/Configuration"
  "03_Modules/EVDriver"
  "03_Modules/Monitoring"
  "03_Modules/OcppRouter"
  "03_Modules/Reporting"
  "03_Modules/SmartCharging"
  "03_Modules/Tenant"
  "03_Modules/Transactions"
)

# ─────────────────────────────────────────────
# Helper: rewrite package.json for publish
# ─────────────────────────────────────────────
rewrite_package_json() {
  local pkg_path="$1/package.json"
  local dist_dir="$1/dist"

  cp "$pkg_path" "$pkg_path.bak"

  FORK_VERSION="$FORK_VERSION" PKG_PATH="$pkg_path" node -e "$(cat <<'EOF'
    const fs = require('fs');
    const { FORK_VERSION, PKG_PATH } = process.env;
    const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));

    pkg.name = pkg.name.replace('@citrineos/', '@zetra/citrineos-');
    pkg.version = FORK_VERSION;

    const rewriteDeps = (deps) => {
      if (!deps) return deps;
      return Object.fromEntries(Object.entries(deps).map(([k, v]) =>
        k.startsWith('@citrineos/')
          ? [k.replace('@citrineos/', '@zetra/citrineos-'), FORK_VERSION]
          : [k, v]
      ));
    };

    pkg.dependencies = rewriteDeps(pkg.dependencies);
    pkg.devDependencies = rewriteDeps(pkg.devDependencies);
    pkg.peerDependencies = rewriteDeps(pkg.peerDependencies);

    fs.writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2));
    console.log('Rewritten:', pkg.name, pkg.version);
EOF
)"

  if [ -d "$dist_dir" ]; then
    echo "  🔧 Rewriting @citrineos/ imports in dist/..."
    find "$dist_dir" -type f \( -name "*.js" -o -name "*.mjs" -o -name "*.cjs" -o -name "*.d.ts" -o -name "*.d.mts" \) \
      -exec sed -i "s|@citrineos/\([a-zA-Z0-9_-]*\)|@zetra/citrineos-\1|g" {} +
    echo "  ✅ dist/ imports rewritten"
  else
    echo "  ⚠️  No dist/ directory found in $1 — did the build run?"
  fi
}
# ─────────────────────────────────────────────
# Cleanup trap
# ─────────────────────────────────────────────
cleanup() {
  for pkg in "${PACKAGES[@]}"; do
    if [ -f "$pkg/package.json.bak" ]; then
      mv "$pkg/package.json.bak" "$pkg/package.json"
      echo "Restored: $pkg/package.json"
    fi
  done
}
trap cleanup EXIT


# ─────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────
ROOT_DIR=$(pwd)

echo "🚀 Starting publish of all @zetra/citrineos-* packages..."
echo ""

for pkg in "${PACKAGES[@]}"; do
  if [ ! -d "$pkg" ]; then
    echo "⚠️  Skipping $pkg (directory not found)"
    continue
  fi

  if [ ! -f "$pkg/package.json" ]; then
    echo "⚠️  Skipping $pkg (no package.json)"
    continue
  fi

  echo "📦 Publishing $pkg..."

  # Rewrite package.json
  rewrite_package_json "$pkg"

  # Publish
  cd "$pkg"
  npm publish --access public --tag "$NPM_TAG"
  echo "✅ Published $pkg successfully"
  cd "$ROOT_DIR"

  echo ""
done

echo "🎉 All packages published!"