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
1. 播放不流畅(尤其在：**首次初始化视频** 场景时卡顿非常明显)
2. 浪费带宽，如果用户仅仅观看了一个视频的前几秒，可能已经被提前下载了几十兆流量了。**即浪费了用户的流量，也浪费了服务器的昂贵带宽**

理想状态下，我们希望的播放效果是：
1. 边播放，边下载(**渐进式下载**)，无需一次性下载视频(**流媒体**)
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
我们播放`demo.mp4`视频时，浏览器其实已经做过了部分优化，并不会等待视频全部下载完成后才开始播放，而是先请求部分数据

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

### Object URL的应用
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

同理，如果我们用`video`加载`Object URL`，是不是就能播放视频了？

`index.html`
```html
<video controls width="800"></video>
```
`demo.js`
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

文件目录如下:
```bash
├── demo.mp4
├── index.html
├── demo.js
```
使用`http-server`简单启动一个静态服务器
```bash
npm i http-server -g

http-server -p 4444 -c-1
```

访问`http://127.0.0.1:4444/`,`video`标签的确能够正常播放视频，但我们使用`ajax`异步请求了全部的视频数据，这和直接使用`video`加载原始视频相比，并无优势

### Media Source Extensions
结合前面介绍的`206`状态码，我们能不能通过`ajax`请求部分的视频片段(segments)，先缓冲到`video`标签里，然后当视频即将播放结束前，继续下载部分视频，实现分段播放呢？

