import React, { useState, useEffect, useMemo } from 'react';
import { Box, Card, CardContent, Typography, List, ListItem, Checkbox, TextField, Button, IconButton, LinearProgress, ListItemText, alpha, useTheme } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import type { ChecklistItem } from '../types';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

interface ChecklistProps {
  tripId: string; 
}

const Checklist: React.FC<ChecklistProps> = ({ tripId }) => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    if (!tripId) return;

    const checklistCollectionRef = collection(db, 'trips', tripId, 'checklist');
    const q = query(checklistCollectionRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as ChecklistItem[];
      setItems(fetchedItems);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching checklist:", error);
      toast.error("שגיאה בטעינת המשימות");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tripId]);
  
  const handleToggle = async (item: ChecklistItem) => {
    const itemRef = doc(db, 'trips', tripId, 'checklist', item.id);
    try {
      await updateDoc(itemRef, { completed: !item.completed });
    } catch (e) {
      toast.error("שגיאה בעדכון המשימה");
    }
  };

  const handleAddItem = async () => {
    if (newItemText.trim() === '') {
      toast.error('לא ניתן להוסיף משימה ריקה');
      return;
    }
    const checklistCollectionRef = collection(db, 'trips', tripId, 'checklist');
    try {
      await addDoc(checklistCollectionRef, {
        text: newItemText,
        completed: false,
        createdAt: serverTimestamp()
      });
      setNewItemText('');
      toast.success('משימה נוספה!');
    } catch(e) {
      toast.error("שגיאה בהוספת המשימה");
    }
  };

  const handleDeleteItem = async (id: string) => {
    const itemRef = doc(db, 'trips', tripId, 'checklist', id);
    try {
      await deleteDoc(itemRef);
      toast.success('משימה נמחקה');
    } catch (e) {
      toast.error("שגיאה במחיקת המשימה");
    }
  };

  const completedPercentage = useMemo(() => {
    if (items.length === 0) return 0;
    return (items.filter(item => item.completed).length / items.length) * 100;
  }, [items]);

  if (loading) {
    return <Box sx={{ p: 3, textAlign: 'center' }}><Typography>טוען משימות...</Typography></Box>
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
          <List sx={{ p: 0 }}>
            {items.map(item => (
              <Card 
                key={item.id} 
                variant="outlined"
                sx={{ 
                  mb: 1.5, 
                  borderRadius: '16px',
                  backgroundColor: item.completed ? alpha(theme.palette.success.main, 0.05) : 'transparent',
                  borderColor: item.completed ? alpha(theme.palette.success.main, 0.2) : theme.palette.divider,
                }}
              >
                <ListItem sx={{ p: 1 }}>
                  <Checkbox edge="start" checked={item.completed} onClick={() => handleToggle(item)} sx={{pr: 1.5}} />
                  <ListItemText 
                    primary={item.text} 
                    sx={{ 
                      textDecoration: item.completed ? 'line-through' : 'none', 
                      color: item.completed ? 'text.secondary' : 'text.primary',
                      fontWeight: 500
                    }} 
                  />
                  <IconButton edge="end" onClick={() => handleDeleteItem(item.id)} sx={{ml: 1}}>
                    <Delete color="error" fontSize="small" />
                  </IconButton>
                </ListItem>
              </Card>
            ))}
          </List>
          <Box sx={{ display: 'flex', gap: 1.5, mt: 3 }}>
            <TextField fullWidth variant="outlined" size="small" placeholder="הוסף משימה חדשה..." value={newItemText} onChange={e => setNewItemText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddItem()} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
            <Button variant="contained" onClick={handleAddItem} sx={{ borderRadius: '12px', px: 3 }}>
              <Add />
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Checklist;

