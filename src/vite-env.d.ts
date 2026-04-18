/// <reference types="vite/client" />

// 声明CSS模块
declare module '*.css' {
  const content: Record<string, string>
  export default content
}

// 声明Vue组件
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, unknown>
  export default component
}
