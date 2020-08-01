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
  return async (context, next) => {
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

app.listen(4445, () => {
  console.log('app start at: http://localhost:4445');
})
```

`my-node-mvc`暴露了一个`App`类，我们通过传入`routes`和`middlewares`两个参数，来告诉框架如何渲染路由和启动中间件

我们访问`http://localhost:4445`时，首先会经过我们的自定义中间件
```javascript
async (context, next) => {
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

同理访问`http://localhost:4445/list`匹配到了
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
[参考代码-step2](https://github.com/deepred5/build-you-own-node-mvc/tree/master/step2)

`my-node-mvc`是基于`Koa`的，因此首先我们需要安装`Koa`

```bash
npm i koa
```

`my-node-mvc/app.js`

```javascript
const Koa = require('koa');

class App extends Koa {
  constructor(options={}) {
    super();
  }
}

module.exports = App;
```

我们只要简单的`extend`继承父类`Koa`即可

`my-node-mvc/index.js`

```javascript
// 将App导出
const App = require('./app');

module.exports = {
  App,
}
```

我们来测试下
```bash
# 进入step2目录
cd step2
node app.js
```
访问`http://localhost:4445/`发现服务器启动成功

于是，一个最简单的封装已经完成

## 内置中间件
我们的`my-node-mvc`框架需要内置一些最基础的中间件，比如`koa-bodyparser`,`koa-router`, `koa-views`等，只有这样，才能免去我们每次新建项目都需要重复安装中间件的麻烦

内置的中间件一般又分为两种：

* 内置基础中间件：比如`koa-bodyparser`，`koa-router`，`metrics`性能监控，健康检查
* 内置业务中间件：框架结合业务需求，把各部门通用的功能集成在业务中间件，比如单点登录，文件上传

```bash
npm i uuid koa-bodyparser ejs koa-views
```

我们来尝试新建一个业务中间件

`my-node-mvc/middlewares/init.js`

```javascript
const uuid = require('uuid');

module.exports = () => {
  // 每次请求生成一个requestId
  return async (context, next) => {
    const id = uuid.v4().replace(/-/g, '')
    context.state.global = {
      requestId: id
    }
    await next()
  }
}
```
`my-node-mvc/middlewares/index.js`

```javascript
const init = require('./init');
const views = require('koa-views');
const bodyParser = require('koa-bodyparser');

// 把业务中间件init和基础中间件koa-bodyparser koa-views导出
module.exports = {
  init,
  bodyParser,
  views,
}
```

现在，我们需要把这两个中间件在`App`初始化时调用

`my-node-mvc/index.js`

```javascript
const Koa = require('koa');
const middlewares = require('./middlewares');

class App extends Koa {
  constructor(options={}) {
    super();

    const { projectRoot = process.cwd(), rootControllerPath, rootServicePath, rootViewPath } = options;
    this.rootControllerPath = rootControllerPath || path.join(projectRoot, 'controllers');
    this.rootServicePath = rootServicePath || path.join(projectRoot, 'services');
    this.rootViewPath = rootViewPath || path.join(projectRoot, 'views');

    this.initMiddlewares();
  }

  initMiddlewares() {
    // 使用this.use注册中间件
    this.use(middlewares.init());
    this.use(middlewares.views(this.rootViewPath, { map: { html: 'ejs' } }))
    this.use(middlewares.bodyParser());
  }
}

module.exports = App;
```

修改下启动`step2/app.js`

```javascript
app.use((ctx) => {
  ctx.body = ctx.state.global.requestId
})

app.listen(4445, () => {
  console.log('app start at: http://localhost:4445');
})
```
于是每次访问`http://localhost:4445`都能返回不同的`requestId`

## 业务中间件

除了`my-node-mvc`内置的中间件外，我们还能传入自己写的中间件，让`my-node-mvc`帮我们启动

`step2/app.js`
```javascript
const { App } = require('./my-node-mvc');
const routes = require('./routes');
const middlewares = require('./middlewares');

// 传入我们的业务中间件middlewares，是个数组
const app = new App({
  routes,
  middlewares,
});

app.use((ctx, next) => {
  ctx.body = ctx.state.global.requestId
})

app.listen(4445, () => {
  console.log('app start at: http://localhost:4445');
})
```

`my-node-mvc/index.js`

```javascript
const Koa = require('koa');
const middlewares = require('./middlewares');

class App extends Koa {
  constructor(options={}) {
    super();
    this.options = options;

    this.initMiddlewares();
  }

  initMiddlewares() {
    // 接收传入进来的业务中间件
    const { middlewares: businessMiddlewares } = this.options;
    // 使用this.use注册中间件
    this.use(middlewares.init())
    this.use(middlewares.bodyParser());

    // 初始化业务中间件
    businessMiddlewares.forEach(m => {
      if (typeof m === 'function') {
        this.use(m);
      } else {
        throw new Error('中间件必须是函数');
      }
    });
  }
}

module.exports = App;
```

于是我们的业务中间件也能启动成功了

`step2/middlewares/index.js`

```javascript
const middleware = () => {
  return async (context, next) => {
    console.log('自定义中间件');
    await next()
  }
}

module.exports = [middleware()];
```

## 全局方法

我们知道，`Koa`内置的对象`ctx`上已经挂载了很多方法，比如`ctx.cookies.get()` `ctx.remove()`等等，在我们的`my-node-mvc`框架里，我们其实还能添加一些全局方法

如何在`ctx`上继续添加方法呢？ 常规的思路是写一个中间件，把方法挂载在`ctx`上：

```javascript
const utils = () => {
  return async (context, next) => {
    context.sayHello = () => {
      console.log('hello');
    }
    await next()
  }
}

// 使用中间件
app.use(utils());

// 之后的中间件都能使用这个方法了
app.use((ctx, next) => {
  ctx.sayHello();
})
```

不过这要求我们将`utils`中间件放在最顶层，这样之后的中间件才能继续使用这个方法

我们可以换个思路：每次客户端发送一个http请求，`Koa`都会调用`createContext`方法，该[方法](https://github.com/koajs/koa/blob/master/lib/application.js#L177)会返回一个全新的`ctx`，之后这个`ctx`会被传递到各个中间件里

关键点就在`createContext`，我们可以重写`createContext`方法，在把`ctx`传递给中间件之前，就先注入我们的全局方法

`my-node-mvc/index.js`

```javascript
const Koa = require('koa');

class App extends Koa {
  
  createContext(req, res) {
    // 调用父级方法
    const context = super.createContext(req, res);
    // 注入全局方法
    this.injectUtil(context);

    // 返回ctx
    return context
  }

  injectUtil(context) {
    context.sayHello = () => {
      console.log('hello');
    }
  }
}

module.exports = App;
```

## 匹配路由

[参考代码-step3](https://github.com/deepred5/build-you-own-node-mvc/tree/master/step3)

我们规定了框架的路由规则:
```javascript
const routes = [
  {
    match: '/', // 匹配路径
    controller: 'home.index', // 匹配controller和方法
    middlewares: [middleware1, middleware2], // 路由级别的中间件，先经过路由中间件，最后到达controller的某个方法
  },
  {
    match: '/list',
    controller: 'home.fetchList',
    method: 'post', // 匹配http请求
  }
];
```

思考下如何通过`koa-router`实现该配置路由?

```bash
# https://github.com/ZijianHe/koa-router/issues/527#issuecomment-651736656
# koa-router 9.x版本升级了path-to-regexp
# router.get('/*', (ctx) => { ctx.body = 'ok' }) 变成这种写法：router.get('(.*)', (ctx) => { ctx.body = 'ok' })
npm i koa-router
```

新建内置路由中间件
`my-node-mvc/middlewares/router.js`

```javascript
const Router = require('koa-router');
const koaCompose = require('koa-compose');

module.exports = (routerConfig) => {
  const router = new Router();

  // Todo 对传进来的 routerConfig 路由配置进行匹配

  return koaCompose([router.routes(), router.allowedMethods()])
}
```
注意我最后使用了`koaCompose`把两个方法合成了一个，这是因为`koa-router`最原始方法需要调用两次`use`才能注册成功中间件

```javascript
const router = new Router();

router.get('/', (ctx, next) => {
  // ctx.router available
});

app
  .use(router.routes())
  .use(router.allowedMethods());
```

使用了`KoaCompose`后，我们注册时只需要调用一次`use`即可

```javascript
class App extends Koa {
  initMiddlewares() {
    const { routes } = this.options;
    
    // 注册路由
    this.use(middlewares.route(routes));
  }
}
```

现在我们来实现具体的路由匹配逻辑:

```javascript
module.exports = (routerConfig) => {
  const router = new Router();

  if (routerConfig && routerConfig.length) {
    routerConfig.forEach((routerInfo) => {
      let { match, method = 'get', controller, middlewares } = routerInfo;
      let args = [match];

      if (method === '*') {
        method = 'all'
      }

      if ((middlewares && middlewares.length)) {
        args = args.concat(middlewares)
      };

      controller && args.push(async (context, next) => {
        // Todo 找到controller
        console.log('233333');
        await next();
      });


      if (router[method] && router[method].apply) {
        // apply的妙用
        // router.get('/demo', fn1, fn2, fn3);
        router[method].apply(router, args)
      }
    })
  }

  return koaCompose([router.routes(), router.allowedMethods()])
}
```
这段代码有个巧妙的技巧就是使用了一个`args`数组来收集路由信息

```javascript
{
  match: '/neko',
  controller: 'home.index',
  middlewares: [middleware1, middleware2],
  method: 'get'
}
```
这份路由信息，如果要用`koa-router`实现匹配，应该这样写:

```javascript
// middleware1和middleware2是我们传进来的路由级别中间件
// 最后请求会传递到home.index方法
router.get('/neko', middleware1, middleware2, home.index);
```
由于匹配规则都是我们动态生成的，因此不能像上面那样写死，于是就有了这个技巧:

```javascript
const method = 'get';

// 通过数组收集动态的规则
const args = ['/neko', middleware1, middleware2, async (context, next) => {
  // 调用controller方法
  await home.index(context, next);
}];

// 最后使用apply
router[method].apply(router, args)

```

## 注入Controller

前面的路由中间件，我们还缺少最重要的一步：找到对应的Controller对象

```javascript
controller && args.push(async (context, next) => {
  // Todo 找到controller
  await next();
});
```

我们之前已经约定过项目的`controllers`文件夹默认存放`Controller`对象，因此只要遍历该文件夹，找到名为`home.js`的文件，然后调用这个`controller`的相应方法即可

```bash
npm i glob
```
新建`my-node-mvc/loader/controller.js`
```javascript
const glob = require('glob');
const path = require('path');

const controllerMap = new Map(); // 缓存文件名和对应的路径
const controllerClass = new Map(); // 缓存文件名和对应的require对象

class ControllerLoader {
  constructor(controllerPath) {
    this.loadFiles(controllerPath).forEach(filepath => {
      const basename = path.basename(filepath);
      const extname = path.extname(filepath);
      const fileName = basename.substring(0, basename.indexOf(extname));

      if (controllerMap.get(fileName)) {
        throw new Error(`controller文件夹下有${fileName}文件同名!`)
      } else {
        controllerMap.set(fileName, filepath);
      }
    })
  }

  loadFiles(target) {
    const files = glob.sync(`${target}/**/*.js`)
    return files
  }

  getClass(name) {
    if (controllerMap.get(name)) {
      if (!controllerClass.get(name)) {
        const c = require(controllerMap.get(name));
        // 只有用到某个controller才require这个文件
        controllerClass.set(name, c);
      }
      return controllerClass.get(name);
    } else {
      throw new Error(`controller文件夹下没有${name}文件`)
    }
  }

}

module.exports = ControllerLoader
```
因为`controllers`文件夹下可能有非常多的文件，因此我们没必要项目启动时就把所有的文件`require`进来。当某个请求需要调用`home` controller时，我们才动态加载`require('/my-app/controllers/home')`。同一模块标识，node第一次加载完成时会缓存该模块，再次加载时，将会从缓存中获取

修改`my-node-mvc/app.js`

```javascript
const ControllerLoader = require('./loader/controller');
const path = require('path');

class App extends Koa {
  constructor(options = {}) {
    super();
    this.options = options;

    const { projectRoot = process.cwd(), rootControllerPath } = options;
    // 默认controllers目录，你也可以通过配置rootControllerPath参数指定其他路径
    this.rootControllerPath = rootControllerPath || path.join(projectRoot, 'controllers'); 
    this.initController();
    this.initMiddlewares();
  }

  initController() {
    this.controllerLoader = new ControllerLoader(this.rootControllerPath);
  }

  initMiddlewares() {
    // 把controllerLoader传给路由中间件
    this.use(middlewares.route(routes, this.controllerLoader))
  }
}

module.exports = App;
```

`my-node-mvc/middlewares/router.js`

```javascript
// 省略其他代码

controller && args.push(async (context, next) => {
  // 找到controller home.index
  const arr = controller.split('.');
  if (arr && arr.length) {
    const controllerName = arr[0]; // home
    const controllerMethod = arr[1]; // index
    const controllerClass = loader.getClass(controllerName); // 通过loader获取class

    // controller每次请求都要重新new一个，因为每次请求context都是新的
    // 传入context和next
    const controller = new controllerClass(context, next);
    if (controller && controller[controllerMethod]) {
      await controller[controllerMethod](context, next);
    }
  } else {
    await next();
  }
});
```

新建`my-node-mvc/controller.js`

```javascript
class Controller {
  constructor(ctx, next) {
    this.ctx = ctx;
    this.next = next;
  }
}

module.exports = Controller;
```
我们的`my-node-mvc`会提供一个`Controller`基类，所有的业务Controller都要继承于它，于是方法里就能取到`this.ctx`了

`my-node-mvc/index.js`
```javascript
const App = require('./app');
const Controller = require('./controller');

module.exports = {
  App,
  Controller, // 暴露Controller
}
```

```javascript
const { Controller } = require('my-node-mvc');

class Home extends Controller {
  async index() {
    await this.ctx.render('home');
  }
}

module.exports = Home;
```

## 注入Services

```javascript
const { Controller } = require('my-node-mvc');

class Home extends Controller {
  async fetchList() {
    const data = await this.ctx.services.home.getList();
    ctx.body = data;
  }
}

module.exports = Home;
```

`this.ctx`对象上会挂载一个`services`对象，里面包含项目根目录`Services`文件夹下所有的`service`对象

新建`my-node-mvc/loader/service.js`

```javascript
const path = require('path');
const glob = require('glob');

const serviceMap = new Map();
const serviceClass = new Map();
const services = {};

class ServiceLoader {
  constructor(servicePath) {
    this.loadFiles(servicePath).forEach(filepath => {
      const basename = path.basename(filepath);
      const extname = path.extname(filepath);
      const fileName = basename.substring(0, basename.indexOf(extname));

      if (serviceMap.get(fileName)) {
        throw new Error(`servies文件夹下有${fileName}文件同名!`)
      } else {
        serviceMap.set(fileName, filepath);
      }

      const _this = this;

      Object.defineProperty(services, fileName, {
        get() {
          if (serviceMap.get(fileName)) {
            if (!serviceClass.get(fileName)) {
              // 只有用到某个service才require这个文件
              const S = require(serviceMap.get(fileName));
              serviceClass.set(fileName, S);
            }
            const S = serviceClass.get(fileName);
            // 每次new一个新的Service实例
            // 传入context
            return new S(_this.context);
          }
        }
      })

    });
  }

  loadFiles(target) {
    const files = glob.sync(`${target}/**/*.js`)
    return files
  }

  getServices(context) {
    // 更新context
    this.context = context;
    return services;
  }

}

module.exports = ServiceLoader
```

代码基本和`my-node-mvc/loader/controller.js`一个套路，只不过用`Object.defineProperty`定义了`services`对象的get方法，这样调用`services.home`时，就能自动`require('/my-app/services/home')`

然后，我们还需要把这个`services`对象挂载到`ctx`对象上。还记得之前怎么定义全局方法的吗？还是一样的套路（封装的~~千层套路~~）

```javascript
class App extends Koa {

  constructor() {
    this.rootViewPath = rootViewPath || path.join(projectRoot, 'views');
    this.initService();
  }

  initService() {
    this.serviceLoader = new ServiceLoader(this.rootServicePath);
  }

  createContext(req, res) {
    const context = super.createContext(req, res);
    // 注入全局方法
    this.injectUtil(context);

    // 注入Services
    this.injectService(context);

    return context
  }

  injectService(context) {
    const serviceLoader = this.serviceLoader;

    // 给context添加services对象
    Object.defineProperty(context, 'services', {
      get() {
        return serviceLoader.getServices(context)
      }
    })
  }
}
```

同理，我们还需要提供一个`Service`基类，所有的业务Service都要继承于它

新建`my-node-mvc/service.js`

```javascript
class Service {
  constructor(ctx) {
    this.ctx = ctx;
  }
}

module.exports = Service;
```

`my-node-mvc/index.js`
```javascript
const App = require('./app');
const Controller = require('./controller');
const Service = require('./service');

module.exports = {
  App,
  Controller,
  Service, // 暴露Service
}
```

```javascript
const { Service } = require('my-node-mvc');

const posts = [{
  id: 1,
  title: 'this is test1',
}, {
  id: 2,
  title: 'this is test2',
}];

class Home extends Service {
  async getList() {
    return posts;
  }
}

module.exports = Home;
```

## 总结

本文基于`Koa2`从零开始封装了一个很基础的`MVC`框架，希望可以给读者提供一些框架封装的思路和灵感，更多的框架细节，可以看看我写的[**little-node-mvc**](https://github.com/deepred5/little-node-mvc)

当然，本文的封装是非常简陋的，你还可以继续结合公司实际情况，完善更多的功能：比如提供一个`my-node-mvc-template`项目模板，同时再开发一个命令行工具`my-node-mvc-cli`进行模板的拉取和创建

其中，内置中间件和框架的结合才能算是给封装注入了真正的灵魂，我司内部封装了很多通用的业务中间件：鉴权，日志，性能监控，全链路追踪，配置中心等等私有NPM包，通过自研的Node框架可以很方便的整合进来，同时利用脚手架工具，提供了开箱即用的项目模板，为业务减少了很多不必要的开发和运维成本



