var gulp = require('gulp');
var winInstaller = require('electron-windows-installer');
 
winInstaller({
	appDirectory: 'd:\\GenoDataUploader-win32-x64',
	outputDirectory: 'd:\\release',
	arch: 'x64',
	authors: "CuraCloudCorp",
	iconUrl: "https://www.curacloudcorp.com/favicon.ico",
}).then((e) => {console.log(e)} );

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