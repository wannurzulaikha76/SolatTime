const { app, BrowserWindow } = require('electron');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

  app.on('activate', () => { // tell electron what to do when app is activated
    if (BrowserWindow.getAllWindows().length == 0) createWindow(); // num of windows = 0, create new app window. else, does not create another window
  });

app.on('window-all-closed', () => { // close electron, proper app closing behaviour despite diff os
  if (process.platform != 'darwin') app.quit(); // darwin for macOS, app doesnt quit auto. windows (win32) & linux automatic app quits. 
});
