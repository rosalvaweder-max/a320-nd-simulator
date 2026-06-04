# A320 ND 模拟器 — 项目完整介绍

## 一、项目概述

这是一个基于网页的 **A320 导航显示器（ND）模拟器**，使用纯前端技术（React 19 + Vite 5 + Canvas 2D）实现。它模拟了空客 A320 飞机 EFIS 系统的 ND 显示功能，支持五种显示模式、飞行计划管理、VOR 导航引导等功能，可作为航空电子设备教学的低成本辅助工具。

**在线演示：** [https://rosalvaweder-max.github.io/a320-nd-simulator/](https://rosalvaweder-max.github.io/a320-nd-simulator/)

---

## 二、项目框架与文件结构

```
根目录/
├── index.html                  # 入口HTML，加载React CDN + Tailwind CSS
├── index.js                    # JS入口，挂载React应用
├── App.js                      # 主组件：状态管理 + 物理引擎 + UI布局
├── constants.js                # 全局常量：颜色、模式、航路点等
├── vite.config.js              # Vite构建配置（base路径、端口、插件）
├── package.json                # 依赖配置
│
├── components/                 # React组件层
│   ├── NDDisplay.js            # ★ 核心：Canvas ND显示（所有模式的渲染）
│   ├── EFISPanel.js            # EFIS控制面板（模式/范围旋钮、VOR调谐、按钮）
│   ├── Knob.js                 # 选择旋钮（模式/范围切换）
│   ├── ContinuousKnob.js       # 连续旋钮（频率/航道调节）
│   ├── FlightPlanManager.js    # 航路管理器（弹窗）
│   ├── RouteList.js            # 航路列表
│   ├── RouteEditor.js          # 航路编辑器
│   ├── WaypointEditor.js       # 航路点编辑器
│   └── MapLoader.js            # 自定义地图加载器
│
├── context/                    # React Context（全局状态）
│   ├── FlightPlanContext.js    # 航路数据管理（CRUD + localStorage持久化）
│   └── VORManagerContext.js    # VOR台管理（自动/手动调谐 + 持久化）
│
├── services/                   # 服务层
│   └── MapDataService.js       # 地图数据加载/解析/验证
│
├── utils/                      # 工具函数
│   └── drawingUtils.js         # ★ Canvas绘图工具（所有ND符号绘制函数）
│
├── data/                       # 数据文件
│   ├── default-route-map.json  # 默认航路地图
│   ├── europe-map.json         # 欧洲区域地图
│   └── map-template.json       # 地图JSON模板
│
├── .github/workflows/          # CI/CD
│   └── deploy.yml              # GitHub Actions自动部署到GitHub Pages
│
└── _docs/                      # 论文文档（不影响部署）
```

---

## 三、核心功能实现方式

### 3.1 五种 ND 显示模式

| 模式 | 实现位置 | 核心逻辑 |
|------|---------|---------|
| **ROSE NAV** | `components/NDDisplay.js:199` | 全方位导航，飞机居中，航向朝上，显示航路/航点 |
| **ROSE ILS** | `components/NDDisplay.js:772` | 仪表着陆系统，显示LOC/G/S偏差，调用 `drawILSInterface` |
| **ROSE VOR** | `components/NDDisplay.js:815` | VOR导航，显示航道指针/偏差杆，调用 `drawVORInterface` |
| **ARC** | `components/NDDisplay.js:189` | 扇形模式，飞机在底部，显示前方90°区域，`screenOriginY = height * 0.85` |
| **PLAN** | `components/NDDisplay.js:180` | 计划模式，真北向上，地图静态，飞机符号随位置移动 |

### 3.2 Canvas 渲染管线

ND 显示使用 **Canvas 2D API** 进行逐帧渲染，渲染流程在 `NDDisplay.js:327` 的 `draw()` 函数中：

```
1. 清空画布
   → 2. 裁剪蒙版（ARC模式扇形裁剪）
   → 3. 应用地图变换（平移+旋转）
   → 4. 绘制地形/天气雷达
   → 5. 绘制地图背景（航路点/航路）
   → 6. 绘制飞行计划路径（含转弯圆弧）
   → 7. 绘制VOR台
   → 8. 绘制飞机符号
   → 9. 恢复变换
   → 10. 绘制罗盘/范围圈
   → 11. 绘制航向游标/航迹指针
   → 12. 绘制ILS/VOR界面
   → 13. 绘制数据块（GS/TAS/风向/下一航点）
```

使用 `requestAnimationFrame` 驱动渲染循环（`NDDisplay.js:1063`），确保60fps流畅动画。

### 3.3 物理引擎（自动飞行）

在 `App.js:189` 中实现了一个完整的 **2D 飞行物理引擎**：

- **直线飞行：** 飞机沿航路段直线飞行，速度 = GS（地速）
- **转弯逻辑：** 到达航路点时，按标准速率转弯（3°/s），遵循**飞越转弯（fly-over turn）** 的圆形弧线轨迹
- **转弯几何：** 计算转弯半径 `r = V / (ω × 3600)`，弧心位于航路点垂直方向
- **航路循环：** 到达最后一个航路点后自动循环回起点

### 3.4 坐标系系统

在 `NDDisplay.js:164` 的 `coordinateSystem` 中定义：

```
世界坐标 (NM) → 屏幕坐标 (px)
  x_screen = (x_world - mapCenterX) * pxPerNM
  y_screen = -(y_world - mapCenterY) * pxPerNM  (Y轴翻转)
```

- **pxPerNM**：每海里像素数，ROSE模式 = `height * 0.45 / range`，ARC模式 = `430 / range`
- **mapRotation**：地图旋转角度，Heading Up模式 = `-heading`，PLAN模式 = `0`

### 3.5 罗盘与范围圈

- **罗盘半径：** ARC模式 = `range * pxPerNM`（最大430px），ROSE模式 = `height * 0.38`（约228px）
- **范围圈：** ARC模式绘制三个扇形弧（0.75/0.5/0.25倍范围），非ARC模式绘制一个圆环（50%罗盘半径）
- **罗盘绘制：** `drawCompassRose` 绘制刻度线、数字标签、N/S/E/W标识

### 3.6 VOR 导航系统

VOR 模式在 `NDDisplay.js:815` 实现，分五个阶段：

1. **VOR台选择：** 优先级：航路VOR → 手动调谐 → 自动调谐 → 最近VOR
2. **方位计算：** `bearingToVOR = (90 - atan2(dy, dx) × 180/π + 360) % 360`
3. **航道偏差：** `deviation = aircraftRadial - selectedCourse`，负值表示飞机在航道左侧
4. **TO/FROM判断：** 航向与VOR方位差 < 90° 为 TO 模式
5. **渲染：** 调用 `drawVORInterface` 绘制航道指针、偏差杆、TO/FROM标识

VOR调谐状态通过 `VORManagerContext` 管理，支持 AUTO/MANUAL 两种模式，数据持久化到 localStorage。

### 3.7 飞行计划管理

通过 `FlightPlanContext` 提供完整的 CRUD 操作：

- 创建/编辑/删除航路
- 添加/编辑/删除/排序航路点
- 激活主航路和备用航路
- 航路点类型：FIX、VOR、NDB、AIRPORT
- `isConnected` 属性控制是否连线（VOR台可设为不连线）
- 数据持久化到 localStorage

### 3.8 自定义地图加载

`MapLoader` 组件支持：
- 从 URL 加载 JSON 地图文件
- 从本地文件加载
- 从地图中选择航路点创建航路
- 预加载示例地图（欧洲区域）

地图数据通过 `MapDataService` 进行加载、验证和标准化。

### 3.9 EFIS 控制面板

`EFISPanel` 模拟真实 A320 EFIS 控制面板：
- **模式旋钮：** ILS → VOR → NAV → ARC → PLAN
- **范围旋钮：** 10/20/40/80/160/320 NM
- **VOR调谐：** AUTO/MANUAL 切换 + 频率旋钮
- **CRS航道选择：** 连续旋钮调节
- **功能按钮：** TERR（地形）、WXR（天气雷达）、CHRO（计时器）、FAIL（故障模拟）

### 3.10 部署流程

`.github/workflows/deploy.yml` 配置了 GitHub Actions 自动部署：
- 触发条件：推送到 `main` 分支
- 构建：`npm ci` → `npm run build`
- 发布：`peaceiris/actions-gh-pages@v3` 将 `./dist` 部署到 GitHub Pages
- 基础路径：`/a320-nd-simulator/`（配置在 `vite.config.js:8`）

---

## 四、数据流架构

```
用户操作 (EFIS面板)
    ↓
App.js (状态提升)
    ├── mode / range → NDDisplay.js (渲染)
    ├── aircraft state → NDDisplay.js (飞机位置)
    ├── toggleTerrain/Weather/Chrono/Failure → systemState
    ↓
FlightPlanContext (航路数据)
    ├── activeRoute → NDDisplay.js (绘制航路)
    ├── secondaryRoute → NDDisplay.js (备用航路)
    └── mapData → NDDisplay.js (地图背景)
    ↓
VORManagerContext (VOR数据)
    ├── vorStations → NDDisplay.js (VOR台绘制)
    ├── tuningState → EFISPanel.js (调谐UI)
    └── getActiveVORStation() → NDDisplay.js (VOR模式)
    ↓
Canvas 2D (最终渲染)
    └── drawingUtils.js (所有绘图函数)
```

---

## 五、关键技术点

| 技术 | 说明 |
|------|------|
| **React 19** | 使用 `useState`/`useEffect`/`useRef`/`useMemo`/`useCallback` 管理状态和性能优化 |
| **Canvas 2D** | 所有 ND 显示通过 Canvas API 绘制，`requestAnimationFrame` 驱动渲染循环 |
| **无 JSX** | 全部使用 `React.createElement` 而非 JSX 语法 |
| **CSS** | Tailwind CSS（CDN）+ 内联样式 |
| **物理引擎** | 2D 飞行模拟，含标准速率转弯的圆形弧线轨迹 |
| **持久化** | localStorage 存储航路数据和 VOR 调谐状态 |
| **CI/CD** | GitHub Actions 自动构建部署到 GitHub Pages |
| **模块化** | ES Module 架构，importmap 解析 React CDN 依赖 |

---

## 六、各文件详细说明

### 6.1 入口文件

| 文件 | 说明 |
|------|------|
| `index.html` | HTML入口，通过CDN引入React 19、Tailwind CSS、Google Fonts（Inconsolata），使用importmap解析模块依赖 |
| `index.js` | JS入口，创建React根节点，包裹FlightPlanProvider和VORManagerProvider两个Context |
| `vite.config.js` | Vite配置：base路径设为`/a320-nd-simulator/`（适配GitHub Pages），开发服务器端口3000，配置React插件和路径别名 |
| `package.json` | 项目依赖：React 19、Vite 5、docx/mammoth等文档处理库 |

### 6.2 常量定义

| 文件 | 说明 |
|------|------|
| `constants.js` | 定义所有全局常量：空客标准颜色（MAGENTA/CYAN/GREEN/YELLOW等）、ND模式枚举、范围设置、字体规格、符号尺寸、显示常量、导航常量、模拟航路点（LFPG/EGLL等） |

### 6.3 核心组件

| 文件 | 说明 |
|------|------|
| `App.js` | 主应用组件，约880行。职责包括：(1) 管理全局状态（mode/range/systemState/aircraft）；(2) 实现2D飞行物理引擎（直线飞行+标准速率转弯）；(3) 自动VOR调谐；(4) 模式切换教学弹窗；(5) 布局编排（ND显示+控制面板+遥测数据） |
| `NDDisplay.js` | 最核心组件，约1100行。职责包括：(1) Canvas 2D渲染所有ND显示内容；(2) 五种模式的不同渲染逻辑；(3) 坐标系变换（世界坐标→屏幕坐标）；(4) 罗盘/范围圈/航路/VOR/ILS界面绘制；(5) 使用`requestAnimationFrame`驱动60fps渲染循环 |
| `EFISPanel.js` | EFIS控制面板组件，约450行。模拟真实A320面板外观，包含模式旋钮、范围旋钮、VOR调谐（AUTO/MANUAL）、CRS航道选择、TERR/WXR/CHRO/FAIL功能按钮 |
| `Knob.js` | 选择旋钮组件，用于模式切换（ILS/VOR/NAV/ARC/PLAN）和范围选择（10/20/40/80/160/320），带指针指示当前选中项 |
| `ContinuousKnob.js` | 连续旋钮组件，用于VOR频率调节和CRS航道选择。支持鼠标拖拽、点击增减、滚轮操作，带刻度线和指针动画 |
| `FlightPlanManager.js` | 航路管理器弹窗，管理航路的创建、编辑、删除，切换主航路/备用航路 |
| `RouteList.js` | 航路列表组件，显示所有航路卡片，支持激活/设为备用/编辑/删除操作 |
| `RouteEditor.js` | 航路编辑器，管理航路点列表，支持添加/编辑/删除/排序航路点 |
| `WaypointEditor.js` | 航路点编辑器弹窗，设置航路点名称、类型（FIX/VOR/NDB）、坐标、连线状态、高度限制 |
| `MapLoader.js` | 自定义地图加载器，支持URL加载、文件上传、示例地图加载，可从地图中选择航路点创建航路 |

### 6.4 Context（全局状态管理）

| 文件 | 说明 |
|------|------|
| `FlightPlanContext.js` | 航路数据管理Context，约314行。提供完整的航路CRUD操作，数据持久化到localStorage，支持版本控制（版本不匹配时重置为默认数据），包含地图数据加载功能 |
| `VORManagerContext.js` | VOR台管理Context，约183行。管理6个默认VOR台（GOW/DOO/OOD/BIG/LAM/CDG），支持AUTO/MANUAL两种调谐模式，提供最近VOR查找、频率查找、ID查找等功能，数据持久化到localStorage |

### 6.5 服务层

| 文件 | 说明 |
|------|------|
| `MapDataService.js` | 地图数据服务，约244行。负责从URL或文件加载JSON地图数据，进行数据验证和标准化，支持航路点、导航设施、航路数据的解析 |

### 6.6 工具函数

| 文件 | 说明 |
|------|------|
| `drawingUtils.js` | Canvas绘图工具库，约867行。包含所有ND符号绘制函数：飞机符号（黄色"士"字形）、罗盘刻度、GS/TAS数据显示、风向风速指示、航路点信息、ILS界面（LOC/G/S偏差杆）、VOR界面（航道指针/偏差杆/TO-FROM指示器）、航迹指针、方位指针、导航台信息、TCAS目标、地形显示、天气雷达等 |

### 6.7 数据文件

| 文件 | 说明 |
|------|------|
| `data/default-route-map.json` | 默认航路地图数据 |
| `data/europe-map.json` | 欧洲区域示例地图，包含多个航路点和航路 |
| `data/map-template.json` | 地图JSON模板文件，供用户参考格式 |

### 6.8 CI/CD

| 文件 | 说明 |
|------|------|
| `.github/workflows/deploy.yml` | GitHub Actions工作流，在推送到main分支时自动执行：`npm ci`安装依赖 → `npm run build`构建 → 使用`peaceiris/actions-gh-pages@v3`将`./dist`目录部署到GitHub Pages |

---

## 七、开发指南

### 7.1 本地运行

```bash
# 安装依赖
npm install

# 启动开发服务器（端口3000）
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

### 7.2 部署

推送到 `main` 分支即可触发 GitHub Actions 自动部署：

```bash
git add .
git commit -m "更新说明"
git push origin main
```

### 7.3 扩展指南

- **添加新模式：** 在 `constants.js` 的 `ND_MODES` 中添加枚举，在 `NDDisplay.js` 的 `draw()` 中添加渲染分支
- **添加新航路点：** 在 `constants.js` 的 `MOCK_WAYPOINTS` 中添加，或通过UI中的航路管理器添加
- **添加VOR台：** 在 `VORManagerContext.js` 的 `DEFAULT_VOR_STATIONS` 中添加
- **修改颜色方案：** 在 `constants.js` 的 `COLORS` 对象中修改
