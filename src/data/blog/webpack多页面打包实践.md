---
title: webpack多页面打包实践
pubDatetime: 2020-02-27T14:26:57.000Z
tags:
  - Webpack
description: webpack多页面打包实践
---
前不久从零开始写了一个webpack多页面打包boilerplate([webpack4-boilerplate](https://github.com/deepred5/webpack4-boilerplate))，方便以后工作可以开箱即用，特此记录下开发过程中的要点。

注意：本文不会详细介绍webpack的基础知识，如果完全不会，建议看下我之前写过的基础文章
* [从零开始搭建一个简单的基于webpack的vue开发环境](http://anata.me/2018/01/08/%E4%BB%8E%E9%9B%B6%E5%BC%80%E5%A7%8B%E6%90%AD%E5%BB%BA%E4%B8%80%E4%B8%AA%E7%AE%80%E5%8D%95%E7%9A%84%E5%9F%BA%E4%BA%8Ewebpack%E7%9A%84vue%E5%BC%80%E5%8F%91%E7%8E%AF%E5%A2%83/)
* [从零开始搭建一个简单的基于webpack的react开发环境](http://anata.me/2019/06/04/%E5%82%BB%E5%82%BB%E5%88%86%E4%B8%8D%E6%B8%85%E7%9A%84Manifest/#%E5%9F%BA%E4%BA%8Ewebpack%E7%9A%84react%E5%BC%80%E5%8F%91%E7%8E%AF%E5%A2%83)

### 多页打包的原因
首先发出一个直击灵魂的拷问：为什么要多页面打包？

<!-- more -->

习惯了React，Vue全家桶的同学，可能觉得写代码不就是：`npm run dev` `npm run build`一把梭吗？

然而现实是骨感的，很多场景下，单页应用的开发模式并不适用。比如公司经常开发一些活动页:
`https://www.demo.com/activity/activity1.html` 
`https://www.demo.com/activity/activity2.html`
`https://www.demo.com/activity/activity3.html`

上述三个页面是完全不相干的活动页，页面之间并没有共享的数据。然而每个页面都使用了React框架，并且三个页面都使用了通用的弹窗组件。在这种场景下，就需要使用webpack多页面打包的方案了：

1. 保留了传统单页应用的开发模式：使用Vue，React等前端框架(当然也可以使用jQuery)，支持模块化打包，你可以把**每个页面看成是一个单独的单页应用**
2. 独立部署：每个页面相互独立，可以单独部署，解耦项目的复杂性，你甚至可以在不同的页面选择不同的技术栈

因此，我们可以把多页应用看成是<font color="orange">~~乞丐版的前端微服务~~</font>。

### 多页面打包的原理

首先我们约定：
`src/pages`目录下，每个文件夹为单独的一个页面。每个页面至少有两个文件配置:

* `app.js`: 页面的逻辑入口

* `index.html`: 页面的html打包模板

```
src/pages
├── page1
│   ├── app.js
│   ├── index.html
│   ├── index.scss
└── page2
    ├── app.js
    ├── index.html
    └── index.scss
```

前面我们说过：**每个页面可以看成是个独立的单页应用**。

单页应用怎么打包的？单页应用是通过配置webpack的的entry
```javascript
module.exports = {
  entry: './src/main.js', // 项目的入口文件，webpack会从main.js开始，把所有依赖的js都加载打包
  output: {
      path: path.resolve(__dirname, './dist'), // 项目的打包文件路径
      filename: 'build.js' // 打包后的文件名
  }
};
```
因此，多页应用只需配置多个entry即可
```javascript
module.exports = {
  entry: {
    'page1': './src/pages/page1/app.js', // 页面1
    'page2': './src/pages/page2/app.js', // 页面2
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'js/[name]/[name]-bundle.js', // filename不能写死，只能通过[name]获取bundle的名字
  }
}
```
同时，因为多页面的index.html模板各不相同，所以需要配置多个HtmlWebpackPlugin。

注意：`HtmlWebpackPlugin`一定要配`chunks`，否则所有页面的js都会被注入到当前html里
```javascript
module.exports = {
  plugins: [
    new HtmlWebpackPlugin(
    {
      template: './src/pages/page1/index.html',
      chunks: ['page1'],
    }
  ),
  new HtmlWebpackPlugin(
    {
      template: './src/pages/page2/index.html',
      chunks: ['page2'],
    }
  ),
  ]
}
```
**多页面打包的原理就是：配置多个`entry`和多个`HtmlWebpackPlugin`**

### 多页打包的细节

#### 代码分割
1. 把多个页面共用的第三方库(比如React,Fastclick)单独打包出一个`vendor.js`
2. 把多个页面共用的逻辑代码和共用的全局css(比如css-reset,icon字体图标)单独打包出`common.js`和`common.css`
3. 把运行时代码单独提取出来`manifest.js`
4. 把每个页面自己的业务代码打包出`page1.js`和`page1.css`

前3项是每个页面都会引入的公共文件，第4项才是每个页面自己单独的文件。

实现方式也很简单，配置`optimization`即可：
```javascript
module.exports = {
  optimization: {
    splitChunks: {
      cacheGroups: {
        // 打包业务中公共代码
        common: {
          name: "common",
          chunks: "initial",
          minSize: 1,
          priority: 0,
          minChunks: 2, // 同时引用了2次才打包
        },
        // 打包第三方库的文件
        vendor: {
          name: "vendor",
          test: /[\\/]node_modules[\\/]/,
          chunks: "initial",
          priority: 10,
          minChunks: 2, // 同时引用了2次才打包
        }
      }
    },
    runtimeChunk: { name: 'manifest' } // 运行时代码
  }
}
```
#### hash
最后打包出来的文件，我们希望带上hash值，这样可以充分利用浏览器缓存。webpack中有`hash`，`chuckhash`，`contenthash`：生产环境时，我们一般使用`contenthash`，而开发环境其实可以不指定hash。
```javascript
// dev开发环境
module.exports = {
  output: {
    filename: 'js/[name]/[name]-bundle.js',
    chunkFilename: 'js/[name]/[name]-bundle.js',
  },
}

// prod生产环境
module.exports = {
  output: {
    filename: 'js/[name]/[name]-bundle.[contenthash:8].js',
    chunkFilename: 'js/[name]/[name]-bundle.[contenthash:8].js',
  },
}
```

#### mock和proxy
开发环境，通常需要mock数据，还需要代理api到服务器。我们可以通过`devServer`配合[mocker-api](https://github.com/jaywcjlove/mocker-api)第三方库实现。
```javascript
const apiMocker = require('mocker-api');

// dev开发环境
module.exports = {
  devServer: {
    before(app) { // 本地mock数据
      apiMocker(app, path.resolve(__dirname, '../mock/index.js'))
    },
    proxy: { // 代理接口
      '/api': {
        target: 'https://anata.me', // 后端联调地址
        changeOrigin: true,
        secure: false,
      },
    }
  },
}
```

#### 拆分webpack配置
为了通用配置，把webpack的配置文件分成3份。
```
build
├── webpack.base.js // 共用部分
├── webpack.dev.js // dev
└── webpack.prod.js // 生产
```
`dev`和`prod`配置的主要区别：
* `dev`配置`devServer`，方便本地调试开发
* `prod`打包压缩文件，单独提取css (dev不提取是为了css热更新)，生成静态资源清单`manifest.json`

关于为什么要生成一份`manifest.json`，以及打包后的代码如何部署，我将会在[下一篇文章](http://anata.me/2020/02/29/%E5%86%8D%E8%B0%88%E5%89%8D%E5%90%8E%E7%AB%AF%E5%88%86%E7%A6%BB%E5%BC%80%E5%8F%91%E5%92%8C%E9%83%A8%E7%BD%B2/)详细介绍。

### 总结
webpack的学习始终是前端绕不过去的一道坎。通过这次从零搭建多页面打包模板，也算是巩固了一下基础知识，离~~webpack配置工程师~~又近了一步。