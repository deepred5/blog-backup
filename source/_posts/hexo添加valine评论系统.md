---
title: hexo添加valine评论系统
date: 2018-04-05 11:59:51
tags: [hexo]
---

最近打算给博客添加评论功能，看了下市面上一些评论插件，觉得[gitment](https://github.com/imsun/gitment)和[Valine](https://github.com/xCss/Valine)这两款插件比较符合我的要求：轻量而且配置简单。
不过gitment只支持github账号评论，虽然也没啥人看我博客，不过权衡了下，还是决定用Valine。

我hexo博客主题用的是[yilia](https://github.com/litten/hexo-theme-yilia)，看了下_config.yml配置文件，发现它竟默认支持gitment，为了也能使用valine，只能魔改源码了。

## 魔改步骤

1. 修改yilia主题下的_config.yml文件，添加valine配置
```
# valine配置
valine_appid: '填写leancloud的appid'
valine_appkey: '填写leancloud的appkey'
```

2. 修改layout/_partial/article.ejs，添加一段代码
```
<% if (theme.valine_appid && theme.valine_appkey){ %>
    <%- partial('post/valine', {
        key: post.slug,
        title: post.title,
        url: config.url+url_for(post.path)
      }) %>
    <% } %>
```

3. 新增layout/_partial/post/valine.ejs
```
<div id="comment"></div>
<script src="//cdn1.lncld.net/static/js/3.0.4/av-min.js"></script>
<script src='//unpkg.com/valine/dist/Valine.min.js'></script>
<script>
new Valine({
    el: '#comment' ,
    notify:false, 
    verify:false, 
    appId: '<%=theme.valine_appid%>',
    appKey: '<%=theme.valine_appkey%>',
    placeholder: 'ヾﾉ≧∀≦)o欢迎评论!',
    path:window.location.pathname, 
    avatar:'mm' 
});
</script>
```

至此，魔改成功啦！