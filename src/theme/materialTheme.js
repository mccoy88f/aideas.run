import { createTheme } from '@mui/material/styles';

// Colori personalizzati per l'aspetto glossy
const glossyColors = {
  primary: {
    main: '#6366f1', // Indigo moderno
    light: '#818cf8',
    dark: '#4f46e5',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#ec4899', // Pink moderno
    light: '#f472b6',
    dark: '#db2777',
    contrastText: '#ffffff',
  },
  success: {
    main: '#10b981', // Emerald
    light: '#34d399',
    dark: '#059669',
  },
  warning: {
    main: '#f59e0b', // Amber
    light: '#fbbf24',
    dark: '#d97706',
  },
  error: {
    main: '#ef4444', // Red
    light: '#f87171',
    dark: '#dc2626',
  },
  info: {
    main: '#3b82f6', // Blue
    light: '#60a5fa',
    dark: '#2563eb',
  },
  grey: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
};

// Tema chiaro
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: glossyColors.primary,
    secondary: glossyColors.secondary,
    success: glossyColors.success,
    warning: glossyColors.warning,
    error: glossyColors.error,
    info: glossyColors.info,
    grey: glossyColors.grey,
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
      modal: 'rgba(255, 255, 255, 0.95)',
      card: '#ffffff',
      surface: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
      disabled: '#94a3b8',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.025em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 1px 2px rgba(0, 0, 0, 0.05)',
    '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
    '0px 4px 6px rgba(0, 0, 0, 0.1), 0px 2px 4px rgba(0, 0, 0, 0.06)',
    '0px 10px 15px rgba(0, 0, 0, 0.1), 0px 4px 6px rgba(0, 0, 0, 0.05)',
    '0px 20px 25px rgba(0, 0, 0, 0.1), 0px 10px 10px rgba(0, 0, 0, 0.04)',
    '0px 25px 50px rgba(0, 0, 0, 0.15)',
    '0px 30px 60px rgba(0, 0, 0, 0.15)',
    '0px 35px 70px rgba(0, 0, 0, 0.15)',
    '0px 40px 80px rgba(0, 0, 0, 0.15)',
    '0px 45px 90px rgba(0, 0, 0, 0.15)',
    '0px 50px 100px rgba(0, 0, 0, 0.15)',
    '0px 55px 110px rgba(0, 0, 0, 0.15)',
    '0px 60px 120px rgba(0, 0, 0, 0.15)',
    '0px 65px 130px rgba(0, 0, 0, 0.15)',
    '0px 70px 140px rgba(0, 0, 0, 0.15)',
    '0px 75px 150px rgba(0, 0, 0, 0.15)',
    '0px 80px 160px rgba(0, 0, 0, 0.15)',
    '0px 85px 170px rgba(0, 0, 0, 0.15)',
    '0px 90px 180px rgba(0, 0, 0, 0.15)',
    '0px 95px 190px rgba(0, 0, 0, 0.15)',
    '0px 100px 200px rgba(0, 0, 0, 0.15)',
    '0px 105px 210px rgba(0, 0, 0, 0.15)',
    '0px 110px 220px rgba(0, 0, 0, 0.15)',
    '0px 115px 230px rgba(0, 0, 0, 0.15)',
    '0px 120px 240px rgba(0, 0, 0, 0.15)',
    '0px 125px 250px rgba(0, 0, 0, 0.15)',
    '0px 130px 260px rgba(0, 0, 0, 0.15)',
    '0px 135px 270px rgba(0, 0, 0, 0.15)',
    '0px 140px 280px rgba(0, 0, 0, 0.15)',
    '0px 145px 290px rgba(0, 0, 0, 0.15)',
    '0px 150px 300px rgba(0, 0, 0, 0.15)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          background: 'rgba(255, 255, 255, 0.9)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        },
        elevation2: {
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
        },
        elevation3: {
          boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          background: 'rgba(255, 255, 255, 0.95)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: glossyColors.primary.main,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: glossyColors.primary.main,
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(10px)',
          background: 'rgba(255, 255, 255, 0.9)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backdropFilter: 'blur(10px)',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRight: '1px solid rgba(0, 0, 0, 0.08)',
        },
      },
    },
  },
});

