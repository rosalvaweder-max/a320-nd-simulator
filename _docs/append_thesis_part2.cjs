const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '毕业论文-基于网页的飞机导航显示器模拟器开发.md');

const content = `）、填充样式（\`fillStyle\`）、线宽（\`lineWidth\`）、变换矩阵（\`transform\`）等。
3. **定义路径：** 使用\`beginPath()\`、\`moveTo()\`、\`lineTo()\`、\`arc()\`等方法定义绘图路径。
4. **执行绘制：** 使用\`stroke()\`或\`fill()\`方法执行实际绘制。
5. **状态保存与恢复：** 使用\`save()\`与\`restore()\`方法管理绘图状态栈。

在本系统中，Canvas 2D API被广泛应用于ND画面的各个元素绘制。比如罗盘玫瑰的绘制（[`drawCompassRose`](utils/drawingUtils.js:57)）用\`ctx.arc()\`画同心圆环，用\`ctx.rotate()\`实现刻度线的角度旋转；飞机符号的绘制（[`drawAircraftSymbol`](utils/drawingUtils.js:6)）用\`ctx.moveTo()\`和\`ctx.lineTo()\`定义飞机轮廓路径；ILS偏差指示器（[`drawILSInterface`](utils/drawingUtils.js:230)）用\`ctx.strokeRect()\`画偏差刻度尺，用自定义的\`drawDiamond\`函数画偏差菱形指示符。

#### 3.2.2 Canvas坐标变换与投影

ND显示器的核心挑战之一，是把地理坐标（经纬度或笛卡尔坐标）映射到屏幕像素坐标。本系统采用**等距方位投影**（Azimuthal Equidistant Projection），以飞机当前位置为投影中心，把世界坐标转换成以飞机为中心的屏幕坐标：

\`\`\`javascript
const worldToScreen = (wx, wy, acX, acY, heading, pxPerNM) => {
  const dx = wx - acX;
  const dy = wy - acY;
  const rad = heading * Math.PI / 180;
  const rx = dx * Math.cos(rad) + dy * Math.sin(rad);
  const ry = -dx * Math.sin(rad) + dy * Math.cos(rad);
  return { sx: rx * pxPerNM, sy: -ry * pxPerNM };
};
\`\`\`

这个投影变换先把世界坐标平移到飞机位置，然后根据当前航向做旋转，最后乘以像素/海里比例因子完成缩放。\`pxPerNM\`的值根据当前选的显示范围动态计算，比如在40NM范围内，\`pxPerNM = compassRadius / 40\`。

另外，ARC模式用了特殊的**弧形视口坐标变换**，把世界坐标投影到前方大约100°的扇形显示区域内。这个变换通过计算航路点相对于飞机的位置角度，判断它是不是在扇形视口范围内，再通过极坐标到屏幕坐标的映射完成绘制。

#### 3.2.3 Canvas性能优化策略

Canvas 2D渲染的性能瓶颈主要来自三个方面：第一，大量绘图调用导致的CPU开销；第二，像素操作（比如getImageData/putImageData）的内存带宽消耗；第三，Canvas尺寸太大导致的GPU内存压力。

针对这些瓶颈，本系统在[`utils/RenderingOptimizer.js`](utils/RenderingOptimizer.js:1)中实现了三级性能优化策略：

- **显示列表缓存（Display List）：** 把静态内容（比如罗盘玫瑰、范围环）的渲染指令缓存到离屏Canvas，避免每帧重复执行相同的绘图操作。当内容发生变化时（比如航向更新），通过\`markDirty()\`机制标记缓存失效并重新生成。
- **脏矩形管理（Dirty Rectangle Manager）：** 只重绘发生变化的区域，而不是整个Canvas。比如当飞机位置更新时，只需要重绘飞机符号周围的局部区域，不用重绘整个ND画面。
- **空间索引（Spatial Index）：** 基于网格划分实现高效的空间查询，把航路点、导航台等元素的碰撞检测和可见性判断的查询复杂度从O(n)降到O(1)。

此外，本系统用\`requestAnimationFrame\`驱动动画循环（[`NDDisplay.js`](components/NDDisplay.js:1042)的\`animate\`函数），确保渲染和浏览器刷新率同步，避免不必要的CPU消耗。

### 3.3 React状态管理与组件通信

#### 3.3.1 Context API与状态共享

本系统采用React Context API实现跨组件的状态共享，避免了多层props传递（prop drilling）的问题。系统定义了两个核心Context Provider：

**（1）FlightPlanContext**（[`context/FlightPlanContext.js`](context/FlightPlanContext.js:32)）

负责管理飞行计划相关的全局状态，包括航路列表（\`routes\`）、当前启动航路（\`activeRouteId\`）、备用航路（\`secondaryRouteId\`）以及地图数据（\`mapData\`）。提供\`addRoute\`、\`updateRoute\`、\`deleteRoute\`、\`setActiveRoute\`等操作方法，供飞行计划管理组件和ND显示组件共同使用。

**（2）VORManagerContext**（[`context/VORManagerContext.js`](context/VORManagerContext.js:22)）

负责管理VOR导航相关的全局状态，包括VOR台列表（\`vorStations\`）、调谐状态（\`tuningState\`，包含调谐模式\`auto/manual\`、频率、选中台站、航道角度等）。提供\`autoTune\`、\`manualTune\`、\`setCourse\`等操作方法，供EFIS控制面板和ND显示组件共同使用。

#### 3.3.2 组件树与数据流

本系统的React组件树结构遵循单向数据流原则，数据从顶层Provider向下流动，用户操作通过回调函数向上传递：

\`\`\`
<App>
  ├── <FlightPlanProvider>          // 飞行计划状态管理
  │   └── <VORManagerProvider>      // VOR状态管理
  │       └── <div.layout>
  │           ├── <NDDisplay />     // ND Canvas显示（接收props渲染画面）
  │           ├── <EFISPanel />     // EFIS控制面板（用户操作入口）
  │           │   ├── <SelectorKnob />     // 模式/范围选择旋钮
  │           │   ├── <ContinuousKnob />   // 连续值旋钮（VOR频率/CRS）
  │           │   └── <AirButton />        // 功能按钮
  │           ├── <FlightPlanManager />    // 飞行计划管理面板
  │           │   ├── <RouteList />        // 航路列表
  │           │   ├── <RouteEditor />      // 航路编辑器
  │           │   └── <WaypointEditor />   // 航路点编辑器
  │           └── <MapLoader />            // 地图加载器
\`\`\`

数据流路径是：用户在EFIS面板操作 → 回调函数更新Context状态 → 状态变化触发NDDisplay组件重新渲染 → Canvas绘制更新后的画面。这种设计确保了数据变更的可预测性和可追踪性。

### 3.4 使用软件介绍

本设计用的软件开发工具是Visual Studio Code（VS Code）。VS Code是Microsoft基于Electron框架开发的轻量级集成开发环境，凭借强大的JavaScript/TypeScript支持和丰富的扩展生态系统，已经成为React等前端框架开发的首选工具，也是本系统开发的首选软件。

VS Code能为JavaScript开发提供上下文感知的代码补全、参数提示和实时文档查看，给代码编写带来了很大便利。比如在写\`import\`语句时，VS Code会根据项目文件结构自动提示可以导入的模块路径。在[`NDDisplay.js`](components/NDDisplay.js:1)中写\`import { drawCompassRose } from\`时，编辑器会自动列出[`utils/drawingUtils.js`](utils/drawingUtils.js:1)中所有导出的函数名称。

VS Code为JavaScript、CSS、HTML等Web前端技术提供了精确的语法高亮功能。对于本系统的React组件，JSX语法中的HTML标签和JavaScript表达式通过不同颜色清晰区分，提升了代码的可读性。Canvas 2D绘图API的链式调用（比如\`ctx.beginPath()\` → \`ctx.moveTo()\` → \`ctx.lineTo()\` → \`ctx.stroke()\`）在语法高亮的辅助下，各方法调用的层次关系一目了然。

VS Code内置的集成终端支持在编辑器内部直接执行命令行操作，不需要切换到外部终端窗口。对于基于Vite的前端项目，开发者可以在集成终端中直接执行\`npm run dev\`启动Vite开发服务器、\`npm run build\`执行生产构建等命令，在开发测试过程中节约了不少时间。

此外，VS Code丰富的扩展生态系统进一步增强了开发效率。ESLint扩展在编辑过程中实时检测JavaScript语法错误和未使用的变量；Prettier扩展提供统一的代码格式化规则，确保整个项目的代码风格一致。Chrome DevTools和React DevTools等浏览器开发者工具配合使用，可以实时查看组件状态变化和Canvas渲染性能，为Canvas绘图函数的调试提供了有效支持。

总的来说，选VS Code作为开发环境，在网页开发和JavaScript前端技术方面能获得很多便利，为本模拟器的开发奠定了环境基础。

### 3.5 本章小结

本章围绕A320导航显示器模拟器的开发，系统性地介绍了采用的核心技术和开发工具。在Web前端技术栈方面，选了React 19作为UI框架，利用它的组件化架构和虚拟DOM机制实现高效的界面渲染；采用Vite 5作为构建工具，借助它快速的HMR能力和优化的构建流程提升开发效率；使用ES Modules规范组织代码，实现模块化的依赖管理。在Canvas 2D渲染技术方面，详细说明了Canvas API的基本绘图机制、坐标变换与投影算法的实现原理，以及显示列表缓存、脏矩形管理和空间索引三级性能优化策略，确保模拟器在复杂场景下维持流畅的帧率。在状态管理方面，采用React Context API实现了飞行计划数据和VOR导航数据的跨组件共享，并设计了清晰的组件树结构与单向数据流。在开发工具方面，选用Visual Studio Code作为集成开发环境，利用它的智能代码补全、语法高亮、集成终端和丰富的扩展生态，为系统的开发与调试提供了高效的工作环境。本章确定的技术方案为后续的系统设计、实现与测试打下了坚实的技术基础。

---

## 第五章 系统详细设计与实现

本章从系统实现的角度，详细说明A320导航显示器模拟器各功能模块的具体实现方案。先介绍网页静态内容的构建方式，包括HTML页面结构、Canvas画布初始化与CSS样式布局；然后说明动态内容的实现机制，涵盖React状态管理、数据流控制与动画循环调度；接着详细分析五种ND显示模式（ROSE NAV、ROSE ILS、ROSE VOR、ARC、PLAN）的Canvas绘制逻辑与实现细节；然后介绍EFIS控制面板的组件化设计与交互实现；最后说明航路管理系统的状态管理与数据服务实现。

### 5.1 网页静态内容的实现

#### 5.1.1 HTML页面结构

本系统采用单页面应用（SPA）架构，所有界面元素通过React动态渲染。入口HTML文件 [`index.html`](index.html:1) 只包含一个根容器元素 \`<div id="root">\`，作为React组件的挂载点。页面标题、视口设置与元数据在HTML头部定义，确保在不同屏幕尺寸下都能正确显示。

HTML页面的核心结构是这样的：\`<head>\`部分设置了字符编码（UTF-8）、视口缩放（\`width=device-width, initial-scale=1.0\`）和页面标题，确保在移动端和桌面端都能正确渲染。\`<body>\`部分只包含 \`<div id="root">\` 容器和 \`<script type="module" src="/index.js">\` 脚本引用，所有UI元素都由React在运行时动态创建并挂载到root容器中。这种极简的HTML结构是SPA架构的典型特征，把页面渲染和交互逻辑完全交给前端框架管理，实现了视图层和数据层的解耦。

#### 5.1.2 Canvas画布初始化

ND显示区域的核心是HTML5 Canvas元素，在 [`components/NDDisplay.js`](components/NDDisplay.js:27) 中创建并初始化：

\`\`\`javascript
// ND显示组件：接收模式、量程、飞机状态、航路数据等属性
const NDDisplay = ({ mode, range, aircraft, activeRoute, secondaryRoute, systemState }) => {
  const canvasRef = useRef(null);  // 获取Canvas DOM元素的引用
  
  // 组件挂载或依赖项（mode/range/aircraft）变化时触发绘制
  useEffect(() => {
    const canvas = canvasRef.current;       // 获取Canvas DOM节点
    const ctx = canvas.getContext('2d');    // 获取2D渲染上下文
    const width = canvas.width;             // 画布宽度（600px）
    const height = canvas.height;           // 画布高度（600px）
    const cx = width / 2;                   // 画布中心X坐标
    const cy = height / 2;                  // 画布中心Y坐标
    const compassRadius = height * 0.45;    // 罗盘半径，占画布高度的45%
    const pxPerNM = compassRadius / range;  // 每海里对应的像素数，用于距离换算
    drawFrame(ctx, width, height, cx, cy, compassRadius, pxPerNM);  // 调用核心绘制函数
  }, [mode, range, aircraft]);              // 依赖项：模式、量程、飞机状态变化时重新绘制
  
  // 创建600×600像素的Canvas元素，用于ND显示区域
  return React.createElement('canvas', {
    ref: canvasRef,       // 绑定Canvas引用
    width: 600,           // 设置画布宽度
    height: 600,          // 设置画布高度
    className: 'nd-canvas' // CSS类名，用于样式控制
  });
};
\`\`\`

Canvas画布尺寸固定为600×600像素，通过CSS进行缩放适配。\`useRef\` 钩子获取Canvas DOM引用，\`useEffect\` 钩子在组件挂载及依赖项变化时触发绘制。在绘制函数中，先计算画布中心坐标（\`cx\`, \`cy\`），然后根据画布高度确定罗盘半径（\`compassRadius = height * 0.45\`），最后通过量程值计算每海里对应的像素数（\`pxPerNM = compassRadius / range\`），这个值决定了地图元素的缩放比例。\`drawFrame\` 函数是ND显示的核心绘制入口，根据当前模式分发到不同的绘制流程。

Canvas的 \`getContext('2d')\` 方法返回Canvas 2D渲染上下文，提供了丰富的绘图API，包括路径绘制（\`beginPath\`、\`moveTo\`、\`lineTo\`）、几何图形（\`arc\`、\`rect\`）、样式设置（\`strokeStyle\`、\`fillStyle\`、\`lineWidth\`）以及坐标变换（\`translate\`、\`rotate\`、\`scale\`）等。本系统充分利用这些API实现罗盘玫瑰、航路点、导航辅助信息等复杂图形的绘制。Canvas 2D的像素级渲染能力使它成为航空仪表模拟的理想选择，能精确控制每一条线的位置和颜色，满足ND显示的高精度要求。

#### 5.1.3 CSS样式布局

系统的CSS样式定义了ND显示区域、EFIS控制面板与数据面板的整体布局。ND显示区域采用深色背景（\`#000\`）模拟真实A320 ND的显示底色，EFIS控制面板采用浅灰色背景（\`#c0c0c0\`）模拟真实驾驶舱面板的金属质感。布局采用Flexbox实现自适应排列，确保在不同屏幕分辨率下的显示效果。

CSS样式设计遵循以下几个原则：首先，ND显示区域使用固定宽高比（1:1）的Canvas元素，通过CSS的 \`max-width\` 与 \`height: auto\` 实现响应式缩放，确保在不同屏幕尺寸下ND显示区域始终保持正方形比例。其次，EFIS控制面板采用网格布局（CSS Grid）组织各功能区的位置，模式选择旋钮、范围选择旋钮、数据显示按钮与VOR调谐区按照真实A320 EFIS面板的物理布局排列，各控件之间保持适当的间距与对齐。最后，数据面板（显示飞机状态信息、导航数据等）采用Flexbox纵向排列，信息行采用等宽字体（\`monospace\`）模拟真实ND的数据显示风格，关键数据使用与真实ND一致的颜色编码（比如洋红色表示主动航路、绿色表示当前数据、蓝色表示距离单位）。

### 5.2 动态内容的实现

ND模拟器的动态内容是指随着时间推移或用户交互而实时变化的数据和画面。和静态内容（比如HTML页面结构、CSS样式、Canvas画布初始化）不同，动态内容需要持续更新以反映飞机运动状态、导航数据变化以及用户操作响应。本系统的动态内容实现主要依赖三个核心技术机制：React状态管理负责维护和更新应用状态，动画循环负责驱动每帧的状态更新，Canvas绘制循环负责把最新状态渲染到画布上。这三个机制相互配合，构成了完整的动态内容更新链路——状态变化触发重绘，重绘反映最新状态，用户交互又产生新的状态变化，形成闭环的数据流。

#### 5.2.1 React状态管理

系统的动态内容通过React的状态管理机制驱动。React的 \`useState\` 钩子为函数组件提供了声明式的状态管理能力，当状态更新时，React自动触发组件的重新渲染，从而更新UI显示。顶层状态在 [`App.js`](App.js:60) 中定义，包括ND模式（\`mode\`）、显示量程（\`range\`）、飞机状态（\`aircraft\`）与系统状态（\`systemState\`）：

其中，\`mode\` 状态控制ND的显示模式，可选值为 \`ROSE NAV\`、\`ROSE ILS\`、\`ROSE VOR\`、\`ARC\`、\`PLAN\` 五种，通过EFIS控制面板的模式选择旋钮切换。\`range\` 状态控制显示量程，可选值为 10、20、40、80、160、320 NM六档，决定地图的缩放比例与罗盘上距离环的标注。\`aircraft\` 状态封装了飞机的全部运动参数与导航参数，包括位置坐标（\`x\`, \`y\`）、航向（\`heading\`）、航迹（\`track\`）、地速（\`gs\`）、真空速（\`tas\`）、风速风向（\`windDir\`, \`windSpeed\`）、高度（\`altitude\`）以及下一航路点ID（\`nextWaypointId\`），这些参数在动画循环中每帧更新。\`systemState\` 状态管理辅助功能的显示开关，包括计时器（\`showChrono\`）、天气雷达（\`showWeather\`）、地形显示（\`showTerrain\`）与交通显示（\`showTraffic\`）。

\`\`\`javascript
// ND显示模式：ROSE NAV / ROSE ILS / ROSE VOR / ARC / PLAN
const [mode, setMode] = useState('ROSE NAV');
const [range, setRange] = useState(40);  // 显示量程，单位海里（NM）

// 飞机状态：位置坐标、航向、航迹、速度、高度等
const [aircraft, setAircraft] = useState({
  x: 0, y: 0, heading: 0, track: 0,       // 位置与方向
  gs: 420, tas: 435, windDir: 0, windSpeed: 0,  // 地速、真空速、风速风向
  altitude: 35000, nextWaypointId: null     // 高度与下一航路点
});

// 系统状态：计时器、天气雷达、地形、交通显示开关
const [systemState, setSystemState] = useState({
  showChrono: false, chronoStartTime: null,
  showWeather: false, showTerrain: false, showTraffic: false
});
\`\`\`

#### 5.2.2 动画循环与帧更新

ND显示器的动态更新通过 \`requestAnimationFrame\` 驱动的动画循环实现。\`requestAnimationFrame\` 是浏览器提供的专用动画API，相比 \`setInterval\` 或 \`setTimeout\`，它有这几个优势：自动与显示器的刷新率同步（通常为60Hz），页面不可见时自动暂停以节省资源，以及更精确的时间控制。在 [`App.js`](App.js:197) 的 \`animate\` 函数中，每帧更新飞机位置、航向与导航数据，并通过 \`setAircraft\` 触发NDDisplay组件的重新渲染：

动画循环的启动时机在React的 \`useEffect\` 中控制，组件挂载时启动动画，组件卸载时通过 \`cancelAnimationFrame\` 停止动画，避免内存泄漏。动画循环的帧率受限于浏览器的刷新率（通常为60 FPS），但在复杂场景下，由于Canvas渲染的计算开销，实际帧率可能会下降。为此，本系统在NDDisplay组件内部通过 \`useEffect\` 的依赖数组控制绘制频率，只有当 \`mode\`、\`range\`、\`aircraft\` 等关键状态发生变化时才重新绘制Canvas，避免了不必要的重绘操作。

\`\`\`javascript
// 动画循环：每帧更新飞机位置与航向
const animate = () => {
  setAircraft(a => ({
    ...a,  // 保留原有状态
    // 根据航向计算X轴位移（航向角转换为弧度）
    x: a.x + Math.sin(a.heading * Math.PI / 180) * 0.5,
    // 根据航向计算Y轴位移
    y: a.y + Math.cos(a.heading * Math.PI / 180) * 0.5,
    heading: a.heading + 0.1  // 航向缓慢旋转，模拟转弯
  }));
  animationFrameId = requestAnimationFrame(animate);  // 请求下一帧
};
\`\`\`

#### 5.2.3 Canvas绘制循环

在NDDisplay组件内部，\`useEffect\` 中的绘制函数根据当前模式调用相应的Canvas绘图函数，完成每帧的渲染工作。绘制流程包括：清空画布 → 绘制罗盘玫瑰 → 绘制地图元素 → 绘制导航辅助信息 → 绘制数据块 → 绘制高级功能叠加层。

具体的绘制流程如下：先调用 \`ctx.clearRect(0, 0, width, height)\` 清空整个画布，为新一轮绘制做准备。然后根据当前模式调用对应的绘制函数——ROSE模式下调用 \`drawCompassRose\` 绘制完整的360°罗盘，ARC模式下调用 \`drawArcCompass\` 绘制扇形罗盘，PLAN模式下调用 \`drawPlanCompass\` 绘制北向上的简化罗盘。接着绘制地图元素，包括飞行计划航路（通过 \`drawRouteWaypoints\` 函数）、航路点标记、VOR/NDB导航台等。之后绘制导航辅助信息，比如距离环（\`drawRangeRing\`）、方位指针（\`drawBearingPointer\`）等。再绘制数据块，包括地速/真空速（\`drawGS_TAS\`）、风向风速（\`drawWindData\`）、航路点信息（\`drawWaypointInfo\`）等。最后根据系统状态绘制高级功能叠加层，比如TCAS交通目标（\`drawTCASTarget\`）、天气雷达回波（\`drawWeatherRadar\`）、EGPWS地形（\`drawEGPWSTerrain\`）等。

这种分层绘制架构确保了各功能模块的绘制逻辑相互独立，便于维护和扩展。每层绘制函数只负责本层的渲染工作，通过Canvas的绘制状态（\`save\`/\`restore\`）隔离各层之间的样式影响，避免了全局样式污染。

### 5.3 具体模式功能的实现

五种ND显示模式（ROSE NAV、ROSE ILS、ROSE VOR、ARC、PLAN）是本模拟器的核心功能模块，每种模式对应不同的飞行阶段与导航需求，有独特的显示布局和绘制逻辑。本节从Canvas 2D渲染的角度，详细说明每种模式的实现原理和技术细节。五种模式的实现都基于统一的绘制框架——先通过 \`worldToScreen\` 投影函数把世界坐标转换成屏幕坐标，然后调用 [`utils/drawingUtils.js`](utils/drawingUtils.js:1) 中的专用绘图函数完成各模式特有的图形元素绘制，最后叠加通用显示元素（飞机符号、航向指示、数据块等）。各模式之间的切换通过EFIS控制面板的模式选择旋钮触发，NDDisplay组件根据当前模式值动态选择对应的绘制流程。
`;

fs.appendFileSync(filePath, content, 'utf8');
console.log('Part 2 appended successfully');
console.log('File size:', fs.statSync(filePath).size);
