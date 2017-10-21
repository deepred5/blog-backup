---
title: Cmder
date: 2017-02-09 22:36:00
tags: [windows]
---

最近终端使用频率较高，发现windows原生的cmd不是很好用，尤其当需要开多个终端时，来回切换十分不方便,于是尝试使用Cmder

# 下载
[下载地址](http://cmder.net/)
有full和mini两个版本，这里选择full

# 配置

### 快速启动
下载后，直接解压，运行Cmder.exe即可启动

如果想快速启动，可以把Cmder.exe所在的根目录添加到环境变量path中,之后win+r,输入cmder即可快速启动

### 右键cmder打开

打开cmder之后，新打开一个终端,勾选"run as administrator",然后输入
```
Cmder.exe /REGISTER ALL
```
之后，右键一个文件夹，就可以看到用cmder打开的选项

### 更改命令行提示符
默认提示符是λ, 我们一般习惯是$

修改安装目录的vendor/clink.lua文件,把所有的λ改成$即可

# 快捷键

1. ctrl + t : 新建终端
2. ctrl + w : 关闭当前终端
3. ctrl + tab : 切换终端