## 计算机病毒与入侵关于SQL注入的研究（一）
### 写在前面
参考SQL注入攻击与防御一书以及百度资料相关介绍，下面给出SQL注入的定义和原理。
定义
> SQL注入攻击（SQL Injection），简称注入攻击，是Web开发中最常见的一种安全漏洞。可以用它来从数据库获取敏感信息，或者利用数据库的特性执行添加用户，导出文件等一系列恶意操作，甚至有可能获取数据库乃至系统用户最高权限。

原理
> 造成SQL注入的原因是因为程序没有有效过滤用户的输入，使攻击者成功的向服务器提交恶意的SQL查询代码，程序在接收后错误的将攻击者的输入作为查询语句的一部分执行，导致原始的查询逻辑被改变，额外的执行了攻击者精心构造的恶意代码。

从本质上来说，SQL注入和XSS注入很相似，都是因为没有做好对用户的输入控制而导致的错误。

经过考虑，我决定使用NodeJs来进行SQL注入的研究。
- 一是因为我查看网上资料时发现网上的SQL注入示例都是PHP代码编写，为了避嫌使用JavaScript。
- 二是我对PHP以前研究使用较少，而且近几年从StackOverflow标签热度来分析，可以看出PHP逐渐落寞，JavaScript借着NodeJs一飞冲天。
不仅是外国，就是在国内，阿里百度等国内互联网公司大部分新业务都开始使用NodeJS来做前后端分离和前端开发工具（虽然NodeJs可以用作后端开发，但是Java的Spring等作为老牌的，成熟稳定的框架，在大公司吃的开，用Node去做后端开发的大型项目还比较少）
![图1](http://git.oschina.net/mrbian/ComputerVirus/raw/master/first/first1.jpg?dir=0&filepath=first%2Ffirst1.jpg&oid=175aab7924ba74ae33cc76eb731b8c7acd501e78&sha=9b6138b29e99be01f6ddb816133001f53d96185e)
- 三是因为我写过四五个后端应用都是使用这一套来开发，算得上是轻车熟路。

### SQL注入环境准备
俗话说的好，光说不练假把式，本次作业我就简单地模拟SQL注入，演示一些可能导致SQL注入发生的程序猿的逻辑错误。
安装PostgresSQL 和 Mysql:
```
sudo apt-get update
sudo apt-get install postgresql pgadmin3
sudo pg_createcluster -p 5432 -u postgres 9.3 virusTest --start
sudo netstat -aWn --programs | grep postgres
```
安装Mysql
```
sudo apt-get update
sudo apt-get install mysql-server
```
![图2](http://git.oschina.net/mrbian/ComputerVirus/raw/master/first/first2.png?dir=0&filepath=first%2Ffirst2.png&oid=1e3fd0aee14c8bdd7cccc465402dc010ffde73ad&sha=9b6138b29e99be01f6ddb816133001f53d96185e)
OK,数据库服务启动完毕

现在创建数据库
```
sudo su
su postgres
psql
create database virustest
```

接下来在Ubuntu上安装NodeJs
```
wget -t https://nodejs.org/dist/v6.9.1/node-v6.9.1-linux-x64.tar.xz
tar -xf node-v6.9.1-linux-x64.tar.xz
cd node-v6.9.1-linux-x64.tar.xz/bin
ln -s *****  /usr/local/bin/node
ln -s *****  /usr/local/bin/npm
```

### 数据库初始化和脚手架初始化
环境搭建后，编写代码建立一张这样的表：
User表

account | password
---|---
test0 | 1234560
test1 | 1234561
test2 | 1234562

编写models/index.js,models/migrate.js,models/User.js 
然后执行```node models/migrate```进行数据库初始化
编写first/index.js 作为简单的服务器, views/index.html 简单的登录页面

### 简单注入分析
数据库初始化完成后，我们选择mysql作为本次SQL注入操作的范例，我们来开心的模拟一次简单的登录注入操作 ：
使用```' or 1=1#```越过账户名和密码限制

首先安装所有依赖
```npm install```
然后启动服务器 
```node first/index.js```
访问```http://localhost:5000/```看到如下网页
![图3](http://git.oschina.net/mrbian/ComputerVirus/raw/master/first/first2.png?dir=0&filepath=first%2Ffirst2.png&oid=1e3fd0aee14c8bdd7cccc465402dc010ffde73ad&sha=9b6138b29e99be01f6ddb816133001f53d96185e)
测试三次： 

- 输入 account : test0, password : 1234560，可以发现登录成功
![图5](http://git.oschina.net/mrbian/ComputerVirus/raw/master/first/first5.png?dir=0&filepath=first%2Ffirst5.png&oid=31dac7051ddebaf2d8b69aba5ec42cd83821f151&sha=9b6138b29e99be01f6ddb816133001f53d96185e)
- 输入 account : test0, password : wrongPassword，可以发现登录失败
![图6](http://git.oschina.net/mrbian/ComputerVirus/raw/master/first/first6.png?dir=0&filepath=first%2Ffirst6.png&oid=1d071ad147c76b11e7aff8115204d8ac72b83021&sha=436b3b6849b3f32ede3464bb51fe6186509f3827)
- 输入 account : ' or 1=1# , password : test，可以发现登录成功！！！
![图5](http://git.oschina.net/mrbian/ComputerVirus/raw/master/first/first5.png?dir=0&filepath=first%2Ffirst5.png&oid=31dac7051ddebaf2d8b69aba5ec42cd83821f151&sha=9b6138b29e99be01f6ddb816133001f53d96185e)


我们来看SQL语句是怎么写的： 
```sql
`select * from Users where account ='${account}' and password='${password}'`
```
很明显，直接写SQL拼接account和password导致了严重的后果，让用户能够绕开密码限制直接登录某一用户的账户
原因就是拼接完成后变成了： ```select * from users where account = '' or 1=1#' and password='password'```

不只是账户密码登录层面，很明显，在某些查询依然有可能发生SQL语句注入，比如某些商品敏感信息的查询，传入商品名的时候也这么注入，就有可能使用这样的漏洞查询到自己没有权限查看的东西;
这个注入的经典之处就在于使用 ' 这个字符串，有些后台使用 " 连接，所以在书写后台代码的时候要注意对 ' 或者 " 字符串的使用。
pgsql很明显在这方面比mysql更安全，因为 pgsql 查询语言要求查询语句中table要加上""，列名也要加上""

本次作业简单实践并分析了一种SQL注入，随着不断的深入研究，本节有待完善。