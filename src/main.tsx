import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';

// --- ערכת צבעים חדשה בהשראת Material Design 3 ---
const theme = createTheme({
  direction: 'rtl',
  palette: {
    mode: 'light',
    primary: {
      main: '#4A69BB', // כחול רגוע יותר
    },
    secondary: {
      main: '#78C4D4', // טורקיז עדין
    },
    background: {
      default: '#F8F9FA', // רקע אפרפר מאוד בהיר
      paper: '#FFFFFF',
    },
    text: {
      primary: '#212529',
      secondary: '#495057',
    },
  },
  typography: {
    fontFamily: '"Heebo", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 16,
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);