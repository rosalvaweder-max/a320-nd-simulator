/**
 * Flight Simulator Integration Service
 * Connects to X-Plane, MSFS, or provides mock data for A320 ND simulation
 */

import { NAV } from '../constants.js';

/**
 * Simulator Types
 */
export const SIMULATOR_TYPES = {
    XPLANE: 'XPLANE',
    MSFS: 'MSFS',
    MOCK: 'MOCK',
    EXTERNAL_API: 'EXTERNAL_API'
};

/**
 * Data Update Rates (Hz)
 */
export const UPDATE_RATES = {
    HIGH: 30,   // 30Hz for critical flight data
    MEDIUM: 10, // 10Hz for navigation data
    LOW: 2      // 2Hz for weather/terrain
};

/**
 * Flight Data Structure
 */
export class FlightData {
    constructor() {
        // Position and Attitude
        this.latitude = 0;
        this.longitude = 0;
        this.altitude = 0;          // feet MSL
        this.heading = 0;           // degrees true
        this.pitch = 0;             // degrees
        this.bank = 0;              // degrees
        this.yaw = 0;               // degrees
        
        // Speed
        this.indicatedAirspeed = 0; // knots
        this.trueAirspeed = 0;      // knots
        this.groundSpeed = 0;       // knots
        this.mach = 0;              // Mach number
        this.verticalSpeed = 0;     // feet per minute
        
        // Navigation
        this.course = 0;            // degrees true
        this.track = 0;             // degrees true
        this.driftAngle = 0;        // degrees
        this.windDirection = 0;     // degrees true
        this.windSpeed = 0;         // knots
        
        // Systems
        this.autopilotEngaged = false;
        this.fdEngaged = false;
        this.autothrottleEngaged = false;
        this.flightPhase = 'CRUISE'; // TAKEOFF, CLIMB, CRUISE, DESCENT, APPROACH, LANDING
        
        // Time
        this.timestamp = Date.now();
        this.simTime = 0;
        this.zuluTime = 0;
        
        // Derived values for ND display
        this.x = 0; // NM from reference
        this.y = 0; // NM from reference
    }
    
    /**
     * Convert lat/lon to NM coordinates relative to reference point
     */
    calculateNMCoordinates(referenceLat, referenceLon) {
        // Great circle distance calculation
        const lat1 = referenceLat * NAV.DEG_TO_RAD;
        const lon1 = referenceLon * NAV.DEG_TO_RAD;
        const lat2 = this.latitude * NAV.DEG_TO_RAD;
        const lon2 = this.longitude * NAV.DEG_TO_RAD;
        
        const dLon = lon2 - lon1;
        const dLat = lat2 - lat1;
        
        // Haversine formula
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                 Math.cos(lat1) * Math.cos(lat2) *
                 Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = NAV.EARTH_RADIUS_NM * c;
        
        // Bearing
        const y = Math.sin(dLon) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) -
                 Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
        const bearing = Math.atan2(y, x) * NAV.RAD_TO_DEG;
        
        // Convert to Cartesian coordinates (NM)
        this.x = Math.sin(bearing * NAV.DEG_TO_RAD) * distance;
        this.y = Math.cos(bearing * NAV.DEG_TO_RAD) * distance;
        
