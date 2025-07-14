import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Box,
  useTheme,
  useMediaQuery,
  Avatar,
  Chip,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Button
} from '@mui/material';
import {
  Menu as MenuIcon,
  Apps as AppsIcon,
  Favorite as FavoriteIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Dashboard as DashboardIcon,
  Category as CategoryIcon,
  Star as StarIcon,
  History as HistoryIcon,
  CloudSync as CloudSyncIcon,
  Info as InfoIcon,
  Help as HelpIcon,
  Close as CloseIcon,
  Store as StoreIcon
} from '@mui/icons-material';
import { useSyncStatus } from '../utils/useSyncStatus.js';

/**
 * Componente di navigazione Material UI con drawer e app bar
 */
const NavigationMaterial = ({
  drawerOpen,
  onDrawerToggle,
  onSettingsOpen,
  onThemeToggle,
  onSyncManagerOpen,
  currentView,
  onViewChange,
  favoriteCount = 0,
  totalApps = 0,
  theme,
  mode,
  bottomBar = false,
  userInfo = null,
  isAuthenticated = false
}) => {
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isEnabled, isInProgress, error, nextSync, manualSync } = useSyncStatus();
  const [syncStatusDialogOpen, setSyncStatusDialogOpen] = React.useState(false);
  const [aboutDialogOpen, setAboutDialogOpen] = React.useState(false);

  // Handler per il pulsante aiuto
  const handleHelpClick = () => {
    window.open('https://github.com/mccoy88f/aideas.run/wiki', '_blank');
  };

  // Handler per il pulsante informazioni
  const handleAboutClick = () => {
    setAboutDialogOpen(true);
  };

  // Data dell'ultima build
  const buildDate = new Date().toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const navigationItems = [
    {
      id: 'all',
      label: 'Tutte le App',
      icon: <AppsIcon />,
      count: totalApps,
      primary: true
    },
    {
      id: 'favorites',
      label: 'Preferiti',
      icon: <FavoriteIcon />,
      count: favoriteCount,
      color: 'secondary'
    },
    {
      id: 'store',
      label: 'AIdeas Store',
      icon: <StoreIcon />,
      color: 'secondary'
    },
    {
      id: 'recent',
      label: 'Recenti',
      icon: <HistoryIcon />,
      count: 0
    },
    {
      id: 'categories',
      label: 'Categorie',
      icon: <CategoryIcon />,
      count: 0
    }
  ];

  const secondaryItems = [
    {
      id: 'help',
      label: 'Aiuto',
      icon: <HelpIcon />
    },
    {
      id: 'about',
      label: 'Informazioni',
      icon: <InfoIcon />
    }
  ];

  const drawerWidth = 280;

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header con info utente se autenticato */}
      {isAuthenticated && userInfo ? (
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Avatar
              src={userInfo.picture}
              sx={{ width: 40, height: 40 }}
            >
              {userInfo.name ? userInfo.name.charAt(0).toUpperCase() : <PersonIcon />}
            </Avatar>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {userInfo.name || userInfo.email}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {userInfo.email}
              </Typography>
            </Box>
          </Box>
          <Chip
            label="Sincronizzato"
            size="small"
            color="success"
            sx={{ height: 20, fontSize: '0.7rem' }}
          />
        </Box>
      ) : (
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
          <Typography variant="caption" color="text.secondary">
            Non sincronizzato
          </Typography>
        </Box>
      )}

      {/* Lista principale */}
      <List sx={{ flexGrow: 1, py: 0 }}>
        {navigationItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              selected={currentView === item.id}
              onClick={() => onViewChange(item.id)}
              sx={{
                mx: 1,
                borderRadius: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)'
                  }
                },
                '&:hover': {
                  background: 'rgba(99, 102, 241, 0.1)'
                }
              }}
            >
              <ListItemIcon
                sx={{
                  color: currentView === item.id ? 'white' : 'inherit',
                  minWidth: 40
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: currentView === item.id ? 600 : 400
                }}
              />
              {item.count > 0 && (
                <Chip
                  label={item.count}
                  size="small"
                  sx={{
                    background: currentView === item.id ? 'rgba(255, 255, 255, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                    color: currentView === item.id ? 'white' : 'inherit',
                    minWidth: 24,
                    height: 20
                  }}
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* Lista secondaria */}
      <List sx={{ py: 0 }}>
        {secondaryItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              onClick={() => {
                if (item.id === 'help') {
                  handleHelpClick();
                } else if (item.id === 'about') {
                  handleAboutClick();
                }
              }}
              sx={{
                mx: 1,
                borderRadius: 1,
                mb: 0.5,
                '&:hover': {
                  background: 'rgba(99, 102, 241, 0.1)'
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Footer del drawer */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary">
            v1.0.0
          </Typography>
          <IconButton
            size="small"
            onClick={onThemeToggle}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                color: 'primary.main'
              }
            }}
          >
            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      {/* App Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          background: theme.palette.background.paper,
          backdropFilter: 'blur(20px)',
          borderRadius: 0,
          borderBottom: !bottomBar ? `1px solid ${theme.palette.divider}` : undefined,
          borderTop: bottomBar ? `1px solid ${theme.palette.divider}` : undefined,
          zIndex: theme.zIndex.drawer + 1,
          color: theme.palette.text.primary,
          top: bottomBar ? 'auto' : 0,
          bottom: bottomBar ? 0 : 'auto',
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{
              color: theme.palette.primary.main,
              fontWeight: 700,
              ml: 2
            }}
          >
            AIdeas
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
            <IconButton color="inherit">
              <SearchIcon />
            </IconButton>
            
            <IconButton
              color="inherit"
              onClick={() => setSyncStatusDialogOpen(true)}
              title={isInProgress ? 'Sincronizzazione in corso' : (isEnabled ? 'Sincronizzazione attiva' : 'Sincronizzazione disattivata')}
            >
              <CloudSyncIcon sx={{ color: isInProgress ? 'gold' : (isEnabled ? 'green' : 'red') }} />
            </IconButton>
            
            <IconButton
              color="inherit"
              onClick={onThemeToggle}
            >
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>

            <IconButton
              color="inherit"
              onClick={onSettingsOpen}
            >
              <SettingsIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer per mobile */}
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={onDrawerToggle}
        ModalProps={{
          keepMounted: true // Migliore performance su mobile
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            background: theme.palette.background.paper,
            backdropFilter: 'blur(20px)',
            borderRadius: 0,
            borderRight: `1px solid ${theme.palette.divider}`,
            top: 0,
            height: '100vh',
          }
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Drawer per desktop */}
      <Drawer
        variant="permanent"
        open={drawerOpen}
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            width: drawerOpen ? drawerWidth : 0,
            background: theme.palette.background.paper,
            backdropFilter: 'blur(20px)',
            borderRadius: 0,
            borderRight: `1px solid ${theme.palette.divider}`,
            boxSizing: 'border-box',
            top: !bottomBar ? { xs: '56px', sm: '64px' } : 0,
            height: !bottomBar ? { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' } : '100vh',
            transition: 'width 0.3s ease',
            overflow: 'hidden'
          }
        }}
      >
        {drawerContent}
      </Drawer>

      <Dialog open={syncStatusDialogOpen} onClose={() => setSyncStatusDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Stato sincronizzazione</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Chip label={isInProgress ? 'In corso...' : (isEnabled ? 'Attiva' : 'Disattivata')} color={isInProgress ? 'warning' : (isEnabled ? 'success' : 'error')} />
            {error && <Alert severity="error">{error}</Alert>}
            <Typography variant="body2">Prossimo sync: {nextSync ? nextSync.toLocaleTimeString() : 'N/A'}</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={manualSync} disabled={!isEnabled || isInProgress} variant="contained">Sincronizza ora</Button>
          <Button onClick={() => setSyncStatusDialogOpen(false)}>Chiudi</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={aboutDialogOpen} onClose={() => setAboutDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: 'primary.main',
                fontSize: '1.5rem',
                fontWeight: 'bold'
              }}
            >
              AI
            </Avatar>
            <Box>
              <Typography variant="h6" component="div">
                AIdeas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                v1.0.0
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Ultima build: {buildDate}
            </Typography>
            <Divider />
            <Typography variant="body2">
              Creato da <strong>Antonello Migliorelli</strong>
            </Typography>
            <Typography variant="body2">
              Link: <a href="https://github.com/mccoy88f/aideas.run" target="_blank" rel="noopener noreferrer" style={{ color: theme.palette.primary.main, textDecoration: 'none' }}>
                https://github.com/mccoy88f/aideas.run
              </a>
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAboutDialogOpen(false)}>Chiudi</Button>
        </DialogActions>
      </Dialog>

    </>
  );
};

export default NavigationMaterial; 