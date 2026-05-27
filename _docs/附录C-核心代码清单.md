## 附录C：核心代码清单

### C.1 飞机符号绘制（drawAircraftSymbol）

**文件**：`utils/drawingUtils.js`（第6-49行）

**说明**：绘制A320 ND中央的黄色飞机符号（"士"字形），包含阴影效果和中心空心方块。

```javascript
export const drawAircraftSymbol = (ctx, centerX, centerY, scale = 1) => {
  ctx.save();                                              // 保存当前画布状态
  ctx.translate(centerX, centerY);                         // 平移至飞机中心位置
  ctx.scale(scale, scale);                                 // 应用缩放
  
  // 设置飞机符号样式：黄色、粗线条
  ctx.strokeStyle = COLORS.AIRCRAFT_YELLOW;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';
  
  // 添加阴影效果，增强立体感
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  // 绘制垂直竖线（机身）
  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.lineTo(0, 18);
  ctx.stroke();

  // 绘制上方横线（机翼）
  ctx.beginPath();
  ctx.moveTo(-24, -2);
  ctx.lineTo(24, -2);
  ctx.stroke();

  // 绘制下方横线（尾翼）
  ctx.beginPath();
  ctx.moveTo(-9, 15);
  ctx.lineTo(9, 15);
  ctx.stroke();
  
  // 绘制中心黑色空心方块
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.fillRect(-3, -5, 6, 6);
  ctx.fill();

  // 绘制中心短竖线
  ctx.beginPath();
  ctx.strokeStyle = COLORS.AIRCRAFT_YELLOW;
  ctx.lineWidth = 2;
  ctx.moveTo(0, -5);
  ctx.lineTo(0, 1);
  ctx.stroke();

  ctx.restore();                                           // 恢复画布状态
};
```

---

### C.2 罗盘绘制（drawCompassRose）

**文件**：`utils/drawingUtils.js`（第52-164行）

**说明**：绘制导航罗盘，支持ROSE（全圆）和ARC（弧形）两种模式。ARC模式下只显示航向±60°范围内的刻度，实现真实A320 ND的弧形视口效果。

```javascript
export const drawCompassRose = (ctx, radius, heading, mode) => {
  ctx.save();                                              // 保存画布状态
  ctx.strokeStyle = COLORS.COMPASS_WHITE;
  ctx.fillStyle = COLORS.COMPASS_WHITE;
  ctx.font = "bold 16px Inconsolata";                      // 设置字体
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 2;
  
  const step = 5;                                          // 刻度间隔5°
  const labelStep = 30;                                    // 标签间隔30°
  const rotationOffset = (mode === 'PLAN') ? 0 : -heading; // PLAN模式正北朝上，其余模式航向朝上

  // 绘制罗盘外圈：ROSE模式为整圆，ARC模式为扇形
  if (mode !== 'ARC') {
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.COMPASS_GREY;
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, radius, toRad(-90 - 50), toRad(-90 + 50));
    ctx.strokeStyle = COLORS.COMPASS_GREY;
    ctx.stroke();
  }

  // 绘制白色实心三角（每45°一个，从30°开始）
  const triangleStep = 45;
  const triangleStart = 30;
  const triangleSize = 10;
  const triangleBaseWidth = 7;

  for (let i = triangleStart; i < 360 + triangleStart; i += triangleStep) {
    const angle = i % 360;
    
    // ARC模式下只绘制航向±60°范围内的三角
    if (mode === 'ARC') {
      let relAngle = angle - heading;
      while (relAngle <= -180) relAngle += 360;
      while (relAngle > 180) relAngle -= 360;
      if (Math.abs(relAngle) > 60) continue;
    }

    const angleRad = toRad(angle - 90 + rotationOffset);
    const tipR = radius + 4;                               // 三角尖端半径
    const baseR = radius + 4 + triangleSize;               // 三角底部半径
    
    // 计算三角三个顶点坐标
    const tipX = Math.cos(angleRad) * tipR;
    const tipY = Math.sin(angleRad) * tipR;
    
    const perpAngle = angleRad + Math.PI / 2;
    const halfBase = triangleBaseWidth / 2;
    
    const baseX1 = Math.cos(angleRad) * baseR + Math.cos(perpAngle) * halfBase;
    const baseY1 = Math.sin(angleRad) * baseR + Math.sin(perpAngle) * halfBase;
    const baseX2 = Math.cos(angleRad) * baseR - Math.cos(perpAngle) * halfBase;
    const baseY2 = Math.sin(angleRad) * baseR - Math.sin(perpAngle) * halfBase;
    
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(baseX1, baseY1);
    ctx.lineTo(baseX2, baseY2);
    ctx.closePath();
    ctx.fillStyle = COLORS.COMPASS_WHITE;
    ctx.fill();
  }

  // 绘制刻度线
  for (let i = 0; i < 360; i += step) {
    // ARC模式下只绘制航向±60°范围内的刻度
    if (mode === 'ARC') {
      let relAngle = i - heading;
      while (relAngle <= -180) relAngle += 360;
      while (relAngle > 180) relAngle -= 360;
      if (Math.abs(relAngle) > 60) continue;
    }

    const angleRad = toRad(i - 90 + rotationOffset);
    
    let isLabel = (i % labelStep === 0);                   // 是否显示数字标签
    let len = 8;                                           // 短刻度长度
    if (i % 10 === 0) len = 12;                            // 长刻度长度
    
    ctx.strokeStyle = COLORS.COMPASS_GREY;
    if (isLabel) ctx.strokeStyle = COLORS.COMPASS_WHITE;   // 标签位置使用白色

    const innerR = radius;                                 // 刻度内径
    const outerR = radius + len;                           // 刻度外径

    // 计算刻度线两端坐标
    const x1 = Math.cos(angleRad) * innerR;
    const y1 = Math.sin(angleRad) * innerR;
    const x2 = Math.cos(angleRad) * outerR;
    const y2 = Math.sin(angleRad) * outerR;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // 绘制数字标签（每30°显示一次）
    if (isLabel) {
      const labelR = radius + 28;                          // 标签半径
      const tx = Math.cos(angleRad) * labelR;
      const ty = Math.sin(angleRad) * labelR;
      
      let label = (i / 10).toString();
      if (i === 0) label = "0";
      
      ctx.save();
      ctx.translate(tx, ty);
      ctx.fillText(label, 0, 0);
      ctx.restore();
    }
  }
  ctx.restore();                                           // 恢复画布状态
};
```

