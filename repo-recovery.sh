#!/bin/bash
# SkySpotter repo recovery script
#
# What happened: a stray `git add -A` during an earlier merge accidentally
# committed the entire node_modules/ folder (there was no .gitignore), and
# ALSO staged local deletions of most of apps/web (package.json,
# vite.config.ts, main.tsx, and ~25 other core files) and all of
# packages/shared. That's why Render says "No workspaces found" and Vercel
# says "vite: command not found" — those files have genuinely been missing
# from main this whole time.
#
# This script restores everything from the last known-good commit and
# adds a proper .gitignore so it can't happen again. Run it from the root
# of your LOCAL clone of the Skyspotter repo.

set -e  # stop immediately if anything fails

echo "==> Checking out main and pulling latest..."
git checkout main
git pull

echo "==> Creating recovery branch..."
git checkout -b repo-recovery

echo "==> Writing .gitignore..."
cat > .gitignore << 'GITIGNORE'
node_modules/
dist/
.env
.env.local
*.log
GITIGNORE

echo "==> Untracking node_modules and dist/ (files stay on disk, just stop being tracked)..."
git rm -r --cached node_modules apps/api/dist apps/web/dist packages/shared/dist 2>/dev/null || true

echo "==> Restoring apps/web and packages/shared from before the accidental deletion (commit 3a6047e~1)..."
git checkout 3a6047e~1 -- \
  apps/web/index.html \
  apps/web/netlify.toml \
  apps/web/package.json \
  apps/web/postcss.config.js \
  apps/web/public/favicon.svg \
  apps/web/src/App.tsx \
  apps/web/src/components/VerticalSpeedIndicator.tsx \
  apps/web/src/features/home/FilterControls.tsx \
  apps/web/src/features/home/NearbyAircraftList.tsx \
  apps/web/src/features/home/RefreshRateControl.tsx \
  apps/web/src/features/home/SortControls.tsx \
  apps/web/src/features/home/ViewModeToggle.tsx \
  apps/web/src/features/map/MapStyleControl.tsx \
  apps/web/src/features/map/MapView.tsx \
  apps/web/src/features/map/RecenterControl.tsx \
  apps/web/src/features/map/aircraftIcon.ts \
  apps/web/src/features/map/mapStyles.ts \
  apps/web/src/hooks/useAircraftFeed.ts \
  apps/web/src/hooks/useAircraftRegistry.ts \
  apps/web/src/hooks/useGeolocation.ts \
  apps/web/src/index.css \
  apps/web/src/lib/apiBase.ts \
  apps/web/src/main.tsx \
  apps/web/src/services/aircraftService.ts \
  apps/web/src/vite-env.d.ts \
  apps/web/tailwind.config.js \
  apps/web/tsconfig.json \
  apps/web/vite.config.ts \
  packages/shared/package.json \
  packages/shared/src/index.ts \
  packages/shared/src/types.ts \
  packages/shared/tsconfig.json

echo "==> Writing the fixed vercel.json (adds --include=dev so devDependencies like vite actually install)..."
cat > apps/web/vercel.json << 'VERCELJSON'
{
  "buildCommand": "cd ../.. && npm run build:web",
  "outputDirectory": "dist",
  "installCommand": "cd ../.. && npm ci --include=dev"
}
VERCELJSON

echo "==> Verifying with a clean install and build..."
rm -rf node_modules apps/*/node_modules packages/*/node_modules
npm ci --include=dev
npm run build:api
npm run build:web

echo "==> All good. Committing..."
git add -A
git commit -m "Restore accidentally-deleted apps/web and packages/shared, remove committed node_modules, add .gitignore, fix Vercel install command"

echo ""
echo "Done. Now run:"
echo "  git push -u origin repo-recovery"
echo "Then open a PR into main on GitHub and merge it."
