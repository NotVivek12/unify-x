import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ShipmentStatus } from '../types';

interface DemoModeContextProps {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  scenario: ShipmentStatus | 'OFFLINE';
  setScenario: (scenario: ShipmentStatus | 'OFFLINE') => void;
}

const DemoModeContext = createContext<DemoModeContextProps | undefined>(undefined);

export const DemoModeProvider = ({ children }: { children: ReactNode }) => {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [scenario, setScenario] = useState<ShipmentStatus | 'OFFLINE'>('GOOD');

  const toggleDemoMode = () => setIsDemoMode(!isDemoMode);

  return (
    <DemoModeContext.Provider value={{ isDemoMode, toggleDemoMode, scenario, setScenario }}>
      {children}
    </DemoModeContext.Provider>
  );
};

export const useDemoMode = () => {
  const context = useContext(DemoModeContext);
  if (context === undefined) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
};
