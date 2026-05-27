const fs = require('fs');
const path = '_docs/附录C-核心代码清单.md';

const appendix = `

  const clearMapData = () => {
    setMapData(null);
    setMapError(null);
  };

  // 从地图数据创建航路
  const createRouteFromMap = (routeName, waypointIds) => {
    if (!mapData) throw new Error('没有加载地图数据');
    const waypoints = waypointIds.map(id => {
      const wp = mapData.waypoints.find(w => w.id === id);
      if (!wp) throw new Error('找不到航路点: ' + id);
      return { ...wp, status: 'direct' };
    });
    const newRoute = {
      id: 'route-' + Date.now(),
      name: routeName || '从地图创建的航路',
      waypoints,
      isActive: false,
      isSecondary: false
    };
    setRoutes([...routes, newRoute]);
    return newRoute.id;
  };

  // 暴露给消费者的Context值
  const value = {
    routes, activeRoute, secondaryRoute,
    mapData, mapLoading, mapError,
    addRoute, updateRoute, deleteRoute,
    activateRoute, setAsSecondary,
    addWaypoint, updateWaypoint, deleteWaypoint,
    reorderWaypoints, toggleWaypointConnection,
    loadMapFromUrl, loadMapFromFile, clearMapData, createRouteFromMap
  };

  // 渲染Provider
  return React.createElement(FlightPlanContext.Provider, { value }, children);
};
\`

---

### C.7 EFIS控制面板

**文件**：\`components/EFISPanel.js\`（第5-452行）

**说明**：EFIS控制面板组件，模拟真实A320 EFIS控制面板的外观和交互逻辑。包含模式选择旋钮、量程调节旋钮、航道设定、VOR调谐、地形/天气/交通开关等功能。

\`\`\`javascript
import React from 'react';
import SelectorKnob from './Knob.js';          // 离散值选择旋钮组件
import ContinuousKnob from './ContinuousKnob.js'; // 连续值调节旋钮组件

// EFIS控制面板组件
const EFISPanel = ({
  mode, range, systemState, setMode, setRange,
  toggleTerrain, toggleWeather, toggleChrono, toggleFailure,
  vorTuningState, onVorTuningModeChange, onVorFrequencyChange, onVorFrequencyStep,
  course, onCourseChange
}) => {

  // 空客风格矩形按钮（带三条横线图标）
  const AirButton = ({ label, active, onClick, bottomLabel }) =>
    React.createElement('div', {
      className: 'flex flex-col items-center cursor-pointer'
    }, [
      React.createElement('button', {
        onClick,
        // 激活状态显示绿色背景，否则显示灰色背景
        className: 'w-10 h-10 rounded border-2 flex items-center justify-center ' +
          (active ? 'bg-[#4a5a3a] border-[#8faa7a]' : 'bg-[#8a8f95] border-[#5a5f65]')
      }, [
        React.createElement('div', { className: 'flex flex-col items-center space-y-1' }, [
          React.createElement('div', { className: 'w-6 h-0.5 bg-black' }),
          React.createElement('div', { className: 'w-6 h-0.5 bg-black' }),
          React.createElement('div', { className: 'w-6 h-0.5 bg-black' })
        ])
      ]),
      React.createElement('span', {
        className: 'text-[8px] text-black font-bold mt-0.5'
      }, label),
      bottomLabel && React.createElement('span', {
        className: 'text-[7px] text-black mt-0.5'
      }, bottomLabel)
    ]);

  // 装饰螺丝（四角固定螺丝视觉效果）
  const ScrewHead = () => React.createElement('div', {
    className: 'w-4 h-4 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 border border-gray-700 shadow-inner flex items-center justify-center'
  }, [
    React.createElement('div', {
      className: 'w-3 h-0.5 bg-gray-700 transform rotate-45'
    }),
    React.createElement('div', {
      className: 'w-3 h-0.5 bg-gray-700 transform -rotate-45 absolute'
    })
  ]);

  // 模式选择选项（ILS/VOR/NAV/ARC/PLAN）
  const modeOptions = [
    { label: 'ILS', value: 'LS', angle: -70 },
    { label: 'VOR', value: 'VOR', angle: -35 },
    { label: 'NAV', value: 'NAV', angle: 0 },
    { label: 'ARC', value: 'ARC', angle: 35 },
    { label: 'PLAN', value: 'PLAN', angle: 70 },
  ];

  // 量程选择选项（10/20/40/80/160/320 NM）
  const rangeOptions = [
    { label: '10', value: 10, angle: -75 },
    { label: '20', value: 20, angle: -45 },
    { label: '40', value: 40, angle: -15 },
    { label: '80', value: 80, angle: 15 },
    { label: '160', value: 160, angle: 45 },
    { label: '320', value: 320, angle: 75 },
  ];

  // 渲染面板
  return React.createElement('div', {
    className: 'relative bg-[#aab2bb] p-4 rounded-xl shadow-2xl border-t border-l border-[#c4cbd3] border-b-4 border-r-4 border-b-[#7a8189] border-r-[#7a8189] w-full max-w-[520px]'
  }, [
    // 四角装饰螺丝
    React.createElement('div', { key: 'screw-tl',
      className: 'absolute top-2 left-2' }, React.createElement(ScrewHead)),
    React.createElement('div', { key: 'screw-tr',
      className: 'absolute top-2 right-2' }, React.createElement(ScrewHead)),
    React.createElement('div', { key: 'screw-bl',
      className: 'absolute bottom-2 left-2' }, React.createElement(ScrewHead)),
    React.createElement('div', { key: 'screw-br',
      className: 'absolute bottom-2 right-2' }, React.createElement(ScrewHead)),

    // 主容器：左右两栏布局
    React.createElement('div', {
      key: 'main-container',
      className: 'flex flex-row h-full'
    }, [
      // 左栏：BARO气压设置区
      React.createElement('div', {
        key: 'baro-section',
        className: 'flex flex-col items-center w-1/3 pr-2 border-r-2 border-black space-y-4 pt-4'
      }, [
        // BARO液晶显示屏
        React.createElement('div', {
          key: 'baro-display',
          className: 'bg-[#b8c2b4] border-2 border-[#555] rounded px-2 py-1 flex flex-col items-center shadow-inner w-24'
        }, [
          React.createElement('span', { key: 'baro-label',
            className: 'text-[8px] text-black font-bold w-full text-left leading-none mb-1'
          }, 'BARO'),
          React.createElement('span', { key: 'baro-value',
            className: 'text-lg text-black font-bold font-mono'
          }, '29.92'),
          React.createElement('span', { key: 'baro-unit',
            className: 'text-[8px] text-black w-full text-right leading-none'
          }, 'IN')
        ]),
        // BARO调节旋钮
        React.createElement(ContinuousKnob, {
          key: 'baro-knob',
          label: 'BARO',
          size: 60,
          min: 28.0,
          max: 31.0,
          step: 0.01,
          value: 29.92
        })
      ]),

      // 中栏：模式选择和量程选择
      React.createElement('div', {
        key: 'center-section',
        className: 'flex flex-col items-center w-1/3 px-2 space-y-4 pt-4'
      }, [
        // MODE模式选择旋钮
        React.createElement(SelectorKnob, {
          key: 'mode-knob',
          options: modeOptions,
          value: mode,
          onChange: setMode,
          label: 'MODE',
          size: 80
        }),
        // RANGE量程选择旋钮
        React.createElement(SelectorKnob, {
          key: 'range-knob',
          options: rangeOptions,
          value: range,
          onChange: setRange,
          label: 'RANGE',
          size: 80
        })
      ]),

      // 右栏：功能按钮区
      React.createElement('div', {
        key: 'right-section',
        className: 'flex flex-col items-center w-1/3 pl-2 border-l-2 border-black space-y-4 pt-4'
      }, [
        // 地形/天气/交通/故障等开关按钮
        React.createElement(AirButton, {
          key: 'terrain-btn',
          label: 'TERR',
          active: systemState.showTerrain,
          onClick: toggleTerrain
        }),
        React.createElement(AirButton, {
          key: 'weather-btn',
          label: 'WX',
          active: systemState.showWeather,
          onClick: toggleWeather
        }),
        React.createElement(AirButton, {
          key: 'traffic-btn',
          label: 'TFC',
          active: systemState.showTraffic,
          onClick: () => {}
        }),
        // VOR调谐模式切换（自动/手动）
        React.createElement('div', {
          key: 'vor-tuning',
          className: 'flex items-center space-x-1'
        }, [
          React.createElement('button', {
            key: 'vor-auto',
            onClick: () => onVorTuningModeChange('auto'),
            className: 'text-[10px] px-1 py-0.5 rounded ' +
              (vorTuningState?.mode === 'auto' ? 'bg-[#4a5a3a] text-white' : 'bg-gray-500 text-black')
          }, 'AUTO'),
          React.createElement('button', {
            key: 'vor-manual',
            onClick: () => onVorTuningModeChange('manual'),
            className: 'text-[10px] px-1 py-0.5 rounded ' +
              (vorTuningState?.mode === 'manual' ? 'bg-[#4a5a3a] text-white' : 'bg-gray-500 text-black')
          }, 'MAN')
        ]),
        // 故障模拟按钮
        React.createElement(AirButton, {
          key: 'failure-btn',
          label: 'FAIL',
          active: systemState.isFailureSimulated,
          onClick: toggleFailure,
          bottomLabel: 'IDX'
        })
      ])
    ])
  ]);
};
\`\`
`;

fs.appendFileSync(path, appendix, 'utf8');
console.log('C.7 appended successfully');
console.log('File size:', fs.statSync(path).size);
