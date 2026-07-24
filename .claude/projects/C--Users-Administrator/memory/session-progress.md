---
name: session-week1-features
description: 第 1 周已完成三个新功能开发，下次继续第 2 周内容
metadata: 
  node_type: memory
  type: project
  originSessionId: 49c5845b-5a0e-4583-a47b-2fa716e6363f
  modified: 2026-07-24T02:55:50.698Z
---

## 已完成（第 1 周）
- 功能一：BMI 趋势折线图（Chart.js 折线图 + 颜色分区背景）
- 功能二：收藏常用食物（localStorage 增删改查 + 星标切换）
- 功能三：一键导出营养报告（数据整合 + 剪贴板 API）

## 下次继续
第 2 周内容：Skills 创建 + 项目结构化。建议先做：
1. 用 `/web-app` skill 创建一个新项目（如番茄钟或记账本）
2. 练习 Git 操作（add/commit/push）
3. 学习 Workflow 和 Agent 的基本使用

## 文件说明
- `index.html` — 主页面（含趋势图、收藏按钮、导出按钮）
- `assets/main.js` — 全部 JavaScript 逻辑
- `assets/chart.umd.min.js` — Chart.js 图表库
- `.claude/skills/web-app.md` — 已创建的 web-app skill