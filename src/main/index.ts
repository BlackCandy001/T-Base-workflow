import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { writeFile, readFile } from 'fs/promises'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { setupServer } from './server'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Start internal AI server
  await setupServer()

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('save-project', async (_, data) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
      defaultPath: 'project.json'
    })
    if (canceled || !filePath) return false;
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  })

  ipcMain.handle('load-project', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    })
    if (canceled || filePaths.length === 0) return null;
    const content = await readFile(filePaths[0], 'utf-8');
    return JSON.parse(content);
  })

  // Silent save/load for auto-save and initial state
  const getAutoSavePath = () => join(app.getPath('userData'), 'autosave.json');

  ipcMain.handle('save-project-silent', async (_, data) => {
    try {
      await writeFile(getAutoSavePath(), JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (e) {
      console.error('Silent save failed:', e);
      return false;
    }
  })

  ipcMain.handle('load-project-silent', async () => {
    try {
      const content = await readFile(getAutoSavePath(), 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      // It's okay if file doesn't exist on first run
      return null;
    }
  })

  // Zen Storage handlers
  const getStoragePath = (key: string) => join(app.getPath('userData'), `storage_${key.replace(/[^a-z0-9]/gi, '_')}.json`);
  
  ipcMain.handle('storage-get', async (_, key) => {
    try {
      const content = await readFile(getStoragePath(key), 'utf-8');
      return JSON.parse(content).value;
    } catch (e) {
      return null;
    }
  })

  ipcMain.handle('storage-set', async (_, key, value) => {
    try {
      await writeFile(getStoragePath(key), JSON.stringify({ value }, null, 2), 'utf-8');
      return true;
    } catch (e) {
      return false;
    }
  })

  ipcMain.handle('get-system-info', async () => {
    return {
      platform: process.platform,
      arch: process.arch,
      version: app.getVersion(),
      electronVersion: process.versions.electron
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