答案当然是肯定的，但是我们不能直接使用`video`加载原始分片数据，而是要通过 [MediaSource](https://developer.mozilla.org/en-US/docs/Web/API/MediaSource) API

需要注意的是，普通的mp4格式文件，是无法通过`MediaSource`进行加载的，需要我们使用一些转码工具，将普通的mp4转换成fmp4([Fragmented MP4](https://stackoverflow.com/questions/35177797/what-exactly-is-fragmented-mp4fmp4-how-is-it-different-from-normal-mp4/35180327#35180327))。为了简单演示，我们这里不使用实时转码，而是直接通过[MP4Box](https://www.videohelp.com/software/MP4Box)工具，直接将一个完整的mp4转换成fmp4

```bash
#### 每4s分割1段
mp4box -dash 4000 demo.mp4
```
运行命令，会生成一个`demo_dashinit.mp4`视频文件和一个`demo_dash.mpd`配置文件。其中`demo_dashinit.mp4`就是被转码后的文件，这次我们可以使用`MediaSource`进行加载了

文件目录如下:
```bash
├── demo.mp4
├── demo_dashinit.mp4
├── demo_dash.mpd
├── index.html
├── demo.js
```
`index.html`
```html
<video width="600" controls></video>
```
`demo.js`
```javascript
class Demo {
  constructor() {
    this.video = document.querySelector('video');
    this.baseUrl = '/demo_dashinit.mp4';
    this.mimeCodec = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';

    this.mediaSource = null;
    this.sourceBuffer = null;

    this.init();
  }

  init = () => {
    if ('MediaSource' in window && MediaSource.isTypeSupported(this.mimeCodec)) {
      const mediaSource = new MediaSource();
      this.video.src = URL.createObjectURL(mediaSource); // 返回object url
      this.mediaSource = mediaSource;
      mediaSource.addEventListener('sourceopen', this.sourceOpen); // 监听sourceopen事件
    } else {
      console.error('不支持MediaSource');
    }
  }

  sourceOpen = async () => {
    const sourceBuffer = this.mediaSource.addSourceBuffer(this.mimeCodec); // 返回sourceBuffer
    this.sourceBuffer = sourceBuffer;
    const start = 0;
    const end = 1024 * 1024 * 5 - 1; // 加载视频开头的5M数据。如果你的视频文件很大，5M也许无法启动视频，可以适当改大点
    const range = `${start}-${end}`;
    const initData = await this.fetchVideo(range);
    this.sourceBuffer.appendBuffer(initData);

    this.sourceBuffer.addEventListener('updateend', this.updateFunct, false);
  }

  updateFunct = () => {
    
  }

  fetchVideo = (range) => {
    const url = this.baseUrl;
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url);
      xhr.setRequestHeader("Range", "bytes=" + range); // 添加Range头
      xhr.responseType = 'arraybuffer';

      xhr.onload = function (e) {
        if (xhr.status >= 200 && xhr.status < 300) {
          return resolve(xhr.response);
        }
        return reject(xhr);
      };

      xhr.onerror = function () {
        reject(xhr);
      };
      xhr.send();
    })
  }
}

const demo = new Demo()
```

![mse](http://pic.deepred5.com/mse.jpg)

实现原理：
1. 通过请求头`Range`拉取数据
2. 将数据喂给`sourceBuffer`，`MediaSource`对数据进行解码处理
3. 通过`video`进行播放

我们这次只请求了视频的前5M数据，可以看到，视频能够成功播放几秒，然后画面就卡住了。

![video-load](http://pic.deepred5.com/video-load.gif)

接下来我们要做的就是，监听视频的播放时间，如果缓冲数据即将不够时，就继续下载下一个5M数据

```javascript
const isTimeEnough = () => {
  // 当前缓冲数据是否足够播放
  for (let i = 0; i < this.video.buffered.length; i++) {
    const bufferend = this.video.buffered.end(i);
    if (this.video.currentTime < bufferend && bufferend - this.video.currentTime >= 3) // 提前3s下载视频
      return true
  }
  return false
}
```

当然我们还有很多问题需要考虑，例如:
1. 每次请求分段数据时，如何更新`Range`的请求范围
2. 初次请求数据时，如何确保`video`有足够的数据能够播放视频
3. 兼容性问题
4. 更多细节。。。。

详细分段下载过程，见[完整代码](https://github.com/deepred5/media-source-demo/blob/master/demo.js)

### 流媒体协议
视频服务一般分为：
1. 点播
2. 直播

不同的服务，选择的流媒体协议也各不相同。主流的协议有: RTMP、HTTP-FLV、HLS、DASH、webRTC等等，详见[《流媒体协议的认识》](https://www.xiaotaotao.vip/2019/11/28/%E6%B5%81%E5%AA%92%E4%BD%93%E5%8D%8F%E8%AE%AE%E7%9A%84%E8%AE%A4%E8%AF%86/)

我们之前的示例，其实就是使用的DASH协议进行的点播服务。还记得当初使用`mp4box`生成的`demo_dash.mpd`文件吗？`mpd`(Media Presentation Description)文件就存储了fmp4文件的各种信息，包括视频大小，分辨率，分段视频的码率。。。

哔哩哔哩网站就是采用的DASH协议

HLS协议的`m3u8`索引文件就类似DASH的`mpd`描述文件

| 协议 | 索引文件 | 传输格式 |
| ---- | -------- | -------- |
| DASH | mpd      | m4s  |
| HLS  | m3u8     | ts       |


### 参考
* [为什么视频网站的视频链接地址是blob？](https://juejin.cn/post/6844903880774385671)
* [从天猫某活动视频不必要的3次请求说起](https://www.zhangxinxu.com/wordpress/2018/12/video-moov-box/)
* [我们为什么使用DASH](https://www.bilibili.com/read/cv855111/)
* [使用 MediaSource 搭建流式播放器](https://zhuanlan.zhihu.com/p/26374202)
* [Web 视频播放的那些事儿](https://zhuanlan.zhihu.com/p/126673473)
* [Building a simple MPEG-DASH streaming player](https://msdn.microsoft.com/zh-cn/library/windows/apps/dn551368.aspx)
* [前端视频直播技术总结及video.js在h5页面中的应用](https://www.cnblogs.com/dreamsqin/p/12557070.html)
* [流媒体协议的认识](https://www.xiaotaotao.vip/2019/11/28/%E6%B5%81%E5%AA%92%E4%BD%93%E5%8D%8F%E8%AE%AE%E7%9A%84%E8%AE%A4%E8%AF%86/)
* [让html5视频支持分段渐进式下载的播放](https://blog.csdn.net/charleslei/article/details/50964176)