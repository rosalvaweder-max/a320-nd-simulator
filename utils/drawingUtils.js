import { COLORS } from '../constants.js';

export const toRad = (deg) => (deg * Math.PI) / 180;

// --- AIRCRAFT SYMBOL (The Yellow "Shi" 士) ---
export const drawAircraftSymbol = (ctx, centerX, centerY, scale = 1) => {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(scale, scale);
  
  ctx.strokeStyle = COLORS.AIRCRAFT_YELLOW;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';
  
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.lineTo(0, 18);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-24, -2);
  ctx.lineTo(24, -2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-9, 15);
  ctx.lineTo(9, 15);
  ctx.stroke();
  
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.fillRect(-3, -5, 6, 6);
  ctx.fill();

  ctx.beginPath();
  ctx.strokeStyle = COLORS.AIRCRAFT_YELLOW;
  ctx.lineWidth = 2;
  ctx.moveTo(0, -5);
  ctx.lineTo(0, 1);
  ctx.stroke();

  ctx.restore();
};

// --- COMPASS ROSE ---
export const drawCompassRose = (ctx, radius, heading, mode) => {
  ctx.save();
  ctx.strokeStyle = COLORS.COMPASS_WHITE;
  ctx.fillStyle = COLORS.COMPASS_WHITE;
  ctx.font = "bold 16px Inconsolata";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 2;
  
  const step = 5;
  const labelStep = 30;
  const rotationOffset = (mode === 'PLAN') ? 0 : -heading;

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

  // Draw white solid triangles every 45° starting from 30°
  const triangleStep = 45;
  const triangleStart = 30;
  const triangleSize = 10;
  const triangleBaseWidth = 7;

  for (let i = triangleStart; i < 360 + triangleStart; i += triangleStep) {
    const angle = i % 360;
    
    if (mode === 'ARC') {
        let relAngle = angle - heading;
        while (relAngle <= -180) relAngle += 360;
        while (relAngle > 180) relAngle -= 360;
        if (Math.abs(relAngle) > 60) continue;
    }

    const angleRad = toRad(angle - 90 + rotationOffset);
    const tipR = radius + 4;
    const baseR = radius + 4 + triangleSize;
    
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

  // Draw ticks on the OUTSIDE of the compass ring
  for (let i = 0; i < 360; i += step) {
    
    if (mode === 'ARC') {
        let relAngle = i - heading;
        while (relAngle <= -180) relAngle += 360;
        while (relAngle > 180) relAngle -= 360;
        if (Math.abs(relAngle) > 60) continue;
    }

    const angleRad = toRad(i - 90 + rotationOffset);
    
    let isLabel = (i % labelStep === 0);
    let len = 8;
    if (i % 10 === 0) len = 12;
    
    ctx.strokeStyle = COLORS.COMPASS_GREY;
    if (isLabel) ctx.strokeStyle = COLORS.COMPASS_WHITE;

    // Always draw ticks outside the compass ring
    const innerR = radius;
    const outerR = radius + len;

    const x1 = Math.cos(angleRad) * innerR;
    const y1 = Math.sin(angleRad) * innerR;
    const x2 = Math.cos(angleRad) * outerR;
    const y2 = Math.sin(angleRad) * outerR;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    if (isLabel) {
      // Labels outside the compass ring
      const labelOffset = Math.max(16, radius * 0.08);
      const labelR = radius + labelOffset;
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
  ctx.restore();
};

// --- DATA BLOCKS ---

export const drawGS_TAS = (ctx, gs, tas) => {
    ctx.font = "bold 18px Inconsolata";
    ctx.textAlign = "left";
    
    ctx.fillStyle = COLORS.LABEL_CYAN;
    ctx.fillText("GS", 15, 30);
    ctx.fillStyle = COLORS.VALUE_GREEN;
    ctx.fillText(Math.round(gs).toString(), 45, 30);

    ctx.fillStyle = COLORS.LABEL_CYAN;
    ctx.fillText("TAS", 15, 52);
    ctx.fillStyle = COLORS.VALUE_GREEN;
    ctx.fillText(Math.round(tas).toString(), 55, 52);
};

export const drawWindData = (ctx, windDir, windSpeed, heading, width) => {
    const x = 30;
    const y = 90;
    
    ctx.font = "bold 16px Inconsolata";
    ctx.fillStyle = COLORS.VALUE_GREEN;
    const dirStr = windDir.toString().padStart(3, '0');
    const spdStr = windSpeed.toString().padStart(2, '0');
    ctx.fillText(`${dirStr}/${spdStr}`, x + 25, y);

    ctx.save();
    ctx.translate(x, y - 5);
    const relWind = windDir - heading;
    ctx.rotate(toRad(relWind + 180));
    
    ctx.beginPath();
    ctx.strokeStyle = COLORS.VALUE_GREEN;
    ctx.lineWidth = 2;
    ctx.moveTo(0, -10);
    ctx.lineTo(0, 10);
    ctx.lineTo(-4, 6);
    ctx.moveTo(0, 10);
    ctx.lineTo(4, 6);
    ctx.stroke();
    ctx.restore();
};

export const drawWaypointInfo = (ctx, wptName, track, dist, time, width) => {
    ctx.textAlign = "right";
    const rx = width - 15;
    
    ctx.font = "bold 20px Inconsolata";
    ctx.fillStyle = COLORS.TEXT_WHITE;
    ctx.fillText(wptName, rx, 30);
    
    ctx.font = "bold 18px Inconsolata";
    ctx.fillStyle = COLORS.VALUE_GREEN;
    ctx.fillText(`${track.toString().padStart(3, '0')}°`, rx, 55);
    ctx.fillText(`${dist.toFixed(1)} NM`, rx, 80);
    
    ctx.fillStyle = COLORS.TEXT_WHITE;
    ctx.fillText(time, rx, 105);
};

// --- ILS / VOR INTERFACES ---

export const drawILSInterface = (ctx, width, height, heading, course, locDeviation = 0, gsDeviation = 0, radius = 140, nextWaypoint = null, range = 10, pxPerNM = 27) => {
    const cx = width / 2;
    const cy = height / 2;
    const rx = width - 20;
    const topY = 30;
    
    ctx.textAlign = "right";
    
    ctx.font = "bold 18px Inconsolata";
    const freq = "110.30";
    ctx.fillStyle = COLORS.TEXT_MAGENTA;
    ctx.fillText(freq, rx, topY);
    const wFreq = ctx.measureText(freq).width;
    ctx.fillStyle = COLORS.TEXT_WHITE;
    ctx.font = "bold 14px Inconsolata";
    ctx.fillText("ILS", rx - wFreq - 10, topY);

    ctx.font = "bold 18px Inconsolata";
    const displayCourse = Math.round(course) || 360;
    const crsStr = displayCourse.toString().padStart(3, '0') + "°";
    ctx.fillStyle = COLORS.HEADING_BLUE;
    ctx.fillText(crsStr, rx, topY + 25);
    const wCrs = ctx.measureText(crsStr).width;
    ctx.fillStyle = COLORS.TEXT_WHITE;
    ctx.font = "bold 14px Inconsolata";
    ctx.fillText("CRS", rx - wCrs - 10, topY + 25);

    ctx.font = "bold 20px Inconsolata";
    ctx.fillStyle = COLORS.TEXT_MAGENTA;
    const displayName = nextWaypoint ? nextWaypoint.name : "IYRA";
    ctx.fillText(displayName, rx, topY + 55);

    // ========== GS (Vertical) Scale on Right Side ==========
    const gsX = width - 20;
    
    ctx.strokeStyle = COLORS.TEXT_AMBER;
    ctx.lineWidth = 2;
    const baselineLength = 20;
    ctx.beginPath();
    ctx.moveTo(gsX - baselineLength/2, cy);
    ctx.lineTo(gsX + baselineLength/2, cy);
    ctx.stroke();
    
    // GS dots - hollow (outlined) instead of filled
    ctx.strokeStyle = COLORS.COMPASS_WHITE;
    ctx.lineWidth = 1.5;
    const gsDotSpacing = 35;
    [-2, -1, 1, 2].forEach(i => {
        ctx.beginPath();
        ctx.arc(gsX, cy + i * gsDotSpacing, 3, 0, Math.PI * 2);
        ctx.stroke();
    });

    // GS deviation diamond indicator
    const gsDegreesPerDot = 0.4;
    let gsDeviationInDots;
    if (gsDeviation === 0) {
        gsDeviationInDots = 0;
    } else {
        gsDeviationInDots = gsDeviation / gsDegreesPerDot;
    }
    
    const clampedGsDev = Math.max(-2.5, Math.min(2.5, gsDeviationInDots));
    const gsY = cy - clampedGsDev * gsDotSpacing;
    
    ctx.strokeStyle = COLORS.TEXT_MAGENTA;
    ctx.beginPath();
    ctx.moveTo(gsX, gsY - 8);
    ctx.lineTo(gsX + 8, gsY);
    ctx.lineTo(gsX, gsY + 8);
    ctx.lineTo(gsX - 8, gsY);
    ctx.closePath();
    ctx.stroke();

    const halfRangeRadius = range * 0.5 * pxPerNM;
    drawCourseDagger(ctx, cx, cy, heading, course, true, locDeviation, true, radius, null, halfRangeRadius);
    
    // ========== LOC (Horizontal) Scale on 0.5 Range Ring Diameter ==========
    // In real A320 ND ILS mode, the LOC deviation scale is shown as
    // hollow circles distributed along the horizontal diameter of the 0.5 range ring.
    const locDotSpacing = halfRangeRadius / 2;  // evenly spaced: 0, ±half/2, ±half
    const locDotRadius = 4;  // slightly larger hollow circles
    
    // Draw center tick (vertical line at center)
    ctx.strokeStyle = COLORS.TEXT_AMBER;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 10);
    ctx.lineTo(cx, cy + 10);
    ctx.stroke();
    
    // Draw hollow circles at evenly spaced positions on the horizontal diameter
    ctx.strokeStyle = COLORS.COMPASS_WHITE;
    ctx.lineWidth = 1.5;
    [-2, -1, 1, 2].forEach(i => {
        ctx.beginPath();
        ctx.arc(cx + i * locDotSpacing, cy, locDotRadius, 0, Math.PI * 2);
        ctx.stroke();
    });
};

export const drawVORInterface = (ctx, width, height, heading, course, vorStation = null, deviation = 0, isToMode = true, radius = 140, bearingToVOR = null, innerRadius = 20, range = 10, pxPerNM = 27) => {
    const cx = width / 2;
    const cy = height / 2;
    const rx = width - 20;
    const topY = 30;
    
    ctx.textAlign = "right";
    
    const freq = vorStation?.frequency || "114.10";
    const vorName = vorStation?.name || "GOW";
    
    ctx.font = "bold 18px Inconsolata";
    ctx.fillStyle = COLORS.TEXT_WHITE;
    ctx.fillText(freq, rx, topY);
    const w1 = ctx.measureText(freq).width;
    ctx.font = "bold 14px Inconsolata";
    ctx.fillText("VOR", rx - w1 - 10, topY);

    ctx.font = "bold 18px Inconsolata";
    const roundedCourse = Math.round(course);
    const crsStr = roundedCourse.toString().padStart(3, '0') + "°";
    ctx.fillStyle = COLORS.HEADING_BLUE;
    ctx.fillText(crsStr, rx, topY + 25);
    const w2 = ctx.measureText(crsStr).width;
    ctx.fillStyle = COLORS.TEXT_WHITE;
    ctx.font = "bold 14px Inconsolata";
    ctx.fillText("CRS", rx - w2 - 10, topY + 25);

    ctx.font = "bold 20px Inconsolata";
    ctx.fillStyle = COLORS.TEXT_WHITE;
    ctx.fillText(vorName, rx, topY + 55);

    const halfRangeRadius = range * 0.5 * pxPerNM;
    drawCourseDagger(ctx, cx, cy, heading, course, false, deviation, isToMode, radius, null, halfRangeRadius);
    
    if (bearingToVOR !== null) {
        drawBearingPointer(ctx, cx, cy, heading, bearingToVOR, radius, innerRadius);
    }
};

const drawCourseDagger = (ctx, cx, cy, heading, course, isILS, deviation = 0, isToMode = true, radius = 140, legCourse = null, maxDeviationPx = 60) => {
    ctx.save();
    ctx.translate(cx, cy);
    
    const relRotation = toRad(course - heading);
    ctx.rotate(relRotation);

    const color = isILS ? COLORS.TEXT_MAGENTA : COLORS.HEADING_BLUE;
    const len = radius;
    
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;

    if (isILS) {
        ctx.beginPath();
        const barTop = -len / 2;
        const barBottom = len / 2;
        const overlapPixels = 15;
        
        if (isToMode) {
            ctx.moveTo(0, -len);
            ctx.lineTo(0, barTop);
            ctx.moveTo(0, barBottom - overlapPixels);
            ctx.lineTo(0, len);
        } else {
            ctx.moveTo(0, -len);
            ctx.lineTo(0, barTop + overlapPixels);
            ctx.moveTo(0, barBottom);
            ctx.lineTo(0, len);
        }
        ctx.stroke();
        
        const crossbarLength = 12;
        const crossbarY = -len / 2 - 30;
        ctx.beginPath();
        ctx.moveTo(-crossbarLength, crossbarY);
        ctx.lineTo(crossbarLength, crossbarY);
        ctx.stroke();
    } else {
        ctx.beginPath();
        const barTop = -len / 2;
        const barBottom = len / 2;
        const overlapPixels = 15;
        
        if (isToMode) {
            ctx.moveTo(0, -len);
            ctx.lineTo(0, barTop);
            ctx.moveTo(0, barBottom - overlapPixels);
            ctx.lineTo(0, len);
        } else {
            ctx.moveTo(0, -len);
            ctx.lineTo(0, barTop + overlapPixels);
            ctx.moveTo(0, barBottom);
            ctx.lineTo(0, len);
        }
        ctx.stroke();
        
        const crossbarLength = 12;
        const crossbarY = -len / 2 - 30;
        ctx.beginPath();
        ctx.moveTo(-crossbarLength, crossbarY);
        ctx.lineTo(crossbarLength, crossbarY);
        ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(0, len);
    ctx.lineTo(0, len - 15);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(-10, len);
    ctx.lineTo(10, len);
    ctx.stroke();

    // Deviation scale dots - hollow circles inside max deviation range
    // Leave ~1.5 circle-widths gap from max deviation (circle radius=4, gap≈12px)
    // ILS uses its own LOC scale in drawILSInterface, so skip here
    const dotRadius = 4;
    const dotGap = dotRadius * 3;  // ~1.5 circle-widths gap from max
    const dotMaxPx = maxDeviationPx - dotGap;  // dots stay inside this range
    const adjustedSpacing = dotMaxPx / 2;  // 2 steps from center to max dot
    
    if (!isILS) {
        ctx.strokeStyle = COLORS.COMPASS_WHITE;
        ctx.lineWidth = 1.5;
        for(let i of [-2, -1, 1, 2]) {
           ctx.beginPath();
           ctx.arc(i * adjustedSpacing, 0, dotRadius, 0, Math.PI*2);
           ctx.stroke();
        }
    }

    const degreesPerDot = 1.25;
    const maxDegrees = 2 * degreesPerDot;
    const pixelsPerDegree = maxDeviationPx / maxDegrees;
    
    const clampedDeviation = Math.max(-maxDegrees, Math.min(maxDegrees, deviation));
    const devOffset = clampedDeviation * pixelsPerDegree;
    
    ctx.fillStyle = color;
    const barWidth = 4;
    
    let barTop, barBottom;
    
    if (isILS) {
        barTop = -len / 2;
        barBottom = len / 2;
        
        ctx.fillRect(devOffset - barWidth/2, barTop, barWidth, barBottom - barTop);
        
        ctx.beginPath();
        if (isToMode) {
            ctx.moveTo(devOffset, barTop);
            ctx.lineTo(devOffset - 6, barTop + 10);
            ctx.lineTo(devOffset + 6, barTop + 10);
        } else {
            ctx.moveTo(devOffset, barBottom);
            ctx.lineTo(devOffset - 6, barBottom - 10);
            ctx.lineTo(devOffset + 6, barBottom - 10);
        }
        ctx.closePath();
        ctx.fill();
    } else {
        barTop = -len / 2;
        barBottom = len / 2;
        
        ctx.fillRect(devOffset - barWidth/2, barTop, barWidth, barBottom - barTop);
        
        ctx.beginPath();
        if (isToMode) {
            ctx.moveTo(devOffset, barTop);
            ctx.lineTo(devOffset - 6, barTop + 10);
            ctx.lineTo(devOffset + 6, barTop + 10);
        } else {
            ctx.moveTo(devOffset, barBottom);
            ctx.lineTo(devOffset - 6, barBottom - 10);
            ctx.lineTo(devOffset + 6, barBottom - 10);
        }
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();
};

export const drawTrackPointer = (ctx, cx, cy, heading, track, radius, mode = 'ROSE') => {
    ctx.save();
    ctx.translate(cx, cy);
    
    let relAngle;
    if (mode === 'PLAN') {
        relAngle = toRad(track - 90);
    } else {
        relAngle = toRad(track - heading - 90);
    }
    
    const pr = radius - 8;
    const px = Math.cos(relAngle) * pr;
    const py = Math.sin(relAngle) * pr;
    
    ctx.strokeStyle = COLORS.TRACK_GREEN;
    ctx.lineWidth = 2;
    
    const size = 7;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(-relAngle);
    
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size, 0);
    ctx.closePath();
    ctx.stroke();
    
    ctx.restore();
    ctx.restore();
};

export const drawBearingPointer = (ctx, cx, cy, heading, bearing, radius, innerRadius = 20) => {
    ctx.save();
    ctx.translate(cx, cy);
    
    const relAngle = toRad(bearing - heading);
    ctx.rotate(relAngle);
    
    ctx.strokeStyle = COLORS.COMPASS_WHITE;
    ctx.fillStyle = COLORS.COMPASS_WHITE;
    ctx.lineWidth = 2;
    
    // Bearing pointer: line from one side of compass to the other,
    // only drawn between the inner range ring and the compass edge.
    // Inner circle area (inside innerRadius) is not drawn.
    const triSize = 8; // size of hollow triangle
    
    // Upper segment midpoint
    const upperMid = -(innerRadius + radius) / 2;
    const upperTriTip = upperMid - triSize;    // triangle tip (closer to compass edge)
    const upperTriBase = upperMid + triSize;   // triangle base (closer to center)
    
    // Draw upper segment: from inner radius to triangle base, then from triangle tip to compass edge
    // (skip the part inside the triangle)
    ctx.beginPath();
    ctx.moveTo(0, -innerRadius);
    ctx.lineTo(0, upperTriBase);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, upperTriTip);
    ctx.lineTo(0, -radius);
    ctx.stroke();
    
    // Lower segment midpoint
    const lowerMid = (innerRadius + radius) / 2;
    const lowerTriTip = lowerMid - triSize;    // triangle tip (closer to compass edge)
    const lowerTriBase = lowerMid + triSize;   // triangle base (closer to center)
    
    // Draw lower segment: from inner radius to triangle base, then from triangle tip to compass edge
    // (skip the part inside the triangle)
    ctx.beginPath();
    ctx.moveTo(0, innerRadius);
    ctx.lineTo(0, lowerTriBase);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, lowerTriTip);
    ctx.lineTo(0, radius);
    ctx.stroke();
    
    // Complete triangle at upper segment (3 sides: tip to left, left to right, right to tip)
    ctx.beginPath();
    ctx.moveTo(0, upperTriTip);                // tip pointing up (toward VOR)
    ctx.lineTo(-triSize, upperTriBase);        // bottom-left
    ctx.lineTo(triSize, upperTriBase);         // bottom-right
    ctx.closePath();                           // back to tip
    ctx.stroke();
    
    // Complete triangle at lower segment (3 sides, pointing same direction - up/toward VOR)
    ctx.beginPath();
    ctx.moveTo(0, lowerTriTip);                // tip pointing up (toward VOR)
    ctx.lineTo(-triSize, lowerTriBase);        // bottom-left
    ctx.lineTo(triSize, lowerTriBase);         // bottom-right
    ctx.closePath();                           // back to tip
    ctx.stroke();
    
    ctx.restore();
};

export const drawNavaidInfo = (ctx, corner, name, freq, dist, height, width) => {
    const x = corner === 'left' ? 20 : width - 20;
    const align = corner === 'left' ? 'left' : 'right';
    const y = height - 20;
    
    ctx.textAlign = align;
    
    ctx.font = "bold 14px Inconsolata";
    ctx.fillStyle = COLORS.TEXT_WHITE;
    ctx.fillText(corner === 'left' ? "VOR 1" : "VOR 2", x, y - 80);
    
    ctx.font = "bold 16px Inconsolata";
    ctx.fillStyle = COLORS.TEXT_MAGENTA;
    ctx.fillText(`${name}  ${freq}`, x, y - 55);
    
    // Third line: distance info - number in green, "NM" in blue
    ctx.font = "bold 16px Inconsolata";
    ctx.fillStyle = COLORS.TRACK_GREEN;
    const distStr = `${dist}`;
    ctx.fillText(distStr, x, y - 30);
    const distWidth = ctx.measureText(distStr).width;
    ctx.fillStyle = COLORS.HEADING_BLUE;
    if (align === 'left') {
        ctx.textAlign = 'left';
        ctx.fillText("NM", x + distWidth + 4, y - 30);
    } else {
        ctx.textAlign = 'right';
        ctx.fillText("NM", x - distWidth - 4, y - 30);
    }
    ctx.textAlign = align;
};

// --- SYMBOLS ---

export const drawNavaid = (ctx, x, y, type, color) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  if (type === 'VOR') {
    const s = 7;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (i * 60) * Math.PI / 180;
        const px = Math.cos(angle) * s;
        const py = Math.sin(angle) * s;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  } else if (type === 'NDB') {
    const s = 8;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.866, s * 0.5);
    ctx.lineTo(-s * 0.866, s * 0.5);
    ctx.closePath();
    ctx.stroke();
  } else if (type === 'FIX') {
    ctx.fillStyle = color;
    const s = 6;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(-s, 0);
    ctx.fill();
  }
  ctx.restore();
};

