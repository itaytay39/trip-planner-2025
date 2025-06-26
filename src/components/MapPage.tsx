import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  alpha
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  Delete,
  Add,
  AutoAwesome as IdeasIcon
} from '@mui/icons-material';
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
  const [suggestedIdeas, setSuggestedIdeas] = useState<Destination[]>([]);
  const [isFindingSuggestions, setIsFindingSuggestions] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const trip = trips.find(t => t.id === selectedTripId);
    if (trip) {
      setCurrentTrip(trip);
      setDestinations(trip.destinations || []);
    } else {
      setCurrentTrip(null);
      // When "Show All" is selected, flatMap all destinations from all trips
      const allDestinations = trips.flatMap(t => t.destinations || []);
      setDestinations(allDestinations);
    }
    setSuggestedIdeas([]); // Clear suggestions when trip changes
  }, [selectedTripId, trips]);

  const handleTripChange = (event: SelectChangeEvent) => {
    setSelectedTripId(event.target.value as string);
  };

  const findSuggestedIdeas = async () => {
    if (!currentTrip) return;

    setIsFindingSuggestions(true);
    setSuggestedIdeas([]);
    const toastId = toast.loading('חושב על רעיונות חדשים בשבילך...');

    const existingDestinationNames = destinations.map(d => d.name).join(', ');
    const prompt = `
      Based on a trip titled "${currentTrip.title}" in the USA, which already includes these destinations: ${existingDestinationNames}.
      Please suggest 5 new, interesting, and relevant points of interest (attractions, restaurants, or hotels) near the existing destinations. They must NOT be in the existing list.
      Provide the response as a valid JSON array of objects. Each object must have "id" (a unique string), "name" (string), "lat" (number), "lng" (number), "address" (string, if available), "type" ('attraction', 'restaurant', or 'hotel'), and "notes" (a short, helpful description in Hebrew).
    `;

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("מפתח ה-API של Gemini אינו מוגדר.");

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      if (!response.ok) throw new Error('שגיאה בתקשורת עם שירות ה-AI');
      
      const data = await response.json();
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

  const handleAddDestination = async (newDestination: Destination) => {
    const tripToUpdate = currentTrip || (selectedTripId === 'all' && trips.length > 0 ? trips[0] : null);
    
    if (!tripToUpdate) {
        toast.error("צור טיול תחילה או בחר טיול ספציפי כדי להוסיף לו יעדים.");
        return;
    }
    
    const tripRef = doc(db, 'trips', tripToUpdate.id);
    try {
      await updateDoc(tripRef, { destinations: arrayUnion(newDestination) });
      setSuggestedIdeas(prevIdeas => prevIdeas.filter(idea => idea.id !== newDestination.id));
      toast.success(`"${newDestination.name}" נוסף לטיול "${tripToUpdate.title}"!`);
    } catch (e) {
      console.error("Error adding destination: ", e);
      toast.error('שגיאה בהוספת היעד');
    }
  };

  const handleDeleteDestination = async (destinationToDelete: Destination) => {
    if (!currentTrip) return;

    const tripRef = doc(db, 'trips', currentTrip.id);
    try {
      await updateDoc(tripRef, { destinations: arrayRemove(destinationToDelete) });
      toast.success('היעד נמחק מהמסלול!');
    } catch (e) {
      console.error("Error deleting destination: ", e);
      toast.error('שגיאה במחיקת היעד');
    }
  };

  const getDestinationInfo = (type: Destination['type']) => {
    const infoMap = {
      hotel: { icon: '🏨', color: 'primary' as const, label: 'מלון' },
      restaurant: { icon: '🍽️', color: 'warning' as const, label: 'מסעדה' },
      attraction: { icon: '🎯', color: 'success' as const, label: 'אטרקציה' },
      transport: { icon: '🚌', color: 'secondary' as const, label: 'תחבורה' },
      other: { icon: '📍', color: 'default' as const, label: 'אחר' }
    };
    return infoMap[type] || infoMap.other;
  };

  return (
    <Box sx={{ padding: '20px', paddingBottom: '100px' }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
        מפת הטיולים שלי
      </Typography>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>בחר טיול להצגה</InputLabel>
        <Select value={selectedTripId} label="בחר טיול להצגה" onChange={handleTripChange}>
          <MenuItem value="all">הצג את כל היעדים</MenuItem>
          {trips.map((trip) => (
            <MenuItem key={trip.id} value={trip.id}>
              {trip.title}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Card sx={{ borderRadius: '24px', mb: 3, overflow: 'hidden' }}>
        <GoogleMapComponent destinations={destinations} showDirections={selectedTripId !== 'all'} />
      </Card>
      
      {currentTrip && (
        <>
          <Card sx={{ borderRadius: '24px', mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>יעדים במסלול: {currentTrip.title}</Typography>
              <List sx={{p: 0}}>
                {destinations.map((destination, index) => {
                  const info = getDestinationInfo(destination.type);
                  return (
                  <ListItem key={destination.id} sx={{ borderRadius: '16px', mb: 1, p: 1.5, backgroundColor: alpha(theme.palette.grey[500], 0.05)}}>
                    <ListItemIcon sx={{minWidth: 'auto', mr: 2, display: 'flex', alignItems: 'center', gap: 1.5}}>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>{index + 1}</Typography>
                      <Typography sx={{ fontSize: '24px' }}>{info.icon}</Typography>
                    </ListItemIcon>
                    <ListItemText
                      primary={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{destination.name}</Typography><Chip label={info.label} size="small" color={info.color}/></Box>}
                      secondary={destination.notes}
                    />
                    <ListItemSecondaryAction>
                        <IconButton size="small" color="error" onClick={() => handleDeleteDestination(destination)}>
                          <Delete />
                        </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                )})}
              </List>
            </CardContent>
          </Card>
          
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
        </>
      )}

      {isFindingSuggestions && (
          <Box sx={{display: 'flex', justifyContent: 'center', my: 2}}>
              <CircularProgress />
          </Box>
      )}

      {suggestedIdeas.length > 0 && (
        <Card sx={{ borderRadius: '24px', mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>הצעות למסלול</Typography>
            <List>
              {suggestedIdeas.map((idea) => {
                const info = getDestinationInfo(idea.type);
                return (
                <ListItem key={idea.id} divider>
                  <ListItemIcon sx={{ fontSize: '24px', minWidth: 'auto', mr: 2 }}>
                    {info.icon}
                  </ListItemIcon>
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
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>הוסף יעד חדש</Typography>
          <PlaceSearch onPlaceSelect={handleAddDestination} placeholder="חפש והוסף מקום..."/>
        </CardContent>
      </Card>

    </Box>
  );
};

export default MapPage;

