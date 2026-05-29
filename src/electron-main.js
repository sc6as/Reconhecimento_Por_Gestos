const { app, BrowserWindow, shell } = require('electron');
const { exec } = require('child_process');

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.loadURL('http://localhost:5173');
}

app.whenReady().then(createWindow);