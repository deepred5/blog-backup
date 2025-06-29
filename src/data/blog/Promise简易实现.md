---
title: Promise简易实现
pubDatetime: 2020-05-07T05:44:00.000Z
tags:
  - JavaScript
description: Promise简易实现
---
在[《Promise必知必会》](/posts/promise必知必会/)一文里，我介绍了`Promise`的基础知识和常用方法。虽然在日常开发中，这些内容已经满足二八定律，然而在面试中，<font color="#6495ed">`写手实现一个Promise`</font>的问题，依旧出现在考官的高频题库里。

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
      executor(this._resolve.bind(this), this._reject.bind(this));
    } catch (e) {
      this._reject(e);
    }
  }

  _resolve(value) {
    if (this.status === PENDING) {
      this.status = FULFILLED;
      this.value = value;
      this.onFulfilledCallbacks.forEach(fn => fn());
    }
  }

  _reject(reason) {
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

      return this;  // 没啥用
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
            // 注意这里是resolve，而不是reject！
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


搞清楚了上面几个概念，我们现在来再看看`then`方法的实现：

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
看完注释，如果你还是<font color="orange">很绕</font>，可以通过断点调试理清流程。如果还是很懵，<font color="orange">**不建议继续阅读之后内容**</font>。

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
      executor(this._resolve.bind(this), this._reject.bind(this));
    } catch (e) {
      this.reject(e);
    }
  }

  _resolve(value) {
    if (this.status === PENDING) {
      this.status = FULFILLED;
      this.value = value;
      this.onFulfilledCallbacks.forEach(fn => fn());
    }
  }

  _reject(reason) {
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
            resolvePromise(promise2, x, resolve, reject);

          } catch (e) {
            reject(e);
          }
        })
      }

      if (this.status === REJECTED) {
        setTimeout(() => {
          try {
            let x = onRejected(this.reason);
            resolvePromise(promise2, x, resolve, reject);
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
              resolvePromise(promise2, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          })
        })

        this.onRejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onRejected(this.reason);
              resolvePromise(promise2, x, resolve, reject);
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

### 支持返回Promise
前面的代码还是有些问题，如果在`then`方法的成功回调函数里，返回的不是普通对象，而是一个`Promise`对象，我们的代码就无法正常运行了:
```javascript
const p = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve('ok1')
  }, 1000);
});

p.then((res) => {
  console.log('res1', res);
  // 返回一个新Promise
  return new MyPromise((resolve) => {
    setTimeout(() => {
      resolve('ok2')
    }, 1000);
  });
}).then((res) => {
  // 立刻执行，打印的是Promise对象，而不是ok2
  console.log('res2', res);
})
```
出错的原因
```javascript
// x可能是Promise对象，而我们直接resovle了这个Promise对象
let x = onFulfilled(this.value);
resolve(x);
```
正确的做法
```javascript
let x = onFulfilled(this.value);
if (x instanceof MyPromise) {
  // 如果x是Promise对象，则把resolve传递给x.then方法，resovle何时调用让x做决定
  x.then(resolve, reject)
} else {
  resovle(x)
}
```
修改后的`then`方法
```javascript
then(onFulfilled, onRejected) {
  const promise2 = new MyPromise((resolve, reject) => {
    if (this.status === FULFILLED) {
      setTimeout(() => {
        try {
          let x = onFulfilled(this.value);
          if (x instanceof MyPromise) {
            x.then(resolve, reject);
          } else {
            resolve(x);
          }

        } catch (e) {
          reject(e);
        }
      })
    }

    if (this.status === REJECTED) {
      setTimeout(() => {
        try {
          let x = onRejected(this.reason);
          if (x instanceof MyPromise) {
            x.then(resolve, reject);
          } else {
            resolve(x);
          }
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
            if (x instanceof MyPromise) {
              x.then(resolve, reject);
            } else {
              resolve(x);
            }
          } catch (e) {
            reject(e);
          }
        })
      })

      this.onRejectedCallbacks.push(() => {
        setTimeout(() => {
          try {
            let x = onRejected(this.reason);
            if (x instanceof MyPromise) {
              x.then(resolve, reject);
            } else {
              resolve(x);
            }
          } catch (e) {
            reject(e);
          }
        })
      })
    }
  });

  return promise2;
}
```
### 支持返回thenable对象
```javascript
const p = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('ok1')
  }, 1000);
});

p.then((res) => {
  console.log('res1', res);
  // 返回一个thenable对象
  return {
    then: function(resolve, reject) {
      setTimeout(() => {
        resolve('ok2')
      }, 1000);
    }
  }
}).then((res) => {
  console.log('res2', res);
})
```
在`Promise`还没有被`Promises/A+`规范之前，有许多类库实现了自己的`Promise`，比如`jQuery`的`deferred`对象。为了实现`类Promise`的兼容，只要一个对象具有`then`方法，那它就可以被`Promise`识别。
```javascript
const thenable =  {
  then: function (resolve, reject) {
    setTimeout(() => {
      resolve('ok2')
    }, 1000);
  }
}
```

> thenable对象的作用：使promise的实现更具有通用性
识别thenable或行为类似Promise对象可以根据其是否具有then()方法来判断(鸭子类型)

```javascript
function isThenable(obj) {
  return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
}
```
```javascript
// 为了判断x是普通对象还是thenable对象(Promise对象也属于thenable对象)，我们可以抽离出一个通用方法resolvePromise
let x = onFulfilled(this.reason);
resolvePromise(promise2, x, resolve, reject);
```
```javascript
function resolvePromise(promise2, x, resolve, reject) {
  // Promise对象或者thenable对象
  if (x && (typeof x === 'object' || typeof x === 'function') && typeof x.then === 'function') {
    try {
      x.then(resolve, reject)
    } catch (e) {
      reject(e);
    }
  } else {
    // 其他普通对象
    resolve(x);
  }
}
```
### 较完整的Promise
较上文有部分修改，比如添加了`then`方法参数的默认值，循环引用的判断等
```javascript
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

function isThenable(obj) {
  return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
}

class MyPromise {
  constructor(executor) {
    this.status = PENDING;
    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];
    this.value = '';
    this.reason = '';

    try {
      executor(this._resolve.bind(this), this._reject.bind(this));
    } catch (e) {
      this._reject(e);
    }
  }

  _resolve(value) {
    // Promise对象或者thenable对象
    if (isThenable(value)) {
      return value.then(this._resolve.bind(this), this._reject.bind(this))
    }
    if (this.status === PENDING) {
      this.status = FULFILLED;
      this.value = value;
      this.onFulfilledCallbacks.forEach(fn => fn());
    }
  }

  _reject(reason) {
    if (this.status === PENDING) {
      this.status = REJECTED;
      this.reason = reason;
      this.onRejectedCallbacks.forEach(fn => fn());
    }
  }

  then(onFulfilled, onRejected) {
    // onFulfilled onRejected 提供默认值
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
    onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason };

    const promise2 = new MyPromise((resolve, reject) => {
      if (this.status === FULFILLED) {
        setTimeout(() => {
          try {
            let x = onFulfilled(this.value);
            resolvePromise(promise2, x, resolve, reject);

          } catch (e) {
            reject(e);
          }
        })
      }

      if (this.status === REJECTED) {
        setTimeout(() => {
          try {
            let x = onRejected(this.reason);
            resolvePromise(promise2, x, resolve, reject);
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
              resolvePromise(promise2, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          })
        })

        this.onRejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onRejected(this.reason);
              resolvePromise(promise2, x, resolve, reject);
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

function resolvePromise(promise2, x, resolve, reject) {
  if (promise2 === x) {
    reject(new TypeError('循环引用'));
  }

  // Promise对象或者thenable对象
  if (isThenable(x)) {
    try {
      x.then(resolve, reject)
    } catch (e) {
      reject(e);
    }
  } else {
    // 其他普通对象
    resolve(x);
  }
}
```
测试一下
```javascript
const p = new MyPromise((resolve) => {
  // 异步resolve
  setTimeout(() => {
    resolve('ok1')
  }, 1000);
});

p.then((res) => {
  console.log('res1', res);
  // 返回thenable对象
  return {
    then: function (resolve) {
      setTimeout(() => {
        resolve('ok2')
      }, 1000);
    }
  }
}).then((res) => {
  console.log('res2', res);
  // 返回Promise对象
  return new MyPromise((resolve) => {
    // resolve一个Promise对象
    resolve(new MyPromise((resolve) => {
      setTimeout(() => {
        resolve('ok3')
      }, 1000)
    }))
  });
}).then((res) => {
  console.log('res3', res);
})
```

### resolve reject all race 实现
原生`Promise`还有一些静态方法
```javascript
class MyPromise {
  static resolve(param) {
    // Promise对象，直接返回
    if (param instanceof MyPromise) {
      return param;
    }
    return new MyPromise((resolve, reject) => {
      // thenalbe对象
      if (isThenable(param)) {
        setTimeout(() => {
          param.then(resolve, reject);
        });
      } else {
        // 普通对象
        resolve(param);
      }
    });
  }

  static reject(reason) {
    return new MyPromise((resolve, reject) => {
      reject(reason);
    });
  }

  static race(promises) {
    return new MyPromise((resolve, reject) => {
      if (promises.length === 0) {
        return;
      } else {
        for (let i = 0; i < promises.length; i++) {
          // 先MyPromise.resolve包装一下，防止传入数组里面的对象是普通对象而不是Promise对象
          MyPromise.resolve(promises[i]).then((data) => {
            resolve(data);
            return;
          }, (err) => {
            reject(err);
            return;
          });
        }
      }
    });
  }

  static all(promises) {
    return new MyPromise((resolve, reject) => {
      let index = 0;
      let result = [];
      if (promises.length === 0) {
        resolve(result);
      } else {
        function processValue(i, data) {
          result[i] = data;
          if (++index === promises.length) {
            resolve(result);
          }
        }
        for (let i = 0; i < promises.length; i++) {
          MyPromise.resolve(promises[i]).then((data) => {
            processValue(i, data);
          }, (err) => {
            reject(err);
            return;
          });
        }
      }
    });
  }
  
}
```

### catch finally 实现

原生`Promise`对象还有`catch`和`finally`两个原型方法，我们也可以实现
```javascript
class MyPromise {
  catch(onRejected) {
    // 返回一个新的Promise对象，同时then方法只注册一个失败的回调函数
    return this.then(null, onRejected);
  }

  finally(callback) {
    // finally返回的Promise对象，then方法拿到的res值不是callback返回的，而是上一个Promise的
    return this.then((value) => {
      // MyPromise.resolve包装callback的返回值
      return MyPromise.resolve(callback()).then(() => {
        return value;
      });
    }, (err) => {
      return MyPromise.resolve(callback()).then(() => {
        throw err;
      });
    });
  }

}
```
测试一下
```javascript
MyPromise.reject('test1').catch((err) => {
  console.log('err', err);
}).finally(() => {
  console.log('fianlly');
})

MyPromise.resolve('test2').then((res) => {
  console.log('res', res);
})

MyPromise.race([
  new MyPromise((resolve, reject) => { setTimeout(() => { resolve(100) }, 1000) }),
  new MyPromise((resolve, reject) => { setTimeout(() => { resolve(223232) }, 100) })
]).then((data) => {
  console.log('success ', data);
}, (err) => {
  console.log('err ',err);
});

MyPromise.all([
  new MyPromise((resolve, reject) => { setTimeout(() => { resolve(100) }, 1000) }),
  new MyPromise((resolve, reject) => { setTimeout(() => { resolve(223232) }, 100) })
]).then((data) => {
  console.log('success ', data);
}, (err) => {
  console.log('err ',err);
});
```

### 完整Promise
<details>
<summary>点击展开源代码</summary>
```javascript
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

function isThenable(obj) {
  return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
}

class MyPromise {
  constructor(executor) {
    this.status = PENDING;
    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];
    this.value = '';
    this.reason = '';

    try {
      executor(this._resolve.bind(this), this._reject.bind(this));
    } catch (e) {
      this._reject(e);
    }
  }

  _resolve(value) {
    // Promise对象或者thenable对象
    if (isThenable(value)) {
      return value.then(this._resolve.bind(this), this._reject.bind(this))
    }
    if (this.status === PENDING) {
      this.status = FULFILLED;
      this.value = value;
      this.onFulfilledCallbacks.forEach(fn => fn());
    }
  }

  _reject(reason) {
    if (this.status === PENDING) {
      this.status = REJECTED;
      this.reason = reason;
      this.onRejectedCallbacks.forEach(fn => fn());
    }
  }

  then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
    onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason };
    const promise2 = new MyPromise((resolve, reject) => {
      if (this.status === FULFILLED) {
        setTimeout(() => {
          try {
            let x = onFulfilled(this.value);
            resolvePromise(promise2, x, resolve, reject);

          } catch (e) {
            reject(e);
          }
        })
      }

      if (this.status === REJECTED) {
        setTimeout(() => {
          try {
            let x = onRejected(this.reason);
            resolvePromise(promise2, x, resolve, reject);
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
              resolvePromise(promise2, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          })
        })

        this.onRejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onRejected(this.reason);
              resolvePromise(promise2, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          })
        })
      }
    });

    return promise2;
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }

  finally(callback) {
    return this.then((value) => {
      return MyPromise.resolve(callback()).then(() => {
        return value;
      });
    }, (err) => {
      return MyPromise.resolve(callback()).then(() => {
        throw err;
      });
    });
  }


  static resolve(param) {
    if (param instanceof MyPromise) {
      return param;
    }
    return new MyPromise((resolve, reject) => {
      if (isThenable(param)) {
        setTimeout(() => {
          param.then(resolve, reject);
        });
      } else {
        resolve(param);
      }
    });
  }

  static reject(reason) {
    return new MyPromise((resolve, reject) => {
      reject(reason);
    });
  }

  static race(promises) {
    return new MyPromise((resolve, reject) => {
      if (promises.length === 0) {
        return;
      } else {
        for (let i = 0; i < promises.length; i++) {
          // 先MyPromise.resolve包装一下，防止传入数组里面的对象是普通对象而不是Promise对象
          MyPromise.resolve(promises[i]).then((data) => {
            resolve(data);
            return;
          }, (err) => {
            reject(err);
            return;
          });
        }
      }
    });
  }

  static all(promises) {
    return new MyPromise((resolve, reject) => {
      let index = 0;
      let result = [];
      if (promises.length === 0) {
        resolve(result);
      } else {
        function processValue(i, data) {
          result[i] = data;
          if (++index === promises.length) {
            resolve(result);
          }
        }
        for (let i = 0; i < promises.length; i++) {
          MyPromise.resolve(promises[i]).then((data) => {
            processValue(i, data);
          }, (err) => {
            reject(err);
            return;
          });
        }
      }
    });
  }

}

function resolvePromise(promise2, x, resolve, reject) {
  if (promise2 === x) {
    reject(new TypeError('循环引用'));
  }

  // Promise对象或者thenable对象
  if (isThenable(x)) {
    try {
      x.then(resolve, reject)
    } catch (e) {
      reject(e);
    }
  } else {
    // 其他普通对象
    resolve(x);
  }
}
```
</details>

### 参考
- [深究Promise的原理及其实现](https://github.com/yonglijia/JSPI/blob/master/How%20to%20implement%20a%20Promise.md)
- [Promise的源码实现](https://github.com/YvetteLau/Blog/issues/2)
- [一步一步实现一个Promise](https://github.com/xieranmaya/blog/issues/3)
- [简单实现Promise](https://imweb.io/topic/5bbc264b6477d81e668cc930)
