---
title: 更高效的web动效解决方案
date: 2023-04-07 13:35:18
tags: [html, css, js]
toc: true
---
To C 业务场景下的 Web 页面，经常会有炫酷复杂的动效需求。在一个有限的项目排期下，选择合适的动效解决方案：既可以符合设计师的动效要求，又可以用最少的时间完成任务，但往往对前端工程师来说是一个巨大的挑战。

有的同学可能会问：Web 动画不就是用 CSS 写吗？`transition` 、`transfrom`、 `animation` 、`keyframes`  这些 CSS 属性和用法，我烂熟于心。如果动画再复杂点，那就继续用上 `JavaScript` 动画库，比如 [Tween.js](https://github.com/tweenjs/tween.js/)、[Gsap](https://greensock.com/gsap/)、JQuery 的[animate](http://api.jquery.com/animate/)方法，等等。

<!-- more -->

的确，“CSS + JavaScript” 已经可以满足绝大部分的场景。但是，随着动效复杂度的上升，我们需要手写的代码量也在剧增。而且，对于动画的细节呈现，设计师往往比我们有着更高的要求：当我们耗时耗力手写完一个效果后，往往还要继续花费大量时间和设计师进行沟通，以便对动画的细节进行调整。

<img src="http://pic.deepred5.com/6ee80635-ae9f-4d2d-b41e-f00cbe02620b.gif" width="32%" alt="gif">

上图的扭蛋机动画，如果是前端工程师手撸代码（CSS + JavaScript）来实现的话，弊端很明显：开发周期长。动画的各处细节需要和设计师沟通，例如设置运动速度的`transition-timing-function` 、`animation-timing-function` 属性值，都需要设计师给出我们具体的[贝塞尔曲线](https://cubic-bezier.com/#.17,.67,.83,.67)，以保证动画播放的流畅。

那有没有一种更高效的方案，让设计师制作完动画效果，我们就可以拿来即用呢？

这就是本篇将要讨论的几种更高效的 web 动效方案。

### Gif / APNG / WebP

最简单的方案，当然就是让设计师直接导出一张动图。

**Gif**

说到动图，我们首先想到的肯定是 Gif：

![](http://pic.deepred5.com/9f2db9ef-311c-4964-9e45-ac45a08e8c27.gif)

上图就是一张 Gif 动图，可以看见，非常方便就能播放动画了。

```html
<!-- 直接img标签引入图片即可播放 -->
<img src="https://img.zcool.cn/community/01584659ccc891a801218e18e4097e.gif" />
```
优点：简单方便，兼容性好，支持透明。


缺点：
1. 仅支持 8bit 的索引色，也就是说只有 256 个颜色，会出现颜色失真，白边锯齿的情况，并且体积较大，不支持半透明。
2. 只能循环播放，无法精准控制动画。(可以通过 [libgif-js](https://github.com/buzzfeed/libgif-js) 第三方库进行播放和暂停。)


**Apng**

APNG 是一种可动画 PNG 格式，也称为“动态 PNG”。需要注意的是，APNG 格式的图片，后缀名依旧是`.png`。

![](http://pic.deepred5.com/chip.png)

上图就是一张 APNG 格式的动图。

```html
<!-- 直接img标签引入图片即可播放 -->
<img src="https://www.zhangxinxu.com/study/202109/chip.png" />
```
优点：支持半透明，颜色还原度更高，且体积较小。

缺点：
1. [兼容性](https://caniuse.com/?search=apng)相比 Gif 差点，浏览器如果不支持 APNG，则会以普通的 PNG 图片显示（静止在第一帧）。可以使用 [apng-canvas](https://github.com/davidmz/apng-canvas) 来兼容 APNG 的播放。
2. 只能循环播放，但是可以通过 [apng-js](https://github.com/davidmz/apng-js) 转成 Canvas 绘制，来播放和暂停动画。

**WebP**

WebP 是一种由谷歌开发的现代图像格式，旨在提供更高的压缩率和更好的图像质量，同时保持较小的文件大小。它还支持透明度和动画。

![](http://pic.deepred5.com/output.webp)

上图就是一张 WebP 格式的动图。

```html
<!-- 直接img标签引入图片即可播放 -->
<img src="https://mathiasbynens.be/demo/animated-webp" />
```
优点：完美支持无损图像，同等质量下体积更小。

缺点：
1. [兼容性](https://caniuse.com/?search=webp)相比 Gif 差点。
2. 只能循环播放，但是可以通过 [freezeframe.js](https://github.com/ctrl-freaks/freezeframe.js/) 转成 Canvas 绘制，来播放和暂停动画。

### 帧动画

设计师提供一系列的序列帧图片，前端通过连续循环切换这些图片，实现动画的播放。

![](http://pic.deepred5.com/599e334d-45eb-43bf-9f1b-e9211ce7568d.png)

实现帧动画的方式有很多，可以详细参考[《CSS3动画之逐帧动画》](https://jelly.jd.com/article/6006b1035b6c6a01506c87a7)文章。

优点：自由控制播放、暂停、帧速率、动画时长。

缺点：动画帧率较高时需要请求大量的图片资源，弱网状态下可能导致动画卡顿。

### Video 视频

**透明背景 MP4**
各大直播软件中的全屏礼物特效，业界有 [VAP](https://github.com/Tencent/vap) 和 [YYEVA](https://github.com/yylive/YYEVA) 方案：可以播放带透明背景的 MP4。但这些方案对于 web 的支持度不太友好，只适合在端内进行尝试。

**非透明背景 MP4**
由于普通的 MP4 格式的视频是带背景色的，因此全屏的背景动画比较适合此种方案。
设计师需要提供给我们一个全屏的静音视频，PC 端建议 **1920*1080** 尺寸，移动端建议 **750*1750** 尺寸。

**PC 端**
PC 端对于视频自动播放限制不多，只需要默认静音即可：

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
<p class="codepen" data-height="300" data-default-tab="html,result" data-slug-hash="vYVyemr" data-user="deepred" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/deepred/pen/vYVyemr">
  Untitled</a> by deepred (<a href="https://codepen.io/deepred">@deepred</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

**移动端**
移动端对于视频自动播放限制严格：
- iOS 10+ 才开始支持视频自动播放，但是需要视频静音并且有`playsinline`属性。
- Android 手机上不同的浏览器，对于 `video` 标签的处理不尽相同，很可能被原生控件拦截。
因此建议采用 Canvas 绘制视频：业界已经有了 [jsmpeg](https://github.com/phoboslab/jsmpeg) 的成熟方案，支持 TS 格式，`MPEG1` 编码的视频播放。

**jsmpeg 播放视频**
首先我们将设计师给我们的 MP4 格式视频转码成 MPEG1 编码的 TS 格式。
可以通过网站 [Convertio](https://convertio.co/zh/mp4-ts/) 进行转码（注意编解码器一定要选择 `MPEG1` ）：

![](http://pic.deepred5.com/63c4b706-a25a-4258-b14c-41bb15b38b3c.png)

当然，我们也可以通过 [FFmpeg](https://ffmpeg.org/) 自行转码：

```bash
# 使用ffmpeg命令行转换mp4至ts (如果画质不行，可以自行调整画质 3000k 5000k)
ffmpeg -i soruce.mp4  -f mpegts -codec:v mpeg1video -an -b:v 3000k output.ts

# 使用ffmpeg命令行截图poster封面
ffmpeg -i soruce.mp4 -ss 00:00:00.000 -vframes 1 poster.png
```

得到了 TS 格式的视频后，前端通过 jsmpeg 即可进行播放：

```html
<div class="video-container">
  <canvas class="canvas-view"></canvas>
</div>
<button id="btn1">暂停</button>
<button id="btn2">播放</button>
<button id="btn3">跳到2s</button>
```

```scss
.canvas-view {
  width: 50%;
}
```

```javascript
const player = new JSMpeg.Player('./output.ts', {
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
实际效果，可点击 [demo](http://deepred5.com/jsmpeg/) 查看 [demo地址](http://deepred5.com/jsmpeg/) 。

优点：几乎任何的动画效果都能实现。

缺点：
* 不带透明通道，需要全屏尺寸。
* 交互能力较弱，弱网状态下视频播放可能卡顿。

### 骨骼动画

[《代号·世界》](https://yysworld.163.com/)官网中运用了大量的骨骼动画。

![](http://pic.deepred5.com/1d69d442-1af7-4560-ac79-8f7c0c481c2f.gif)

上图中人物衣服和头发的飘动，就是典型的骨骼动画。

[Spine](http://zh.esotericsoftware.com/) 和 [DragonBones](https://dragonbones.github.io/cn/index.html) 是两款比较常见的骨骼动画制作软件，在手游中被大量应用，同时它也支持在 web 端播放。

DragonBones 由于不再维护（[白鹭科技](https://www.egret.com/) 已倒闭），所以不建议新项目使用。
Spine动画，则通过 [pixi-spine](https://github.com/pixijs/spine) ，就可以很容易地集成进 web 项目里。

### Live2d

[Live2D](https://www.live2d.com/en/) 是一种应用于电子游戏的绘图渲染技术，由日本 Cybernoids 公司开发。和 Spine 类似，也可以制作动作细腻的人物动效。手游中的角色立绘就经常使用 Live2d 制作。同时，虚拟主播的二次元模型也常常使用该技术。

![](http://pic.deepred5.com/01653d91-ef85-4375-b467-d438e14cdf3c.gif)

上图中，人物随着鼠标的移动，身体各处都在运动，就是使用的 Live2d 技术。

由于官网的[web sdk](https://www.live2d.com/en/download/cubism-sdk/download-web/)比较难用，这里推荐使用第三方的[pixi-live2d-display](https://github.com/guansss/pixi-live2d-display)进行项目集成

### SVGA

官网：https://svga.io/intro.html

SVGA 是 YY 直播团队开源的一种跨平台的动画格式，同时兼容 iOS / Android / Web。动画设计师专注动画设计，通过工具输出 svga 动画文件，提供给开发工程师在集成 svga player 之后直接使用。

一般用在直播间的礼物特效。

<img src="http://pic.deepred5.com/724fcdb8-38ea-44c4-9371-04dc5f825250.gif" width="32%" alt="svga">

通过官方的 [Web-Player](https://github.com/svga/SVGAPlayer-Web) 即可在 web 端播放。

### Lottie

官网：http://airbnb.io/lottie

Airbnb 开源的可应用于 Android、iOS、Web、React Native 和 Windows 动画库，本质上是一套跨平台的动画解决方案。
通过 AE 的 Bodymovin 插件将设计师做的动画导出成一套定义好的 JSON 文件，之后再通过 Lottie 各端的库就可以实现动画效果，动画还原度 100%。


开头介绍的扭蛋机动画，正是使用 Lottie 实现的。

<img src="http://pic.deepred5.com/6ee80635-ae9f-4d2d-b41e-f00cbe02620b.gif" width="32%" alt="gif">

SVGA与Lottie最本质的区别在于代码对动画过程记录的方式，Lottie基本上是按照我们在AE当中的关键帧及缓动的结合形式去记录动画，而SVGA则是通过记录我们每一个图层每一个时间上的动画状态，从而省去对缓动值的计算。

因此可以把Lottie看成是补间动画，SVGA看成是帧动画。

### 游戏引擎

最后， 我们也可以使用[Oasis](https://oasisengine.cn/)、[Cocos](https://www.cocos.com/)、 [Unity](https://unity.com/cn)等更专业的游戏引擎，为项目提供更真实的物理效果。


### 总结

本文主要介绍了几种高效的动效解决方案，旨在解放前端工程师在动效还原上的开发时间和效率，让更专业的人做更专业的事：

1. 动效设计师负责动效的实现和输出
2. 前端工程师负责动效的播放和交互

**本系列教程专门介绍 Lottie 的使用方法和高级技巧，后续的篇章将会带领大家进入 Lottie 的学习之旅。**

### 参考

* [夏日花火，谈谈移动端背景视频实现](https://juejin.cn/post/6865260341115224071)
* [前端动效讲解与实战](https://zhuanlan.zhihu.com/p/566787324)
* [【得物技术】web端动效方案对比](https://juejin.cn/post/6951699867475378213)