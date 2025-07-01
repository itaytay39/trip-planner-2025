import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress
} from '@mui/material';
import { 
  Flight,
  LocationOn,
  AttachMoney,
  Edit,
  EmojiEvents
} from '@mui/icons-material';
import type { User } from '../types';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

interface UserProfileProps {
  user: User;
}

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  
  const [editFormData, setEditFormData] = useState({ name: '', avatar: '' });

  const handleOpenEditDialog = () => {
    setEditFormData({
      name: user.name,
      avatar: user.avatar || ''
    });
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };

  const completedTrips = user.trips || 0;
  const savedPlaces = user.savedPlaces || 0;
  const totalSpent = user.totalSpent || 0;

  const getLevel = (trips: number) => {
    if (trips >= 20) return { name: 'מטייל מקצועי', color: '#FFD700', progress: 100 };
    if (trips >= 10) return { name: 'מטייל מנוסה', color: '#FF6B35', progress: (trips / 20) * 100 };
    if (trips >= 5) return { name: 'מטייל פעיל', color: '#4ECDC4', progress: (trips / 10) * 100 };
    return { name: 'מטייל מתחיל', color: '#45B7D1', progress: (trips / 5) * 100 };
  };

  const userLevel = getLevel(completedTrips);

  const handleSaveProfile = async () => {
    const userRef = doc(db, 'users', 'mainUser');
    try {
      await updateDoc(userRef, {
        name: editFormData.name,
        avatar: editFormData.avatar
      });
      toast.success("הפרופיל עודכן בהצלחה!");
      handleCloseEditDialog();
    } catch (e) {
      toast.error("שגיאה בעדכון הפרופיל.");
      console.error("Error updating profile: ", e);
    }
  };

  const stats = [
    { icon: Flight, label: 'טיולים שהושלמו', value: completedTrips },
    { icon: LocationOn, label: 'מקומות שמורים', value: savedPlaces },
    { icon: AttachMoney, label: 'סך הכל הוצאות', value: `₪${totalSpent.toLocaleString()}` }
  ];

  const achievements = [
      { icon: EmojiEvents, title: 'הטיול הראשון', description: 'תכננת את הטיול הראשון שלך!', completed: completedTrips > 0 },
      { icon: EmojiEvents, title: 'חמישה באויר', description: 'השלמת 5 טיולים', completed: completedTrips >= 5 },
      { icon: EmojiEvents, title: 'טייל עולמי', description: 'השלמת 10 טיולים', completed: completedTrips >= 10 },
  ];

  return (
    <Box sx={{ padding: '20px', paddingBottom: '100px' }}>
      <Card sx={{ borderRadius: '24px', mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent sx={{ color: 'white', textAlign: 'center', padding: '32px 24px' }}>
          <Avatar
            src={user.avatar}
            sx={{ 
              width: 100, 
              height: 100, 
              margin: '0 auto 16px',
              border: '4px solid rgba(255,255,255,0.3)'
            }}
          />
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            {user.name}
          </Typography>
          <Chip 
            label={userLevel.name}
            sx={{ 
              backgroundColor: userLevel.color,
              color: 'white',
              fontWeight: 600,
              mb: 2
            }}
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
              התקדמות לרמה הבאה
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={userLevel.progress}
              sx={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: 'rgba(255,255,255,0.3)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: userLevel.color
                }
              }}
            />
          </Box>
          <Button
            startIcon={<Edit />}
            onClick={handleOpenEditDialog}
            variant="outlined"
            sx={{ 
              mt: 2,
              borderColor: 'rgba(255,255,255,0.5)',
              color: 'white',
              '&:hover': {
                borderColor: 'white',
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            עריכת פרופיל
          </Button>
        </CardContent>
      </Card>

      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        הסטטיסטיקות שלי
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 2, mb: 3 }}>
         {stats.map((stat, index) => {
            const Icon = stat.icon;
            return <Card key={index} sx={{borderRadius: '16px', textAlign: 'center'}}><CardContent><Icon sx={{fontSize: 28, mb:1, color: 'primary.main'}}/><Typography variant="h6" sx={{fontWeight:700}}>{stat.value}</Typography><Typography variant="caption" color="text.secondary">{stat.label}</Typography></CardContent></Card>
         })}
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        הישגים
      </Typography>
      <Card sx={{ borderRadius: '20px', mb: 3 }}>
         <List>
            {achievements.map((ach, index) => (
                <ListItem key={index} sx={{opacity: ach.completed ? 1 : 0.4}}>
                    <ListItemIcon><EmojiEvents sx={{color: ach.completed ? 'gold' : 'grey'}} /></ListItemIcon>
                    <ListItemText primary={ach.title} secondary={ach.description} />
                </ListItem>
            ))}
         </List>
      </Card>
      
      {/* --- הסרנו את כל קטע ההגדרות מכאן --- */}

      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>עריכת פרופיל</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="שם מלא"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="כתובת תמונת פרופיל (URL)"
              value={editFormData.avatar}
              onChange={(e) => setEditFormData({ ...editFormData, avatar: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>
            ביטול
          </Button>
          <Button variant="contained" onClick={handleSaveProfile}>
            שמור
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserProfile;