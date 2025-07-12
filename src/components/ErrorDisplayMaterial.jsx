import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  AlertTitle,
  Box,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  BugReport as BugIcon,
  Lightbulb as SolutionIcon,
  PlayArrow as ActionIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  NetworkCheck as NetworkIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Schedule as ScheduleIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { ERROR_CATEGORIES, DETAILED_ERROR_MESSAGES, ERROR_RECOVERY_SUGGESTIONS } from '../utils/constants.js';
import { DEBUG } from '../utils/debug.js';

/**
 * Componente per visualizzare errori in modo user-friendly
 */
export default function ErrorDisplayMaterial({ 
  error, 
  open, 
  onClose, 
  onRetry, 
  onRecover,
  showDetails = false,
  autoRecovery = true 
}) {
  const [isRecovering, setIsRecovering] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  if (!error || !open) return null;

  const errorCategory = ERROR_CATEGORIES[error.category] || ERROR_CATEGORIES.UNKNOWN;
  const errorDetails = DETAILED_ERROR_MESSAGES[error.code] || DETAILED_ERROR_MESSAGES.GENERIC_ERROR;

  const handleRetry = async () => {
    if (onRetry) {
      try {
        await onRetry();
        onClose();
      } catch (retryError) {
        DEBUG.error('Errore durante retry:', retryError);
      }
    }
  };

  const handleRecovery = async (recoveryAction) => {
    if (onRecover) {
      setIsRecovering(true);
      try {
        await onRecover(recoveryAction);
        onClose();
      } catch (recoveryError) {
        DEBUG.error('Errore durante recovery:', recoveryError);
      } finally {
        setIsRecovering(false);
      }
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'NETWORK':
        return <NetworkIcon />;
      case 'AUTHENTICATION':
        return <SecurityIcon />;
      case 'STORAGE':
        return <StorageIcon />;
      case 'RATE_LIMIT':
        return <ScheduleIcon />;
      case 'VALIDATION':
        return <WarningIcon />;
      case 'TEMPORARY':
        return <RefreshIcon />;
      default:
        return <ErrorIcon />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'info';
      default:
        return 'error';
    }
  };

  const getRecoverySuggestions = () => {
    const suggestions = ERROR_RECOVERY_SUGGESTIONS[error.category] || ERROR_RECOVERY_SUGGESTIONS.GENERIC_ERROR;
    return suggestions || [];
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: '300px'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        bgcolor: `${getSeverityColor(error.severity)}.main`,
        color: 'white',
        '& .MuiTypography-root': {
          color: 'white'
        }
      }}>
        {getCategoryIcon(error.category)}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" component="div">
            {errorDetails.title}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {errorCategory.name} • {error.operationName}
          </Typography>
        </Box>
        <Chip 
          label={error.severity} 
          size="small" 
          sx={{ 
            bgcolor: 'rgba(255,255,255,0.2)',
            color: 'white'
          }}
        />
        <IconButton 
          onClick={onClose}
          sx={{ color: 'white' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Alert 
            severity={getSeverityColor(error.severity)}
            sx={{ mb: 2 }}
          >
            <AlertTitle>{errorDetails.title}</AlertTitle>
            {errorDetails.message}
          </Alert>

          {error.userMessage && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {error.userMessage}
            </Typography>
          )}
        </Box>

        {/* Soluzione suggerita */}
        {errorDetails.solution && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <SolutionIcon color="primary" />
              <Typography variant="h6">
                Soluzione Suggerita
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {errorDetails.solution}
            </Typography>
          </Box>
        )}

        {/* Azioni disponibili */}
        {errorDetails.actions && errorDetails.actions.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ActionIcon color="primary" />
              <Typography variant="h6">
                Azioni Disponibili
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {errorDetails.actions.map((action, index) => (
                <Button
                  key={index}
                  variant="outlined"
                  size="small"
                  onClick={() => handleRecovery(action)}
                  disabled={isRecovering}
                  startIcon={isRecovering ? <CircularProgress size={16} /> : <ActionIcon />}
                >
                  {action}
                </Button>
              ))}
            </Box>
          </Box>
        )}

        {/* Suggerimenti per la risoluzione */}
        {autoRecovery && getRecoverySuggestions().length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HelpIcon color="info" />
                  <Typography variant="h6">
                    Suggerimenti per la Risoluzione
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {getRecoverySuggestions().map((suggestion, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon>
                        <InfoIcon color="info" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={suggestion}
                        primaryTypographyProps={{
                          variant: 'body2'
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          </Box>
        )}

        {/* Dettagli tecnici */}
        {showDetails && (
          <Box sx={{ mb: 3 }}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BugIcon color="action" />
                  <Typography variant="h6">
                    Dettagli Tecnici
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                  <Typography variant="body2" component="pre" sx={{ 
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    fontSize: '0.8rem'
                  }}>
                    {JSON.stringify({
                      category: error.category,
                      severity: error.severity,
                      operationName: error.operationName,
                      technicalMessage: error.technicalMessage,
                      timestamp: error.timestamp,
                      context: error.context
                    }, null, 2)}
                  </Typography>
                </Box>
              </AccordionDetails>
            </Accordion>
          </Box>
        )}

        {/* Informazioni aggiuntive */}
        <Box sx={{ 
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          p: 2
        }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Categoria:</strong> {errorCategory.description}<br/>
            <strong>Tempo:</strong> {new Date(error.timestamp).toLocaleString()}<br/>
            <strong>Riprovabile:</strong> {error.isRetryable ? 'Sì' : 'No'}<br/>
            {error.suggestedAction && (
              <>
                <strong>Azione suggerita:</strong> {error.suggestedAction}
              </>
            )}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button 
          onClick={onClose}
          color="primary"
        >
          Chiudi
        </Button>
        
        {error.isRetryable && onRetry && (
          <Button 
            onClick={handleRetry}
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
          >
            Riprova
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
} 