---

### C.3 ILS仪表着陆引导显示（drawILSInterface）

**文件**：`utils/drawingUtils.js`（第229-302行）

**说明**：实现ILS模式的航向道（LOC）和下滑道（GS）偏差指示。右侧菱形刻度条显示下滑道偏差，航向道偏差通过十字指针在罗盘上显示。

```javascript
export const drawILSInterface = (ctx, width, height, heading, course,
    locDeviation = 0, gsDeviation = 0, radius = 140, nextWaypoint = null) => {
  const cx = width / 2;                                    // 画布中心X
  const cy = height / 2;                                   // 画布中心Y
  const rx = width - 20;                                   // 右侧信息区域X
  const topY = 30;                                         // 顶部信息区域Y
  
  ctx.textAlign = "right";
  
  // 显示ILS频率（品红色）
  ctx.font = "bold 18px Inconsolata";
  const freq = "110.30";
  ctx.fillStyle = COLORS.TEXT_MAGENTA;
  ctx.fillText(freq, rx, topY);
  const wFreq = ctx.measureText(freq).width;
  ctx.fillStyle = COLORS.TEXT_WHITE;
  ctx.font = "bold 14px Inconsolata";
  ctx.fillText("ILS", rx - wFreq - 10, topY);

  // 显示设定航道（蓝色）
  ctx.font = "bold 18px Inconsolata";
  const displayCourse = Math.round(course) || 360;
  const crsStr = displayCourse.toString().padStart(3, '0') + "°";
  ctx.fillStyle = COLORS.HEADING_BLUE;
  ctx.fillText(crsStr, rx, topY + 25);
  const wCrs = ctx.measureText(crsStr).width;
  ctx.fillStyle = COLORS.TEXT_WHITE;
  ctx.font = "bold 14px Inconsolata";
  ctx.fillText("CRS", rx - wCrs - 10, topY + 25);

  // 显示下一个航路点名称（品红色）
  ctx.font = "bold 20px Inconsolata";
  ctx.fillStyle = COLORS.TEXT_MAGENTA;
  const displayName = nextWaypoint ? nextWaypoint.name : "IYRA";
  ctx.fillText(displayName, rx, topY + 55);

  const gsX = width - 20;                                  // 下滑道指示器X位置
  
  // 绘制下滑道基准线（琥珀色）
  ctx.strokeStyle = COLORS.TEXT_AMBER;
  ctx.lineWidth = 2;
  const baselineLength = 20;
  ctx.beginPath();
  ctx.moveTo(gsX - baselineLength/2, cy);
  ctx.lineTo(gsX + baselineLength/2, cy);
  ctx.stroke();
  
  // 绘制下滑道刻度点（每点代表0.4°偏差）
  ctx.fillStyle = COLORS.COMPASS_WHITE;
  const gsDotSpacing = 35;                                 // 刻度点间距35像素
  [-2, -1, 1, 2].forEach(i => {
    ctx.beginPath();
    ctx.arc(gsX, cy + i * gsDotSpacing, 3, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = COLORS.TEXT_MAGENTA;

  // 计算下滑道偏差（每点0.4°）
  const gsDegreesPerDot = 0.4;
  let gsDeviationInDots;
  if (gsDeviation === 0) {
    gsDeviationInDots = 0;                                 // 无偏差时居中
  } else {
    gsDeviationInDots = gsDeviation / gsDegreesPerDot;
  }
  
  // 限制偏差范围不超过±2.5点
  const clampedGsDev = Math.max(-2.5, Math.min(2.5, gsDeviationInDots));
  const gsY = cy - clampedGsDev * gsDotSpacing;
  
  // 绘制下滑道菱形指针（品红色）
  ctx.strokeStyle = COLORS.TEXT_MAGENTA;
  ctx.beginPath();
  ctx.moveTo(gsX, gsY - 8);
  ctx.lineTo(gsX + 8, gsY);
  ctx.lineTo(gsX, gsY + 8);
  ctx.lineTo(gsX - 8, gsY);
  ctx.closePath();
  ctx.stroke();
  
  // 绘制航向道十字指针（包含LOC偏差）
  drawCourseDagger(ctx, cx, cy, heading, course, true, locDeviation, true, radius);
};
```

