---
title: Ant Design Pro V2升级到V4 小结
date: 2020-11-11 18:20:19
tags: [前端, Ant Design]
toc: true
---

### 前言
前不久接手过一个历史悠久的项(shi)目(shan)，技术栈之复杂(~~混乱~~)令我叹为观止：你甚至可以在一个项目里使用前端三大框架(Angular1, Vue, React)。

> 三份的快乐，本应该给我带来更多的快乐，但是为什么会变成这样呢?

鉴于接到的是一个全新的需求，于是我又双叒叕引入了`Ant Design Pro V4`全家桶(**第四份的快乐**)。`Hooks`和`Ant Design V4`的搭配，的确用着很香，尤其是`Form`表单的重写，大大提高了开发效率。于是趁着空闲时间，我决定把负责的一个`Ant Design Pro V2`项目也升级到`V4`版本。

特此记录下升级过程。

<!-- more -->

### UMI3升级

我当时使用的是[ant-design-pro 2.2.0 脚手架](https://github.com/ant-design/ant-design-pro/tree/2.2.0) 生成的前端项目，使用的是`umi@2`和`antd@3`版本。因此，首先把`UMI`升级到最新的`V3`版本。

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
      getLocalIdent:(
        context: {
          resourcePath: string;
        },
        _: string,
        localName: string,
      ) => {
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
            .map((a: string) => a.replace(/([A-Z])/g, '-$1'))
            .map((a: string) => a.toLowerCase());
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