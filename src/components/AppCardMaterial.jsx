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
  GetApp as GetAppIcon,
  InstallMobile as InstallMobileIcon
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
  onOpenPWA,
  onInstallPWA,
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

  const isEmoji = (icon) => {
    // Controlla se l'icona è un'emoji (carattere Unicode)
    return icon && icon.length === 2 && icon.charCodeAt(0) > 255;
  };

  const getAppIcon = (app) => {
    if (app.icon) {
      // Se è un'emoji (carattere Unicode)
      if (app.icon.length === 2 && app.icon.charCodeAt(0) > 255) {
        return (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '2rem'
          }}>
            {app.icon}
          </div>
        );
      }
      
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
        // Altezza responsive migliorata per evitare tagli
        minHeight: { xs: 320, sm: 340, md: 360 },
        height: 'auto', // Altezza automatica invece di fissa
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
        p: 3, // Ripristino padding originale
        display: 'flex', 
        flexDirection: 'column',
        width: '100%',
        boxSizing: 'border-box',
        // Assicura che il contenuto non occupi troppo spazio
        minHeight: 0
      }}>
        {/* Header con avatar e titolo */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Avatar
            sx={{
              width: 56, // Ripristino dimensione originale
              height: 56,
              mr: 2,
              background: app.icon && !isEmoji(app.icon) ? 'transparent' : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              fontSize: '1.2rem', // Ripristino dimensione originale
              fontWeight: 600,
              boxShadow: `0 4px 12px ${theme.palette.primary.main}33`,
              position: 'relative',
              cursor: 'pointer', // Aggiungi cursore pointer per indicare che è cliccabile
              '&:hover': {
                transform: 'scale(1.05)',
                transition: 'transform 0.2s ease'
              }
            }}
            onClick={() => onLaunch(app.id)} // L'icona avvia sempre l'app
          >
            {getAppIcon(app)}
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
                // Ripristino dimensione originale
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
                WebkitLineClamp: 2, // Ripristino numero righe originale
                WebkitBoxOrient: 'vertical',
                lineHeight: 1.4
                // Ripristino dimensione originale
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
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mt: 'auto'
        }}>
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
          p: 2, // Ripristino padding originale
          pt: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          // Layout responsive migliorato
          flexDirection: { xs: 'row', sm: 'row' },
          gap: { xs: 1, sm: 0 },
          alignItems: { xs: 'center', sm: 'center' },
          flexWrap: { xs: 'nowrap', sm: 'nowrap' }, // Evita wrap su mobile
          // Assicura che i pulsanti non vengano tagliati
          minHeight: { xs: 48, sm: 56 }, // Altezza minima per i pulsanti
          flexShrink: 0 // Impedisce il ridimensionamento
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
            },
            // Dimensione appropriata per mobile
            minWidth: { xs: '120px', sm: 'auto' }, // Ripristino larghezza originale
            flex: { xs: '0 0 auto', sm: '0 0 auto' }
            // Ripristino dimensioni originali
          }}
        >
          Avvia
        </Button>

        <Box sx={{ 
          display: 'flex', 
          gap: 0.5, // Ripristino gap originale
          justifyContent: { xs: 'flex-end', sm: 'flex-end' },
          flexWrap: 'nowrap',
          flex: { xs: '1 1 auto', sm: '0 0 auto' }
        }}>
          {/* Pulsante PWA - Apri come PWA standalone */}
          {onOpenPWA && (
            <Tooltip title="Apri come PWA">
              <IconButton
                size="small"
                onClick={() => onOpenPWA(app.id)}
                sx={{
                  '&:hover': {
                    transform: 'scale(1.1)',
                    color: theme.palette.secondary.main
                  }
                }}
              >
                <GetAppIcon />
              </IconButton>
            </Tooltip>
          )}

          {/* Pulsante Installa - Installa come PWA nativa */}
          {onInstallPWA && (
            <Tooltip title="Installa app">
              <IconButton
                size="small"
                onClick={() => onInstallPWA(app.id)}
                sx={{
                  '&:hover': {
                    transform: 'scale(1.1)',
                    color: theme.palette.success.main
                  }
                }}
              >
                <InstallMobileIcon />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title={app.favorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}>
            <IconButton
              size="small"
              onClick={() => onToggleFavorite(app.id)}
              color={app.favorite ? 'secondary' : 'default'}
              sx={{
                '&:hover': {
                  transform: 'scale(1.1)'
                }
                // Ripristino dimensioni originali
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
                // Ripristino dimensioni originali
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>
    </Card>
  );
};

export default AppCardMaterial; 