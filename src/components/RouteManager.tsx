import React, { useState, useEffect, useMemo } from 'react';
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
  CircularProgress
} from '@mui/material';
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

interface RouteManagerProps {
  trip: Trip;
}

const RouteManager: React.FC<RouteManagerProps> = ({ trip }) => {
  const [destinations, setDestinations] = useState<Destination[]>(trip.destinations || []);
  const [suggestedIdeas, setSuggestedIdeas] = useState<Destination[]>([]);
  const [isFindingSuggestions, setIsFindingSuggestions] = useState(false);

  useEffect(() => {
    setDestinations(trip.destinations || []);
  }, [trip]);

  const findSuggestedIdeas = async () => {
    setIsFindingSuggestions(true);
    setSuggestedIdeas([]);
    toast.loading('חושב על רעיונות חדשים בשבילך...');

    const existingDestinationNames = destinations.map(d => d.name).join(', ');
    const prompt = `
      Based on a trip titled "${trip.title}" which already includes these destinations: ${existingDestinationNames}.
      Please suggest 5 new, interesting, and relevant points of interest (attractions, restaurants, or hotels) that are not in the existing list.
      Provide the response as a valid JSON array of objects. Each object must have the following fields: "id" (a unique string), "name" (string), "lat" (number), "lng" (number), "type" (one of 'attraction', 'restaurant', 'hotel'), and "notes" (a short, helpful description in Hebrew).
      Example format: [{"id": "new_idea_1", "name": "Example Place", "lat": 40.7128, "lng": -74.0060, "type": "attraction", "notes": "תיאור קצר בעברית."}]
    `;

    try {
      // --- התיקון כאן: השארנו רק את המפתח והסרנו את הבדיקה המיותרת ---
      const apiKey = "AIzaSyCXbcvYbcWtt38KZQEhnYZ3oeUWxX-zmozuk"; 

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      if (!response.ok) {
          throw new Error('שגיאה בתקשורת עם שירות ה-AI');
      }

      const data = await response.json();
      const jsonString = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
      const ideas = JSON.parse(jsonString);

      setSuggestedIdeas(ideas);
      toast.dismiss();
      toast.success(`מצאתי ${ideas.length} רעיונות חדשים!`);

    } catch (error) {
        console.error("Error fetching suggestions:", error);
        toast.dismiss();
        toast.error("לא הצלחתי למצוא הצעות כרגע.");
    } finally {
        setIsFindingSuggestions(false);
    }
  };


  const handleAddDestination = async (newDestination: Destination) => {
    if (!trip || !trip.id) {
        toast.error("לא ניתן להוסיף יעד לטיול לא קיים.");
        return;
    }
    const tripRef = doc(db, 'trips', trip.id);
    try {
      const destinationToAdd = { ...newDestination };
      await updateDoc(tripRef, {
        destinations: arrayUnion(destinationToAdd)
      });
      setSuggestedIdeas(prevIdeas => prevIdeas.filter(idea => idea.id !== newDestination.id));
      toast.success('יעד חדש נוסף למסלול!');
    } catch (e) {
      console.error("Error adding destination: ", e);
      toast.error('שגיאה בהוספת היעד');
    }
  };

  const handleDeleteDestination = async (destinationToDelete: Destination) => {
    if (!trip || !trip.id) return;
    const tripRef = doc(db, 'trips', trip.id);
    try {
      await updateDoc(tripRef, {
        destinations: arrayRemove(destinationToDelete)
      });
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
  
  const getTypeColor = (type: Destination['type']) => {
    const colorMap = { hotel: 'primary', restaurant: 'warning', attraction: 'success', transport: 'secondary' };
    return colorMap[type] as 'primary' | 'warning' | 'success' | 'secondary' | 'default' || 'default';
  };
  
  const totalEstimatedCost = Array.isArray(destinations) 
    ? destinations.reduce((sum, dest) => sum + (dest.estimatedCost || 0), 0)
    : 0;

  return (
    <Box sx={{ padding: '20px', paddingBottom: '100px' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          מסלול: {trip.title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip icon={<LocationOn />} label={`${destinations.length} יעדים`} size="small" />
          <Chip icon={<AccessTime />} label={`${trip.days || 0} ימים`} size="small" />
          {totalEstimatedCost > 0 && <Chip label={`₪${totalEstimatedCost.toLocaleString()}`} size="small" color="primary" />}
        </Box>
      </Box>

      <Card sx={{ borderRadius: '20px', mb: 3, overflow: 'hidden' }}>
        <GoogleMapComponent destinations={destinations} showDirections={true} />
      </Card>

      <Card sx={{ borderRadius: '20px', mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>הוסף יעד חדש</Typography>
          <PlaceSearch onPlaceSelect={handleAddDestination} placeholder="חפש מקום להוספה למסלול..."/>
        </CardContent>
      </Card>
      
      <Card sx={{ borderRadius: '20px', mb: 3 }}>
        <CardContent sx={{textAlign: 'center'}}>
           <Button 
                variant="contained" 
                startIcon={isFindingSuggestions ? <CircularProgress size={20} color="inherit" /> : <IdeasIcon />}
                onClick={findSuggestedIdeas}
                disabled={isFindingSuggestions}
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
                  <ListItemText
                    primary={idea.name}
                    secondary={idea.notes}
                  />
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

      <Card sx={{ borderRadius: '20px' }}>
        <CardContent>
           <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>יעדים במסלול</Typography>
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
    </Box>
  );
};

export default RouteManager;