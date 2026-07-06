import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './context/AppContext.jsx';
import HomeDashboard from './components/home-dashboard/HomeDashboard.jsx';
import TechnicianScheduler from './components/home-dashboard/TechnicianScheduler.jsx';
import DevicesCompatibility from './components/home-dashboard/devices-compatibility/DevicesCompatibility.jsx';
import FuelSensorCalibrationScreen from './components/home-dashboard/fuel-sensor-calibration/FuelSensorCalibrationScreen.jsx';
import SimManagerScreen from './components/home-dashboard/sim-manager/SimManagerScreen.jsx';

function AppInner({ screen, setScreen }) {
  if (screen === 'home') {
    return (
      <HomeDashboard
        onEnterScheduler={() => setScreen('scheduler')}
        onEnterDevices={() => setScreen('devices')}
        onEnterFuelSensor={() => setScreen('fuelSensor')}
        onEnterSimManager={() => setScreen('simManager')}
      />
    );
  }
  if (screen === 'devices') {
    return <DevicesCompatibility onGoHome={() => setScreen('home')} />;
  }
  if (screen === 'fuelSensor') {
    return <FuelSensorCalibrationScreen onGoHome={() => setScreen('home')} />;
  }
  if (screen === 'simManager') {
    return <SimManagerScreen onGoHome={() => setScreen('home')} />;
  }
  return <TechnicianScheduler onGoHome={() => setScreen('home')} />;
}

export default function App() {
  const [screen, setScreen] = useState('home');

  return (
    <AppProvider>
      <AppInner screen={screen} setScreen={setScreen} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1B263B',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#1B263B' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#1B263B' } }
        }}
      />
    </AppProvider>
  );
}