        return { x: this.x, y: this.y, distance, bearing };
    }
    
    /**
     * Update from simulator data
     */
    updateFromSimulator(data) {
        Object.assign(this, data);
        this.timestamp = Date.now();
    }
    
    /**
     * Generate mock data for testing
     */
    generateMockData(referenceLat = 49.0097, referenceLon = 2.5479) {
        const time = Date.now() / 1000;
        
        // Simulate flight from Paris CDG
        this.latitude = referenceLat + Math.sin(time * 0.01) * 0.5;
        this.longitude = referenceLon + Math.cos(time * 0.01) * 0.5;
        this.altitude = 35000 + Math.sin(time * 0.1) * 1000;
        this.heading = (time * 2) % 360;
        this.pitch = Math.sin(time * 0.5) * 5;
        this.bank = Math.cos(time * 0.3) * 10;
        
        this.indicatedAirspeed = 280;
        this.trueAirspeed = 480;
        this.groundSpeed = 475;
        this.mach = 0.78;
        this.verticalSpeed = Math.sin(time * 0.2) * 500;
        
        this.course = this.heading;
        this.track = this.heading + Math.sin(time * 0.1) * 5;
        this.driftAngle = this.track - this.heading;
        this.windDirection = 270;
        this.windSpeed = 50;
        
        this.autopilotEngaged = true;
        this.fdEngaged = true;
        this.autothrottleEngaged = true;
        this.flightPhase = 'CRUISE';
        
        this.timestamp = Date.now();
        this.simTime = time;
        this.zuluTime = Math.floor(time) % 86400;
        
        // Calculate NM coordinates
        this.calculateNMCoordinates(referenceLat, referenceLon);
        
        return this;
    }
}

/**
 * X-Plane DataRef Integration
 */
class XPlaneIntegration {
    constructor() {
        this.connected = false;
        this.socket = null;
        this.dataRefs = new Map();
        this.updateRate = UPDATE_RATES.HIGH;
    }
    
    /**
     * Connect to X-Plane via UDP
     */
    async connect(host = '127.0.0.1', port = 49000) {
        try {
            // In a real implementation, this would use WebSockets or UDP
            console.log(`Connecting to X-Plane at ${host}:${port}`);
            
            // Simulate connection
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.connected = true;
            
            // Subscribe to data refs
            this.subscribeToDataRefs();
            
            return true;
        } catch (error) {
            console.error('Failed to connect to X-Plane:', error);
            return false;
        }
    }
    
    /**
     * Subscribe to required data refs
     */
    subscribeToDataRefs() {
        // Essential X-Plane data refs for ND display
        const essentialRefs = [
            'sim/flightmodel/position/latitude',
            'sim/flightmodel/position/longitude',
            'sim/flightmodel/position/elevation',
            'sim/flightmodel/position/true_psi',
            'sim/flightmodel/position/true_theta',
            'sim/flightmodel/position/true_phi',
            'sim/flightmodel/position/indicated_airspeed',
            'sim/flightmodel/position/true_airspeed',
            'sim/flightmodel/position/groundspeed',
            'sim/flightmodel/position/vh_ind',
            'sim/weather/wind_direction_degt',
            'sim/weather/wind_speed_kt'
        ];
        
        essentialRefs.forEach(ref => {
            this.dataRefs.set(ref, 0);
        });
    }
    
    /**
     * Get flight data from X-Plane
     */
    async getFlightData() {
        if (!this.connected) {
            throw new Error('Not connected to X-Plane');
        }
        
        // In real implementation, this would read from socket
        const flightData = new FlightData();
        
        // Simulate data from X-Plane
        flightData.latitude = 49.0097 + (Math.random() - 0.5) * 0.01;
        flightData.longitude = 2.5479 + (Math.random() - 0.5) * 0.01;
        flightData.altitude = 35000 + (Math.random() - 0.5) * 100;
        flightData.heading = (Date.now() / 100) % 360;
        flightData.indicatedAirspeed = 280 + (Math.random() - 0.5) * 10;
        flightData.groundSpeed = 475 + (Math.random() - 0.5) * 20;
        flightData.verticalSpeed = (Math.random() - 0.5) * 500;
        flightData.windDirection = 270;
        flightData.windSpeed = 50;
        
        flightData.calculateNMCoordinates(49.0097, 2.5479);
        
        return flightData;
    }
    
    /**
     * Disconnect from X-Plane
     */
    disconnect() {
        this.connected = false;
        if (this.socket) {
            // Close socket in real implementation
            this.socket = null;
        }
    }
}

/**
 * Microsoft Flight Simulator Integration
 */
class MSFSIntegration {
    constructor() {
        this.connected = false;
        this.simConnect = null;
        this.updateRate = UPDATE_RATES.HIGH;
    }
    
