# 🔧 Configurazione Google OAuth per AIdeas

## Problema attuale
L'applicazione mostra l'errore "Accesso bloccato: errore di autorizzazione" quando si tenta di usare Google Drive per la sincronizzazione.

## Cause possibili

### 1. **App OAuth non configurata correttamente**
- Client ID mancante o errato
- Redirect URI non configurato
- Scopes non autorizzati

### 2. **App non verificata da Google**
- Per app in produzione, Google richiede la verifica
- App in sviluppo possono usare solo utenti test

### 3. **Configurazione OAuth incompleta**
- Manca la configurazione delle credenziali
- Variabili d'ambiente non impostate

## Soluzione temporanea

Per ora, Google Drive è **temporaneamente disabilitato** nell'interfaccia. Usa **GitHub Gist** per la sincronizzazione cloud.

## Configurazione completa Google OAuth (per sviluppatori)

### 1. Crea progetto Google Cloud

1. Vai su [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuovo progetto o seleziona uno esistente
3. Abilita le API necessarie:
   - Google Drive API
   - Google+ API (per user info)

### 2. Configura OAuth 2.0

1. Vai in "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. Configura:
   - **Application type**: Web application
   - **Name**: AIdeas Sync
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     https://aideas.run
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:3000/auth/google.html
     https://aideas.run/auth/google.html
     ```

### 3. Ottieni credenziali

1. Copia il **Client ID** generato
2. Aggiungi al file `.env.local`:
   ```bash
   VITE_GOOGLE_CLIENT_ID=your_client_id_here
   ```

### 4. Configura scopes

Gli scopes necessari sono:
- `https://www.googleapis.com/auth/drive.file` - Accesso ai file dell'app
- `https://www.googleapis.com/auth/drive.appdata` - Dati dell'applicazione
- `https://www.googleapis.com/auth/userinfo.profile` - Info utente

### 5. Test in sviluppo

1. Aggiungi il tuo email come "Test User" nell'app OAuth
2. Usa solo account Google autorizzati per i test
3. Verifica che il redirect funzioni correttamente

### 6. Produzione

Per l'uso in produzione:
1. Verifica l'app con Google (richiede review)
2. Configura domini autorizzati
3. Imposta policy di sicurezza appropriate

## File di configurazione

### Variabili d'ambiente necessarie

```bash
# .env.local
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret_here  # Opzionale per PKCE
```

### Configurazione OAuth nel codice

```javascript
// src/services/GoogleDriveService.js
configure(clientId, clientSecret = null) {
  this.clientId = clientId;
  this.clientSecret = clientSecret;
}
```

## Troubleshooting

### Errore "invalid_request"
- Verifica che Client ID sia corretto
- Controlla che redirect URI sia autorizzato
- Assicurati che l'app sia configurata come "Web application"

### Errore "access_denied"
- L'utente ha negato i permessi
- Scopes non autorizzati
- App non verificata (per utenti non test)

### Errore "redirect_uri_mismatch"
- Redirect URI non corrisponde a quello configurato
- Verifica le impostazioni in Google Cloud Console

## Note per sviluppatori

1. **PKCE (Proof Key for Code Exchange)** è implementato per sicurezza
2. **Refresh tokens** sono gestiti automaticamente
3. **Token storage** è crittografato in localStorage
4. **Error handling** include retry automatico

## Riabilitazione Google Drive

Una volta configurato correttamente:

1. Rimuovi `disabled` dal MenuItem Google Drive
2. Aggiorna la logica in `handleProviderChange`
3. Testa l'autenticazione completa
4. Verifica la sincronizzazione

---

**Nota**: Google Drive rimarrà disabilitato finché non sarà configurato correttamente per evitare errori agli utenti. 