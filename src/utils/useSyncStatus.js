import { useState, useEffect, useRef, useCallback } from 'react';
import StorageService from '../services/StorageService.js';
import GitHubService from '../services/GitHubService.js';
import GoogleDriveService from '../services/GoogleDriveService.js';

const DEFAULT_INTERVAL = 1; // minuti

export function useSyncStatus() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [provider, setProvider] = useState('github');
  const [isInProgress, setIsInProgress] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [error, setError] = useState(null);
  const [intervalMinutes, setIntervalMinutes] = useState(DEFAULT_INTERVAL);
  const [nextSync, setNextSync] = useState(null);
  const [syncHistory, setSyncHistory] = useState([]);
  const timerRef = useRef(null);
  
  // Istanze servizi riutilizzabili
  const githubServiceRef = useRef(new GitHubService());
  const googleServiceRef = useRef(null);
  
  // Inizializza GoogleDriveService configurato (singleton)
  useEffect(() => {
    try {
      googleServiceRef.current = GoogleDriveService.createConfiguredInstance();
    } catch (error) {
      console.warn('Google Drive non configurato in useSyncStatus:', error.message);
      googleServiceRef.current = null;
    }
  }, []);

  // Carica stato iniziale
  useEffect(() => {
    (async () => {
      setIsEnabled(await StorageService.getSetting('syncEnabled', false));
      
      // Gestione migliore del provider
      let syncProvider = await StorageService.getSetting('syncProvider', 'github');
      console.log('📋 Provider dal storage:', syncProvider);
      
      // Correggi provider obsoleto "gist" -> "googledrive" (migrazione legacy)
      if (syncProvider === 'gist') {
        console.log('🔧 Migrazione provider obsoleto: gist -> googledrive');
        syncProvider = 'googledrive';
        await StorageService.setSetting('syncProvider', 'googledrive');
        console.log('✅ Provider aggiornato a googledrive');
        
        // Verifica che il salvataggio sia andato a buon fine
        const verifyProvider = await StorageService.getSetting('syncProvider');
        console.log('🔍 Verifica provider dopo salvataggio:', verifyProvider);
      }
      
      // Verifica che il provider sia valido
      const validProviders = ['github', 'googledrive'];
      if (!validProviders.includes(syncProvider)) {
        console.warn('⚠️ Provider non valido rilevato:', syncProvider);
        syncProvider = 'github'; // Fallback a github
        await StorageService.setSetting('syncProvider', syncProvider);
        console.log('🔧 Provider ripristinato a github come fallback');
      }
      
      setProvider(syncProvider);
      console.log('📋 Provider sincronizzazione caricato e impostato:', syncProvider);
      
      setLastSync(await StorageService.getSetting('lastSyncTime', null));
      setIntervalMinutes(await StorageService.getSetting('autoSyncInterval', DEFAULT_INTERVAL));
      setSyncHistory(await StorageService.getSetting('syncHistory', []));
    })();
  }, []);

  // Funzione per cambiare provider con persistenza immediata
  const updateProvider = async (newProvider) => {
    console.log('🔄 Cambio provider da', provider, 'a', newProvider);
    
    // Valida il nuovo provider
    const validProviders = ['github', 'googledrive'];
    if (!validProviders.includes(newProvider)) {
      console.error('❌ Provider non valido:', newProvider);
      return false;
    }
    
    try {
      // Salva immediatamente nel storage
      await StorageService.setSetting('syncProvider', newProvider);
      console.log('💾 Provider salvato nel storage');
      
      // Verifica che il salvataggio sia andato a buon fine
      const verifyProvider = await StorageService.getSetting('syncProvider');
      console.log('🔍 Verifica provider dopo salvataggio:', verifyProvider);
      
      if (verifyProvider !== newProvider) {
        console.error('❌ Errore: provider non salvato correttamente', { 
          expected: newProvider, 
          actual: verifyProvider 
        });
        return false;
      }
      
      // Aggiorna lo stato locale
      setProvider(newProvider);
      console.log('🔄 Stato locale aggiornato');
      
      // Pulisci errori precedenti
      setError(null);
      
      console.log('✅ Provider aggiornato con successo a:', newProvider);
      return true;
      
    } catch (error) {
      console.error('❌ Errore durante aggiornamento provider:', error);
      setError('Errore durante cambio provider');
      return false;
    }
  };

  // Gestione auto-sync
  useEffect(() => {
    if (!isEnabled) {
      clearTimer();
      setNextSync(null);
      return;
    }
    scheduleNextSync();
    return clearTimer;
    // eslint-disable-next-line
  }, [isEnabled, intervalMinutes, provider]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const scheduleNextSync = () => {
    clearTimer();
    const now = Date.now();
    const next = now + intervalMinutes * 60 * 1000;
    setNextSync(new Date(next));
    timerRef.current = setTimeout(() => {
      triggerSync();
    }, intervalMinutes * 60 * 1000);
  };

  const triggerSync = useCallback(async () => {
    if (!isEnabled || isInProgress) return;
    setIsInProgress(true);
    setError(null);
    try {
      let result;
      if (provider === 'github') {
        const githubService = githubServiceRef.current;
        // TODO: gestire token
        result = await githubService.syncBidirectional();
      } else if (provider === 'googledrive') {
        const googleService = googleServiceRef.current;
        if (!googleService) {
          throw new Error('Google Drive non configurato correttamente');
        }
        
        // Verifica autenticazione prima della sincronizzazione
        const isAuthenticated = await googleService.checkAuthentication();
        if (!isAuthenticated) {
          throw new Error('Non autenticato con Google Drive - rieffettua il login');
        }
        
        result = await googleService.syncBidirectional();
      }
      const now = new Date();
      setLastSync(now);
      setSyncHistory(prev => [{ id: Date.now(), type: 'sync', message: 'Sync automatica', timestamp: now.toISOString() }, ...prev.slice(0, 9)]);
      await StorageService.setSetting('lastSyncTime', now.toISOString());
      await StorageService.setSetting('syncHistory', syncHistory);
      setIsInProgress(false);
      scheduleNextSync();
      return result;
    } catch (e) {
      setError(e.message || 'Errore sincronizzazione');
      setIsInProgress(false);
      scheduleNextSync();
    }
  }, [isEnabled, isInProgress, provider, intervalMinutes, syncHistory]);

  // Funzione per sincronizzazione manuale
  const manualSync = useCallback(async () => {
    if (isInProgress || !isEnabled) return;
    
    setIsInProgress(true);
    setError(null);
    
    try {
      let result;
      
      if (provider === 'github') {
        const gistId = await StorageService.getSetting('githubGistId');
        if (!gistId) {
          throw new Error('Gist ID non configurato');
        }
        result = await githubServiceRef.current.syncBidirectional({ gistId });
      } else if (provider === 'googledrive' && googleServiceRef.current) {
        result = await googleServiceRef.current.syncBidirectional();
      } else {
        throw new Error('Provider non supportato o non configurato');
      }
      
      if (result.success) {
        setLastSync(new Date().toISOString());
        await StorageService.setSetting('lastSyncTime', new Date().toISOString());
        
        // Aggiungi alla cronologia
        const history = await StorageService.getSetting('syncHistory', []);
        const newEntry = {
          id: Date.now(),
          type: 'sync',
          message: `Sincronizzazione completata: ${result.appsCount || 0} app`,
          timestamp: new Date().toISOString(),
          provider
        };
        history.unshift(newEntry);
        const trimmedHistory = history.slice(0, 20);
        await StorageService.setSetting('syncHistory', trimmedHistory);
        setSyncHistory(trimmedHistory);
        
        console.log('✅ Sincronizzazione completata:', result);
      }
      
    } catch (error) {
      console.error('❌ Errore sincronizzazione:', error);
      setError(error.message);
      
      // Aggiungi errore alla cronologia
      const history = await StorageService.getSetting('syncHistory', []);
      const newEntry = {
        id: Date.now(),
        type: 'error',
        message: `Errore sincronizzazione: ${error.message}`,
        timestamp: new Date().toISOString(),
        provider
      };
      history.unshift(newEntry);
      const trimmedHistory = history.slice(0, 20);
      await StorageService.setSetting('syncHistory', trimmedHistory);
      setSyncHistory(trimmedHistory);
      
    } finally {
      setIsInProgress(false);
    }
  }, [isEnabled, isInProgress, provider]);

  const updateSettings = async (newSettings) => {
    if ('isEnabled' in newSettings) {
      setIsEnabled(newSettings.isEnabled);
      await StorageService.setSetting('syncEnabled', newSettings.isEnabled);
    }
    if ('provider' in newSettings) {
      // Usa la funzione updateProvider per persistenza corretta
      await updateProvider(newSettings.provider);
    }
    if ('intervalMinutes' in newSettings) {
      setIntervalMinutes(newSettings.intervalMinutes);
      await StorageService.setSetting('autoSyncInterval', newSettings.intervalMinutes);
    }
  };

  return {
    isEnabled,
    provider,
    isInProgress,
    lastSync,
    error,
    intervalMinutes,
    nextSync,
    syncHistory,
    setIsEnabled: async (enabled) => {
      setIsEnabled(enabled);
      await StorageService.setSetting('syncEnabled', enabled);
    },
    setProvider: updateProvider, // Usa la nuova funzione con persistenza
    setIntervalMinutes: async (minutes) => {
      setIntervalMinutes(minutes);
      await StorageService.setSetting('autoSyncInterval', minutes);
    },
    manualSync
  };
} 