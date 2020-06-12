---
title: web支付基础教程
date: 2020-06-09 15:51:35
tags: [js, 支付]
toc: true
---

## 前言
由于在公司的交易支付部门~~搬砖~~，因此To C端的前端支付页面，基本由我这边负责

一般来说，一次正常的交易流程，用户会经过几个阶段：
1. 浏览商品列表
2. 查看商品详情
3. 点击购买或加入购物车
4. 商品结算(确认购买)
5. 收银台(进行支付)
6. 支付成功

其中**收银台**作为交易成功的最后一公里，其承担的职责之重可想而知

我们先来看看市面上常见网站的收银台：

<!-- more -->

哔哩哔哩会员购:

触屏端
<img src="http://pic.deepred5.com/cahsier-bili-mc.png" style="width: 45%">

pc端
<img src="http://pic.deepred5.com/cashier-bili-pc.png" style="width: 45%">

app端
<img src="http://pic.deepred5.com/cashier-bili-app.jpeg" style="width: 45%">

慕课网:

触屏端
<img src="http://pic.deepred5.com/cashier-immoc-mc.png" style="width: 45%">

pc端
<img src="http://pic.deepred5.com/cashier-immoc-pc.png" style="width: 45%">

app端
<img src="http://pic.deepred5.com/cashier-immoc-app.jpeg" style="width: 45%">

可以看出，收银台页面一般要适配3个终端：pc端，触屏端，app端。因此，主流的第三方支付平台(微信，支付宝，花呗分期，京东白条)也需要能支持这三种场景的支付

接下来，我们就来分析下不同支付渠道在不同终端下，支付的实现方式

由于支付涉及部门核心业务，因此就不拿公司线上的收银台做讲解了。支付交互流程，主要参考**哔哩哔哩会员购**和**慕课网**（~~没有利益相关~~）

<font color="#6495ed">注意：本文只考虑前端支付业务的实现，后端支付业务的实现，暂不考虑</font>

## 支付宝(花呗分期)

