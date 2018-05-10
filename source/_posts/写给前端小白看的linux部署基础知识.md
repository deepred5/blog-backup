---
title: 写给前端小白看的linux部署基础知识
date: 2018-05-09 15:26:46
tags: [linux]
---
前端平时接触到linux的机会并不多，但是懂点linux对于前端来说还是有益无害的，起码还是要了解一下最基本的部署知识。

# 购买服务器
要部署项目，首先我们需要一台服务器。平时开发，项目是跑在我们本地电脑上的，现在我们想要让所有人都能访问这个项目，就需要部署到一台能被外网访问的服务器。现在市面上有虚拟主机，VPS，ECS（云服务器）。虚拟主机我就不考虑了，因为虚拟主机基本不支持ssh登录，而我们希望学习linux知识，所以只考虑VPS和ECS。而ECS价格比较高，考虑到我只是为了学习用，对于服务器的性能和配置要求不高，最后决定购买VPS。

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
Nginx安装完成后，在浏览器访问你服务器的IP地址(例如：http://149.28.17.111/ )， 应该可以看到Nginx的欢迎界面！
![pic](http://pic.deepred5.com/vultr-3.png)

# Nginx静态资源
我现在希望访问http://149.28.17.111/test 可以展示一个静态页面，这时就该Nginx上场了！
```
mkdir -p static/test
```
在当前目录下，新建一个static文件夹，static里面又新建了一个test目录，在里面存放一个静态文件index.html
```
vi static/test/index.html
```
按下`i`进入insert模式，输入如下代码:
```html
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>无路赛</title>
</head>
<body>
	<h1>无路赛</h1>
</body>
</html>
```
按下`ESC`退出insert模式，输入(**注意有冒号！**)
```
:wq!
```
保存退出

```
vi /etc/nginx/conf.d/mytest.conf
```
新建一个nginx配置文件，输入如下代码
```bash
server {
	listen 80;
	server_name 149.28.17.111(填写你的ip地址);

	location /test {
		root   /root/static;
		index  index.html;
	}
}
```
修改nginx用户组(不然会报403)
```
vi /etc/nginx/nginx.conf
```
`www-data`修改为`root`
```
user root;
```
于是访问http://149.28.17.111/test Nginx就会去找/root/static/test目录下的index.html

# ftp上传文件
前面我们使用vi编辑器新建了两个文件(`mytest.conf` `index.html`)，你可能觉得写起代码来一点都不方便。其实我们也可以在本地写好这两个文件，然后使用ftp工具将这两个文件上传到服务器。

ftp工具有很多，比如flashfxp。以xshell自带的xftp为例，打开ftp，连接到服务器
![pic](http://pic.deepred5.com/vultr-4-1.png)

ftp界面，左边是我们本地目录，右边是服务器目录
![pic](http://pic.deepred5.com/vultr-5-1.png)
右边可视化界面，能很方便的查看服务器的各个文件夹，同时也可以把本地的文件上传到服务器(只需把文件拖拽到右边窗口即可)

# node版本控制
前端开发经常要使用npm安装各种包，因此需要搭建node环境
使用`nvm`进行版本控制
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
新建app.js
```
vi app.js
```
```javascript
const http = require('http');                                
                                                             
http.createServer((function(req, res) {                      
        res.writeHead(200, {'Content-Type': 'text/plain'});   
        res.end('八嘎Hentai无路赛');                              
})).listen(8081);                                            
                                                             
console.log('server start at 8081');                         
```
保存退出

启动app.js
```
node app.js
```
在浏览器访问 http://149.28.17.11:8081 就可以看见页面

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
我们希望访问项目时，不需要带上8081端口。可以使用Nginx的反向代理功能：

```
vi /etc/nginx/conf.d/mytest.conf
```
修改配置
```bash
upstream mytest {
	server 127.0.0.1:8081;
}
server {
	listen 80;
	server_name 149.28.17.111(填写你的ip地址);
	
	location / {
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header Host $http_host;
		proxy_set_header X-Nginx-Proxy true;

		proxy_pass http://mytest;
		proxy_redirect off;
	}

	location /test {
		root   /root/static;
		index  index.html;
	}
}


```
保存退出，重启nginx
```
nginx -s reload
```
原理就是：访问http://149.28.17.111时， nginx反向代理到http://149.28.17.111:8081， 并把本地node服务器返回的内容展示出来

# 域名解析
目前我们访问网站需要直接输入ip地址，这样十分不方便。为此，我们需要买一个域名来解析到网站。

域名提供商有很多，比如万网，godaddy等等。特别注意的是，国内注册的域名要实名备案，否则无法域名解析。

以万网举例：添加两个解析，其中记录值填的就是vps的ip地址
![pic](http://pic.deepred5.com/vultr-6.png)

修改ngnix配置
```
vi /etc/nginx/conf.d/mytest.conf
```
```
upstream mytest {
	server 127.0.0.1:8081;
}
server {
	listen 80;
	server_name 149.28.17.111(填写你的ip地址);
	
	location / {
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header Host $http_host;
		proxy_set_header X-Nginx-Proxy true;

		proxy_pass http://mytest;
		proxy_redirect off;
	}

	location /test {
		root   /root/static;
		index  index.html;
	}
}

server {
	listen 80;
	server_name www.urusai.site(填写你的域名);
	location / {
		proxy_pass http://mytest;
		proxy_redirect off;
	}
}

server {
	listen 80;
	server_name urusai.site(填写你的域名);
	location / {
		proxy_pass http://mytest;
		proxy_redirect off;
	}
}
```
重启nginx
```
nginx -s reload
```
访问 http://www.urusai.site 或者 http://urusai.site 就可以看到页面了！