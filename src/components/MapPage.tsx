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
      // אם "הכל" נבחר, הצג את כל היעדים מכל הטיולים
      const allDestinations = trips.flatMap(t => t.destinations || []);
      setDestinations(allDestinations);
    }
    setSuggestedIdeas([]); // איפוס הצעות במעבר בין טיולים
  }, [selectedTripId, trips]);

  const handleTripChange = (event: SelectChangeEvent) => {
    setSelectedTripId(event.target.value as string);
  };

  const findSuggestedIdeas = async () => {
    if (!currentTrip) return;

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
      const apiKey = "YOUR_GEMINI_API_KEY_HERE"; // <-- הדבק כאן את מפתח ה-API שלך
      if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
        throw new Error("אנא הגדר מפתח API של Gemini");
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
    if (!currentTrip || !currentTrip.id) return;
    
    const tripRef = doc(db, 'trips', currentTrip.id);
    try {
      await updateDoc(tripRef, { destinations: arrayUnion(newDestination) });
      setSuggestedIdeas(prevIdeas => prevIdeas.filter(idea => idea.id !== newDestination.id));
      toast.success('יעד חדש נוסף למסלול!');
    } catch (e) {
      console.error("Error adding destination: ", e);
      toast.error('שגיאה בהוספת היעד');
    }
  };

  const handleDeleteDestination = async (destinationToDelete: Destination) => {
    if (!currentTrip || !currentTrip.id) return;

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
  
  return (
    <Box sx={{ padding: '20px', paddingBottom: '100px' }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
        מפת הטיולים שלי
      </Typography>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>בחר טיול
