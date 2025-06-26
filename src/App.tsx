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
  Share,
  Add,
  Notifications,
  AttachMoney,
  Edit as EditIcon,
  AutoAwesome as AutoAwesomeIcon,
  UploadFile,
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
  { text: "חולצות קצרות וארוכות", completed: false },
  { text: "מכנסיים ארוכים וקצרים", completed: false },
  { text: "בגדים תחתונים וגרביים", completed: false },
  { text: "סוודר / פליז", completed: false },
  { text: "מעיל גשם / ז'קט", completed: false },
  { text: "בגד ים", completed: false },
  { text: "פיג'מה", completed: false },
  { text: "נעלי הליכה נוחות", completed: false },
  { text: "מטען נייד (Power Bank)", completed: false },
  { text: "מתאם לחשמל אמריקאי", completed: false },
  { text: "אוזניות", completed: false },
  { text: "תרופות מרשם אישיות", completed: false },
  { text: "משככי כאבים", completed: false },
  { text: "פלסטרים וחומר חיטוי", completed: false },
  { text: "דוחה יתושים", completed: false },
  { text: "קרם הגנה", completed: false },
  { text: "מברשת ומשחת שיניים", completed: false },
];

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

const TripCard = ({ trip, onEdit, onDelete, onCardClick }: { trip: Trip; onEdit: (trip: Trip) => void; onDelete: (tripId: string) => void; onCardClick: (tripId: string) => void; }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const destinationCount = Array.isArray(trip.destinations) ? trip.destinations.length : 0;
  
  const backgroundImage = trip.image
    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.3)} 0%, ${alpha(theme.palette.secondary.main, 0.3)} 100%), url(${trip.image})`
    : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.3)} 0%, ${alpha(theme.palette.secondary.main, 0.3)} 100%)`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
    >
      <Box onClick={() => onCardClick(trip.id)} sx={{ cursor: 'pointer' }}>
        <Card
          sx={{
            borderRadius: isMobile ? '20px' : '24px',
            overflow: 'hidden',
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.background.paper,
              0.9
            )} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            position: 'relative',
            '&:hover': { boxShadow: '0 25px 50px rgba(0,0,0,0.15)' },
          }}
        >
          <Box
            sx={{
              height: isMobile ? 160 : 200,
              backgroundImage: backgroundImage,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',
              display: 'flex',
              alignItems: 'flex-end',
              padding: isMobile ? '16px' : '20px',
              backgroundColor: 'grey.200'
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                display: 'flex',
                gap: 1,
              }}
            >
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); onDelete(trip.id); }}
                sx={{
                  background: alpha(theme.palette.error.main, 0.8),
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  '&:hover': { background: alpha(theme.palette.error.main, 1) },
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); onEdit(trip); }}
                sx={{
                  background: alpha(theme.palette.background.paper, 0.9),
                  backdropFilter: 'blur(10px)',
                  '&:hover': { background: alpha(theme.palette.background.paper, 1) },
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box>
              <Typography
                variant={isMobile ? 'h6' : 'h5'}
                sx={{
                  color: 'white',
                  fontWeight: 800,
                  textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                }}
              >
                {trip.title}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: alpha('#fff', 0.9),
                  fontWeight: 500,
                  textShadow: '0 1px 5px rgba(0,0,0,0.3)',
                  fontSize: isMobile ? '12px' : '14px',
                }}
              >
                {trip.dates}
              </Typography>
            </Box>
          </Box>
          <CardContent sx={{ padding: isMobile ? '16px' : '20px' }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Chip
                label={trip.status === 'confirmed' ? 'מאושר' : 'בתכנון'}
                color={trip.status === 'confirmed' ? 'success' : 'warning'}
                size="small"
                sx={{ fontWeight: 600, borderRadius: '12px' }}
              />
              <Typography
                variant={isMobile ? 'body1' : 'h6'}
                sx={{ fontWeight: 700, color: theme.palette.primary.main }}
              >
                {trip.budget}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Flight fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {trip.days || 0} ימים
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationOn fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {destinationCount} יעדים
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </motion.div>
  );
};

