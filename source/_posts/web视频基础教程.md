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

但是，如果视频的文件太大时，使用`video`的播放效果就不是很理想:
1. 播放不流畅(尤其在：**首次初始化视频，拖动时间轴播放** 场景时卡顿非常明显)
2. 浪费带宽，如果用户仅仅观看了一个视频的前几秒，可能已经被提前下载了几十兆流量了。**即浪费了用户的流量，也浪费了公司服务器的下行带宽**

理想状态下，我们希望的播放效果是：
1. 边播放，边下载，实现视频的分段下载和播放
2. 视频码率的无缝切换
3. 隐藏真实的视频访问地址，防止盗链和下载

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
`Content-Range`表示返回了文件的第`3145728`字节到第`4194303`字节区间的数据，文件总大小是`25641810`字节
`Content-Length`表示这次请求返回了`1048576`字节(4194303 - 3145728 + 1)

断点续传和本文接下来将要介绍的视频分段下载，就需要使用这个状态码

### Blob
我们先来看看市面上各大视频网站是如何播放视频的

哔哩哔哩:
![bili-v](http://pic.deepred5.com/bili-v.png)

腾讯视频:
![ten-v](http://pic.deepred5.com/ten-v.png)

爱奇艺:
![iqi-v](http://pic.deepred5.com/iqi-v.png)

可以看到，上述各大网站的`video`标签指向的都是一个`blob`开头的地址: `blob:https://www.bilibili.com/0159a831-92c9-43d1-8979-fe42b40b0735`，该地址有几个特点:
1. 格式固定: `blob:当前网站域名/一串字符`
2. 浏览器无法直接在地址栏访问
3. 即使是同一个视频，每次新打开页面，生成的地址都是不同的

其实，这个地址是通过[URL.createObjectURL](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL)生成的


### 参考
* [为什么视频网站的视频链接地址是blob？](https://juejin.cn/post/6844903880774385671)
* [从天猫某活动视频不必要的3次请求说起](https://www.zhangxinxu.com/wordpress/2018/12/video-moov-box/)
* [我们为什么使用DASH](https://www.bilibili.com/read/cv855111/)
* [使用 MediaSource 搭建流式播放器](https://zhuanlan.zhihu.com/p/26374202)
* [Web 视频播放的那些事儿](https://zhuanlan.zhihu.com/p/126673473)
* [Building a simple MPEG-DASH streaming player](https://msdn.microsoft.com/zh-cn/library/windows/apps/dn551368.aspx)