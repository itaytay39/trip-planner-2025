import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Fab,
  useTheme,
  alpha,
  useMediaQuery,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  InputAdornment
} from '@mui/material';
import {
  LocationOn,
  Flight,
  Add,
  Notifications,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useJsApiLoader } from '@react-google-maps/api';

// Import Components
import BudgetTracker from './components/BudgetTracker';
import UserProfile from './components/UserProfile';
import MapPage from './components/MapPage';
import Checklist from './components/Checklist';
import BottomNavigation from './components/BottomNavigation';
import IdeasPage from './components/IdeasPage';

// Import Firebase and Types
import { db } from './firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore'; 
import type { Trip, User } from './types';
import toast from 'react-hot-toast';

const libraries: ("places")[] = ["places"];

// =================================================================
// רכיבי עזר
// =================================================================

const Header = ({ user }: { user: User }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.background.paper,
          0.95
        )} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        padding: isMobile ? '12px 16px' : '16px 20px',
        zIndex: 100,
        boxShadow: '0 2px 20px rgba(0,0,0,0.05)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography
            variant={isMobile ? 'h6' : 'h5'}
            sx={{
              fontWeight: 800,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            שלום, {user.name.split(' ')[0]} 👋
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontWeight: 500, fontSize: isMobile ? '12px' : '14px' }}
          >
            בואו נתכנן את הטיול הבא שלך
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            size={isMobile ? 'small' : 'medium'}
            sx={{
              background: alpha(theme.palette.primary.main, 0.1),
              '&:hover': { background: alpha(theme.palette.primary.main, 0.2) },
            }}
          >
            <Notifications fontSize={isMobile ? 'small' : 'medium'} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

