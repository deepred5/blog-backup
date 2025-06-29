---
title: 兼容AMD CMD CommonJS 原生浏览器的封装写法
pubDatetime: 2018-01-25T09:11:10.000Z
tags:
  - AMD
  - CMD
  - CommonJS
  - JavaScript
description: 兼容AMD CMD CommonJS 原生浏览器的封装写法
---
经常看见一些库，可以支持浏览器和Node引用,同时兼容多种模块化规范(AMD CMD CommonJS)。比如著名的[Vue](https://cn.vuejs.org/)，你可以使用下面的方法:
```html
<script src="https://cdn.jsdelivr.net/npm/vue"></script>
```

```javascript
const Vue = require('vue');
```
既可以直接引入js使用，也可以和webpack等模块化打包工具结合使用，非常方便！

那么这是怎么实现的呢?

<!-- more -->

其实原理很简单，通过检测引入文件时的环境，如果是支持CommonJS或者CMD，则导出时使用
```javascript
module.exports
```
如果支持AMD,则导出时使用
```javascript
define()
```
否则，默认是浏览器环境，直接在window对象上添加

### 简单实例

```javascript

(function (global, factory) {
    // 导出模块
})(this, (function () {
    // 真正的逻辑代码
}))

```

首先，上面这段代码，可以算是一个模板代码，你可以在各种JS库的源码里看到类似的影子。

这段代码定义了一个立即执行函数：把当前的全局对象(`this`)和一个匿名函数当作参数传给了另外一个马上就要执行的匿名函数

改写成这样可以容易理解点：
```javascript

(function B (global, factory) {
    // 导出模块
})(this, (function A () {
    // 真正的逻辑代码
}))

```
全局对象`this`和函数`A`当作参数传给了函数`B`，函数`B`通过`global`接收`this`,`factory`接收`A`，然后函数`B`立即执行

`hentai.js`
```javascript

(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        // CommonJS、CMD规范检查
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD规范检查
        define(factory);
    } else {
        // 浏览器注册全局对象
        global.Hentai = factory();
    }
})(this, (function () {
    function say() {
        console.log('hello hentai');
    }

    return {
        say: say
    }
}))

```
现在你可以在浏览器或者node中使用了
```html
<script src="./hentai.js"></script>
<script>
    Hentai.say(); // hello hentai
</script>

```

```javascript
const Hentai = require('hentai');
Hentai.say(); // hello hentai
```