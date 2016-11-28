## 计算机病毒与入侵关于SQL注入的研究（一）
### 写在前面
参考SQL注入攻击与防御一书以及百度资料相关介绍，下面给出SQL注入的定义和原理。
定义
> SQL注入攻击（SQL Injection），简称注入攻击，是Web开发中最常见的一种安全漏洞。可以用它来从数据库获取敏感信息，或者利用数据库的特性执行添加用户，导出文件等一系列恶意操作，甚至有可能获取数据库乃至系统用户最高权限。

原理
> 造成SQL注入的原因是因为程序没有有效过滤用户的输入，使攻击者成功的向服务器提交恶意的SQL查询代码，程序在接收后错误的将攻击者的输入作为查询语句的一部分执行，导致原始的查询逻辑被改变，额外的执行了攻击者精心构造的恶意代码。

从本质上来说，SQL注入和XSS注入很相似，都是因为没有做好对用户的输入控制而导致的错误。

经过考虑，我决定使用NodeJs + PostgresSQL来进行SQL注入的研究。
- 一是因为我查看网上资料时发现网上的SQL注入示例都是PHP代码编写，为了避嫌使用JavaScript。
- 二是我对PHP以前研究使用较少，而且近几年从StackOverflow标签热度来分析，可以看出PHP逐渐落寞，JavaScript借着NodeJs一飞冲天。
不仅是外国，就是在国内，阿里百度等国内互联网公司大部分新业务都开始使用NodeJS来做前后端分离和前端开发工具（虽然NodeJs可以用作后端开发，但是Java的Spring等作为老牌的，成熟稳定的框架，在大公司吃的开，用Node去做后端开发的大型项目还比较少）
IMG
- 三是因为我写过四五个后端应用都是使用这一套来开发，算得上是轻车熟路。

### SQL注入初试
俗话说的好，光说不练假把式，本次作业我就简单地模拟SQL注入，演示一些可能导致SQL注入发生的程序猿的逻辑错误。
安装PostgresSQL:
```
sudo apt-get update
sudo apt-get install postgresql pgadmin3
sudo pg_createcluster -p 5432 -u postgres 9.3 virusTest --start
sudo netstat -aWn --programs | grep postgres
```
IMG
OK,数据库服务启动完毕

现在创建数据库
```
sudo su
su postgres
psql
```