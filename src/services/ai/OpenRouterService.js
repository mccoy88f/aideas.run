import { BaseAIService } from './BaseAIService.js';

/**
 * Servizio OpenRouter che usa l'OpenAI SDK
 * Compatibile con l'API standard di OpenAI
 */
export class OpenRouterService extends BaseAIService {
  constructor() {
    super();
    this.baseURL = 'https://openrouter.ai/api/v1';
    this.client = null;
  }

  /**
   * Inizializza il client OpenAI per OpenRouter
   */
  async initialize(config) {
    await super.initialize(config);
    
    try {
      // Prova a caricare l'OpenAI SDK dinamicamente se non è disponibile
      if (typeof window !== 'undefined') {
        if (window.openai) {
          this.client = new window.openai({
            baseURL: this.baseURL,
            apiKey: this.config.apiKey,
            dangerouslyAllowBrowser: true
          });
        } else {
          // Carica dinamicamente l'SDK se non è disponibile
          const { default: OpenAI } = await import('https://cdn.jsdelivr.net/npm/openai@4.28.0/+esm');
          this.client = new OpenAI({
            baseURL: this.baseURL,
            apiKey: this.config.apiKey,
            dangerouslyAllowBrowser: true
          });
        }
      }
    } catch (error) {
      console.error('Errore caricamento OpenAI SDK:', error);
      throw new Error('Impossibile caricare OpenAI SDK');
    }
  }

  /**
   * Ottiene i modelli disponibili da OpenRouter
   */
  async getAvailableModels() {
    if (!this.isConfigured()) {
      throw new Error('OpenRouter non configurato. Inserisci la tua API key nelle impostazioni.');
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'AIdeas'
        }
      });

      if (!response.ok) {
        throw new Error(`Errore API OpenRouter: ${response.status}`);
      }

      const data = await response.json();
      const models = data.data || [];

      // Organizza i modelli per categoria
      const categorizedModels = {
        '🆓 Modelli Gratuiti': [],
        '💎 Modelli Premium': []
      };

      models.forEach(model => {
        const modelInfo = {
          value: model.id,
          label: model.name || model.id,
          description: model.description || '',
          context_length: model.context_length,
          pricing: model.pricing
        };

        if (model.id.endsWith(':free')) {
          categorizedModels['🆓 Modelli Gratuiti'].push(modelInfo);
        } else {
          categorizedModels['💎 Modelli Premium'].push(modelInfo);
        }
      });

      return categorizedModels;
    } catch (error) {
      console.error('Errore nel caricamento modelli OpenRouter:', error);
      throw error;
    }
  }

  /**
   * Genera una risposta AI usando OpenRouter
   */
  async generateResponse(prompt, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('OpenRouter non configurato. Inserisci la tua API key nelle impostazioni.');
    }

    if (!this.client) {
      throw new Error('Client OpenAI non inizializzato');
    }

    const {
      model = 'openai/gpt-4o-mini',
      temperature = 0.7,
      maxTokens = 4000,
      stream = false
    } = options;

    try {
      const completion = await this.client.chat.completions.create({
        model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature,
        max_tokens: maxTokens,
        stream,
        extra_headers: {
          'HTTP-Referer': window.location.origin,
          'X-Title': 'AIdeas'
        }
      });

      if (stream) {
        return completion; // Restituisce lo stream
      } else {
        return completion.choices[0]?.message?.content || '';
      }
    } catch (error) {
      console.error('Errore nella generazione risposta OpenRouter:', error);
      throw error;
    }
  }

  /**
   * Testa la connessione a OpenRouter
   */
  async testConnection() {
    if (!this.isConfigured()) {
      return { success: false, error: 'API key non configurata' };
    }

    try {
      const response = await this.generateResponse('Test di connessione', {
        model: 'openai/gpt-4o-mini',
        maxTokens: 10
      });
      
      return { success: true, message: 'Connessione OpenRouter funzionante' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Ottiene informazioni sui crediti dell'utente
   */
  async getCredits() {
    if (!this.isConfigured()) {
      throw new Error('OpenRouter non configurato');
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Errore API OpenRouter: ${response.status}`);
      }

      const data = await response.json();
      return {
        credits: data.credits || 0,
        usage: data.usage || {},
        limits: data.limits || {}
      };
    } catch (error) {
      console.error('Errore nel recupero crediti OpenRouter:', error);
      throw error;
    }
  }
} 