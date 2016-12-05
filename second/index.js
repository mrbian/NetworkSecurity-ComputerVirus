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

const debug = require("./instances/debug");

const router = require("./router/");

var pkg = require("../package.json");
var port = pkg.port;
var proxyPort = pkg.proxyPort;

app.use(serve(__dirname + '/../public'));

app.use(koaBody);

app.use(views(__dirname + "/views", {
    map: {
        html: "ejs"
    }
}));

app
    .use(router.routes())
    .use(router.allowedMethods());

const server = http.createServer(app.callback());
server.listen(port,() => {
    var url = util.format('http://%s:%d', 'localhost', proxyPort);
    // gvfs-open http://localhost
    // open(url);
});