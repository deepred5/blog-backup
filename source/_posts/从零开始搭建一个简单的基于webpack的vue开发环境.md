---
title: 从零开始搭建一个简单的基于webpack的vue开发环境
date: 2018-01-08 21:24:28
tags: [webpack, vue]
---
都8102年了，现在还来谈webpack的配置，额，是有点晚了。而且，基于vue-cli或者create-react-app生成的项目，也已经一键为我们配置好了webpack，看起来似乎并不需要我们深入了解。

不过，为了学习和理解webpack解决了前端的哪些痛点，还是有必要从零开始自己搭建一个简单的开发环境。本文的webpack配置参考了vue-cli提供`webpack-simple `模板，这也是vue-cli里面最简单的一个webpack配置，非常适合从零开始学习。

**注： 本文webpack基于3.10.0**
<!-- more -->

## 安装webpack
```
npm i webpack -g
```

## 项目初始化
新建一个文件夹vue-webpack-simple 

新建package.json
```
npm init -y
```

安装vue webpack webpack-dev-server
```
npm i vue --save
```
```
npm i webpack webpack-dev-server --save-dev
```

根目录下新建index.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>
    
</body>
</html>
```

根目录下新建webpack.config.js
```javascript
var path = require('path');
var webpack = require('webpack');

module.exports = {};
```

新建src文件夹，src文件夹下新建main.js

目前整个项目的结构如下:
![](http://pic.deepred5.com/webpack-1.png)

### js模块化
在ES6出现之前，js是没有统一的模块体系。
服务器端使用CommonJS规范,而浏览器端又有AMD和CMD两种规范

webpack的思想就是一切皆模块，官方推荐使用commonJS规范，这使得我们浏览器端也可以使用commonJS的模块化写法
```javascript
module.exports = {}
```

src目录下新建一个util.js
```javascript
module.exports = function say() {
    console.log('hello world');
}
```

main.js
```javascript
var say = require('./util');
say();
```

修改webpack.config.js
```javascript
var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: './src/main.js', // 项目的入口文件，webpack会从main.js开始，把所有依赖的js都加载打包
    output: {
        path: path.resolve(__dirname, './dist'), // 项目的打包文件路径
        publicPath: '/dist/', // 通过devServer访问路径
        filename: 'build.js' // 打包后的文件名
    },
    devServer: {
        historyApiFallback: true,
        overlay: true
    }
};
```

修改package.josn
```
"scripts": {
    "dev": "webpack-dev-server --open --hot",
    "build": "webpack --progress --hide-modules"
  },
```
注意：webpack-dev-server会自动启动一个静态资源web服务器 --hot参数表示启动热更新

修改index.html，引入打包后的文件
```
<script src="/dist/build.js"></script>
```

运行
```
npm run dev
```
可以发现浏览器自动打开的一个页面，查看控制台，有`hello world`打出

我们随意修改util.js，可以发现浏览器会自动刷新，非常方便。

如果我们希望看打包后的bundle.js文件，运行
```
npm run build
```
可以看到生成了一个dist目录，里面就有打包好后的bundle.js
![](http://pic.deepred5.com/webpack2.png)