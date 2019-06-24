---
title: Koa源码浅析
date: 2019-06-24 21:29:46
tags: [Node]
toc: true
---
Koa源码十分精简，只有不到2k行的代码，总共由4个模块文件组成，非常适合我们来学习。
![koa1](http://pic.deepred5.com/koa1.png)

我们先来看段原生Node实现Server服务器的代码：
```javascript
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('hello world');
});

server.listen(3000, () => {
  console.log('server start at 3000');
});
```
非常简单的几行代码，就实现了一个服务器Server。`createServer`方法接收的`callback`回调函数，可以对每次请求的`req` `res`对象进行各种操作，最后返回结果。不过弊端也很明显，`callback`函数非常容易随着业务逻辑的复杂也变得臃肿，即使把`callback`函数拆分成各个小函数，也会在繁杂的异步回调中渐渐失去对整个流程的把控。

另外，Node原生提供的一些API，有时也会让开发者疑惑:
```javascript
res.statusCode = 200;
res.writeHead(200);
```
修改`res`的属性或者调用`res`的方法都可以改变`http`状态码，这在多人协作的项目中，很容易产生不同的代码风格。

<!-- more -->

我们再来看段Koa实现Server:
```javascript
const Koa = require('koa');
const app = new Koa();

app.use(async (ctx, next) => {
  console.log('1-start');
  await next();
  console.log('1-end');
});


app.use(async (ctx, next) => {
  console.log('2-start');
  ctx.status = 200;
  ctx.body = 'Hello World';
  console.log('2-end');
});


app.listen(3000);

// 最后输出内容：
// 1-start
// 2-start
// 2-end
// 1-end
```
Koa使用了中间件的概念来完成对一个http请求的处理，同时，Koa采用了async和await的语法使得异步流程可以更好的控制。`ctx`执行上下文代理了原生的`res`和`req`，这让开发者避免接触底层，而是通过代理访问和设置属性。

看完两者的对比后，我们应该会有几个疑惑：
* `ctx.status`为什么就可以直接设置状态码了，不是根本没看到`res`对象吗？
* 中间件中的`next`到底是啥？为什么执行`next`就进入了下一个中间件？
* 所有中间件执行完成后，为什么可以再次返回原来的中间件(洋葱模型)？

现在让我们带着疑惑，进行源码解读，同时自己实现一个简易版的Koa吧！


### 封装http Server

```javascript
// Koa的使用方法
const Koa = require('koa');
const app = new Koa();

app.use(async ctx => {
  ctx.body = 'Hello World';
});

app.listen(3000);
```
我们首先模仿koa的使用方法，搭建一个最简易的骨架：

新建`kao/application.js`(特意使用了**Kao**，区别`Koa`，并非笔误!!!)
```javascript
const http = require('http');

class Application {
  constructor() {
    this.callbackFn = null;
  }

  use(fn) {
    this.callbackFn = fn;
  }

  callback() {
    return (req, res) => this.callbackFn(req, res)
  }

  listen(...args) {
    const server = http.createServer(this.callback());
    return server.listen(...args);
  }
}

module.exports = Application;
```
新建测试文件`kao/index.js`
```javascript
const Kao = require('./application');
const app = new Kao();

app.use(async (req, res) => {
  res.writeHead(200);
  res.end('hello world');
});

app.listen(3001, () => {
  console.log('server start at 3001');
});
```
我们已经初步封装好httP server：通过`new`实例一个对象，`use`注册回调函数，`listen`启动server并传入回调。

注意的是：调用`new`时，其实没有开启server服务器，真正开启是在`listen`调用时。

不过这段代码有明显的不足:
* use传入的回调函数，接收的参数依旧是原生的`req`和`res`
* 多次调用use，会覆盖上一个中间件，并不是依次执行多个中间件

我们先来解决第一个问题

### 封装req和res对象，构造context
先来介绍下ES6中的get和set [参考](https://segmentfault.com/a/1190000009029639)

基于普通对象的get和set
```javascript
const demo = {
  _name: '',
  get name() {
    return this._name;
  },

  set name(val) {
    this._name = val;
  }
};

demo.name = 'deepred';
console.log(demo.name);
```

基于`Class`的get和set
```javascript
class Demo {
  constructor() {
    this._name = '';
  }

  get name() {
    return this._name;
  }

  set name(val) {
    this._name = val;
  }
}

const demo = new Demo();
demo.name = 'deepred';
console.log(demo.name);
```

基于`Object.defineProperty`的get和set
```javascript
const demo = {
  _name: ''
};

Object.defineProperty(demo, 'name', {
  get: function() {
    return this._name
  },

  set: function(val) {
    this._name = val;
  }
});
```

还有`__defineSetter__`和`__defineGetter__`的实现，不过现已废弃。

主要区别是，`Object.defineProperty` `__defineSetter__`可以动态设置属性，而其他方式只能在定义时设置。

Koa源码中 `request.js`和`response.js`就使用了大量的`get`和`set`来代理

新建`kao/request.js`
```javascript
module.exports = {
  get header() {
    return this.req.headers;
  },

  set header(val) {
    this.req.headers = val;
  },

  get url() {
    return this.req.url;
  },

  set url(val) {
    this.req.url = val;
  },
}
```
当访问`request.url`时，其实就是在访问原生的`req.url`。需要注意的是，`this.req`原生对象此时还没有注入！

同理新建`kao/response.js`
```javascript
module.exports = {
  get status() {
    return this.res.statusCode;
  },

  set status(code) {
    this.res.statusCode = code;
  },

  get body() {
    return this._body;
  },

  set body(val) {
    // 源码里有对val类型的各种判断，这里省略
    this._body = val;
  }
}
```
这里对body进行操作并没有使用原生的this.res.end，因为在我们编写koa代码的时候，会对body进行多次的读取和修改，所以真正返回浏览器信息的操作是在`application.js`里进行封装和操作

同样需要注意的是，`this.res`原生对象此时还没有注入！

新建`kao/context.js`
```javascript
const delegate = require('delegates');

const proto = module.exports = {
  // context自身的方法
  toJSON() {
    return {
      request: this.request.toJSON(),
      response: this.response.toJSON(),
      app: this.app.toJSON(),
      originalUrl: this.originalUrl,
      req: '<original node req>',
      res: '<original node res>',
      socket: '<original node socket>'
    };
  },
}

// method是委托方法，getter委托getter,access委托getter和setter。

// proto.status => proto.response.status
delegate(proto, 'response')
  .access('status')
  .access('body')


// proto.url = proto.request.url
delegate(proto, 'request')
  .access('url')
  .getter('header')
```
`context.js`代理了`request`和`response`。`ctx.body`指向`ctx.response.body`。但是此时`ctx.response` `ctx.request`还没注入！

真正注入原生对象，是在`application.js`里注入的！！！
```javascript
const http = require('http');
const context = require('./context');
const request = require('./request');
const response = require('./response');

class Application {
  constructor() {
    this.callbackFn = null;
    this.context = Object.create(context);
    this.request = Object.create(request);
    this.response = Object.create(response);
  }

  use(fn) {
    this.callbackFn = fn;
  }

  callback() {
    const handleRequest = (req, res) => {
      const ctx = this.createContext(req, res);
      return this.handleRequest(ctx)
    };

    return handleRequest;
  }

  handleRequest(ctx) {
    const handleResponse = () => respond(ctx);
    return this.callbackFn(ctx).then(handleResponse);
  }

  createContext(req, res) {
    // 针对每个请求，都要创建ctx对象
    let ctx = Object.create(this.context);
    ctx.request = Object.create(this.request);
    ctx.response = Object.create(this.response);
    ctx.req = ctx.request.req = req;
    ctx.res = ctx.response.res = res;
    return ctx;
  }

  listen(...args) {
    const server = http.createServer(this.callback());
    return server.listen(...args);
  }
}

module.exports = Application;

function respond(ctx) {
  // 根据ctx.body的类型，返回最后的数据
  let content = ctx.body;
  if (typeof content === 'string') {
    ctx.res.end(content);
  }
  else if (typeof content === 'object') {
    ctx.res.end(JSON.stringify(content));
  }
}
```