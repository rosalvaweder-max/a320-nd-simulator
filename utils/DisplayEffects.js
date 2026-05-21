/**
 * Display Effects System for A320 ND Simulator
 * CRT, LCD, and other display technology simulations for authentic cockpit feel
 */

import { COLORS } from '../constants.js';

/**
 * Display Effect Types
 */
export const DISPLAY_EFFECTS = {
    NONE: 'NONE',
    CRT: 'CRT',           // Cathode Ray Tube (older aircraft)
    LCD: 'LCD',           // Liquid Crystal Display (modern aircraft)
    OLED: 'OLED',         // Organic LED (future/experimental)
    MONOCHROME: 'MONOCHROME', // Monochrome display
    NIGHT_VISION: 'NIGHT_VISION' // Night vision compatible
};

/**
 * Display Condition Types
 */
export const DISPLAY_CONDITIONS = {
    NORMAL: 'NORMAL',
    SUNLIGHT_WASHOUT: 'SUNLIGHT_WASHOUT',
    DIM_NIGHT: 'DIM_NIGHT',
    RAIN_EFFECT: 'RAIN_EFFECT',
    DIRTY_SCREEN: 'DIRTY_SCREEN',
    AGED_DISPLAY: 'AGED_DISPLAY'
};

/**
 * CRT Display Effect Simulator
 */
class CRTDisplayEffect {
    constructor() {
        this.intensity = 0.7;
        this.scanlineSpacing = 2;
        this.phosphorPersistence = 0.3;
        this.bloomEffect = 0.2;
        this.convergenceError = 0.05;
        this.lastUpdate = Date.now();
        this.time = 0;
    }
    
    /**
     * Apply CRT effect to canvas context
     */
    apply(context, width, height) {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000;
        this.time += deltaTime;
        this.lastUpdate = now;
        
        // Save context state
        context.save();
        
        // Create off-screen canvas for effect
        const effectCanvas = document.createElement('canvas');
        effectCanvas.width = width;
        effectCanvas.height = height;
        const effectCtx = effectCanvas.getContext('2d');
        
        // 1. Phosphor glow effect
        this.applyPhosphorGlow(effectCtx, width, height);
        
        // 2. Scan lines
        this.applyScanLines(effectCtx, width, height);
        
        // 3. Convergence error (RGB misalignment)
        this.applyConvergenceError(effectCtx, width, height);
        
        // 4. Bloom effect for bright areas
        this.applyBloomEffect(effectCtx, width, height);
        
        // 5. Screen curvature (simulated with vignette)
        this.applyScreenCurvature(effectCtx, width, height);
        
        // 6. Flicker and noise
        this.applyFlickerNoise(effectCtx, width, height);
        
        // Composite effects onto original context
        context.globalCompositeOperation = 'overlay';
        context.drawImage(effectCanvas, 0, 0);
        
        context.restore();
    }
    
    /**
     * Phosphor glow (afterglow) effect
     */
    applyPhosphorGlow(ctx, width, height) {
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, 0,
            width / 2, height / 2, Math.max(width, height) / 2
        );
        
        gradient.addColorStop(0, `rgba(0, 255, 0, ${this.phosphorPersistence * 0.1})`);
        gradient.addColorStop(0.5, `rgba(0, 200, 0, ${this.phosphorPersistence * 0.05})`);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }
    
    /**
     * CRT scan lines
     */
    applyScanLines(ctx, width, height) {
        ctx.strokeStyle = `rgba(0, 0, 0, ${0.1 * this.intensity})`;
        ctx.lineWidth = 1;
        
        for (let y = 0; y < height; y += this.scanlineSpacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Horizontal retrace lines (darker)
        const retraceY = (this.time * 60) % height;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.moveTo(0, retraceY);
        ctx.lineTo(width, retraceY);
        ctx.stroke();
    }
    
    /**
     * CRT convergence error (RGB misalignment)
     */
    applyConvergenceError(ctx, width, height) {
        const offset = this.convergenceError * 2;
        
        // Red channel offset
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = `rgba(255, 0, 0, ${0.1 * this.intensity})`;
        ctx.translate(offset, 0);
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
        
        // Blue channel offset
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = `rgba(0, 0, 255, ${0.1 * this.intensity})`;
        ctx.translate(-offset, offset);
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    }
    
    /**
     * Bloom effect for bright areas
     */
    applyBloomEffect(ctx, width, height) {
        // Create bloom layer (simulated with blur)
        ctx.save();
        ctx.filter = `blur(${this.bloomEffect * 10}px)`;
        ctx.globalAlpha = 0.3 * this.bloomEffect;
        ctx.globalCompositeOperation = 'screen';
        
        // Draw bright areas (simulated)
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, 0,
            width / 2, height / 2, width / 3
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    }
    
    /**
     * Simulated screen curvature (vignette)
     */
    applyScreenCurvature(ctx, width, height) {
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, width * 0.4,
            width / 2, height / 2, width * 0.5
        );
        
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }
    
    /**
     * CRT flicker and noise
     */
    applyFlickerNoise(ctx, width, height) {
        const flicker = 0.95 + Math.sin(this.time * 30) * 0.05;
        ctx.globalAlpha = (1 - flicker) * 0.3;
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.fillRect(0, 0, width, height);
        
        // Random noise
        ctx.globalAlpha = 0.02;
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 2;
            ctx.fillRect(x, y, size, size);
        }
    }
    
    /**
     * Set effect intensity (0-1)
     */
    setIntensity(intensity) {
        this.intensity = Math.max(0, Math.min(1, intensity));
    }
}

