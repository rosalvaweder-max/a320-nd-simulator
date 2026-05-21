/**
 * TCAS (Traffic Collision Avoidance System) Service
 * Professional-grade TCAS II simulation for A320 ND display
 * Implements resolution advisories, traffic advisories, and proximate traffic
 */

import { COLORS, NAV } from '../constants.js';

/**
 * TCAS Threat Levels
 */
export const TCAS_THREAT_LEVELS = {
    RA: 'RA',           // Resolution Advisory (highest threat)
    TA: 'TA',           // Traffic Advisory
    PROXIMATE: 'PROXIMATE', // Proximate traffic
    OTHER: 'OTHER'      // Other traffic
};

/**
 * TCAS Resolution Advisory Types
 */
export const RA_TYPES = {
    CLIMB: 'CLIMB',
    DESCEND: 'DESCEND',
    INCREASE_CLIMB: 'INCREASE_CLIMB',
    INCREASE_DESCEND: 'INCREASE_DESCEND',
    REDUCE_CLIMB: 'REDUCE_CLIMB',
    REDUCE_DESCEND: 'REDUCE_DESCEND',
    CROSSING_CLIMB: 'CROSSING_CLIMB',
    CROSSING_DESCEND: 'CROSSING_DESCEND',
    MAINTAIN_VERTICAL_SPEED: 'MAINTAIN_VERTICAL_SPEED',
    AVOID: 'AVOID'
};

/**
 * Aircraft types for TCAS display
 */
export const AIRCRAFT_TYPES = {
    HEAVY: 'HEAVY',     // B747, A380, etc.
    LARGE: 'LARGE',     // B737, A320, etc.
    SMALL: 'SMALL',     // CRJ, E-Jet, etc.
    HELICOPTER: 'HELICOPTER'
};

/**
 * TCAS Traffic Object
 */
class TCASTraffic {
    constructor(id, callsign, type = AIRCRAFT_TYPES.LARGE) {
        this.id = id;
        this.callsign = callsign;
        this.type = type;
        
        // Position and movement
        this.lat = 0;
        this.lon = 0;
        this.altitude = 0;
        this.heading = 0;
        this.speed = 0;
        this.verticalSpeed = 0;
        
        // Relative to ownship
        this.bearing = 0;
        this.distance = 0;
        this.relativeAlt = 0;
        
        // TCAS state
        this.threatLevel = TCAS_THREAT_LEVELS.OTHER;
        this.raType = null;
        this.raSense = null; // UP or DOWN
        this.timeToClosestApproach = Infinity;
        this.separation = Infinity;
        
        // Display properties
        this.lastUpdate = Date.now();
        this.isValid = true;
    }
    
    /**
     * Update traffic position and calculate threat
     */
    update(ownship, trafficData) {
        this.lat = trafficData.lat || this.lat;
        this.lon = trafficData.lon || this.lon;
        this.altitude = trafficData.altitude || this.altitude;
        this.heading = trafficData.heading || this.heading;
        this.speed = trafficData.speed || this.speed;
        this.verticalSpeed = trafficData.verticalSpeed || this.verticalSpeed;
        
        // Calculate relative position
        this.calculateRelativePosition(ownship);
        
        // Calculate threat level
        this.calculateThreatLevel(ownship);
        
        this.lastUpdate = Date.now();
    }
    
    /**
     * Calculate position relative to ownship
     */
    calculateRelativePosition(ownship) {
        // Simplified calculation (for demo purposes)
        // In real implementation, use great circle distance and bearing
        
        const dx = this.lon - ownship.lon;
        const dy = this.lat - ownship.lat;
        
        // Convert to nautical miles (approximate)
        const nmPerDegree = 60; // Approximation
        this.distance = Math.sqrt(dx * dx + dy * dy) * nmPerDegree;
        
        // Calculate bearing (0 = north, 90 = east)
        this.bearing = (Math.atan2(dx, dy) * NAV.RAD_TO_DEG + 360) % 360;
        
        // Relative altitude
        this.relativeAlt = this.altitude - ownship.altitude;
    }
    
