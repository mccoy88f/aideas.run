// === GLOBAL VARIABLES ===
const storage = localStorage;
let installedApps = {};
let currentEditId = null;

// === MAIN FUNCTIONS ===

function launchApp(appId) {
    const app = installedApps[appId];
    if (!app) return;

    try {
        // Update launch statistics
        app.lastLaunched = new Date().toISOString();
        app.launchCount = (app.launchCount || 0) + 1;
        storage.setItem('installed_apps', JSON.stringify(installedApps));

        const blobUrls = {};
        for (const [filename, fileData] of Object.entries(app.files)) {
            let blob;
            if (fileData.isText) {
                blob = new Blob([fileData.content], { type: fileData.mimeType });
            } else {
                const binaryString = atob(fileData.content);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                blob = new Blob([bytes], { type: fileData.mimeType });
            }
            blobUrls[filename] = URL.createObjectURL(blob);
        }

        let indexHtml = app.files['index.html'].content;
        
        for (const [filename, blobUrl] of Object.entries(blobUrls)) {
            if (filename !== 'index.html') {
                const patterns = [
                    new RegExp(`(href|src)=["']${filename}["']`, 'g'),
                    new RegExp(`(href|src)=["']\\./${filename}["']`, 'g')
                ];
                
                patterns.forEach(pattern => {
                    indexHtml = indexHtml.replace(pattern, `$1="${blobUrl}"`);
                });
            }
        }

        const appWindow = window.open('', `app_${appId}`, 'width=1200,height=800,scrollbars=yes');
        
        if (appWindow) {
            appWindow.document.write(indexHtml);
            appWindow.document.close();
            
            const checkClosed = setInterval(() => {
                if (appWindow.closed) {
                    Object.values(blobUrls).forEach(url => URL.revokeObjectURL(url));
                    clearInterval(checkClosed);
                }
            }, 1000);
            
            setTimeout(() => {
                Object.values(blobUrls).forEach(url => URL.revokeObjectURL(url));
                clearInterval(checkClosed);
            }, 600000);

            // Update UI to show new launch count
            renderApps();
        } else {
            showStatus('❌ Impossibile aprire la finestra. Controlla le impostazioni popup.', 'error');
        }
        
    } catch (error) {
        showStatus(`❌ Errore nell'avvio dell'app: ${error.message}`, 'error');
    }
}

function deleteApp(appId) {
    const app = installedApps[appId];
    if (!app) return;
    
    if (confirm(`Sei sicuro di voler eliminare "${app.title}"?`)) {
        delete installedApps[appId];
        storage.setItem('installed_apps', JSON.stringify(installedApps));
        renderApps();
        updateStats();
        showStatus('✅ AI-Idea eliminata con successo!', 'success');
    }
}

function editApp(appId) {
    const app = installedApps[appId];
    if (!app) return;
    
    currentEditId = appId;
    document.getElementById('editName').value = app.title;
    document.getElementById('editDescription').value = app.description;
    document.getElementById('editCategory').value = app.category || 'other';
    document.getElementById('editTags').value = (app.tags || []).join(', ');
    document.getElementById('editModal').classList.add('show');
}

function toggleFavorite(appId) {
    const app = installedApps[appId];
    if (!app) return;
    
    app.favorite = !app.favorite;
    storage.setItem('installed_apps', JSON.stringify(installedApps));
    renderApps();
    
    const action = app.favorite ? 'aggiunta ai' : 'rimossa dai';
    showStatus(`✅ "${app.title}" ${action} preferiti!`, 'success');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('show');
    currentEditId = null;
}

