---
title: RxJS基础教程
date: 2018-02-28 16:29:17
tags: [RxJS]
---
RxJS是一个基于可观测数据流在异步编程应用中的库。

RxJS是基于观察者模式和迭代器模式的。

## Observable Observer

RxJS里有两个重要的概念需要我们理解:
`Observable` (可观察对象)
`Observer` (观察者)

```html
<button id="btn">click</button>
```
```javascript
var btn = document.getElementById('btn');
var handler = function() {
  console.log('click');
}
btn.addEventListener('click', handler)
```
上面这个例子里：
`btn`这个DOM元素的click事件就是一个Observable
`handler`这个函数就是一个Observer，当btn的click事件被触发，就会调用该函数

我们来看下用RxJS的写法：
```javascript
Rx.Observable.fromEvent(btn, 'click')
.subscribe(() => console.log('click'));
```

`Rx.Observable.fromEvent`方法就创建一个 Observable，这个`Observable`提供了一个subscribe方法用来给`Observer`订阅。

再看一个例子：

```javascript
let observable = Rx.Observable.create(function (observer) {
  observer.next(1);
  observer.next(2);
});

let observer = x => console.log(x);

observable.subscribe(observer);

// 输出：
// 1
// 2
```
`Rx.Observable.create`方法也创建了一个Observable，并且该Observable被一个`observer`订阅了，通过调用`next`方法，就可以把数据通知给`observer`

