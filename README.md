# Canva Desktop App for Linux

A lightweight Electron wrapper that runs the Canva web app as a simple desktop application on Linux. This project packages the web app into a Flatpak so you can run Canva in its own window with basic desktop integration.

## Features

- Runs Canva in a frameless Electron window
- Packaged for Flatpak for easy per-user installation
- Minimal wrapper to preserve the web experience while giving a native-like window

## Install on Arch / Omarchy (no Flatpak)

Runs on the newest `electronNN` package already on the system (install one with `omarchy pkg add electron` if none is present), natively on Wayland.

```bash
./install.sh     # app in ~/.local/share/canva-linux, `canva` in ~/.local/bin, launcher entry
./uninstall.sh   # remove it (add --purge to also delete sign-in data in ~/.config/Canva)
```

How windows behave:

- Canva links that would open a new tab or window load in the same Canva window.
- Google, Apple, Facebook and Microsoft sign-in open as a small pop-up titled "Canva sign-in".
- Other links open in your default browser.
- Starting Canva again focuses the running window. Alt+Left/Right go back and forward.

On Hyprland, float the sign-in pop-up with:

```lua
o.window({ class = "^canva$", title = "^Canva sign-in$" }, { float = true, center = true, size = { 520, 720 } })
```

## Flatpak (original)

## Requirements

- Flatpak installed on your system
- flatpak-builder installed (for building from the manifest)
- Network access so the embedded web app can load Canva

## Installation (Flatpak)

Build and install locally (per-user):

```bash
flatpak-builder --install --user build manifest.yaml
```

Notes:
- The `build/` directory will be created by flatpak-builder. Remove it to clean build artifacts.
- If the app-id is different from `com.vikdevelop.CanvaDesktop` check `manifest.yaml` for the correct ID and use that with `flatpak run`.

## Run

After installing the Flatpak, run:

```bash
flatpak run com.vikdevelop.CanvaDesktop
```

(Replace `com.vikdevelop.CanvaDesktop` with the `app-id` from `manifest.yaml` if necessary.)

## Uninstall

Remove the per-user Flatpak:

```bash
flatpak uninstall --user com.vikdevelop.CanvaDesktop
```

Remove build artifacts:

```bash
rm -rf build/ export/ repo/
```

## Development

- Edit `manifest.yaml` to change build/runtime settings.
- If there is an Electron main script and package.json in the repo, you can run locally after installing dependencies:

```bash
# in repo root (if package.json exists)
npm install
npx electron .
```

- To test packaging or changes, update manifest and rebuild with `flatpak-builder`.

## Troubleshooting

- App fails to load: confirm you can reach Canva in a browser and that you have network access.
- Check Flatpak logs for errors:

```bash
journalctl --user -xe
# or run flatpak with verbose logging where supported
```

- If the Flatpak build fails, check versions of Flatpak/flatpak-builder and logs printed by `flatpak-builder`.

## Contributing

Contributions are welcome. Suggested workflow:

1. Fork the repository.
2. Create a branch: `git checkout -b feat/improve-readme`
3. Make changes and test locally.
4. Push and open a pull request describing the change.

Please add a LICENSE file if you want to make contribution/licensing terms explicit.

## License
MIT. See LICENSE file.

---

Maintainer: vikdevelop
