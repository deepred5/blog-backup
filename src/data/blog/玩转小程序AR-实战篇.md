---
pubDatetime: 2025-11-25T20:34:58.000+08:00 
title: 玩转小程序AR-实战篇
featured: true
tags:
  - AR
  - 小程序
  - XR FRAME
description: 小程序 XR-FRAME 实战教程 
---

《玩转小程序AR》系列教程

* [玩转小程序AR-基础篇](/posts/玩转小程序ar-基础篇)
* [**玩转小程序AR-实战篇**](/posts/玩转小程序ar-实战篇)


## 目录

## 逆向小程序

接着[前文](/posts/玩转小程序ar-基础篇#实体-ar-立牌)，体验过原神官方AR小程序后，我也比较好奇他们实现AR Live2d 动画的原理。

<video style="width:40%" controls src="https://webstatic.deep5.red/ar/20251110-202934-ar.mp4"></video>

出于**技术学习**的目的，我在开源社区搜寻小程序反编译工具，发现 [KillWxapkg](https://github.com/Ackites/KillWxapkg) 和  [unveilr](https://github.com/broken5/unveilr) 暂时仍可使用

### 逆向 原神AR 小程序

首先我们需要找到原神AR微信小程序的本地小程序包地址

注意：本人电脑 Mac (Windows电脑同理)

1. 进入电脑微信小程序目录
```bash
# Mac 目录地址
cd /Users/你的电脑用户名/Library/Containers/com.tencent.xinWeChat/Data/Documents/app_data/radium/Applet/packages

# Windows 目录地址
cd C:\Users\你的电脑用户名\AppData\Roaming\Tencent\xwechat\radium\Applet\packages


# 打开文件夹
open .
```

如果发现目录下有较多文件夹，建议先把所有的文件夹都删除，为后续定位要逆向的小程序做好准备

![小程序目录](@/assets/images/玩转小程序AR/screenshot-20251125-212338.png)


2. 用电脑微信打开需要逆向的小程序
![原神AR小程序](@/assets/images/玩转小程序AR/screenshot-20251125-211252.png)

3. 再次打开微信小程序目录
![小程序目录](@/assets/images/玩转小程序AR/screenshot-20251125-213047.png)

这时候，恭喜你已经定位到了小程序的AppID了！

4. 反编译小程序
![原神AR小程序](@/assets/images/玩转小程序AR/screenshot-20251125-213556.png)

小程序文件夹下的`__APP__.wxapkg`就是编译后的小程序，现在我们需要使用工具反编译它了

* **unveilr 工具**

[安装地址](https://github.com/broken5/unveilr)
```bash
# 安装反编译工具
npm i unveilr -g

# 运行反编译命令
unveilr wx -i wxb2618d769d6f5143  "/Users/你的电脑用户名/Library/Containers/com.tencent.xinWeChat/Data/Documents/app_data/radium/Applet/packages/wxb2618d769d6f5143/3/__APP__.wxapkg" -f
```

* **KillWxapkg 工具**

[安装地址](https://github.com/Ackites/KillWxapkg)
```bash
./KillWxapkg -id="wxb2618d769d6f5143" -in="/Users/你的电脑用户名/Library/Containers/com.tencent.xinWeChat/Data/Documents/app_data/radium/Applet/packages/wxb2618d769d6f5143/3"  -restore
```

于是在小程序文件夹下，就新生成了一个反编译后的源码文件夹
![反编译](@/assets/images/玩转小程序AR/screenshot-20251125-214601.png)

当然，反编译后的源码也不是100%还原：

* 缺失 `wxml`
* `js` 代码被`babel`转码后，语义不是特别清晰

![原神源码1](@/assets/images/玩转小程序AR/screenshot-20251201-195547.png)
![原神源码2](@/assets/images/玩转小程序AR/screenshot-20251201-200158.png)

当然，在`AI`的加持下，如今这些问题已经完全难不倒我们了。`AI`分分钟就能根据混淆过的`js`原始逻辑，还原清晰可读的语义化代码

![原神源码3](@/assets/images/玩转小程序AR/screenshot-20251201-200736.png)

从源码中可以看到，原神AR小程序使用的正是`XR-FRAME`框架

### 逆向 Kivicube 小程序插件

官方提供的`kivicube`插件

```json
{
  "usingComponents": {
    "kivicube-scene": "plugin://kivicube/kivicube-scene"
  },
  "disableScroll": true,
  "navigationStyle": "custom"
}
```

```xml
<kivicube-scene
  wx:if="{{showAR}}"
  class="kivicube"
  scene-id="{{sceneId}}"
  bind:ready="ready"
  bind:error="error"
  bind:downloadAssetStart="downloadStart"
  bind:downloadAssetProgress="downloadProgress"
  bind:downloadAssetEnd="downloadEnd"
  bind:loadSceneStart="loadStart"
  bind:loadSceneEnd="loadEnd"
  bind:sceneStart="sceneStart"
  bind:openUrl="openUrl"
  bind:photo="photo"
/>
```

使用同样的方法，我们可以得到小程序插件逆向的源码

![Kivicube源码1](@/assets/images/玩转小程序AR/screenshot-20251201-201949.png)

通过源码分析可得知，**Kivicube** 使用的是底层`VisionKit` + 自研的`Threejs`封装

![Kivicube源码2](@/assets/images/玩转小程序AR/screenshot-20251201-202405.png)


## 着色器

> Shader，中文称为“着色器”，是一种在图形处理单元（GPU）上运行的计算机程序，用于定义和控制图形渲染过程中的各种视觉效果

> 使用 GLSL 的着色器（shader），GLSL 是一门特殊的有着类似于 C 语言的语法，在图形管道 (graphic pipeline) 中直接可执行的 OpenGL 着色语言。

更多详情见MDN上的解释:[GLSL Shaders](https://developer.mozilla.org/zh-CN/docs/Games/Techniques/3D_on_the_web/GLSL_Shaders)

XR-FRME 提供了自定义效果的能力: [定制一个效果](https://developers.weixin.qq.com/miniprogram/dev/component/xr-frame/render/effect.html#%E5%AE%9A%E5%88%B6%E4%B8%80%E4%B8%AA%E6%95%88%E6%9E%9C)

### 序列帧 SHADER

XR-FRAME 官方的[《序列帧动画（雪碧图、GIF）》](https://github.com/dtysky/xr-frame-demo/tree/master/miniprogram/components/template/xr-template-frameEffect)示例，实现了一个简单的可配置的序列帧效果

而原神小程序AR的源码中，正是使用了这个序列帧效果实现了伪Live2d

首先我们需要将序列帧动画合成到一张**M行*N列**大小的`PNG`图片上(**注意：微信小程序最大能渲染8000x8000左右分辨率的序列帧图片**)

<img src="https://webstatic.deep5.red/ar/0ac5e7c80c0fc262.png" alt="序列帧" style="width: 50%">

如上图所示，我们这次的图片是**8行x4列**，共32张序列帧图片合成而来

源码示例: [序列帧 SHADER](https://github.com/deepred5/xr-frame-tutorial/tree/main/components/demo6/index.wxml)

```xml file="components/demo6/index.wxml"
<xr-scene bind:ready="handleReady">
  <xr-assets></xr-assets>
  <xr-node>
    <xr-node node-id="center" />
    <xr-mesh visible="{{meshesVisible}}" id="animation-mesh" node-id="animation-mesh" position="0 0 0" scale="1 1 1.3" rotation="90 0 0" geometry="plane" />
  </xr-node>
  <xr-camera target="center" clear-color="0.4 0.8 0.6 1" position="0 0 2.5" camera-orbit-control />
</xr-scene>
```

```javascript file="components/demo6/index.js"
Component({
  /**
   * 组件的初始数据
   */
  data: {
    meshesVisible: false
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleReady: function ({ detail }) {
      const xrFrameSystem = wx.getXrFrameSystem()
      const createFrameEffect = (scene) => {
        return scene.createEffect({
          name: 'frame-effect',
          properties: [
            {
              key: 'columCount', // 列数
              type: xrFrameSystem.EUniformType.FLOAT,
              default: 1
            },
            {
              key: 'rowCount', // 行数
              type: xrFrameSystem.EUniformType.FLOAT,
              default: 1
            },
            {
              key: 'during', // 持续时间
              type: xrFrameSystem.EUniformType.FLOAT,
              default: 1
            }
          ],
          images: [
            {
              key: 'u_baseColorMap',
              default: 'white',
              macro: 'WX_USE_BASECOLORMAP'
            }
          ],
          // 透明物体需要大于`2500`！
          defaultRenderQueue: 2501,
          passes: [
            {
              renderStates: {
                blendOn: false,
                depthWrite: true,
                cullOn: false,
                // 基础库 v3.0.1 开始 默认的 plane 切为适配 cw 的顶点绕序
              },
              lightMode: 'ForwardBase',
              useMaterialRenderStates: true,
              shaders: [0, 1]
            }
          ],
          shaders: [
            // 顶点着色器 Vertex shaders
            `#version 100

          precision highp float;
          precision highp int;
    
          attribute vec3 a_position;
          attribute highp vec2 a_texCoord;
      
          uniform mat4 u_view;
          uniform mat4 u_projection;
          uniform mat4 u_world;
          varying highp vec2 v_uv;
          void main()
          {
            v_uv = a_texCoord;
            gl_Position = u_projection * u_view * u_world * vec4(a_position, 1.0);
          }`,
            // 片段着色器 Fragment shaders
            `#version 100
            precision highp float;
            precision highp int;

            uniform sampler2D u_baseColorMap;
            uniform highp float u_gameTime;
            uniform highp float rowCount;
            uniform highp float columCount;
            uniform highp float during;
            varying highp vec2 v_uv;
            void main()
            {
              float loopTime = mod(u_gameTime, during);

              float tickPerFrame = during / (columCount * rowCount);
              
              float columTick = mod(floor(loopTime / tickPerFrame), columCount);
              float rowTick = floor(loopTime / tickPerFrame / columCount);

              vec2 texCoord = vec2(v_uv.x / columCount + (1.0 / columCount) * columTick , v_uv.y / rowCount + (1.0 / rowCount) * rowTick);
              vec4 color = texture2D(u_baseColorMap, texCoord);
              gl_FragColor = color;
            }`
          ],
        });
      }
      xrFrameSystem.registerEffect('frame-effect', createFrameEffect)
      this.scene = detail.value

      this.loadAsset()
    },

    async loadAsset() {
      const xrFrameSystem = wx.getXrFrameSystem();
      const xrScene = this.scene;

      await xrScene.assets.loadAsset({
        type: 'texture',
        assetId: 'lzy',
        src: 'https://assets.papegames.com/resources/cdn/20251022/0ac5e7c80c0fc262.png',
      })

      // 第一个参数是效果实例的引用，第二个参数是默认`uniforms`
      const frameMaterial = xrScene.createMaterial(
        // 使用定制的效果
        xrScene.assets.getAsset('effect', 'frame-effect'),
        { u_baseColorMap: xrScene.assets.getAsset('texture', 'lzy') }
      )

      // 可以将其添加到资源系统中备用
      xrScene.assets.addAsset('material', 'frame-effect', frameMaterial)

      const meshElement = xrScene.getElementById('animation-mesh').getComponent(xrFrameSystem.Mesh)
      frameMaterial.setFloat('columCount', 4)
      frameMaterial.setFloat('rowCount', 8)
      frameMaterial.setFloat('during', 1)
      frameMaterial.alphaMode = "BLEND"
      meshElement.material = frameMaterial

      this.setData({
        meshesVisible: true
      })
    },
  }
})
```
<video style="width:40%;" controls src="https://webstatic.deep5.red/ar/frame.mp4"></video>

### 透明视频 SHADER

一般的透明视频：

1. 自带透明通道的视频格式: mov  (小程序默认不支持`mov`格式播放)
2. 特殊处理后的左右分屏视频格式: mp4 （小程序默认支持`mp4`格式播放）
  * 左边是视频的 RGB
  * 右边是视频的 Alpha
  * 左右叠加即可渲染透明视

更多详情见前文[《更高效的web动效解决方案 - 背景视频》](/posts/更高效的web动效解决方案#video-视频)

<video style="width:40%;" controls src="https://webstatic.deep5.red/ar/v.mp4"></video>

XR-FRAME 官方的[《过滤黑色背景视频》](https://github.com/dtysky/xr-frame-demo/tree/master/miniprogram/components/template/xr-template-removeBlack)示例，正好演示了`左右分屏`视频的过滤黑色背景能力

源码示例: [透明视频 SHADER](https://github.com/deepred5/xr-frame-tutorial/tree/main/components/demo7/index.wxml)

```xml file="components/demo7/index.wxml"
<xr-scene bind:ready="handleReady">
  <xr-assets bind:progress="handleAssetsProgress" bind:loaded="handleAssetsLoaded">
    <xr-asset-load type="video-texture" asset-id="lzy" src="https://assets.papegames.com/resources/cdn/20251022/bd7cb6ba6546d697.mp4" options="autoPlay:true,loop:true" />
    <xr-asset-material asset-id="removeBlack-mat" effect="removeBlack" />
  </xr-assets>
  <xr-node>
    <xr-node node-id="center" />
    <xr-node wx:if="{{loaded}}">
      <xr-mesh node-id="video-item" position="0 0 0" rotation="90 0 0" scale="1 1 1.3" geometry="plane" material="removeBlack-mat" uniforms="u_videoMap: video-lzy" />
    </xr-node>
  </xr-node>
  <xr-camera target="center" clear-color="0.4 0.8 0.6 1" position="0 0 3" camera-orbit-control />
</xr-scene>
```

```javascript file="components/demo7/index.js"
const xrFrameSystem = wx.getXrFrameSystem();

xrFrameSystem.registerEffect('removeBlack', scene => scene.createEffect({
  name: "removeBlack",
  images: [{
    key: 'u_videoMap',
    default: 'white',
    macro: 'WX_USE_VIDEOMAP'
  }],
  defaultRenderQueue: 2000,
  passes: [{
    "renderStates": {
      cullOn: false,
      blendOn: true,
      blendSrc: xrFrameSystem.EBlendFactor.SRC_ALPHA,
      blendDst: xrFrameSystem.EBlendFactor.ONE_MINUS_SRC_ALPHA,
      cullFace: xrFrameSystem.ECullMode.BACK,
    },
    lightMode: "ForwardBase",
    useMaterialRenderStates: true,
    shaders: [0, 1]
  }],
  shaders: [
    // 顶点着色器 Vertex shaders
    `#version 100

uniform highp mat4 u_view;
uniform highp mat4 u_viewInverse;
uniform highp mat4 u_vp;
uniform highp mat4 u_projection;
uniform highp mat4 u_world;

attribute vec3 a_position;
attribute highp vec2 a_texCoord;

varying highp vec2 v_UV;

void main()
{
  v_UV = a_texCoord;
  vec4 worldPosition = u_world * vec4(a_position, 1.0);
  gl_Position = u_projection * u_view * worldPosition;
  }`,
    // 片段着色器 Fragment shaders
    `#version 100

precision mediump float;
precision highp int;
varying highp vec2 v_UV;

#ifdef WX_USE_VIDEOMAP
  uniform sampler2D u_videoMap;
#endif

void main()
{
#ifdef WX_USE_VIDEOMAP
  // 左右分屏透明视频处理：
  // 左半边 (0-0.5) 为彩色内容，右半边 (0.5-1.0) 为透明度遮罩
  
  // 1. 采样左半边获取 RGB 颜色
  vec2 colorUV = vec2(v_UV.x * 0.5, v_UV.y);
  vec4 color = texture2D(u_videoMap, colorUV);
  
  // 2. 采样右半边获取 Alpha 遮罩
  vec2 alphaUV = vec2(v_UV.x * 0.5 + 0.5, v_UV.y);
  vec4 alphaSample = texture2D(u_videoMap, alphaUV);
  float alpha = alphaSample.r; // 使用红色通道作为透明度（灰度值）
  
  // 3. 输出颜色 + 遮罩透明度（不做伽马校正，避免变暗）
  gl_FragData[0] = vec4(color.rgb, alpha);
#else
  gl_FragData[0] = vec4(1.0, 1.0, 1.0, 1.0);
#endif
}
`],
}));

Component({
  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleReady({
      detail
    }) {
      console.log('handleReady', detail.value)
    },
    handleAssetsProgress({ detail }) {
      console.log('assets progress', detail.value)
    },
    handleAssetsLoaded({ detail }) {
      console.log('assets loaded', detail.value)
      this.setData({ loaded: true })
    },
  }
})
```

<video style="width:40%;" controls src="https://webstatic.deep5.red/ar/v2.mp4"></video>

## 实战案例


<video style="width:40%;" controls src="https://webstatic.deep5.red/ar/work.mp4"></video>

源码示例: [序列帧 SHADER](https://github.com/deepred5/xr-frame-tutorial/tree/main/pages/demo8)

### 同层渲染

目前XR-FRAME尚未支持和小程序的UI元素混写，但我们可以使用同层方案

```xml file="pages/demo8/index.wxml"
<view>
  <demo8
    disable-scroll
    id="main-frame"
    width="{{renderWidth}}"
    height="{{renderHeight}}"
    style="width:{{width}}px;height:{{height}}px;top:{{top}}px;left:{{left}}px;"
    bind:arTrackerSwitch="handleTrackerSwitch"
    markerImg="{{markerImg}}"
  />
  <view class="marker-tip-container" hidden="{{hiddenTip}}">
    <view class="marker-img-container">
      <image mode="aspectFit" class="marker-img" src="{{markerImg}}" />
    </view>
    <view class="marker-text-container">
      <text class="marker-text">请对准识别图</text>
    </view>
  </view>
</view>
```

`demo8`是XR-FRAME组件，它和`view`UI组件处在同一层，这既是所谓的同层渲染方案。而同层方案，就必然涉及到组件通信

XR-FRAME组件需要将AR的识别状态同步给父级，父级根据不同的AR状态，展示不同的UI界面。而这些通信方式，和传统的组件通信方式基本一致：父级传递函数和属性到子级，子级通过执行回调函数传递数据

## 框架维护

比较尴尬的是，[核心技术负责人](https://dtysky.moe/article/Art-%E5%8E%8C%E5%80%A62024)已离开团队，框架处于**暂停维护**状态

![暂停维护](@/assets/images/玩转小程序AR/screenshot-20251201-214919.png)

## 资料
- 演示源码：http://github.com/deepred5/xr-frame-tutorial/
- XR-FRAME 文档: https://developers.weixin.qq.com/miniprogram/dev/framework/xr-frame/
- VKSession 文档：https://developers.weixin.qq.com/miniprogram/dev/api/ai/visionkit/VKSession.html