/**
 * LCD Display Effect Simulator
 */
class LCDDisplayEffect {
    constructor() {
        this.pixelGridIntensity = 0.3;
        this.backlightBleed = 0.1;
        this.responseTime = 0.2;
        this.viewingAngle = 0.5;
        this.colorTemperature = 6500; // Kelvin
        this.lastUpdate = Date.now();
    }
    
    /**
     * Apply LCD effect to canvas context
     */
    apply(context, width, height) {
        context.save();
        
        // 1. Pixel grid effect
        this.applyPixelGrid(context, width, height);
        
        // 2. Backlight bleed
        this.applyBacklightBleed(context, width, height);
        
        // 3. Color temperature adjustment
        this.applyColorTemperature(context, width, height);
        
        // 4. Viewing angle effect
        this.applyViewingAngle(context, width, height);
        
        // 5. Response time simulation (motion blur)
        this.applyResponseTime(context, width, height);
        
        context.restore();
    }
    
    /**
     * LCD pixel grid effect
     */
    applyPixelGrid(ctx, width, height) {
        const pixelSize = 2;
        const gridAlpha = 0.05 * this.pixelGridIntensity;
        
        ctx.strokeStyle = `rgba(100, 100, 100, ${gridAlpha})`;
        ctx.lineWidth = 0.5;
        
        // Vertical grid lines
        for (let x = 0; x < width; x += pixelSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        // Horizontal grid lines
        for (let y = 0; y < height; y += pixelSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Subpixel structure (RGB stripes)
        ctx.globalAlpha = 0.02 * this.pixelGridIntensity;
        for (let x = 0; x < width; x += pixelSize * 3) {
            // Red subpixel
            ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
            ctx.fillRect(x, 0, pixelSize, height);
            
            // Green subpixel
            ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
            ctx.fillRect(x + pixelSize, 0, pixelSize, height);
            
            // Blue subpixel
            ctx.fillStyle = 'rgba(0, 0, 255, 0.1)';
            ctx.fillRect(x + pixelSize * 2, 0, pixelSize, height);
        }
        
        ctx.globalAlpha = 1;
    }
    
    /**
     * LCD backlight bleed (edge glow)
     */
    applyBacklightBleed(ctx, width, height) {
        const bleedSize = 20;
        const bleedAlpha = 0.3 * this.backlightBleed;
        
        // Top edge
        const topGradient = ctx.createLinearGradient(0, 0, 0, bleedSize);
        topGradient.addColorStop(0, `rgba(255, 255, 255, ${bleedAlpha})`);
        topGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = topGradient;
        ctx.fillRect(0, 0, width, bleedSize);
        
        // Bottom edge
        const bottomGradient = ctx.createLinearGradient(0, height - bleedSize, 0, height);
        bottomGradient.addColorStop(0, 'transparent');
        bottomGradient.addColorStop(1, `rgba(255, 255, 255, ${bleedAlpha})`);
        
        ctx.fillStyle = bottomGradient;
        ctx.fillRect(0, height - bleedSize, width, bleedSize);
        
        // Left edge
        const leftGradient = ctx.createLinearGradient(0, 0, bleedSize, 0);
        leftGradient.addColorStop(0, `rgba(255, 255, 255, ${bleedAlpha})`);
        leftGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = leftGradient;
        ctx.fillRect(0, 0, bleedSize, height);
        
        // Right edge
        const rightGradient = ctx.createLinearGradient(width - bleedSize, 0, width, 0);
        rightGradient.addColorStop(0, 'transparent');
        rightGradient.addColorStop(1, `rgba(255, 255, 255, ${bleedAlpha})`);
        
        ctx.fillStyle = rightGradient;
        ctx.fillRect(width - bleedSize, 0, bleedSize, height);
    }
    
    /**
     * Color temperature adjustment
     */
    applyColorTemperature(ctx, width, height) {
        // Convert Kelvin to RGB tint
        let r, g, b;
        
        if (this.colorTemperature <= 6600) {
            // Warm to neutral
            const t = this.colorTemperature / 100;
            r = 255;
            g = t < 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 :
                        288.1221695283 * Math.pow((t - 60), -0.0755148492);
            b = t < 19 ? 0 :
                t < 66 ? 138.5177312231 * Math.log(t - 10) - 305.0447927307 :
                        155.0;
        } else {
            // Cool
            const t = this.colorTemperature / 100;
            r = 329.698727446 * Math.pow((t - 60), -0.1332047592);
            g = 288.1221695283 * Math.pow((t - 60), -0.0755148492);
            b = 255;
        }
        
        // Clamp and normalize
        r = Math.min(255, Math.max(0, r)) / 255;
        g = Math.min(255, Math.max(0, g)) / 255;
        b = Math.min(255, Math.max(0, b)) / 255;
        
        // Apply as overlay
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = `rgb(${r * 255}, ${g * 255}, ${b * 255})`;
        ctx.fillRect(0, 0, width, height);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    }
    
    /**
     * Viewing angle effect (color shift at edges)
     */
    applyViewingAngle(ctx, width, height) {
        if (this.viewingAngle <= 0) return;
        
        const centerX = width / 2;
        const centerY = height / 2;
        const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
        
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                
                // Calculate distance from center
                const dx = x - centerX;
                const dy = y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy) / maxDistance;
                
                // Apply viewing angle effect (color shift at edges)
                const angleEffect = distance * this.viewingAngle;
                
                // Shift colors based on position
                const angle = Math.atan2(dy, dx);
                const redShift = Math.cos(angle) * angleEffect * 50;
                const blueShift = Math.sin(angle) * angleEffect * 50;
                
                data[idx] = Math.min(255, Math.max(0, data[idx] + redShift));     // R
                data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + blueShift)); // B
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    /**
     * LCD response time simulation (motion blur)
     */
    applyResponseTime(ctx, width, height) {
        if (this.responseTime <= 0) return;
        
        // Create motion blur effect
        ctx.save();
        ctx.filter = `blur(${this.responseTime}px)`;
        ctx.globalAlpha = 0.3;
        ctx.globalCompositeOperation = 'overlay';
        ctx.drawImage(ctx.canvas, 0, 0);
        ctx.restore();
    }
    
