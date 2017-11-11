---
title: http-server
date: 2017-04-09 09:47:02
tags: [node]
---

## http-server

有时，我们需要开启一个本地服务器来访问页面，而不是直接用浏览器打开。
以前我的通常做法是开启xampp的apache服务，然后把要访问的页面复制到`htdocs`文件夹下。
如果我们只是想简单的开启一个服务器而不需要运行后台脚本（比如PHP）,那么其实可以通过node的`http-server`包来解决问题

## 全局安装

```bash
nmp install http-server -g
```

假设你想让`F:\myblog`底下的html可以通过服务器访问，那么只需
```
cd F:\myblog
http-server -p 3000
```
于是你就可以通过`http://localhost:3000/`访问`F:\myblog`了

**注意一下**
http-server开启的服务器默认会有缓存，这在开发时不是很友好，可以通过下面的命令关闭缓存
```
http-server -p 3000 -c-1
```
