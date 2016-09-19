function handleSquirrelEvent(app,dialog) {
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

  console.log('rootAtomFolder:',rootAtomFolder)
  console.log('updateDotExe:',updateDotExe)
  console.log('exeName:',exeName)
  var s = `[${(new Date()).toUTCString()}]: process.execPath-->${process.execPath},`+
  `rootAtomFolder-->${rootAtomFolder},`+
  `appicon-->${appicon},`+
  `updateDotExe-->${updateDotExe},`+
  `exeName-->${exeName}`;
  fs.appendFileSync(path.resolve(path.join(rootAtomFolder,'run.log')),`${s} `+'\n');

  const spawn = function(command, args) {
    let spawnedProcess, error;

    try {
      spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
    } catch (error) {};
    return spawnedProcess;
  };

  const install = function(done){
    // var child = spawn(updateDotExe, ['-i',appicon,'--createShortcut', exeName]);
    // child.on('close',(code)=>{
    //   fs.appendFileSync(path.resolve(path.join(rootAtomFolder,'run.log')),`[${(new Date()).toUTCString()}]: desktop icon added `+'\n');
    //   var a = path.resolve(path.join(desktop,'Electron.lnk'));
    //   var b = path.resolve(path.join(desktop,`${path.basename(exeName, '.exe')}.lnk`))
    //   fs.appendFileSync(path.resolve(path.join(rootAtomFolder,'run.log')),`[${(new Date()).toUTCString()}]: rename ${a}-->${b} `+'\n');
    //   //fs.renameSync(a,b);
    //   fs.symlinkSync(process.execPath, b);
    //   done();
    // })
    var b = path.resolve(path.join(desktop,`${path.basename(exeName, '.exe')}`))
    fs.lstat(b,(err,stat) =>{
      if(err){
        fs.appendFileSync(path.resolve(path.join(rootAtomFolder,'run.log')),`[${(new Date()).toUTCString()}]: ERR-->${err.message} `+'\n');
      }
      else if(stat.isSymbolicLink()){
        fs.appendFileSync(path.resolve(path.join(rootAtomFolder,'run.log')),`[${(new Date()).toUTCString()}]: unlink. `+'\n');
        fs.unlinkSync(b);
      }
      fs.appendFileSync(path.resolve(path.join(rootAtomFolder,'run.log')),`[${(new Date()).toUTCString()}]: create new link on desktop. `+'\n');
      fs.symlinkSync(process.execPath, b);
      done();
    });
    return null;
    
    //return child;
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
  s = `[${(new Date()).toUTCString()}]: got squirrelEvent--> ${squirrelEvent}`;
  fs.appendFileSync(path.resolve(path.join(rootAtomFolder,'run.log')),`${s} `+'\n');
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
    case '--squirrel-firstrun':
      dialog.showMessageBox({
        type: 'info',
        message: '程序安装成功',
        buttons: ['确认'],
        title: 'DataUploader Installer',
      });
      app.quit();
      return true;
  }
};

exports.handleSquirrelEvent = handleSquirrelEvent;