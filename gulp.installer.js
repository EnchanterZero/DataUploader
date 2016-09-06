var gulp = require('gulp');
//var winInstaller = require('electron-windows-installer');
var winInstaller = require('electron-winstaller');

var options = {
  appDirectory: `${__dirname}\\release\\GenoDataUploader-win32-x64`,
  outputDirectory: `${__dirname}\\release\\installer\\GenoDataUploader-win32-x64`,
  arch: 'x64',
  authors: "CuraCloudCorp",
  iconUrl: "https://www.curacloudcorp.com/favicon.ico",
  setupIcon:`${__dirname}\\AppIcon.ico`,
}
// winInstaller(options)
// .then((e) => {
//   if(e){console.log(e);return;}
//   console.log(`Successfully created package at ${options.outputDirectory}`)
// });
winInstaller.createWindowsInstaller(options)
.then(() => console.log(`Successfully created package at ${options.outputDirectory}`), (e) => console.log(`No dice: ${e.message}`))

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