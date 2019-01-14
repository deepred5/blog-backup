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