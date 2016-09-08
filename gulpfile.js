var gulp = require('gulp');
var exec = require('child_process').exec;
var os = require('os');
//var order = require('gulp-order');
//var inject = require('gulp-inject');
var replace = require('gulp-replace');
var concat = require('gulp-concat');
var path = require('path');

var destPath = path.join(__dirname, 'src/app');

var miningLibFiles = [
  path.join(__dirname, 'src/lib/jquery/dist/jquery.js'),
  path.join(__dirname, 'src/lib/bootstrap/dist/js/bootstrap.js'),
  path.join(__dirname, 'src/lib/lodash/dist/lodash.js'),
  path.join(__dirname, 'src/lib/angular/angular.js.js'),
  path.join(__dirname, 'src/lib/angular-bootstrap/ui-bootstrap-tpls.js'),
  path.join(__dirname, 'src/lib/angular-ui-router/release/angular-ui-router.js'),
];
var miningCustomFiles = [
  path.join(__dirname, 'src/app/app.js'),
  path.join(__dirname, 'src/app/utils/*.js'),
  path.join(__dirname, 'src/app/modules/*.js'),
  path.join(__dirname, 'src/app/services/*.js'),
  path.join(__dirname, 'src/app/controllers/*.js'),
];
var miningCustomFilesOrder = [
  path.join(__dirname, 'src/app/modules/*.js'),
  path.join(__dirname, 'src/app/services/*.js'),
  path.join(__dirname, 'src/app/controllers/*.js'),
];

gulp.task('concat_lib_js', function () {
  gulp.src(miningLibFiles)
  .pipe(concat("lib.js"))//合并
  .pipe(gulp.dest(destPath));
});

gulp.task('concat_custom_js', function () {
  gulp.src(miningCustomFiles)
  .pipe(concat("build.js"))//合并
  .pipe(replace("require('../../../dist", "require('../../dist"))
  .pipe(gulp.dest(destPath));
});

gulp.task('buildapp',function (cb){
  exec("babel app -d dist",function(err,stdout,stderr) {
    if (err) return cb(err); // 返回 error
    console.log(stdout);
    console.log(stderr);
    cb();
  });
});
gulp.task('pack-win',['buildapp','concat_custom_js'], function (cb) {
  // pack 'Linux' on Linux, 'Darwin' on OS X and 'Windows_NT' on Windows.
  var icon = path.resolve(path.join(__dirname,'AppIcon.ico'));
  if(os.type() == 'Windows_NT'){
    exec(`electron-packager . DataUploader --out=release --prune --asar --version=1.3.2 --platform=win32 --arch=x64 --asar.unpack='*.node' --icon='${icon}' --ignore=node_modules\\.bin --ignore=.git --ignore='node_modules\\electron-*' --overwrite`,function(err1,stdout1,stderr1) {
    if (err1) return cb(err1); // 返回 error
    console.log(stderr1);
    console.log(stdout1);
      exec(`${path.resolve(path.join('tools','rcedit','rcedit.exe'))} ${path.resolve(path.join('release','DataUploader-win32-x64','DataUploader.exe'))} --set-icon ${icon} `,
      function(err2,stdout2,stderr2){
      if (err2) return cb(err2); // 返回 error
      console.log(stderr2);
      console.log(stdout2);
      cb() // 完成 task
    })
  });
}else{
  console.log('You need run this task on win!',os.type());
  return cb(new Error(`Wrong platform: ${os.type()}`));
}
});

gulp.task('get-win-installer',['pack-win'], function (cb) {
  if(os.type() == 'Windows_NT'){
    exec("node gulp.installer",function(err,stdout,stderr) {
    if (err) return cb(err); // 返回 error
    console.log(stdout);
    console.log(stderr);
    cb();
  });
}
});

gulp.task('default', [/*'concat_lib_js',*/'concat_custom_js']);