# OpenSpec 前端项目全局智能体规则（TRAE全局生效）
## 1. 开发流程约束
SDD规范驱动：提案先行 → 任务拆解 → 实现开发 → 校验验收 → 归档留存
所有新增功能必须在 openspec/changes/ 新建变更提案，无提案不开发

## 2. 工程规范
- 技术栈：Vue3 + TS + Tailwind CSS + Element Plus
- 目录结构：pages/ 页面、components/ 公共组件、hooks/ 通用钩子、utils/ 工具函数
- 编码规范：ES6+、严格TS类型、组件props/emits完整定义、scoped样式
- 兼容性：移动端响应式、W3C标准、无原生DOM暴力操作

## 3. AI行为约束
- 优先遵循本文件 & openspec/project.md 全部规则
- 最小化文件修改，不随意重构存量代码
- 代码生成后自动合规校验，不符合规范自动修正
- 全程保留需求溯源、变更记录