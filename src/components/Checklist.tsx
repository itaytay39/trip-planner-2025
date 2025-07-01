 import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Card, CardContent, Typography, List, ListItem, Checkbox, TextField, Button, IconButton, LinearProgress, ListItemText, CircularProgress, Collapse, ListItemButton, ListItemIcon } from '@mui/material';
import { Add, Delete, ExpandLess, ExpandMore } from '@mui/icons-material';
import type { ChecklistItem } from '../types';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp, writeBatch } from 'firebase/firestore';
import toast from 'react-hot-toast';

// --- רשימת הציוד המורחבת והמקיפה ---
const defaultChecklistCategories = {
  "מסמכים וכסף (חובה!)": [
    { text: "דרכון בתוקף (לפחות לחצי שנה קדימה)" },
    { text: "ויזה / אישור ESTA מודפס (עותק פיזי ועותק בטלפון/ענן)" },
    { text: "רישיון נהיגה ישראלי ובינלאומי (אם שוכרים רכב)" },
    { text: "כרטיסי טיסה ואישורי הזמנה (מלונות, רכב, אטרקציות)" },
    { text: "ביטוח נסיעות מודפס עם מספרי חירום" },
    { text: "צילום של כל המסמכים החשובים (בענן ובטלפון)" },
    { text: "דולרים במזומן (לטיפים והוצאות קטנות)" },
    { text: "כרטיסי אשראי בינלאומיים (לפחות שניים, למקרה שאחד לא עובד)" },
  ],
  "אלקטרוניקה ומטענים": [
    { text: "טלפון נייד ומטען" },
    { text: "מטען נייד (Power Bank) חזק + כבל" },
    { text: "אוזניות (רצוי מבטלות רעשים לטיסה)" },
    { text: "מתאם חשמל אוניברסלי (לא רק לארה\"ב)" },
    { text: "מפצל חשמל (כדי להטעין כמה מכשירים משקע אחד)" },
    { text: "מטען לרכב (אם שוכרים רכב)" },
    { text: "מצלמה, סוללות נוספות, כרטיס זיכרון ומטען" },
  ],
  "ביגוד והנעלה (לכל מזג אוויר)": [
    { text: "תחתונים וגרביים (כמות לימי הטיול + 2 ספייר)" },
    { text: "חולצות קצרות נושמות" },
    { text: "חולצות ארוכות" },
    { text: "סוודר פליז / קפוצ'ון חם" },
    { text: "מכנסיים ארוכים נוחים (ג'ינס / אחר)" },
    { text: "מעיל גשם/רוח קל ומתקפל" },
    { text: "בגד ים" },
    { text: "בגדי שינה / פיג'מה" },
    { text: "בגדי ספורט (אם מתכננים)" },
    { text: "נעלי הליכה נוחות שכבר נעלת בעבר" },
    { text: "כפכפים / סנדלים למלון ולמקלחת" },
  ],
  "כלי רחצה, בריאות ועזרה ראשונה": [
    { text: "תיק רחצה עם וו תלייה" },
    { text: "מברשת ומשחת שיניים" },
    { text: "דאודורנט" },
    { text: "שמפו, סבון, מרכך (בבקבוקי טיסה קטנים)" },
    { text: "קרם הגנה (גם אם לא קיץ)" },
    { text: "אלכוג'ל / מגבונים לחים" },
    { text: "תרופות אישיות עם מרשם (בתיק העלייה למטוס!)" },
    { text: "אישור רופא באנגלית לתרופות מרשם (למקרה הצורך)" },
    { text: "ערכת עזרה ראשונה קטנה (פלסטרים, חומר חיטוי, משחה אנטיביוטית)" },
    { text: "משככי כאבים ואיבופרופן" },
    { text: "כדורים נגד בחילות (לטיסה או לנסיעות ארוכות)" },
    { text: "תרסיס נגד יתושים (תלוי באזור ובמהות הטיול)" },
  ],
  "פריטים קטנים אבל חשובים": [
    { text: "משקפי שמש וכובע" },
    { text: "תיק גב קטן ונוח לטיולי יום" },
    { text: "בקבוק מים רב פעמי (לחסוך כסף ולשמור על הסביבה)" },
    { text: "כרית צוואר, מסכת שינה ואטמי אוזניים לטיסה" },
    { text: "שקיות וואקום/דחיסה (כדי לחסוך מקום במזוודה)" },
    { text: "שקית נפרדת לכביסה מלוכלכת" },
    { text: "עט (למילוי טפסי הגירה במטוס)" },
    { text: "ספר / קינדל / מגזין לטיסות והמתנות" },
    { text: "מנעול קטן למזוודה או ללוקר" },
  ]
};


interface ChecklistProps {
  tripId: string;
}

