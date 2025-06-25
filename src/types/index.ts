// src/types/index.ts

// ===================================
// טיפוסים מרכזיים של המידע (Data Models)
// ===================================

export interface User {
  id?: string;
  name: string;
  email?: string;
  avatar?: string;
  level?: string;
  trips?: number;
  totalSpent?: number;
  savedPlaces?: number;
  preferences?: {
    currency: string;
    language: string;
    notifications: boolean;
  };
}

export interface Destination {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description?: string;
  type: 'hotel' | 'restaurant' | 'attraction' | 'transport';
  rating?: number;
  photos?: string[];
  address?: string;
  placeId?: string;
  estimatedCost?: number;
  notes?: string;
}

export interface Trip {
  id: string;
  title: string;
  description?: string;
  image?: string;
  dates?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  destinations: Destination[];
  budget: string;
  currency?: string;
  participants?: string[];
  status: 'planning' | 'active' | 'completed' | 'confirmed';
  createdAt?: any;
  updatedAt?: any;
  days?: number;
}

export interface BudgetItem {
  id: string;
  tripId?: string;
  category: 'transport' | 'accommodation' | 'food' | 'activities' | 'shopping' | 'other';
  title: string;
  amount: number;
  currency?: string;
  date: string;
  description?: string;
}

export interface ChecklistItem {
  id: string;
  tripId?: string;
  text: string;
  completed: boolean;
  category?: 'documents' | 'packing' | 'booking' | 'preparation' | 'other';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date;
  notes?: string;
  createdAt?: any;
}

export interface Route {
  id: string;
  tripId: string;
  name: string;
  waypoints: Destination[];
  distance?: number;
  duration?: number;
  transportMode: 'driving' | 'walking' | 'transit' | 'bicycling';
}

// ===================================
// טיפוסים עבור מאפיינים של קומפוננטות (Component Props)
// ===================================

export interface PlaceSearchProps {
  onPlaceSelect: (place: Destination) => void;
  placeholder?: string;
}

export interface GoogleMapProps {
  destinations: Destination[];
  showDirections?: boolean;
  center?: { lat: number; lng: number };
  zoom?: number;
  route?: any;
  setRoute?: (route: any) => void;
  onMapLoad?: (map: any) => void;
}
