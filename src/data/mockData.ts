import { Trip, BudgetItem, User } from '../types';

export const userData: User = {
  name: "יוסי כהן", // ודא שהשם נמצא בתוך מרכאות
  avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150",
  level: "מטייל מנוסה",
  trips: 12,
  totalSpent: 45000,
  savedPlaces: 23
};

export const tripsData: Trip[] = [
  {
    id: "1", // שונה למחרוזת כדי להתאים לטיפוס
    title: "ניו יורק, ארה\"ב",
    dates: "15-19 מרץ 2025",
    image: "https://images.pexels.com/photos/290386/pexels-photo-290386.jpeg?auto=compress&cs=tinysrgb&w=400",
    budget: "₪12,500",
    days: 4,
    status: "confirmed",
    destinations: [
      {
        id: "1",
        name: "מלון Pod Times Square",
        lat: 40.7589,
        lng: -73.9851,
        type: "hotel",
        estimatedCost: 3000,
        notes: "מלון מודרני בטיימס סקוור"
      },
      {
        id: "2",
        name: "פארק סנטרל",
        lat: 40.7829,
        lng: -73.9654,
        type: "attraction",
        estimatedCost: 0,
        notes: "הפארק המפורסם של ניו יורק"
      },
      {
        id: "3",
        name: "מוזיאון המטרופוליטן",
        lat: 40.7794,
        lng: -73.9632,
        type: "attraction",
        estimatedCost: 150,
        notes: "אחד המוזיאונים הגדולים בעולם"
      },
      {
        id: "4",
        name: "ברודווי",
        lat: 40.7590,
        lng: -73.9845,
        type: "attraction",
        estimatedCost: 500,
        notes: "הצגות ברודווי מפורסמות"
      },
      {
        id: "5",
        name: "פיצה ג'ו'ס",
        lat: 40.7505,
        lng: -73.9934,
        type: "restaurant",
        estimatedCost: 80,
        notes: "פיצה ניו יורקית אותנטית"
      },
      {
        id: "6",
        name: "פסל החירות",
        lat: 40.6892,
        lng: -74.0445,
        type: "attraction",
        estimatedCost: 100,
        notes: "סמל ניו יורק המפורסם"
      },
      {
        id: "7",
        name: "גשר ברוקלין",
        lat: 40.7061,
        lng: -73.9969,
        type: "attraction",
        estimatedCost: 0,
        notes: "הליכה על הגשר ההיסטורי"
      }
    ]
  },
  {
    id: "2", // שונה למחרוזת כדי להתאים לטיפוס
    title: "בולטימור למיין",
    dates: "13-21 יולי 2025",
    image: "https://images.pexels.com/photos/1450360/pexels-photo-1450360.jpeg?auto=compress&cs=tinysrgb&w=400",
    budget: "₪18,200",
    days: 8,
    status: "planning",
    destinations: [
      {
        id: "8",
        name: "מלון Harbor East",
        lat: 39.2904,
        lng: -76.6122,
        type: "hotel",
        estimatedCost: 2500,
        notes: "מלון יוקרה בבולטימור"
      },
      {
        id: "9",
        name: "אקווריום הלאומי",
        lat: 39.2851,
        lng: -76.6083,
        type: "attraction",
        estimatedCost: 200,
        notes: "אקווריום מרשים עם כרישים"
      },
      {
        id: "10",
        name: "פורט מקהנרי",
        lat: 39.2639,
        lng: -76.5802,
        type: "attraction",
        estimatedCost: 50,
        notes: "מקום לידת הדגל האמריקני"
      },
      {
        id: "11",
        name: "בוסטון",
        lat: 42.3601,
        lng: -71.0589,
        type: "attraction",
        estimatedCost: 1500,
        notes: "עיר היסטורית עם שביל החירות"
      },
      {
        id: "12",
        name: "פורטלנד, מיין",
        lat: 43.6591,
        lng: -70.2568,
        type: "attraction",
        estimatedCost: 1200,
        notes: "עיר נמל יפה עם אוכל ים טרי"
      },
      {
        id: "13",
        name: "אקדיה נשיונל פארק",
        lat: 44.3386,
        lng: -68.2733,
        type: "attraction",
        estimatedCost: 300,
        notes: "פארק לאומי עם נופים מדהימים"
      }
    ]
  }
];

export const budgetData: BudgetItem[] = [
  {
    id: "1",
    category: "transport",
    title: "טיסה לניו יורק",
    amount: 4200,
    date: "2025-03-15",
    tripId: "1" // שונה למחרוזת
  },
  {
    id: "2",
    category: "accommodation",
    title: "מלון בניו יורק - 4 לילות",
    amount: 3000,
    date: "2025-03-15",
    tripId: "1" // שונה למחרוזת
  },
  {
    id: "3",
    category: "food",
    title: "ארוחות בניו יורק",
    amount: 2000,
    date: "2025-03-15",
    tripId: "1" // שונה למחרוזת
  },
  {
    id: "4",
    category: "activities",
    title: "כניסות ופעילויות",
    amount: 1500,
    date: "2025-03-15",
    tripId: "1" // שונה למחרוזת
  },
  {
    id: "5",
    category: "transport",
    title: "השכרת רכב בולטימור-מיין",
    amount: 2800,
    date: "2025-07-13",
    tripId: "2" // שונה למחרוזת
  }
];
