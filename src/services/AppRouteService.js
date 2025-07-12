/**
 * App Route Service - Gestisce le route /app/:id per servire app in nuova scheda
 * Intercetta le richieste per /app/:id e serve i file dallo storage locale
 */

import StorageService from './StorageService.js';

class AppRouteService {
    constructor() {
        if (AppRouteService.instance) {
            return AppRouteService.instance;
        }
        AppRouteService.instance = this;
        this.storageService = StorageService;
        this.initialized = false;
        this.blobUrls = new Map(); // Mappa per tenere traccia dei blob URLs
    }

    /**
     * Inizializza i servizi in modo lazy
     */
    async initialize() {
        if (this.initialized) return;
        
        try {
            this.initialized = true;
            console.log('✅ AppRouteService inizializzato con successo');
        } catch (error) {
            console.error('❌ Errore inizializzazione AppRouteService:', error);
        }
    }

    /**
     * Determina il tipo MIME di un file dal suo nome
     */
    getMimeType(filename) {
        const ext = filename.toLowerCase().split('.').pop();
        const mimeTypes = {
            'html': 'text/html',
            'htm': 'text/html',
            'css': 'text/css',
            'js': 'application/javascript',
            'json': 'application/json',
            'txt': 'text/plain',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'svg': 'image/svg+xml',
            'ico': 'image/x-icon'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }

    /**
     * Determina se un file è un file di testo dal suo nome
     */
    isTextFile(filename) {
        const textExtensions = ['.html', '.htm', '.css', '.js', '.txt', '.json', '.xml', '.svg', '.md'];
        return textExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    }

    /**
     * Crea un blob URL per un file
     */
    createBlobUrl(content, isText, mimeType) {
        let blob;
        if (isText) {
            blob = new Blob([content], { type: mimeType });
        } else {
            // File binario (base64)
            const binaryString = atob(content);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            blob = new Blob([bytes], { type: mimeType });
        }
        return URL.createObjectURL(blob);
    }

    /**
     * Pulisce i blob URLs dopo un timeout
     */
    cleanupBlobUrls() {
        setTimeout(() => {
            for (const url of this.blobUrls.values()) {
                URL.revokeObjectURL(url);
            }
            this.blobUrls.clear();
        }, 60000); // 60 secondi
    }

    /**
     * Apre l'app in una nuova finestra
     */
    async openAppInNewTab(appId) {
        try {
            console.log(`📱 Apertura app ${appId} in nuova finestra`);
            
            // Recupera i file dell'app
            const appData = await this.storageService.getAppData(appId);
            console.log('📁 Dati app recuperati:', appData);
            
            if (!appData || !appData.files || !appData.files['index.html']) {
                throw new Error('App non trovata o file index.html mancante');
            }

            // Crea blob URLs per tutti i file (esattamente come nel basecode originale)
            const blobUrls = {};
            let fileCount = 0;
            
            for (const [filename, fileData] of Object.entries(appData.files)) {
                try {
                    let blob;
                    
                    // Controlla se il file è di testo o binario
                    const isTextFile = this.isTextFile(filename);
                    const mimeType = this.getMimeType(filename);
                    
                    if (isTextFile) {
                        blob = new Blob([fileData], { type: mimeType });
                    } else {
                        // Per file binari, gestisci come nel basecode originale
                        try {
                            const binaryString = atob(fileData);
                            const bytes = new Uint8Array(binaryString.length);
                            for (let i = 0; i < binaryString.length; i++) {
                                bytes[i] = binaryString.charCodeAt(i);
                            }
                            blob = new Blob([bytes], { type: mimeType });
                        } catch (decodeError) {
                            // Se non è base64, trattalo come testo
                            blob = new Blob([fileData], { type: mimeType });
                        }
                    }
                    
                    const blobUrl = URL.createObjectURL(blob);
                    blobUrls[filename] = blobUrl;
                    this.blobUrls.set(filename, blobUrl);
                    fileCount++;
                    
                    console.log(`📄 Blob URL creato per: ${filename} (${mimeType})`);
                } catch (error) {
                    console.error(`❌ Errore creazione blob per ${filename}:`, error);
                }
            }

            // Sostituisci tutti i riferimenti relativi con blob URLs (esattamente come nel basecode originale)
            let indexHtml = appData.files['index.html'];
            let replacementCount = 0;
            for (const [filename, blobUrl] of Object.entries(blobUrls)) {
                if (filename !== 'index.html') {
                    // Usa gli stessi pattern del basecode originale
                    const patterns = [
                        new RegExp(`(href|src)=["']${filename}["']`, 'g'),
                        new RegExp(`(href|src)=["']\\./${filename}["']`, 'g')
                    ];
                    
                    patterns.forEach(pattern => {
                        const beforeReplace = indexHtml;
                        indexHtml = indexHtml.replace(pattern, `$1="${blobUrl}"`);
                        if (beforeReplace !== indexHtml) {
                            replacementCount++;
                            console.log(`🔄 Sostituito riferimento a ${filename} con blob URL`);
                        }
                    });
                }
            }

            console.log(`✅ Creati ${fileCount} blob URLs, effettuate ${replacementCount} sostituzioni`);

            // Apri la nuova finestra (esattamente come nel basecode originale)
            const subAppWindow = window.open('', `app_${appId}`, 'width=1200,height=800,scrollbars=yes');
            
            if (subAppWindow) {
                subAppWindow.document.write(indexHtml);
                subAppWindow.document.close();
                
                // Cleanup URLs quando la finestra si chiude (come nel basecode originale)
                const checkClosed = setInterval(() => {
                    if (subAppWindow.closed) {
                        Object.values(blobUrls).forEach(url => URL.revokeObjectURL(url));
                        clearInterval(checkClosed);
                        console.log('🧹 Blob URLs puliti per finestra chiusa');
                    }
                }, 1000);
                
                // Cleanup di sicurezza dopo 10 minuti
                setTimeout(() => {
                    Object.values(blobUrls).forEach(url => URL.revokeObjectURL(url));
                    clearInterval(checkClosed);
                    console.log('🧹 Blob URLs puliti per timeout');
                }, 600000);
                
            } else {
                throw new Error('Impossibile aprire la finestra. Controlla le impostazioni popup.');
            }

        } catch (error) {
            console.error('❌ Errore apertura app:', error);
            throw error;
        }
    }
}

export default new AppRouteService(); 