// Tema scuro
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: glossyColors.primary,
    secondary: glossyColors.secondary,
    success: glossyColors.success,
    warning: glossyColors.warning,
    error: glossyColors.error,
    info: glossyColors.info,
    grey: glossyColors.grey,
    background: {
      default: '#0f172a',
      paper: '#1e293b',
      modal: 'rgba(30, 41, 59, 0.95)',
      card: '#1e293b',
      surface: '#334155',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
      disabled: '#64748b',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.025em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 1px 2px rgba(0, 0, 0, 0.3)',
    '0px 1px 3px rgba(0, 0, 0, 0.4), 0px 1px 2px rgba(0, 0, 0, 0.3)',
    '0px 4px 6px rgba(0, 0, 0, 0.4), 0px 2px 4px rgba(0, 0, 0, 0.3)',
    '0px 10px 15px rgba(0, 0, 0, 0.4), 0px 4px 6px rgba(0, 0, 0, 0.3)',
    '0px 20px 25px rgba(0, 0, 0, 0.4), 0px 10px 10px rgba(0, 0, 0, 0.3)',
    '0px 25px 50px rgba(0, 0, 0, 0.5)',
    '0px 30px 60px rgba(0, 0, 0, 0.5)',
    '0px 35px 70px rgba(0, 0, 0, 0.5)',
    '0px 40px 80px rgba(0, 0, 0, 0.5)',
    '0px 45px 90px rgba(0, 0, 0, 0.5)',
    '0px 50px 100px rgba(0, 0, 0, 0.5)',
    '0px 55px 110px rgba(0, 0, 0, 0.5)',
    '0px 60px 120px rgba(0, 0, 0, 0.5)',
    '0px 65px 130px rgba(0, 0, 0, 0.5)',
    '0px 70px 140px rgba(0, 0, 0, 0.5)',
    '0px 75px 150px rgba(0, 0, 0, 0.5)',
    '0px 80px 160px rgba(0, 0, 0, 0.5)',
    '0px 85px 170px rgba(0, 0, 0, 0.5)',
    '0px 90px 180px rgba(0, 0, 0, 0.5)',
    '0px 95px 190px rgba(0, 0, 0, 0.5)',
    '0px 100px 200px rgba(0, 0, 0, 0.5)',
    '0px 105px 210px rgba(0, 0, 0, 0.5)',
    '0px 110px 220px rgba(0, 0, 0, 0.5)',
    '0px 115px 230px rgba(0, 0, 0, 0.5)',
    '0px 120px 240px rgba(0, 0, 0, 0.5)',
    '0px 125px 250px rgba(0, 0, 0, 0.5)',
    '0px 130px 260px rgba(0, 0, 0, 0.5)',
    '0px 135px 270px rgba(0, 0, 0, 0.5)',
    '0px 140px 280px rgba(0, 0, 0, 0.5)',
    '0px 145px 290px rgba(0, 0, 0, 0.5)',
    '0px 150px 300px rgba(0, 0, 0, 0.5)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(30, 41, 59, 0.9)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)',
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)',
        },
        elevation2: {
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)',
        },
        elevation3: {
          boxShadow: '0 10px 15px rgba(0, 0, 0, 0.4), 0 4px 6px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(30, 41, 59, 0.95)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: glossyColors.primary.main,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: glossyColors.primary.main,
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(10px)',
          background: 'rgba(15, 23, 42, 0.9)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backdropFilter: 'blur(10px)',
          background: 'rgba(15, 23, 42, 0.95)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        },
      },
    },
  },
});

// Hook per gestire il tema
export const useThemeMode = () => {
  const [mode, setMode] = React.useState('light');

  const toggleTheme = () => {
    setMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };

  const theme = mode === 'light' ? lightTheme : darkTheme;

  return { theme, mode, toggleTheme };
}; 