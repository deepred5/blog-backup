---
title: 基于Koa2打造属于自己的MVC框架
date: 2020-07-18 17:00:29
tags: [koa2]
toc: true
---
`Express`和`Koa`作为轻量级的web框架，虽然灵活简单，几行代码就可以启动服务器了，但是随着业务的复杂，你很快就会发现，需要自己手动配置各种中间件，并且由于这类web框架并不约束项目的目录结构，因此不同水平的程序员搭出的项目质量也是千差万别。为了解决上述问题，社区也出现了各种基于`Express`和`Koa`的上层web框架，比如[Egg.js](https://eggjs.org/zh-cn/intro/index.html)和[Nest.js](https://nestjs.com/)

我目前所在的公司，也是基于`Koa`并结合自身业务需求，实现了一套`MVC`开发框架。我司的Node主要是用来承担BFF层，并不涉及真正的业务逻辑，因此该框架只是对`Koa`进行了相对简单的封装，内置了一些通用的业务组件(比如身份验证，代理转发)，通过约定好的目录结构，自动注入路由和一些全局方法

最近~~摸鱼时间~~把该框架的源码简单看了一遍，收获还是很大，于是决定动手实现了一个~~玩具版~~的MVC框架

[源代码地址](https://github.com/deepred5/build-you-own-node-mvc/)

## 框架使用

[参考代码-step1](https://github.com/deepred5/build-you-own-node-mvc/tree/master/step1)

```bash
│  app.js
│  routes.js
│  
├─controllers
│   home.js
│      
├─middlewares
│   index.js
│      
├─my-node-mvc # 我们之后将要实现的框架
|
|
├─services
│   home.js
│      
└─views
    home.html       
```

<!-- more -->

`my-node-mvc`是之后我们将要实现的`MVC`框架，首先我们来看看最后的使用效果

`routes.js`
```javascript
const routes = [
  {
    match: '/',
    controller: 'home.index'
  },
  {
    match: '/list',
    controller: 'home.fetchList',
    method: 'post'
  }
];
module.exports = routes;
```

`middlewares/index.js`
```javascript
const middleware = () => {
  return async (next) => {
    console.log('自定义中间件');
    await next()
  }
}
module.exports = [middleware()];
```

`app.js`
```javascript
const { App } = require('./my-node-mvc');
const routes = require('./routes');
const middlewares = require('./middlewares');

const app = new App({
  routes,
  middlewares,
});

app.listen(6666, () => {
  console.log('app start at: http://localhost:6666');
})
```

`my-node-mvc`暴露了一个`App`类，我们通过传入`routes`和`middlewares`两个参数，来告诉框架如何渲染路由和启动中间件

我们访问`http://localhost:6666`时，首先会经过我们的自定义中间件
```javascript
async (next) => {
  console.log('自定义中间件');
  await next()
}
```

之后会匹配到`routes.js`里面的这段路径
```javascript
{
  match: '/',
  controller: 'home.index'
}
```

然后框架回去找`controllers`目录夹下的`home.js`，新建一个`Home`对象并且调用它的`index`方法，于是页面就渲染了`views`目录夹下的`home.html`

`controllers/home.js`
```javascript
const { Controller } = require('../my-node-mvc');

// 暴露了一个Controller父类，所以的controller都继承它，才能注入this.ctx对象

// this.ctx 除了有koa自带的方法和属性外，还有my-node-mvc框架拓展的自定义方法和属性
class Home extends Controller {
  async index() {
    await this.ctx.render('home');
  }

  async fetchList() {
    const data = await this.ctx.services.home.getList();
    ctx.body = data;
  }
}

module.exports = Home;
```

同理访问`http://localhost:6666/list`匹配到了
```javascript
{
  match: '/list',
  controller: 'home.fetchList'
}
```
于是调用了`Home`对象的`fetchList`方法，这个方法又调用了`services`目录下的`home`对象的`getList`方法，最后返回`json`数据

`services/home.js`
```javascript
const { Service } = require('../my-node-mvc')

const posts = [{
  id: 1,
  title: 'Fate/Grand Order',
}, {
  id: 2,
  title: 'Azur Lane',
}];

// 暴露了一个Service父类，所以的service都继承它，才能注入this.ctx对象
class Home extends Service {
  async getList() {
    return posts
  }
}

module.exports = Home
```
至此，一个最简单的`MVC` web流程已经跑通

<font color="orange">在开始教程之前，最好希望你有`Koa`源码的阅读经验，可以参考我之前的文章：[Koa源码浅析](http://anata.me/2019/06/24/Koa%E6%BA%90%E7%A0%81%E6%B5%85%E6%9E%90/)</font>

接下来，我们会一步步实现`my-node-mvc`这个框架

## 基本框架
