---
title: hexo主题yilia添加valine评论系统
date: 2018-04-05 11:59:51
tags: [hexo, yilia]
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

PS: 如果你希望用户必须填写邮箱和昵称才能评论，由于valine并没有提供该功能，所以需要自己写段代码校验：

```javascript
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

document.body.addEventListener('click', function(e) {
    if (e.target.classList.contains('vsubmit')) {
        const email = document.querySelector('input[type=email]');
        const nick = document.querySelector('input[name=nick]');
        const reg = /^[A-Za-z0-9\u4e00-\u9fa5]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;
        if (!email.value || !nick.value || !reg.test(email.value)) {
            const str = `<div class="valert txt-center"><div class="vtext">请填写正确的昵称和邮箱！</div></div>`;
            const vmark = document.querySelector('.vmark');
            vmark.innerHTML = str;
            vmark.style.display = 'block';

            e.stopPropagation();

            setTimeout(function() {
                vmark.style.display = 'none';
                vmark.innerHTML = '';
            }, 2500);
        }
    }
    }, true);
</script>

```
