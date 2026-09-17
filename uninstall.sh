#!/bin/bash
# Remove Canva installed by install.sh. Sign-in data in ~/.config/Canva is kept
# unless --purge is given.

set -uo pipefail

applications="$HOME/.local/share/applications"

rm -rf "$HOME/.local/share/canva-linux"
rm -f "$HOME/.local/bin/canva" "$HOME/.local/share/icons/hicolor/256x256/apps/canva-linux.png"
rm -f "$applications/Canva.desktop"

# Forget this app as the handler for canva:// links.
mimeapps="${XDG_CONFIG_HOME:-$HOME/.config}/mimeapps.list"
[[ -f $mimeapps ]] && sed -i '/^x-scheme-handler\/canva=/d' "$mimeapps"

if [[ -f $applications/Canva.desktop.webapp.bak ]]; then
  mv "$applications/Canva.desktop.webapp.bak" "$applications/Canva.desktop"
  echo "Restored the Omarchy Canva web app"
fi

[[ ${1:-} == --purge ]] && rm -rf "$HOME/.config/Canva"
echo "Uninstalled Canva"
