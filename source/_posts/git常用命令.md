---
title: git常用命令
date: 2018-01-22 18:42:01
tags: [git]
---
在工作中使用git也有一段时间了，记录下常见的使用命令。

一般公司，都会自己搭建一个gitlab。当你参与到一个项目开发时，首先要把gitlab上的项目拉到自己的电脑上。
这里又分成两种情况：
* **方式A**: 远程创建一个项目，然后每个开发成员git clone一份到自己的工作电脑上，提交就直接提交到远程仓库。
* **方式B**: 远程创建一个项目，然后每个开发成员自己fork一份项目，然后把自己fork的项目，git clone到自己的工作电脑上，提交代码也只提交到自己forK的仓库上，最后发一个merge request到远程仓库。
<!-- more -->
两种开发模式，我在不同的小组里都要试过，分别来说下基本流程：

## 方式A

1.git clone 项目
```
git clone 填入项目地址
```
2.切换分支
你开发一个功能时，肯定不是在master分支开发，所以clone下来的代码，要切换到某个feature分支，再进行编码
```
## 新建一个本地分支，并且与远程分支进行关联
git checkout -b [分支名] [远程名]/[分支名]

## 比如
git checkout -b feature/bankcard origin/feature/bankcard

## 在本地分支间切换
git checkout feature/bankcard2
```

3.提交
现在你开始写代码了，写完后，准备提交。
```
## 查看当前仓库状态
git status

## 保存到暂存区
git add .

## 保存到本地仓库
git commit -m "提交信息"

## 推送到远程仓库
git push
```

4.拉取最新代码
除了你之外，其他同事也是可以提交代码到远程仓库的，所以每天一上班，第一件事就是拉取最新代码
```
git pull
```

5.解决冲突
git pull下来的代码，很大机率会和你的代码产生冲突(conflict)，这时你就要解决冲突，冲突解决完后，再次提交
```
git add .
git commit -m "fix conflict"
git push
```

## 方式B
1.fork远程项目
在gitlab网页上进行操作
![](//pic.deepred5.com/fork2.png)

2.git clone 你fork的项目
```
git clone 填入fork项目地址
```

3.本地项目与远程项目进行关联
```
git remote add upstream 填入远程项目地址
```

4.切换分支
```
## 新建本地分支，并且与远程分支进行关联
git checkout -b 1.0.0 upstream/1.0.0
```

5.提交
```
## 查看当前仓库状态
git status

## 保存到暂存区
git add .

## 保存到本地仓库
git commit -m "提交信息"

## 推送到fork仓库
git push origin
```

6.merge request
在gitlab网页上进行 merge request请求
![](//pic.deepred5.com/merge.png)

7.拉取最新代码
```
git pull upstream
```
方式B的开发流程里，代码是`push`到fork项目里，`pull`代码是在upstream里拉

## 其他一些常用命令
```
创建分支：git branch dev
切换分支：git checkout dev
删除本地分支：git branch -d dev
删除远程分支：git push origin :dev

查看提交信息: git log
还原1.txt修改: git checkout 1.txt
查看1.txt修改: git diff 1.txt

把dev分支合并到当前分支: git merge dev
```

## 注意事项

* `git push`之前，先`git pull`一下，保证提交前是最新代码
* `git checkout -b 1.0.0 upstream/1.0.0`创建分支并关联远程分支，如果有问题，可以先`git fetch`下