function saveAppEdit() {
    if (!currentEditId) return;
    
    const newTitle = document.getElementById('editName').value.trim();
    const newDescription = document.getElementById('editDescription').value.trim();
    const newCategory = document.getElementById('editCategory').value;
    const newTags = document.getElementById('editTags').value
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
    
    if (newTitle) {
        installedApps[currentEditId].title = newTitle;
        installedApps[currentEditId].description = newDescription;
        installedApps[currentEditId].category = newCategory;
        installedApps[currentEditId].tags = newTags;
        
        storage.setItem('installed_apps', JSON.stringify(installedApps));
        renderApps();
        closeEditModal();
        showStatus('✅ AI-Idea modificata con successo!', 'success');
    }
}

function clearAllApps() {
    if (confirm('Sei sicuro di voler eliminare TUTTE le AI-Ideas?')) {
        installedApps = {};
        storage.clear();
        renderApps();
        updateStats();
        showStatus('✅ Tutte le AI-Ideas sono state eliminate!', 'success');
    }
}

function exportApps() {
    const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        type: 'aideas_backup',
        totalApps: Object.keys(installedApps).length,
        apps: installedApps
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aideas-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showStatus('📤 Backup completo esportato!', 'success');
}

function openImportModal() {
    document.getElementById('importModal').classList.add('show');
    switchImportType('zip');
}

function closeImportModal() {
    document.getElementById('importModal').classList.remove('show');
    document.getElementById('importZipInput').value = '';
    document.getElementById('importBackupInput').value = '';
    document.getElementById('importUrlInput').value = '';
}

function switchImportType(type) {
    document.querySelectorAll('.import-type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-type="${type}"]`).classList.add('active');

    document.querySelectorAll('.import-section').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(`${type}Import`).classList.remove('hidden');
}

async function importFromUrl() {
    const url = document.getElementById('importUrlInput').value.trim();
    
    if (!url) {
        showStatus('❌ Inserisci un URL valido', 'error');
        return;
    }

    if (!url.endsWith('.zip')) {
        showStatus('❌ L\'URL deve puntare a un file ZIP', 'error');
        return;
    }

    try {
        showProgress(true);
        showStatus('⬇️ Download in corso...', 'info');

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const file = new File([arrayBuffer], 'app-from-url.zip', { type: 'application/zip' });
        
        await handleZipFile(file);
        closeImportModal();

    } catch (error) {
        showProgress(false);
        showStatus(`❌ Errore download: ${error.message}`, 'error');
        console.error(error);
    }
}

// === UTILITY FUNCTIONS ===

function showStatus(message, type) {
    const statusDiv = document.getElementById('uploadStatus');
    const alertClass = type === 'error' ? 'alert-error' : type === 'success' ? 'alert-success' : 'alert-info';
    statusDiv.innerHTML = `<div class="alert ${alertClass}">${message}</div>`;
    setTimeout(() => {
        statusDiv.innerHTML = '';
    }, 5000);
}

function showProgress(show) {
    const progressContainer = document.getElementById('progressContainer');
    progressContainer.style.display = show ? 'block' : 'none';
    if (!show) {
        updateProgress(0);
    }
}

function updateProgress(percent) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    progressFill.style.width = percent + '%';
    progressText.textContent = Math.round(percent) + '%';
}

function updateStats() {
    const appCount = Object.keys(installedApps).length;
    const totalSize = Object.values(installedApps).reduce((sum, app) => sum + app.size, 0);
    
    document.getElementById('appCount').textContent = appCount;
    document.getElementById('storageUsed').textContent = (totalSize / (1024 * 1024)).toFixed(2);

    const exportBtn = document.getElementById('exportBtn');
    const clearBtn = document.getElementById('clearBtn');
    if (exportBtn) exportBtn.disabled = appCount === 0;
    if (clearBtn) clearBtn.disabled = appCount === 0;
}

