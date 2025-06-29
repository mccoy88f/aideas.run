/**
 * AIdeas - Proxy Service
 * Gestisce le richieste proxy per estrazione metadati
 */

import * as cheerio from 'cheerio';

export default class ProxyService {
  constructor() {
    // Lista di proxy pubblici disponibili (più robusta)
    this.proxies = [
      'https://api.allorigins.win/raw?url=',
      'https://cors-anywhere.herokuapp.com/',
      'https://thingproxy.freeboard.io/fetch/',
      'https://cors.bridged.cc/',
      'https://api.codetabs.com/v1/proxy?quest=',
      'https://corsproxy.io/?',
      'https://cors-anywhere.1d4s.me/',
      'https://cors-anywhere.herokuapp.com/'
    ];
    
    this.currentProxyIndex = 0;
  }

  /**
   * Recupera contenuto usando proxy rotanti
   */
  async fetchWithFallback(url, options = {}) {
    return this.fetchWithProxy(url);
  }

  /**
   * Recupera contenuto HTML usando proxy rotanti
   */
  async fetchWithProxy(url) {
    let lastError = null;

    // Prova tutti i proxy disponibili
    for (let i = 0; i < this.proxies.length; i++) {
      const proxyIndex = (this.currentProxyIndex + i) % this.proxies.length;
      const proxy = this.proxies[proxyIndex];

      try {
        const response = await fetch(proxy + encodeURIComponent(url), {
          method: 'GET',
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          timeout: 10000
        });

        if (response.ok) {
          const content = await response.text();
          
          // Verifica che sia HTML valido
          if (content.includes('<html') || content.includes('<head') || content.includes('<body')) {
            this.currentProxyIndex = proxyIndex; // Aggiorna proxy di successo
            return content;
          }
        }
      } catch (error) {
        console.log(`Proxy ${proxyIndex} fallito:`, error.message);
        lastError = error;
      }
    }

    // Se tutti i proxy falliscono, prova approccio diretto
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (response.ok) {
        return await response.text();
      }
    } catch (error) {
      console.log('Anche l\'approccio diretto è fallito:', error);
    }

    throw lastError || new Error('Impossibile recuperare il contenuto');
  }

  /**
   * Estrae metadati da una URL usando il proxy locale
   */
  async extractMetadata(url) {
    try {
      // Ottieni la lingua dalle impostazioni o usa italiano di default
      const userLang = localStorage.getItem('aideas-language') || 'it';
      const response = await fetch(`http://localhost:4000/extract?url=${encodeURIComponent(url)}&lang=${userLang}`);
      if (!response.ok) throw new Error('Proxy meta fallito');
      return await response.json();
    } catch (error) {
      // Fallback: solo dominio e favicon
      const domain = new URL(url).hostname;
      return {
        title: domain,
        description: `App web da ${domain}`,
        icon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
      };
    }
  }

  /**
   * Estrae la migliore icona disponibile
   */
  extractBestIcon($, baseUrl) {
    // Priorità delle icone
    const iconSelectors = [
      'link[rel="apple-touch-icon"][sizes="180x180"]',
      'link[rel="apple-touch-icon"][sizes="152x152"]',
      'link[rel="apple-touch-icon"][sizes="144x144"]',
      'link[rel="apple-touch-icon"][sizes="120x120"]',
      'link[rel="apple-touch-icon"]',
      'link[rel="icon"][type="image/png"][sizes="32x32"]',
      'link[rel="icon"][type="image/png"][sizes="16x16"]',
      'link[rel="icon"][type="image/svg+xml"]',
      'link[rel="shortcut icon"]',
      'link[rel="icon"]'
    ];

    for (const selector of iconSelectors) {
      const icon = $(selector).attr('href');
      if (icon) {
        return new URL(icon, baseUrl).href;
      }
    }

    return null;
  }

  /**
   * Estrae il titolo della pagina
   */
  extractTitle(html) {
    const patterns = [
      /<title[^>]*>([^<]+)<\/title>/i,
      /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i,
      /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        const title = match[1].trim();
        if (title && title.length > 0) {
          return title;
        }
      }
    }
    
    return null;
  }

  /**
   * Estrae la descrizione dai meta tag
   */
  extractDescription(html) {
    const patterns = [
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i,
      /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i,
      /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i,
      /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        const desc = match[1].trim();
        if (desc && desc.length > 0) {
          return desc;
        }
      }
    }
    
    return null;
  }

  /**
   * Estrae l'icona/favicon
   */
  extractIcon(html, baseUrl) {
    const patterns = [
      /<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i,
      /<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:icon|shortcut icon)["']/i,
      /<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i,
      /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']apple-touch-icon["']/i
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        try {
          const iconUrl = new URL(match[1], baseUrl).href;
          console.log('Icona trovata:', iconUrl);
          return iconUrl;
        } catch (e) {
          console.log('URL icona non valido:', match[1]);
        }
      }
    }
    
    return null;
  }

  /**
   * Estrae specificamente l'apple-touch-icon
   */
  extractAppleTouchIcon(html, baseUrl) {
    const patterns = [
      /<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i,
      /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']apple-touch-icon["']/i,
      /<link[^>]*rel=["']apple-touch-icon-precomposed["'][^>]*href=["']([^"']+)["']/i,
      /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']apple-touch-icon-precomposed["']/i
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        try {
          const iconUrl = new URL(match[1], baseUrl).href;
          console.log('Apple Touch Icon trovata:', iconUrl);
          return iconUrl;
        } catch (e) {
          console.log('URL apple-touch-icon non valido:', match[1]);
        }
      }
    }
    
    return null;
  }

  /**
   * Estrae le keywords
   */
  extractKeywords(html) {
    const match = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);
    return match ? match[1].trim() : null;
  }

  /**
   * Estrae l'autore
   */
  extractAuthor(html) {
    const match = html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i);
    return match ? match[1].trim() : null;
  }

  /**
   * Estrae l'immagine Open Graph
   */
  extractOGImage(html) {
    const match = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    return match ? match[1].trim() : null;
  }

  /**
   * Estrae il titolo Open Graph
   */
  extractOGTitle(html) {
    const match = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    return match ? match[1].trim() : null;
  }

  /**
   * Estrae la descrizione Open Graph
   */
  extractOGDescription(html) {
    const match = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    return match ? match[1].trim() : null;
  }

  /**
   * Testa la connettività di un proxy
   */
  async testProxy(proxyUrl) {
    try {
      const response = await fetch(proxyUrl + encodeURIComponent('https://httpbin.org/ip'), {
        method: 'GET',
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Ottiene informazioni sui proxy disponibili
   */
  async getProxyStatus() {
    const status = {};
    
    for (let i = 0; i < this.proxies.length; i++) {
      const proxy = this.proxies[i];
      status[proxy] = await this.testProxy(proxy);
    }
    
    return status;
  }
} 