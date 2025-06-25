import React, { useState, useRef } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { TextField, Box, IconButton } from '@mui/material';
import { Search, Add } from '@mui/icons-material';
import type { Destination } from '../types';

interface PlaceSearchProps {
  onPlaceSelect: (place: Destination) => void;
  placeholder?: string;
}

const PlaceSearch: React.FC<PlaceSearchProps> = ({ onPlaceSelect, placeholder = "חפש מקום..." }) => {
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const onLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      
      if (place.geometry && place.geometry.location) {
        const newDestination: Destination = {
          id: place.place_id || Date.now().toString(),
          name: place.name || place.formatted_address || 'מקום לא ידוע',
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          type: determineType(place.types || []),
          notes: place.formatted_address || ''
        };
        
        onPlaceSelect(newDestination);
        setSearchValue(''); // נקה את תיבת החיפוש
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      }
    }
  };

  const determineType = (types: string[]): Destination['type'] => {
    if (types.includes('lodging')) return 'hotel';
    if (types.includes('restaurant') || types.includes('food')) return 'restaurant';
    if (types.includes('transit_station') || types.includes('bus_station')) return 'transport';
    return 'attraction';
  };

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
        <TextField
          inputRef={inputRef}
          fullWidth
          placeholder={placeholder}
          variant="outlined"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />,
            endAdornment: (
              <IconButton size="small" color="primary" onClick={onPlaceChanged}>
                <Add />
              </IconButton>
            ),
            sx: {
              borderRadius: '16px',
              backgroundColor: 'background.paper',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'divider',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
              },
            }
          }}
        />
      </Autocomplete>
    </Box>
  );
};

export default PlaceSearch;
