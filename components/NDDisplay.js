import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { COLORS, MOCK_WAYPOINTS, MOCK_TCAS, ND_MODES } from '../constants.js';
import { useFlightPlan } from '../context/FlightPlanContext.js';
import { useVORManager } from '../context/VORManagerContext.js';
import {
  drawAircraftSymbol,
  drawCompassRose,
  drawWindData,
  drawGS_TAS,
  drawWaypointInfo,
  drawNavaidInfo,
  toRad,
  drawWeatherRadar,
  drawNavaid,
  drawDecelPoint,
  drawEnergyCircle,
  drawTCASTarget,
  drawEGPWSTerrain,
  formatChronoTime,
  drawFailureFlags,
  drawILSInterface,
  drawVORInterface,
  drawTrackPointer,
  drawBearingPointer
} from '../utils/drawingUtils.js';

const NDDisplay = ({ mode, range, aircraft, activeRoute, secondaryRoute, systemState }) => {
  const canvasRef = useRef(null);
  const { mapData } = useFlightPlan();
  const { vorStations, tuningState, getActiveVORStation, findNearestVORStation } = useVORManager();

  const width = 600;
  const height = 600;
  const cx = width / 2;
  const cy = height / 2;

  // 记忆化活跃航路点
  const activePoints = useMemo(() => {
    return activeRoute ? activeRoute.waypoints : [];
  }, [activeRoute]);

  const secondaryPoints = useMemo(() => {
    return secondaryRoute ? secondaryRoute.waypoints : [];
  }, [secondaryRoute]);

  // 记忆化 PLAN 模式的目标航路点
  const targetWaypoint = useMemo(() => {
    if (mode !== 'PLAN' || !activeRoute) return null;
    
    let targetWpt;
    if (aircraft.nextWaypointId) {
      targetWpt = activeRoute.waypoints.find(w => w.id === aircraft.nextWaypointId);
    }
    if (!targetWpt && activeRoute.waypoints.length > 0) {
      targetWpt = activeRoute.waypoints[activeRoute.waypoints.length - 1];
    }
    return targetWpt;
  }, [mode, aircraft.nextWaypointId, activeRoute]);

  // 在航路中查找下一个 VOR 台站（不区分大小写）- 移到外部以便复用
  const findNextVORInRoute = useCallback((route, startFromCurrent = true, routeName = 'unknown') => {
      if (!route || !route.waypoints || route.waypoints.length === 0) {
          console.log(`  ${routeName}: No route or waypoints`);
          return null;
      }
      
      console.log(`  ${routeName}: Checking ${route.waypoints.length} waypoints`);
      
      // 记录所有航路点用于调试
      route.waypoints.forEach((wp, idx) => {
          console.log(`    [${idx}] ${wp.name || wp.id}: type="${wp.type}", id="${wp.id}"`);
      });
      
      let startIndex = 0;
      if (startFromCurrent && aircraft.nextWaypointId) {
          const currentIndex = route.waypoints.findIndex(w => w.id === aircraft.nextWaypointId);
          if (currentIndex !== -1) {
              startIndex = currentIndex;
              console.log(`  ${routeName}: Starting from index ${startIndex} (waypoint: ${route.waypoints[startIndex]?.name || route.waypoints[startIndex]?.id})`);
          } else {
              console.log(`  ${routeName}: Current waypoint ${aircraft.nextWaypointId} not found in route, starting from beginning`);
          }
      } else {
          console.log(`  ${routeName}: Starting from beginning (index 0)`);
      }
      
      // 查找起始索引后的第一个 VOR（不区分大小写）
      for (let i = startIndex; i < route.waypoints.length; i++) {
          const wp = route.waypoints[i];
          // 检查航路点是否为 VOR（不区分大小写）- 同时检查 type 和 navaidType 字段
          const isVOR = (wp.type && wp.type.toUpperCase() === 'VOR') ||
                       (wp.navaidType && wp.navaidType.toUpperCase() === 'VOR');
          if (isVOR) {
              console.log(`  ${routeName}: Found VOR at index ${i}: ${wp.name} (type: ${wp.type}, navaidType: ${wp.navaidType})`);
              return wp;
          }
      }
      
      // 如果在起始索引后未找到，从头开始搜索
      for (let i = 0; i < startIndex; i++) {
          const wp = route.waypoints[i];
          const isVOR = (wp.type && wp.type.toUpperCase() === 'VOR') ||
                       (wp.navaidType && wp.navaidType.toUpperCase() === 'VOR');
          if (isVOR) {
              console.log(`  ${routeName}: Found VOR at index ${i} (before start): ${wp.name} (type: ${wp.type}, navaidType: ${wp.navaidType})`);
              return wp;
          }
      }
      
      console.log(`  ${routeName}: No VOR found in route`);
      return null;
  }, [aircraft.nextWaypointId]);

  // 在航路中查找下一个 FIX 定位点（不区分大小写）
  const findNextFIXInRoute = useCallback((route, startFromCurrent = true, routeName = 'unknown') => {
      if (!route || !route.waypoints || route.waypoints.length === 0) {
          console.log(`  ${routeName}: No route or waypoints for FIX search`);
          return null;
      }
      
      console.log(`  ${routeName}: Checking ${route.waypoints.length} waypoints for FIX`);
      
      let startIndex = 0;
      if (startFromCurrent && aircraft.nextWaypointId) {
          const currentIndex = route.waypoints.findIndex(w => w.id === aircraft.nextWaypointId);
          if (currentIndex !== -1) {
              startIndex = currentIndex;
              console.log(`  ${routeName}: Starting from index ${startIndex} for FIX (waypoint: ${route.waypoints[startIndex]?.name || route.waypoints[startIndex]?.id})`);
          } else {
              console.log(`  ${routeName}: Current waypoint ${aircraft.nextWaypointId} not found in route for FIX, starting from beginning`);
          }
      } else {
          console.log(`  ${routeName}: Starting from beginning (index 0) for FIX`);
      }
      
      // 查找起始索引后的第一个 FIX（不区分大小写）
      for (let i = startIndex; i < route.waypoints.length; i++) {
          const wp = route.waypoints[i];
          // 检查航路点是否为 FIX（不区分大小写）- 同时检查 type 和 navaidType 字段
          const isFIX = (wp.type && wp.type.toUpperCase() === 'FIX') ||
                       (wp.navaidType && wp.navaidType.toUpperCase() === 'FIX');
          if (isFIX) {
              console.log(`  ${routeName}: Found FIX at index ${i}: ${wp.name} (type: ${wp.type}, navaidType: ${wp.navaidType})`);
              return wp;
          }
      }
      
      // 如果在起始索引后未找到，从头开始搜索
      for (let i = 0; i < startIndex; i++) {
          const wp = route.waypoints[i];
          const isFIX = (wp.type && wp.type.toUpperCase() === 'FIX') ||
                       (wp.navaidType && wp.navaidType.toUpperCase() === 'FIX');
          if (isFIX) {
              console.log(`  ${routeName}: Found FIX at index ${i} (before start): ${wp.name} (type: ${wp.type}, navaidType: ${wp.navaidType})`);
              return wp;
          }
      }
      
      console.log(`  ${routeName}: No FIX found in route`);
      return null;
  }, [aircraft.nextWaypointId]);

  // 记忆化坐标系设置
  const coordinateSystem = useMemo(() => {
    // 默认投影设置（ROSE / NAV）
    let pxPerNM = (height * 0.45) / range;
    
    // 屏幕原点（地图中心在屏幕上的位置）
    let screenOriginX = cx;
    let screenOriginY = cy;
    
    // 地图中心（屏幕原点对应的世界坐标）
    let mapCenterX = aircraft.x;
    let mapCenterY = aircraft.y;
    
    // 地图旋转（弧度）
    let mapRotation = 0;

    // 模式特定调整
    if (mode === 'PLAN') {
      // PLAN 模式：正北朝上
      // 严格要求：以正在飞往的航路点为中心
      if (targetWaypoint) {
        mapCenterX = targetWaypoint.x;
        mapCenterY = targetWaypoint.y;
      }
      mapRotation = 0; // 固定正北朝上
      
    } else if (mode === 'ARC') {
      // ARC 模式：航向朝上
      // 飞机在底部
      screenOriginY = height * 0.85;
      // 缩放 pxPerNM 使得 0.75 量程弧与屏幕侧边在中点上方相交
      // compassRadius=430px, 0.75 弧半径=322.5px, 交点 y=392
      // 标签外半径 = 430+34=464px, 顶部标签 y=46, 远高于角落文字 (y=30-105)
      pxPerNM = 430 / range;
      mapRotation = -toRad(aircraft.heading); // 世界坐标反向旋转航向角度，使航向方向与屏幕上方对齐

    } else {
      // ROSE 模式：航向朝上
      // 飞机在中心
      mapRotation = -toRad(aircraft.heading); // 世界坐标反向旋转航向角度，使航向方向与屏幕上方对齐
    }

    return { pxPerNM, screenOriginX, screenOriginY, mapCenterX, mapCenterY, mapRotation };
  }, [mode, range, aircraft.x, aircraft.y, aircraft.heading, height, cx, cy]);

  // 记忆化飞机在地图上的位置
  const acMapPosition = useMemo(() => {
    const { mapCenterX, mapCenterY, pxPerNM } = coordinateSystem;
    // 计算飞机相对于地图中心的位置
    const x = (aircraft.x - mapCenterX) * pxPerNM;
    const y = -(aircraft.y - mapCenterY) * pxPerNM;
    return { x, y };
  }, [aircraft.x, aircraft.y, coordinateSystem]);

  // 记忆化罗盘半径
  // ROSE 模式：半径 = height * 0.38 (~228px)，为角落数据块留出空间
  // ARC 模式：罗盘弧即最外层的量程弧，因此半径 = range * pxPerNM
  //           pxPerNM = 430/range, 所以 compassRadius = 430px
  //           0.75 弧半径 = 322.5px, 与侧边相交于 y=392
  const compassRadius = useMemo(() => {
    const { pxPerNM } = coordinateSystem;
    if (mode === 'ARC') {
      return range * pxPerNM;
    }
    return height * 0.38;
  }, [mode, range, coordinateSystem, height]);

  // 绘制地图背景层
  const drawMapBackground = useCallback((ctx, mapCenterX, mapCenterY, pxPerNM, mapRotation, range) => {
    if (!mapData) return;

    ctx.save();
    
    // 绘制地图航路点（背景层）
    if (mapData.waypoints && mapData.waypoints.length > 0) {
      ctx.globalAlpha = 0.3; // 半透明背景
      mapData.waypoints.forEach(wp => {
        const sx = (wp.x - mapCenterX) * pxPerNM;
        const sy = -(wp.y - mapCenterY) * pxPerNM;
        
        // 仅绘制在量程范围内的航路点
        const distance = Math.sqrt(sx * sx + sy * sy);
        if (distance > range * pxPerNM * 1.2) return;
        
        // 跳过地图背景中的 VOR 类型航路点 - 它们由 VORManagerContext 管理
        if (wp.type === 'VOR') return;
        
        // 根据类型绘制航路点符号
        ctx.fillStyle = COLORS.LABEL_CYAN;
        ctx.beginPath();
        
        switch (wp.type) {
          case 'AIRPORT':
            // 绘制机场符号（带十字的圆）
            ctx.arc(sx, sy, 4, 0, Math.PI * 2);
            ctx.moveTo(sx - 3, sy);
            ctx.lineTo(sx + 3, sy);
            ctx.moveTo(sx, sy - 3);
            ctx.lineTo(sx, sy + 3);
            break;
          case 'NDB':
            // 绘制 NDB 符号（三角形）
            ctx.beginPath();
            ctx.moveTo(sx, sy - 5);
            ctx.lineTo(sx - 4, sy + 3);
            ctx.lineTo(sx + 4, sy + 3);
            ctx.closePath();
            break;
          default:
            // 绘制 FIX 符号（小圆）
            ctx.arc(sx, sy, 2, 0, Math.PI * 2);
        }
        
        ctx.fill();
        
        // 绘制航路点标签（仅对重要航路点）
        if (wp.type === 'AIRPORT') {
          ctx.save();
          ctx.rotate(-mapRotation); // 保持文字正向
          ctx.fillStyle = COLORS.LABEL_CYAN;
          ctx.font = '10px Inconsolata';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(wp.name, sx + 8, sy - 6);
          ctx.restore();
        }
      });
      ctx.globalAlpha = 1.0;
    }
    
    // 绘制航路（如果有）
    if (mapData.airways && mapData.airways.length > 0) {
      ctx.strokeStyle = COLORS.LABEL_CYAN;
      ctx.lineWidth = 0.5;
      ctx.setLineDash([2, 2]);
      ctx.globalAlpha = 0.2;
      
      mapData.airways.forEach(airway => {
        if (airway.waypointIds && airway.waypointIds.length >= 2) {
          ctx.beginPath();
          
          airway.waypointIds.forEach((wpId, index) => {
            const wp = mapData.waypoints.find(w => w.id === wpId);
            if (wp) {
              const sx = (wp.x - mapCenterX) * pxPerNM;
              const sy = -(wp.y - mapCenterY) * pxPerNM;
              
              if (index === 0) ctx.moveTo(sx, sy);
              else ctx.lineTo(sx, sy);
            }
          });
          
          ctx.stroke();
        }
      });
      
      ctx.setLineDash([]);
      ctx.globalAlpha = 1.0;
    }
    
    ctx.restore();
  }, [mapData]);

  // 优化的绘制函数
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 用黑色背景清空 Canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    const { pxPerNM, screenOriginX, screenOriginY, mapCenterX, mapCenterY, mapRotation } = coordinateSystem;
    const { x: acMapX, y: acMapY } = acMapPosition;
    
    // 调试：每 30 帧记录航向和地图旋转
    if (typeof window._ndFrameCount === 'undefined') window._ndFrameCount = 0;
    window._ndFrameCount++;
    if (window._ndFrameCount % 30 === 0) {
      console.log('NDDisplay render: mode=', mode, 'heading=', aircraft.heading?.toFixed(1), 'mapRotation(deg)=', (mapRotation * 180 / Math.PI).toFixed(1), 'acMapPos=', acMapX.toFixed(1), acMapY.toFixed(1), 'mapCenter=', mapCenterX.toFixed(1), mapCenterY.toFixed(1));
    }

    // --- 1. 背景 ---
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, width, height);

    // --- 故障模式 ---
    if (systemState.isFailureSimulated) {
       drawFailureFlags(ctx, width, height);
       return;
    }

    // --- 3. 裁剪遮罩（用于 ARC 模式） ---
    let arcClipSaved = false;
    if (mode === 'ARC') {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(screenOriginX, screenOriginY);
      // 扇形
      ctx.arc(screenOriginX, screenOriginY, range * pxPerNM + 20, toRad(-90 - 55), toRad(-90 + 55));
      ctx.closePath();
      ctx.clip();
      arcClipSaved = true;
    }

    // --- 4. 动态地图层 ---
    ctx.save();
    
    // 应用变换：移动到屏幕原点 -> 旋转
    // 我们希望相对于地图中心绘制
    // 1. 移动到屏幕原点
    ctx.translate(screenOriginX, screenOriginY);
    // 2. 旋转地图
    ctx.rotate(mapRotation);
    
    // 现在 (0,0) 是地图中心，方向正确
    // 世界坐标 (x,y) 处的对象应绘制在：
    // x' = (x - mapCenterX) * pxPerNM
    // y' = -(y - mapCenterY) * pxPerNM（Canvas 中 Y 轴翻转）

    if (systemState.showTerrain) {
       // 地形使用相对于飞机/中心的网格
       // 将 mapCenterX/Y 作为网格生成器的参考点传递
       drawEGPWSTerrain(ctx, mapCenterX, mapCenterY, range, pxPerNM);
    } else if (systemState.showWeather) {
        ctx.globalAlpha = 0.6;
        drawWeatherRadar(ctx, range, pxPerNM);
        ctx.globalAlpha = 1.0;
    }
    
    // 绘制地图背景层（如果已加载地图数据）
    drawMapBackground(ctx, mapCenterX, mapCenterY, pxPerNM, mapRotation, range);
    
    ctx.setLineDash([]); // 重置虚线

    // 在 VOR 和 ILS 模式下，隐藏飞行计划以聚焦导航台信息
    if (mode !== 'VOR' && mode !== 'LS') {
        // 飞行路径（备用航路）
        if (secondaryPoints.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = COLORS.LABEL_CYAN;
            ctx.setLineDash([10, 5]);
            ctx.lineWidth = 2;
            
            secondaryPoints.forEach((wp, i) => {
                const sx = (wp.x - mapCenterX) * pxPerNM;
                const sy = -(wp.y - mapCenterY) * pxPerNM;
                if (i === 0) ctx.moveTo(sx, sy);
                else ctx.lineTo(sx, sy);
            });
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // 飞行路径（激活航路）- 仅连接 isConnected=true 的航路点
        // 过滤出已连接的航路点用于路径绘制
        const connectedPoints = activePoints.filter(wp => wp.isConnected !== false);
        if (connectedPoints.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = COLORS.ACTIVE_PATH;
            ctx.lineWidth = 3;
            
            // 将已连接的航路点转换为屏幕坐标
            const pts = connectedPoints.map(wp => ({
                sx: (wp.x - mapCenterX) * pxPerNM,
                sy: -(wp.y - mapCenterY) * pxPerNM
            }));
            
            // 航路显示：带圆弧的飞越转弯
            // 物理引擎（App.js）使用正确的圆弧：
            // 飞机直线飞向每个航路点，然后沿半径为 turnRadiusNM 的圆弧飞行，
            // 再直线飞向下一个航路点
            // 航路显示在每个航路点处显示带弧线的计划路径
            
            // 转弯半径固定为 2.3 海里（与 App.js 保持一致）
            const turnRadiusNM = 2.3;
            const turnRadiusPx = turnRadiusNM * pxPerNM;
            
            ctx.moveTo(pts[0].sx, pts[0].sy);
            
            for (let i = 1; i < pts.length; i++) {
                const curr = pts[i];
                
                if (i < pts.length - 1) {
                    // 中间航路点：先画线到航路点，再画弧
                    const prev = pts[i - 1];
                    const next = pts[i + 1];
                    
                    // Canvas 中的入航方向
                    const inDx = curr.sx - prev.sx;
                    const inDy = curr.sy - prev.sy;
                    const inLen = Math.sqrt(inDx * inDx + inDy * inDy);
                    
                    // Canvas 中的出航方向
                    const outDx = next.sx - curr.sx;
                    const outDy = next.sy - curr.sy;
                    const outLen = Math.sqrt(outDx * outDx + outDy * outDy);
                    
                    if (inLen > 0.1 && outLen > 0.1) {
                        // 计算转弯方向
                        // 在 Canvas 坐标中（y 翻转），计算有符号转弯角度
                        // Canvas 中的入航航向：atan2(inDy, inDx)
                        // Canvas 中的出航航向：atan2(outDy, outDx)
                        const inHeadingCanvas = Math.atan2(inDy, inDx);
                        const outHeadingCanvas = Math.atan2(outDy, outDx);
                        let turnAngleCanvas = outHeadingCanvas - inHeadingCanvas;
                        // 归一化到 [-π, π]
                        if (turnAngleCanvas > Math.PI) turnAngleCanvas -= 2 * Math.PI;
                        if (turnAngleCanvas < -Math.PI) turnAngleCanvas += 2 * Math.PI;
                        // 左转（航向在航空中减小）= Canvas 中 turnAngle 为负
                        const isLeftTurn = turnAngleCanvas < 0;
                        
                        // Canvas 坐标中的弧心
                        // 在 Canvas 中（y 翻转），左垂线 = (dy, -dx)，右垂线 = (-dy, dx)
                        const perpX = isLeftTurn ? inDy : -inDy;
                        const perpY = isLeftTurn ? -inDx : inDx;
                        const perpLen = Math.sqrt(perpX * perpX + perpY * perpY);
                        const uPerpX = perpX / perpLen;
                        const uPerpY = perpY / perpLen;
                        
                        const arcCenterCx = curr.sx + uPerpX * turnRadiusPx;
                        const arcCenterCy = curr.sy + uPerpY * turnRadiusPx;
                        
                        // Canvas 中的弧起始角度（从中心到航路点）
                        const arcStartAngle = Math.atan2(curr.sy - arcCenterCy, curr.sx - arcCenterCx);
                        
                        // Canvas 中的出航方向角度
                        const outAngle = Math.atan2(outDy, outDx);
                        
                        // Canvas 中的弧终止角度
                        // 左转（航向减小，Canvas 中顺时针）：切线 = θ - π/2，所以 θ = outAngle + π/2
                        // 右转（航向增大，Canvas 中逆时针）：切线 = θ + π/2，所以 θ = outAngle - π/2
                        const arcEndAngle = outAngle + (isLeftTurn ? Math.PI / 2 : -Math.PI / 2);
                        
                        // 先画线到航路点
                        ctx.lineTo(curr.sx, curr.sy);
                        
                        // 在 Canvas 上绘制弧
                        // 左转（航向减小）= 世界中绕弧心逆时针旋转
                        // 在 Canvas 中（y 翻转），世界中的逆时针映射为：
                        //   Canvas 角度 = 90° - 航空航向
                        //   航空航向减小（逆时针）→ Canvas 角度增大（逆时针）
                        // 所以左转 = Canvas 中逆时针 = counterclockwise=true
                        // 右转（航向增大）= 世界中顺时针 → Canvas 角度减小（顺时针）
                        // 所以右转 = Canvas 中顺时针 = counterclockwise=false
                        ctx.arc(arcCenterCx, arcCenterCy, turnRadiusPx, arcStartAngle, arcEndAngle, isLeftTurn);
                    } else {
                        ctx.lineTo(curr.sx, curr.sy);
                    }
                } else {
                    // 最后一个航路点：直接画线到它
                    ctx.lineTo(curr.sx, curr.sy);
                }
            }
            
            ctx.stroke();
        }

        // 航路点渲染
        const drawRouteWaypoints = (wps, isActive) => {
            // 仅绘制已连接的航路点（isConnected !== false）
            // isConnected=false 的航路点被视为 VOR 台站，而非航路点
            const routeWps = wps.filter(wp => wp.isConnected !== false);
            routeWps.forEach(wp => {
                const sx = (wp.x - mapCenterX) * pxPerNM;
                const sy = -(wp.y - mapCenterY) * pxPerNM;

                if (Math.abs(sx) > width || Math.abs(sy) > height) return;

                let color = isActive ? COLORS.TEXT_MAGENTA : COLORS.LABEL_CYAN;
                if (isActive && wp.id === aircraft.nextWaypointId) color = COLORS.TRACK_GREEN;
                
                drawNavaid(ctx, sx, sy, wp.navaidType, color);

                // 标签
                ctx.fillStyle = color;
                ctx.save();
                ctx.translate(sx + 12, sy);
                ctx.rotate(-mapRotation);
                ctx.font = "14px Inconsolata";
                ctx.textAlign = "left";
                ctx.fillText(wp.name, 0, 0);
                if (wp.altConstraint) {
                    ctx.fillStyle = isActive ? COLORS.TEXT_MAGENTA : COLORS.LABEL_CYAN;
                    ctx.fillText(wp.altConstraint.toString(), 0, 14);
                }
                ctx.restore();
            });
        };

        if (secondaryRoute) drawRouteWaypoints(secondaryRoute.waypoints, false);
        if (activeRoute) drawRouteWaypoints(activeRoute.waypoints, true);
    }

    // 从VORManagerContext绘制地图上的VOR台站
    // 仅在NAV、ARC、PLAN模式下显示（VOR/LS模式有自己的界面）
    if (mode !== 'VOR' && mode !== 'LS' && vorStations && vorStations.length > 0) {
        vorStations.forEach(station => {
            const sx = (station.x - mapCenterX) * pxPerNM;
            const sy = -(station.y - mapCenterY) * pxPerNM;
            
            // 仅在可视范围内绘制
            const dist = Math.sqrt(sx * sx + sy * sy);
            if (dist > range * pxPerNM * 1.2) return;
            
            // 绘制VOR符号（六边形）
            drawNavaid(ctx, sx, sy, 'VOR', COLORS.LABEL_CYAN);
            
            // 标签：先平移到标签位置，然后反向旋转使文字保持正立
            // 确保标签位置使用与符号相同的变换
            ctx.save();
            ctx.translate(sx + 8, sy - 6);
            ctx.rotate(-mapRotation);
            ctx.fillStyle = COLORS.LABEL_CYAN;
            ctx.font = "10px Inconsolata";
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            ctx.fillText(station.name + ' ' + station.frequency, 0, 0);
            ctx.restore();
        });
    }
    // 能量圈（根据用户要求已移除）
    // ctx.save();
    // ctx.translate(acMapX, acMapY);
    // drawEnergyCircle(ctx, 20 * pxPerNM);
    // ctx.restore();

    // TCAS（已禁用 - 根据用户要求移除）
    // MOCK_TCAS.forEach(target => {
    //   const tr = toRad(target.bearing);
    //   const tx = Math.sin(tr) * target.distance * pxPerNM;
    //   const ty = -Math.cos(tr) * target.distance * pxPerNM;
    //   const targetScreenX = acMapX + tx;
    //   const targetScreenY = acMapY + ty;
    //   drawTCASTarget(ctx, targetScreenX, targetScreenY, target, mapRotation);
    // });
    
    // 飞机符号（PLAN模式）
    // 在PLAN模式下，地图固定为北向上。飞机移动和旋转。
    // 飞机符号机头朝上（画布角度270°）。要使其指向
    // 航向方向（画布角度 = 航向 - 90°），需要旋转
    // +heading度。已验证所有8个基本方向。
    if (mode === 'PLAN') {
        ctx.save();
        ctx.translate(acMapX, acMapY);
        ctx.rotate(toRad(aircraft.heading)); // 旋转飞机符号以匹配航向方向
        drawAircraftSymbol(ctx, 0, 0, 0.75);
        ctx.restore();
    }

    ctx.restore(); // 结束地图变换
    if (arcClipSaved) ctx.restore(); // 结束裁剪

    // --- 5. 静态叠加层（罗盘、ROSE/ARC模式下的飞机）---
    
    // 罗盘刻度环
    ctx.save();
    ctx.translate(screenOriginX, screenOriginY);
    drawCompassRose(ctx, compassRadius, aircraft.heading, mode);
    ctx.restore();

    // 飞机符号（ROSE / ARC模式）
    // 固定在屏幕上（航向向上），地图在下方移动
    if (mode !== 'PLAN') {
       drawAircraftSymbol(ctx, screenOriginX, screenOriginY, 0.75);
    }

    // --- 6. 航向游标（Heading Bug）与航迹指针 ---
    // 绘制在罗盘之上
    ctx.save();
    ctx.translate(screenOriginX, screenOriginY);
    const bugR = compassRadius;
    
    // 计算游标角度，相对于屏幕向上方向（-90°）
    // PLAN（北向上）：游标角度 = 选定航向 - 90°
    // ROSE/ARC（航向向上）：游标角度 = (选定航向 - 当前航向) - 90°
    
    let bugRad = 0;
    if (mode === 'PLAN') {
        bugRad = toRad(aircraft.selectedHeading - 90);
    } else {
        bugRad = toRad(aircraft.selectedHeading - aircraft.heading - 90);
    }
    
    const bugX = Math.cos(bugRad) * bugR;
    const bugY = Math.sin(bugRad) * bugR;
    
    let drawBug = true;
    if (mode === 'ARC') {
        let rel = aircraft.selectedHeading - aircraft.heading;
        while(rel < -180) rel += 360;
        while(rel > 180) rel -= 360;
        if(Math.abs(rel) > 60) drawBug = false; // ARC模式下超出60°范围不显示游标
    }

    if (drawBug) {
        ctx.fillStyle = COLORS.HEADING_BLUE;
        ctx.save();
        ctx.translate(bugX, bugY);
        ctx.rotate(bugRad + Math.PI/2);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-6, -10);
        ctx.lineTo(6, -10);
        ctx.fill();
        ctx.restore();
    }
    
    // 航迹指针（绿色空心菱形）- 飞机实际地面航迹
    drawTrackPointer(ctx, 0, 0, aircraft.heading, aircraft.track, compassRadius, mode);
    
    // 航向标线（顶部黄色竖线）- 仅用于航向向上模式
    if (mode !== 'PLAN') {
        ctx.strokeStyle = COLORS.AIRCRAFT_YELLOW;
        ctx.lineWidth = 4;
        ctx.beginPath();
        const ly = -compassRadius; // 相对于屏幕原点
        ctx.moveTo(0, ly - 15);
        ctx.lineTo(0, ly + 5);
        ctx.stroke();
    }
    ctx.restore();

    // --- 距离圈/弧（在屏幕坐标系中绘制，在地图变换之外）---
    ctx.save();
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.font = "bold 14px Inconsolata";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeStyle = COLORS.COMPASS_WHITE;

    // 对于非ARC模式（ROSE NAV/VOR/LS/PLAN），距离圈基于compassRadius。
    // compassRadius = height * 0.38（约228px），是固定的罗盘环大小。
    // 距离圈绘制在compassRadius的固定比例处。
    const drawRangeRing = (ringRadiusPx, labelNM) => {
        ctx.beginPath();
        ctx.arc(screenOriginX, screenOriginY, ringRadiusPx, 0, Math.PI * 2);
        ctx.stroke();
        // 标签在环内部（从顶部稍微向内偏移）
        ctx.fillStyle = COLORS.LABEL_CYAN;
        ctx.fillText(labelNM.toString(), screenOriginX, screenOriginY - ringRadiusPx + 16);
    };

    // 计算0.75弧与屏幕侧边相交的角度。
    // 0.75弧半径 = 0.75 * range * pxPerNM = 0.75 * 430 = 322.5px。
    // 圆心在(300, 510)，到侧边的距离 = 300px。
    // 交点y = 510 - sqrt(322.5² - 300²) = 510 - 118.3 = 391.7
    // 左侧边交点角度：atan2(-118.3, -300) = -158.5°
    // 右侧边交点角度：atan2(-118.3, 300) = -21.5°
    let arcStartAngle, arcEndAngle;
    if (mode === 'ARC') {
        const r75 = 0.75 * range * pxPerNM;  // 322.5px
        const dy = Math.sqrt(r75 * r75 - 300 * 300);  // 118.3
        // 从圆心(300,510)到屏幕侧边在交点高度处的角度
        arcStartAngle = Math.atan2(-dy, -300);  // 左侧边：-158.5°
        arcEndAngle = Math.atan2(-dy, 300);     // 右侧边：-21.5°
    }

    const drawRangeArc = (distNM) => {
        const rPx = distNM * pxPerNM;
        ctx.beginPath();
        // 所有弧使用相同的角度范围：从左侧边交点到右侧边交点。
        // 0.75弧的端点在屏幕侧边上。
        // 0.5和0.25弧的端点位于从圆心到0.75弧端点的半径上。
        ctx.arc(screenOriginX, screenOriginY, rPx, arcStartAngle, arcEndAngle, false);
        ctx.stroke();
        // 顶部标签
        ctx.fillStyle = COLORS.LABEL_CYAN;
        ctx.fillText(distNM.toString(), screenOriginX, screenOriginY - rPx);
    };

    if (mode === 'ARC') {
        drawRangeArc(range * 0.75);
        drawRangeArc(range * 0.5);
        drawRangeArc(range * 0.25);
    } else if (mode === 'NAV') {
        // ROSE NAV：距离圈在罗盘半径的50%处，标签显示量程的一半
        drawRangeRing(compassRadius * 0.5, Math.round(range * 0.5));
    } else if (mode === 'VOR' || mode === 'LS') {
        // VOR和ILS模式：单个距离圈在罗盘半径的50%处，标签显示量程的一半
        drawRangeRing(compassRadius * 0.5, Math.round(range * 0.5));
    } else {
        // PLAN和其他模式：距离圈在罗盘半径的50%处，标签显示量程的一半
        drawRangeRing(compassRadius * 0.5, Math.round(range * 0.5));
    }
    ctx.setLineDash([]);
    ctx.restore();

    // --- 模式标签（顶部居中）---
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = "bold 16px Inconsolata";
    
    if (mode === 'LS') {
        ctx.fillStyle = COLORS.TRACK_GREEN;
        ctx.fillText("ILS APP", cx, 8);
    } else if (mode === 'VOR') {
        ctx.fillStyle = COLORS.TRACK_GREEN;
        ctx.fillText("VOR", cx, 8);
    }
    ctx.restore();

    // --- 7. 界面层（ILS/VOR）---
    if (mode === 'LS') {
        // ILS模式：指向下一个航路点
        let nextWaypoint = null;
        if (aircraft.nextWaypointId && activeRoute) {
            nextWaypoint = activeRoute.waypoints.find(w => w.id === aircraft.nextWaypointId);
        }
        // 如果未找到下一个航路点，使用活动航路中的第一个航路点
        if (!nextWaypoint && activeRoute && activeRoute.waypoints.length > 0) {
            nextWaypoint = activeRoute.waypoints[0];
        }
        // 如果仍然没有航路点，检查备用航路
        if (!nextWaypoint && secondaryRoute && secondaryRoute.waypoints.length > 0) {
            nextWaypoint = secondaryRoute.waypoints[0];
        }
        
        // 计算到下一个航路点的航向
        let ilsCourse = aircraft.course || 360; // 如果未设置则默认为360
        const gsDeviation = 0;  // 下滑道偏差（垂直方向）
        
        // LOC偏差杆固定在中心
        const locDeviation = 0;
        
        if (nextWaypoint) {
            // 计算从飞机到下一个航路点的方位角
            const dx = nextWaypoint.x - aircraft.x;
            const dy = nextWaypoint.y - aircraft.y;
            // 转换为角度（0-360，0为北）
            ilsCourse = (Math.atan2(dy, dx) * 180 / Math.PI);
            // 从数学坐标系（0°=东）转换为导航坐标系（0°=北）
            ilsCourse = (90 - ilsCourse + 360) % 360;
            
            console.log('ILS模式：找到下一个航路点，计算航向：', {
                wptName: nextWaypoint.name,
                wptType: nextWaypoint.type,
                aircraftCourse: aircraft.course,
                bearingToWpt: ilsCourse,
                hasWaypoint: true
            });
        } else {
            console.log('ILS模式：未找到航路点，使用默认航向：', ilsCourse);
        }
        
        drawILSInterface(ctx, width, height, aircraft.heading, ilsCourse, locDeviation, gsDeviation, compassRadius, nextWaypoint, range, coordinateSystem.pxPerNM);
    } else if (mode === 'VOR') {
        // ============================================================
        // 阶段1：确定VOR台站来源
        // ============================================================
        // 优先级1：航路VOR（最高）- 活动飞行计划中的VOR台站
        // 优先级2：自动/手动调谐（VORManagerContext）- 飞行员调谐的台站
        // 优先级3：最近VOR（后备）- 按距离最近的台站
        let vorStation = null;
        
        // 优先级1：检查活动航路中是否有VOR台站
        // 在真实的A320操作中，当VOR是飞行计划航路的一部分时，
        // ND会自动检测该VOR并将其用作参考。
        // 这优先于自动/手动调谐，因为
        // 飞行计划VOR是航路的预期导航参考。
        if (activeRoute && activeRoute.waypoints.length > 0) {
            const routeVOR = activeRoute.waypoints.find(wp =>
                (wp.type && wp.type.toUpperCase() === 'VOR') ||
                (wp.navaidType && wp.navaidType.toUpperCase() === 'VOR')
            );
            if (routeVOR) {
                vorStation = {
                    id: routeVOR.id,
                    name: routeVOR.name,
                    frequency: routeVOR.frequency || '---',
                    x: routeVOR.x,
                    y: routeVOR.y,
                    type: 'VOR',
                    navaidType: 'VOR',
                    distance: Math.sqrt(
                        Math.pow(routeVOR.x - aircraft.x, 2) +
                        Math.pow(routeVOR.y - aircraft.y, 2)
                    )
                };
            }
        }
        
        // 优先级2：回退到VORManagerContext（自动/手动调谐）
        if (!vorStation) {
            vorStation = getActiveVORStation();
        }
        
        // 优先级3：回退到最近的VOR台站
        if (!vorStation) {
            vorStation = findNearestVORStation(aircraft.x, aircraft.y);
        }
        
        // ============================================================
        // 阶段2：计算公共VOR几何参数（单次计算）
        // ============================================================
        // 一次性计算从飞机到VOR台站的方位角，各处复用。
        // 这避免了重复的Math.atan2调用，并确保
        // 方位指针、偏差计算和TO/FROM逻辑之间的一致性。
        let bearingToVOR = null;    // 从飞机到VOR台站的方位角（0-360，0=北）
        let aircraftRadial = null;  // 飞机相对于VOR台站的径向线（方位角的反向）
        if (vorStation) {
            const dx = vorStation.x - aircraft.x;
            const dy = vorStation.y - aircraft.y;
            // Math.atan2给出数学坐标系中的角度（0°=东，逆时针为正）
            // 转换为导航坐标系（0°=北，顺时针为正）
            bearingToVOR = (90 - Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
            // 飞机径向线 = 到台站方位角的反向
            aircraftRadial = (bearingToVOR + 180) % 360;
        }
        
        // ============================================================
        // 阶段3：航道（CRS）和偏差计算
        // ============================================================
        // 在真实A320 VOR模式中：
        // - 航道指针（CDI）指向选定航道（CRS），
        //   这是飞行员通过CRS选择旋钮设定的固定方向。
        //   它不会自动跟随飞行计划航段方向。
        // - 偏差杆显示飞机VOR径向线与选定航道之间的角度偏差。
        // - 转弯时，罗盘随航向旋转，因此指针
        //   相对于罗盘的位置平滑变化。
        //   （relRotation = course - heading）
        // - TO/FROM：当航向在到VOR台站方位角的±90°范围内时为TO
        
        // 使用飞行员设定的航道（CRS）作为固定参考。
        let vorCourse = aircraft.course || 360;
        let vorDeviation = 0;
        
        // 偏差计算：
        // aircraftRadial = (bearingToStation + 180°) % 360（飞机所在的径向线）
        // angularDev = aircraftRadial - selectedCourse
        //   > 0：飞机在航道右侧 → 杆向左偏（向左飞）
        //   < 0：飞机在航道左侧 → 杆向右偏（向右飞）
        //
        // drawCourseDagger函数在正偏差时在旋转帧的右侧绘制杆。
        // 但在VOR惯例中，正偏差意味着"向左飞"（杆在右侧）。
        // 因此我们对偏差取反以匹配显示惯例：
        // 杆在右侧 → 向右飞（飞机在航道左侧）
        if (vorStation && aircraftRadial !== null) {
            let angularDev = aircraftRadial - vorCourse;
            if (angularDev > 180) angularDev -= 360;
            if (angularDev < -180) angularDev += 360;
            // 取反并限制在±20°（满刻度偏转）
            vorDeviation = -Math.max(-20, Math.min(20, angularDev));
        }
        
        // ============================================================
        // 阶段4：TO/FROM判定
        // ============================================================
        // TO模式：飞机航向在到VOR台站方位角的±90°范围内
        // FROM模式：飞机航向在到VOR台站方位角的90°-270°范围内
        let isToMode = true;
        if (vorStation && bearingToVOR !== null) {
            const headingDiff = ((aircraft.heading - bearingToVOR) % 360 + 360) % 360;
            isToMode = headingDiff < 90 || headingDiff > 270;
        }
        
        // ============================================================
        // 阶段5：渲染VOR界面
        // ============================================================
        const largeRingNM = Math.round(compassRadius / pxPerNM);
        const smallRingNM = Math.round(largeRingNM / 2);
        const innerRingRadius = smallRingNM * pxPerNM;
        drawVORInterface(ctx, width, height, aircraft.heading, vorCourse, vorStation, vorDeviation, isToMode, compassRadius, bearingToVOR, innerRingRadius, range, coordinateSystem.pxPerNM);
    }

    // --- 8. 数据块 ---
    drawGS_TAS(ctx, aircraft.gs, aircraft.tas);
    drawWindData(ctx, aircraft.windDir, aircraft.windSpeed, aircraft.heading, width);
    
    // 在NAV、ARC和PLAN模式下显示下一个航路点信息
    if (mode === 'NAV' || mode === 'ARC' || mode === 'PLAN') {
        let activeWpt;
        if (aircraft.nextWaypointId && activeRoute) {
            activeWpt = activeRoute.waypoints.find(w => w.id === aircraft.nextWaypointId);
        }
        if (!activeWpt && activeRoute && activeRoute.waypoints.length > 0) {
            activeWpt = activeRoute.waypoints[0];
        }

        if (activeWpt) {
            // 计算到航路点的方位角（飞行航迹）
            const dx = activeWpt.x - aircraft.x;
            const dy = activeWpt.y - aircraft.y;
            let bearing = (Math.atan2(dy, dx) * 180 / Math.PI);
            bearing = (90 - bearing + 360) % 360;
            const trackToFly = Math.round(bearing);
            
            // 计算距离
            const distToWpt = Math.sqrt(Math.pow(activeWpt.x - aircraft.x, 2) + Math.pow(activeWpt.y - aircraft.y, 2));
            
            // 计算预计到达时间（估算）
            const now = new Date();
            const eta = new Date(now.getTime() + 5*60000);
            const etaStr = `${eta.getUTCHours().toString().padStart(2,'0')}${eta.getUTCMinutes().toString().padStart(2,'0')}`;
            
            drawWaypointInfo(ctx, activeWpt.name, trackToFly, distToWpt, etaStr, width);
        }
    }
    
    // ============================================================
    // 绘制VOR导航台信息（左侧 = VOR1，右侧 = VOR2）
    // 仅在VOR模式下显示
    // ============================================================
    if (mode === 'VOR') {
        // VOR1（左侧）：显示VOR模式当前使用的VOR台站。
        // 遵循与VOR模式显示相同的优先级逻辑：
        //   1. 航路VOR（如果活动飞行计划中存在VOR台站）
        //   2. 自动/手动调谐台站（VORManagerContext）
        //   3. 最近VOR台站（后备）
        let vor1Station = null;
        if (activeRoute && activeRoute.waypoints.length > 0) {
            const routeVOR = activeRoute.waypoints.find(wp =>
                (wp.type && wp.type.toUpperCase() === 'VOR') ||
                (wp.navaidType && wp.navaidType.toUpperCase() === 'VOR')
            );
            if (routeVOR) {
                vor1Station = {
                    id: routeVOR.id,
                    name: routeVOR.name,
                    frequency: routeVOR.frequency || '---',
                    x: routeVOR.x,
                    y: routeVOR.y,
                    distance: Math.sqrt(
                        Math.pow(routeVOR.x - aircraft.x, 2) +
                        Math.pow(routeVOR.y - aircraft.y, 2)
                    )
                };
            }
        }
        if (!vor1Station) {
            const tuned = getActiveVORStation();
            if (tuned) {
                vor1Station = {
                    ...tuned,
                    distance: Math.sqrt(
                        Math.pow(tuned.x - aircraft.x, 2) +
                        Math.pow(tuned.y - aircraft.y, 2)
                    )
                };
            }
        }
        if (!vor1Station) {
            vor1Station = findNearestVORStation(aircraft.x, aircraft.y);
        }
        
        if (vor1Station) {
            drawNavaidInfo(ctx, 'left', vor1Station.name, vor1Station.frequency, vor1Station.distance.toFixed(1), height, width);
        } else {
            drawNavaidInfo(ctx, 'left', '---', '---', '--', height, width);
        }
        
        // VOR2（右侧）：显示第二个VOR接收机的调谐台站。
        // 在真实A320中，VOR2可通过右侧RMP独立调谐。
        // 在此模拟中，VOR2显示自动调谐的最近台站
        // （当VOR1锁定到航路VOR时，可能与VOR1不同）。
        // 这提供了用于定位的交叉参考能力。
        const vor2Station = findNearestVORStation(aircraft.x, aircraft.y);
        if (vor2Station) {
            drawNavaidInfo(ctx, 'right', vor2Station.name, vor2Station.frequency, vor2Station.distance.toFixed(1), height, width);
        } else {
            drawNavaidInfo(ctx, 'right', '---', '---', '--', height, width);
        }
    }
    
    // 显示计时器
    if (systemState.showChrono) {
        ctx.font = "bold 20px Inconsolata";
        ctx.fillStyle = COLORS.TEXT_WHITE;
        ctx.textAlign = "center";
        const timeStr = formatChronoTime(systemState.chronoStartTime);
        ctx.fillText(timeStr, cx, height - 30);
    }

    // 显示地形提示
    if (systemState.showTerrain) {
       ctx.font = "bold 18px Inconsolata";
       ctx.fillStyle = COLORS.TRACK_GREEN;
       ctx.textAlign = "center";
       ctx.fillText("TERR ON ND", cx, height / 2 + 100);
    }

  }, [mode, range, aircraft.x, aircraft.y, aircraft.heading, aircraft.selectedHeading, aircraft.course, aircraft.gs, aircraft.tas, aircraft.windDir, aircraft.windSpeed, aircraft.nextWaypointId, activeRoute, secondaryRoute, systemState, activePoints, secondaryPoints, coordinateSystem, acMapPosition, compassRadius, width, height, cx, cy, vorStations, tuningState, getActiveVORStation, findNearestVORStation]);

  // 使用requestAnimationFrame实现平滑渲染，替代setInterval
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // 显式设置画布尺寸
    canvas.width = width;
    canvas.height = height;
    
    let animationFrameId;

    const animate = () => {
      draw();
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [draw, width, height]);

  return React.createElement('div', {
    className: 'relative rounded-2xl overflow-hidden shadow-2xl border-8 border-gray-800 bg-black'
  }, [
    React.createElement('canvas', {
      key: 'canvas',
      ref: canvasRef,
      width: width,
      height: height,
      className: 'block'
    }),
    // 装饰性螺丝（四角）
    React.createElement('div', {
      key: 'screw-top-left',
      className: 'absolute top-2 left-2 w-3 h-3 rounded-full bg-gray-700 shadow-inner'
    }),
    React.createElement('div', {
      key: 'screw-top-right',
      className: 'absolute top-2 right-2 w-3 h-3 rounded-full bg-gray-700 shadow-inner'
    }),
    React.createElement('div', {
      key: 'screw-bottom-left',
      className: 'absolute bottom-2 left-2 w-3 h-3 rounded-full bg-gray-700 shadow-inner'
    }),
    React.createElement('div', {
      key: 'screw-bottom-right',
      className: 'absolute bottom-2 right-2 w-3 h-3 rounded-full bg-gray-700 shadow-inner'
    })
  ]);
};

export default NDDisplay;