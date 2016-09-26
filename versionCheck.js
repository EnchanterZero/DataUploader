/**
 * Created by intern07 on 16/9/26.
 */
const versionInfoUrl = "https://www.curacloudplatform.com/download/datauploader/versionInfo.json";
const downloadUrl = "https://www.curacloudplatform.com/download/datauploader";
var request = require('request');
var path = require('path');
var fs = require('fs');
var open = require('open');
var checkVersion = function (app,dialog) {
  request(versionInfoUrl, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var versionInfo =  JSON.parse(body)['version-info'];
      var packageJsonObj = JSON.parse(fs.readFileSync(path.join(__dirname,'package.json')));
      var appVersion = packageJsonObj.version;
      var appVersionValue = packageJsonObj['version-value'];
      versionInfo.sort(function (next,pre) {
        if(next.value > pre.value)
          return 1;
        else return -1;
      });
      var latest = versionInfo[versionInfo.length-1];
      console.log(latest,appVersionValue);
      if(latest.value > appVersionValue) {
        var message = `检测到新版本${latest.version},请打开下载地址下载最新版安装包,并重新安装新版本软件`;
        console.log(message);
        showUpdateInfo(app,dialog,message);
      }
      
    }
  })
}
function showUpdateInfo(app,dialog,message) {
  try{
    var buttonIndex = dialog.showMessageBox({
      type: 'info',
      message: message,
      buttons: ['退出并打开下载地址'],
      title: 'DataUploader',
      defaultId:1
    });
    open(downloadUrl);
    app.quit();
  }catch(err){
    app.on('ready',function () {
      var buttonIndex = dialog.showMessageBox({
        type: 'message',
        message: message,
        buttons: ['打开下载地址并退出'],
        title: 'DataUploader',
        defaultId:0
      });
      open(downloadUrl);
      app.quit();
    })
  }
  
}
exports.checkVersion = checkVersion;