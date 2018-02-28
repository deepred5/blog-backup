---
title: RxJS基础教程
date: 2018-02-28 16:29:17
tags: [RxJS]
---
RxJS是一个基于可观测数据流在异步编程应用中的库。

> ReactiveX is a combination of the best ideas from
the **Observer pattern**, the **Iterator pattern**, and **functional programming**

正如官网所说，RxJS是基于观察者模式，迭代器模式和函数式编程。因此，首先要对这几个模式有所理解

## 观察者模式

```javascript
window.addEventListener('click', function(){
  console.log('click!');
})
```
JS的事件监听就是天生的观察者模式。给window的click事件(被观察者)绑定了一个listener(观察者)，当事件发生，回调函数就会被触发

<!-- more -->

## 迭代器模式
迭代器模式，提供一种方法顺序访问一个聚合对象中的各种元素，而又不暴露该对象的内部表示。

ES6里的Iterator即可实现：
```javascript
let arr = ['a', 'b', 'c'];
let iter = arr[Symbol.iterator]();

iter.next() // { value: 'a', done: false }
iter.next() // { value: 'b', done: false }
iter.next() // { value: 'c', done: false }
iter.next() // { value: undefined, done: true }
```
反复调用迭代对象的`next`方法，即可顺序访问

## 函数式编程

流行的编程风格有：声明式编程和命令式编程
函数式编程就是声明式编程

问题：将数组`[1, 2, 3]`的每个元素乘以2，然后计算总和。

命令式编程
```javascript
const arr = [1, 2, 3];
let total = 0;

for(let i = 0; i < arr.length; i++) {
  total += arr[i] * 2;
}
```


声明式编程
```javascript
const arr = [1, 2, 3];
let total = arr.map(x => x * 2).reduce((total, value) => total + value)
```
声明式的特点是专注于描述结果本身，不关注到底怎么到达结果。而命令式就是真正实现结果的步骤

声明式编程把原始数据经过一系列转换(map, reduce)，最后得到想要的数据

现在前端流行的MVC框架(Vue,React,Angular)，也都是提倡：编写UI结构时使用声明式编程，在编写业务逻辑时使用命令式编程

## RxJS
RxJS里有两个重要的概念需要我们理解:
`Observable` (可观察对象)
`Observer` (观察者)

```javascript
var btn = document.getElementById('btn');
var handler = function() {
  console.log('click');
}
btn.addEventListener('click', handler)
```
上面这个例子里：
`btn`这个DOM元素的`click`事件就是一个Observable
`handler`这个函数就是一个Observer，当btn的click事件被触发，就会调用该函数

改用RxJS编写；
```javascript
Rx.Observable.fromEvent(btn, 'click')
.subscribe(() => console.log('click'));
```

`fromEvent`把一个event转成了一个`Observable`，然后它就可以被订阅`subscribe`了

## 流stream
**Observable**其实就是数据流**stream**
**流**是在时间流逝的过程中产生的一系列事件。它具有时间与事件响应的概念。

当产生了一个流后，我们可以通过操作符(Operator)对这个流进行一系列加工操作，然后产生一个新的流
```javascript
Rx.Observable.fromEvent(window, 'click')
  .map(e => 1)
  .scan((total, now) => total + now)
  .subscribe(value => {
    console.log(value)
  })
```
`map`把流转换成了一个每次产生1的新流，然后`scan`类似`reduce`，最后也会产生一个新流，最后这个流被订阅。最终实现了:每次点击累加1的效果

