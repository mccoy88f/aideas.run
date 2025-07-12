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
      
      // Correggi provider obsoleto "gist" -> "googledrive"
      let syncProvider = await StorageService.getSetting('syncProvider', 'github');
      if (syncProvider === 'gist') {
        console.log('🔧 Correzione provider obsoleto: gist -> googledrive');
        syncProvider = 'googledrive';
        await StorageService.setSetting('syncProvider', 'googledrive');
      }
      setProvider(syncProvider);
      
      setLastSync(await StorageService.getSetting('lastSyncTime', null));
      setIntervalMinutes(await StorageService.getSetting('autoSyncInterval', DEFAULT_INTERVAL));
      setSyncHistory(await StorageService.getSetting('syncHistory', []));
    })();
  }, []);

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

  const manualSync = async () => {
    clearTimer();
    await triggerSync();
  };

  const updateSettings = async (newSettings) => {
    if ('isEnabled' in newSettings) {
      setIsEnabled(newSettings.isEnabled);
      await StorageService.setSetting('syncEnabled', newSettings.isEnabled);
    }
    if ('provider' in newSettings) {
      setProvider(newSettings.provider);
      await StorageService.setSetting('syncProvider', newSettings.provider);
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
    nextSync,
    error,
    intervalMinutes,
    syncHistory,
    setProvider: (p) => updateSettings({ provider: p }),
    setIsEnabled: (v) => updateSettings({ isEnabled: v }),
    setIntervalMinutes: (v) => updateSettings({ intervalMinutes: v }),
    manualSync,
    updateSettings
  };
} 