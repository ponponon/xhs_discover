# Chrome扩展日志查看指南

## Popup日志查看方法

### 方法1：右键检查（推荐）
1. 点击扩展图标打开popup
2. 在popup窗口上**右键点击**
3. 选择 **"检查弹出内容"**（Inspect popup）
4. 点击 **Console** 标签

### 方法2：通过扩展管理页面
1. 打开 `chrome://extensions/`
2. 找到"小红书帖子提取器"
3. 点击 **"详细信息"**
4. 找到 **"检查视图"** 部分
5. 点击 **popup.html** 链接

## Content Script日志查看方法

在小红书页面上：
1. 按 `F12` 或 `Ctrl+Shift+I`（Mac: `Cmd+Option+I`）
2. 点击 **Console** 标签
3. 在过滤框中输入 `[XHS Content]` 过滤日志

## 日志标签说明

### Popup日志（popup.js）
- 前缀：`[XHS Popup]`
- 查看位置：popup的控制台
- 主要内容：UI交互、设置管理、状态更新

### Content Script日志（content.js）
- 前缀：`[XHS Content]`
- 查看位置：小红书页面的控制台
- 主要内容：DOM操作、数据提取、自动检测

## 常用调试命令

### 在popup控制台运行：

查看当前设置：
```javascript
chrome.storage.local.get(['autoExtractSettings'], (result) => {
  console.log('当前设置:', result);
});
```

清除所有设置：
```javascript
chrome.storage.local.clear(() => {
  console.log('已清除所有设置');
});
```

手动切换自动提取：
```javascript
toggleAutoExtract();
```

### 在小红书页面控制台运行：

检查content script是否加载：
```javascript
console.log('[XHS Debug] Content script已加载');
```

查看提取的帖子数量：
```javascript
console.log('已提取帖子数:', window.xhsExtractedPosts?.length || 0);
```

## 日志级别说明

- `console.log()` - 普通信息
- `console.warn()` - 警告信息（黄色）
- `console.error()` - 错误信息（红色）
- `console.info()` - 提示信息（蓝色）

## 快速定位问题

### 问题1：点击开关没反应
- 打开popup控制台
- 查看是否有 `[XHS Popup] 自动提取开关被点击` 日志
- 如果没有，说明事件监听器未绑定
- 如果有，检查后续日志看执行到哪一步

### 问题2：自动提取不工作
- 打开小红书页面控制台
- 查看是否有 `[XHS Content]` 开头的日志
- 检查是否有错误信息

### 问题3：设置保存失败
- 打开popup控制台
- 查看保存相关的日志
- 检查是否有Chrome存储API错误

## 日志过滤技巧

在控制台过滤框中输入：
- `[XHS Popup]` - 只看popup日志
- `[XHS Content]` - 只看content script日志
- `error` - 只看错误信息
- `warn` - 只看警告信息

## 清除日志

点击控制台左上角的 🚫 图标清除所有日志，或按 `Ctrl+L`（Mac: `Cmd+K`）

## 保持日志窗口

勾选控制台右上角的 **"Preserve log"**（保留日志）选项，这样页面刷新时日志不会丢失
