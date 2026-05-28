/**
 * Canvas 渲染优化器 - A320 ND 显示器
 * 专业级模拟的高级性能优化技术
 */

/**
 * 渲染质量级别
 */
export const RENDERING_QUALITY = {
    HIGH: 'HIGH',         // 全细节，目标 60 FPS
    MEDIUM: 'MEDIUM',     // 减少细节，目标 30 FPS
    LOW: 'LOW',           // 最小细节，目标 15 FPS
    ADAPTIVE: 'ADAPTIVE'  // 根据性能自动调整
};

/**
 * 显示列表 - 用于高效重绘
 */
class DisplayList {
    constructor() {
        this.items = [];          // 绘制操作列表
        this.dirty = true;        // 是否需要重新渲染
        this.cacheCanvas = null;  // 缓存 Canvas
        this.cacheContext = null; // 缓存上下文
        this.cacheValid = false;  // 缓存是否有效
    }
    
    /**
     * 添加绘制操作到显示列表
     */
    add(item) {
        this.items.push(item);
        this.dirty = true;
    }
    
    /**
     * 清空显示列表
     */
    clear() {
        this.items = [];
        this.dirty = true;
        this.cacheValid = false;
    }
    
    /**
     * 标记显示列表为脏（需要重新渲染）
     */
    markDirty() {
        this.dirty = true;
        this.cacheValid = false;
    }
    
    /**
     * 初始化缓存 Canvas
     */
    initCache(width, height) {
        if (!this.cacheCanvas) {
            this.cacheCanvas = document.createElement('canvas');
            this.cacheCanvas.width = width;
            this.cacheCanvas.height = height;
            this.cacheContext = this.cacheCanvas.getContext('2d');
        } else if (this.cacheCanvas.width !== width || this.cacheCanvas.height !== height) {
            this.cacheCanvas.width = width;
            this.cacheCanvas.height = height;
        }
    }
    
    /**
     * 如果脏则渲染到缓存
     */
    renderToCache(width, height) {
        if (!this.dirty && this.cacheValid) {
            return this.cacheCanvas;
        }
        
        this.initCache(width, height);
        
        // 清空缓存
        this.cacheContext.clearRect(0, 0, width, height);
        
        // 渲染所有项目
        this.items.forEach(item => {
            if (item.render) {
                item.render(this.cacheContext);
            }
        });
        
        this.dirty = false;
        this.cacheValid = true;
        
        return this.cacheCanvas;
    }
    
    /**
     * 将缓存内容绘制到目标上下文
     */
    drawToContext(targetContext, x = 0, y = 0) {
        if (this.cacheValid && this.cacheCanvas) {
            targetContext.drawImage(this.cacheCanvas, x, y);
        } else {
            // 回退：直接渲染
            this.items.forEach(item => {
                if (item.render) {
                    item.render(targetContext);
                }
            });
        }
    }
}

/**
 * 脏矩形管理器 - 用于局部重绘
 */
class DirtyRectangleManager {
    constructor() {
        this.dirtyRects = [];       // 脏矩形列表
        this.fullRedraw = false;    // 是否需要全量重绘
        this.mergeThreshold = 5;    // 合并距离小于此值的矩形
    }
    
    /**
     * 添加脏矩形
     */
    addDirtyRect(x, y, width, height) {
        this.dirtyRects.push({ x, y, width, height });
        
        // 如果脏矩形过多，直接全量重绘
        if (this.dirtyRects.length > 20) {
            this.fullRedraw = true;
            this.dirtyRects = [];
        }
    }
    
    /**
     * 标记整个 Canvas 为脏
     */
    markAllDirty() {
        this.fullRedraw = true;
        this.dirtyRects = [];
    }
    
