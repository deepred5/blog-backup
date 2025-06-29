---
title: JavaScript的面向对象
pubDatetime: 2018-03-26T13:38:44.000Z
tags:
  - JavaScript
description: JavaScript的面向对象
---
JavaScript的面向对象与其他语言的面向对象，其实有很大的区别。

JavaScript是基于原型的面向对象系统，而传统语言(比如java)的面向对象都是基于类的。

## 构造函数
```javascript
function Person(name, age, job) {
    this.age = age;
    this.name = name;
    this.job = job;
}

Person.prototype.sayName = function() {
    console.log(this.name);
}
```
```javascript
var cody = new Person('cody', '24', 'frontend');
cody.name;
cody.sayName();
```
<!-- more -->

在这个常见的构造函数写法中，我们需要知道以下几点：

1.`Person`这个函数被定义后，会自带一个`prototype`属性，这个属性指向一个对象，既**原型对象**，这个对象同时有一个`constructor`属性，指向`Person`
```javascript
Person.prototype = {
    constructor: Person
}
```
注意的是，所有函数都有`prototype`属性，并不是只有构造函数才有。

2.`cody`这个通过构造函数生成的对象，有一个`__proto__`属性，它指向构造函数`Person`的原型对象，既`Person.prototype`
访问`cody.name`时，在它自身寻找该属性，找到了，于是就返回该值。
访问`cody.sayName`时，也是先在它自身寻找该属性，但是无法找到，于是开始通过**原型链**向上寻找: 寻找`cody.__proto__`，也就是`Person.prototype`原型对象，发现了该属性，于是返回这个方法。
访问`cody.toString`时，在`Person.prototype`原型对象上也找不到，这时，继续向上寻找，既寻找`Person.prototype.__proto__`也就是`Object.prototype`，在它上面，可以找到`toString`

## 继承
```javascript
function Animal(name) {
    this.name = name;
}
Animal.prototype.sayName = function() {
    console.log(this.name);
}

function Duck(name, color) {
    Animal.call(this, name);
    this.color = color;
}

Duck.prototype = new Animal();
// 也可以优化成这样，减少一次父级构造函数调用
// Duck.prototype = Object.create(Animal.prototype);
Duck.prototype.constructor = Duck;
Duck.prototype.sayColor = function() {
    console.log(this.color);
}
```
```javascript
var duck = new Duck('duck', 'yellow');
duck.sayColor();
duck.sayName();
```

前面我们说过，JS是基于原型的面向对象。所以，继承并不一定需要使用构造函数，我们可以基于一个已经存在的对象，对这个对象进行继承。

```javascript
var obj = {
    name: 'cody',
    say: function() {
        console.log(this.name)
    }
};

var sub = Object.create(obj);
sub.name = 'deepred';
sub.say(); // deepred
```

`Object.create`的原理是：
```javascript
Object.create = Object.create || function(obj) {
    var F = function() {};
    F.prototype = obj;

    return new F();
}
```

## ES6的class语法

ES6引入了class语法，让JS看起来更像是面向对象的语言，但这仅仅是语法糖而已，背后仍然是基于原型的继承方式。

```javascript
class Animal {
    constructor(name) {
        this.name = name;
    }
    sayName() {
        console.log(this.name)
    }
}

class Duck extends Animal {
    constructor(name, color) {
        super(name);
        this.color = color;
    }

    sayColor() {
        console.log(this.color);
    }

    sayName() {
        // 调用父级同名方法
        super.sayName();
        console.log('duck sayname')
    }
}
```
```javascript
var duck = new Duck('duck', 'red');
duck.sayColor();
duck.sayName();
```