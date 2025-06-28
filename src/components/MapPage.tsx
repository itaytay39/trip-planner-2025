import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, Card, CardContent, List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction, IconButton, Chip, Button, CircularProgress, FormControl, InputLabel, Select, MenuItem, useTheme, alpha, Fab } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { Delete, Add, AutoAwesome as IdeasIcon, Navigation as NavigationIcon, Stop as StopIcon } from '@mui/icons-material';
import GoogleMapComponent from './GoogleMap';
import PlaceSearch from './PlaceSearch';
import type { Destination, Trip } from '../types';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import toast from 'react-hot-toast';

interface MapPageProps {
  trips: Trip[];
  selectedTripId: string;
  setSelectedTripId: (id: string) => void;
}

const MapPage: React.FC<MapPageProps> = ({ trips, selectedTripId, setSelectedTripId }) => {
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [suggestedIdeas, setSuggestedIdeas] = useState<Destination[]>([]);
  const [isFindingSuggestions, setIsFindingSuggestions] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const theme = useTheme();

  useEffect(() => {
    const trip = trips.find(t => t.id === selectedTripId);
    if (trip) {
      setCurrentTrip(trip);
      setDestinations(trip.destinations || []);
    } else {
      setCurrentTrip(null);
      const allDestinations = trips.flatMap(t => t.destinations || []);
      setDestinations(allDestinations);
    }
    setSuggestedIdeas([]);
  }, [selectedTripId, trips]);

  const handleTripChange = (event: SelectChangeEvent) => {
    setSelectedTripId(event.target.value as string);
    if (isLiveMode) toggleLiveMode(); // Turn off live mode when changing trip
  };

  const toggleLiveMode = () => {
    if (isLiveMode) {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsLiveMode(false);
      setUserPosition(null);
      toast('מצב ניווט חי הופסק.');
    } else {
      if (!navigator.geolocation) {
        toast.error('שירותי מיקום אינם נתמכים בדפדפן זה.');
        return;
      }
      const toastId = toast.loading('מנסה לאתר את המיקום שלך...');
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          toast.dismiss(toastId);
          if (!isLiveMode) toast.success('המיקום שלך נמצא!');
          setUserPosition({ lat: position.coords.latitude, lng: position.coords.longitude });
          setIsLiveMode(true);
        },
        () => {
          toast.dismiss(toastId);
          toast.error('לא ניתן היה לקבל את המיקום. ודא שאישרת הרשאות.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };
  
  const findSuggestedIdeas = async () => {
    if (!currentTrip) return;
    setIsFindingSuggestions(true);
    setSuggestedIdeas([]);
    const toastId = toast.loading('חושב על רעיונות חדשים בשבילך...');
    const existingDestinationNames = destinations.map(d => d.name).join(', ');
    const prompt = `Based on a trip titled "${currentTrip.title}" in the USA, which already includes these destinations: ${existingDestinationNames}, suggest 5 new and relevant points of interest (attractions, restaurants, or hotels) nearby. Provide the response as a valid JSON array of objects. Each object must have "id", "name", "lat", "lng", "address", "type" ('attraction', 'restaurant', or 'hotel'), and "notes" (in Hebrew).`;

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("מפתח ה-API של Gemini אינו מוגדר.");
      const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const requestBody = { contents: [{ parts: [{ text: prompt }] }] };
      const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
      if (!response.ok) throw new Error(`שגיאה בתקשורת עם שירות ה-AI. קוד: ${response.status}`);
      const data = await response.json();
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) throw new Error("תגובה לא תקינה מה-AI.");
      const rawText = data.candidates[0].content.parts[0].text;
      const jsonString = rawText.replace(/```json|```/g, '').trim();
      const ideas = JSON.parse(jsonString);
      setSuggestedIdeas(ideas);
      toast.success(`מצאתי ${ideas.length} רעיונות חדשים!`, { id: toastId });
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      toast.error((error as Error).message || "לא הצלחתי למצוא הצעות כרגע.", { id: toastId });
    } finally {
      setIsFindingSuggestions(false);
    }
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    }
  }, []);
  
  const handleAddDestination = async (newDestination: Destination) => {
    const tripToUpdate = currentTrip || (selectedTripId === 'all' && trips.length > 0 ? trips[0] : null);
    if (!tripToUpdate) {
        toast.error("צור טיול תחילה או בחר טיול ספציפי כדי להוסיף לו יעדים.");
        return;
    }
    const tripRef = doc(db, 'trips', tripToUpdate.id);
    await updateDoc(tripRef, { destinations: arrayUnion(newDestination) });
    setSuggestedIdeas(prevIdeas => prevIdeas.filter(idea => idea.id !== newDestination.id));
    toast.success(`"${newDestination.name}" נוסף לטיול "${tripToUpdate.title}"!`);
  };

  const handleDeleteDestination = async (destinationToDelete: Destination) => {
    if (!currentTrip) return;
    const tripRef = doc(db, 'trips', currentTrip.id);
    await updateDoc(tripRef, { destinations: arrayRemove(destinationToDelete) });
    toast.success('היעד נמחק מהמסלול!');
  };

  const getDestinationInfo = (type: Destination['type']) => {
    const infoMap = {
      hotel: { color: 'primary' as const, label: 'מלון' }, restaurant: { color: 'warning' as const, label: 'מסעדה' },
      attraction: { color: 'success' as const, label: 'אטרקציה' }, transport: { color: 'secondary' as const, label: 'תחבורה' },
      other: { color: 'default' as const, label: 'אחר' }
    };
    return infoMap[type] || infoMap.other;
  };

  return (
    <Box sx={{ padding: '20px', paddingBottom: '100px' }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>מפת הטיולים שלי</Typography>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>בחר טיול להצגה</InputLabel>
        <Select value={selectedTripId} label="בחר טיול להצגה" onChange={handleTripChange}>
          <MenuItem value="all">הצג את כל היעדים</MenuItem>
          {trips.map((trip) => <MenuItem key={trip.id} value={trip.id}>{trip.title}</MenuItem>)}
        </Select>
      </FormControl>

      <Card sx={{ borderRadius: '24px', mb: 3, overflow: 'hidden', position: 'relative' }}>
        <GoogleMapComponent destinations={destinations} userPosition={userPosition} isLiveMode={isLiveMode} />
        {currentTrip && (
            <Fab 
                color={isLiveMode ? "secondary" : "primary"}
                variant="extended"
                onClick={toggleLiveMode}
                sx={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10 }}
            >
                {isLiveMode ? <StopIcon sx={{ mr: 1 }} /> : <NavigationIcon sx={{ mr: 1 }} />}
                {isLiveMode ? 'הפסק ניווט' : 'התחל ניווט חי'}
            </Fab>
        )}
      </Card>
      
      {currentTrip && (
        <>
          <Card sx={{ borderRadius: '24px', mb: 3, textAlign: 'center' }}>
            <CardContent>
              <Button 
                variant="contained" 
                startIcon={isFindingSuggestions ? <CircularProgress size={20} color="inherit" /> : <IdeasIcon />}
                onClick={findSuggestedIdeas}
                disabled={isFindingSuggestions || !currentTrip}
              >
                מצא לי רעיונות חדשים
              </Button>
            </CardContent>
          </Card>
          
          {suggestedIdeas.length > 0 && (
            <Card sx={{ borderRadius: '24px', mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>הצעות למסלול</Typography>
                <List>
                  {suggestedIdeas.map((idea) => {
                    const info = getDestinationInfo(idea.type);
                    return (
                    <ListItem key={idea.id} divider>
                      <ListItemText primary={idea.name} secondary={idea.notes} />
                      <ListItemSecondaryAction>
                        <IconButton color="primary" onClick={() => handleAddDestination(idea)} title={`הוסף ${idea.name} למסלול`}>
                          <Add />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  )})}
                </List>
              </CardContent>
            </Card>
          )}

          <Card sx={{ borderRadius: '24px', mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>יעדים במסלול: {currentTrip.title}</Typography>
              <List sx={{p: 0}}>
                {destinations.map((destination, index) => {
                  const info = getDestinationInfo(destination.type);
                  return (
                  <ListItem key={destination.id} sx={{ borderRadius: '16px', mb: 1, p: 1.5, backgroundColor: alpha(theme.palette.grey[500], 0.05)}}>
                    <ListItemIcon sx={{minWidth: 'auto', mr: 2}}>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>{index + 1}</Typography>
                    </ListItemIcon>
                    <ListItemText
                      primary={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{destination.name}</Typography><Chip label={info.label} size="small" color={info.color}/></Box>}
                      secondary={destination.notes}
                    />
                    <ListItemSecondaryAction>
                        <IconButton size="small" color="error" onClick={() => handleDeleteDestination(destination)}><Delete /></IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  )})}
              </List>
            </CardContent>
          </Card>
        </>
      )}

       <Card sx={{ borderRadius: '24px', mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>הוסף יעד חדש</Typography>
          <PlaceSearch onPlaceSelect={handleAddDestination} placeholder="חפש והוסף מקום..."/>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MapPage;