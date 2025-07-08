import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  useTheme,
  useMediaQuery,
  Chip,
  Divider
} from '@mui/material';
import {
  EmojiEmotions as EmojiIcon,
  Search as SearchIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { DEFAULT_APP_EMOJIS, getEmojiByCategory } from '../utils/constants.js';

/**
 * Componente per selezionare emoji per le app
 */
const EmojiSelector = ({ 
  open, 
  onClose, 
  onSelect, 
  currentEmoji = null,
  category = null 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(category || 'altro');

  // Categorie per filtrare le emoji
  const categories = [
    { id: 'tutti', name: 'Tutte', emojis: DEFAULT_APP_EMOJIS },
    { id: 'produttività', name: 'Produttività', emojis: ['⚡', '🚀', '💡', '🔧', '📊', '📈', '✅', '🎯'] },
    { id: 'intrattenimento', name: 'Intrattenimento', emojis: ['🎮', '🎬', '🎵', '🎨', '🎪', '🎭', '🎤', '🎧'] },
    { id: 'sviluppo', name: 'Sviluppo', emojis: ['💻', '🔧', '⚙️', '🔨', '📱', '🌐', '🚀', '⚡'] },
    { id: 'social', name: 'Social', emojis: ['👥', '💬', '📱', '🌐', '📞', '📧', '💌', '📢'] },
    { id: 'utility', name: 'Utility', emojis: ['🔧', '⚙️', '🛠️', '📋', '📝', '📌', '📍', '🔍'] },
    { id: 'altro', name: 'Altro', emojis: ['❓', '💭', '💡', '🎯', '⭐', '💫', '✨', '🌟'] }
  ];

  // Filtra emoji in base alla ricerca e categoria
  const filteredEmojis = categories
    .find(cat => cat.id === selectedCategory)?.emojis || DEFAULT_APP_EMOJIS
    .filter(emoji => 
      !searchQuery || 
      emoji.includes(searchQuery) ||
      categories.find(cat => cat.emojis.includes(emoji))?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleEmojiSelect = (emoji) => {
    onSelect(emoji);
    onClose();
  };

  const handleRandomEmoji = () => {
    const randomEmoji = getEmojiByCategory(selectedCategory);
    onSelect(randomEmoji);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          background: theme.palette.background.paper,
          backdropFilter: 'blur(20px)'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            Seleziona Emoji
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Cerca emoji..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ mb: 2 }}
          />

          {/* Filtri categoria */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {categories.map((cat) => (
              <Chip
                key={cat.id}
                label={cat.name}
                onClick={() => setSelectedCategory(cat.id)}
                color={selectedCategory === cat.id ? 'primary' : 'default'}
                variant={selectedCategory === cat.id ? 'filled' : 'outlined'}
                size="small"
              />
            ))}
          </Box>

          {/* Emoji corrente */}
          {currentEmoji && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Emoji attuale:
              </Typography>
              <Typography variant="h4" sx={{ textAlign: 'center' }}>
                {currentEmoji}
              </Typography>
            </Box>
          )}

          <Divider sx={{ mb: 2 }} />

          {/* Griglia emoji */}
          <Grid container spacing={1}>
            {filteredEmojis.map((emoji, index) => (
              <Grid item key={index}>
                <IconButton
                  onClick={() => handleEmojiSelect(emoji)}
                  sx={{
                    fontSize: '1.5rem',
                    p: 1,
                    border: emoji === currentEmoji ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
                    '&:hover': {
                      transform: 'scale(1.2)',
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  {emoji}
                </IconButton>
              </Grid>
            ))}
          </Grid>

          {filteredEmojis.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                Nessuna emoji trovata per "{searchQuery}"
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button onClick={onClose}>
          Annulla
        </Button>
        
        <Box sx={{ flex: '1 1 auto' }} />
        
        <Button
          variant="outlined"
          startIcon={<EmojiIcon />}
          onClick={handleRandomEmoji}
        >
          Emoji Casuale
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmojiSelector; 