var path = require('path');
var fs = require('fs');

const electron = require('electron')
// Module to control application life.
const app = electron.app
const Menu = electron.Menu;
const MenuItem = electron.MenuItem;
const Tray = electron.Tray;
console.log('platform: ',process.platform);

//initConfig(app);

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.

  mainWindow = new BrowserWindow({icon:`${__dirname}/AppIcon64px.png`,width: 1200, height: 768})

  // and load the index.html of the app.
  //mainWindow.loadURL(`file://${__dirname}/src/app/index.html`)
  mainWindow.loadURL(`file://${__dirname}/src/app/index.html`)

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('close', function (event) {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    //mainWindow = null
    //event.returnValue = false;
    event.preventDefault();
    mainWindow.hide();
    appIcon = new Tray(`${__dirname}/AppIcon16px.png`);
    var contextMenu = new Menu();
    contextMenu.append(new MenuItem({ label: '显示窗口', click: function() { mainWindow.show();appIcon.destroy() } }));
    contextMenu.append(new MenuItem({ label: '关闭应用', click: function() { appIcon.destroy();mainWindow.destroy();app.quit() } }));
    appIcon.setContextMenu(contextMenu);
    appIcon.setToolTip('DataUploader');
    if(process.platform == 'darwin'){
      appIcon.on('right-click',function (event) {
        mainWindow.show();
        appIcon.destroy()
      })
    }else{
      appIcon.on('click',function (event) {
        mainWindow.show();
        appIcon.destroy()
      })
    }
  })
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    //mainWindow = null
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
  // if (process.platform !== 'darwin') {
  //   app.quit()
  // }
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
app.on('before-quit', function () {
  console.log('before quit!!!!!!');
  mainWindow.destroy();
})


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
