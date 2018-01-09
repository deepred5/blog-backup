---
title: Node中使用ES6语法
date: 2018-01-04 14:55:21
tags: [babel, es6]
reward: true
---
Node本身已经支持部分ES6语法，但是`import` `export`，以及`async` `await`(**Node 8 已经支持**)等一些语法，我们还是无法使用。为了能使用这些新特性，我们就需要使用babel把ES6转成ES5语法

### 安装babel

```javascript
npm install babel-cli -g
```

<!-- more -->

### 基础知识
babel的配置文件是`.babelrc`

```javascript
{
    "presets": []
}
```
新建一个`demo`文件夹，文件夹下新建 `1.js`
```
const arr = [1, 2, 3];
arr.map(item => item + 1);
```
同时新建`.babelrc`配置文件
```javascript
{
    "presets": []
}
```
终端运行
```
babel 1.js -o dist.js
```
可以看见，在文件夹下，新建了一个dist.js，这就是babel转码后的文件
但是，dist.js目前是没有任何变化的，因为我们在配置文件里面没有声明转码规则,所以babel无法转码

安装转码插件
```
npm install --save-dev babel-preset-es2015  babel-preset-stage-0
```

修改配置文件
```javascript
{
    "presets": [
        "es2015",
        "stage-0"
    ]
}
```
`es2015`可以转码es2015的语法规则，`stage-0`可以转码ES7语法(比如async await)

再次运行终端
```
babel 1.js -o dist.js
```
可以看见，箭头函数被转码了

```javascript
var arr = [1, 2, 3];

arr.map(function (item) {
  return item + 1;
});
```

我们试下async await
```javascript
async function start() {
    const data = await test();
    console.log(data);
}

function test() {
    return new Promise((resolve, reject) => {
        resolve('ok');
    })
}
```
转码后的文件
```javascript
'use strict';

var start = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var data;
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        _context.next = 2;
                        return test();

                    case 2:
                        data = _context.sent;

                        console.log(data);

                    case 4:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));

    return function start() {
        return _ref.apply(this, arguments);
    };
}();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function test() {
    return new Promise(function (resolve, reject) {
        resolve('ok');
    });
}

```

再试下 import export

`util.js`
```javascript
export default function say() {
    console.log('2333');
}
```

`1.js`
```javascript
import say from './util';

say();

```

这次，要把`1.js`和`util.js`都转码，我们可以把整个文件夹转码
```
babel demo -d dist
```
新生成的dist文件夹下，就有转码后的文件。可以看见，转码后，仍然使用的是`module.exports`CMD模块加载

### babel-preset-env
上面的转码其实有个缺陷，就是babel会默认把所有的代码转成es5，这意味着，即使node支持`let`关键字，转码后，也会被转成`var`
我们可以使用`babel-preset-env`这个插件，它会自动检测当前node版本，只转码node不支持的语法，非常方便

```
npm install --save-dev babel-preset-env
```

`.babelrc`
```
{
    "presets": [
      ["env", {
        "targets": {
          "node": "current"
        }
      }]
    ]
  }
```

`1.js`
```javascript
class F {
    say() {
        
    }
}
const a = 1;
```

```
babel 1.js -o dist.js
```

编译出来后
```javascript
"use strict";

class F {
    say() {}
}

const a = 1;

```
可以看见，`class`和`const`并没有被转码，因为当前node版本(8.9.3)支持该语法

### 在实际项目中使用ES6语法

Koa2需要Node v7.6.0以上的版本来支持`async`语法，同时，我们也想在Koa2中使用`import`模块化写法

```
npm install --save-dev babel-register
```

```
npm install koa --save
```

新建一个文件夹`app`

`util.js`
```javascript
export function getMessage() {
    return new Promise((resolve, reject) => {
        resolve('Hello World!');
    })
}
```

`app.js`
```javascript
import Koa from 'koa';
import { getMessage } from './util'
const app = new Koa();

app.use(async ctx => {
    const data = await getMessage();
    ctx.body = data;
});

app.listen(3000);
```

如果直接启动文件，肯定会报错
```
node app
```

我们需要一个入口文件，来转码

`index.js`
```javascript
require("babel-register");
require("./app.js");
```

```
node index
```
访问[http://localhost:3000/](http://localhost:3000/)可以看见页面了！

`babel-register`是实时转码的，所以实际发布时，应该先把整个app文件夹转码

```
babel app -d dist
```

这次，只要启动dist下的`app.js`即可
```
node app
```