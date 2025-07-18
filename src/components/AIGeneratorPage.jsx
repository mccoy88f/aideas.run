import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Chip,
  Alert,
  LinearProgress,
  Card,
  CardContent,
  CardActions,
  Divider,
  Stack,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Paper,
  Fab,
  useTheme,
  useMediaQuery,
  CircularProgress,
  AppBar,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import StorageService from '../services/StorageService.js';
import { showToast } from '../utils/helpers.js';
import {
  ArrowBack as ArrowBackIcon,
  SmartToy as AIIcon,
  Apps as AppsIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Chat as ChatIcon,
  Send as SendIcon,
  PlayArrow as PlayIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Close as CloseIcon
} from '@mui/icons-material';

/**
 * Pagina per la generazione di app tramite AI usando Puter.js
 */
const AIGeneratorPage = ({ onNavigateBack, onAppGenerated, onEditInstalledApp }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State per il form
  const [formData, setFormData] = useState({
    appName: '',
    appDescription: '',
    appType: '',
    aiModel: 'gpt-4o'
  });
  
  // State per l'autenticazione Puter
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  
  // State per la generazione
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentApp, setCurrentApp] = useState(null);
  const [generatedApps, setGeneratedApps] = useState([]);
  
  // State per la chat di modifica
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isModifying, setIsModifying] = useState(false);
  
  // State per preview
  const [previewOpen, setPreviewOpen] = useState(false);
  
  // Inizializzazione Puter.js solo quando l'utente clicca su login
  const [puterInitialized, setPuterInitialized] = useState(false);
  
  // Ref per mantenere l'istanza Puter
  const puterRef = useRef(null);
  
  // Flag per indicare se il login è in corso
  const [loginInProgress, setLoginInProgress] = useState(false);

  // Modelli AI disponibili (solo quelli supportati da Puter)
  const aiModels = [
    { value: 'gpt-4o', label: 'GPT-4o (OpenAI)', group: '🔥 Consigliati' },
    { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (Anthropic)', group: '🔥 Consigliati' },
    { value: 'openrouter:deepseek/deepseek-r1', label: 'DeepSeek R1 (Gratuito)', group: '🔥 Consigliati' },
    { value: 'openrouter:openai/o1-mini', label: 'o1-mini (Reasoning)', group: '🔥 Consigliati' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (OpenAI)', group: '⚡ Altri' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (OpenAI)', group: '⚡ Altri' },
    { value: 'claude-3-haiku', label: 'Claude 3 Haiku (Anthropic)', group: '⚡ Altri' },
    { value: 'gemini-pro', label: 'Gemini Pro (Google)', group: '⚡ Altri' }
  ];
  
  // Tipi di app
  const appTypes = [
    { value: 'utility', label: 'Utility / Strumento', icon: '🔧' },
    { value: 'game', label: 'Gioco', icon: '🎮' },
    { value: 'productivity', label: 'Produttività', icon: '📊' },
    { value: 'calculator', label: 'Calcolatrice', icon: '🧮' },
    { value: 'dashboard', label: 'Dashboard', icon: '📈' },
    { value: 'form', label: 'Form / Modulo', icon: '📝' },
    { value: 'creative', label: 'Creativo', icon: '🎨' },
    { value: 'other', label: 'Altro', icon: '⚡' }
  ];

  // Controlla stato autenticazione quando Puter è inizializzato
  useEffect(() => {
    // Non controllare automaticamente l'autenticazione quando Puter viene inizializzato
    // Il controllo verrà fatto solo quando l'utente clicca su login o quando torna da un redirect
  }, [puterInitialized]);

  // Controlla autenticazione quando la pagina si carica
  useEffect(() => {
    console.log('🚪 Pagina caricata, controllo stato autenticazione...');
    
    // Prima prova a caricare lo stato salvato (come Google Drive)
    const loaded = loadAuthState();
    if (loaded) {
      console.log('✅ Stato autenticazione caricato da localStorage');
    }
    
    // Se Puter è già disponibile globalmente, controlla lo stato
    if (window.puter && !puterInitialized) {
      console.log('✅ Puter già disponibile globalmente');
      // Inizializza con la nuova API
      puterRef.current = window.puter.init({
        appId: 'aideas-ai-generator',
        appName: 'AIdeas AI Generator',
        appIcon: '🤖'
      });
      setPuterInitialized(true);
      // Controlla subito l'autenticazione se Puter è disponibile
      setTimeout(() => {
        checkAuthStatus();
      }, 500);
    }
    
    // Controlla se c'è un parametro di ritorno dall'autenticazione
    const urlParams = new URLSearchParams(window.location.search);
    const authReturn = urlParams.get('auth_return');
    
    if (authReturn === 'success') {
      console.log('🔄 Rilevato ritorno da autenticazione');
      // Rimuovi il parametro dall'URL
      const newURL = new URL(window.location);
      newURL.searchParams.delete('auth_return');
      window.history.replaceState({}, '', newURL);
      
              // Controlla l'autenticazione dopo un breve delay
        setTimeout(() => {
          if (window.puter) {
            puterRef.current = window.puter.init({
              appId: 'aideas-ai-generator',
              appName: 'AIdeas AI Generator',
              appIcon: '🤖'
            });
            setPuterInitialized(true);
            checkAuthStatus();
          }
        }, 1000);
    }
  }, []);

  // Listener intelligente per cambiamenti di stato Puter
  useEffect(() => {
    // Listener per cambiamenti di visibilità della pagina
    const handleVisibilityChange = () => {
      // Non controllare se il login è in corso
      if (loginInProgress) {
        console.log('⏳ Login in corso, salto controllo visibility');
        return;
      }
      
      if (!document.hidden && window.puter && !isAuthenticated && puterInitialized) {
        // Assicurati che Puter sia inizializzato correttamente
        if (!puterRef.current) {
          puterRef.current = window.puter.init({
            appId: 'aideas-ai-generator',
            appName: 'AIdeas AI Generator',
            appIcon: '🤖'
          });
        }
        // Aspetta un momento prima di controllare l'autenticazione
        setTimeout(() => {
          checkAuthStatus();
        }, 1000);
      }
    };

    // Listener per messaggi da Puter (se supportato)
    const handleMessage = (event) => {
      if (event.origin === 'https://puter.com' && event.data?.type === 'auth') {
        // Non controllare se il login è in corso
        if (loginInProgress) {
          console.log('⏳ Login in corso, salto controllo messaggio');
          return;
        }
        
        if (window.puter && !isAuthenticated && puterInitialized) {
          // Assicurati che Puter sia inizializzato correttamente
          if (!puterRef.current) {
            puterRef.current = window.puter.init({
              appId: 'aideas-ai-generator',
              appName: 'AIdeas AI Generator',
              appIcon: '🤖'
            });
          }
          // Aspetta un momento prima di controllare l'autenticazione
          setTimeout(() => {
            checkAuthStatus();
          }, 1000);
        }
      }
    };

    // Controllo periodico per autenticazione (solo se non autenticato)
    const authCheckInterval = setInterval(() => {
      if (!loginInProgress && !isAuthenticated && puterInitialized && window.puter) {
        // Assicurati che Puter sia inizializzato correttamente
        if (!puterRef.current) {
          puterRef.current = window.puter;
        }
        checkAuthStatus();
      }
    }, 3000); // Controlla ogni 3 secondi

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('message', handleMessage);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('message', handleMessage);
      clearInterval(authCheckInterval);
    };
  }, [isAuthenticated, puterInitialized, loginInProgress]);

  // Salva stato quando cambia (come Google Drive)
  useEffect(() => {
    if (puterInitialized) {
      saveAuthState();
    }
  }, [isAuthenticated, userInfo]);

  // Inizializza Puter.js
  const initializePuter = async () => {
    try {
      console.log('🔄 Inizializzazione Puter...');
      
      // Carica Puter.js se non è già caricato
      if (typeof window.puter === 'undefined') {
        console.log('📥 Caricamento script Puter...');
        const script = document.createElement('script');
        script.src = 'https://js.puter.com/v2/';
        
        await new Promise((resolve, reject) => {
          script.onload = () => {
            console.log('✅ Script Puter caricato');
            resolve();
          };
          script.onerror = () => {
            console.error('❌ Errore caricamento script Puter');
            reject(new Error('Errore caricamento Puter.js'));
          };
          document.head.appendChild(script);
        });
      }
      
      // Inizializza Puter con la nuova API
      if (window.puter) {
        // Nuova API Puter - usa direttamente window.puter
        puterRef.current = window.puter;
        setPuterInitialized(true);
        console.log('✅ Puter inizializzato con successo');
        
        // Controlla se c'è un parametro di ritorno dall'autenticazione
        const urlParams = new URLSearchParams(window.location.search);
        const authReturn = urlParams.get('auth_return');
        
        if (authReturn === 'success') {
          console.log('🔄 Rilevato ritorno da autenticazione');
          // Rimuovi il parametro dall'URL
          const newURL = new URL(window.location);
          newURL.searchParams.delete('auth_return');
          window.history.replaceState({}, '', newURL);
          
          // Controlla l'autenticazione dopo un breve delay
          setTimeout(() => {
            checkAuthStatus();
          }, 1000);
        } else {
          // Controlla subito l'autenticazione
          setTimeout(() => {
            checkAuthStatus();
          }, 500);
        }
      }
    } catch (error) {
      console.error('❌ Errore inizializzazione Puter:', error);
      showToast('Errore inizializzazione Puter', 'error');
    }
  };

  // Controlla stato autenticazione
  const checkAuthStatus = async () => {
    if (!puterRef.current) {
      console.log('⚠️ Puter non ancora inizializzato');
      return;
    }
    
    try {
      console.log('🔍 Controllo stato autenticazione Puter...');
      
      // Controlla se l'utente è autenticato
      const isSignedIn = puterRef.current.auth.isSignedIn();
      console.log('🔐 Stato autenticazione:', isSignedIn);
      
      if (isSignedIn) {
        // Ottieni informazioni utente
        const user = await puterRef.current.auth.getUser();
        console.log('✅ Utente autenticato:', user);
        setIsAuthenticated(true);
        setUserInfo(user);
        
        // Carica le app generate
        await loadGeneratedApps();
      } else {
        console.log('❌ Utente non autenticato');
        setIsAuthenticated(false);
        setUserInfo(null);
      }
    } catch (error) {
      console.error('❌ Errore controllo autenticazione:', error);
      setIsAuthenticated(false);
      setUserInfo(null);
    }
  };

  // Gestione login
  const handleSignIn = async () => {
    if (!puterRef.current) {
      await initializePuter();
    }
    
    if (!puterRef.current) {
      showToast('Errore inizializzazione Puter', 'error');
      return;
    }
    
    try {
      setAuthLoading(true);
      setLoginInProgress(true);
      console.log('🔐 Avvio login Puter...');
      
      // Avvia il processo di autenticazione
      const currentURL = window.location.href;
      const redirectURL = new URL(currentURL);
      redirectURL.searchParams.set('auth_return', 'success');
      
      console.log('🌐 URL corrente:', currentURL);
      console.log('🔄 URL di redirect:', redirectURL.toString());
      
      // Prova prima popup, poi redirect
      try {
        console.log('🪟 Tentativo login con popup...');
        await puterRef.current.auth.signIn({ 
          mode: 'popup',
          redirectURL: redirectURL.toString()
        });
        console.log('✅ Login popup completato');
        
        // Aspetta un momento prima di controllare l'autenticazione
        setTimeout(() => {
          setLoginInProgress(false);
          checkAuthStatus();
        }, 3000);
        
      } catch (popupError) {
        console.log('⚠️ Popup fallito, uso redirect:', popupError);
        await puterRef.current.auth.signIn({ 
          mode: 'redirect',
          redirectURL: redirectURL.toString()
        });
        console.log('✅ Login redirect completato');
        setLoginInProgress(false);
      }
      
      console.log('✅ Login completato');
      showToast('Login completato!', 'success');
      
    } catch (error) {
      console.error('❌ Errore login:', error);
      showToast('Errore durante il login', 'error');
    } finally {
      setAuthLoading(false);
      setLoginInProgress(false);
    }
  };

  // Gestione logout
  const handleSignOut = async () => {
    try {
      if (puterRef.current) {
        // Logout
        await puterRef.current.auth.signOut();
      }
      setIsAuthenticated(false);
      setUserInfo(null);
      setGeneratedApps([]);
      showToast('Logout completato', 'success');
    } catch (error) {
      console.error('❌ Errore logout:', error);
      showToast('Errore durante il logout', 'error');
    }
  };

  // Carica app generate
  const loadGeneratedApps = async () => {
    if (!puterRef.current) return;
    
    try {
      const savedApps = await puterRef.current.kv.get('ai-launcher-apps');
      if (savedApps) {
        setGeneratedApps(JSON.parse(savedApps));
        console.log(`📱 Caricate ${JSON.parse(savedApps).length} app generate`);
      }
    } catch (error) {
      console.error('❌ Errore caricamento app generate:', error);
    }
  };

  // Salva app generate
  const saveGeneratedApps = async (apps) => {
    if (!puterRef.current) return;
    
    try {
      await puterRef.current.kv.set('ai-launcher-apps', JSON.stringify(apps));
      console.log(`💾 Salvate ${apps.length} app generate`);
    } catch (error) {
      console.error('❌ Errore salvataggio app generate:', error);
    }
  };

  // Salva stato autenticazione
  const saveAuthState = () => {
    try {
      const authState = {
        isAuthenticated,
        userInfo,
        timestamp: Date.now()
      };
      localStorage.setItem('puter_auth_state', JSON.stringify(authState));
    } catch (error) {
      console.error('❌ Errore salvataggio stato auth:', error);
    }
  };

  // Carica stato autenticazione
  const loadAuthState = () => {
    try {
      const saved = localStorage.getItem('puter_auth_state');
      if (saved) {
        const authState = JSON.parse(saved);
        // Controlla se lo stato è ancora valido (max 1 ora)
        if (Date.now() - authState.timestamp < 60 * 60 * 1000) {
          setIsAuthenticated(authState.isAuthenticated);
          setUserInfo(authState.userInfo);
          return true;
        } else {
          localStorage.removeItem('puter_auth_state');
        }
      }
    } catch (error) {
      console.error('❌ Errore caricamento stato auth:', error);
    }
    return false;
  };

  // Genera app
  const handleGenerateApp = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      showToast('Per usare l\'AI devi prima fare il login con Puter.', 'warning');
      return;
    }
    
    const { appName, appDescription, appType, aiModel } = formData;
    
    if (!appName || !appDescription || !appType) {
      showToast('Per favore compila tutti i campi richiesti', 'warning');
      return;
    }

    setIsGenerating(true);

    try {
      if (!puterRef.current) {
        throw new Error('Puter non inizializzato');
      }

      const prompt = `Crea una app web HTML completa chiamata "${appName}".

DESCRIZIONE: ${appDescription}
TIPO: ${appType}

REQUISITI SPECIFICI:
- File HTML singolo autocontenuto
- Design moderno e responsive  
- Funzionalità completamente implementate
- Solo tecnologie client-side (HTML, CSS, JS)
- Usa Material Design o design moderno
- Colori e stile coerenti con il tema dell'app

Implementa tutte le funzionalità richieste senza usare placeholder.`;

      const response = await puterRef.current.ai.chat(prompt, {
        model: aiModel
      });

      let generatedCode = response.message.content;
      
      console.log('📄 Codice grezzo ricevuto:', generatedCode.substring(0, 200) + '...');
      
      // Pulisci il codice da eventuali markdown e testo extra
      generatedCode = generatedCode.replace(/```html\n?/g, '').replace(/```\n?/g, '');
      
      // Rimuovi tutto il testo prima del primo tag HTML
      const htmlStartIndex = generatedCode.search(/<!DOCTYPE html>|<html/i);
      if (htmlStartIndex !== -1) {
        generatedCode = generatedCode.substring(htmlStartIndex);
        console.log('✅ Trovato inizio HTML a posizione:', htmlStartIndex);
      } else {
        console.log('⚠️ Tag HTML non trovato, uso tutto il codice');
      }
      
      // Rimuovi tutto il testo dopo l'ultimo tag di chiusura HTML
      const htmlEndIndex = generatedCode.lastIndexOf('</html>');
      if (htmlEndIndex !== -1) {
        generatedCode = generatedCode.substring(0, htmlEndIndex + 7); // +7 per includere </html>
        console.log('✅ Trovata fine HTML a posizione:', htmlEndIndex);
      } else {
        console.log('⚠️ Tag di chiusura HTML non trovato');
      }
      
      // Rimuovi eventuali spiegazioni o testo extra rimanente
      generatedCode = generatedCode.replace(/###.*?(?=<!DOCTYPE html>|<html)/gis, '');
      generatedCode = generatedCode.replace(/###.*?(?=<\/html>)/gis, '');
      generatedCode = generatedCode.replace(/Spiegazione.*$/gis, '');
      generatedCode = generatedCode.replace(/Note.*$/gis, '');
      generatedCode = generatedCode.replace(/Come Utilizzare.*$/gis, '');
      generatedCode = generatedCode.replace(/Caratteristiche.*$/gis, '');
      generatedCode = generatedCode.replace(/Codice Completo:.*$/gis, '');
      generatedCode = generatedCode.replace(/Spero che questa soluzione.*$/gis, '');
      generatedCode = generatedCode.replace(/Se hai ulteriori domande.*$/gis, '');
      
      // Rimuovi righe vuote multiple e spazi extra
      generatedCode = generatedCode.replace(/\n\s*\n\s*\n/g, '\n\n');
      generatedCode = generatedCode.trim();
      
      console.log('🧹 Codice HTML pulito:', generatedCode.substring(0, 200) + '...');
      console.log('📏 Lunghezza codice finale:', generatedCode.length);
      
      const newApp = {
        id: Date.now(),
        name: appName,
        description: appDescription,
        type: appType,
        model: aiModel,
        code: generatedCode,
        icon: getIconForType(appType),
        createdAt: new Date().toISOString()
      };

      setCurrentApp(newApp);
      setPreviewOpen(true);
      
      // Inizializza chat history
      setChatMessages([
        { role: 'user', content: prompt },
        { role: 'assistant', content: response.message.content }
      ]);

    } catch (error) {
      console.error('Errore generazione:', error);
      showToast('Errore durante la generazione dell\'app: ' + error.message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Importa app in AIdeas
  const handleImportApp = async () => {
    if (!currentApp) return;
    
    try {
      console.log('📤 Avvio importazione app:', currentApp);
      
      // Aggiungi l'app alla lista generate
      const updatedApps = [currentApp, ...generatedApps];
      setGeneratedApps(updatedApps);
      await saveGeneratedApps(updatedApps);
      
      // Chiama la callback per importare in AIdeas
      if (onAppGenerated) {
        const appData = {
          name: currentApp.name,
          description: currentApp.description,
          icon: currentApp.icon,
          htmlContent: currentApp.code, // Il contenuto HTML pulito
          type: currentApp.type || 'utility',
          category: 'AI Generated',
          model: currentApp.model,
          originalPrompt: `Crea una app web HTML completa chiamata "${currentApp.name}". DESCRIZIONE: ${currentApp.description} TIPO: ${currentApp.type}`,
          // Aggiungi informazioni per il controllo duplicati
          isModification: currentApp.isModification || false,
          originalAppId: currentApp.originalAppId || null,
          originalUniqueId: currentApp.originalUniqueId || null
        };
        
        console.log('📦 Dati app da passare:', appData);
        onAppGenerated(appData);
      }
      
      showToast('✅ App importata in AIdeas!', 'success');
      
    } catch (error) {
      console.error('❌ Errore importazione:', error);
      showToast('Errore durante l\'importazione: ' + error.message, 'error');
    }
  };

  // Rigenera app
  const handleRegenerateApp = () => {
    if (!currentApp) return;
    
    setFormData({
      appName: currentApp.name,
      appDescription: currentApp.description,
      appType: currentApp.type,
      aiModel: currentApp.model
    });
    
    setCurrentApp(null);
    setPreviewOpen(false);
    setChatOpen(false);
  };

  // Modifica app corrente
  const handleModifyApp = async () => {
    if (!currentApp) return;
    
    setChatOpen(true);
    setChatMessages([
      { role: 'system', content: 'Sei un assistente per modificare app generate con AI. L\'utente può chiederti di modificare l\'app corrente.' }
    ]);
  };

  // Modifica app dalla lista generate
  const handleEditGeneratedApp = (app) => {
    setCurrentApp(app);
    setPreviewOpen(true);
    setChatOpen(true);
    setChatMessages([
      { role: 'system', content: 'Sei un assistente per modificare app generate con AI. L\'utente può chiederti di modificare l\'app corrente.' }
    ]);
  };

  // Modifica app installata in AIdeas (chiamata dal main)
  const handleEditInstalledApp = async (appId) => {
    try {
      // Ottieni i dati dell'app da StorageService
      const appData = await StorageService.getApp(appId);
      if (!appData) {
        showToast('App non trovata', 'error');
        return;
      }

      // Crea un oggetto app compatibile con il formato delle app generate
      const app = {
        id: appData.id,
        name: appData.name,
        description: appData.description,
        icon: appData.icon,
        code: appData.content, // Il contenuto HTML
        type: appData.metadata?.type || 'utility',
        model: appData.metadata?.aiModel || 'unknown',
        createdAt: appData.timestamp || new Date().toISOString(),
        uniqueId: appData.uniqueId,
        isInstalled: true,
        originalAppId: appData.id
      };

      setCurrentApp(app);
      setPreviewOpen(true);
      setChatOpen(true);
      setChatMessages([
        { role: 'system', content: 'Sei un assistente per modificare app generate con AI. L\'utente può chiederti di modificare l\'app corrente.' }
      ]);

    } catch (error) {
      console.error('Errore caricamento app per modifica:', error);
      showToast('Errore nel caricamento dell\'app', 'error');
    }
  };

  // Esponi la funzione globalmente quando il componente è montato
  useEffect(() => {
    window.handleEditInstalledApp = handleEditInstalledApp;
    
    return () => {
      delete window.handleEditInstalledApp;
    };
  }, []);

  // Invia messaggio chat
  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || !currentApp || !puterRef.current) return;
    
    const message = chatInput.trim();
    setChatInput('');
    setIsModifying(true);
    
    try {
      // Aggiungi messaggio utente
      setChatMessages(prev => [...prev, { role: 'user', content: message }]);
      
      const modifyPrompt = `RICHIESTA DI MODIFICA: ${message}

CODICE ATTUALE DELL'APP:
${currentApp.code}

Modifica il codice HTML in base alla richiesta, mantenendo tutte le funzionalità esistenti e aggiungendo le 
modifiche richieste. Restituisci SOLO il codice HTML completo modificato.`;

      const response = await puterRef.current.ai.chat(modifyPrompt, {
        model: formData.aiModel
      });

      const fullResponse = response.message.content;
      
      // Estrai il codice HTML dalla risposta
      const htmlMatch = fullResponse.match(/```html\n?([\s\S]*?)\n?```/);
      const newCode = htmlMatch ? htmlMatch[1] : fullResponse.replace(/```html\n?/g, '').replace(/```\n?/g, '');
      
      // Aggiorna app con nuovo codice e marca come modifica
      const updatedApp = { 
        ...currentApp, 
        code: newCode,
        isModification: true,
        originalAppId: currentApp.originalAppId || currentApp.id,
        originalUniqueId: currentApp.originalUniqueId || currentApp.uniqueId
      };
      setCurrentApp(updatedApp);
      
      // Mostra la risposta completa dell'AI (senza il codice HTML)
      const aiResponse = htmlMatch ? 
        fullResponse.replace(/```html\n?[\s\S]*?\n?```/, '[Codice HTML aggiornato automaticamente]') :
        fullResponse;
      
      // Aggiorna chat
      setChatMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      
      // Aggiorna nella lista generate
      const updatedApps = generatedApps.map(app => 
        app.id === currentApp.id ? updatedApp : app
      );
      setGeneratedApps(updatedApps);
      await saveGeneratedApps(updatedApps);
      
    } catch (error) {
      console.error('Errore modifica:', error);
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Errore nella modifica: ' + error.message }]);
    } finally {
      setIsModifying(false);
    }
  };

  // Scarica app
  const handleDownloadApp = () => {
    if (!currentApp) return;
    
    const blob = new Blob([currentApp.code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentApp.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Lancia app in preview
  const handleLaunchApp = (app) => {
    try {
      const newWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
      
      if (!newWindow) {
        showToast('Il popup è stato bloccato. Abilita i popup per questo sito.', 'warning');
        return;
      }
      
      newWindow.document.write(app.code);
      newWindow.document.close();
      newWindow.document.title = app.name;
      
    } catch (error) {
      showToast('Errore nell\'apertura dell\'app: ' + error.message, 'error');
    }
  };

  // Elimina app
  const handleDeleteApp = async (appId) => {
    try {
      const updatedApps = generatedApps.filter(app => app.id !== appId);
      setGeneratedApps(updatedApps);
      await saveGeneratedApps(updatedApps);
      showToast('App eliminata', 'success');
    } catch (error) {
      console.error('❌ Errore eliminazione app:', error);
      showToast('Errore durante l\'eliminazione', 'error');
    }
  };

  // Ottieni icona per tipo
  const getIconForType = (type) => {
    const appType = appTypes.find(t => t.value === type);
    return appType ? appType.icon : '⚡';
  };

  // Gestione cambiamenti form
  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Raggruppa modelli AI per select
  const groupedModels = aiModels.reduce((groups, model) => {
    if (!groups[model.group]) {
      groups[model.group] = [];
    }
    groups[model.group].push(model);
    return groups;
  }, {});

  return (
    <Box sx={{ 
      width: '100%',
      maxWidth: '1200px', 
      mx: 'auto',
      p: { xs: 2, sm: 4 },
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* Header con pulsante di ritorno - Stile come StorePage */}
      <Box sx={{
        width: '100%',
        mb: 3,
        background: theme.palette.mode === 'dark' 
          ? 'rgba(255, 255, 255, 0.05)' 
          : 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderRadius: 2,
        boxShadow: theme.palette.mode === 'dark'
          ? '0 8px 32px rgba(0, 0, 0, 0.3)'
          : '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: theme.palette.mode === 'dark'
          ? '1px solid rgba(255, 255, 255, 0.1)'
          : '1px solid rgba(255, 255, 255, 0.2)',
        p: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <IconButton
          onClick={onNavigateBack}
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
              boxShadow: theme.shadows[4]
            },
            boxShadow: theme.shadows[2]
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
            🤖 Generatore AI
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Crea app intelligenti con l'aiuto dell'intelligenza artificiale
          </Typography>
        </Box>
        
        <IconButton
          onClick={loadGeneratedApps}
          disabled={authLoading}
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.04)',
            '&:hover': {
              background: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(0, 0, 0, 0.08)'
            }
          }}
        >
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Contenuto principale - Layout come modale originale */}
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} sx={{ width: '100%' }}>
        {/* Pannello sinistro - Form e App generate */}
        <Box sx={{ 
          flex: { lg: 1 }, 
          minWidth: { lg: '50%' }
        }}>
          {/* Sezione autenticazione */}
          <Paper sx={{ p: 3, mb: 3 }}>
            {!isAuthenticated ? (
              <Stack spacing={2}>
                <Typography variant="h6" color="primary">
                  🔐 Autenticazione Puter
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Accedi con il tuo account Puter per generare app AI
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleSignIn}
                  disabled={authLoading}
                  startIcon={authLoading ? <CircularProgress size={20} /> : <PersonIcon />}
                  sx={{ 
                    width: '100%',
                    height: 48,
                    fontSize: '1rem',
                    fontWeight: 600
                  }}
                >
                  {authLoading ? 'Accesso in corso...' : 'Accedi con Puter'}
                </Button>
                {authLoading && (
                  <Box sx={{ width: '100%', mt: 1 }}>
                    <LinearProgress 
                      sx={{ 
                        height: 4, 
                        borderRadius: 2,
                        backgroundColor: 'rgba(25, 118, 210, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: 'primary.main'
                        }
                      }} 
                    />
                  </Box>
                )}
              </Stack>
            ) : (
              <Stack spacing={2}>
                <Typography variant="h6" color="success.main">
                  ✅ Autenticato come {userInfo?.username || 'Utente'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pronto per generare app AI
                </Typography>
                <Button
                  variant="outlined"
                  onClick={handleSignOut}
                  startIcon={<LogoutIcon />}
                  sx={{ 
                    width: '100%',
                    height: 48,
                    fontSize: '1rem'
                  }}
                >
                  Disconnetti
                </Button>
              </Stack>
            )}
          </Paper>

          {/* Form generazione */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AIIcon color="primary" />
              Genera Nuova App
            </Typography>
            
            <Box component="form" onSubmit={handleGenerateApp}>
              <TextField
                fullWidth
                label="Nome App"
                value={formData.appName}
                onChange={(e) => handleFormChange('appName', e.target.value)}
                placeholder="Es: Calcolatrice Avanzata"
                sx={{ mb: 2 }}
                disabled={!isAuthenticated}
                required
              />
              
              <TextField
                fullWidth
                label="Descrizione Dettagliata"
                value={formData.appDescription}
                onChange={(e) => handleFormChange('appDescription', e.target.value)}
                placeholder="Descrivi cosa deve fare l'app, che funzionalità deve avere, come deve apparire..."
                multiline
                rows={4}
                sx={{ mb: 2 }}
                disabled={!isAuthenticated}
                required
              />
              
              <FormControl fullWidth sx={{ mb: 2 }} disabled={!isAuthenticated}>
                <InputLabel>Tipo di App</InputLabel>
                <Select
                  value={formData.appType}
                  onChange={(e) => handleFormChange('appType', e.target.value)}
                  label="Tipo di App"
                  required
                >
                  {appTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{type.icon}</span>
                        {type.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 3 }} disabled={!isAuthenticated}>
                <InputLabel>Modello AI</InputLabel>
                <Select
                  value={formData.aiModel}
                  onChange={(e) => handleFormChange('aiModel', e.target.value)}
                  label="Modello AI"
                  required
                >
                  {Object.entries(groupedModels).map(([group, models]) => [
                    <MenuItem key={group} disabled sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      {group}
                    </MenuItem>,
                    ...models.map(model => (
                      <MenuItem key={model.value} value={model.value} sx={{ pl: 4 }}>
                        {model.label}
                      </MenuItem>
                    ))
                  ])}
                </Select>
              </FormControl>
              
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={!isAuthenticated || isGenerating}
                startIcon={isGenerating ? <CircularProgress size={20} /> : <AIIcon />}
              >
                {isGenerating ? 'Generazione in corso...' : '🎨 Genera App'}
              </Button>
            </Box>
          </Paper>

          {/* App generate */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AppsIcon color="secondary" />
              Le Tue App Generate ({generatedApps.length})
            </Typography>
            
            {generatedApps.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <AIIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                <Typography variant="body2">
                  Nessuna app ancora generata
                </Typography>
              </Box>
            ) : (
              <List>
                {generatedApps.map(app => (
                  <ListItem key={app.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {getIconForType(app.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={app.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {app.description}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Chip size="small" label={app.model} variant="outlined" />
                            <Chip size="small" label={new Date(app.createdAt).toLocaleDateString()} variant="outlined" />
                          </Box>
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton size="small" onClick={() => handleLaunchApp(app)} title="Apri">
                        <PlayIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleEditGeneratedApp(app)} title="Modifica">
                        <ChatIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteApp(app.id)} title="Elimina">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Box>

        {/* Pannello destro - Preview e Chat */}
        <Box sx={{ 
          flex: { lg: 1 },
          minWidth: { lg: '50%' }
        }}>
          {previewOpen && currentApp ? (
            <>
              {/* Preview app */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AppsIcon color="primary" />
                  App Generata: {currentApp.name}
                </Typography>
                
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, height: 300, mb: 2, overflow: 'hidden' }}>
                  <iframe
                    srcDoc={currentApp.code}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    sandbox="allow-scripts allow-same-origin"
                    title="App Preview"
                  />
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleImportApp}
                  >
                    Importa in AIdeas
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={handleRegenerateApp}
                  >
                    Rigenera
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ChatIcon />}
                    onClick={handleModifyApp}
                  >
                    Modifica
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadApp}
                  >
                    Scarica
                  </Button>
                </Box>
              </Paper>

              {/* Chat per modifiche */}
              {chatOpen && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ChatIcon color="secondary" />
                    Chat per Modifiche
                  </Typography>
                  
                  <Box sx={{ height: 200, overflowY: 'auto', mb: 2, p: 1, border: 1, borderColor: 'divider', borderRadius: 1, display: 'flex', flexDirection: 'column' }}>
                                        {chatMessages.map((msg, index) => (
                      <Box
                        key={index}
                        sx={{
                          mb: 1,
                          p: 1,
                          borderRadius: 1,
                          background: msg.role === 'user' ? 'primary.main' : 'grey.100',
                          color: msg.role === 'user' ? 'white' : 'text.primary',
                          ml: msg.role === 'user' ? 'auto' : 0,
                          mr: msg.role === 'user' ? 0 : 'auto',
                          maxWidth: '80%',
                          alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {msg.role === 'user' ? '👤 Tu' : '🤖 AI'}:
                          </Typography>
                          {msg.role === 'user' && isModifying && index === chatMessages.length - 1 && (
                            <CircularProgress size={16} sx={{ color: 'white' }} />
                          )}
                        </Box>
                        <Typography variant="body2">
                          {msg.content}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      placeholder="Descrivi le modifiche che vuoi fare all'app..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
                      disabled={isModifying}
                      size="small"
                    />
                    <IconButton
                      onClick={handleSendChatMessage}
                      disabled={!chatInput.trim() || isModifying}
                      color="primary"
                    >
                      <SendIcon />
                    </IconButton>
                  </Box>
                </Paper>
              )}
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
              <AIIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Genera la tua prima app
              </Typography>
              <Typography variant="body2">
                Compila il form a sinistra e clicca "Genera App" per iniziare
              </Typography>
            </Box>
          )}
        </Box>
      </Stack>
    </Box>
  );
};

export default AIGeneratorPage; 