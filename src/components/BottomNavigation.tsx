import React from 'react';
import { motion } from 'framer-motion';
import { BottomNavigation as MuiBottomNavigation, BottomNavigationAction, Paper, useTheme, alpha, Box } from '@mui/material';
import { Home, CheckCircle, Map, Person, Lightbulb } from '@mui/icons-material';

interface BottomNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, setActiveTab }) => {
  const theme = useTheme();

  const navigationItems = [
    { value: 'home', label: 'בית', icon: Home },
    { value: 'checklist', label: 'רשימה', icon: CheckCircle },
    { value: 'map', label: 'מפה', icon: Map },
    { value: 'profile', label: 'פרופיל', icon: Person },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        borderRadius: '24px 24px 0 0',
        background: `rgba(${theme.palette.mode === 'dark' ? '18, 18, 18' : '255, 255, 255'}, 0.95)`,
        backdropFilter: 'blur(20px)',
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        boxShadow: '0 -8px 32px rgba(0,0,0,0.12)',
        zIndex: 1000,
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.3)}, transparent)`
        }
      }}
    >
      <MuiBottomNavigation
        value={activeTab}
        onChange={(event, newValue) => setActiveTab(newValue)}
        sx={{
          height: '100%',
          backgroundColor: 'transparent',
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            paddingTop: '12px',
            paddingBottom: '12px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            borderRadius: '16px',
            margin: '8px 4px',
            '&.Mui-selected': {
              color: theme.palette.primary.main,
              '& .MuiBottomNavigationAction-label': {
                fontSize: '12px',
                fontWeight: 600,
                transform: 'translateY(2px)'
              }
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '11px',
              fontWeight: 500,
              transition: 'all 0.3s ease'
            }
          }
        }}
      >
        {navigationItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeTab === item.value;
          
          return (
            <BottomNavigationAction
              key={item.value}
              label={item.label}
              value={item.value}
              icon={
                <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      style={{
                        position: 'absolute',
                        top: -8,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 32,
                        height: 32,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        borderRadius: '16px',
                        border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      }}
                      initial={false}
                      animate={{
                        scale: isActive ? 1 : 0,
                        opacity: isActive ? 1 : 0
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30
                      }}
                    />
                  )}
                  <motion.div
                    animate={{
                      scale: isActive ? 1.1 : 1,
                      y: isActive ? -2 : 0
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 25
                    }}
                  >
                    <Icon 
                      sx={{ 
                        fontSize: 24,
                        color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                        filter: isActive ? `drop-shadow(0 2px 8px ${alpha(theme.palette.primary.main, 0.3)})` : 'none',
                        transition: 'all 0.3s ease'
                      }} 
                    />
                  </motion.div>
                </Box>
              }
              sx={{
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  '& .MuiSvgIcon-root': {
                    transform: 'scale(1.05)',
                  }
                }
              }}
            />
          );
        })}
      </MuiBottomNavigation>
    </Paper>
  );
};

export default BottomNavigation;