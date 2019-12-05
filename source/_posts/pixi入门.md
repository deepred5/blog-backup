---
title: PixiJS入门
date: 2019-12-04 16:05:08
tags: [js, canvas, pixi]
toc: true
---
[PixiJS](https://github.com/pixijs/pixi.js)是一个轻量级的2D渲染引擎，它能自动侦测使用WebGL还是Canvas来创建图形。这个库经常被用来制作HTML5游戏以及有复杂交互的H5活动页。

## 搭建环境
**注意：本文使用pixi最新的v5版本，同时使用[Parcel](https://parceljs.org/)进行模块化打包**

项目初始化
```
mkdir learn-pixi
cd learn-pixi
npm init -y
```

<!-- more -->

安装依赖
```
npm i pixi.js -save
npm i parcel-bundler -save-dev
```

根目录创建`index.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>learn-pixi</title>
</head>
<body>
  <script src="./src/index.js"></script>
</body>
</html>
```
根目录创建`src`目录，新建`src/index.js`
```javascript
alert('pixi');
```

修改`package.json`
```javascript
"scripts": {
  "dev": "parcel index.html -p 8080",
  "build": "parcel build index.html"
}
```
运行`npm run dev`，访问 http://localhost:8080/ 即可看到效果

## 快速开始
`index.js`
```javascript
import { Application } from 'pixi.js';

const app = new Application({
  width: 300,
  height: 300,
  antialias: true,
  transparent: false,
  resolution: 1,
  backgroundColor: 0x1d9ce0
});

// app.view就是个canvas元素，挂载到页面上
document.body.appendChild(app.view);

```

页面上就出现了一个300*300的蓝色矩形，矩形是由pixi.js创建的canvas渲染的。
![](http://pic.deepred5.com/pixi1.png)

我们可以继续创建新的图形，然后渲染到canvas里
```javascript
import { Application, Graphics } from 'pixi.js';

const app = new Application({
  width: 300,
  height: 300,
  antialias: true,
  transparent: false,
  resolution: 1,
  backgroundColor: 0x1d9ce0
});

document.body.appendChild(app.view);

// 创建一个半径为32px的圆
const circle = new Graphics();
circle.beginFill(0xfb6a8f);
circle.drawCircle(0, 0, 32);
circle.endFill();
circle.x = 130;
circle.y = 130;

// 添加到app.stage里，从而可以渲染出来
app.stage.addChild(circle);
```
我们还可以渲染图片
```javascript
import { Application, Sprite } from 'pixi.js';

const app = new Application({
  width: 300,
  height: 300,
  antialias: true,
  transparent: false,
  resolution: 1,
  backgroundColor: 0x1d9ce0
});

document.body.appendChild(app.view);

// 创建一个图片精灵
const avatar = new Sprite.from('http://anata.me/img/avatar.jpg');

// 图片宽高缩放0.5
avatar.scale.set(0.5, 0.5);

app.stage.addChild(avatar);
```
![](http://pic.deepred5.com/pixi2.png?imageView2/2/w/200)

我们让这个图片精灵变得可以交互：点击图片后，图片透明度变成0.5
```javascript
const avatar = new Sprite.from('http://anata.me/img/avatar.jpg');
avatar.scale.set(0.5, 0.5);
// 居中展示
avatar.x = 100;
avatar.y = 100;

// 可交互
avatar.interactive = true;
// 监听事件
avatar.on('click', () => {
   // 透明度
   avatar.alpha= 0.5;
})
app.stage.addChild(avatar);
```
我们还能让图片一直旋转
```javascript
const avatar = new Sprite.from('http://anata.me/img/avatar.jpg');
avatar.scale.set(0.5, 0.5);
avatar.x = 150;
avatar.y = 150;

// 修改旋转中心为图片中心
avatar.anchor.set(0.5, 0.5)

app.stage.addChild(avatar);

app.ticker.add(() => {
  // 每秒调用该方法60次(60帧动画)
  avatar.rotation += 0.01;
})
```
![](http://pic.deepred5.com/pixi2.gif)
## 基本概念
`pixi`有几个重要的Class:
* Container (舞台，场景)
* Renderer (渲染器)
* Ticker (计时器)
* Loader （资源加载器)
* Sprite (精灵)

```javascript
const app = new Application({
  width: 300,
  height: 300
});
```
`Application`是pixi提供的一个工具方法，它能自动创建renderer，ticker 和container，我们通常使用该方法快速创建应用。

## Container
`app.stage`是一个`Container`的实例，作为最底层的舞台(stage)，所有要渲染的图形都应放在它的内部
```javascript
const app = new Application({
  width: 300,
  height: 300
});
// 添加不同的图形
app.stage.addChild(circle1);
app.stage.addChild(circle2);
```

我们也可以创建自己的`Container`，自定义的Container通常用来分组
```javascript
import { Application, Container, Graphics } from 'pixi.js';

const app = new Application({
  width: 300,
  height: 300,
  antialias: true,
  transparent: false,
  resolution: 1,
  backgroundColor: 0x1d9ce0
});

// 自定义Container
const myContainer = new Container();
// 相对于根节点偏移
myContainer.position.set(40, 40);

let rectangle = new Graphics();
rectangle.beginFill(0x000000);
rectangle.drawRect(0, 0, 64, 64);
rectangle.endFill();

let rectangle2 = new Graphics();
rectangle2.beginFill(0xFFFFFF);
rectangle2.drawRect(0, 0, 64, 64);
rectangle2.endFill();
// 相对于自定义Container偏移
rectangle2.position.set(20, 20);

// 两个图形加到自定义Container里
myContainer.addChild(rectangle);
myContainer.addChild(rectangle2);

// 自定义Container最后需要添加到app.stage
app.stage.addChild(myContainer);

document.body.appendChild(app.view);

```
![](http://pic.deepred5.com/pixi3.png)

分组的好处在于，修改container的属性，位于其中的子节点，都会受到影响。比如上面的例子，我们把`rectangle`和`rectangle2`分到了同一个组里，如果希望同时隐藏这两个元素，只需修改它们的父级container即可。

```javascript
// 父级透明，则子级也透明
myContainer.alpha = 0;
```

一直常见的做法是，我们创建一个最顶层的`rootContainer`，之后所有的内容，都添加到`rootContainer`里。而`rootContainer`作为顶级元素，可以进行一些缩放来达到适配不同分辨率的效果：
```javascript
const rootContainer = new Container();
app.stage.addChild(rootContainer);

// 相对于设计稿750px进行缩放
const screenScaleRito = window.clientWidth / 750;
rootContainer.scale.set(screenScaleRito, screenScaleRito);
```
这种方法类似我们前端的rem布局

## Renderer
`app.renderer`是一个`Renderer`的实例，如果你希望重新渲染页面，就需要使用它
```javascript
// 把画布重新渲染为500*500大小
app.renderer.resize(500, 500);
```