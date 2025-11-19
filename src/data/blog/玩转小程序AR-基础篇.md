---
pubDatetime: 2025-11-10T19:31:31.000+08:00
title: 玩转小程序AR-基础篇
featured: true
draft: false
tags:
  - AR
  - 小程序
  - XR FRAME
description: 小程序 XR-FRAME 基础教程
---

## 目录

## 背景

某天需求方扔了个链接：[【原神官方】AR 立牌](https://detail.tmall.com/item.htm?fpChannel=101&fpChannelSig=5e762bf5403ecf3effc7b043733500dd040c9068&id=823870055035&sku_properties=134942334%3A33623926433&u_channel=bybtqdyh&umpChannel=bybtqdyh)，询问**小程序**是否能够实现类似的**AR**效果。

预感`AR`会有很多坑的我，刚想~~婉拒~~，无奈被老大以**技术调研**为由，把项目接手下来。于是被迫补起：早已过了风口(bushi)的`AR`知识。

## 调研

### 实体 AR 立牌

斥~巨资~在闲鱼淘了个多莉的角色立牌，实际体验了下完整的交互流程，AR氛围感还是不错的。

<video style="width:40%" controls src="https://webstatic.deep5.red/20251110-202934-ar.mp4"></video>

### AR在线制作平台

[KIVICUBE](https://www.kivicube.com) 提供了可视化的3D场景搭建和动画编排系统：零基础也可创造和发布酷炫的AR作品。

![3D场景搭建](@/assets/images/玩转小程序AR/screenshot-20251110-210810.png)
![动画编排系统](@/assets/images/玩转小程序AR/screenshot-20251110-213428.png)


官方同时提供了大量[创意模版](https://cloud.kivicube.com/templates)供大家一键使用

<video style="width:40%;margin: 0 auto;" controls src="https://webstatic.deep5.red/202511119-kivicube-ar.mp4"></video>

## 技术方案

在微信小程序的技术体系下，官方提供了两种解决方案：

* [VisionKit](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/visionkit/base.html)

> 小程序也在基础库 2.20.0 版本开始提供了开发 AR 功能的能力，即 VisionKit。VisionKit 包含了 AR 在内的视觉算法

* [XR-FRAME](https://developers.weixin.qq.com/miniprogram/dev/framework/xr-frame/)

> xr-frame是一套小程序官方提供的XR/3D应用解决方案，基于混合方案实现，性能逼近原生、效果好、易用、强扩展、渐进式、遵循小程序开发标准

简单来说：

- VisionKit 是底层视觉引擎，提供能力但需要自己拼装。
- XR-FRAME 是完整开发框架，整合了渲染、交互与视觉能力，适合快速实现产品化的 AR 效果。

虽然理论上我们完全可以基于 VisionKit 并结合 [Three.js](https://github.com/wechat-miniprogram/threejs-miniprogram) 或自研的 WebGL 渲染逻辑来实现 AR 效果，但这种方案开发成本较高：

开发者需要自行处理相机帧与渲染管线的衔接、追踪状态管理、姿态矩阵更新等底层逻辑，整体工程量大且维护复杂。（**Kivicube** 正是使用此方案，确保自研的 AR 可视化搭建平台的产物能兼容各大平台：微信小程序、原生网页H5）

而 XR-FRAME 在此基础上进一步封装了完整的 3D 渲染与交互体系，提供了大量开箱即用的能力，让开发者可以像写前端组件一样，以声明式方式快速构建 AR 场景，而不必深入到底层渲染细节。

因此最后决定：先用 **XR-FRAME** 快速交付第一版 MVP 小程序

## XR-FRAME 指南

由于是小程序开发，所以学习 **XR-FRAME** 的前提，需要有[小程序基础知识](https://developers.weixin.qq.com/miniprogram/dev/framework/MINA.html)

而官方的两个在线文档，内容还是略显单薄，强烈建议直接参考官方 **[《xr-frame系统的示例集》](https://github.com/dtysky/xr-frame-demo)** 的**源码**进行实战学习

* [指南 XR-FRAME](https://developers.weixin.qq.com/miniprogram/dev/framework/xr-frame/#%E6%96%B0%E5%BB%BA%E4%B8%80%E4%B8%AAXR%E7%BB%84%E4%BB%B6)
* [组件 XR-FRAME](https://developers.weixin.qq.com/miniprogram/dev/component/xr-frame/overview/#%E6%A6%82%E8%BF%B0)

本教程配套代码：[xr-frame-tutorial](https://github.com/deepred5/xr-frame-tutorial)

### XR 组件 模版代码

#### 创建 XR 组件

![创建 XR 组件](@/assets/images/玩转小程序AR/1.png)

```json file="components/demo1/index.json"
{
  "component": true,
  "usingComponents": {},
  "renderer": "xr-frame"
}
```

```xml file="components/demo1/index.wxml"
<xr-scene>
  <xr-camera clear-color="0.4 0.8 0.6 1" />
</xr-scene>
```

#### 使用 XR 组件

![使用 XR 组件](@/assets/images/玩转小程序AR/2.png)

```json file="pages/demo1/index.json"
{
  "usingComponents": {
    "demo1": "../../components/demo1"
  },
  "disableScroll": true, 
  "renderer": "webview"
}
```

```xml file="pages/demo1/index.wxml"
<view>
  <demo1
    disable-scroll
    id="main-frame"
    width="{{renderWidth}}"
    height="{{renderHeight}}"
    style="width:{{width}}px;height:{{height}}px;top:{{top}}px;left:{{left}}px;"
  />
</view>
```

```javascript file="pages/demo1/index.js"
Page({
  data: {
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    renderWidth: 0,
    renderHeight: 0,
  },
  onLoad(options) {
    const info = wx.getSystemInfoSync()
    const width = info.windowWidth
    const height = info.windowHeight
    const dpi = info.pixelRatio

    this.setData({
      width, 
      height,
      renderWidth: width * dpi,
      renderHeight: height * dpi
    });
  },
})
```

#### 渲染 XR 组件

![渲染 XR 组件](@/assets/images/玩转小程序AR/3.png)

渲染效果：绿色背景的画布 Canvas

![绿色背景的画布 Canvas](@/assets/images/玩转小程序AR/4.png)


### 3D 渲染

源码示例: [3D 渲染](https://github.com/deepred5/xr-frame-tutorial/tree/main/components/demo1/index.wxml)

最基础的 3D 渲染 思维导图

![3D渲染思维导图](@/assets/images/玩转小程序AR/whiteboard_exported_image.png)

#### 添加物体

添加一个 立方体 （Cube）物体

```xml file="components/demo1/index.wxml"
<xr-scene>
  <xr-mesh node-id="cube" geometry="cube" />
  <!-- 设置 target 指向 cube，让相机始终看向这个立方体--> 
  <xr-camera clear-color="0.4 0.8 0.6 1" position="1 3 4" target="cube" camera-orbit-control />
</xr-scene>
```

物体黑色是因为在我们没有给`xr-mesh`指定材质时，用的是基于PBR效果的默认材质，需要光照

临时解决方案：
创建一个不需要光照的材质，并且使用这个材质

```xml file="components/demo1/index.wxml"
<xr-scene>
  <xr-asset-material asset-id="simple" effect="simple" uniforms="u_baseColorFactor:0.8 0.4 0.4 1" />
  <xr-mesh node-id="cube" geometry="cube" material="simple" />
  <xr-camera clear-color="0.4 0.8 0.6 1" position="1 3 4" target="cube" camera-orbit-control />
</xr-scene>
```

![不需要光照的材质](@/assets/images/玩转小程序AR/5.png)

#### 添加光照

```xml file="components/demo1/index.wxml"
<xr-scene>
  <xr-mesh node-id="cube" geometry="cube" uniforms="u_baseColorFactor:0.8 0.4 0.4 1" />
  <!-- 一个环境光 -->
  <xr-light type="ambient" color="1 1 1" intensity="1" />
  <!-- 一个主平行光 -->
  <xr-light type="directional" rotation="40 70 0" color="1 1 1" intensity="3" cast-shadow /> 
  <xr-camera clear-color="0.4 0.8 0.6 1" position="1 3 4" target="cube" camera-orbit-control />
</xr-scene>
```

![光照的材质](@/assets/images/玩转小程序AR/6.png)


#### 添加纹理

纹理 Texture 是 GPU 中的图像，供着色器采样使用。在框架中其一般被作为材质的一部分uniforms使用

```xml file="components/demo1/index.wxml"
<xr-scene>
  <xr-assets bind:progress="handleAssetsProgress" bind:loaded="handleAssetsLoaded">
    <!-- 加载纹理 -->
    <xr-asset-load type="texture" asset-id="waifu" src="https://mmbizwxaminiprogram-1258344707.cos.ap-guangzhou.myqcloud.com/xr-frame/demo/waifu.png" />
    <!-- 材质中使用纹理 -->
    <xr-asset-material asset-id="mat" uniforms="u_baseColorMap: waifu" />
  </xr-assets>

  <!-- 使用材质 -->
  <xr-mesh node-id="cube" geometry="cube" material="mat" cast-shadow />
  
  <!-- 一个环境光 -->
  <xr-light type="ambient" color="1 1 1" intensity="1" />
  <!-- 一个主平行光 -->
  <xr-light type="directional" rotation="40 70 0" color="1 1 1" intensity="3" cast-shadow /> 
  <xr-camera clear-color="0.4 0.8 0.6 1" position="1 3 4" target="cube" camera-orbit-control />
</xr-scene>
```

![图片纹理](@/assets/images/玩转小程序AR/7.png)

我们继续新加一个 平面 (Plane) 物体

```xml file="components/demo1/index.wxml"
<xr-assets bind:progress="handleAssetsProgress" bind:loaded="handleAssetsLoaded">
    <xr-asset-load type="texture" asset-id="deepred" src="https://avatars.githubusercontent.com/u/13102815" />
    <xr-asset-material asset-id="mat2" uniforms="u_baseColorMap: deepred" />
</xr-assets>

<xr-mesh node-id="plane" geometry="plane" material="mat2" position="0 1 0" />
```

![平面物体](@/assets/images/玩转小程序AR/screenshot-20251111-001750.png)

#### 添加动画

```json file="project.private.config.json"
{
  "setting": {
    "ignoreDevUnusedFiles": false,
    "ignoreUploadUnusedFiles": false
  }
}
```

![动画](@/assets/images/玩转小程序AR/8.png)

添加一个无限旋转的动画
- keyframe 中定义了帧动画具体的行为，本质上类似于 CSS 中的 keyframes
- animation 中定义了帧动画的播放配置，本质上类似于 CSS 中的 animation

**注意：旋转的值是弧度！！！**

**360度等于2π弧度，约等于 2 * 3.14**

```json file="assets/animation.json"
{
  "keyframe": {
    "logo": {
      "0": {
        "rotation": [0, 0, 0]
      },
      "100": {
         // 注意是弧度，360度等于2π，约等于6.28
        "rotation": [6.28, 0, 0]
      }
    }
  },
  "animation": {
    "logo": {
      "keyframe": "logo",
      "duration": 4,
      "ease": "linear",
      "loop": -1
    }
  }
}
```

```xml file="components/demo1/index.wxml"
<!-- 加载动画资源 -->
<xr-asset-load asset-id="anim" type="keyframe" src="/assets/animation.json"/>

<xr-mesh node-id="plane" geometry="plane" material="mat2" position="0 1 0" anim-keyframe="anim" anim-autoplay="clip:logo" />
```

![动画](@/assets/images/玩转小程序AR/kapture.gif)

#### 添加 3D 模型

支持 GLTF 格式模型

```xml file="components/demo1/index.wxml"
<!-- 加载 GLTF 模型 -->
<xr-asset-load type="gltf" asset-id="miku" src="https://mmbizwxaminiprogram-1258344707.cos.ap-guangzhou.myqcloud.com/xr-frame/demo/miku.glb" />

<!-- 渲染 GLTF 组件 -->
<xr-gltf model="miku" position="-0.15 0.75 1" scale="0.07 0.07 0.07" rotation="0 180 0" anim-autoplay />
```

![GLTF 模型](@/assets/images/玩转小程序AR/kapture2.gif)

### AR 系统

AR 能力，需要调用摄像头权限

微信开发者工具无法模拟，请使用真机预览模式

![真机预览模式](@/assets/images/玩转小程序AR/9.png)

#### Plane 识别
<video style="width:40%" controls src="https://webstatic.deep5.red/202511119-plane-ar.mp4"></video>

源码示例: [Plane 模式](https://github.com/deepred5/xr-frame-tutorial/tree/main/components/demo3/index.wxml)

**Plane 模式**是 AR 中的平面检测与追踪功能

常见的交互流程：
1. 扫描阶段
  - 用户移动手机摄像头
  - AR 系统分析画面，识别水平或垂直的平面
  - 常见平面：地板、桌面、墙壁、床面等
2. 检测阶段
  - 找到平面后，显示视觉指示器（视频中的<font color="#3185FE">蓝色圆环</font>）
  - 指示器跟随检测到的平面移动
3. 放置阶段
  - 用户点击屏幕
  - 虚拟物体被"放置"到现实世界的平面上

```xml file="components/demo3/index.wxml"
<!-- AR system 系统开启 Plane 模式 -->
<xr-scene ar-system="modes:Plane" bind:ready="handleReady">
  <xr-assets bind:loaded="handleAssetsLoaded">
    <xr-asset-load type="gltf" asset-id="anchor" src="https://mmbizwxaminiprogram-1258344707.cos.ap-guangzhou.myqcloud.com/xr-frame/demo/ar-plane-marker.glb" />
    <xr-asset-load type="gltf" asset-id="miku" src="https://mmbizwxaminiprogram-1258344707.cos.ap-guangzhou.myqcloud.com/xr-frame/demo/miku.glb" />
    <xr-asset-load type="texture" asset-id="deepred" src="https://avatars.githubusercontent.com/u/13102815" />
    <xr-asset-material asset-id="mat" uniforms="u_baseColorMap: deepred" />
  </xr-assets>
  <xr-light type="ambient" color="1 1 1" intensity="1" />
  <xr-light type="directional" rotation="40 70 0" color="1 1 1" intensity="3" cast-shadow />
  <!-- AR 追踪器 对应也要开启 Plane 模式 -->
  <xr-ar-tracker mode="Plane">
    <!-- 找到平面后，显示视觉指示器 -->
    <xr-gltf model="anchor"></xr-gltf>
  </xr-ar-tracker>
  <!-- 首先隐藏虚拟物体 -->
  <xr-node node-id="setitem" visible="false">
    <xr-gltf model="miku" anim-autoplay scale="0.07 0.07 0.07" rotation="0 180 0" />
    <xr-mesh node-id="plane" geometry="plane" material="mat" scale="0.3 0.3 0.3" />
  </xr-node>
   <!-- camera 的 background 设置成 ar -->
  <xr-camera clear-color="0.4 0.8 0.6 1" background="ar" is-ar-camera />
</xr-scene>
```

```javascript file="pages/demo3/index.js"
Component({
  methods: {
    handleAssetsLoaded: function ({ detail }) {
      wx.showToast({ title: '点击屏幕放置模型' });
      this.scene.event.add('touchstart', () => {
        // 虚拟物体被"放置"到现实世界的平面
        this.scene.ar.placeHere('setitem', true);
      });
    },
    handleReady: function ({ detail }) {
      this.scene = detail.value;
    },
  }
})
```

#### Marker 识别

<video style="width:40%;" controls src="https://webstatic.deep5.red/202511119-marker-ar.mp4"></video>

源码示例: [Marker 模式](https://github.com/deepred5/xr-frame-tutorial/tree/main/components/demo4/index.wxml)

**Marker 模式**，能够识别预先设定的目标物体(定义为 Marker，包括2D平面物体和3D物体），进行视觉跟踪与定位，通过在目标物体周围渲染虚拟物体，从而实现AR功能。

模型与现实物体保持空间位置关系(即：3D 层级 效果)。

Marker 分类
1. 2D Marker，仅适用于平面类物体，用户上传一张平面物体的俯视图像作为目标物体，算法运行时识别该平面物品，并渲染出相关虚拟物体。2D Marker可以理解为特殊的 3D Marker。
2. 3D Marker，相比于2D Marker，能够识别3D物体，不局限于平面物体，具有更广的使用范围，算法运行前，需要手动制作3D Marker的识别目标文件（.map文件），然后算法运行时载入该文件用于识别

```xml file="components/demo4/index.wxml"
<xr-scene ar-system="modes:Marker" bind:ready="handleReady">
  <xr-assets bind:loaded="handleAssetsLoaded">
    <xr-asset-load type="video-texture" asset-id="hikari" options="loop:true" src="https://assets.papegames.com/resources/cdn/20250925/1c85f5b5ecde29ea.mp4" />
    <xr-asset-load type="texture" asset-id="deepred2" src="https://assets.papegames.com/resources/cdn/20250925/c737cf37d083d543.png" />
    <xr-asset-material asset-id="mat" effect="simple" uniforms="u_baseColorMap: video-hikari" />
    <xr-asset-material asset-id="mat3" effect="simple" uniforms="u_baseColorMap: deepred2" />
  </xr-assets>
  <xr-node wx:if="{{loaded}}">
    <xr-ar-tracker mode="Marker" bind:ar-tracker-switch="handleTrackerSwitch" src="https://assets.papegames.com/resources/cdn/20250925/fe8dad0e9800ef81.jpg">
      <xr-mesh node-id="mesh-plane" geometry="plane" material="mat" scale="1.7778 1 1" position="0 0.1 0" />
      <xr-mesh node-id="plane" geometry="plane" material="mat3" position="0.1 0.8 0.1" scale="0.12 0.12 0.12" />
    </xr-ar-tracker>
  </xr-node>
  <xr-camera clear-color="0.4 0.8 0.6 1" background="ar" is-ar-camera />
</xr-scene>
```

```javascript file="components/demo4/index.js"
Component({
  methods: {
    handleReady: function ({ detail }) {
      this.scene = detail.value;
    },
    handleAssetsLoaded: function ({ detail }) {
      this.setData({ loaded: true });
    },
    handleTrackerSwitch: function ({ detail }) {
      // 获取追踪状态
      const active = detail.value;
      const video = this.scene.assets.getAsset('video-texture', 'hikari');
      // 识别到物体，播放视频
      // 识别中，暂停视频
      active ? video.play() : video.stop();
    }
  }
})
```

#### OSD 识别

<video style="width:40%;" controls src="https://webstatic.deep5.red/202511119-osd-ar.mp4"></video>

源码示例: [OSD 模式](https://github.com/deepred5/xr-frame-tutorial/tree/main/components/demo5/index.wxml)


**OSD（One-shot Detection）Marker 识别模式**，可以看成是一种特殊的 `Marker` 模式
：在摄像头画面上“贴图叠加”的模式，主要以 屏幕坐标系（2D） 为主，不真正感知**空间深度**

```xml file="components/demo5/index.wxml"
<xr-scene ar-system="modes:OSD" bind:ready="handleReady">
  <xr-assets bind:loaded="handleAssetsLoaded">
    <xr-asset-material asset-id="mat" effect="simple" states="alphaMode:BLEND" />
    <xr-asset-material asset-id="text-simple" effect="simple" />
  </xr-assets>
  <xr-node>
    <xr-ar-tracker mode="OSD" src="https://assets.papegames.com/resources/cdn/20250925/fe8dad0e9800ef81.jpg">
      <xr-node rotation="0 180 0">
        <xr-mesh node-id="text-wrap" geometry="plane" material="mat" position="0 1 0" scale="1 1 0.5" rotation="90 0 0" uniforms="u_baseColorFactor:0.875 0.616 0.624 1" />
        <xr-text node-id="text-name" position="-0.25 1.05 0" scale="0.1 0.1 0.1" material="text-simple" value="美食家蜜蜂" />
      </xr-node>
    </xr-ar-tracker>
  </xr-node>
  <xr-camera clear-color="0.4 0.8 0.6 1" background="ar" is-ar-camera />
</xr-scene>
```

#### 人脸识别

源码示例: [人脸脸识别](https://github.com/deepred5/xr-frame-tutorial/tree/main/components/demo2/index.wxml)

```xml file="components/demo2/index.wxml"
<!-- AR system 系统开启 Face 模式 同时开启前置摄像头 -->
<xr-scene ar-system="modes:Face;camera:Front">
  <xr-assets>
    <xr-asset-load type="gltf" asset-id="mask" src="https://mmbizwxaminiprogram-1258344707.cos.ap-guangzhou.myqcloud.com/xr-frame/demo/jokers_mask_persona5.glb" />
  </xr-assets>
  <!-- AR 追踪器 对应也要开启 Face 模式 -->
  <!-- auto-sync 是一个数字数组，用于将对应顺序的子节点绑定到某个特征点上 -->
  <xr-ar-tracker mode="Face" auto-sync="43">
    <!-- 包含识别成功后需要展示的场景 -->
    <xr-gltf model="mask" rotation="0 180 0" scale="0.5 0.5 0.5" />
  </xr-ar-tracker>
  <xr-light type="ambient" color="1 1 1" intensity="1" />
  <xr-light type="directional" rotation="40 70 0" color="1 1 1" intensity="3" />
  <!-- AR 相机 -->
  <xr-camera background="ar" is-ar-camera />
</xr-scene>
```

除了人脸识别（Face），还有 人体识别（Body），人手识别（Hand），可以参考[官方文档学习](https://developers.weixin.qq.com/miniprogram/dev/component/xr-frame/ar/tracker.html#Body)

## 总结

到这里，我们已经把 XR-FRAME 的基础能力都过了一遍：从创建场景、添加物体、设置光照，到加载模型和动画，再到四种 AR 识别模式（Plane、Marker、OSD、Face）。理论上，你已经可以做出一个简单的 AR 效果了。

但理论和实际总是有差距的。在下一篇**实战篇**中，我会分享更高阶的知识点和实际项目中的经验：

* **Shader 着色器**：实现自定义视觉效果，让 AR 场景更炫酷
* **同层渲染**：XR 组件和小程序原生组件互相通信，实现复杂的 UI 交互
* **企业级方案**：性能优化、状态管理、多设备兼容等实战经验