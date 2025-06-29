---
title: JS实现监控微信小程序
pubDatetime: 2018-06-14T02:23:07.000Z
tags:
  - JavaScript
description: JS实现监控微信小程序
---
[《使用模块化工具打包自己开发的JS库》](/posts/使用模块化工具打包自己开发的JS库/)文章中有提到，当时需要写一个SDK，监控小程序的后台接口调用和页面报错，今天就来说下实现原理吧！

# 原理
之前也做过浏览器web端的SDK数据埋点上报，其实原理大同小异：通过劫持原始方法，获取需要上报的数据，最后再执行原始方法，这样就能实现无痕埋点。

举个例子：我希望监控所有web页面的ajax请求，每次发送ajax，都需要在控制台打印出发送的url

平时我们开发，发送ajax一般用的都是封装好的库，例如jQuery,Axios等，然而这些库，底层仍然用的是浏览器原生的XMLHttpRequest对象，因此，我们只需要修改XMLHttpRequest对象即可

**<font color="red">注意：由于JS的灵活性，修改原生方法是一件很容易的事，然而并不鼓励这样做！</font>**

<!-- more -->

```javascript
// 把这段代码放在所有JS代码之前，我们就实现了拦截ajax的需求
window.XMLHttpRequest.prototype.open = (function(originOpen) {
    return function(method, url, async) {
        
        console.log('发送了ajax，url是: ', url);

        return originOpen.apply(this, arguments);
    };
})(window.XMLHttpRequest.prototype.open);

```

在这个立即执行函数中，我们把原生的`open`方法通过`originOpen`暂时存储起来，然后在外面包裹一层函数，实现了打印输出url的功能，最后通过`originOpen.apply`让原生方法运行，这样就实现了无痕拦截。

# 监控小程序

## 拦截wx.request
小程序的运行环境并没有`window`和`document`对象，它只暴露了一个`wx`全局对象，发送网络请求则是通过[wx.request](https://developers.weixin.qq.com/miniprogram/dev/api/network-request.html)这个api，因此，这次我们需要拦截的就是`wx.request`方法

我们试着更改一下`wx.request`
```javascript
wx.request = function() {
    console.log('66666');
}
```
这时控制台会报错`TypeError: Cannot set property request of #<Object> which has only a getter`

这是因为，`wx.request`这个属性，只有`get`方法而没有`set`方法，我们可以通过`Object.getOwnPropertyDescriptor`验证：
```javascript
const des = Object.getOwnPropertyDescriptor(wx, 'request');

//  des {
//   configurable: true,
//   enumerable: true,
//   get: f(),
//   set: undefined
// }
```
我们可以换种方式修改：
```javascript
const originRequest = wx.request;
Object.defineProperty(wx, 'request', {
    configurable: true,
    enumerable: true,
    writable: true,
    value: function() {
        const config = arguments[0] || {};
        const url = config.url;
        console.log('发送了ajax，url是: ', url);

        return originRequest.apply(this, arguments);
    }
});

```
这次就实现拦截功能了！

## 监控异常
小程序的注册函数`App`有个全局的`onError`方法，我们可以在小程序的入口文件`app.js`先注册一个该方法:
```javascript
App({
    onError: function(err) {
        console.log('上报错误啦！');
        wx.request({
            url: 'http://monitor.com/monitor/error',
            data: err
        })
    }
})

App({
    // 其他逻辑
})
```
不过需要注意的是：如果后续的程序重写了onError的话，将会导致之前注册的onError失效。

解决方法可以是：我们监控SDK可以暴露一个接口，让接入方自己在onError中调用我们的接口。

```javascript
App({
  onError: function (err) {
    monitor.notifyError(err)
  }
})
```

## 上报数据
收集好需要的数据后，当然就要上报后台。怎么上报？当然还是用的`wx.request`发送请求。

这里就容易出现一个**死循环**: 如果用之前被我们包装过的`wx.request`上报数据，那么上报数据这个ajax请求，也会被我们认为是普通的ajax请求，然后又会触发上报，这样来来回回，无穷无尽的发送上报数据。

解决方法有多种，比如：


**方案1**

可以在包装`wx.request`的时候，判断发送的url如果是上报接口，那么就不再上报了。

```javascript
const originRequest = wx.request;
Object.defineProperty(wx, 'request', {
    configurable: true,
    enumerable: true,
    writable: true,
    value: function() {
        const config = arguments[0] || {};
        const url = config.url;
        if (url.indexOf('http://monitor.com') > -1) {
            // 直接发送请求，不上报
            return originRequest.apply(this, arguments);
        }

        console.log('上报ajax数据啦!');
        wx.request({
            url: 'http://monitor.com/monitor/ajax',
            data: config.data
        })

        return originRequest.apply(this, arguments);
    }
});
```
**方案2**

在包装`wx.request`之前，保留一份最原始的`wx.request`方法，所有的上报请求，就不走被包装过的方法，而走最原始的方法。

```javascript
const myRequest = wx.request;

const wrapRequest = function () {
    const originRequest = wx.request;
    Object.defineProperty(wx, 'request', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: function() {
            const config = arguments[0] || {};
            const url = config.url;
       
            console.log('上报数据啦!');
            // 使用最原始的request方法
            myRequest({
                url: 'http://monitor.com/monitor/ajax',
                data: config.data
            })

            return originRequest.apply(this, arguments);
        }
    });
}

wrapRequest();
```

# 其他事项

实际开发中当然还有更多的细节，比如监控项目的鉴权，SDK的代码结构，上报前的数据收集和聚合等等，本文就不详细展开了。