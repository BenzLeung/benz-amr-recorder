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
var rollup = require('gulp-rollup');
var concat = require('gulp-concat');

gulp.task('roll', function () {
    gulp.src(['./lib/*.js', './src/*.js'])
        .pipe(rollup({
            "format": "iife",
            "plugins": [
                require("rollup-plugin-babel")({
                    "presets": [["es2015", { "modules": false }], "stage-0"],
                    "babelrc": false,
                    "plugins": ["external-helpers"]
                })
            ],
            "name": "BenzAMRRecorder",
            input: './src/BenzAMRRecorder.js'
        }))
        .pipe(rename('BenzAMRRecorder.js'))
        .pipe(gulp.dest('.'));
});

gulp.task('roll-uglify', ['roll'], function () {
    gulp.src(['./lib/amrnb.js', './BenzAMRRecorder.js'])
        .pipe(concat('BenzAMRRecorder.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('.'));
});

gulp.task('bump', function () {
    var date = new Date();
    gulp.src(['package.json'])
        .pipe(bump())
        .pipe(replace(/@date ([0-9\/]+)/, '@date ' + date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate()))
        .pipe(gulp.dest('.'));
});

gulp.task('default', ['roll-uglify']);
