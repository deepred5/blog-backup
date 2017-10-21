---
title: 从零开始教你写一个NPM包
date: 2017-09-09 22:25:14
tags: [Node, NPM]
---

# 前言
本文主要记录我开发一个npm包：`pixiv-login`时的心得体会，其中穿插了一些日常开发的流程和技巧，希望对新手有所启发，大佬们看看就好_(:3」∠)

# pixiv-login
`pixiv-login`的功能就是模拟用户登录网站pixiv，获取cookie
[源码](https://github.com/deepred5/pixiv-login) [npm](https://www.npmjs.com/package/pixiv-login)

安装：
```javascript
npm install --save pixiv-login
```

使用：
```javascript
const pixivLogin = require('pixiv-login');

pixivLogin({
    username: '你的用户名',
    password: '你的密码'
}).then((cookie) => {
    console.log(cookie);
}).catch((error) => {
    console.log(error);
})
```
<!-- more -->
# 开发工具
日常开发中，我常用的IDE是vscode+webstorm+sublime，其中vscode因为其启动快，功能多，调试方便，受到大多数开发者的青睐。在接下来的教程中，我就以vscode进行演示了。至于终端，由于是在windows平台，所以我选择了cmder代替原生cmd，毕竟cmder支持大多数linux命令。

# 初始化项目
```
mkdir pixiv-login
cd pixiv-login
npm init
```
一路回车就好

# 安装依赖
要模拟登陆，我们就需要一个http库，这里我选择了[axios](https://github.com/mzabriskie/axios)，同时获取的html字符串我们需要解析，[cheerio](https://github.com/cheeriojs/cheerio)就是首选了
```javascript
npm i axios cheerio --save
```
# debug
毕业参加工作也有几个月了，其中学到了很重要的一个技能就是debug。说出来也不怕大家笑，在大学时，debug就是`console.log`大法好，基本就不用断点来追踪，其实用好断点，效率比`console.log`要高很多。还记得当初看到同事花式debug时，心中不禁感慨：**为什么你们会这么熟练啊！**

使用vscode进行node调试是非常方便的

首先新建一个index.js文件，项目结构如下（我本地的npm版本是5.x，所以会多一个package-lock.json文件，npm版本3.x的没有该文件）:
![pic](http://7xqwwf.com1.z0.glb.clouddn.com/p01.png)
然后点击左侧第4个图标，添加配置 
![pic](http://7xqwwf.com1.z0.glb.clouddn.com/p4.png)

配置文件如下：
```javascript
{
    // Use IntelliSense to learn about possible Node.js debug attributes.
    // Hover to view descriptions of existing attributes.
    // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "Launch Program",
            "program": "${workspaceRoot}\\index.js"
        }
    ]
}
```
其中最重要的一句是：` "program": "${workspaceRoot}\\index.js"`，它表示debug时，项目的启动文件是index.js
至此，debug的配置就完成了。

现在编写index.js文件

```javascript
const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://www.pixiv.net')
    .then(function (response) {
        const $ = cheerio.load(response.data);
        const title = $('title').text();
        debugger;
        console.log(title);
    })
    .catch(function (error) {
        console.log(error);
    });
```
按下F5启动调试模式，如果一切正常，那么效果如下：
![pic](http://7xqwwf.com1.z0.glb.clouddn.com/p5.png)

可以看到，程序卡在了第8行
如果你把鼠标移到response变量上，可以发现，vscode会自动显示该变量的值，这比直接`console.log(response)`清晰简洁多了
![pic](http://7xqwwf.com1.z0.glb.clouddn.com/p6.png)

![pic](http://7xqwwf.com1.z0.glb.clouddn.com/p7.png)

如果想继续执行程序，可以接着按下F5或者右上角的绿色箭头
![pic](http://7xqwwf.com1.z0.glb.clouddn.com/p8.png)

程序执行完成，控制台打出了pixiv首页的title值
![pic](http://7xqwwf.com1.z0.glb.clouddn.com/p9.png)

除了使用`debugger`语句打断点，你也可以直接点击代码的行数打断点
![pic](http://7xqwwf.com1.z0.glb.clouddn.com/p10.png)

比如上图，我就在第8行处打了一个断点，效果是一样的

还有一个小技巧，在debug模式下，你可以随意修改变量的值，比如现在程序卡在了第8行，这时你在控制台修改title的值
![pic](http://7xqwwf.com1.z0.glb.clouddn.com/p11.png)

按下回车，然后继续执行代码，这时控制台输出的title值就是'deepred'，而不是真正的title值
![pic](http://7xqwwf.com1.z0.glb.clouddn.com/p12.png)

这个技巧，在平时开发过程中，当需要绕过某些验证时，非常有用

# 正式开始

虽然我们最后是要写一个npm包，但是首先，我们先把获取cookie的功能实现了，然后再思考怎么封装为一个npm包，供其他人使用。

进入登录页面 [https://accounts.pixiv.net/login?lang=zh&source=pc&view_type=page&ref=wwwtop_accounts_index](https://accounts.pixiv.net/login?lang=zh&source=pc&view_type=page&ref=wwwtop_accounts_index)，我们先登录一次，看看前端向后台发送了哪些数据
![pic](http://7xqwwf.com1.z0.glb.clouddn.com/p13.jpg)

这里需要特别注意，我们要勾选`preserve log`，这样，即使页面刷新跳转了，http请求记录仍然会记录下来
![pic](http://7xqwwf.com1.z0.glb.clouddn.com/p14.png)
![pic](http://7xqwwf.com1.z0.glb.clouddn.com/p15.png)
![pic](http://7xqwwf.com1.z0.glb.clouddn.com/p16.png)
可以看到，**post_key**是登录的关键点，P站使用了该值来防止CSRF
post_key怎么获取呢？
经过页面分析，发现在登录页面，有个隐藏表单域（后来发现，其实在[首页](https://www.pixiv.net)就已经写出来了）：

![pic](http://7xqwwf.com1.z0.glb.clouddn.com/p17png.png)

可以清楚看到，post_key已经写出来了，我们只需要用`cheerio`解析出该input的值就ok了
```javascript
const post_key = $('input[name="post_key"]').val();
```
获取post_key
```javascript
const axios = require('axios');
const cheerio = require('cheerio');

const LOGIN_URL = 'https://accounts.pixiv.net/login?lang=zh&source=pc&view_type=page&ref=wwwtop_accounts_index';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36';
const LOGIN_API = 'https://accounts.pixiv.net/api/login?lang=zh';


const getKey = axios({
    method: 'get',
    url: LOGIN_URL,
    headers: {
        'User-Agent': USER_AGENT
    }
}).then((response) => {
    const $ = cheerio.load(response.data);
    const post_key = $('input[name="post_key"]').val();
    const cookie = response.headers['set-cookie'].join('; ');
    if (post_key && cookie) {
        return { post_key, cookie };
    }
    return Promise.reject("no post_key");
}).catch((error) => {
    console.log(error);
});


getKey.then(({ post_key, cookie }) => {
    debugger;
})
```
F5运行代码
![pic](http://7xqwwf.com1.z0.glb.clouddn.com/p18.png)

![pic](http://7xqwwf.com1.z0.glb.clouddn.com/p19.png)
注意：打开注册页时，注册页会返回一些cookie，这些cookie在登录时也是需要随密码，用户名一起发送过去的

获取到了post_key, cookie，我们就可以愉快的把登录数据发送给后台接口了
```javascript
const querystring = require('querystring');
getKey.then(({ post_key, cookie }) => {
    axios({
        method: 'post',
        url: LOGIN_API,
        headers: {
            'User-Agent': USER_AGENT,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Origin': 'https://accounts.pixiv.net',
            'Referer': 'https://accounts.pixiv.net/login?lang=zh&source=pc&view_type=page&ref=wwwtop_accounts_index',
            'X-Requested-With': 'XMLHttpRequest',
            'Cookie': cookie
        },
        data: querystring.stringify({
            pixiv_id: '你的用户名',
            password: '你的密码',
            captcha: '',
            g_recaptcha_response: '',
            post_key: post_key,
            source: 'pc',
            ref: 'wwwtop_accounts_index',
            return_to: 'http://www.pixiv.net/'
        })
    }).then((response) => {
        if (response.headers['set-cookie']) {
            const cookie = response.headers['set-cookie'].join(' ;');
            debugger;
        } else {
            return Promise.reject(new Error("no cookie"))
        }

    }).catch((error) => {
       console.log(error);
    });
});
```
注意其中这段代码：
```javascript
data: querystring.stringify({
        pixiv_id: '你的用户名',
        password: '你的密码',
        captcha: '',
        g_recaptcha_response: '',
        post_key: post_key,
        source: 'pc',
        ref: 'wwwtop_accounts_index',
        return_to: 'http://www.pixiv.net/'
    })
```
这里有个巨大的坑，`axios`默认把数据转成json格式，如果你想发送`application/x-www-form-urlencoded`的数据，就需要使用`querystring`模块
详情见: [using-applicationx-www-form-urlencoded-format](https://github.com/mzabriskie/axios#using-applicationx-www-form-urlencoded-format)

如果一切正常，那么效果如下：
![pic](http://7xqwwf.com1.z0.glb.clouddn.com/p20.png)

其中的PHPSESSID和device_token就是服务器端返回的登录标识，说明我们登录成功了

程序运行的同时，你也很可能收到P站的登录邮件
![pic](http://7xqwwf.com1.z0.glb.clouddn.com/p21.png)

好了，目前为止，我们已经成功获取到了cookie，实现了最基本的功能。

**特别注意**
程序不要运行太多次，因为每次运行，你就登录一次P站，如果被P站监测到频繁登录，它会开启验证码模式，这时，你除了需要发送用户名和密码，还需要向后台发送验证码值
```javascript
data: querystring.stringify({
            pixiv_id: '你的用户名',
            password: '你的密码',
            captcha: '你还需要填验证码',
            g_recaptcha_response: '',
            post_key: post_key,
            source: 'pc',
            ref: 'wwwtop_accounts_index',
            return_to: 'http://www.pixiv.net/'
        })
```
也就是，`captcha`字段不再是空值了！

基本功能的完整代码
```javascript
const axios = require('axios');
const cheerio = require('cheerio');
const querystring = require('querystring');

const LOGIN_URL = 'https://accounts.pixiv.net/login?lang=zh&source=pc&view_type=page&ref=wwwtop_accounts_index';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36';
const LOGIN_API = 'https://accounts.pixiv.net/api/login?lang=zh';


const getKey = axios({
    method: 'get',
    url: LOGIN_URL,
    headers: {
        'User-Agent': USER_AGENT
    }
}).then((response) => {
    const $ = cheerio.load(response.data);
    const post_key = $('input[name="post_key"]').val();
    const cookie = response.headers['set-cookie'].join('; ');

    if (post_key && cookie) {
        return { post_key, cookie };
    }
    return Promise.reject("no post_key");
}).catch((error) => {
    console.log(error);
});


getKey.then(({ post_key, cookie }) => {
    axios({
        method: 'post',
        url: LOGIN_API,
        headers: {
            'User-Agent': USER_AGENT,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Origin': 'https://accounts.pixiv.net',
            'Referer': 'https://accounts.pixiv.net/login?lang=zh&source=pc&view_type=page&ref=wwwtop_accounts_index',
            'X-Requested-With': 'XMLHttpRequest',
            'Cookie': cookie
        },
        data: querystring.stringify({
            pixiv_id: '你的用户名',
            password: '你的密码',
            captcha: '',
            g_recaptcha_response: '',
            post_key: post_key,
            source: 'pc',
            ref: 'wwwtop_accounts_index',
            return_to: 'http://www.pixiv.net/'
        })
    }).then((response) => {
        if (response.headers['set-cookie']) {
            const cookie = response.headers['set-cookie'].join(' ;');
            console.log(cookie);
        } else {
            return Promise.reject(new Error("no cookie"));
        }

    }).catch((error) => {
        console.log(error);
    });
});

```
# 封装成一个npm包
`登录P站获取cookie`这个功能，如果我们想让其他开发者也能方便调用，就可以考虑将其封装为一个npm包发布出去，这也算是对开源社区做出自己的一份贡献。

首先我们回想一下，我们调用其他npm包时是怎么做的？
```javascript
const cheerio = require('cheerio');
const $ = cheerio.load(response.data);
```

同理，我们现在规定`pixiv-login`的用法：
```javascript
const pixivLogin = require('pixiv-login');

pixivLogin({
    username: '你的用户名',
    password: '你的密码'
}).then((cookie) => {
    console.log(cookie);
}).catch((error) => {
    console.log(error);
})

```
`pixiv-login`对外暴露一个函数，该函数接受一个配置对象，里面记录了用户名和密码

现在，我们来改造index.js

```javascript
const pixivLogin = ({ username, password }) => {
    
};


module.exports = pixivLogin;
```
最基本的骨架就是定义一个函数，然后把该函数导出

由于我们需要支持Promise写法，所以导出的`pixivLogin `本身要返回一个Promise

```javascript
const pixivLogin = ({ username, password }) => {
    return new Promise((resolve, reject) => {
        
    })
};

```

之后，只要把原先的代码套进去就好了

完整代码: 
```javascript
const axios = require('axios');
const cheerio = require('cheerio');
const querystring = require('querystring');

const LOGIN_URL = 'https://accounts.pixiv.net/login?lang=zh&source=pc&view_type=page&ref=wwwtop_accounts_index';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36';
const LOGIN_API = 'https://accounts.pixiv.net/api/login?lang=zh';


const pixivLogin = ({ username, password }) => {
    return new Promise((resolve, reject) => {
        const getKey = axios({
            method: 'get',
            url: LOGIN_URL,
            headers: {
                'User-Agent': USER_AGENT
            }
        }).then((response) => {
            const $ = cheerio.load(response.data);
            const post_key = $('input[name="post_key"]').val();
            const cookie = response.headers['set-cookie'].join('; ');

            if (post_key && cookie) {
                return { post_key, cookie };
            }
            reject(new Error('no post_key'));
        }).catch((error) => {
            reject(error);
        });

        getKey.then(({ post_key, cookie }) => {
            axios({
                method: 'post',
                url: LOGIN_API,
                headers: {
                    'User-Agent': USER_AGENT,
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Origin': 'https://accounts.pixiv.net',
                    'Referer': 'https://accounts.pixiv.net/login?lang=zh&source=pc&view_type=page&ref=wwwtop_accounts_index',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Cookie': cookie
                },
                data: querystring.stringify({
                    pixiv_id: username,
                    password: password,
                    captcha: '',
                    g_recaptcha_response: '',
                    post_key: post_key,
                    source: 'pc',
                    ref: 'wwwtop_accounts_index',
                    return_to: 'http://www.pixiv.net/'
                })
            }).then((response) => {
                if (response.headers['set-cookie']) {
                    const cookie = response.headers['set-cookie'].join(' ;');
                    resolve(cookie);
                } else {
                    reject(new Error('no cookie'));
                }
                
            }).catch((error) => {
                reject(error);
            });
        });
    })
}

module.exports = pixivLogin;
```

# 发布npm包

### README
每个npm包，一般都需要配一段介绍文字，来告诉使用者如何安装使用，比如[lodash](https://www.npmjs.com/package/lodash)的首页
![pic](http://7xqwwf.com1.z0.glb.clouddn.com/p22.png)

新建一个README.md，填写相关信息
![pic](http://7xqwwf.com1.z0.glb.clouddn.com/p23.png)

有时，我们会看到一些npm包有很漂亮的版本号图标：
![pic](http://7xqwwf.com1.z0.glb.clouddn.com/p24.png)

这些图标，其实可以在[https://shields.io/](https://shields.io/)  上制作
登录该网站，下拉到最下面
![pic](http://7xqwwf.com1.z0.glb.clouddn.com/p25.jpg)
输入你想要的文字，版本号，颜色， 然后点击按钮
![pic](http://7xqwwf.com1.z0.glb.clouddn.com/p26.jpg)
就可以得到图片的访问地址了
![pic](http://7xqwwf.com1.z0.glb.clouddn.com/p27.png)
修改刚才的README.md，加上我们的版本号吧!
![pic](http://7xqwwf.com1.z0.glb.clouddn.com/p28.png)

### gitignore
我们现在的文件夹目录应该如下所示：
![pic](http://7xqwwf.com1.z0.glb.clouddn.com/p29.png)

其实node_modules以及.vscode是完全不用上传的，所以为了防止发布时带上这些文件夹，我们要新建一个`.gitignore`
```javascript
.vscode/
node_modules/
```

### 注册
到 [https://www.npmjs.com/](https://www.npmjs.com/)  上注册一个账号
然后在终端输入
```javascript
npm adduser
```
输入用户名，密码，邮箱即可登入成功
**这里还有一个坑！**
 如果你的npm使用的是淘宝镜像，那么是无法登陆成功的 
最简单的解决方法：
```javascript
npm i nrm -g
nrm use npm
```
`nrm`是个npm镜像管理工具，可以很方便的切换镜像源

登陆成功后，输入
```javascript
npm whoami
```
![pic](http://7xqwwf.com1.z0.glb.clouddn.com/p30.png)

如果出现了你的用户名，说明你已经成功登陆了

### 发布
**特别注意**：
因为`pixiv-login`这个名字已经被我占用了，所以你需要改成其他名字
修改pacakge.json文件的`name`字段

```javascript
npm publish
```
即可发布成功啦！

### 下载
发布成功后，我们就可以下载自己的包了
```javascript
npm i pixiv-login
```

# 使用pixiv-login包
我们可以用`pixiv-login`做一些有趣（♂）的事
比如: 
> 下载 R-18每周排行榜的图片

没登录的用户是无法访问R18区的，所以我们需要模拟登陆
```javascript

const fs = require('fs');
const axios = require('axios');
const pixivLogin = require('pixiv-login');
const cheerio = require('cheerio');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36';


pixivLogin({
    username: '你的用户名',
    password: '你的密码'
}).then((cookie) => {
    // 把cookie写入文件中，则下次无需再次获取cookie，直接读取文件即可
    fs.writeFileSync('cookie.txt', cookie);
}).then((response) => {
    const cookie = fs.readFileSync('cookie.txt', 'utf8');
    axios({
        method: 'get',
        url: 'https://www.pixiv.net/ranking.php?mode=weekly_r18',
        headers: {
            'User-Agent': USER_AGENT,
            'Referer': 'https://www.pixiv.net',
            'Cookie': cookie
        },
    })
        .then(function (response) {
            const $ = cheerio.load(response.data);
            const src = $('#1 img').data('src');
            return src;
        }).then(function (response) {
            axios({
                method: 'get',
                url: response,
                responseType: 'stream'
            })
                .then(function (response) {
                    const url = response.config.url;
                    const fileName = url.substring(url.lastIndexOf('/') + 1);
                    response.data.pipe(fs.createWriteStream(fileName)).on('close', function () {
                        console.log(`${fileName}下载完成`);
                    });;
                });
        })
})
```
同时，我们的`pixiv-login`是支持`async await`的！
```javascript
const pixivStart = async () => {
    try {
        const cookie = await pixivLogin({
            username: '你的用户名',
            password: '你的密码'
        });

        fs.writeFileSync('cookie.txt', cookie);
        const data = fs.readFileSync('cookie.txt', 'utf8');

        const response = await axios({
            method: 'get',
            url: 'https://www.pixiv.net/ranking.php?mode=weekly_r18',
            headers: {
                'User-Agent': USER_AGENT,
                'Referer': 'https://www.pixiv.net',
                'Cookie': cookie
            },
        });

        const $ = cheerio.load(response.data);
        const src = $('#1 img').data('src');

        const pic = await axios({
            method: 'get',
            url: src,
            responseType: 'stream'
        });

        const fileName = pic.config.url.substring(pic.config.url.lastIndexOf('/') + 1);
        pic.data.pipe(fs.createWriteStream(fileName)).on('close', function () {
            console.log(`${fileName}下载完成`);
        });;

    } catch (err) {
        console.log(err)
    }
};

pixivStart();
```

# 参考

1. [模拟登录pixiv.net](https://kotori.love/archives/curl-login-pixiv.html)
2. [Python爬虫入门：爬取pixiv](http://www.cnblogs.com/fightfordream/p/6421498.html)