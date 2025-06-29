# Markdown 图片本地化处理规则

## 1. 处理流程
- 等待用户主动提供具体的markdown文件名
- 先扫描文件中的所有外部图片引用
- 列出所有需要下载的图片URL供用户确认
- 得到用户确认后再进行下载和替换操作

## 2. 全量扫描
- 对每个markdown文件，完整扫描所有图片引用，包括：
  - markdown图片语法：`![alt](url)`
  - HTML `<img>` 标签：`<img src="url" ...>`

## 3. 外部图片识别
- 只处理外部图片，包括以下格式：
  - 绝对协议：`http://` 或 `https://` 开头的URL
  - **相对协议：`//` 开头的URL**
  - 已经是本地引用（如 `@/assets/images/...` 或相对路径）的图片无需处理

## 4. 本地存储结构
- 所有下载的图片统一存放在：
  `src/assets/images/MD文件名/图片文件名.扩展名`
- 每个markdown文件对应一个同名子文件夹，避免图片混淆
- 文件夹名称与markdown文件名完全一致（包括中文和特殊字符）

## 5. 图片下载与命名
- **有扩展名图片**: 直接下载，保持原始文件名和扩展名
- **无扩展名图片**: 自动识别图片类型并补全扩展名
  - 使用curl检测Content-Type头信息
  - 常见类型映射：
    - `image/jpeg` → `.jpg`
    - `image/png` → `.png`
    - `image/gif` → `.gif`
    - `image/webp` → `.webp`
    - `image/svg+xml` → `.svg`
- **相对协议处理**: 将 `//` 转换为 `http://` 进行下载
- 下载失败时，保留原始图片引用不变

## 6. 引用替换规则
- **统一格式**: 所有外部图片引用（无论原本是 `<img>` 还是 `![]()`）都要统一替换为markdown图片语法
- **标准格式**: `![alt](@/assets/images/MD文件名/图片文件名.扩展名)`
- **移除HTML属性**: 不保留 `<img>` 标签及其任何属性（如style、width、margin等）
- **简化alt文本**: 使用图片文件名作为alt文本（去掉扩展名）

## 7. 具体替换示例
```markdown
# 原始格式
<img src="http://pic.deepred5.com/image.jpg" style="width:45%;margin-right: 10px"/>
![alt](http://pic.deepred5.com/image.jpg)
![alt](//pic.deepred5.com/image.png)  # 相对协议格式
![alt](https://image-static.segmentfault.com/334/700/3347007015-5c1a055769479_fix732)

# 替换后格式
![image](@/assets/images/文件名/image.jpg)
![image](@/assets/images/文件名/image.png)
![3347007015-5c1a055769479_fix732](@/assets/images/文件名/3347007015-5c1a055769479_fix732.png)
```

## 8. 扫描正则表达式
```bash
# 完整的扫描正则表达式
!\[.*?\]\(//[^)]+\)|!\[.*?\]\(https?://[^)]+\)|<img[^>]+src="//[^"]+"|<img[^>]+src="https?://[^"]+"
```

## 9. 处理顺序
1. 扫描并列出图片URL（包括相对协议）
2. 用户确认
3. 创建本地文件夹
4. 检测无扩展名图片的类型
5. 批量下载图片（包含正确的扩展名，相对协议转换为http://）
6. 替换所有图片引用
7. 报告处理结果

## 10. 注意事项
- 确保所有图片引用都转换为markdown语法
- 保持文件内容的完整性和可读性
- 处理过程中保持与用户的确认机制
- 下载失败时保留原始引用并提示用户
- 对于无扩展名图片，必须检测Content-Type确定正确的扩展名
- **特别注意相对协议 `//` 格式的外部图片引用**

## 11. 技术实现要点
- 使用grep搜索外部图片引用（包括相对协议）
- 使用curl下载图片并检测Content-Type
- 使用awk或sed进行批量替换
- 保持文件夹结构的一致性
- 处理中文文件名和特殊字符
- **相对协议URL需要转换为http://进行下载**
