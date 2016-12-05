/**
 * 路由文件
 *
 * @Author bian
 * @CreateDate 2016.12.5
 */
var router = require('koa-router')();
const debug = require("../instances/debug");
const db = require("../models/");
const models = db.models;
const User = models.User;
const Article = models.Article;


router.get("/article",function *(){
    var ctx = this;
    var query = ctx.request.query;
    var articleId = query.id || 1;
    // var data = yield Article.findOne({
    //     where : {
    //         id : articleId
    //     }
    // });
    debug("SQL",`select * from Articles where id = ${articleId}`);
    var data = yield db.query(`select * from Articles where id = ${articleId}`,{
        type: db.QueryTypes.SELECT
    });
    data = data.length !== 0 ? data[0] : {
        title : "没有这个文章",
        content :"<p>没有这个文章</p>"
    };
    // debug(data);
    yield ctx.render("index.html", data);
});

module.exports = router;