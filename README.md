# Canva for Linux

Canva in its own desktop window, without a browser around it. It runs on the Electron package from your distribution, natively on Wayland, so there is nothing to build.

Forked from [vikdevelop/canvadesktop](https://github.com/vikdevelop/canvadesktop).

## Install

You need an `electronNN` package (such as `electron43`) from the Arch repos. On Omarchy, install one with `omarchy pkg add electron` if none is present.

```bash
./install.sh
```

This copies the app to `~/.local/share/canva-linux`, adds a `canva` command to `~/.local/bin`, and adds Canva to the app launcher. If a Canva web app made with Omarchy's web app installer exists, it is kept as `Canva.desktop.webapp.bak` and restored on uninstall.

Launch Canva from the app launcher, or run `canva`.

## Uninstall

```bash
./uninstall.sh          # keeps your sign-in in ~/.config/Canva
./uninstall.sh --purge  # also deletes it
```

## How it behaves

- **One window.** Canva links that would open a new tab load in the Canva window. Starting Canva again focuses the running window.
- **Sign-in pop-ups.** Google, Apple, Facebook and Microsoft sign-in, and other pop-ups Canva opens, get a small window titled "Canva sign-in".
- **Other websites** open in your default browser.
- **Desktop app handoff.** If your Canva account is set to open links in the desktop app, the `canva://` handoff is skipped and Canva continues in the window.
- **Downloads** save straight to `~/Downloads` (with ` (1)` added if the name is taken). A notification shows the file name; click it to open the folder.
- **No menu bar.** Keyboard shortcuts: Alt+Left/Right go back and forward, F5 or Ctrl+R reloads (Ctrl+Shift+R skips the cache), F12 or Ctrl+Shift+I opens developer tools. All other keys go to Canva.

On Hyprland, float the sign-in pop-up with this rule:

```lua
o.window({ class = "^canva$", title = "^Canva sign-in$" }, { float = true, center = true, size = { 580, 720 } })
```

## Development

Run the copy in the repo instead of the installed one:

```bash
npm start
```

Set `CANVA_DEBUG=1` to log new windows, page navigations and permission requests to the terminal.

## License

MIT. See LICENSE.