    /**
     * 合并重叠或相邻的矩形
     */
    mergeRects() {
        if (this.dirtyRects.length <= 1) return;
        
        const merged = [];
        const processed = new Set();
        
        for (let i = 0; i < this.dirtyRects.length; i++) {
            if (processed.has(i)) continue;
            
            let rect = { ...this.dirtyRects[i] };
            processed.add(i);
            
            for (let j = i + 1; j < this.dirtyRects.length; j++) {
                if (processed.has(j)) continue;
                
                const other = this.dirtyRects[j];
                
                // 检查矩形是否重叠或接近
                const overlap = this.rectsOverlap(rect, other);
                const nearby = this.rectsNearby(rect, other, this.mergeThreshold);
                
                if (overlap || nearby) {
                    // 合并矩形
                    const minX = Math.min(rect.x, other.x);
                    const minY = Math.min(rect.y, other.y);
                    const maxX = Math.max(rect.x + rect.width, other.x + other.width);
                    const maxY = Math.max(rect.y + rect.height, other.y + other.height);
                    
                    rect = {
                        x: minX,
                        y: minY,
                        width: maxX - minX,
                        height: maxY - minY
                    };
                    
                    processed.add(j);
                }
            }
            
            merged.push(rect);
        }
        
        this.dirtyRects = merged;
    }
    
    /**
     * 检查两个矩形是否重叠
     */
    rectsOverlap(rect1, rect2) {
        return !(rect1.x + rect1.width < rect2.x ||
                rect2.x + rect2.width < rect1.x ||
                rect1.y + rect1.height < rect2.y ||
                rect2.y + rect2.height < rect1.y);
    }
    
    /**
     * 检查两个矩形是否相邻
     */
    rectsNearby(rect1, rect2, threshold) {
        const center1 = {
            x: rect1.x + rect1.width / 2,
            y: rect1.y + rect1.height / 2
        };
        
        const center2 = {
            x: rect2.x + rect2.width / 2,
            y: rect2.y + rect2.height / 2
        };
        
        const distance = Math.sqrt(
            Math.pow(center2.x - center1.x, 2) +
            Math.pow(center2.y - center1.y, 2)
        );
        
        return distance < threshold;
    }
    
    /**
     * 获取需要重绘的脏矩形
     */
    getDirtyRects() {
        if (this.fullRedraw) {
            return null; // null 表示全量重绘
        }
        
        this.mergeRects();
        return this.dirtyRects.length > 0 ? this.dirtyRects : null;
    }
    
    /**
     * 重绘后清空脏矩形
     */
    clear() {
        this.dirtyRects = [];
        this.fullRedraw = false;
    }
}

/**
 * 空间索引 - 用于高效对象查询
 */
class SpatialIndex {
    constructor(cellSize = 50) {
        this.cellSize = cellSize;  // 网格单元大小
        this.grid = new Map();     // 网格 → 对象ID集合
        this.objects = new Map();  // 对象ID → 对象数据
    }
    
    /**
     * 添加对象到空间索引
     */
    add(id, x, y, width, height) {
        const gridKeys = this.getGridKeys(x, y, width, height);
        const obj = { id, x, y, width, height };
        
        this.objects.set(id, obj);
        
        gridKeys.forEach(key => {
            if (!this.grid.has(key)) {
                this.grid.set(key, new Set());
            }
            this.grid.get(key).add(id);
        });
        
        return obj;
    }
    
    /**
     * 更新对象位置
     */
    update(id, x, y, width, height) {
        this.remove(id);
        return this.add(id, x, y, width, height);
    }
    
    /**
     * 从空间索引中移除对象
     */
    remove(id) {
        const obj = this.objects.get(id);
        if (!obj) return;
        
        const gridKeys = this.getGridKeys(obj.x, obj.y, obj.width, obj.height);
        
        gridKeys.forEach(key => {
            const cell = this.grid.get(key);
            if (cell) {
                cell.delete(id);
                if (cell.size === 0) {
                    this.grid.delete(key);
                }
            }
        });
        
        this.objects.delete(id);
    }
    
    /**
     * 获取矩形覆盖的网格单元键
     */
    getGridKeys(x, y, width, height) {
        const minX = Math.floor(x / this.cellSize);
        const minY = Math.floor(y / this.cellSize);
        const maxX = Math.floor((x + width) / this.cellSize);
        const maxY = Math.floor((y + height) / this.cellSize);
        
        const keys = [];
        for (let gx = minX; gx <= maxX; gx++) {
            for (let gy = minY; gy <= maxY; gy++) {
                keys.push(`${gx},${gy}`);
            }
        }
        
        return keys;
    }
    
