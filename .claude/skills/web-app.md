---
name: web-app
description: 创建网页应用时的通用指南：使用纯 HTML/CSS/JS，移动端优先，数据与视图分离
---

# Web 应用开发指南

## 技术栈
- 纯 HTML + CSS + JavaScript（不依赖框架）
- 数据文件与视图文件分离（如 data.js + index.html）
- 使用 CDN 加载必要库（如 Chart.js）

## 风格要求
- 移动端优先，响应式设计
- 柔和的渐变背景，毛玻璃效果
- 圆角卡片布局
- 中文友好字体栈

## 项目结构
```
project/
├── index.html    # 主页面
├── data.js       # 数据文件
└── assets/       # 静态资源