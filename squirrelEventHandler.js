function handleSquirrelEvent(app) {
  if (process.argv.length === 1) {
    return false;
  }

  const ChildProcess = require('child_process');
  const fs = require('fs');
  const os = require('os');
  const path = require('path');

  const appFolder = path.resolve(process.execPath, '..');
  const desktop = path.resolve(os.homedir(),'Desktop');
  const rootAtomFolder = path.resolve(appFolder, '..');
  const appicon = path.resolve(path.join(rootAtomFolder,'app.ico'));
  const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
  const exeName = path.basename(process.execPath);

  var d = (new Date()).toUTCString();
  console.log('rootAtomFolder:',rootAtomFolder)
  console.log('updateDotExe:',updateDotExe)
  console.log('exeName:',exeName)
  var s = `${d}: rootAtomFolder-->${rootAtomFolder},`+
  `appicon-->${appicon},`+
  `updateDotExe-->${updateDotExe},`+
  `exeName-->${exeName}`;
  fs.appendFileSync(path.resolve(path.join(rootAtomFolder,'run.log')),s);

  const spawn = function(command, args) {
    let spawnedProcess, error;

    try {
      spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
    } catch (error) {};
    return spawnedProcess;
  };

  const install = function(done){
    var child = spawn(updateDotExe, ['-i',appicon,'--createShortcut', exeName]);
    child.on('close',(code)=>{
      fs.renameSync(path.resolve(path.join(desktop,'Electron.lnk')), path.resolve(path.join(desktop,`${path.basename(exeName, '.exe')}.lnk`)));
      done();
    })
    
    return child;
  }
  const uninstall = function(done){
    var child = spawn(updateDotExe, ['--removeShortcut', exeName]);
    child.on('close',(code)=>{
      //spawn()
      done();
    })
  }

  const squirrelEvent = process.argv[1];
  console.log('got squirrelEvent:',squirrelEvent)
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      // Optionally do things such as:
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //   explorer context menus

      //

      // Install desktop and start menu shortcuts
      install(app.quit);

      //setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-uninstall':
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers

      // Remove desktop and start menu shortcuts
      uninstall(app.quit)

      //setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-obsolete':
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated

      app.quit();
      return true;
  }
};

exports.handleSquirrelEvent = handleSquirrelEvent;