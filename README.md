# 小红书帖子提取器

一个 Chrome 插件，用于提取小红书探索页面的帖子信息。

## 功能特性

- ✅ 提取帖子封面图
- ✅ 提取帖子标题
- ✅ 提取发布者信息
- ✅ 提取发布者头像
- ✅ 提取点赞数
- ✅ 提取发布时间（如果页面中显示）
- ✅ 导出为 JSON 格式
- ✅ 导出为 CSV 格式
- ✅ 实时监听新帖子

## 安装方法

1. 准备图标文件（可选）：
   - 创建 `icon16.png` (16x16 像素)
   - 创建 `icon48.png` (48x48 像素)
   - 创建 `icon128.png` (128x128 像素)
   
   如果没有图标文件，可以从 manifest.json 中删除 `icons` 和 `default_icon` 配置。

2. 在 Chrome 浏览器中：
   - 打开 `chrome://extensions/`
   - 开启右上角的"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择本项目文件夹

## 使用方法

1. 访问小红书探索页面：`https://www.xiaohongshu.com/explore`
2. 等待页面完全加载
3. 点击浏览器工具栏中的插件图标
4. 点击"提取帖子"按钮
5. 查看提取结果
6. 可选择导出为 JSON 或 CSV 格式

## 数据字段说明

| 字段 | 说明 | 示例 |
|------|------|------|
| index | 序号 | 1 |
| postId | 帖子ID | 694c81b4000000000d037ed5 |
| coverImage | 封面图URL | https://sns-webpic-qc.xhscdn.com/... |
| title | 帖子标题 | 小米17ultra的LOFIC技术只能4k30吗？ |
| author | 发布者名称 | 科技数码 |
| authorAvatar | 发布者头像URL | https://sns-avatar-qc.xhscdn.com/... |
| likeCount | 点赞数 | 1234 |
| postLink | 帖子链接 | https://www.xiaohongshu.com/explore/... |
| publishTime | 发布时间 | 未知（页面DOM中未显示） |

## 注意事项

1. **发布时间**：小红书探索页面的 DOM 结构中没有直接显示发布时间，因此该字段默认为"未知"。如果需要获取发布时间，可能需要：
   - 点击进入每个帖子详情页
   - 或者分析网络请求中的数据

2. **动态加载**：插件会监听页面变化，当有新帖子加载时会自动更新。

3. **权限**：插件需要访问 `https://www.xiaohongshu.com/*` 的权限。

## 技术实现

### DOM 选择器

- 帖子容器：`.note-item`
- 封面图：`.cover img`
- 标题：`.footer .title span`
- 发布者：`.author-wrapper .author .name`
- 发布者头像：`.author-wrapper .author .author-avatar img`
- 点赞数：`.author-wrapper .like-wrapper .count`

### 文件结构

```
xhs_discover/
├── manifest.json      # 插件配置文件
├── content.js         # 内容脚本，负责提取数据
├── popup.html         # 弹出页面HTML
├── popup.js           # 弹出页面逻辑
├── icon16.png         # 16x16 图标（可选）
├── icon48.png         # 48x48 图标（可选）
├── icon128.png        # 128x128 图标（可选）
└── README.md          # 说明文档
```

## 开发建议

如果需要进一步完善功能，可以考虑：

1. **获取发布时间**：
   - 拦截网络请求，从 API 响应中获取完整数据
   - 或点击每个帖子进入详情页提取时间

2. **批量下载**：
   - 添加批量下载封面图功能
   - 添加批量下载视频功能

3. **数据过滤**：
   - 添加按点赞数筛选功能
   - 添加按发布时间筛选功能

4. **自动翻页**：
   - 自动滚动加载更多帖子
   - 自动提取所有页面的数据

## 许可证

MIT License