// 3. הוספנו את onTripDelete כ-prop
const TripCard = ({ trip, onEdit, onDelete, onCardClick }: { trip: Trip; onEdit: (trip: Trip) => void; onDelete: (tripId: string) => void; onCardClick: (tripId: string) => void; }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const destinationCount = Array.isArray(trip.destinations) ? trip.destinations.length : 0;
  
  // צבעי גרדיאנט דינמיים לפי סטטוס הטיול
  const getGradientColors = () => {
    if (trip.status === 'confirmed') {
      return {
        primary: '#4CAF50',
        secondary: '#8BC34A',
        accent: '#C8E6C9'
      };
    }
    return {
      primary: theme.palette.primary.main,
      secondary: theme.palette.secondary.main,
      accent: alpha(theme.palette.primary.main, 0.1)
    };
  };

  const colors = getGradientColors();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ 
        duration: 0.5, 
        ease: [0.25, 0.46, 0.45, 0.94] 
      }}
      whileHover={{ 
        y: -8,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
    >
      <Box onClick={() => onCardClick(trip.id)} sx={{ cursor: 'pointer' }}>
        <Card
          sx={{
            borderRadius: '24px',
            overflow: 'hidden',
            background: `rgba(255, 255, 255, 0.7)`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha('#ffffff', 0.2)}`,
            boxShadow: `
              0 8px 32px ${alpha(colors.primary, 0.15)},
              0 0 0 1px ${alpha('#ffffff', 0.1)} inset
            `,
            position: 'relative',
            transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            '&:hover': { 
              boxShadow: `
                0 20px 60px ${alpha(colors.primary, 0.25)},
                0 0 0 1px ${alpha('#ffffff', 0.2)} inset
              `,
              transform: 'translateY(-4px)',
              '& .trip-actions': {
                opacity: 1,
                transform: 'translateY(0)'
              }
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
              borderRadius: '24px 24px 0 0'
            }
          }}
        >
          {/* כותרת מעוגלת עם גרדיאנט */}
          <Box
            sx={{
              height: isMobile ? 140 : 180,
              background: `linear-gradient(135deg, 
                ${alpha(colors.primary, 0.9)} 0%, 
                ${alpha(colors.secondary, 0.8)} 50%,
                ${alpha(colors.primary, 0.7)} 100%
              )`,
              position: 'relative',
              display: 'flex',
              alignItems: 'flex-end',
              padding: isMobile ? '20px' : '24px',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="white" fill-opacity="0.03"%3E%3Ccircle cx="20" cy="20" r="2"/%3E%3C/g%3E%3C/svg%3E")',
                opacity: 0.3
              }
            }}
          >
            {/* כפתורי פעולה מרחפים */}
            <Box
              className="trip-actions"
              sx={{
                position: 'absolute',
                top: isMobile ? 16 : 20,
                right: isMobile ? 16 : 20,
                display: 'flex',
                gap: 1,
                opacity: 0.7,
                transform: 'translateY(-4px)',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <IconButton
                  size={isMobile ? "small" : "medium"}
                  onClick={(e) => { e.stopPropagation(); onDelete(trip.id); }}
                  sx={{
                    background: 'rgba(244, 67, 54, 0.1)',
                    backdropFilter: 'blur(10px)',
                    color: '#f44336',
                    border: '1px solid rgba(244, 67, 54, 0.2)',
                    width: isMobile ? 36 : 40,
                    height: isMobile ? 36 : 40,
                    '&:hover': { 
                      background: 'rgba(244, 67, 54, 0.2)',
                      transform: 'scale(1.05)',
                    },
                  }}
                >
                  <DeleteIcon fontSize={isMobile ? "small" : "medium"} />
                </IconButton>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <IconButton
                  size={isMobile ? "small" : "medium"}
                  onClick={(e) => { e.stopPropagation(); onEdit(trip); }}
                  sx={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    width: isMobile ? 36 : 40,
                    height: isMobile ? 36 : 40,
                    '&:hover': { 
                      background: 'rgba(255, 255, 255, 0.3)',
                      transform: 'scale(1.05)',
                    },
                  }}
                >
                  <EditIcon fontSize={isMobile ? "small" : "medium"} />
                </IconButton>
              </motion.div>
            </Box>

            {/* תוכן הכותרת */}
            <Box sx={{ zIndex: 2 }}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <Typography
                  variant={isMobile ? 'h6' : 'h5'}
                  sx={{
                    color: 'white',
                    fontWeight: 700,
                    textShadow: '0 2px 20px rgba(0,0,0,0.3)',
                    mb: 1,
                    letterSpacing: '-0.02em'
                  }}
                >
                  {trip.title}
                </Typography>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: alpha('#fff', 0.9),
                    fontWeight: 500,
                    textShadow: '0 1px 10px rgba(0,0,0,0.2)',
                    fontSize: isMobile ? '13px' : '14px',
                  }}
                >
                  {trip.dates}
                </Typography>
              </motion.div>
            </Box>
          </Box>

          {/* תוכן הכרטיס */}
          <CardContent sx={{ padding: isMobile ? '20px' : '24px' }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Chip
                  label={trip.status === 'confirmed' ? '✈️ מאושר' : '📝 בתכנון'}
                  sx={{ 
                    fontWeight: 600, 
                    borderRadius: '16px',
                    height: 32,
                    fontSize: '0.8rem',
                    background: trip.status === 'confirmed' 
                      ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                      : `linear-gradient(135deg, #FF9800, #FFC107)`,
                    color: 'white',
                    border: 'none',
                    boxShadow: `0 4px 12px ${alpha(colors.primary, 0.3)}`
                  }}
                />
              </motion.div>
              
              <Typography
                variant={isMobile ? 'h6' : 'h5'}
                sx={{ 
                  fontWeight: 800, 
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: isMobile ? '1.1rem' : '1.3rem',
                }}
              >
                {trip.budget}
              </Typography>
            </Box>

            {/* נתונים */}
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 4px 12px ${alpha(colors.primary, 0.3)}`
                    }}
                  >
                    <Flight sx={{ fontSize: 16, color: 'white' }} />
                  </Box>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'text.primary',
                      fontWeight: 600,
                      fontSize: isMobile ? '0.8rem' : '0.875rem',
                    }}
                  >
                    {trip.days || 0} ימים
                  </Typography>
                </Box>
              </motion.div>

              <motion.div
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${colors.secondary}, ${colors.primary})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 4px 12px ${alpha(colors.secondary, 0.3)}`
                    }}
                  >
                    <LocationOn sx={{ fontSize: 16, color: 'white' }} />
                  </Box>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'text.primary',
                      fontWeight: 600,
                      fontSize: isMobile ? '0.8rem' : '0.875rem',
                    }}
                  >
                    {destinationCount} יעדים
                  </Typography>
                </Box>
              </motion.div>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </motion.div>
  );
};