function detectCategory(keywords, description, title) {
    const text = `${keywords.join(' ')} ${description} ${title}`.toLowerCase();
    
    const categories = {
        'ai': ['ai', 'artificial intelligence', 'machine learning', 'ml', 'neural', 'tensorflow', 'pytorch', 'keras', 'deep learning', 'nlp', 'computer vision', 'chatbot', 'gpt'],
        'data': ['data', 'analytics', 'visualization', 'chart', 'graph', 'dashboard', 'statistics', 'pandas', 'numpy', 'jupyter', 'analysis'],
        'web': ['web', 'website', 'frontend', 'backend', 'react', 'vue', 'angular', 'javascript', 'html', 'css', 'node', 'api'],
        'tools': ['tool', 'utility', 'converter', 'generator', 'calculator', 'helper', 'automation', 'productivity'],
        'games': ['game', 'gaming', 'play', 'puzzle', 'quiz', 'entertainment', 'fun', 'arcade']
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
        if (keywords.some(keyword => text.includes(keyword))) {
            return category;
        }
    }
    
    return 'other';
}

function getCategoryInfo(category) {
    const categories = {
        'ai': { emoji: '🤖', name: 'AI/ML' },
        'data': { emoji: '📊', name: 'Data Science' },
        'web': { emoji: '🌐', name: 'Web Apps' },
        'tools': { emoji: '🛠️', name: 'Tools' },
        'games': { emoji: '🎮', name: 'Games' },
        'other': { emoji: '📱', name: 'Altro' }
    };
    return categories[category] || categories.other;
}

function isTextFile(filename) {
    const textExtensions = ['.html', '.htm', '.css', '.js', '.txt', '.json', '.xml', '.svg', '.md'];
    return textExtensions.some(ext => filename.toLowerCase().endsWith(ext));
}

function getMimeType(filename) {
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

function generateAppId() {
    return 'app_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// === CORE FUNCTIONS ===

function loadInstalledApps() {
    const saved = storage.getItem('installed_apps');
    if (saved) {
        installedApps = JSON.parse(saved);
        renderApps();
    }
}

function setupEventListeners() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const searchBox = document.getElementById('searchBox');
    const sortSelect = document.getElementById('sortSelect');
    const categoryFilter = document.getElementById('categoryFilter');

    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].name.endsWith('.zip')) {
            handleZipFile(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleZipFile(e.target.files[0]);
        }
    });

    searchBox.addEventListener('input', filterApps);
    sortSelect.addEventListener('change', filterApps);
    categoryFilter.addEventListener('change', filterApps);

    document.getElementById('editModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeEditModal();
        }
    });

    document.getElementById('importModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeImportModal();
        }
    });

    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('import-type-btn')) {
            switchImportType(e.target.dataset.type);
        }
    });

    document.getElementById('importZipInput').addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleZipFile(e.target.files[0]);
            closeImportModal();
        }
    });

    document.getElementById('importBackupInput').addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleBackupImport(e.target.files[0]);
        }
    });
}

async function handleZipFile(file) {
    showProgress(true);
    showStatus('Elaborazione ZIP in corso...', 'info');
    
    try {
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(file);
        
        if (!zipContent.files['index.html']) {
            throw new Error('File index.html non trovato nella root del ZIP!');
        }

        let progress = 0;
        const totalFiles = Object.keys(zipContent.files).length;
        const appFiles = {};
        
        for (const [filename, zipEntry] of Object.entries(zipContent.files)) {
            if (!zipEntry.dir) {
                progress++;
                updateProgress((progress / totalFiles) * 100);
                
                let content;
                if (isTextFile(filename)) {
                    content = await zipEntry.async('text');
                } else {
                    content = await zipEntry.async('base64');
                }
                
                appFiles[filename] = {
                    content: content,
                    isText: isTextFile(filename),
                    mimeType: getMimeType(filename)
                };
            }
        }

        const metadata = extractMetadata(appFiles['index.html'].content);
        const appId = generateAppId();
        
        const detectedCategory = detectCategory(metadata.keywords, metadata.description, metadata.title);
        
        const app = {
            id: appId,
            title: metadata.title || 'AI-Idea Senza Nome',
            description: metadata.description || 'Una fantastica AI-Idea in sviluppo',
            version: metadata.version || '1.0.0',
            author: metadata.author || 'Sconosciuto',
            keywords: metadata.keywords || [],
            category: detectedCategory,
            tags: metadata.keywords || [],
            favorite: false,
            favicon: metadata.favicon,
            files: appFiles,
            installedAt: new Date().toISOString(),
            fileCount: Object.keys(appFiles).length,
            size: JSON.stringify(appFiles).length,
            lastLaunched: null,
            launchCount: 0
        };

        installedApps[appId] = app;
        storage.setItem('installed_apps', JSON.stringify(installedApps));
        
        showProgress(false);
        showStatus(`✅ AI-Idea "${app.title}" deployed con successo!`, 'success');
        
        renderApps();
        updateStats();
        
    } catch (error) {
        showProgress(false);
        showStatus(`❌ Errore: ${error.message}`, 'error');
        console.error(error);
    }
}

