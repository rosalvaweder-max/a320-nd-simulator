/**
 * Professional Aviation Symbols for A320 ND Simulator
 * Based on Airbus A320 Navigation Display Standards
 */

import { COLORS, SYMBOL_SIZES, FONTS } from '../constants.js';

/**
 * Draw professional aircraft symbol (Airbus style)
 */
export const drawAircraftSymbol = (ctx, x, y, heading, scale = 1) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(heading * Math.PI / 180);
    
    const size = SYMBOL_SIZES.AIRCRAFT * scale;
    
    // Airbus A320 ND aircraft symbol (yellow "士" shape)
    ctx.strokeStyle = COLORS.YELLOW;
    ctx.fillStyle = COLORS.YELLOW;
    ctx.lineWidth = 2.5 * scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Add subtle glow effect
    ctx.shadowColor = 'rgba(255, 255, 0, 0.3)';
    ctx.shadowBlur = 4 * scale;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Main vertical line (fuselage)
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.8);
    ctx.lineTo(0, size * 0.6);
    ctx.stroke();
    
    // Wings
    ctx.beginPath();
    ctx.moveTo(-size * 0.8, -size * 0.1);
    ctx.lineTo(size * 0.8, -size * 0.1);
    ctx.stroke();
    
    // Horizontal stabilizer
    ctx.beginPath();
    ctx.moveTo(-size * 0.3, size * 0.5);
    ctx.lineTo(size * 0.3, size * 0.5);
    ctx.stroke();
    
    // Center reference box (hollow)
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.strokeStyle = COLORS.YELLOW;
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.rect(-size * 0.15, -size * 0.2, size * 0.3, size * 0.3);
    ctx.fill();
    ctx.stroke();
    
    // Center cross
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.2);
    ctx.lineTo(0, size * 0.1);
    ctx.moveTo(-size * 0.15, -size * 0.05);
    ctx.lineTo(size * 0.15, -size * 0.05);
    ctx.stroke();
    
    ctx.restore();
};

/**
 * Draw VOR navigation aid symbol
 */
export const drawVORSymbol = (ctx, x, y, frequency = null) => {
    ctx.save();
    ctx.translate(x, y);
    
    const size = SYMBOL_SIZES.VOR;
    
    // VOR symbol (hexagon with dot in center)
    ctx.strokeStyle = COLORS.CYAN;
    ctx.fillStyle = COLORS.CYAN;
    ctx.lineWidth = 2;
    
    // Hexagon
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (i * 60 - 30) * Math.PI / 180;
        const px = Math.cos(angle) * size;
        const py = Math.sin(angle) * size;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    
    // Center dot
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Frequency label (if provided)
    if (frequency) {
        ctx.fillStyle = COLORS.TEXT_WHITE;
        ctx.font = FONTS.SMALL;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(frequency.toString(), 0, size + 2);
    }
    
    ctx.restore();
};

/**
 * Draw NDB navigation aid symbol
 */
export const drawNDBSymbol = (ctx, x, y, frequency = null) => {
    ctx.save();
    ctx.translate(x, y);
    
    const size = SYMBOL_SIZES.NDB;
    
    // NDB symbol (circle with radial lines)
    ctx.strokeStyle = COLORS.CYAN;
    ctx.fillStyle = COLORS.CYAN;
    ctx.lineWidth = 2;
    
    // Outer circle
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.stroke();
    
    // Radial lines (4 directions)
    for (let i = 0; i < 4; i++) {
        const angle = i * 90 * Math.PI / 180;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
        ctx.stroke();
    }
    
    // Frequency label (if provided)
    if (frequency) {
        ctx.fillStyle = COLORS.TEXT_WHITE;
        ctx.font = FONTS.SMALL;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(frequency.toString(), 0, size + 2);
    }
    
    ctx.restore();
};

/**
 * Draw airport symbol
 */
