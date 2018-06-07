---
title: 使用模块化工具打包自己开发的JS库
date: 2018-06-06 16:57:22
tags: [webpack, rollup]
toc: true
---
最近有个需求，需要为小程序写一个SDK，监控小程序的API调用和页面报错(类似[fundebug](https://docs.fundebug.com/notifier/wxjs/integration/))

听起来高大上的SDK，其实就是一个JS文件，类似平时开发中我们引入的第三方库:
```javascript
const moment = require('moment');
moment().format();
```
小程序的模块化采用了Commonjs规范。也就是说，我需要提供一个`monitor.js`文件，并且该文件需要支持Commonjs，从而可以在小程序的入口文件`app.js`中导入：  
```javascript
// 导入sdk
const monitor = require('./lib/monitor.js');
monitor.init('API-KEY');

// 正常业务逻辑
App({
    ...
})
```
所以问题来了，我应该怎么开发这个SDK? (**注意：本文并不具体讨论怎么实现监控小程序**)

<!-- more -->

方案有很多种：比如直接把所有的逻辑写在一个`monitor.js`文件里，然后导出
```javascript
module.exports = {
    // 各种逻辑
}
```
但是考虑到代码量，为了降低耦合度，我还是倾向于把代码拆分成不同模块，最后把所有JS文件打包成一个`monitor.js`。平时有使用过Vue和React开发的同学，应该能体会到模块化开发的好处。

[**演示代码下载**](https://github.com/deepred5/rollup-webpack-demo)

如下是定义的目录结构：
![pic](http://pic.deepred5.com/lib-1.png)

src目录下存放源代码，dist目录打包最后的`monitor.js`

`src/main.js` SDK入口文件
```javascript
import { Engine } from './module/Engine';

let monitor = null;

export default {
    init: function (appid) {
        if (!appid || monitor) {
            return;
        }
        monitor = new Engine(appid);
    }
}
```
`src/module/Engine.js`
```javascript
import { util } from '../util/';

export class Engine {
    constructor(appid) {
        this.id = util.generateId();
        this.appid = appid;
        this.init();
    }

    init() {
        console.log('开始监听小程序啦~~~');
    }
}
```
`src/util/index.js`
```javascript
export const util = {
    generateId() {
        return Math.random().toString(36).substr(2);
    }
}
```

所以，怎么把这堆js打包成最后的`monitor.js`文件，并且程序可以正确执行？

## webpack
我第一个想到的就是用webpack打包，毕竟工作经常用React开发，最后打包项目用的就是它。
**基于webpack4.x版本**
```
npm i webpack webpack-cli --save-dev
```

靠着我对于webpack玄学的微薄知识，<del>含泪</del>写下了几行配置:
`webpack.config.js`
```javascript
var path = require('path');
var webpack = require('webpack');
module.exports = {
    mode: 'development',
    entry: './src/main.js',
    output: {
        path: path.resolve(__dirname, './dist'),
        publicPath: '/dist/',
        filename: 'monitor.js',
    }
};
```
运行`webpack`，打包倒是打包出来了，但是引入到小程序里试试

小程序入口文件`app.js`
```javascript
var monitor = require('./dist/monitor.js');
```
控制台直接报错。。。
![](http://pic.deepred5.com/lib-2.png)
<img src="http://pic.deepred5.com/lib-5.jpg" width="160px"/>

原因很简单：打包出来的`monitor.js`使用了`eval`关键字，而小程序内部并支持eval。

我们只需要更改webpack配置的`devtool`即可
```javascript
var path = require('path');
var webpack = require('webpack');
module.exports = {
    mode: 'development',
    entry: './src/main.js',
    output: {
        path: path.resolve(__dirname, './dist'),
        publicPath: '/dist/',
        filename: 'monitor.js',
    },
    devtool: 'source-map'
};
```
`source-map`模式就不会使用`eval`关键字来方便debug,它会多生成一个`monitor.js.map`文件来方便debug

再次`webpack`打包，然后导入小程序，问题又来了：
```javascript
var monitor = require('./dist/monitor.js');
console.log(monitor); // {}
```
打印出来的是一个空对象！

`src/main.js`
```javascript
import { Engine } from './module/Engine';

let monitor = null;

export default {
    init: function (appid) {
        if (!appid || monitor) {
            return;
        }
        monitor = new Engine(appid);
    }
}
```
`monitor.js`并没有导出一个含有init方法的对象!

我们希望的是`monitor.js`符合commonjs规范，但是我们在配置中并没有指出，所以webpack打包出来的文件，什么也没导出。

我们平时开发中，打包时也不需要导出一个变量，只要打包的文件能在浏览器上立即执行即可。你随便翻一个Vue或React的项目，看看入口文件是咋写的?
`main.js`
```javascript
import Vue from 'vue'
import App from './App'

new Vue({
  el: '#app',
  components: { App },
  template: '<App/>'
})
```
```javascript
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App.js';

ReactDOM.render(
    <App />,
  document.getElementById('root')
);
```
是不是都类似这样的套路，最后只是立即执行一个方法而已，并没有导出一个变量。

## libraryTarget
libraryTarget就是问题的关键，通过设置该属性，我们可以让webpack知道使用何种规范导出一个变量
```javascript
var path = require('path');
var webpack = require('webpack');
module.exports = {
    mode: 'development',
    entry: './src/main.js',
    output: {
        path: path.resolve(__dirname, './dist'),
        publicPath: '/dist/',
        filename: 'monitor.js',
        libraryTarget: 'commonjs2'
    },
    devtool: 'source-map'
    
};
```
`commonjs2`就是我们希望的commonjs规范

重新打包，这次就正确了
```javascript
var monitor = require('./dist/monitor.js');
console.log(monitor);
```
![](http://pic.deepred5.com/lib-3.png)

我们导出的对象挂载到了`default`属性上，因为我们当初导出时：
```javascript
export default {
    init: function (appid) {
        if (!appid || monitor) {
            return;
        }
        monitor = new Engine(appid);
    }
}
```
现在，我们可以愉快的导入SDK了
```javascript
var monitor = require('./dist/monitor.js').default;
monitor.init('45454');
```
![](http://pic.deepred5.com/lib-4.png)

你可能注意到，我打包时并没有使用babel，因为小程序是支持es6语法的，所以开发该sdk时无需再转一遍，如果你开发的类库需要兼容浏览器，则可以加一个babel-loader
```javascript
module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/
            }
        ]
    }
```

注意点：
1. 平时开发调试sdk时可以直接`webpack -w`
2. 最后打包时，使用`webpack -p`进行压缩

完整的`webpack.config.js`
```javascript
var path = require('path');
var webpack = require('webpack');
module.exports = {
    mode: 'development', // production
    entry: './src/main.js',
    output: {
        path: path.resolve(__dirname, './dist'),
        publicPath: '/dist/',
        filename: 'monitor.js',
        libraryTarget: 'commonjs2'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/
            }
        ]
    },
    devtool: 'source-map' // 小程序不支持eval-source-map
};
```
其实，使用webpack打包纯JS类库是很简单的，比我们平时开发一个应用，配置少了很多，毕竟不需要打包css，html，图片，字体这些静态资源，也不用按需加载。

## rollup
文章写到这里本来可以结束了，但是在前期调研如何打包模块的时候，我特意看了下Vue和React是怎么打包代码的，结果发现，这俩都没使用webpack，而是使用了rollup。

> Rollup 是一个 JavaScript 模块打包器，可以将小块代码编译成大块复杂的代码，例如 library 或应用程序。

[Rollup官网](https://rollupjs.org/guide/zh)的这段介绍，正说明了rollup就是用来打包library的。

如果你有兴趣，可以看一下webpack打包后的`monitor.js`，绝对会吐槽，这一坨代码是啥东西？
```javascript
module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}


// 以下省略1万行代码
```
webpack自己实现了一套`__webpack_exports__` `__webpack_require__`  `module`机制
```javascript
/***/ "./src/util/index.js":
/*!***************************!*\
  !*** ./src/util/index.js ***!
  \***************************/
/*! exports provided: util */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "util", function() { return util; });
const util = {
    generateId() {
        return Math.random().toString(36).substr(2);
    }
}

/***/ })
```
它把每个js文件包裹在一个函数里，实现模块间的引用和导出。

如果使用rollup打包，你就会惊讶的发现，打包后的代码可读性简直和webpack不是一个级别！

```
npm install --global rollup
```
新建一个`rollup.config.js`
```javascript
export default {
  input: './src/main.js',
  output: {
    file: './dist/monitor.js',
    format: 'cjs'
  }
};
```
`format: cjs`指定打包后的文件符合commonjs规范

运行`rollup -c`

这时会报错，说`[!] Error: Could not resolve '../util' from src\module\Engine.js`

这是因为，rollup识别`../util/`时，并不会自动去查找util目录下的`index.js`文件(webpack默认会去查找)，所以我们需要改成`../util/index`

打包后的文件：
```javascript
'use strict';

const util = {
    generateId() {
        return Math.random().toString(36).substr(2);
    }
};

class Engine {
    constructor(appid) {
        this.id = util.generateId();
        this.appid = appid;
        this.init();
    }

    init() {
        console.log('开始监听小程序啦~~~');
    }
}

let monitor = null;

var main = {
    init: function (appid) {
        if (!appid || monitor) {
            return;
        }
        monitor = new Engine(appid);
    }
}

module.exports = main;
```
是不是超简洁！

而且导入的时候，无需再写个default属性
webpack打包
```javascript
var monitor = require('./dist/monitor.js').default;
monitor.init('45454');
```
rollup打包
```javascript
var monitor = require('./dist/monitor.js');
monitor.init('45454');
```
同样，平时开发时我们可以直接`rollup -c -w`，最后打包时，也要进行压缩
```
npm i rollup-plugin-uglify -D
```
```javascript
import { uglify } from 'rollup-plugin-uglify';
export default {
  input: './src/main.js',
  output: {
    file: './dist/monitor.js',
    format: 'cjs'
  },
  plugins: [
    uglify()
  ]
};
```
然而这样运行会报错，因为uglify插件只支持es5的压缩，而我这次开发的sdk并不需要转成es5，所以换一个插件
```
npm i rollup-plugin-terser -D
```
```javascript
import { terser } from 'rollup-plugin-terser';
export default {
  input: './src/main.js',
  output: {
    file: './dist/monitor.js',
    format: 'cjs'
  },
  plugins: [
    terser()
  ]
};

```
当然，你也可以使用babel转码
```
npm i rollup-plugin-terser babel-core babel-preset-latest babel-plugin-external-helpers -D
```
`.babelrc`
```javascript
{
  "presets": [
    ["latest", {
      "es2015": {
        "modules": false
      }
    }]
  ],
  "plugins": ["external-helpers"]
}
```
`rollup.config.js`
```javascript
import { terser } from 'rollup-plugin-terser';
import babel from 'rollup-plugin-babel';
export default {
    input: './src/main.js',
    output: {
        file: './dist/monitor.js',
        format: 'cjs'
    },
    plugins: [
        babel({
            exclude: 'node_modules/**'
        }),
        terser()
    ]
};
```
## UMD
我们刚刚打包的SDK，并没有用到特定环境的API，也就是说，这段代码，其实完全可以运行在node端和浏览器端。

如果我们希望打包的代码可以兼容各个平台，就需要符合UMD规范(兼容AMD,CMD, Commonjs, iife)

```javascript
import { terser } from 'rollup-plugin-terser';
import babel from 'rollup-plugin-babel';
export default {
    input: './src/main.js',
    output: {
        file: './dist/monitor.js',
        format: 'umd',
        name: 'monitor'
    },
    plugins: [
        babel({
            exclude: 'node_modules/**'
        }),
        terser()
    ]
};
```
通过设置`format`和`name`，这样我们打包出来的`monitor.js`就可以兼容各种运行环境了

在node端
```javascript
var monitor = require('monitor.js');
monitor.init('6666');
```

在浏览器端
```javascript
<script src="./monitor.js"></srcipt>
<script>
    monitor.init('6666');
</srcipt>
```

原理其实也很简单，你可以看下打包后的源码，或者看我之前写过的一篇[文章](http://anata.me/2018/01/25/%E5%85%BC%E5%AE%B9AMD-CMD-CommonJS-%E5%8E%9F%E7%94%9F%E6%B5%8F%E8%A7%88%E5%99%A8%E7%9A%84%E5%B0%81%E8%A3%85%E5%86%99%E6%B3%95/)

## 总结
rollup通常适用于打包JS类库，通过rollup打包后的代码，体积较小，而且没有冗余的代码。rollup默认只支持ES6的模块化，如果需要支持Commonjs，还需下载相应的插件[rollup-plugin-commonjs](https://github.com/rollup/rollup-plugin-commonjs)

webpack通常适用于打包一个应用，如果你需要代码拆分(Code Splitting)或者你有很多静态资源需要处理，那么可以考虑使用webpack