const HomePage = ({ trips, user, onEditTrip, onAddTrip, onViewOnMap, onDeleteTrip }: { 
  trips: Trip[]; 
  user: User; 
  onEditTrip: (trip: Trip) => void; 
  onAddTrip: () => void; 
  onViewOnMap: (tripId: string) => void; 
  onDeleteTrip: (tripId: string) => void; 
}) => {
  const isMobile = useMediaQuery('(max-width:600px)');
  return (
    <Box sx={{ padding: isMobile ? '16px' : '20px', paddingBottom: '100px' }}>
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          הטיולים הקרובים שלך
        </Typography>
        <Chip
          label="הכל"
          variant="outlined"
          size="small"
          sx={{ borderRadius: '12px', fontWeight: 600 }}
        />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} onEdit={onEditTrip} onCardClick={onViewOnMap} onDelete={onDeleteTrip} />
        ))}
      </Box>
      <Fab
        color="primary"
        onClick={onAddTrip}
        sx={{
          position: 'fixed',
          bottom: 100,
          right: 20,
          background: `linear-gradient(135deg, #1976d2 0%, #dc004e 100%)`,
          boxShadow: '0 8px 25px rgba(25, 118, 210, 0.4)',
          '&:hover': { boxShadow: '0 12px 35px rgba(25, 118, 210, 0.6)' },
        }}
      >
        <Add />
      </Fab>
    </Box>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [tripsData, setTripsData] = useState<Trip[] | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [isNewTrip, setIsNewTrip] = useState(false);
  const [selectedTripIdForMap, setSelectedTripIdForMap] = useState<string>('all');
  
  const theme = useTheme();

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_Maps_API_KEY,
    libraries,
  });

  useEffect(() => {
    const unsubscribeTrips = onSnapshot(collection(db, 'trips'), (snapshot) => {
      const fetchedTrips = snapshot.docs.map(
        (doc) => ({ ...doc.data(), id: doc.id } as Trip)
      );
      setTripsData(fetchedTrips);
    }, (error) => {
        console.error("Error fetching trips: ", error);
        setTripsData([]);
    });

    const unsubscribeUser = onSnapshot(doc(db, 'users', 'mainUser'), (doc) => {
      if (doc.exists()) {
        setUserData(doc.data() as User);
      } else {
        console.error('User document "mainUser" not found!');
        setUserData({ name: "אורח" });
      }
    }, (error) => {
        console.error("Error fetching user: ", error);
        setUserData({ name: "אורח" });
    });

    return () => {
      unsubscribeTrips();
      unsubscribeUser();
    };
  }, []);

  const handleViewTripOnMap = (tripId: string) => {
    setSelectedTripIdForMap(tripId);
    setActiveTab('map');
  };

  // 5. הוספנו פונקציית מחיקה
  const handleDeleteTrip = async (tripId: string) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק את הטיול הזה? אין דרך חזרה.")) {
        try {
            await deleteDoc(doc(db, "trips", tripId));
            toast.success("הטיול נמחק בהצלחה!");
        } catch (e) {
            toast.error("שגיאה במחיקת הטיול.");
            console.error("Error deleting document: ", e);
        }
    }
  };

  const handleOpenAddTrip = () => {
    setIsNewTrip(true);
    setEditingTrip({
      id: '',
      title: '',
      dates: '',
      budget: '',
      image: '',
      status: 'planning',
      destinations: [],
    } as Trip);
  };

  const handleEditTrip = (trip: Trip) => {
    setIsNewTrip(false);
    setEditingTrip(trip);
  };

  const handleSaveTrip = async () => {
    if (!editingTrip) return;

    if (isNewTrip) {
      try {
        const { id, ...newTripData } = editingTrip;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _unusedId = id;
        await addDoc(collection(db, "trips"), {
          ...newTripData,
          createdAt: serverTimestamp(),
        });
        toast.success("טיול חדש נוצר בהצלחה!");
      } catch (e) {
        toast.error("שגיאה ביצירת הטיול.");
        console.error("Error adding document: ", e);
      }
    } else {
      const tripRef = doc(db, 'trips', editingTrip.id);
      try {
        const { id, ...dataToUpdate } = editingTrip;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _unusedId = id;
        await updateDoc(tripRef, dataToUpdate);
        toast.success("הטיול עודכן בהצלחה!");
      } catch (e) {
        toast.error("שגיאה בעדכון הטיול.");
        console.error("Error updating trip: ", e);
      }
    }
    setEditingTrip(null);
    setIsNewTrip(false);
  };
  
  const renderContent = () => {
    if (!isLoaded || !userData || tripsData === null) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>טוען נתונים ומפה...</Typography>
        </Box>
      );
    }

    if (loadError) {
      return <Box>Error loading maps</Box>;
    }
    
    switch (activeTab) {
      case 'home':
        return <HomePage trips={tripsData} user={userData} onEditTrip={handleEditTrip} onAddTrip={handleOpenAddTrip} onViewOnMap={handleViewTripOnMap} onDeleteTrip={handleDeleteTrip} />;
      case 'checklist':
        return tripsData.length > 0 ? <Checklist tripId={tripsData[0].id} /> : <Typography sx={{p: 3}}>בחר טיול כדי לראות רשימת משימות.</Typography>;
      case 'ideas': 
        return <IdeasPage />;
      case 'budget':
        return tripsData.length > 0 ? <BudgetTracker trip={tripsData[0]} /> : <Typography sx={{p: 3}}>בחר טיול כדי לראות תקציב.</Typography>;
      case 'profile':
        return <UserProfile user={userData} />;
      case 'map':
        return <MapPage trips={tripsData} selectedTripId={selectedTripIdForMap} setSelectedTripId={setSelectedTripIdForMap} />;
      default:
        return <HomePage trips={tripsData} user={userData} onEditTrip={handleEditTrip} onAddTrip={handleOpenAddTrip} onViewOnMap={handleViewTripOnMap} onDeleteTrip={handleDeleteTrip} />;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.background.default,
          1
        )} 0%, ${alpha(theme.palette.grey[50], 1)} 100%)`,
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {userData && <Header user={userData} />}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
      
      <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      <Dialog open={!!editingTrip} onClose={() => setEditingTrip(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{isNewTrip ? 'הוספת טיול חדש' : 'עריכת טיול'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="שם הטיול"
              value={editingTrip?.title || ''}
              onChange={(e) => setEditingTrip(prev => prev ? {...prev, title: e.target.value} : null)}
              fullWidth
            />
            <TextField
              label="תאריכים"
              value={editingTrip?.dates || ''}
              onChange={(e) => setEditingTrip(prev => prev ? {...prev, dates: e.target.value} : null)}
              fullWidth
            />
            <TextField
              label="תקציב"
              value={editingTrip?.budget || ''}
              onChange={(e) => setEditingTrip(prev => prev ? {...prev, budget: e.target.value} : null)}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingTrip(null)}>ביטול</Button>
          <Button onClick={handleSaveTrip} variant="contained">שמור שינויים</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default App;

