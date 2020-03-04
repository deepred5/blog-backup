---
title: jsbridge初探
date: 2020-03-04 12:29:51
tags: [jsbridge]
---
`jsbridge`主要是随着`Hybrid App`的流行而产生的一种技术。那么`Hybrid App`是啥？`Hybrid App`又称`混合App`，即同时使用了前端web技术(js,css,html)和原生native技术(java,kotlin,swfit,object-c)进行开发的移动应用。

### 混合开发的优缺点
* 优点：开发快，易更新，开发周期短，跨平台
* 缺点：性能问题，兼容性问题

### 常见的混合开发框架
* webview渲染：Cordova，uni-app
* 原生渲染：React Native，Weex，Flutter
* 混合渲染：小程序

### jsbridge
现在很多App的页面，都不一定是原生实现的，而是通过webview直接加载一个线上的h5站点。比如打开某<font color="#fb7299">~~粉红App~~</font>的会员购页面，其实打开的是个[移动端](https://show.bilibili.com/h5/detail.html?id=22887)的网站。

<img src="http://pic.deepred5.com/hyg.jpeg" style="height: 500px" />

这么一说，好像和混合开发也没啥联系。不过你仔细看下页面的右上角，会发现有个分享按钮：点击分享图标，可以把当前页面分享到各大平台，分享后，web页面需要知道是否分享成功。

这里就涉及了native端和web端的通信：native分享的内容，需要web端的js进行设置（**js -> native**）；native分享成功后，需要把消息通知给js(**natvie -> js**)。实现两端的双向通信机制，就需要`jsbridge`的技术了。

### Native通知JS
因为h5网页是通过原生端的webview加载的，所以原生端对当前网页拥有很高的权限：Native端可以直接在当前webview里执行js代码。
```javascript
// web端
function nativeCallback(data) {
  console.log('data', data);
}
```
我们在js的执行环境里定义了一个全局方法`nativeCallback`，native端可以直接执行`nativeCallback(123)`方法，也就把数据传给了js。

这种方案是不是有点熟悉，`jsonp`就是类似的原理：只不过调用全局方法的时机，从服务器端改成了native端。

### JS通知Native
前端常见的协议有：
1. http/https协议：`https://www.baidu.com`
2. 本地file协议: `file:///Users/deepred/myproject/index.html`

其实我们也可以自定义协议：`sslocal://openModal?text=hello`，客户端通过分析这段`scheme`就能知道web端要调用原生的哪些方法，同时数据也通过query参数进行了传递。

那web端如何发送这段scheme给native端呢？
* 拦截`console` `alert` `prompt` 全局方法。
```javascript
alert('sslocal://openModal?text=hello')
```
native可以拦截webview中的这些方法，从而调用原生方法。

* 拦截url请求
```javascript
const ifr = document.createElement('iframe');
ifr.style.display = 'none';
ifr.src = 'sslocal://openModal?text=hello';
document.body.appendChild(ifr);
```
web端加载了一个iframe，请求了`sslocal://openModal?text=hello`, native端通过拦截url请求，从而调用原生方法。

使用`scheme`的字符串来调用方法，始终不够直观。其实我们还可以向webview里注入一个js全局对象，这个全局对象拥有调用native的方法的能力。

* API注入
```javascript
// nativeApp是由native端注入的全局变量
nativeApp.openModal('hello');
```

### 双向通信

### 参考
1. [Hybrid App技术解析 -- 原理篇](https://juejin.im/post/5b4ff3bee51d4519721b9986)
2. [小白必看，JSBridge 初探](https://juejin.im/post/5e5248216fb9a07cb0314fc9)