可以用一个效果图来表示该过程：
![gif](https://blog.techbridge.cc/img/huli/rxjs/click_stream.gif)

## Observable Observer
前面的例子，我们都在讨论`fromEvent`转换的Observable，其实还有很多种方法产生一个`Observable`，其中`create`也是最常见的方法。

```javascript
var observable = Rx.Observable.create(function (observer) {
  observer.next(1);
  observer.next(2);
  observer.next(3);
  setTimeout(() => {
    observer.next(4);
    observer.complete();
  }, 1000);
});

console.log('just before subscribe');
observable.subscribe({
  next: x => console.log('got value ' + x),
  error: err => console.error('something wrong occurred: ' + err),
  complete: () => console.log('done'),
});
console.log('just after subscribe');
```

控制台执行的结果：

```
just before subscribe
got value 1
got value 2
got value 3
just after subscribe
got value 4
done
```

Observable 执行可以传递三种类型的值：

"Next" 通知： 发送一个值，比如数字、字符串、对象，等等。
"Error" 通知： 发送一个 JavaScript 错误 或 异常。
"Complete" 通知： 不再发送任何值。
"Next" 通知是最重要，也是最常见的类型：它们表示传递给观察者的实际数据。"Error" 和 "Complete" 通知可能只会在 Observable 执行期间发生一次，并且只会执行其中的一个。

```javascript
var observable = Rx.Observable.create(function subscribe(observer) {
  try {
    observer.next(1);
    observer.next(2);
    observer.next(3);
    observer.complete();
  } catch (err) {
    observer.error(err); // 如果捕获到异常会发送一个错误
  }
});
```

**Observer**观察者只是一组回调函数的集合，每个回调函数对应一种 Observable 发送的通知类型：next、error 和 complete 。
```javascript
var observer = {
  next: x => console.log('Observer got a next value: ' + x),
  error: err => console.error('Observer got an error: ' + err),
  complete: () => console.log('Observer got a complete notification'),
};
```
Observer和Observable是通过subscribe方法建立联系的
```javascript
observable.subscribe(observer);
```

## unsubscribe
observer订阅了Observable之后，还可以取消订阅
```javascript
var observable = Rx.Observable.from([10, 20, 30]);
var subscription = observable.subscribe(x => console.log(x));
// 稍后：
subscription.unsubscribe();
```

**unsubscribe**陷阱：
```javascript
let stream$ = new Rx.Observable.create((observer) => {
  let i = 0;
  let id = setInterval(() => {
    console.log('setInterval');
    observer.next(i++);
  },1000)
})

let subscription = stream$.subscribe((value) => {
  console.log('Value', value)
});

setTimeout(() => {
  subscription.unsubscribe();
}, 3000)
```

3秒后虽然取消了订阅，但是开启的setInterval定时器并不会自动清理，我们需要自己返回一个清理函数

```javascript
let stream$ = new Rx.Observable.create((observer) => {
  let i = 0;
  let id = setInterval(() => {
    observer.next(i++);
  },1000)

  // 返回了一个清理函数
  return function(){
    clearInterval( id );
  }
})

let subscription = stream$.subscribe((value) => {
  console.log('Value', value)
});

setTimeout(() => {
  subscription.unsubscribe() // 在这我们调用了清理函数

}, 3000)
```

## Ajax异步操作
```javascript
function sendRequest(search) {
  return Rx.Observable.ajax.getJSON(`http://deepred5.com/cors.php?search=${search}`)
    .map(response => response)
}

Rx.Observable.fromEvent(document.querySelector('input'), 'keyup')
  .map(e => e.target.value)
  .flatMap(search => sendRequest(search))
  .subscribe(value => {
    console.log(value)
  })

```
现在每次在输入框输入，均会触发ajax请求。

如果我希望300ms以内停止输入，才发送请求(防抖)，并且返回的值只要最近的一个ajax返回的

```javascript
Rx.Observable.fromEvent(document.querySelector('input'), 'keyup')
  .debounceTime(300)
  .map(e => e.target.value)
  .switchMap(search => sendRequest(search))
  .subscribe(value => {
    console.log(value)
  })

```
`debounceTime`表示经过n毫秒后，没有流入新值，那么才将值转入下一个环节
`switchMap`能取消上一个已无用的请求，只保留最后的请求结果流，这样就确保处理展示的是最后的搜索的结果

可以看到，RxJS对异步的处理是非常优秀的，对异步的结果能进行各种复杂的处理和筛选。

## React + Redux 的异步解決方案：redux-observable

Redux的action都是同步的，所以默认情况下也只能处理同步数据流。

为了生成异步action，处理异步数据流，有许多不同的解決方案，例如 redux-thunk、redux-promise、redux-saga 等等。

以**redux-thunk**举例：

调用一个异步API，首先要先定义三个同步action构造函数，分别表示
* 请求开始
* 请求成功
* 请求失败

然后再定义一个异步action构造函数，该函数不再是返回普通的对象，而是返回一个函数，在这个函数里，进行ajax异步操作，然后根据返回的成功和失败，分别调用前面定义的同步action

`actions.js`
```javascript