function extractMetadata(htmlContent) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    const getMetaContent = (name) => {
        const meta = doc.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
        return meta ? meta.getAttribute('content') : null;
    };
    
    const getLinkHref = (rel) => {
        const link = doc.querySelector(`link[rel="${rel}"]`);
        return link ? link.getAttribute('href') : null;
    };
    
    return {
        title: doc.title || getMetaContent('title'),
        description: getMetaContent('description') || getMetaContent('og:description'),
        version: getMetaContent('version') || getMetaContent('app-version'),
        author: getMetaContent('author') || getMetaContent('creator'),
        keywords: getMetaContent('keywords') ? getMetaContent('keywords').split(',').map(k => k.trim()) : [],
        favicon: getLinkHref('icon') || getLinkHref('shortcut icon') || 'favicon.ico',
    };
}

async function handleBackupImport(file) {
    try {
        const content = await file.text();
        const backupData = JSON.parse(content);
        
        if (!backupData.type || backupData.type !== 'aideas_backup') {
            throw new Error('File di backup non valido');
        }

        if (!backupData.apps || typeof backupData.apps !== 'object') {
            throw new Error('Struttura backup corrotta');
        }

        const appCount = Object.keys(backupData.apps).length;
        const currentCount = Object.keys(installedApps).length;
        
        const confirmMessage = `Ripristinare ${appCount} AI-Ideas dal backup?\n\n` +
            `Questo sostituirà le ${currentCount} AI-Ideas attuali.\n` +
            `Backup creato: ${new Date(backupData.exportedAt).toLocaleString()}`;

        if (!confirm(confirmMessage)) {
            return;
        }

        installedApps = backupData.apps;
        storage.setItem('installed_apps', JSON.stringify(installedApps));
        
        renderApps();
        updateStats();
        closeImportModal();
        
        showStatus(`✅ ${appCount} AI-Ideas ripristinate dal backup!`, 'success');

    } catch (error) {
        showStatus(`❌ Errore import backup: ${error.message}`, 'error');
        console.error(error);
    }
}

