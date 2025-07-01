import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';
import type { Destination } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, 
  Typography, 
  Chip, 
  IconButton, 
  useTheme, 
  useMediaQuery, 
  Card, 
  CardContent, 
  Avatar, 
  Button,
  alpha,
  Rating
} from '@mui/material';
import { 
  LocationOn, 
  Star, 
  AccessTime, 
  DirectionsWalk, 
  Close as CloseIcon,
  Navigation,
  Phone,
  Language as WebIcon,
  Restaurant,
  Hotel,
  AttractionsOutlined,
  DirectionsBus
} from '@mui/icons-material';

interface GoogleMapProps {
  destinations: Destination[];
  center: { lat: number; lng: number };
  zoom?: number;
  onMapLoad?: (map: google.maps.Map) => void;
  route?: google.maps.DirectionsResult | null;
  setRoute?: (route: google.maps.DirectionsResult | null) => void;
}

const GoogleMapComponent: React.FC<GoogleMapProps> = ({ 
  destinations, 
  center, 
  zoom = 10, 
  onMapLoad, 
  route, 
  setRoute 
}) => {
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    if (onMapLoad) onMapLoad(mapInstance);
  }, [onMapLoad]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const getCategoryInfo = (category?: string) => {
    const categoryMap = {
      hotel: { 
        icon: Hotel, 
        color: '#2196F3', 
        label: 'מלון',
        bgColor: 'rgba(33, 150, 243, 0.1)'
      },
      restaurant: { 
        icon: Restaurant, 
        color: '#FF5722', 
        label: 'מסעדה',
        bgColor: 'rgba(255, 87, 34, 0.1)'
      },
      attraction: { 
        icon: AttractionsOutlined, 
        color: '#4CAF50', 
        label: 'אטרקציה',
        bgColor: 'rgba(76, 175, 80, 0.1)'
      },
      transport: { 
        icon: DirectionsBus, 
        color: '#FF9800', 
        label: 'תחבורה',
        bgColor: 'rgba(255, 152, 0, 0.1)'
      }
    };
    
    return categoryMap[category as keyof typeof categoryMap] || {
      icon: LocationOn,
      color: '#9C27B0',
      label: 'אחר',
      bgColor: 'rgba(156, 39, 176, 0.1)'
    };
  };

  const renderModernInfoWindow = () => {
    if (!selectedDestination) return null;

    const categoryInfo = getCategoryInfo(selectedDestination.category);
    const IconComponent = categoryInfo.icon;

    return (
      <InfoWindow
        position={{ 
          lat: selectedDestination.latitude, 
          lng: selectedDestination.longitude 
        }}
        onCloseClick={() => setSelectedDestination(null)}
        options={{
          pixelOffset: new window.google.maps.Size(0, -40),
          maxWidth: isMobile ? 320 : 380,
          disableAutoPan: false
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ 
            duration: 0.3, 
            ease: [0.25, 0.46, 0.45, 0.94] 
          }}
        >
          <Card
            elevation={0}
            sx={{
              width: isMobile ? 300 : 360,
              borderRadius: '20px',
              overflow: 'hidden',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha('#ffffff', 0.3)}`,
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: `linear-gradient(90deg, ${categoryInfo.color}, ${alpha(categoryInfo.color, 0.6)})`,
                borderRadius: '20px 20px 0 0'
              }
            }}
          >
            {/* כותרת עם אייקון */}
            <Box
              sx={{
                background: `linear-gradient(135deg, ${categoryInfo.bgColor}, ${alpha(categoryInfo.color, 0.05)})`,
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}
            >
              <Avatar
                sx={{
                  background: `linear-gradient(135deg, ${categoryInfo.color}, ${alpha(categoryInfo.color, 0.8)})`,
                  width: 48,
                  height: 48,
                  boxShadow: `0 8px 24px ${alpha(categoryInfo.color, 0.3)}`
                }}
              >
                <IconComponent sx={{ color: 'white', fontSize: 24 }} />
              </Avatar>
              
              <Box sx={{ flex: 1 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 700,
                    color: 'text.primary',
                    fontSize: isMobile ? '1.1rem' : '1.25rem',
                    lineHeight: 1.2,
                    mb: 0.5
                  }}
                >
                  {selectedDestination.name}
                </Typography>
                
                <Chip 
                  label={categoryInfo.label}
                  size="small"
                  sx={{ 
                    height: '24px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: `linear-gradient(135deg, ${categoryInfo.color}, ${alpha(categoryInfo.color, 0.8)})`,
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px'
                  }}
                />
              </Box>

              <IconButton
                size="small"
                onClick={() => setSelectedDestination(null)}
                sx={{
                  background: alpha('#000', 0.05),
                  '&:hover': { background: alpha('#000', 0.1) }
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            <CardContent sx={{ padding: '20px' }}>
              {/* כתובת */}
              {selectedDestination.address && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                  <LocationOn 
                    sx={{ 
                      color: categoryInfo.color, 
                      fontSize: 18, 
                      mt: 0.2 
                    }} 
                  />
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'text.secondary',
                      fontSize: '0.875rem',
                      lineHeight: 1.4
                    }}
                  >
                    {selectedDestination.address}
                  </Typography>
                </Box>
              )}

              {/* תיאור */}
              {selectedDestination.description && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'text.primary',
                    mb: 3,
                    fontSize: '0.875rem',
                    lineHeight: 1.5
                  }}
                >
                  {selectedDestination.description}
                </Typography>
              )}

              {/* מידע נוסף */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                {selectedDestination.rating && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Rating 
                      value={selectedDestination.rating} 
                      size="small" 
                      readOnly 
                      precision={0.5}
                    />
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                      ({selectedDestination.rating})
                    </Typography>
                  </Box>
                )}
                
                {selectedDestination.estimatedTime && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                      {selectedDestination.estimatedTime}ש' מוערך
                    </Typography>
                  </Box>
                )}

                {selectedDestination.cost && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ color: categoryInfo.color, fontWeight: 700 }}>
                      ₪{selectedDestination.cost}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* כפתורי פעולה */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Navigation />}
                  onClick={() => handleGetDirections(selectedDestination)}
                  sx={{
                    borderRadius: '16px',
                    textTransform: 'none',
                    fontWeight: 600,
                    background: `linear-gradient(135deg, ${categoryInfo.color}, ${alpha(categoryInfo.color, 0.8)})`,
                    boxShadow: `0 4px 16px ${alpha(categoryInfo.color, 0.3)}`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${alpha(categoryInfo.color, 0.9)}, ${categoryInfo.color})`,
                      boxShadow: `0 6px 20px ${alpha(categoryInfo.color, 0.4)}`
                    }
                  }}
                >
                  נווט
                </Button>

                {selectedDestination.notes && (
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{
                      borderRadius: '16px',
                      textTransform: 'none',
                      fontWeight: 600,
                      borderColor: alpha(categoryInfo.color, 0.3),
                      color: categoryInfo.color,
                      '&:hover': {
                        borderColor: categoryInfo.color,
                        background: alpha(categoryInfo.color, 0.05)
                      }
                    }}
                  >
                    פרטים נוספים
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </InfoWindow>
    );
  };

  const handleGetDirections = (destination: Destination) => {
    if (destination) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`, 
        '_blank'
      );
    }
  };

  const createCustomMarker = (destination: Destination) => {
    const categoryInfo = getCategoryInfo(destination.category);
    
    return {
      path: 'M12,2C8.13,2 5,5.13 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9C19,5.13 15.87,2 12,2Z',
      fillColor: categoryInfo.color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 1.5,
      anchor: new google.maps.Point(12, 22)
    };
  };

  return (
    <GoogleMap
      mapContainerStyle={{
        width: '100%',
        height: '100%',
        borderRadius: isMobile ? '16px' : '20px',
        overflow: 'hidden'
      }}
      center={center}
      zoom={zoom}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: !isMobile,
        styles: [
          { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
          { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
          { 
            featureType: "water", 
            stylers: [{ color: "#a2daf2" }] 
          },
          { 
            featureType: "landscape", 
            stylers: [{ color: "#f5f5f5" }] 
          },
          { 
            featureType: "road", 
            elementType: "geometry", 
            stylers: [{ color: "#ffffff" }] 
          }
        ]
      }}
    >
      <AnimatePresence>
        {destinations.map((destination) => (
          <Marker
            key={destination.id}
            position={{ lat: destination.latitude, lng: destination.longitude }}
            icon={createCustomMarker(destination)}
            onClick={() => setSelectedDestination(destination)}
            animation={google.maps.Animation.DROP}
            title={destination.name}
          />
        ))}
      </AnimatePresence>

      {selectedDestination && renderModernInfoWindow()}

      {route && <DirectionsRenderer directions={route} />}
    </GoogleMap>
  );
};

export default GoogleMapComponent;

