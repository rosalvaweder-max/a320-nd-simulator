/**
 * Canvas Rendering Optimizer for A320 ND Display
 * Advanced performance optimization techniques for professional-grade simulation
 */

/**
 * Rendering Quality Levels
 */
export const RENDERING_QUALITY = {
    HIGH: 'HIGH',     // Full detail, 60 FPS target
    MEDIUM: 'MEDIUM', // Reduced detail, 30 FPS target  
    LOW: 'LOW',       // Minimal detail, 15 FPS target
    ADAPTIVE: 'ADAPTIVE' // Automatically adjusts based on performance
};

/**
 * Display List for efficient redraw
 */
class DisplayList {
    constructor() {
        this.items = [];
        this.dirty = true;
        this.cacheCanvas = null;
        this.cacheContext = null;
        this.cacheValid = false;
    }
    
    /**
     * Add draw operation to display list
     */
    add(item) {
        this.items.push(item);
        this.dirty = true;
    }
    
    /**
     * Clear display list
     */
    clear() {
        this.items = [];
        this.dirty = true;
        this.cacheValid = false;
    }
    
    /**
     * Mark display list as dirty
     */
    markDirty() {
        this.dirty = true;
        this.cacheValid = false;
    }
    
    /**
     * Initialize cache canvas
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
     * Render to cache if dirty
     */
    renderToCache(width, height) {
        if (!this.dirty && this.cacheValid) {
            return this.cacheCanvas;
        }
        
        this.initCache(width, height);
        
        // Clear cache
        this.cacheContext.clearRect(0, 0, width, height);
        
        // Render all items
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
     * Draw cached content to target context
     */
    drawToContext(targetContext, x = 0, y = 0) {
        if (this.cacheValid && this.cacheCanvas) {
            targetContext.drawImage(this.cacheCanvas, x, y);
        } else {
            // Fallback: render directly
            this.items.forEach(item => {
                if (item.render) {
                    item.render(targetContext);
                }
            });
        }
    }
}

/**
 * Dirty Rectangle Manager for partial redraws
 */
class DirtyRectangleManager {
    constructor() {
        this.dirtyRects = [];
        this.fullRedraw = false;
        this.mergeThreshold = 5; // Merge rects closer than this
    }
    
    /**
     * Add dirty rectangle
     */
    addDirtyRect(x, y, width, height) {
        this.dirtyRects.push({ x, y, width, height });
        
        // If too many dirty rects, just do full redraw
        if (this.dirtyRects.length > 20) {
            this.fullRedraw = true;
            this.dirtyRects = [];
        }
    }
    
    /**
     * Mark entire canvas as dirty
     */
    markAllDirty() {
        this.fullRedraw = true;
        this.dirtyRects = [];
    }
    
    /**
     * Merge overlapping or nearby rectangles
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
                
                // Check if rectangles overlap or are close
                const overlap = this.rectsOverlap(rect, other);
                const nearby = this.rectsNearby(rect, other, this.mergeThreshold);
                
                if (overlap || nearby) {
                    // Merge rectangles
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
     * Check if two rectangles overlap
     */
    rectsOverlap(rect1, rect2) {
        return !(rect1.x + rect1.width < rect2.x ||
                rect2.x + rect2.width < rect1.x ||
                rect1.y + rect1.height < rect2.y ||
                rect2.y + rect2.height < rect1.y);
    }
    
    /**
     * Check if two rectangles are nearby
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
     * Get dirty rectangles for redraw
     */
    getDirtyRects() {
        if (this.fullRedraw) {
            return null; // null means full redraw
        }
        
        this.mergeRects();
        return this.dirtyRects.length > 0 ? this.dirtyRects : null;
    }
    
    /**
     * Clear dirty rectangles after redraw
     */
    clear() {
        this.dirtyRects = [];
        this.fullRedraw = false;
    }
}

/**
 * Spatial Index for efficient object querying
 */
class SpatialIndex {
    constructor(cellSize = 50) {
        this.cellSize = cellSize;
        this.grid = new Map();
        this.objects = new Map();
    }
    
    /**
     * Add object to spatial index
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
     * Update object position
     */
    update(id, x, y, width, height) {
        this.remove(id);
        return this.add(id, x, y, width, height);
    }
    
