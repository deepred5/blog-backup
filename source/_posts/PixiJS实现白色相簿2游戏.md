---
title: PixiJS实现白色相簿2游戏
date: 2019-12-14 10:35:06
tags: [js, canvas, pixi]
toc: true
---
> 我即使是死了，钉在棺材里了，也要在墓里，用这腐朽的声带喊出：████

## 体验游戏

**1. 扫码开始游戏，建议佩戴耳机。**

**2. 进入游戏首页，点一下你要选的女主即可进入不同分支。(默认冬马线)**

![](http://pic.deepred5.com/qrcode.jpg)

项目源码：[pixi-whitealbum](https://github.com/deepred5/pixi-whitealbum/)

<!-- more -->

## 前言
四年前在B站做过一个Mad: [【致不共戴天的你】](https://www.bilibili.com/video/av1977008)，当时还有幸上了B站圣诞节的活动页。

![](http://pic.deepred5.com/board.png)

时过境迁，B站账号已永久封禁，而Mad也终究成为了时代的眼泪。

<img src="http://pic.deepred5.com/mad2.png" style="marign-right: 20px;"/> <img src="http://pic.deepred5.com/mad3.png" style="max-width: 600px;"/>

> 为什么会变成这样呢。。。第一次上了首页，听说粉丝就能突破~~100~~了，又有了一起看Mad的小伙伴。两件快乐事情重合在一起。而这两份快乐，又给我带来更多的快乐。得到的，本该是像梦境一般幸福的时间。。。但是，为什么，<ruby>会变成这样呢。。。<rp>(</rp><rt>被打死</rt><rp>)</rp></ruby>

两年前，写了一篇文章: [【优秀的死宅是不玩白色相簿2的】](https://zhuanlan.zhihu.com/p/32103273)：优秀的死宅，在撸管时，手当然会累，也会想去玩一下白色相簿2。

![](https://img.moegirl.org/common/e/eb/%E8%87%AA%E5%AD%A6_%E8%87%AA%E8%A7%89_%E7%99%BD%E5%AD%A6.png)

> 为什么你会这么熟练啊？你究竟打死多少白学家了啊？

2019，年关将至，看着自己秃了的头顶，再看看朋友都有了女儿。总觉得还是少了点什么。嗯，还是少了个大(纸)老(片)婆(人)！

> 他便涨红了脸，额上的青筋条条绽出，争辩道：“白学家的女友哪能叫女友，叫右姑娘。。。”


**前言写的越来越逐渐忘记标题。好吧，让我们开始正式进入教程。**

注意：*PixiJS的基础知识，在[前文](http://anata.me/2019/12/04/PixiJS%E5%9F%BA%E7%A1%80%E6%95%99%E7%A8%8B/)已经介绍过了，所以不再累赘。*

## 粒子背景
由于Pixi只是一个轻量级的渲染库，所以并没有提供给开发者一个内置的粒子特效库。因此，如果希望实现下面这个雪花背景，需要开发者自己编写代码。
![](http://pic.deepred5.com/wa3.gif)

作为一个代码粘贴复制搬运工，自己写当然是~~不可能的~~。在[codepen](https://codepen.io/cojdev/pen/JEdYGP)上已经有了大量的canvas雪花特效，我们可以直接拿来参考。

不过codepen的示例基本都是原生Canvas API，如果改写成Pixi实现，依旧不能无脑copy。

原生API实现雪花的关键是：
```javascript
function draw (obj) {
  // obj就是每一个雪花对象
  ctx.beginPath();
  ctx.strokeStyle = "transparent";
  ctx.fillStyle = "rgba(255,255,255,"+((0.5*Math.random())+0.5)+")";

  // 通过setInterval或者requestAnimationFrame方法不断改变obj.x obj.y来实现雪花飘落
  ctx.arc(obj.x,obj.y,obj.dia,0,2*Math.PI);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
}
```
而在Pixi中，我们可以在`tick`方法里不断改变图层的`x`和`y`偏移量即可
```javascript
let circle = new Graphics();
circle.beginFill(0xFFFFFF, obj.alpha);
// 0 0 位置写死即可
circle.drawCircle(0, 0, obj.dia);
circle.endFill();

// 通过tick方法不断改变circle的position来实现雪花飘落
circle.x = obj.x;
circle.y = obj.y;
parent.addChild(circle);

```
详情见[源码](https://github.com/deepred5/pixi-whitealbum/blob/master/src/components/snow/snowFall.js#L36)

Pixi还特别提供了一个`ParticleContainer`类，如果发现粒子效果性能很差时，可以把大量的粒子或精灵放在这个父类里，而不是普通的`Container`类。

## 场景过度
![](http://pic.deepred5.com/wa4.gif)

场景切换就是很普通的透明度改变，可以使用`TweenMax`动画库
```javascript
// 前一个场景淡出
TweenMax.to(preContainer, 0.5, { 
  alpha: 0,
  visible: false 
});
// 后一个场景淡入
TweenMax.to(currentContainer, 0.8, { alpha: 1 });
```
需要特别注意的是：** 透明度为0的图层一定要把`visible`设成`false`，否则该图层仍可以点击！ **

## 音频播放
使用了[pixi-sound](https://github.com/pixijs/pixi-sound)，一个非常强大的音频库。

```javascript
import { Loader } from 'pixi.js';
import sound from 'pixi-sound';

const loader = Loader.shared;

loader
  .add('bgm', 'https://pixijs.io/pixi-sound/examples/resources/boing.mp3')
  .load(() => {
    // 预加载完成后，自动播放
    sound.play('bgm', { loop: true });
  });
```
不过由于IOS和Chrome的[安全限制](https://goo.gl/7K7WLu)，使用JS自动播放音频是被禁止的，必须通过用户触发事件，才能调用音频播放。

`pixi-sound`考虑到了这个场景，所以在[源码](https://github.com/pixijs/pixi-sound/blob/51fa4470aae995685f97f2ef34194609e3efb451/src/webaudio/WebAudioContext.ts#L170)中可以看到，它会对用户的第一次点击事件进行监听，通过播放一个空音频，确保加载的音频可以被正常播放。

## 布局
页面缩放，基于`750px`标准
```javascript
const rootContainer = new Container();
app.stage.addChild(rootContainer);

// 相对于设计稿750px进行缩放（竖屏状态）
const screenScaleRito = window.innerWidth / 750;
rootContainer.scale.set(screenScaleRito);

// 由于宽度进行了缩放，所以实际的渲染高度
const finalHeight = window.innerHeight / screenScaleRito;
```
由于canvas布局不像css布局那样方便，所以居中布局，需要自己手动计算偏移量
```javascript
// 渲染宽度
const renderWidth = 750;
const screenScaleRito = window.innerWidth / renderWidth;
// 渲染高度
const renderHeight = window.innerHeight / screenScaleRito;

const sprite = new Sprite(spriteTextures['touma.png']);
sprite.x = (renderWidth - sprite.width) / 2;
sprite.y = (renderHeight - sprite.height) / 2;
```

## 其他事项

**图片精灵**
可以使用[Texture Packer](https://www.codeandweb.com/texturepacker)软件，把多张图片合并成一张图片，方便管理。
<img src="http://pic.deepred5.com/wa_sprite0.png" style="width: 45%;margin-right: 30px;">
**图片分层**

别问抠图为啥用AE。。。

仿制图章去水印花了一个多小时，真怀念大学拿个破i3笔记本做mad的日子，真的是有大把时间。

现在工作回家只想躺尸。。。

<img src="http://pic.deepred5.com/mad4.jpg" style="width: 45%;margin-right: 30px;"><img src="http://pic.deepred5.com/wa5.png" style="width: 45%;">

**Parcel的一些坑**

因为用的是[Parcel](https://parceljs.org/)打包工具，所以基本0配置开发。不过`Parcel`的`.cache`缓存经常出bug。如果你的代码出现了莫名的问题，可以试试删除该文件夹。

特意加了一个`clean`命令
```javascript
"scripts": {
  "dev": "npm run clean && parcel public/index.html",
  "build": "npm run clean && parcel build public/index.html",
  "clean": "rimraf ./dist ./.cache",
  "prebuild": "echo ❄️❄️❄️又到了白色相簿的季节❄️❄️❄️",
  "postbuild": "echo ❄️❄️❄️你为什么那么熟练啊❄️❄️❄️",
}
```
还有就是`Parcel`开发时，经常报`WebSocket is not open: readyState 2 (CLOSING)`错误。

通常出现这种错误的情况是：你有大段的代码发生了改变。

瑕不掩疵，总的来说，`Parcel`还是不错的一款打包工具，虽然基本只会用在个人项目上，公司项目还是老老实实用`webpack`吧。

## 参考
* [H5场景小动画实现之PixiJs实战](https://zhuanlan.zhihu.com/p/31293136)
* [pixi.js 移动端H5坑点](https://zhuanlan.zhihu.com/p/56029920)
* [Bilibili圣诞游戏剖析-用pixi.js实现鬼畜音游](https://zhuanlan.zhihu.com/p/32298391)