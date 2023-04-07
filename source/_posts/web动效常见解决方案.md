---
title: web动效常见解决方案
date: 2023-04-07 13:35:18
tags: [html, css, js]
toc: true
---
To C端的活动H5页面，常会有较高的动效要求。如何选择合适的动效实现方案，既可以满足设计师的审美要求，又可以减少开发时间，往往对前端工程师来说是一个巨大的挑战。

我总结了下工作中常用的一些解决方案，希望可以给大家一些帮助和思考。

<!-- more -->

### Gif / Apng

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
移动端对于背景视频自动播放限制严格，并且安卓手机上不同浏览器，对于video标签的处理不尽相同，很可能被原生控件拦截，因此采用canvas绘制视频的方案

[jsmpeg](https://github.com/phoboslab/jsmpeg)