    /**
     * Remove object from spatial index
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
     * Get grid cell keys for a rectangle
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
     * Query objects in viewport
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
        
        // Filter objects that are actually in the viewport
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
     * Check if two rectangles overlap
     */
    rectsOverlap(rect1, rect2) {
        return !(rect1.x + rect1.width < rect2.x ||
                rect2.x + rect2.width < rect1.x ||
                rect1.y + rect1.height < rect2.y ||
                rect2.y + rect2.height < rect1.y);
    }
    
    /**
     * Clear spatial index
     */
    clear() {
        this.grid.clear();
        this.objects.clear();
    }
}

/**
 * Object Pool for reducing garbage collection
 */
class ObjectPool {
    constructor(createFn, resetFn, initialSize = 100) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        this.activeCount = 0;
        
        // Pre-allocate objects
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(createFn());
        }
    }
    
    /**
     * Get object from pool
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
     * Return object to pool
     */
    release(obj) {
        if (this.resetFn) {
            this.resetFn(obj);
        }
        this.pool.push(obj);
        this.activeCount--;
    }
    
    /**
     * Get pool statistics
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
 * Frame Rate Controller
 */
class FrameRateController {
    constructor(targetFPS = 60) {
        this.targetFPS = targetFPS;
        this.targetFrameTime = 1000 / targetFPS;
        this.lastFrameTime = 0;
        this.frameTimes = [];
        this.averageFPS = targetFPS;
        this.frameCount = 0;
        this.lastFPSUpdate = 0;
    }
    
    /**
     * Wait if necessary to maintain target FPS
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
        
        // Update FPS every second
        if (now - this.lastFPSUpdate >= 1000) {
            this.averageFPS = this.frameCount;
            this.frameCount = 0;
            this.lastFPSUpdate = now;
        }
        
        return this.averageFPS;
    }
    
    /**
     * Adjust target FPS based on performance
     */
    adjustForPerformance(currentFPS, minFPS = 15, maxFPS = 60) {
        if (currentFPS < minFPS) {
            // Lower target to reduce load
            this.targetFPS = Math.max(minFPS, this.targetFPS - 5);
        } else if (currentFPS > this.targetFPS + 5) {
            // Increase target if we have headroom
            this.targetFPS = Math.min(maxFPS, this.targetFPS + 5);
        }
        
        this.targetFrameTime = 1000 / this.targetFPS;
        return this.targetFPS;
    }
    
    /**
     * Get performance statistics
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
 * Main Rendering Optimizer
 */
class RenderingOptimizer {
    constructor() {
        this.quality = RENDERING_QUALITY.ADAPTIVE;
        this.displayList = new DisplayList();
        this.dirtyRectManager = new DirtyRectangleManager();
        this.spatialIndex = new SpatialIndex();
        this.frameController = new FrameRateController(60);
        
        // Object pools for common objects
        this.waypointPool = new ObjectPool(
            () => ({ x: 0, y: 0, name: '', type: '' }),
            obj => { obj.x = 0; obj.y = 0; obj.name = ''; obj.type = ''; }
        );
        
        this.trafficPool = new ObjectPool(
            () => ({ x: 0, y: 0, bearing: 0, distance: 0, threatLevel: '' }),
            obj => { obj.x = 0; obj.y = 0; obj.bearing = 0; obj.distance = 0; obj.threatLevel = ''; }
        );
        
        // Performance monitoring
        this.renderTimes = [];
        this.lastRenderTime = 0;
        this.performanceStats = {
            totalFrames: 0,
            averageRenderTime: 0,
            minRenderTime: Infinity,
            maxRenderTime: 0,
            dirtyRectRedraws: 0,
            fullRedraws: 0
        };
    }
    
    /**
     * Set rendering quality level
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
                // Will adjust automatically
                break;
        }
        
        this.frameController.targetFrameTime = 1000 / this.frameController.targetFPS;
    }
    
    /**
     * Begin rendering frame
     */
    beginFrame() {
        this.lastRenderTime = performance.now();
    }
    
