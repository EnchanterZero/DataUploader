var gulp = require('gulp');
var path = require('path');
var fs = require('fs');
var winInstaller = require('electron-windows-installer');
//var winInstaller = require('electron-winstaller');

var packageJsonObj=JSON.parse(fs.readFileSync('./package.json'));
console.log(__dirname);
var options = {
  exe: `${packageJsonObj.name}.exe`,
  title: `${packageJsonObj.name}`,
  appDirectory: `${__dirname}\\release\\${packageJsonObj.name}-win32-x64`,
  outputDirectory: `${__dirname}\\release\\installer\\${packageJsonObj.name}-win32-x64`,
  arch: 'x64',
  authors: "CuraCloudCorp",
  description: "",
  iconUrl: `${__dirname}\\AppIcon.ico`,
  setupIcon:`${__dirname}\\AppIcon.ico`,
  loadingGif: `${__dirname}\\loading.gif`,
  noMsi:true,
}
winInstaller(options)
.then((e) => {
  if(e){console.log(e);return;}
  console.log(`Successfully created package at ${options.outputDirectory}`)
});
//winInstaller.createWindowsInstaller(options)
//.then(() => console.log(`Successfully created package at ${options.outputDirectory}`), (e) => console.log(`No dice: ${e.message}`))

// var installer = require('electron-installer-windows')

// var options = {
//   src: 'release\\GenoDataUploader-win32-x64',
//   dest: 'release',
//   authors: ["CuraCloudCorp",],
//   description: "",
//   tags: [],

// }

// console.log('Creating package (this may take a while)')

// installer(options, function (err) {
//   if (err) {
//     console.error(err, err.stack)
//     process.exit(1)
//   }

//   console.log('Successfully created package at ' + options.dest)
// })