    /**
     * Connect to MSFS via SimConnect
     */
    async connect() {
        try {
            // In a real implementation, this would use SimConnect JS
            console.log('Connecting to MSFS via SimConnect');
            
            // Simulate connection
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.connected = true;
            
            return true;
        } catch (error) {
            console.error('Failed to connect to MSFS:', error);
            return false;
        }
    }
    
    /**
     * Get flight data from MSFS
     */
    async getFlightData() {
        if (!this.connected) {
            throw new Error('Not connected to MSFS');
        }
        
        const flightData = new FlightData();
        
        // Simulate data from MSFS
        const time = Date.now() / 1000;
        flightData.latitude = 49.0097 + Math.sin(time * 0.005) * 0.5;
        flightData.longitude = 2.5479 + Math.cos(time * 0.005) * 0.5;
        flightData.altitude = 35000 + Math.sin(time * 0.05) * 500;
        flightData.heading = (time * 1.5) % 360;
        flightData.indicatedAirspeed = 280;
        flightData.groundSpeed = 475;
        flightData.verticalSpeed = Math.sin(time * 0.2) * 800;
        flightData.windDirection = 270;
        flightData.windSpeed = 45 + Math.sin(time * 0.1) * 10;
        
        flightData.calculateNMCoordinates(49.0097, 2.5479);
        
        return flightData;
    }
    
    disconnect() {
        this.connected = false;
    }
}

/**
 * External API Integration (for web-based simulators)
 */
