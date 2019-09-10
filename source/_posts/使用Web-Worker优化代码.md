---
title: 使用Web Worker优化代码
date: 2019-09-06 15:23:34
tags:
---
前段时间有个需求，需要前端导出excel。一般来说，对于导出大量数据的功能，最好还是交给后端来做，然而后端老哥并不想做(~~撕逼失败~~)，只能自力更生。

前端导出excel本身已经有很成熟的库了，比如[js-xlsx](https://github.com/SheetJS/js-xlsx), [js-export-excel](https://github.com/cuikangjie/js-export-excel)，所以实现起来并不难。但是，当导出的数据达到几万条时，就会发现页面产生了明显的卡顿。原因也很简单: 一般我们都是基于后端返回的json数据来生成excel，但是后端返回的数据一般都不能直接用来生成数据，我们还需要进行一些格式化：
```javascript
const list = await request('/api/getExcelData');

const format = list.map((item) => {
  // 对返回的json数据进行格式化
  item.time = moment(item.time).format('YYYY-MM-DD HH:mm');
  // ... 省略其他各种操作
});

// 根据json生成excel
const toExcel = new ExportJsonExcel(format).saveExcel();
```
卡顿就发生在对大量数据进行`map`操作。由于JS是单线程的，所以在进行大量复杂运算时会独占主线程，导致页面的其他事件无法及时响应，造成页面假死的现象。

那我们能不能把复杂的循环操作单独放在一个线程里呢？这时就要请出[web worker](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Workers_API/Using_web_workers)了

<!-- more -->

#### Web Worker
首先看个简单的例子
```html
<button id="btn1">js</button>
<button id="btn2">worker</button>
<input type="text">
```
`index.js`
```javascript
const btn1 = document.getElementById('btn1');

btn1.addEventListener('click', function () {
    let total = 1;

    for (let i = 0; i < 5000000000; i++) {
      total += i;
    }
    console.log(total);
})
```
点击btn1时，js会进行大量计算，你会发现页面卡死了，点击input不会有任何反应

我们使用web worker优化代码:
`worker.js`
```javascript
onmessage = function(e) {
  if (e.data === 'total') {
    let total = 1;

    for (let i = 0; i < 5000000000; i++) {
      total += i;
    }
    postMessage(total);
  }
}
```
`index.js`
```javascript
if (window.Worker) {
  const myWorker = new Worker('worker.js');

  myWorker.onmessage = function (e) {
    console.log('total', e.data);
  };

  const btn1 = document.getElementById('btn1');
  const btn2 = document.getElementById('btn2');

  btn1.addEventListener('click', function () {
    let total = 1;

    for (let i = 0; i < 5000000000; i++) {
      total += i;
    }

    console.log('total', total);
  })

  btn2.addEventListener('click', function () {
    myWorker.postMessage('total');
  });

}
```
点击btn2时，页面并不会卡死，你可以正常的对input进行输入操作

我们开启了一个单独的worker线程来进行复杂操作，通过`postMessage`和`onmessage`来进行两个进程间的通信。

#### 优化导出excel表格
看过前面的例子，我们可以同理使用web worker进行复杂的map操作
`worker.js`
```javascript
onmessage = function(e) {
  const format = e.data.map((item) => {
  // 对返回的json数据进行格式化
  item.time = moment(item.time).format('YYYY-MM-DD HH:mm');
  // ... 省略其他各种操作
});

postMessage(format);
}
```

```javascript
const myWorker = new Worker('worker.js');

myWorker.onmessage = function (e) {
  // 根据json生成excel
  const toExcel = new ExportJsonExcel(e.data).saveExcel();
};
const list = await request('/api/getExcelData');
myWorker.postMessage(list);
```
当然实际项目，我们一般都是用webpack打包的，这时就需要进行一些特别处理，需要使用[worker-loader](https://github.com/webpack-contrib/worker-loader),可以参考[《怎么在 ES6+Webpack 下使用 Web Worker》](https://juejin.im/post/5acf348151882579ef4f5a77)文章学习。

#### 进一步优化
在上面的代码修改中，我们只是优化了业务逻辑里面的map操作。因为我使用的js库是`js-export-excel`,从它的[源码](https://github.com/cuikangjie/js-export-excel/blob/master/src/js-export-excel.js#L123)里可以看见，对于我们传进来的数据，它还会再一次forEach循环操作，进行数据的二进制转换。因此，这一步的forEach循环，理论上也可以在web worker里面进行操作。

最简单想到的方法是:
`worker.js`
```javascript
onmessage = function(e) {
  const format = e.data.map((item) => {
    // 对返回的json数据进行格式化
    item.time = moment(item.time).format('YYYY-MM-DD HH:mm');
    // ... 省略其他各种操作
  });

  // 直接在worker里面生成excel
  const toExcel = new ExportJsonExcel(format).saveExcel();
```
直接在`worker.js`里面生成excel。然而，`saveExcel`这个方法需要用到`document`对象，但是在worker里，我们不能访问类似`window` `document`的全局对象。

因此，只能魔改源码了。。。

真正用到`document`对象的是[源码](https://github.com/cuikangjie/js-export-excel/blob/master/src/js-export-excel.js#L151)这一句:
```javascript
// saveAs和Blob用到了document
saveAs(
  new Blob([s2ab(wbout)], {
    type: "application/octet-stream"
  }),
  _options.fileName + ".xlsx"
);
```

`saveExcel`方法只需改成:
```javascript
// 不生成excel，只返回数据
return s2ab(wbout);
```

`worker.js`
```javascript
onmessage = function(e) {
  const format = e.data.map((item) => {
    // 对返回的json数据进行格式化
    item.time = moment(item.time).format('YYYY-MM-DD HH:mm');
    // ... 省略其他各种操作
  });

  // saveExcel只返回blob数据
  const blob = new ExportJsonExcel(format).saveExcel();
  postMessage(blob);
```
`index.js`
```javascript
myWorker.onmessage = function (e) {
  // 在主线程生成excel
  saveAs(
    new Blob([s2ab(wbout)], {
      type: "application/octet-stream"
    }),
   "test.xlsx"
  );
};
```
原理就是：我们只把数据转换放在worker里，最后生成excel仍然在主线程里完成。

至此，优化完成了！

#### 总结
我们可以把一些耗性能的操作放在worker线程里(比如大文件上传)，这样主线程就能及时响应用户操作而不会造成卡顿现象。需要注意的是，在worker里进行的复杂计算，运行时间并不会变短，有时耗费时间甚至更长，毕竟开启worker也需要消耗一定的性能。