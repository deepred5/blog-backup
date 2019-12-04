---
title: PixiJS入门
date: 2019-12-04 16:05:08
tags: [js, canvas, pixi]
---
[PixiJS](https://github.com/pixijs/pixi.js)是一个轻量级的2D渲染引擎，它能自动侦测使用WebGL还是Canvas来创建图形。这个库经常被用来制作HTML5游戏以及有复杂交互的H5活动页。

## 搭建环境
**注意：本文使用pixi最新的v5版本，同时使用parcel进行模块化打包**

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
console.log('pixi');
```

修改`package.json`
```javascript
"scripts": {
  "dev": "parcel index.html -p 8080",
  "build": "parcel build index.html"
}
```
运行`npm run dev`，访问 http://localhost:8080/ 即可

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
我们还可以加载图片，然后渲染出来
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
avat
app.stage.addChild(avatar);
```

我们让这个图片精灵变得可以交互
```javascript
const avatar = new Sprite.from('http://anata.me/img/avatar.jpg');
avatar.scale.set(0.5, 0.5);

// 可交互
avatar.interactive = true;
// 监听事件
avatar.on('click', () => {
  console.log('deepred');
})
app.stage.addChild(avatar);
```
点击图片，即可输出内容