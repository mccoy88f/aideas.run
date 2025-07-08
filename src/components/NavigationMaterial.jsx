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
  Badge
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
  Help as HelpIcon
} from '@mui/icons-material';

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
      id: 'sync',
      label: 'Sincronizzazione',
      icon: <CloudSyncIcon />,
      badge: 'Beta'
    },
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
                if (item.id === 'sync') {
                  onSyncManagerOpen();
                } else if (item.id === 'help') {
                  // Gestisci aiuto
                } else if (item.id === 'about') {
                  // Gestisci informazioni
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
              {item.badge && (
                <Chip
                  label={item.badge}
                  size="small"
                  color="secondary"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              )}
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
              onClick={onSyncManagerOpen}
              title="Sincronizzazione"
            >
              <CloudSyncIcon />
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


    </>
  );
};

export default NavigationMaterial; 