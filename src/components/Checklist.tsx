// src/components/Checklist.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { Box, Card, CardContent, Typography, List, ListItem, Checkbox, TextField, Button, IconButton, LinearProgress, ListItemText } from '@mui/material';
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
    if (!window.confirm("האם למחוק את המשימה?")) return;
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
            רשימת משימות
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {Math.round(completedPercentage)}% הושלמו
            </Typography>
            <LinearProgress variant="determinate" value={completedPercentage} sx={{ height: 8, borderRadius: 4 }} />
          </Box>
          <List>
            {items.map(item => (
              // --- התיקון כאן ---
              <ListItem 
                key={item.id} 
                secondaryAction={
                  <IconButton edge="end" onClick={() => handleDeleteItem(item.id)}>
                    <Delete color="error" />
                  </IconButton>
                } 
                disablePadding 
                sx={{ 
                  mb: 1, 
                  pl: 1, // הוספנו ריווח פנימי כדי להרחיק את תיבת הסימון מהקצה
                  '& .MuiListItemSecondaryAction-root': { // הוספנו ריווח לכפתור המחיקה
                    right: 0,
                  }
                }}
              >
                <Checkbox edge="start" checked={item.completed} onClick={() => handleToggle(item)} />
                <ListItemText primary={item.text} sx={{ textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? 'text.secondary' : 'text.primary' }} />
              </ListItem>
            ))}
          </List>
          <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
            <TextField fullWidth variant="outlined" size="small" placeholder="הוסף משימה חדשה..." value={newItemText} onChange={e => setNewItemText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddItem()} />
            <Button variant="contained" onClick={handleAddItem}><Add /></Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Checklist;