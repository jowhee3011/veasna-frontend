// Electron shell for the Veasna frontend.
//
// This file is .mjs rather than .js on purpose: it uses ESM `import`, but the
// package has no "type": "module", so Electron would otherwise load it as
// CommonJS and fail to parse.

import { app, BrowserWindow } from 'electron';
// import path from 'path';

const DEV_URL = process.env.VEASNA_URL ?? 'http://localhost:3001';

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0d1f23',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadURL(DEV_URL);

  // For production, use this instead:
  // win.loadFile(path.join(__dirname, '../out/index.html'));
}

app.whenReady().then(() => {
  createWindow();

  // macOS keeps the app alive with no windows; re-open one on dock click.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
