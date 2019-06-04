---
title: 傻傻分不清的Manifest
date: 2019-06-04 15:36:58
tags: ['js', 'webpack', 'pwa']
toc: true
---
在前端，说到`manifest`，其实是很有歧义的，就我目前了解的情况来说，`manifest`可以指代下列含义：

1. `html`标签的`manifest`属性: [离线缓存](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Using_the_application_cache)（目前已被废弃）
2. [PWA](https://developer.mozilla.org/zh-CN/docs/Web/Manifest): 将Web应用程序安装到设备的主屏幕
3. webpack中[DLL](https://webpack.js.org/plugins/dll-plugin/#root)打包时,输出的`manifest.json`文件，用来分析已经打包过的文件，优化打包速度和大小
4. wbbpack中[webpack-manifest-plugin](https://www.npmjs.com/package/webpack-manifest-plugin)插件打包出来的`manifest.json`文件，用来生成一份资源清单，为后端渲染服务

下面我们来一一介绍下

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

#### DLL打包

#### webpack-manifest-plugin