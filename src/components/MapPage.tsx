import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import GoogleMapComponent from './GoogleMap';
import PlaceSearch from './PlaceSearch';
import type { Trip, Destination } from '../types';

// 1. שינינו את ה-props שהרכיב מקבל
interface MapPageProps {
  trips: Trip[];
  selectedTripId: string;
  setSelectedTripId: (id: string) => void;
}

const MapPage: React.FC<MapPageProps> = ({ trips, selectedTripId, setSelectedTripId }) => {
  
  // 2. הסרנו את ניהול המצב הפנימי. הרכיב עכשיו מקבל את המידע מבחוץ

  const handleTripChange = (event: SelectChangeEvent) => {
    setSelectedTripId(event.target.value as string);
  };

  const destinationsToShow = useMemo(() => {
    if (selectedTripId === 'all') {
      return trips.flatMap((trip) => trip.destinations || []);
    }
    const selectedTrip = trips.find(trip => trip.id === selectedTripId);
    return selectedTrip?.destinations || [];
  }, [selectedTripId, trips]);

  return (
    <Box sx={{ padding: '20px', paddingBottom: '100px' }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
        מפת הטיולים שלי
      </Typography>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel id="select-trip-label">בחר טיול להצגה</InputLabel>
        {/* 3. ה-Select עכשיו משתמש ב-props שהגיעו מבחוץ */}
        <Select
          labelId="select-trip-label"
          id="select-trip"
          value={selectedTripId}
          label="בחר טיול להצגה"
          onChange={handleTripChange}
        >
          <MenuItem value="all">הצג הכל</MenuItem>
          {trips.map((trip) => (
            <MenuItem key={trip.id} value={trip.id}>
              {trip.title}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Card sx={{ borderRadius: '20px', overflow: 'hidden', mb: 3 }}>
        <CardContent sx={{ padding: '16px !important' }}>
          <GoogleMapComponent
            destinations={destinationsToShow}
            showDirections={selectedTripId !== 'all'}
          />
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: '20px' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            חפש מקום חדש
          </Typography>
          <PlaceSearch
            onPlaceSelect={(place) => console.log('Selected place:', place)}
            placeholder="חפש יעד לטיול הבא..."
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default MapPage;