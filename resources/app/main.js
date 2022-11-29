const { app, BrowserWindow } = require('electron')

const createWindow = () => {
  const window = new BrowserWindow({
    width: 830,
    height: 680,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  window.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow())
})

if (process.platform !== 'darwin') app.on('window-all-closed', () => app.quit())
