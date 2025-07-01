import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { newYorkIdeas } from '../data/ideaBank'; // ייבוא בנק הרעיונות
import type { Destination } from '../types';

const getMarkerIcon = (type: Destination['type']) => {
    const iconMap = {
      hotel: '🏨',
      restaurant: '🍽️',
      attraction: '🎯',
      transport: '🚌'
    };
    return iconMap[type] || '📍';
};


const IdeasPage: React.FC = () => {
  return (
    <Box sx={{ padding: '20px', paddingBottom: '100px' }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
        בנק רעיונות
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500, mb: 3 }}>
        ניו יורק
      </Typography>

      {newYorkIdeas.map((category, index) => (
        <Accordion key={index} sx={{ mb: 1.5, borderRadius: '16px', '&:before': { display: 'none' }, boxShadow: '0 8px 25px rgba(0,0,0,0.08)' }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls={`panel${index}-content`}
            id={`panel${index}-header`}
            sx={{
                '& .MuiAccordionSummary-content': {
                    margin: '16px 0'
                }
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{category.category}</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <List disablePadding>
              {category.points.map((point) => (
                <ListItem key={point.id} divider>
                   <ListItemIcon sx={{fontSize: '24px'}}>
                       {getMarkerIcon(point.type)}
                   </ListItemIcon>
                  <ListItemText
                    primary={<Typography variant="body1" sx={{fontWeight: 600}}>{point.name}</Typography>}
                    secondary={point.notes}
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default IdeasPage;