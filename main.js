var path = require('path');
var fs = require('fs');
try{
if (require('electron-squirrel-startup')) return;
}catch(err){
  console.log(err)
}
const handleSquirrelEvent = require('./squirrelEventHandler').handleSquirrelEvent;
const electron = require('electron')
// Module to control application life.

const app = electron.app
// this should be placed at top of main.js to handle setup events quickly
if (handleSquirrelEvent(app)) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  return;
}


const {dialog} = electron;
const Menu = electron.Menu;
const MenuItem = electron.MenuItem;
const Tray = electron.Tray;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
console.log('platform: ',process.platform);


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

var shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
  // 当另一个实例运行的时候，这里将会被调用，我们需要激活应用的窗口
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
  return true;
});

// 这个实例是多余的实例，需要退出
if (shouldQuit) {
  app.quit();
  return;
}

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({icon:`${__dirname}/AppIcon64px.png`,width: 1000, height: 700,minWidth:850 ,minHeight:600})

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
    dialog.showMessageBox(mainWindow, {
      type: 'question',
      message: '请问您想要的操作是?',
      buttons: ['关闭程序', '后台运行','取消'],
      title: 'DataUploader',
      defaultId:1,
      cancelId:2,
    }, function (buttonIndex) {
      if(buttonIndex == 0){
        app.quit();
      }
      if(buttonIndex == 1){
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
      }
    })
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