---

### C.4 VOR航道偏离指示（drawVORInterface）

**文件**：`utils/drawingUtils.js`（第304-341行）

**说明**：实现VOR模式的航道偏离指示（CDI），显示VOR台频率、名称、设定航道，以及航道偏离十字指针和方位指针。

```javascript
export const drawVORInterface = (ctx, width, height, heading, course,
    vorStation = null, deviation = 0, isToMode = true, radius = 140,
    bearingToVOR = null, innerRadius = 20) => {
  const cx = width / 2;                                    // 画布中心X
  const cy = height / 2;                                   // 画布中心Y
  const rx = width - 20;                                   // 右侧信息区域X
  const topY = 30;                                         // 顶部信息区域Y
  
  ctx.textAlign = "right";
  
  // 获取VOR台信息（频率和名称）
  const freq = vorStation?.frequency || "114.10";
  const vorName = vorStation?.name || "GOW";
  
  // 显示VOR频率（白色）
  ctx.font = "bold 18px Inconsolata";
  ctx.fillStyle = COLORS.TEXT_WHITE;
  ctx.fillText(freq, rx, topY);
  const w1 = ctx.measureText(freq).width;
  ctx.font = "bold 14px Inconsolata";
  ctx.fillText("VOR", rx - w1 - 10, topY);

  // 显示设定航道（蓝色）
  ctx.font = "bold 18px Inconsolata";
  const roundedCourse = Math.round(course);
  const crsStr = roundedCourse.toString().padStart(3, '0') + "°";
  ctx.fillStyle = COLORS.HEADING_BLUE;
  ctx.fillText(crsStr, rx, topY + 25);
  const w2 = ctx.measureText(crsStr).width;
  ctx.fillStyle = COLORS.TEXT_WHITE;
  ctx.font = "bold 14px Inconsolata";
  ctx.fillText("CRS", rx - w2 - 10, topY + 25);

  // 显示VOR台名称（白色）
  ctx.font = "bold 20px Inconsolata";
  ctx.fillStyle = COLORS.TEXT_WHITE;
  ctx.fillText(vorName, rx, topY + 55);

  // 绘制航道偏离十字指针（包含TO/FROM判断）
  drawCourseDagger(ctx, cx, cy, heading, course, false, deviation, isToMode, radius);
  
  // 如果存在VOR方位角，绘制方位指针
  if (bearingToVOR !== null) {
    drawBearingPointer(ctx, cx, cy, heading, bearingToVOR, radius, innerRadius);
  }
};
```

---

### C.5 NDDisplay主渲染循环与绘制函数

**文件**：`components/NDDisplay.js`（第27-50行、第316-550行、第1034-1049行）

**说明**：NDDisplay是导航显示器的核心组件。`draw()`函数按顺序执行：清空画布→故障模式检查→ARC裁剪蒙版→地图变换→地形/天气→地图背景→飞行路径→航路点→VOR台→罗盘→数据块→模式特定界面。`animate()`使用`requestAnimationFrame`实现60fps持续重绘。

