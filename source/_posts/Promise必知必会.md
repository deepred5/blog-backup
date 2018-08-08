---
title: Promise必知必会
date: 2018-08-08 15:18:50
tags: [Promise]
---
前端开发中经常会进行一些异步操作，常见的异步有：
* 网络请求：ajax
* IO操作： readFile
* 定时器：setTimeout

## 回调
最基础的异步解决方案莫过于回调函数了

前端经常会在成功时和失败时分别注册回调函数
```javascript
const req = new XMLHttpRequest();
req.open('GET', URL, true);
req.onload = function () {
    // 成功的回调
    if (req.status === 200) {
        console.log(req.statusText)
    }
};
req.onerror = function () {
    // 失败的回调
    console.log(req.statusText)
};
req.send();
```

<!-- more -->

node的异步api，则通常只注册一个回调函数，通过约定的参数来判断到底是成功还是失败：
```javascript
const fs = require("fs");
fs.readFile('input.txt', function (err, data) {
    // 回调函数
    // 第一个参数是err，如果有err，则表示调用失败
   if (err) {
       return console.error(err);
   }
   console.log("异步读取: " + data.toString());
});
```
回调的异步解决方案本身也简单易懂，但是它有一个致命的缺点：**无法优雅的控制异步流程**

什么意思？

单个异步当然可以很简单的使用回调函数，但是对于多个异步操作，就会陷入回调地狱中

```javascript
// 请求data1成功后再请求data2，最后请求data3
const ajax = $.ajax({
    url: 'data1.json',
    success: function(data1) {
        console.log(data1);
        $.ajax({
            url: 'data2.json',
            success: function(data2) {
                console.log(data2);
                $.ajax({
                    url: 'data3.json',
                    success: function(data3) {
                        console.log(data3);

                    }
                })
            }
        })
    }
})
```
这种要按顺序进行异步流程控制的场景，回调函数就显得捉襟见肘了。这时，Promise的异步解决方案就被提了出来。

## Promise
当初我在学Promise时，看得我真是一脸懵逼，完全不明白这货到底怎么用。其实，Promise的api要分成两部分来理解：

1. Promise构造函数：resolve reject
2. Promise对象: then catch

## Promise对象
Promise对象代表一个异步操作，有三种状态：pending（进行中）、fulfilled（已成功）和rejected（已失败）

初始时，该对象状态为pending，之后只能变成fulfilled和rejected其中的一个

then方法有两个参数，分别对应状态为fulfilled和rejected时的回调函数，其中第二个参数可选
```javascript

promise.then(function(value) {
  // success
}, function(error) {
  // failure
});
```
通常我们会省略then的第二个参数，而改用catch来注册状态变为rejected时的回调函数
```javascript
promise.then(function(value) {
  // success
}).catch(function(error) {
  // failure
});
```
## Promise构造函数
Promise对象怎么生成的呢？就是通过构造函数new出来的。
```javascript
const promise = new Promise(function(resolve, reject) {
    
});
```
Promise构造函数接收一个函数作为参数，这个函数可以接收两个参数：resolve和reject

resolve, reject是两个函数，由JavaScript引擎提供，不用自己编写

前面我们说过，Promise对象有三种状态，初始时为pending，之后可以变成fulfilled或者rejected，那怎么改变状态呢？答案就是调用resolve或者reject

调用resolve时，状态变成fulfilled，表示异步已经完成;调用reject时，状态变成rejected，表示异步失败。

## 回调和Promise的对比
**其实这里就是Promise最难理解的地方了，我们先看下例子：**

回调函数封装
```javascript
function getURL(URL, success, error) {
    const req = new XMLHttpRequest();
    req.open('GET', URL, true);
    req.onload = function () {
        if (req.status === 200) {
            success(req.responseText);
        } else {
            error(new Error(req.statusText));
        }
    };
    req.onerror = function () {
        error(new Error(req.statusText));
    };
    req.send();
}
const URL = "http://httpbin.org/get";
getURL(URL, function onFulfilled(value) {
    console.log(value);
}, function onRejected(error) {
    console.error(error);
})
```
Promise封装
```javascript
function getURL(URL) {
    return new Promise(function (resolve, reject) {
        const req = new XMLHttpRequest();
        req.open('GET', URL, true);
        req.onload = function () {
            if (req.status === 200) {
                resolve(req.responseText);
            } else {
                reject(new Error(req.statusText));
            }
        };
        req.onerror = function () {
            reject(new Error(req.statusText));
        };
        req.send();
    });
}

const URL = "http://httpbin.org/get";
getURL(URL).then(function onFulfilled(value){
    console.log(value);
}).catch(function onRejected(error){
    console.error(error);
});
```

两段代码最大的区别就是：

**用回调函数封装的getURL函数，需要明显的传给它成功和失败的回调函数，success和error的最终调用是在getURL里被调用的**