function renderApps() {
    const container = document.getElementById('appsContainer');
    const apps = Object.values(installedApps);
    
    if (apps.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🤖</div>
                <h3>Nessuna AI-Idea deployed</h3>
                <p>Carica il tuo primo progetto AI per iniziare!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="apps-grid">
            ${apps.map((app, index) => createAppCard(app, index)).join('')}
        </div>
    `;
}

function createAppCard(app, index) {
    const faviconUrl = app.favicon && app.files[app.favicon] ? 
        `data:${app.files[app.favicon].mimeType};base64,${app.files[app.favicon].content}` : 
        null;
    
    const categoryInfo = getCategoryInfo(app.category || 'other');
    const iconContent = faviconUrl ? 
        `<img src="${faviconUrl}" alt="Icon" />` : 
        categoryInfo.emoji;

    const tagsHtml = app.tags && app.tags.length > 0 ? 
        app.tags.slice(0, 3).map(tag => 
            `<span class="tag-chip">${tag.trim()}</span>`
        ).join('') : '';

    const favoriteClass = app.favorite ? 'favorite' : '';
    const favoriteIcon = app.favorite ? 'star' : 'star_border';

    return `
        <div class="app-card glass glass-hover fade-in" style="animation-delay: ${index * 0.1}s">
            <div class="card-content">
                <div class="app-header">
                    <div class="app-avatar">
                        ${iconContent}
                    </div>
                    <div class="app-info">
                        <div class="app-title">${app.title}</div>
                        <div class="app-version">v${app.version} • ${app.author}</div>
                    </div>
                    <button class="icon-btn favorite-btn ${favoriteClass}" onclick="toggleFavorite('${app.id}')" title="Preferiti">
                        <span class="material-icons" style="font-size: 20px;">${favoriteIcon}</span>
                    </button>
                </div>
                
                <div class="app-category">
                    <span class="category-chip">${categoryInfo.emoji} ${categoryInfo.name}</span>
                </div>
                
                <div class="app-description">
                    ${app.description}
                </div>
                
                ${tagsHtml ? `<div class="app-tags">${tagsHtml}</div>` : ''}
                
                <div class="app-meta">
                    <div class="meta-chip">📁 ${app.fileCount} file</div>
                    <div class="meta-chip">💾 ${(app.size / 1024).toFixed(1)} KB</div>
                    ${app.launchCount > 0 ? `<div class="meta-chip">🚀 ${app.launchCount}</div>` : ''}
                </div>
                
                <div class="app-actions">
                    <button class="btn btn-success" onclick="launchApp('${app.id}')" style="flex: 1;">
                        <span class="material-icons" style="font-size: 16px;">launch</span>
                        Avvia
                    </button>
                    <button class="icon-btn" onclick="editApp('${app.id}')" title="Modifica">
                        <span class="material-icons" style="font-size: 16px;">edit</span>
                    </button>
                    <button class="icon-btn" onclick="deleteApp('${app.id}')" title="Elimina">
                        <span class="material-icons" style="font-size: 16px;">delete</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function filterApps() {
    const searchTerm = document.getElementById('searchBox').value.toLowerCase();
    const sortBy = document.getElementById('sortSelect').value;
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    let apps = Object.values(installedApps);
    
    if (searchTerm) {
        apps = apps.filter(app => 
            app.title.toLowerCase().includes(searchTerm) ||
            app.description.toLowerCase().includes(searchTerm) ||
            app.author.toLowerCase().includes(searchTerm) ||
            (app.tags && app.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
    }

    if (categoryFilter) {
        apps = apps.filter(app => app.category === categoryFilter);
    }
    
    apps.sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.title.localeCompare(b.title);
            case 'date':
                return new Date(b.installedAt) - new Date(a.installedAt);
            case 'size':
                return b.size - a.size;
            case 'category':
                const categoryA = getCategoryInfo(a.category || 'other').name;
                const categoryB = getCategoryInfo(b.category || 'other').name;
                return categoryA.localeCompare(categoryB);
            default:
                return 0;
        }
    });

    apps.sort((a, b) => {
        if (a.favorite && !b.favorite) return -1;
        if (!a.favorite && b.favorite) return 1;
        return 0;
    });
    
    const container = document.getElementById('appsContainer');
    if (apps.length === 0) {
        if (Object.keys(installedApps).length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🤖</div>
                    <h3>Nessuna AI-Idea deployed</h3>
                    <p>Carica il tuo primo progetto AI per iniziare!</p>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h3>Nessun risultato</h3>
                    <p>Prova a modificare i criteri di ricerca</p>
                </div>
            `;
        }
    } else {
        container.innerHTML = `
            <div class="apps-grid">
                ${apps.map((app, index) => createAppCard(app, index)).join('')}
            </div>
        `;
    }
}

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', function() {
    loadInstalledApps();
    setupEventListeners();
    updateStats();
});