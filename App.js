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
  
  // Flight phase: 'STRAIGHT' | 'APPROACH' | 'ARC'
  const flightPhaseRef = useRef('STRAIGHT');
  
  // Cached arc data for the current transition (computed once when entering APPROACH)
  const arcDataRef = useRef(null);
  
  // Current angle position along the arc (for continuous arc movement)
  const arcAngleRef = useRef(0);
  
  // Aircraft position ref for physics engine (avoids setAircraft async issues)
  const aircraftPosRef = useRef({ x: 0, y: 0 });
  
  // 调试信息
  console.log('初始目标索引:', targetIndexRef.current);

  // Simulated Aircraft State
  const [aircraft, setAircraft] = useState({
    x: 0, 
    y: 0,
    heading: 0, 
    track: 0,
    gs: 500,
    tas: 525,
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
       aircraftPosRef.current = { x: start.x, y: start.y };
       
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
    const CORNER_RADIUS_PX = 80; // Must match NDDisplay.js cornerRadius
    
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

      // Calculate pxPerNM based on current range
      const pxPerNM = ND_WIDTH / (2 * range);
      const cornerRadiusNM = CORNER_RADIUS_PX / pxPerNM;

      const speedFactor = 6;

      // ==========================================
      // PHASE 2: Compute arc data (synchronous, outside setAircraft)
      // ==========================================
      const prevIdx = Math.max(0, currentTargetIdx - 1);
      const prevWpt = route[prevIdx];
      const hasNextWpt = currentTargetIdx < route.length - 1;

      const inDx = targetWpt.x - prevWpt.x;
      const inDy = targetWpt.y - prevWpt.y;
      const inLen = Math.sqrt(inDx * inDx + inDy * inDy);

      // Compute arc data once and cache it (synchronous, outside setAircraft)
      if (hasNextWpt && !arcDataRef.current) {
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
            const r = Math.min(cornerRadiusNM, inLen * 0.4, outLen * 0.4);
            const halfAngle = angle / 2;
            const cotHalfAngle = Math.cos(halfAngle) / Math.sin(halfAngle);
            const d = r * cotHalfAngle;

            const arcStartX = targetWpt.x - uInX * d;
            const arcStartY = targetWpt.y - uInY * d;
            const arcEndX = targetWpt.x + uOutX * d;
            const arcEndY = targetWpt.y + uOutY * d;

            // Find circle center
            const nInX = -uInY;
            const nInY = uInX;
            const nOutX = -uOutY;
            const nOutY = uOutX;
            const det = -nInX * nOutY + nOutX * nInY;

            if (Math.abs(det) > 0.0001) {
              const diffX = arcEndX - arcStartX;
              const diffY = arcEndY - arcStartY;
              const t1 = (-nOutY * diffX + nOutX * diffY) / det;
              const centerX = arcStartX + nInX * t1;
              const centerY = arcStartY + nInY * t1;
              const cross = uInX * uOutY - uInY * uOutX;
              const isClockwise = cross > 0;

              // CRITICAL: Use the actual radius from the center calculation (|t1|),
              // NOT the desired radius r. The center is computed as the intersection
              // of perpendicular lines through arcStart/arcEnd, and |t1| is the true
              // distance from center to arcStart. Using r instead causes the parametric
              // equation (centerX + r*cos(angle)) to produce positions on a DIFFERENT
              // circle that does NOT pass through arcStart/arcEnd, resulting in the
              // "jump to the right" bug when transitioning from APPROACH to ARC.
              const actualR = Math.abs(t1);

              // Pre-compute start/end angles
              const toStartX = arcStartX - centerX;
              const toStartY = arcStartY - centerY;
              const startAngle = Math.atan2(toStartY, toStartX);
              const toEndX = arcEndX - centerX;
              const toEndY = arcEndY - centerY;
              const endAngle = Math.atan2(toEndY, toEndX);

              // Compute angular span
              let angularSpan;
              if (isClockwise) {
                angularSpan = endAngle - startAngle;
                if (angularSpan < 0) angularSpan += 2 * Math.PI;
              } else {
                angularSpan = startAngle - endAngle;
                if (angularSpan < 0) angularSpan += 2 * Math.PI;
              }

              // Trigger distance: when to start APPROACH phase
              const triggerDist = Math.max(d, Math.min(inLen, outLen) * 0.25);

              // Compute inbound heading (aviation heading of the leg from prevWpt to targetWpt)
              // Aviation heading: atan2(dx, dy), 0°=north (up=+y), 90°=east (right=+x)
              // This is the CORRECT aviation heading formula for world (y=North) coordinate system.
              // Verified: atan2(dx, dy) gives correct heading for all directions including diagonals.
              const inboundHeadingRad = Math.atan2(inDx, inDy);
              let inboundHeadingDeg = inboundHeadingRad * (180 / Math.PI);
              if (inboundHeadingDeg < 0) inboundHeadingDeg += 360;

              arcDataRef.current = {
                arcStartX, arcStartY,
                arcEndX, arcEndY,
                centerX, centerY,
                r: actualR, d,
                uInX, uInY,
                uOutX, uOutY,
                isClockwise,
                nextWpt,
                startAngle, endAngle,
                angularSpan,
                triggerDist,
                inboundHeadingDeg
              };
              console.log('ARC data computed: desiredR=' + r.toFixed(2) + ' actualR=' + actualR.toFixed(2) + ' d=' + d.toFixed(2) + ' angle=' + (angle*180/Math.PI).toFixed(1) + 'deg span=' + (angularSpan*180/Math.PI).toFixed(1) + 'deg cw=' + isClockwise);
            }
          }
        }
      }

      const arcData = arcDataRef.current;

      // ==========================================
      // PHASE 3: Get current aircraft position from ref
      // ==========================================
      const pos = aircraftPosRef.current;
      const gs = 500; // Default GS, will be updated from setAircraft

      // Distance to current target waypoint
      const dx = targetWpt.x - pos.x;
      const dy = targetWpt.y - pos.y;
      const distToTarget = Math.sqrt(dx*dx + dy*dy);

      const nmPerSec = (gs / 3600) * speedFactor;
      const moveDist = nmPerSec * dt;

      // ==========================================
      // PHASE 4: Flight phase management (synchronous, outside setAircraft)
      // ==========================================
      
      // 1. ARRIVAL CHECK
      // During ARC phase, use distance to arcEnd instead of targetWpt to prevent premature termination
      if (flightPhaseRef.current === 'ARC' && arcData) {
        const toArcEndX = arcData.arcEndX - pos.x;
        const toArcEndY = arcData.arcEndY - pos.y;
        const distToArcEnd = Math.sqrt(toArcEndX * toArcEndX + toArcEndY * toArcEndY);
        
        if (distToArcEnd < 0.3) {
          console.log('ARC complete via arrival check, distToArcEnd:', distToArcEnd.toFixed(3));
          flightPhaseRef.current = 'STRAIGHT';
          arcDataRef.current = null;
          arcAngleRef.current = 0;
          targetIndexRef.current = currentTargetIdx + 1;
          
          const newLegDx = arcData.nextWpt.x - arcData.arcEndX;
          const newLegDy = arcData.nextWpt.y - arcData.arcEndY;
          let newLegHeading = Math.atan2(newLegDx, newLegDy) * (180 / Math.PI);
          if (newLegHeading < 0) newLegHeading += 360;
          
          aircraftPosRef.current = { x: arcData.arcEndX, y: arcData.arcEndY };
          setAircraft(a => ({ ...a, x: arcData.arcEndX, y: arcData.arcEndY, heading: newLegHeading, track: newLegHeading, selectedHeading: newLegHeading, nextWaypointId: arcData.nextWpt.id }));
          animationFrameId = requestAnimationFrame(animate);
          return;
        }
      } else if (distToTarget < 0.5) {
         console.log('到达目标:', targetWpt.name, '当前索引:', currentTargetIdx);
         
         // Reset flight phase
         flightPhaseRef.current = 'STRAIGHT';
         arcDataRef.current = null;
         arcAngleRef.current = 0;
         
         if (currentTargetIdx === route.length - 1) {
            // Loop back to start
            console.log('到达最后一个航路点，重新开始循环');
            const newStartWpt = route[0];
            const newEndWpt = route[1];
            const legDx = newEndWpt.x - newStartWpt.x;
            const legDy = newEndWpt.y - newStartWpt.y;
            let legHeading = Math.atan2(legDx, legDy) * (180 / Math.PI);
            if (legHeading < 0) legHeading += 360;
            targetIndexRef.current = 1;
            aircraftPosRef.current = { x: newStartWpt.x, y: newStartWpt.y };
            setAircraft(a => ({ ...a, x: newStartWpt.x, y: newStartWpt.y, heading: legHeading, track: legHeading, selectedHeading: legHeading, nextWaypointId: newEndWpt.id }));
            animationFrameId = requestAnimationFrame(animate);
            return;
         } else {
            // Advance to next waypoint
            const nextIdx = currentTargetIdx + 1;
            const newStartWpt = targetWpt;
            const newEndWpt = route[nextIdx];
            const legDx = newEndWpt.x - newStartWpt.x;
            const legDy = newEndWpt.y - newStartWpt.y;
            let legHeading = Math.atan2(legDx, legDy) * (180 / Math.PI);
            if (legHeading < 0) legHeading += 360;
            targetIndexRef.current = nextIdx;
            aircraftPosRef.current = { x: newStartWpt.x, y: newStartWpt.y };
            setAircraft(a => ({ ...a, x: newStartWpt.x, y: newStartWpt.y, heading: legHeading, track: legHeading, selectedHeading: legHeading, nextWaypointId: newEndWpt.id }));
            animationFrameId = requestAnimationFrame(animate);
            return;
         }
      }

      // 2. APPROACH phase detection
      if (arcData && flightPhaseRef.current === 'STRAIGHT') {
        const acDx = pos.x - prevWpt.x;
        const acDy = pos.y - prevWpt.y;
        const projT = Math.max(0, Math.min(inLen, acDx * arcData.uInX + acDy * arcData.uInY));
        const distFromProjToTarget = inLen - projT;

        if (distFromProjToTarget <= arcData.triggerDist) {
          flightPhaseRef.current = 'APPROACH';
          console.log('-> APPROACH phase started, distToTarget:', distToTarget.toFixed(2), 'triggerDist:', arcData.triggerDist.toFixed(2));
        }
      }

      // 3. ARC phase detection — REMOVED
      // The ARC phase is now entered exclusively through the APPROACH phase execution
      // (when the aircraft reaches arcStart within 0.05 NM). This eliminates the conflict
      // between two paths entering ARC (via projection check vs. via distance-to-arcStart check).
      // The old projection-based ARC detection could set arcAngleRef to a wrong intermediate
      // position (arcFrac), causing the aircraft to "jump to the right" instead of starting
      // smoothly from arcStart.

      // ==========================================
      // PHASE 5: EXECUTE MOVEMENT (synchronous)
      // ==========================================
      
      let newPos;
      let newHeading;
      let newNextWptId = targetWpt.id;

      // --- PHASE: ARC ---
      if (flightPhaseRef.current === 'ARC' && arcData) {
        // Ensure the current angle is within valid range
        // Clamp to [startAngle, endAngle] to prevent accumulated errors from pushing the angle outside
        let currentAngle = arcAngleRef.current;
        
        // Compute angular step for this frame
        const angularStep = moveDist / arcData.r;
        let newAngle;
        if (arcData.isClockwise) {
          newAngle = currentAngle + angularStep;
        } else {
          newAngle = currentAngle - angularStep;
        }
        arcAngleRef.current = newAngle;

        // Force position onto the arc circle using parametric equation
        // This guarantees the aircraft stays exactly on the arc path
        const newArcX = arcData.centerX + arcData.r * Math.cos(newAngle);
        const newArcY = arcData.centerY + arcData.r * Math.sin(newAngle);

        // Compute aircraft heading directly from arc geometry.
        // The heading at any point on the arc is:
        //   heading = inboundHeading ∓ anglePastStart
        //   (- for CCW/left turn, + for CW/right turn)
        //
        // This is because for a LEFT turn (CCW), the parametric angle increases
        // but the heading DECREASES (turning left = heading decreases).
        // For a RIGHT turn (CW), the parametric angle decreases
        // but the heading INCREASES (turning right = heading increases).
        //
        // This is mathematically guaranteed to be correct because:
        // - At anglePastStart=0: heading = inboundHeading (tangent to inbound leg)
        // - At anglePastStart=angularSpan: heading = outboundHeading (tangent to outbound leg)
        // - In between: heading changes linearly with the angle traveled
        //
        // This approach is more robust than:
        // - The parametric formula (atan2(sin(θ), cos(θ)) = θ), which depends on correct isClockwise
        // - The position-delta approach (atan2(dx, dy)), which is sensitive to numerical noise
        //   and gives the chord direction (midpoint heading) rather than the tangent direction
        let anglePastStartDeg;
        if (arcData.isClockwise) {
          anglePastStartDeg = (newAngle - arcData.startAngle) * (180 / Math.PI);
          if (anglePastStartDeg < 0) anglePastStartDeg += 360;
        } else {
          anglePastStartDeg = (arcData.startAngle - newAngle) * (180 / Math.PI);
          if (anglePastStartDeg < 0) anglePastStartDeg += 360;
        }
        
        // For a LEFT turn (CCW, isClockwise=true), the parametric angle increases
        // but the heading DECREASES (turning left = heading decreases).
        // For a RIGHT turn (CW, isClockwise=false), the parametric angle decreases
        // but the heading INCREASES (turning right = heading increases).
        // So the sign is OPPOSITE to isClockwise.
        if (arcData.isClockwise) {
          // LEFT turn (CCW): heading decreases as angle increases
          newHeading = arcData.inboundHeadingDeg - anglePastStartDeg;
        } else {
          // RIGHT turn (CW): heading increases as angle decreases
          newHeading = arcData.inboundHeadingDeg + anglePastStartDeg;
        }
        // Normalize to [0, 360)
        newHeading = ((newHeading % 360) + 360) % 360;
        
        // Debug heading frequently during ARC
        if (typeof window._arcFrameCount === 'undefined') window._arcFrameCount = 0;
        window._arcFrameCount++;
        // Log every 5 frames
        if (window._arcFrameCount % 5 === 0) {
          // Also compute parametric heading for comparison
          let paramHeadingRad;
          if (arcData.isClockwise) {
            paramHeadingRad = newAngle + Math.PI;
          } else {
            paramHeadingRad = newAngle;
          }
          paramHeadingRad = ((paramHeadingRad % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
          const paramHeadingDeg = paramHeadingRad * (180 / Math.PI);
          
          console.log('ARC heading debug:',
            'θ(deg):', (newAngle * 180 / Math.PI).toFixed(1),
            'inbound:', arcData.inboundHeadingDeg.toFixed(1),
            'pastStart:', anglePastStartDeg.toFixed(1),
            'span(deg):', (arcData.angularSpan * 180 / Math.PI).toFixed(1),
            'cw:', arcData.isClockwise,
            'geoHeading:', newHeading.toFixed(1),
            'paramHeading:', paramHeadingDeg.toFixed(1),
            'diff:', (newHeading - paramHeadingDeg).toFixed(1));
        }

        // anglePastStartDeg is already computed above for the heading calculation
        const anglePastStartRad = anglePastStartDeg * (Math.PI / 180);
        const passedEnd = anglePastStartRad >= arcData.angularSpan - 0.01;

        if (passedEnd) {
          // Snap to arcEnd precisely to prevent any deviation
          flightPhaseRef.current = 'STRAIGHT';
          arcDataRef.current = null;
          arcAngleRef.current = 0;
          targetIndexRef.current = currentTargetIdx + 1;

          const newLegDx = arcData.nextWpt.x - arcData.arcEndX;
          const newLegDy = arcData.nextWpt.y - arcData.arcEndY;
          let newLegHeading = Math.atan2(newLegDx, newLegDy) * (180 / Math.PI);
          if (newLegHeading < 0) newLegHeading += 360;

          console.log('ARC complete via passedEnd, advancing to:', arcData.nextWpt.name, 'anglePastStart:', anglePastStartDeg.toFixed(1), 'span:', (arcData.angularSpan*180/Math.PI).toFixed(1));
          newPos = { x: arcData.arcEndX, y: arcData.arcEndY };
          // Sync aircraftPosRef immediately to arcEnd
          aircraftPosRef.current = newPos;
          newHeading = newLegHeading;
          newNextWptId = arcData.nextWpt.id;
        } else {
          newPos = { x: newArcX, y: newArcY };
          // Log first few ARC frames for debugging
          if (Math.abs(anglePastStartDeg) < 3) {
            console.log('ARC moving, angle:', (newAngle*180/Math.PI).toFixed(2), 'pastStart:', anglePastStartDeg.toFixed(2), 'heading:', newHeading.toFixed(1), 'pos:', newArcX.toFixed(2), newArcY.toFixed(2));
          }
        }
      }
      // --- PHASE: APPROACH ---
      else if (flightPhaseRef.current === 'APPROACH' && arcData) {
        const toArcStartX = arcData.arcStartX - pos.x;
        const toArcStartY = arcData.arcStartY - pos.y;
        const distToArcStart = Math.sqrt(toArcStartX * toArcStartX + toArcStartY * toArcStartY);

        if (distToArcStart > 0.05) {
          const approachSpeed = Math.min(moveDist, distToArcStart);
          const approachX = pos.x + (toArcStartX / distToArcStart) * approachSpeed;
          const approachY = pos.y + (toArcStartY / distToArcStart) * approachSpeed;
          let approachHeading = Math.atan2(toArcStartX, toArcStartY) * (180 / Math.PI);
          if (approachHeading < 0) approachHeading += 360;
          newPos = { x: approachX, y: approachY };
          newHeading = approachHeading;
          console.log('APPROACH moving to arcStart, dist:', distToArcStart.toFixed(4), 'pos:', pos.x.toFixed(2), pos.y.toFixed(2), 'arcStart:', arcData.arcStartX.toFixed(2), arcData.arcStartY.toFixed(2));
        } else {
          // Snap to arcStart precisely, then transition to ARC
          // Set position to arcStart and angle to startAngle
          // Do NOT execute ARC movement in the same frame to avoid angularStep jump
          flightPhaseRef.current = 'ARC';
          arcAngleRef.current = arcData.startAngle;
          // Set both ref and newPos to arcStart for seamless transition
          aircraftPosRef.current = { x: arcData.arcStartX, y: arcData.arcStartY };
          newPos = { x: arcData.arcStartX, y: arcData.arcStartY };
          // Set heading to the tangent direction at arcStart
          // Using the same inboundHeadingDeg approach as the ARC phase:
          // At anglePastStart=0, heading = inboundHeadingDeg
          newHeading = arcData.inboundHeadingDeg;
          console.log('-> APPROACH->ARC (snapped to arcStart), angle:', arcAngleRef.current.toFixed(3), 'heading:', newHeading.toFixed(1), 'arcStart:', arcData.arcStartX.toFixed(2), arcData.arcStartY.toFixed(2), 'center:', arcData.centerX.toFixed(2), arcData.centerY.toFixed(2), 'r:', arcData.r.toFixed(2));
        }
      }
      // --- PHASE: STRAIGHT (default) ---
      else {
        const legDx = targetWpt.x - prevWpt.x;
        const legDy = targetWpt.y - prevWpt.y;
        // Position calculation uses atan2(dx, dy) which gives the correct direction
        // in canvas coordinates for moving from prevWpt toward targetWpt.
        const legMoveRad = Math.atan2(legDx, legDy);
        // Heading display uses atan2(dx, dy) which is the CORRECT aviation heading
        // formula (0°=north, 90°=east) for world (y=North) coordinate system.
        const legHeadingRad = Math.atan2(legDx, legDy);
        newHeading = legHeadingRad * (180 / Math.PI);
        if (newHeading < 0) newHeading += 360;

        const newX = pos.x + Math.sin(legMoveRad) * moveDist;
        const newY = pos.y + Math.cos(legMoveRad) * moveDist;

        if (Math.abs(newX - pos.x) < 0.0001 && Math.abs(newY - pos.y) < 0.0001) {
          animationFrameId = requestAnimationFrame(animate);
          return;
        }

        newPos = { x: newX, y: newY };
      }

      // Update aircraft position ref (synchronous)
      aircraftPosRef.current = newPos;

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

          // Speed Slider
          React.createElement('div', {
            key: 'speed-slider',
            className: 'pt-3 border-t border-gray-800'
          }, [
            React.createElement('div', {
              key: 'speed-header',
              className: 'flex justify-between items-end mb-1'
            }, [
              React.createElement('label', {
                key: 'speed-label',
            }, 'Speed Control'),
            React.createElement('span', {
              key: 'speed-value',
              className: 'text-cyan-500 font-mono text-xs'
            }, aircraft.gs + ' kts')
          ]),
          React.createElement('input', {
            key: 'speed-input',
            type: 'range', 
            min: '0', 
            max: '1000', 
            step: '10',
            value: aircraft.gs,
            onChange: (e) => {
              const newSpeed = parseInt(e.target.value);
              setAircraft(prev => ({
                ...prev,
                gs: newSpeed,
                tas: newSpeed + 25
              }));
            },
            className: 'w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-all'
          }),
          React.createElement('div', {
            key: 'speed-range',
            className: 'flex justify-between text-[9px] text-gray-600 mt-1 font-mono'
          }, [
            React.createElement('span', {
              key: 'speed-min',
            }, '0'),
            React.createElement('span', {
              key: 'speed-mid',
            }, '500'),
            React.createElement('span', {
              key: 'speed-max',
            }, '1000')
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
