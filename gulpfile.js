/**
 * 自动化脚本
 *
 * @Author bian
 * @CreateDate 2016.12.4
 */

"use strict";

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const spawn = require('child_process').spawn;

const gulp = require("gulp");
const colors = require("colors");
colors.setTheme({
    silly: 'rainbow',
    input: 'grey',
    verbose: 'cyan',
    prompt: 'grey',
    info: 'green',
    data: 'grey',
    help: 'cyan',
    warn: 'yellow',
    debug: 'blue',
    error: 'red'
});
const gutil = require("gulp-util");
const runSequence = require("run-sequence");
var browserSync = require('browser-sync').create();
var sass = require("gulp-ruby-sass");
var filter = require('gulp-filter');
var reload = browserSync.reload;

const dirName = require("./config").dirName;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function testDirExist(dirPath){
    try{
        fs.statSync(dirPath);
        return true;
    }catch(err){
        return false;
    }
}

var curName
    ,lastName;

/**
 *
 * 拷贝上一次的工程文件到新文件夹内继续工作
 */
gulp.task('continue', (done) => {
    var arr = fs.readdirSync(path.join(__dirname, "./"))
        .filter((e) => {
            return dirName.indexOf(e) !== -1;
        }).sort((a, b) => {
            return dirName.indexOf(a) - dirName.indexOf(b);
        });
    if(dirName.length <= arr.length){
        console.error("已超出数组长度".error);
    }
    lastName = dirName[arr.length];
    curName = arr[arr.length - 1];

    rl.question(`create ${lastName} directory?(yes/no)`.info, (answer) => {
        if(answer === "yes" || answer === "y"){
            fs.mkdirSync(path.join(__dirname,`${lastName}`));
            gulp
                .src(`${curName}/**/*.{js,html,css,scss,sass}`)
                .pipe(gulp.dest(`${lastName}/`));
        }else{
            curName = arr[arr.length - 2];
        }
        rl.close();
        done();
    });
});

gulp.task('serve', ['sass'], function() {

    const nodeServer = spawn("npm",["run","dev"]);

    nodeServer.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    nodeServer.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
    });

    nodeServer.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });

    browserSync.init({
        proxy: "http://localhost:3010",
        port : 3030
    });

    gulp.watch("**/*.scss", ['sass']);
    gulp.watch("**/*.html").on('change', reload);
});

gulp.task('sass', function () {
    return sass("**/*.scss",{sourcemap: false})
        .pipe(gulp.dest("public/dist/")) // Write the CSS
        .pipe(filter('**/*.css')) // Filtering stream to only css files
        .pipe(browserSync.reload({stream:true}));
});

gulp.task("default",["serve"]);