export const drawDecelPoint = (ctx, x, y) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = COLORS.TEXT_MAGENTA;
  ctx.fillStyle = COLORS.TEXT_MAGENTA;
  ctx.lineWidth = 2;
  
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.font = 'bold 12px Inconsolata';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('D', 0, 1);
  
  ctx.restore();
};

export const drawLevelOffArrow = (ctx, x, y, heading) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = COLORS.HEADING_BLUE;
  
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-6, 12);
  ctx.lineTo(6, 12);
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
};

export const drawEnergyCircle = (ctx, radius) => {
  ctx.save();
  ctx.strokeStyle = COLORS.TRACK_GREEN;
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
};

export const drawTCASTarget = (ctx, x, y, target, mapRotation) => {
  ctx.save();
  ctx.translate(x, y);
  
  if (target.threatLevel === 'RA') {
    ctx.fillStyle = COLORS.TEXT_RED;
    ctx.fillRect(-6, -6, 12, 12);
  } else if (target.threatLevel === 'TA') {
    ctx.fillStyle = COLORS.TEXT_AMBER;
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI*2);
    ctx.fill();
  } else {
    ctx.strokeStyle = COLORS.TEXT_WHITE;
    ctx.lineWidth = 2;
    if (target.threatLevel === 'proximate') {
      ctx.fillStyle = COLORS.TEXT_WHITE;
    }
    
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(6, 0);
    ctx.lineTo(0, 6);
    ctx.lineTo(-6, 0);
    ctx.closePath();
    
    if (target.threatLevel === 'proximate') ctx.fill();
    else ctx.stroke();
  }

  ctx.rotate(-mapRotation); 
  
  if (target.threatLevel === 'RA') ctx.fillStyle = COLORS.TEXT_RED;
  else if (target.threatLevel === 'TA') ctx.fillStyle = COLORS.TEXT_AMBER;
  else ctx.fillStyle = COLORS.TEXT_WHITE;

  ctx.font = 'bold 12px Inconsolata';
  ctx.textAlign = 'left';
  
  const altText = (target.relativeAlt >= 0 ? '+' : '-') + Math.abs(Math.round(target.relativeAlt / 100)).toString().padStart(2, '0');
  ctx.fillText(altText, 10, 4);
  
  ctx.restore();
};

