---
title: IntersectionObserve初试
date: 2019-02-28 20:19:02
tags: [js]
---
`IntersectionObserve`这个API，可能知道的人并不多(我也是最近才知道...)，这个API可以很方便的监听元素是否进入了可视区域。

```html
<style>
* {
  margin: 0;
  padding: 0;
}

.test {
  width: 200px;
  height: 1000px;
  background: orange;
}

.box {
  width: 150px;
  height: 150px;
  margin: 50px;
  background: red;
}
</style>
<div class="test">test</div>
<div class="box">box</div>
```
上图代码中，`.box`元素目前并不在可视区域(viewport)内，如何监听它进入可视区域内？

传统做法是：监听scroll方法，实时计算`.box`距离viewport的top值：
```javascript
const box = document.querySelector('.box');
const viewHeight = document.documentElement.clientHeight;

window.addEventListener('scroll', () => {
  const top = box.getBoundingClientRect().top;
  
  if (top < viewHeight) {
    console.log('进入可视区域');
  }
});
```
然而`scroll`方法会频繁触发，因此我们还需要手动节流。

<!-- more -->

使用`IntersectionObserve`就非常方便了:
```javascript
const box = document.querySelector('.box');
const intersectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((item) => {
    if (item.isIntersecting) {
      console.log('进入可视区域');
    }
  })
});
intersectionObserver.observe(box);
```
IntersectionObserver API是异步的，不随着目标元素的滚动同步触发，所以不会有性能问题。

### IntersectionObserver构造函数
```javascript
const io = new IntersectionObserver((entries) => {
  console.log(entries);
});

io.observe(dom);
```
调用IntersectionObserver时，需要给它传一个回调函数。当监听的dom元素**进入可视区域**或者**从可视区域离开**时，回调函数就会被调用。

**注意**: 第一次调用`new IntersectionObserver`时，callback函数会先调用一次，即使元素未进入可视区域。

构造函数的返回值是一个观察器实例。实例的observe方法可以指定观察哪个 DOM 节点。
```javascript
// 开始观察
io.observe(document.getElementById('example'));

// 停止观察
io.unobserve(element);

// 关闭观察器
io.disconnect();
```

## IntersectionObserverEntry对象
callback函数被调用时，会传给它一个数组，这个数组里的每个对象就是当前进入可视区域或者离开可视区域的对象(IntersectionObserverEntry对象)

这个对象有很多属性，其中最常用的属性是：
* target: 被观察的目标元素，是一个 DOM 节点对象
* isIntersecting: 是否进入可视区域
* intersectionRatio: 相交区域和目标元素的比例值，进入可视区域，值大于0，否则等于0

## options
调用IntersectionObserver时，除了传一个回调函数，还可以传入一个option对象，配置如下属性：

* threshold: 决定了什么时候触发回调函数。它是一个数组，每个成员都是一个门槛值，默认为[0]，即交叉比例（intersectionRatio）达到0时触发回调函数。用户可以自定义这个数组。比如，[0, 0.25, 0.5, 0.75, 1]就表示当目标元素 0%、25%、50%、75%、100% 可见时，会触发回调函数。

* root: 用于观察的根元素，默认是浏览器的视口，也可以指定具体元素，指定元素的时候用于观察的元素必须是指定元素的子元素

* rootMargin: 用来扩大或者缩小视窗的的大小，使用css的定义方法，10px 10px 30px 20px表示top、right、bottom 和 left的值

```javascript
const io = new IntersectionObserver((entries) => {
  console.log(entries);
}, {
  threshold: [0, 0.5],
  root: document.querySelector('.container'),
  rootMargin: "10px 10px 30px 20px",
});
```

## 懒加载
图片懒加载的原理就是：给img标签一个自定义属性，用来记录真正的图片地址。默认img标签只加载一个占位符。当图片进入可视区域时，再把img的src属性更换成真正的图片地址。
```html
<div>
  <img src="/empty.jpg" data-src="/img/1.jpg" />
  <img src="/empty.jpg" data-src="/img/2.jpg" />
</div>
```
```javascript
const intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((item) => {
        if (item.isIntersecting) {
            item.target.src = item.target.dataset.src;
            // 替换成功后，停止观察该dom
            intersectionObserver.unobserve(item.target);
        }
    })
  }, {
      rootMargin: "150px 0px" // 提前150px进入可视区域时就加载图片，提高用户体验
    });

const imgs = document.querySelectorAll('[data-src]');
imgs.forEach((item) => {
    intersectionObserver.observe(item)
});
```

## 打点上报
前端页面经常有上报数据的需求，比如统计页面上的某些元素是否被用户查看，点击。这时，我们就可以封装一个`Log`组件，用于当元素进入可视区域时，就上报数据。
以React为例，我们希望：被`Log`组件包裹的元素，进入可视区域后，就向后台发送`{ appid: 1234, type: 'news'}`数据
```javascript
<Log
  className="container"
  log={{ appid: 1234, type: 'news'}}
  style={{ marginTop: '1400px' }}
  onClick={() => console.log('log')}
>
  <div className="news" onClick={() => console.log('news')}>
    <p>其他内容</p>
  </div>
</Log>
```

```javascript
import React, { Component } from 'react';
import PropTypes from 'prop-types';

class Log extends Component {
  static propTypes = {
    log: PropTypes.object
  };

  constructor(props) {
    super(props);
    this.io = null;
    this.ref = React.createRef();
  }

  componentDidMount() {
    this.io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          console.log('进入可视区域，将要发送log数据', this.props.log);
          sendLog(this.props.log);
          this.io.disconnect();
        }
      }
    );

    this.io.observe(this.ref.current);
  }

  componentWillMount() {
    this.io && this.io.disconnect();
  }

  render() {
    // 把log属性去掉，否则log属性也会渲染在div上 
    // <div log="[object Object]"></div>
    
    const { log, ...props } = this.props;
    return (
      <div ref={this.ref} {...props}>
        {this.props.children}
      </div>
    )
  }
}

export default Log
```

## 兼容性
safari并不支持该API，因此为了兼容主流浏览器，我们需要引入polyfill
[intersection-observer](https://www.npmjs.com/package/intersection-observer)