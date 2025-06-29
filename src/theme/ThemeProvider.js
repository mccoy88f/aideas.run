import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from './materialTheme';

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
  const [mode, setMode] = useState(() => {
    // Recupera il tema salvato nel localStorage
    const savedMode = localStorage.getItem('aideas-theme');
    if (savedMode) {
      return savedMode;
    }
    // Fallback al tema del sistema
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const theme = mode === 'light' ? lightTheme : darkTheme;

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('aideas-theme', newMode);
  };

  const setTheme = (newMode) => {
    setMode(newMode);
    localStorage.setItem('aideas-theme', newMode);
  };

  // Ascolta i cambiamenti del tema del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!localStorage.getItem('aideas-theme')) {
        setMode(e.matches ? 'dark' : 'light');
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