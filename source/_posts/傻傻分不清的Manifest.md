---
title: 傻傻分不清的Manifest
date: 2019-06-04 15:36:58
tags: ['js', 'webpack', 'pwa']
toc: true
---
在前端，说到`manifest`，其实是有歧义的，就我了解的情况来说，`manifest`可以指代下列含义：

1. `html`标签的`manifest`属性: [离线缓存](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Using_the_application_cache)（目前已被废弃）
2. [PWA](https://developer.mozilla.org/zh-CN/docs/Web/Manifest): 将Web应用程序安装到设备的主屏幕
3. webpack中[webpack-manifest-plugin](https://www.npmjs.com/package/webpack-manifest-plugin)插件打包出来的`manifest.json`文件，用来生成一份资源清单，为后端渲染服务 
4. webpack中[DLL](https://webpack.js.org/plugins/dll-plugin/#root)打包时,输出的`manifest.json`文件，用来分析已经打包过的文件，优化打包速度和大小
5. webpack中[manifest](https://www.webpackjs.com/concepts/manifest/)运行时代码

下面我们来一一介绍下
<!-- more -->

#### html属性
```html
<!DOCTYPE html>
<html lang="en" manifest="/tc.mymanifest">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Document</title>
  <link rel="stylesheet" href="/theme.css">
  <script src="/main.js"></script>
  <script src="/main2.js"></script>
</head>
<body>
 
</body>

</html>
```
浏览器解析这段html标签时，就会去访问`tc.mymanifest`这个文件，这是一个缓存清单文件

`tc.mymanifest`
```
# v1 这是注释
CACHE MANIFEST
/theme.css
/main.js

NETWORK:
*

FALLBACK:
/html5/ /404.html
```
`CACHE MANIFEST`指定需要缓存的文件，第一次下载完成以后，文件都不会再从网络请求了，即使用户不是离线状态，除非`tc.mymanifest`更新了，缓存清单更新之后，才会再次下载。标记了manifest的html本身也被缓存

`NETWORK`指定非缓存文件，所有类似资源的请求都会绕过缓存，即使用户处于离线状态，也不会读缓存

`FALLBACK`指定了一个后备页面，当资源无法访问时，浏览器会使用该页面。
比如离线访问/html5/目录时，就会用本地的/404.html页面

缓存清单可以是任意后缀名，不过必须指定`content-type`属性为`text/cache-manifest`

那如何更新缓存？一般有以下几种方式：

* 用户清空浏览器缓存
* manifest 文件被修改(即使注释被修改)
* 由程序来更新应用缓存

需要特别注意：用户第一次访问该网页，缓存文件之后，第二次进入该页面，发现`tc.mymanifest`缓存清单更新了，于是会重新下载缓存文件，但是，**第二次进入显示的页面仍然执行的是旧文件，下载的新文件，只会在第三次进入该页面后执行！！！**

如果希望用户立即看到新内容，需要js监听更新事件，重新加载页面
```javascript
window.addEventListener('load', function (e) {

  window.applicationCache.addEventListener('updateready', function (e) {

    if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
      // 更新缓存
      // 重新加载
      window.applicationCache.swapCache();
      window.location.reload();

    } else {

    }

  }, false);

}, false);
```
建议对`tc.mymanifest`缓存清单设置永不缓存

不过，manifest也有很多[缺点](https://www.zhihu.com/question/29876535)，比如需要手动一个个填写缓存的文件，更新文件之后需要二次刷新，如果更新的资源中有一个资源更新失败了，将导致全部更新失败，将用回上一版本的缓存

HTML5规范也废弃了这个属性，因此不建议使用

#### PWA
为了实现PWA应用添加至桌面的功能，除了要求站点支持HTTPS之外，还需要准备 `manifest.json`文件去配置应用的图标、名称等信息
```html
<link rel="manifest" href="/manifest.json">
```
```js
{ 
"name" : "Minimal PWA" , 
"short_name" : "PWA Demo" , 
"display" : "standalone" , 
"start_url" : "/" , 
"theme_color" : "#313131" , 
"background_color" : "#313131" , 
"icons" : [ 
  {
    "src": "images/touch/homescreen48.png",
    "sizes": "48x48",
    "type": "image/png"
  }
 ] 
}
```
通过一系列配置，就可以把一个PWA像APP一样，添加一个图标到手机屏幕上，点击图标即可打开站点

#### 基于webpack的react开发环境
本文默认你已经了解最基本的webpack配置，如果完全不会，建议看下这篇

[基础知识](http://anata.me/2018/01/08/%E4%BB%8E%E9%9B%B6%E5%BC%80%E5%A7%8B%E6%90%AD%E5%BB%BA%E4%B8%80%E4%B8%AA%E7%AE%80%E5%8D%95%E7%9A%84%E5%9F%BA%E4%BA%8Ewebpack%E7%9A%84vue%E5%BC%80%E5%8F%91%E7%8E%AF%E5%A2%83/)

我们首先搭建一个最简单的基于webpack的react开发环境

**源代码地址**：https://github.com/deepred5/learn-dll

```bash
mkdir learn-dll
cd learn-dll
```
安装依赖
```bash
npm init -y
npm install @babel/polyfill react react-dom --save
```
```
npm install webpack webpack-cli webpack-dev-server @babel/core @babel/preset-env @babel/preset-react add-asset-html-webpack-plugin autoprefixer babel-loader clean-webpack-plugin css-loader html-webpack-plugin mini-css-extract-plugin node-sass postcss-loader sass-loader style-loader --save-dev
```

新建`.bablerc`
```javascript
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "useBuiltIns": "usage", // 根据browserslis填写的浏览器，自动添加polyfill
        "corejs": 2,
      }
    ],
    "@babel/preset-react" // 编译react
  ],
  "plugins": []
}
```
新建`postcss.config.js`
```javascript
module.exports = {
  plugins: [
    require('autoprefixer') // 根据browserslis填写的浏览器，自动添加css前缀
  ]
}
```
新建`.browserslistrc`
```
last 10 versions
ie >= 11
ios >= 9
android >= 6
```
新建`webpack.dev.js`(基本配置不再详细介绍)
```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'cheap-module-eval-source-map',
  entry: {
    main: './src/index.js'
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: '[name].js',
    chunkFilename: '[name].chunk.js',
  },
  devServer: {
    historyApiFallback: true,
    overlay: true,
    port: 9001,
    open: true,
    hot: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader"
      },
      {
        test: /\.css$/,
        use: ['style-loader',
          'css-loader',
          'postcss-loader'
        ],
      },
      {
        test: /\.scss$/,
        use: ['style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: false,
              importLoaders: 2
            }
          },
          'sass-loader',
          'postcss-loader'
        ],
      },
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './src/index.html' }), // index打包模板
  ]
}
```
新建`src`目录，并新建`src/index.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>learn dll</title>
</head>
<body>
  <div id="app"></div>
</body>
</html>
```
新建`src/Home.js`
```javascript
import React from 'react';
import './Home.scss';

export default () => <div className="home">home</div>
```
新建`src/Home.scss`
```css
.home {
  color: red;
}
```
新建`src/index.js`
```javascript
import React, { Component } from 'react';
import ReactDom from 'react-dom';
import Home from './Home';

class Demo extends Component {
  render() {
    return (
      <Home />
    )
  }
}

ReactDom.render(<Demo/>, document.getElementById('app'));
```
修改`package.json`
```bash
"scripts": {
  "dev": "webpack-dev-server --config webpack.dev.js"
},
```
最后，运行`npm run dev`，应该可以看见效果

新建`webpack.prod.js`
```javascript
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');


module.exports = {
  mode: 'production',
  entry: {
    main: './src/index.js'
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: '[name].[contenthash:8].js',
    chunkFilename: '[name].[contenthash:8].chunk.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader"
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, // 单独提取css文件
          'css-loader',
          'postcss-loader'
        ],
      },
      {
        test: /\.scss$/,
        use: [MiniCssExtractPlugin.loader,
        {
          loader: 'css-loader',
          options: {
            modules: false,
            importLoaders: 2
          }
        },
          'sass-loader',
          'postcss-loader'
        ],
      },
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './src/index.html' }),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash:8].css',
      chunkFilename: '[id].[contenthash:8].css',
    }),
    new CleanWebpackPlugin(), // 打包前先删除之前的dist目录
  ]
};
```
修改`package.json`，添加一句`"build": "webpack --config webpack.prod.js"`

运行`npm run build`，可以看见打包出来的`dist`目录

html,js,css都单独分离出来了

![](http://pic.deepred5.com/m1.png)


至此，一个基于webpack的react环境搭建完成

#### webpack-manifest-plugin
通常情况下，我们打包出来的js,css都是带上版本号的，通过`HtmlWebpackPlugin`可以自动帮我们在`index.html`里面加上带版本号的js和css
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>learn dll</title>
<link href="main.198b3634.css" rel="stylesheet"></head>
<body>
  <div id="app"></div>
<script type="text/javascript" src="main.d312f172.js"></script></body>
</html>
```
但是在某些情况，`index.html`模板由后端渲染，那么我们就需要一份打包清单，知道打包后的文件对应的真正路径

安装插件`webpack-manifest-plugin`

`npm i webpack-manifest-plugin -D`

修改`webpack.prod.js`
```javascript
const ManifestPlugin = require('webpack-manifest-plugin');
module.exports = {
    // ...
    plugins: [
      new ManifestPlugin()
    ]
};
```
重新打包，可以看见`dist`目录新生成了一个`manifest.json`
```javascript
{
  "main.css": "main.198b3634.css",
  "main.js": "main.d312f172.js",
  "index.html": "index.html"
}
```
比如在SSR开发时，前端打包后，node后端就可以通过这个json数据，返回正确资源路径的html模板
```javascript
const buildPath = require('./dist/manifest.json');

res.send(`
  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>ssr</title>
<link href="${buildPath['main.css']}" rel="stylesheet"></head>
<body>
  <div id="app"></div>
<script type="text/javascript" src="${buildPath['main.js']}"></script></body>
</html>
`);
```

#### 代码分割
我们之前的打包方式，有一个缺点，就是把业务代码和库代码都统统打到了一个`main.js`里面。每次业务代码改动后，`main.js`的hash值就变了，导致客户端又要重新下载一遍`main.js`，但是里面的库代码其实是没改变的！

通常情况下，`react` `react-dom`之类的库，都是不经常改动的。我们希望单独把这些库代码提取出来，生成一个`vendor.js`，这样每次改动代码，只是下载`main.js`，`vendor.js`可以充分缓存(也就是所谓的代码分割code splitting)

webpack4自带[代码分割](https://webpack.js.org/guides/code-splitting/)功能，只要配置:
```javascript
optimization: {
  splitChunks: {
    chunks: 'all'
  }
}
```
`webpack.prod.js`
```javascript
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');

module.exports = {
  mode: 'production',
  entry: {
    main: './src/index.js'
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: '[name].[contenthash:8].js',
    chunkFilename: '[name].[contenthash:8].chunk.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader"
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader'
        ],
      },
      {
        test: /\.scss$/,
        use: [MiniCssExtractPlugin.loader,
        {
          loader: 'css-loader',
          options: {
            modules: false,
            importLoaders: 2
          }
        },
          'sass-loader',
          'postcss-loader'
        ],
      },
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './src/index.html' }),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash:8].css',
      chunkFilename: '[id].[contenthash:8].css',
    }),
    new CleanWebpackPlugin(),
    new ManifestPlugin()
  ],
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  }
};
```
重新打包，发现新生成了一个`vendor.js`文件，公用的一些代码就被打包进去了

![](http://pic.deepred5.com/m2.png)

重新修改`src/Home.js`,然后打包，你会发现`vendor.js`的hash没有改变，这也是我们希望的

#### DLL打包
上面的打包方式，随着项目的复杂度上升后，打包速度会开始变慢。原因是，每次打包，webpack都要分析哪些是公用库，然后把他打包到`vendor.js`里

我们可不可以在第一次构建`vendor.js`以后，下次打包，就直接跳过那些被打包到`vendor.js`里的代码呢？这样打包速度可以明显提升

这就需要`DllPlugin`结合`DllRefrencePlugin`插件的运用

dll打包原理就是：
1. 把指定的库代码打包到一个`dll.js`,同时生成一份对应的`manifest.json`文件
2. webpack打包时，读取`manifest.json`,知道哪些代码可以直接忽略，从而提高构建速度

我们新建一个`webpack.dll.js`
```javascript
const path = require('path');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    vendors: ['react', 'react-dom'] // 手动指定打包哪些库
  },
  output: {
    filename: '[name].[hash:8].dll.js',
    path: path.resolve(__dirname, './dll'),
    library: '[name]'
  },
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.DllPlugin({
      path: path.join(__dirname, './dll/[name].manifest.json'), // 生成对应的manifest.json，给webpack打包用
      name: '[name]',
    }),
  ],
}

