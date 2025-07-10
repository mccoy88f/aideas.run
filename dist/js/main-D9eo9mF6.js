const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["js/main-material-Cv2LqEX9.js","js/vendor-Cc5w31rP.js"])))=>i.map(i=>d[i]);
import{D as E}from"./vendor-Cc5w31rP.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))r(o);new MutationObserver(o=>{for(const n of o)if(n.type==="childList")for(const i of n.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&r(i)}).observe(document,{childList:!0,subtree:!0});function t(o){const n={};return o.integrity&&(n.integrity=o.integrity),o.referrerPolicy&&(n.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?n.credentials="include":o.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function r(o){if(o.ep)return;o.ep=!0;const n=t(o);fetch(o.href,n)}})();const L="modulepreload",z=function(l){return"/"+l},y={},S=function(e,t,r){let o=Promise.resolve();if(t&&t.length>0){let d=function(a){return Promise.all(a.map(c=>Promise.resolve(c).then(m=>({status:"fulfilled",value:m}),m=>({status:"rejected",reason:m}))))};document.getElementsByTagName("link");const i=document.querySelector("meta[property=csp-nonce]"),s=i?.nonce||i?.getAttribute("nonce");o=d(t.map(a=>{if(a=z(a),a in y)return;y[a]=!0;const c=a.endsWith(".css"),m=c?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${a}"]${m}`))return;const p=document.createElement("link");if(p.rel=c?"stylesheet":L,c||(p.as="script"),p.crossOrigin="",p.href=a,s&&p.setAttribute("nonce",s),document.head.appendChild(p),c)return new Promise((f,u)=>{p.addEventListener("load",f),p.addEventListener("error",()=>u(new Error(`Unable to preload CSS for ${a}`)))})}))}function n(i){const s=new Event("vite:preloadError",{cancelable:!0});if(s.payload=i,window.dispatchEvent(s),!s.defaultPrevented)throw i}return o.then(i=>{for(const s of i||[])s.status==="rejected"&&n(s.reason);return e().catch(n)})},k=["🚀","⚡","🎯","💡","🔧","📱","💻","🌐","🎮","📚","🎨","🎵","📷","📹","🎬","📺","📻","🎙️","🎤","🎧","🏠","🏢","🏪","🏨","🏥","🏫","🏛️","⛪","🕌","🕍","🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚐","🍕","🍔","🍟","🌭","🍿","🧂","🥨","🥯","🥖","🧀","⚽","🏀","🏈","⚾","🎾","🏐","🏉","🎱","🏓","🏸","🎪","🎭","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🎷","🌍","🌎","🌏","🌐","🗺️","🗾","🧭","🏔️","⛰️","🌋","💎","🔮","🎁","🎈","🎉","🎊","🎋","🎍","🎎","🎏","🔮","🧿","⚗️","🔭","📡","💻","🖥️","🖨️","⌨️","🖱️","📱","📲","💾","💿","📀","🎥","📺","📻","📷","📹"],M=l=>{const e={produttività:["⚡","🚀","💡","🔧","📊","📈","✅","🎯"],intrattenimento:["🎮","🎬","🎵","🎨","🎪","🎭","🎤","🎧"],sviluppo:["💻","🔧","⚙️","🔨","📱","🌐","🚀","⚡"],social:["👥","💬","📱","🌐","📞","📧","💌","📢"],utility:["🔧","⚙️","🛠️","📋","📝","📌","📍","🔍"],altro:["❓","💭","💡","🎯","⭐","💫","✨","🌟"]},t=l?.toLowerCase()||"altro",r=e[t]||e.altro;return r[Math.floor(Math.random()*r.length)]},U={GITHUB:{BASE:"https://api.github.com"},GOOGLE:{DRIVE:"https://www.googleapis.com/drive/v3",AUTH:"https://accounts.google.com/o/oauth2/v2/auth",TOKEN:"https://oauth2.googleapis.com/token"}},x={GITHUB_URL:/github\.com\/([^\/]+)\/([^\/]+)/,GITHUB_PAGES:/([^\.]+)\.github\.io\/([^\/]+)/};class g{constructor(){if(g.instance)return g.instance;g.instance=this,this.storageService=new v}async generatePWAForApp(e,t){try{console.log(`🚀 Generazione PWA automatica per app ${e}: ${t.name}`);const r=this.generateManifest(e,t),o=this.generateServiceWorker(e,t),n=this.generateHTMLWrapper(e,t);await this.savePWAFiles(e,{manifest:r,serviceWorker:o,htmlWrapper:n}),console.log(`✅ PWA generata per app ${e}`)}catch(r){console.error("Errore generazione PWA:",r)}}generateManifest(e,t){return{name:t.name,short_name:t.name.substring(0,12),description:t.description||`App ${t.name}`,start_url:`/app/${e}`,display:"standalone",background_color:"#ffffff",theme_color:"#1976d2",orientation:"any",scope:`/app/${e}/`,lang:"it",dir:"ltr",categories:[t.category||"productivity"],icons:this.generateIcons(t.icon),screenshots:[],shortcuts:[{name:t.name,short_name:t.name.substring(0,12),description:t.description||`Avvia ${t.name}`,url:`/app/${e}`,icons:this.generateIcons(t.icon,"96x96")}]}}generateIcons(e,t="192x192"){return e?e.startsWith("data:image/")||e.startsWith("http")?[{src:e,sizes:t,type:"image/png"}]:[{src:"/assets/icons/icon-192x192.png",sizes:t,type:"image/png"}]:[{src:"/assets/icons/icon-192x192.png",sizes:t,type:"image/png"}]}generateServiceWorker(e,t){return`
// Service Worker per ${t.name}
const CACHE_NAME = 'aideas-app-${e}-v1';
const STATIC_CACHE = 'aideas-static-${e}-v1';

