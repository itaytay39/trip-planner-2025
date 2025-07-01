import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Fab,
  InputAdornment
} from '@mui/material';
import { 
  Add, 
  Flight, 
  Hotel, 
  Restaurant, 
  LocalActivity,
  ShoppingBag,
  MoreHoriz,
  Delete,
  Edit
} from '@mui/icons-material';
import type { BudgetItem } from '../types';
import type { Trip } from '../types';
import { db } from '../firebase';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { alpha } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';

interface BudgetTrackerProps {
  trip: Trip;
}

const BudgetTracker: React.FC<BudgetTrackerProps> = ({ trip }) => {
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  
  // State for editing the total budget
  const [isEditBudgetOpen, setIsEditBudgetOpen] = useState(false);
  const [newBudget, setNewBudget] = useState('');

  const [formData, setFormData] = useState({
    category: 'transport' as BudgetItem['category'],
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  const theme = useTheme();

  useEffect(() => {
    if (!trip || !trip.id) return;
    const tripId = trip.id.toString();
    const budgetCollectionRef = collection(db, 'trips', tripId, 'budgetItems');
    const q = query(budgetCollectionRef, orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as BudgetItem[];
      setItems(fetchedItems);
    });

    // Update the newBudget state when the trip prop changes
    setNewBudget(trip.budget ? trip.budget.replace(/[^0-9]/g, '') : '0');

    return () => unsubscribe();
  }, [trip]);

  const totalBudget = useMemo(() => {
    const budgetString = trip.budget || '';
    return parseInt(budgetString.replace(/[^0-9]/g, ''), 10) || 0;
  }, [trip.budget]);

  const totalSpent = items.reduce((sum, item) => sum + item.amount, 0);
  const remainingBudget = totalBudget - totalSpent;
  const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const categoryIcons = { transport: Flight, accommodation: Hotel, food: Restaurant, activities: LocalActivity, shopping: ShoppingBag, other: MoreHoriz };
  const categoryLabels = { transport: 'תחבורה', accommodation: 'לינה', food: 'אוכל', activities: 'פעילויות', shopping: 'קניות', other: 'אחר' };
  const categoryColors = { transport: '#2196F3', accommodation: '#FF9800', food: '#4CAF50', activities: '#9C27B0', shopping: '#E91E63', other: '#757575' };

  const handleOpenDialog = (item: BudgetItem | null = null) => {
    if (item) {
        setEditingItem(item);
        setFormData({ category: item.category, title: item.title, amount: item.amount.toString(), date: item.date });
    } else {
        setEditingItem(null);
        setFormData({ category: 'transport', title: '', amount: '', date: new Date().toISOString().split('T')[0] });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => setOpenDialog(false);

  const handleSaveItem = async () => {
    if (!trip || !trip.id) return;
    const tripId = trip.id.toString();
    const budgetCollectionRef = collection(db, 'trips', tripId, 'budgetItems');
    const itemData = {
      category: formData.category,
      title: formData.title,
      amount: parseFloat(formData.amount),
      date: formData.date,
      createdAt: serverTimestamp()
    };

    try {
        if (editingItem) {
          const itemRef = doc(db, 'trips', tripId, 'budgetItems', editingItem.id);
          await updateDoc(itemRef, itemData);
          toast.success('ההוצאה עודכנה!');
        } else {
          await addDoc(budgetCollectionRef, itemData);
          toast.success('הוצאה חדשה נוספה!');
        }
        handleCloseDialog();
    } catch {
        toast.error("שגיאה בשמירת הפריט");
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!trip || !trip.id) return;
    const tripId = trip.id.toString();
    const itemRef = doc(db, 'trips', tripId, 'budgetItems', id);
    try {
        await deleteDoc(itemRef);
        toast.success('ההוצאה נמחקה.');
    } catch {
        toast.error("שגיאה במחיקת ההוצאה");
    }
  };

  const handleSaveBudget = async () => {
      if (!trip || !trip.id || !newBudget) return;
      
      const tripRef = doc(db, 'trips', trip.id);
      const budgetValue = `₪${parseInt(newBudget, 10).toLocaleString()}`; // Format the budget string

      try {
          await updateDoc(tripRef, { budget: budgetValue });
          toast.success('התקציב עודכן בהצלחה!');
          setIsEditBudgetOpen(false);
      } catch {
          toast.error('שגיאה בעדכון התקציב.');
      }
  }

  const getCategoryTotal = (category: BudgetItem['category']) => items.filter(item => item.category === category).reduce((sum, item) => sum + item.amount, 0);

  return (
    <Box sx={{ padding: '20px', paddingBottom: '100px' }}>
      <Card sx={{ borderRadius: '24px', mb: 3, background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)' }}>
        <CardContent sx={{ color: 'white', textAlign: 'center', padding: '24px' }}>
            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1}}>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>₪{totalSpent.toLocaleString()}</Typography>
            </Box>
            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1}}>
                <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
                    מתוך תקציב של ₪{totalBudget.toLocaleString()}
                </Typography>
                <IconButton size="small" onClick={() => setIsEditBudgetOpen(true)} sx={{color: 'white', mb: 2}}>
                    <Edit fontSize='small' />
                </IconButton>
            </Box>
            <LinearProgress variant="determinate" value={Math.min(spentPercentage, 100)} sx={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)', '& .MuiLinearProgress-bar': { backgroundColor: spentPercentage > 100 ? '#f44336' : '#4caf50' }}}/>
            <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>נותרו ₪{remainingBudget.toLocaleString()}</Typography>
        </CardContent>
      </Card>

      {/* Categories and Items lists remain the same... */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>פילוח לפי קטגוריות</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2, mb: 3 }}>
        {Object.entries(categoryLabels).map(([category, label]) => {
          const Icon = categoryIcons[category as keyof typeof categoryIcons];
          const color = categoryColors[category as keyof typeof categoryColors];

          return (
            <Card key={category} sx={{ borderRadius: '16px', textAlign: 'center' }}>
              <CardContent sx={{ padding: '16px !important' }}>
                <Icon sx={{ fontSize: 32, color, mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color }}>
                  ₪{getCategoryTotal(category as BudgetItem['category']).toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>הוצאות אחרונות</Typography>
      <List sx={{ backgroundColor: 'background.paper', borderRadius: '16px', overflow: 'hidden' }}>
        {items.map((item) => {
          const Icon = categoryIcons[item.category];

          return (
            <ListItem 
              key={item.id}
              sx={{
                py: 2,
                px: 3,
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:last-child': {
                  borderBottom: 'none'
                },
                '&:hover': {
                  backgroundColor: 'action.hover',
                  '& .action-buttons': {
                    opacity: 1,
                    transform: 'translateX(0)',
                  }
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 48 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '12px',
                    backgroundColor: alpha(categoryColors[item.category], 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon sx={{ color: categoryColors[item.category], fontSize: 20 }} />
                </Box>
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {item.title}
                  </Typography>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    {categoryLabels[item.category]} • {new Date(item.date).toLocaleDateString('he-IL')}
                  </Typography>
                }
              />
              <ListItemSecondaryAction 
                className="action-buttons"
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  opacity: { xs: 1, sm: 0.7 },
                  transform: { xs: 'translateX(0)', sm: 'translateX(8px)' },
                  transition: 'all 0.2s ease',
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 700, 
                    color: 'primary.main',
                    mr: 2,
                    minWidth: 'fit-content',
                  }}
                >
                  ₪{item.amount.toLocaleString()}
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => handleOpenDialog(item)}
                  sx={{
                    width: 36,
                    height: 36,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.2),
                      transform: 'scale(1.1)',
                    }
                  }}
                >
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton 
                  size="small" 
                  onClick={() => handleDeleteItem(item.id)}
                  sx={{
                    width: 36,
                    height: 36,
                    backgroundColor: alpha(theme.palette.error.main, 0.1),
                    color: theme.palette.error.main,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.error.main, 0.2),
                      transform: 'scale(1.1)',
                    }
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          );
        })}
      </List>
      

      <Fab color="primary" onClick={() => handleOpenDialog()} sx={{ position: 'fixed', bottom: 100, right: 20, background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)' }}><Add /></Fab>

      {/* Edit Total Budget Dialog */}
      <Dialog open={isEditBudgetOpen} onClose={() => setIsEditBudgetOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>עריכת תקציב כולל</DialogTitle>
        <DialogContent>
            <TextField
                autoFocus
                margin="dense"
                label="סכום התקציב החדש"
                type="number"
                fullWidth
                variant="outlined"
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
                InputProps={{
                    startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                }}
                sx={{mt: 1}}
            />
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setIsEditBudgetOpen(false)}>ביטול</Button>
            <Button onClick={handleSaveBudget} variant="contained">שמור תקציב</Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Expense Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'עריכת הוצאה' : 'הוספת הוצאה חדשה'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField select label="קטגוריה" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value as BudgetItem['category'] })} fullWidth>
              {Object.entries(categoryLabels).map(([value, label]) => (<MenuItem key={value} value={value}>{label}</MenuItem>))}
            </TextField>
            <TextField label="שם ההוצאה" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} fullWidth/>
            <TextField label="סכום" type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} fullWidth InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>₪</Typography> }}/>
            <TextField label="תאריך" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} fullWidth InputLabelProps={{ shrink: true }}/>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>ביטול</Button>
          <Button onClick={handleSaveItem} variant="contained" disabled={!formData.title || !formData.amount}>שמור</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BudgetTracker;