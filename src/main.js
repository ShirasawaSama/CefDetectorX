const { app, BrowserWindow, ipcMain } = require('electron')

ipcMain.handle('has-args', (_, arg) => app.commandLine.hasSwitch(arg))
ipcMain.handle('get-app-icon', (_, path) => app.getFileIcon(path).then(icon => icon.toPNG().toString('base64'), () => ''))

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
