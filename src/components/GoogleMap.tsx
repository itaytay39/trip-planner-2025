import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Marker, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';
import { Box, Typography, Card, CardContent, Chip, Divider } from '@mui/material';
import type { Destination } from '../types';

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '16px'
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060 // ניו יורק כברירת מחדל
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
    }
  }, [destinations]);

  useEffect(() => {
    if (!showDirections || destinations.length < 2) {
      setDirections(null);
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();
    const origin = destinations[0];
    const destination = destinations[destinations.length - 1];
    const waypoints = destinations.slice(1, -1).map(dest => ({
      location: { lat: dest.lat, lng: dest.lng },
      stopover: true
    }));

    directionsService.route(
      {
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
        } else {
          console.error(`error fetching directions ${result}`);
        }
      }
    );
  }, [destinations, showDirections]);

  const getMarkerIcon = (type: Destination['type']) => {
    const iconMap = {
      hotel: '🏨',
      restaurant: '🍽️',
      attraction: '🎯',
      transport: '🚌'
    };
    return iconMap[type] || '📍';
  };

  const getTypeColor = (type: Destination['type']) => {
    const colorMap = {
      hotel: '#2196F3',
      restaurant: '#FF9800',
      attraction: '#4CAF50',
      transport: '#9C27B0'
    };
    return colorMap[type] || '#757575';
  };

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={destinations.length > 0 ? { lat: destinations[0].lat, lng: destinations[0].lng } : defaultCenter}
      zoom={12}
      onLoad={onMapLoad}
      options={{
        styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }],
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
      }}
    >
      {destinations.map((destination) => (
        <Marker
          key={destination.id}
          position={{ lat: destination.lat, lng: destination.lng }}
          onClick={() => setSelectedDestination(destination)}
          icon={{
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
              <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="${getTypeColor(destination.type)}" stroke="white" stroke-width="3"/>
                <text x="20" y="26" text-anchor="middle" font-size="16" fill="white">${getMarkerIcon(destination.type)}</text>
              </svg>
            `)}`,
            scaledSize: new window.google.maps.Size(40, 40),
          }}
        />
      ))}

      {selectedDestination && (
        <InfoWindow
          position={{ lat: selectedDestination.lat, lng: selectedDestination.lng }}
          onCloseClick={() => setSelectedDestination(null)}
        >
          {/* --- שינינו את תוכן הבועה --- */}
          <Box sx={{ minWidth: 220, p: 0.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
              {selectedDestination.name}
            </Typography>
            <Chip 
              size="small" 
              label={selectedDestination.type === 'hotel' ? 'מלון' : 
                    selectedDestination.type === 'restaurant' ? 'מסעדה' :
                    selectedDestination.type === 'attraction' ? 'אטרקציה' : 'תחבורה'}
              sx={{ backgroundColor: getTypeColor(selectedDestination.type), color: 'white', mb: 1.5 }}
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
                  <strong>הערות:</strong> {selectedDestination.notes}
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
              strokeColor: '#1976d2',
              strokeWeight: 5,
              strokeOpacity: 0.8,
            },
            suppressMarkers: true,
          }}
        />
      )}
    </GoogleMap>
  );
};

export default GoogleMapComponent;