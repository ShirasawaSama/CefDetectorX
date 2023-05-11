const { app, BrowserWindow, ipcMain } = require('electron')

ipcMain.handle('has-args', (_, arg) => app.commandLine.hasSwitch(arg))
ipcMain.handle('get-app-icon', (_, path) => app.getFileIcon(path).then(icon => icon.toPNG().toString('base64'), () => ''))

const createWindow = () => {
  const window = new BrowserWindow({
    width: 1414,
    height: 880,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })
  
  //关闭窗口菜单，而不是仅仅隐藏
  window.setMenu(null)
  
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  window.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow())
})

if (process.platform !== 'darwin') app.on('window-all-closed', () => app.quit())