// File da cacheare
const STATIC_FILES = [
  '/app/${e}/',
  '/app/${e}/index.html',
  '/app/${e}/manifest.json'
];

// Installa il service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installato per ${t.name}');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_FILES))
  );
});

// Attiva il service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker attivato per ${t.name}');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Intercetta le richieste
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Gestisci richieste per file locali dell'app
  if (url.pathname.startsWith('/app/${e}/')) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(request);
        })
    );
  }
});

// Gestisci messaggi dal main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
    `.trim()}generateHTMLWrapper(e,t){const r=t.type==="html"&&t.content,o=t.type==="url"&&t.url;let n="";return r?n=t.content:o&&(n=`
        <iframe 
          src="${t.url}" 
          style="width:100%;height:100%;border:none;" 
          title="${t.name}"
          allow="fullscreen; camera; microphone; geolocation"
        ></iframe>
      `),`
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.name}</title>
  <meta name="description" content="${t.description||""}">
  <meta name="theme-color" content="#1976d2">
  <link rel="manifest" href="/app/${e}/manifest.json">
  <link rel="icon" href="${t.icon||"/assets/icons/favicon.png"}">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #ffffff;
      overflow: hidden;
    }
    
    #app-container {
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    #app-header {
      background: #1976d2;
      color: white;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 14px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    #app-title {
      font-weight: 500;
    }
    
    #app-content {
      flex: 1;
      overflow: hidden;
    }
    
    .back-button {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
    
    .back-button:hover {
      background: rgba(255,255,255,0.1);
    }
    
    @media (display-mode: standalone) {
      #app-header {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div id="app-container">
    <div id="app-header">
      <button class="back-button" onclick="window.close()">← Chiudi</button>
      <div id="app-title">${t.name}</div>
      <div></div>
    </div>
    <div id="app-content">
      ${n}
    </div>
  </div>
  
  <script>
    // Registra il service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/app/${e}/sw.js')
        .then((registration) => {
          console.log('Service Worker registrato:', registration);
        })
        .catch((error) => {
          console.error('Errore registrazione Service Worker:', error);
        });
    }
    
    // Gestisci installazione PWA
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
    });
    
    // Gestisci messaggi dal service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'RELOAD') {
        window.location.reload();
      }
    });
  <\/script>
