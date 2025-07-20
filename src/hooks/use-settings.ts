"use client"
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type SettingsContextType = {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  animationsEnabled: boolean;
  setAnimationsEnabled: (enabled:boolean) => void;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  useEffect(() => {
    // Here you could persist settings to localStorage if needed
  }, [soundEnabled, animationsEnabled]);


  return (
    <SettingsContext.Provider value={{ soundEnabled, setSoundEnabled, animationsEnabled, setAnimationsEnabled }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
