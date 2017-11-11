/**
 * @file Gulp File
 * @author BenzLeung(https://github.com/BenzLeung)
 * @date 2017/2/4
 * Created by JetBrains PhpStorm.
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

var gulp = require('gulp');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var replace = require('gulp-replace');
var bump = require('gulp-bump');

gulp.task('uglify', function () {
    gulp.src([
        './lib/amrnb.js',
        './src/benz-amr-recorder.js'
    ])
        .pipe(uglify())
        .pipe(rename('benzAmrRecorder.min.js'))
        .pipe(gulp.dest('.'));
});

gulp.task('bump', function () {
    var date = new Date();
    gulp.src([
        'package.json',
        './src/benz-amr-recorder.js'
    ])
        .pipe(bump())
        .pipe(replace(/@date ([0-9\/]+)/, '@date ' + date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate()))
        .pipe(gulp.dest('.'));
});

gulp.task('default', ['uglify', 'bump']);