export const drawAirportSymbol = (ctx, x, y, icao = null) => {
    ctx.save();
    ctx.translate(x, y);
    
    const size = SYMBOL_SIZES.AIRPORT;
    
    // Airport symbol (circle with cross)
    ctx.strokeStyle = COLORS.CYAN;
    ctx.fillStyle = COLORS.CYAN;
    ctx.lineWidth = 2;
    
    // Circle
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.stroke();
    
    // Cross
    ctx.beginPath();
    ctx.moveTo(-size * 0.7, 0);
    ctx.lineTo(size * 0.7, 0);
    ctx.moveTo(0, -size * 0.7);
    ctx.lineTo(0, size * 0.7);
    ctx.stroke();
    
    // ICAO code label (if provided)
    if (icao) {
        ctx.fillStyle = COLORS.TEXT_WHITE;
        ctx.font = FONTS.SMALL;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(icao, 0, size + 2);
    }
    
    ctx.restore();
};

/**
 * Draw waypoint/fix symbol
 */
export const drawWaypointSymbol = (ctx, x, y, name = null, isActive = false) => {
    ctx.save();
    ctx.translate(x, y);
    
    const size = SYMBOL_SIZES.WAYPOINT;
    
    // Waypoint symbol (diamond for active, square for inactive)
    ctx.strokeStyle = isActive ? COLORS.MAGENTA : COLORS.CYAN;
    ctx.fillStyle = isActive ? COLORS.MAGENTA : COLORS.CYAN;
    ctx.lineWidth = isActive ? 2.5 : 1.5;
    
    if (isActive) {
        // Active waypoint (diamond)
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size, 0);
        ctx.lineTo(0, size);
        ctx.lineTo(-size, 0);
        ctx.closePath();
        ctx.stroke();
        
        // Fill for active waypoint
        ctx.fillStyle = 'rgba(255, 0, 255, 0.2)';
        ctx.fill();
    } else {
        // Inactive waypoint (square)
        ctx.beginPath();
        ctx.rect(-size/2, -size/2, size, size);
        ctx.stroke();
    }
    
    // Waypoint name label (if provided)
    if (name) {
        ctx.fillStyle = isActive ? COLORS.MAGENTA : COLORS.TEXT_WHITE;
        ctx.font = FONTS.SMALL;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(name, 0, size + 2);
    }
    
    ctx.restore();
};

/**
 * Draw TCAS traffic symbol
 */
export const drawTCASTraffic = (ctx, x, y, threatLevel, relativeAlt, verticalSpeed = 0) => {
    ctx.save();
    ctx.translate(x, y);
    
    const size = SYMBOL_SIZES.TCAS;
    
    // Determine color based on threat level
    let color;
    let fill = false;
    
    switch (threatLevel) {
        case 'RA': // Resolution Advisory
            color = COLORS.TCAS_RA;
            fill = true;
            break;
        case 'TA': // Traffic Advisory
            color = COLORS.TCAS_TA;
            fill = true;
            break;
        case 'PROXIMATE':
            color = COLORS.TCAS_PROXIMATE;
            break;
        default:
            color = COLORS.TEXT_GREY;
    }
    
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.5;
    
    // Draw traffic symbol (solid or hollow diamond)
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size, 0);
    ctx.closePath();
    
    if (fill) {
        ctx.fill();
    } else {
        ctx.stroke();
    }
    
    // Altitude difference indicator
    if (relativeAlt !== 0) {
        ctx.fillStyle = color;
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const altText = Math.abs(relativeAlt) >= 1000 ? 
            `${(relativeAlt/1000).toFixed(1)}K` : 
            `${Math.abs(relativeAlt)}`;
        
        const prefix = relativeAlt > 0 ? '+' : '-';
        ctx.fillText(`${prefix}${altText}`, 0, size + 8);
    }
    
    // Vertical speed indicator (arrow)
    if (verticalSpeed !== 0) {
        const arrowSize = 4;
        ctx.beginPath();
        if (verticalSpeed > 0) {
            // Climbing arrow (up)
            ctx.moveTo(0, -size - arrowSize);
            ctx.lineTo(-arrowSize, -size);
            ctx.lineTo(arrowSize, -size);
        } else {
            // Descending arrow (down)
            ctx.moveTo(0, size + arrowSize);
            ctx.lineTo(-arrowSize, size);
            ctx.lineTo(arrowSize, size);
        }
        ctx.closePath();
        ctx.fill();
    }
    
    ctx.restore();
};

