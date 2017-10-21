---
title: js中的私有变量
date: 2016-11-23 19:32:03
tags: [js]
---
# 模仿块级作用域（私有作用域）
```
(function() {
	// 块级作用域
})();

// 访问不到块级作用域
```
这种方法可以限制向全局作用域中添加过多的变量和函数，同时还可以减少闭包占用的内存问题，因为没有指向匿名函数的引用。只要函数执行完毕就可以立即销毁作用域链。
<!-- more -->

# 私有变量
默认情况下，函数内部的变量是私有的，外部访问不到。
如果在函数内部创建一个闭包，闭包则可以访问这些内部变量。
通过这个原理，可以创建用于访问私有变量的公有方法。

特权方法：可以访问私有变量和私有函数的公有方法

创建私有变量的方法：

## 方法一 构造函数
```
// 在构造函数内部定义了私有变量name
// 定义了特权方法getName setName

// 特权方法作为闭包有权访问name

// 每个实例的name都是独立的
// 每个实例的特权方法也是重新创建的，无法共享，这也是缺点所在

function Person(name) {
	this.getName = function() {
		return name;
	};
	this.setName = function(value) {
		name = value;
	}
}

var tc = new Person('tc');
var dj = new Person('dj');
tc.getName(); // tc
dj.getName(); // dj
```
优点：
每个实例都有自己的私有变量
缺点：
必须使用构造函数模式，针对每个实例都会创建同样一组新方法

## 方法二 静态私有变量
```
// 立即执行函数创建了一个私有作用域

// name为私有变量
// Person没有使用函数声明，而是函数表达式，是因为函数声明只能定义局部函数，在这里是定义私有方法才用的
// Person没有用var定义，默认为全局变量

// 特权方法定义在原型上，所以可以被实例共享
// 但是私有变量被所有实例共享，一个实例改变了私有变量，其他实例均受影响，所以这也是缺点

(function() {
	var name = '';

	Person = function(value) {
		name = value;
	};

	Person.prototype.getName = function() {
		return name;
	};

	Person.prototype.setName = function(value) {
		name = value;
	};

})();

var tc = new Person('tc');
tc.getName();  // tc

var dj = new Person('dj');
tc.getName(); // dj
```
优点：
公有方法是所有实例共享的
缺点：
私有变量是静态的（由所有实例共享）

# 模块模式
之前的模式都使用了new操作符，所以是用于自定义类型创建私有变量和特权方法的。
模块模式则是为单例创建私有变量和特权方法的。
```
// 立即执行函数返回一个对象
// 这个对象提供特权方法的接口api
var person = (function() {

	// 初始化
	// 私有变量
	var name = 'tc';

	return {
		getName: function() {
			return name;
		},
		setName: function(value) {
			name = value;
		}
	}

})();
```
这种模式在为单例进行初始化，同时维护私有变量时非常有用。