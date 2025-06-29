---
title: node服务器基础
description: node服务器基础
pubDatetime: 2017-03-13T13:00:00.000Z
tags:
  - Node.js
---

## 静态文件服务
比如apache web服务器，我们把index.html静态文件放在指定目录，浏览器就可以直接访问该文件，比如
```
http://localhost:8080:/index.html
```
apache服务器知道文件放在哪里，请求时就把该文件返回给浏览器

node就有所不同，node不是一个服务器，它是提供构建web服务器的框架，你需要自己写一个服务器！
在node里写一个服务器十分简单

<!-- more -->

# 写一个服务器
新建一个demo.js
```
var http = require('http');

http.createServer(function (req, res) {
    if (req.url !== '/favicon.ico') {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end('Hello World');
    }

}).listen(3000);

console.log('server start!');
```
访问***http://localhost:3000/***即可看到Hello World

# 路由
在上一个例子里，无论你输入什么url(比如 http://localhost:3000/home )，返回的都是“Hello World”
我们需要根据不同的url返回不同的内容，这就是路由的概念。

路由是指向客户端提供它所发出的请求内容的机制

改写前面的例子
demo.js
```
var http = require('http');

http.createServer(function (req, res) {
        // 规范url，去除查询字符串
        var path = req.url.replace(/\/?(?:\?.*)?$/, '').toLowerCase();
        switch (path) {
            case '' :
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.end('Home page');
                break;
            case '/about' :
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.end('About me');
                break;
            default:
                res.writeHead(404, {'Content-Type': 'text/html'});
                res.end('Not Found');
    }

}).listen(3000);

console.log('server start!');

```
输入不同的url返回的内容不同啦！
1. http://localhost:3000/  返回'Home page'
2. http://localhost:3000/about 返回 'About me'
3. 其他url返回'Not Found'

# node提供静态文件服务
一般的web服务器，我们只需要把静态文件放在指定目录，服务器会自动返回。但是node需要我们自己来读取静态文件，然后自己发送回浏览器。
1. 在demo.js同级目录下新建一个public目录
2. 在public目录下新建home.html, about.html, 404.html
3. 在public目录下新建img目录，放一张图片404.png

```
var http = require('http');
var fs = require('fs');

function serverStaticFile(res, path, contentType, responseCode) {
    if (!responseCode) {
        responseCode = 200;
    }

    fs.readFile(__dirname + path, function (err, data) {
        if (err) {
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end('500 - Internal Server Error');
        } else {
            res.writeHead(responseCode, {'Content-Type': contentType})
            res.end(data);
        }
    });
}

http.createServer(function (req, res) {
    var path = req.url.replace(/\/?(?:\?.*)?$/, '').toLowerCase();
    switch (path) {
        case '':
            serverStaticFile(res, '/public/home.html', 'text/html');
            break;
        case '/about':
            serverStaticFile(res, '/public/about.html', 'text/html');
            break;
        case '/img/404.png':
            serverStaticFile(res, '/public/img/404.png', 'image/png');
            break;
        default:
            serverStaticFile(res, '/public/404.html', 'text/html', 404);
    }
}).listen(3000);

console.log('server start!');
```

注意： __dirname 全局变量 返回的是当前运行的脚本的所在目录（F:\node\node-and-express\demo.js文件，则返回F:\node\node-and-express）

静态服务完成！

1. http://localhost:3000/  返回home.html
2. http://localhost:3000/about 返回about.html
3. http://localhost:3000/img/404.png 返回404.png
4. 其他返回404.html