**用Promise封装的getURL函数，完全不关心成功和失败的回调函数，它只需要在ajax成功时调用resolve()，告诉promise对象，你现在的状态变成了fulfilled，在ajax失败时，调用reject()。而真正的回调函数，是在getURL的外面被调用的，也就是then和catch中调用**

then方法返回的是一个新的Promise实例（注意，不是原来那个Promise实例）。因此可以采用链式写法，即then方法后面再调用另一个then方法。

```javascript
function getURL(URL) {
    return new Promise(function (resolve, reject) {
        const req = new XMLHttpRequest();
        req.open('GET', URL, true);
        req.onload = function () {
            if (req.status === 200) {
                resolve(req.responseText);
            } else {
                reject(new Error(req.statusText));
            }
        };
        req.onerror = function () {
            reject(new Error(req.statusText));
        };
        req.send();
    });
}

const URL = "http://httpbin.org/get";
const URL2 = "http://deepred5.com/cors.php?search=ntr";
getURL(URL).then(function onFulfilled(value){
    console.log(value);
    // 返回了一个新的Promise对象
    return getURL(URL2)
}).then(function onFulfilled(value){
    console.log(value);
}).catch(function onRejected(error){
    console.error(error);
});

```
这段代码就充分说明了Promise对于流程控制的优势：读取URL的数据后再读取URL2，完全没有了之前的回调地狱问题。

## Promise应用
Promise经常用于对函数的异步流程封装
```javascript
function getURL(URL) {
    return new Promise(function (resolve, reject) {
        const req = new XMLHttpRequest();
        req.open('GET', URL, true);
        req.onload = function () {
            if (req.status === 200) {
                resolve(req.responseText);
            } else {
                reject(new Error(req.statusText));
            }
        };
        req.onerror = function () {
            reject(new Error(req.statusText));
        };
        req.send();
    });
}
```
```javascript
const preloadImage = function (path) {
  return new Promise(function (resolve, reject) {
    const image = new Image();
    image.onload  = resolve;
    image.onerror = reject;
    image.src = path;
  });
};
```
```javascript
const fs = require('fs')
const path = require('path') 
const readFilePromise = function (fileName) {
    return new Promise((resolve, reject) => {
        fs.readFile(fileName, (err, data) => {
            if (err) {
                reject(err)
            } else {
                resolve(data.toString())
            }
        })
    })
}
```
结合上面几个例子，我们可以看出Promise封装代码的基本套路：

```javascript
const methodPromise = function() {
    return new Promise((resolve, reject) => {
        // 异步流程
        if (/* 异步操作成功 */){
            resolve(value);
        } else {
            reject(error);
        }
    })
}
```
## Promise.race Promise.all
Promise.all 接收一个promise对象的数组作为参数，当这个数组里的所有promise对象全部变为resolve的时候，它才会去调用then方法，如果其中有一个变为rejected，就直接调用catch方法

传给then方法的是一个数组，里面分别对应promise返回的结果

```javascript
function getURL(URL) {
    return new Promise(function (resolve, reject) {
        const req = new XMLHttpRequest();
        req.open('GET', URL, true);
        req.onload = function () {
            if (req.status === 200) {
                resolve(req.responseText);
            } else {
                reject(new Error(req.statusText));
            }
        };
        req.onerror = function () {
            reject(new Error(req.statusText));
        };
        req.send();
    });
}

Promise.all([getURL('http://deepred5.com/cors.php?search=ntr'), getURL('http://deepred5.com/cors.php?search=rbq')])
.then((dataArr) => {
    const [data1, data2] = dataArr;
}).catch((err) => {
    console.log(err)
})
```

Promise.race类似，只不过只要有一个Promise变成resolve就调用then方法

## Promise.resolve Promise.reject

```javascript
Promise.resolve(42); 
// 等价于
new Promise(function(resolve){
    resolve(42);
});

Promise.reject(new Error("出错了"))
// 等价于
new Promise(function(resolve,reject){
    reject(new Error("出错了"));
});
```
```javascript
Promise.resolve(42).then(function(value){
    console.log(value);
});

Promise.reject(new Error("出错了")).catch(function(error){
    console.error(error);
});
```

Promise.resolve方法另一个作用就是将thenable对象转换为promise对象
```javascript
const promise = Promise.resolve($.ajax('/json/comment.json'));// => promise对象
promise.then(function(value){
   console.log(value);
});
```
thenable对象指的是具有then方法的对象:
```javascript
let thenable = {
  then: function(resolve, reject) {
    resolve(42);
  }
};
let p1 = Promise.resolve(thenable);
p1.then(function(value) {
  console.log(value);  // 42
});
```

## 参考
* [ECMAScript 6 入门](http://es6.ruanyifeng.com/#docs/promise)
* [JavaScript Promise迷你书](http://liubin.org/promises-book/)