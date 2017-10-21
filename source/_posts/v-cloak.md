---
title: v-cloak
date: 2016-11-09 10:27:34
tags: [vue]
---

# v-cloak
作用是取消数据绑定时出现的代码闪烁。在angular里面则是用ng-cloak指令。
```javascript
// example1:
<span>{{name}}</span>
// example2: 
<span v-text="name"></span>
// example3: 
<span v-cloak>{{name}}</span>
```
例子2和例子3实现的效果是一样的，而例子1在vue解析{{name}}之前，用户是可以看到name这个字符串的，之后才会用name的实际值替代。这就会导致页面出现闪烁的不好效果。而例子2和例子3不会有这种闪烁的情况。

注意：需要配合css，才能实现绑定前隐藏
```css
[v-cloak] {
  display: none;
}
```
