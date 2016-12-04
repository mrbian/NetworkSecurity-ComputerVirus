/**
 * 简单的koa服务器
 *
 * @Author bian
 * @CreateDate 2016.11.28
 * @Comment RUN By
 * DEBUG=sql supervisor -i README.md first/index
 */

const http = require("http");
const util = require("util");
const Koa = require("koa");
const open = require("open");
const app = Koa();
const serve = require("koa-static");
const views = require("koa-views");
const koaBody = require("koa-body")();

const debug = require("debug")("sql");

const db = require("./models/");
const models = db.models;
const User = models.User;

var pkg = require("../package.json");
var port = pkg.port;
var proxyPort = pkg.proxyPort;

app.use(serve(__dirname + '../public'));

app.use(koaBody);

app.use(views(__dirname + "/views", {
    map: {
        html: "ejs"
    }
}));

app.use(function *(){
    debug("render");
    var ctx = this;
    if(ctx.req.method === "GET"){
        yield ctx.render("index.html", {});
    }else{
        // or 1=1#
        var body = ctx.request.body;
        var account = body.account;
        var password = body.password;
        debug("account : ",account);
        debug("password : ",password);
        var user = yield db.query(`select * from Users where account ='${account}' and password='${password}'`,{
            type: db.QueryTypes.SELECT
        });
        debug(user);
        // var user = yield User.findOne({
        //     where : {
        //         account,
        //         password
        //     }
        // });
        if(user.length == 0){
            // yield ctx.render("index.html", {fail : true});
            ctx.body = "登录失败";
        }else{
            // yield ctx.render("index.html", { success : true});
            ctx.body = "登录成功";
        }
    }
});

const server = http.createServer(app.callback());
server.listen(port,() => {
    var url = util.format('http://%s:%d', 'localhost', proxyPort);
    // gvfs-open http://localhost
    // open(url);
});