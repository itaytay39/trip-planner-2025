import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, OverlayView, DirectionsRenderer } from '@react-google-maps/api';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { Box, Typography, Chip, Paper, IconButton, Rating, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DirectionsIcon from '@mui/icons-material/Directions';
import type { Destination } from '../types';

// Style for the map container
const mapContainerStyle = {
  width: '100%',
  height: '450px', // Increased height for better view
};

// Default center for the map
const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060 // New York City
};

interface GoogleMapComponentProps {
  destinations: Destination[];
  userPosition: { lat: number; lng: number } | null;
  isLiveMode: boolean;
}

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({ destinations, userPosition, isLiveMode }) => {
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Effect to handle marker creation and clustering
  useEffect(() => {
    if (!mapRef.current) return;
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }

    const markers = destinations.map(destination => {
      const marker = new window.google.maps.Marker({
        position: { lat: destination.lat, lng: destination.lng },
        // We'll let the clusterer handle the icon for consistency
      });

      marker.addListener('click', (e: google.maps.MapMouseEvent) => {
        // Stop event propagation to prevent the map's onClick from firing
        e.domEvent.stopPropagation(); 
        setSelectedDestination(destination);
        mapRef.current?.panTo({ lat: destination.lat, lng: destination.lng });
      });
      return marker;
    });

    clustererRef.current = new MarkerClusterer({ map: mapRef.current, markers });

  }, [destinations]);

  // Effect to handle live mode and user position
  useEffect(() => {
    if (userPosition && mapRef.current && isLiveMode) {
      mapRef.current.panTo(userPosition);
      mapRef.current.setZoom(15);
    }
  }, [userPosition, isLiveMode]);
  
  // Effect to calculate and display directions
  useEffect(() => {
    // Only show directions in live mode for a cleaner look
    if (destinations.length < 2 || !isLiveMode) {
      setDirections(null);
      return;
    }
    const directionsService = new window.google.maps.DirectionsService();
    const origin = { lat: destinations[0].lat, lng: destinations[0].lng };
    const destinationPoint = { lat: destinations[destinations.length - 1].lat, lng: destinations[destinations.length - 1].lng };
    const waypoints = destinations.slice(1, -1).map(dest => ({
      location: { lat: dest.lat, lng: dest.lng },
      stopover: true,
    }));

    directionsService.route(
      {
        origin,
        destination: destinationPoint,
        waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
        }
      }
    );
  }, [destinations, isLiveMode]);

  // Helper to get destination type info
  const getDestinationInfo = (type: Destination['type']) => {
    const infoMap = {
      hotel: { color: '#4A90E2', label: 'מלון' },
      restaurant: { color: '#F5A623', label: 'מסעדה' },
      attraction: { color: '#50E3C2', label: 'אטרקציה' },
      transport: { color: '#BD10E0', label: 'תחבורה' },
      other: { color: '#9B9B9B', label: 'אחר' }
    };
    return infoMap[type] || infoMap.other;
  };

  // Function to open Google Maps for navigation
  const handleGetDirections = (destination: Destination) => {
    if(destination) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`, '_blank');
    }
  };

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={defaultCenter}
      zoom={8}
      onLoad={onMapLoad}
      onClick={() => setSelectedDestination(null)} // Click on map to close the infowindow
      options={{
        styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }],
        disableDefaultUI: true,
        zoomControl: true,
        fullscreenControl: true,
        clickableIcons: false,
      }}
    >
      {/* Directions are only rendered when active */}
      {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true, polylineOptions: { strokeColor: '#5E5CE6', strokeWeight: 6, strokeOpacity: 0.9 } }} />}
      
      {/* User's live location marker */}
      {userPosition && (
        <OverlayView position={userPosition} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
          <Box><div className="user-location-pulse"></div><div className="user-location-dot"></div></Box>
        </OverlayView>
      )}

      {/* Custom InfoWindow (OverlayView) */}
      {selectedDestination && (
        <OverlayView
          position={{ lat: selectedDestination.lat, lng: selectedDestination.lng }}
          mapPaneName={OverlayView.FLOAT_PANE}
          getPixelPositionOffset={(width, height) => ({ x: -(width / 2), y: -(height + 25) })} // Position it perfectly above the marker
        >
          <Paper elevation={12} sx={{ width: 290, borderRadius: '20px', overflow: 'hidden', pointerEvents: 'auto', transform: 'translateY(0)', transition: 'transform 0.3s ease' }}>
            {selectedDestination.photos?.[0] && (
                <Box component="img" src={selectedDestination.photos[0]} alt={selectedDestination.name} sx={{ width: '100%', height: '130px', objectFit: 'cover' }} />
            )}
            <Box sx={{ p: 2, position: 'relative', backgroundColor: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(8px)' }}>
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); setSelectedDestination(null); }} sx={{ position: 'absolute', top: 12, left: 12, zIndex: 1, backgroundColor: 'rgba(255,255,255,0.8)' }}><CloseIcon fontSize="small" /></IconButton>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, pr: '30px' }}>{selectedDestination.name}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Chip size="small" label={getDestinationInfo(selectedDestination.type).label} sx={{ backgroundColor: getDestinationInfo(selectedDestination.type).color, color: 'white', fontWeight: 600, fontSize: '12px' }} />
                {selectedDestination.rating && <Rating value={selectedDestination.rating} readOnly size="small" precision={0.5} />}
              </Box>
              {selectedDestination.notes && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{selectedDestination.notes}</Typography>}
              <Button variant="contained" fullWidth startIcon={<DirectionsIcon />} onClick={() => handleGetDirections(selectedDestination)}>ניווט</Button>
            </Box>
          </Paper>
        </OverlayView>
      )}
    </GoogleMap>
  );
};

export default GoogleMapComponent;
