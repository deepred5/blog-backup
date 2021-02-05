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

如果想快速启动，可以把Cmder.exe所在的根目录((比如`D:\cmder`))添加到环境变量path中,之后win+r,输入cmder即可快速启动

### 右键cmder打开

打开cmder之后，新打开一个终端,勾选"run as administrator",然后输入
```
Cmder.exe /REGISTER ALL
```
之后，右键一个文件夹，就可以看到用cmder打开的选项

### 更改命令行提示符
默认提示符是λ, 我们一般习惯是$

修改安装目录的vendor/clink.lua文件,把所有的λ改成$即可

### VSCODE中使用cmder
在用户设置里添加配置即可(`settings.json`)
```json
{
  "terminal.integrated.shell.windows": "cmd.exe",
  "terminal.integrated.env.windows": {"CMDER_ROOT": "D:\\cmder"},
  "terminal.integrated.shellArgs.windows": [
      "/k",
      "D:\\cmder\\vendor\\init.bat"
  ]
}
```

### Windows Terminal 使用cmder
新建文件`D:\cmder\vendor\cmd_init.bat`
```bat
@echo off
set CMDER_ROOT=D:\cmder
set CMDER_START=D:\

"%CMDER_ROOT%\\vendor\\init.bat"
```
修改Windows Terminal的`settings.json`

在`profiles.list`数组里添加`cmder`选项
```json
{
  "profiles": {
    "list": [
      {
        "useAcrylic": true,
        "acrylicOpacity": 0.9,
        "closeOnExit": true,
        "colorScheme": "MyDracula",
        "commandline": "cmd.exe /k \"D:\\cmder\\vendor\\cmd_init.bat\"",
        "fontFace": "Fira Code Medium",
        "fontSize": 12,
        "guid": "{6350b2c8-d3cf-48f3-a104-978599f0ce8c}",
        "historySize": 9001,
        "icon": "D:\\cmder\\icons\\cmder.ico",
        "name": "Cmder"
      },
    ]
  }
}
```
在`schemes`数组里添加配色方案`MyDracula`
```json
{
  "schemes": [
      {
        "name": "MyDracula",
        "cursorColor": "#F8F8F2",
        "selectionBackground": "#44475A",
        "background": "#282A36",
        "foreground": "#F8F8F2",
        "black": "#21222C",
        "blue": "#BD93F9",
        "cyan": "#8BE9FD",
        "green": "#50FA7B",
        "purple": "#FF79C6",
        "red": "#FF5555",
        "white": "#F8F8F2",
        "yellow": "#F1FA8C",
        "brightBlack": "#6272A4",
        "brightBlue": "#D6ACFF",
        "brightCyan": "#A4FFFF",
        "brightGreen": "#73f197",
        "brightPurple": "#FF92DF",
        "brightRed": "#FF6E6E",
        "brightWhite": "#FFFFFF",
        "brightYellow": "#FFFFA5"
      }
  ],
}
```

如果需要默认使用`cmder`，则修改`defaultProfile`属性
```
{
  "defaultProfile": "{6350b2c8-d3cf-48f3-a104-978599f0ce8c}",
}
```

Windows Terminal 中使用管理员模式运行终端

新建文件`D:\cmder\vendor\su.bat`
```bat
@echo off
mode con lines=30 cols=60
%1 mshta vbscript:CreateObject("Shell.Application").ShellExecute("cmd.exe","/c %~s0 ::","","runas",1)(window.close)&&exit
cd /d "%~dp0"
start %USERPROFILE%\AppData\Local\Microsoft\WindowsApps\wt.exe
```
将文件夹路径保存(`D:\cmder\vendor\su.bat`)在Path环境变量里，重启然后在终端输入su即可

# 快捷键

1. ctrl + t : 新建终端
2. ctrl + w : 关闭当前终端
3. ctrl + tab : 切换终端

# 参考

1. [Windows Terminal + Cmder = ❤️](https://medium.com/talpor/windows-terminal-cmder-%EF%B8%8F-573e6890d143)
2. [Using Cmder in Windows Terminal](https://stackoverflow.com/questions/60575401/using-cmder-in-windows-terminal)
3. [Windows Terminal管理员模式](https://www.zhihu.com/question/353701331/answer/1338291321)