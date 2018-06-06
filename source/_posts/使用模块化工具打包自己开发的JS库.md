---
title: 使用模块化工具打包自己开发的JS库
date: 2018-06-06 16:57:22
tags: [webpack, rollup]
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

所以，怎么打包自己开发的JS库？

## webpack
我第一个想到的就是用webpack打包，毕竟工作经常用React开发，最后打包项目用的就是它。