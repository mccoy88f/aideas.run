import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Avatar,
  Box,
  useTheme,
  Tooltip,
  IconButton,
  CircularProgress,
  Link
} from '@mui/material';
import {
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  GitHub as GitHubIcon,
  Info as InfoIcon,
  Tag as TagIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  Star as StarIcon
} from '@mui/icons-material';

/**
 * Componente StoreAppCard per le app dello store
 */
const StoreAppCard = ({ 
  app, 
  onInstall, 
  onShowInfo,
  isInstalled = false,
  isInstalling = false,
  isInstallingApp = null
}) => {
  const theme = useTheme();

  const getCategoryColor = (category) => {
    const colors = {
      'utility': 'primary',
      'game': 'secondary',
      'productivity': 'success',
      'social': 'warning',
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
    if (!icon) return false;
    
    // Test più robusto per le emoji
    // Includiamo sia Unicode emoji che simboli speciali
    const emojiRegex = /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]$/u;
    
    // Controlla se è una singola emoji o simbolo
    if (icon.length === 1 || icon.length === 2) {
      return emojiRegex.test(icon) || icon.charCodeAt(0) > 255;
    }
    
    return false;
  };

  const getAppIcon = (app) => {
    if (app.icon) {
      if (isEmoji(app.icon)) {
        return (
          <Avatar
            sx={{ 
              width: 48, 
              height: 48, 
              fontSize: '24px',
              bgcolor: 'transparent',
              border: `2px solid ${theme.palette.grey[300]}`
            }}
          >
            {app.icon}
          </Avatar>
        );
      } else if (app.icon.startsWith('data:') || app.icon.startsWith('http')) {
        return (
          <Avatar
            src={app.icon}
            sx={{ 
              width: 48, 
              height: 48,
              border: `2px solid ${theme.palette.grey[300]}`
            }}
          />
        );
      }
    }
    
    return (
      <Avatar 
        sx={{ 
          width: 48, 
          height: 48, 
          bgcolor: theme.palette.primary.main,
          border: `2px solid ${theme.palette.grey[300]}`
        }}
      >
        {getInitials(app.name)}
      </Avatar>
    );
  };

  const formatLastModified = (lastModified) => {
    if (!lastModified) return 'Data non disponibile';
    
    const date = new Date(lastModified);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Oggi';
    if (days === 1) return 'Ieri';
    if (days < 7) return `${days} giorni fa`;
    if (days < 30) return `${Math.floor(days / 7)} settimane fa`;
    if (days < 365) return `${Math.floor(days / 30)} mesi fa`;
    return `${Math.floor(days / 365)} anni fa`;
  };

  const handleInstall = () => {
    if (onInstall && !isInstalled && !isInstalling) {
      onInstall(app);
    }
  };

  const handleShowInfo = () => {
    if (onShowInfo) {
      onShowInfo(app);
    }
  };

  const isCurrentlyInstalling = isInstalling && isInstallingApp === app.id;

  return (
    <Card 
      elevation={2}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4]
        },
        border: `1px solid ${theme.palette.grey[200]}`,
        position: 'relative',
        overflow: 'visible'
      }}
    >
      {/* Badge per app installata */}
      {isInstalled && (
        <Box
          sx={{
            position: 'absolute',
            top: -8,
            right: -8,
            zIndex: 1
          }}
        >
          <Chip 
            icon={<CheckCircleIcon />}
            label="Installata"
            size="small"
            color="success"
            sx={{
              fontSize: '0.75rem',
              fontWeight: 600
            }}
          />
        </Box>
      )}

      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Header con icona e info base */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          {getAppIcon(app)}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography 
              variant="h6" 
              component="h2" 
              sx={{ 
                fontWeight: 600,
                lineHeight: 1.2,
                mb: 0.5,
                wordBreak: 'break-word'
              }}
            >
              {app.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <PersonIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
              <Typography variant="body2" color="text.secondary">
                {app.author || 'Autore sconosciuto'}
              </Typography>
            </Box>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: '0.8rem' }}
            >
              v{app.version} • {formatLastModified(app.lastModified)}
            </Typography>
          </Box>
        </Box>

        {/* Descrizione */}
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.4
          }}
        >
          {app.description || 'Nessuna descrizione disponibile'}
        </Typography>

        {/* Categoria */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CategoryIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
          <Chip 
            label={app.category || 'altro'} 
            size="small"
            color={getCategoryColor(app.category)}
            variant="outlined"
          />
        </Box>

        {/* Tags */}
        {app.tags && app.tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
            <TagIcon sx={{ fontSize: 16, color: theme.palette.text.secondary, mr: 0.5 }} />
            {app.tags.slice(0, 3).map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            ))}
            {app.tags.length > 3 && (
              <Chip
                label={`+${app.tags.length - 3}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            )}
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ pt: 0, pb: 2, px: 2, gap: 1 }}>
        {/* Pulsante principale */}
        <Button
          variant={isInstalled ? "outlined" : "contained"}
          color={isInstalled ? "success" : "primary"}
          onClick={handleInstall}
          disabled={isInstalled || isCurrentlyInstalling}
          startIcon={
            isCurrentlyInstalling ? (
              <CircularProgress size={16} />
            ) : isInstalled ? (
              <CheckCircleIcon />
            ) : (
              <DownloadIcon />
            )
          }
          sx={{ flexGrow: 1 }}
        >
          {isCurrentlyInstalling ? 'Installando...' : 
           isInstalled ? 'Installata' : 'Installa'}
        </Button>

        {/* Pulsante informazioni */}
        <Tooltip title="Informazioni app">
          <IconButton 
            onClick={handleShowInfo}
            size="small"
            sx={{ 
              border: `1px solid ${theme.palette.grey[300]}`,
              '&:hover': {
                bgcolor: theme.palette.action.hover
              }
            }}
          >
            <InfoIcon />
          </IconButton>
        </Tooltip>

        {/* Link GitHub se disponibile */}
        {app.githubUrl && (
          <Tooltip title="Visualizza su GitHub">
            <IconButton 
              component={Link}
              href={app.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              sx={{ 
                border: `1px solid ${theme.palette.grey[300]}`,
                '&:hover': {
                  bgcolor: theme.palette.action.hover
                }
              }}
            >
              <GitHubIcon />
            </IconButton>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );
};

export default StoreAppCard; 