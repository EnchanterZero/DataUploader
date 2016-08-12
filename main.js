var path = require('path');
var fs = require('fs');

function ensureFolderExist(dir) {
  const parent = path.dirname(dir);
  if (!fs.existsSync(parent)) {
    ensureFolderExist(parent);
  }
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

let expressApp;
let expressListener;

function initExpress(electronApp) {
  const userData = app.getPath('userData');

  const config = require('./dist/config');
  config.dbConfig.storage = path.join(userData, 'db', 'database.sqlite');
  ensureFolderExist(path.dirname(config.dbConfig.storage));

  expressApp = require('./dist/app');
  let port = 30000;
  while (true) {
    try {
      expressListener = expressApp.listen(port);
      break;
    } catch (e) {
      port ++;
    }
  }
}

const electron = require('electron')
// Module to control application life.
const app = electron.app

initExpress(app);

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.

  mainWindow = new BrowserWindow({width: 1200, height: 768})

  // and load the index.html of the app.
  //mainWindow.loadURL(`file://${__dirname}/src/app/index.html`)
  console.log('expressListener.address()',expressListener.address().port);
  mainWindow.loadURL(`http://127.0.0.1:${expressListener.address().port}/index.html`)

  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  console.log('app is  activate!!!!!!');
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

app.on('quit', function () {
  console.log('app will quit!!!!!!');
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