```
添加一条命令:

`"build:dll": "webpack --config webpack.dll.js"`

运行dll打包

`npm run build:dll`

发现生成一个`dll`目录

![](http://pic.deepred5.com/m3.png)

修改`webpack.prod.js`
```javascript
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const webpack = require('webpack');

module.exports = {
  mode: 'production',
  entry: {
    main: './src/index.js'
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: '[name].[contenthash:8].js',
    chunkFilename: '[name].[contenthash:8].chunk.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader"
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader'
        ],
      },
      {
        test: /\.scss$/,
        use: [MiniCssExtractPlugin.loader,
        {
          loader: 'css-loader',
          options: {
            modules: false,
            importLoaders: 2
          }
        },
          'sass-loader',
          'postcss-loader'
        ],
      },
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './src/index.html' }),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash:8].css',
      chunkFilename: '[id].[contenthash:8].css',
    }),
    new webpack.DllReferencePlugin({
      manifest: path.resolve(__dirname, './dll/vendors.manifest.json') // 读取dll打包后的manifest.json，分析哪些代码跳过
    }),
    new CleanWebpackPlugin(),
    new ManifestPlugin()
  ],
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  }
};
```
重新`npm run build`，发现`dist`目录里，`vendor.js`没有了

这是因为`react`,`react-dom`已经打包到`dll.js`里了，`webpack`读取`manifest.json`之后，知道可以忽略这些代码，于是就没有再打包了

但这里还有个问题，打包后的`index.html`还需要添加`dll.js`文件，这就需要`add-asset-html-webpack-plugin`插件

`npm i add-asset-html-webpack-plugin -D`

修改`webpack.prod.js`

```javascript
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const webpack = require('webpack');
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    main: './src/index.js'
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: '[name].[contenthash:8].js',
    chunkFilename: '[name].[contenthash:8].chunk.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader"
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader'
        ],
      },
      {
        test: /\.scss$/,
        use: [MiniCssExtractPlugin.loader,
        {
          loader: 'css-loader',
          options: {
            modules: false,
            importLoaders: 2
          }
        },
          'sass-loader',
          'postcss-loader'
        ],
      },
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './src/index.html' }),
    new AddAssetHtmlPlugin({ filepath: path.resolve(__dirname, './dll/*.dll.js') }), // 把dll.js加进index.html里，并且拷贝文件到dist目录
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash:8].css',
      chunkFilename: '[id].[contenthash:8].css',
    }),
    new webpack.DllReferencePlugin({
      manifest: path.resolve(__dirname, './dll/vendors.manifest.json') // 读取dll打包后的manifest.json，分析哪些代码跳过
    }),
    new CleanWebpackPlugin(),
    new ManifestPlugin()
  ],
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  }
};

