/**
 * 数据库创建文件
 *
 * @Author bian
 * @CreateDate 2016.11.28
 */
const db = require("./");
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

function *init(){
    yield UserSeed();
}


co(function *(){
    yield db.sync({force:true});
    yield init();
    process.exit(0);
}).catch((err) => {
    console.error(err);
});