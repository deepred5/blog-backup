---
title: 写给前端工程师看的Docker教程-实战篇
date: 2019-09-30 09:36:26
tags: [node, Docker]
toc: true
---
在[上篇文章](http://anata.me/2019/09/29/%E5%86%99%E7%BB%99%E5%89%8D%E7%AB%AF%E5%B7%A5%E7%A8%8B%E5%B8%88%E7%9C%8B%E7%9A%84Docker%E6%95%99%E7%A8%8B-%E5%9F%BA%E7%A1%80%E7%AF%87/)里，我们学习了Docker常用的命令和基本操作，现在可以开始实战了。

### 单页应用
前端工作中最常见的就是单页应用了。我们首先用`create-react-app`快速创建一个应用
```bash
npm i create-react-app -g
create-react-app react-app
cd react-app
npm run start
```
可以看见正常启动的页面。

打包试一下
```
npm run build
```
可以看到本地生成了一个build目录，这就是最后线上运行的代码。

<!-- more -->

我们先在本地运行下build目录看看
```bash
npm i http-server -g
http-server -p 4444 ./build
```
访问 http://localhost:4444 即可看到打包后的页面

### 单页应用Docker化
在`react-app`目录下新建`Dockerfile` `.dockerignore`和`nginx.conf`

`.dockerignore`
```
node_modules
build
```
`dockerignore`指定了哪些文件不需要被拷贝进镜像里，类似`.gitignore`。

我们知道单页应用的路由一般都被js托管，所以对于nginx需要特别配置
`nginx.conf`
```bash
server {
    listen       80;
    server_name  localhost;

    location / {
        root   /app/build; # 打包的路径
        index  index.html index.htm;
        try_files $uri $uri/ /index.html; # 防止重刷新返回404
    }

    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }
}
```

`Dockerfile`
```bash
# 基于node11
FROM node:11

# 设置环境变量
ENV PROJECT_ENV production
ENV NODE_ENV production

# 安装nginx
RUN apt-get update && apt-get install -y nginx

# 把 package.json package-lock.json 复制到/app目录下
# 为了npm install可以缓存
COPY package*.json /app/

# 切换到app目录
WORKDIR /app

# 安装依赖
RUN npm install --registry=https://registry.npm.taobao.org

# 把所有源代码拷贝到/app
COPY . /app

# 打包构建
RUN npm run build

# 拷贝配置文件到nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# 启动nginx，关闭守护式运行，否则容器启动后会立刻关闭
CMD ["nginx", "-g", "daemon off;"]
```
需要特别注意的是:
```bash
COPY package*.json /app/
RUN npm install
COPY . /app
```
我们单独把`package.json`文件先拷贝到`app`，安装完依赖，然后才把所有的文件拷贝到`app`，这是为什么？

这是为了充分利用docker缓存
```
COPY . /app
RUN npm install
```
如果这么写，那么每一次重新构建镜像，都需要下载一次npm包，这是非常浪费时间的！而把`package.json`与源文件分隔开写入镜像，这样只有当`package.json`发生改变了，才会重新下载npm包。

当然缓存有时候也会造成一些麻烦，比如在进行一些shell操作输出内容时，由于缓存的存在，导致新构建的镜像里的内容还是旧版本的。

我们可以指定构建镜像时不使用缓存
```bash
docker build --no-cache -t deepred5/react-app .
```
最佳实践是在文件顶部指定一个环境变量，如果希望不用缓存，则更新这个环境变量即可，因为缓存失效是从第一条发生变化的指令开始。

**打包镜像**
```bash
docker build -t deepred5/react-app .  
```
**启动容器**
```bash
docker run -d --name my-react-app  -p 8888:80 deepred5/react-app
```

访问 http://localhost:8888 即可看到页面

访问 http://localhost:8888/deepred5, 也可以看见页面，说明nginx防刷新配置生效了！

### 多层构建
我们之前写的`Dockerfile`其实是有些问题的: 镜像基于node11，但是整个镜像用到node环境的地方只是为了前端打包，真正启动的是Nginx。镜像里的项目源代码以及`node_modules`其实根本没有用，这些冗余文件造成了镜像的体积变得非常庞大。

而我们仅仅需要打包出来的静态文件以及启动一个静态服务器Nginx即可。

这时就可以使用[multi-stage](https://docs.docker.com/develop/develop-images/multistage-build/)多层构建。

新建一个`Dockerfile.multi`
```bash
# node镜像仅仅是用来打包文件
FROM node:alpine as builder

ENV PROJECT_ENV production
ENV NODE_ENV production

COPY package*.json /app/

WORKDIR /app

RUN npm install --registry=https://registry.npm.taobao.org

COPY . /app

RUN npm run build

# 选择更小体积的基础镜像
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/build /app/build
```
这个文件里，我们使用了两个`FROM`基础镜像，第一个`node:alpine`仅仅作为打包环境，真正的基础镜像是`nginx:alpine`

**打包镜像**
```bash
# -f 指定使用Dockerfile.multi进行构建
docker build -t deepred5/react-app-multi .  -f Dockerfile.multi
```
**启动容器**
```bash
docker run -d --name my-react-app-multi  -p 8889:80 deepred5/react-app-multi
```
访问 http://localhost:8889 即可看到页面

**查看镜像大小**
```bash
docker images deepred5/react-app-multi
docker images deepred5/react-app
```
可以发现，两者的大小相差巨大。

`deepred5/react-app`镜像有1G多，而`deepred5/react-app-multi`只有20多M

主要原因是：`deepred5/react-app`的基础镜像`node:11`就有900M，而`deepred5/react-app-multi`的基础镜像`nginx:alpine`只有20M。由此可见多层构建对于减少镜像大小是非常有帮助的。

### Node应用
前端有时也会参与到Node BFF层的开发。我们来创建一个Node结合Redis的简单项目
```
mkdir node-redis
cd node-redis
npm init -y
npm i koa koa-router ioredis
touch index.js
```
`node-redis/index.js`
```javascript
const Koa = require('koa');
const Router = require('koa-router');
const Redis = require("ioredis");

const app = new Koa();
const router = new Router();
const redis = new Redis({
  port: 6379,
  host: '127.0.0.1'
});

router.get('/', (ctx, next) => {
  ctx.body = 'hello world.';
});

router.get('/api/json/get', async (ctx, next) => {
  const result = await redis.get('age');
  ctx.body = result;
});

router.get('/api/json/set', async (ctx, next) => {
  const result = await redis.set('age', ctx.query.age);
  ctx.body = {
    status: result,
    age: ctx.query.age
  }
});

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3000, () => {
  console.log('server start at localhost:3000');
})
```
我们首先需要本地安装Redis，然后启动redis
```
redis-server
```
启动Node项目
```
node index.js
```

访问 http://localhost:3000/ 即可看到页面

访问 http://localhost:3000/api/json/set?age=2 ，我们就向Redis里设置`age`的值为2

访问 http://localhost:3000/api/json/get ，我们就取得Redis里`age`的值

### Node应用Docker化
首先我们来思考下，这个后端应用涉及Node和Redis。如果我们要部署到Docker里，应该怎么构建镜像？

1. 方案一：基于一个最基础的`ubuntu`镜像，然后我们在其中安装Node和Redis，这样Node和Redis之间就可以进行通信了。这种方案只需要启动一个容器，因为Node和Redis已经在这个容器里了。
2. 方案二：我们基于`Redis`镜像启动一个容器，专门用来跑Redis。基于`Node`镜像再启动一个容器，专门用来跑Node。

Docker的理念更倾向于方案二。我们希望一个镜像专注于做一件事，现在流行的微服务，微前端也是这种思想。

我们之前说过每个容器都是相互隔离的，通过映射端口才能访问容器里的网络应用。但是容器和容器之间怎么进行通信呢？

Docker里使用`Networking`进行容器间的通信

### Networking
```bash
# 创建一个app-test网络
docker network create app-test
```
我们只需要把需要通信的容器都加入到`app-test`网络里，之后容器间就可以互相访问了。

```bash
docker run -d --name redis-app --network app-test  -p 6389:6379 redis 
docker run -it --name node-app --network app-test node:11 /bin/bash
```
我们创建了两个容器，这两个容器都在`app-test`网络里。

我们进入`node-app`容器里，然后`ping redis-app`，发现可以访ping通，说明容器间可以通信了！

我们修改之前的代码:
```javascript
const redis = new Redis({
  port: 6379,
  host: 'db',
});
```
redis的`host`改为`db`

新建一个`Dockerfile`
```bash
FROM node:11
COPY package*.json /app/ 
WORKDIR /app
RUN npm install
COPY . /app
EXPOSE 3000
CMD ["node","index.js"]
```
**构建镜像**
```
docker build -t deepred5/node-redis-app .
```
**启动容器**
```bash
# 创建网络
docker network create app-test
# 启动redis容器
docker run -d --name db --network app-test  -p 6389:6379 redis 
# 启动node容器
docker run --name node-redis-app -p 4444:3000 --network app-test -d deepred5/node-redis-app
```
访问 http://localhost:4444/ 即可看到页面

还记得我们之前做的`react-app`单页应用吗？我们可以也把这个应用加入到`app-test`网络里来，这样前端单页应用也可以访问后端了！

修改`react-app`目录下的`nginx.conf`
```bash
server {
    listen       80;
    server_name  localhost;

    location / {
        root   /app/build; # 打包的路径
        index  index.html index.htm;
        try_files $uri $uri/ /index.html; # 防止重刷新返回404
    }

    location /api {
        proxy_pass http://node-redis-app:3000; #后台转发地址
    }

}
```
重新构建镜像
```bash
docker build -t deepred5/react-app-multi .  -f Dockerfile.multi
```
启动容器
```
docker run -d --name my-react-app-multi --network app-test  -p 9999:80 deepred5/react-app-multi
```

访问 http://localhost:9999/api/json/set?age=55 成功返回数据

### Docker compose

我们现在这个项目有3个启动镜像:
* `deepred5/react-app-multi` 前端单页应用
* `redis` 数据缓存
* `deepred5/node-redis-app` 后端服务，访问redis，同时给前端提供接口

如果要把这个项目完整的启动起来，按照顺序需要这样启动：
```bash
# 启动redis容器
docker run -d --name db --network app-test  -p 6389:6379 redis 
# 启动node容器
docker run --name node-redis-app -p 4444:3000 --network app-test -d deepred5/node-redis-app
# 启动前端容器
docker run -d --name my-react-app-multi --network app-test  -p 9999:80 deepred5/react-app-multi
```
这还仅仅只是3个容器的项目，如果容器再多，启动就变得非常复杂了！

这时，就需要`docker compose`出场了。

首先需要安装[docker compose](https://docs.docker.com/compose/install/)，安装完成之后

我们新建一个`my-all-app`目录，然后新建`docker-compose.yml`
```bash
mkdir my-all-app
cd my-all-app
touch docker-compose.yml
```

```yml
version: '3.7'

services:
  db:
    image: redis
    restart: always
    ports:
      - 6389:6379
    networks:
      - app-test

  node-redis-app:
    image: deepred5/node-redis-app
    restart: always
    depends_on:
      - db
    ports:
      - 4444:3000
    networks:
      - app-test
    
  react-app-multi:
    image: deepred5/react-app-multi
    restart: always
    depends_on:
      - node-redis-app
    ports:
      - 9999:80
    networks:
      - app-test

networks:
  app-test:
    driver: bridge
```
```bash
# 启动所有容器
docker-compose up -d
# 停止所有容器
docker-compose stop
```
访问 http://localhost:9999 查看前端页面

访问 http://localhost:4444 查看后端接口

可以看见，使用`docker-compose.yml`配置完启动步骤后，启动多容器就变得十分简单了。
### 参考
* [如何使用docker部署前端应用](https://juejin.im/post/5c83cbaa6fb9a04a0f65fdaa)
* [第一本Docker书 修订版](https://book.douban.com/subject/26780404/)