/**
 * Draw weather radar return
 */
export const drawWeatherReturn = (ctx, x, y, intensity, distance) => {
    ctx.save();
    ctx.translate(x, y);
    
    // Determine color and size based on intensity
    let color, radius;
    switch (intensity) {
        case 'EXTREME':
            color = COLORS.WEATHER_EXTREME;
            radius = 8;
            break;
        case 'HEAVY':
            color = COLORS.WEATHER_HEAVY;
            radius = 6;
            break;
        case 'MODERATE':
            color = COLORS.WEATHER_MODERATE;
            radius = 4;
            break;
        case 'LIGHT':
        default:
            color = COLORS.WEATHER_LIGHT;
            radius = 2;
    }
    
    // Draw weather return with gradient
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, color + 'CC'); // More opaque in center
    gradient.addColorStop(1, color + '33'); // More transparent at edge
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Add distance label for significant weather
    if (intensity === 'HEAVY' || intensity === 'EXTREME') {
        ctx.fillStyle = COLORS.TEXT_WHITE;
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`${distance.toFixed(1)}nm`, 0, radius + 2);
    }
    
    ctx.restore();
};

/**
 * Draw terrain contour
 */
export const drawTerrainContour = (ctx, points, elevationLevel) => {
    if (points.length < 3) return;
    
    ctx.save();
    
    // Determine color based on elevation
    let color;
    switch (elevationLevel) {
        case 'EXTREME':
            color = COLORS.TERRAIN_EXTREME;
            break;
        case 'VERY_HIGH':
            color = COLORS.TERRAIN_VERY_HIGH;
            break;
        case 'HIGH':
            color = COLORS.TERRAIN_HIGH;
            break;
        case 'MEDIUM':
            color = COLORS.TERRAIN_MEDIUM;
            break;
        case 'LOW':
        default:
            color = COLORS.TERRAIN_LOW;
    }
    
    // Draw filled polygon
    ctx.fillStyle = color + '40'; // 25% opacity
    ctx.strokeStyle = color + '80'; // 50% opacity
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
};

/**
 * Draw flight plan route line
 */
export const drawFlightPlanRoute = (ctx, waypoints, isActive = false, hasDiscontinuity = false) => {
    if (waypoints.length < 2) return;
    
    ctx.save();
    
    // Route line style
    ctx.strokeStyle = isActive ? COLORS.GREEN : COLORS.CYAN;
    ctx.lineWidth = isActive ? 3 : 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Dashed line for discontinuity
    if (hasDiscontinuity) {
        ctx.setLineDash([5, 3]);
    } else {
        ctx.setLineDash([]);
    }
    
    // Draw route
    ctx.beginPath();
    ctx.moveTo(waypoints[0].x, waypoints[0].y);
    for (let i = 1; i < waypoints.length; i++) {
        ctx.lineTo(waypoints[i].x, waypoints[i].y);
    }
    ctx.stroke();
    
    // Reset line dash
    ctx.setLineDash([]);
    
    ctx.restore();
};

/**
 * Draw holding pattern
 */
export const drawHoldingPattern = (ctx, centerX, centerY, inboundCourse, turnDirection = 'right', isActive = false) => {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((inboundCourse - 180) * Math.PI / 180);
    
    const radius = 20; // NM scale
    const lineLength = 40; // NM scale
    
    ctx.strokeStyle = isActive ? COLORS.MAGENTA : COLORS.CYAN;
    ctx.lineWidth = isActive ? 2.5 : 1.5;
    ctx.setLineDash([2, 2]); // Dashed for holding
    
    // Inbound leg
    ctx.beginPath();
    ctx.moveTo(0, -lineLength/2);
    ctx.lineTo(0, 0);
    ctx.stroke();
    
    // Outbound leg
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, lineLength/2);
    ctx.stroke();
    
    // Turn arc
    ctx.beginPath();
    if (turnDirection === 'right') {
        // Right turn (standard)
        ctx.arc(radius, 0, radius, Math.PI, 0, false);
    } else {
        // Left turn
        ctx.arc(-radius, 0, radius, 0, Math.PI, false);
    }
    ctx.stroke();
    
    // Holding fix symbol
    ctx.fillStyle = isActive ? COLORS.MAGENTA : COLORS.CYAN;
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
};

