---
title: SameSite小识
date: 2020-03-30 15:40:10
tags: [cookie, js]
---
如果你最近有关注过chrome的控制台，可能会发现经常报一些warning：
> A cookie associated with a cross-site resource at http://baidu.com/ was set without the `SameSite` attribute. A future release of Chrome will only deliver cookies with cross-site requests if they are set with `SameSite=None` and `Secure`.

![](http://pic.deepred5.com/same1.png)

出现这个警告的原因是：chrome在80版本之后，更新了cookies的携带机制，把原来Cookie的`SameSite`属性值，由`None`改成了`Lax`，这就会导致一些需要第三方cookie的应用产生了异常。

在介绍`SameSite`属性之前，我们先来复习一下cookie的基础知识

<!-- more -->

### Cookie基础
Cookie常见的属性:
* Name: cookie名。
* Value: cookie值。
* Domain: cookie的域。如果设成`.deepred.com`，那么`a.deepred.com`和`b.deepred.com`域名下，都可以使用`.deepred.com`的cookie。
* Path: cookie的路径。请求资源的路径一定要包含这个path才能携带cookie。一般设置成`/`即可。
* Expires/Max-Age: cookie过期时间。默认不设置，则是`Session`会话，关闭页面后，该cookie立即失效。
* HttpOnly: 设成`true`后，JS使用`document.cookie`则访问不到。常用于避免XSS攻击。
* Secure: 标记为Secure的cookie只应通过被HTTPS协议加密过的请求发送给服务端。

**最后一个非常重要的属性，就是我们即将要说的`SameSite`了。**

### Cookie携带的场景
我们假设有一个名字为`sessionId`的`cookie`，`domain`设置成了`.demo.com`。

1.在`a.demo.com`域名下，ajax在该域名下的所有请求，都会自动带上`sessionId`
```javascript
ajax.get('/api/data') // 自动带上sessionId
```

2.在`b.demo.com`域名下，ajax在该域名下的所有请求，都会自动带上`sessionId`
```javascript
ajax.post('/api2/data2') // 自动带上sessionId
```

3.在`b.demo.com`域名下，ajax请求`a.demo.com`的api，需要设置`withCredentials`才能带上`sessionId`
```javascript
ajax.get('https://a.demo.com/api/data') // 不能自动带上sessionId

ajax.get('https://a.demo.com/api/data', {withCredentials: true}) // 自动带上sessionId

```
**注意一下：
`https://a.demo.com/api/data`需要支持cors跨域，并且`Access-Control-Allow-Origin`不能设成`*`，要设置成`https://b.demo.com`，只有这样，`withCredentials`才有用**
```javascript
router.get('/api/data', (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', ctx.headers.origin);
  ctx.set('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , myheader');
  ctx.set('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
  ctx.set('Access-Control-Allow-Credentials', 'true');
};
```

4.在`b.demo.com`域名下，使用`iframe`加载`a.demo.com`，会自动带上`sessionId`

**`a.demo.com`和`b.demo.com`同属一个域名下的子域名**

5.在`a.demo2.com`域名下，ajax请求`a.demo.com`的api，需要设置`withCredentials`才能带上`sessionId`
```javascript
ajax.get('https://a.demo.com/api/data') // 不能自动带上sessionId

ajax.get('https://a.demo.com/api/data', {withCredentials: true}) // 自动带上sessionId
```

6.在`a.demo2.com`域名下，使用`iframe`加载`a.demo.com`，会自动带上`sessionId`

**`a.demo.com`和`a.demo2.com`属于完全不相干的两个网站**

目前为止，都是我们所熟知的cookie携带场景。

然而，在chrome 80版本之后，谷歌把cookie的`SameSite`属性，从`None`改成了`Lax`。<font color="orange">这时候，会导致除了第1和第2种场景，`sessionId`能正常携带，其他场景下，`sessionId`都会丢失！</font>


### SameSite
cookie的`SameSite`属性用来限制第三方Cookie，从而减少安全风险(防止CSRF)

`SameSite`可以有下面三种值：

1. `Strict`仅允许一方请求携带Cookie，即浏览器将只发送相同站点请求的Cookie，即当前网页URL与请求目标URL完全一致。
2. `Lax`允许部分第三方请求携带Cookie
3. `None`无论是否跨站都会发送Cookie

![](http://pic.deepred5.com/same2.png)

从上图可以看出，`SameSite`从`None`改成了`Lax`后，`Form`,`Iframe`,`Ajax`和`Image`受到的影响最大。

### 解决方法
解决方法也很简单粗暴：强行把`SameSite`设置成`None`。不过需要特别注意几点：

1.`SameSite`设置成`None`后，Cookie就必须同时加上`Secure`属性
```javascript
ctx.cookies.set('sessionId', {
  maxAge: 1000 * 60 * 60,
  secure: true,
  sameSite: 'none',
});
```
这也意味着，你的网站需要支持`https`！(`Lax`和`Strict`不需要支持https)

如果线上的网站同时支持`http`和`https`，你可能需要让运维将`http`强制重定向到`https`(建议使用307状态码而不是302状态码)

2.部分浏览器不能加`SameSite=none`，比如IOS 12的Safari，以及一些老版本的chrome浏览器，它们会错误的把`SameSite=none`识别成`SameSite=strict`。

<font color="#90B44B">具体不兼容的浏览器可以见[这里](https://www.chromium.org/updates/same-site/incompatible-clients)</font>   

因此后端要根据`UA`来判断是否加上`SameSite=none`


### 参考
+ [预测最近面试会考 Cookie 的 SameSite 属性](https://segmentfault.com/a/1190000022055666)
+ [Chrome 80.0中将SameSite的默认值设为Lax,对现有的Cookie使用有什么影响?](https://www.zhihu.com/question/373011996/answer/1027939207)
+ [Cookie 的 SameSite 属性](http://www.ruanyifeng.com/blog/2019/09/cookie-samesite.html)