    /**
     * 查询视口中的对象
     */
    query(x, y, width, height) {
        const gridKeys = this.getGridKeys(x, y, width, height);
        const result = new Set();
        
        gridKeys.forEach(key => {
            const cell = this.grid.get(key);
            if (cell) {
                cell.forEach(id => result.add(id));
            }
        });
        
        // 过滤出实际在视口中的对象
        const filtered = [];
        result.forEach(id => {
            const obj = this.objects.get(id);
            if (obj && this.rectsOverlap(obj, { x, y, width, height })) {
                filtered.push(obj);
            }
        });
        
        return filtered;
    }
    
    /**
     * 检查两个矩形是否重叠
     */
    rectsOverlap(rect1, rect2) {
        return !(rect1.x + rect1.width < rect2.x ||
                rect2.x + rect2.width < rect1.x ||
                rect1.y + rect1.height < rect2.y ||
                rect2.y + rect2.height < rect1.y);
    }
    
    /**
     * 清空空间索引
     */
    clear() {
        this.grid.clear();
        this.objects.clear();
    }
}

/**
 * 对象池 - 用于减少垃圾回收
 */
class ObjectPool {
    constructor(createFn, resetFn, initialSize = 100) {
        this.createFn = createFn;     // 创建对象函数
        this.resetFn = resetFn;       // 重置对象函数
        this.pool = [];               // 对象池
        this.activeCount = 0;         // 活跃对象数
        
        // 预分配对象
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(createFn());
        }
    }
    
    /**
     * 从池中获取对象
     */
    acquire() {
        if (this.pool.length > 0) {
            this.activeCount++;
            return this.pool.pop();
        } else {
            this.activeCount++;
            return this.createFn();
        }
    }
    
    /**
     * 将对象归还到池中
     */
    release(obj) {
        if (this.resetFn) {
            this.resetFn(obj);
        }
        this.pool.push(obj);
        this.activeCount--;
    }
    
    /**
     * 获取池统计信息
     */
    getStats() {
        return {
            total: this.pool.length + this.activeCount,
            available: this.pool.length,
            active: this.activeCount,
            utilization: this.activeCount / (this.pool.length + this.activeCount)
        };
    }
}

/**
 * 帧率控制器
 */
class FrameRateController {
    constructor(targetFPS = 60) {
        this.targetFPS = targetFPS;           // 目标帧率
        this.targetFrameTime = 1000 / targetFPS; // 目标帧时间（毫秒）
        this.lastFrameTime = 0;               // 上一帧时间
        this.frameTimes = [];                 // 帧时间记录
        this.averageFPS = targetFPS;          // 平均帧率
        this.frameCount = 0;                  // 帧计数
        this.lastFPSUpdate = 0;               // 上次更新 FPS 的时间
    }
    
    /**
     * 必要时等待以维持目标帧率
     */
    async throttle() {
        const now = performance.now();
        const elapsed = now - this.lastFrameTime;
        
        if (elapsed < this.targetFrameTime) {
            const waitTime = this.targetFrameTime - elapsed;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.lastFrameTime = performance.now();
        this.frameCount++;
        
        // 每秒更新一次 FPS
        if (now - this.lastFPSUpdate >= 1000) {
            this.averageFPS = this.frameCount;
            this.frameCount = 0;
            this.lastFPSUpdate = now;
        }
        
        return this.averageFPS;
    }
    
    /**
     * 根据性能调整目标帧率
     */
    adjustForPerformance(currentFPS, minFPS = 15, maxFPS = 60) {
        if (currentFPS < minFPS) {
            // 降低目标以减少负载
            this.targetFPS = Math.max(minFPS, this.targetFPS - 5);
        } else if (currentFPS > this.targetFPS + 5) {
            // 有余量时提高目标
            this.targetFPS = Math.min(maxFPS, this.targetFPS + 5);
        }
        
        this.targetFrameTime = 1000 / this.targetFPS;
        return this.targetFPS;
    }
    
    /**
     * 获取性能统计信息
     */
    getStats() {
        return {
            targetFPS: this.targetFPS,
            currentFPS: this.averageFPS,
            frameTime: this.targetFrameTime
        };
    }
}

/**
 * 主渲染优化器
 */
class RenderingOptimizer {
    constructor() {
        this.quality = RENDERING_QUALITY.ADAPTIVE;  // 渲染质量
        this.displayList = new DisplayList();
        this.dirtyRectManager = new DirtyRectangleManager();
        this.spatialIndex = new SpatialIndex();
        this.frameController = new FrameRateController(60);
        
        // 常用对象的对象池
        this.waypointPool = new ObjectPool(
            () => ({ x: 0, y: 0, name: '', type: '' }),
            obj => { obj.x = 0; obj.y = 0; obj.name = ''; obj.type = ''; }
        );
        
        this.trafficPool = new ObjectPool(
            () => ({ x: 0, y: 0, bearing: 0, distance: 0, threatLevel: '' }),
            obj => { obj.x = 0; obj.y = 0; obj.bearing = 0; obj.distance = 0; obj.threatLevel = ''; }
        );
        
        // 性能监控
        this.renderTimes = [];
        this.lastRenderTime = 0;
        this.performanceStats = {
            totalFrames: 0,            // 总帧数
            averageRenderTime: 0,      // 平均渲染时间
            minRenderTime: Infinity,   // 最小渲染时间
            maxRenderTime: 0,          // 最大渲染时间
            dirtyRectRedraws: 0,       // 脏矩形重绘次数
            fullRedraws: 0             // 全量重绘次数
        };
    }
    