    /**
     * Calculate TCAS threat level based on separation
     */
    calculateThreatLevel(ownship) {
        // TCAS II thresholds (simplified)
        const TA_THRESHOLD = 6; // NM for traffic advisory
        const RA_THRESHOLD = 3; // NM for resolution advisory
        const ALT_THRESHOLD_TA = 1200; // feet for TA
        const ALT_THRESHOLD_RA = 700; // feet for RA
        
        const horizontalSeparation = this.distance;
        const verticalSeparation = Math.abs(this.relativeAlt);
        
        // Calculate time to closest approach (simplified)
        const relativeSpeed = Math.abs(this.speed - ownship.speed);
        this.timeToClosestApproach = relativeSpeed > 0 ? horizontalSeparation / relativeSpeed : Infinity;
        
        // Determine threat level
        if (horizontalSeparation <= RA_THRESHOLD && verticalSeparation <= ALT_THRESHOLD_RA) {
            this.threatLevel = TCAS_THREAT_LEVELS.RA;
            this.determineRA(ownship);
        } else if (horizontalSeparation <= TA_THRESHOLD && verticalSeparation <= ALT_THRESHOLD_TA) {
            this.threatLevel = TCAS_THREAT_LEVELS.TA;
            this.raType = null;
        } else if (horizontalSeparation <= 12 && verticalSeparation <= 2400) {
            this.threatLevel = TCAS_THREAT_LEVELS.PROXIMATE;
            this.raType = null;
        } else {
            this.threatLevel = TCAS_THREAT_LEVELS.OTHER;
            this.raType = null;
        }
        
        this.separation = Math.sqrt(
            Math.pow(horizontalSeparation, 2) + 
            Math.pow(verticalSeparation / 6076.12, 2) // Convert feet to NM
        );
    }
    
    /**
     * Determine Resolution Advisory type
     */
    determineRA(ownship) {
        // Simplified RA logic
        const verticalClosure = this.relativeAlt / this.timeToClosestApproach; // feet per minute
        
        if (this.relativeAlt > 0) {
            // Traffic is above
            if (verticalClosure > 1000) {
                // Rapid closure from above
                this.raType = RA_TYPES.DESCEND;
                this.raSense = 'DOWN';
            } else if (verticalClosure > 500) {
                this.raType = RA_TYPES.INCREASE_DESCEND;
                this.raSense = 'DOWN';
            } else {
                this.raType = RA_TYPES.MAINTAIN_VERTICAL_SPEED;
            }
        } else {
            // Traffic is below
            if (verticalClosure < -1000) {
                // Rapid closure from below
                this.raType = RA_TYPES.CLIMB;
                this.raSense = 'UP';
            } else if (verticalClosure < -500) {
                this.raType = RA_TYPES.INCREASE_CLIMB;
                this.raSense = 'UP';
            } else {
                this.raType = RA_TYPES.MAINTAIN_VERTICAL_SPEED;
            }
        }
    }
    
    /**
     * Get display color based on threat level
     */
    getDisplayColor() {
        switch (this.threatLevel) {
            case TCAS_THREAT_LEVELS.RA:
                return COLORS.TCAS_RA;
            case TCAS_THREAT_LEVELS.TA:
                return COLORS.TCAS_TA;
            case TCAS_THREAT_LEVELS.PROXIMATE:
                return COLORS.TCAS_PROXIMATE;
            default:
                return COLORS.TEXT_GREY;
        }
    }
    
    /**
     * Get symbol size based on aircraft type
     */
    getSymbolSize() {
        switch (this.type) {
            case AIRCRAFT_TYPES.HEAVY:
                return 8;
            case AIRCRAFT_TYPES.LARGE:
                return 6;
            case AIRCRAFT_TYPES.SMALL:
                return 4;
            case AIRCRAFT_TYPES.HELICOPTER:
                return 3;
            default:
                return 5;
        }
    }
    
    /**
     * Check if traffic data is stale
     */
    isStale(timeout = 5000) {
        return Date.now() - this.lastUpdate > timeout;
    }
}

/**
 * Main TCAS Service
 */
class TCASService {
    constructor() {
        this.traffic = new Map();
        this.ownship = null;
        this.mode = 'TA/RA'; // TA/RA, TA ONLY, or OFF
        this.altitudeReporting = true;
        this.displayRange = 40; // NM
        this.lastRA = null;
        this.raActive = false;
        this.raAcknowledged = false;
        
        // Performance monitoring
        this.updateInterval = 1000; // ms
        this.updateTimer = null;
    }
    
