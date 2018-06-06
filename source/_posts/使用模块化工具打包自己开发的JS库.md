---
title: 使用模块化工具打包自己开发的JS库
date: 2018-06-06 16:57:22
tags: [webpack, rollup]
---
最近有个需求，需要为小程序写一个SDK，监控小程序的API调用和页面报错(类似[fundebug](https://docs.fundebug.com/notifier/wxjs/integration/))

所谓SDK，其实就是一个JS文件，就像平时开发我们引入的第三方库:
```javascript
const moment = require('moment');
moment().format();
```
小程序的模块化是使用Commonjs规范的。也就是说，我需要提供一个`monitor.js`文件，这个文件需要支持Commonjs，然后在小程序`app.js`中引入：
```javascript
const monitor = require('./lib/monitor.js');
monitor.init('API-KEY');

// 正常的逻辑
App({
    ...
})
```
所以问题来了，我应该怎么规划这个项目结构? (**注意：本文并不具体讨论怎么实现监控小程序**)

方案有很多种：比如直接把所有的逻辑写在一个`monitor.js`文件里，然后最后导出
```javascript
module.exports = {
    // 各种逻辑
}
```
但是考虑到代码量很大，为了降低耦合度，我还是倾向于把代码拆分成给不同模块，最后把所有JS文件打包成一个`monitor.js`。平时有使用过Vue和React开发的同学，应该也可以体会到模块化开发的好处。

所以，怎么用模块化工具打包自己开发的JS库？