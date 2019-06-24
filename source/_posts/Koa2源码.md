---
title: Koa2源码
date: 2019-06-23 16:51:53
tags: [Node, Koa2]
---
Koa和Express算是Node.js中比较轻量的web开发框架，只提供了很基础的路由和http操作，对于实际项目中常见的日志打点，数据库操作等功能，都需要开发者自行开发。因此，各个大厂也基于它们，进一步对框架进行了一些增强:比如基于koa的[egg.js](https://eggjs.org/zh-cn/)，[think.js](https://thinkjs.org/zh-cn/doc/index.html);基于Express的[Nest.js](https://docs.nestjs.com/)，[Sails.js](https://sailsjs.com/)。

Koa本身的特点：
* `context`执行上下文，同时代理了`request`和`response`
* 基于async/await的异步流程控制
* 洋葱模型的中间件执行顺序

Koa的源码十分精简，只有2000多行，非常适合学习：

![koa1](http://pic.deepred5.com/koa1.png)

可以看见，koa主要由4个文件组件：
* `application.js`: 项目的主入口
* `request.js`: 对原生`req`对象的封装
* `response.js`: 对原生`res`对象的封装
* `context.js`: 执行上下文，代理了`request`和`response`


### 原生Node
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
使用原生Node.js创建一个server服务器非常简单，通过`createServer`方法，传入一个回调函数，就可以对一次http请求的`req` `res`进行操作。

不过弊端也很明显：callback函数的代码会随着业务逻辑的堆叠，变得非常臃肿和流程不清晰。同时，原生Node提供的api有时也会让开发者疑惑，比如设置res的状态码
```javascript
response.statusCode = 200;
response.writeHead(200);
```
通过设置`statusCode`属性和调用`writeHead`方法，都可以设置状态码，这就非常混乱了。

### Koa
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
  await next();
  console.log('2-end');
});


app.use(async ctx => {
  console.log('3-start');
  ctx.status = 200;
  ctx.body = 'Hello World';
  console.log('3-end');
});

app.listen(3000);
```

Koa通过中间件的概念，就可以把一个复杂的流程拆分到各个中间件，每个中间件执行一个特定的任务。每个中间件都可以访问`context`对象，它包装了原生的`request`和`response`


### request.js

```javascript
module.exports = {
  get header() {
    return this.req.headers;
  },

  set header(val) {
    this.req.headers = val;
  },
};
```
通过`get` `set`方法，代理了原生的`request`方法

`this.req`此时还没有注入！

### response.js
```javascript
module.exports = {

  get body() {
      return this._body;
  },

  set body(data) {
      this._body = data;
  },

  get status() {
      return this.res.statusCode;
  },

  set status(statusCode) {
      if (typeof statusCode !== 'number') {
          throw new Error('statusCode must be a number!');
      }
      this.res.statusCode = statusCode;
  }

};
```
同样此时`this.res`还没有注入！


### context.js
```javascript
const delegate = require('delegates');

const proto = module.exports = {
  // 自身方法
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


delegate(proto, 'response')
  .method('append')
  .access('body')
  .getter('writable');

/**
 * Request delegation.
 */

delegate(proto, 'request')
  .method('acceptsLanguages')
  .access('querystring')
  .getter('href')
```

`ctx.body`指向`ctx.response.body`。此时，`ctx.response` `ctx.request`还没注入


### application.js


### 中间件
```javascript
const greeting = (firstName, lastName) => firstName + ' ' + lastName
const toUpper = str => str.toUpperCase()

const fn = compose([toUpper, greeting]);

const result = fn('jack', 'smith');

console.log(result);
```
首先看个简单的例子，我们希望把多个函数复合成一个函数，组合通过调用一个函数`fn`，就可以依次从右往左触发`greeting` `toUpper`函数

```javascript
function compose(fns) {
  let length = fns.length;
  let count = length - 1;
  let result = null;

  return function fn1(...args) {
    result = fns[count].apply(null, args);
    if (count <= 0) {
      return result
    }

    count--;
    return fn1(result);
  }
}

function compose(funcs) {
  return funcs.reduce((a, b) => (...args) => a(b(...args)))
}
```

koa的中间件机制类似上面的`compose`，同样是把多个函数包装成一个，但是koa的中间件类似洋葱模型，也就是从A中间件执行到B中间件，B中间件执行完成以后，仍然可以再次回到A中间件

```javascript
function compose (middleware) {
  if (!Array.isArray(middleware)) throw new TypeError('Middleware stack must be an array!')
  for (const fn of middleware) {
    if (typeof fn !== 'function') throw new TypeError('Middleware must be composed of functions!')
  }

  /**
   * @param {Object} context
   * @return {Promise}
   * @api public
   */

  return function (context, next) {
    // last called middleware #
    let index = -1
    return dispatch(0)
    function dispatch (i) {
      if (i <= index) return Promise.reject(new Error('next() called multiple times'))
      index = i
      let fn = middleware[i]
      if (i === middleware.length) fn = next
      if (!fn) return Promise.resolve()
      try {
        return Promise.resolve(fn(context, dispatch.bind(null, i + 1)));
      } catch (err) {
        return Promise.reject(err)
      }
    }
  }
}


const context = {};

const sleep = (time) => new Promise(resolve => setTimeout(resolve, time));

const test1 = async (context, next) => {
  console.log('1-start');
  context.age = 11;
  await next();
  context.name = 'tc';
  console.log('1-end');
};

const test2 = async (context, next) => {
  console.log('context', context);
  console.log('2-start');
  await sleep(2000);
  console.log('2-end');
};

const fn = compose([test1, test2]);

fn(context).then(() => {
  console.log('end');
  console.log(context);
})

```