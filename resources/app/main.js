const { app, BrowserWindow } = require('electron')

const createWindow = () => new BrowserWindow({
  width: 830,
  height: 680,
  autoHideMenuBar: true,
  webPreferences: {
    nodeIntegration: true,
    contextIsolation: false
  }
}).loadFile('index.html')

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow())
})

if (process.platform !== 'darwin') app.on('window-all-closed', () => app.quit())
