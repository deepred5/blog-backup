---
title: 删除node_modules
pubDatetime: 2016-11-05T04:49:10.000Z
tags:
  - Node.js
description: 删除node_modules
---

windows下有时会发现node_modules无法删除，这是因为文件依赖很深导致目录结构复杂。

这就比较蛋疼，原来遇到这种情况我是直接右键粉碎文件，但是粉碎时间太长而且麻烦，最近看到一种比较方便的方法：


```
npm install rimraf -g
rimraf node_modules
```

安装完rimraf就可以直接用命令行删除了。