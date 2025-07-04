import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Card, CardContent, Typography, List, ListItem, Checkbox, TextField, Button, IconButton, LinearProgress, ListItemText, CircularProgress, Collapse, ListItemButton, ListItemIcon } from '@mui/material';
import { Add, Delete, ExpandLess, ExpandMore } from '@mui/icons-material';
import type { ChecklistItem } from '../types';
import toast from 'react-hot-toast';

// רשימת הציוד המעודכנת והמקיפה לטיול 3 שבועות בארצות הברית
const defaultChecklistCategories = {
  "מסמכים וכסף (חובה!)": [
    { text: "דרכון ישראלי בתוקף (לפחות 6 חודשים מתאריך החזרה)" },
    { text: "אישור ESTA לאזרחים ישראלים (תקף מאוקטובר 2023 - יש להגיש 72 שעות לפני הטיסה)" },
    { text: "רישיון נהיגה ישראלי ובינלאומי (חובה אם שוכרים רכב)" },
    { text: "כרטיסי טיסה הלוך ושוב מודפסים + אישורי הזמנה דיגיטליים" },
    { text: "ביטוח נסיעות מקיף מודפס (רפואי, ביטול, מזוודות, אחריות אזרחית)" },
    { text: "צילומים של כל המסמכים החשובים (בענן, בטלפון ועותקים פיזיים נפרדים)" },
    { text: "דולרים במזומן (מומלץ 200-500$ לטיפים והוצאות קטנות)" },
    { text: "לפחות 2 כרטיסי אשראי בינלאומיים (Visa/MasterCard)" },
    { text: "הודעה לבנק על נסיעה לארה\"ב (למניעת חסימת כרטיסים)" },
    { text: "אישור רופא באנגלית לתרופות מרשם (במידה ונוטלים)" },
    { text: "רשימת אנשי קשר לחירום באנגלית" },
    { text: "כתובות ומספרי טלפון של מקומות הלינה" }
  ],
  "אלקטרוניקה ומטענים (מחודש 2024)": [
    { text: "טלפון נייד (רצוי לבדוק תוכנית בינלאומית או SIM אמריקאי)" },
    { text: "מטען מהיר לטלפון + כבל נוסף" },
    { text: "מטען נייד (Power Bank) חזק - לפחות 20,000mAh" },
    { text: "אוזניות מבטלות רעשים (חיוניות לטיסה ארוכה)" },
    { text: "מתאם חשמל אוניברסלי (Type A & B לארה\"ב)" },
    { text: "מפצל חשמל עם USB (למלונות עם מעט שקעים)" },
    { text: "מטען לרכב (USB-C ו-Lightning)" },
    { text: "מצלמה + כרטיסי זיכרון נוספים + מטען" },
    { text: "אוזניות קוויות (גיבוי לטיסות)" },
    { text: "מכשיר GPS נייד או הורדת מפות אופליין" }
  ],
  "ביגוד לכל מזג אוויר - 3 שבועות": [
    { text: "תחתונים וגרביים לשלושה שבועות + 4 זוגות ספייר" },
    { text: "7-8 חולצות קצרות איכותיות נושמות" },
    { text: "3-4 חולצות ארוכות" },
    { text: "סוודר חם + ג'קט קל" },
    { text: "2-3 מכנסיים ארוכים נוחים לטיסות ולטיולים" },
    { text: "מעיל גשם/רוח איכותי ומתקפל" },
    { text: "2 בגדי ים (לחופים ולמלונות עם בריכות)" },
    { text: "פיג'מה נוחה לטיסות ארוכות" },
    { text: "2-3 סטי בגדי ספורט (להליכות ולחדר כושר)" },
    { text: "נעלי הליכה נוחות שכבר נשברו ברגל" },
    { text: "כפכפים/סנדלים לחוף ולמלון" },
    { text: "נעלי ספורט איכותיות" },
    { text: "נעליים אלגנטיות אחד (למסעדות יוקרה)" },
    { text: "מכנסיים קצרים לאקלים חם" },
    { text: "שמלות/חולצות אלגנטיות (2-3 יחידות)" }
  ],
  "בריאות ועזרה ראשונה - מעודכן 2024": [
    { text: "ערכת עזרה ראשונה מקיפה (פלסטרים, גזה, חומר חיטוי)" },
    { text: "משחה אנטיביוטית" },
    { text: "אדוויל/טיילנול למניעת כאבים וחום" },
    { text: "כדורים נגד בחילות (למכוניות ולטיסות)" },
    { text: "אימודיום - נגד שלשולים" },
    { text: "פרוביוטיקה לאיזון הבטן" },
    { text: "ויטמינים יומיים" },
    { text: "טיפות עיניים נגד יובש" },
    { text: "קרם הגנה SPF 50+ (הרבה - הרבה יותר יקר בארה\"ב)" },
    { text: "אפטר סאן - ג'ל אלוורה" },
    { text: "תרסיס נגד יתושים עם DEET" },
    { text: "משחה נגד גירוד" },
    { text: "טרמומטר דיגיטלי" },
    { text: "מסכות פנים (לטיסות ומקומות צפופים)" }
  ],
  "כלי רחצה ויופי - 3 שבועות": [
    { text: "תיק רחצה מאורגן עם וו תלייה" },
    { text: "מברשת ומשחת שיניים לשלושה שבועות" },
    { text: "דאודורנט חזק (יותר מיחידה אחת)" },
    { text: "שמפו וסבון בבקבוקי טיסה (או ברים מוצקים)" },
    { text: "קרם לחות לפנים ולגוף" },
    { text: "תער + קצף גילוח" },
    { text: "מברשת/מסרק שיער" },
    { text: "קוטיפלקס לציפורניים" },
    { text: "פינצטה" },
    { text: "משחת שפתיים עם הגנה" },
    { text: "אקלוג'ל נגד חיידקים" },
    { text: "מגבונים לחים לניקוי מהיר" },
    { text: "מברשת שיניים חשמלית (אופציונלי)" }
  ],
  "פריטים חיוניים לטיול ארוך": [
    { text: "תיק גב איכותי וקל לטיולי יום" },
    { text: "בקבוק מים בנפח 1 ליטר עם מסנן" },
    { text: "משקפי שמש איכותיות UV400" },
    { text: "כובע רחב שוליים להגנה מהשמש" },
    { text: "תרמוס לשמירה על חום/קור" },
    { text: "כרית צוואר מתנפחת לטיסות" },
    { text: "מסכת שינה ואטמי אוזניים" },
    { text: "שקיות אוויר לדחיסת בגדים" },
    { text: "שקית נפרדת לכביסה מלוכלכת" },
    { text: "מנעול TSA למזוודות" },
    { text: "מטריה קומפקטית עמידה ברוח" },
    { text: "עט לטפסי מכס וטפסים" },
    { text: "מחברת קטנה לרשימות ומידע" },
    { text: "נייר טואלט רב שכבתי (לשירותים ציבוריים)" },
    { text: "מטליות נייר איכותיות" }
  ],
  "טכנולוגיה ובילויים": [
    { text: "מחשב נייד/טאבלט (אם עובדים מרחוק)" },
    { text: "ספרים/קוראים אלקטרוניים" },
    { text: "משחקי כרטיסים" },
    { text: "אפליקציות שמורות באופליין (מפות, מדריכי נסיעות)" },
    { text: "רשימת מוזיקה/פודקאסטים שמורה" },
    { text: "כבלי HDMI למלונות עם טלוויזיות" },
    { text: "אוזניות ספורט לריצה/חדר כושר" }
  ],
  "אוכל וחטיפים לטיול": [
    { text: "חטיפי אנרגיה ושקדים" },
    { text: "שקיות פלסטיק לחטיפים" },
    { text: "כוס נסיעות מתקפלת" },
    { text: "כפיות ומזלגות חד-פעמיים" },
    { text: "מלח ופפר בשקיקים קטנים" },
    { text: "שמן זית בבקבוק קטן (למי שאוהב לבשל)" }
  ],
  "פריטים ספציפיים לארה\"ב": [
    { text: "מתאם מחשב לרכב שכור (אם רוצים נגינה)" },
    { text: "שקיות רב פעמיות (חלק מהמדינות גובות על שקיות)" },
    { text: "בקבוק מים רב פעמי (לחסוך כסף במחירים גבוהים)" },
    { text: "מעיל חם יותר (לקולורדו, ניו יורק, סיאטל)" },
    { text: "ביגוד רשמי יותר (למסעדות יוקרה ואירועים)" },
    { text: "נעליים נוחות להליכה (ערים גדולות דורשות הרבה הליכה)" }
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

  const populateDefaultChecklist = useCallback(() => {
    const checklistItems: ChecklistItem[] = [];
    
    Object.entries(defaultChecklistCategories).forEach(([category, catItems]) => {
        catItems.forEach((item, index) => {
            checklistItems.push({
                id: `${category}-${index}`,
                text: item.text,
                category: category,
                completed: false,
                tripId: tripId
            });
        });
    });

    setItems(checklistItems);
    
    // Set all categories to open initially
    const initialCategories: Record<string, boolean> = {};
    Object.keys(defaultChecklistCategories).forEach(category => {
        initialCategories[category] = true;
    });
    setOpenCategories(initialCategories);
    
    toast.success('רשימת ציוד מקיפה נוספה לטיול!');
  }, [tripId]);

  useEffect(() => {
    if (!tripId) {
        setLoading(false);
        return;
    }

    setLoading(true);
    // Simulate loading time
    setTimeout(() => {
      populateDefaultChecklist();
      setLoading(false);
    }, 500);
  }, [tripId, populateDefaultChecklist]);

  const handleToggle = (item: ChecklistItem) => {
    setItems(prevItems => 
      prevItems.map(i => 
        i.id === item.id ? { ...i, completed: !i.completed } : i
      )
    );
  };

  const handleAddItem = (category: string) => {
    if (newItemText.trim() === '') return;
    
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text: newItemText,
      completed: false,
      category: category,
      tripId: tripId
    };
    
    setItems(prevItems => [...prevItems, newItem]);
    setNewItemText('');
    toast.success('פריט נוסף לרשימה!');
  };

  const handleDeleteItem = (id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
    toast.success('פריט נמחק מהרשימה!');
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
              {Math.round(completedPercentage)}% הושלמו ({items.filter(item => item.completed).length} מתוך {items.length})
            </Typography>
            <LinearProgress variant="determinate" value={completedPercentage} sx={{ height: 10, borderRadius: 5 }} />
          </Box>
          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {Object.entries(groupedItems).map(([category, catItems]) => (
                <Box key={category}>
                    <ListItemButton onClick={() => handleToggleCategory(category)}>
                        <ListItemText primary={<Typography variant="h6" sx={{fontWeight: 600}}>{category} ({catItems.filter(item => item.completed).length}/{catItems.length})</Typography>} />
                        {openCategories[category] ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                    <Collapse in={openCategories[category]} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            {catItems.map(item => (
                                <ListItem
                                    key={item.id}
                                    sx={{ 
                                        pl: 4,
                                        py: 1.5,
                                        borderRadius: 1,
                                        mx: 1,
                                        mb: 0.5,
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            backgroundColor: 'action.hover',
                                            '& .delete-button': {
                                                opacity: 1,
                                                transform: 'translateX(0)',
                                            }
                                        }
                                    }}
                                >
                                    <ListItemIcon sx={{minWidth: 0, mr: 2}}>
                                        <Checkbox
                                            edge="start"
                                            checked={item.completed}
                                            onClick={() => handleToggle(item)}
                                            tabIndex={-1}
                                            disableRipple
                                            sx={{
                                                '& .MuiSvgIcon-root': {
                                                    fontSize: 20,
                                                },
                                            }}
                                        />
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary={
                                            <Typography 
                                                variant="body1" 
                                                sx={{ 
                                                    textDecoration: item.completed ? 'line-through' : 'none', 
                                                    color: item.completed ? 'text.secondary' : 'text.primary',
                                                    fontWeight: 500,
                                                    lineHeight: 1.4,
                                                }} 
                                            >
                                                {item.text}
                                            </Typography>
                                        } 
                                    />
                                    <IconButton 
                                        className="delete-button"
                                        edge="end" 
                                        onClick={() => handleDeleteItem(item.id)}
                                        size="small"
                                        sx={{
                                            opacity: { xs: 1, sm: 0.7 },
                                            transform: { xs: 'translateX(0)', sm: 'translateX(8px)' },
                                            transition: 'all 0.2s ease',
                                            width: 32,
                                            height: 32,
                                            backgroundColor: 'error.main',
                                            color: 'white',
                                            '&:hover': {
                                                backgroundColor: 'error.dark',
                                                transform: 'scale(1.1) translateX(0)',
                                            }
                                        }}
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
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