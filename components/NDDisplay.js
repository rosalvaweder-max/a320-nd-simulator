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

  // Memoize active points
  const activePoints = useMemo(() => {
    return activeRoute ? activeRoute.waypoints : [];
  }, [activeRoute]);

  const secondaryPoints = useMemo(() => {
    return secondaryRoute ? secondaryRoute.waypoints : [];
  }, [secondaryRoute]);

  // Memoize target waypoint for PLAN mode
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

  // Function to find next VOR in a route (case-insensitive) - moved outside for reuse
  const findNextVORInRoute = useCallback((route, startFromCurrent = true, routeName = 'unknown') => {
      if (!route || !route.waypoints || route.waypoints.length === 0) {
          console.log(`  ${routeName}: No route or waypoints`);
          return null;
      }
      
      console.log(`  ${routeName}: Checking ${route.waypoints.length} waypoints`);
      
      // Log all waypoints for debugging
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
      
      // Find first VOR after start index (case-insensitive check)
      for (let i = startIndex; i < route.waypoints.length; i++) {
          const wp = route.waypoints[i];
          // Check if waypoint is a VOR (case-insensitive) - check both type and navaidType fields
          const isVOR = (wp.type && wp.type.toUpperCase() === 'VOR') ||
                       (wp.navaidType && wp.navaidType.toUpperCase() === 'VOR');
          if (isVOR) {
              console.log(`  ${routeName}: Found VOR at index ${i}: ${wp.name} (type: ${wp.type}, navaidType: ${wp.navaidType})`);
              return wp;
          }
      }
      
      // If not found after start index, search from beginning
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

  // Function to find next FIX in a route (case-insensitive)
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
      
      // Find first FIX after start index (case-insensitive check)
      for (let i = startIndex; i < route.waypoints.length; i++) {
          const wp = route.waypoints[i];
          // Check if waypoint is a FIX (case-insensitive) - check both type and navaidType fields
          const isFIX = (wp.type && wp.type.toUpperCase() === 'FIX') ||
                       (wp.navaidType && wp.navaidType.toUpperCase() === 'FIX');
          if (isFIX) {
              console.log(`  ${routeName}: Found FIX at index ${i}: ${wp.name} (type: ${wp.type}, navaidType: ${wp.navaidType})`);
              return wp;
          }
      }
      
      // If not found after start index, search from beginning
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

  // Memoize coordinate system setup
  const coordinateSystem = useMemo(() => {
    // Default Projection Settings (ROSE / NAV)
    let pxPerNM = (height * 0.45) / range;
    
    // Screen Origin (Where the Map Center is placed on Screen)
    let screenOriginX = cx;
    let screenOriginY = cy;
    
    // Map Center (Which World Coordinate is at the Screen Origin)
    let mapCenterX = aircraft.x;
    let mapCenterY = aircraft.y;
    
    // Map Rotation (Radians)
    let mapRotation = 0;

    // Mode Specific Adjustments
    if (mode === 'PLAN') {
      // PLAN Mode: North Up.
      // STRICT REQUIREMENT: Center on the waypoint we are flying TO.
      if (targetWaypoint) {
        mapCenterX = targetWaypoint.x;
        mapCenterY = targetWaypoint.y;
      }
      mapRotation = 0; // Fixed North Up
      
    } else if (mode === 'ARC') {
      // ARC Mode: Heading Up.
      // Aircraft at bottom.
      screenOriginY = height * 0.85;
      // Scale pxPerNM so the 0.75 range arc intersects the screen side edges above midpoint.
      // compassRadius=430px, 0.75 arc radius=322.5px, intersection at y=392.
      // Label outer radius = 430+34=464px, top label y=46, well above corner text (y=30-105).
      pxPerNM = 430 / range;
      mapRotation = -toRad(aircraft.heading); // Rotate world opposite to heading so heading direction aligns with screen UP

    } else {
      // ROSE Mode: Heading Up.
      // Aircraft at center.
      mapRotation = -toRad(aircraft.heading); // Rotate world opposite to heading so heading direction aligns with screen UP
    }

    return { pxPerNM, screenOriginX, screenOriginY, mapCenterX, mapCenterY, mapRotation };
  }, [mode, range, aircraft.x, aircraft.y, aircraft.heading, height, cx, cy]);

  // Memoize aircraft position on map
  const acMapPosition = useMemo(() => {
    const { mapCenterX, mapCenterY, pxPerNM } = coordinateSystem;
    // 计算飞机相对于地图中心的位置
    const x = (aircraft.x - mapCenterX) * pxPerNM;
    const y = -(aircraft.y - mapCenterY) * pxPerNM;
    return { x, y };
  }, [aircraft.x, aircraft.y, coordinateSystem]);

  // Memoize compass radius
  // ROSE modes: radius = height * 0.38 (~228px) to leave room for corner data blocks
  // ARC mode:   compass arc IS the outermost range arc, so radius = range * pxPerNM.
  //             pxPerNM = 430/range, so compassRadius = 430px.
  //             0.75 arc radius = 322.5px, intersects side edges at y=392.
  const compassRadius = useMemo(() => {
    const { pxPerNM } = coordinateSystem;
    if (mode === 'ARC') {
      return range * pxPerNM;
    }
    return height * 0.38;
  }, [mode, range, coordinateSystem, height]);

  // Function to draw map background layer
  const drawMapBackground = useCallback((ctx, mapCenterX, mapCenterY, pxPerNM, mapRotation, range) => {
    if (!mapData) return;

    ctx.save();
    
    // Draw map waypoints (background layer)
    if (mapData.waypoints && mapData.waypoints.length > 0) {
      ctx.globalAlpha = 0.3; // Semi-transparent for background
      mapData.waypoints.forEach(wp => {
        const sx = (wp.x - mapCenterX) * pxPerNM;
        const sy = -(wp.y - mapCenterY) * pxPerNM;
        
        // Only draw waypoints within range
        const distance = Math.sqrt(sx * sx + sy * sy);
        if (distance > range * pxPerNM * 1.2) return;
        
        // Skip VOR type waypoints in map background - they are managed by VORManagerContext
        if (wp.type === 'VOR') return;
        
        // Draw waypoint symbol based on type
        ctx.fillStyle = COLORS.LABEL_CYAN;
        ctx.beginPath();
        
        switch (wp.type) {
          case 'AIRPORT':
            // Draw airport symbol (circle with cross)
            ctx.arc(sx, sy, 4, 0, Math.PI * 2);
            ctx.moveTo(sx - 3, sy);
            ctx.lineTo(sx + 3, sy);
            ctx.moveTo(sx, sy - 3);
            ctx.lineTo(sx, sy + 3);
            break;
          case 'NDB':
            // Draw NDB symbol (triangle)
            ctx.beginPath();
            ctx.moveTo(sx, sy - 5);
            ctx.lineTo(sx - 4, sy + 3);
            ctx.lineTo(sx + 4, sy + 3);
            ctx.closePath();
            break;
          default:
            // Draw FIX symbol (small circle)
            ctx.arc(sx, sy, 2, 0, Math.PI * 2);
        }
        
        ctx.fill();
        
        // Draw waypoint label (only for important waypoints)
        if (wp.type === 'AIRPORT') {
          ctx.save();
          ctx.rotate(-mapRotation); // Keep text upright
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
    
    // Draw airways if available
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

  // Optimized drawing function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    const { pxPerNM, screenOriginX, screenOriginY, mapCenterX, mapCenterY, mapRotation } = coordinateSystem;
    const { x: acMapX, y: acMapY } = acMapPosition;
    
    // Debug: log heading and map rotation every 30 frames
    if (typeof window._ndFrameCount === 'undefined') window._ndFrameCount = 0;
    window._ndFrameCount++;
    if (window._ndFrameCount % 30 === 0) {
      console.log('NDDisplay render: mode=', mode, 'heading=', aircraft.heading?.toFixed(1), 'mapRotation(deg)=', (mapRotation * 180 / Math.PI).toFixed(1), 'acMapPos=', acMapX.toFixed(1), acMapY.toFixed(1), 'mapCenter=', mapCenterX.toFixed(1), mapCenterY.toFixed(1));
    }

    // --- 1. Background ---
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, width, height);

    // --- FAILURE MODE ---
    if (systemState.isFailureSimulated) {
       drawFailureFlags(ctx, width, height);
       return;
    }

    // --- 3. Clipping Mask (For ARC) ---
    let arcClipSaved = false;
    if (mode === 'ARC') {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(screenOriginX, screenOriginY);
      // Fan shape
      ctx.arc(screenOriginX, screenOriginY, range * pxPerNM + 20, toRad(-90 - 55), toRad(-90 + 55));
      ctx.closePath();
      ctx.clip();
      arcClipSaved = true;
    }

    // --- 4. Dynamic Map Layers ---
    ctx.save();
    
    // Apply Transform: Move to Screen Origin -> Rotate -> Move back?
    // No, we want to draw relative to MapCenter.
    // 1. Move to Screen Origin
    ctx.translate(screenOriginX, screenOriginY);
    // 2. Rotate Map
    ctx.rotate(mapRotation);
    
    // Now (0,0) is the Map Center, oriented correctly.
    // Objects at World(x,y) should be drawn at:
    // x' = (x - mapCenterX) * pxPerNM
    // y' = -(y - mapCenterY) * pxPerNM (Flip Y for canvas)

    if (systemState.showTerrain) {
       // Terrain uses grid relative to AC/Center.
       // We pass mapCenterX/Y as the reference point for the grid generator
       drawEGPWSTerrain(ctx, mapCenterX, mapCenterY, range, pxPerNM);
    } else if (systemState.showWeather) {
        ctx.globalAlpha = 0.6;
        drawWeatherRadar(ctx, range, pxPerNM);
        ctx.globalAlpha = 1.0;
    }
    
    // Draw map background layer (if map data is loaded)
    drawMapBackground(ctx, mapCenterX, mapCenterY, pxPerNM, mapRotation, range);
    
    ctx.setLineDash([]); // Reset

    // In VOR and ILS modes, hide flight plans to focus on navaid information
    if (mode !== 'VOR' && mode !== 'LS') {
        // Flight Path (Secondary)
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

        // Flight Path (Active) - only connect waypoints where isConnected=true
        // Filter to only connected waypoints for path drawing
        const connectedPoints = activePoints.filter(wp => wp.isConnected !== false);
        if (connectedPoints.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = COLORS.ACTIVE_PATH;
            ctx.lineWidth = 3;
            
            // Convert connected waypoints to screen coordinates
            const pts = connectedPoints.map(wp => ({
                sx: (wp.x - mapCenterX) * pxPerNM,
                sy: -(wp.y - mapCenterY) * pxPerNM
            }));
            
            // Route display: fly-over turns with circular arcs.
            // The physics engine (App.js) uses proper circular arcs:
            // aircraft flies straight TO each waypoint, then follows a circular arc
            // of radius turnRadiusNM, then flies straight to the next waypoint.
            // The route display shows the planned path with arcs at each waypoint.
            
            // Compute turn radius for display (same formula as App.js)
            const TURN_RATE_RAD_PER_SEC = 3 * Math.PI / 180;
            const gs = aircraft.gs || 432;
            const turnRadiusNM = gs / (3600 * TURN_RATE_RAD_PER_SEC);
            const turnRadiusPx = turnRadiusNM * pxPerNM;
            
            ctx.moveTo(pts[0].sx, pts[0].sy);
            
            for (let i = 1; i < pts.length; i++) {
                const curr = pts[i];
                
                if (i < pts.length - 1) {
                    // Intermediate waypoint: draw line to waypoint, then arc
                    const prev = pts[i - 1];
                    const next = pts[i + 1];
                    
                    // Inbound direction in canvas
                    const inDx = curr.sx - prev.sx;
                    const inDy = curr.sy - prev.sy;
                    const inLen = Math.sqrt(inDx * inDx + inDy * inDy);
                    
                    // Outbound direction in canvas
                    const outDx = next.sx - curr.sx;
                    const outDy = next.sy - curr.sy;
                    const outLen = Math.sqrt(outDx * outDx + outDy * outDy);
                    
                    if (inLen > 0.1 && outLen > 0.1) {
                        // Compute turn direction.
                        // In canvas coordinates (y inverted), compute the signed turn angle.
                        // inbound heading in canvas: atan2(inDy, inDx)
                        // outbound heading in canvas: atan2(outDy, outDx)
                        const inHeadingCanvas = Math.atan2(inDy, inDx);
                        const outHeadingCanvas = Math.atan2(outDy, outDx);
                        let turnAngleCanvas = outHeadingCanvas - inHeadingCanvas;
                        // Normalize to [-π, π]
                        if (turnAngleCanvas > Math.PI) turnAngleCanvas -= 2 * Math.PI;
                        if (turnAngleCanvas < -Math.PI) turnAngleCanvas += 2 * Math.PI;
                        // Left turn (heading decreases in aviation) = negative turnAngle in canvas
                        const isLeftTurn = turnAngleCanvas < 0;
                        
                        // Arc center in canvas coordinates.
                        // In canvas (y inverted), left perpendicular = (dy, -dx), right perpendicular = (-dy, dx)
                        const perpX = isLeftTurn ? inDy : -inDy;
                        const perpY = isLeftTurn ? -inDx : inDx;
                        const perpLen = Math.sqrt(perpX * perpX + perpY * perpY);
                        const uPerpX = perpX / perpLen;
                        const uPerpY = perpY / perpLen;
                        
                        const arcCenterCx = curr.sx + uPerpX * turnRadiusPx;
                        const arcCenterCy = curr.sy + uPerpY * turnRadiusPx;
                        
                        // Arc start angle in canvas (from center to waypoint)
                        const arcStartAngle = Math.atan2(curr.sy - arcCenterCy, curr.sx - arcCenterCx);
                        
                        // Outbound direction angle in canvas
                        const outAngle = Math.atan2(outDy, outDx);
                        
                        // Arc end angle in canvas.
                        // Left turn (heading decreases, CW in canvas): tangent = θ - π/2, so θ = outAngle + π/2
                        // Right turn (heading increases, CCW in canvas): tangent = θ + π/2, so θ = outAngle - π/2
                        const arcEndAngle = outAngle + (isLeftTurn ? Math.PI / 2 : -Math.PI / 2);
                        
                        // Draw line to waypoint first
                        ctx.lineTo(curr.sx, curr.sy);
                        
                        // Draw arc on canvas.
                        // Left turn (heading decreases) = CCW rotation around arc center in world.
                        // In canvas (y inverted), CCW in world maps to:
                        //   canvas angle = 90° - aviation_heading
                        //   aviation heading decreases (CCW) → canvas angle increases (CCW)
                        // So left turn = CCW in canvas = counterclockwise=true
                        // Right turn (heading increases) = CW in world → canvas angle decreases (CW)
                        // So right turn = CW in canvas = counterclockwise=false
                        ctx.arc(arcCenterCx, arcCenterCy, turnRadiusPx, arcStartAngle, arcEndAngle, isLeftTurn);
                    } else {
                        ctx.lineTo(curr.sx, curr.sy);
                    }
                } else {
                    // Last waypoint: just draw line to it
                    ctx.lineTo(curr.sx, curr.sy);
                }
            }
            
            ctx.stroke();
        }

        // Waypoints Rendering
        const drawRouteWaypoints = (wps, isActive) => {
            // Only draw waypoints that are connected (isConnected !== false)
            // Waypoints with isConnected=false are treated as VOR stations, not route waypoints
            const routeWps = wps.filter(wp => wp.isConnected !== false);
            routeWps.forEach(wp => {
                const sx = (wp.x - mapCenterX) * pxPerNM;
                const sy = -(wp.y - mapCenterY) * pxPerNM;

                if (Math.abs(sx) > width || Math.abs(sy) > height) return;

                let color = isActive ? COLORS.TEXT_MAGENTA : COLORS.LABEL_CYAN;
                if (isActive && wp.id === aircraft.nextWaypointId) color = COLORS.TRACK_GREEN;
                
                drawNavaid(ctx, sx, sy, wp.navaidType, color);

                // Label
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

    // Draw VOR stations from VORManagerContext on the map
    // Only show in NAV, ARC, PLAN modes (not VOR/LS which have their own interface)
    if (mode !== 'VOR' && mode !== 'LS' && vorStations && vorStations.length > 0) {
        vorStations.forEach(station => {
            const sx = (station.x - mapCenterX) * pxPerNM;
            const sy = -(station.y - mapCenterY) * pxPerNM;
            
            // Only draw within visible range
            const dist = Math.sqrt(sx * sx + sy * sy);
            if (dist > range * pxPerNM * 1.2) return;
            
            // Draw VOR symbol (hexagon)
            drawNavaid(ctx, sx, sy, 'VOR', COLORS.LABEL_CYAN);
            
            // Label: translate to label position first, THEN counter-rotate for upright text
            // This ensures the label position uses the same transform as the symbol
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
    // Energy Circle (removed per user request)
    // ctx.save();
    // ctx.translate(acMapX, acMapY);
    // drawEnergyCircle(ctx, 20 * pxPerNM);
    // ctx.restore();

    // TCAS (disabled - removed per user request)
    // MOCK_TCAS.forEach(target => {
    //   const tr = toRad(target.bearing);
    //   const tx = Math.sin(tr) * target.distance * pxPerNM;
    //   const ty = -Math.cos(tr) * target.distance * pxPerNM;
    //   const targetScreenX = acMapX + tx;
    //   const targetScreenY = acMapY + ty;
    //   drawTCASTarget(ctx, targetScreenX, targetScreenY, target, mapRotation);
    // });
    
    // AIRCRAFT SYMBOL (PLAN MODE)
    // In PLAN Mode, map is static North Up. Aircraft moves and rotates.
    // The aircraft symbol nose points UP (canvas angle 270°). To make it point
    // in the heading direction (canvas angle = heading - 90°), we need to rotate
    // by +heading degrees. Verified for all 8 cardinal directions.
    if (mode === 'PLAN') {
        ctx.save();
        ctx.translate(acMapX, acMapY);
        ctx.rotate(toRad(aircraft.heading)); // Rotate aircraft symbol to match heading direction
        drawAircraftSymbol(ctx, 0, 0, 0.75);
        ctx.restore();
    }

    ctx.restore(); // End Map Transform
    if (arcClipSaved) ctx.restore(); // End Clip

    // --- 5. Static Overlays (Compass, Aircraft in ROSE/ARC) ---
    
    // Compass Rose
    ctx.save();
    ctx.translate(screenOriginX, screenOriginY);
    drawCompassRose(ctx, compassRadius, aircraft.heading, mode);
    ctx.restore();

    // Aircraft Symbol (ROSE / ARC)
    // Fixed on screen (Head Up), Map moves underneath
    if (mode !== 'PLAN') {
       drawAircraftSymbol(ctx, screenOriginX, screenOriginY, 0.75);
    }

    // --- 6. Heading Bug & Track ---
    // Drawn on top of compass
    ctx.save();
    ctx.translate(screenOriginX, screenOriginY);
    const bugR = compassRadius;
    
    // Calculate Bug Angle relative to Screen Up (-90)
    // PLAN (North Up): BugAngle = SelectedHeading - 90.
    // ROSE/ARC (Heading Up): BugAngle = (SelectedHeading - CurrentHeading) - 90.
    
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
        if(Math.abs(rel) > 60) drawBug = false; 
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
    
    // Track Pointer (green hollow diamond) - aircraft actual ground track
    drawTrackPointer(ctx, 0, 0, aircraft.heading, aircraft.track, compassRadius, mode);
    
    // Lubber Line (Yellow line at top) - Only for Heading Up modes
    if (mode !== 'PLAN') {
        ctx.strokeStyle = COLORS.AIRCRAFT_YELLOW;
        ctx.lineWidth = 4;
        ctx.beginPath();
        const ly = -compassRadius; // Relative to ScreenOrigin
        ctx.moveTo(0, ly - 15);
        ctx.lineTo(0, ly + 5);
        ctx.stroke();
    }
    ctx.restore();

    // --- Range Rings / Arcs (drawn in screen coordinates, outside map transform) ---
    ctx.save();
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.font = "bold 14px Inconsolata";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeStyle = COLORS.COMPASS_WHITE;

    // For non-ARC modes (ROSE NAV/VOR/LS/PLAN), range rings are based on compassRadius.
    // compassRadius = height * 0.38 (~228px), which is the fixed compass ring size.
    // The range ring is drawn at a fixed fraction of compassRadius.
    const drawRangeRing = (ringRadiusPx, labelNM) => {
        ctx.beginPath();
        ctx.arc(screenOriginX, screenOriginY, ringRadiusPx, 0, Math.PI * 2);
        ctx.stroke();
        // Label inside the ring (slightly inward from the top)
        ctx.fillStyle = COLORS.LABEL_CYAN;
        ctx.fillText(labelNM.toString(), screenOriginX, screenOriginY - ringRadiusPx + 16);
    };

    // Calculate the angles where the 0.75 arc intersects the screen side edges.
    // 0.75 arc radius = 0.75 * range * pxPerNM = 0.75 * 430 = 322.5px.
    // Center at (300, 510), distance to side edges = 300px.
    // Intersection y = 510 - sqrt(322.5² - 300²) = 510 - 118.3 = 391.7
    // Left edge intersection angle: atan2(-118.3, -300) = -158.5°
    // Right edge intersection angle: atan2(-118.3, 300) = -21.5°
    let arcStartAngle, arcEndAngle;
    if (mode === 'ARC') {
        const r75 = 0.75 * range * pxPerNM;  // 322.5px
        const dy = Math.sqrt(r75 * r75 - 300 * 300);  // 118.3
        // Angles from center (300,510) to screen side edges at intersection height
        arcStartAngle = Math.atan2(-dy, -300);  // left edge: -158.5°
        arcEndAngle = Math.atan2(-dy, 300);     // right edge: -21.5°
    }

    const drawRangeArc = (distNM) => {
        const rPx = distNM * pxPerNM;
        ctx.beginPath();
        // All arcs use the same angular range: from left-edge intersection to right-edge intersection.
        // 0.75 arc endpoints at screen side edges.
        // 0.5 and 0.25 arc endpoints lie on the radii from center to the 0.75 arc endpoints.
        ctx.arc(screenOriginX, screenOriginY, rPx, arcStartAngle, arcEndAngle, false);
        ctx.stroke();
        // Label at top
        ctx.fillStyle = COLORS.LABEL_CYAN;
        ctx.fillText(distNM.toString(), screenOriginX, screenOriginY - rPx);
    };

    if (mode === 'ARC') {
        drawRangeArc(range * 0.75);
        drawRangeArc(range * 0.5);
        drawRangeArc(range * 0.25);
    } else if (mode === 'NAV') {
        // ROSE NAV: range ring at 50% of compass radius
        drawRangeRing(compassRadius * 0.5, Math.round(compassRadius * 0.5 / pxPerNM));
    } else if (mode === 'VOR' || mode === 'LS') {
        // VOR and ILS modes: single range ring at 50% of compass radius
        drawRangeRing(compassRadius * 0.5, Math.round(compassRadius * 0.5 / pxPerNM));
    } else {
        // PLAN and other modes: range ring at 50% of compass radius
        drawRangeRing(compassRadius * 0.5, Math.round(compassRadius * 0.5 / pxPerNM));
    }
    ctx.setLineDash([]);
    ctx.restore();

    // --- Mode Label (top center) ---
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

    // --- 7. Interface Layers (ILS/VOR) ---
    if (mode === 'LS') {
        // ILS Mode: Point to next waypoint
        let nextWaypoint = null;
        if (aircraft.nextWaypointId && activeRoute) {
            nextWaypoint = activeRoute.waypoints.find(w => w.id === aircraft.nextWaypointId);
        }
        // If no next waypoint found, use first waypoint in active route
        if (!nextWaypoint && activeRoute && activeRoute.waypoints.length > 0) {
            nextWaypoint = activeRoute.waypoints[0];
        }
        // If still no waypoint, check secondary route
        if (!nextWaypoint && secondaryRoute && secondaryRoute.waypoints.length > 0) {
            nextWaypoint = secondaryRoute.waypoints[0];
        }
        
        // Calculate course to next waypoint
        let ilsCourse = aircraft.course || 360; // Default to 360 if not set
        const gsDeviation = 0;  // GS deviation (vertical)
        
        // LOC deviation bar fixed in center
        const locDeviation = 0;
        
        if (nextWaypoint) {
            // Calculate bearing from aircraft to next waypoint
            const dx = nextWaypoint.x - aircraft.x;
            const dy = nextWaypoint.y - aircraft.y;
            // Convert to degrees (0-360, where 0 is North)
            ilsCourse = (Math.atan2(dy, dx) * 180 / Math.PI);
            // Convert from math coordinates (0° = East) to navigation coordinates (0° = North)
            ilsCourse = (90 - ilsCourse + 360) % 360;
            
            console.log('ILS Mode: Next waypoint found, calculated course:', {
                wptName: nextWaypoint.name,
                wptType: nextWaypoint.type,
                aircraftCourse: aircraft.course,
                bearingToWpt: ilsCourse,
                hasWaypoint: true
            });
        } else {
            console.log('ILS Mode: No waypoint found, using default course:', ilsCourse);
        }
        
        drawILSInterface(ctx, width, height, aircraft.heading, ilsCourse, locDeviation, gsDeviation, compassRadius, nextWaypoint, range, coordinateSystem.pxPerNM);
    } else if (mode === 'VOR') {
        // ============================================================
        // PHASE 1: Determine VOR Station Source
        // ============================================================
        // Priority 1: Route VOR (highest) - VOR station in active flight plan
        // Priority 2: Auto/Manual tuning (VORManagerContext) - pilot-tuned station
        // Priority 3: Nearest VOR (fallback) - closest station by distance
        let vorStation = null;
        
        // Priority 1: Check if there's a VOR station in the active route
        // In real A320 operations, when a VOR is part of the flight plan route,
        // the ND automatically detects that VOR and uses it as the reference.
        // This takes highest priority over auto/manual tuning because the
        // flight plan VOR is the intended navigation reference for the route.
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
        
        // Priority 2: Fall back to VORManagerContext (auto/manual tuning)
        if (!vorStation) {
            vorStation = getActiveVORStation();
        }
        
        // Priority 3: Fall back to nearest VOR station
        if (!vorStation) {
            vorStation = findNearestVORStation(aircraft.x, aircraft.y);
        }
        
        // ============================================================
        // PHASE 2: Calculate Common VOR Geometry (single pass)
        // ============================================================
        // Calculate bearing from aircraft to VOR station once, reuse everywhere.
        // This avoids redundant Math.atan2 calls and ensures consistency
        // between the bearing pointer, deviation calculation, and TO/FROM logic.
        let bearingToVOR = null;    // Bearing FROM aircraft TO VOR station (0-360, 0=North)
        let aircraftRadial = null;  // Aircraft radial FROM VOR station (reciprocal of bearing)
        if (vorStation) {
            const dx = vorStation.x - aircraft.x;
            const dy = vorStation.y - aircraft.y;
            // Math.atan2 gives angle in math coords (0°=East, CCW positive)
            // Convert to navigation coords (0°=North, CW positive)
            bearingToVOR = (90 - Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
            // Aircraft radial = reciprocal of bearing to station
            aircraftRadial = (bearingToVOR + 180) % 360;
        }
        
        // ============================================================
        // PHASE 3: Course (CRS) and Deviation Calculation
        // ============================================================
        // In real A320 VOR mode:
        // - The course dagger (CDI) points at the SELECTED COURSE (CRS),
        //   a fixed direction set by the pilot via the CRS selector knob.
        //   It does NOT automatically follow the flight plan leg direction.
        // - The deviation bar shows angular deviation between the aircraft's
        //   VOR radial and the selected course.
        // - During turns, the compass rotates with heading, so the dagger's
        //   position relative to the compass changes smoothly.
        //   (relRotation = course - heading)
        // - TO/FROM: TO when heading is within ±90° of bearing to VOR station
        
        // Use the pilot-set course (CRS) as the fixed reference.
        let vorCourse = aircraft.course || 360;
        let vorDeviation = 0;
        
        // Deviation calculation:
        // aircraftRadial = (bearingToStation + 180°) % 360  (the radial the aircraft is on)
        // angularDev = aircraftRadial - selectedCourse
        //   > 0: aircraft is RIGHT of course → bar deflects LEFT (fly left)
        //   < 0: aircraft is LEFT of course  → bar deflects RIGHT (fly right)
        //
        // The drawCourseDagger function draws the bar at +devOffset for
        // positive deviation (right side in rotated frame). But in VOR
        // convention, positive deviation means "fly left" (bar on right).
        // So we NEGATE the deviation to match the display convention:
        // bar on right → fly right (aircraft is left of course)
        if (vorStation && aircraftRadial !== null) {
            let angularDev = aircraftRadial - vorCourse;
            if (angularDev > 180) angularDev -= 360;
            if (angularDev < -180) angularDev += 360;
            // Negate and clamp to ±20° (full scale deflection)
            vorDeviation = -Math.max(-20, Math.min(20, angularDev));
        }
        
        // ============================================================
        // PHASE 4: TO/FROM Determination
        // ============================================================
        // TO mode: aircraft heading is within ±90° of bearing to VOR station
        // FROM mode: aircraft heading is within 90°-270° of bearing to VOR station
        let isToMode = true;
        if (vorStation && bearingToVOR !== null) {
            const headingDiff = ((aircraft.heading - bearingToVOR) % 360 + 360) % 360;
            isToMode = headingDiff < 90 || headingDiff > 270;
        }
        
        // ============================================================
        // PHASE 5: Render VOR Interface
        // ============================================================
        const largeRingNM = Math.round(compassRadius / pxPerNM);
        const smallRingNM = Math.round(largeRingNM / 2);
        const innerRingRadius = smallRingNM * pxPerNM;
        drawVORInterface(ctx, width, height, aircraft.heading, vorCourse, vorStation, vorDeviation, isToMode, compassRadius, bearingToVOR, innerRingRadius, range, coordinateSystem.pxPerNM);
    }

    // --- 8. Data Blocks ---
    drawGS_TAS(ctx, aircraft.gs, aircraft.tas);
    drawWindData(ctx, aircraft.windDir, aircraft.windSpeed, aircraft.heading, width);
    
    // Show next waypoint info for NAV, ARC, and PLAN modes
    if (mode === 'NAV' || mode === 'ARC' || mode === 'PLAN') {
        let activeWpt;
        if (aircraft.nextWaypointId && activeRoute) {
            activeWpt = activeRoute.waypoints.find(w => w.id === aircraft.nextWaypointId);
        }
        if (!activeWpt && activeRoute && activeRoute.waypoints.length > 0) {
            activeWpt = activeRoute.waypoints[0];
        }

        if (activeWpt) {
            // Calculate bearing to waypoint (track to fly)
            const dx = activeWpt.x - aircraft.x;
            const dy = activeWpt.y - aircraft.y;
            let bearing = (Math.atan2(dy, dx) * 180 / Math.PI);
            bearing = (90 - bearing + 360) % 360;
            const trackToFly = Math.round(bearing);
            
            // Calculate distance
            const distToWpt = Math.sqrt(Math.pow(activeWpt.x - aircraft.x, 2) + Math.pow(activeWpt.y - aircraft.y, 2));
            
            // Calculate ETA (estimated)
            const now = new Date();
            const eta = new Date(now.getTime() + 5*60000);
            const etaStr = `${eta.getUTCHours().toString().padStart(2,'0')}${eta.getUTCMinutes().toString().padStart(2,'0')}`;
            
            drawWaypointInfo(ctx, activeWpt.name, trackToFly, distToWpt, etaStr, width);
        }
    }
    
    // ============================================================
    // Draw VOR Navaid Info (Left = VOR1, Right = VOR2)
    // Only shown in VOR mode
    // ============================================================
    if (mode === 'VOR') {
        // VOR1 (Left side): Shows the VOR station currently used by the VOR mode.
        // This follows the same priority logic as the VOR mode display:
        //   1. Route VOR (if VOR station exists in active flight plan)
        //   2. Auto/Manual tuned station (VORManagerContext)
        //   3. Nearest VOR station (fallback)
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
        
        // VOR2 (Right side): Shows the second VOR receiver's tuned station.
        // In real A320, VOR2 is independently tunable via the right-side RMP.
        // For this simulation, VOR2 shows the auto-tuned nearest station
        // (which may differ from VOR1 when VOR1 is locked to a route VOR).
        // This provides cross-reference capability for position fixing.
        const vor2Station = findNearestVORStation(aircraft.x, aircraft.y);
        if (vor2Station) {
            drawNavaidInfo(ctx, 'right', vor2Station.name, vor2Station.frequency, vor2Station.distance.toFixed(1), height, width);
        } else {
            drawNavaidInfo(ctx, 'right', '---', '---', '--', height, width);
        }
    }
    
    if (systemState.showChrono) {
        ctx.font = "bold 20px Inconsolata";
        ctx.fillStyle = COLORS.TEXT_WHITE;
        ctx.textAlign = "center";
        const timeStr = formatChronoTime(systemState.chronoStartTime);
        ctx.fillText(timeStr, cx, height - 30);
    }

    if (systemState.showTerrain) {
       ctx.font = "bold 18px Inconsolata";
       ctx.fillStyle = COLORS.TRACK_GREEN;
       ctx.textAlign = "center";
       ctx.fillText("TERR ON ND", cx, height / 2 + 100); 
    }

  }, [mode, range, aircraft.x, aircraft.y, aircraft.heading, aircraft.selectedHeading, aircraft.course, aircraft.gs, aircraft.tas, aircraft.windDir, aircraft.windSpeed, aircraft.nextWaypointId, activeRoute, secondaryRoute, systemState, activePoints, secondaryPoints, coordinateSystem, acMapPosition, compassRadius, width, height, cx, cy, vorStations, tuningState, getActiveVORStation, findNearestVORStation]);

  // Use requestAnimationFrame for smooth rendering instead of setInterval
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas size explicitly
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
    // Decorative Screws
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