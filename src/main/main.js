const { app, BrowserWindow, Menu, Notification, session, shell } = require('electron')
const fs = require('fs')
const path = require('path')

const HOME_URL = 'https://www.canva.com/'

// Sign-in providers. Their pop-ups must stay inside the app, attached to the
// window that opened them, or the login cannot hand its result back to Canva.
const AUTH_HOSTS = [
  'accounts.google.com',
  'appleid.apple.com',
  'www.facebook.com',
  'm.facebook.com',
  'login.microsoftonline.com',
  'login.live.com',
  'clever.com',
]

// Pop-ups keep this title so a window manager rule can float them.
const POPUP_TITLE = 'Canva sign-in'

app.setName('Canva')

let mainWindow = null

function hostOf(url) {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

function isCanva(url) {
  const host = hostOf(url)
  return host === 'canva.com' || host.endsWith('.canva.com')
}

function isAuth(url) {
  const host = hostOf(url)
  return AUTH_HOSTS.some((h) => host === h || host.endsWith('.' + h))
}

// Canva and Google refuse or degrade for browsers that announce themselves as
// Electron, so present the plain Chrome user agent Electron is built on.
function chromeUserAgent() {
  return app.userAgentFallback
    .replace(/\sElectron\/\S+/, '')
    .replace(new RegExp(`\\s${app.getName()}/\\S+`, 'i'), '')
}

// Decide where a request for a new window should go. Real pop-ups (window.open
// with a size, which Canva uses for sign-in and connecting other apps) open as
// child windows, so they can report back to the page that opened them. New-tab
// links to Canva load in the window they came from, sign-in pages open as
// pop-ups, and everything else goes to the default browser.
function routeNewWindow(contents, url, disposition) {
  if (disposition === 'new-window' || isAuth(url)) return 'popup'
  if (isCanva(url)) {
    contents.loadURL(url)
    return 'deny'
  }
  if (!url || url === 'about:blank') return 'blank'
  if (/^https?:|^mailto:/.test(url)) shell.openExternal(url)
  return 'deny'
}

// Pick a free name in the Downloads folder: "Design.png", then "Design (1).png".
function downloadPath(filename) {
  const dir = app.getPath('downloads')
  const ext = path.extname(filename)
  const base = path.basename(filename, ext)
  let candidate = path.join(dir, filename)
  for (let i = 1; fs.existsSync(candidate); i++) {
    candidate = path.join(dir, `${base} (${i})${ext}`)
  }
  return candidate
}

// Save exports straight to Downloads instead of asking every time, and say
// where the file went when it finishes.
function handleDownloads() {
  session.defaultSession.on('will-download', (_event, item) => {
    const savePath = downloadPath(item.getFilename())
    item.setSavePath(savePath)

    item.once('done', (_e, state) => {
      if (state === 'completed') {
        const note = new Notification({ title: 'Canva download complete', body: path.basename(savePath) })
        note.on('click', () => shell.showItemInFolder(savePath))
        note.show()
      } else if (state === 'interrupted') {
        new Notification({ title: 'Canva download failed', body: item.getFilename() }).show()
      }
    })
  })
}

function attachHandlers(win) {
  const contents = win.webContents

  contents.setWindowOpenHandler(({ url, disposition, features }) => {
    if (process.env.CANVA_DEBUG) console.log('window.open', JSON.stringify({ url, disposition, features }))
    const route = routeNewWindow(contents, url, disposition)
    if (route === 'deny') return { action: 'deny' }
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        parent: win,
        width: 580,
        height: 720,
        show: route === 'popup',
        title: POPUP_TITLE,
      },
    }
  })

  // A blank pop-up is a placeholder the page fills in afterwards. Send its first
  // real address through the same routing, then drop the placeholder.
  contents.on('did-create-window', (child) => {
    attachHandlers(child)
    child.on('page-title-updated', (event) => event.preventDefault())
    if (child.isVisible()) return
    child.webContents.once('will-navigate', (event, url) => {
      if (isAuth(url)) {
        child.show()
        return
      }
      event.preventDefault()
      routeNewWindow(contents, url)
      child.destroy()
    })
    // Never leave an invisible window behind if nothing navigates it.
    setTimeout(() => {
      if (!child.isDestroyed() && !child.isVisible()) child.destroy()
    }, 10000)
  })

  // There is no menu bar, so the few browser shortcuts worth keeping live here.
  // Everything else (including Ctrl+Plus/Minus, which Canva uses for zoom)
  // goes to the page.
  contents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return
    const history = contents.navigationHistory
    const key = input.key
    let handled = true

    if (input.alt && key === 'ArrowLeft' && history.canGoBack()) history.goBack()
    else if (input.alt && key === 'ArrowRight' && history.canGoForward()) history.goForward()
    else if (key === 'F5' || (input.control && !input.shift && key.toLowerCase() === 'r')) contents.reload()
    else if (input.control && input.shift && key.toLowerCase() === 'r') contents.reloadIgnoringCache()
    else if (key === 'F12' || (input.control && input.shift && key.toLowerCase() === 'i')) contents.toggleDevTools()
    else handled = false

    if (handled) event.preventDefault()
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'Canva',
    icon: path.join(__dirname, '../../resources/canva.png'),
    webPreferences: {
      spellcheck: true,
    },
  })

  attachHandlers(mainWindow)
  if (process.env.CANVA_DEBUG) {
    mainWindow.webContents.on('did-navigate', (_e, url) => console.log('navigated', url))
    mainWindow.webContents.on('did-navigate-in-page', (_e, url) => console.log('in-page', url))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  const startUrl = process.argv.find((arg) => isCanva(arg)) || HOME_URL
  mainWindow.loadURL(startUrl)
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  // Launching Canva again focuses the open window instead of starting another.
  app.on('second-instance', (_event, argv) => {
    if (!mainWindow) return createWindow()
    const url = argv.find((arg) => isCanva(arg))
    if (url) mainWindow.loadURL(url)
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })

  // No File/Edit/View menu bar; it doesn't match the desktop around it.
  Menu.setApplicationMenu(null)

  app.whenReady().then(() => {
    app.userAgentFallback = chromeUserAgent()
    // When a Canva account is set to open links in the desktop app, canva.com
    // hands off with a canva:// link and waits. Nothing handles that on Linux
    // (the system would pass it to the browser), so refuse it and take Canva's
    // own "Continue in browser" route instead.
    session.defaultSession.setPermissionRequestHandler((contents, permission, callback, details) => {
      if (process.env.CANVA_DEBUG) console.log('permission', permission, JSON.stringify(details))
      if (permission !== 'openExternal' || !/^canva:/i.test(details.externalURL || '')) return callback(true)
      callback(false)
      const url = new URL(details.requestingUrl || contents.getURL())
      if (isCanva(url.href) && !url.searchParams.has('continue_in_browser')) {
        url.searchParams.set('continue_in_browser', 'true')
        contents.loadURL(url.href)
      }
    })
    handleDownloads()
    createWindow()
  })

  app.on('window-all-closed', () => app.quit())
}