    /**
     * Set color temperature in Kelvin
     */
    setColorTemperature(kelvin) {
        this.colorTemperature = Math.max(1000, Math.min(10000, kelvin));
    }
}

/**
 * Environmental Condition Effects
 */
class EnvironmentalEffects {
    constructor() {
        this.sunlightWashout = 0;
        this.dimLevel = 0;
        this.rainEffect = 0;
        this.dirtLevel = 0;
        this.ageEffect = 0;
    }
    
    /**
     * Apply environmental effects
     */
    apply(context, width, height, condition) {
        context.save();
        
        switch (condition) {
            case DISPLAY_CONDITIONS.SUNLIGHT_WASHOUT:
                this.applySunlightWashout(context, width, height);
                break;
                
            case DISPLAY_CONDITIONS.DIM_NIGHT:
                this.applyDimNight(context, width, height);
                break;
                
            case DISPLAY_CONDITIONS.RAIN_EFFECT:
                this.applyRainEffect(context, width, height);
                break;
                
            case DISPLAY_CONDITIONS.DIRTY_SCREEN:
                this.applyDirtyScreen(context, width, height);
                break;
                
            case DISPLAY_CONDITIONS.AGED_DISPLAY:
                this.applyAgedDisplay(context, width, height);
                break;
                
            case DISPLAY_CONDITIONS.NORMAL:
            default:
                // No additional effects
                break;
        }
        
        context.restore();
    }
    
    /**
     * Sunlight washout effect
     */
    applySunlightWashout(ctx, width, height) {
        // Add overall brightness and reduce contrast
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.3 * this.sunlightWashout;
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.fillRect(0, 0, width, height);
        
        // Reduce contrast
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.5 * this.sunlightWashout;
        ctx.fillStyle = 'rgba(128, 128, 128, 1)';
        ctx.fillRect(0, 0, width, height);
    }
    
