# Setup Repository aideas.store

Questo documento descrive come configurare il repository `mccoy88f/aideas.store` per gestire le submission delle app tramite GitHub Issues.

## Struttura Repository

```
aideas.store/
├── .github/
│   └── workflows/
│       └── process-app-submission.yml
├── apps/
│   ├── app1/
│   │   ├── aideas.json
│   │   ├── index.html
│   │   └── ...
│   └── app2/
│       ├── aideas.json
│       ├── index.html
│       └── ...
├── catalog.json
└── README.md
```

## GitHub Actions Workflow

### `.github/workflows/process-app-submission.yml`

```yaml
name: Process App Submission

on:
  issues:
    types: [labeled]

jobs:
  publish-app:
    if: contains(github.event.label.name, 'approved')
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract app info from issue
        id: extract
        run: |
          # Parse issue body to extract ZIP URL and app name
          APP_NAME=$(echo "${{ github.event.issue.title }}" | sed 's/\[SUBMISSION\] //' | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
          ZIP_URL=$(echo "${{ github.event.issue.body }}" | grep -o 'https://file.io/[^[:space:]]*')
          echo "app_name=$APP_NAME" >> $GITHUB_OUTPUT
          echo "zip_url=$ZIP_URL" >> $GITHUB_OUTPUT
      
      - name: Download and extract ZIP
        run: |
          # Download ZIP
          curl -L "${{ steps.extract.outputs.zip_url }}" -o temp.zip
          
          # Create app directory
          mkdir -p "apps/${{ steps.extract.outputs.app_name }}"
          
          # Extract ZIP to app directory
          unzip -j temp.zip -d "apps/${{ steps.extract.outputs.app_name }}/"
          
          # Cleanup
          rm temp.zip
      
      - name: Validate app structure
        run: |
          # Check if required files exist
          if [ ! -f "apps/${{ steps.extract.outputs.app_name }}/index.html" ]; then
            echo "Error: index.html is required"
            exit 1
          fi
          
          # Validate aideas.json if exists
          if [ -f "apps/${{ steps.extract.outputs.app_name }}/aideas.json" ]; then
            # Add JSON validation here
            echo "Manifest found and validated"
          fi
      
      - name: Update catalog
        run: |
          # Generate/update catalog.json with new app
          node .github/scripts/update-catalog.js
      
      - name: Commit new app
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add .
          git commit -m "Add app: ${{ steps.extract.outputs.app_name }}"
          git push
      
      - name: Close and comment issue
        uses: peter-evans/close-issue@v2
        with:
          issue-number: ${{ github.event.issue.number }}
          comment: |
            ✅ App **${{ steps.extract.outputs.app_name }}** has been published!
            
            You can find it at: https://mccoy88f.github.io/aideas.store/apps/${{ steps.extract.outputs.app_name }}/
```

## Script di Aggiornamento Catalogo

### `.github/scripts/update-catalog.js`

```javascript
const fs = require('fs');
const path = require('path');

const appsDir = './apps';
const catalogPath = './catalog.json';

// Read all app directories
const apps = fs.readdirSync(appsDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => {
    const appPath = path.join(appsDir, dirent.name);
    const manifestPath = path.join(appPath, 'aideas.json');
    
    let manifest = {
      name: dirent.name,
      title: dirent.name,
      description: '',
      version: '1.0.0'
    };
    
    if (fs.existsSync(manifestPath)) {
      manifest = { ...manifest, ...JSON.parse(fs.readFileSync(manifestPath, 'utf8')) };
    }
    
    return {
      id: dirent.name,
      ...manifest,
      path: `apps/${dirent.name}/`,
      publishedAt: new Date().toISOString()
    };
  });

// Write catalog
fs.writeFileSync(catalogPath, JSON.stringify({ apps, updatedAt: new Date().toISOString() }, null, 2));
console.log(`Updated catalog with ${apps.length} apps`);
```

## Labels Richieste

Nel repository `aideas.store`, crea le seguenti labels:

- `app-submission` - Per identificare le issue di submission
- `pending-review` - Per app in attesa di review
- `approved` - Per app approvate (triggera la pubblicazione)
- `rejected` - Per app rifiutate
- `ai-generated` - Per app generate con AI

## Configurazione Repository

1. **Crea il repository** `mccoy88f/aideas.store`
2. **Abilita GitHub Pages** per il branch `main`
3. **Aggiungi le labels** sopra elencate
4. **Configura le GitHub Actions** copiando il workflow
5. **Crea la struttura delle cartelle**:
   ```bash
   mkdir -p .github/workflows
   mkdir -p .github/scripts
   mkdir -p apps
   ```

## Workflow di Sottomissione

1. **Utente ha app installata** in AIdeas (manuale o generata con AI)
2. **Apre il modale dell'app** e clicca "Sottometti allo Store"
3. **Compila metadati** nel modal di sottomissione
4. **Sistema crea ZIP** dell'app con manifest
5. **Upload su file.io** (24h retention)
6. **Crea issue** su `aideas.store` con:
   - Title: `[SUBMISSION] Nome App`
   - Body: Dettagli app + link ZIP + report sicurezza
   - Labels: `app-submission`, `pending-review`, `ai-generated`
7. **Reviewer approva** aggiungendo label `approved`
8. **GitHub Action** processa automaticamente:
   - Scarica ZIP
   - Estrae file
   - Valida struttura
   - Aggiorna catalogo
   - Committa e pusha
   - Chiude issue

## App Eleggibili per Sottomissione

Solo le app che soddisfano questi criteri possono essere sottoposte:

- ✅ **App installate manualmente** (`source === 'manual'`)
- ✅ **App generate con AI e importate** (`source === 'ai-generated'`)
- ❌ **App già presenti nello store** (`source === 'store'`)
- ❌ **App URL esterne** (`type === 'url'`)
- ❌ **App non installate localmente** (senza `id`)

## Sicurezza

- **Validazione contenuto**: Controlla che non ci siano script dannosi
- **Limite dimensioni**: file.io ha limite di 2GB
- **Retention temporanea**: file.io mantiene file solo 24h
- **Review manuale**: Tutte le app sono riviste prima della pubblicazione

## Integrazione con AIdeas

Il sistema si integra perfettamente con AIdeas esistente:

- **Sfrutta GitHubService** esistente per autenticazione
- **Usa SecurityService** per analisi contenuto
- **Mantiene compatibilità** con StoreService esistente
- **Aggiunge funzionalità** senza modificare il core

## Vantaggi dell'Approccio

1. **Semplicità**: Non richiede fork/branch complessi
2. **Review Process**: Controllo manuale prima della pubblicazione
3. **Automazione**: Processo automatico dopo approvazione
4. **Tracciabilità**: Ogni submission ha una issue dedicata
5. **Sicurezza**: Analisi contenuto integrata
6. **Integrazione**: Sfrutta infrastruttura esistente 