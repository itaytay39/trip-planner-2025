import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Marker, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';
import { Box, Typography, Chip, Divider, alpha } from '@mui/material';
import type { Destination } from '../types';

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060 // New York as default
};

interface GoogleMapComponentProps {
  destinations: Destination[];
  showDirections?: boolean;
}

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({ 
  destinations, 
  showDirections = false 
}) => {
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  useEffect(() => {
    if (mapRef.current && destinations.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      destinations.forEach(dest => {
        bounds.extend({ lat: dest.lat, lng: dest.lng });
      });
      mapRef.current.fitBounds(bounds);

      // אם יש רק נקודה אחת, קבע זום הגיוני
      if (destinations.length === 1) {
          mapRef.current.setZoom(12);
      }

    }
  }, [destinations]);

  useEffect(() => {
    if (!showDirections || destinations.length < 2) {
      setDirections(null);
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();
    const origin = { lat: destinations[0].lat, lng: destinations[0].lng };
    const destination = { lat: destinations[destinations.length - 1].lat, lng: destinations[destinations.length - 1].lng };
    const waypoints = destinations.slice(1, -1).map(dest => ({
      location: { lat: dest.lat, lng: dest.lng },
      stopover: true
    }));

    directionsService.route(
      {
        origin,
        destination,
        waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
        } else {
          console.error(`Error fetching directions: ${status}`);
        }
      }
    );
  }, [destinations, showDirections]);

  const getDestinationInfo = (type: Destination['type']) => {
    const infoMap = {
      hotel: { icon: '🏨', color: '#2196F3', label: 'מלון' },
      restaurant: { icon: '🍽️', color: '#FF9800', label: 'מסעדה' },
      attraction: { icon: '🎯', color: '#4CAF50', label: 'אטרקציה' },
      transport: { icon: '🚌', color: '#9C27B0', label: 'תחבורה' },
      other: { icon: '📍', color: '#757575', label: 'אחר' }
    };
    return infoMap[type] || infoMap.other;
  };
  
  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={defaultCenter}
      zoom={8}
      onLoad={onMapLoad}
      options={{
        styles: [
            {
                "featureType": "poi",
                "elementType": "labels",
                "stylers": [{ "visibility": "off" }]
            },
            {
                "featureType": "transit",
                "elementType": "labels.icon",
                "stylers": [{ "visibility": "off" }]
            }
        ],
        disableDefaultUI: true,
        zoomControl: true,
        streetViewControl: true,
        mapTypeControl: false,
        fullscreenControl: true,
      }}
    >
      {!directions && destinations.map((destination) => {
        const info = getDestinationInfo(destination.type);
        return (
          <Marker
            key={destination.id}
            position={{ lat: destination.lat, lng: destination.lng }}
            onClick={() => setSelectedDestination(destination)}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: info.color,
              fillOpacity: 1,
              strokeColor: 'white',
              strokeWeight: 2,
            }}
            label={{
                text: info.icon,
                fontSize: "16px",
                color: 'white'
            }}
          />
        );
      })}

      {selectedDestination && (
        <InfoWindow
          position={{ lat: selectedDestination.lat, lng: selectedDestination.lng }}
          onCloseClick={() => setSelectedDestination(null)}
        >
          <Box sx={{ minWidth: 240, p: 0.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
              {selectedDestination.name}
            </Typography>
            <Chip 
              size="small" 
              label={getDestinationInfo(selectedDestination.type).label}
              sx={{ 
                backgroundColor: getDestinationInfo(selectedDestination.type).color, 
                color: 'white', 
                fontWeight: 500,
                mb: 1.5 
              }}
            />
            {selectedDestination.address && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <strong>כתובת:</strong> {selectedDestination.address}
              </Typography>
            )}
            {selectedDestination.notes && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {selectedDestination.notes}
                </Typography>
              </>
            )}
          </Box>
        </InfoWindow>
      )}

      {directions && (
        <DirectionsRenderer
          directions={directions}
          options={{
            polylineOptions: {
              strokeColor: '#007BFF',
              strokeWeight: 6,
              strokeOpacity: 0.8,
            },
            suppressMarkers: false, // מציג את המרקורים של ההתחלה והסוף
          }}
        />
      )}
    </GoogleMap>
  );
};

export default GoogleMapComponent;

