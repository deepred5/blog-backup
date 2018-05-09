---
title: 写给前端工程师看的linux部署基础知识
date: 2018-05-09 15:26:46
tags: [linux]
---
前端工程师平时接触到linux的机会并不多，最近我越发觉得自己对于一个项目的部署流程还是懵里懵懂。于是决定，从零开始部署一个项目，顺便捡一捡大学忘光的linux命令了。。。

# 购买服务器VPS
要部署项目，首先我们需要一台服务器。平时开发，项目是跑在我们本地电脑上的，现在我们想要让所有人都能访问这个项目，就需要部署到一台能被外网访问的服务器。现在市面上有虚拟主机，VPS，云服务器（ECS）。虚拟主机我就不考虑了，因为虚拟主机基本不支持ssh登录，而我们希望学习linux知识，所以只考虑VPS和ECS。而ECS价格比较高，而且我只是为了学习用，对于服务器的性能和配置要求不高，所以决定购买VPS。

<!-- more -->

VPS的购买渠道有很多，比如[搬瓦工](http://banwagong.cn/),[vultr](https://www.vultr.com/)，我这里购买的是vultr的VPS($5/mo的套餐)，安装的操作系统是`Ubuntu 14.04 x64`  

安装成功过，在vultr控制台可以看到如下信息:
![pic](http://pic.deepred5.com/vultr-1.png)

# SSH远程登录
我们想在本地电脑登入到服务器，这就需要一个支持SSH登录的终端工具。windows上比如Xshell，cmder，Mac上比如iterm2。

打开终端，输入
```
ssh -p 你的端口号 你的用户名@登录地址
```
```
# 比如登录入到vultr的vps(默认端口是22，所以可以不指定)
 ssh root@172.11.11.111
```
输入完密码后，即可进入服务器
![pic](http://pic.deepred5.com/vultr-2.png)

# 修改密码
```
passwd
```
vultr默认密码太复杂，所以自定义密码方便记忆。

# apt-get
`apt-get`命令可以很方便的下载我们需要的包
```
apt-get update
```
```
apt-get install openssl libssl-dev nginx wget git
```
Nginx安装完成后，在浏览器访问你服务器的IP地址，应该可以看到Nginx的欢迎界面！
![pic](http://pic.deepred5.com/vultr-3.png)

安装`nvm`进行node版本控制
```
wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
```
安装完成后，**新打开一个终端登入服务器**
```
nvm install 8.11.1
```
安装完成后，输入
```
node -v
```
如果出现版本，说明node安装成功！

# pm2
使用vi编辑app.js
```
vi app.js
```
按下`i`进入insert模式，输入如下代码
```javascript
const http = require('http');                                
                                                             
http.createServer((function(req, res) {                      
        res.writeHead(200, {'Content-Type': 'text/plain'});   
        res.end('hello world');                              
})).listen(8081);                                            
                                                             
console.log('server start at 8081');                         
```

按下`ESC`退出insert模式，输入(**注意有冒号！**)
```
:wq!
```
保存退出

启动app.js
```
node app.js
```
在浏览器访问你的服务器的8081端口，应该可以看见`hello world`页面

使用命令`node app.js`启动项目有个致命的问题，如果把当前终端关了，项目也就默认关闭了。

因此我们需要使用`pm2`管理项目
```
npm install pm2 -g
```
```
pm2 start app.js
```
使用pm2启动项目后，即使当前终端关闭了，node进程仍然在后台运行着！

# Nginx代理端口
我们希望访问项目时，不需要带上8081端口，这时就该Nginx上场了！

```
vi /etc/nginx/conf.d/mytest-com-8081.conf
```
新建一个配置文件，输入如下代码
```bash
upstream mytest {
	server 127.0.0.1:8081;
}
server {
	listen 80;
	server_name 149.11.11.111(填写你的ip地址);
	
	location / {
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header Host $http_host;
		proxy_set_header X-Nginx-Proxy true;

		proxy_pass http://mytest;
		proxy_redirect off;
	}
}
```
保存退出，重启nginx
```
nginx -s reload
```
访问你的ip地址，这次直接就是`hello world`页面啦！(如果仍然是Nginx欢迎页面，强制刷新即可！)