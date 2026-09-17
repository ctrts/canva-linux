#!/bin/bash
# Install Canva for the current user: the app in ~/.local/share/canva-linux, a
# `canva` launcher in ~/.local/bin, and a Canva entry in the app launcher.

set -euo pipefail

repo=$(cd "$(dirname "$0")" && pwd)
app_dir="$HOME/.local/share/canva-linux"
applications="$HOME/.local/share/applications"

rm -rf "$app_dir"
mkdir -p "$app_dir"
cp -R "$repo/package.json" "$repo/src" "$repo/resources" "$app_dir/"

install -Dm755 "$repo/linux/canva" "$HOME/.local/bin/canva"
install -Dm644 "$repo/resources/canva.png" \
  "$HOME/.local/share/icons/hicolor/256x256/apps/canva-linux.png"

# Replace a Canva web app made with Omarchy's web app installer, keeping a copy.
if [[ -f $applications/Canva.desktop ]] && command grep -q omarchy-launch-webapp "$applications/Canva.desktop"; then
  mv "$applications/Canva.desktop" "$applications/Canva.desktop.webapp.bak"
  echo "Backed up the old Canva web app to $applications/Canva.desktop.webapp.bak"
fi
install -Dm644 "$repo/linux/canva.desktop" "$applications/Canva.desktop"

update-desktop-database "$applications" 2>/dev/null || true
echo "Installed. Launch Canva from the app launcher or run: canva"