    /**
     * Initialize TCAS with ownship data
     */
    initialize(ownshipData) {
        this.ownship = {
            lat: ownshipData.lat || 0,
            lon: ownshipData.lon || 0,
            altitude: ownshipData.altitude || 0,
            heading: ownshipData.heading || 0,
            speed: ownshipData.speed || 0,
            verticalSpeed: ownshipData.verticalSpeed || 0
        };
        
        this.startUpdates();
    }
    
    /**
     * Start periodic TCAS updates
     */
    startUpdates() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }
        
        this.updateTimer = setInterval(() => {
            this.updateAllTraffic();
            this.cleanupStaleTraffic();
        }, this.updateInterval);
    }
    
    /**
     * Stop TCAS updates
     */
    stopUpdates() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    }
    
    /**
     * Add or update traffic
     */
    updateTraffic(trafficData) {
        const id = trafficData.id || `traffic-${Date.now()}-${Math.random()}`;
        
        if (!this.traffic.has(id)) {
            const traffic = new TCASTraffic(
                id,
                trafficData.callsign || `N${Math.floor(Math.random() * 1000)}`,
                trafficData.type || AIRCRAFT_TYPES.LARGE
            );
            this.traffic.set(id, traffic);
        }
        
        const traffic = this.traffic.get(id);
        traffic.update(this.ownship, trafficData);
        
        // Check for RA activation
        if (traffic.threatLevel === TCAS_THREAT_LEVELS.RA) {
            this.activateRA(traffic);
        }
        
        return traffic;
    }
    
    /**
     * Update all traffic positions
     */
    updateAllTraffic() {
        if (!this.ownship) return;
        
        // In real implementation, this would get data from ADS-B or simulator
        // For demo, we'll simulate some movement
        this.traffic.forEach(traffic => {
            // Simulate movement
            const movement = {
                lat: traffic.lat + (Math.random() - 0.5) * 0.01,
                lon: traffic.lon + (Math.random() - 0.5) * 0.01,
                altitude: traffic.altitude + (traffic.verticalSpeed / 60), // feet per second
                heading: traffic.heading,
                speed: traffic.speed,
                verticalSpeed: traffic.verticalSpeed
            };
            
            traffic.update(this.ownship, movement);
        });
    }
    
    /**
     * Remove stale traffic
     */
    cleanupStaleTraffic() {
        const staleIds = [];
        
        this.traffic.forEach((traffic, id) => {
            if (traffic.isStale()) {
                staleIds.push(id);
            }
        });
        
        staleIds.forEach(id => {
            this.traffic.delete(id);
        });
    }
    
    /**
     * Activate Resolution Advisory
     */
    activateRA(traffic) {
        this.raActive = true;
        this.lastRA = {
            trafficId: traffic.id,
            callsign: traffic.callsign,
            raType: traffic.raType,
            raSense: traffic.raSense,
            relativeAlt: traffic.relativeAlt,
            distance: traffic.distance,
            time: Date.now()
        };
        
        this.raAcknowledged = false;
        
        // In real TCAS, this would trigger aural alerts
        console.log(`TCAS RA: ${traffic.raType} - Traffic: ${traffic.callsign}`);
    }
    
    /**
     * Acknowledge current RA
     */
    acknowledgeRA() {
        this.raAcknowledged = true;
        
        // RA remains active until conflict is resolved
        setTimeout(() => {
            if (this.raActive) {
                this.checkRAResolution();
            }
        }, 5000);
    }
    
    /**
     * Check if RA conflict is resolved
     */
    checkRAResolution() {
        if (!this.lastRA || !this.raActive) return;
        
        const traffic = this.traffic.get(this.lastRA.trafficId);
        if (!traffic || traffic.threatLevel !== TCAS_THREAT_LEVELS.RA) {
            this.raActive = false;
            this.lastRA = null;
            console.log('TCAS RA: Conflict resolved');
        }
    }
    
    /**
     * Get traffic for display within range
     */
    getDisplayTraffic() {
        const displayTraffic = [];
        
        this.traffic.forEach(traffic => {
            if (traffic.distance <= this.displayRange && traffic.isValid) {
                displayTraffic.push({
                    id: traffic.id,
                    callsign: traffic.callsign,
                    bearing: traffic.bearing,
                    distance: traffic.distance,
                    relativeAlt: traffic.relativeAlt,
                    verticalSpeed: traffic.verticalSpeed,
                    threatLevel: traffic.threatLevel,
                    type: traffic.type,
                    raType: traffic.raType,
                    color: traffic.getDisplayColor(),
                    size: traffic.getSymbolSize()
                });
            }
        });
        
        // Sort by threat level (RA first, then TA, then others)
        displayTraffic.sort((a, b) => {
            const threatOrder = {
                [TCAS_THREAT_LEVELS.RA]: 0,
                [TCAS_THREAT_LEVELS.TA]: 1,
                [TCAS_THREAT_LEVELS.PROXIMATE]: 2,
                [TCAS_THREAT_LEVELS.OTHER]: 3
            };
            
            return threatOrder[a.threatLevel] - threatOrder[b.threatLevel];
        });
        
        return displayTraffic;
    }
    
    /**
     * Get current RA information
     */
    getCurrentRA() {
        if (!this.raActive) return null;
        
        return {
            ...this.lastRA,
            acknowledged: this.raAcknowledged,
            active: this.raActive
        };
    }
    
    /**
     * Generate test traffic for demonstration
     */
    generateTestTraffic(count = 8) {
        const testCallsigns = [
            'BAW123', 'AFR456', 'UAL789', 'DLH234',
            'KLM567', 'SWA890', 'AAL123', 'JAL456'
        ];
        
        const testTypes = [
            AIRCRAFT_TYPES.HEAVY,
            AIRCRAFT_TYPES.LARGE,
            AIRCRAFT_TYPES.LARGE,
            AIRCRAFT_TYPES.SMALL,
            AIRCRAFT_TYPES.LARGE,
            AIRCRAFT_TYPES.SMALL,
            AIRCRAFT_TYPES.LARGE,
            AIRCRAFT_TYPES.HEAVY
        ];
        
        for (let i = 0; i < Math.min(count, testCallsigns.length); i++) {
            const bearing = (i * 45) % 360;
            const distance = 5 + (i * 3);
            const relativeAlt = (i % 3 - 1) * 1000; // -1000, 0, or 1000
            
            this.updateTraffic({
                id: `test-${i}`,
                callsign: testCallsigns[i],
                type: testTypes[i],
                lat: this.ownship.lat + Math.sin(bearing * NAV.DEG_TO_RAD) * distance / 60,
                lon: this.ownship.lon + Math.cos(bearing * NAV.DEG_TO_RAD) * distance / 60,
                altitude: this.ownship.altitude + relativeAlt,
                heading: (bearing + 180) % 360,
                speed: 450 + Math.random() * 100,
                verticalSpeed: (Math.random() - 0.5) * 2000
            });
        }
    }
    
    /**
     * Set TCAS mode
     */
    setMode(mode) {
        const validModes = ['TA/RA', 'TA ONLY', 'OFF'];
        if (validModes.includes(mode)) {
            this.mode = mode;
            
            if (mode === 'OFF') {
                this.stopUpdates();
            } else {
                this.startUpdates();
            }
        }
    }
    
    /**
     * Set display range
     */
    setDisplayRange(range) {
        this.displayRange = range;
    }
    
    /**
     * Get TCAS status
     */
    getStatus() {
        return {
            mode: this.mode,
            altitudeReporting: this.altitudeReporting,
            displayRange: this.displayRange,
            trafficCount: this.traffic.size,
            raActive: this.raActive,
            raAcknowledged: this.raAcknowledged
        };
    }
}

// Export singleton instance
export const tcasService = new TCASService();

// Export classes and constants for testing
export { TCASService, TCASTraffic }; // tcasService is already exported above as named export, TCAS_THREAT_LEVELS is already exported at line 12, RA_TYPES is already exported at line 22, AIRCRAFT_TYPES is already exported at line 38

// Default export for convenience
export default {
    TCASService,
    TCASTraffic
    // tcasService is already exported as named export above
    // TCAS_THREAT_LEVELS is already exported as named export at line 12
    // RA_TYPES is already exported as named export at line 22
    // AIRCRAFT_TYPES is already exported as named export at line 38
};

//