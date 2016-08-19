var gulp = require('gulp');
var concat = require('gulp-concat');
var path = require('path');

var destPath = path.join(__dirname,'src/app');

var miningLibFiles = [
  path.join(__dirname,'src/lib/jquery/dist/jquery.js'),
  path.join(__dirname,'src/lib/bootstrap/dist/js/bootstrap.js'),
  path.join(__dirname,'src/lib/lodash/dist/lodash.js'),
  path.join(__dirname,'src/lib/angular/angular.js.js'),
  path.join(__dirname,'src/lib/angular-bootstrap/ui-bootstrap-tpls.js'),
  path.join(__dirname,'src/lib/angular-ui-router/release/angular-ui-router.js'),
];
var miningCustomFiles = [
  path.join(__dirname,'src/app/**/*.js'),
  //path.join(__dirname,'src/app/controllers/*.js'),
  //path.join(__dirname,'src/app/services/*.js'),
];

gulp.task('concat_lib_js', function () {
  gulp.src(miningLibFiles)
  .pipe(concat("lib.js"))//合并
  .pipe(gulp.dest(destPath));
});

gulp.task('concat_custom_js', function () {
  gulp.src(miningCustomFiles)
  .pipe(concat("build.js"))//合并
  .pipe(gulp.dest(destPath));
});

gulp.task('default',['concat_lib_js','concat_custom_js']);