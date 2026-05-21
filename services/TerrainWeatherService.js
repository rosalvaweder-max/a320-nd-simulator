/**
 * Terrain and Weather Radar Simulation Service
 * Professional-grade terrain display and weather radar simulation for A320 ND
 */

import { COLORS, NAV } from '../constants.js';

/**
 * Terrain Service for elevation data processing and display
 */
class TerrainService {
    constructor() {
        this.terrainData = null;
        this.elevationCache = new Map();
        this.gridResolution = 10; // NM grid resolution
    }
    
    /**
     * Load terrain data from external source
     */
    async loadTerrainData(url) {
        try {
            const response = await fetch(url);
            this.terrainData = await response.json();
            this.preprocessTerrainData();
            return true;
        } catch (error) {
            console.error('Failed to load terrain data:', error);
            return false;
        }
    }
    
    /**
     * Preprocess terrain data for faster rendering
     */
    preprocessTerrainData() {
        if (!this.terrainData || !this.terrainData.elevations) return;
        
        // Create elevation grid for quick lookup
        const { elevations, bounds, resolution } = this.terrainData;
        
        this.gridResolution = resolution || 10;
        this.terrainBounds = bounds;
        
        // Convert to grid for faster interpolation
        const gridWidth = Math.ceil((bounds.maxX - bounds.minX) / this.gridResolution);
        const gridHeight = Math.ceil((bounds.maxY - bounds.minY) / this.gridResolution);
        
        this.elevationGrid = new Array(gridWidth);
        for (let i = 0; i < gridWidth; i++) {
            this.elevationGrid[i] = new Array(gridHeight).fill(0);
        }
        
        // Populate grid
        elevations.forEach(elevation => {
            const gridX = Math.floor((elevation.x - bounds.minX) / this.gridResolution);
            const gridY = Math.floor((elevation.y - bounds.minY) / this.gridResolution);
            
            if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight) {
                this.elevationGrid[gridX][gridY] = elevation.elevation;
            }
        });
    }
    
    /**
     * Get elevation at specific coordinates (bilinear interpolation)
     */
    getElevationAt(x, y) {
        if (!this.terrainData || !this.elevationGrid) return 0;
        
        const { minX, minY } = this.terrainBounds;
        const gridX = (x - minX) / this.gridResolution;
        const gridY = (y - minY) / this.gridResolution;
        
        const x1 = Math.floor(gridX);
        const y1 = Math.floor(gridY);
        const x2 = Math.min(x1 + 1, this.elevationGrid.length - 1);
        const y2 = Math.min(y1 + 1, this.elevationGrid[0].length - 1);
        
        // Bilinear interpolation
        const q11 = this.elevationGrid[x1]?.[y1] || 0;
        const q12 = this.elevationGrid[x1]?.[y2] || 0;
        const q21 = this.elevationGrid[x2]?.[y1] || 0;
        const q22 = this.elevationGrid[x2]?.[y2] || 0;
        
        const xRatio = gridX - x1;
        const yRatio = gridY - y1;
        
        const elevation = 
            q11 * (1 - xRatio) * (1 - yRatio) +
            q21 * xRatio * (1 - yRatio) +
            q12 * (1 - xRatio) * yRatio +
            q22 * xRatio * yRatio;
        
        return Math.max(0, elevation);
    }
    
    /**
     * Get terrain color based on elevation
     */
    getTerrainColor(elevation) {
        if (elevation >= 10000) return COLORS.TERRAIN_EXTREME;
        if (elevation >= 5000) return COLORS.TERRAIN_VERY_HIGH;
        if (elevation >= 2000) return COLORS.TERRAIN_HIGH;
        if (elevation >= 1000) return COLORS.TERRAIN_MEDIUM;
        return COLORS.TERRAIN_LOW;
    }
    
    /**
     * Generate terrain contours for display
     */
    generateTerrainContours(centerX, centerY, range, resolution = 20) {
        if (!this.terrainData) return [];
        
        const contours = [];
        const gridSize = Math.ceil(range * 2 / resolution);
        
        for (let i = -gridSize; i <= gridSize; i++) {
            for (let j = -gridSize; j <= gridSize; j++) {
                const x = centerX + i * resolution;
                const y = centerY + j * resolution;
                
                const elevation = this.getElevationAt(x, y);
                if (elevation > 0) {
                    contours.push({
                        x, y, elevation,
                        color: this.getTerrainColor(elevation)
                    });
                }
            }
        }
        
        return contours;
    }
    
    /**
     * Calculate terrain clearance and warnings
     */
    calculateTerrainClearance(aircraftX, aircraftY, aircraftAltitude, lookaheadDistance = 20) {
        if (!this.terrainData) return { clearance: Infinity, warning: 'NONE' };
        
        // Check terrain along flight path
        let maxElevation = 0;
        const steps = 10;
        
        for (let i = 0; i <= steps; i++) {
            const distance = (i / steps) * lookaheadDistance;
            // Simplified: check straight ahead (should use actual flight path)
            const checkX = aircraftX;
            const checkY = aircraftY + distance;
            
            const elevation = this.getElevationAt(checkX, checkY);
            maxElevation = Math.max(maxElevation, elevation);
        }
        
        const clearance = aircraftAltitude - maxElevation;
        
        // Determine warning level
        let warning = 'NONE';
        if (clearance < 500) warning = 'PULL UP';
        else if (clearance < 1000) warning = 'TERRAIN';
        else if (clearance < 2000) warning = 'CAUTION';
        
        return { clearance, warning, maxElevation };
    }
}

