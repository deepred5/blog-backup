---
title: MVC和类
pubDatetime: 2016-10-28T14:22:40.000Z
tags:
  - JavaScript
description: MVC和类
---
# MVC
model(模型)：数据
view（视图）：页面
controller(控制器):将数据交给页面进行渲染

<!-- more -->

# MVC的基本事件流程
1. 用户触发事件
2. 控制器的事件处理函数被触发
3. 控制器请求数据，交给视图渲染
4. 用户看到更新的页面

# 类

```javascript
var Person = function(name) {
	this.name = name
}

Person.prototype.say = function() {
	console.log(this.name);
}

var tc = new Person('tc');
```

一种常用的模式是：给prototype取别名(jQuery就是这样的)
```javascript
Person.fn = Person.prototype;
Person.fn.say = function() {}
```
# 静态方法和实例方法
```javascript
Person.find = function() {}; // 静态方法
Person.prototype.find = function() {}; // 实例方法
```
# 封装两个函数，extend添加静态方法，include添加实例方法
```javascript
var Person = function(name) {
	this.name = name
}

Person.fn = Person.prototype;

Person.extend = function(obj) {
	for (var i in obj) {
		Person[i] = obj[i];
	}
};

Person.include = function(obj) {
	for (var i in obj) {
		Person.fn[i] = obj[i];
	}
};

Person.extend({
	find: function(id) {},
	exists: function(id) {}
});

Person.include({
	save: function(id) {},
	destory: function(id) {}
});
```
# 继承
```javascript
function Parent() {

}

Parent.prototype.say = function() {
	console.log('233');
};

function Child() {

}

Child.prototype = new Parent();

var child = new Child();

child.say();
```
# 封装一个函数，实现继承
```javascript
function extend(child, parent) {
	var temp = function() {};
	temp.prototype = parent.prototype;
	child.prototype = new temp();
}
```
# apply call改变this指向
常见应用 proxy 代理
```javascript
var proxy = function(func, thisObject) {
	return function() {
		return func.apply(thisObject, arguments);
	};
};

var say = function() {
	console.log(this.name);
};

var dog = {name: 'tc'};
var proxysay = proxy(say, dog);
proxysay(); // tc
```
# bind 可以原生实现代理
```javascript
var proxysay = say.bind(dog);
proxysay(); // tc
```