const QuickStats = ({ user }: { user: User }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const stats = [
    {
      icon: AttachMoney,
      label: 'הוצאות',
      value: `₪${(user.totalSpent || 0).toLocaleString()}`,
      color: theme.palette.success.main,
    },
    {
      icon: LocationOn,
      label: 'מקומות שמורים',
      value: user.savedPlaces || 0,
      color: theme.palette.warning.main,
    },
    {
      icon: Flight,
      label: 'טיולים הושלמו',
      value: user.trips || 0,
      color: theme.palette.info.main,
    },
  ];
  return (
    <Box sx={{ display: 'flex', gap: isMobile ? 1 : 2, mb: 3 }}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            style={{ flex: 1 }}
          >
            <Card
              sx={{
                borderRadius: isMobile ? '16px' : '20px',
                background: `linear-gradient(135deg, ${alpha(
                  stat.color,
                  0.1
                )} 0%, ${alpha(stat.color, 0.05)} 100%)`,
                border: `1px solid ${alpha(stat.color, 0.2)}`,
                padding: isMobile ? '12px' : '16px',
                textAlign: 'center',
                boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
              }}
            >
              <Icon
                sx={{ fontSize: isMobile ? 24 : 32, color: stat.color, mb: 1 }}
              />
              <Typography
                variant={isMobile ? 'body1' : 'h6'}
                sx={{ fontWeight: 700, color: stat.color }}
              >
                {stat.value}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 500, fontSize: isMobile ? '10px' : '11px' }}
              >
                {stat.label}
              </Typography>
            </Card>
          </motion.div>
        );
      })}
    </Box>
  );
};