    /**
     * 设置渲染质量级别
     */
    setQuality(quality) {
        this.quality = quality;
        
        switch (quality) {
            case RENDERING_QUALITY.HIGH:
                this.frameController.targetFPS = 60;
                break;
            case RENDERING_QUALITY.MEDIUM:
                this.frameController.targetFPS = 30;
                break;
            case RENDERING_QUALITY.LOW:
                this.frameController.targetFPS = 15;
                break;
            case RENDERING_QUALITY.ADAPTIVE:
                // 将自动调整
                break;
        }
        
        this.frameController.targetFrameTime = 1000 / this.frameController.targetFPS;
    }
    
    /**
     * 开始渲染帧
     */
    beginFrame() {
        this.lastRenderTime = performance.now();
    }
    
    /**
     * 结束渲染帧并更新统计信息
     */
    endFrame() {
        const renderTime = performance.now() - this.lastRenderTime;
        
        // 更新性能统计信息
        this.renderTimes.push(renderTime);
        if (this.renderTimes.length > 60) {
            this.renderTimes.shift();
        }
        
        this.performanceStats.totalFrames++;
        this.performanceStats.averageRenderTime = 
            this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length;
        this.performanceStats.minRenderTime = Math.min(this.performanceStats.minRenderTime, renderTime);
        this.performanceStats.maxRenderTime = Math.max(this.performanceStats.maxRenderTime, renderTime);
        
        // 自适应质量调整
        if (this.quality === RENDERING_QUALITY.ADAPTIVE) {
            const currentFPS = 1000 / (renderTime || 1);
            this.frameController.adjustForPerformance(currentFPS);
            
            // 根据性能调整细节级别
            if (currentFPS < 20) {
                this.setQuality(RENDERING_QUALITY.LOW);
            } else if (currentFPS < 40) {
                this.setQuality(RENDERING_QUALITY.MEDIUM);
            } else {
                this.setQuality(RENDERING_QUALITY.HIGH);
            }
        }
        
        return renderTime;
    }
    
    /**
     * 根据视口和质量优化渲染
     */
    getRenderOptions(viewport) {
        const options = {
            quality: this.quality,
            detailLevel: 'HIGH',
            culling: true,
            lod: false
        };
        
        switch (this.quality) {
            case RENDERING_QUALITY.HIGH:
                options.detailLevel = 'HIGH';
                options.culling = true;
                options.lod = false;
                break;
                
            case RENDERING_QUALITY.MEDIUM:
                options.detailLevel = 'MEDIUM';
                options.culling = true;
                options.lod = true;
                break;
                
            case RENDERING_QUALITY.LOW:
                options.detailLevel = 'LOW';
                options.culling = true;
                options.lod = true;
                break;
        }
        // 细节级别：减少远处对象的细节
        if (options.lod && viewport) {
            const viewportSize = Math.max(viewport.width, viewport.height);
            options.lodThreshold = viewportSize * 0.3; // 超过视口 30% 的对象减少细节
        }
        
        return options;
    }
    
