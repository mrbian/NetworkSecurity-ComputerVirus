/**
 * 数据库创建文件
 *
 * @Author bian
 * @CreateDate 2016.11.28
 */
const db = require("./index");
const co = require("co");
const models = db.models;
const User = models.User;

function * UserSeed(){
    console.info("UserSeed");
    for(var i = 0;i < 3; i++){
        yield User.create({
            account : "test" + i,
            password : "123456" + i
        });
    }
}

function * ArticleSeed(){
    console.info("ArticleSeed");
    for(var i=0;i < 10;i ++){
        yield Article.create({
            title : "文章" + i,
            content : `这是文章${i}内容`
        });
    }
}

function *init(){
    yield UserSeed();
    yield ArticleSeed();
}

co(function *(){
    yield db.sync({force:true});
    yield init();
    process.exit(0);
}).catch((err) => {
    console.error(err);
});