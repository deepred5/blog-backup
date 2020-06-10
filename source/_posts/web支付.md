---
title: web支付
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

## 支付宝

[支付宝开发文档](https://opendocs.alipay.com/open/204/)

### pc端

交互方式1：

在pc端点击支付宝支付，网页新打开一个页面(`window.open()`)，这个页面指向的是支付宝官方收银台页面

![](https://gw.alipayobjects.com/os/skylark-tools/public/files/314978918e1131b82c8df90083d0c7b8.png%26originHeight%3D1285%26originWidth%3D3628%26size%3D615829%26status%3Ddone%26width%3D3628)

交互方式2:

在pc端点击支付宝支付，网页展示一个二维码，需要用户打开支付宝app进行扫码支付


![](http://pic.deepred5.com/cashier-aili-qr.png)

b站提供了一个很巧妙的思路：把微信，支付宝，qq三个支付二维码统一成了一个二维码。用户用不同的客户端扫码，都会进入同一个页面（b站实现），这个中转页根据容器环境，判断是调用微信支付还是支付宝支付

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

需要注意：在微信浏览器里，支付宝是不能被唤起的(~~就是这么霸道~~)

解决方法：

方法一：微信环境隐藏支付宝入口

方法二：微信环境，点击支付宝支付，引导用户使用其他浏览器打开页面

### app端

现在的app基本都是`Hybrid App`，如果在app端，你的收银台页面不是原生实现的，那么就可以直接使用webview加载触屏端的线上收银台即可

> 手机网站支付产品不建议在APP端使用

这是支付宝官网文档建议的，因此如果你希望得到最佳的支付体验，建议客户端的开发同学接入支付宝SDK，当然这部分已经超出了前端的范围

不过一般在app端中，我们仍然使用webview加载触屏端的前端页面，只不过在app中，我们的前端代码，通过`jsbridge`，调用客户端的支付方法即可

关于`jsbridge`的知识，可以查看我之前的文章[jsbridge初探](http://anata.me/2020/03/04/jsbridge%E5%88%9D%E6%8E%A2/)

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

### 支付宝支付小结

我们从pc端，触屏端，app端三个方面了解了支付宝支付的基本原理。可以看出：支付的前端实现，其实并不复杂，而真正的难点在于后端支付系统的实现。至于最难的支付宝唤起问题，其实支付宝收银台自身已经实现了唤起功能，无需我们实现