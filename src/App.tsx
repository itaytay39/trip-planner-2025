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
  AttachMoney,
  Edit as EditIcon,
  AutoAwesome as AutoAwesomeIcon,
  UploadFile,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useJsApiLoader } from '@react-google-maps/api';

import BudgetTracker from './components/BudgetTracker';
import UserProfile from './components/UserProfile';
import MapPage from './components/MapPage';
import Checklist from './components/Checklist';
import BottomNavigation from './components/BottomNavigation';
import IdeasPage from './components/IdeasPage';

import { db } from './firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, deleteDoc, writeBatch } from 'firebase/firestore'; 
import type { Trip, User } from './types';
import toast from 'react-hot-toast';

const libraries: ("places" | "directions")[] = ["places", "directions"];

const defaultChecklistItems = [
    { text: "דרכון בתוקף", completed: false },
    { text: "ויזה לארה\"ב (ESTA)", completed: false },
    { text: "רישיון נהיגה ישראלי ובינלאומי", completed: false },
    { text: "כרטיסי טיסה", completed: false },
    { text: "אישורי הזמנת מלונות ורכב", completed: false },
    { text: "ביטוח נסיעות לחו\"ל", completed: false },
    { text: "כרטיסי אשראי בינלאומיים", completed: false },
    { text: "דולרים במזומן", completed: false },
    { text: "מטען נייד (Power Bank) ומתאם לחשמל", completed: false },
    { text: "תרופות אישיות וערכת עזרה ראשונה", completed: false }
];

