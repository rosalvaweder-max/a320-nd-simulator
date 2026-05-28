import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import { FlightPlanProvider } from './context/FlightPlanContext.js';
import { VORManagerProvider } from './context/VORManagerContext.js';

// 挂载 React 应用根节点
// 使用 StrictMode 启用严格模式检查
// FlightPlanProvider 提供飞行计划全局状态
// VORManagerProvider 提供 VOR 导航台管理全局状态
ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(React.StrictMode, null,
    React.createElement(FlightPlanProvider, null,
      React.createElement(VORManagerProvider, null,
        React.createElement(App)
      )
    )
  )
);