    /**
     * End rendering frame and update statistics
     */
    endFrame() {
        const renderTime = performance.now() - this.lastRenderTime;
        
        // Update performance statistics
        this.renderTimes.push(renderTime);
        if (this.renderTimes.length > 60) {
            this.renderTimes.shift();
        }
        
        this.performanceStats.totalFrames++;
        this.performanceStats.averageRenderTime = 
            this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length;
        this.performanceStats.minRenderTime = Math.min(this.performanceStats.minRenderTime, renderTime);
        this.performanceStats.maxRenderTime = Math.max(this.performanceStats.maxRenderTime, renderTime);
        
        // Adaptive quality adjustment
        if (this.quality === RENDERING_QUALITY.ADAPTIVE) {
            const currentFPS = 1000 / (renderTime || 1);
            this.frameController.adjustForPerformance(currentFPS);
            
            // Adjust detail level based on performance
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
     * Optimize rendering based on viewport and quality
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
        // Level of Detail: reduce detail for distant objects
        if (options.lod && viewport) {
            const viewportSize = Math.max(viewport.width, viewport.height);
            options.lodThreshold = viewportSize * 0.3; // Objects beyond 30% of viewport get reduced detail
        }
        
        return options;
    }
    
    /**
     * Render with optimization
     */
    render(context, width, height, renderCallback) {
        this.beginFrame();
        
        // Get dirty rectangles
        const dirtyRects = this.dirtyRectManager.getDirtyRects();
        
        if (dirtyRects === null) {
            // Full redraw
            this.performanceStats.fullRedraws++;
            context.clearRect(0, 0, width, height);
            renderCallback(context, 0, 0, width, height);
        } else if (dirtyRects.length > 0) {
            // Partial redraw
            this.performanceStats.dirtyRectRedraws++;
            
            // Save context state
            context.save();
            
            // Set clipping region for each dirty rectangle
            dirtyRects.forEach(rect => {
                context.save();
                context.beginPath();
                context.rect(rect.x, rect.y, rect.width, rect.height);
                context.clip();
                
                // Clear only the dirty area
                context.clearRect(rect.x, rect.y, rect.width, rect.height);
                
                // Render
                renderCallback(context, rect.x, rect.y, rect.width, rect.height);
                
                context.restore();
            });
            
            context.restore();
        }
        
        // Clear dirty rectangles after rendering
        this.dirtyRectManager.clear();
        
        const renderTime = this.endFrame();
        return { renderTime, dirtyRects: dirtyRects?.length || 0 };
    }
    
    /**
     * Add object to spatial index and mark area as dirty
     */
    addObject(id, x, y, width, height) {
        const obj = this.spatialIndex.add(id, x, y, width, height);
        this.dirtyRectManager.addDirtyRect(x, y, width, height);
        return obj;
    }
    
    /**
     * Update object in spatial index
     */
    updateObject(id, x, y, width, height) {
        const oldObj = this.spatialIndex.objects.get(id);
        if (oldObj) {
            // Mark old position as dirty
            this.dirtyRectManager.addDirtyRect(oldObj.x, oldObj.y, oldObj.width, oldObj.height);
        }
        
        const obj = this.spatialIndex.update(id, x, y, width, height);
        this.dirtyRectManager.addDirtyRect(x, y, width, height);
        return obj;
    }
    
    /**
     * Remove object and mark area as dirty
     */
    removeObject(id) {
        const obj = this.spatialIndex.objects.get(id);
        if (obj) {
            this.dirtyRectManager.addDirtyRect(obj.x, obj.y, obj.width, obj.height);
            this.spatialIndex.remove(id);
        }
    }
    
    /**
     * Query objects in viewport for culling
     */
    queryViewport(x, y, width, height) {
        return this.spatialIndex.query(x, y, width, height);
    }
    
    /**
     * Get performance statistics
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
     * Reset optimizer state
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

// Export singleton instance
export const renderingOptimizer = new RenderingOptimizer();

// Export classes and constants for testing
export {
    RenderingOptimizer,
    DisplayList,
    DirtyRectangleManager,
    SpatialIndex,
    ObjectPool,
    FrameRateController
    // renderingOptimizer is already exported above as named export
};
// Default export for convenience
export default {
    RenderingOptimizer
    // renderingOptimizer and RENDERING_QUALITY are already exported as named exports
};
        
        