```
重新`npm run build`，可以看见`dll.js`也被打包进`dist`目录了，同时`index.html`也正确引用
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>learn dll</title>
<link href="main.198b3634.css" rel="stylesheet"></head>
<body>
  <div id="app"></div>
<script type="text/javascript" src="vendors.8ec3d1ea.dll.js"></script><script type="text/javascript" src="main.0bc9c924.js"></script></body>
</html>
```

![](http://pic.deepred5.com/m4.png)

#### runtime
webpack中有[运行时](https://www.webpackjs.com/concepts/manifest/)的概念,比如我们通过webpack打包后分割成了`dll.js`,`vendors.js`,`main.js`,那这三个代码，到底哪个先调用，哪个后调用，他们运行顺序就是由运行时代码组织(通过读取`manifest`数据)

通常情况下我们无需关心运行时代码，但如果希望尽可能的优化浏览器缓存，那么我们可以把运行时代码单独提取出来，这样某些文件发生改变后，一些与之相关的文件hash值并不会也随之改变。

通过配置`runtimeChunk`即可
```javascript
optimization: {
    runtimeChunk: { name: 'manifest' }
}
```

#### 小结

我们介绍了5种`manifest`相关的前端技术。`manifest`的英文含义是**名单**, 5种技术的确都是把`manifest`当做清单使用：
1. 缓存清单
2. PWA清单
3. 打包资源路径清单
4. dll打包清单
5. 代码加载顺序清单

只不过是在不同的场景中使用特定的清单来完成某些功能

所以，学好英文是多么重要，这样才不会傻傻分不清`manifest`到底是干啥的！