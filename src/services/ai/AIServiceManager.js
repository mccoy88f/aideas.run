import { OpenRouterService } from './OpenRouterService.js';

/**
 * Gestore unificato per tutti i servizi AI
 * Fornisce un'interfaccia comune per diversi fornitori
 */
export class AIServiceManager {
  constructor() {
    this.services = {
      openrouter: new OpenRouterService()
    };
    this.currentProvider = 'openrouter'; // Default
    this.isInitialized = false;
  }

  /**
   * Inizializza il gestore con le configurazioni
   */
  async initialize(configs = {}) {
    try {
      // Inizializza ogni servizio con la sua configurazione
      for (const [provider, service] of Object.entries(this.services)) {
        if (configs[provider]) {
          await service.initialize(configs[provider]);
        }
      }
      
      this.isInitialized = true;
      console.log('✅ AIServiceManager inizializzato con successo');
    } catch (error) {
      console.error('❌ Errore inizializzazione AIServiceManager:', error);
      throw error;
    }
  }

  /**
   * Imposta il provider AI corrente
   */
  setCurrentProvider(provider) {
    if (this.services[provider]) {
      this.currentProvider = provider;
      console.log(`🔄 Provider AI cambiato a: ${provider}`);
    } else {
      throw new Error(`Provider AI non supportato: ${provider}`);
    }
  }

  /**
   * Ottiene il servizio corrente
   */
  getCurrentService() {
    return this.services[this.currentProvider];
  }

  /**
   * Ottiene tutti i provider disponibili
   */
  getAvailableProviders() {
    return Object.keys(this.services).map(provider => ({
      value: provider,
      label: this.getProviderLabel(provider),
      isConfigured: this.services[provider].isConfigured()
    }));
  }

  /**
   * Ottiene l'etichetta del provider
   */
  getProviderLabel(provider) {
    const labels = {
      openrouter: '🌐 OpenRouter',
      // Futuri provider:
      // anthropic: '🤖 Anthropic Claude',
      // google: '🔍 Google AI',
      // azure: '☁️ Azure OpenAI'
    };
    return labels[provider] || provider;
  }

  /**
   * Ottiene i modelli disponibili per il provider corrente
   */
  async getAvailableModels() {
    const service = this.getCurrentService();
    if (!service.isConfigured()) {
      throw new Error(`${this.getProviderLabel(this.currentProvider)} non configurato. Configura l'API key nelle impostazioni.`);
    }
    return await service.getAvailableModels();
  }

  /**
   * Genera una risposta AI usando il provider corrente
   */
  async generateResponse(prompt, options = {}) {
    const service = this.getCurrentService();
    if (!service.isConfigured()) {
      throw new Error(`${this.getProviderLabel(this.currentProvider)} non configurato. Configura l'API key nelle impostazioni.`);
    }
    return await service.generateResponse(prompt, options);
  }

  /**
   * Genera una risposta AI con system prompt usando il provider corrente
   */
  async generateResponseWithSystem(systemPrompt, userPrompt, options = {}) {
    const service = this.getCurrentService();
    if (!service.isConfigured()) {
      throw new Error(`${this.getProviderLabel(this.currentProvider)} non configurato. Configura l'API key nelle impostazioni.`);
    }
    return await service.generateResponseWithSystem(systemPrompt, userPrompt, options);
  }

  /**
   * Genera una risposta AI con cronologia conversazione usando il provider corrente
   */
  async generateResponseWithConversation(messages, options = {}) {
    const service = this.getCurrentService();
    if (!service.isConfigured()) {
      throw new Error(`${this.getProviderLabel(this.currentProvider)} non configurato. Configura l'API key nelle impostazioni.`);
    }
    return await service.generateResponseWithConversation(messages, options);
  }

  /**
   * Testa la connessione del provider corrente
   */
  async testConnection() {
    const service = this.getCurrentService();
    return await service.testConnection();
  }

  /**
   * Ottiene informazioni sui crediti del provider corrente
   */
  async getCredits() {
    const service = this.getCurrentService();
    if (service.getCredits) {
      return await service.getCredits();
    }
    return { credits: 'N/A', usage: {}, limits: {} };
  }

  /**
   * Verifica se il provider corrente è configurato
   */
  isCurrentProviderConfigured() {
    const service = this.getCurrentService();
    return service.isConfigured();
  }

  /**
   * Ottiene lo stato di tutti i provider
   */
  getProvidersStatus() {
    const status = {};
    for (const [provider, service] of Object.entries(this.services)) {
      status[provider] = {
        label: this.getProviderLabel(provider),
        isConfigured: service.isConfigured(),
        isInitialized: service.isInitialized
      };
    }
    return status;
  }
}

// Istanza singleton
export const aiServiceManager = new AIServiceManager(); 