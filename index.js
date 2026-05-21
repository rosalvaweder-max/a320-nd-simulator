import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import { FlightPlanProvider } from './context/FlightPlanContext.js';
import { VORManagerProvider } from './context/VORManagerContext.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(React.StrictMode, null,
    React.createElement(FlightPlanProvider, null,
      React.createElement(VORManagerProvider, null,
        React.createElement(App)
      )
    )
  )
);