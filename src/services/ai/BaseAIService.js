/**
 * Interfaccia base per tutti i servizi AI
 * Segue lo standard OpenAI SDK per compatibilità
 */
export class BaseAIService {
  constructor(config = {}) {
    this.config = config;
    this.isInitialized = false;
  }

  /**
   * Inizializza il servizio con la configurazione
   */
  async initialize(config) {
    this.config = { ...this.config, ...config };
    this.isInitialized = true;
  }

  /**
   * Verifica se il servizio è configurato correttamente
   */
  isConfigured() {
    return this.isInitialized && this.config.apiKey;
  }

  /**
   * Ottiene i modelli disponibili
   */
  async getAvailableModels() {
    throw new Error('getAvailableModels deve essere implementato nelle classi figlie');
  }

  /**
   * Genera una risposta AI
   */
  async generateResponse(prompt, options = {}) {
    throw new Error('generateResponse deve essere implementato nelle classi figlie');
  }

  /**
   * Testa la connessione al servizio
   */
  async testConnection() {
    throw new Error('testConnection deve essere implementato nelle classi figlie');
  }
} 