const Header = ({ user }: { user: User }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper,0.95)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        padding: isMobile ? '12px 16px' : '16px 20px',
        zIndex: 1100,
        boxShadow: '0 2px 20px rgba(0,0,0,0.05)',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 800, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`, backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            שלום, {user.name.split(' ')[0]} 👋
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: isMobile ? '12px' : '14px' }}>
            בואו נתכנן את הטיול הבא שלך
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size={isMobile ? 'small' : 'medium'} sx={{ background: alpha(theme.palette.primary.main, 0.1), '&:hover': { background: alpha(theme.palette.primary.main, 0.2) } }}>
            <Notifications fontSize={isMobile ? 'small' : 'medium'} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

const TripCard = ({ trip, onEdit, onDelete, onCardClick }: { trip: Trip; onEdit: (trip: Trip) => void; onDelete: (tripId: string) => void; onCardClick: (tripId: string) => void; }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const destinationCount = Array.isArray(trip.destinations) ? trip.destinations.length : 0;
  
  const backgroundImage = trip.image
    ? `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.4)), url(${trip.image})`
    : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.3)} 0%, ${alpha(theme.palette.secondary.main, 0.3)} 100%)`;

  return (
    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }} whileHover={{ y: -5, boxShadow: '0 25px 50px rgba(0,0,0,0.15)' }} whileTap={{ scale: 0.98 }}>
      <Card onClick={() => onCardClick(trip.id)} sx={{ borderRadius: '24px', overflow: 'hidden', background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper,0.9)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`, backdropFilter: 'blur(20px)', border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', position: 'relative', cursor: 'pointer' }}>
          <Box sx={{ height: isMobile ? 160 : 200, backgroundImage: backgroundImage, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: isMobile ? '16px' : '20px', color: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(trip.id); }} sx={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white', backdropFilter: 'blur(10px)', '&:hover': { background: 'rgba(255, 255, 255, 0.3)' } }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(trip); }} sx={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white', backdropFilter: 'blur(10px)', '&:hover': { background: 'rgba(255, 255, 255, 0.3)' } }}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box>
              <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 800, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{trip.title}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, textShadow: '0 1px 5px rgba(0,0,0,0.5)', opacity: 0.9 }}>{trip.dates}</Typography>
            </Box>
          </Box>
          <CardContent sx={{ padding: isMobile ? '16px' : '20px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Chip label={trip.status === 'confirmed' ? 'מאושר' : 'בתכנון'} color={trip.status === 'confirmed' ? 'success' : 'warning'} size="small" sx={{ fontWeight: 600, borderRadius: '12px' }}/>
              <Typography variant={isMobile ? 'body1' : 'h6'} sx={{ fontWeight: 700, color: theme.palette.primary.main }}>{trip.budget}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', color: 'text.secondary' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Flight fontSize="small" />
                <Typography variant="body2">{trip.days || 0} ימים</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationOn fontSize="small" />
                <Typography variant="body2">{destinationCount} יעדים</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
    </motion.div>
  );
};

const QuickStats = ({ user }: { user: User }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const stats = [
    { icon: AttachMoney, label: 'הוצאות', value: `₪${(user.totalSpent || 0).toLocaleString()}`, color: theme.palette.success.main },
    { icon: LocationOn, label: 'מקומות שמורים', value: user.savedPlaces || 0, color: theme.palette.warning.main },
    { icon: Flight, label: 'טיולים הושלמו', value: user.trips || 0, color: theme.palette.info.main },
  ];
  return (
    <Box sx={{ display: 'flex', gap: isMobile ? 1.5 : 2, mb: 3 }}>
      {stats.map((stat, index) => (
          <motion.div key={index} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.1, duration: 0.5 }} style={{ flex: 1 }}>
            <Card sx={{ borderRadius: '20px', background: `linear-gradient(135deg, ${alpha(stat.color,0.1)} 0%, ${alpha(stat.color, 0.05)} 100%)`, border: `1px solid ${alpha(stat.color, 0.2)}`, padding: isMobile ? '12px' : '16px', textAlign: 'center', boxShadow: 'none' }}>
              <Icon sx={{ fontSize: isMobile ? 24 : 32, color: stat.color, mb: 1 }} />
              <Typography variant={isMobile ? 'body1' : 'h6'} sx={{ fontWeight: 700, color: stat.color }}>{stat.value}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: isMobile ? '10px' : '11px', textTransform: 'uppercase' }}>{stat.label}</Typography>
            </Card>
          </motion.div>
      ))}
    </Box>
  );
};

const HomePage = ({ trips, user, onEditTrip, onAddTrip, onUploadTrip, onViewOnMap, onDeleteTrip }: { trips: Trip[]; user: User; onEditTrip: (trip: Trip) => void; onAddTrip: () => void; onUploadTrip: () => void; onViewOnMap: (tripId: string) => void; onDeleteTrip: (tripId: string) => void; }) => {
  const isMobile = useMediaQuery('(max-width:600px)');
  return (
    <Box sx={{ padding: isMobile ? '16px' : '20px', paddingBottom: '100px' }}>
      <QuickStats user={user} />
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>הטיולים שלי</Typography>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} onEdit={onEditTrip} onCardClick={onViewOnMap} onDelete={onDeleteTrip} />
        ))}
      </Box>
      <Fab color="primary" onClick={onAddTrip} sx={{ position: 'fixed', bottom: 100, right: 20, background: `linear-gradient(135deg, #1976d2 0%, #dc004e 100%)`, boxShadow: '0 8px 25px rgba(25, 118, 210, 0.4)' }}>
        <Add />
      </Fab>
      <Fab color="secondary" onClick={onUploadTrip} sx={{ position: 'fixed', bottom: 170, right: 20, boxShadow: '0 8px 25px rgba(120, 196, 212, 0.4)' }}>
        <UploadFile />
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
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedTripIdForMap, setSelectedTripIdForMap] = useState<string>('all');
  
  const theme = useTheme();

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_Maps_API_KEY,
    libraries,
  });

  useEffect(() => {
    if (!tripsData || !userData) return;
    const userRef = doc(db, 'users', 'mainUser');
    const totalDestinations = tripsData.reduce((acc, trip) => acc + (Array.isArray(trip.destinations) ? trip.destinations.length : 0), 0);
    const completedTrips = tripsData.filter(trip => trip.status === 'confirmed').length;

    const updates: Partial<User> = {};
    if (userData.savedPlaces !== totalDestinations) updates.savedPlaces = totalDestinations;
    if (userData.trips !== completedTrips) updates.trips = completedTrips;
    
    if (Object.keys(updates).length > 0) {
        updateDoc(userRef, updates).catch(error => console.error("Error updating user stats: ", error));
    }
  }, [tripsData, userData]);

  useEffect(() => {
    const unsubscribeTrips = onSnapshot(collection(db, 'trips'), (snapshot) => {
      const fetchedTrips = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Trip));
      setTripsData(fetchedTrips);
    }, (error) => {
        console.error("Error fetching trips: ", error);
        setTripsData([]);
    });
    const unsubscribeUser = onSnapshot(doc(db, 'users', 'mainUser'), (doc) => {
      setUserData(doc.exists() ? (doc.data() as User) : { name: "אורח" });
    }, (error) => {
        console.error("Error fetching user: ", error);
        setUserData({ name: "אורח" });
    });
    return () => { unsubscribeTrips(); unsubscribeUser(); };
  }, []);

  const getRandomAmericanImage = () => {
    const images = ['https://images.pexels.com/photos/290386/pexels-photo-290386.jpeg', 'https://images.pexels.com/photos/161901/san-francisco-golden-gate-bridge-sunrise-california-161901.jpeg', 'https://images.pexels.com/photos/373924/pexels-photo-373924.jpeg', 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg'];
    return images[Math.floor(Math.random() * images.length)];
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const tripData = JSON.parse(e.target?.result as string);
        const newTripData = { ...tripData, image: getRandomAmericanImage(), createdAt: serverTimestamp() };
        const newTripRef = await addDoc(collection(db, "trips"), newTripData);
        const batch = writeBatch(db);
        const checklistRef = collection(db, 'trips', newTripRef.id, 'checklist');
        defaultChecklistItems.forEach(item => batch.set(doc(checklistRef), { ...item, createdAt: serverTimestamp() }));
        await batch.commit();
        toast.success("טיול חדש ורשימת משימות נוספו בהצלחה!");
      } catch (error) {
        toast.error("שגיאה בקריאת קובץ ה-JSON.");
        console.error("Error parsing or uploading trip:", error);
      }
    };
    reader.readAsText(file);
  };

  const handleTriggerUpload = () => fileInputRef.current?.click();

  const handleViewTripOnMap = (tripId: string) => {
    setSelectedTripIdForMap(tripId);
    setActiveTab('map');
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק את הטיול הזה?")) {
        try {
            await deleteDoc(doc(db, "trips", tripId));
            toast.success("הטיול נמחק בהצלחה!");
        } catch (e) {
            toast.error("שגיאה במחיקת הטיול.");
        }
    }
  };

  const handleOpenAddTrip = () => {
    setIsNewTrip(true);
    setEditingTrip({ id: '', title: '', dates: '', budget: '', image: getRandomAmericanImage(), status: 'planning', destinations: [] } as Trip);
  };

  const handleEditTrip = (trip: Trip) => {
    setIsNewTrip(false);
    setEditingTrip(trip);
  };

  const handleSaveTrip = async () => {
    if (!editingTrip) return;
    const { id, ...data } = editingTrip;
    try {
        if (isNewTrip) {
            const newTripRef = await addDoc(collection(db, "trips"), { ...data, createdAt: serverTimestamp() });
            const batch = writeBatch(db);
            const checklistRef = collection(db, 'trips', newTripRef.id, 'checklist');
            defaultChecklistItems.forEach(item => batch.set(doc(checklistRef), { ...item, createdAt: serverTimestamp() }));
            await batch.commit();
            toast.success("טיול חדש נוצר בהצלחה!");
        } else {
            await updateDoc(doc(db, 'trips', id), data);
            toast.success("הטיול עודכן בהצלחה!");
        }
    } catch (e) {
        toast.error("שגיאה בשמירת הטיול.");
    } finally {
        setEditingTrip(null);
    }
  };
  
  const handleGenerateImage = async () => { /* ... (Function remains the same) ... */ };

  const renderContent = () => {
    if (!isLoaded || !userData || tripsData === null) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>טוען נתונים ומפה...</Typography>
        </Box>
      );
    }
    if (loadError) return <Box sx={{p:3}}>Error loading maps: {loadError.message}</Box>;
    
    // **הלוגיקה החדשה לניווט חכם**
    const tripForTabs = tripsData.find(t => t.id === selectedTripIdForMap) || (tripsData.length > 0 ? tripsData[0] : null);

    switch (activeTab) {
      case 'home':
        return <HomePage trips={tripsData} user={userData} onEditTrip={handleEditTrip} onAddTrip={handleOpenAddTrip} onUploadTrip={handleTriggerUpload} onViewOnMap={handleViewTripOnMap} onDeleteTrip={handleDeleteTrip} />;
      
      case 'checklist':
        return tripForTabs ? <Checklist tripId={tripForTabs.id} /> : <Typography sx={{p: 3, textAlign: 'center'}}>צור טיול כדי לראות את רשימת המשימות.</Typography>;
      
      case 'budget':
        return tripForTabs ? <BudgetTracker trip={tripForTabs} user={userData} /> : <Typography sx={{p: 3, textAlign: 'center'}}>צור טיול כדי לנהל תקציב.</Typography>;
      
      case 'map':
        return <MapPage trips={tripsData} selectedTripId={selectedTripIdForMap} setSelectedTripId={setSelectedTripIdForMap} />;
        
      case 'ideas': return <IdeasPage />;
      case 'profile': return <UserProfile user={userData} />;
      default: return null;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: theme.palette.background.default, position: 'relative', overflowX: 'hidden' }}>
      {userData && <Header user={userData} />}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, x: activeTab === 'home' ? 0 : 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3, ease: 'easeInOut' }}>
          {renderContent()}
        </motion.div>
      </AnimatePresence>
      <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <Dialog open={!!editingTrip} onClose={() => setEditingTrip(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{isNewTrip ? 'הוספת טיול חדש' : 'עריכת טיול'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="שם הטיול" value={editingTrip?.title || ''} onChange={(e) => setEditingTrip(p => p ? {...p, title: e.target.value} : null)} fullWidth/>
            <TextField label="תאריכים" value={editingTrip?.dates || ''} onChange={(e) => setEditingTrip(p => p ? {...p, dates: e.target.value} : null)} fullWidth/>
            <TextField label="תקציב" value={editingTrip?.budget || ''} onChange={(e) => setEditingTrip(p => p ? {...p, budget: e.target.value} : null)} fullWidth/>
            <TextField label="כתובת תמונה" value={editingTrip?.image || ''} onChange={(e) => setEditingTrip(p => p ? {...p, image: e.target.value} : null)} fullWidth InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton onClick={handleGenerateImage} disabled={isGeneratingImage}>{isGeneratingImage ? <CircularProgress size={24} /> : <AutoAwesomeIcon />}</IconButton></InputAdornment>)}}/>
          </Box>
        </DialogContent>
        <DialogActions sx={{p: '16px 24px'}}>
          <Button onClick={() => setEditingTrip(null)}>ביטול</Button>
          <Button onClick={handleSaveTrip} variant="contained">שמור</Button>
        </DialogActions>
      </Dialog>
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept=".json"/>
    </Box>
  );
}

export default App;