[支付宝开发文档](https://opendocs.alipay.com/open/204/)

花呗分期其实就是支付宝的拓展，原理基本一致，就不重复累赘

### pc端

交互方式1：

在pc端点击支付宝支付，网页新打开一个页面(`window.open()`)，这个页面指向的是支付宝官方收银台页面

![](http://pic.deepred5.com/314978918e1131b82c8df90083d0c7b8%20.png)

交互方式2:

在pc端点击支付宝支付，网页展示一个二维码，需要用户打开支付宝app进行扫码支付


![](http://pic.deepred5.com/cashier-aili-qr.png)

b站提供了一个很巧妙的思路：把微信，支付宝，qq三个支付二维码统一成了一个二维码。(原理后面会[讲解](#JSAPI)，本质是调用不同容器的`JSAPI`)

两种交互方式，点击支付按钮时，其实都是把当前的订单号以及一些相关信息发给后端

```javascript
const payNum = '123abc';

ajax({ 
  url: '/api/alipay', // 支付api
  type: 'POST',
  data: {
    payNum: payNum, // 订单号
    other: 'demo', // 其他参数
}).then((res) => {
  const { payUrl } = res;

  // 交互方法1:
  // payUrl如果是支付宝的收银台，则新打开一个页面
  // payUrl一般是 https://mapi.alipay.com/gateway.do 这种，一般会带上return_url参数和其他各种数据，页面最后被重定向到支付宝收银台
  window.open(payUrl);

  // 交互方式2:
  // payUrl如果是支付宝的扫码地址，则创建一个二维码弹窗
  // payUrl一般是 https://qr.alipay.com/bax06893swswc4inaknv505d 这种，页面最后被重定向到支付宝收银台，该收银台可以唤起支付宝app
  qrcode({
    width: 175,
    height: 175,
    url: payUrl
  });
}).catch((err) => {
  console.log('提交失败')
})
```
由于支付是异步进行的，所以需要前端去查询该笔订单是否支付成功

对于交互方式1，由于支付页面已经转移到支付宝收银台，所以在支付宝收银台支付成功后，支付宝收银台会自动跳转回`return_url`(`return_url`是我们当初跳到支付宝收银台时带上的参数，一般指向支付成功页)。

不过由于我们使用的是`window.open`打开的新页面，所以当用户回到我们的收银台时，我们需要打开一个弹框，主动询问用户是否支付成功。如果用户点击了支付完成，我们需要查询该笔订单是否真正支付成功。

![](http://pic.deepred5.com/cashier-immoc-modal.png)

```javascript
// 打开支付宝收银台
window.open(payUrl);

// 在当前页面打开弹窗，询问用户是否支付成功
createFinishWindow()
```

对于交互方式2，由于仍然是在当前页进行扫码支付，因此创建二维码弹窗后，我们马上就要轮询进行查询订单状态
```javascript
const payNum = '123abc'

// 创建一个二维码弹窗
qrcode({
  width: 175,
  height: 175,
  url: payUrl
});

// 轮询查询订单状态
function getPayStatus() {
  ajax({ 
    url: '/api/getPayStatus', // 支付状态api
    data: {
      payNum: payNum, // 订单号
      other: 'demo', // 其他参数
    },
    type: 'POST'
  ).then((res) => {
    if (res.payStatus === 0) {
      // 支付成功，跳到成功页
      window.location.href = `/success/${payNum}`;
      clearTimeout(statusTimeId);
    } else {
      // 还未支付，继续轮询
      statusTimeId = setTimeout(getPayStatus, 3000);
    }
  }).catch((err) => {
    // 接口报错，继续轮询
    statusTimeId = setTimeout(getPayStatus, 3000);
  })
}



let statusTimeId = setTimeout(getPayStatus, 3000);
```

### 触屏端

交互方式：

在触屏端点击支付宝支付，页面直接跳转到支付宝收银台，该页面会尝试唤起手机上的支付宝app

<img src="http://pic.deepred5.com/cashier-aili-mc.jpeg" style="width: 45%">

其实触屏端原理和pc端基本一样，只不过在触屏端，有可能需要自己拼装一个form表单，而不是直接跳到链接（当然主要看后端的实现）

```javascript
const payNum = '123abc';

// 模拟表单提交
function formSubmit(formData, url) {
    const form = $('<form method="post" target="_self"></form>');
    form.attr('action', url);
    let input;
    $.each(formData, function (i, v) {
      input = $('<input type="hidden">');
      input.attr("name", i);
      input.attr("value", v);
      form.append(input);
    });
    $(document.body).append(form);
    form.submit();
    form.remove();
  }

ajax({ 
  url: '/api/alipay', // 支付api
  type: 'POST',
  data: {
    payNum: payNum, // 订单号
    other: 'demo', // 其他参数
}).then((res) => {
  const { formData, url } = res;
  if (formData) {
    // 需要前端自己构建表单
    formSubmit(formData, url)
  } else {
    // 直接跳转链接(后端已经拼装好表单)
    window.location.href = url;
  }
}).catch((err) => {
  console.log('提交失败')
})
```

支付成功后，同理支付宝会跳转到`return_url`的地址

需要注意：在微信浏览器里，支付宝是不能被唤起的(~~日常封杀~~)

解决方法：

方法一：微信环境隐藏支付宝入口

方法二：微信环境，点击支付宝支付，引导用户使用其他浏览器打开页面

### JSAPI
如果我们能诱导用户使用支付宝客户端的`扫一扫`打开我们触屏端的收银台页面，那么其实我们也可以使用支付宝提供的`JSAPI`唤起收银台

**这也是b站实现微信，支付宝，qq同一个二维码都能付款的原理，这三个客户端都提供了自己的`JSAPI`，用户用不同的客户端扫码，都会进入同一个页面（b站实现），这个中转页根据容器环境，调用不同`JSAPI`的支付功能**

[支付宝H5开放文档](https://myjsapi.alipay.com/jsapi/index.html)

关于`jsbridge`的知识，可以查看我之前的文章[jsbridge初探](http://anata.me/2020/03/04/jsbridge%E5%88%9D%E6%8E%A2/)

`JSAPI`的简单示例
```javascript
function ready(callback) {
  // 如果jsbridge已经注入则直接调用
  if (window.AlipayJSBridge) {
    callback && callback();
  } else {
    // 如果没有注入则监听注入的事件
    document.addEventListener('AlipayJSBridgeReady', callback, false);
  }
}
ready(function () {
  // 显示一个提示框
  AlipayJSBridge.call('toast', {
    content: 'hello'
  });
});
```
唤起收银台需要使用[Alipay JSSDK](https://myjsapi.alipay.com/alipayjsapi/index.html)

```html
<script src="https://gw.alipayobjects.com/as/g/h5-lib/alipayjsapi/3.1.1/alipayjsapi.inc.min.js"></script>

<button id="J_btn" class="btn btn-default">支付</button>
<script>
  var btn = document.querySelector('#J_btn');
  btn.addEventListener('click', function(){
    ap.tradePay({
      tradeNO: '201802282100100427058809844'
    }, function(res){
      ap.alert(res.resultCode);
    });
  });
</script>
```

### app端

现在的app基本都是`Hybrid App`，如果在app端，你的收银台页面不是原生实现的，那么就可以直接使用webview加载触屏端的线上收银台即可

> 手机网站支付产品不建议在APP端使用

这是支付宝官网文档建议的，因此如果你希望得到最佳的支付体验，建议客户端的开发同学接入支付宝SDK，当然这部分已经超出了前端的范围

不过一般在app端中，我们仍然使用webview加载触屏端的前端页面，只不过在app中，我们的前端代码，通过`jsbridge`，调用客户端的支付方法即可

```javascript
const payNum = '123abc';

// 支付回调函数
window.ali_pay_callback = function(res) {
  if (res.status === 0) {
    // 支付成功
  } else {
    // 支付失败
  }
}

// APPSDK是webview注入的全局对象，可以调用原生方法
APPSDK.invoke('ali_pay', {
  payNum: payNum, // 订单号
  other: 'demo', // 其他参数
}, 'ali_pay_callback');
```

### 小程序

[小程序唤起支付文档](https://opendocs.alipay.com/mini/api/openapi-pay)

小程序支付和APP支付的支付流程与体验基本一致，可以在当前页面唤起支付宝收银台
```javascript
const payNum = '123abc';

my.request({
  url: 'https://demo.com/api/alipay',// 须加httpRequest域白名单
  method: 'POST',
  data: { // data里的key、value是开发者自定义的
    from: '支付宝',
    payNum: payNum, // 订单号
    other: 'demo', // 其他参数
  },
  dataType: 'json',
  success: function(res) {
    my.alert({content: 'success'});
  },
  fail: function(res) {
    my.alert({content: 'fail'});
  },
  complete: function(res) {
    my.hideLoading();
    my.alert({content: 'complete'});
  }
});

```

### 支付宝支付小结

我们从pc端，触屏端，app端三个方面了解了支付宝支付的基本原理。可以看出：支付的前端实现，其实并不复杂，而真正的难点在于后端支付系统的实现。至于最难的支付宝唤起问题，其实支付宝收银台自身已经实现了唤起功能，无需我们实现


## 微信

[微信支付开发文档](https://pay.weixin.qq.com/static/product/product_intro.shtml?name=qrcode)

### pc端

[扫码支付文档](https://pay.weixin.qq.com/wiki/doc/api/native.php?chapter=6_1)

交互方式：

由于微信并没有像支付宝提供了pc端的官方收银台，所以点击微信支付，我们一般都是直接弹出二维码弹窗，要求用户进行扫码支付，用户扫码则可以直接唤起微信支付。弹出二维码的同时，我们需要立即轮询查询支付状态。

<img src="http://pic.deepred5.com/cashier-wx.jpeg" style="width: 45%">

```javascript
const payNum = '123abc';

ajax({ 
  url: '/api/weixinpay', // 支付api
  type: 'POST',
  data: {
    payNum: payNum, // 订单号
    other: 'demo', // 其他参数
}).then((res) => {
  const { qrUrl } = res;

  // qrUrl是微信的扫码地址，一般是 weixin://wxpay/bizpayurl?pr=P1oi4x6 ，这段schema通过微信扫一扫可以唤起微信支付
  qrcode({
    width: 175,
    height: 175,
    url: qrUrl
  });

  // 开始轮询支付结果
  // 代码省略，可以参考之前的支付宝pc端实现
}).catch((err) => {
  console.log('提交失败')
})
```

### 触屏端

[H5支付文档](https://pay.weixin.qq.com/wiki/doc/api/H5.php?chapter=15_1)


交互方式：

在触屏端点击微信支付，页面直接跳转到微信支付中间页，该页面会尝试唤起微信支付

与支付宝收银台不同的是，微信支付中间页在调起微信收银台后超过5秒，会自动跳转回`redirect_url`，因此无法保证页面回跳时，支付流程已结束，所以商户设置的`redirect_url`地址不能自动执行查单操作，应让用户去点击按钮触发查单操作

![](http://pic.deepred5.com/cashier-bili-wx.png)

```javascript
// 代码省略，基本和支付宝的触屏端一样

// 微信支付中转页一般是这种格式的url地址

// https://wx.tenpay.com/cgi-bin/mmpayweb-bin/checkmweb?prepay_id=wx111408048537349a5434e53d1930739300&package=1982317760&redirect_url=https://m.imooc.com/myorder
```

需要注意：微信支付中转页一般不能直接用浏览器访问，因为中转页需要判断`referer`是否是商户申请H5时提交的授权域名。如果你直接用浏览器访问，`referer`为空，导致页面并不会加载成功。如果是APP里调起H5支付，需要在webview中手动设置`referer`

还有一种取巧的方法，我们可以不使用微信中转页，直接在当前页唤起支付

```javascript
// 后端直接返回一段schema

const schema = `weixin://wap/pay?appid%3Dwxd6841de60b02faef%26noncestr%3D095525b24fc94111a3663068c8dc8a90%26package%3DWAP%26prepayid%3Dwx091027118037832f961440d31092022500%26sign%3D2CF5A14607C6AAEDE382758CA87B973F%26timestamp%3D1591669631`

// 移动端就能唤起微信支付
window.location.href = schema;
```
不过这种方法，`schema`容易被第三方app的`webveiw`拦截，从而调起支付失败。比如在微博访问收银台，如果使用该方法，就会唤起微信失败。因此，还是建议使用微信中转页，由中转页唤起微信比较保险。当然，支付宝里不管用啥方法，都无法进行微信支付(~~相爱相杀~~)。

### JSAPI
如果我们的收银台页面是在微信浏览器里打开的，那么我们可以使用微信提供的`JSAPI`唤起支付

[JSAPI支付文档](https://pay.weixin.qq.com/wiki/doc/api/jsapi.php?chapter=7_7&index=6)

```javascript
const payNum = '123abc';

function onBridgeReady(wxJsApiParam) {
    window.WeixinJSBridge.invoke(
      'getBrandWCPayRequest',
      wxJsApiParam,//josn串
      function (res) {
        if (res.err_msg == "get_brand_wcpay_request:ok") {
          // 支付成功
          location.href = `/success/${payNum}`;
        } else if (res.err_msg == "get_brand_wcpay_request:fail") {
          // 支付失败
        }
      }
    );
  }

function weixinPay(wxJsApiParam) {
    if (typeof WeixinJSBridge == "undefined") {
      if (document.addEventListener) {
        document.addEventListener('WeixinJSBridgeReady', function () { onBridgeReady(wxJsApiParam) }, false);
      } else if (document.attachEvent) {
        document.attachEvent('WeixinJSBridgeReady', function () { onBridgeReady(wxJsApiParam) });
        document.attachEvent('onWeixinJSBridgeReady', function () { onBridgeReady(wxJsApiParam) });
      }
    } else {
      onBridgeReady(wxJsApiParam);
    }
  }

ajax({ 
  url: '/api/weixin_jsapi', // 支付api
  type: 'POST',
  data: {
    payNum: payNum, // 订单号
    other: 'demo', // 其他参数
}).then((res) => {
  const { jsapiData } = res;
  // jsapiData是一串json字符串，里面包含了appId，paySign等各种数据，用来调起微信支付
  weixinPay(JSON.parse(jsapiData));
}).catch((err) => {
  console.log('提交失败')
})
```

使用`JSAPI`需要我们有微信公众平台，因为下单必传的参数`openid`，需要我们在公众平台设置获取openid的域名，才能获取成功

除了使用微信浏览器内置的`WeixinJSBridge`对象，我们也可以使用[JSSDK](https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/JS-SDK.html)

```html
<script src="http://res.wx.qq.com/open/js/jweixin-1.6.0.js"></script>
<script>
wx.chooseWXPay({
  timestamp: 0, 
  nonceStr: '', 
  package: '', 
  signType: '', 
  paySign: '',
  success: function (res) {
    // 支付成功后的回调函数
  }
});
</script>
```

### app端

[APP支付文档](https://pay.weixin.qq.com/wiki/doc/api/app/app.php?chapter=8_1)

> H5支付不建议在APP端使用，如需要在APP中使用微信支付，请接APP支付

微信官方文档同样不建议在APP端使用触屏端的支付方式，因此最好接入微信SDK。前端同样可以使用`jsbridge`调用客户端的微信支付方法，可以参考前面支付宝的`app端`方式。

### 小程序

[小程序支付文档](https://pay.weixin.qq.com/wiki/doc/api/wxa/wxa_api.php?chapter=7_3&index=1)

小程序支付其实和微信`JSAPI`支付非常类似，都需要先获取到`Openid`，调用相同的API

```javascript
wx.requestPayment({
  timeStamp: '',
  nonceStr: '',
  package: '',
  signType: 'MD5',
  paySign: '',
  success (res) { },
  fail (res) { }
})
```
### 微信支付小结

微信支付在`JSAPI`和小程序的流程上比较复杂些，因为涉及到公众号`access_token` `openid` 等一系列权限的获取。不过总的来说，复杂难度主要还是在后端方面。

## 其他第三方支付
除了主流的微信支付和支付宝支付，我们有可能还需要对接一些其他第三方支付平台，比如：QQ，PayPal, 银联，京东白条，各大银行等等，当然原理也是大同小异。

同时，我们也可以使用第三方聚合支付平台，比如[度小满支付](https://b.dxmpay.com/#/detail?type=bank)，这些平台已经集成好了各大银行信用卡和存储卡支付功能，我们可以很容易的接入sdk，节约开发成本。

## 总结
web支付由于开发条件要求很高(至少要有注册公司)，因此大部分同学日常工作接触并不是很多。当然本文也仅仅是回顾了下日常开发中，前端在web支付中的一些常见套路。

真正实际项目里，我们仍然会面临很多问题和难点，这时就需要我们见招拆招了。

## 参考
1. [web开发中的支付宝支付和微信支付](https://www.jianshu.com/p/155757d2b9eb)
2. [微信支付文档](https://pay.weixin.qq.com/wiki/doc/apiv3/wxpay/pages/index.shtml)
3. [支付宝文档](https://opendocs.alipay.com/open/)

## 拓展

有读者提起了[Payment Request API](https://developer.mozilla.org/en-US/docs/Web/API/Payment_Request_API)这个W3C提供的原生支付api。

> Payment Request API 是一个旨在消灭结账表单的系统。它显著改进了购物流程期间的用户工作流，为用户提供更一致的体验，并让电商公司能够轻松地利用各种完全不同的支付方式。

这个api可以唤起浏览器自带的结算支付页面(原生UI)

![](http://pic.deepred5.com/cashier-native.png)

然而，`PaymentRequest`在Chrome中仅支持以下标准信用卡：`amex`、`diners`、`discover`、`jcb`、`maestro`、`mastercard`、`unionpay`和`visa`。因此结合国情来说，这个API至少在国内来说，其实并不实用。

如果有兴趣，可以查看详细教程[《Payment Request API：集成指南》](https://developers.google.com/web/fundamentals/payments)