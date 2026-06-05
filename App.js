import React, { useState, useEffect, useRef } from 'react';
import EFISPanel from './components/EFISPanel.js';
import NDDisplay from './components/NDDisplay.js';
import FlightPlanManager from './components/FlightPlanManager.js';
import MapLoader from './components/MapLoader.js';
import { useFlightPlan } from './context/FlightPlanContext.js';
import { useVORManager } from './context/VORManagerContext.js';

const MODE_DESCRIPTIONS = {
    'LS': {
        title: "ROSE ILS 模式",
        desc: "用于精密进近着陆。显示仪表着陆系统（ILS）的航向道（LOC）和下滑道（G/S）偏差信息，以及全方位的罗盘刻度。"
    },
    'VOR': {
        title: "ROSE VOR 模式",
        desc: "用于VOR导航。主要显示VOR方位的指针和航道偏差杆，提供传统的无线电导航视角。"
    },
    'NAV': {
        title: "ROSE NAV 模式",
        desc: "全方位导航模式。显示飞机处于中心的360度视图，包含航路、航点和当前的飞行计划路径。"
    },
    'ARC': {
        title: "ARC (扇形) 模式",
        desc: "巡航最常用模式。显示飞机前方90度的扇形区域，提供最大化的前方视野，便于观察前方航路和天气雷达信息。"
    },
    'PLAN': {
        title: "PLAN (计划) 模式",
        desc: "以真北为向上的静态地图模式。中心点锁定在选定的航点上，用于查看和修改飞行计划，飞机标志会随位置移动。"
    }
};

const DATA_HOTSPOTS = [
    { 
        id: 1, top: '6%', left: '8%', align: 'left',
        title: '速度信息 (GS/TAS)', 
        desc: 'GS (Ground Speed): 地速，飞机相对于地面的移动速度。\nTAS (True Airspeed): 真空速，飞机相对于空气的移动速度。高空飞行时TAS通常大于GS。' 
    },
    { 
        id: 2, top: '6%', left: '92%', align: 'right',
        title: '下一航点信息', 
        desc: '右上角显示当前飞往的航点名称(如 AKITO)、航迹(Track)、距离(NM)以及预计到达时间(UTC)。' 
    },
    { 
        id: 3, top: '18%', left: '12%', align: 'left',
        title: '风向风速', 
        desc: '绿色箭头直观指示风的来向。数字格式为：风向角度 / 风速(节)。侧风分量会影响飞机的偏流角。' 
    },
    { 
        id: 4, top: '90%', left: '8%', align: 'left',
        title: '导航台 1 (VOR1)', 
        desc: '左侧导航接收机信息。显示选定的VOR/DME台的识别码、频率、距离以及当前的径向线位置。' 
    },
    { 
        id: 5, top: '90%', left: '92%', align: 'right',
        title: '导航台 2 (VOR2)', 
        desc: '右侧导航接收机信息。用于交叉定位或备用导航。' 
    },
];

