---
title: 利用vps搭建自己的ss梯子
date: 2017-10-22 10:36:30
tags: [vpn, Shadowsocks]
---
最近蓝灯也挂了，看来还是自己搭建一个vpn服务比较靠谱，在网上搜了一些教程，通过实践亲手试验了一下，发现其实搭建一个私人的Shadowsocks也不是特别麻烦。
特此写下这篇文章，记录其中的搭建过程。
<!-- more -->

# 购买vps

搭建梯子，首先我们需要一个vps服务器，并且该服务器需要在国外，这样才能翻墙。(原理就是正向代理，我们访问外网其实就是通过该vps服务器去访问的，然后由该服务器返回我们想要的内容)

vps的购买渠道有很多，比如[搬瓦工](http://banwagong.cn/),[vultr](https://www.vultr.com/)...
可以自行选择，我这里购买的是搬瓦工的vps，默认安装的操作系统的`Centos 6 x86 bbr` 

# 远程ssh登录
购买好vps，服务商就会向你提供ssh登录的地址，端口和密码

打开终端，输入
```
ssh -p 你的端口号 你的用户名@登录地址
```
```
# 比如:
 ssh -p 11111 root@172.11.11.111
```
输入完密码后，即可进入服务器
![ssh](http://pic.deepred5.com/ss-1.png)

我们可以试着ping一下国外网站，看看是不是能访问

```
ping -c 10 www.pixiv.net
```
![ping](http://pic.deepred5.com/ss-2.png)

可以看出，pixiv是可以正常访问的

# 安装Shadowsocks

分别输入以下命令:
```
yum install wget
```
```
wget --no-check-certificate -O shadowsocks-all.sh https://raw.githubusercontent.com/teddysun/shadowsocks_install/master/shadowsocks-all.sh
```
```
chmod +x shadowsocks-all.sh
```
```
./shadowsocks-all.sh 2>&1 | tee shadowsocks-all.log
```

输入最后一个命令时，会让你选择下载哪种shadowsocks,这里我下载的是shadowsocks-go，同时会让你选择ss客户端登陆时的端口号，密码，加密方式，其中加密方式选择 aes-256-cfb

安装成功后，终端应该会有这样的提示：
![ss-cofig](http://pic.deepred5.com/ss-3.png)

这就是你客户端登录时需要填写的参数，记得把这些数据记录下来！

# 安装Shadowsocks客户端

下载地址：

* [windows](https://github.com/shadowsocks/shadowsocks-windows/releases)

* [mac](https://github.com/shadowsocks/ShadowsocksX-NG/releases)

* [android](https://github.com/shadowsocks/shadowsocks-android/releases)

* ios 在app store搜索superwingy

比如windows客户端下：

![ss](http://pic.deepred5.com/ss-5.png)

# 注意

如果发现某些网站还是无法访问，原因可能是：
ss客户端代理模式开启的是pac模式，而该网站没有在pac匹配规则下。

解决方法是：先在线更新pac文件，然后再编辑pac文件，把该网站加入进去。
或者你可以直接开启全局模式

# 测试网速
安装speedtest-cli
```
wget https://raw.githubusercontent.com/sivel/speedtest-cli/master/speedtest.py
chmod +rx speedtest.py
sudo mv speedtest.py /usr/local/bin/speedtest-cli
sudo chown root:root /usr/local/bin/speedtest-cli
```
测试
```
speedtest-cli
```
![speed](http://pic.deepred5.com/speed2.png)

# 多账号多端口配置
有时我们想配置多个账号供不同人使用

```
vi /etc/shadowsocks-go/config.json
```
按下`i`进入insert模式，修改配置文件类似下面的形式:
```
{
    "server":"0.0.0.0",
    "local_port":1080,
    "method":"aes-256-cfb",
    "timeout":300,
    "port_password": {
        "8989": "密码1",
        "8990": "秘密2"
    }
}
```
退出编辑，按下`ESC`，然后输入`:wq`,保存退出

重启shadowsocks
```
/etc/init.d/shadowsocks-go restart
```
```
使用命令：
启动：/etc/init.d/shadowsocks-go start
停止：/etc/init.d/shadowsocks-go stop
重启：/etc/init.d/shadowsocks-go restart
状态：/etc/init.d/shadowsocks-go status
```

# 参考
[Bandwagon&Shadowsocks搭建个人VPN](http://fyerl.me/Bandwagon-Shadowsocks%E6%90%AD%E5%BB%BA%E4%B8%AA%E4%BA%BAVPN.html)

[Shadowsocks 一键安装脚本（四合一）](https://teddysun.com/486.html)
