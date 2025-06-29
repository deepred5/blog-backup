---
title: Koa源码浅析
pubDatetime: 2019-06-24T13:29:46.000Z
tags:
  - Node.js
description: Koa源码浅析
---
Koa源码十分精简，只有不到2k行的代码，总共由4个模块文件组成，非常适合我们来学习。
![koa1](@/assets/images/Koa源码浅析/koa1.png)

参考代码: [learn-koa2](https://github.com/deepred5/learn-koa2) 

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

现在让我们带着疑惑，进行源码解读，同时自己实现一个简易版的[Koa](https://github.com/deepred5/learn-koa2/tree/master/kao)吧！


### 封装http Server
参考代码: [step-1](https://github.com/deepred5/learn-koa2/tree/master/step-1)
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
我们已经初步封装好http server：通过`new`实例一个对象，`use`注册回调函数，`listen`启动server并传入回调。

注意的是：调用`new`时，其实没有开启server服务器，真正开启是在`listen`调用时。

不过这段代码有明显的不足:
* use传入的回调函数，接收的参数依旧是原生的`req`和`res`
* 多次调用use，会覆盖上一个中间件，并不是依次执行多个中间件

我们先来解决第一个问题

### 封装req和res对象，构造context
参考代码: [step-2](https://github.com/deepred5/learn-koa2/tree/master/step-2)

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

基于`Proxy`的get和set
```javascript
const demo = {
  _name: ''
};

const proxy = new Proxy(demo, {
  get: function(target, name) {
    return name === 'name' ? target['_name'] : undefined;
  },

  set: function(target, name, val) {
    name === 'name' && (target['_name'] = val)
  }
});
```

还有`__defineSetter__`和`__defineGetter__`的实现，不过现已废弃。
```javascript
const demo = {
  _name: ''
};

demo.__defineGetter__('name', function() {
  return this._name;
});

demo.__defineSetter__('name', function(val) {
  this._name = val;
});
```

主要区别是，`Object.defineProperty` `__defineSetter__` `Proxy`可以动态设置属性，而其他方式只能在定义时设置。

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
    /* 可能的类型
    1. string
    2. Buffer
    3. Stream
    4. Object
    */
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

// delegates 原理就是__defineGetter__和__defineSetter__

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

可能会有疑问，为什么`response.js`和`request.js`使用`get set`代理，而`context.js`使用`delegate`代理? 原因主要是: `set`和`get`方法里面还可以加入一些自己的逻辑处理。而`delegate`就比较纯粹了，只代理属性。
```javascript
{
  get length() {
    // 自己的逻辑
    const len = this.get('Content-Length');
    if (len == '') return;
    return ~~len;
  },
}

// 仅仅代理属性
delegate(proto, 'response')
  .access('length')
```
因此`context.js`比较适合使用`delegate`，仅仅是代理`request`和`response`的属性和方法。

真正注入原生对象，是在`application.js`里的`createContext`方法中注入的！！！
```javascript
const http = require('http');
const context = require('./context');
const request = require('./request');
const response = require('./response');

class Application {
  constructor() {
    this.callbackFn = null;
    // 每个Kao实例的context request respones
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
    // callbackFn是个async函数，最后返回promise对象
    return this.callbackFn(ctx).then(handleResponse);
  }

  createContext(req, res) {
    // 针对每个请求，都要创建ctx对象
    // 每个请求的ctx request response
    // ctx代理原生的req res就是在这里代理的
    let ctx = Object.create(this.context);
    ctx.request = Object.create(this.request);
    ctx.response = Object.create(this.response);
    ctx.req = ctx.request.req = req;
    ctx.res = ctx.response.res = res;
    ctx.app = ctx.request.app = ctx.response.app = this;
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
  /* 可能的类型，代码删减了部分判断
  1. string
  2. Buffer
  3. Stream
  4. Object
  */
  let content = ctx.body;
  if (typeof content === 'string') {
    ctx.res.end(content);
  }
  else if (typeof content === 'object') {
    ctx.res.end(JSON.stringify(content));
  }
}
```
代码中使用了`Object.create`的方法创建一个全新的对象，通过原型链继承原来的属性。这样可以有效的防止污染原来的对象。

`createContext`在每次http请求时都会调用，每次调用都新生成一个`ctx`对象，并且代理了这次http请求的原生的对象。

`respond`才是最后返回http响应的方法。根据执行完所有中间件后`ctx.body`的类型，调用`res.end`结束此次http请求。

![koa2](@/assets/images/Koa源码浅析/koa2.png)

现在我们再来测试一下:
`kao/index.js`
```javascript
const Kao = require('./application');
const app = new Kao();

// 使用ctx修改状态码和响应内容
app.use(async (ctx) => {
  ctx.status = 200;
  ctx.body = {
    code: 1,
    message: 'ok',
    url: ctx.url
  };
});

app.listen(3001, () => {
  console.log('server start at 3001');
});
```

### 中间件机制
参考代码: [step-3](https://github.com/deepred5/learn-koa2/tree/master/step-3)
```javascript
const greeting = (firstName, lastName) => firstName + ' ' + lastName
const toUpper = str => str.toUpperCase()

const fn = compose([toUpper, greeting]);

const result = fn('jack', 'smith');

console.log(result);
```
函数式编程有个`compose`的概念。比如把`greeting`和`toUpper`组合成一个复合函数。调用这个复合函数，会先调用`greeting`，然后把返回值传给`toUpper`继续执行。

实现方式:
```javascript
// 命令式编程（面向过程）
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

// 声明式编程(函数式)
function compose(funcs) {
  return funcs.reduce((a, b) => (...args) => a(b(...args)))
}
```
Koa的中间件机制类似上面的`compose`，同样是把多个函数包装成一个，但是koa的中间件类似洋葱模型，也就是从A中间件执行到B中间件，B中间件执行完成以后，仍然可以再次回到A中间件。
![onion](@/assets/images/Koa源码浅析/onion.png)

Koa使用了`koa-compose`实现了中间件机制，源码非常精简，但是有点难懂。建议先了解下[递归](http://anata.me/2018/07/30/%E7%AE%80%E5%8D%95%E6%98%93%E6%87%82%E7%9A%84%E7%8E%B0%E4%BB%A3%E9%AD%94%E6%B3%95-%E9%80%92%E5%BD%92/)
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
      // 一个中间件里多次调用next
      if (i <= index) return Promise.reject(new Error('next() called multiple times'))
      index = i
      // fn就是当前的中间件
      let fn = middleware[i]
      if (i === middleware.length) fn = next // 最后一个中间件如果也next时进入(一般最后一个中间件是直接操作ctx.body，并不需要next了)
      if (!fn) return Promise.resolve() // 没有中间件，直接返回成功
      try {
        
        /* 
          * 使用了bind函数返回新的函数，类似下面的代码
          return Promise.resolve(fn(context, function next () {
            return dispatch(i + 1)
          }))
        */
        // dispatch.bind(null, i + 1)就是中间件里的next参数，调用它就可以进入下一个中间件

        // fn如果返回的是Promise对象，Promise.resolve直接把这个对象返回
        // fn如果返回的是普通对象，Promise.resovle把它Promise化
        return Promise.resolve(fn(context, dispatch.bind(null, i + 1)));
      } catch (err) {
        // 中间件是async的函数，报错不会走这里，直接在fnMiddleware的catch中捕获
        // 捕获中间件是普通函数时的报错,Promise化，这样才能走到fnMiddleware的catch方法
        return Promise.reject(err)
      }
    }
  }
}
```
```javascript
const context = {};

const sleep = (time) => new Promise(resolve => setTimeout(resolve, time));

const test1 = async (context, next) => {
  console.log('1-start');
  context.age = 11;
  await next();
  console.log('1-end');
};

const test2 = async (context, next) => {
  console.log('2-start');
  context.name = 'deepred';
  await sleep(2000);
  console.log('2-end');
};

const fn = compose([test1, test2]);

fn(context).then(() => {
  console.log('end');
  console.log(context);
});
```
递归调用栈的执行情况：
![koa](@/assets/images/Koa源码浅析/koa.gif)

弄懂了中间件机制，我们应该可以回答之前的问题：

> `next`到底是啥？洋葱模型是怎么实现的？

next就是一个包裹了dispatch的函数

在第n个中间件中执行next，就是执行dispatch(n+1)，也就是进入第n+1个中间件

因为dispatch返回的都是Promise，所以在第n个中间件await next(); 进入第n+1个中间件。当第n+1个中间件执行完成后，可以返回第n个中间件

如果在某个中间件中不再调用next，那么它之后的所有中间件都不会再调用了



修改`kao/application.js`
```javascript
class Application {
  constructor() {
    this.middleware = []; // 存储中间件
    this.context = Object.create(context);
    this.request = Object.create(request);
    this.response = Object.create(response);
  }

  use(fn) {
    this.middleware.push(fn); // 存储中间件
  }

  compose (middleware) {
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
  

  callback() {
    // 合成所有中间件
    const fn = this.compose(this.middleware);

    const handleRequest = (req, res) => {
      const ctx = this.createContext(req, res);
      return this.handleRequest(ctx, fn)
    };

    return handleRequest;
  }

  handleRequest(ctx, fnMiddleware) {
    const handleResponse = () => respond(ctx);
    // 执行中间件并把最后的结果交给respond
    return fnMiddleware(ctx).then(handleResponse);
  }

  createContext(req, res) {
    // 针对每个请求，都要创建ctx对象
    let ctx = Object.create(this.context);
    ctx.request = Object.create(this.request);
    ctx.response = Object.create(this.response);
    ctx.req = ctx.request.req = req;
    ctx.res = ctx.response.res = res;
    ctx.app = ctx.request.app = ctx.response.app = this;
    return ctx;
  }

  listen(...args) {
    const server = http.createServer(this.callback());
    return server.listen(...args);
  }
}

module.exports = Application;

function respond(ctx) {
  let content = ctx.body;
  if (typeof content === 'string') {
    ctx.res.end(content);
  }
  else if (typeof content === 'object') {
    ctx.res.end(JSON.stringify(content));
  }
}
```
测试一下
```javascript
const Kao = require('./application');
const app = new Kao();

app.use(async (ctx, next) => {
  console.log('1-start');
  await next();
  console.log('1-end');
})

app.use(async (ctx) => {
  console.log('2-start');
  ctx.body = 'hello tc';
  console.log('2-end');
});

app.listen(3001, () => {
  console.log('server start at 3001');
});

// 1-start 2-start 2-end 1-end

```

### 错误处理机制
参考代码: [step-4](https://github.com/deepred5/learn-koa2/tree/master/step-4)

因为`compose`组合之后的函数返回的仍然是Promise对象，所以我们可以在`catch`捕获异常

`kao/application.js`
```javascript
handleRequest(ctx, fnMiddleware) {
  const handleResponse = () => respond(ctx);
  const onerror = err => ctx.onerror(err);
  // catch捕获，触发ctx的onerror方法
  return fnMiddleware(ctx).then(handleResponse).catch(onerror);
}
```

`kao/context.js`
```javascript
const proto = module.exports = {
  // context自身的方法
  onerror(err) {
    // 中间件报错捕获
    const { res } = this;

    if ('ENOENT' == err.code) {
      err.status = 404;
    } else {
      err.status = 500;
    }
    this.status = err.status;
    res.end(err.message || 'Internal error');
  }
}
```
```javascript
const Kao = require('./application');
const app = new Kao();

app.use(async (ctx) => {
  // 报错可以捕获
  a.b.c = 1;
  ctx.body = 'hello tc';
});

app.listen(3001, () => {
  console.log('server start at 3001');
});
```
现在我们已经实现了中间件的错误异常捕获，但是我们还缺少框架层发生错误的捕获机制。我们可以让`Application`继承原生的`Emitter`，从而实现`error`监听

`kao/application.js`
```javascript
const Emitter = require('events');

// 继承Emitter
class Application extends Emitter {
  constructor() {
    // 调用super
    super();
    this.middleware = [];
    this.context = Object.create(context);
    this.request = Object.create(request);
    this.response = Object.create(response);
  }
}
```
`kao/context.js`
```javascript
const proto = module.exports = {
  onerror(err) {
    const { res } = this;

    if ('ENOENT' == err.code) {
      err.status = 404;
    } else {
      err.status = 500;
    }

    this.status = err.status;

    // 触发error事件
    this.app.emit('error', err, this);

    res.end(err.message || 'Internal error');
  }
}
```

```javascript
const Kao = require('./application');
const app = new Kao();

app.use(async (ctx) => {
  // 报错可以捕获
  a.b.c = 1;
  ctx.body = 'hello tc';
});

app.listen(3001, () => {
  console.log('server start at 3001');
});

// 监听error事件
app.on('error', (err) => {
  console.log(err.stack);
});
```

至此我们可以了解到Koa异常捕获的两种方式：
* 中间件捕获(Promise catch)
* 框架捕获(Emitter error)

```js
// 捕获全局异常的中间件
app.use(async (ctx, next) => {
  try {
    await next()
  } catch (error) {
    return ctx.body = 'error'
  }
}
)
```
```js
// 事件监听
app.on('error', err => {
  console.log('error happends: ', err.stack);
});
```

### 总结
Koa整个流程可以分成三步:

**初始化阶段:**
```javascript
const Koa = require('koa');
const app = new Koa();

app.use(async ctx => {
  ctx.body = 'Hello World';
});

app.listen(3000);
```

`new`初始化一个实例，`use`搜集中间件到middleware数组，`listen` 合成中间件`fnMiddleware`，返回一个callback函数给`http.createServer`，开启服务器，等待http请求。


**请求阶段:**

每次请求，`createContext`生成一个新的`ctx`，传给`fnMiddleware`，触发中间件的整个流程

**响应阶段:**

整个中间件完成后，调用`respond`方法，对请求做最后的处理，返回响应给客户端。

参考下面的流程图:
![koa3](@/assets/images/Koa源码浅析/koa3.png)

公司内部技术分享[PPT](http://pic.deepred5.com/3_koa%E6%BA%90%E7%A0%81%E6%B5%85%E6%9E%90.pptx)
