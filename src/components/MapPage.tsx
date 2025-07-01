import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction, IconButton, Chip, Button, CircularProgress, FormControl, InputLabel, Select, MenuItem, useTheme, alpha } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { Delete, Add, AutoAwesome as IdeasIcon, Route as RouteIcon, WrongLocation as HideRouteIcon } from '@mui/icons-material';
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
  const [userPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [showRoute, setShowRoute] = useState(false); // Controls route visibility
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
      const allDestinations = trips.flatMap(t => t.destinations || []);
      setDestinations(allDestinations);
    }
    setSuggestedIdeas([]);
    setShowRoute(false); // Reset route view when trip changes
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
    const prompt = `Based on a trip titled "${currentTrip.title}", which already includes these destinations: ${existingDestinationNames}, suggest 5 new and relevant points of interest. Provide the response as a valid JSON array of objects. Each object must have "id", "name", "lat", "lng", "type", and "notes" in Hebrew.`;

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("מפתח API של Gemini אינו מוגדר.");
      const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const requestBody = { contents: [{ parts: [{ text: prompt }] }] };
      const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
      if (!response.ok) throw new Error(`שגיאה ב-AI. קוד: ${response.status}`);
      const data = await response.json();
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) throw new Error("תגובה לא תקינה מה-AI.");
      const rawText = data.candidates[0].content.parts[0].text;
      const jsonString = rawText.replace(/```json|```/g, '').trim();
      const ideas = JSON.parse(jsonString);
      setSuggestedIdeas(ideas);
      toast.success(`מצאתי ${ideas.length} רעיונות חדשים!`, { id: toastId });
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      toast.error((error as Error).message || "לא הצלחתי למצוא הצעות.", { id: toastId });
    } finally {
      setIsFindingSuggestions(false);
    }
  };

  const handleAddDestination = async (newDestination: Destination) => {
    const tripToUpdate = currentTrip || (selectedTripId === 'all' && trips.length > 0 ? trips[0] : null);
    if (!tripToUpdate) {
        toast.error("בחר טיול כדי להוסיף לו יעדים.");
        return;
    }
    const tripRef = doc(db, 'trips', tripToUpdate.id);
    await updateDoc(tripRef, { destinations: arrayUnion(newDestination) });
    setSuggestedIdeas(prevIdeas => prevIdeas.filter(idea => idea.id !== newDestination.id));
    toast.success(`"${newDestination.name}" נוסף לטיול!`);
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
    <Box sx={{ p: {xs: 2, sm: 3}, paddingBottom: '120px' }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>מפת הטיולים</Typography>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>בחר טיול להצגה</InputLabel>
        <Select value={selectedTripId} label="בחר טיול להצגה" onChange={handleTripChange}>
          <MenuItem value="all">הצג את כל היעדים</MenuItem>
          {trips.map((trip) => <MenuItem key={trip.id} value={trip.id}>{trip.title}</MenuItem>)}
        </Select>
      </FormControl>

      <Card sx={{ borderRadius: 5, mb: 3, overflow: 'hidden', position: 'relative' }}>
        <GoogleMapComponent destinations={destinations} userPosition={userPosition} showRoute={showRoute} />
      </Card>
      
      <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}, gap: 2, mb: 3}}>
        {currentTrip && (
            <Button
                variant="contained"
                startIcon={showRoute ? <HideRouteIcon /> : <RouteIcon />}
                onClick={() => setShowRoute(!showRoute)}
                color={showRoute ? "secondary" : "primary"}
                sx={{py: 1.5, borderRadius: 3}}
            >
                {showRoute ? 'הסתר מסלול' : 'הצג מסלול על המפה'}
            </Button>
        )}
        {currentTrip && (
            <Button 
                variant="outlined" 
                startIcon={isFindingSuggestions ? <CircularProgress size={20} color="inherit" /> : <IdeasIcon />}
                onClick={findSuggestedIdeas}
                disabled={isFindingSuggestions || !currentTrip}
                sx={{py: 1.5, borderRadius: 3}}
            >
                מצא לי רעיונות
            </Button>
        )}
      </Box>

      {suggestedIdeas.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>הצעות למסלול</Typography>
            <List>
              {suggestedIdeas.map((idea) => (
                <ListItem key={idea.id} divider>
                  <ListItemText primary={idea.name} secondary={idea.notes} />
                  <ListItemSecondaryAction>
                    <IconButton color="primary" onClick={() => handleAddDestination(idea)} title={`הוסף ${idea.name} למסלול`}>
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
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>יעדים במסלול: {currentTrip.title}</Typography>
            <List sx={{p: 0}}>
              {destinations.map((destination, index) => {
                const info = getDestinationInfo(destination.type);
                return (
                <ListItem key={destination.id} sx={{ borderRadius: 3, mb: 1, p: 1.5, backgroundColor: alpha(theme.palette.grey[500], 0.05)}}>
                  <ListItemIcon sx={{minWidth: 'auto', mr: 2}}>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main' }}>{index + 1}</Typography>
                  </ListItemIcon>
                  <ListItemText
                    primary={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{destination.name}</Typography><Chip label={info.label} size="small" color={info.color}/></Box>}
                    secondary={destination.notes}
                  />
                  <ListItemSecondaryAction>
                      <IconButton size="small" color="error" onClick={() => handleDeleteDestination(destination)} sx={{p: 1.5}}><Delete /></IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                )})}
            </List>
          </CardContent>
        </Card>
      )}

       <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>הוסף יעד חדש</Typography>
          <PlaceSearch onPlaceSelect={handleAddDestination} placeholder="חפש והוסף מקום..."/>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MapPage;
