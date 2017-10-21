---
title: 删除node_modules
date: 2016-11-05 12:49:10
tags: [node]
---

windows下有时会发现node_modules无法删除，这是因为文件依赖很深导致目录结构复杂。

这就比较蛋疼，原来遇到这种情况我是直接右键粉碎文件，但是粉碎时间太长而且麻烦，最近看到一种比较方便的方法：


```
npm install rimraf -g
rimraf node_modules
```

安装完rimraf就可以直接用命令行删除了。