    /**
     * Dim night mode effect
     */
    applyDimNight(ctx, width, height) {
        // Reduce brightness
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = this.dimLevel;
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.fillRect(0, 0, width, height);
        
        // Add red tint for night vision preservation
        if (this.dimLevel > 0.5) {
            ctx.globalCompositeOperation = 'overlay';
            ctx.globalAlpha = 0.1;
            ctx.fillStyle = 'rgba(255, 0, 0, 1)';
            ctx.fillRect(0, 0, width, height);
        }
    }
    
    /**
     * Rain on screen effect
     */
    applyRainEffect(ctx, width, height) {
        const time = Date.now() / 1000;
        
        // Rain drops
        ctx.strokeStyle = `rgba(150, 150, 255, ${0.5 * this.rainEffect})`;
        ctx.lineWidth = 1;
        
        for (let i = 0; i < 100 * this.rainEffect; i++) {
            const x = (Math.sin(time * 0.5 + i) * 0.5 + 0.5) * width;
            const y = (time * 100 + i * 10) % height;
            const length = 10 + Math.sin(time + i) * 5;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + length);
            ctx.stroke();
        }
        
        // Water streaks
        ctx.strokeStyle = `rgba(100, 100, 200, ${0.3 * this.rainEffect})`;
        ctx.lineWidth = 2;
        
        for (let i = 0; i < 20 * this.rainEffect; i++) {
            const x = (i * 50 + time * 20) % width;
            const startY = 0;
            const endY = height;
            const curve = Math.sin(time + i) * 20;
            
            ctx.beginPath();
            ctx.moveTo(x, startY);
            ctx.quadraticCurveTo(x + curve, height / 2, x, endY);
            ctx.stroke();
        }
    }
    
    /**
     * Dirty screen effect
     */
    applyDirtyScreen(ctx, width, height) {
        // Dust and smudges
        ctx.globalAlpha = 0.1 * this.dirtLevel;
        
        // Random smudges
        for (let i = 0; i < 50 * this.dirtLevel; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const radius = 20 + Math.random() * 50;
            
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, 'rgba(100, 100, 100, 0.5)');
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        }
        
        // Fingerprints
        ctx.strokeStyle = `rgba(150, 150, 150, ${0.3 * this.dirtLevel})`;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        for (let i = 0; i < 10 * this.dirtLevel; i++) {
            const startX = 10 + Math.random() * (width - 20);
            const startY = 10 + Math.random() * (height - 20);
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            
            // Simulate fingerprint swirl
            for (let j = 0; j < 5; j++) {
                const angle = j * Math.PI / 2.5;
                const radius = 15 + Math.random() * 10;
                const endX = startX + Math.cos(angle) * radius;
                const endY = startY + Math.sin(angle) * radius;
                ctx.lineTo(endX, endY);
            }
            
            ctx.stroke();
        }
    }
    
    /**
     * Aged display effect
     */
    applyAgedDisplay(ctx, width, height) {
        // Color fading
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = 0.2 * this.ageEffect;
        ctx.fillStyle = 'rgba(200, 180, 150, 1)'; // Yellowish tint
        ctx.fillRect(0, 0, width, height);
        
        // Burn-in effect (simulated)
        const time = Date.now() / 10000;
        ctx.globalAlpha = 0.1 * this.ageEffect;
        
        // Simulate persistent elements (compass, aircraft symbol)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        
        // Compass rose burn-in
        const cx = width / 2;
        const cy = height / 2;
        const radius = Math.min(width, height) * 0.4;
        
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Aircraft symbol burn-in
        ctx.fillStyle = 'rgba(255, 255, 0, 0.03)';
        ctx.fillRect(cx - 10, cy - 10, 20, 20);
        
        // Dead pixels
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'black';
        
        for (let i = 0; i < 10 * this.ageEffect; i++) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);
            ctx.fillRect(x, y, 1, 1);
        }
    }
    
    /**
     * Set effect levels (0-1)
     */
    setEffectLevels(levels) {
        if (levels.sunlightWashout !== undefined) {
            this.sunlightWashout = Math.max(0, Math.min(1, levels.sunlightWashout));
        }
        if (levels.dimLevel !== undefined) {
            this.dimLevel = Math.max(0, Math.min(1, levels.dimLevel));
        }
        if (levels.rainEffect !== undefined) {
            this.rainEffect = Math.max(0, Math.min(1, levels.rainEffect));
        }
        if (levels.dirtLevel !== undefined) {
            this.dirtLevel = Math.max(0, Math.min(1, levels.dirtLevel));
        }
        if (levels.ageEffect !== undefined) {
            this.ageEffect = Math.max(0, Math.min(1, levels.ageEffect));
        }
    }
}

/**
 * Main Display Effects Manager
 */
