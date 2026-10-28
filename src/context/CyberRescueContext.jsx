/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'cybershield_simple_rescue_progress';

/**
 * CyberRescueContext
 * 
 * React Context for managing and sharing cybercrime recovery checklist progress
 * across CyberRescue components without prop drilling.
 */
export const CyberRescueContext = createContext(null);

export function CyberRescueProvider({ children }) {
  // Simple checklist progress saved in localStorage: { [scenarioId]: [stepIndex, ...] }
  const [completedSteps, setCompletedSteps] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Sync checklist progress with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completedSteps));
    } catch {
      // Ignore storage quota/security errors
    }
  }, [completedSteps]);

  // Toggle step completion for a given scenario
  const toggleStep = (scenarioId, stepIndex) => {
    setCompletedSteps((prev) => {
      const list = prev[scenarioId] ? [...prev[scenarioId]] : [];
      const idx = list.indexOf(stepIndex);
      if (idx > -1) {
        list.splice(idx, 1);
      } else {
        list.push(stepIndex);
      }
      return { ...prev, [scenarioId]: list };
    });
  };

  // Reset checklist progress for a given scenario
  const resetProgress = (scenarioId) => {
    setCompletedSteps((prev) => {
      const updated = { ...prev };
      delete updated[scenarioId];
      return updated;
    });
  };

  return (
    <CyberRescueContext.Provider
      value={{
        completedSteps,
        setCompletedSteps,
        toggleStep,
        resetProgress,
      }}
    >
      {children}
    </CyberRescueContext.Provider>
  );
}

/**
 * Custom hook to safely consume CyberRescueContext
 */
export function useCyberRescue() {
  const context = useContext(CyberRescueContext);
  if (!context) {
    throw new Error('useCyberRescue must be used within a CyberRescueProvider');
  }
  return context;
}