const HomePage = ({ trips, user, onEditTrip, onAddTrip, onUploadTrip, onViewOnMap, onDeleteTrip }: { trips: Trip[]; user: User; onEditTrip: (trip: Trip) => void; onAddTrip: () => void; onUploadTrip: () => void; onViewOnMap: (tripId: string) => void; onDeleteTrip: (tripId: string) => void; }) => {
  const isMobile = useMediaQuery('(max-width:600px)');
  return (
    <Box sx={{ padding: isMobile ? '16px' : '20px', paddingBottom: '100px' }}>
      <QuickStats user={user} />
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
      <Fab
        color="secondary"
        onClick={onUploadTrip}
        sx={{
          position: 'fixed',
          bottom: 170, 
          right: 20,
          boxShadow: '0 8px 25px rgba(120, 196, 212, 0.4)'
        }}
      >
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

  // --- הוספנו את הלוגיקה לעדכון הריבועים כאן ---
  useEffect(() => {
    if (!tripsData) return;

    const userRef = doc(db, 'users', 'mainUser');

    // 1. חישוב מספר היעדים הכולל
    const totalDestinations = tripsData.reduce((acc, trip) => {
        return acc + (Array.isArray(trip.destinations) ? trip.destinations.length : 0);
    }, 0);

    // 2. חישוב מספר הטיולים המאושרים
    const completedTrips = tripsData.filter(trip => trip.status === 'confirmed').length;

    // 3. עדכון מסד הנתונים
    updateDoc(userRef, {
        savedPlaces: totalDestinations,
        trips: completedTrips
    }).catch(error => console.error("Error updating user stats: ", error));

  }, [tripsData]); // אפקט זה ירוץ בכל פעם שנתוני הטיולים משתנים

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

  const getRandomAmericanImage = () => {
    const images = [
      'https://images.pexels.com/photos/290386/pexels-photo-290386.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/161901/san-francisco-golden-gate-bridge-sunrise-california-161901.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/373924/pexels-photo-373924.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=400'
    ];
    const randomIndex = Math.floor(Math.random() * images.length);
    return images[randomIndex];
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result;
      if (typeof text !== 'string') return;
      try {
        const tripData = JSON.parse(text);
        const newTripData = { ...tripData, image: getRandomAmericanImage(), createdAt: serverTimestamp() };
        
        const newTripRef = await addDoc(collection(db, "trips"), newTripData);
        
        const batch = writeBatch(db);
        const checklistRef = collection(db, 'trips', newTripRef.id, 'checklist');
        defaultChecklistItems.forEach(item => {
          const docRef = doc(checklistRef);
          batch.set(docRef, { ...item, createdAt: serverTimestamp() });
        });
        await batch.commit();

        toast.success("טיול חדש ורשימת משימות נוספו בהצלחה!");
      } catch (error) {
        toast.error("שגיאה בקריאת קובץ ה-JSON.");
        console.error("Error parsing or uploading trip from file:", error);
      }
    };
    reader.readAsText(file);
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleViewTripOnMap = (tripId: string) => {
    setSelectedTripIdForMap(tripId);
    setActiveTab('map');
  };

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
      image: getRandomAmericanImage(),
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
        const newTripRef = await addDoc(collection(db, "trips"), {
          ...newTripData,
          createdAt: serverTimestamp(),
        });

        const batch = writeBatch(db);
        const checklistRef = collection(db, 'trips', newTripRef.id, 'checklist');
        defaultChecklistItems.forEach(item => {
            const docRef = doc(checklistRef);
            batch.set(docRef, { ...item, createdAt: serverTimestamp() });
        });
        await batch.commit();

        toast.success("טיול חדש ורשימת משימות נוצרו בהצלחה!");
      } catch (e) {
        toast.error("שגיאה ביצירת הטיול.");
        console.error("Error adding document: ", e);
      }
    } else {
      const tripRef = doc(db, 'trips', editingTrip.id);
      try {
        const { id, ...dataToUpdate } = editingTrip;
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
  
  const handleGenerateImage = async () => {
    if (!editingTrip || !editingTrip.title) {
        toast.error("אנא הזן שם לטיול תחילה.");
        return;
    }
    setIsGeneratingImage(true);
    try {
        const prompt = `A beautiful, vibrant, picturesque travel photograph of ${editingTrip.title}. Cinematic, detailed, high quality.`;
        const payload = { instances: [{ prompt: prompt }], parameters: { "sampleCount": 1} };
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`שגיאת רשת: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.predictions && result.predictions.length > 0 && result.predictions[0].bytesBase64Encoded) {
            const imageUrl = `data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`;
            setEditingTrip(prev => prev ? { ...prev, image: imageUrl } : null);
            toast.success("תמונה נוצרה בהצלחה!");
        } else {
            throw new Error("לא התקבלה תמונה מה-API.");
        }
    } catch (error) {
        console.error("Error generating image:", error);
        toast.error("שגיאה ביצירת התמונה.");
    } finally {
        setIsGeneratingImage(false);
    }
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
      return <Box>Error loading maps: {loadError.message}</Box>;
    }
    
    switch (activeTab) {
      case 'home':
        return <HomePage trips={tripsData} user={userData} onEditTrip={handleEditTrip} onAddTrip={handleOpenAddTrip} onUploadTrip={handleTriggerUpload} onViewOnMap={handleViewTripOnMap} onDeleteTrip={handleDeleteTrip} />;
      case 'checklist':
        return tripsData.length > 0 ? <Checklist tripId={tripsData[0].id} /> : <Typography sx={{p: 3}}>צור טיול כדי לראות את רשימת המשימות.</Typography>;
      case 'ideas': 
        return <IdeasPage />;
      case 'budget':
        return tripsData.length > 0 && userData ? <BudgetTracker trip={tripsData[0]} user={userData} /> : <Typography sx={{p: 3}}>צור טיול כדי לנהל תקציב.</Typography>;
      case 'profile':
        return <UserProfile user={userData} />;
      case 'map':
        return <MapPage trips={tripsData} selectedTripId={selectedTripIdForMap} setSelectedTripId={setSelectedTripIdForMap} />;
      default:
        return <HomePage trips={tripsData} user={userData} onEditTrip={handleEditTrip} onAddTrip={handleOpenAddTrip} onUploadTrip={handleTriggerUpload} onViewOnMap={handleViewTripOnMap} onDeleteTrip={handleDeleteTrip} />;
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
            <TextField
              label="כתובת תמונה"
              value={editingTrip?.image || ''}
              onChange={(e) => setEditingTrip(prev => prev ? {...prev, image: e.target.value} : null)}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleGenerateImage} disabled={isGeneratingImage}>
                      {isGeneratingImage ? <CircularProgress size={24} /> : <AutoAwesomeIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingTrip(null)}>ביטול</Button>
          <Button onClick={handleSaveTrip} variant="contained">שמור שינויים</Button>
        </DialogActions>
      </Dialog>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        style={{ display: 'none' }}
        accept=".json"
      />
    </Box>
  );
}

export default App;
