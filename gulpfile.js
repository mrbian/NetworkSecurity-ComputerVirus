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
                .src(`${curName}/**/*.{js,html,css}`)
                .pipe(gulp.dest(`${lastName}/`));
        }else{
            curName = arr[arr.length - 2];
        }
        rl.close();
        done();
    });
});