```javascript
// 组件定义与状态初始化
const NDDisplay = ({ mode, range, aircraft, activeRoute, secondaryRoute, systemState }) => {
  const canvasRef = useRef(null);                          // Canvas引用
  const { mapData } = useFlightPlan();                     // 获取地图数据
  const { vorStations, tuningState, getActiveVORStation, findNearestVORStation } = useVORManager();

  const width = 600;                                       // 画布宽度
  const height = 600;                                      // 画布高度
  const cx = width / 2;                                    // 画布中心X
  const cy = height / 2;                                   // 画布中心Y

  // 坐标系统计算（根据模式确定地图变换参数）
  const coordinateSystem = useMemo(() => {
    let pxPerNM, screenOriginX, screenOriginY, mapCenterX, mapCenterY, mapRotation;
    
    if (mode === 'PLAN') {
      // PLAN模式：正北朝上，飞机位置偏移
      pxPerNM = (height * 0.9) / (range * 2);              // 每海里像素数
      screenOriginX = cx - aircraft.x * pxPerNM;           // 屏幕原点X
      screenOriginY = cy + aircraft.y * pxPerNM;           // 屏幕原点Y
      mapCenterX = 0;                                      // 地图中心X（世界坐标）
      mapCenterY = 0;                                      // 地图中心Y（世界坐标）
      mapRotation = 0;                                     // 地图旋转角度（正北朝上）
    } else {
      // ROSE/ARC/VOR/LS模式：航向朝上，飞机居中
      pxPerNM = (height * 0.45) / range;
      screenOriginX = cx;
      screenOriginY = cy;
      mapCenterX = aircraft.x;                             // 以飞机位置为地图中心
      mapCenterY = aircraft.y;
      mapRotation = -toRad(aircraft.heading);              // 地图旋转使航向朝上
    }
    return { pxPerNM, screenOriginX, screenOriginY, mapCenterX, mapCenterY, mapRotation };
  }, [mode, range, aircraft.x, aircraft.y, aircraft.heading, height, cx, cy]);

  // 主绘制函数
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 第一步：清空画布为黑色背景
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    const { pxPerNM, screenOriginX, screenOriginY, mapCenterX, mapCenterY, mapRotation } = coordinateSystem;

    // 第二步：检查故障模拟模式
    if (systemState.isFailureSimulated) {
      drawFailureFlags(ctx, width, height);                // 绘制故障标志
      return;                                              // 故障模式下不显示其他内容
    }

    // 第三步：ARC模式裁剪蒙版（扇形区域）
    if (mode === 'ARC') {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(screenOriginX, screenOriginY);
      ctx.arc(screenOriginX, screenOriginY, range * pxPerNM + 20,
              toRad(-90 - 55), toRad(-90 + 55));           // 110°扇形
      ctx.closePath();
      ctx.clip();                                          // 应用裁剪
    }

    // 第四步：地图变换——平移至屏幕原点，然后旋转
    ctx.save();
    ctx.translate(screenOriginX, screenOriginY);
    ctx.rotate(mapRotation);

    // 第五步：绘制地形或天气图层
    if (systemState.showTerrain) {
      drawEGPWSTerrain(ctx, mapCenterX, mapCenterY, range, pxPerNM);
    } else if (systemState.showWeather) {
      ctx.globalAlpha = 0.6;                               // 天气半透明
      drawWeatherRadar(ctx, range, pxPerNM);
      ctx.globalAlpha = 1.0;
    }

    // 第六步：绘制地图背景层（航路点、航线）
    drawMapBackground(ctx, mapCenterX, mapCenterY, pxPerNM, mapRotation, range);

    // 第七步：绘制飞行路径（VOR/ILS模式下隐藏航路）
    if (mode !== 'VOR' && mode !== 'LS') {
      // 备用航路（青色虚线）
      if (secondaryPoints.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = COLORS.LABEL_CYAN;
        ctx.setLineDash([10, 5]);                          // 虚线样式
        ctx.lineWidth = 2;
        secondaryPoints.forEach((wp, i) => {
          const sx = (wp.x - mapCenterX) * pxPerNM;
          const sy = -(wp.y - mapCenterY) * pxPerNM;
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        });
        ctx.stroke();
        ctx.setLineDash([]);                               // 重置虚线
      }

      // 活动航路（品红色实线，带圆角）
      const connectedPoints = activePoints.filter(wp => wp.isConnected !== false);
      if (connectedPoints.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = COLORS.ACTIVE_PATH;
        ctx.lineWidth = 3;
        // 圆角路径计算（使用arcTo实现航路转弯圆角过渡）
        const cornerRadius = 80;
        ctx.moveTo(pts[0].sx, pts[0].sy);
        for (let i = 1; i < pts.length - 1; i++) {
          // 计算相邻航段夹角，应用圆角过渡
          // ...（详细计算见完整代码）
        }
        ctx.stroke();
      }
    }

    ctx.restore();                                         // 恢复地图变换

    // 第八步：绘制罗盘（在屏幕坐标中）
    ctx.save();
    ctx.translate(screenOriginX, screenOriginY);
    drawCompassRose(ctx, compassRadius, aircraft.heading, mode);
    ctx.restore();

    // 第九步：绘制飞机符号（画布中心）
    drawAircraftSymbol(ctx, cx, cy);

    // 第十步：绘制模式特定界面
    if (mode === 'LS') {
      drawILSInterface(ctx, width, height, aircraft.heading,
        aircraft.course, aircraft.locDeviation, aircraft.gsDeviation,
        compassRadius, nextWaypoint);
    } else if (mode === 'VOR') {
      drawVORInterface(ctx, width, height, aircraft.heading,
        aircraft.course, activeVORStation, aircraft.vorDeviation,
        aircraft.vorToFrom, compassRadius, bearingToVOR);
    }

    // 第十一步：绘制数据块（地速、真空速、风向风速等）
    drawGS_TAS(ctx, aircraft.groundSpeed, aircraft.tas);
    drawWindData(ctx, aircraft.windDirection, aircraft.windSpeed,
                 aircraft.heading, width);
  }, [/* 依赖项 */]);

  // 动画循环：使用requestAnimationFrame实现60fps持续重绘
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    let animationFrameId;
    const animate = () => {
      draw();                                              // 执行绘制
      animationFrameId = requestAnimationFrame(animate);   // 请求下一帧
    };
    animate();                                             // 启动动画循环
    return () => cancelAnimationFrame(animationFrameId);   // 清理：取消动画帧
  }, [draw, width, height]);

  // 渲染Canvas元素（带四角装饰螺丝）
  return React.createElement('div', {
    className: 'relative rounded-2xl overflow-hidden shadow-2xl border-8 border-gray-800 bg-black'
  }, [
    React.createElement('canvas', {
      key: 'canvas', ref: canvasRef,
      width: width, height: height, className: 'block'
    }),
    // 四角装饰螺丝（模拟真实A320 ND外观）
    React.createElement('div', { key: 'screw-top-left',
      className: 'absolute top-2 left-2 w-3 h-3 rounded-full bg-gray-700 shadow-inner' }),
    React.createElement('div', { key: 'screw-top-right',
      className: 'absolute top-2 right-2 w-3 h-3 rounded-full bg-gray-700 shadow-inner' }),
    React.createElement('div', { key: 'screw-bottom-left',
      className: 'absolute bottom-2 left-2 w-3 h-3 rounded-full bg-gray-700 shadow-inner' }),
    React.createElement('div', { key: 'screw-bottom-right',
      className: 'absolute bottom-2 right-2 w-3 h-3 rounded-full bg-gray-700 shadow-inner' })
  ]);
};
```

