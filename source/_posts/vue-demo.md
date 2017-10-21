---
title: vue github提交例子
date: 2016-11-07 18:55:27
tags: [vue, js]
---

vue官方上的一个github提交小例子

自己又重新写了遍，也算是熟悉一下vue

```html
<div id="app">
    <h1>Latest Vue.js Commits</h1>
    <input type="radio" name="branch" value="master" v-model="branch">master
    <input type="radio" name="branch" value="dev" v-model="branch">dev
    <p>vuejs/vue@{{branch}}</p>
    <ul>
        <li v-for="record in commits">
            <p>
                <a :href="record.html_url" class="commit">{{record.sha.slice(0, 4)}}</a> - <span class="message">{{record.commit.message | uppercase}}</span>
                <br>by <span class="author">{{record.commit.author.name}}</span> at <span class="date">{{record.commit.author.date | formatDate}}</span>
            </p>
        </li>
    </ul>
</div>
```
<!-- more -->
```javascript
var apiURL = 'https://api.github.com/repos/vuejs/vue/commits?per_page=3&sha=';

var app = new Vue({
    el: '#app',
    data: {
        branch: 'master',
        commits: null
    },
    created: function() {
        this.fetchData();
    },
    watch: {
        branch: 'fetchData'
    },
    methods: {
        fetchData: function() {
            var xhr = new XMLHttpRequest();
            var self = this;
            xhr.responseType = 'json';
            var url = apiURL + self.branch;
       
            xhr.open('GET', url, true);
            xhr.onload = function() {
                self.commits = xhr.response;
            }
            xhr.send();
        }
    },
    filters: {
        formatDate: function(str) {
            return str.replace(/T|Z/g, ' ')
        }
    }
});
```
# 用到的知识点
1. 单选按钮改变v-model绑定的branch
2. 观测branch改变时（watch），触发fetchData函数(**不能在单选按钮被点击时触发fetchData，因为此时branch还没有改变**)
3. 生命周期，在created时触发fetchData，初始化数据commits
4. 自定义过滤器formatDate