</body>
</html>
    `.trim()}async savePWAFiles(e,t){try{await this.storageService.db.appFiles.add({appId:e,filename:"manifest.json",content:JSON.stringify(t.manifest,null,2),mimeType:"application/json",size:JSON.stringify(t.manifest).length}),await this.storageService.db.appFiles.add({appId:e,filename:"sw.js",content:t.serviceWorker,mimeType:"application/javascript",size:t.serviceWorker.length}),await this.storageService.db.appFiles.add({appId:e,filename:"index.html",content:t.htmlWrapper,mimeType:"text/html",size:t.htmlWrapper.length}),console.log(`✅ File PWA salvati per app ${e}`)}catch(r){console.error("Errore salvataggio file PWA:",r)}}async getPWAFiles(e){try{const t=await this.storageService.db.appFiles.where("appId").equals(e).toArray(),r={};return t.forEach(o=>{["manifest.json","sw.js","index.html"].includes(o.filename)&&(r[o.filename]={content:o.content,mimeType:o.mimeType})}),r}catch(t){return console.error("Errore recupero file PWA:",t),null}}async hasPWAFiles(e){try{return await this.storageService.db.appFiles.where("appId").equals(e).and(r=>["manifest.json","sw.js","index.html"].includes(r.filename)).count()>=3}catch(t){return console.error("Errore verifica file PWA:",t),!1}}}class h{constructor(){if(h.instance)return h.instance;this.db=new E("AIdeas_DB"),this.initDatabase(),h.instance=this}initDatabase(){this.db.version(1).stores({apps:"++id, name, description, category, version, url, type, githubUrl, installDate, lastUsed, favorite, *tags",appFiles:"++id, appId, filename, content, size, mimeType",settings:"key, value, lastModified",syncEvents:"++id, timestamp, action, data, synced, deviceId",catalog:"++id, name, description, author, githubUrl, rating, downloads, featured, *categories"}),this.db.apps.hook("creating",(e,t,r)=>{t.installDate=t.installDate||new Date,t.lastUsed=t.lastUsed||new Date,t.favorite=t.favorite||!1,t.tags=t.tags||[]}),this.db.syncEvents.hook("creating",(e,t,r)=>{t.timestamp=t.timestamp||new Date,t.synced=t.synced||!1,t.deviceId=t.deviceId||this.getDeviceId()})}async installApp(e){try{let t=e.icon;t||(t=M(e.category),console.log(`🎨 Assegnata emoji automatica per ${e.name}: ${t}`));const r={name:e.name,description:e.description||"",category:e.category||"uncategorized",version:e.version||"1.0.0",url:e.url||null,type:e.type,githubUrl:e.githubUrl||null,icon:t,manifest:e.manifest||{},permissions:e.permissions||[],tags:e.tags||[],metadata:e.metadata||{},content:e.content||null,openMode:e.openMode||window?.appSettings?.defaultOpenMode||"modal"},o=await this.db.apps.add(r);return e.files&&e.files.length>0&&await this.saveAppFiles(o,e.files),(e.type!=="url"||!e.url)&&await new g().generatePWAForApp(o,r),await this.addSyncEvent("app_installed",{appId:o,app:r}),o}catch(t){throw console.error("Errore installazione app:",t),new Error(`Impossibile installare l'app: ${t.message}`)}}async getAllApps(e={}){try{let t=this.db.apps.orderBy("lastUsed").reverse();return e.category&&(t=t.filter(r=>r.category===e.category)),e.search&&(t=t.filter(r=>r.name.toLowerCase().includes(e.search.toLowerCase())||r.description.toLowerCase().includes(e.search.toLowerCase())||r.tags.some(o=>o.toLowerCase().includes(e.search.toLowerCase())))),e.favorite&&(t=t.filter(r=>r.favorite===!0)),await t.toArray()}catch(t){return console.error("Errore recupero app:",t),[]}}async getApp(e){try{return await this.db.apps.get(e)}catch(t){return console.error("Errore recupero app:",t),null}}async updateApp(e,t){try{return await this.db.apps.update(e,t),await this.addSyncEvent("app_updated",{appId:e,updates:t}),!0}catch(r){return console.error("Errore aggiornamento app:",r),!1}}async setAppMetadata(e,t){try{const r=await this.getApp(e);if(!r)throw new Error("App non trovata");const o={...r.metadata,...t};return await this.db.apps.update(e,{metadata:o}),console.log(`✅ Metadati aggiornati per app ${e}:`,t),!0}catch(r){return console.error("Errore aggiornamento metadati app:",r),!1}}async getAppMetadata(e,t=null){try{const r=await this.getApp(e);return!r||!r.metadata?null:t?r.metadata[t]||null:r.metadata}catch(r){return console.error("Errore recupero metadati app:",r),null}}async migrateAppsForContent(){try{console.log("🔄 Inizio migrazione app HTML...");const e=await this.db.apps.toArray();console.log(`📊 Trovate ${e.length} app totali`);let t=0;for(const r of e)if(console.log(`🔍 Controllo app: ${r.name} (tipo: ${r.type})`),r.type==="html"&&!r.content){console.log(`📝 App HTML senza contenuto trovata: ${r.name}`);const o=await this.getAppFiles(r.id);console.log(`📁 Trovati ${o.length} file per app ${r.name}`);const n=o.find(i=>i.filename.endsWith(".html"));n?(console.log(`✅ File HTML trovato: ${n.filename}`),await this.db.apps.update(r.id,{content:n.content}),t++,console.log(`✅ App ${r.name} migrata con successo`)):console.log(`⚠️ Nessun file HTML trovato per app ${r.name}`)}return t>0?console.log(`✅ Migrate ${t} app HTML per aggiungere campo content`):console.log("ℹ️ Nessuna app HTML da migrare"),t}catch(e){return console.error("❌ Errore migrazione app:",e),console.error("Stack trace:",e.stack),0}}async deleteApp(e){try{return await this.db.transaction("rw",[this.db.apps,this.db.appFiles],async()=>{await this.db.apps.delete(e),await this.db.appFiles.where("appId").equals(e).delete()}),await this.addSyncEvent("app_deleted",{appId:e}),!0}catch(t){return console.error("Errore eliminazione app:",t),!1}}async updateLastUsed(e){try{await this.db.apps.update(e,{lastUsed:new Date})}catch(t){console.error("Errore aggiornamento ultimo utilizzo:",t)}}async toggleFavorite(e){try{const t=await this.db.apps.get(e);return t?(await this.db.apps.update(e,{favorite:!t.favorite}),!t.favorite):!1}catch(t){return console.error("Errore toggle preferito:",t),!1}}async saveAppFiles(e,t){try{const r=t.map(o=>this.db.appFiles.add({appId:e,filename:o.filename,content:o.content,size:o.size||o.content.length,mimeType:o.mimeType||this.getMimeType(o.filename)}));return await Promise.all(r),!0}catch(r){return console.error("Errore salvataggio file app:",r),!1}}async getAppFiles(e){try{return await this.db.appFiles.where("appId").equals(e).toArray()}catch(t){return console.error("Errore recupero file app:",t),[]}}async getSetting(e,t=null){try{const r=await this.db.settings.get(e);return r?r.value:t}catch(r){return console.error("Errore recupero impostazione:",r),t}}async setSetting(e,t){try{return await this.db.settings.put({key:e,value:t,lastModified:new Date}),!0}catch(r){return console.error("Errore salvataggio impostazione:",r),!1}}async getAllSettings(){try{const e=await this.db.settings.toArray(),t={};return e.forEach(r=>{t[r.key]=r.value}),t}catch(e){return console.error("Errore recupero impostazioni:",e),{}}}async setAllSettings(e){try{const t=[];for(const[r,o]of Object.entries(e))t.push(this.db.settings.put({key:r,value:o,lastModified:new Date}));return await Promise.all(t),!0}catch(t){return console.error("Errore salvataggio impostazioni:",t),!1}}async addSyncEvent(e,t){try{await this.db.syncEvents.add({action:e,data:t,timestamp:new Date,synced:!1,deviceId:await this.getDeviceId()})}catch(r){console.error("Errore aggiunta evento sync:",r)}}async getUnsyncedEvents(){try{return await this.db.syncEvents.where("synced").equals(!1).toArray()}catch(e){return console.error("Errore recupero eventi non sincronizzati:",e),[]}}async markEventsSynced(e){try{await this.db.syncEvents.where("id").anyOf(e).modify({synced:!0})}catch(t){console.error("Errore aggiornamento eventi sync:",t)}}async updateCatalog(e){try{return await this.db.catalog.clear(),await this.db.catalog.bulkAdd(e),!0}catch(t){return console.error("Errore aggiornamento catalogo:",t),!1}}async searchCatalog(e,t={}){try{let r=this.db.catalog.orderBy("downloads").reverse();return e&&(r=r.filter(o=>o.name.toLowerCase().includes(e.toLowerCase())||o.description.toLowerCase().includes(e.toLowerCase())||o.categories.some(n=>n.toLowerCase().includes(e.toLowerCase())))),t.category&&(r=r.filter(o=>o.categories.includes(t.category))),t.featured&&(r=r.filter(o=>o.featured===!0)),await r.limit(t.limit||50).toArray()}catch(r){return console.error("Errore ricerca catalogo:",r),[]}}async getDeviceId(){let e=await this.getSetting("deviceId");return e||(e="device_"+Math.random().toString(36).substr(2,9)+"_"+Date.now(),await this.setSetting("deviceId",e)),e}getMimeType(e){const t=e.split(".").pop().toLowerCase();return{html:"text/html",css:"text/css",js:"application/javascript",json:"application/json",png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",gif:"image/gif",svg:"image/svg+xml",txt:"text/plain"}[t]||"application/octet-stream"}async exportAllData(){try{const[e,t,r]=await Promise.all([this.db.apps.toArray(),this.db.settings.toArray(),this.db.syncEvents.toArray()]);return{version:"1.0.0",timestamp:new Date().toISOString(),deviceId:await this.getDeviceId(),data:{apps:e,settings:t,syncEvents:r}}}catch(e){throw console.error("Errore export dati:",e),e}}async importData(e){try{if(!e.data)throw new Error("Formato dati non valido");const{apps:t,settings:r,syncEvents:o}=e.data;return await this.db.transaction("rw",[this.db.apps,this.db.settings,this.db.syncEvents],async()=>{t&&await this.db.apps.bulkPut(t),r&&await this.db.settings.bulkPut(r),o&&await this.db.syncEvents.bulkPut(o)}),!0}catch(t){throw console.error("Errore import dati:",t),t}}async ensureDbOpen(){if(!this.db.isOpen())try{await this.db.open(),console.log("📂 Database riaperto con successo")}catch(e){console.error("❌ Errore riapertura database:",e)}}async getStats(){try{if(await this.ensureDbOpen(),!this.db||!this.db.isOpen())return console.warn("Database non inizializzato"),null;const t=(await this.db.apps.toArray().catch(()=>[])).filter(a=>a&&typeof a=="object"),r=t.map(a=>a.category).filter(a=>typeof a=="string"&&a.length>0),o=t.filter(a=>a.favorite===!0).length,n=t.length,i=await this.db.appFiles.count().catch(()=>0),s=await this.db.settings.count().catch(()=>0),d=t.length>0?t.reduce((a,c)=>c.installDate&&(!a||new Date(c.installDate)>new Date(a))?c.installDate:a,null):null;return{totalApps:n,totalFiles:i,settingsCount:s,favoriteApps:o,categories:Array.from(new Set(r)).length,lastInstall:d,dbSize:await this.estimateDbSize()}}catch(e){return console.error("Errore recupero statistiche:",e),null}}async estimateDbSize(){try{return"storage"in navigator&&"estimate"in navigator.storage&&(await navigator.storage.estimate()).usage||0}catch{return 0}}async close(){this.db&&this.db.close()}}const v=new h,P=Object.freeze(Object.defineProperty({__proto__:null,default:v},Symbol.toStringTag,{value:"Module"}));let C=0;function T(l,e="info",t=4e3,r={}){const o=document.getElementById("toast-container");if(!o){console.warn("Toast container non trovato");return}const n=`toast-${++C}`,i=document.createElement("div");i.id=n,i.className=`toast toast-${e}`,i.setAttribute("role","alert"),i.setAttribute("aria-live","polite");const s={success:`<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
    </svg>`,error:`<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
    </svg>`,warning:`<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M13,13H11V7H13M12,17.3A1.3,1.3 0 0,1 10.7,16A1.3,1.3 0 0,1 12,14.7A1.3,1.3 0 0,1 13.3,16A1.3,1.3 0 0,1 12,17.3M15.73,3H8.27L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3Z"/>
    </svg>`,info:`<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
    </svg>`};i.innerHTML=`
    <div class="toast-icon">
      ${s[e]||s.info}
    </div>
    <div class="toast-content">
      <div class="toast-message">${$(l)}</div>
      ${r.action?`<button class="toast-action">${r.action}</button>`:""}
    </div>
    <button class="toast-close" aria-label="Chiudi notifica">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
      </svg>
    </button>
  `;const d=i.querySelector(".toast-close"),a=i.querySelector(".toast-action"),c=()=>{i.classList.add("toast-removing"),setTimeout(()=>{i.parentNode&&i.parentNode.removeChild(i)},300)};return d.addEventListener("click",c),a&&r.onAction&&a.addEventListener("click",()=>{r.onAction(),c()}),o.appendChild(i),requestAnimationFrame(()=>{i.classList.add("toast-show")}),t>0&&setTimeout(c,t),n}function $(l){const e=document.createElement("div");return e.textContent=l,e.innerHTML}function W(l="id"){return`${l}-${Math.random().toString(36).substr(2,9)}-${Date.now()}`}function F(l={}){return new Promise(e=>{const{title:t="Conferma",message:r="Sei sicuro di voler continuare?",icon:o="question",confirmText:n="Conferma",cancelText:i="Annulla",type:s="default"}=l,d=document.createElement("div");d.className="confirm-popup";const a={question:`<svg viewBox="0 0 24 24" fill="currentColor" class="confirm-popup-icon">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
      </svg>`,warning:`<svg viewBox="0 0 24 24" fill="currentColor" class="confirm-popup-icon">
        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
      </svg>`,danger:`<svg viewBox="0 0 24 24" fill="currentColor" class="confirm-popup-icon">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>`,info:`<svg viewBox="0 0 24 24" fill="currentColor" class="confirm-popup-icon">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
      </svg>`},c=a[o]||a.question,m=s==="danger"?"confirm-popup-btn-danger":"confirm-popup-btn-primary";d.innerHTML=`
      <div class="confirm-popup-content">
        <div class="confirm-popup-header">
          <h3 class="confirm-popup-title">
            ${c}
            ${t}
          </h3>
        </div>
        <div class="confirm-popup-body">
          ${r}
        </div>
        <div class="confirm-popup-footer">
          <button class="confirm-popup-btn confirm-popup-btn-secondary" data-action="cancel">
            ${i}
          </button>
          <button class="confirm-popup-btn ${m}" data-action="confirm">
            ${n}
          </button>
        </div>
      </div>
    `;const p=u=>{document.body.removeChild(d),e(u==="confirm")};d.addEventListener("click",u=>{u.target===d&&p("cancel")}),d.querySelectorAll("[data-action]").forEach(u=>{u.addEventListener("click",A=>{A.preventDefault(),p(u.dataset.action)})});const f=u=>{u.key==="Escape"&&(document.removeEventListener("keydown",f),p("cancel"))};document.addEventListener("keydown",f),document.body.appendChild(d),setTimeout(()=>{d.querySelector(".confirm-popup-btn-secondary").focus()},100)})}class b{constructor(){this.fallbackAttempted=!1,this.loadingTimeout=null}async init(){try{console.log("🎨 Inizializzazione UI Loader..."),await v.ensureDbOpen(),await this.loadMaterialUI()}catch(e){console.error("❌ Errore inizializzazione UI Loader:",e),T("Impossibile caricare l'interfaccia Material UI","error")}}async loadUI(e){await this.loadMaterialUI()}async loadMaterialUI(){if(console.log("🎨 Caricamento Material UI..."),window.aideasMaterialUIInitialized){console.log("⚠️ Material UI già inizializzato, skip");return}this.loadingTimeout=setTimeout(()=>{throw new Error("Timeout caricamento Material UI")},1e4);try{console.log("📦 Importazione modulo Material UI...");const{initializeAIdeasWithMaterialUI:e}=await S(async()=>{const{initializeAIdeasWithMaterialUI:t}=await import("./main-material-Cv2LqEX9.js");return{initializeAIdeasWithMaterialUI:t}},__vite__mapDeps([0,1]));console.log("🔧 Funzione di inizializzazione ottenuta:",typeof e),console.log("🚀 Avvio inizializzazione Material UI..."),e(),window.aideasMaterialUIInitialized=!0,clearTimeout(this.loadingTimeout),console.log("✅ Material UI caricata con successo"),this.hideLoadingScreen()}catch(e){throw clearTimeout(this.loadingTimeout),console.error("❌ Errore durante caricamento Material UI:",e),e}}hideLoadingScreen(){try{const e=document.getElementById("loading-screen");e&&(e.style.display="none",console.log("🎯 Loading screen nascosto"))}catch(e){console.error("❌ Errore nascondere loading screen:",e)}}}window.UILoader=b;const w=new b;document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>w.init()):w.init();export{U as A,k as D,g as P,x as R,v as S,S as _,T as a,M as b,P as c,W as g,F as s};
//# sourceMappingURL=main-D9eo9mF6.js.map
