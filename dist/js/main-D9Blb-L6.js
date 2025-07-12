const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["js/main-material-BaZcElXV.js","js/vendor-Cc5w31rP.js"])))=>i.map(i=>d[i]);
var z=Object.defineProperty;var I=(o,e,t)=>e in o?z(o,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):o[e]=t;var y=(o,e,t)=>I(o,typeof e!="symbol"?e+"":e,t);import{D as T}from"./vendor-Cc5w31rP.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))r(a);new MutationObserver(a=>{for(const s of a)if(s.type==="childList")for(const n of s.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&r(n)}).observe(document,{childList:!0,subtree:!0});function t(a){const s={};return a.integrity&&(s.integrity=a.integrity),a.referrerPolicy&&(s.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?s.credentials="include":a.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function r(a){if(a.ep)return;a.ep=!0;const s=t(a);fetch(a.href,s)}})();const M="modulepreload",C=function(o){return"/"+o},v={},b=function(e,t,r){let a=Promise.resolve();if(t&&t.length>0){let p=function(c){return Promise.all(c.map(d=>Promise.resolve(d).then(m=>({status:"fulfilled",value:m}),m=>({status:"rejected",reason:m}))))};document.getElementsByTagName("link");const n=document.querySelector("meta[property=csp-nonce]"),l=n?.nonce||n?.getAttribute("nonce");a=p(t.map(c=>{if(c=C(c),c in v)return;v[c]=!0;const d=c.endsWith(".css"),m=d?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${c}"]${m}`))return;const u=document.createElement("link");if(u.rel=d?"stylesheet":M,d||(u.as="script"),u.crossOrigin="",u.href=c,l&&u.setAttribute("nonce",l),document.head.appendChild(u),d)return new Promise((f,g)=>{u.addEventListener("load",f),u.addEventListener("error",()=>g(new Error(`Unable to preload CSS for ${c}`)))})}))}function s(n){const l=new Event("vite:preloadError",{cancelable:!0});if(l.payload=n,window.dispatchEvent(l),!l.defaultPrevented)throw n}return a.then(n=>{for(const l of n||[])l.status==="rejected"&&s(l.reason);return e().catch(s)})},H=["🚀","⚡","🎯","💡","🔧","📱","💻","🌐","🎮","📚","🎨","🎵","📷","📹","🎬","📺","📻","🎙️","🎤","🎧","🏠","🏢","🏪","🏨","🏥","🏫","🏛️","⛪","🕌","🕍","🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚐","🍕","🍔","🍟","🌭","🍿","🧂","🥨","🥯","🥖","🧀","⚽","🏀","🏈","⚾","🎾","🏐","🏉","🎱","🏓","🏸","🎪","🎭","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🎷","🌍","🌎","🌏","🌐","🗺️","🗾","🧭","🏔️","⛰️","🌋","💎","🔮","🎁","🎈","🎉","🎊","🎋","🎍","🎎","🎏","🔮","🧿","⚗️","🔭","📡","💻","🖥️","🖨️","⌨️","🖱️","📱","📲","💾","💿","📀","🎥","📺","📻","📷","📹"],U=o=>{const e={produttività:["⚡","🚀","💡","🔧","📊","📈","✅","🎯"],intrattenimento:["🎮","🎬","🎵","🎨","🎪","🎭","🎤","🎧"],sviluppo:["💻","🔧","⚙️","🔨","📱","🌐","🚀","⚡"],social:["👥","💬","📱","🌐","📞","📧","💌","📢"],utility:["🔧","⚙️","🛠️","📋","📝","📌","📍","🔍"],altro:["❓","💭","💡","🎯","⭐","💫","✨","🌟"]},t=o?.toLowerCase()||"altro",r=e[t]||e.altro;return r[Math.floor(Math.random()*r.length)]},B={GITHUB:{BASE:"https://api.github.com"},GOOGLE:{DRIVE:"https://www.googleapis.com/drive/v3",AUTH:"https://accounts.google.com/o/oauth2/v2/auth",TOKEN:"https://oauth2.googleapis.com/token"}},F={GITHUB_URL:/github\.com\/([^\/]+)\/([^\/]+)/,GITHUB_PAGES:/([^\.]+)\.github\.io\/([^\/]+)/};let $=0;function E(o,e="info",t=4e3,r={}){const a=document.getElementById("toast-container");if(!a){console.warn("Toast container non trovato");return}const s=`toast-${++$}`,n=document.createElement("div");n.id=s,n.className=`toast toast-${e}`,n.setAttribute("role","alert"),n.setAttribute("aria-live","polite");const l={success:`<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
    </svg>`,error:`<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
    </svg>`,warning:`<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M13,13H11V7H13M12,17.3A1.3,1.3 0 0,1 10.7,16A1.3,1.3 0 0,1 12,14.7A1.3,1.3 0 0,1 13.3,16A1.3,1.3 0 0,1 12,17.3M15.73,3H8.27L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3Z"/>
    </svg>`,info:`<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
    </svg>`};n.innerHTML=`
    <div class="toast-icon">
      ${l[e]||l.info}
    </div>
    <div class="toast-content">
      <div class="toast-message">${_(o)}</div>
      ${r.action?`<button class="toast-action">${r.action}</button>`:""}
    </div>
    <button class="toast-close" aria-label="Chiudi notifica">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
      </svg>
    </button>
  `;const p=n.querySelector(".toast-close"),c=n.querySelector(".toast-action"),d=()=>{n.classList.add("toast-removing"),setTimeout(()=>{n.parentNode&&n.parentNode.removeChild(n)},300)};return p.addEventListener("click",d),c&&r.onAction&&c.addEventListener("click",()=>{r.onAction(),d()}),a.appendChild(n),requestAnimationFrame(()=>{n.classList.add("toast-show")}),t>0&&setTimeout(d,t),s}function _(o){const e=document.createElement("div");return e.textContent=o,e.innerHTML}function N(o="id"){return`${o}-${Math.random().toString(36).substr(2,9)}-${Date.now()}`}function k(o={}){return new Promise(e=>{const{title:t="Conferma",message:r="Sei sicuro di voler continuare?",icon:a="question",confirmText:s="Conferma",cancelText:n="Annulla",type:l="default"}=o,p=document.createElement("div");p.className="confirm-popup";const c={question:`<svg viewBox="0 0 24 24" fill="currentColor" class="confirm-popup-icon">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
      </svg>`,warning:`<svg viewBox="0 0 24 24" fill="currentColor" class="confirm-popup-icon">
        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
      </svg>`,danger:`<svg viewBox="0 0 24 24" fill="currentColor" class="confirm-popup-icon">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>`,info:`<svg viewBox="0 0 24 24" fill="currentColor" class="confirm-popup-icon">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
      </svg>`},d=c[a]||c.question,m=l==="danger"?"confirm-popup-btn-danger":"confirm-popup-btn-primary";p.innerHTML=`
      <div class="confirm-popup-content">
        <div class="confirm-popup-header">
          <h3 class="confirm-popup-title">
            ${d}
            ${t}
          </h3>
        </div>
        <div class="confirm-popup-body">
          ${r}
        </div>
        <div class="confirm-popup-footer">
          <button class="confirm-popup-btn confirm-popup-btn-secondary" data-action="cancel">
            ${n}
          </button>
          <button class="confirm-popup-btn ${m}" data-action="confirm">
            ${s}
          </button>
        </div>
      </div>
    `;const u=g=>{document.body.removeChild(p),e(g==="confirm")};p.addEventListener("click",g=>{g.target===p&&u("cancel")}),p.querySelectorAll("[data-action]").forEach(g=>{g.addEventListener("click",x=>{x.preventDefault(),u(g.dataset.action)})});const f=g=>{g.key==="Escape"&&(document.removeEventListener("keydown",f),u("cancel"))};document.addEventListener("keydown",f),document.body.appendChild(p),setTimeout(()=>{p.querySelector(".confirm-popup-btn-secondary").focus()},100)})}const i={enabled:localStorage.getItem("aideas_debug")==="true",verbose:localStorage.getItem("aideas_verbose_logging")==="true",log(...o){this.enabled&&console.log("🔍 [AIdeas]",...o)},info(...o){this.enabled&&this.verbose&&console.info("ℹ️ [AIdeas]",...o)},success(...o){this.enabled&&this.verbose&&console.log("✅ [AIdeas]",...o)},warn(...o){this.enabled&&console.warn("⚠️ [AIdeas]",...o)},error(...o){console.error("❌ [AIdeas]",...o)},service(o,...e){this.enabled&&console.log(`🔧 [${o}]`,...e)},network(o,e,...t){this.enabled&&this.verbose&&console.log(`🌐 [Network] ${o}`,e,...t)},perf(o,e){this.enabled&&this.verbose&&console.log(`⚡ [Performance] ${o}:`,e)},table(o){this.enabled&&console.table(o)},group(o){this.enabled&&console.group(`📁 ${o}`)},groupEnd(){this.enabled&&console.groupEnd()}};i.enabled&&(window.AIdeas_DEV={async inspectStorage(){const o=await b(()=>Promise.resolve().then(()=>P),void 0).then(a=>a.default),e=await o.getStats(),t=await o.getAllApps(),r=await o.getAllSettings();console.group("🔍 AIdeas Storage Inspection"),console.log("Stats:",e),console.table(t),console.log("Settings:",r),console.groupEnd()},getPerformance(){return{timing:performance.timing,navigation:performance.navigation,memory:performance.memory}},getErrors(){return window.AIdeas_ERRORS||[]},clearAllData(){k({title:"Pulisci Dati",message:"Eliminare tutti i dati di AIdeas? Questa operazione non può essere annullata!",icon:"danger",confirmText:"Elimina",cancelText:"Annulla",type:"danger"}).then(o=>{o&&(localStorage.clear(),sessionStorage.clear(),indexedDB.deleteDatabase("aideas-db"),E("Tutti i dati eliminati","success"),setTimeout(()=>window.location.reload(),1e3))})},enableVerbose(){localStorage.setItem("aideas_verbose_logging","true"),i.verbose=!0,console.log("Verbose logging enabled")},disableVerbose(){localStorage.removeItem("aideas_verbose_logging"),i.verbose=!1,console.log("Verbose logging disabled")}});class A{static init(){window.AIdeas_ERRORS=this.errors,window.addEventListener("error",e=>{this.trackError({type:"runtime",message:e.message,source:e.filename,lineno:e.lineno,colno:e.colno,stack:e.error?.stack,timestamp:new Date().toISOString()})}),window.addEventListener("unhandledrejection",e=>{this.trackError({type:"promise",message:e.reason?.message||"Unhandled Promise Rejection",stack:e.reason?.stack,timestamp:new Date().toISOString()})})}static trackError(e){this.errors.push(e),i.enabled&&console.error("[AIdeas Error Tracker]",e),this.errors.length>100&&this.errors.shift()}static getErrors(){return this.errors}static clearErrors(){return this.errors=[],!0}}y(A,"errors",[]);A.init();class h{constructor(){if(h.instance)return h.instance;this.db=new T("AIdeas_DB"),this.initDatabase(),h.instance=this}initDatabase(){this.db.version(1).stores({apps:"++id, name, description, category, version, url, type, githubUrl, installDate, lastUsed, favorite, *tags",appFiles:"++id, appId, filename, content, size, mimeType",settings:"key, value, lastModified",syncEvents:"++id, timestamp, action, data, synced, deviceId",catalog:"++id, name, description, author, githubUrl, rating, downloads, featured, *categories"}),this.db.apps.hook("creating",(e,t,r)=>{t.installDate=t.installDate||new Date,t.lastUsed=t.lastUsed||new Date,t.favorite=t.favorite||!1,t.tags=t.tags||[]}),this.db.syncEvents.hook("creating",(e,t,r)=>{t.timestamp=t.timestamp||new Date,t.synced=t.synced||!1,t.deviceId=t.deviceId||this.getDeviceId()})}async installApp(e){try{let t=e.icon;t||(t=U(e.category),i.success(`Assegnata emoji automatica per ${e.name}: ${t}`));const r={name:e.name,description:e.description||"",category:e.category||"uncategorized",version:e.version||"1.0.0",url:e.url||null,type:e.type,githubUrl:e.githubUrl||null,icon:t,manifest:e.manifest||{},permissions:e.permissions||[],tags:e.tags||[],metadata:e.metadata||{},content:e.content||null,openMode:e.openMode||window?.appSettings?.defaultOpenMode||"modal"},a=await this.db.apps.add(r);return e.files&&e.files.length>0&&await this.saveAppFiles(a,e.files),(e.type!=="url"||!e.url)&&window.dispatchEvent(new CustomEvent("app-installed",{detail:{appId:a,app:r}})),await this.addSyncEvent("app_installed",{appId:a,app:r}),a}catch(t){throw i.error("Errore installazione app:",t),new Error(`Impossibile installare l'app: ${t.message}`)}}async getAllApps(e={}){try{let t=this.db.apps.orderBy("lastUsed").reverse();return e.category&&(t=t.filter(r=>r.category===e.category)),e.search&&(t=t.filter(r=>r.name.toLowerCase().includes(e.search.toLowerCase())||r.description.toLowerCase().includes(e.search.toLowerCase())||r.tags.some(a=>a.toLowerCase().includes(e.search.toLowerCase())))),e.favorite&&(t=t.filter(r=>r.favorite===!0)),await t.toArray()}catch(t){return i.error("Errore recupero app:",t),[]}}async getApp(e){try{return await this.db.apps.get(e)}catch(t){return i.error("Errore recupero app:",t),null}}async getAppData(e){try{const t=await this.getApp(e);if(!t)return null;const r=await this.getAppFiles(e),a={};return r.forEach(s=>{a[s.filename]=s.content}),{...t,files:a}}catch(t){return i.error("Errore recupero dati app:",t),null}}async getAppWithFiles(e){try{const t=await this.getApp(e);if(!t)return null;const r=await this.getAppFiles(e);return{...t,files:r}}catch(t){return i.error("Errore recupero app con file:",t),null}}async updateApp(e,t){try{return await this.db.apps.update(e,t),await this.addSyncEvent("app_updated",{appId:e,updates:t}),!0}catch(r){return i.error("Errore aggiornamento app:",r),!1}}async setAppMetadata(e,t){try{const r=await this.getApp(e);if(!r)throw new Error("App non trovata");const a={...r.metadata,...t};return await this.db.apps.update(e,{metadata:a}),i.success(`Metadati aggiornati per app ${e}:`,t),!0}catch(r){return i.error("Errore aggiornamento metadati app:",r),!1}}async getAppMetadata(e,t=null){try{const r=await this.getApp(e);return!r||!r.metadata?null:t?r.metadata[t]||null:r.metadata}catch(r){return i.error("Errore recupero metadati app:",r),null}}async migrateAppsForContent(){try{i.service("StorageService","Inizio migrazione app HTML...");const e=await this.db.apps.toArray();i.info(`Trovate ${e.length} app totali`);let t=0;for(const r of e)if(i.info(`Controllo app: ${r.name} (tipo: ${r.type})`),r.type==="html"&&!r.content){i.info(`App HTML senza contenuto trovata: ${r.name}`);const a=await this.getAppFiles(r.id);i.info(`Trovati ${a.length} file per app ${r.name}`);const s=a.find(n=>n.filename.endsWith(".html"));s?(i.success(`File HTML trovato: ${s.filename}`),await this.db.apps.update(r.id,{content:s.content}),t++,i.success(`App ${r.name} migrata con successo`)):i.warn(`Nessun file HTML trovato per app ${r.name}`)}return t>0?i.success(`Migrate ${t} app HTML per aggiungere campo content`):i.info("Nessuna app HTML da migrare"),t}catch(e){return i.error("Errore migrazione app:",e),i.error("Stack trace:",e.stack),0}}async deleteApp(e){try{return await this.db.transaction("rw",[this.db.apps,this.db.appFiles],async()=>{await this.db.apps.delete(e),await this.db.appFiles.where("appId").equals(e).delete()}),await this.addSyncEvent("app_deleted",{appId:e}),!0}catch(t){return i.error("Errore eliminazione app:",t),!1}}async updateLastUsed(e){try{await this.db.apps.update(e,{lastUsed:new Date})}catch(t){i.error("Errore aggiornamento ultimo utilizzo:",t)}}async toggleFavorite(e){try{const t=await this.db.apps.get(e);return t?(await this.db.apps.update(e,{favorite:!t.favorite}),!t.favorite):!1}catch(t){return i.error("Errore toggle preferito:",t),!1}}async saveAppFiles(e,t){try{const r=t.map(a=>this.db.appFiles.add({appId:e,filename:a.filename,content:a.content,size:a.size||a.content.length,mimeType:a.mimeType||this.getMimeType(a.filename)}));return await Promise.all(r),!0}catch(r){return i.error("Errore salvataggio file app:",r),!1}}async getAppFiles(e){try{return await this.db.appFiles.where("appId").equals(e).toArray()}catch(t){return i.error("Errore recupero file app:",t),[]}}async getSetting(e,t=null){try{const r=await this.db.settings.get(e);return r?r.value:t}catch(r){return i.error("Errore recupero impostazione:",r),t}}async setSetting(e,t){try{return await this.db.settings.put({key:e,value:t,lastModified:new Date}),!0}catch(r){return i.error("Errore salvataggio impostazione:",r),!1}}async getAllSettings(){try{const e=await this.db.settings.toArray(),t={};return e.forEach(r=>{t[r.key]=r.value}),t}catch(e){return i.error("Errore recupero impostazioni:",e),{}}}async setAllSettings(e){try{const t=[];for(const[r,a]of Object.entries(e))t.push(this.db.settings.put({key:r,value:a,lastModified:new Date}));return await Promise.all(t),!0}catch(t){return i.error("Errore salvataggio impostazioni:",t),!1}}async addSyncEvent(e,t){try{await this.db.syncEvents.add({action:e,data:t,timestamp:new Date,synced:!1,deviceId:await this.getDeviceId()})}catch(r){i.error("Errore aggiunta evento sync:",r)}}async getUnsyncedEvents(){try{return await this.db.syncEvents.where("synced").equals(!1).toArray()}catch(e){return i.error("Errore recupero eventi non sincronizzati:",e),[]}}async markEventsSynced(e){try{await this.db.syncEvents.where("id").anyOf(e).modify({synced:!0})}catch(t){i.error("Errore aggiornamento eventi sync:",t)}}async updateCatalog(e){try{return await this.db.catalog.clear(),await this.db.catalog.bulkAdd(e),!0}catch(t){return i.error("Errore aggiornamento catalogo:",t),!1}}async searchCatalog(e,t={}){try{let r=this.db.catalog.orderBy("downloads").reverse();return e&&(r=r.filter(a=>a.name.toLowerCase().includes(e.toLowerCase())||a.description.toLowerCase().includes(e.toLowerCase())||a.categories.some(s=>s.toLowerCase().includes(e.toLowerCase())))),t.category&&(r=r.filter(a=>a.categories.includes(t.category))),t.featured&&(r=r.filter(a=>a.featured===!0)),await r.limit(t.limit||50).toArray()}catch(r){return i.error("Errore ricerca catalogo:",r),[]}}async getDeviceId(){let e=await this.getSetting("deviceId");return e||(e="device_"+Math.random().toString(36).substr(2,9)+"_"+Date.now(),await this.setSetting("deviceId",e)),e}getMimeType(e){const t=e.split(".").pop().toLowerCase();return{html:"text/html",css:"text/css",js:"application/javascript",json:"application/json",png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",gif:"image/gif",svg:"image/svg+xml",txt:"text/plain"}[t]||"application/octet-stream"}async exportAllData(){try{const[e,t,r]=await Promise.all([this.db.apps.toArray(),this.db.settings.toArray(),this.db.syncEvents.toArray()]);return{version:"1.0.0",timestamp:new Date().toISOString(),deviceId:await this.getDeviceId(),data:{apps:e,settings:t,syncEvents:r}}}catch(e){throw i.error("Errore export dati:",e),e}}async importData(e){try{if(!e.data)throw new Error("Formato dati non valido");const{apps:t,settings:r,syncEvents:a}=e.data;return await this.db.transaction("rw",[this.db.apps,this.db.settings,this.db.syncEvents],async()=>{t&&await this.db.apps.bulkPut(t),r&&await this.db.settings.bulkPut(r),a&&await this.db.syncEvents.bulkPut(a)}),!0}catch(t){throw i.error("Errore import dati:",t),t}}async ensureDbOpen(){if(!this.db.isOpen())try{await this.db.open(),i.log("📂 Database riaperto con successo")}catch(e){i.error("❌ Errore riapertura database:",e)}}async getStats(){try{if(await this.ensureDbOpen(),!this.db||!this.db.isOpen())return i.warn("Database non inizializzato"),null;const t=(await this.db.apps.toArray().catch(()=>[])).filter(c=>c&&typeof c=="object"),r=t.map(c=>c.category).filter(c=>typeof c=="string"&&c.length>0),a=t.filter(c=>c.favorite===!0).length,s=t.length,n=await this.db.appFiles.count().catch(()=>0),l=await this.db.settings.count().catch(()=>0),p=t.length>0?t.reduce((c,d)=>d.installDate&&(!c||new Date(d.installDate)>new Date(c))?d.installDate:c,null):null;return{totalApps:s,totalFiles:n,settingsCount:l,favoriteApps:a,categories:Array.from(new Set(r)).length,lastInstall:p,dbSize:await this.estimateDbSize()}}catch(e){return i.error("Errore recupero statistiche:",e),null}}async estimateDbSize(){try{return"storage"in navigator&&"estimate"in navigator.storage&&(await navigator.storage.estimate()).usage||0}catch{return 0}}async close(){this.db&&this.db.close()}}const L=new h,P=Object.freeze(Object.defineProperty({__proto__:null,default:L},Symbol.toStringTag,{value:"Module"}));class S{constructor(){this.loadingTimeout=null,this.initialized=!1}async init(){try{i.log("🎨 Inizializzazione UI Loader..."),this.showLoadingScreen(),await L.ensureDbOpen(),await this.loadMaterialUI(),i.success("✅ UI Loader inizializzato con successo")}catch(e){i.error("❌ Errore inizializzazione UI Loader:",e),E("Impossibile caricare l'interfaccia","error"),this.showErrorScreen(e)}}showLoadingScreen(){let e=document.getElementById("loading-screen");e||(e=document.createElement("div"),e.id="loading-screen",e.innerHTML=`
        <div class="loading-container">
          <div class="aideas-logo">
            <div class="logo-icon">🚀</div>
            <div class="logo-text">AIdeas</div>
          </div>
          <div class="loading-spinner">
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
          </div>
          <div class="loading-text">Caricamento interfaccia...</div>
          <div class="loading-subtitle">Inizializzazione Material UI</div>
        </div>
      `,document.body.appendChild(e)),this.addLoadingStyles(),e.style.display="flex"}addLoadingStyles(){if(document.getElementById("loading-styles"))return;const e=document.createElement("style");e.id="loading-styles",e.textContent=`
      #loading-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        opacity: 1;
        transition: opacity 0.5s ease-out;
      }

      .loading-container {
        text-align: center;
        color: white;
        animation: fadeInUp 0.8s ease-out;
      }

      .aideas-logo {
        margin-bottom: 40px;
        animation: pulse 2s infinite;
      }

      .logo-icon {
        font-size: 60px;
        margin-bottom: 10px;
        animation: bounce 2s infinite;
      }

      .logo-text {
        font-size: 32px;
        font-weight: bold;
        letter-spacing: 2px;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
      }

      .loading-spinner {
        position: relative;
        margin: 30px auto;
        width: 80px;
        height: 80px;
      }

      .spinner-ring {
        position: absolute;
        border: 3px solid transparent;
        border-top: 3px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      .spinner-ring:nth-child(1) {
        width: 80px;
        height: 80px;
        animation-delay: 0s;
      }

      .spinner-ring:nth-child(2) {
        width: 60px;
        height: 60px;
        top: 10px;
        left: 10px;
        animation-delay: -0.3s;
        border-top-color: rgba(255,255,255,0.7);
      }

      .spinner-ring:nth-child(3) {
        width: 40px;
        height: 40px;
        top: 20px;
        left: 20px;
        animation-delay: -0.6s;
        border-top-color: rgba(255,255,255,0.4);
      }

      .loading-text {
        font-size: 18px;
        font-weight: 600;
        margin: 20px 0 10px 0;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
      }

      .loading-subtitle {
        font-size: 14px;
        opacity: 0.8;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }

      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-10px); }
        60% { transform: translateY(-5px); }
      }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .loading-fade-out {
        opacity: 0;
        transform: translateY(-20px);
      }

      .error-screen {
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
      }

      .error-screen .loading-text {
        color: #ffffff;
      }

      .error-screen .loading-subtitle {
        color: rgba(255,255,255,0.9);
      }
    `,document.head.appendChild(e)}async loadMaterialUI(){if(i.log("🎨 Caricamento Material UI..."),this.initialized){i.log("⚠️ Material UI già inizializzato, skip");return}this.loadingTimeout=setTimeout(()=>{throw new Error("Timeout caricamento Material UI (10s)")},1e4);try{this.updateLoadingText("Importazione moduli...","Caricamento React e Material UI");const{initializeAIdeasWithMaterialUI:e}=await b(async()=>{const{initializeAIdeasWithMaterialUI:t}=await import("./main-material-BaZcElXV.js");return{initializeAIdeasWithMaterialUI:t}},__vite__mapDeps([0,1]));i.log("🔧 Funzione di inizializzazione ottenuta:",typeof e),this.updateLoadingText("Inizializzazione interfaccia...","Avvio componenti Material UI"),i.log("🚀 Avvio inizializzazione Material UI..."),await e(),this.initialized=!0,clearTimeout(this.loadingTimeout),i.success("✅ Material UI caricata con successo"),this.hideLoadingScreen()}catch(e){throw clearTimeout(this.loadingTimeout),i.error("❌ Errore durante caricamento Material UI:",e),e}}updateLoadingText(e,t){const r=document.querySelector(".loading-text"),a=document.querySelector(".loading-subtitle");r&&(r.textContent=e),a&&(a.textContent=t)}showErrorScreen(e){const t=document.getElementById("loading-screen");if(t){t.classList.add("error-screen"),this.updateLoadingText("Errore caricamento interfaccia",e.message||"Errore sconosciuto");const r=t.querySelector(".loading-spinner");r&&(r.innerHTML='<div style="font-size: 60px; color: white;">❌</div>')}}hideLoadingScreen(){try{const e=document.getElementById("loading-screen");e&&(e.classList.add("loading-fade-out"),setTimeout(()=>{e.style.display="none",i.log("🎯 Loading screen nascosto")},500))}catch(e){i.error("❌ Errore nascondere loading screen:",e)}}cleanup(){this.loadingTimeout&&clearTimeout(this.loadingTimeout);const e=document.getElementById("loading-styles");e&&e.remove()}}window.UILoader=S;const w=new S;document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>w.init()):w.init();export{B as A,i as D,A as E,F as R,L as S,b as _,H as a,U as b,N as g,E as s};
//# sourceMappingURL=main-D9Blb-L6.js.map
