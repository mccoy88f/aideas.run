import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from './materialTheme';
import StorageService from '../services/StorageService.js';

// Context per il tema
const ThemeContext = createContext();

// Hook personalizzato per usare il tema
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve essere usato all\'interno di ThemeProvider');
  }
  return context;
};

// Provider del tema
export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState('light'); // Default temporaneo

  // Inizializza il tema dalle impostazioni
  useEffect(() => {
    const initializeTheme = async () => {
      try {
        const settings = await StorageService.getAllSettings();
        const savedTheme = settings.theme || 'system';
        
        if (savedTheme === 'system') {
          // Segui preferenza sistema
          if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setMode('dark');
          } else {
            setMode('light');
          }
        } else {
          setMode(savedTheme);
        }
      } catch (error) {
        console.error('Errore caricamento tema:', error);
        // Fallback al tema del sistema
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          setMode('dark');
        } else {
          setMode('light');
        }
      }
    };
    
    initializeTheme();
  }, []);

  const theme = mode === 'light' ? lightTheme : darkTheme;

  const toggleTheme = async () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    
    try {
      const settings = await StorageService.getAllSettings();
      settings.theme = newMode;
      await StorageService.setAllSettings(settings);
    } catch (error) {
      console.error('Errore salvataggio tema:', error);
    }
  };

  const setTheme = async (newMode) => {
    setMode(newMode);
    
    try {
      const settings = await StorageService.getAllSettings();
      settings.theme = newMode;
      await StorageService.setAllSettings(settings);
    } catch (error) {
      console.error('Errore salvataggio tema:', error);
    }
  };

  // Ascolta i cambiamenti del tema del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = async (e) => {
      try {
        const settings = await StorageService.getAllSettings();
        if (settings.theme === 'system') {
          setMode(e.matches ? 'dark' : 'light');
        }
      } catch (error) {
        console.error('Errore controllo tema sistema:', error);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const value = {
    theme,
    mode,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}; 