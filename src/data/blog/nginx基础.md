---
title: nginx基础
description: nginx基础
pubDatetime: 2017-03-12T15:52:18.000Z
tags:
  - Nginx
---

## 常用命令
```
start nginx.exe 
nginx.exe -s stop 
nginx.exe -s reload
```

<!-- more -->

## 正向代理
我想访问一个网站A，但是我不能直接访问它
代理服务器B可以直接访问A
于是我去访问B，让B帮我访问A，并且把A的内容返回来

## 反向代理
我去访问`fuck.com/hentai`这个页面，`fuck.com`其实没有`hentai`这个页面，但是他偷偷从另外一台服务器上取回来,然后作为自己的内容吐给用户，用户本身是毫不知情的

反向代理常用来解决**跨域**

## 跨域

除了同域名，其他情况都是跨域！

url | 说明 | 跨域
----|------|----
http://www.b.com/b.js<br>http://www.a.com/a.js | 不同域名  | 是
http://www.b.com/b.js<br>http://www.b.com/c.js | 同一域名下不同文件夹  | 否
http://www.a.com/a.js<br>http://www.a.com:8000/a.js | 同一域名，不同端口  | 是
http://www.a.com/a.js<br>https://www.a.com/a.js | 同一域名，不同协议  | 是
http://www.a.com/a.js<br>http://70.32.92.74/b.js | 域名和域名对应ip  | 是
http://www.a.com/a.js<br>http://script.a.com/b.js | 主域相同，子域不同  | 是
http://www.a.com/a.js<br>http://a.com/b.js | 同一域名，不同二级域名  | 是

比如我本地开了一个nginx服务器，访问：http://localhost:9090/bilibili.html
```
server {
        listen          9090;
        server_name     localhost;

        location / {
            root   html;
            index  index.html index.htm;
        }
    }
```
bilibili.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Document</title>
    <script src="//cdn.bootcss.com/jquery/3.1.1/jquery.min.js"></script>
</head>
<body>
    <h1>bilibli</h1>
    <script type="text/javascript">
        $.ajax({
            url: 'http://www.bilibili.com/index/catalogy/24-3day.json',
            type: 'GET',
            dataType: 'json',
        })
        .done(function(data) {
            console.log(data)
        })
        .fail(function(err) {
            console.log('err');
        })
    </script>
</body>
</html>
```
你会发现，数据无法获取，因为 `http://www.bilibili.com` 对于 `localhost` 来说是跨域的

*** 
我们可以添加一个代理
```
server {
        listen          9090;
        server_name     localhost;

        location / {
            root   html;
            index  index.html index.htm;
        }

        location /apis {
            include  uwsgi_params;
            proxy_pass   http://www.bilibili.com/index/catalogy/24-3day.json;
        }
    }
```
```javascript
$.ajax({
            url: '/apis',
            type: 'GET',
            dataType: 'json',
        })
```
这时，访问`localhost:9090/apis`就等于访问`http://www.bilibili.com/index/catalogy/24-3day.json`
并且不存在跨域了

注意，如果你想这样代理
```
$.ajax({
            url: '/apis/24-3day.json',
            type: 'GET',
            dataType: 'json',
        })
```
那么要这样配置
```
location /apis/ {
            include  uwsgi_params;
            proxy_pass   http://www.bilibili.com/index/catalogy/;
        }
```

## 虚拟主机
```
server {
        listen       8899;
        server_name  hentai.com;

        location / {
            root   html;
            index  index.html index.htm;
       } 
    }
```
然后更改hosts文件，建议使用[SwitchHosts](https://github.com/oldj/SwitchHosts)
```
127.0.0.1 hentai.com
```
于是访问`hentai.com:8899`就和访问`localhost:8899`一样了


## 常见的开发模式
比如，我用xampp开启了8080端口，然后用nginx替我转发接口跨域
```
server {
        listen          9090;
        server_name     localhost;

        location / {
            proxy_pass  http://127.0.0.1:8080;
        }

        location /apis {
            include  uwsgi_params;
            proxy_pass   http://www.bilibili.com/index/catalogy;
        }
    }
```
源代码是在xampp的目录里，但是访问是通过localhost:9090(nginx)访问