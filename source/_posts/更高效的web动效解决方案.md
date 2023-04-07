---
title: 更高效的web动效解决方案
date: 2023-04-07 13:35:18
tags: [html, css, js]
toc: true
---
To C端的活动H5页面，常会有较高的动效要求。如何选择合适的动效实现方案，既可以满足设计师的审美要求，又可以减少开发时间，往往对前端工程师来说是一个巨大的挑战。

有的同学可能会问，web动画不就是用CSS3写吗? 

`transition` `transfrom` `animation` `keyframes` 这些属性和用法，我倒背如流。

如果动画再复杂点，那就继续用上JavaScript动画库，比如[tween.js](https://github.com/tweenjs/tween.js/)，[gsap](https://greensock.com/gsap/)。

<!-- more -->

的确，CSS3+JavaScript已经可以满足绝大部分的场景。但是，随着动效复杂度的上升，我们需要手写的代码量也在剧增。而且，对于动画的细节呈现，设计师往往比我们有着更高的要求：当我们耗时耗力手写完一个效果后，往往还要继续花费大量时间和设计师进行沟通，对动画的细节进行微调。

那有没有一种更高效（~~偷懒~~）的方案，让设计师直接制作完动效，我们可以拿来即用呢？

这就是本文将要讨论的几种高效的web动效方案

### Gif / Apng

直接使用导出的动图

Gif

优势：简单方便，兼容性好

缺点：

1.仅支持8bit的索引色，也就是说只有256个颜色，会出现颜色失真，白边锯齿的情况，并且体积较大

2.只能循环播放，无法精准控制动画

Apng

优点: 支持半透明，颜色还原度更高，且体积较小

缺点：只能循环播放，但是可以通过[apng-js](https://github.com/davidmz/apng-js)转成canvas绘制，来播放和暂停动画

### 视频

由于mp4格式的视频是带背景色的，因此全屏的背景动画比较适合此种方案。

设计师需要提供给我们一个全屏的**静音**视频，pc端建议1920X1080尺寸，移动端建议750X1750尺寸。

pc端对于视频自动播放限制不多，只需要默认静音即可

```html
<div class='video-container'>
  <video 
    autoplay 
    loop 
    muted 
    preload="auto"
    src='https://media-cdn-zspms.kurogame.com/pnswebsite/website2.0/video/1679328000000/c9s9mf24e3fotwqyqk-1679393034357.mp4'>
  </video>
</div>
```
```scss
.video-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;

  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
```
移动端对于背景视频自动播放限制严格，并且安卓手机上不同浏览器，对于video标签的处理不尽相同，很可能被原生控件拦截，因此采用canvas绘制视频：业界已经有了[jsmpeg](https://github.com/phoboslab/jsmpeg)的方案，支持ts格式（mpeg1编码）的视频播放。

首先我们将设计师给我们的mp4格式视频转码成mpeg1编码的ts格式

可以通过网站[convertio](https://convertio.co/zh/mp4-ts/)进行转码（注意编解码器一定要选择mpeg1）

当然，我们也可以通过[ffmpeg](https://ffmpeg.org/)自行转码

```bash
# 使用ffmpeg命令行转换mp4至ts (如果画质不行，可以自行调整画质 3000k 5000k)
ffmpeg -i soruce.mp4  -f mpegts -codec:v mpeg1video -an -b:v 3000k output.ts

# 使用ffmpeg命令行截图poster封面
ffmpeg -i soruce.mp4 -ss 00:00:00.000 -vframes 1 poster.png
```
得到了ts格式的视频后，前端通过jsmpeg即可进行播放

```html
<div class="video-container">
  <canvas class="canvas-view"></canvas>
</div>
<button id="btn1">暂停</button>
<button id="btn2">播放</button>
<button id="btn3">跳到2s</button>
```
```js
const player = new JSMpeg.Player('./zs.ts', {
  canvas: document.querySelector('.canvas-view'),
  autoplay: true,
  disableWebAssembly: true,
  onPlay(player){
    console.log('onPlay', player);
  },
});

const btn1 = document.getElementById('btn1');
const btn2 = document.getElementById('btn2');
const btn3 = document.getElementById('btn3');

btn1.addEventListener('click', () => {
  player.pause();
});

btn2.addEventListener('click', () => {
  player.play();
});

btn3.addEventListener('click', () => {
  player.currentTime = 2;
});
```
实际效果，可点击demo查看 [demo地址](http://deepred5.com/jsmpeg/)

**透明背景mp4**

各大直播软件中常见的全屏礼物特效，业界有[vap](https://github.com/Tencent/vap)和[YYEVA](https://github.com/yylive/YYEVA)方案，但这些方案对于web的支持度不太友好，只适合在端内进行尝试。

### 帧动画

设计师提供一系列的序列帧图片，前端通过连续循环切换这些图片，实现动画的播放

实现帧动画的方式有很多，可以详细参考[CSS3动画之逐帧动画](https://jelly.jd.com/article/6006b1035b6c6a01506c87a7)文章



### Lottie

http://airbnb.io/lottie


airbnb 开源的可应用于Android，iOS，Web，React Native和Windows动画库, 本质上是一套跨平台的动画解决方案。

通过AE的Bodymovin插件将设计师做的动画导出成一套定义好的json文件，之后再通过Lottie各端的库就可以实现动画效果，动画还原度 100%

Lottie的使用方法，之后会专门写一篇文章进行详细介绍，这里就不再累赘。

### SVGA

https://svga.io/intro.html

SVGA 是一种跨平台的开源动画格式，同时兼容 iOS / Android / Web。

一般用在直播间的礼物特效。

SVGA与Lottie最本质的区别在于代码对动画过程记录的方式，Lottie基本上是按照我们在AE当中的关键帧及缓动的结合形式去记录动画，而SVGA则是通过记录我们每一个图层每一个时间上的动画状态，从而省去对缓动值的计算。

因此可以把Lottie看成是补间动画，SVGA看成是帧动画。


### 骨骼动画

[Spine](http://zh.esotericsoftware.com/)和[DragonBones](https://dragonbones.github.io/cn/index.html)是比较常见的两款骨骼动画制作软件，在手游中被大量应用。

通过[pixi-spine](https://github.com/pixijs/spine)，我们可以很容易的将Spine集成进web项目里。


### Live2d

https://www.live2d.com/en/

和Spine类似，也可以制作动作细腻的人物动效，在手游中被大量应用。

由于官网的[web sdk](https://www.live2d.com/en/download/cubism-sdk/download-web/)比较难用，这里推荐使用第三方的[pixi-live2d-display](https://github.com/guansss/pixi-live2d-display)进行项目集成


### 游戏引擎

使用[Oasis](https://oasisengine.cn/)、[Cocos](https://www.cocos.com/)、 [Unity](https://unity.com/cn)等更专业的游戏引擎，为我们提供更真实物理的现实效果。






### 参考

* [夏日花火，谈谈移动端背景视频实现](https://juejin.cn/post/6865260341115224071)
* [前端动效讲解与实战](https://zhuanlan.zhihu.com/p/566787324)
* [【得物技术】web端动效方案对比](https://juejin.cn/post/6951699867475378213)