    /**
     * 使用优化进行渲染
     */
    render(context, width, height, renderCallback) {
        this.beginFrame();
        
        // 获取脏矩形
        const dirtyRects = this.dirtyRectManager.getDirtyRects();
        
        if (dirtyRects === null) {
            // 全量重绘
            this.performanceStats.fullRedraws++;
            context.clearRect(0, 0, width, height);
            renderCallback(context, 0, 0, width, height);
        } else if (dirtyRects.length > 0) {
            // 局部重绘
            this.performanceStats.dirtyRectRedraws++;
            
            // 保存上下文状态
            context.save();
            
            // 为每个脏矩形设置裁剪区域
            dirtyRects.forEach(rect => {
                context.save();
                context.beginPath();
                context.rect(rect.x, rect.y, rect.width, rect.height);
                context.clip();
                
                // 仅清除脏区域
                context.clearRect(rect.x, rect.y, rect.width, rect.height);
                
                // 渲染
                renderCallback(context, rect.x, rect.y, rect.width, rect.height);
                
                context.restore();
            });
            
            context.restore();
        }
        
        // 渲染后清空脏矩形
        this.dirtyRectManager.clear();
        
        const renderTime = this.endFrame();
        return { renderTime, dirtyRects: dirtyRects?.length || 0 };
    }
    
    /**
     * 添加对象到空间索引并标记区域为脏
     */
    addObject(id, x, y, width, height) {
        const obj = this.spatialIndex.add(id, x, y, width, height);
        this.dirtyRectManager.addDirtyRect(x, y, width, height);
        return obj;
    }
    
    /**
     * 更新空间索引中的对象
     */
    updateObject(id, x, y, width, height) {
        const oldObj = this.spatialIndex.objects.get(id);
        if (oldObj) {
            // 标记旧位置为脏
            this.dirtyRectManager.addDirtyRect(oldObj.x, oldObj.y, oldObj.width, oldObj.height);
        }
        
        const obj = this.spatialIndex.update(id, x, y, width, height);
        this.dirtyRectManager.addDirtyRect(x, y, width, height);
        return obj;
    }
    
    /**
     * 移除对象并标记区域为脏
     */
    removeObject(id) {
        const obj = this.spatialIndex.objects.get(id);
        if (obj) {
            this.dirtyRectManager.addDirtyRect(obj.x, obj.y, obj.width, obj.height);
            this.spatialIndex.remove(id);
        }
    }
    
    /**
     * 查询视口中的对象（用于裁剪）
     */
    queryViewport(x, y, width, height) {
        return this.spatialIndex.query(x, y, width, height);
    }
    
    /**
     * 获取性能统计信息
     */
    getPerformanceStats() {
        const frameStats = this.frameController.getStats();
        const poolStats = {
            waypoints: this.waypointPool.getStats(),
            traffic: this.trafficPool.getStats()
        };
        
        return {
            ...this.performanceStats,
            ...frameStats,
            pools: poolStats,
            quality: this.quality,
            displayListItems: this.displayList.items.length,
            spatialIndexObjects: this.spatialIndex.objects.size
        };
    }
    
    /**
     * 重置优化器状态
     */
    reset() {
        this.displayList.clear();
        this.dirtyRectManager.clear();
        this.spatialIndex.clear();
        
        this.renderTimes = [];
        this.performanceStats = {
            totalFrames: 0,
            averageRenderTime: 0,
            minRenderTime: Infinity,
            maxRenderTime: 0,
            dirtyRectRedraws: 0,
            fullRedraws: 0
        };
    }
}

// 导出单例实例
export const renderingOptimizer = new RenderingOptimizer();

// 导出类和常量（用于测试）
export {
    RenderingOptimizer,
    DisplayList,
    DirtyRectangleManager,
    SpatialIndex,
    ObjectPool,
    FrameRateController
    // renderingOptimizer is already exported above as named export
};
// 默认导出（方便使用）
export default {
    RenderingOptimizer
    // renderingOptimizer and RENDERING_QUALITY are already exported as named exports
};
        
        