class DisplayEffectsManager {
    constructor() {
        this.currentEffect = DISPLAY_EFFECTS.LCD;
        this.currentCondition = DISPLAY_CONDITIONS.NORMAL;
        this.effectIntensity = 0.7;
        
        this.crtEffect = new CRTDisplayEffect();
        this.lcdEffect = new LCDDisplayEffect();
        this.environmentalEffects = new EnvironmentalEffects();
        
        this.enabled = true;
        this.lastRenderTime = 0;
        this.frameCount = 0;
    }
    
    /**
     * Apply display effects to canvas
     */
    applyEffects(context, width, height) {
        if (!this.enabled) return;
        
        this.frameCount++;
        const now = Date.now();
        
        // Apply primary display effect
        switch (this.currentEffect) {
            case DISPLAY_EFFECTS.CRT:
                this.crtEffect.setIntensity(this.effectIntensity);
                this.crtEffect.apply(context, width, height);
                break;
                
            case DISPLAY_EFFECTS.LCD:
                this.lcdEffect.apply(context, width, height);
                break;
                
            case DISPLAY_EFFECTS.OLED:
                // OLED similar to LCD but with perfect blacks
                this.lcdEffect.apply(context, width, height);
                this.applyOLEDEffect(context, width, height);
                break;
                
            case DISPLAY_EFFECTS.MONOCHROME:
                this.applyMonochromeEffect(context, width, height);
                break;
                
            case DISPLAY_EFFECTS.NIGHT_VISION:
                this.applyNightVisionEffect(context, width, height);
                break;
                
            case DISPLAY_EFFECTS.NONE:
            default:
                // No effect
                break;
        }
        
        // Apply environmental conditions
        this.environmentalEffects.apply(context, width, height, this.currentCondition);
        
        this.lastRenderTime = now - this.lastRenderTime;
        this.lastRenderTime = now;
    }
    
    /**
     * OLED specific effect (perfect blacks)
     */
    applyOLEDEffect(ctx, width, height) {
        // OLED has infinite contrast, simulate by deepening blacks
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            // Deepen dark pixels
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            if (brightness < 50) {
                const factor = brightness / 50;
                data[i] *= factor;     // R
                data[i + 1] *= factor; // G
                data[i + 2] *= factor; // B
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    /**
     * Monochrome display effect
     */
    applyMonochromeEffect(ctx, width, height) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Convert to grayscale (luminance preserving)
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            
            data[i] = gray;     // R
            data[i + 1] = gray; // G
            data[i + 2] = gray; // B
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    /**
     * Night vision effect (green phosphor)
     */
    applyNightVisionEffect(ctx, width, height) {
        // Convert to green monochrome
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Night vision green phosphor
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            const green = Math.min(255, luminance * 1.5);
            
            data[i] = 0;           // R
            data[i + 1] = green;   // G
            data[i + 2] = 0;       // B
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Add night vision grain
        ctx.globalAlpha = 0.05;
        for (let i = 0; i < 1000; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 2;
            const brightness = 50 + Math.random() * 200;
            
            ctx.fillStyle = `rgba(0, ${brightness}, 0, 1)`;
            ctx.fillRect(x, y, size, size);
        }
        ctx.globalAlpha = 1;
    }
    
    /**
     * Set display effect type
     */
    setEffect(effectType) {
        if (Object.values(DISPLAY_EFFECTS).includes(effectType)) {
            this.currentEffect = effectType;
        }
    }
    
    /**
     * Set environmental condition
     */
    setCondition(condition) {
        if (Object.values(DISPLAY_CONDITIONS).includes(condition)) {
            this.currentCondition = condition;
        }
    }
    
    /**
     * Set effect intensity (0-1)
     */
    setIntensity(intensity) {
        this.effectIntensity = Math.max(0, Math.min(1, intensity));
    }
    
    /**
     * Enable/disable effects
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    
    /**
     * Get effect statistics
     */
    getStats() {
        return {
            effect: this.currentEffect,
            condition: this.currentCondition,
            intensity: this.effectIntensity,
            enabled: this.enabled,
            frameCount: this.frameCount,
            lastRenderTime: this.lastRenderTime
        };
    }
}

// Export singleton instance
export const displayEffectsManager = new DisplayEffectsManager();

// Export classes and constants for testing
export {
    DisplayEffectsManager,
    CRTDisplayEffect,
    LCDDisplayEffect,
    EnvironmentalEffects
    // displayEffectsManager is already exported above as named export
};

// Default export for convenience
export default {
    DisplayEffectsManager
    // displayEffectsManager is already exported as named export above
};