const App = () => {
  const { activeRoute, secondaryRoute } = useFlightPlan();
  const {
    vorStations,
    tuningState,
    findNearestVORStation,
    updateAutoTuning,
    getActiveVORStation,
    setTuningMode,
    setManualFrequency,
  } = useVORManager();
  const [mode, setMode] = useState('PLAN');
  const [range, setRange] = useState(40);
  
  // 系统状态：地形/天气/计时器/故障模拟
  const [systemState, setSystemState] = useState({
    showTerrain: false,       // 显示地形
    showWeather: false,       // 显示天气雷达
    showChrono: false,        // 显示计时器
    chronoStartTime: null,    // 计时器开始时间
    isFailureSimulated: false, // 故障模拟
  });

  // 教学模式状态（自动弹窗）
  const [explainedModes, setExplainedModes] = useState(new Set());
  const [activeExplanation, setActiveExplanation] = useState(null);

  // 模式切换时自动弹出教学模式说明
  useEffect(() => {
    if (!explainedModes.has(mode)) {
        setActiveExplanation(MODE_DESCRIPTIONS[mode]);
        setExplainedModes(prev => new Set(prev).add(mode));
    }
  }, [mode]);

  const closeModal = () => {
      setActiveExplanation(null);
  };

  // 当前飞往的航路点索引（从1开始，即从航点0飞往航点1）
  const targetIndexRef = useRef(1);
  
  // 飞行阶段：'STRAIGHT'（直飞）| 'TURNING'（转弯）
  const flightPhaseRef = useRef('STRAIGHT');
  
  // 转弯状态：转弯过程中的圆弧角度（弧度）
  const turnArcAngleRef = useRef(0);
  
  // 缓存的转弯数据（出航航向、方向、圆弧中心等）
  const turnDataRef = useRef(null);
  
  // 飞机位置引用（用于物理引擎，避免 setAircraft 异步问题）
  const aircraftPosRef = useRef({ x: 0, y: 0, gs: 432 });
  
  // 调试信息
  console.log('初始目标索引:', targetIndexRef.current);

  // 模拟飞机状态
  const [aircraft, setAircraft] = useState({
    x: 0,
    y: 0,
    heading: 0,
    track: 0,
    gs: 432,          // 地速（节）
    tas: 457,         // 真空速（节）
    windDir: 90,      // 风向
    windSpeed: 25,    // 风速（节）
    selectedHeading: 0,
    course: 340,      // 航道
    nextWaypointId: '' // 下一航点ID（在 effect 中设置）
  });

  // 初始化飞机位置和航向到航路起点
  useEffect(() => {
    if (activeRoute && activeRoute.waypoints.length > 1) {
       const start = activeRoute.waypoints[0];
       const next = activeRoute.waypoints[1];
       aircraftPosRef.current = { x: start.x, y: start.y, gs: 432 };
       
       // 计算第一段航段的初始航向
       const initDx = next.x - start.x;
       const initDy = next.y - start.y;
       const initHeadingRad = Math.atan2(initDx, initDy);
       let initHeading = initHeadingRad * (180 / Math.PI);
       if (initHeading < 0) initHeading += 360;
       
       setAircraft(a => ({
          ...a,
          x: start.x,
          y: start.y,
          heading: initHeading,
          track: initHeading,
          nextWaypointId: next.id
       }));
       targetIndexRef.current = 1;
       console.log('初始位置:', start.x, start.y, '航向:', initHeading.toFixed(1));
    }
  }, [activeRoute]);

  // 切换开关处理函数
  const toggleTerrain = () => setSystemState(s => ({ ...s, showTerrain: !s.showTerrain }));
  const toggleWeather = () => setSystemState(s => ({ ...s, showWeather: !s.showWeather }));
  const toggleFailure = () => setSystemState(s => ({ ...s, isFailureSimulated: !s.isFailureSimulated }));
  const toggleChrono = () => {
     setSystemState(s => {
        if (s.showChrono) {
           return { ...s, showChrono: false, chronoStartTime: null };
        } else {
           return { ...s, showChrono: true, chronoStartTime: Date.now() };
        }
     });
  };

  // --- 自动 VOR 调谐 ---
  // 根据飞机位置自动更新 VOR 频率
  useEffect(() => {
    if (tuningState.mode === 'auto') {
      const nearest = findNearestVORStation(aircraft.x, aircraft.y);
      if (nearest) {
        updateAutoTuning(nearest.id, nearest.frequency);
      }
    }
  }, [aircraft.x, aircraft.y, tuningState.mode]);

  // --- 物理引擎 ---
  useEffect(() => {
    let animationFrameId;
    let lastTime = Date.now();
    
    // 与 NDDisplay.js 匹配的常量
    const ND_WIDTH = 600;
    
    // 标准转弯率 = 3°/秒
    // 转弯半径 = V / (ω * 3600)，其中 ω = 3°/秒 转换为弧度/秒
    // 在 432 节时：r = 432 / (3600 * π/60) ≈ 2.3 海里
    const TURN_RATE_DEG_PER_SEC = 3;
    const TURN_RATE_RAD_PER_SEC = TURN_RATE_DEG_PER_SEC * Math.PI / 180;
    
    const animate = () => {
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // ==========================================
      // 阶段1：从 refs 读取当前状态（同步）
      // ==========================================
      if (!activeRoute || activeRoute.waypoints.length < 2) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }
      const route = activeRoute.waypoints;

      const currentTargetIdx = targetIndexRef.current;
      const targetWpt = route[currentTargetIdx];
      
      if (!targetWpt) {
        targetIndexRef.current = 1;
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      const gs = aircraftPosRef.current.gs || 432;
      const speedFactor = 1;

      // ==========================================
      // 阶段2：计算转弯数据（同步）
      // ==========================================
      // 真实的 A320 飞越航路点转弯，使用正确的圆弧几何：
      // 1. 飞机直线飞向目标航路点
      // 2. 到达航路点后，开始标准速率转弯
      // 3. 转弯过程中，飞机沿半径为 turnRadiusNM 的圆弧飞行
      //    圆弧中心位于入航航向垂直方向、距航路点 turnRadiusNM 处
      // 4. 当航向与出航航段匹配时，恢复直线飞行
      //
      // 转弯数据在接近航路点时一次性计算
      const prevIdx = Math.max(0, currentTargetIdx - 1);
      const prevWpt = route[prevIdx];
      const hasNextWpt = currentTargetIdx < route.length - 1;

      const inDx = targetWpt.x - prevWpt.x;
      const inDy = targetWpt.y - prevWpt.y;
      const inLen = Math.sqrt(inDx * inDx + inDy * inDy);

      // 仅在接近需要转弯的航路点时计算转弯数据
      if (hasNextWpt && !turnDataRef.current) {
        const nextWpt = route[currentTargetIdx + 1];
        const outDx = nextWpt.x - targetWpt.x;
        const outDy = nextWpt.y - targetWpt.y;
        const outLen = Math.sqrt(outDx * outDx + outDy * outDy);

        if (inLen > 0.1 && outLen > 0.1) {
          const uInX = inDx / inLen;
          const uInY = inDy / inLen;
          const uOutX = outDx / outLen;
          const uOutY = outDy / outLen;
          const dot = uInX * uOutX + uInY * uOutY;
          const angle = Math.acos(Math.max(-1, Math.min(1, dot)));

          if (angle > 0.087) { // 最小转弯角度约5度
            // 计算入航航向
            const inboundHeadingRad = Math.atan2(inDx, inDy);
            let inboundHeadingDeg = inboundHeadingRad * (180 / Math.PI);
            if (inboundHeadingDeg < 0) inboundHeadingDeg += 360;

            // 计算出航航向
            const outboundHeadingRad = Math.atan2(outDx, outDy);
            let outboundHeadingDeg = outboundHeadingRad * (180 / Math.PI);
            if (outboundHeadingDeg < 0) outboundHeadingDeg += 360;

            // 计算转弯角度（带符号，负值=左转/航向减小）
            let turnAngle = outboundHeadingDeg - inboundHeadingDeg;
            // 归一化到 [-180, 180]
            if (turnAngle > 180) turnAngle -= 360;
            if (turnAngle < -180) turnAngle += 360;
            const absTurnAngle = Math.abs(turnAngle);
            // 左转：航向减小（turnAngle < 0）
            // 右转：航向增大（turnAngle > 0）
            const isLeftTurn = turnAngle < 0;

            // 转弯半径固定为 2.3 海里（对应 432 节时 1 倍速度的标准转弯半径）
            const turnRadiusNM = 2.3;
            
            // 飞越转弯：圆弧中心位于入航航向垂直方向、距航路点 turnRadiusNM 处
            // 左转（航向减小）：中心在入航方向的左侧
            //   航空航向中：左 = 航向 - 90°
            // 右转（航向增大）：中心在入航方向的右侧
            //   航空航向中：右 = 航向 + 90°
            const perpAngleRad = inboundHeadingRad + (isLeftTurn ? -Math.PI / 2 : Math.PI / 2);
            const arcCenterX = targetWpt.x + Math.sin(perpAngleRad) * turnRadiusNM;
            const arcCenterY = targetWpt.y + Math.cos(perpAngleRad) * turnRadiusNM;
            
            // 圆弧起始角：从圆弧中心到航路点的角度
            // 使用 atan2(dx, dy) 返回航空航向（0°=北，顺时针）
            const arcStartAngle = Math.atan2(targetWpt.x - arcCenterX, targetWpt.y - arcCenterY);
            
            // 总圆弧角：飞机沿圆弧飞行的有符号角距离
            // 左转（航向减小）= 世界坐标系中逆时针旋转：
            //   航空航向沿圆弧减小，totalArcAngle 应为负值
            // 右转（航向增大）= 世界坐标系中顺时针旋转：
            //   航空航向沿圆弧增大，totalArcAngle 应为正值
            const absTurnAngleRad = absTurnAngle * Math.PI / 180;
            const totalArcAngle = isLeftTurn ? -absTurnAngleRad : absTurnAngleRad;
            
            // 圆弧终止角：arcStartAngle + totalArcAngle
            //（圆弧中心对应转弯结束时的角度）
            let arcEndAngle = arcStartAngle + totalArcAngle;
            // 归一化到 [-π, π]
            if (arcEndAngle > Math.PI) arcEndAngle -= 2 * Math.PI;
            if (arcEndAngle < -Math.PI) arcEndAngle += 2 * Math.PI;
            
            // 存储带圆弧几何的转弯数据
            turnDataRef.current = {
              inboundHeadingDeg,
              outboundHeadingDeg,
              isLeftTurn,
              turnAngle,
              absTurnAngle,
              nextWpt,
              uOutX, uOutY,
              // 圆弧几何数据
              arcCenterX,
              arcCenterY,
              arcStartAngle,
              arcEndAngle,
              totalArcAngle,
              turnRadiusNM
            };
            console.log('TURN data: inbound=' + inboundHeadingDeg.toFixed(1) + ' outbound=' + outboundHeadingDeg.toFixed(1) + ' angle=' + absTurnAngle.toFixed(1) + '° ' + (isLeftTurn ? 'LEFT' : 'RIGHT'));
          }
        }
      }

      const turnData = turnDataRef.current;

      // ==========================================
      // 阶段3：从 ref 获取当前飞机位置
      // ==========================================
      const pos = aircraftPosRef.current;

      // 到当前目标航路点的距离
      const dx = targetWpt.x - pos.x;
      const dy = targetWpt.y - pos.y;
      const distToTarget = Math.sqrt(dx*dx + dy*dy);

      const nmPerSec = (gs / 3600) * speedFactor;
      const moveDist = nmPerSec * dt;
      
      // 转弯半径固定为 2.3 海里（对应 432 节时 1 倍速度的标准转弯半径）
      const turnRadiusNM = 2.3;
      // 到达判定距离：确保飞机足够接近航路点再开始转弯
      // 使用转弯半径的 2 倍作为阈值，保证飞机稳定到达
      const arrivalThreshold = Math.max(0.05, turnRadiusNM * 2.0);

      // ==========================================
      // 阶段4：飞行阶段管理与移动
      // ==========================================
      // 飞越航路点转弯（使用正确的圆弧几何）：
      //   STRAIGHT（直飞）：直接飞向目标航路点
      //   到达航路点后：进入 TURNING（转弯）阶段
      //   TURNING（转弯）：飞机沿半径为 turnRadiusNM 的圆弧飞行
      //     - 圆弧中心位于入航航向垂直方向、距航路点 turnRadiusNM 处
      //     - 位置沿圆弧移动，航向与圆弧相切
      //     - 圆弧完成（航向匹配出航方向）后，恢复 STRAIGHT
      
      let newPos;
      let newHeading;
      let newNextWptId = targetWpt.id;

      // --- 阶段：TURNING（转弯，使用正确的圆弧几何） ---
      if (flightPhaseRef.current === 'TURNING' && turnData) {
        // 当前圆弧角度
        let currentAngle = turnArcAngleRef.current;
        
        // 沿圆弧的角步长：弧长/半径 = (速度 * dt) / 半径
        const angularStep = moveDist / turnData.turnRadiusNM;
        
        // 沿圆弧推进角度
        // 左转（航向减小）= 世界坐标系中逆时针旋转
        // 右转（航向增大）= 世界坐标系中顺时针旋转
        let newAngle = currentAngle + (turnData.isLeftTurn ? -angularStep : angularStep);
        
        // 检查圆弧是否完成
        // totalArcAngle 是从 arcStartAngle 到 arcEndAngle 的有符号角距离
        // 左转：totalArcAngle 为负（航空航向减小）
        // 右转：totalArcAngle 为正（航空航向增大）
        // 当角度越过 arcEndAngle 时圆弧完成
        const angleTraveled = newAngle - turnData.arcStartAngle;
        
        // 左转（负 totalArcAngle）：angleTraveled <= totalArcAngle 时完成
        // 右转（正 totalArcAngle）：angleTraveled >= totalArcAngle 时完成
        const arcComplete = (turnData.isLeftTurn && angleTraveled <= turnData.totalArcAngle) ||
                            (!turnData.isLeftTurn && angleTraveled >= turnData.totalArcAngle);
        
        if (arcComplete) {
          // 圆弧完成 - 恢复直线飞行
          console.log('转弯完成（圆弧）');
          flightPhaseRef.current = 'STRAIGHT';
          turnDataRef.current = null;
          turnArcAngleRef.current = 0;
          targetIndexRef.current = currentTargetIdx + 1;
          
          // 定位到圆弧终点
          const endAngle = turnData.arcEndAngle;
          newPos = {
            x: turnData.arcCenterX + Math.sin(endAngle) * turnData.turnRadiusNM,
            y: turnData.arcCenterY + Math.cos(endAngle) * turnData.turnRadiusNM
          };
          
          // 沿出航航向继续前进
          const headingRad = turnData.outboundHeadingDeg * Math.PI / 180;
          newPos = {
            x: newPos.x + Math.sin(headingRad) * moveDist,
            y: newPos.y + Math.cos(headingRad) * moveDist
          };
          
          newHeading = turnData.outboundHeadingDeg;
          newNextWptId = turnData.nextWpt.id;
        } else {
          // 仍在圆弧上 - 从圆弧中心和角度计算位置
          turnArcAngleRef.current = newAngle;
          
          // 圆弧上的位置
          newPos = {
            x: turnData.arcCenterX + Math.sin(newAngle) * turnData.turnRadiusNM,
            y: turnData.arcCenterY + Math.cos(newAngle) * turnData.turnRadiusNM
          };
          
          // 航向与圆弧相切：
          // 左转（逆时针）：航向 = 角度 - 90°
          // 右转（顺时针）：航向 = 角度 + 90°
          const tangentAngleRad = newAngle + (turnData.isLeftTurn ? -Math.PI / 2 : Math.PI / 2);
          newHeading = tangentAngleRad * (180 / Math.PI);
          if (newHeading < 0) newHeading += 360;
          
          newNextWptId = targetWpt.id;
        }
      }
      // --- 阶段：STRAIGHT（直飞，默认） ---
      else {
        // 检查是否到达目标航路点（使用基于转弯半径的动态阈值）
        if (distToTarget < arrivalThreshold) {
          console.log('到达目标:', targetWpt.name, '当前索引:', currentTargetIdx);
          
          if (currentTargetIdx === route.length - 1) {
            // 回到起点循环
            console.log('到达最后一个航路点，重新开始循环');
            flightPhaseRef.current = 'STRAIGHT';
            turnDataRef.current = null;
            const newStartWpt = route[0];
            const newEndWpt = route[1];
            const legDx = newEndWpt.x - newStartWpt.x;
            const legDy = newEndWpt.y - newStartWpt.y;
            let legHeading = Math.atan2(legDx, legDy) * (180 / Math.PI);
            if (legHeading < 0) legHeading += 360;
            targetIndexRef.current = 1;
            aircraftPosRef.current = { x: newStartWpt.x, y: newStartWpt.y, gs: aircraftPosRef.current.gs || 432 };
            setAircraft(a => ({ ...a, x: newStartWpt.x, y: newStartWpt.y, heading: legHeading, track: legHeading, selectedHeading: legHeading, nextWaypointId: newEndWpt.id }));
            animationFrameId = requestAnimationFrame(animate);
            return;
          }
          
          // 检查是否需要转弯
          if (turnData) {
            // 开始转弯 - 从航路点开始圆弧
              flightPhaseRef.current = 'TURNING';
              turnArcAngleRef.current = turnData.arcStartAngle;
              console.log('-> 转弯阶段 航路点:', targetWpt.name,
                '入航:', turnData.inboundHeadingDeg.toFixed(1),
                '-> 出航:', turnData.outboundHeadingDeg.toFixed(1),
                '半径:', turnData.turnRadiusNM.toFixed(2), '海里');
              
              // 沿圆弧的第一步
              const angularStep = moveDist / turnData.turnRadiusNM;
              const firstAngle = turnData.arcStartAngle + (turnData.isLeftTurn ? -angularStep : angularStep);
              turnArcAngleRef.current = firstAngle;
              
              // 圆弧上的位置
              newPos = {
                x: turnData.arcCenterX + Math.sin(firstAngle) * turnData.turnRadiusNM,
                y: turnData.arcCenterY + Math.cos(firstAngle) * turnData.turnRadiusNM
              };
              
              // 航向与圆弧相切
              const tangentAngleRad = firstAngle + (turnData.isLeftTurn ? -Math.PI / 2 : Math.PI / 2);
              newHeading = tangentAngleRad * (180 / Math.PI);
              if (newHeading < 0) newHeading += 360;
              newNextWptId = targetWpt.id;
          } else {
            // 不需要转弯 - 前进到下一个航路点
            const nextIdx = currentTargetIdx + 1;
            const newStartWpt = targetWpt;
            const newEndWpt = route[nextIdx];
            const legDx = newEndWpt.x - newStartWpt.x;
            const legDy = newEndWpt.y - newStartWpt.y;
            let legHeading = Math.atan2(legDx, legDy) * (180 / Math.PI);
            if (legHeading < 0) legHeading += 360;
            targetIndexRef.current = nextIdx;
            aircraftPosRef.current = { x: newStartWpt.x, y: newStartWpt.y, gs: aircraftPosRef.current.gs || 432 };
            setAircraft(a => ({ ...a, x: newStartWpt.x, y: newStartWpt.y, heading: legHeading, track: legHeading, selectedHeading: legHeading, nextWaypointId: newEndWpt.id }));
            animationFrameId = requestAnimationFrame(animate);
            return;
          }
        } else {
          // 直线飞向目标航路点
          const legDx = targetWpt.x - pos.x;
          const legDy = targetWpt.y - pos.y;
          const legLen = Math.sqrt(legDx * legDx + legDy * legDy);
          
          if (legLen > 0.001) {
            const uLegX = legDx / legLen;
            const uLegY = legDy / legLen;
            
            const legHeadingRad = Math.atan2(legDx, legDy);
            newHeading = legHeadingRad * (180 / Math.PI);
            if (newHeading < 0) newHeading += 360;
            
            const moveAmount = Math.min(moveDist, legLen);
            const newX = pos.x + uLegX * moveAmount;
            const newY = pos.y + uLegY * moveAmount;
            
            if (Math.abs(newX - pos.x) < 0.0001 && Math.abs(newY - pos.y) < 0.0001) {
              animationFrameId = requestAnimationFrame(animate);
              return;
            }
            
            newPos = { x: newX, y: newY };
          } else {
            animationFrameId = requestAnimationFrame(animate);
            return;
          }
        }
      }

      // 更新飞机位置引用（同步）
      aircraftPosRef.current = { ...newPos, gs: aircraftPosRef.current.gs || 432 };

      // 更新 React 状态（异步，但 refs 已更新）
      setAircraft(a => ({
        ...a,
        x: newPos.x,
        y: newPos.y,
        heading: newHeading,
        track: newHeading,
        selectedHeading: newHeading,
        nextWaypointId: newNextWptId
      }));
      
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [activeRoute, range]);

  return React.createElement('div', {
    className: 'min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-4 md:p-8 space-y-8 font-sans text-gray-200'
  }, [
    // --- 飞行计划管理器 ---
    React.createElement(FlightPlanManager, { key: 'flight-plan-manager' }),

    // --- 模式说明弹窗 ---
    activeExplanation && React.createElement('div', {
      key: 'modal',
      className: 'fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in'
    }, React.createElement('div', {
      className: 'bg-gray-800 border-2 border-cyan-500 rounded-xl p-6 max-w-md w-full shadow-2xl transform transition-all scale-100 relative'
    }, [
      React.createElement('div', {
        key: 'modal-icon',
        className: 'absolute -top-3 -left-3 w-10 h-10 bg-cyan-600 rounded-full flex items-center justify-center shadow-lg border-2 border-gray-900 font-bold text-white text-xl'
      }, 'i'),
      React.createElement('h2', {
        key: 'modal-title',
        className: 'text-xl font-bold text-cyan-400 mb-3 ml-4'
      }, activeExplanation.title),
      React.createElement('p', {
        key: 'modal-desc',
        className: 'text-gray-300 text-sm leading-relaxed mb-6'
      }, activeExplanation.desc),
      React.createElement('button', {
        key: 'modal-button',
        onClick: closeModal,
        className: 'w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded-lg transition-colors shadow-md'
      }, '明白了')
    ])),


    // 主布局
    React.createElement('div', {
      key: 'main-layout',
      className: 'flex flex-col lg:flex-row gap-8 lg:gap-16 items-start justify-center w-full max-w-7xl'
    }, [
      // 左列：ND 显示器
      React.createElement('div', {
        key: 'nd-display-column',
        className: 'flex flex-col items-center space-y-4 flex-shrink-0'
      }, [
        React.createElement('div', {
          key: 'nd-display-container',
          className: 'relative group shadow-2xl rounded-2xl bg-black'
        }, [
          // Canvas 画布
          React.createElement(NDDisplay, {
            key: 'nd-display',
            mode: mode, 
            range: range, 
            aircraft: aircraft, 
            activeRoute: activeRoute,
            secondaryRoute: secondaryRoute,
            systemState: systemState
          })
        ]),
        
        React.createElement('div', {
          key: 'nd-label',
          className: 'text-gray-600 text-[10px] font-mono uppercase tracking-widest'
        }, 'Captain Side ND')
      ]),

      // 右列：控制面板
      React.createElement('div', {
        key: 'controls-column',
        
        className: 'flex flex-col space-y-6 w-full max-w-[500px]'
      }, [
        React.createElement('div', {
          key: 'efis-panel',
          className: 'flex flex-col relative'
        }, [
          React.createElement('div', {
            key: 'efis-header',
            className: 'flex items-center justify-between mb-2 px-1'
          }, [
            React.createElement('span', {
              key: 'efis-title',
              className: 'text-gray-400 text-xs font-bold tracking-widest uppercase'
            }, 'EFIS Control Panel'),
            React.createElement('div', {
              key: 'efis-divider',
              className: 'h-px bg-gray-700 flex-grow ml-4'
            })
          ]),
          
          React.createElement('div', {
            key: 'efis-content',
            className: 'relative'
          }, React.createElement(EFISPanel, {
            mode: mode,
            range: range,
            systemState: systemState,
            setMode: setMode,
            setRange: setRange,
            toggleTerrain: toggleTerrain,
            toggleWeather: toggleWeather,
            toggleChrono: toggleChrono,
            toggleFailure: toggleFailure,
            vorTuningState: tuningState,
            onVorTuningModeChange: setTuningMode,
            onVorFrequencyChange: setManualFrequency,
            course: aircraft.course,
            onCourseChange: (delta) => {
              setAircraft(prev => ({
                ...prev,
                course: ((prev.course + delta + 360) % 360)
              }));
            }
          }))
        ]),

        // 地图加载器
        React.createElement('div', {
          key: 'map-loader',
          className: 'bg-[#151515] border border-gray-800 rounded-lg p-4 shadow-lg'
        }, [
          React.createElement('div', {
            key: 'map-loader-header',
            className: 'flex items-center justify-between mb-3'
          }, [
            React.createElement('span', {
              key: 'map-loader-title',
              className: 'text-gray-400 text-xs font-bold tracking-widest uppercase'
            }, 'Custom Map Loader'),
            React.createElement('div', {
              key: 'map-loader-divider',
              className: 'h-px bg-gray-700 flex-grow ml-4'
            })
          ]),
          React.createElement(MapLoader, { key: 'map-loader-component' })
        ]),

        // 遥测数据面板
        React.createElement('div', {
          key: 'telemetry',
          className: 'bg-[#151515] border border-gray-800 rounded-lg p-5 shadow-lg relative overflow-hidden'
        }, [
          React.createElement('div', {
            key: 'telemetry-indicator',
            className: 'absolute top-0 left-0 w-1 h-full bg-cyan-600'
          }),
          React.createElement('h3', {
            key: 'telemetry-title',
            className: 'text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-3'
          }, 'Flight Telemetry'),
          
          React.createElement('div', {
            key: 'telemetry-grid',
            className: 'grid grid-cols-2 gap-6 mb-4'
          }, [
            React.createElement('div', {
              key: 'heading',
            }, [
              React.createElement('span', {
                key: 'heading-label',
                className: 'block text-gray-400 text-xs mb-1'
              }, 'HEADING'),
              React.createElement('span', {
                key: 'heading-value',
                className: 'text-3xl font-mono text-green-500 font-bold tracking-tighter'
              }, [
                Math.round(aircraft.heading).toString().padStart(3,'0'),
                React.createElement('span', {
                  key: 'heading-unit',
                  className: 'text-sm text-green-700 ml-1'
                }, '°')
              ])
            ]),
            React.createElement('div', {
              key: 'coordinates',
            }, [
              React.createElement('span', {
                key: 'coordinates-label',
                className: 'block text-gray-400 text-xs mb-1'
              }, 'COORDINATES'),
              React.createElement('div', {
                key: 'coordinates-values',
                className: 'flex flex-col font-mono text-cyan-500 text-sm'
              }, [
                React.createElement('span', {
                  key: 'coordinate-x',
                }, 'X: ' + aircraft.x.toFixed(2) + ' NM'),
                React.createElement('span', {
                  key: 'coordinate-y',
                }, 'Y: ' + aircraft.y.toFixed(2) + ' NM')
              ])
            ])
          ]),

          // 速度倍率滑块
          React.createElement('div', {
            key: 'speed-multiplier',
            className: 'pt-3 border-t border-gray-800'
          }, [
            React.createElement('div', {
              key: 'speed-header',
              className: 'flex justify-between items-end mb-1'
            }, [
              React.createElement('label', {
                key: 'speed-label',
            }, 'Speed Multiplier'),
            React.createElement('span', {
              key: 'speed-value',
              className: 'text-cyan-500 font-mono text-xs'
            }, '×' + (aircraft.gs / 432).toFixed(1))
          ]),
          React.createElement('input', {
            key: 'speed-input',
            type: 'range',
            min: '1',
            max: '10',
            step: '1',
            value: Math.round(aircraft.gs / 432),
            onChange: (e) => {
              const multiplier = parseFloat(e.target.value);
              const baseSpeed = 432; // ~0.12 NM/s base speed
              const newGs = Math.round(baseSpeed * multiplier);
              setAircraft(prev => ({
                ...prev,
                gs: newGs,
                tas: newGs + 25
              }));
              // 同步 ref 供动画循环使用
              aircraftPosRef.current = { ...aircraftPosRef.current, gs: newGs };
            },
            className: 'w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-all'
          }),
          React.createElement('div', {
            key: 'speed-range',
            className: 'flex justify-between text-[9px] text-gray-600 mt-1 font-mono'
          }, [
            React.createElement('span', {
              key: 'speed-min',
            }, '×0.5'),
            React.createElement('span', {
              key: 'speed-mid',
            }, '×1'),
            React.createElement('span', {
              key: 'speed-max',
            }, '×10')
          ])
        ]),

        React.createElement('div', {
          key: 'operation-guide',
          className: 'bg-gray-800/40 border border-gray-700/50 p-4 rounded-lg'
        }, [
          React.createElement('h3', {
            key: 'guide-title',
            className: 'font-bold text-gray-300 mb-3 uppercase text-xs tracking-wider border-b border-gray-700 pb-2'
          }, 'Operation Guide'),
          React.createElement('ul', {
            key: 'guide-list',
            className: 'space-y-2.5 text-xs font-mono text-gray-400'
          }, [
            React.createElement('li', {
              key: 'terr',
              className: 'flex items-center'
            }, [
              React.createElement('span', {
                key: 'terr-btn',
                className: 'w-14 inline-block text-white bg-green-900/80 px-1 py-0.5 rounded text-center mr-3 border border-green-800 shadow-sm text-[10px] font-bold'
              }, 'TERR'),
              React.createElement('span', {
                key: 'terr-text',
              }, '切换 EGPWS 地形显示')
            ]),
            React.createElement('li', {
              key: 'wxr',
              className: 'flex items-center'
            }, [
              React.createElement('span', {
                key: 'wxr-btn',
                className: 'w-14 inline-block text-white bg-blue-900/80 px-1 py-0.5 rounded text-center mr-3 border border-blue-800 shadow-sm text-[10px] font-bold'
              }, 'WXR'),
              React.createElement('span', {
                key: 'wxr-text',
              }, '切换天气雷达')
            ]),
            React.createElement('li', {
              key: 'chro',
              className: 'flex items-center'
            }, [
              React.createElement('span', {
                key: 'chro-btn',
                className: 'w-14 inline-block text-white bg-gray-600 px-1 py-0.5 rounded text-center mr-3 border border-gray-500 shadow-sm text-[10px] font-bold'
              }, 'CHRO'),
              React.createElement('span', {
                key: 'chro-text',
              }, '启动/停止/重置计时器')
            ]),
            React.createElement('li', {
              key: 'fail',
              className: 'flex items-center'
            }, [
              React.createElement('span', {
                key: 'fail-btn',
                className: 'w-14 inline-block text-white bg-red-900/80 px-1 py-0.5 rounded text-center mr-3 border border-red-800 shadow-sm text-[10px] font-bold'
              }, 'FAIL'),
              React.createElement('span', {
                key: 'fail-text',
              }, '模拟信号故障')
            ]),
            React.createElement('li', {
              key: 'note',
              className: 'pt-1 text-[10px] text-gray-500 italic leading-relaxed'
            }, '* 飞机自动循环飞行路线（WPT1 → FINAL → WPT1）。')
          ])
        ])
      ])
    ])
  ])
  ]);
};

export default App;