---

### C.6 飞行计划状态管理（FlightPlanContext）

**文件**：`context/FlightPlanContext.js`（第1-314行）

**说明**：基于React Context的飞行计划状态管理。支持航路的创建、编辑、删除、活动/备用切换，通过localStorage实现数据持久化，包含版本兼容处理。

```javascript
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { MOCK_WAYPOINTS } from '../constants.js';
import mapDataService from '../services/MapDataService.js';

const FlightPlanContext = createContext();                  // 创建Context对象

// 自定义Hook：获取飞行计划上下文
export const useFlightPlan = () => {
  const context = useContext(FlightPlanContext);
  if (!context) {
    throw new Error('useFlightPlan must be used within a FlightPlanProvider');
  }
  return context;
};

// localStorage存储键名
const STORAGE_KEY = 'a320_simulator_routes';               // 航路数据键
const MAP_STORAGE_KEY = 'a320_simulator_map_data';         // 地图数据键
const ROUTE_VERSION_KEY = 'a320_simulator_route_version';  // 版本号键
const CURRENT_ROUTE_VERSION = 1;                           // 当前数据版本

// 辅助函数：确保航路点具有navaidType属性（向后兼容旧数据）
const ensureNavaidType = (wp) => {
  if (wp.navaidType) return wp;
  const typeMap = {
    'AIRPORT': 'FIX', 'VOR': 'VOR', 'NDB': 'NDB', 'FIX': 'FIX',
  };
  return { ...wp, navaidType: typeMap[wp.type] || 'FIX' };
};

// FlightPlanProvider组件：提供飞行计划状态管理
export const FlightPlanProvider = ({ children }) => {
  // 从localStorage初始化航路数据，支持版本兼容
  const [routes, setRoutes] = useState(() => {
    const storedVersion = localStorage.getItem(ROUTE_VERSION_KEY);
    if (storedVersion !== String(CURRENT_ROUTE_VERSION)) {
      // 版本不匹配：清除旧数据，写入新版本号
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(ROUTE_VERSION_KEY, String(CURRENT_ROUTE_VERSION));
    } else {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return parsed.map(route => ({
            ...route,
            waypoints: route.waypoints.map(ensureNavaidType) // 确保兼容性
          }));
        } catch (e) {
          console.error('解析存储的航路数据失败', e);
        }
      }
    }
    // 默认航路：使用MOCK_WAYPOINTS
    return [{
      id: 'default-route',
      name: '默认航路',
      waypoints: MOCK_WAYPOINTS.map((wp, index) => ({
        ...ensureNavaidType(wp), id: wp.id || `wp-${index}`
      })),
      isActive: true,                                      // 默认航路为活动航路
      isSecondary: false
    }];
  });

  // 地图数据状态（从localStorage恢复）
  const [mapData, setMapData] = useState(() => {
    const stored = localStorage.getItem(MAP_STORAGE_KEY);
    if (stored) {
      try { return JSON.parse(stored); }
      catch (e) { console.error('解析存储的地图数据失败', e); }
    }
    return null;
  });

  const [mapLoading, setMapLoading] = useState(false);     // 地图加载状态
  const [mapError, setMapError] = useState(null);          // 地图加载错误

  // 活动航路ID和备用航路ID
  const [activeRouteId, setActiveRouteId] = useState(() => {
    const active = routes.find(r => r.isActive);
    return active ? active.id : (routes.length > 0 ? routes[0].id : null);
  });

  const [secondaryRouteId, setSecondaryRouteId] = useState(() => {
    const secondary = routes.find(r => r.isSecondary);
    return secondary ? secondary.id : null;
  });

  // 通过ID获取完整航路对象（使用useMemo优化性能）
  const activeRoute = useMemo(() =>
    routes.find(r => r.id === activeRouteId), [routes, activeRouteId]);
  const secondaryRoute = useMemo(() =>
    routes.find(r => r.id === secondaryRouteId), [routes, secondaryRouteId]);

  // 持久化：航路数据变化时自动保存到localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
  }, [routes]);

  // 持久化：地图数据变化时自动保存到localStorage
  useEffect(() => {
    if (mapData) {
      localStorage.setItem(MAP_STORAGE_KEY, JSON.stringify(mapData));
    } else {
      localStorage.removeItem(MAP_STORAGE_KEY);
    }
  }, [mapData]);

  // === 航路CRUD操作 ===

  // 创建新航路
  const addRoute = (name) => {
    const newRoute = {
      id: `route-${Date.now()}`,                           // 基于时间戳生成唯一ID
      name: name || `新航路 ${routes.length + 1}`,
      waypoints: [],
      isActive: routes.length === 0,                       // 第一个航路自动设为活动
      isSecondary: false
    };
    setRoutes([...routes, newRoute]);
    if (routes.length === 0) setActiveRouteId(newRoute.id);
    return newRoute.id;
  };

  // 更新航路属性
  const updateRoute = (routeId, updates) => {
    setRoutes(prev => prev.map(r =>
      r.id === routeId ? { ...r, ...updates } : r));
  };

  // 删除航路
  const deleteRoute = (routeId) => {
    setRoutes(prev => prev.filter(r => r.id !== routeId));
    if (activeRouteId === routeId) setActiveRouteId(null);
    if (secondaryRouteId === routeId) setSecondaryRouteId(null);
  };

  // 将航路设为活动航路
  const activateRoute = (routeId) => {
    setRoutes(prev => prev.map(r => ({
      ...r,
      isActive: r.id === routeId,
      isSecondary: r.id === routeId ? false : r.isSecondary
    })));
    setActiveRouteId(routeId);
  };

  // 将航路设为备用航路
  const setAsSecondary = (routeId) => {
    setRoutes(prev => prev.map(r => ({
      ...r,
      isSecondary: r.id === routeId,
      isActive: r.id === routeId ? false : r.isActive
    })));
    setSecondaryRouteId(routeId);
  };

  // === 航路点操作 ===

  // 添加航路点
  const addWaypoint = (routeId, waypoint) => {
    setRoutes(prev => prev.map(r => {
      if (r.id === routeId) {
        let navaidType = waypoint.navaidType;
        if (!navaidType) {
          const typeMap = {
            'AIRPORT': 'FIX', 'VOR': 'VOR', 'NDB': 'NDB', 'FIX': 'FIX',
          };
          navaidType = typeMap[waypoint.type] || 'FIX';
        }
        const newWp = {
          ...waypoint,
          id: waypoint.id || `wp-${Date.now()}`,
          navaidType,
          status: r.waypoints.length === 0 ? 'active' : 'direct',
          isConnected: waypoint.isConnected !== undefined ? waypoint.isConnected : true
        };
        return { ...r, waypoints: [...r.waypoints, newWp] };
      }
      return r;
    }));
  };

  // 更新航路点属性
  const updateWaypoint = (routeId, waypointId, updates) => {
    setRoutes(prev => prev.map(r => {
      if (r.id === routeId) {
        return {
          ...r,
          waypoints: r.waypoints.map(wp =>
            wp.id === waypointId ? { ...wp, ...updates } : wp)
        };
      }
      return r;
    }));
  };

  // 删除航路点
  const deleteWaypoint = (routeId, waypointId) => {
    setRoutes(prev => prev.map(r => {
      if (r.id === routeId) {
        return {
          ...r,
          waypoints: r.waypoints.filter(wp => wp.id !== waypointId)
        };
      }
      return r;
    }));
  };

  // 切换航路点的连接状态（用于VOR台不连线的情况）
  const toggleWaypointConnection = (routeId, waypointId) => {
    setRoutes(prev => prev.map(r => {
      if (r.id === routeId) {
        return {
          ...r,
          waypoints: r.waypoints.map(wp =>
            wp.id === waypointId ? { ...wp, isConnected: !wp.isConnected } : wp
          )
        };
      }
      return r;
    }));
  };

  // 重新排序航路点（拖拽排序）
  const reorderWaypoints = (routeId, startIndex, endIndex) => {
    setRoutes(prev => prev.map(r => {
      if (r.id === routeId) {
        const result = Array.from(r.waypoints);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return { ...r, waypoints: result };
      }
      return r;
    }));
  };

  // === 地图数据操作 ===

  // 从URL加载地图数据
  const loadMapFromUrl = async (url) => {
    setMapLoading(true);
    setMapError(null);
    try {
      const data = await mapDataService.loadMapFromUrl(url);
      const normalized = mapDataService.validateAndNormalizeMapData(data);
      setMapData(normalized);
      return normalized;
    } catch (error) {
      setMapError(error.message);
      throw error;
    } finally {
      setMapLoading(false);
    }
  };

  // 从文件加载地图数据
  const loadMapFromFile = async (file) => {
    setMapLoading(true);
    setMapError(null);
    try {
      const data = await mapDataService.loadMapFromFile(file);
      const normalized = mapDataService.validateAndNormalizeMapData(data);
      setMapData(normalized);
      return normalized;
    } catch (error) {
      setMapError(error.message);


  const clearMapData = () => {
    setMapData(null);
    setMapError(null);
  };

  // 从地图数据创建航路
  const createRouteFromMap = (routeName, waypointIds) => {
    if (!mapData) throw new Error('没有加载地图数据');
    const waypoints = waypointIds.map(id => {
      const wp = mapData.waypoints.find(w => w.id === id);
      if (!wp) throw new Error('找不到航路点: ' + id);
      return { ...wp, status: 'direct' };
    });
    const newRoute = {
      id: 'route-' + Date.now(),
      name: routeName || '从地图创建的航路',
      waypoints,
      isActive: false,
      isSecondary: false
    };
    setRoutes([...routes, newRoute]);
    return newRoute.id;
  };

  // 暴露给消费者的Context值
  const value = {
    routes, activeRoute, secondaryRoute,
    mapData, mapLoading, mapError,
    addRoute, updateRoute, deleteRoute,
    activateRoute, setAsSecondary,
    addWaypoint, updateWaypoint, deleteWaypoint,
    reorderWaypoints, toggleWaypointConnection,
    loadMapFromUrl, loadMapFromFile, clearMapData, createRouteFromMap
  };

  // 渲染Provider
  return React.createElement(FlightPlanContext.Provider, { value }, children);
};
`

