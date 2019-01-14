---
title: JavaScript实现自定义的生命周期
date: 2019-01-14 21:45:12
tags: [js]
---

React，Vue 和 Angular 的流行，让“生命周期”这个名词常常出现在前端们的口中，以至于面试中最常见的一个问题也是：
> 介绍下React, Vue的生命周期以及使用方法?

听起来高大上的“生命周期”，其实也就是一些普通的方法，只是在不同的时期传参调用它们而已。我们可以照着React的生命周期，自己模拟一个简单的类，并让这个类拥有一些生命周期钩子

我们希望实现一个`State`类，这个类拥有以下方法和生命周期：

方法：
* setState

生命周期:
* willStateUpdate (nextState): 状态将要改变
* shouldStateUpdate (nextState): 是否要让状态改变，只有返回true才会改变状态
* didStateUpdate (prevState): 状态改变后（要是 shouldStateUpdate 返回的不为true则不会调用）

<!-- more -->

```javascript
class User extends State {
  constructor(name) {
    super();
    this.state = { name }
  }

  willStateUpdate(nextState) {
    console.log('willStateUpdate', nextState);
  }

  shouldStateUpdate(nextState) {
    console.log('shouldStateUpdate', nextState);
    if (nextState.name === this.state.name) {
      return false;
    }

    return true;
  }

  didStateUpdate(prevState) {
    console.log('didStateUpdate', prevState);
  }
}

const user = new User('deepred');

user.setState({ name: 'hentai' });
```

首先，你需要知道JavaScript的面向对象基础知识，如果还不是很了解，可以先看下这篇文章[JavaScript的面向对象](http://anata.me/2018/03/26/JavaScript%E7%9A%84%E9%9D%A2%E5%90%91%E5%AF%B9%E8%B1%A1/)


### setState的实现
```javascript
class State {
  constructor() {
    this.state = {};
  }

  setState(nextState) {
    const preState = this.state;
    this.state = {
      ...preState,
      ...nextState,
    };
  }
}
```
```javascript
class User extends State {
  constructor(name) {
    super();
    this.state = {
      name
    }
  }
}


const user = new User('tc');

user.setState({age: 10}); // {name: 'tc', age: 10}
```
在React中，`setState`方法只会改变特定属性的值，因此，我们需要在方法里用一个变量`preState`保留之前的`state`，然后通过展开运算符，将新旧`state`合并

### willStateUpdate的实现
`willStateUpdate`是`state`状态更新前调用的。因此只要在合并`state`前调用`willStateUpdate`就行

```javascript
class State {
  constructor() {
    this.state = {};
  }

  setState(nextState) {
    // 更新前调用willStateUpdate
    this.willStateUpdate(nextState);
    const preState = this.state;
    this.state = {
      ...preState,
      ...nextState,
    };
  }

  willStateUpdate() {
    // 默认啥也不做
  }

}
```
```javascript
class User extends State {
  constructor(name) {
    super();
    this.state = {
      name
    }
  }

  // 覆盖父级同名方法
  willStateUpdate(nextState) {
    console.log('willStateUpdate', nextState);
  }
}

const user = new User('tc');

user.setState({age: 10}); // {name: 'tc', age: 10}
```

### shouldStateUpdate的实现
我们规定只有`shouldStateUpdate`返回true时，才更新`state`。因此在合并`state`前，还要调用`shouldStateUpdate`

```javascript
class State {
  constructor() {
    this.state = {};
  }

  setState(nextState) {
    this.willStateUpdate(nextState);
    const update = this.shouldStateUpdate(nextState);
    if (update) {
      const preState = this.state;
      this.state = {
        ...preState,
        ...nextState,
      };
    }
  }

  willStateUpdate() {
    // 默认啥也不做
  }

  shouldStateUpdate() {
    // 默认返回true，一直都是更新
    return true;
  }

}
```

```javascript
class User extends State {
  constructor(name) {
    super();
    this.state = {
      name
    }
  }

  // 覆盖父级同名方法
  willStateUpdate(nextState) {
    console.log('willStateUpdate', nextState);
  }

  // 自定义何时更新
  shouldStateUpdate(nextState) {
    if (nextState.name === this.state.name) {
      return false;
    }

    return true;
  }
}


const user = new User('tc');

user.setState({ age: 10 }); // {name: 'tc', age: 10}

user.setState({ name: 'tc', age: 11 }); // 没有更新
```

### didStateUpdate的实现
懂了`willStateUpdate`也就知道`didStateUpdate`如何实现了

```javascript
class State {
  constructor() {
    this.state = {};
  }

  setState(nextState) {
    this.willStateUpdate(nextState);
    const update = this.shouldStateUpdate(nextState);
    if (update) {
      const preState = this.state;
      this.state = {
        ...preState,
        ...nextState,
      };
      this.didStateUpdate(preState);
    }
  }

  willStateUpdate() {
    // 默认啥也不做
  }

  didStateUpdate() {
    // 默认啥也不做
  }

  shouldStateUpdate() {
    // 默认返回true，一直都是更新
    return true;
  }

}
```

```javascript
class User extends State {
  constructor(name) {
    super();
    this.state = {
      name
    }
  }

  // 覆盖父级同名方法
  willStateUpdate(nextState) {
    console.log('willStateUpdate', nextState);
  }

  // 覆盖父级同名方法
  didStateUpdate(preState) {
    console.log('didStateUpdate', preState);
  }

  shouldStateUpdate(nextState) {
    console.log('shouldStateUpdate', nextState);
    if (nextState.name === this.state.name) {
      return false;
    }

    return true;
  }
}


const user = new User('tc');

user.setState({ age: 10 }); 

user.setState({ name: 'tc', age: 11 });
```

通过几十行的代码，我们就已经实现了一个自带生命周期的`State`类了!