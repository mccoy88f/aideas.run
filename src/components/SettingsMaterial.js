import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  useTheme,
  useMediaQuery,
  Alert,
  IconButton,
  Paper,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Close as CloseIcon,
  Settings as SettingsIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Sync as SyncIcon,
  ExpandMore as ExpandMoreIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  AutoAwesome as AutoAwesomeIcon,
  Save as SaveIcon,
  Restore as RestoreIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon
} from '@mui/icons-material';

/**
 * Componente Settings Material UI con aspetto glossy
 */
const SettingsMaterial = ({
  open,
  onClose,
  settings = {},
  onSettingsChange,
  onExport,
  onImport,
  onReset
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [localSettings, setLocalSettings] = useState(settings);
  const [activeSection, setActiveSection] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);

  const sections = [
    {
      id: 'general',
      title: 'Generale',
      icon: <SettingsIcon />,
      description: 'Impostazioni generali dell\'applicazione'
    },
    {
      id: 'appearance',
      title: 'Aspetto',
      icon: <PaletteIcon />,
      description: 'Tema, colori e personalizzazione'
    },
    {
      id: 'notifications',
      title: 'Notifiche',
      icon: <NotificationsIcon />,
      description: 'Gestione notifiche e avvisi'
    },
    {
      id: 'sync',
      title: 'Sincronizzazione',
      icon: <SyncIcon />,
      description: 'Backup e sincronizzazione dati'
    },
    {
      id: 'security',
      title: 'Sicurezza',
      icon: <SecurityIcon />,
      description: 'Impostazioni di sicurezza e privacy'
    }
  ];

  const handleSettingChange = (key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSettingsChange(localSettings);
    setHasChanges(false);
    onClose();
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    setHasChanges(false);
    onClose();
  };

  const renderGeneralSettings = () => (
    <Box sx={{ space: 3 }}>
      <Typography variant="h6" gutterBottom>
        Impostazioni Generali
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Nome utente"
            value={localSettings.username || ''}
            onChange={(e) => handleSettingChange('username', e.target.value)}
            variant="outlined"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Lingua</InputLabel>
            <Select
              value={localSettings.language || 'it'}
              onChange={(e) => handleSettingChange('language', e.target.value)}
              label="Lingua"
            >
              <MenuItem value="it">Italiano</MenuItem>
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="es">Español</MenuItem>
              <MenuItem value="fr">Français</MenuItem>
              <MenuItem value="de">Deutsch</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.autoSave || false}
                onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
              />
            }
            label="Salvataggio automatico"
          />
        </Grid>
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.startupLaunch || false}
                onChange={(e) => handleSettingChange('startupLaunch', e.target.checked)}
              />
            }
            label="Avvia all'avvio del sistema"
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderAppearanceSettings = () => (
    <Box sx={{ space: 3 }}>
      <Typography variant="h6" gutterBottom>
        Personalizzazione Aspetto
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Tema</InputLabel>
            <Select
              value={localSettings.theme || 'system'}
              onChange={(e) => handleSettingChange('theme', e.target.value)}
              label="Tema"
            >
              <MenuItem value="light">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LightModeIcon />
                  Chiaro
                </Box>
              </MenuItem>
              <MenuItem value="dark">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DarkModeIcon />
                  Scuro
                </Box>
              </MenuItem>
              <MenuItem value="system">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AutoAwesomeIcon />
                  Sistema
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Modalità visualizzazione</InputLabel>
            <Select
              value={localSettings.viewMode || 'grid'}
              onChange={(e) => handleSettingChange('viewMode', e.target.value)}
              label="Modalità visualizzazione"
            >
              <MenuItem value="grid">Griglia</MenuItem>
              <MenuItem value="list">Lista</MenuItem>
              <MenuItem value="compact">Compatta</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <Typography gutterBottom>
            Dimensione card: {localSettings.cardSize || 1}
          </Typography>
          <Slider
            value={localSettings.cardSize || 1}
            onChange={(e, value) => handleSettingChange('cardSize', value)}
            min={0.5}
            max={2}
            step={0.1}
            marks
            valueLabelDisplay="auto"
          />
        </Grid>
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.animations || true}
                onChange={(e) => handleSettingChange('animations', e.target.checked)}
              />
            }
            label="Animazioni"
          />
        </Grid>
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.glossy || true}
                onChange={(e) => handleSettingChange('glossy', e.target.checked)}
              />
            }
            label="Effetto glossy"
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderNotificationSettings = () => (
    <Box sx={{ space: 3 }}>
      <Typography variant="h6" gutterBottom>
        Gestione Notifiche
      </Typography>
      
      <List>
        <ListItem>
          <ListItemIcon>
            <NotificationsIcon />
          </ListItemIcon>
          <ListItemText
            primary="Notifiche push"
            secondary="Ricevi notifiche per aggiornamenti e attività"
          />
          <ListItemSecondaryAction>
            <Switch
              checked={localSettings.pushNotifications || false}
              onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
            />
          </ListItemSecondaryAction>
        </ListItem>
        
        <ListItem>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText
            primary="Notifiche sistema"
            secondary="Mostra notifiche nel sistema operativo"
          />
          <ListItemSecondaryAction>
            <Switch
              checked={localSettings.systemNotifications || true}
              onChange={(e) => handleSettingChange('systemNotifications', e.target.checked)}
            />
          </ListItemSecondaryAction>
        </ListItem>
        
        <ListItem>
          <ListItemIcon>
            <SyncIcon />
          </ListItemIcon>
          <ListItemText
            primary="Notifiche sincronizzazione"
            secondary="Avvisi per backup e sincronizzazione"
          />
          <ListItemSecondaryAction>
            <Switch
              checked={localSettings.syncNotifications || true}
              onChange={(e) => handleSettingChange('syncNotifications', e.target.checked)}
            />
          </ListItemSecondaryAction>
        </ListItem>
      </List>
    </Box>
  );

  const renderSyncSettings = () => (
    <Box sx={{ space: 3 }}>
      <Typography variant="h6" gutterBottom>
        Sincronizzazione e Backup
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Backup Locale
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Salva i tuoi dati localmente per backup e ripristino
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<CloudDownloadIcon />}
                onClick={() => onExport?.()}
              >
                Esporta Dati
              </Button>
              <Button
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                onClick={() => onImport?.()}
              >
                Importa Dati
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.autoBackup || false}
                onChange={(e) => handleSettingChange('autoBackup', e.target.checked)}
              />
            }
            label="Backup automatico"
          />
        </Grid>
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.cloudSync || false}
                onChange={(e) => handleSettingChange('cloudSync', e.target.checked)}
              />
            }
            label="Sincronizzazione cloud (Beta)"
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderSecuritySettings = () => (
    <Box sx={{ space: 3 }}>
      <Typography variant="h6" gutterBottom>
        Sicurezza e Privacy
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.analytics || false}
                onChange={(e) => handleSettingChange('analytics', e.target.checked)}
              />
            }
            label="Analytics e telemetria"
          />
        </Grid>
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.crashReports || true}
                onChange={(e) => handleSettingChange('crashReports', e.target.checked)}
              />
            }
            label="Invia report di crash"
          />
        </Grid>
        
        <Grid item xs={12}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => onReset?.()}
            fullWidth
          >
            Reset Impostazioni
          </Button>
        </Grid>
      </Grid>
    </Box>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'general':
        return renderGeneralSettings();
      case 'appearance':
        return renderAppearanceSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'sync':
        return renderSyncSettings();
      case 'security':
        return renderSecuritySettings();
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" component="h2">
            Impostazioni
          </Typography>
          <IconButton onClick={handleCancel}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 0 }}>
        {hasChanges && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Hai modifiche non salvate
          </Alert>
        )}

        <Box sx={{ display: 'flex', height: '60vh' }}>
          {/* Sidebar per desktop */}
          {!isMobile && (
            <Box sx={{ width: 240, borderRight: '1px solid rgba(0, 0, 0, 0.08)', pr: 2 }}>
              <List>
                {sections.map((section) => (
                  <ListItem
                    key={section.id}
                    button
                    selected={activeSection === section.id}
                    onClick={() => setActiveSection(section.id)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      '&.Mui-selected': {
                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                        color: 'white',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)'
                        }
                      }
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: activeSection === section.id ? 'white' : 'inherit',
                        minWidth: 40
                      }}
                    >
                      {section.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={section.title}
                      primaryTypographyProps={{
                        fontWeight: activeSection === section.id ? 600 : 400
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Contenuto principale */}
          <Box sx={{ flex: 1, pl: isMobile ? 0 : 3 }}>
            {isMobile ? (
              <Box>
                {sections.map((section) => (
                  <Accordion key={section.id}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {section.icon}
                        <Typography variant="subtitle1">
                          {section.title}
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      {section.id === 'general' && renderGeneralSettings()}
                      {section.id === 'appearance' && renderAppearanceSettings()}
                      {section.id === 'notifications' && renderNotificationSettings()}
                      {section.id === 'sync' && renderSyncSettings()}
                      {section.id === 'security' && renderSecuritySettings()}
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            ) : (
              renderSectionContent()
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button onClick={handleCancel}>
          Annulla
        </Button>
        
        <Box sx={{ flex: '1 1 auto' }} />
        
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!hasChanges}
          startIcon={<SaveIcon />}
          sx={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)'
            }
          }}
        >
          Salva
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsMaterial; 