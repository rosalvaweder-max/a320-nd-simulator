import React from 'react';

const SelectorKnob = ({ options, value, onChange }) => {
    // Find the current option to get its angle
    const currentOption = options.find(opt => opt.value === value);
    const rotation = currentOption ? currentOption.angle : 0;

    // Handle click on an option
    const handleOptionClick = (opt) => {
        onChange(opt.value);
    };

    return React.createElement('div', {
        className: 'relative w-32 h-32 flex items-center justify-center'
    }, [
        // Outer Bezel
        React.createElement('div', {
            key: 'outer-bezel',
            className: 'absolute inset-0 rounded-full border-4 border-gray-800 bg-[#dcdcdc] shadow-[2px_2px_5px_rgba(0,0,0,0.3),inset_0_0_10px_rgba(0,0,0,0.1)]'
        }),
        
        // Options around the knob
        options.map((option) => {
            // Calculate position for each option
            const angleRad = (option.angle * Math.PI) / 180;
            const radius = 45; // Distance from center
            const x = Math.sin(angleRad) * radius;
            const y = -Math.cos(angleRad) * radius;

            return React.createElement('button', {
                key: option.value,
                onClick: () => handleOptionClick(option),
                className: `
                    absolute w-9 h-9 flex items-center justify-center rounded-full
                    shadow-sm
                    ${value === option.value
                        ? 'bg-cyan-500/80 text-white shadow-md transform scale-110'
                        : 'text-gray-800 hover:bg-gray-300/50 transition-all'
                    }
                `,
                style: {
                    left: `calc(50% + ${x}px - 18px)`,
                    top: `calc(50% + ${y}px - 18px)`,
                    background: value === option.value ? undefined : 'transparent'
                }
            }, React.createElement('span', {
                key: `option-label-${option.value}`,
                className: 'text-[10px] font-bold'
            }, option.label));
        }),
        
        // Center Screw
        React.createElement('div', {
            key: 'center-screw',
            className: 'relative w-12 h-12 bg-gray-400 rounded-full border-2 border-gray-600 flex items-center justify-center shadow-inner'
        }, [
            React.createElement('div', {
                key: 'screw-inner',
                className: 'w-8 h-8 bg-gray-300 rounded-full border border-gray-500 flex items-center justify-center'
            }, [
                React.createElement('div', {
                    key: 'screw-center',
                    className: 'w-4 h-4 bg-gray-500 rounded-full border border-gray-600'
                })
            ]),
            
            // Pointer
            React.createElement('div', {
                key: 'pointer',
                className: 'absolute w-2 h-16 bg-red-600 rounded-full origin-bottom transform -translate-y-1/2',
                style: { transform: `translateY(-50%) rotate(${rotation}deg)` }
            })
        ])
    ]);
};

export default SelectorKnob;