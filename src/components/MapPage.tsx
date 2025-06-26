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
  MenuItem
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  Delete,
  LocationOn,
  AccessTime,
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
  };

  const findSuggestedIdeas = async () => {
    if (!currentTrip) {
        toast.error("אנא בחר טיול ספציפי כדי לקבל הצעות.");
        return;
    }

    setIsFindingSuggestions(true);
    setSuggestedIdeas([]);
    toast.loading('חושב על רעיונות חדשים בשבילך...');

    const existingDestinationNames = destinations.map(d => d.name).join(', ');
    const prompt = `
      Based on a trip titled "${currentTrip.title}" which already includes these destinations: ${existingDestinationNames}.
      Please suggest 5 new, interesting, and relevant points of interest (attractions, restaurants, or hotels) that are not in the existing list.
      Provide the response as a valid JSON array of objects. Each object must have the following fields: "id" (a unique string), "name" (string), "lat" (number), "lng" (number), "type" (one of 'attraction', 'restaurant', 'hotel'), and "notes" (a short, helpful description in Hebrew).
    `;

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY; // שימוש במשתנה סביבה
      if (!apiKey) {
        throw new Error("מפתח ה-API של Gemini אינו מוגדר.");
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      if (!response.ok) throw new Error('שגיאה בתקשורת עם שירות ה-AI');
      
      const data = await response.json();
      const jsonString = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
      const ideas = JSON.parse(jsonString);

      setSuggestedIdeas(ideas);
      toast.dismiss();
      toast.success(`מצאתי ${ideas.length} רעיונות חדשים!`);

    } catch (error) {
        console.error("Error fetching suggestions:", error);
        toast.dismiss();
        toast.error((error as Error).message || "לא הצלחתי למצוא הצעות כרגע.");
    } finally {
        setIsFindingSuggestions(false);
    }
  };

  const handleAddDestination = async (newDestination: Destination) => {
    const tripToUpdate = currentTrip || (trips.length > 0 ? trips[0] : null);
    if (!tripToUpdate) {
        toast.error("צור טיול תחילה כדי להוסיף לו יעדים.");
        return;
    }
    
    const tripRef = doc(db, 'trips', tripToUpdate.id);
    try {
      await updateDoc(tripRef, { destinations: arrayUnion(newDestination) });
      setSuggestedIdeas(prevIdeas => prevIdeas.filter(idea => idea.id !== newDestination.id));
      toast.success(`יעד חדש נוסף לטיול "${tripToUpdate.title}"!`);
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

  const getDestinationIcon = (type: Destination['type']) => {
    const iconMap = { hotel: '🏨', restaurant: '🍽️', attraction: '🎯', transport: '🚌' };
    return iconMap[type] || '📍';
  };
  
  const getTypeLabel = (type: Destination['type']) => {
    const labelMap = { hotel: 'מלון', restaurant: 'מסעדה', attraction: 'אטרקציה', transport: 'תחבורה' };
    return labelMap[type] || 'אחר';
  };

  return (
    <Box sx={{ padding: '20px', paddingBottom: '100px' }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
        מפת הטיולים שלי
      </Typography>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>בחר טיול להצגה</InputLabel>
        <Select value={selectedTripId} label="בחר טיול להצגה" onChange={handleTripChange}>
          <MenuItem value="all">הצג הכל</MenuItem>
          {trips.map((trip) => (
            <MenuItem key={trip.id} value={trip.id}>
              {trip.title}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Card sx={{ borderRadius: '20px', mb: 3, overflow: 'hidden' }}>
        <GoogleMapComponent destinations={destinations} showDirections={selectedTripId !== 'all'} />
      </Card>

      <Card sx={{ borderRadius: '20px', mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>הוסף יעד חדש למסלול</Typography>
          <PlaceSearch onPlaceSelect={handleAddDestination} placeholder="חפש והוסף מקום..."/>
        </CardContent>
      </Card>
      
      <Card sx={{ borderRadius: '20px', mb: 3 }}>
        <CardContent sx={{textAlign: 'center'}}>
          <Button 
                variant="contained" 
                startIcon={isFindingSuggestions ? <CircularProgress size={20} color="inherit" /> : <IdeasIcon />}
                onClick={findSuggestedIdeas}
                disabled={isFindingSuggestions} // הכפתור יהיה לא פעיל רק בזמן חיפוש
            >
            מצא לי רעיונות חדשים
          </Button>
        </CardContent>
      </Card>
      
      {isFindingSuggestions && (
          <Box sx={{display: 'flex', justifyContent: 'center', my: 2}}>
              <CircularProgress />
          </Box>
      )}

      {suggestedIdeas.length > 0 && (
        <Card sx={{ borderRadius: '20px', mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>הצעות למסלול</Typography>
            <List>
              {suggestedIdeas.map((idea) => (
                <ListItem key={idea.id} divider>
                  <ListItemIcon sx={{ fontSize: '24px' }}>
                    {getDestinationIcon(idea.type)}
                  </ListItemIcon>
                  <ListItemText primary={idea.name} secondary={idea.notes} />
                  <ListItemSecondaryAction>
                    <IconButton color="primary" onClick={() => handleAddDestination(idea)}>
                      <Add />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {currentTrip && (
        <Card sx={{ borderRadius: '20px' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>יעדים במסלול: {currentTrip.title}</Typography>
              <List>
                {destinations.map((destination, index) => (
                  <ListItem key={destination.id} sx={{ borderRadius: '12px', mb: 1, backgroundColor: 'grey.50', border: '1px solid', borderColor: 'divider' }}>
                    <ListItemIcon>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, minWidth: '20px' }}>{index + 1}</Typography>
                        <Typography sx={{ fontSize: '20px' }}>{getDestinationIcon(destination.type)}</Typography>
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{destination.name}</Typography><Chip label={getTypeLabel(destination.type)} size="small" color={getTypeColor(destination.type)}/></Box>}
                      secondary={destination.notes}
                    />
                    <ListItemSecondaryAction>
                        <IconButton size="small" color="error" onClick={() => handleDeleteDestination(destination)}>
                          <Delete />
                        </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default MapPage;
