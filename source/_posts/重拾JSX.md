---
title: 重拾JSX
date: 2019-03-19 20:49:17
tags: [react, JSX]
---

### React.createElement语法糖
[JSX](https://reactjs.org/docs/introducing-jsx.html)是一种JavaScript的语法拓展，可以使用它来进行UI的展示：
```javascript
const element = <h1>Hello, world!</h1>;
```

我们一般会在组件的`render`方法里使用JSX进行布局和事件绑定:
```javascript
class Home extends Component {
  render() {
    return (
      <div onClick={() => console.log('hello')}>
        <h1>Hello, world!</h1>
        <Blog title="deepred" />
      </div>
    );
  }
}
```

React的核心机制之一就是可以创建虚拟的DOM元素，利用虚拟DOM来减少对实际DOM的操作从而提升性能，JSX正是为了虚拟DOM而存在的语法糖

<!-- more -->

我们在平时的组件编写中，通常都这么写:
```javascript
import React, { Component } from 'react';

class Demo extends Component {
  render() {
    return (
      <h1>Hello, world!</h1>
    )
  }
}
```

然而代码里面并没有用到React，为什么要引入这个变量呢？

因为JSX是`React.createElement`这个方法的语法糖：

```javascript
const element = <h1 id="container" className="home">Hello</h1>;

// 等价于
const element = React.createElement("h1", {
  id: "container",
  className: "home"
}, "Hello");
```

推荐大家在[babeljs.io](https://babeljs.io/repl)上看下JSX编译后的实际效果
![jsx](http://pic.deepred5.com/jsx1.png)

[React.createElement](https://reactjs.org/docs/react-api.html#createelement)有三个参数：
```javascript
React.createElement(
  type, // dom类型，比如div，h1
  [props], // dom属性，比如id，class，事件
  [...children] // 子节点，字符串或者React.createElement生成的一个对象
)
```
JSX用一种类似HTML的语法替代了比较繁琐的`React.createElement`纯JS方法，而`@babel/preset-react`插件就起到了最关键的一步：负责在webpack编译时，把所有的JSX都改成`React.createElement`:
```javascript
class Home extends Component {
  render() {
    return (
      <div onClick={() => console.log('hello')}>
        <h1>Hello, world!</h1>
        <Blog title="deepred" />
      </div>
    );
  }
}
```
编译后：
```javascript
class Home extends React.Component {
  render() {
    return React.createElement("div", {
      onClick: () => console.log('hello')
    }, React.createElement("h1", null, "Hello, world!"), React.createElement(Blog, {
      title: "deepred"
    }));
  }
}
```

在开发中，有了JSX后我们基本不怎么需要用到`createElement`方法，但如果我们需要实现这样一个组件：
```javascript
// 根据传入的type属性，渲染成相应的html元素
<Tag type="h1" id="hello" onClick={() => console.log('hello')}>this is a h1</Tag>
<Tag type="p">this is a p</Tag>
```
我们不太可能根据type的属性，一个个`if else`去判断对应的标签：
```javascript
function Tag(props) {
  const { type, ...other } = props;

  if (type === 'h1') {
    return <h1 {...other}>{props.children}</h1>
  }

  if (type === 'p') {
    return <p {...other}>{props.children}</p>
  }
}
```
这时，就需要用到底层的api了：
```javascript
function Tag(props) {
  const { type, ...other } = props;

  return React.createElement(type, other, props.children);
}
```

### 自己实现一个JSX渲染器
虚拟dom本质就是一个js对象：
```javascript
const vnode = {
  tag: 'div',
  attrs: {
    className: 'container'
  },
  children: [
    {
        tag: 'img',
        attrs: {
          src: '1.png'
        },
        children: []
    },
    {
        tag: 'h3',
        attrs: {},
        children: ['hello']
    }
  ]
}
```

可以通过在每个文件的上方添加`/** @jsx h */`来告诉`@babel/preset-react`用`h`方法名代替JSX（默认方法是React.createElement）

```javascript
/** @jsx h */

const element = <h1 id="container" className="home">Hello</h1>;
```
```javascript
/** @jsx h */
const element = h("h1", {
  id: "container",
  className: "home"
}, "Hello");
```
![jsx2](http://pic.deepred5.com/jsx2.png)

现在让我们开始创建自己的`h`函数吧！

```javascript
function h(nodeName, attributes, ...args) {
  // 使用concat是为了扁平化args，因为args数组里面的元素可能也是数组
  // h('div', {}, [1, 2, 3])  h('d', {}, 1, 2, 3) 都是合法的调用
  const children = args.length ? [].concat(...args) : null;

  return { nodeName, attributes, children };
}

```
```javascript
const vnode = h("div", {
  id: "urusai"
}, "Hello!");

// 返回
// {
//  "nodeName": "div",
//  "attributes": {
//   "id": "urusai"
//  },
//  "children": [
//   "Hello!"
//  ]
// }
```
`h`的作用就是返回一个vnode，有了vnode，我们还需要把vnode转成真实的dom:

```javascript
function render(vnode) {
  if (typeof vnode === 'string') {
    // 生成文本节点
    return document.createTextNode(vnode);
  }

  // 生成元素节点并设置属性
  const node = document.createElement(vnode.nodeName);
  const attributes = vnode.attributes || {};
  Object.keys(attributes).forEach(key => node.setAttribute(key, attributes[key]));

  if (vnode.children) {
    // 递归调用render生成子节点
    vnode.children.forEach(child => node.appendChild(render(child)));
  }

  return node;
}
```

现在让我们使用这两个方法吧：
```javascript
/** @jsx h */
const vnode = <div id="urusai">Hello!</div>;
const node = render(vnode);
document.body.appendChild(node);
```
编译转码后：
```javascript
/** @jsx h */
const vnode = h("div", {
  id: "urusai"
}, "Hello!");
const node = render(vnode);
document.body.appendChild(node);
```

我们还可以遍历数组：
```javascript
/** @jsx h */
const items = ['baga', 'hentai', 'urusai'];
const vnode = <ul>{items.map((item, index) => <li key={index}>{item}</li>)}</ul>;
const list = render(vnode);
document.body.appendChild(list);
```

编译转码后：
```javascript
/** @jsx h */
const items = ['baga', 'hentai', 'urusai'];
const vnode = h("ul", null, items.map((item, index) => h("li", {
  key: index
}, item)));
const list = render(vnode);
document.body.appendChild(list);
```

通过`h` `render`两个函数，我们就实现了一个很简单的JSX渲染器！！！

### 参考
[WTF is JSX](https://jasonformat.com/wtf-is-jsx/)
[JSX In Depth](https://reactjs.org/docs/jsx-in-depth.html)
[React Without JSX](https://reactjs.org/docs/react-without-jsx.html)