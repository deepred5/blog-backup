---
title: Ant Design Pro V2升级到V4 小结
pubDatetime: 2020-11-11T10:20:19.000Z
tags:
  - 前端
description: Ant Design Pro V2升级到V4 小结
---

### 前言
前不久接手过一个历史悠久的项(shi)目(shan)，技术栈之复杂(~~混乱~~)令我潸然泪下：你甚至可以在一个项目里使用前端三大框架(Angular1, Vue, React)。

> 三份的代码，本应该给我带来更多的快乐，但是为什么会变成这样呢?

鉴于接到的是一个全新的需求，于是我又双叒叕引入了`Ant Design Pro V4`全家桶(**第四份的快乐**)。`Hooks`和`Ant Design V4`的搭配，的确用着很香，尤其是`Form`表单的重写，大大提高了开发效率。于是趁着空闲时间，我决定把一个自己负责的`Ant Design Pro V2`项目也升级到`V4`版本。

特此记录下升级过程。

<!-- more -->

### UMI3升级

我当时使用的是[ant-design-pro 2.2.0 脚手架](https://github.com/ant-design/ant-design-pro/tree/2.2.0) 生成的前端项目(JS版，非TS版)，使用的是`umi@2`和`antd@3`。因此，首先要把`UMI`升级到最新的`V3`版本。

参考官方文档:
1. [《快速升级到 umi@3》](https://pro.ant.design/docs/upgrade-umi3-cn)
2. [《升级 antd pro 项目到 umi@3》](https://umijs.org/zh-CN/guide/upgrade-antd-pro-to-umi-3)

a. 删除`package.json`里的`dva`和`umi-plugin`开头的插件，改成`"umi": "^3.0.0"` 和`"@umijs/preset-react": "^1.2.2"`

其中`@umijs/preset-react`已经包含了之前的`umi-plugin`插件

```bash
{
  "dependencies": {
-   "dva": "^2.6.0-beta.16",
  },
  "devDependencies": {
-   "umi": "^2.13.0",
-   "umi-types": "^0.5.9"
-   "umi-plugin-react": "^1.14.10",
-   "umi-plugin-ga": "^1.1.3",
-   "umi-plugin-pro": "^1.0.2",
-   "umi-plugin-antd-icon-config": "^1.0.2",
-   "umi-plugin-antd-theme": "^1.0.1",
-   "umi-plugin-pro-block": "^1.3.2",
+   "umi": "^3.0.0",
+   "@umijs/preset-react": "^1.2.2"
  }
}
```
执行`npm install`重新安装

实践过程中发现：

需要更新`antd@3`至最新版：`npm i antd@3.26.20`

重新安装`npm i redux react-redux`


b. 修改`config/config.js` 配置文件

原先是直接导出一个对象:

```javascript
export default {

}
```

现在改成:
```javascript
import { defineConfig } from 'umi';

export default defineConfig({

})
```

删除废弃的属性: `plugins` 和 `disableRedirectHoist`

删除`devtool`的配置，使用默认配置即可


大致改成如下格式:
```javascript
import { defineConfig, utils } from 'umi';

const { winPath } = utils;

export default defineConfig({
  // 通过 package.json 自动挂载 umi 插件，不需再次挂载
  // plugins: [],
  antd: {},
  dva: {
    hmr: true,
  },
  locale: {
    default: 'zh-CN',
    baseNavigator: true,
  },
  dynamicImport: {
    // 无需 level, webpackChunkName 配置
    // loadingComponent: './components/PageLoading/index'
    loading: '@/components/PageLoading/index',
  },
  // 暂时关闭
  pwa: false,
  lessLoader: { javascriptEnabled: true },
  cssLoader: {
    // 这里的 modules 可以接受 getLocalIdent
    modules: {
      getLocalIdent: (context, localIdentName, localName) => {
        if (
          context.resourcePath.includes('node_modules') ||
          context.resourcePath.includes('ant.design.pro.less') ||
          context.resourcePath.includes('global.less')
        ) {
          return localName;
        }
        const match = context.resourcePath.match(/src(.*)/);
        if (match && match[1]) {
          const antdProPath = match[1].replace('.less', '');
          const arr = winPath(antdProPath)
            .split('/')
            .map(a => a.replace(/([A-Z])/g, '-$1'))
            .map(a => a.toLowerCase());
          return `antd-pro${arr.join('-')}-${localName}`.replace(/--/g, '-');
        }
        return localName;
      },
    }
  }
})

```

c. 模块导入方式改变

```javascript
// 导入方式改变
- import Link from 'umi/link';
- import { connect } from 'dva';
- import { getLocale, setLocale, formatMessage } from 'umi-plugin-react/locale';
+ import {
+   Link,
+   connect,
+   getLocale,
+   setLocale,
+   formatMessage,
+ } from 'umi';


// 路由跳转方式改变
- import { router } from 'umi';
+ import { history } from 'umi';
- router.push()
+ history.push()
```
d. 路由配置修改

`umi2`中，权限路由是配置`Routes`属性。在`umi3`中，则改成了`wrappers`属性。

修改`config/router.config.js`
```javascript
export default [
  // app
  {
    path: '/',
    component: '../layouts/BasicLayout',
    wrappers: ['../pages/Authorized'], // Routes 变成了 wrappers
    routes: [],
  },
];
```

e. 重新启动项目

`npm run start` 理论上，项目应该能够被`umi3`启动起来了。

如果仍然报错，则自行根据报错原因修改代码即可。


### Ant Design Pro 内置组件升级

`Ant Design Pro v2`脚手架提供的`Layout`组件，已被抽离成了一个单独的npm包`@ant-design/pro-layout`。同时官方又封装了几个常用的组件，方便快速进行业务开发，详见[ProComponents官网](https://procomponents.ant.design/)。

不过我原项目中的`Layout`组件功能暂时够用，考虑到代码改动较大，因此暂时没有升级该组件。


### Ant Design 4 升级

参考官方文档: 

1. [《从 v3 到 v4》](https://ant.design/docs/react/migration-v4-cn)
2. [《迁移 antd@4 指南》](https://beta-pro.ant.design/blog/antd-4.0-cn)

a. `antd`升级到`3.x`最新版本（前面我们已经在升级`umi3`的过程升级了`antd`），按照控制台 warning 信息移除/修改相关的 API

b. 升级项目 React 16.12.0 以上  `npm i react@^16.12.0`

重新运行项目，查看是否能正确运行

c. 使用命令行工具快速升级

由于`antd4`重构了大量的组件，为了兼容已有`antd2`废弃的组件(比如旧版本的`Form`)，官方提供了`@ant-design/compatible`这个npm包

```javascript
import { Form, Mention } from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.css';
```

官方提供了一个cli工具，可以自动转换代码的引入方式。**在运行cli前，请先提交你的本地代码修改**。

```bash
# 进入旧项目
cd myproject
# 通过 npx 直接运行
# src 就是前端源代码目录夹
npx -p @ant-design/codemod-v4 antd4-codemod src
```
对于无法自动修改的部分，codemod 会在命令行进行提示，建议按提示手动修改。修改后可以反复运行上述命令进行检查。

d. 升级`antd`版本

`npm i antd@^4.0.0  @ant-design/icons@^4.0.0   @ant-design/compatible@^1.0.0`

安装成功后，重启项目，查看页面效果。

### 升级后的问题

a. 样式问题

升级后的的历史代码，`Form`组件引用的是`@ant-design/compatible`，class类名发生了变化，从`ant-form`变成了`ant-legacy-form`。如果你的项目里对这部分的样式进行了修改，则需要手动修改类名了。

样式问题只能靠自己一个个页面去排查了。。。

b. API 问题

```jsx
// 旧版
<TextArea autosize={{ minRows: 5 }} />

// 新版
<TextArea autoSize={{ minRows: 5 }} />
```
这种api的变化，只能靠人工编码和页面报错来修复了。。。

c. Antd4 自身的bug

比如 [RangePicker属性defaultPickerValue无效](https://github.com/ant-design/ant-design/issues/21811)

升级有风险，挖坑需谨慎!

### 总结

此次升级的过程比我预想的要轻松很多，不过也是在项目页面不多(只有20多个页面)，初期底层框架由我搭建(系统较熟悉)的前提下完成的。

前言中我有提到的那个历史遗留的巨石应用，其实已经在一个岌岌可危，即将不可维护的状态下了。即使我又引入了最新的技术栈，然而若干年后，接手的人员肯定会吐槽：`Antd pro 4` 这版本也太老了吧！

市面上这几年也提出了[微前端](https://micro-frontends.org/)的概念，相应的微前端框架[single-spa](https://github.com/single-spa/single-spa)，[qiankun](https://qiankun.umijs.org/zh/guide)也应运而生。

看着手里维护的各种技术栈的代码，我想起了一句名言：

> 世上本没有微前端，吹的人多了，也便成了KPI。老夫写代码都是jQuery一把梭！ ——— 鲁迅