class ExternalAPIIntegration {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
        this.connected = false;
        this.updateRate = UPDATE_RATES.MEDIUM;
    }
    
    async connect() {
        try {
            // Test connection
            const response = await fetch(`${this.apiUrl}/status`);
            if (response.ok) {
                this.connected = true;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to connect to external API:', error);
            return false;
        }
    }
    
    async getFlightData() {
        if (!this.connected) {
            throw new Error('Not connected to external API');
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/flightdata`);
            const data = await response.json();
            
            const flightData = new FlightData();
            flightData.updateFromSimulator(data);
            
            // Calculate NM coordinates if lat/lon provided
            if (data.latitude && data.longitude) {
                flightData.calculateNMCoordinates(data.latitude, data.longitude);
            }
            
            return flightData;
        } catch (error) {
            console.error('Failed to get flight data:', error);
            throw error;
        }
    }
    
    disconnect() {
        this.connected = false;
    }
}

/**
 * Main Simulator Integration Service
 */
class SimulatorIntegrationService {
    constructor() {
        this.simulatorType = SIMULATOR_TYPES.MOCK;
        this.integration = null;
        this.flightData = new FlightData();
        this.updateInterval = null;
        this.updateRate = UPDATE_RATES.MEDIUM;
        this.listeners = new Set();
        this.referenceLat = 49.0097; // Paris CDG
        this.referenceLon = 2.5479;
    }
    
    /**
     * Initialize simulator connection
     */
    async initialize(simulatorType = SIMULATOR_TYPES.MOCK, options = {}) {
        this.simulatorType = simulatorType;
        
        switch (simulatorType) {
            case SIMULATOR_TYPES.XPLANE:
                this.integration = new XPlaneIntegration();
                this.updateRate = UPDATE_RATES.HIGH;
                break;
                
            case SIMULATOR_TYPES.MSFS:
                this.integration = new MSFSIntegration();
                this.updateRate = UPDATE_RATES.HIGH;
                break;
                
            case SIMULATOR_TYPES.EXTERNAL_API:
                this.integration = new ExternalAPIIntegration(options.apiUrl);
                this.updateRate = UPDATE_RATES.MEDIUM;
                break;
                
            case SIMULATOR_TYPES.MOCK:
            default:
                this.integration = null;
                this.updateRate = UPDATE_RATES.MEDIUM;
                break;
        }
        
        if (this.integration) {
            const connected = await this.integration.connect();
            if (!connected) {
                console.warn('Failed to connect to simulator, falling back to mock data');
                this.simulatorType = SIMULATOR_TYPES.MOCK;
            }
        }
        
        // Start data updates
        this.startUpdates();
        
        return this.simulatorType;
    }
    
    /**
     * Start periodic data updates
     */
    startUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        const interval = 1000 / this.updateRate;
        this.updateInterval = setInterval(() => {
            this.updateFlightData();
        }, interval);
    }
    
    /**
     * Update flight data from simulator
     */
    async updateFlightData() {
        try {
            let newData;
            
            if (this.simulatorType === SIMULATOR_TYPES.MOCK || !this.integration) {
                // Generate mock data
                newData = this.flightData.generateMockData(this.referenceLat, this.referenceLon);
            } else {
                // Get data from simulator
                newData = await this.integration.getFlightData();
            }
            
            // Update flight data
            this.flightData = newData;
            
            // Notify listeners
            this.notifyListeners(newData);
            
        } catch (error) {
            console.error('Failed to update flight data:', error);
            
            // Fall back to mock data
            this.flightData.generateMockData(this.referenceLat, this.referenceLon);
            this.notifyListeners(this.flightData);
        }
    }
    
    /**
     * Get current flight data
     */
    getFlightData() {
        return this.flightData;
    }
    
    /**
     * Get data formatted for ND display
     */
    getNDDisplayData() {
        const data = this.flightData;
        
        return {
            // Position
            x: data.x,
            y: data.y,
            
            // Attitude
            heading: data.heading,
            pitch: data.pitch,
            bank: data.bank,
            
            // Speed and altitude
            altitude: data.altitude,
            speed: data.groundSpeed,
            verticalSpeed: data.verticalSpeed,
            
            // Navigation
            track: data.track,
            windDirection: data.windDirection,
            windSpeed: data.windSpeed,
            
            // Systems
            autopilotEngaged: data.autopilotEngaged,
            flightPhase: data.flightPhase,
            
            // Timestamp
            timestamp: data.timestamp
        };
    }
    
    /**
     * Add data update listener
     */
    addListener(listener) {
        this.listeners.add(listener);
    }
    
    /**
     * Remove data update listener
     */
    removeListener(listener) {
        this.listeners.delete(listener);
    }
    
    /**
     * Notify all listeners of data update
     */
    notifyListeners(data) {
        this.listeners.forEach(listener => {
            try {
                listener(data);
            } catch (error) {
                console.error('Error in data listener:', error);
            }
        });
    }
    
    /**
     * Set reference point for NM coordinates
     */
    setReferencePoint(lat, lon) {
        this.referenceLat = lat;
        this.referenceLon = lon;
    }
    
    /**
     * Get service status
     */
    getStatus() {
        return {
            simulatorType: this.simulatorType,
            connected: this.simulatorType !== SIMULATOR_TYPES.MOCK && 
                      this.integration?.connected !== false,
            updateRate: this.updateRate,
            lastUpdate: this.flightData.timestamp,
            dataAge: Date.now() - this.flightData.timestamp
        };
    }
    
    /**
     * Stop updates and clean up
     */
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        if (this.integration) {
            this.integration.disconnect();
            this.integration = null;
        }
        
        this.listeners.clear();
    }
}

// Export singleton instance
export const simulatorService = new SimulatorIntegrationService();

// Export classes and constants for testing
export {
    SimulatorIntegrationService,
    XPlaneIntegration,
    MSFSIntegration,
    ExternalAPIIntegration
    // simulatorService is already exported above as named export
    // FlightData is already exported as class at line 30
    // SIMULATOR_TYPES is already exported at line 11-14
    // UPDATE_RATES is already exported at line 21-25
};

// Default export for convenience
export default {
    SimulatorIntegrationService
    // simulatorService is already exported as named export above
    // FlightData is already exported as named export at line 30
    // SIMULATOR_TYPES is already exported as named export
    // UPDATE_RATES is already exported as named export
};