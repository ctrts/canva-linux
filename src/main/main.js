const { app, BrowserWindow, shell } = require('electron')
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

// Sign-in pop-ups keep this title so a window manager rule can float them.
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

// Decide where a link that asks for a new window should go. Canva pages load in
// the window they came from, sign-in pop-ups open as child windows, and
// everything else goes to the default browser.
function routeNewWindow(contents, url) {
  if (isAuth(url)) return 'popup'
  if (isCanva(url)) {
    contents.loadURL(url)
    return 'deny'
  }
  if (!url || url === 'about:blank') return 'blank'
  if (/^https?:|^mailto:/.test(url)) shell.openExternal(url)
  return 'deny'
}

function attachHandlers(win) {
  const contents = win.webContents

  contents.setWindowOpenHandler(({ url }) => {
    const route = routeNewWindow(contents, url)
    if (route === 'deny') return { action: 'deny' }
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        parent: win,
        width: 520,
        height: 720,
        show: route === 'popup',
        title: POPUP_TITLE,
        autoHideMenuBar: true,
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

  // Back and forward with Alt+Left/Right, as in a browser.
  contents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown' || !input.alt) return
    if (input.key === 'ArrowLeft' && contents.navigationHistory.canGoBack()) {
      contents.navigationHistory.goBack()
      event.preventDefault()
    } else if (input.key === 'ArrowRight' && contents.navigationHistory.canGoForward()) {
      contents.navigationHistory.goForward()
      event.preventDefault()
    }
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'Canva',
    icon: path.join(__dirname, '../../resources/com.github.vikdevelop.canvadesktop.png'),
    autoHideMenuBar: true,
    webPreferences: {
      spellcheck: true,
    },
  })

  attachHandlers(mainWindow)

  // Mouse back/forward buttons.
  mainWindow.on('app-command', (_event, command) => {
    const history = mainWindow.webContents.navigationHistory
    if (command === 'browser-backward' && history.canGoBack()) history.goBack()
    if (command === 'browser-forward' && history.canGoForward()) history.goForward()
  })

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

  app.whenReady().then(() => {
    app.userAgentFallback = chromeUserAgent()
    createWindow()
  })

  app.on('window-all-closed', () => app.quit())
}