/**
 * Draw wind arrow and data
 */
export const drawWindData = (ctx, x, y, windDirection, windSpeed, heading) => {
    ctx.save();
    ctx.translate(x, y);
    
    const arrowLength = 30;
    const arrowSize = 6;
    
    // Calculate relative wind direction
    const relativeDirection = windDirection - heading;
    
    // Draw wind arrow
    ctx.strokeStyle = COLORS.TEXT_WHITE;
    ctx.fillStyle = COLORS.TEXT_WHITE;
    ctx.lineWidth = 2;
    
    ctx.rotate(relativeDirection * Math.PI / 180);
    
    // Arrow shaft
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -arrowLength);
    ctx.stroke();
    
    // Arrow head
    ctx.beginPath();
    ctx.moveTo(0, -arrowLength);
    ctx.lineTo(-arrowSize, -arrowLength + arrowSize);
    ctx.lineTo(arrowSize, -arrowLength + arrowSize);
    ctx.closePath();
    ctx.fill();
    
    // Wind speed text
    ctx.rotate(-relativeDirection * Math.PI / 180);
    ctx.fillStyle = COLORS.TEXT_WHITE;
    ctx.font = FONTS.SMALL;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${windSpeed}kt`, 0, -arrowLength - 5);
    
    ctx.restore();
};

/**
 * Draw range ring and distance scale
 */
export const drawRangeRing = (ctx, cx, cy, radius, range) => {
    ctx.save();
    
    // Range ring circle
    ctx.strokeStyle = COLORS.COMPASS_GREY;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Reset line dash
    ctx.setLineDash([]);
    
    // Range label
    ctx.fillStyle = COLORS.TEXT_WHITE;
    ctx.font = FONTS.SMALL;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Place labels at cardinal points
    const positions = [
        { x: cx, y: cy - radius - 10, text: `${range}NM` },
        { x: cx + radius + 10, y: cy, text: `${range}NM` },
        { x: cx, y: cy + radius + 10, text: `${range}NM` },
        { x: cx - radius - 10, y: cy, text: `${range}NM` },
    ];
    
    positions.forEach(pos => {
        ctx.fillText(pos.text, pos.x, pos.y);
    });
    
    ctx.restore();
};

/**
 * Draw display grid (for PLAN mode)
 */
export const drawDisplayGrid = (ctx, width, height, spacing = 50) => {
    ctx.save();
    
    ctx.strokeStyle = COLORS.DISPLAY_GRID;
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.3;
    
    // Vertical lines
    for (let x = spacing; x < width; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = spacing; y < height; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    ctx.restore();
};

/**
 * Apply CRT/LCD display effects
 */
export const applyDisplayEffects = (ctx, width, height, effectType = 'LCD') => {
    ctx.save();
    
    if (effectType === 'CRT') {
        // CRT phosphor glow effect
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = COLORS.CRT_PHOSPHOR;
        ctx.fillRect(0, 0, width, height);
        
        // Scan lines
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        for (let y = 0; y < height; y += 2) {
            ctx.fillRect(0, y, width, 1);
        }
    } else if (effectType === 'LCD') {
        // LCD pixel grid effect
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = COLORS.PIXEL_GRID;
        
        // Draw subtle pixel grid
        const pixelSize = 2;
        for (let x = 0; x < width; x += pixelSize) {
            for (let y = 0; y < height; y += pixelSize) {
                if ((x + y) % (pixelSize * 2) === 0) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
    }
    
    ctx.restore();
};