export const formatChronoTime = (startTime) => {
  if (!startTime) return '00:00';
  const now = Date.now();
  const diff = now - startTime;
  const totalSeconds = Math.floor(diff / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');
};

export const drawFailureFlags = (ctx, width, height) => {
    ctx.save();
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = COLORS.TEXT_RED;
    ctx.font = 'bold 40px Inconsolata';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.fillText('MAP FAIL', width / 2, height / 2);
    
    ctx.strokeStyle = COLORS.TEXT_RED;
    ctx.lineWidth = 4;
    ctx.strokeRect(width/2 - 100, height/2 - 40, 200, 80);
    ctx.restore();
};

export const drawWeatherRadar = (ctx, range, pxPerNM) => {
    ctx.save();
    const blobs = [
        { r: 15, a: -30, d: 20, c: COLORS.EGPWS_LOW }, 
        { r: 10, a: 10, d: 30, c: COLORS.EGPWS_MED }, 
        { r: 5, a: 15, d: 32, c: COLORS.EGPWS_HIGH },
    ];
    
    blobs.forEach(blob => {
        const x = Math.sin(toRad(blob.a)) * blob.d * pxPerNM;
        const y = -Math.cos(toRad(blob.a)) * blob.d * pxPerNM;
        
        ctx.beginPath();
        ctx.arc(x, y, blob.r * pxPerNM, 0, Math.PI * 2);
        ctx.fillStyle = blob.c;
        ctx.fill();
    });
    ctx.restore();
};

export const drawEGPWSTerrain = (ctx, acX, acY, range, pxPerNM) => {
    const gridSize = 5; 
    const minX = Math.floor((acX - range) / gridSize);
    const maxX = Math.ceil((acX + range) / gridSize);
    const minY = Math.floor((acY - range) / gridSize);
    const maxY = Math.ceil((acY + range) / gridSize);
    
    ctx.save();
    for (let gx = minX; gx <= maxX; gx++) {
        for (let gy = minY; gy <= maxY; gy++) {
            const seed = Math.sin(gx * 12.9898 + gy * 78.233) * 43758.5453;
            const val = seed - Math.floor(seed);
            
            let color = null;
            if (val > 0.85) color = COLORS.EGPWS_HIGH;
            else if (val > 0.70) color = COLORS.EGPWS_MED;
            else if (val > 0.55) color = COLORS.EGPWS_LOW;
            else if (val > 0.50) color = COLORS.EGPWS_WATER;
            
            if (color) {
                const worldX = gx * gridSize;
                const worldY = gy * gridSize;
                
                const sx = (worldX - acX) * pxPerNM;
                const sy = -(worldY - acY) * pxPerNM; 
                const size = gridSize * pxPerNM;
                
                ctx.fillStyle = color;
                ctx.fillRect(sx, sy - size, size + 1, size + 1);
            }
        }
    }
    ctx.restore();
};
