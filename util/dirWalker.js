var fs = require('fs');

/* 

 递归处理文件,文件夹 

 path 路径 
 floor 层数 
 handleFile 文件,文件夹处理函数 

 */

function walk(path, floor, handleFile) {
  handleFile(path, floor);
  floor++;
  var files = fs.readdirSync(path);
  files.forEach(function (item) {
    var tmpPath = path + '/' + item;
    var stats = fs.statSync(tmpPath)
    if (stats.isDirectory()) {
      walk(tmpPath, floor, handleFile);
    } else {
      handleFile(tmpPath, floor);
    }
  });
}

exports.walk = walk;  