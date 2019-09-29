---
title: 写给前端工程师看的Docker教程-基础篇
date: 2019-09-29 14:23:20
tags: [node, Docker]
toc: true
---
最近公司在推进容器化和k8s，项目都要改成Docker部署。负责的工程里有几个node项目，只能从零开始学习Docker了。

### 安装
Docker支持window, Mac, Linux, 教程参考[Docker安装教程](https://www.runoob.com/docker/ubuntu-docker-install.html)。

建议在Mac和Linux系统里使用Docker。

平时开发，我使用的是vscode编辑器，建议顺便安装docker插件。在插件商店搜索`docker`，安装完成后，我们可以很方便的管理Docker镜像和容器。

<img src="http://pic.deepred5.com/docker1.png" style="width: 45%">

<!-- more -->

### 快速使用
首先我们来体验一下Docker。

平时工作中，如果我们电脑的开发环境是Windows, 有一天希望在Linux环境做一些事情，那该怎么办？大多数人这时会选择去用虚拟机安装一个ubuntu系统。不过安装虚拟机前，你得先去下载几个G的镜像，然后在VMware里配置一些参数，最后还要等待最少十几分钟的系统安装。等你安装完一个ubuntu系统，估计已经浪费了几个小时。

然而使用Docker，你只需要几分钟！
```bash
# 拉取ubuntu镜像
docker pull ubuntu
# 创建一个ubuntu容器并且使用终端进行交互
docker run -it --name my-ubuntu --rm ubuntu /bin/bash
```
创建成功后，你就进入一个ubuntu系统里，现在你可以在其中进行任意的操作了。

**注意：虽然当前容器里是ubuntu系统，但是你只能把它想象成一个精简版的ubuntu，因此有很多常用命令，需要自己去安装。**
```bash
curl -v bilibili.com
```
直接运行`curl`命令会提示命令不存在
```bash
# 安装curl
apt-get update
apt-get install -y curl
```
安装完成后，才能使用`curl`命令

退出容器
```bash
exit
```

### 基本概念
1. 镜像（Image）：类似于虚拟机中的镜像。镜像有两种：基础镜像和个人镜像。基础镜像由各大厂商提供，比如`ubuntu`镜像，`node`镜像。个人镜像则是由个人开发者构建上传。
2. 容器（Container）：类似于一个轻量级的沙盒。容器是基于镜像来创建的，`ubuntu`镜像并不能和我们进行各种交互，我们希望有个环境能运行`ubuntu`，于是基于`ubuntu`镜像创建了一个容器。
3. 仓库（Repository）：类似于代码仓库，这里是镜像仓库，是Docker用来集中存放镜像文件的地方。

我们可以这样类比：
```bash
# 下载源代码
git clone deepred5/app
# 启动app
npm run start
```

```bash
# 拉取镜像
docker pull deepred5/app
# 创建容器
docker run deepred5/app
```

Docker是基于c/s架构：我们在Client中执行Docker命令，最后创建的Container和Image则会在Server中运行
```bash
# 可以查看server和client信息
docker info
```

### 镜像(Image)
**常用命令**
```bash
# 查找镜像
docker search ubuntu

# 拉取特定tag版本的镜像(默认是latest)
docker pull ubuntu:18.0.4

# 查看下载的所有本地镜像
docker images

# 删除镜像
docker rmi ubuntu:18.0.4
```

**构建镜像**

我们一般都是基于基础镜像来构建个人镜像。镜像是由一条条指令构建出来(Dockerfile)

我们来构建一个`node-pm2`镜像，这个镜像自带node和pm2:

创建一个`node-pm2`目录，并新建一个`Dockerfile`文件
```bash
mkdir node-pm2
cd node-pm2
touch Dockerfile
```

编辑`Dockerfile`
```bash
# 基于node11基础镜像
FROM node:11

# 一些元数据,比如作者信息
LABEL maintainer="deepred5 <deepred5@gamil.com>"

# 安装pm2
RUN npm install pm2 -g --registry=https://registry.npm.taobao.org

# 暴露容器的端口
EXPOSE 80 443
```
基于这个`Dockerfile`创建我们自己的镜像`deepred5/node-pm2`

```bash
docker build -t deepred5/node-pm2:1.0 .
```
注意最后有一个`.`

查看我们自己的镜像
```bash
# 可以看到deepred5/node-pm2镜像了
docker images
```

基于`deepred5/node-pm2`镜像启动一个容器
```bash
docker run -it deepred5/node-pm2:1.0 /bin/bash
```
进入容器后，我们运行`pm2 -v`，可以看见pm2已经安装成功了

**上传镜像**

我们本地构建的镜像如果希望可以被其他人使用，就需要把镜像上传到仓库。登录[dockerhub](http://dockerhub.com/)，注册一个账户。
```bash
# 登入账户，输入用户名和密码
docker login

# 上传镜像
docker push deepred5/node-pm2:1.0
```
注意：`deepred5/node-pm2`改成`你的用户名/node-pm2`，你需要重新构建一个`你的用户名/node-pm2`的镜像，然后才能上传到dockerhub

### 容器(Container)
我们平时基本都是在和容器打交道。
```bash
# 基于ubuntu镜像创建my-ubuntu容器。如果本地没有ubuntu镜像，会先去docker pull下载
docker run -it ubuntu:latest --name my-ubuntu /bin/bash
```
参数解释:

`-i`: 允许你对容器内的标准输入 (STDIN) 进行交互

`-t`: 在新容器内指定一个伪终端或终端。

`--name`: 容器的名字，默认是随机的名字

`/bin/bash`: 启动容器后立即执行的命令

```bash
# 停止容器
docker stop my-ubuntu

# 启动容器
docker start my-ubuntu

# 删除容器
docker rm my-ubuntu

# 删除所有容器
docker rm `docker ps -aq`
```
```bash
# 查看正在运行的容器
docker ps

# 查看所有创建过的容器(运行或者关闭)
docker ps -a
```

`docker start my-ubuntu`启动的容器，虽然容器运行着，但是我们无法进入到容器里。

如何再次进入到容器里？
```bash
docker exec -it my-ubuntu /bin/bash
```

**容器运行的两种方式**
- 交互式运行(-it)
- 守护式运行(没有交互式会话，长期运行，适合运行应用程序和服务)(-d)

可以这样类比:
`node index.js`: 交互式运行
`pm2 start index.js`: 守护式运行

大部分情况都是运行守护式容器(daemonized container)

```bash
# 启动了容器，然后容器立即关闭
docker run ubuntu /bin/bash

# 启动了容器，并开启了交互式的终端，只有输入exit才退出终端，退出终端后，容器仍然在后台运行
docker run -it ubuntu /bin/bash

# 启动了容器，并且在后台一直运行，每隔1s输出hello world
docker run -d ubuntu /bin/sh -c "while true; do echo hello world; sleep 1; done"
```

**查看容器日志**
```bash
docker run -d --name my_container ubuntu /bin/sh -c "while true; do echo hello world; sleep 1; done"
```
```bash
# 查看后台运行的日志
docker logs my_container

# 实时监控(类似tail -f)
docker logs -f my_container

# 获取最后10行
docker logs --tail 10 my_container

# 实时查看最近的日志
docker logs --tail 0 -f my_container

# 加上时间戳
docker logs -t my_container
```

### 参考
* [只要一小时，零基础入门Docker](https://zhuanlan.zhihu.com/p/23599229)
* [10分钟看懂Docker和K8S](https://zhuanlan.zhihu.com/p/53260098)