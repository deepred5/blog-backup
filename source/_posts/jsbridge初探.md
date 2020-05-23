---
title: jsbridge初探
date: 2020-03-04 12:29:51
tags: [jsbridge]
---
`jsbridge`是随着`Hybrid App`的流行而产生的一种技术。那么`Hybrid App`是啥？`Hybrid App`又称`混合App`，即同时使用了前端web技术(js,css,html)和原生native技术(java,kotlin,swfit,object-c)进行开发的移动应用。

### 混合开发的优缺点
* 优点：开发快，易更新，开发周期短，跨平台
* 缺点：性能问题，兼容性问题

### 常见的混合开发框架
* webview渲染：Cordova，uni-app
* 原生渲染：React Native，Weex，Flutter
* 混合渲染：小程序

<!-- more -->

### jsbridge
现在很多App的页面，不一定都是原生实现的，可能是通过webview直接加载一个线上的h5站点。比如打开某<font color="#fb7299">~~粉红App~~</font>的会员购页面，其实就是个[移动端](https://show.bilibili.com/h5/detail.html?id=22887)的网站。

<img src="http://pic.deepred5.com/hyg.jpeg" style="height: 500px" />

这么一说，好像和混合开发也没啥联系。不过你仔细看下页面的右上角，会发现有个分享按钮：点击分享图标，可以把当前页面分享到第三方平台，分享后，web页面需要知道是否分享成功。

这里就涉及了native端和web端的通信：native分享的内容，需要web端的js进行设置（<font color="#90B44B">js -> native</font>）；native分享成功后，需要把消息通知给js(<font color="#90B44B">natvie -> js</font>)。为实现两端的双向通信机制，就需要`jsbridge`技术了。

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

使用`scheme`字符串来调用方法始终不够直观，其实我们还可以向webview里注入一个js全局对象，这个全局对象拥有调用native的方法的能力。

* API注入
```javascript
// nativeApp是由native端注入的全局变量
nativeApp.openModal('hello');
```

### 双向通信
前面我们介绍的几种方法，都只能单向通信。如何进行双向通信呢？这时候就需要前端自己实现一个JS-SDK，维护js回调函数的Map。

首先，我们假设客户端会向webview中注入一个全局对象`BILIAPP`
```javascript
// BILIAPP是原生端注入的
const BILIAPP = {
  invoke(methodName, param, onSuccessKey, onFailKey) {}
}
```
该对象有个`invoke`方法，接收4个参数：
* 调用的原生方法名
* 方法参数
* 成功回调函数id
* 失败回调函数id

我们没法直接传函数给原生方法，所以这里只能传回调函数的id，id对应的实际函数，由前端这边维护。

注意：Android端，JS只能传递基本类型数据给原生；iOS端，JS可以传递引用类型给原生。

`sdk.js`
```javascript
let id = 1;

const uuid = () => {
  return `callback_${id++}`;
};

// BILISDK是web端注入的
const BILISDK = {

  // key是回调函数的id
  // value是回调函数的值
  callbacks: {

  },

  // 暴露给前端使用的方法，支持Promise
  invokeP(methodName, param) {
    return new Promise((resolve, reject) => {
      const successCb = (data) => {
        resolve(data);
      };
      const failureCb = (data) => {
        reject(data);
      };

      return BILISDK._invoke(methodName, param, successCb, failureCb);
    });
  },

  // 实际真正调用原生对象的方法
  _invoke(methodName, param, successCb, failureCb) {
    const onSuccessKey = uuid();
    const onFailKey = uuid();
    // 存入callbacks hash表中
    this.callbacks[onSuccessKey] = successCb;
    this.callbacks[onFailKey] = failureCb;
    // BILIAPP是否注入成功
    BILIAPP && BILIAPP.invoke && BILIAPP.invoke(methodName, JSON.stringify(param), onSuccessKey, onFailKey);
  },

  // 暴露给原生端使用的方法
  invokeFromNative(key, param) {
    if (typeof param === "string") {
      try {
        param = JSON.parse(param)
      } catch (ex) {

      }
    }
    const callback = this.callbacks[key];

    if (callback) {
      callback(param);
    }
  }

}

// 使用BILISDK调用原生方法
BILISDK.invokeP('getVersion').then((res) => {
  console.log('res', res);
})
```
现在前端调原生方法，不要直接使用`BILIAPP.invoke`，而是通过`BILISDK.invokeP`间接调用。`BILISDK.invokeP`支持Promise化，同时维护了一个hash表
```javascript
const BILISDK = {
  callbacks: {
    'callback_1': function() {},
    'callback_2': function() {},
  },
}
```
`BILISDK.invokeFromNative`是暴露给Native端使用的。当原生方法调用完成后，根据成功还是失败，Native端可以调用`BILISDK.invokeFromNative(成功或者失败的id)`，而这个id就是当初`BILIAPP.invoke`调用时传进来的id。

通过上面的方法，我们就实现了<font color="#F75C2F">js -> native -> js</font> 的双向通信了。当然理论上，我们还需实现：<font color="#DB4D6D">native -> js -> native </font>的双向通信，但是原理是一样的，这时客户端就需要自己实现一个Native-SDK，维护Native端回调函数的Map。

### JS-SDK的接入
前面我们实现的`sdk.js`，如何引入web站点呢？

把sdk打包成umd规范的js静态文件，上传到cdn或者发布到npm
* 在index.html里面直接通过script标签引入或者js直接`import`导入即可。该方案，前端维护sdk。(维护成本高)
* 客户端在初始化一个WebView打开页面时，直接注入sdk。该方案，客户端维护sdk。(**优先推荐**)
### 参考
1. [Hybrid App技术解析 -- 原理篇](https://juejin.im/post/5b4ff3bee51d4519721b9986)
2. [小白必看，JSBridge 初探](https://juejin.im/post/5e5248216fb9a07cb0314fc9)
3. [2小时搞定移动端混合开发基础入门](https://www.imooc.com/learn/1176)