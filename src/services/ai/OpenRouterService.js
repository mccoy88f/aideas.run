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
      console.log('🔧 Inizializzazione OpenRouter con API key:', this.config.apiKey ? 'Presente' : 'Mancante');
      console.log('🔑 API Key (primi 10 caratteri):', this.config.apiKey?.substring(0, 10) + '...');
      
      // Verifica formato API key
      if (this.config.apiKey) {
        if (this.config.apiKey.startsWith('ghp_')) {
          console.error('❌ ERRORE: Stai usando un GitHub Personal Access Token invece di un\'API key OpenRouter!');
          console.error('📝 Per ottenere un\'API key OpenRouter valida:');
          console.error('   1. Vai su https://openrouter.ai/');
          console.error('   2. Registrati/Accedi');
          console.error('   3. Vai su "API Keys"');
          console.error('   4. Crea una nuova API key');
          console.error('   5. L\'API key dovrebbe iniziare con "sk-or-"');
        } else if (!this.config.apiKey.startsWith('sk-')) {
          console.warn('⚠️ Attenzione: API key non sembra essere un formato OpenRouter valido (dovrebbe iniziare con "sk-")');
        }
      }
      
      // Prova a caricare l'OpenAI SDK dinamicamente se non è disponibile
      if (typeof window !== 'undefined') {
        if (window.openai) {
          console.log('📦 Usando OpenAI SDK da window.openai');
          this.client = new window.openai({
            baseURL: this.baseURL,
            apiKey: this.config.apiKey,
            dangerouslyAllowBrowser: true
          });
        } else {
          // Carica dinamicamente l'SDK se non è disponibile
          console.log('📦 Caricamento dinamico OpenAI SDK');
          const { default: OpenAI } = await import('https://cdn.jsdelivr.net/npm/openai@4.28.0/+esm');
          this.client = new OpenAI({
            baseURL: this.baseURL,
            apiKey: this.config.apiKey,
            dangerouslyAllowBrowser: true
          });
        }
        
        // Verifica che il client sia stato creato correttamente
        console.log('🔍 Verifica client:', {
          hasClient: !!this.client,
          clientType: this.client?.constructor?.name,
          hasApiKey: !!this.client?.apiKey,
          baseURL: this.client?.baseURL
        });
        
        console.log('✅ Client OpenAI inizializzato con successo');
      }
    } catch (error) {
      console.error('❌ Errore caricamento OpenAI SDK:', error);
      throw new Error('Impossibile caricare OpenAI SDK');
    }
  }

  /**
   * Verifica se un modello supporta system prompt
   */
  modelSupportsSystemPrompt(modelId) {
    // Modelli che supportano system prompt (basati su GPT, Claude, etc.)
    const systemPromptModels = [
      // OpenAI GPT models
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
      'openai/gpt-4-turbo',
      'openai/gpt-4',
      'openai/gpt-3.5-turbo',
      'openai/gpt-3.5-turbo-16k',
      
      // Anthropic Claude models
      'anthropic/claude-3-5-sonnet',
      'anthropic/claude-3-5-haiku',
      'anthropic/claude-3-opus',
      'anthropic/claude-3-sonnet',
      'anthropic/claude-3-haiku',
      'anthropic/claude-2.1',
      'anthropic/claude-2.0',
      'anthropic/claude-instant',
      
      // Google models
      'google/gemini-pro',
      'google/gemini-flash',
      
      // Meta models
      'meta-llama/llama-3.1-8b-instruct',
      'meta-llama/llama-3.1-70b-instruct',
      'meta-llama/llama-3.1-405b-instruct',
      'meta-llama/llama-3.1-8b-instruct:free',
      'meta-llama/llama-3.1-70b-instruct:free',
      
      // Mistral models
      'mistralai/mistral-7b-instruct',
      'mistralai/mixtral-8x7b-instruct',
      'mistralai/mistral-large',
      'mistralai/mistral-medium',
      'mistralai/mistral-small',
      
      // Cohere models
      'cohere/command-r',
      'cohere/command-r-plus',
      'cohere/command-light',
      
      // Perplexity models
      'perplexity/llama-3.1-8b-instruct',
      'perplexity/llama-3.1-70b-instruct',
      'perplexity/llama-3.1-405b-instruct',
      'perplexity/llama-3.1-8b-instruct:free',
      'perplexity/llama-3.1-70b-instruct:free',
      
      // Altri modelli moderni
      'nousresearch/nous-hermes-2-mixtral-8x7b-dpo',
      'nousresearch/nous-hermes-2-yi-34b',
      'nousresearch/nous-hermes-2-mixtral-8x7b-dpo:free',
      'nousresearch/nous-hermes-2-yi-34b:free',
      
      // Modelli che iniziano con questi pattern
      'openai/',
      'anthropic/',
      'google/',
      'meta-llama/',
      'mistralai/',
      'cohere/',
      'perplexity/',
      'nousresearch/'
    ];
    
    // Verifica se il modello è nella lista o inizia con un pattern supportato
    return systemPromptModels.some(pattern => 
      modelId === pattern || 
      (pattern.endsWith('/') && modelId.startsWith(pattern))
    );
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
        // Determina se il modello supporta system prompt
        const supportsSystemPrompt = this.modelSupportsSystemPrompt(model.id);
        
        const modelInfo = {
          value: model.id,
          label: model.name || model.id,
          description: model.description || '',
          context_length: model.context_length,
          pricing: model.pricing,
          supportsSystemPrompt: supportsSystemPrompt
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

    const {
      model = 'openai/gpt-4o-mini',
      temperature = 0.7,
      maxTokens = 4000,
      stream = false
    } = options;

    console.log('🤖 Generazione risposta OpenRouter:', {
      model,
      promptLength: prompt.length,
      hasClient: !!this.client,
      hasApiKey: !!this.config.apiKey
    });

    // Se il client OpenAI non funziona, usa fetch direttamente
    if (!this.client) {
      console.log('🔄 Fallback a fetch diretto');
      return this.generateResponseWithFetch(prompt, options);
    }

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

      console.log('✅ Risposta OpenRouter generata con successo');

      if (stream) {
        return completion; // Restituisce lo stream
      } else {
        return completion.choices[0]?.message?.content || '';
      }
    } catch (error) {
      console.error('❌ Errore nella generazione risposta OpenRouter:', error);
      console.error('🔍 Dettagli errore:', {
        message: error.message,
        status: error.status,
        type: error.type,
        code: error.code
      });
      
      // Se l'SDK fallisce, prova con fetch diretto
      console.log('🔄 Fallback a fetch diretto dopo errore SDK');
      return this.generateResponseWithFetch(prompt, options);
    }
  }

  /**
   * Genera una risposta AI con system prompt
   */
  async generateResponseWithSystem(systemPrompt, userPrompt, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('OpenRouter non configurato. Inserisci la tua API key nelle impostazioni.');
    }

    const {
      model = 'openai/gpt-4o-mini',
      temperature = 0.7,
      maxTokens = 4000,
      stream = false
    } = options;

    console.log('🤖 Generazione risposta OpenRouter con system prompt:', {
      model,
      systemPromptLength: systemPrompt.length,
      userPromptLength: userPrompt.length,
      hasClient: !!this.client,
      hasApiKey: !!this.config.apiKey
    });

    // Se il client OpenAI non funziona, usa fetch diretto
    if (!this.client) {
      console.log('🔄 Fallback a fetch diretto');
      return this.generateResponseWithSystemFetch(systemPrompt, userPrompt, options);
    }

    try {
      const completion = await this.client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
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

      console.log('✅ Risposta OpenRouter con system prompt generata con successo');

      if (stream) {
        return completion; // Restituisce lo stream
      } else {
        return completion.choices[0]?.message?.content || '';
      }
    } catch (error) {
      console.error('❌ Errore nella generazione risposta OpenRouter con system prompt:', error);
      console.error('🔍 Dettagli errore:', {
        message: error.message,
        status: error.status,
        type: error.type,
        code: error.code
      });
      
      // Se l'SDK fallisce, prova con fetch diretto
      console.log('🔄 Fallback a fetch diretto dopo errore SDK');
      return this.generateResponseWithSystemFetch(systemPrompt, userPrompt, options);
    }
  }

  /**
   * Genera una risposta AI usando fetch diretto (fallback)
   */
  async generateResponseWithFetch(prompt, options = {}) {
    const {
      model = 'openai/gpt-4o-mini',
      temperature = 0.7,
      maxTokens = 4000
    } = options;

    console.log('🌐 Usando fetch diretto per OpenRouter');

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'AIdeas'
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature,
          max_tokens: maxTokens
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Errore fetch OpenRouter:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`Errore API OpenRouter: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Risposta fetch OpenRouter generata con successo');
      
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('❌ Errore fetch diretto OpenRouter:', error);
      throw error;
    }
  }

  /**
   * Genera una risposta AI con system prompt usando fetch diretto (fallback)
   */
  async generateResponseWithSystemFetch(systemPrompt, userPrompt, options = {}) {
    const {
      model = 'openai/gpt-4o-mini',
      temperature = 0.7,
      maxTokens = 4000
    } = options;

    console.log('🌐 Usando fetch diretto per OpenRouter con system prompt');

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'AIdeas'
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          temperature,
          max_tokens: maxTokens
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Errore fetch OpenRouter con system prompt:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`Errore API OpenRouter: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Risposta fetch OpenRouter con system prompt generata con successo');
      
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('❌ Errore fetch diretto OpenRouter con system prompt:', error);
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
      console.log('💰 Richiesta crediti OpenRouter...');
      
      const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'AIdeas',
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Risposta API crediti:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Errore API crediti:', errorText);
        throw new Error(`Errore API OpenRouter: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📊 Dati crediti ricevuti:', data);

      // Gestisci diversi formati di risposta
      let credits = 'N/A';
      let usage = {};
      let limits = {};

      if (data.credits !== undefined) {
        credits = data.credits;
      } else if (data.balance !== undefined) {
        credits = data.balance;
      } else if (data.credit_balance !== undefined) {
        credits = data.credit_balance;
      }

      if (data.usage && typeof data.usage === 'object') {
        usage = data.usage;
      }

      if (data.limits && typeof data.limits === 'object') {
        limits = data.limits;
      }

      // Se non ci sono crediti specifici, prova a calcolare dall'usage
      if (credits === 'N/A' && data.usage) {
        if (data.usage.total_requests !== undefined) {
          usage = {
            total_requests: data.usage.total_requests,
            total_tokens: data.usage.total_tokens,
            total_cost: data.usage.total_cost
          };
        }
      }

      const result = {
        credits,
        usage,
        limits,
        rawData: data // Per debug
      };

      console.log('💰 Crediti elaborati:', result);
      return result;

    } catch (error) {
      console.error('❌ Errore nel recupero crediti OpenRouter:', error);
      
      // Restituisci dati di fallback invece di lanciare errore
      return {
        credits: 'N/A',
        usage: {},
        limits: {},
        error: error.message
      };
    }
  }
} 