const Checklist: React.FC<ChecklistProps> = ({ tripId }) => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [loading, setLoading] = useState(true);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});



  const populateDefaultChecklist = useCallback(async () => {
    if (!tripId) return;
    const checklistCollectionRef = collection(db, 'trips', tripId, 'checklist');
    const batch = writeBatch(db);
    
    Object.entries(defaultChecklistCategories).forEach(([category, catItems]) => {
        catItems.forEach(item => {
            const docRef = doc(checklistCollectionRef);
            batch.set(docRef, {
                text: item.text,
                category: category,
                completed: false,
                createdAt: serverTimestamp()
            });
        });
    });

    await batch.commit();
    toast.success('רשימת ציוד מקיפה נוספה לטיול!');
  }, [tripId]);

  useEffect(() => {
    if (!tripId) {
        setLoading(false);
        return;
    }

    setLoading(true);
    const checklistCollectionRef = collection(db, 'trips', tripId, 'checklist');
    const q = query(checklistCollectionRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty && !loading) { // Run only once if empty
        await populateDefaultChecklist();
      } else {
        const fetchedItems = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as ChecklistItem[];
        setItems(fetchedItems);

        // Intelligently set initial state for categories
        if (Object.keys(openCategories).length === 0 && fetchedItems.length > 0) {
            const initialCategories: Record<string, boolean> = {};
            fetchedItems.forEach(item => {
                if (item.category) {
                    initialCategories[item.category] = true; // Default to open
                }
            });
            setOpenCategories(initialCategories);
        }
        setLoading(false);
      }
    }, (error) => {
      console.error("Error fetching checklist:", error);
      toast.error("שגיאה בטעינת המשימות");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tripId, populateDefaultChecklist, loading, openCategories]);

  const handleToggle = async (item: ChecklistItem) => {
    const itemRef = doc(db, 'trips', tripId, 'checklist', item.id);
    await updateDoc(itemRef, { completed: !item.completed });
  };

  const handleAddItem = async (category: string) => {
    if (newItemText.trim() === '') return;
    const checklistCollectionRef = collection(db, 'trips', tripId, 'checklist');
    await addDoc(checklistCollectionRef, {
        text: newItemText,
        completed: false,
        category: category,
        createdAt: serverTimestamp()
    });
    setNewItemText('');
  };

  const handleDeleteItem = async (id: string) => {
    const itemRef = doc(db, 'trips', tripId, 'checklist', id);
    await deleteDoc(itemRef);
  };

  const completedPercentage = useMemo(() => {
    if (items.length === 0) return 0;
    return (items.filter(item => item.completed).length / items.length) * 100;
  }, [items]);
  
  const groupedItems = useMemo(() => {
    return items.reduce((acc, item) => {
        const category = item.category || 'ללא קטגוריה';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {} as Record<string, ChecklistItem[]>);
  }, [items]);

  const handleToggleCategory = (category: string) => {
      setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  if (loading) {
    return <Box sx={{ p: 3, textAlign: 'center' }}><CircularProgress /><Typography sx={{mt: 2}}>טוען רשימה...</Typography></Box>
  }

  return (
    <Box sx={{ padding: '20px', paddingBottom: '100px' }}>
      <Card sx={{ borderRadius: '24px' }}>
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
            רשימת ציוד ומשימות
          </Typography>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
              {Math.round(completedPercentage)}% הושלמו
            </Typography>
            <LinearProgress variant="determinate" value={completedPercentage} sx={{ height: 10, borderRadius: 5 }} />
          </Box>
          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {Object.entries(groupedItems).map(([category, catItems]) => (
                <Box key={category}>
                    <ListItemButton onClick={() => handleToggleCategory(category)}>
                        <ListItemText primary={<Typography variant="h6" sx={{fontWeight: 600}}>{category}</Typography>} />
                        {openCategories[category] ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                    <Collapse in={openCategories[category]} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            {catItems.map(item => (
                                <ListItem
                                    key={item.id}
                                    secondaryAction={
                                        <IconButton edge="end" onClick={() => handleDeleteItem(item.id)}>
                                            <Delete fontSize="small" color="error" />
                                        </IconButton>
                                    }
                                    sx={{ pl: 4 }}
                                >
                                    <ListItemIcon sx={{minWidth: 0, mr: 1.5}}>
                                        <Checkbox
                                            edge="start"
                                            checked={item.completed}
                                            onClick={() => handleToggle(item)}
                                            tabIndex={-1}
                                            disableRipple
                                        />
                                    </ListItemIcon>
                                    <ListItemText primary={item.text} sx={{ textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? 'text.secondary' : 'text.primary' }} />
                                </ListItem>
                            ))}
                        </List>
                    </Collapse>
                </Box>
            ))}
          </List>
          <Box sx={{ display: 'flex', gap: 1.5, mt: 3, p: '0 16px' }}>
            <TextField fullWidth variant="outlined" size="small" placeholder="הוסף משימה חדשה..." value={newItemText} onChange={e => setNewItemText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddItem('ללא קטגוריה')} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
            <Button variant="contained" onClick={() => handleAddItem('ללא קטגוריה')} sx={{ borderRadius: '12px', px: 3 }}>
              <Add />
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Checklist;