/**
 * Weather Radar Service for precipitation and turbulence simulation
 */
class WeatherRadarService {
    constructor() {
        this.weatherCells = [];
        this.turbulenceAreas = [];
        this.radarRange = 80; // NM
        this.radarTilt = 0; // degrees
        this.lastUpdate = Date.now();
    }
    
    /**
     * Generate realistic weather patterns
     */
    generateWeatherPattern(centerX, centerY, intensity = 'MODERATE') {
        const patterns = {
            'ISOLATED': this.generateIsolatedCells.bind(this),
            'SCATTERED': this.generateScatteredCells.bind(this),
            'BROKEN': this.generateBrokenLayer.bind(this),
            'OVERCAST': this.generateOvercastLayer.bind(this)
        };
        
        const generator = patterns[intensity] || patterns['SCATTERED'];
        this.weatherCells = generator(centerX, centerY);
        this.generateTurbulenceAreas();
        
        this.lastUpdate = Date.now();
    }
    
    /**
     * Generate isolated weather cells
     */
    generateIsolatedCells(centerX, centerY) {
        const cells = [];
        const cellCount = 3 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < cellCount; i++) {
            const distance = 10 + Math.random() * 40;
            const bearing = Math.random() * 360;
            const radius = 2 + Math.random() * 8;
            
            const cell = {
                x: centerX + Math.sin(bearing * NAV.DEG_TO_RAD) * distance,
                y: centerY + Math.cos(bearing * NAV.DEG_TO_RAD) * distance,
                radius,
                intensity: this.randomIntensity(),
                top: 25000 + Math.random() * 15000,
                base: 5000 + Math.random() * 10000,
                turbulence: Math.random() > 0.7
            };
            
            cells.push(cell);
        }
        
