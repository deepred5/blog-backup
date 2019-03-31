---
title: 从零开始写一个Telegram Bot
date: 2019-03-30 22:00:24
tags: [Telegram, Node, Nginx, Linux]
toc: true
---
<ruby>
  Telegram<rp>(</rp><rt>电报</rt><rp>)</rp>
</ruby>提供了丰富的[API](https://core.telegram.org/bots/api)，让我们可以非常方便的开发一个bot机器人。同时，[社区](https://core.telegram.org/bots/samples)也已经对底层API进行了各种语言的封装，因此，本文采用[node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)来快速实现bot

**注意: 由于国内网络的原因，Telegram bot 开发时需要全程开启<del>梯子</del>，并选择全局代理模式！！！**

<!-- more -->
### 创建一个新Bot
在Telegram客户端搜索[@BotFather](https://telegram.me/BotFather)，然后按照步骤创建一个属于自己的bot。创建成功后，BotFather会返回给你一个Token：

![Token](http://pic.deepred5.com/bot2.png)

比如我创建了一个叫`hetai5_bot`的bot，现在在客户端，我们`@hetai5_bot`进行任何对话，bot并不会进行响应：
![pic](http://pic.deepred5.com/bot3.png)

我们需要在本地编写逻辑，才能响应用户的各种输入

### 实现交互
新建一个项目文件夹`mkdir bot`，`npm init -y` 然后安装依赖`npm i node-telegram-bot-api`

新建一个`index.js`

```javascript
const TelegramBot = require('node-telegram-bot-api');

const token = '填入你的token';
const bot = new TelegramBot(token, {
  polling: true
});



bot.onText(/\/hentai/, function onLoveText(msg) {
  bot.sendMessage(msg.chat.id, 'Are you a hetai?');
});


bot.onText(/\/echo (.+)/, (msg, match) => {

  const chatId = msg.chat.id;
  const resp = match[1];
  bot.sendMessage(chatId, resp);
});
```

然后`node index.js`启动文件，这样就成功了吗？

很可惜，如果你是在国内开发，这样并没有卵用。虽然我们全程开启了ss(ssr)梯子，但是ss和vpn不同，ss即使开启了全局模式，它也不会代理电脑的所有网络。浏览器默认会自动走ss的代理服务器，但是其他软件默认并不会走ss代理，因此我们`node index.js`启动程序后， 并不能成功连接到Telegram

因此我们需要在代码里手动加上代理，走ss代理服务器！

`npm i socks5-https-client`

修改代码：
```javascript
const TelegramBot = require('node-telegram-bot-api');
const Agent = require('socks5-https-client/lib/Agent');

const token = '填入你的token';
const bot = new TelegramBot(token, {
  polling: true,
  request: { // 设置代理
    agentClass: Agent,
    agentOptions: {
      socksPassword: '填入你登梯子时的密码'
    }
  }
});

// 匹配/hentai
bot.onText(/\/hentai/, function onLoveText(msg) {
  bot.sendMessage(msg.chat.id, 'Are you a hetai?');
});


// 匹配/echo
bot.onText(/\/echo (.+)/, (msg, match) => {

  const chatId = msg.chat.id;
  const resp = match[1];
  bot.sendMessage(chatId, resp);
});

```
这次再和bot对话，就实现了对话功能了！
![pic](http://pic.deepred5.com/bot4.png)

当然我们可以再加点功能，比如用户输入`/prpr`，就从网上找一张图片发给用户
`npm i request`
```javascript
const TelegramBot = require('node-telegram-bot-api');
const Agent = require('socks5-https-client/lib/Agent');
const request = require('request');

const token = '填入你的token';
const bot = new TelegramBot(token, {
  polling: true,
  request: { // 设置代理
    agentClass: Agent,
    agentOptions: {
      socksPassword: '填入你登梯子时的密码'
    }
  }
});


bot.onText(/\/hentai/, function onLoveText(msg) {
  bot.sendMessage(msg.chat.id, 'Are you a hetai?');
});

bot.onText(/\/prpr/, function onLoveText(msg) {
  const chatId = msg.chat.id;
  request('https://konachan.com/post.json?tags=ass&limit=50', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      const result = JSON.parse(body) || [];
      const index = parseInt(Math.random() * result.length);
      bot.sendPhoto(chatId, result[index].file_url, { caption: '手冲一时爽，一直手冲一直爽' }).catch((err) => {
        bot.sendMessage(chatId, '手冲失败');
      })
    } else {
      bot.sendMessage(chatId, '手冲失败');
    }
  });
});


bot.onText(/\/echo (.+)/, (msg, match) => {

  const chatId = msg.chat.id;
  const resp = match[1];
  bot.sendMessage(chatId, resp);
});

```

![pic](http://pic.deepred5.com/bot5.png)

### polling VS webhook

我们开发的bot是怎么知道用户发送了哪些命令？

Telegram bot有两种获取用户发送命令的方式，一种是`polling`模式，也就是轮询。我们的bot需要每隔一段时间，就向Telegram服务器发送请求，询问最近用户发过来了哪些命令。这种方式的好处就是便于在本地调试，我们刚才的代码使用的就是这种模式。坏处就是每隔一段时间就要主动发送请求，即使最近可能没有任何用户发送命令。

另外一种模式就是`webhook`，我们需要给bot设置一个webhook地址，比如说`https://hentai.com/bot123`。这样，每次当用户向bot输入命令时，Telegram就会把这次的命令转发到`https://hentai.com/bot123`，因此，我们需要在`https://hentai.com/bot123`部署我们的bot。这种模式的好处就是可以及时响应用户的命令，坏处就是本地调试麻烦，可能需要`ngrock`这种内网穿透工具。同时在线上部署时，我们还需要有自己的域名并且要支持https!!!

### 线上部署

首先，我们需要有一台**国外服务器**：推荐在搬瓦工或者vultr上购买VPS。同时，你需要有一些简单的linux基础知识，如果你完全不会，推荐你看下我之前写过的一篇文章[写给前端小白看的linux部署基础知识](http://anata.me/2018/05/09/%E5%86%99%E7%BB%99%E5%89%8D%E7%AB%AF%E5%B0%8F%E7%99%BD%E7%9C%8B%E7%9A%84linux%E9%83%A8%E7%BD%B2%E5%9F%BA%E7%A1%80%E7%9F%A5%E8%AF%86/)

我这里购买的是vultr的VPS($5/mo的套餐)，安装的操作系统是centos 7 X64

因为我们使用了国外的服务器，所以代码里面的http代理可以去掉了:
```javascript
const TelegramBot = require('node-telegram-bot-api');
const request = require('request');

const token = '你的token';
const bot = new TelegramBot(token, {
  polling: true
});

bot.onText(/\/hentai/, function onLoveText(msg) {
  bot.sendMessage(msg.chat.id, 'Are you a hetai?');
});

bot.onText(/\/prpr/, function onLoveText(msg) {
  const chatId = msg.chat.id;
  request('https://konachan.com/post.json?tags=ass&limit=50', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      const result = JSON.parse(body) || [];
      const index = parseInt(Math.random() * result.length);
      bot.sendPhoto(chatId, result[index].file_url, { caption: '手冲一时爽，一直手冲一直爽' }).catch((err) => {
        bot.sendMessage(chatId, '手冲失败');
      })
    } else {
      bot.sendMessage(chatId, '手冲失败');
    }
  });
});

bot.onText(/\/echo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1];
  bot.sendMessage(chatId, resp);
});
```

安装基础组件,nvm,node,pm2
```bash
yum -y install gcc gcc-c++ autoconf pcre-devel make automake
yum -y install wget httpd-tools vim
```
```bash
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash
```
```bash
nvm install 11.0.0
```
```bash
npm i pm2 -g
```

把本地项目上传到服务器后，直接运行`pm2 start index.js --name bot`即可

### 域名支持https
前面我们说过了，`polling`模式的坏处就是浪费资源，而且不能及时响应用户请求

`webhook`模式下，部署比较麻烦，如果不希望使用这种方法，可以忽略下文

使用`webhook`的前提是我们有一个自定义域名，同时需要把域名指向我们的vps

![pic](http://pic.deepred5.com/bot6.png)

如图，我把一个子域名`hentai.urusai.site`指向我当前的vps IP地址

安装`nginx`

```bash
vim /etc/yum.repos.d/nginx.repo
```
写入：
```bash
[nginx]
name=nginx repo
baseurl=http://nginx.org/packages/centos/7/$basearch/
gpgcheck=0
enabled=1
```
`:wq!`保存退出

```bash
yum install nginx
```
这样就安装了最新版本的nginx

设置防火墙规则：
```bash
firewall-cmd --add-service=http
firewall-cmd --add-service=https
firewall-cmd --runtime-to-permanent
```

修改nginx配置：
```bash
vim /etc/nginx/conf.d/default.conf
```
把`server_name localhost;`修改成域名`hentai.urusai.site`即可

完成后，开启nginx:
```
nginx -s reload
```
浏览器输入`http://hentai.urusai.site`，就应该有nginx欢迎页面了

现在我们需要支持https:

安装`certbot`
```bash
yum install epel-release
yum install certbot-nginx
```

获取SSL证书
```bash
certbot --nginx
```

成功完成之后，我们访问`https://hentai.urusai.site`就可以正常请求了！

![pic](http://pic.deepred5.com/bot7.png)


设置证书自动续期
certbot颁发的证书，默认只有3个月有效期，因此我们可以设置自动续期
每天早上5:15执行任务
```bash
crontab -e
```
输入
```bash
15 5 * * * certbot renew --quiet
```


### nginx配置webhook

Telegram bot使用`webhook`模式时，我们需要修改现有的代码:
```
npm i express body-parser
```
```javascript
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const TOKEN = '你的token';
const url = 'https://hentai.urusai.site'; // 你自己的域名
const port = 9000;

const bot = new TelegramBot(TOKEN);
bot.setWebHook(`${url}/bot${TOKEN}`);
const app = express();
app.use(bodyParser.json());

app.get('/', (req, res) => res.send('Hello World!'));

app.post(`/bot${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Express server is listening on ${port}`);
});


bot.onText(/\/hentai/, function onLoveText(msg) {
  bot.sendMessage(msg.chat.id, 'Are you a hetai?');
});

bot.onText(/\/prpr/, function onLoveText(msg) {
  const chatId = msg.chat.id;
  request('https://konachan.com/post.json?tags=ass&limit=50', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      const result = JSON.parse(body) || [];
      const index = parseInt(Math.random() * result.length);
      bot.sendPhoto(chatId, result[index].file_url, { caption: '手冲一时爽，一直手冲一直爽' }).catch((err) => {
        bot.sendMessage(chatId, '手冲失败');
      })
    } else {
      bot.sendMessage(chatId, '手冲失败');
    }
  });
});


bot.onText(/\/echo (.+)/, (msg, match) => {

  const chatId = msg.chat.id;
  const resp = match[1];
  bot.sendMessage(chatId, resp);
});
```
然后重新启动pm2 
```
pm2 restart bot
```

修改nginx配置
```
vim /etc/nginx/conf.d/default.conf
```
把`https://hentai.urusai.site`转发到我们刚才express启动的服务器上
```
location / {
    proxy_pass http://127.0.0.1:9000;
    proxy_http_version 1.1;
    proxy_set_header X_FORWARDED_PROTO https;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Host $host;
    
}
```

```
nginx -s reload
```
重启nginx成功后，访问`https://hentai.urusai.site/`应该就展示express服务器返回的`hello world`

同时，我们Telegram bot的`webhook`模式也设置成功了

再次访问bot，输入`/prpr`，依然可以手冲了


### bot定时发送消息

bot除了当用户输入命令时，我们做出相应的操作，我们也可以定时让bot向特定的渠道发送消息

比如我们可以创建一个channel，然后邀请bot成为管理员，让bot每天10点发送一条天气预报，这样所有订阅了这个channel的用户，都可以收到消息了！


### 最后
最近我也做了一个[Telegram Bot](https://github.com/deepred5/yande-telegram-bot)，用于抓取[yande.re](https://yande.re/post)上面的图片

<a href="https://yande.re"><img src="https://assets.yande.re/assets/logo_small-418e8d5ec0229f274edebe4af43b01aa29ed83b715991ba14bb41ba06b5b57b5.png"></a>

[yande5_bot](https://t.me/yande5_bot)

机器人bot

<img src="https://i.loli.net/2019/03/31/5ca0d11ff3504.jpg" width="66" style="border-radius: 50%;">

Telegram搜索`@yande5_bot`或者点击这里[yande5_bot](https://t.me/yande5_bot)

使用方法:
* /latest 3 获取最新3张图片
* /popular 1d(1d/1w/1m/1y) 获取1天(天/周/月/年)的popular图片
* /random 3 获取随机3张图片
* /tag bra 3 获取标签为bra的3张图片
* /help 帮助信息
* /about 关于
* /start 开始使用

[dailyYande](https://t.me/dailyYande)

订阅channel

<img src="https://i.loli.net/2019/03/31/5ca0d11fe83ac.jpg" width="66" style="border-radius: 50%;">

Telegram搜索`@dailyYande`或者点击这里[dailyYande](https://t.me/dailyYande)

使用`@yande5_bot`机器人管理`@dailyYande` channel，每晚20:00准时发送当日popular图片
