import type { Destination } from '../types';

export interface IdeaCategory {
  category: string;
  points: Destination[];
}

export const newYorkIdeas: IdeaCategory[] = [
  {
    category: "אוכל כשר",
    points: [
      { id: "ny_idea_modern_bagel", name: "Modern Bread and Bagel", type: 'restaurant', lat: 40.7844, lng: -73.9740, notes: "בייגלים ומאפים כשרים, מתאים לארוחת בוקר." },
      { id: "ny_idea_pita_nyc", name: "Pita NYC", type: 'restaurant', lat: 40.7410, lng: -73.9875, notes: "פיתות עם מילויים כשרים כמו פלאפל, סביח וחומוס." },
      { id: "ny_idea_beyond_sushi", name: "Beyond Sushi", type: 'restaurant', lat: 40.7512, lng: -73.9908, notes: "סושי טבעוני וכשר." },
      { id: "ny_idea_shuka", name: "Shuka", type: 'restaurant', lat: 40.7288, lng: -74.0019, notes: "מסעדה ים תיכונית כשרה עם מנות צמחוניות." },
      { id: "ny_idea_izzys_smokehouse", name: "Izzy's Smokehouse", type: 'restaurant', lat: 40.6669, lng: -73.9450, notes: "מסעדת בשרים מעושנים כשרה בברוקלין." },
      { id: "ny_idea_pizza_da_solo", name: "Pizza da Solo", type: 'restaurant', lat: 40.7623, lng: -73.9702, notes: "פיצה כשרה." },
    ]
  },
  {
    category: "אטרקציות חינם",
    points: [
      { id: "ny_idea_staten_island_ferry", name: "מעבורת סטטן איילנד", type: 'attraction', lat: 40.7013, lng: -74.0139, notes: "דרך מצוינת לראות את פסל החירות וקו הרקיע של מנהטן בחינם." },
      { id: "ny_idea_high_line_park", name: "היי ליין", type: 'attraction', lat: 40.7479, lng: -74.0048, notes: "פארק עירוני על מסילת רכבת ישנה. כניסה חופשית." },
       { id: "nyc_brooklyn_bridge_walk", name: "הליכה על גשר ברוקלין", "lat": 40.7061, "lng": -73.9969, "type": "attraction", "notes": "מומלץ לחצות מברוקלין למנהטן לקראת השקיעה." },
    ]
  },
  {
    category: "חוויות ייחודיות",
    points: [
      { id: "ny_idea_broadway_show", name: "מופע ברודוויי", type: 'attraction', lat: 40.7590, lng: -73.9845, notes: "חוויה בלתי נשכחת. ניתן למצוא כרטיסים מוזלים ב-TKTS Booth או באפליקציית TodayTix." },
      { id: "ny_idea_jazz_club", name: "מועדון ג'אז בגריניץ' וילג'", type: 'attraction', lat: 40.7320, lng: -74.0006, notes: "חוויה קלאסית. מקומות כמו Blue Note או Village Vanguard מפורסמים." },
      { id: "ny_idea_brooklyn_flea", name: "שוק פשפשים בברוקלין (Brooklyn Flea)", type: 'attraction', lat: 40.7203, lng: -73.9602, notes: "מומלץ לבדוק אם פתוח בסוף השבוע שבו מבקרים." },
    ]
  },
  {
    category: "מוזיאונים נוספים",
    points: [
      { id: "ny_idea_guggenheim", name: "מוזיאון גוגנהיים", type: 'attraction', lat: 40.7830, lng: -73.9590, notes: "מבנה ארכיטקטוני אייקוני עם תערוכות מתחלפות." }
    ]
  },
  {
    category: "שכונות מומלצות לשיטוט",
    points: [
        { id: "ny_idea_soho", name: "שכונת SoHo", type: 'attraction', lat: 40.7233, lng: -74.0016, notes: "שכונה הידועה בקניות, גלריות וארכיטקטורה יפה." },
        { id: "ny_idea_east_village", name: "שכונת East Village", type: 'attraction', lat: 40.7268, lng: -73.9826, notes: "אווירה בוהמית, חנויות יד שנייה וברים." }
    ]
  }
];