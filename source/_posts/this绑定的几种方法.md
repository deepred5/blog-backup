---
title: this绑定的几种方法
date: 2017-03-26 19:03:28
tags: [vue, js]
---
在写代码的过程中，经常会出现this绑定失效: 
比如，异步回调函数的this，往往指向window或者undefined，而我们其实想要它指向当前的对象

拿Vue举个例子:
```javascript
<template>
  <div>
    <h3>电影</h3>
    <ul>
      <li v-for="movie in movies">{{movie.title}}</li>
    </ul>
  </div>
</template>

<script>
  import axios from 'axios';
  export default {
    data() {
      return {
        movies: []
      }
    },
    mounted() {

      axios.get('https://node-douban-api.herokuapp.com/movie/in_theaters')
        .then(function (response) {
          this.movies = response.data.subjects;
        })
    }
  }
</script>
```
![](http://pic.deepred5.com/5e5ca73f-c92e-495c-ba55-6c5481fc6ce8.png)
如图，程序报错，因为then方法里的匿名函数this指向是undefined，并不是我们所想的vue实例

<!-- more -->

*解决方法*

1.this取别名
```
mounted() {
    var that = this;
    axios.get('https://node-douban-api.herokuapp.com/movie/in_theaters')
        .then(function(response) {
            that.movies = response.data.subjects;
        })
}
```
2.bind绑定
```
mounted() {
    axios.get('https://node-douban-api.herokuapp.com/movie/in_theaters')
        .then(function(response) {
            this.movies = response.data.subjects;
        }.bind(this))
}
```
3.箭头绑定
```
mounted() {
    axios.get('https://node-douban-api.herokuapp.com/movie/in_theaters')
        .then(response => {
            this.movies = response.data.subjects;
        })
}

```