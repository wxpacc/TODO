# AGENTS 文档 - AI助手开发指南

本文档为AI助手（如Claude、GPT等）提供项目开发指南，帮助AI更好地理解和维护本项目。

## 📋 项目概述

**项目名称**: TODO应用  
**项目类型**: 纯前端Web应用  
**技术栈**: HTML5 + CSS3 + JavaScript (ES6+)  
**数据存储**: LocalStorage  
**PWA支持**: 是  

### 项目定位
一个功能完整、现代化的TODO管理Web应用，强调：
- 纯前端实现，无需后端
- 数据隐私优先（本地存储）
- PWA支持（离线可用）
- 开箱即用（无需注册）

## 🏗️ 架构设计

### 整体架构
```
┌─────────────────────────────────────────┐
│           用户界面 (UI Layer)            │
│  - 任务列表/看板视图                      │
│  - 表单输入                              │
│  - 模态框                                │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         应用逻辑 (App Layer)             │
│  - 事件绑定                              │
│  - 状态管理                              │
│  - 业务流程                              │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│        业务模块 (Module Layer)           │
│  - TaskManager (任务管理)                │
│  - CategoryManager (分类管理)            │
│  - TemplateManager (模板管理)            │
│  - FilterManager (过滤搜索)              │
│  - NotificationManager (通知管理)        │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│       数据存储 (Storage Layer)           │
│  - LocalStorage API                      │
│  - 数据序列化/反序列化                    │
│  - 数据导入/导出                          │
└─────────────────────────────────────────┘
```

### 模块依赖关系
```
app.js
  ├── ui.js (UI交互)
  ├── task.js (任务管理)
  │   └── storage.js (数据存储)
  ├── filter.js (过滤搜索)
  │   └── storage.js
  ├── notification.js (通知管理)
  │   └── task.js
  └── storage.js (基础存储)
```

## 📂 文件结构说明

### HTML文件
- `index.html`: 主页面，包含所有UI结构

### CSS文件
- `css/style.css`: 主样式文件
  - 全局样式和变量
  - 组件样式
  - 动画效果
  
- `css/themes.css`: 主题样式
  - 亮色主题
  - 暗色主题
  - 主题切换逻辑
  
- `css/responsive.css`: 响应式样式
  - 移动端适配
  - 平板适配
  - 桌面端优化

### JavaScript文件

#### 核心文件
- `js/app.js`: 应用主逻辑
  - 初始化应用
  - 事件绑定
  - 业务流程控制
  - 状态管理
  
- `js/storage.js`: 数据存储模块
  - LocalStorage操作封装
  - 数据导入/导出
  - 数据验证
  
- `js/ui.js`: UI交互模块
  - DOM操作
  - 事件处理
  - 界面渲染
  - Toast提示

#### 业务模块
- `js/task.js`: 任务管理模块
  - TaskManager: 任务CRUD操作
  - CategoryManager: 分类管理
  - TemplateManager: 模板管理
  - 子任务管理
  - 重复任务处理
  
- `js/filter.js`: 过滤搜索模块
  - FilterManager: 过滤和排序
  - 搜索功能
  - 多维度过滤
  
- `js/notification.js`: 通知管理模块
  - NotificationManager: 浏览器通知
  - 提醒检查
  - 权限管理

### PWA文件
- `manifest.json`: PWA配置
  - 应用名称
  - 图标
  - 主题色
  
- `service-worker.js`: Service Worker
  - 缓存策略
  - 离线支持

## 🗃️ 数据模型

### 任务对象 (Task)
```javascript
{
  id: string,              // 唯一标识符
  title: string,           // 任务标题
  description: string,     // 任务描述
  completed: boolean,      // 完成状态
  status: 'todo' | 'in-progress' | 'completed',  // 任务状态
  priority: 'high' | 'medium' | 'low',  // 优先级
  category: string,        // 分类ID
  tags: string[],          // 标签数组
  dueDate: string,         // 截止日期 (YYYY-MM-DD)
  recurrence: string,      // 重复规则
  reminder: string,        // 提醒时间（分钟）
  subtasks: Subtask[],     // 子任务数组
  createdAt: string,       // 创建时间 (ISO 8601)
  updatedAt: string        // 更新时间 (ISO 8601)
}
```

### 子任务对象 (Subtask)
```javascript
{
  id: string,              // 唯一标识符
  title: string,           // 子任务标题
  completed: boolean,      // 完成状态
  createdAt: string        // 创建时间
}
```

### 分类对象 (Category)
```javascript
{
  id: string,              // 唯一标识符
  name: string,            // 分类名称
  color: string,           // 颜色 (HEX)
  createdAt: string        // 创建时间
}
```

### 模板对象 (Template)
```javascript
{
  id: string,              // 唯一标识符
  name: string,            // 模板名称
  description: string,     // 模板描述
  icon: string,            // 图标 (emoji)
  tasks: TaskTemplate[],   // 任务模板数组
  isDefault: boolean       // 是否为默认模板
}
```

## 🔑 核心功能实现

### 1. 任务管理
**文件**: `js/task.js`

**主要方法**:
- `TaskManager.create(taskData)`: 创建任务
- `TaskManager.update(id, updates)`: 更新任务
- `TaskManager.delete(id)`: 删除任务
- `TaskManager.toggleComplete(id)`: 切换完成状态
- `TaskManager.addSubtask(taskId, title)`: 添加子任务

**注意事项**:
- 所有任务操作都会自动更新 `updatedAt` 字段
- 重复任务完成时会自动创建新实例
- 删除分类时会清空相关任务的分类字段

