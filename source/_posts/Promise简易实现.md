---
title: Promise简易实现
date: 2020-05-07 13:44:00
tags: [Promise]
---
在[《Promise必知必会》](http://anata.me/2018/08/08/Promise%E5%BF%85%E7%9F%A5%E5%BF%85%E4%BC%9A/)一文里，我介绍了`Promise`的基础知识和常用方法。虽然在日常开发中，这些内容已经满足二八定律了，然而在面试中，`写手实现一个Promise`的问题，依旧出现在考官的高频题库里。

> 那些口口声声 “老子学不动”的人
应该看着你们
像我一样
前端积攒了几十年的技术
所有的JavaScript、CSS、HTML和框架源码
像是专门为你们准备的面试礼物

<!-- more -->

现代Promise都是基于[Promises/A+](https://promisesaplus.com/)的标准实现的，本文由于是对`Promise`的简易实现，因此对于标准里的一些特殊情况，暂不考虑。

### Promise雏形
```javascript
const p = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('ok')
  }, 1000);
});

p.then((res) => {
  console.log('res1', res);
  return 'ok2';
}).then((res) => {
  console.log('res2', res);
})
```
从上面这段原生`Promise`代码可以看出，如果我们需要自己实现一个`Promise`，需要解决以下几个问题:
1. `Promise`构造函数的实现
2. `resolve`和`reject`两个参数是由JS引擎内部提供的，现在需要我们自己代码实现
3. `then`方法的链式调用

```javascript
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

class MyPromise {
  constructor(executor) {
    this.status = PENDING;
    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];
    this.value = '';
    this.reason = '';

    try {
      // executor是同步执行(new时立刻执行)
      executor(this.resolve.bind(this), this.reject.bind(this));
    } catch (e) {
      this.reject(e);
    }
  }

  resolve(value) {
    if (this.status === PENDING) {
      this.status = FULFILLED;
      this.value = value;
      this.onFulfilledCallbacks.forEach(fn => fn());
    }
  }

  reject(reason) {
    if (this.status === PENDING) {
      this.status = REJECTED;
      this.reason = reason;
      this.onRejectedCallbacks.forEach(fn => fn());
    }
  }

  then(onFulfilled, onRejected) {
    // then方法都是异步的
    // setTimeout模拟微任务(node端也可以用process.nextTick模拟)

    if (this.status === FULFILLED) {
      setTimeout(() => {
        onFulfilled(this.value);
      })
    }

    if (this.status === REJECTED) {
      setTimeout(() => {
        onRejected(this.reason);
      })
    }

    if (this.status === PENDING) {
      this.onFulfilledCallbacks.push(() => {
        setTimeout(() => {
          onFulfilled(this.value);
        })
      })

      this.onRejectedCallbacks.push(() => {
        setTimeout(() => {
          onRejected(this.reason);
        })
      })

      // return this;  没啥用
    }
  }

}
```
<font color="#6495ed">**上述代码是最简易版的Promise，面试时请务必答出**</font>

测试一下
```javascript

// 同步resovle
const p1 = new MyPromise((resolve, reject) => {
  resolve('ok');
});

p1.then((res) => {
  console.log('res1', res);
  return 'ok2';
})

// 异步resovle
const p2 = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve('ok')
  }, 1000);
});

p2.then((res) => {
  console.log('res1', res);
  return 'ok2';
})
```

### then链式调用
说到链式调用，首先想到的肯定是`return this`。如果我们简单粗暴的在`then`方法的最后`return this`
```javascript
const p = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve('ok')
  }, 1000);
});

p.then((res) => {
  // ok
  console.log('res1', res);
  // ok2无法传递给下一个then方法
  return 'ok2';
}).then((res) => {
  // ok
  console.log('res2', res);
})
```
虽然链式调用实现了，但是不同的`then`方法获取到的`res`对象，永远是同一个值(`"ok"`)。因此，`then`方法需要返回的是一个全新的`Promise`！

```javascript
class MyPromise {
  // 其他代码省略
  then(onFulfilled, onRejected) {
    const promise2 = new MyPromise((resolve, reject) => {
      if (this.status === FULFILLED) {
        setTimeout(() => {
          try {
            let x = onFulfilled(this.value);
            resolve(x);
          } catch (e) {
            reject(e);
          }
        })
      }

      if (this.status === REJECTED) {
        setTimeout(() => {
          try {
            let x = onRejected(this.reason);
            resolve(x);
          } catch (e) {
            reject(e);
          }
        })
      }

      if (this.status === PENDING) {
        this.onFulfilledCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onFulfilled(this.value);
              resolve(x);
            } catch (e) {
              reject(e);
            }
          })
        })

        this.onRejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onRejected(this.reason);
              resolve(x);
            } catch (e) {
              reject(e);
            }
          })
        })
      }
    });

    return promise2;
  }
}
```

**<font color="red">这是最难理解的一部分！</font>**

~~必须承认：在很长一段时间内，我也没看懂这段代码~~

我们先来理清楚几个要点:
```javascript
const p1 = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve('ok')
  }, 1000);
});

const handle1 = (res) => {
  // ok
  console.log('res1', res);
  // ok2现在能传递给下一个then方法
  return 'ok2';
};

const p2 = p1.then(handle1);

const handle2 = (res) => {
  // ok2
  console.log('res2', res);
};

const p3 = p2.then(handle2)
```
1. `p1`是`Promise`对象，通过`new MyPromise`得到
2. `p2`也是`Promise`对象，通过`p1.then(handle1)`返回
3. `p3`也是`Promise`对象，通过`p2.then(handle2)`返回
4. 每个`Promise`对象都有自己的`resolve`方法，调用它，当前`promise`对象立刻改变状态，同时开始执行它内部注册的回调函数`onFulfilledCallbacks`
5. `p2`的状态什么时候改变，由`handle1`决定(问题：`handle1`里面没有`p2`的resolve方法，它是怎么改变`p2`的状态呢？ **答案见下面注释**)
6. `p3`的状态什么时候改变，由`handle2`决定


搞清楚了上面几个概念，我们现在来再来看看`then`方法的实现：

```javascript
class MyPromise {
  then(onFulfilled, onRejected) {
    const promise2 = new MyPromise((resolve, reject) => {
      // this指的是前一个promise，不是当前的promise2

      // this.status指的是前一个promise的状态，不是promise2的状态
      if (this.status === PENDING) {
        // this.onFulfilledCallbacks指的是前一个promise的onFulfilledCallbacks
        // 没有直接把onFulfilled塞进onFulfilledCallbacks里，而是包装了一个匿名函数fn，这个fn函数是个闭包，记住了onFulfilled和resolve两个函数
        // onFulfilled是前一个promise then方法注册的回调函数
        // resolve是当前promise2的resovle
        this.onFulfilledCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onFulfilled(this.value);

              // *******【此处就是要点5的答案！！！】*********
              // 调用resolve才能改变promise2的状态，才能执行promise2里的onFulfilledCallbacks
              resolve(x);
            } catch (e) {
              reject(e);
            }
          })
        })
      }
    });

    return promise2;
  }
}
```
看完注释，如果你还是<font color="orange">很绕</font>，可以通过断点调试理清流程。如果还是很懵，<font color="orange">不建议继续阅读之后内容</font>。

<details>
<summary>强烈建议反复体会这段代码(点击展开)</summary>
```javascript
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

class MyPromise {
  constructor(executor) {
    this.status = PENDING;
    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];
    this.value = '';
    this.reason = '';

    try {
      executor(this.resolve.bind(this), this.reject.bind(this));
    } catch (e) {
      this.reject(e);
    }
  }

  resolve(value) {
    if (this.status === PENDING) {
      this.status = FULFILLED;
      this.value = value;
      this.onFulfilledCallbacks.forEach(fn => fn());
    }
  }

  reject(reason) {
    if (this.status === PENDING) {
      this.status = REJECTED;
      this.reason = reason;
      this.onRejectedCallbacks.forEach(fn => fn());
    }
  }

  then(onFulfilled, onRejected) {
    const promise2 = new MyPromise((resolve, reject) => {
      if (this.status === FULFILLED) {
        setTimeout(() => {
          try {
            let x = onFulfilled(this.value);
            resolve(x);
          } catch (e) {
            reject(e);
          }
        })
      }

      if (this.status === REJECTED) {
        setTimeout(() => {
          try {
            let x = onRejected(this.reason);
            resolve(x);
          } catch (e) {
            reject(e);
          }
        })
      }

      if (this.status === PENDING) {
        this.onFulfilledCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onFulfilled(this.value);
              resolve(x);
            } catch (e) {
              reject(e);
            }
          })
        })

        this.onRejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onRejected(this.reason);
              resolve(x);
            } catch (e) {
              reject(e);
            }
          })
        })
      }
    });

    return promise2;
  }

}


const p = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve('ok')
  }, 1000);
});

p.then((res) => {
  console.log('res1', res);
  return 'ok2';
}).then((res) => {
  console.log('res2', res);
})
```
</details>
