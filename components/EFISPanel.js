import React from 'react';
import SelectorKnob from './Knob.js';
import ContinuousKnob from './ContinuousKnob.js';

const EFISPanel = ({
  mode, range, systemState, setMode, setRange,
  toggleTerrain, toggleWeather, toggleChrono, toggleFailure,
  vorTuningState, onVorTuningModeChange, onVorFrequencyChange, onVorFrequencyStep,
  course, onCourseChange
}) => {

  // --- Components for Visual Elements ---

  // The Airbus Rectangular Button with "Three Lines" graphic
  const AirButton = ({ label, active, onClick, bottomLabel }) => React.createElement('div', {
    className: 'flex flex-col items-center'
  }, [
    React.createElement('button', {
        key: `button-${label}`,
        onClick: onClick,
        className: `
            relative w-14 h-10 border border-black shadow-[1px_1px_0px_rgba(255,255,255,0.2),inset_0_0_10px_rgba(0,0,0,0.1)] 
            flex flex-col items-center justify-center rounded-[2px] active:translate-y-0.5 active:shadow-none transition-all
            ${active ? 'bg-[#d1d5db]' : 'bg-[#e5e7eb]'}
        `,
        style: { backgroundColor: '#dcdcdc' } // Base plastic color
    }, [
        // The 3 lines graphic
        React.createElement('div', {
            key: `lines-${label}`,
            className: 'flex flex-col space-y-[2px] mb-1 opacity-60'
        }, [
            React.createElement('div', {
                key: `line-1-${label}`,
                className: 'w-6 h-[1px] bg-black'
            }),
            React.createElement('div', {
                key: `line-2-${label}`,
                className: 'w-6 h-[1px] bg-black'
            }),
            React.createElement('div', {
                key: `line-3-${label}`,
                className: 'w-6 h-[1px] bg-black'
            })
        ]),
        React.createElement('span', {
            key: `label-${label}`,
            className: 'text-[10px] font-bold text-black leading-none'
        }, label),
        
        // LED indicator (simulated green light when active)
        active && React.createElement('div', {
            key: `led-${label}`,
            className: 'absolute top-1 right-1 w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_4px_#22c55e]'
        })
    ]),
    bottomLabel && React.createElement('span', {
        key: `bottom-${label}`,
        className: 'text-[9px] font-bold text-gray-800 mt-1'
    }, 'OFF')
  ]);

  const ScrewHead = () => React.createElement('div', {
    className: 'w-3 h-3 rounded-full bg-[#888] border border-[#555] flex items-center justify-center shadow-inner'
  }, [
    React.createElement('div', {
        key: 'screw-line-1',
        className: 'w-2 h-[1px] bg-[#333] rotate-45'
    }),
    React.createElement('div', {
        key: 'screw-line-2',
        className: 'w-2 h-[1px] bg-[#333] -rotate-45 absolute'
    })
  ]);

  const ToggleSwitch = ({ labelLeft, labelRight }) => React.createElement('div', {
    className: 'flex flex-col items-center'
  }, [
    React.createElement('div', {
        key: 'toggle-labels',
        className: 'flex justify-between w-16 text-[9px] font-bold text-gray-900 mb-1'
    }, [
        React.createElement('span', {
            key: 'label-left',
        }, labelLeft),
        React.createElement('span', {
            key: 'label-right',
        }, labelRight)
    ]),
    // Switch Body
    React.createElement('div', {
        key: 'toggle-body',
        className: 'relative w-12 h-12 bg-[#222] rounded-full border-2 border-gray-600 shadow-md flex items-center justify-center'
    }, [
        // Toggle Lever (Static Middle for visual)
        React.createElement('div', {
            key: 'toggle-lever',
            className: 'w-2 h-8 bg-gray-300 rounded-sm shadow-md border border-gray-500'
        })
    ]),
    React.createElement('span', {
        key: 'toggle-off',
        className: 'text-[9px] font-bold text-gray-900 mt-1'
    }, 'OFF')
  ]);

  // --- Configuration for Knobs ---

  const modeOptions = [
      { label: 'ILS', value: 'LS', angle: -70 },
      { label: 'VOR', value: 'VOR', angle: -35 },
      { label: 'NAV', value: 'NAV', angle: 0 },
      { label: 'ARC', value: 'ARC', angle: 35 },
      { label: 'PLAN', value: 'PLAN', angle: 70 },
  ];

  const rangeOptions = [
      { label: '10', value: 10, angle: -75 },
      { label: '20', value: 20, angle: -45 },
      { label: '40', value: 40, angle: -15 },
      { label: '80', value: 80, angle: 15 },
      { label: '160', value: 160, angle: 45 },
      { label: '320', value: 320, angle: 75 },
  ];

  return React.createElement('div', {
    className: 'relative bg-[#aab2bb] p-4 rounded-xl shadow-2xl border-t border-l border-[#c4cbd3] border-b-4 border-r-4 border-b-[#7a8189] border-r-[#7a8189] w-full max-w-[520px]'
  }, [
    
    // Corner Screws
    React.createElement('div', {
      key: 'screw-top-left',
      className: 'absolute top-2 left-2'
    }, React.createElement(ScrewHead)),
    React.createElement('div', {
      key: 'screw-top-right',
      className: 'absolute top-2 right-2'
    }, React.createElement(ScrewHead)),
    React.createElement('div', {
      key: 'screw-bottom-left',
      className: 'absolute bottom-2 left-2'
    }, React.createElement(ScrewHead)),
    React.createElement('div', {
      key: 'screw-bottom-right',
      className: 'absolute bottom-2 right-2'
    }, React.createElement(ScrewHead)),

    React.createElement('div', {
      key: 'main-container',
      className: 'flex flex-row h-full'
    }, [
        
        // === LEFT SECTION: BARO ===
        React.createElement('div', {
          key: 'baro-section',
          className: 'flex flex-col items-center w-1/3 pr-2 border-r-2 border-black space-y-4 pt-4'
        }, [
            
            // LCD Display
            React.createElement('div', {
              key: 'baro-display',
              className: 'bg-[#b8c2b4] border-2 border-[#555] rounded px-2 py-1 flex flex-col items-center shadow-inner w-24'
            }, [
                React.createElement('span', {
                  key: 'baro-label',
                  className: 'text-[8px] text-black font-bold w-full text-left leading-none mb-1'
                }, 'BARO'),
                React.createElement('span', {
                  key: 'baro-value',
                  className: 'font-mono text-2xl text-black leading-none tracking-widest opacity-90'
                }, '1013')
            ]),

            // Unit Selector
            React.createElement('div', {
              key: 'unit-selector',
              className: 'w-full flex justify-between px-2 text-[10px] font-bold text-gray-800'
            }, [
                React.createElement('span', {
                  key: 'unit-inhg',
                }, 'IN HG'),
                React.createElement('span', {
                  key: 'unit-hpa',
                }, 'HPA')
            ]),
            
            // PULL STD Knob (Visual)
            React.createElement('div', {
              key: 'pull-std-knob',
              className: 'relative w-20 h-20 bg-[#dcdcdc] rounded-full border border-gray-400 shadow-[2px_2px_5px_rgba(0,0,0,0.3)] flex items-center justify-center'
            }, [
                 React.createElement('div', {
                   key: 'knob-text',
                   className: 'text-center leading-none'
                 }, [
                     React.createElement('div', {
                       key: 'knob-pull',
                       className: 'text-[10px] font-bold text-gray-600'
                     }, 'PULL'),
                     React.createElement('div', {
                       key: 'knob-std',
                       className: 'text-[12px] font-bold text-gray-800'
                     }, 'STD')
                 ]),
                 // Outer Ring
                 React.createElement('div', {
                   key: 'knob-ring',
                   className: 'absolute inset-0 rounded-full border-4 border-[#e5e7eb] shadow-inner'
                 })
            ]),

            // Bottom Buttons
            React.createElement('div', {
              key: 'bottom-buttons',
              className: 'flex space-x-2 mt-auto pb-2'
            }, [
                React.createElement('div', {
                  key: 'fd-button-container',
                  className: 'flex flex-col items-center'
                }, [
                  React.createElement('button', {
                    key: 'fd-button',
                    className: 'w-12 h-8 border border-black bg-[#dcdcdc] rounded shadow-sm flex flex-col items-center justify-center'
                  }, [
                      React.createElement('div', {
                        key: 'fd-line-1',
                        className: 'w-6 h-[1px] bg-black mb-[2px]'
                      }),
                      React.createElement('div', {
                        key: 'fd-line-2',
                        className: 'w-6 h-[1px] bg-black mb-[2px]'
                      }),
                      React.createElement('span', {
                        key: 'fd-text',
                        className: 'text-[10px] font-bold'
                      }, 'FD')
                  ])
                ]),
                React.createElement('div', {
                  key: 'ils-button-container',
                  className: 'flex flex-col items-center'
                }, [
                  React.createElement('button', {
                    key: 'ils-button',
                    className: 'w-12 h-8 border border-black bg-[#dcdcdc] rounded shadow-sm flex flex-col items-center justify-center'
                  }, [
                       React.createElement('div', {
                         key: 'ils-line-1',
                         className: 'w-6 h-[1px] bg-black mb-[2px]'
                       }),
                       React.createElement('div', {
                         key: 'ils-line-2',
                         className: 'w-6 h-[1px] bg-black mb-[2px]'
                       }),
                      React.createElement('span', {
                        key: 'ils-text',
                        className: 'text-[10px] font-bold'
                      }, 'ILS')
                  ])
                ])
            ])
        ]),

        // === RIGHT SECTION: ND CONTROLS ===
        React.createElement('div', {
          key: 'nd-controls',
          className: 'flex flex-col w-2/3 pl-4 pt-2'
        }, [
            
            // Top Row Buttons
            React.createElement('div', {
              key: 'top-buttons',
              className: 'flex justify-between items-start mb-6'
            }, [
                React.createElement(AirButton, {
                  key: 'cstr-button',
                  label: 'CSTR',
                  active: false,
                  onClick: () => {}
                }),
                React.createElement(AirButton, {
                  key: 'wpt-button',
                  label: 'WPT',
                  active: true,
                  onClick: () => {}
                }),
                React.createElement(AirButton, {
                  key: 'vor-button',
                  label: 'VOR.D',
                  active: false,
                  onClick: () => {}
                }),
                React.createElement(AirButton, {
                  key: 'ndb-button',
                  label: 'NDB',
                  active: false,
                  onClick: () => {}
                }),
                React.createElement(AirButton, {
                  key: 'arpt-button',
                  label: 'ARPT',
                  active: false,
                  onClick: () => {}
                })
            ]),

            // Knobs Row
            React.createElement('div', {
              key: 'knobs-row',
              className: 'flex justify-around items-center mb-6'
            }, [
                // Mode Knob
                React.createElement('div', {
                  key: 'mode-knob-container',
                  className: 'relative w-32 h-32'
                }, React.createElement(SelectorKnob, {
                    key: 'mode-knob',
                    options: modeOptions, 
                    value: mode, 
                    onChange: setMode, 
                })),

                // Range Knob
                React.createElement('div', {
                  key: 'range-knob-container',
                }, React.createElement(SelectorKnob, {
                    key: 'range-knob',
                    options: rangeOptions, 
                    value: range, 
                    onChange: setRange, 
                }))
            ]),

            // VOR Tuning Section (replaces bottom switches)
            React.createElement('div', {
              key: 'vor-tuning',
              className: 'flex flex-col items-center pb-2 space-y-2'
            }, [
                // Mode Toggle: AUTO / MANUAL
                React.createElement('div', {
                  key: 'vor-mode-row',
                  className: 'flex items-center justify-center space-x-2'
                }, [
                    React.createElement('button', {
                      key: 'vor-mode-auto',
                      onClick: () => onVorTuningModeChange('auto'),
                      className: `text-[9px] font-bold border border-black px-2 py-1 rounded shadow-sm ${
                        vorTuningState?.mode === 'auto' ? 'bg-green-300 text-black' : 'bg-gray-300 text-gray-700'
                      }`
                    }, 'AUTO'),
                    React.createElement('span', {
                      key: 'vor-mode-label',
                      className: 'text-[8px] font-bold text-gray-800'
                    }, 'VOR TUNE'),
                    React.createElement('button', {
                      key: 'vor-mode-manual',
                      onClick: () => onVorTuningModeChange('manual'),
                      className: `text-[9px] font-bold border border-black px-2 py-1 rounded shadow-sm ${
                        vorTuningState?.mode === 'manual' ? 'bg-green-300 text-black' : 'bg-gray-300 text-gray-700'
                      }`
                    }, 'MAN')
                ]),
                
                // Frequency Display & Controls (Manual Mode)
                React.createElement('div', {
                  key: 'vor-freq-row',
                  className: 'flex items-center justify-center space-x-3'
                }, [
                    // Frequency knob (only in manual mode)
                    vorTuningState?.mode === 'manual' && React.createElement(ContinuousKnob, {
                      key: 'vor-freq-knob',
                      value: parseFloat(vorTuningState?.manualFrequency || '114.10'),
                      onChange: (newVal) => onVorFrequencyChange(newVal.toFixed(2)),
                      min: 108.00,
                      max: 117.95,
                      step: 0.05,
                      label: 'MHz',
                      displayValue: vorTuningState?.manualFrequency || '114.10',
                      size: 56,
                      color: '#22d3ee'
                    }),
                    
                    // Auto-tuning indicator
                    vorTuningState?.mode === 'auto' && React.createElement('div', {
                      key: 'vor-auto-indicator',
                      className: 'flex flex-col items-center'
                    }, [
                        React.createElement('span', {
                          key: 'vor-auto-freq',
                          className: 'text-[8px] font-mono text-green-800 font-bold'
                        }, vorTuningState?.autoFrequency || '---'),
                        React.createElement('span', {
                          key: 'vor-auto-label',
                          className: 'text-[7px] text-gray-700'
                        }, 'AUTO')
                    ])
                ]),
                
                // CRS (Course) Selector - for VOR mode
                React.createElement('div', {
                  key: 'crs-selector',
                  className: 'flex items-center justify-center'
                }, [
                    React.createElement(ContinuousKnob, {
                      key: 'crs-knob',
                      value: course || 360,
                      onChange: (newVal) => onCourseChange(newVal - (course || 360)),
                      min: 0,
                      max: 360,
                      step: 1,
                      label: 'CRS',
                      displayValue: ((course || 360) % 360).toString().padStart(3, '0') + '°',
                      size: 56,
                      color: '#3b82f6'
                    })
                ]),
                
                // Control Buttons (Terr/WXR/Chrono/Fail) - smaller row
                React.createElement('div', {
                  key: 'control-buttons',
                  className: 'flex space-x-1 items-center'
                }, [
                    React.createElement('button', {
                      key: 'terr-button',
                      onClick: toggleTerrain,
                      className: `text-[8px] font-bold border border-black px-1 shadow-sm rounded ${systemState.showTerrain ? 'bg-green-300' : 'bg-gray-300'}`
                    }, 'TERR'),
                    
                    React.createElement('button', {
                      key: 'wxr-button',
                      onClick: toggleWeather,
                      className: `text-[8px] font-bold border border-black px-1 shadow-sm rounded ${systemState.showWeather ? 'bg-blue-300' : 'bg-gray-300'}`
                    }, 'WXR'),

                    React.createElement('button', {
                      key: 'chrono-button',
                      onClick: toggleChrono,
                      className: 'text-[8px] font-bold border border-black px-1 bg-gray-300 shadow-sm rounded'
                    }, 'CHRO'),
                    
                    React.createElement('button', {
                      key: 'fail-button',
                      onClick: toggleFailure,
                      className: 'text-[8px] font-bold text-red-800 border border-red-800 px-1 bg-red-100 shadow-sm rounded'
                    }, 'FAIL')
                ])
            ])

        ])

    ])
  ]);
};

export default EFISPanel;