---

### C.7 EFIS控制面板

**文件**：`components/EFISPanel.js`（第5-452行）

**说明**：EFIS控制面板组件，模拟真实A320 EFIS控制面板的外观和交互逻辑。包含模式选择旋钮、量程调节旋钮、航道设定、VOR调谐、地形/天气/交通开关等功能。

```javascript
import React from 'react';
import SelectorKnob from './Knob.js';          // 离散值选择旋钮组件
import ContinuousKnob from './ContinuousKnob.js'; // 连续值调节旋钮组件

// EFIS控制面板组件
const EFISPanel = ({
  mode, range, systemState, setMode, setRange,
  toggleTerrain, toggleWeather, toggleChrono, toggleFailure,
  vorTuningState, onVorTuningModeChange, onVorFrequencyChange, onVorFrequencyStep,
  course, onCourseChange
}) => {

  // 空客风格矩形按钮（带三条横线图标）
  const AirButton = ({ label, active, onClick, bottomLabel }) =>
    React.createElement('div', {
      className: 'flex flex-col items-center cursor-pointer'
    }, [
      React.createElement('button', {
        onClick,
        // 激活状态显示绿色背景，否则显示灰色背景
        className: 'w-10 h-10 rounded border-2 flex items-center justify-center ' +
          (active ? 'bg-[#4a5a3a] border-[#8faa7a]' : 'bg-[#8a8f95] border-[#5a5f65]')
      }, [
        React.createElement('div', { className: 'flex flex-col items-center space-y-1' }, [
          React.createElement('div', { className: 'w-6 h-0.5 bg-black' }),
          React.createElement('div', { className: 'w-6 h-0.5 bg-black' }),
          React.createElement('div', { className: 'w-6 h-0.5 bg-black' })
        ])
      ]),
      React.createElement('span', {
        className: 'text-[8px] text-black font-bold mt-0.5'
      }, label),
      bottomLabel && React.createElement('span', {
        className: 'text-[7px] text-black mt-0.5'
      }, bottomLabel)
    ]);

  // 装饰螺丝（四角固定螺丝视觉效果）
  const ScrewHead = () => React.createElement('div', {
    className: 'w-4 h-4 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 border border-gray-700 shadow-inner flex items-center justify-center'
  }, [
    React.createElement('div', {
      className: 'w-3 h-0.5 bg-gray-700 transform rotate-45'
    }),
    React.createElement('div', {
      className: 'w-3 h-0.5 bg-gray-700 transform -rotate-45 absolute'
    })
  ]);

  // 模式选择选项（ILS/VOR/NAV/ARC/PLAN）
  const modeOptions = [
    { label: 'ILS', value: 'LS', angle: -70 },
    { label: 'VOR', value: 'VOR', angle: -35 },
    { label: 'NAV', value: 'NAV', angle: 0 },
    { label: 'ARC', value: 'ARC', angle: 35 },
    { label: 'PLAN', value: 'PLAN', angle: 70 },
  ];

  // 量程选择选项（10/20/40/80/160/320 NM）
  const rangeOptions = [
    { label: '10', value: 10, angle: -75 },
    { label: '20', value: 20, angle: -45 },
    { label: '40', value: 40, angle: -15 },
    { label: '80', value: 80, angle: 15 },
    { label: '160', value: 160, angle: 45 },
    { label: '320', value: 320, angle: 75 },
  ];

  // 渲染面板
  return React.createElement('div', {
    className: 'relative bg-[#aab2bb] p-4 rounded-xl shadow-2xl border-t border-l border-[#c4cbd3] border-b-4 border-r-4 border-b-[#7a8189] border-r-[#7a8189] w-full max-w-[520px]'
  }, [
    // 四角装饰螺丝
    React.createElement('div', { key: 'screw-tl',
      className: 'absolute top-2 left-2' }, React.createElement(ScrewHead)),
    React.createElement('div', { key: 'screw-tr',
      className: 'absolute top-2 right-2' }, React.createElement(ScrewHead)),
    React.createElement('div', { key: 'screw-bl',
      className: 'absolute bottom-2 left-2' }, React.createElement(ScrewHead)),
    React.createElement('div', { key: 'screw-br',
      className: 'absolute bottom-2 right-2' }, React.createElement(ScrewHead)),

    // 主容器：左右两栏布局
    React.createElement('div', {
      key: 'main-container',
      className: 'flex flex-row h-full'
    }, [
      // 左栏：BARO气压设置区
      React.createElement('div', {
        key: 'baro-section',
        className: 'flex flex-col items-center w-1/3 pr-2 border-r-2 border-black space-y-4 pt-4'
      }, [
        // BARO液晶显示屏
        React.createElement('div', {
          key: 'baro-display',
          className: 'bg-[#b8c2b4] border-2 border-[#555] rounded px-2 py-1 flex flex-col items-center shadow-inner w-24'
        }, [
          React.createElement('span', { key: 'baro-label',
            className: 'text-[8px] text-black font-bold w-full text-left leading-none mb-1'
          }, 'BARO'),
          React.createElement('span', { key: 'baro-value',
            className: 'text-lg text-black font-bold font-mono'
          }, '29.92'),
          React.createElement('span', { key: 'baro-unit',
            className: 'text-[8px] text-black w-full text-right leading-none'
          }, 'IN')
        ]),
        // BARO调节旋钮
        React.createElement(ContinuousKnob, {
          key: 'baro-knob',
          label: 'BARO',
          size: 60,
          min: 28.0,
          max: 31.0,
          step: 0.01,
          value: 29.92
        })
      ]),

      // 中栏：模式选择和量程选择
      React.createElement('div', {
        key: 'center-section',
        className: 'flex flex-col items-center w-1/3 px-2 space-y-4 pt-4'
      }, [
        // MODE模式选择旋钮
        React.createElement(SelectorKnob, {
          key: 'mode-knob',
          options: modeOptions,
          value: mode,
          onChange: setMode,
          label: 'MODE',
          size: 80
        }),
        // RANGE量程选择旋钮
        React.createElement(SelectorKnob, {
          key: 'range-knob',
          options: rangeOptions,
          value: range,
          onChange: setRange,
          label: 'RANGE',
          size: 80
        })
      ]),

      // 右栏：功能按钮区
      React.createElement('div', {
        key: 'right-section',
        className: 'flex flex-col items-center w-1/3 pl-2 border-l-2 border-black space-y-4 pt-4'
      }, [
        // 地形/天气/交通/故障等开关按钮
        React.createElement(AirButton, {
          key: 'terrain-btn',
          label: 'TERR',
          active: systemState.showTerrain,
          onClick: toggleTerrain
        }),
        React.createElement(AirButton, {
          key: 'weather-btn',
          label: 'WX',
          active: systemState.showWeather,
          onClick: toggleWeather
        }),
        React.createElement(AirButton, {
          key: 'traffic-btn',
          label: 'TFC',
          active: systemState.showTraffic,
          onClick: () => {}
        }),
        // VOR调谐模式切换（自动/手动）
        React.createElement('div', {
          key: 'vor-tuning',
          className: 'flex items-center space-x-1'
        }, [
          React.createElement('button', {
            key: 'vor-auto',
            onClick: () => onVorTuningModeChange('auto'),
            className: 'text-[10px] px-1 py-0.5 rounded ' +
              (vorTuningState?.mode === 'auto' ? 'bg-[#4a5a3a] text-white' : 'bg-gray-500 text-black')
          }, 'AUTO'),
          React.createElement('button', {
            key: 'vor-manual',
            onClick: () => onVorTuningModeChange('manual'),
            className: 'text-[10px] px-1 py-0.5 rounded ' +
              (vorTuningState?.mode === 'manual' ? 'bg-[#4a5a3a] text-white' : 'bg-gray-500 text-black')
          }, 'MAN')
        ]),
        // 故障模拟按钮
        React.createElement(AirButton, {
          key: 'failure-btn',
          label: 'FAIL',
          active: systemState.isFailureSimulated,
          onClick: toggleFailure,
          bottomLabel: 'IDX'
        })
      ])
    ])
  ]);
};
``
