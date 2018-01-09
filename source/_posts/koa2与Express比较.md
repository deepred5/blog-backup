---
title: Koa2与Express比较
date: 2017-07-31 22:56:29
tags: [Koa, Express]
---

## 简单比较
* Koa2最方便之处就是使用了async/await来做异步开发，而Express只是简陋的回调函数

* Koa2使用ctx来表示上下文(this)，Express使用req, res两个参数

* 中间件(next)的执行顺序上，Express是简单的串联，而Koa2则类似于剥洋葱(从外面进来，又从里面出去)
![img](https://raw.github.com/fengmk2/koa-guide/master/onion.png)

## 简单例子

对于异步请求，两种框架的不同写法

Koa2 (async + await)
```javascript
const Koa = require('koa');
const app = new Koa();
const axios = require('axios');

app.use(async ctx => {
    try {
        let result = await axios.get('http://deepred5.com/test2.php');
        ctx.body = result.data;
    } catch (err) {
        console.log('err');
        console.log(err);
        ctx.body = 'err';
    }
});

app.listen(9099);

console.log('[demo] start-quick is starting at port 9099');

```

Express (经典回调 + Promise)
```javascript
const express = require('express');
const app = express();
const axios = require('axios');

app.get('/', function (req, res) {
    axios.get('http://deepred5.com/test2.php')
        .then((response) => {
            let data = response.data;
            res.send(data);
        }).catch((err) => {
            console.log(err);
            res.send('err');
        });
});

let server = app.listen(3000, function () {
    const host = server.address().address;
    const port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});
```

可以看出，Koa2可以用同步的方式写出异步操作(**注意：本质还是异步**)，这在可读性上是巨大的提升。
一旦习惯了async await的写法，真的是回不去原来的callback hell了！