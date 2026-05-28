/**
 * 显示效果系统 - A320 ND 模拟器
 * CRT、LCD 及其他显示技术模拟，营造真实驾驶舱体验
 */

import { COLORS } from '../constants.js';

/**
 * 显示效果类型
 */
export const DISPLAY_EFFECTS = {
    NONE: 'NONE',
    CRT: 'CRT',           // 阴极射线管（老式飞机）
    LCD: 'LCD',           // 液晶显示器（现代飞机）
    OLED: 'OLED',         // 有机发光二极管（未来/实验性）
    MONOCHROME: 'MONOCHROME', // 单色显示
    NIGHT_VISION: 'NIGHT_VISION' // 夜视兼容
};

/**
 * 显示环境条件类型
 */
export const DISPLAY_CONDITIONS = {
    NORMAL: 'NORMAL',
    SUNLIGHT_WASHOUT: 'SUNLIGHT_WASHOUT', // 阳光冲刷
    DIM_NIGHT: 'DIM_NIGHT',               // 夜间调暗
    RAIN_EFFECT: 'RAIN_EFFECT',           // 雨水效果
    DIRTY_SCREEN: 'DIRTY_SCREEN',         // 屏幕脏污
    AGED_DISPLAY: 'AGED_DISPLAY'          // 老化显示
};

/**
 * CRT 显示效果模拟器
 */
class CRTDisplayEffect {
    constructor() {
        this.intensity = 0.7;           // 效果强度
        this.scanlineSpacing = 2;       // 扫描线间距（像素）
        this.phosphorPersistence = 0.3; // 荧光余辉
        this.bloomEffect = 0.2;         // 辉光效果
        this.convergenceError = 0.05;   // 汇聚误差
        this.lastUpdate = Date.now();
        this.time = 0;                  // 累计时间
    }
    
    /**
     * 将 CRT 效果应用到 Canvas 上下文
     */
    apply(context, width, height) {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000;
        this.time += deltaTime;
        this.lastUpdate = now;
        
        // 保存上下文状态
        context.save();
        
        // 创建离屏 Canvas 用于效果渲染
        const effectCanvas = document.createElement('canvas');
        effectCanvas.width = width;
        effectCanvas.height = height;
        const effectCtx = effectCanvas.getContext('2d');
        
        // 1. 荧光余辉效果
        this.applyPhosphorGlow(effectCtx, width, height);
        
        // 2. 扫描线
        this.applyScanLines(effectCtx, width, height);
        
        // 3. 汇聚误差（RGB 未对齐）
        this.applyConvergenceError(effectCtx, width, height);
        
        // 4. 明亮区域的辉光效果
        this.applyBloomEffect(effectCtx, width, height);
        
        // 5. 屏幕曲率（用暗角模拟）
        this.applyScreenCurvature(effectCtx, width, height);
        
        // 6. 闪烁和噪点
        this.applyFlickerNoise(effectCtx, width, height);
        
        // 将效果合成到原始上下文
        context.globalCompositeOperation = 'overlay';
        context.drawImage(effectCanvas, 0, 0);
        
        context.restore();
    }
    
    /**
     * 荧光余辉效果
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
     * CRT 扫描线
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
        
        // 水平回扫线（较暗）
        const retraceY = (this.time * 60) % height;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.moveTo(0, retraceY);
        ctx.lineTo(width, retraceY);
        ctx.stroke();
    }
    
    /**
     * CRT 汇聚误差（RGB 未对齐）
     */
    applyConvergenceError(ctx, width, height) {
        const offset = this.convergenceError * 2;
        
        // 红色通道偏移
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = `rgba(255, 0, 0, ${0.1 * this.intensity})`;
        ctx.translate(offset, 0);
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
        
        // 蓝色通道偏移
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = `rgba(0, 0, 255, ${0.1 * this.intensity})`;
        ctx.translate(-offset, offset);
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    }
    
