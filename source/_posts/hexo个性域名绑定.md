---
title: hexo个性域名绑定
date: 2016-10-29 09:09:03
tags: [hexo]
---
默认情况下，如果hexo部署在github上，那么你的域名就是
```
你的github账号名.github.io
```
如果你有自己的个性域名，那么可以绑定成你自己的域名

方法如下：

* 更改你的域名解析
  ![](http://7xqwwf.com1.z0.glb.clouddn.com/QQ%E6%88%AA%E5%9B%BE20161029092710.png)
  其中记录值就是你的**github账号名.github.io**

* 在hexo博客的source根目录下新建CNAME文件(无后缀名，不要在github上新建)
  写入你的个性域名(不带http)

* 部署
```
	hexo clean
	hexo g
	hexo d
```

等待几分钟,当域名解析成功后即可用你自己的域名访问你的博客了