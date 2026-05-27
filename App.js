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
  
  // System State
  const [systemState, setSystemState] = useState({
    showTerrain: false,
    showWeather: false,
    showChrono: false,
    chronoStartTime: null,
    isFailureSimulated: false,
  });

  // Teaching Mode State (Auto Modal)
  const [explainedModes, setExplainedModes] = useState(new Set());
  const [activeExplanation, setActiveExplanation] = useState(null);


  // Effect to trigger modal when mode changes
  useEffect(() => {
    if (!explainedModes.has(mode)) {
        setActiveExplanation(MODE_DESCRIPTIONS[mode]);
        setExplainedModes(prev => new Set(prev).add(mode));
    }
  }, [mode]);

  const closeModal = () => {
      setActiveExplanation(null);
  };



  // Track the index of the waypoint we are flying TO.
  // Start at 1 (Flying from 0 -> 1)
  const targetIndexRef = useRef(1);
  
  // Flight phase: 'STRAIGHT' | 'TURNING'
  const flightPhaseRef = useRef('STRAIGHT');
  
  // Turn state: arc angle during turn (radians)
  const turnArcAngleRef = useRef(0);
  
  // Cached turn data (outbound heading, direction, arc center, etc.)
  const turnDataRef = useRef(null);
  
  // Aircraft position ref for physics engine (avoids setAircraft async issues)
  const aircraftPosRef = useRef({ x: 0, y: 0, gs: 432 });
  
  // 调试信息
  console.log('初始目标索引:', targetIndexRef.current);

  // Simulated Aircraft State
  const [aircraft, setAircraft] = useState({
    x: 0, 
    y: 0,
    heading: 0, 
    track: 0,
    gs: 432,
    tas: 457,
    windDir: 90,
    windSpeed: 25,
    selectedHeading: 0,
    course: 340,
    nextWaypointId: '' // Will be set in effect
  });

  // Init position and heading to start of route
  useEffect(() => {
    if (activeRoute && activeRoute.waypoints.length > 1) {
       const start = activeRoute.waypoints[0];
       const next = activeRoute.waypoints[1];
       aircraftPosRef.current = { x: start.x, y: start.y, gs: 432 };
       
       // Compute initial heading from first leg
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
       console.log('Init position:', start.x, start.y, 'heading:', initHeading.toFixed(1));
    }
  }, [activeRoute]);

  // Toggle Handlers
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

  // --- AUTO VOR TUNING ---
  // Update auto-tuning based on aircraft position
  useEffect(() => {
    if (tuningState.mode === 'auto') {
      const nearest = findNearestVORStation(aircraft.x, aircraft.y);
      if (nearest) {
        updateAutoTuning(nearest.id, nearest.frequency);
      }
    }
  }, [aircraft.x, aircraft.y, tuningState.mode]);

  // --- PHYSICS ENGINE ---
  useEffect(() => {
    let animationFrameId;
    let lastTime = Date.now();
    
    // Constants matching NDDisplay.js
    const ND_WIDTH = 600;
    
    // Standard rate turn = 3°/s
    // Turn radius = V / (ω * 3600) where ω = 3°/s in rad/s
    // At 432 kts: r = 432 / (3600 * π/60) ≈ 2.3 NM
    const TURN_RATE_DEG_PER_SEC = 3;
    const TURN_RATE_RAD_PER_SEC = TURN_RATE_DEG_PER_SEC * Math.PI / 180;
    
    const animate = () => {
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // ==========================================
      // PHASE 1: Read current state from refs (synchronous)
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
      // PHASE 2: Compute turn data (synchronous)
      // ==========================================
      // Real A320 fly-over waypoint turn with proper circular arc:
      // 1. Aircraft flies straight toward the target waypoint
      // 2. Upon reaching the waypoint, it begins a standard rate turn
      // 3. During the turn, the aircraft follows a circular arc of radius
      //    turnRadiusNM, centered at a point perpendicular to the inbound
      //    heading at distance turnRadiusNM from the waypoint.
      // 4. When heading matches the outbound leg, resume straight flight
      //
      // Turn data is computed once when approaching a waypoint.
      const prevIdx = Math.max(0, currentTargetIdx - 1);
      const prevWpt = route[prevIdx];
      const hasNextWpt = currentTargetIdx < route.length - 1;

      const inDx = targetWpt.x - prevWpt.x;
      const inDy = targetWpt.y - prevWpt.y;
      const inLen = Math.sqrt(inDx * inDx + inDy * inDy);

      // Compute turn data only when approaching a waypoint that needs a turn
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

          if (angle > 0.087) { // ~5 degrees minimum
            // Compute inbound heading
            const inboundHeadingRad = Math.atan2(inDx, inDy);
            let inboundHeadingDeg = inboundHeadingRad * (180 / Math.PI);
            if (inboundHeadingDeg < 0) inboundHeadingDeg += 360;

            // Compute outbound heading
            const outboundHeadingRad = Math.atan2(outDx, outDy);
            let outboundHeadingDeg = outboundHeadingRad * (180 / Math.PI);
            if (outboundHeadingDeg < 0) outboundHeadingDeg += 360;

            // Calculate turn angle (signed, negative = left turn / heading decreases)
            let turnAngle = outboundHeadingDeg - inboundHeadingDeg;
            // Normalize to [-180, 180]
            if (turnAngle > 180) turnAngle -= 360;
            if (turnAngle < -180) turnAngle += 360;
            const absTurnAngle = Math.abs(turnAngle);
            // Left turn: heading decreases (turnAngle < 0)
            // Right turn: heading increases (turnAngle > 0)
            const isLeftTurn = turnAngle < 0;

            // Compute turn radius in NM
            const turnRadiusNM = gs / (3600 * TURN_RATE_RAD_PER_SEC);
            
            // For fly-over turn: arc center is perpendicular to inbound heading
            // at distance turnRadiusNM from the waypoint.
            // Left turn (heading decreases): center is to the LEFT of inbound direction.
            //   In aviation heading: left = heading - 90°
            // Right turn (heading increases): center is to the RIGHT of inbound direction.
            //   In aviation heading: right = heading + 90°
            const perpAngleRad = inboundHeadingRad + (isLeftTurn ? -Math.PI / 2 : Math.PI / 2);
            const arcCenterX = targetWpt.x + Math.sin(perpAngleRad) * turnRadiusNM;
            const arcCenterY = targetWpt.y + Math.cos(perpAngleRad) * turnRadiusNM;
            
            // Arc start angle: angle from arc center to waypoint
            // Uses atan2(dx, dy) which returns aviation heading (0°=north, CW)
            const arcStartAngle = Math.atan2(targetWpt.x - arcCenterX, targetWpt.y - arcCenterY);
            
            // Total arc angle: the signed angular distance the aircraft travels along the arc.
            // Left turn (heading decreases) = CCW rotation in world:
            //   aviation heading angle DECREASES along the arc
            //   totalArcAngle should be NEGATIVE
            // Right turn (heading increases) = CW rotation in world:
            //   aviation heading angle INCREASES along the arc
            //   totalArcAngle should be POSITIVE
            const absTurnAngleRad = absTurnAngle * Math.PI / 180;
            const totalArcAngle = isLeftTurn ? -absTurnAngleRad : absTurnAngleRad;
            
            // Arc end angle: arcStartAngle + totalArcAngle
            // (the angle at the arc center corresponding to the end of the turn)
            let arcEndAngle = arcStartAngle + totalArcAngle;
            // Normalize to [-π, π]
            if (arcEndAngle > Math.PI) arcEndAngle -= 2 * Math.PI;
            if (arcEndAngle < -Math.PI) arcEndAngle += 2 * Math.PI;
            
            // Store turn data with arc geometry
            turnDataRef.current = {
              inboundHeadingDeg,
              outboundHeadingDeg,
              isLeftTurn,
              turnAngle,
              absTurnAngle,
              nextWpt,
              uOutX, uOutY,
              // Arc geometry
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
      // PHASE 3: Get current aircraft position from ref
      // ==========================================
      const pos = aircraftPosRef.current;

      // Distance to current target waypoint
      const dx = targetWpt.x - pos.x;
      const dy = targetWpt.y - pos.y;
      const distToTarget = Math.sqrt(dx*dx + dy*dy);

      const nmPerSec = (gs / 3600) * speedFactor;
      const moveDist = nmPerSec * dt;

      // ==========================================
      // PHASE 4: Flight phase management & movement
      // ==========================================
      // Fly-over waypoint turn with proper circular arc:
      //   STRAIGHT: Fly directly toward the target waypoint
      //   Upon reaching waypoint: enter TURNING phase
      //   TURNING: Aircraft follows a circular arc of radius turnRadiusNM
      //     - Arc center is perpendicular to inbound heading at turnRadiusNM from waypoint
      //     - Position moves along the arc, heading is tangent to the arc
      //     - When arc is complete (heading matches outbound), resume STRAIGHT
      
      let newPos;
      let newHeading;
      let newNextWptId = targetWpt.id;

      // --- PHASE: TURNING (proper circular arc) ---
      if (flightPhaseRef.current === 'TURNING' && turnData) {
        // Current arc angle
        let currentAngle = turnArcAngleRef.current;
        
        // Angular step along the arc: arcLength / radius = (speed * dt) / radius
        const angularStep = moveDist / turnData.turnRadiusNM;
        
        // Advance the angle along the arc.
        // Left turn (heading decreases) = CCW rotation in world:
        //   aviation heading angle DECREASES along CCW arc
        // Right turn (heading increases) = CW rotation in world:
        //   aviation heading angle INCREASES along CW arc
        let newAngle = currentAngle + (turnData.isLeftTurn ? -angularStep : angularStep);
        
        // Check if we've completed the arc.
        // totalArcAngle is the signed angular distance from arcStartAngle to arcEndAngle.
        // For left turns (CCW in world): totalArcAngle is negative (aviation heading decreases)
        // For right turns (CW in world): totalArcAngle is positive (aviation heading increases)
        // We've completed the arc when the angle has traveled past arcEndAngle.
        const angleTraveled = newAngle - turnData.arcStartAngle;
        
        // For left turns (negative totalArcAngle): completed when angleTraveled <= totalArcAngle
        // For right turns (positive totalArcAngle): completed when angleTraveled >= totalArcAngle
        const arcComplete = (turnData.isLeftTurn && angleTraveled <= turnData.totalArcAngle) ||
                            (!turnData.isLeftTurn && angleTraveled >= turnData.totalArcAngle);
        
        if (arcComplete) {
          // Arc complete - resume straight flight
          console.log('TURN complete (arc)');
          flightPhaseRef.current = 'STRAIGHT';
          turnDataRef.current = null;
          turnArcAngleRef.current = 0;
          targetIndexRef.current = currentTargetIdx + 1;
          
          // Position at arc end point
          const endAngle = turnData.arcEndAngle;
          newPos = {
            x: turnData.arcCenterX + Math.sin(endAngle) * turnData.turnRadiusNM,
            y: turnData.arcCenterY + Math.cos(endAngle) * turnData.turnRadiusNM
          };
          
          // Move forward along outbound heading
          const headingRad = turnData.outboundHeadingDeg * Math.PI / 180;
          newPos = {
            x: newPos.x + Math.sin(headingRad) * moveDist,
            y: newPos.y + Math.cos(headingRad) * moveDist
          };
          
          newHeading = turnData.outboundHeadingDeg;
          newNextWptId = turnData.nextWpt.id;
        } else {
          // Still on the arc - compute position from arc center and angle
          turnArcAngleRef.current = newAngle;
          
          // Position on the arc
          newPos = {
            x: turnData.arcCenterX + Math.sin(newAngle) * turnData.turnRadiusNM,
            y: turnData.arcCenterY + Math.cos(newAngle) * turnData.turnRadiusNM
          };
          
          // Heading is tangent to the arc:
          // Left turn (CCW rotation in world): heading = angle - 90° (heading decreases along CCW arc)
          // Right turn (CW rotation in world): heading = angle + 90° (heading increases along CW arc)
          const tangentAngleRad = newAngle + (turnData.isLeftTurn ? -Math.PI / 2 : Math.PI / 2);
          newHeading = tangentAngleRad * (180 / Math.PI);
          if (newHeading < 0) newHeading += 360;
          
          newNextWptId = targetWpt.id;
        }
      }
      // --- PHASE: STRAIGHT (default) ---
      else {
        // Check if we've reached the target waypoint
        if (distToTarget < 0.3) {
          console.log('到达目标:', targetWpt.name, '当前索引:', currentTargetIdx);
          
          if (currentTargetIdx === route.length - 1) {
            // Loop back to start
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
          
          // Check if a turn is needed
          if (turnData) {
            // Start turning - begin circular arc from waypoint
              flightPhaseRef.current = 'TURNING';
              turnArcAngleRef.current = turnData.arcStartAngle;
              console.log('-> TURNING phase at waypoint:', targetWpt.name,
                'inbound:', turnData.inboundHeadingDeg.toFixed(1),
                '-> outbound:', turnData.outboundHeadingDeg.toFixed(1),
                'radius:', turnData.turnRadiusNM.toFixed(2), 'NM');
              
              // First step along the arc
              // Left turn (CCW in world): aviation heading angle decreases
              // Right turn (CW in world): aviation heading angle increases
              const angularStep = moveDist / turnData.turnRadiusNM;
              const firstAngle = turnData.arcStartAngle + (turnData.isLeftTurn ? -angularStep : angularStep);
              turnArcAngleRef.current = firstAngle;
              
              // Position on the arc
              newPos = {
                x: turnData.arcCenterX + Math.sin(firstAngle) * turnData.turnRadiusNM,
                y: turnData.arcCenterY + Math.cos(firstAngle) * turnData.turnRadiusNM
              };
              
              // Heading tangent to the arc
              // Left turn (CCW in world): heading = angle - 90°
              // Right turn (CW in world): heading = angle + 90°
              const tangentAngleRad = firstAngle + (turnData.isLeftTurn ? -Math.PI / 2 : Math.PI / 2);
              newHeading = tangentAngleRad * (180 / Math.PI);
              if (newHeading < 0) newHeading += 360;
              newNextWptId = targetWpt.id;
          } else {
            // No turn needed - advance to next waypoint
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
          // Fly straight toward the target waypoint
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

      // Update aircraft position ref (synchronous)
      aircraftPosRef.current = { ...newPos, gs: aircraftPosRef.current.gs || 432 };

      // Update React state (async, but refs are already updated)
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
    // --- FLIGHT PLAN MANAGER ---
    React.createElement(FlightPlanManager, { key: 'flight-plan-manager' }),

    // --- MODE EXPLANATION MODAL ---
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


    // Main Layout
    React.createElement('div', {
      key: 'main-layout',
      className: 'flex flex-col lg:flex-row gap-8 lg:gap-16 items-start justify-center w-full max-w-7xl'
    }, [
      // LEFT COLUMN: ND Display
      React.createElement('div', {
        key: 'nd-display-column',
        className: 'flex flex-col items-center space-y-4 flex-shrink-0'
      }, [
        React.createElement('div', {
          key: 'nd-display-container',
          className: 'relative group shadow-2xl rounded-2xl bg-black'
        }, [
          // CANVAS
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

      // RIGHT COLUMN: Controls
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

        // Map Loader
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

        // Telemetry
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

          // Speed Multiplier
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
            min: '0.5',
            max: '4',
            step: '0.5',
            value: (aircraft.gs / 432).toFixed(1),
            onChange: (e) => {
              const multiplier = parseFloat(e.target.value);
              const baseSpeed = 432; // ~0.12 NM/s base speed
              const newGs = Math.round(baseSpeed * multiplier);
              setAircraft(prev => ({
                ...prev,
                gs: newGs,
                tas: newGs + 25
              }));
              // Sync ref for animate loop
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
            }, '×4')
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
              }, 'Toggle EGPWS Terrain Map')
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
              }, 'Toggle Weather Radar')
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
              }, 'Start/Stop/Reset Stopwatch')
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
              }, 'Simulate Signal Failure')
            ]),
            React.createElement('li', {
              key: 'note',
              className: 'pt-1 text-[10px] text-gray-500 italic leading-relaxed'
            }, '* The aircraft automatically loops the route (WPT1 → FINAL → WPT1).')
          ])
        ])
      ])
    ])
  ])
  ]);
};

export default App;
