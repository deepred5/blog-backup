---
title: web视频基础教程
date: 2020-12-24 10:58:28
tags: ['Media Source', 'Media Source Extensions', 'MSE', '视频']
toc: true
---
### 前言
提到网页播放视频，大部分前端首先想到的肯定是:
```html
<video width="600" controls>
  <source src="demo.mp4" type="video/mp4">
  <source src="demo.ogg" type="video/ogg">
  <source src="demo.webm" type="video/webm">
  您的浏览器不支持 video 标签。
</video>
```
的确，一个简单的`video`标签就可以轻松实现视频播放功能

但是，当视频的文件很大时，使用`video`的播放效果就不是很理想:
1. 播放不流畅(尤其在：**首次初始化视频，拖动时间轴播放** 场景时卡顿非常明显)
2. 浪费带宽，如果用户仅仅观看了一个视频的前几秒，可能已经被提前下载了几十兆流量了。**即浪费了用户的流量，也浪费了公司服务器的下行带宽**

理想状态下，我们希望的播放效果是：
1. 边播放，边下载，实现视频的分段下载和播放(**流媒体**)
2. 视频码率的无缝切换(**DASH**)
3. 隐藏真实的视频访问地址，防止盗链和下载(**Object URL**)

在这种情况下，普通的`video`标签就无法满足需求了

<!-- more -->

### 206 状态码
```html
<video width="600" controls>
  <source src="demo.mp4" type="video/mp4">
</video>
```
我们播放`demo.mp4`视频时，浏览器其实已经做过了部分优化，并不会等待视频全部下载完成后才开始播放，而是先请求部分数据(如果我们希望更加精确的分段下载，则需要使用`Media Source Extensions`)

