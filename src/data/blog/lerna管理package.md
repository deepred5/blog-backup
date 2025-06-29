---
title: lerna管理package
pubDatetime: 2019-07-08T08:24:09.000Z
tags:
  - NPM
description: lerna管理package
---
最近发现公司一个项目的目录组织挺奇怪的，所有的子项目都放在了`packages`目录里，还有这种骚操作？特意查了下资料，发现是一种比较流行的`monorepo`项目管理模式。近几年比较火的React,Vue,Babel都是用的这种模式:

![lerna1](@/assets/images/lerna管理package/lerna1.png)

<!-- more -->

我们平常一般采用的都是`multiple repositories`的项目管理模式：把一个大项目拆分成若干个小项目，每个小项目都独立的放在gitlab上。这种模式其实也没啥不好，但是某些情况下，子项目A依赖子项目B，如果子项目B经常改动，那么每次B改动了，都要修改A，这时就非常麻烦。在开发一个前端框架或者UI库时，就经常会遇到上述情况，这时我们就可以考虑下`monorepo`。

`monorepo`说到底也只是一个理念，那么怎么才能实现这种代码组织呢？

* [lerna](https://lerna.js.org/)
* yarn中的[Workspace](https://yarnpkg.com/lang/zh-hans/docs/workspaces/)

本文主要介绍下lerna的使用

[源码参考](https://github.com/deepred5/learn-lerna)

#### lerna
全局安装[lerna](https://lerna.js.org/)
```
npm i lerna -g
```
lerna是基于git的，在github上新建一个项目`learn-lerna`
```
git clone git@github.com:deepred5/learn-lerna.git
cd learn-lerna
```

初始化项目:
```
lerna init
```
![lerna2](@/assets/images/lerna管理package/lerna2.png)

lerna会自动创建一个`packages`目录夹，我们以后的项目都新建在这里面。同时还会在根目录新建一个`lerna.json`配置文件
```javascript
{
  "packages": [
    "packages/*"
  ],
  "version": "0.0.0" // 共用的版本，由lerna管理
}
```
#### 创建package
我们创建两个package:
```
cd packages
mkdir prpr-lerna-core
cd prpr-lerna-core
npm init -y
```
```
cd packages
mkdir prpr-lerna-popular
cd prpr-lerna-popular
npm init -y
```
**注意：这两个package我们最后都是要发布到npm上的，所以名字请取特殊些，不能被人用过**

#### 添加依赖
`prpr-lerna-popular`依赖`prpr-lerna-core`，这时有两种方法添加依赖：

第一种方法是修改`prpr-lerna-popular/package.json`，添加
```javascript
{
  "dependencies": {
    "prpr-lerna-core": "^1.0.0"
  }
}

```
然后运行`lerna bootstrap`

第二种方法是直接使用命令`add`
```
lerna add prpr-lerna-core --scope=prpr-lerna-popular
```

运行之后，我们发现`prpr-lerna-popular`生成了`node_modules`，而`node_modules`里生成了指向`prpr-lerna-core`的**软链**，类似`npm link`的效果:
![lerna3](@/assets/images/lerna管理package/lerna3.png)


新建`prpr-lerna-core/index.js`
```javascript
const API = 'https://yande.re/post/popular_recent.json';

module.exports = {
  API
}
```
`prpr-lerna-popular`除了依赖`prpr-lerna-core`，还可以依赖其他开源的库，比如我们使用`axios`
```
lerna add axios --scope=prpr-lerna-popular
```
新建`prpr-lerna-popular/index.js`
```javascript
const { API } = require('prpr-lerna-core');
const axios = require('axios');

const getPopularImg = () => axios.get(API)

module.exports = getPopularImg;

// 测试代码，发布时删除
getPopularImg().then((res) => console.log(res.data.length));
```
测试一下:
`node packages/prpr-lerna-popular/index.js`
正常情况下可以输出结果


#### 发布到npm
首先把所有的代码提交
```
cd learn-lerna
git add .
git commit -m "test publish"
```
注册一个[npmjs](https://www.npmjs.com/)账户

```
npm login
```
登入你的账户，如果本地npm是淘宝镜像，一定要换回`https://registry.npmjs.org/`地址！！！

```
lerna publish
```
运行`publish`，选择发布的版本号
![lerna4](@/assets/images/lerna管理package/lerna4.png)

lerna可以帮我们管理版本号，非常方便!

![lerna5](@/assets/images/lerna管理package/lerna5.png)

#### 常用命令
```
lerna init #初始化
lerna bootstrap #下载依赖包或者生成本地软连接
lerna add axios #所有包都添加axios
lerna add prpr-lerna-core --scope=prpr-lerna-popular #给包prpr-lerna-popularx添加prpr-lerna-core依赖
lerna list
lerna clean
```


#### 其他事项

* lerna默认使用的是集中版本，所有的package共用一个version。如果希望不同的package拥有自己的版本，可以使用[Independent](https://github.com/lerna/lerna/#independent-mode)模式

* 发布package的名字如果是以`@`开头的，例如`@deepred/core`，npm默认以为是私人发布，需要使用`npm publish --access public`发布。但是`lerna publish`不支持该参数，解决方法参考: [issues](https://github.com/lerna/lerna/issues/914)

#### 参考
[浅谈monorepo](http://www.sohu.com/a/165037119_575744)
