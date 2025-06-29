---
title: react native初试
description: react native初试
pubDatetime: 2017-06-17T10:15:12.000Z
tags:
  - React Native
---
## 环境搭建
按照[官网](https://facebook.github.io/react-native/docs/getting-started.html)`Building Projects with Native Code`步骤搭建环境
Android Studio的模拟器在我电脑上运行时特别卡，所以这里我选用了[genymotion](https://www.genymotion.com/)

<!-- more -->

## 创建项目
```javascript
react-native init demo
```
然后用genymotion开启一个模拟器
```
cd demo
react-native run-android
```
正常情况下，模拟器应该就会安装上名为`demo`的应用
![QQ截图20170617182633](@/assets/images/react-native初试/1.png)

## 编辑项目
编辑demo目录下的`index.android.js`里面的内容，然后连续按键盘`r`两下，就可以看到更新后的界面了
![QQ截图20170617183011](@/assets/images/react-native初试/2.png)
