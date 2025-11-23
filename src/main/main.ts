import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { setupIpcHandlers } from './ipc/handlers';
import { initDatabase } from '../database/init';

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    frame: true, // Use native Windows frame
    titleBarStyle: 'default', // Use default Windows title bar
    fullscreenable: true, // Enable fullscreen toggle
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
    title: 'TU Scheduler - Tubman University',
    icon: app.isPackaged ? path.join(process.resourcesPath, 'icon.ico') : path.join(__dirname, '../../build/icon.ico'),
    backgroundColor: '#f3f4f6',
    show: true,
    autoHideMenuBar: true, // Hide menu bar for cleaner look
  });

  // Show window when ready to prevent flashing
  // mainWindow.once('ready-to-show', () => {
  //   mainWindow?.show();
  // });

  // Add fullscreen toggle keyboard shortcut (F11)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11' && input.type === 'keyDown') {
      if (mainWindow) {
        mainWindow.setFullScreen(!mainWindow.isFullScreen());
      }
    }
  });

  // Load the app
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    // In development, try common Vite ports
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      mainWindow?.loadURL('http://localhost:5174').catch(() => {
        mainWindow?.loadURL('http://localhost:5175').catch(() => {
          mainWindow?.loadURL('http://localhost:5176').catch(() => {
            mainWindow?.loadURL('http://localhost:5177').catch(() => {
              mainWindow?.loadURL('http://localhost:5178');
            });
          });
        });
      });
    });
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

// App lifecycle
app.whenReady().then(async () => {
  // Initialize database
  await initDatabase();

  // Setup IPC handlers
  setupIpcHandlers();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});