export const FETCH_STARTED = 'WEATHER/FETCH_STARTED';
export const FETCH_SUCCESS = 'WEATHER/FETCH_SUCCESS';
export const FETCH_FAILURE = 'WEATHER/FETCH_FAILURE';

// 普通action构造函数，返回普通对象
export const fetchWeatherStarted = () => ({
  type: FETCH_STARTED
});

export const fetchWeatherSuccess = (result) => ({
  type: FETCH_SUCCESS,
  result
})

export const fetchWeatherFailure = (error) => ({
  type: FETCH_FAILURE,
  error
})

// 异步action构造函数，返回一个函数
export const fetchWeather = (cityCode) => {
  return (dispatch) => {
    const apiUrl = `/data/cityinfo/${cityCode}.html`;

    dispatch(fetchWeatherStarted())

    return fetch(apiUrl).then((response) => {
      if (response.status !== 200) {
        throw new Error('Fail to get response with status ' + response.status);
      }

      response.json().then((responseJson) => {
        dispatch(fetchWeatherSuccess(responseJson.weatherinfo));
      }).catch((error) => {
        dispatch(fetchWeatherFailure(error));
      });
    }).catch((error) => {
      dispatch(fetchWeatherFailure(error));
    })
  };
}
```
现在如果想要异步请求，只要:
```javascript
// // fetchWeather是个异步action构造函数
dispatch(fetchWeather('23333'));
```

我们再来看看`redux-observable`:

调用一个异步API，不再需要定义一个异步action构造函数，所有的action构造函数都只是返回普通的对象

那么ajax请求在哪里发送？

答案是在**Epic**进行异步操作

>Epic是redux-observable的核心原语。
它是一个函数，接收 actions 流作为参数并且返回 actions 流。 Actions 入, actions 出.

```javascript
export const FETCH_STARTED = 'WEATHER/FETCH_STARTED';
export const FETCH_SUCCESS = 'WEATHER/FETCH_SUCCESS';
export const FETCH_FAILURE = 'WEATHER/FETCH_FAILURE';

export const fetchWeather = cityCode => ({ type: FETCH_STARTED, cityCode });
export const fetchWeatherSuccess = result => (
  { type: FETCH_SUCCESS, result };
);
export const fetchWeatherFailure = (error) => (
  {
    type: FETCH_FAILURE,
    error
  }
)

export const fetchWeatherEpic = action$ =>
  action$.ofType(FETCH_STARTED)
    .mergeMap(action =>
      ajax.getJSON(`/data/cityinfo/${action.cityCode}.html`)
        .map(response => fetchWeatherSuccess(response.weatherinfo))
        // 这个action必须使用Observable.of方法转为一个observable
        .catch(error => Observable.of(fetchWeatherFailure(error)))
    );

```

现在如果想要异步请求，只要:
```javascript
// fetchWeather只是个普通的action构造函数
// fetchWeatherEpic会在reducer接受actiion前先做异步处理
dispatch(fetchWeather('23333'));
```

相较于thunk中间件，使用redux-observable来处理异步action，有以下优点：

* 不需要修改action构造函数，返回的仍然是普通对象
* epics中间件会将action封装成Observable对象，可以使用RxJs的相应api来控制异步流程，它就像一个拥有许多高级功能的Promise，现在我们在Redux中也可以得到它的好处。

## 最后
本文只是简单的介绍了一下RxJS的基础知识以应用实例。

更多高级操作请参考[官网](http://reactivex.io/rxjs/)

## 参考
[构建流式应用—RxJS详解](https://github.com/joeyguo/blog/issues/11)

[希望是最淺顯易懂的RxJS教學](https://blog.techbridge.cc/2017/12/08/rxjs/?utm_medium=hao.caibaojian.com&utm_source=hao.caibaojian.com)