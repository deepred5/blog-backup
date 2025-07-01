---
title: Hexo迁移Astro
description: 记录博客从 Hexo 迁移 Astro 全过程
slug: hexo-to-astro
pubDatetime: 2025-06-20T10:41:28.577Z
modDatetime: 2025-06-29T12:35:18.577Z
tags:
  - 随笔
featured: true
---

## 目录

**2025年**，博客**~断更2周年达成~**

2年没更新，以至于我的博客域名(anata.me)也忘记续上费了...

再想要给域名续命时，结果发现`.me`后缀域名，已被阿里云迁移到了阿里云国际站

> 根据《互联网域名管理办法》要求，阿里云计算有限公司、阿里巴巴云计算（北京）有限公司停止为尚未取得域名注册管理机构许可的顶级域名提供服务。阿里云中国站将自2021年7月20日起开始对存量未取得域名注册管理机构许可的顶级域名进行清理，您的以下域名未在此时间点前申请转出至海外注册商。

然而我也没注册过阿里云国际站，现在既登不进国际站，也无法在中国站续费。于是只能含泪现注册了一个新域名: `deep5.red`  (**后续 2025-06-29: 通过海外站客服工单反馈， 找回之前的域名了! 🌸✨🎉✨🌸**)

当然也就顺理成章的从阿里云跑路到了赛博佛祖: [**Cloudflare**](https://www.cloudflare.com/zh-cn/)

## Astro 迁移

历史博客是用 [Hexo](/posts/hexo个性域名绑定) 搭建的，这次趁着换域名，顺便迁移到了 [Astro](https://astro.build/) 

> Astro is the web framework for building content-driven websites like blogs, marketing, and e-commerce.

主题选择了 [astro-paper](https://github.com/satnaing/astro-paper) : 一个干净简洁的博客主题

稍微魔改了一些代码，以支持:

* [动态 OG 图片支持中文](https://github.com/deepred5/blog-backup/blob/main/src/utils/og-templates/post.js#L162)
* [中文目录支持](https://github.com/deepred5/blog-backup/blob/main/astro.config.ts#L23)

博客内容，由于都是由 `Markdown` 文件存储，所以迁移过来比较方便，直接无脑拷贝过来即可: 只需要修改`Frontmatter`的属性，以兼容 `astro-paper` [要求](https://astro-paper.pages.dev/posts/adding-new-posts-in-astropaper-theme/#frontmatter)即可

## Cursor 自动化图片迁移

历史博客里的图片，都是使用了七牛云的对象存储 + CDN 服务。由于只配了`http://pic.deepred5.com` HTTP 协议，导致这次新博客域名配置了 HTTPS 后，无法加载图片。于是决定把历史图片全都迁移到本地仓库（~主要还是懒~）

历史图片至少也有 100+ 张，不太可能人工手动下载并替换引用路径，于是决定用 `AI` 自动化处理

一开始，先和 `Cursor` 交代了 **下载图片**和**替换图片路径**的逻辑后，让 `Cursor` 首先尝试替换一篇博客，效果当时是非常满意的。接着就乐观的下达了一个错误的指令: 

**请批量修改剩下的所有 `Markdown` 文件**

本以为万事大吉了，结果 `AI 幻觉` 导致后续替换的 `Markdown` 文件质量非常的差：

* 图片替换路径不对
* 图片没有下载
* 图片下载的格式不对

无奈只能先让 `Cursor` 生成一份 [Markdown图片本地化处理规则](https://github.com/deepred5/blog-backup/blob/main/markdown%E5%9B%BE%E7%89%87%E6%9C%AC%E5%9C%B0%E5%8C%96%E5%A4%84%E7%90%86%E8%A7%84%E5%88%99.md)，其中的关键点是：

1. 等待用户主动提供具体的 Markdown 文件名
2. 列出所有需要下载的图片 URL 供用户确认

基本这两步由我人工校验确认无误后，后续的自动化流程就比较可靠了。

当然，在后续的替换过程中，`Cursor` 仍然会时不时忘记整个替换流程规则，这个时候，我需要重新再和它声明一遍之前的 **Markdown 处理规则**