![206](http://pic.deepred5.com/206.png)

我们在请求头添加
```bash
Range: bytes=3145728-4194303
```
表示需要文件的第`3145728`字节到第`4194303`字节区间的数据

后端响应头返回
```bash
Content-Length: 1048576
Content-Range: bytes 3145728-4194303/25641810
```
`Content-Range`表示返回了文件的第`3145728`字节到第`4194303`字节区间的数据，请求文件的总大小是`25641810`字节
`Content-Length`表示这次请求返回了`1048576`字节(4194303 - 3145728 + 1)

断点续传和本文接下来将要介绍的视频分段下载，就需要使用这个状态码

### Object URL
我们先来看看市面上各大视频网站是如何播放视频?

哔哩哔哩:
![bili-v](http://pic.deepred5.com/bili-v.png)

腾讯视频:
![ten-v](http://pic.deepred5.com/ten-v.png)

爱奇艺:
![iqi-v](http://pic.deepred5.com/iqi-v.png)

可以看到，上述网站的`video`标签指向的都是一个以`blob`开头的地址: `blob:https://www.bilibili.com/0159a831-92c9-43d1-8979-fe42b40b0735`，该地址有几个特点:
1. 格式固定: `blob:当前网站域名/一串字符`
2. 无法直接在浏览器地址栏访问
3. 即使是同一个视频，每次新打开页面，生成的地址都不同

其实，这个地址是通过[URL.createObjectURL](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL)生成的`Object URL`

```javascript
const obj = {name: 'deepred'};
const blob = new Blob([JSON.stringify(obj)], {type : 'application/json'});
const objectURL = URL.createObjectURL(blob);

console.log(objectURL); // blob:https://anata.me/06624c66-be01-4ec5-a351-84d716eca7c0
```

`createObjectURL`接受一个`File`，`Blob`或者`MediaSource`对象作为参数，返回的`ObjectURL`就是这个对象的引用

### Blob
> Blob是一个由不可改变的原始数据组成的类似文件的对象；它们可以作为文本或二进制数据来读取，或者转换成一个ReadableStream以便用来用来处理数据

我们常用的`File`对象就是继承并拓展了`Blob`对象的能力

<svg style="display: inline-block;" viewBox="-50 0 600 70" preserveAspectRatio="xMinYMin meet"><a xlink:href="https://developer.mozilla.org/en-US/docs/Web/API/Blob" target="_top"><rect x="1" y="1" width="75" height="50" fill="#fff" stroke="#D4DDE4" stroke-width="2px"></rect><text x="38.5" y="30" font-size="12px" font-family="Consolas,Monaco,Andale Mono,monospace" fill="#4D4E53" text-anchor="middle" alignment-baseline="middle">Blob</text></a><polyline points="76,25  86,20  86,30  76,25" stroke="#D4DDE4" fill="none"></polyline><line x1="86" y1="25" x2="116" y2="25" stroke="#D4DDE4"></line><a xlink:href="https://developer.mozilla.org/en-US/docs/Web/API/File" target="_top"><rect x="116" y="1" width="75" height="50" fill="#F4F7F8" stroke="#D4DDE4" stroke-width="2px"></rect><text x="153.5" y="30" font-size="12px" font-family="Consolas,Monaco,Andale Mono,monospace" fill="#4D4E53" text-anchor="middle" alignment-baseline="middle">File</text></a></svg>

```html
<input id="upload" type="file" />
```
```javascript
const upload = document.querySelector("#upload");
const file = upload.files[0];

file instanceof File; // true
file instanceof Blob; // true
File.prototype instanceof Blob; // true
```

我们也可以创建一个自定义的`blob`对象
```javascript
const obj = {hello: 'world'};
const blob = new Blob([JSON.stringify(obj, null, 2)], {type : 'application/json'});

blob.size; // 属性
blob.text().then(res => console.log(res)) // 方法
```

### Object URL的使用
```html
<input id="upload" type="file" />
<img id="preview" alt="预览" />
```
```javascript
const upload = document.getElementById('upload');
const preview = document.getElementById("preview");

upload.addEventListener('change', () => {
  const file = upload.files[0];
  const src = URL.createObjectURL(file);
  preview.src = src;
});
```
`createObjectURL`返回的`Object URL`直接通过`img`进行加载，即可实现前端的图片预览功能

![blob-pre](http://pic.deepred5.com/blob-pre.png)

图片地址是不是很熟悉？和我们看到的各大视频网站的视频加载地址，格式如出一辙

同理，如果我们用`video`加载`Object URL`，是不是就能播放视频了？

```html
<video controls width="800"></video>
```
```javascript
function fetchVideo(url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'blob'; // 文件类型设置成blob
    xhr.onload = function() {
      resolve(xhr.response);
    };
    xhr.onerror = function () {
      reject(xhr);
    };
    xhr.send();
  })
}

async function init() {
  const res = await fetchVideo('./demo.mp4');
  const url = URL.createObjectURL(res);
  document.querySelector('video').src = url;
}

init();
```
`video`标签的确能够正常播放视频，但我们使用了`ajax`异步请求了全部的视频数据，这和直接使用`video`加载原始视频相比，并无优势

### 流媒体



### 参考
* [为什么视频网站的视频链接地址是blob？](https://juejin.cn/post/6844903880774385671)
* [从天猫某活动视频不必要的3次请求说起](https://www.zhangxinxu.com/wordpress/2018/12/video-moov-box/)
* [我们为什么使用DASH](https://www.bilibili.com/read/cv855111/)
* [使用 MediaSource 搭建流式播放器](https://zhuanlan.zhihu.com/p/26374202)
* [Web 视频播放的那些事儿](https://zhuanlan.zhihu.com/p/126673473)
* [Building a simple MPEG-DASH streaming player](https://msdn.microsoft.com/zh-cn/library/windows/apps/dn551368.aspx)
* [前端视频直播技术总结及video.js在h5页面中的应用](https://www.cnblogs.com/dreamsqin/p/12557070.html)
* [流媒体协议的认识](https://www.xiaotaotao.vip/2019/11/28/%E6%B5%81%E5%AA%92%E4%BD%93%E5%8D%8F%E8%AE%AE%E7%9A%84%E8%AE%A4%E8%AF%86/)