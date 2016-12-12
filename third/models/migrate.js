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
const Article = models.Article;

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
            title : "SQL注入研究---" + (i+1),
            content : `<p>这是文章${i}内容</p>`
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
    console.log("over");
    process.exit(0);
}).catch((err) => {
    console.error(err);
});