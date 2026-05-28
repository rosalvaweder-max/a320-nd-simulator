import React, { useState, useRef, useCallback, useEffect } from 'react';

/**
 * ContinuousKnob - 连续值旋钮（频率、航道等）
 *
 * 真实 A320 风格：带定位感的物理旋转编码器
 * 支持鼠标拖拽（垂直）和点击增减
 *
 * 属性：
 *   value: number - 当前值
 *   onChange: (newValue: number) => void - 值变化时回调
 *   min: number - 最小值
 *   max: number - 最大值
 *   step: number - 每档步长
 *   label: string - 旋钮下方显示的标签
 *   displayValue: string - 格式化显示值（可选，默认为 value）
 *   size: number - 旋钮直径（像素，默认 64）
 *   color: string - 激活颜色（默认 '#22d3ee' 青色）
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

    // 根据值范围计算旋转角度
    // 旋钮从 -135°（最小值）旋转到 +135°（最大值）= 270° 范围
    const angleRange = 270;
    const valueRange = max - min;
    const valueRatio = valueRange > 0 ? (value - min) / valueRange : 0;
    const rotation = -135 + valueRatio * angleRange;

    // 鼠标按下开始拖拽
    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStartY(e.clientY);
        setDragStartValue(value);
    }, [value]);

    // 鼠标拖拽移动处理
    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return;
        
        const deltaY = dragStartY - e.clientY; // 负值 = 向下拖拽 = 减小
        const deltaValue = deltaY * step; // Each pixel = one step
        
        // 计算新值（0-360 范围支持环绕）
        let newValue = dragStartValue + deltaValue;
        
        // 限制在范围内
        newValue = Math.max(min, Math.min(max, newValue));
        
        // 四舍五入到最近的步长
        newValue = Math.round(newValue / step) * step;
        
        onChange(newValue);
    }, [isDragging, dragStartY, dragStartValue, min, max, step, onChange]);

    // 鼠标松开结束拖拽
    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // 点击旋钮：上半部分=增加，下半部分=减小
    const handleKnobClick = useCallback((e) => {
        if (isDragging) return;
        
        const rect = knobRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // 判断点击在左半还是右半
        const dx = x - centerX;
        const dy = y - centerY;
        
        // 上半部分：增加，下半部分：减小
        // （类似真实旋转编码器 - 向上转=顺时针，向下转=逆时针）
        if (dy < 0) {
            // 上半部分 - 增加
            let newValue = Math.round((value + step) / step) * step;
            if (newValue > max) newValue = min; // 环绕
            onChange(newValue);
        } else {
            // 下半部分 - 减小
            let newValue = Math.round((value - step) / step) * step;
            if (newValue < min) newValue = max; // 环绕
            onChange(newValue);
        }
    }, [value, step, min, max, onChange, isDragging]);

    // 在容器上添加原生滚轮监听（React onWheel 是被动的，preventDefault 无效）
    const containerRef = useRef(null);
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const handler = (e) => {
            e.preventDefault();
            const delta = e.deltaY < 0 ? step : -step;
            let newValue = Math.round((value + delta) / step) * step;
            if (max - min === 360) {
                newValue = ((newValue - min) % (max - min) + (max - min)) % (max - min) + min;
            } else {
                if (newValue > max) newValue = max;
                if (newValue < min) newValue = min;
            }
            onChange(newValue);
        };
        el.addEventListener('wheel', handler, { passive: false });
        return () => el.removeEventListener('wheel', handler);
    }, [value, step, min, max, onChange]);

    // 添加/移除全局鼠标监听器
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
        ref: containerRef,
        className: 'flex flex-col items-center select-none',
        style: { position: 'relative' }
    }, [
        // 旋钮容器
        React.createElement('div', {
            key: 'knob-container',
            className: 'relative',
            style: { width: size, height: size }
        }, [
            // 外圈边框
            React.createElement('div', {
                key: 'outer-bezel',
                className: 'absolute inset-0 rounded-full border-2 border-gray-700 bg-[#dcdcdc] shadow-[1px_1px_3px_rgba(0,0,0,0.3),inset_0_0_8px_rgba(0,0,0,0.1)]'
            }),
            
            // 旋钮周围的刻度线
            React.createElement('svg', {
                key: 'tick-marks',
                className: 'absolute inset-0 w-full h-full',
                viewBox: `0 0 ${size} ${size}`
            }, [
                // 每 30° 旋钮旋转一个主刻度（约每 22.5° 值范围）
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
            
            // 内圈旋钮（旋转部分）
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
                // 指针线（随值旋转）
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
                // 中心圆点
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
        
        // 数值显示
        React.createElement('div', {
            key: 'value-display',
            className: 'font-mono text-xs font-bold text-black tracking-wider mt-1',
            style: { color: isDragging ? color : '#000' }
        }, String(display)),
        
        // 标签
        label && React.createElement('div', {
            key: 'label',
            className: 'text-[8px] font-bold text-gray-700 mt-0.5'
        }, label)
    ]);
};

export default ContinuousKnob;
