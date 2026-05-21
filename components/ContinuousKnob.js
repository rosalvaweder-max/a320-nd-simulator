import React, { useState, useRef, useCallback, useEffect } from 'react';

/**
 * ContinuousKnob - A rotary knob for continuous values (frequency, course, etc.)
 * 
 * Real A320 style: physical rotary encoder with detents.
 * Supports mouse drag (vertical) and click-to-increment/decrement.
 * 
 * Props:
 *   value: number - Current value
 *   onChange: (newValue: number) => void - Called when value changes
 *   min: number - Minimum value
 *   max: number - Maximum value
 *   step: number - Step size per detent
 *   label: string - Label displayed below the knob
 *   displayValue: string - Formatted value to show (optional, defaults to value)
 *   size: number - Knob diameter in pixels (default: 64)
 *   color: string - Active color (default: '#22d3ee' cyan)
 */
const ContinuousKnob = ({ 
    value, 
    onChange, 
    min = 0, 
    max = 360, 
    step = 1, 
    label = '', 
    displayValue = null,
    size = 64,
    color = '#22d3ee'
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartY, setDragStartY] = useState(0);
    const [dragStartValue, setDragStartValue] = useState(0);
    const knobRef = useRef(null);

    // Calculate rotation angle based on value range
    // Knob rotates from -135° (min) to +135° (max) = 270° range
    const angleRange = 270;
    const valueRange = max - min;
    const valueRatio = valueRange > 0 ? (value - min) / valueRange : 0;
    const rotation = -135 + valueRatio * angleRange;

    // Handle mouse down to start drag
    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStartY(e.clientY);
        setDragStartValue(value);
    }, [value]);

    // Handle mouse move during drag
    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return;
        
        const deltaY = dragStartY - e.clientY; // Negative = drag down = decrease
        const deltaValue = deltaY * step; // Each pixel = one step
        
        // Calculate new value with wrapping for 0-360 ranges
        let newValue = dragStartValue + deltaValue;
        
        // Clamp to range
        newValue = Math.max(min, Math.min(max, newValue));
        
        // Round to nearest step
        newValue = Math.round(newValue / step) * step;
        
        onChange(newValue);
    }, [isDragging, dragStartY, dragStartValue, min, max, step, onChange]);

    // Handle mouse up to end drag
    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Handle click on left half = decrement, right half = increment
    const handleKnobClick = useCallback((e) => {
        if (isDragging) return;
        
        const rect = knobRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Determine if click is on left or right side
        const dx = x - centerX;
        const dy = y - centerY;
        
        // Top half: increment, Bottom half: decrement
        // (like a real rotary encoder - turn up = CW, turn down = CCW)
        if (dy < 0) {
            // Top half - increment
            let newValue = Math.round((value + step) / step) * step;
            if (newValue > max) newValue = min; // Wrap around
            onChange(newValue);
        } else {
            // Bottom half - decrement
            let newValue = Math.round((value - step) / step) * step;
            if (newValue < min) newValue = max; // Wrap around
            onChange(newValue);
        }
    }, [value, step, min, max, onChange, isDragging]);

    // Add/remove global mouse listeners
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    const display = displayValue !== null ? displayValue : value;
    const r = size / 2;

    return React.createElement('div', {
        className: 'flex flex-col items-center select-none'
    }, [
        // Knob container
        React.createElement('div', {
            key: 'knob-container',
            className: 'relative',
            style: { width: size, height: size }
        }, [
            // Outer bezel
            React.createElement('div', {
                key: 'outer-bezel',
                className: 'absolute inset-0 rounded-full border-2 border-gray-700 bg-[#dcdcdc] shadow-[1px_1px_3px_rgba(0,0,0,0.3),inset_0_0_8px_rgba(0,0,0,0.1)]'
            }),
            
            // Tick marks around the knob
            React.createElement('svg', {
                key: 'tick-marks',
                className: 'absolute inset-0 w-full h-full',
                viewBox: `0 0 ${size} ${size}`
            }, [
                // Major ticks every 30° of knob rotation (every ~22.5° of value range)
                Array.from({ length: 13 }, (_, i) => {
                    const tickAngle = (-135 + i * (270 / 12)) * Math.PI / 180;
                    const outerR = r - 4;
                    const innerR = r - 8;
                    const x1 = r + Math.cos(tickAngle) * innerR;
                    const y1 = r + Math.sin(tickAngle) * innerR;
                    const x2 = r + Math.cos(tickAngle) * outerR;
                    const y2 = r + Math.sin(tickAngle) * outerR;
                    return React.createElement('line', {
                        key: `tick-${i}`,
                        x1, y1, x2, y2,
                        stroke: '#666',
                        strokeWidth: i % 3 === 0 ? 1.5 : 0.8
                    });
                })
            ]),
            
            // Inner knob (rotating part)
            React.createElement('div', {
                key: 'inner-knob',
                ref: knobRef,
                onMouseDown: handleMouseDown,
                onClick: handleKnobClick,
                className: `
                    absolute rounded-full border border-gray-500 
                    flex items-center justify-center cursor-pointer
                    shadow-inner transition-shadow
                    ${isDragging ? 'shadow-lg' : 'shadow-sm'}
                    hover:shadow-md active:shadow-lg
                `,
                style: {
                    width: size - 16,
                    height: size - 16,
                    left: 8,
                    top: 8,
                    background: '#e8e8e8'
                }
            }, [
                // Pointer line (rotates with value)
                React.createElement('div', {
                    key: 'pointer',
                    className: 'absolute rounded-full',
                    style: {
                        width: 3,
                        height: (size - 16) / 2 - 4,
                        bottom: (size - 16) / 2 - 2,
                        background: color,
                        transformOrigin: 'bottom center',
                        transform: `rotate(${rotation}deg)`,
                        borderRadius: '2px 2px 0 0',
                        transition: isDragging ? 'none' : 'transform 0.1s ease'
                    }
                }),
                // Center dot
                React.createElement('div', {
                    key: 'center-dot',
                    className: 'absolute rounded-full bg-gray-500',
                    style: {
                        width: 6,
                        height: 6,
                        border: '1px solid #888'
                    }
                })
            ])
        ]),
        
        // Value display
        React.createElement('div', {
            key: 'value-display',
            className: 'font-mono text-xs font-bold text-black tracking-wider mt-1',
            style: { color: isDragging ? color : '#000' }
        }, String(display)),
        
        // Label
        label && React.createElement('div', {
            key: 'label',
            className: 'text-[8px] font-bold text-gray-700 mt-0.5'
        }, label)
    ]);
};

export default ContinuousKnob;