### 2. 数据存储
**文件**: `js/storage.js`

**LocalStorage Keys**:
- `todo_tasks`: 任务列表
- `todo_categories`: 分类列表
- `todo_theme`: 主题设置
- `todo_templates`: 自定义模板

**注意事项**:
- 所有数据使用JSON序列化
- 导入数据时会进行验证
- 数据变更立即保存

### 3. 过滤搜索
**文件**: `js/filter.js`

**过滤维度**:
- 关键词搜索（标题、描述、标签）
- 分类过滤
- 优先级过滤
- 状态过滤
- 组合过滤

**排序方式**:
- 创建时间（升序/降序）
- 截止日期（升序/降序）
- 优先级（高到低/低到高）

### 4. 视图切换
**文件**: `js/ui.js`, `js/app.js`

**视图类型**:
- 列表视图 (`list`): 传统列表展示
- 看板视图 (`board`): 三列看板

**状态管理**:
- `UI.currentView`: 当前视图状态
- 切换视图时重新渲染任务

### 5. 通知提醒
**文件**: `js/notification.js`

**提醒检查**:
- 每分钟检查一次即将到期的任务
- 根据提醒设置提前通知
- 需要用户授权通知权限

**注意事项**:
- 仅在浏览器支持时启用
- 用户可拒绝通知权限
- 后台运行时可能受限

### 6. 拖拽排序
**文件**: `js/app.js`

**实现方式**:
- HTML5 Drag and Drop API
- 拖拽时添加视觉反馈
- 放置时更新任务顺序

**注意事项**:
- 仅在列表视图支持
- 触摸设备需要额外处理

## 🎨 UI/UX规范

### 颜色系统
```css
--primary-color: #3498db;      /* 主色 */
--primary-hover: #2980b9;      /* 主色悬停 */
--secondary-color: #95a5a6;    /* 次要色 */
--success-color: #27ae60;      /* 成功色 */
--danger-color: #e74c3c;       /* 危险色 */
--warning-color: #f39c12;      /* 警告色 */
```

### 主题变量
```css
/* 亮色主题 */
--bg-primary: #ffffff;
--bg-secondary: #f8f9fa;
--text-primary: #2c3e50;
--text-secondary: #7f8c8d;
--border-color: #e0e0e0;

/* 暗色主题 */
--bg-primary: #1a1a2e;
--bg-secondary: #16213e;
--text-primary: #eaeaea;
--text-secondary: #b0b0b0;
--border-color: #2d2d44;
```

### 响应式断点
- 移动端: `max-width: 480px`
- 平板: `max-width: 768px`
- 桌面: `min-width: 769px`

### 动画规范
- 过渡时间: `0.3s`
- 缓动函数: `ease`
- 动画类型: 淡入淡出、滑动

## 🚀 开发指南

### 添加新功能
1. 确定功能所属模块
2. 在相应模块文件中添加方法
3. 更新UI渲染逻辑
4. 添加事件绑定
5. 测试功能
6. 更新文档

### 修改现有功能
1. 阅读相关模块代码
2. 理解数据流和依赖关系
3. 进行修改
4. 测试相关功能
5. 更新文档

### 添加新的数据字段
1. 更新数据模型定义
2. 修改创建/更新方法
3. 更新UI渲染
4. 考虑数据迁移（旧数据兼容）
5. 更新导入/导出逻辑

### 调试技巧
1. 使用浏览器开发者工具
2. 检查LocalStorage数据
3. 查看控制台日志
4. 使用断点调试
5. 检查网络请求（PWA缓存）

## ⚠️ 注意事项

### 数据安全
- 所有数据存储在LocalStorage
- 数据未加密
- 建议定期导出备份
- 清除浏览器数据会丢失所有数据

### 浏览器兼容性
- 需要支持ES6+
- 通知功能需要浏览器支持
- PWA功能需要HTTPS（本地开发除外）
- Service Worker需要浏览器支持

### 性能考虑
- 大量任务时考虑虚拟滚动
- 避免频繁的DOM操作
- 使用事件委托
- 合理使用防抖和节流

### 代码规范
- 使用const/let，避免var
- 函数命名使用动词开头
- 变量命名使用名词
- 添加必要的注释
- 保持代码简洁

## 📚 扩展阅读

### 相关文档
- [README.md](./README.md): 项目说明
- [IMPROVEMENT_SUGGESTIONS.md](./IMPROVEMENT_SUGGESTIONS.md): 改进建议

### 技术文档
- [LocalStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Notification API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [Drag and Drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)

## 🤝 AI助手使用建议

### 理解项目
1. 首先阅读README.md了解项目概况
2. 查看AGENTS.md理解架构设计
3. 阅读关键代码文件（app.js, task.js, ui.js）
4. 理解数据模型和业务逻辑

### 开发任务
1. 明确需求和技术方案
2. 确定涉及的模块和文件
3. 遵循现有代码风格
4. 保持模块化和可维护性
5. 测试功能完整性
6. 更新相关文档

### 代码审查
1. 检查代码规范
2. 验证功能正确性
3. 检查性能影响
4. 确保向后兼容
5. 检查文档完整性

### 问题排查
1. 检查浏览器控制台错误
2. 验证数据完整性
3. 检查事件绑定
4. 验证业务逻辑
5. 检查浏览器兼容性

## 📝 更新日志

### v2.0.0 (2026-04-05)
- 创建AGENTS文档
- 完善项目架构说明
- 添加开发指南

---

**最后更新**: 2026-04-05  
**维护者**: AI Assistant
