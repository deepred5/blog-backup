---
title: ScriptUI
date: 2016-12-24 08:59:17
tags: [ae]
---

研究了下ae脚本的UI编写，主要参考了P9大大的[p9ui](http://www.bilibili.com/video/av1619742/)

脚本要放在**Adobe After Effects CC\Support Files\Scripts\ScriptUI Panels**目录下,
并且脚本后缀名为**.jsx**(ae脚本本质上就是ECMAScript)
然后你就可以在ae的窗口区域找到你写的脚本了
![](http://pic.deepred5.com/2016-12-24_095953.png)

<!-- more -->
下面介绍几种常用的控件

## panel
其他的所有控件都要放在panel中，所以panel是一个大容器，编写UI的第一步就是先创建一个panel
```javascript
var panel = this;
```
有了panel后，就可以添加其他控件了
```javascript
panel.add("button", [10, 10, 100, 30], "按钮");
```

## button
按钮
```javascript
panel.add("button", [10, 10, 100, 30], "按钮");
```
参数解释
1. 控件名
2. 控件坐标(对应矩形左上角的x和y轴，右下角的x和y轴)
3. 控件显示文字

## radiobutton
单选框
```javascript
panel.add("radiobutton", [10, 10, 100, 30], "单选框");
```
## checkbox
复选框
```javascript
panel.add("checkbox", [10, 10, 100, 30], "复选框");
```
## statictext
静态文字
```javascript
panel.add("statictext", [10, 10, 100, 30], "文字说明：");
```
## edittext
可编辑文字
```javascript
panel.add("edittext", [10, 10, 100, 30], "可编辑");
```
## dropdownlist
下拉列表
```javascript
var downlist = panel.add("dropdownlist", [10, 10, 100, 30], ["你的名字","超电磁炮","缘之空","妄想学生会"]);
downlist.selection = 0; // 默认选中第一项
```
## listbox
列表
```javascript
panel.add("listbox", [10, 10, 100, 100], ["你的名字","超电磁炮","缘之空","妄想学生会"]);
```
## image
图片
```javascript
var myImage = File("img/1.png"); // 相对于当前脚本的路径
panel.add("image", [10, 10, 100, 30], myImage);
```
## 事件
给控件添加事件处理函数
```
var button = panel.add("button", [10, 10, 100, 30], "按钮");
button.onClick = function() {
	alert('2333');
}
```
## 常见编写模式
```javascript
function createUI(thisObj) {
	var myPanel = thisObj;
	myPanel.add("button", [10, 10, 100, 30], "按钮");
	return myPanel;
}
var myToolsPanel = createUI(this);
```
## 鱼丸mad一键生成器
三天自学PR，两周精通AE已经弱爆了，bilibili强势打造：MAD一键生成器！
海量经典动画素材库，上万种过场衔接效果自动搭配。
误解系、静止系、动作系、闪现流一应俱全。
振宇惊呼"我的时代已经过去", 鱼丸用了都说好

![](http://pic.deepred5.com/20161224110857.png)

```javascript
function createUI(thisObj) {
	var myPanel = thisObj;
	myPanel.add("statictext", [10,10,90,30], "风格:");
	myPanel.add("radiobutton", [50,12,300,32], "静止系");
	myPanel.add("radiobutton", [120,12,370,32], "欧美风");
	myPanel.add("radiobutton", [190,12,440,32], "综漫燃");
	myPanel.add("radiobutton", [260,12,510,32], "误解系");
	myPanel.add("statictext", [10,60,90,80], "素材:");
    downlist_1 = myPanel.add("dropdownlist",[80,60,230,80] ,["你的名字","超电磁炮","缘之空","妄想学生会"]);
	downlist_1.selection = 0;
	myPanel.add("statictext", [10,110,90,130], "分辨率:");
	myPanel.add("radiobutton", [80,110,370,130], "480p");
	myPanel.add("radiobutton", [150,110,430,130], "720p");
	myPanel.add("radiobutton", [220,110,490,130], "1080p");
	myPanel.add("statictext", [10,160,200,180], "帧率:");
	myPanel.add("edittext",[70,160,140,180] ,"23.976");
	myPanel.add("statictext", [10,210,200,240], "标题:");
	myPanel.add("edittext",[70,210,280,240] ,"【综漫/高燃/泪目】你的名字");
	var button = myPanel.add("button", [10,270,150,300], "鱼丸一键生成");
	button.onClick = function() {alert("渲染成功！")};
	var myImage1 = File("img/1.png"); 
	var myImage2 = File("img/2.png"); 
	myPanel.add("image", [380,37,600,300], myImage1);
	myPanel.add("image", [400,280,580,380], myImage2);
	return myPanel;
}
var myToolsPanel = createUI(this);
```