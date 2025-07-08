import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Chip,
  Avatar,
  Box,
  useTheme,
  Tooltip
} from '@mui/material';
import {
  Launch as LaunchIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';

/**
 * Componente AppCard con Material UI e aspetto glossy
 */
const AppCardMaterial = ({ 
  app, 
  onLaunch, 
  onToggleFavorite, 
  onEdit, 
  onDelete, 
  onShowMenu,
  showMenu = true 
}) => {
  const theme = useTheme();

  const getCategoryColor = (category) => {
    const colors = {
      'produttività': 'primary',
      'intrattenimento': 'secondary',
      'sviluppo': 'success',
      'social': 'warning',
      'utility': 'info',
      'altro': 'default'
    };
    return colors[category?.toLowerCase()] || 'default';
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAppIcon = (app) => {
    if (app.icon) {
      // Se è un'icona custom (base64, URL, etc.)
      if (app.icon.startsWith('data:') || app.icon.startsWith('http')) {
        return (
          <img 
            src={app.icon} 
            alt={app.name} 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              borderRadius: '50%'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        );
      }
      // Se è un'icona SVG inline
      if (app.icon.includes('<svg')) {
        return (
          <div 
            style={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
            dangerouslySetInnerHTML={{ __html: app.icon }}
          />
        );
      }
    }

    // Fallback: iniziali
    return getInitials(app.name);
  };

  const formatLastUsed = (lastUsed) => {
    if (!lastUsed) return null;
    
    const date = new Date(lastUsed);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Ieri';
    if (diffDays < 7) return `${diffDays} giorni fa`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} settimane fa`;
    return date.toLocaleDateString('it-IT');
  };

  return (
    <Card
      sx={{
        height: { xs: 280, sm: 300, md: 320 }, // Altezza responsive
        width: '100%', // Larghezza fissa al 100% del container
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        background: theme.palette.background.paper,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${theme.palette.divider}`,
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
          '& .app-card-actions': {
            opacity: 1
          }
        },
        '& .app-card-actions': {
          opacity: 0.7,
          transition: 'opacity 0.2s ease'
        }
      }}
    >
      <CardContent sx={{ 
        flexGrow: 1, 
        p: 3, 
        display: 'flex', 
        flexDirection: 'column',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Header con avatar e titolo */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              mr: 2,
              background: app.icon ? 'transparent' : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              fontSize: '1.2rem',
              fontWeight: 600,
              boxShadow: `0 4px 12px ${theme.palette.primary.main}33`,
              position: 'relative'
            }}
          >
            {getAppIcon(app)}
            {!app.icon && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                {getInitials(app.name)}
              </div>
            )}
          </Avatar>
          
          <Box sx={{ flexGrow: 1, minWidth: 0, width: '100%' }}>
            <Typography
              variant="h6"
              component="h3"
              sx={{
                fontWeight: 600,
                mb: 0.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '100%'
              }}
            >
              {app.name}
            </Typography>
            
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                lineHeight: 1.4
              }}
            >
              {app.description || 'Nessuna descrizione'}
            </Typography>
          </Box>
        </Box>

        {/* Categorie e tag */}
        <Box sx={{ mb: 2 }}>
          {app.category && (
            <Chip
              label={app.category}
              color={getCategoryColor(app.category)}
              size="small"
              sx={{ mr: 1, mb: 1 }}
            />
          )}
          
          {app.favorite && (
            <Chip
              icon={<FavoriteIcon />}
              label="Preferita"
              color="secondary"
              size="small"
              sx={{ mb: 1 }}
            />
          )}
          
          {app.tags && app.tags.length > 0 && (
            <Box sx={{ mt: 1 }}>
              {app.tags.slice(0, 3).map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  variant="outlined"
                  size="small"
                  sx={{ mr: 0.5, mb: 0.5 }}
                />
              ))}
              {app.tags.length > 3 && (
                <Chip
                  label={`+${app.tags.length - 3}`}
                  variant="outlined"
                  size="small"
                  sx={{ mb: 0.5 }}
                />
              )}
            </Box>
          )}
        </Box>

        {/* Spacer per spingere le azioni in fondo */}
        <Box sx={{ flexGrow: 1 }} />
        
        {/* Informazioni aggiuntive */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
          {app.lastUsed && (
            <Typography variant="caption" color="text.secondary">
              Ultimo uso: {formatLastUsed(app.lastUsed)}
            </Typography>
          )}
          
          {app.usageCount && (
            <Typography variant="caption" color="text.secondary">
              {app.usageCount} utilizzi
            </Typography>
          )}
        </Box>
      </CardContent>

      {/* Azioni */}
      <CardActions 
        className="app-card-actions"
        sx={{ 
          justifyContent: 'space-between', 
          p: 2, 
          pt: 0,
          borderTop: `1px solid ${theme.palette.divider}`
        }}
      >
        <Button
          variant="contained"
          startIcon={<LaunchIcon />}
          onClick={() => onLaunch(app.id)}
          size="small"
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
            }
          }}
        >
          Avvia
        </Button>

        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title={app.favorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}>
            <IconButton
              size="small"
              onClick={() => onToggleFavorite(app.id)}
              color={app.favorite ? 'secondary' : 'default'}
              sx={{
                '&:hover': {
                  transform: 'scale(1.1)'
                }
              }}
            >
              {app.favorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Modifica">
            <IconButton
              size="small"
              onClick={() => onEdit(app)}
              sx={{
                '&:hover': {
                  transform: 'scale(1.1)',
                  color: theme.palette.primary.main
                }
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>

          {showMenu && (
            <Tooltip title="Altre opzioni">
              <IconButton
                size="small"
                onClick={(e) => onShowMenu(app.id, e.currentTarget)}
                sx={{
                  '&:hover': {
                    transform: 'scale(1.1)'
                  }
                }}
              >
                <MoreVertIcon />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Elimina">
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(app.id)}
              sx={{
                '&:hover': {
                  transform: 'scale(1.1)'
                }
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>
    </Card>
  );
};

export default AppCardMaterial; 