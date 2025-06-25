import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  useTheme,
  alpha,
  useMediaQuery,
} from '@mui/material';
import {
  Home as HomeIcon,
  Map as MapIcon,
  AccountBalanceWallet as WalletIcon,
  Person as PersonIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  LightbulbOutlined as LightbulbOutlinedIcon
} from '@mui/icons-material';
// 1. הסרנו את אייקון ה-RouteIcon

interface BottomNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, setActiveTab }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // 2. עדכנו את רשימת הכפתורים והסרנו את "מסלולים"
  const tabs = [
    { id: 'home', icon: HomeIcon, label: 'בית' },
    { id: 'checklist', icon: CheckCircleOutlineIcon, label: 'רשימה' },
    { id: 'ideas', icon: LightbulbOutlinedIcon, label: 'רעיונות' },
    { id: 'budget', icon: WalletIcon, label: 'תקציב' },
    { id: 'map', icon: MapIcon, label: 'מפה' },
    { id: 'profile', icon: PersonIcon, label: 'פרופיל' },
  ];

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.background.paper,
          0.95
        )} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
        backdropFilter: 'blur(20px)',
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        padding: isMobile ? '8px 16px' : '12px 20px',
        zIndex: 100,
        boxShadow: '0 -2px 20px rgba(0,0,0,0.05)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <IconButton
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                padding: isMobile ? '8px' : '12px',
                borderRadius: '16px',
                background: isActive
                  ? alpha(theme.palette.primary.main, 0.1)
                  : 'transparent',
                color: isActive
                  ? theme.palette.primary.main
                  : theme.palette.text.secondary,
                '&:hover': {
                  background: alpha(theme.palette.primary.main, 0.05),
                },
              }}
            >
              <Icon fontSize={isMobile ? 'small' : 'medium'} />
              <Typography
                variant="caption"
                sx={{
                  fontSize: isMobile ? '10px' : '11px',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {tab.label}
              </Typography>
            </IconButton>
          );
        })}
      </Box>
    </Box>
  );
};

export default BottomNavigation;