    /**
     * 明亮区域的辉光效果
     */
    applyBloomEffect(ctx, width, height) {
        // 创建辉光层（用模糊模拟）
        ctx.save();
        ctx.filter = `blur(${this.bloomEffect * 10}px)`;
        ctx.globalAlpha = 0.3 * this.bloomEffect;
        ctx.globalCompositeOperation = 'screen';
        
        // 绘制明亮区域（模拟）
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
     * 模拟屏幕曲率（暗角效果）
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
     * CRT 闪烁和噪点
     */
    applyFlickerNoise(ctx, width, height) {
        const flicker = 0.95 + Math.sin(this.time * 30) * 0.05;
        ctx.globalAlpha = (1 - flicker) * 0.3;
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.fillRect(0, 0, width, height);
        
        // 随机噪点
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
     * 设置效果强度（0-1）
     */
    setIntensity(intensity) {
        this.intensity = Math.max(0, Math.min(1, intensity));
    }
}

/**
 * LCD 显示效果模拟器
 */
class LCDDisplayEffect {
    constructor() {
        this.pixelGridIntensity = 0.3;  // 像素网格强度
        this.backlightBleed = 0.1;      // 背光漏光
        this.responseTime = 0.2;        // 响应时间
        this.viewingAngle = 0.5;        // 视角
        this.colorTemperature = 6500;   // 色温（开尔文）
        this.lastUpdate = Date.now();
    }
    
    /**
     * 将 LCD 效果应用到 Canvas 上下文
     */
    apply(context, width, height) {
        context.save();
        
        // 1. 像素网格效果
        this.applyPixelGrid(context, width, height);
        
        // 2. 背光漏光
        this.applyBacklightBleed(context, width, height);
        
        // 3. 色温调整
        this.applyColorTemperature(context, width, height);
        
        // 4. 视角效果
        this.applyViewingAngle(context, width, height);
        
        // 5. 响应时间模拟（运动模糊）
        this.applyResponseTime(context, width, height);
        
        context.restore();
    }
    
    /**
     * LCD 像素网格效果
     */
    applyPixelGrid(ctx, width, height) {
        const pixelSize = 2;
        const gridAlpha = 0.05 * this.pixelGridIntensity;
        
        ctx.strokeStyle = `rgba(100, 100, 100, ${gridAlpha})`;
        ctx.lineWidth = 0.5;
        
        // 垂直网格线
        for (let x = 0; x < width; x += pixelSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        // 水平网格线
        for (let y = 0; y < height; y += pixelSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // 子像素结构（RGB 条纹）
        ctx.globalAlpha = 0.02 * this.pixelGridIntensity;
        for (let x = 0; x < width; x += pixelSize * 3) {
            // 红色子像素
            ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
            ctx.fillRect(x, 0, pixelSize, height);
            
            // 绿色子像素
            ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
            ctx.fillRect(x + pixelSize, 0, pixelSize, height);
            
            // 蓝色子像素
            ctx.fillStyle = 'rgba(0, 0, 255, 0.1)';
            ctx.fillRect(x + pixelSize * 2, 0, pixelSize, height);
        }
        
        ctx.globalAlpha = 1;
    }
    
    /**
     * LCD 背光漏光（边缘发光）
     */
    applyBacklightBleed(ctx, width, height) {
        const bleedSize = 20;
        const bleedAlpha = 0.3 * this.backlightBleed;
        
        // 上边缘
        const topGradient = ctx.createLinearGradient(0, 0, 0, bleedSize);
        topGradient.addColorStop(0, `rgba(255, 255, 255, ${bleedAlpha})`);
        topGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = topGradient;
        ctx.fillRect(0, 0, width, bleedSize);
        
        // 下边缘
        const bottomGradient = ctx.createLinearGradient(0, height - bleedSize, 0, height);
        bottomGradient.addColorStop(0, 'transparent');
        bottomGradient.addColorStop(1, `rgba(255, 255, 255, ${bleedAlpha})`);
        
        ctx.fillStyle = bottomGradient;
        ctx.fillRect(0, height - bleedSize, width, bleedSize);
        
        // 左边缘
        const leftGradient = ctx.createLinearGradient(0, 0, bleedSize, 0);
        leftGradient.addColorStop(0, `rgba(255, 255, 255, ${bleedAlpha})`);
        leftGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = leftGradient;
        ctx.fillRect(0, 0, bleedSize, height);
        
        // 右边缘
        const rightGradient = ctx.createLinearGradient(width - bleedSize, 0, width, 0);
        rightGradient.addColorStop(0, 'transparent');
        rightGradient.addColorStop(1, `rgba(255, 255, 255, ${bleedAlpha})`);
        
        ctx.fillStyle = rightGradient;
        ctx.fillRect(width - bleedSize, 0, bleedSize, height);
    }
    
    /**
     * 色温调整
     */
    applyColorTemperature(ctx, width, height) {
        // 将开尔文色温转换为 RGB 色调
        let r, g, b;
        
        if (this.colorTemperature <= 6600) {
            // 暖色到中性色
            const t = this.colorTemperature / 100;
            r = 255;
            g = t < 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 :
                        288.1221695283 * Math.pow((t - 60), -0.0755148492);
            b = t < 19 ? 0 :
                t < 66 ? 138.5177312231 * Math.log(t - 10) - 305.0447927307 :
                        155.0;
        } else {
            // 冷色
            const t = this.colorTemperature / 100;
            r = 329.698727446 * Math.pow((t - 60), -0.1332047592);
            g = 288.1221695283 * Math.pow((t - 60), -0.0755148492);
            b = 255;
        }
        
        // 钳位并归一化
        r = Math.min(255, Math.max(0, r)) / 255;
        g = Math.min(255, Math.max(0, g)) / 255;
        b = Math.min(255, Math.max(0, b)) / 255;
        
        // 作为叠加层应用
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = `rgb(${r * 255}, ${g * 255}, ${b * 255})`;
        ctx.fillRect(0, 0, width, height);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    }
    
    /**
     * 视角效果（边缘色偏）
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
                
                // 计算距中心的距离
                const dx = x - centerX;
                const dy = y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy) / maxDistance;
                
                // 应用视角效果（边缘色偏）
                const angleEffect = distance * this.viewingAngle;
                
                // 根据位置偏移颜色
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
     * LCD 响应时间模拟（运动模糊）
     */
    applyResponseTime(ctx, width, height) {
        if (this.responseTime <= 0) return;
        
        // 创建运动模糊效果
        ctx.save();
        ctx.filter = `blur(${this.responseTime}px)`;
        ctx.globalAlpha = 0.3;
        ctx.globalCompositeOperation = 'overlay';
        ctx.drawImage(ctx.canvas, 0, 0);
        ctx.restore();
    }
    
    /**
     * 设置色温（开尔文）
     */
    setColorTemperature(kelvin) {
        this.colorTemperature = Math.max(1000, Math.min(10000, kelvin));
    }
}

/**
 * 环境条件效果
 */
class EnvironmentalEffects {
    constructor() {
        this.sunlightWashout = 0;  // 阳光冲刷程度
        this.dimLevel = 0;         // 调暗程度
        this.rainEffect = 0;       // 雨水效果程度
        this.dirtLevel = 0;        // 脏污程度
        this.ageEffect = 0;        // 老化程度
    }
    
    /**
     * 应用环境效果
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
                // 无额外效果
                break;
        }
        
        context.restore();
    }
    
    /**
     * 阳光冲刷效果
     */
    applySunlightWashout(ctx, width, height) {
        // 增加整体亮度并降低对比度
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.3 * this.sunlightWashout;
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.fillRect(0, 0, width, height);
        
        // 降低对比度
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.5 * this.sunlightWashout;
        ctx.fillStyle = 'rgba(128, 128, 128, 1)';
        ctx.fillRect(0, 0, width, height);
    }
    
    /**
     * 夜间调暗效果
     */
    applyDimNight(ctx, width, height) {
        // 降低亮度
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = this.dimLevel;
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.fillRect(0, 0, width, height);
        
        // 添加红色色调以保护夜视
        if (this.dimLevel > 0.5) {
            ctx.globalCompositeOperation = 'overlay';
            ctx.globalAlpha = 0.1;
            ctx.fillStyle = 'rgba(255, 0, 0, 1)';
            ctx.fillRect(0, 0, width, height);
        }
    }
    
    /**
     * 屏幕雨水效果
     */
    applyRainEffect(ctx, width, height) {
        const time = Date.now() / 1000;
        
        // 雨滴
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
        
        // 水流痕迹
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
     * 屏幕脏污效果
     */
    applyDirtyScreen(ctx, width, height) {
        // 灰尘和污渍
        ctx.globalAlpha = 0.1 * this.dirtLevel;
        
        // 随机污渍
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
        
        // 指纹
        ctx.strokeStyle = `rgba(150, 150, 150, ${0.3 * this.dirtLevel})`;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        for (let i = 0; i < 10 * this.dirtLevel; i++) {
            const startX = 10 + Math.random() * (width - 20);
            const startY = 10 + Math.random() * (height - 20);
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            
            // 模拟指纹漩涡
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
     * 老化显示效果
     */
    applyAgedDisplay(ctx, width, height) {
        // 颜色褪色
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = 0.2 * this.ageEffect;
        ctx.fillStyle = 'rgba(200, 180, 150, 1)'; // Yellowish tint
        ctx.fillRect(0, 0, width, height);
        
        // 烧屏效果（模拟）
        const time = Date.now() / 10000;
        ctx.globalAlpha = 0.1 * this.ageEffect;
        
        // 模拟常驻元素（罗盘、飞机符号）
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        
        // 罗盘玫瑰烧屏
        const cx = width / 2;
        const cy = height / 2;
        const radius = Math.min(width, height) * 0.4;
        
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 飞机符号烧屏
        ctx.fillStyle = 'rgba(255, 255, 0, 0.03)';
        ctx.fillRect(cx - 10, cy - 10, 20, 20);
        
        // 坏点
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'black';
        
        for (let i = 0; i < 10 * this.ageEffect; i++) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);
            ctx.fillRect(x, y, 1, 1);
        }
    }
    
    /**
     * 设置效果级别（0-1）
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
 * 主显示效果管理器
 */
class DisplayEffectsManager {
    constructor() {
        this.currentEffect = DISPLAY_EFFECTS.LCD;       // 当前效果类型
        this.currentCondition = DISPLAY_CONDITIONS.NORMAL; // 当前环境条件
        this.effectIntensity = 0.7;                      // 效果强度
        
        this.crtEffect = new CRTDisplayEffect();
        this.lcdEffect = new LCDDisplayEffect();
        this.environmentalEffects = new EnvironmentalEffects();
        
        this.enabled = true;        // 是否启用效果
        this.lastRenderTime = 0;    // 上次渲染时间
        this.frameCount = 0;        // 帧计数
    }
    
    /**
     * 将显示效果应用到 Canvas
     */
    applyEffects(context, width, height) {
        if (!this.enabled) return;
        
        this.frameCount++;
        const now = Date.now();
        
        // 应用主要显示效果
        switch (this.currentEffect) {
            case DISPLAY_EFFECTS.CRT:
                this.crtEffect.setIntensity(this.effectIntensity);
                this.crtEffect.apply(context, width, height);
                break;
                
            case DISPLAY_EFFECTS.LCD:
                this.lcdEffect.apply(context, width, height);
                break;
                
            case DISPLAY_EFFECTS.OLED:
                // OLED 类似 LCD，但具有完美黑色
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
                // 无效果
                break;
        }
        
        // 应用环境条件
        this.environmentalEffects.apply(context, width, height, this.currentCondition);
        
        this.lastRenderTime = now - this.lastRenderTime;
        this.lastRenderTime = now;
    }
    
    /**
     * OLED 特定效果（完美黑色）
     */
    applyOLEDEffect(ctx, width, height) {
        // OLED 具有无限对比度，通过加深黑色来模拟
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            // 加深暗像素
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
     * 单色显示效果
     */
    applyMonochromeEffect(ctx, width, height) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // 转换为灰度（保持亮度）
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            
            data[i] = gray;     // R
            data[i + 1] = gray; // G
            data[i + 2] = gray; // B
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    /**
     * 夜视效果（绿色荧光）
     */
    applyNightVisionEffect(ctx, width, height) {
        // 转换为绿色单色
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // 夜视绿色荧光
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            const green = Math.min(255, luminance * 1.5);
            
            data[i] = 0;           // R
            data[i + 1] = green;   // G
            data[i + 2] = 0;       // B
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // 添加夜视颗粒噪点
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
     * 设置显示效果类型
     */
    setEffect(effectType) {
        if (Object.values(DISPLAY_EFFECTS).includes(effectType)) {
            this.currentEffect = effectType;
        }
    }
    
    /**
     * 设置环境条件
     */
    setCondition(condition) {
        if (Object.values(DISPLAY_CONDITIONS).includes(condition)) {
            this.currentCondition = condition;
        }
    }
    
    /**
     * 设置效果强度（0-1）
     */
    setIntensity(intensity) {
        this.effectIntensity = Math.max(0, Math.min(1, intensity));
    }
    
    /**
     * 启用/禁用效果
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    
    /**
     * 获取效果统计信息
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

// 导出单例实例
export const displayEffectsManager = new DisplayEffectsManager();

// 导出类和常量（用于测试）
export {
    DisplayEffectsManager,
    CRTDisplayEffect,
    LCDDisplayEffect,
    EnvironmentalEffects
    // displayEffectsManager is already exported above as named export
};

// 默认导出（方便使用）
export default {
    DisplayEffectsManager
    // displayEffectsManager is already exported as named export above
};