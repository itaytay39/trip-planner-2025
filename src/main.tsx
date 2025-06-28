import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider, createTheme, alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// A modern, clean, and professional theme for a premium feel
const theme = createTheme({
  direction: 'rtl',
  palette: {
    mode: 'light',
    primary: {
      main: '#5D5FEF', // A vibrant, yet accessible purple-blue
    },
    secondary: {
      main: '#0AC993', // A fresh, modern mint green
    },
    background: {
      default: '#F4F5F9', // A very light, clean grey background
      paper: alpha('#FFFFFF', 0.9), // Paper with a slight transparency
    },
    text: {
      primary: '#2A2A2F', // Darker text for better contrast
      secondary: '#6E6E73',
    },
    success: {
        main: '#34C759',
    },
    warning: {
        main: '#FF9500',
    },
    error: {
        main: '#FF3B30',
    },
  },
  typography: {
    fontFamily: '"Heebo", "SF Pro Display", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800 }, h2: { fontWeight: 700 }, h3: { fontWeight: 700 },
    h4: { fontWeight: 700 }, h5: { fontWeight: 600 }, h6: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 20, // Consistent, soft rounded corners
  },
  components: {
    // Global style overrides for a consistent look
    MuiCard: {
      styleOverrides: {
        root: {
          // Subtle glassmorphism effect
          backdropFilter: 'blur(15px)',
          backgroundColor: alpha('#FFFFFF', 0.8),
          // A softer, more modern shadow
          boxShadow: '0 10px 30px 0 rgba(42, 42, 47, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
        }
      }
    },
    MuiPaper: {
        styleOverrides: {
            root: {
                backgroundColor: alpha('#FFFFFF', 0.9),
            }
        }
    },
    MuiButton: {
        styleOverrides: {
            root: {
                textTransform: 'none', // More readable button text
                fontWeight: 600,
            }
        }
    },
    MuiFab: {
        styleOverrides: {
            root: {
                boxShadow: '0 8px 24px rgba(93, 95, 239, 0.4)', // Shadow matching primary color
            }
        }
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