        return cells;
    }
    
    /**
     * Generate scattered weather cells
     */
    generateScatteredCells(centerX, centerY) {
        const cells = [];
        const cellCount = 6 + Math.floor(Math.random() * 6);
        
        for (let i = 0; i < cellCount; i++) {
            const distance = 5 + Math.random() * 30;
            const bearing = Math.random() * 360;
            const radius = 3 + Math.random() * 12;
            
            const cell = {
                x: centerX + Math.sin(bearing * NAV.DEG_TO_RAD) * distance,
                y: centerY + Math.cos(bearing * NAV.DEG_TO_RAD) * distance,
                radius,
                intensity: this.randomIntensity(),
                top: 30000 + Math.random() * 20000,
                base: 3000 + Math.random() * 8000,
                turbulence: Math.random() > 0.5
            };
            
            cells.push(cell);
        }
        
        return cells;
    }
    
    /**
     * Generate broken cloud layer
     */
    generateBrokenLayer(centerX, centerY) {
        const cells = [];
        const layerRadius = 40;
        
        // Create larger connected areas
        for (let i = 0; i < 4; i++) {
            const offsetX = (Math.random() - 0.5) * 30;
            const offsetY = (Math.random() - 0.5) * 30;
            
            const cell = {
                x: centerX + offsetX,
                y: centerY + offsetY,
                radius: layerRadius,
                intensity: 'MODERATE',
                top: 25000,
                base: 8000,
                turbulence: true
            };
            
            cells.push(cell);
        }
        
        return cells;
    }
    
    /**
     * Generate overcast layer
     */
    generateOvercastLayer(centerX, centerY) {
        return [{
            x: centerX,
            y: centerY,
            radius: 60,
            intensity: 'HEAVY',
            top: 35000,
            base: 5000,
            turbulence: true
        }];
    }
    
    /**
     * Generate turbulence areas associated with weather
     */
    generateTurbulenceAreas() {
        this.turbulenceAreas = this.weatherCells
            .filter(cell => cell.turbulence)
            .map(cell => ({
                x: cell.x,
                y: cell.y,
                radius: cell.radius * 1.5,
                intensity: this.randomTurbulenceIntensity()
            }));
    }
    
    /**
     * Random weather intensity
     */
    randomIntensity() {
        const rand = Math.random();
        if (rand < 0.1) return 'EXTREME';
        if (rand < 0.3) return 'HEAVY';
        if (rand < 0.6) return 'MODERATE';
        return 'LIGHT';
    }
    
    /**
     * Random turbulence intensity
     */
    randomTurbulenceIntensity() {
        const rand = Math.random();
        if (rand < 0.1) return 'SEVERE';
        if (rand < 0.3) return 'MODERATE';
        return 'LIGHT';
    }
    
    /**
     * Get weather color based on intensity
     */
    getWeatherColor(intensity) {
        switch (intensity) {
            case 'EXTREME': return COLORS.WEATHER_EXTREME;
            case 'HEAVY': return COLORS.WEATHER_HEAVY;
            case 'MODERATE': return COLORS.WEATHER_MODERATE;
            case 'LIGHT': return COLORS.WEATHER_LIGHT;
            default: return COLORS.WEATHER_LIGHT;
        }
    }
    
    /**
     * Get turbulence color based on intensity
     */
    getTurbulenceColor(intensity) {
        switch (intensity) {
            case 'SEVERE': return COLORS.RED;
            case 'MODERATE': return COLORS.AMBER;
            case 'LIGHT': return COLORS.YELLOW;
            default: return COLORS.YELLOW;
        }
    }
    
    /**
     * Simulate radar beam propagation and returns
     */
    simulateRadarReturns(aircraftX, aircraftY, aircraftAltitude, radarTilt = 0) {
        const returns = [];
        const now = Date.now();
        const timeFactor = (now - this.lastUpdate) / 1000;
        
        this.weatherCells.forEach(cell => {
            // Calculate distance to cell
            const dx = cell.x - aircraftX;
            const dy = cell.y - aircraftY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check if within radar range
            if (distance > this.radarRange) return;
            
            // Calculate beam elevation at cell distance
            const beamElevation = this.calculateBeamElevation(distance, radarTilt, aircraftAltitude);
            
            // Check if beam intersects weather cell
            if (beamElevation >= cell.base && beamElevation <= cell.top) {
                // Calculate return intensity (attenuated by distance)
                const attenuation = Math.max(0.1, 1 - (distance / this.radarRange));
                const returnIntensity = this.calculateReturnIntensity(cell.intensity, attenuation);
                
                returns.push({
                    bearing: Math.atan2(dx, dy) * NAV.RAD_TO_DEG,
                    distance,
                    intensity: returnIntensity,
                    cell
                });
            }
        });
        
        // Add turbulence returns
        this.turbulenceAreas.forEach(area => {
            const dx = area.x - aircraftX;
            const dy = area.y - aircraftY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= area.radius) {
                returns.push({
                    bearing: Math.atan2(dx, dy) * NAV.RAD_TO_DEG,
                    distance,
                    intensity: 'TURBULENCE',
                    turbulenceIntensity: area.intensity
                });
            }
        });
        
        // Animate weather movement
        this.animateWeather(timeFactor);
        
        return returns;
    }
    
    /**
     * Calculate radar beam elevation at given distance
     */
    calculateBeamElevation(distance, tilt, aircraftAltitude) {
        // Simplified beam geometry
        const beamSlope = Math.tan(tilt * NAV.DEG_TO_RAD);
        return aircraftAltitude + beamSlope * distance * 6076.12; // Convert NM to feet
    }
    
    /**
     * Calculate radar return intensity
     */
    calculateReturnIntensity(baseIntensity, attenuation) {
        // Apply distance attenuation and random variation
        const variation = 0.8 + Math.random() * 0.4;
        const rawIntensity = this.intensityToValue(baseIntensity) * attenuation * variation;
        
        // Convert back to intensity category
        if (rawIntensity > 0.7) return 'EXTREME';
        if (rawIntensity > 0.5) return 'HEAVY';
        if (rawIntensity > 0.3) return 'MODERATE';
        return 'LIGHT';
    }
    
    /**
     * Convert intensity string to numeric value
     */
    intensityToValue(intensity) {
        switch (intensity) {
            case 'EXTREME': return 1.0;
            case 'HEAVY': return 0.7;
            case 'MODERATE': return 0.5;
            case 'LIGHT': return 0.3;
            default: return 0.3;
        }
    }
    
    /**
     * Animate weather movement and evolution
     */
    animateWeather(timeFactor) {
        // Move weather cells with wind
        const windSpeed = 20; // knots
        const windDirection = 270; // degrees (west)
        
        const windDX = Math.sin(windDirection * NAV.DEG_TO_RAD) * windSpeed * timeFactor / 3600;
        const windDY = Math.cos(windDirection * NAV.DEG_TO_RAD) * windSpeed * timeFactor / 3600;
        
        this.weatherCells.forEach(cell => {
            cell.x += windDX;
            cell.y += windDY;
            
            // Evolve intensity over time
            if (Math.random() < 0.01 * timeFactor) {
                const intensities = ['LIGHT', 'MODERATE', 'HEAVY', 'EXTREME'];
                const currentIndex = intensities.indexOf(cell.intensity);
                const change = Math.random() > 0.5 ? 1 : -1;
                const newIndex = Math.max(0, Math.min(intensities.length - 1, currentIndex + change));
                cell.intensity = intensities[newIndex];
            }
        });
        
        this.lastUpdate = Date.now();
    }
    
    /**
     * Set radar parameters
     */
    setRadarParameters(range, tilt, gain = 'NORMAL') {
        this.radarRange = range;
        this.radarTilt = tilt;
        // Gain would affect return sensitivity
    }
}

// Export singleton instances
export const terrainService = new TerrainService();
export const weatherRadarService = new WeatherRadarService();

// Export classes and instances for testing
export { TerrainService, WeatherRadarService }; // terrainService and weatherRadarService are already exported above as named exports

// Default export for convenience
export default {
    TerrainService,
    WeatherRadarService
    // terrainService and weatherRadarService are already exported as named exports above
};