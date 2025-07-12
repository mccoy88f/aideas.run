import { DEBUG } from '../utils/debug.js';
import { ERROR_MESSAGES } from '../utils/constants.js';

/**
 * Sistema centralizzato di gestione errori avanzato
 * Gestisce retry, timeout, recovery, rollback e categorizzazione errori
 */
class ErrorHandler {
  constructor() {
    this.retryStrategies = new Map();
    this.errorHistory = [];
    this.maxHistorySize = 100;
    this.operationStack = [];
    this.isOnline = navigator.onLine;
    
    // Monitora connessione
    this.setupNetworkMonitoring();
    
    // Configura strategie di retry predefinite
    this.setupDefaultRetryStrategies();
  }

  /**
   * Configura monitoraggio rete
   */
  setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      DEBUG.success('🌐 Connessione ripristinata');
      this.retryFailedOperations();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      DEBUG.warn('🔴 Connessione persa');
    });
  }

  /**
   * Configura strategie di retry predefinite
   */
  setupDefaultRetryStrategies() {
    // Strategia per errori di rete
    this.retryStrategies.set('NETWORK_ERROR', {
      maxRetries: 3,
      delayMs: 1000,
      backoffMultiplier: 2,
      shouldRetry: (error) => this.isNetworkError(error),
      onRetry: (attemptNumber) => DEBUG.warn(`🔄 Tentativo ${attemptNumber} per errore di rete`)
    });

    // Strategia per errori di quota/rate limit
    this.retryStrategies.set('RATE_LIMIT', {
      maxRetries: 5,
      delayMs: 5000,
      backoffMultiplier: 1.5,
      shouldRetry: (error) => this.isRateLimitError(error),
      onRetry: (attemptNumber) => DEBUG.warn(`⏳ Tentativo ${attemptNumber} per rate limit`)
    });

    // Strategia per errori temporanei
    this.retryStrategies.set('TEMPORARY_ERROR', {
      maxRetries: 2,
      delayMs: 2000,
      backoffMultiplier: 1.5,
      shouldRetry: (error) => this.isTemporaryError(error),
      onRetry: (attemptNumber) => DEBUG.warn(`🔄 Tentativo ${attemptNumber} per errore temporaneo`)
    });

    // Strategia per errori di storage
    this.retryStrategies.set('STORAGE_ERROR', {
      maxRetries: 2,
      delayMs: 1000,
      backoffMultiplier: 2,
      shouldRetry: (error) => this.isStorageError(error),
      onRetry: (attemptNumber) => DEBUG.warn(`💾 Tentativo ${attemptNumber} per errore di storage`)
    });
  }

  /**
   * Gestisce un'operazione con retry automatico e recovery
   * @param {Function} operation - Operazione da eseguire
   * @param {Object} options - Opzioni di configurazione
   * @returns {Promise} Risultato dell'operazione
   */
  async withRetry(operation, options = {}) {
    const config = {
      operationName: options.operationName || 'Operazione sconosciuta',
      timeout: options.timeout || 30000,
      rollbackFn: options.rollbackFn || null,
      retryStrategy: options.retryStrategy || 'NETWORK_ERROR',
      context: options.context || {},
      validateResult: options.validateResult || null,
      ...options
    };

    // Aggiungi operazione allo stack per rollback
    const operationId = this.pushOperation(config);
    
    try {
      const result = await this.executeWithRetry(operation, config);
      
      // Valida il risultato se richiesto
      if (config.validateResult && !config.validateResult(result)) {
        throw new Error('Risultato operazione non valido');
      }
      
      // Rimuovi operazione completata con successo
      this.popOperation(operationId);
      
      return result;
      
    } catch (error) {
      // Esegui rollback se disponibile
      if (config.rollbackFn) {
        await this.executeRollback(config.rollbackFn, error, config);
      }
      
      // Rimuovi operazione fallita
      this.popOperation(operationId);
      
      // Crea errore categorizzato
      const categorizedError = this.categorizeError(error, config);
      
      // Registra errore nella storia
      this.recordError(categorizedError, config);
      
      throw categorizedError;
    }
  }

  /**
   * Esegue operazione con retry e timeout
   */
  async executeWithRetry(operation, config) {
    const strategy = this.retryStrategies.get(config.retryStrategy);
    if (!strategy) {
      throw new Error(`Strategia retry sconosciuta: ${config.retryStrategy}`);
    }

    let lastError;
    let attemptNumber = 0;

    while (attemptNumber <= strategy.maxRetries) {
      try {
        // Applica timeout se specificato
        if (config.timeout) {
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout operazione')), config.timeout);
          });
          
          return await Promise.race([operation(), timeoutPromise]);
        } else {
          return await operation();
        }
        
      } catch (error) {
        lastError = error;
        attemptNumber++;
        
        // Se non è l'ultimo tentativo e l'errore è riprovabile
        if (attemptNumber <= strategy.maxRetries && strategy.shouldRetry(error)) {
          const delay = strategy.delayMs * Math.pow(strategy.backoffMultiplier, attemptNumber - 1);
          
          strategy.onRetry(attemptNumber);
          DEBUG.warn(`⏳ Attesa ${delay}ms prima del prossimo tentativo`);
          
          await this.sleep(delay);
          continue;
        }
        
        break;
      }
    }

    throw lastError;
  }

  /**
   * Esegue rollback per operazione fallita
   */
  async executeRollback(rollbackFn, originalError, config) {
    try {
      DEBUG.warn(`🔄 Esecuzione rollback per ${config.operationName}`);
      await rollbackFn(originalError, config.context);
      DEBUG.success('✅ Rollback completato');
    } catch (rollbackError) {
      DEBUG.error('❌ Errore durante rollback:', rollbackError);
      // Non lanciare l'errore di rollback, mantieni l'errore originale
    }
  }

  /**
   * Categorizza un errore per una migliore gestione
   */
  categorizeError(error, config) {
    const errorInfo = {
      originalError: error,
      category: 'UNKNOWN',
      severity: 'MEDIUM',
      isRetryable: false,
      userMessage: '',
      technicalMessage: error.message,
      suggestedAction: '',
      operationName: config.operationName,
      timestamp: new Date().toISOString(),
      context: config.context
    };

    // Categorizza in base al tipo di errore
    if (this.isNetworkError(error)) {
      errorInfo.category = 'NETWORK';
      errorInfo.severity = 'HIGH';
      errorInfo.isRetryable = true;
      errorInfo.userMessage = 'Problema di connessione. Verifica la tua connessione internet.';
      errorInfo.suggestedAction = 'Riprova quando la connessione è stabile';
    } else if (this.isRateLimitError(error)) {
      errorInfo.category = 'RATE_LIMIT';
      errorInfo.severity = 'MEDIUM';
      errorInfo.isRetryable = true;
      errorInfo.userMessage = 'Troppi tentativi ravvicinati. Riprova tra qualche minuto.';
      errorInfo.suggestedAction = 'Attendi qualche minuto prima di riprovare';
    } else if (this.isAuthError(error)) {
      errorInfo.category = 'AUTHENTICATION';
      errorInfo.severity = 'HIGH';
      errorInfo.isRetryable = false;
      errorInfo.userMessage = 'Problema di autenticazione. Verifica le credenziali.';
      errorInfo.suggestedAction = 'Riconfigutra le credenziali di accesso';
    } else if (this.isValidationError(error)) {
      errorInfo.category = 'VALIDATION';
      errorInfo.severity = 'LOW';
      errorInfo.isRetryable = false;
      errorInfo.userMessage = 'Dati non validi. Controlla i parametri inseriti.';
      errorInfo.suggestedAction = 'Verifica e correggi i dati inseriti';
    } else if (this.isStorageError(error)) {
      errorInfo.category = 'STORAGE';
      errorInfo.severity = 'HIGH';
      errorInfo.isRetryable = true;
      errorInfo.userMessage = 'Problema di archiviazione. Spazio insufficiente o database corrotto.';
      errorInfo.suggestedAction = 'Libera spazio o riavvia l\'applicazione';
    } else if (this.isTemporaryError(error)) {
      errorInfo.category = 'TEMPORARY';
      errorInfo.severity = 'LOW';
      errorInfo.isRetryable = true;
      errorInfo.userMessage = 'Errore temporaneo. Riprova tra qualche istante.';
      errorInfo.suggestedAction = 'Riprova l\'operazione';
    }

    return errorInfo;
  }

  /**
   * Determina se un errore è di rete
   */
  isNetworkError(error) {
    if (!this.isOnline) return true;
    
    const networkIndicators = [
      'network error',
      'connection refused',
      'connection timeout',
      'dns lookup failed',
      'fetch failed',
      'cors error',
      'net::',
      'connection_failed'
    ];
    
    return networkIndicators.some(indicator => 
      error.message.toLowerCase().includes(indicator)
    );
  }

  /**
   * Determina se un errore è di rate limit
   */
  isRateLimitError(error) {
    const rateLimitIndicators = [
      'rate limit',
      'too many requests',
      'quota exceeded',
      'api limit',
      'throttled'
    ];
    
    return rateLimitIndicators.some(indicator => 
      error.message.toLowerCase().includes(indicator)
    ) || error.status === 429;
  }

  /**
   * Determina se un errore è di autenticazione
   */
  isAuthError(error) {
    const authIndicators = [
      'authentication',
      'unauthorized',
      'invalid token',
      'access denied',
      'permission denied',
      'forbidden'
    ];
    
    return authIndicators.some(indicator => 
      error.message.toLowerCase().includes(indicator)
    ) || [401, 403].includes(error.status);
  }

  /**
   * Determina se un errore è di validazione
   */
  isValidationError(error) {
    const validationIndicators = [
      'validation',
      'invalid',
      'required',
      'missing',
      'bad request',
      'malformed'
    ];
    
    return validationIndicators.some(indicator => 
      error.message.toLowerCase().includes(indicator)
    ) || error.status === 400;
  }

  /**
   * Determina se un errore è di storage
   */
  isStorageError(error) {
    const storageIndicators = [
      'quota',
      'storage',
      'database',
      'indexeddb',
      'space',
      'disk full'
    ];
    
    return storageIndicators.some(indicator => 
      error.message.toLowerCase().includes(indicator)
    );
  }

  /**
   * Determina se un errore è temporaneo
   */
  isTemporaryError(error) {
    const temporaryIndicators = [
      'temporary',
      'timeout',
      'busy',
      'locked',
      'retry',
      'server error'
    ];
    
    return temporaryIndicators.some(indicator => 
      error.message.toLowerCase().includes(indicator)
    ) || [500, 502, 503, 504].includes(error.status);
  }

  /**
   * Registra operazione nello stack per rollback
   */
  pushOperation(config) {
    const operationId = Date.now() + Math.random();
    this.operationStack.push({
      id: operationId,
      ...config,
      startTime: Date.now()
    });
    return operationId;
  }

  /**
   * Rimuove operazione dallo stack
   */
  popOperation(operationId) {
    const index = this.operationStack.findIndex(op => op.id === operationId);
    if (index !== -1) {
      this.operationStack.splice(index, 1);
    }
  }

  /**
   * Registra errore nella storia
   */
  recordError(errorInfo, config) {
    this.errorHistory.push({
      ...errorInfo,
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString()
    });

    // Mantieni solo gli ultimi errori
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }

    // Log appropriato in base alla severità
    switch (errorInfo.severity) {
      case 'HIGH':
        DEBUG.error(`❌ ${config.operationName}:`, errorInfo.technicalMessage);
        break;
      case 'MEDIUM':
        DEBUG.warn(`⚠️ ${config.operationName}:`, errorInfo.technicalMessage);
        break;
      case 'LOW':
        DEBUG.log(`ℹ️ ${config.operationName}:`, errorInfo.technicalMessage);
        break;
    }
  }

  /**
   * Riprova operazioni fallite quando la connessione è ripristinata
   */
  async retryFailedOperations() {
    const failedOperations = this.operationStack.filter(op => 
      op.retryWhenOnline && Date.now() - op.startTime < 300000 // 5 minuti
    );

    if (failedOperations.length > 0) {
      DEBUG.log(`🔄 Riprovo ${failedOperations.length} operazioni dopo ripristino connessione`);
      
      for (const operation of failedOperations) {
        try {
          if (operation.retryFunction) {
            await operation.retryFunction();
          }
        } catch (error) {
          DEBUG.warn(`❌ Errore nel riprovare operazione ${operation.operationName}:`, error);
        }
      }
    }
  }

  /**
   * Ottiene statistiche degli errori
   */
  getErrorStats() {
    const now = Date.now();
    const last24h = this.errorHistory.filter(e => 
      now - new Date(e.timestamp).getTime() < 24 * 60 * 60 * 1000
    );

    const categories = {};
    const severities = {};
    
    last24h.forEach(error => {
      categories[error.category] = (categories[error.category] || 0) + 1;
      severities[error.severity] = (severities[error.severity] || 0) + 1;
    });

    return {
      total: this.errorHistory.length,
      last24h: last24h.length,
      categories,
      severities,
      isOnline: this.isOnline,
      activeOperations: this.operationStack.length
    };
  }

  /**
   * Pulisce la storia degli errori
   */
  clearErrorHistory() {
    this.errorHistory = [];
    DEBUG.log('🧹 Storia errori pulita');
  }

  /**
   * Utility per sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Crea backup automatico prima di operazioni critiche
   */
  async createBackup(operationName, data) {
    try {
      const backup = {
        operationName,
        data,
        timestamp: new Date().toISOString(),
        id: `backup_${Date.now()}`
      };

      // Salva backup in localStorage temporaneo
      const backups = JSON.parse(localStorage.getItem('aideas_backups') || '[]');
      backups.push(backup);
      
      // Mantieni solo gli ultimi 5 backup
      if (backups.length > 5) {
        backups.shift();
      }
      
      localStorage.setItem('aideas_backups', JSON.stringify(backups));
      
      DEBUG.log(`💾 Backup creato per ${operationName}`);
      return backup.id;
      
    } catch (error) {
      DEBUG.warn('⚠️ Errore creazione backup:', error);
      return null;
    }
  }

  /**
   * Ripristina backup in caso di errore
   */
  async restoreBackup(backupId) {
    try {
      const backups = JSON.parse(localStorage.getItem('aideas_backups') || '[]');
      const backup = backups.find(b => b.id === backupId);
      
      if (!backup) {
        throw new Error('Backup non trovato');
      }
      
      DEBUG.log(`🔄 Ripristino backup per ${backup.operationName}`);
      return backup.data;
      
    } catch (error) {
      DEBUG.error('❌ Errore ripristino backup:', error);
      throw error;
    }
  }
}

// Esporta istanza singleton
export default new ErrorHandler(); 