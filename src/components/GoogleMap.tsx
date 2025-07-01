import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, OverlayView, DirectionsRenderer, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { Box, Typography, Chip, Paper, IconButton, Rating, Button, useTheme, useMediaQuery, Card, CardContent, Avatar } from '@mui/material';
import { LocationOn, Star, AccessTime, DirectionsWalk, Close as CloseIcon } from '@mui/icons-material';
import type { Destination } from '../types';
import { alpha } from '@mui/material/styles';

const mapContainerStyle = { width: '100%', height: '450px' };
const defaultCenter = { lat: 40.7128, lng: -74.0060 };

interface GoogleMapComponentProps {
  destinations: Destination[];
  userPosition: { lat: number; lng: number } | null;
  showRoute: boolean; // New prop to control route visibility
}

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({ destinations, userPosition, showRoute }) => {
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Effect for creating and managing markers and clusters
  useEffect(() => {
    if (!mapRef.current) return;
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }

    const markers = destinations.map(destination => {
      const marker = new window.google.maps.Marker({
        position: { lat: destination.lat, lng: destination.lng }
      });
      marker.addListener('click', (e: google.maps.MapMouseEvent) => {
        e.domEvent.stopPropagation();
        setSelectedDestination(destination);
        mapRef.current?.panTo({ lat: destination.lat, lng: destination.lng });
      });
      return marker;
    });

    clustererRef.current = new MarkerClusterer({ map: mapRef.current, markers });

  }, [destinations]);

  // Effect for calculating and displaying directions when `showRoute` is true
  useEffect(() => {
    if (!showRoute || destinations.length < 2) {
      setDirections(null);
      // Fit map to markers if route is hidden
      if (mapRef.current && destinations.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        destinations.forEach(dest => bounds.extend(dest));
        mapRef.current.fitBounds(bounds);
      }
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
      { origin, destination: destinationPoint, waypoints, travelMode: window.google.maps.TravelMode.DRIVING },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          // Auto-fit map to the entire route
          if (mapRef.current && result.routes[0]?.bounds) {
            mapRef.current.fitBounds(result.routes[0].bounds);
          }
        }
      }
    );
  }, [destinations, showRoute]);

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

  const handleGetDirections = (destination: Destination) => {
    if (destination) window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`, '_blank');
  };

  const renderInfoWindow = () => {
    if (!selectedDestination) return null;

    return (
      <InfoWindow
        position={{ 
          lat: selectedDestination.lat, 
          lng: selectedDestination.lng 
        }}
        onCloseClick={() => setSelectedDestination(null)}
        options={{
          pixelOffset: new window.google.maps.Size(0, -40),
          maxWidth: isMobile ? 300 : 350,
          disableAutoPan: false
        }}
      >
        <Box sx={{ 
          width: isMobile ? '280px' : '320px',
          maxWidth: '90vw',
          overflow: 'hidden'
        }}>
          <Card elevation={0} sx={{ 
            borderRadius: '16px',
            border: 'none',
            boxShadow: 'none'
          }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              {/* כותרת עם סגירה */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                justifyContent: 'space-between',
                mb: 2
              }}>
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 700,
                      fontSize: isMobile ? '1.1rem' : '1.25rem',
                      lineHeight: 1.2,
                      color: 'text.primary',
                      mb: 0.5
                    }}
                  >
                    {selectedDestination.name}
                  </Typography>
                  
                  {selectedDestination.address && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'text.secondary',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}
                    >
                      <LocationOn sx={{ fontSize: '16px' }} />
                      {selectedDestination.address}
                    </Typography>
                  )}
                </Box>
                
                <IconButton 
                  size="small"
                  onClick={() => setSelectedDestination(null)}
                  sx={{ 
                    ml: 1,
                    color: 'text.secondary',
                    '&:hover': { 
                      backgroundColor: alpha(theme.palette.grey[500], 0.1) 
                    }
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>

              {/* תיאור */}
              {selectedDestination.notes && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mb: 2, 
                    color: 'text.primary',
                    lineHeight: 1.5
                  }}
                >
                  {selectedDestination.notes}
                </Typography>
              )}

              {/* תוויות מידע */}
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 1, 
                mb: 2 
              }}>
                <Chip 
                  label={getDestinationInfo(selectedDestination.type).label}
                  size="small"
                  color="primary"
                  sx={{ 
                    height: '24px',
                    fontSize: '0.75rem',
                    fontWeight: 500
                  }}
                />
                
                {selectedDestination.estimatedTime && (
                  <Chip 
                    icon={<AccessTime sx={{ fontSize: '14px' }} />}
                    label={`${selectedDestination.estimatedTime} שעות`}
                    size="small"
                    sx={{ 
                      height: '24px',
                      fontSize: '0.75rem',
                      backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                      color: theme.palette.secondary.main
                    }}
                  />
                )}
                
                {selectedDestination.rating && (
                  <Chip 
                    icon={<Star sx={{ fontSize: '14px' }} />}
                    label={selectedDestination.rating.toFixed(1)}
                    size="small"
                    sx={{ 
                      height: '24px',
                      fontSize: '0.75rem',
                      backgroundColor: alpha(theme.palette.warning.main, 0.1),
                      color: theme.palette.warning.main
                    }}
                  />
                )}
              </Box>

              {/* פעולות */}
              <Box sx={{ 
                display: 'flex', 
                gap: 1,
                justifyContent: 'flex-end'
              }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<DirectionsWalk />}
                  onClick={() => handleGetDirections(selectedDestination)}
                  sx={{ 
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    textTransform: 'none'
                  }}
                >
                  הוראות הגעה
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </InfoWindow>
    );
  };

  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={8}
        onLoad={onMapLoad}
        onClick={() => setSelectedDestination(null)}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: !isMobile,
          styles: [
            { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }],
            { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] }],
          ]
        }}
      >
        {directions && showRoute && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true, polylineOptions: { strokeColor: '#5D5FEF', strokeWeight: 6, strokeOpacity: 0.9 } }} />}
        
        {userPosition && (
          <OverlayView position={userPosition} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
            <Box><div className="user-location-pulse"></div><div className="user-location-dot"></div></Box>
          </OverlayView>
        )}

        {renderInfoWindow()}
      </GoogleMap>
    </LoadScript>
  );
};

export default GoogleMapComponent;

