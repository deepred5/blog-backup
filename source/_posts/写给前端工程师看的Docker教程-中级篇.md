---
title: 写给前端工程师看的Docker教程-中级篇
date: 2019-09-29 21:27:42
tags: [node, Docker]
toc: true
---
在[基础篇](http://anata.me/2019/09/29/%E5%86%99%E7%BB%99%E5%89%8D%E7%AB%AF%E5%B7%A5%E7%A8%8B%E5%B8%88%E7%9C%8B%E7%9A%84Docker%E6%95%99%E7%A8%8B-%E5%9F%BA%E7%A1%80%E7%AF%87/)里，我们介绍了一些Docker的常用概念和命令，接下来我们会继续学习Docker的其他用法和实际运用。

### Nginx
前端最常使用的静态服务器就是Nginx了。
```bash
docker run -d --name my-nginx -p 8888:80 nginx
```
访问 http://localhost:8888/ 即可看到熟悉的欢迎页面

<!-- more -->

参数解释:
`-d`: 基础篇里已经解释过了，守护运行方式
`-p`: 端口映射。`8888:80`表示把本地的8888端口映射到容器的80端口

为什么要映射端口？因为Docker里每个容器都是相对独立的，拥有自己的内部ip。容器里运行的一些网络应用，要让外部也可以访问，就需要将端口映射到宿主机上。

```bash
docker port my-nginx 
```
`80/tcp -> 0.0.0.0:8888`即可看到映射的端口了

如果我们希望修改Nginx欢迎页的内容，怎么办？

最容易想到的方法是：我们进入到容器里，然后修改`/usr/share/nginx/html`目录里的`index.html`
```bash
# 进入nginx容器里
docker exec -it my-nginx /bin/bash
```
不过这种方法拓展性不高，假如有多个Nginx容器，难道我们需要一个个的进入容器去修改？

这时就要引出数据卷(Volume)的概念了。

### 数据卷(Volume)
类似端口映射，我们可以把容器内部的目录映射到宿主机的目录，实现容器之间实现共享和重用。

新建`my-nginx`目录，新建`index.html`
```bash
mkdir my-nginx
cd my-nginx
touch index.html
```
`index.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Document</title>
</head>
<body>
  <h1>hello world</h1>
</body>
</html>
```
```bash
docker run --name nginx-test \
--rm -p 8888:80 \
-v $PWD:/usr/share/nginx/html \
-d nginx
```

**小技巧：如果命令行过长，可以使用\符号多行书写**

访问 http://localhost:8888/ 已经发生变化了！

参数解释：
`-v`: `$PWD:/usr/share/nginx/html`表示把容器内的`/usr/share/nginx/html`映射到当前目录，也就是`my-nginx`目录。于是nginx返回的`index.html`也就变成了我们本地的`index.html`了。

我们可以试着在本地新建一个`1.html`，然后访问 http://localhost:8888/1.html 也可以看到输出了内容。

同理，如果我们希望修改容器里Nginx的配置，也可以把容器的`/etc/nginx/conf.d/`映射到本地，然后在本地新建配置`mydefault.conf`

为了复习一下基础篇的内容，我们希望构建一个本地的镜像，这个镜像基于Nginx，默认的欢迎页面内容就是我们刚刚新建的index.html

在`my-nginx`目录，新建`Dockerfile`
```bash
FROM nginx
# 将当前的index.html拷贝到容器的/usr/share/nginx/html/index.html
COPY ./index.html /usr/share/nginx/html/index.html
EXPOSE 80
```
`docker build -t my-nginx .`构建镜像
`docker run -d  --rm -p 4445:80 my-nginx` 创建容器，访问 http://localhost:4445 可以看到效果了。

### Redis
我们也可以在Docker里运行Redis。
```bash
docker pull redis
docker run -d --name my-redis -p 6389:6379 redis
```
进入容器并且连接到redis
```bash
# 进入my-redis容器里，并且在容器里执行redis-cli命令
docker exec -it my-redis redis-cli 
```
于是我们就连接到redis里了，并且可以执行相应的redis命令
```bash
# 设置name
set name tc
# 获取name
get name
```
因为我们把容器的6379端口映射到了本机的6389，所以我们也可以直接在本地连接容器里的redis
```bash
# 需要你本地安装了redis-cli
redis-cli -h 127.0.0.1 -p 6389

# 返回tc
get name
```

### 总结
我们主要学习了Docker里的端口映射(-p)和目录映射(-v)，同时学习了如何在Docker里使用Nginx和Redis。