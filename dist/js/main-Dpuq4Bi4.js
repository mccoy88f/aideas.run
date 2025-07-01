var Cn=Object.defineProperty;var wn=(e,t,n)=>t in e?Cn(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n;var pt=(e,t,n)=>wn(e,typeof t!="symbol"?t+"":t,n);import{D as Ln,g as Ht,r as Sn}from"./vendor-B9NWz7lO.js";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))i(a);new MutationObserver(a=>{for(const s of a)if(s.type==="childList")for(const r of s.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&i(r)}).observe(document,{childList:!0,subtree:!0});function n(a){const s={};return a.integrity&&(s.integrity=a.integrity),a.referrerPolicy&&(s.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?s.credentials="include":a.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(a){if(a.ep)return;a.ep=!0;const s=n(a);fetch(a.href,s)}})();class ae{constructor(){if(ae.instance)return ae.instance;this.db=new Ln("AIdeas_DB"),this.initDatabase(),ae.instance=this}initDatabase(){this.db.version(1).stores({apps:"++id, name, description, category, version, url, type, githubUrl, installDate, lastUsed, favorite, *tags",appFiles:"++id, appId, filename, content, size, mimeType",settings:"key, value, lastModified",syncEvents:"++id, timestamp, action, data, synced, deviceId",catalog:"++id, name, description, author, githubUrl, rating, downloads, featured, *categories"}),this.db.apps.hook("creating",(t,n,i)=>{n.installDate=n.installDate||new Date,n.lastUsed=n.lastUsed||new Date,n.favorite=n.favorite||!1,n.tags=n.tags||[]}),this.db.syncEvents.hook("creating",(t,n,i)=>{n.timestamp=n.timestamp||new Date,n.synced=n.synced||!1,n.deviceId=n.deviceId||this.getDeviceId()})}async installApp(t){try{const n={name:t.name,description:t.description||"",category:t.category||"uncategorized",version:t.version||"1.0.0",url:t.url||null,type:t.type,githubUrl:t.githubUrl||null,icon:t.icon||null,manifest:t.manifest||{},permissions:t.permissions||[],tags:t.tags||[],metadata:t.metadata||{},content:t.content||null},i=await this.db.apps.add(n);return t.files&&t.files.length>0&&await this.saveAppFiles(i,t.files),await this.addSyncEvent("app_installed",{appId:i,app:n}),i}catch(n){throw console.error("Errore installazione app:",n),new Error(`Impossibile installare l'app: ${n.message}`)}}async getAllApps(t={}){try{let n=this.db.apps.orderBy("lastUsed").reverse();return t.category&&(n=n.filter(i=>i.category===t.category)),t.search&&(n=n.filter(i=>i.name.toLowerCase().includes(t.search.toLowerCase())||i.description.toLowerCase().includes(t.search.toLowerCase())||i.tags.some(a=>a.toLowerCase().includes(t.search.toLowerCase())))),t.favorite&&(n=n.filter(i=>i.favorite===!0)),await n.toArray()}catch(n){return console.error("Errore recupero app:",n),[]}}async getApp(t){try{return await this.db.apps.get(t)}catch(n){return console.error("Errore recupero app:",n),null}}async updateApp(t,n){try{return await this.db.apps.update(t,n),await this.addSyncEvent("app_updated",{appId:t,updates:n}),!0}catch(i){return console.error("Errore aggiornamento app:",i),!1}}async setAppMetadata(t,n){try{const i=await this.getApp(t);if(!i)throw new Error("App non trovata");const a={...i.metadata,...n};return await this.db.apps.update(t,{metadata:a}),console.log(`✅ Metadati aggiornati per app ${t}:`,n),!0}catch(i){return console.error("Errore aggiornamento metadati app:",i),!1}}async getAppMetadata(t,n=null){try{const i=await this.getApp(t);return!i||!i.metadata?null:n?i.metadata[n]||null:i.metadata}catch(i){return console.error("Errore recupero metadati app:",i),null}}async migrateAppsForContent(){try{console.log("🔄 Inizio migrazione app HTML...");const t=await this.db.apps.toArray();console.log(`📊 Trovate ${t.length} app totali`);let n=0;for(const i of t)if(console.log(`🔍 Controllo app: ${i.name} (tipo: ${i.type})`),i.type==="html"&&!i.content){console.log(`📝 App HTML senza contenuto trovata: ${i.name}`);const a=await this.getAppFiles(i.id);console.log(`📁 Trovati ${a.length} file per app ${i.name}`);const s=a.find(r=>r.filename.endsWith(".html"));s?(console.log(`✅ File HTML trovato: ${s.filename}`),await this.db.apps.update(i.id,{content:s.content}),n++,console.log(`✅ App ${i.name} migrata con successo`)):console.log(`⚠️ Nessun file HTML trovato per app ${i.name}`)}return n>0?console.log(`✅ Migrate ${n} app HTML per aggiungere campo content`):console.log("ℹ️ Nessuna app HTML da migrare"),n}catch(t){return console.error("❌ Errore migrazione app:",t),console.error("Stack trace:",t.stack),0}}async deleteApp(t){try{return await this.db.transaction("rw",[this.db.apps,this.db.appFiles],async()=>{await this.db.apps.delete(t),await this.db.appFiles.where("appId").equals(t).delete()}),await this.addSyncEvent("app_deleted",{appId:t}),!0}catch(n){return console.error("Errore eliminazione app:",n),!1}}async updateLastUsed(t){try{await this.db.apps.update(t,{lastUsed:new Date})}catch(n){console.error("Errore aggiornamento ultimo utilizzo:",n)}}async toggleFavorite(t){try{const n=await this.db.apps.get(t);return n?(await this.db.apps.update(t,{favorite:!n.favorite}),!n.favorite):!1}catch(n){return console.error("Errore toggle preferito:",n),!1}}async saveAppFiles(t,n){try{const i=n.map(a=>this.db.appFiles.add({appId:t,filename:a.filename,content:a.content,size:a.size||a.content.length,mimeType:a.mimeType||this.getMimeType(a.filename)}));return await Promise.all(i),!0}catch(i){return console.error("Errore salvataggio file app:",i),!1}}async getAppFiles(t){try{return await this.db.appFiles.where("appId").equals(t).toArray()}catch(n){return console.error("Errore recupero file app:",n),[]}}async getSetting(t,n=null){try{const i=await this.db.settings.get(t);return i?i.value:n}catch(i){return console.error("Errore recupero impostazione:",i),n}}async setSetting(t,n){try{return await this.db.settings.put({key:t,value:n,lastModified:new Date}),!0}catch(i){return console.error("Errore salvataggio impostazione:",i),!1}}async getAllSettings(){try{const t=await this.db.settings.toArray(),n={};return t.forEach(i=>{n[i.key]=i.value}),n}catch(t){return console.error("Errore recupero impostazioni:",t),{}}}async addSyncEvent(t,n){try{await this.db.syncEvents.add({action:t,data:n,timestamp:new Date,synced:!1,deviceId:await this.getDeviceId()})}catch(i){console.error("Errore aggiunta evento sync:",i)}}async getUnsyncedEvents(){try{return await this.db.syncEvents.where("synced").equals(!1).toArray()}catch(t){return console.error("Errore recupero eventi non sincronizzati:",t),[]}}async markEventsSynced(t){try{await this.db.syncEvents.where("id").anyOf(t).modify({synced:!0})}catch(n){console.error("Errore aggiornamento eventi sync:",n)}}async updateCatalog(t){try{return await this.db.catalog.clear(),await this.db.catalog.bulkAdd(t),!0}catch(n){return console.error("Errore aggiornamento catalogo:",n),!1}}async searchCatalog(t,n={}){try{let i=this.db.catalog.orderBy("downloads").reverse();return t&&(i=i.filter(a=>a.name.toLowerCase().includes(t.toLowerCase())||a.description.toLowerCase().includes(t.toLowerCase())||a.categories.some(s=>s.toLowerCase().includes(t.toLowerCase())))),n.category&&(i=i.filter(a=>a.categories.includes(n.category))),n.featured&&(i=i.filter(a=>a.featured===!0)),await i.limit(n.limit||50).toArray()}catch(i){return console.error("Errore ricerca catalogo:",i),[]}}async getDeviceId(){let t=await this.getSetting("deviceId");return t||(t="device_"+Math.random().toString(36).substr(2,9)+"_"+Date.now(),await this.setSetting("deviceId",t)),t}getMimeType(t){const n=t.split(".").pop().toLowerCase();return{html:"text/html",css:"text/css",js:"application/javascript",json:"application/json",png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",gif:"image/gif",svg:"image/svg+xml",txt:"text/plain"}[n]||"application/octet-stream"}async exportAllData(){try{const[t,n,i]=await Promise.all([this.db.apps.toArray(),this.db.settings.toArray(),this.db.syncEvents.toArray()]);return{version:"1.0.0",timestamp:new Date().toISOString(),deviceId:await this.getDeviceId(),data:{apps:t,settings:n,syncEvents:i}}}catch(t){throw console.error("Errore export dati:",t),t}}async importData(t){try{if(!t.data)throw new Error("Formato dati non valido");const{apps:n,settings:i,syncEvents:a}=t.data;return await this.db.transaction("rw",[this.db.apps,this.db.settings,this.db.syncEvents],async()=>{n&&await this.db.apps.bulkPut(n),i&&await this.db.settings.bulkPut(i),a&&await this.db.syncEvents.bulkPut(a)}),!0}catch(n){throw console.error("Errore import dati:",n),n}}async ensureDbOpen(){if(!this.db.isOpen())try{await this.db.open(),console.log("📂 Database riaperto con successo")}catch(t){console.error("❌ Errore riapertura database:",t)}}async getStats(){try{if(await this.ensureDbOpen(),!this.db||!this.db.isOpen())return console.warn("Database non inizializzato"),null;const n=(await this.db.apps.toArray().catch(()=>[])).filter(l=>l&&typeof l=="object"),i=n.map(l=>l.category).filter(l=>typeof l=="string"&&l.length>0),a=n.filter(l=>l.favorite===!0).length,s=n.length,r=await this.db.appFiles.count().catch(()=>0),o=await this.db.settings.count().catch(()=>0),c=n.length>0?n.reduce((l,p)=>p.installDate&&(!l||new Date(p.installDate)>new Date(l))?p.installDate:l,null):null;return{totalApps:s,totalFiles:r,settingsCount:o,favoriteApps:a,categories:Array.from(new Set(i)).length,lastInstall:c,dbSize:await this.estimateDbSize()}}catch(t){return console.error("Errore recupero statistiche:",t),null}}async estimateDbSize(){try{return"storage"in navigator&&"estimate"in navigator.storage&&(await navigator.storage.estimate()).usage||0}catch{return 0}}async close(){this.db&&this.db.close()}}const A=new ae,Tn=Object.freeze(Object.defineProperty({__proto__:null,default:A},Symbol.toStringTag,{value:"Module"}));let Mn=0;function m(e,t="info",n=4e3,i={}){const a=document.getElementById("toast-container");if(!a){console.warn("Toast container non trovato");return}const s=`toast-${++Mn}`,r=document.createElement("div");r.id=s,r.className=`toast toast-${t}`,r.setAttribute("role","alert"),r.setAttribute("aria-live","polite");const o={success:`<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
    </svg>`,error:`<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
    </svg>`,warning:`<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M13,13H11V7H13M12,17.3A1.3,1.3 0 0,1 10.7,16A1.3,1.3 0 0,1 12,14.7A1.3,1.3 0 0,1 13.3,16A1.3,1.3 0 0,1 12,17.3M15.73,3H8.27L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3Z"/>
    </svg>`,info:`<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
    </svg>`};r.innerHTML=`
    <div class="toast-icon">
      ${o[t]||o.info}
    </div>
    <div class="toast-content">
      <div class="toast-message">${N(e)}</div>
      ${i.action?`<button class="toast-action">${i.action}</button>`:""}
    </div>
    <button class="toast-close" aria-label="Chiudi notifica">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
      </svg>
    </button>
  `;const c=r.querySelector(".toast-close"),l=r.querySelector(".toast-action"),p=()=>{r.classList.add("toast-removing"),setTimeout(()=>{r.parentNode&&r.parentNode.removeChild(r)},300)};return c.addEventListener("click",p),l&&i.onAction&&l.addEventListener("click",()=>{i.onAction(),p()}),a.appendChild(r),requestAnimationFrame(()=>{r.classList.add("toast-show")}),n>0&&setTimeout(p,n),s}function xn(e){const t=document.getElementById(e);t&&t.querySelector(".toast-close").click()}function In(){document.querySelectorAll(".toast").forEach(t=>{t.querySelector(".toast-close").click()})}function ht(e){e?xn(e):In()}function D(e,t,n={}){const i=document.getElementById("modals-container");if(!i){console.warn("Modals container non trovato");return}const a=document.getElementById(e);a&&a.remove();const s=document.createElement("div");s.id=e,s.className="modal",s.setAttribute("role","dialog"),s.setAttribute("aria-modal","true"),s.setAttribute("aria-labelledby",`${e}-title`),s.innerHTML=`
    <div class="modal-backdrop"></div>
    <div class="modal-dialog ${n.size||"modal-md"}">
      <div class="modal-content">
        ${t}
      </div>
    </div>
  `;const r=s.querySelector(".modal-backdrop"),o=s.querySelectorAll(".modal-close"),c=f=>{f&&f.preventDefault(),s.classList.add("modal-closing"),setTimeout(()=>{s.parentNode&&s.parentNode.removeChild(s),n.returnFocus&&n.returnFocus.focus()},300)};n.disableBackdropClose||r.addEventListener("click",c),o.forEach(f=>{f.addEventListener("click",c)});const l=f=>{f.key==="Escape"&&!n.disableEscapeClose&&(c(),document.removeEventListener("keydown",l))};document.addEventListener("keydown",l);const p=document.activeElement;return n.returnFocus=p,i.appendChild(s),requestAnimationFrame(()=>{s.classList.add("modal-show");const f=s.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');f.length>0&&f[0].focus()}),s}function O(e){const t=document.getElementById(e);if(t){const n=t.querySelector(".modal-close");n&&n.click()}}function N(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}function re(e,t=2){if(e===0)return"0 Bytes";const n=1024,i=t<0?0:t,a=["Bytes","KB","MB","GB","TB"],s=Math.floor(Math.log(e)/Math.log(n));return parseFloat((e/Math.pow(n,s)).toFixed(i))+" "+a[s]}function he(e){const t=new Date(e);if(isNaN(t.getTime()))return"Data non valida";const i=new Date-t,a=Math.floor(i/1e3),s=Math.floor(a/60),r=Math.floor(s/60),o=Math.floor(r/24),c=Math.floor(o/7),l=Math.floor(o/30),p=Math.floor(o/365);return a<60?"Proprio ora":s<60?`${s} minut${s===1?"o":"i"} fa`:r<24?`${r} or${r===1?"a":"e"} fa`:o<7?`${o} giorn${o===1?"o":"i"} fa`:c<4?`${c} settiman${c===1?"a":"e"} fa`:l<12?`${l} mes${l===1?"e":"i"} fa`:`${p} ann${p===1?"o":"i"} fa`}function Rn(e="id"){return`${e}-${Math.random().toString(36).substr(2,9)}-${Date.now()}`}function On(){return window.innerWidth<=768||/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)}function Pn(){return"serviceWorker"in navigator&&"manifests"in window}function Bn(){return{userAgent:navigator.userAgent,platform:navigator.platform,language:navigator.language,online:navigator.onLine,cookieEnabled:navigator.cookieEnabled,screen:{width:screen.width,height:screen.height,colorDepth:screen.colorDepth},viewport:{width:window.innerWidth,height:window.innerHeight},isMobile:On(),isPWASupported:Pn()}}function ft(e){try{return new URL(e),!0}catch{return!1}}function gt(e){try{return new URL(e).hostname}catch{return""}}function V(e={}){return new Promise(t=>{const{title:n="Conferma",message:i="Sei sicuro di voler continuare?",icon:a="question",confirmText:s="Conferma",cancelText:r="Annulla",type:o="default"}=e,c=document.createElement("div");c.className="confirm-popup";const l={question:`<svg viewBox="0 0 24 24" fill="currentColor" class="confirm-popup-icon">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
      </svg>`,warning:`<svg viewBox="0 0 24 24" fill="currentColor" class="confirm-popup-icon">
        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
      </svg>`,danger:`<svg viewBox="0 0 24 24" fill="currentColor" class="confirm-popup-icon">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>`,info:`<svg viewBox="0 0 24 24" fill="currentColor" class="confirm-popup-icon">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
      </svg>`},p=l[a]||l.question,f=o==="danger"?"confirm-popup-btn-danger":"confirm-popup-btn-primary";c.innerHTML=`
      <div class="confirm-popup-content">
        <div class="confirm-popup-header">
          <h3 class="confirm-popup-title">
            ${p}
            ${n}
          </h3>
        </div>
        <div class="confirm-popup-body">
          ${i}
        </div>
        <div class="confirm-popup-footer">
          <button class="confirm-popup-btn confirm-popup-btn-secondary" data-action="cancel">
            ${r}
          </button>
          <button class="confirm-popup-btn ${f}" data-action="confirm">
            ${s}
          </button>
        </div>
      </div>
    `;const g=b=>{document.body.removeChild(c),t(b==="confirm")};c.addEventListener("click",b=>{b.target===c&&g("cancel")}),c.querySelectorAll("[data-action]").forEach(b=>{b.addEventListener("click",S=>{S.preventDefault(),g(b.dataset.action)})});const v=b=>{b.key==="Escape"&&(document.removeEventListener("keydown",v),g("cancel"))};document.addEventListener("keydown",v),document.body.appendChild(c),setTimeout(()=>{c.querySelector(".confirm-popup-btn-secondary").focus()},100)})}function Nn(e){return V({title:"Elimina App",message:`Sei sicuro di voler eliminare "${e}"? Questa azione non può essere annullata.`,icon:"danger",confirmText:"Elimina",cancelText:"Annulla",type:"danger"})}class kn{constructor(){this.activeApps=new Map,this.launchHistory=[],this.maxConcurrentApps=5,this.launch=this.launch.bind(this),this.launchZipApp=this.launchZipApp.bind(this),this.launchUrlApp=this.launchUrlApp.bind(this),this.launchGitHubApp=this.launchGitHubApp.bind(this),this.launchPWA=this.launchPWA.bind(this),this.createSecureFrame=this.createSecureFrame.bind(this),this.closeApp=this.closeApp.bind(this),this.setupEventListeners=this.setupEventListeners.bind(this)}async init(){this.setupEventListeners(),await this.loadLaunchHistory()}async launch(t,n={}){try{console.log(`🚀 Launching app: ${t.name} (${t.type})`);const i=await A.getSetting("defaultLaunchMode","newpage"),a=t.metadata?.launchMode,s=n.forceMode||a||i;if(n.launchMode=s,s==="iframe"&&this.activeApps.size>=this.maxConcurrentApps&&!n.force&&!await this.showConcurrentAppsDialog())return;const r=await this.validateApp(t);if(!r.valid)throw new Error(r.error);const o=Rn("launch"),c=Date.now();m(`Caricamento ${t.name}...`,"info",0);let l;switch(t.type){case"zip":l=await this.launchZipApp(t,n);break;case"html":l=await this.launchHtmlApp(t,n);break;case"github":l=await this.launchGitHubApp(t,n);break;case"pwa":l=await this.launchPWA(t,n);break;default:l=await this.launchUrlApp(t,n)}return this.activeApps.set(o,{app:t,iframe:l,startTime:Date.now(),launchMode:s}),this.addToHistory(t,o),ht(),l}catch(i){throw console.error("Errore lancio app:",i),ht(),m(`Errore nel lancio di ${t.name}: ${i.message}`,"error"),i}}async launchZipApp(t,n={}){try{const i=await A.getAppFiles(t.id);if(!i.length)throw new Error("File dell'app non trovati");const a=this.findEntryPoint(i,t.manifest?.entryPoint);if(!a)throw new Error("Entry point non trovato");const s=new Map,r=new Map;for(const p of i){const f=new Blob([p.content],{type:p.mimeType}),g=URL.createObjectURL(f);s.set(p.filename,p),r.set(p.filename,g)}let o=a.content;o=this.replaceAllLocalPaths(o,r,t);const c=new Blob([o],{type:"text/html"}),l=URL.createObjectURL(c);if(n.launchMode==="newpage"){const p=window.open("",`aideas_zip_${t.id}_${Date.now()}`,"width=1200,height=800,scrollbars=yes,resizable=yes");if(!p)throw new Error("Popup bloccato dal browser. Consenti i popup per AIdeas.");p.document.write(o),p.document.close(),this.injectAIdeasAPI({contentWindow:p},t);const f=()=>{for(const g of r.values())URL.revokeObjectURL(g);URL.revokeObjectURL(l)};return p.addEventListener("beforeunload",f),{window:p,external:!0,cleanup:f}}else{const p=this.createSecureFrame(t,{src:l,sandbox:"allow-scripts allow-forms allow-modals allow-popups-to-escape-sandbox allow-same-origin",files:s,blobUrls:r});return p.addEventListener("unload",()=>{for(const f of r.values())URL.revokeObjectURL(f);URL.revokeObjectURL(l)}),{iframe:p,window:p.contentWindow,cleanup:()=>{for(const f of r.values())URL.revokeObjectURL(f);URL.revokeObjectURL(l)}}}}catch(i){throw console.error("Errore lancio app ZIP:",i),i}}async launchHtmlApp(t,n={}){try{if(!t.content)throw new Error("Contenuto HTML mancante");let i=await this.injectCSPForHTMLApp(t.content,t.id);const a=new Blob([i],{type:"text/html"}),s=URL.createObjectURL(a);if(n.launchMode==="newpage"){const r=window.open("",`aideas_html_${t.id}_${Date.now()}`,"width=1200,height=800,scrollbars=yes,resizable=yes");if(!r)throw new Error("Popup bloccato dal browser. Consenti i popup per AIdeas.");return r.document.open(),r.document.write(i),r.document.close(),{window:r,external:!0,cleanup:()=>{URL.revokeObjectURL(s)}}}else{const r=this.createSecureFrame(t,{src:s,sandbox:"allow-scripts allow-forms allow-modals allow-popups-to-escape-sandbox allow-same-origin"});return r.addEventListener("unload",()=>{URL.revokeObjectURL(s)}),{iframe:r,window:r.contentWindow,cleanup:()=>{URL.revokeObjectURL(s)}}}}catch(i){throw console.error("Errore lancio app HTML:",i),i}}analyzeHTMLForExternalResources(t){const n={scripts:new Set,styles:new Set,fonts:new Set,images:new Set,frames:new Set,connections:new Set},i={scripts:/<script[^>]*src=["']([^"']+)["'][^>]*>/gi,styles:/<link[^>]*href=["']([^"']+)["'][^>]*>/gi,images:/<img[^>]*src=["']([^"']+)["'][^>]*>/gi,frames:/<iframe[^>]*src=["']([^"']+)["'][^>]*>/gi,connections:/fetch\(["']([^"']+)["']\)|XMLHttpRequest\(["']([^"']+)["']\)/gi},a=r=>{try{if(r.startsWith("//"))r="https:"+r;else{if(r.startsWith("/"))return null;if(!r.startsWith("http"))return null}return new URL(r).hostname}catch{return null}};let s;for(;(s=i.scripts.exec(t))!==null;){const r=a(s[1]);r&&n.scripts.add(r)}for(;(s=i.styles.exec(t))!==null;){const r=a(s[1]);if(r){const o=s[0];o.includes('rel="stylesheet"')||o.includes('type="text/css"')?n.styles.add(r):o.includes('rel="preload"')&&o.includes('as="font"')&&n.fonts.add(r)}}for(;(s=i.images.exec(t))!==null;){const r=a(s[1]);r&&n.images.add(r)}for(;(s=i.frames.exec(t))!==null;){const r=a(s[1]);r&&n.frames.add(r)}for(;(s=i.connections.exec(t))!==null;){const r=s[1]||s[2],o=a(r);o&&n.connections.add(o)}return{scripts:Array.from(n.scripts),styles:Array.from(n.styles),fonts:Array.from(n.fonts),images:Array.from(n.images),frames:Array.from(n.frames),connections:Array.from(n.connections)}}generateCustomCSP(t){const n=new Set;Object.values(t).forEach(s=>{s.forEach(r=>n.add(r))});const i=Array.from(n);let a="default-src 'self' data: blob: 'unsafe-inline' 'unsafe-eval'; ";return a+="script-src 'self' data: blob: 'unsafe-inline' 'unsafe-eval' "+i.join(" ")+"; ",a+="style-src 'self' data: blob: 'unsafe-inline' "+i.join(" ")+"; ",a+="img-src 'self' data: blob: "+i.join(" ")+"; ",a+="font-src 'self' data: blob: "+i.join(" ")+"; ",a+="connect-src 'self' data: blob: "+i.join(" ")+"; ",a+="frame-src 'self' data: blob: "+i.join(" ")+"; ",a+="object-src 'self' data: blob:; ",a+="base-uri 'self'; ",a+="form-action 'self';",a}async injectCSPForHTMLApp(t,n=null){try{let i=null,a=null;if(n){const r=await A.getAppMetadata(n,"customCSP"),o=await A.getAppMetadata(n,"externalDomains"),c=await A.getAppMetadata(n,"lastAnalyzed");if(r&&o&&c){const l=(Date.now()-c)/36e5;l<24&&(console.log(`♻️ Usando CSP cached per app ${n} (analizzata ${l.toFixed(1)} ore fa)`),i=r,a=o)}}i||(console.log(`🔍 Analisi HTML per app ${n||"senza ID"}...`),a=this.analyzeHTMLForExternalResources(t),i=this.generateCustomCSP(a),n&&(await A.setAppMetadata(n,{customCSP:i,externalDomains:a,lastAnalyzed:Date.now()}),console.log(`💾 CSP cached per app ${n}`))),console.log("🔍 Domini trovati nell'HTML:",a);let s;return t.includes('<meta http-equiv="Content-Security-Policy"')?s=t.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/g,`<meta http-equiv="Content-Security-Policy" content="${i}">`):s=t.replace(/<head>/i,`<head>
  <meta http-equiv="Content-Security-Policy" content="${i}">`),s}catch(i){console.warn("Errore nell'analisi CSP, uso CSP di fallback:",i);const a="default-src * data: blob: 'unsafe-inline' 'unsafe-eval'; script-src * data: blob: 'unsafe-inline' 'unsafe-eval'; style-src * data: blob: 'unsafe-inline'; img-src * data: blob:; font-src * data: blob:; connect-src * data: blob:; frame-src * data: blob:; object-src * data: blob:; base-uri *; form-action *;";let s;return t.includes('<meta http-equiv="Content-Security-Policy"')?s=t.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/g,`<meta http-equiv="Content-Security-Policy" content="${a}">`):s=t.replace(/<head>/i,`<head>
  <meta http-equiv="Content-Security-Policy" content="${a}">`),s}}async launchUrlApp(t,n={}){try{if(!t.url)throw new Error("URL dell'app non specificato");let i=t.url;if(n.launchMode==="newpage"||n.forceNewWindow){console.log("🪟 Apertura in nuova finestra (modalità esplicita)");const a=window.open(i,`aideas_app_${t.id}`,"width=1200,height=800,scrollbars=yes,resizable=yes");if(!a)throw new Error("Popup bloccato dal browser. Consenti i popup per AIdeas.");return{window:a,external:!0}}else if(console.log("🔍 Tentativo apertura in iframe..."),await this.checkIframeCompatibility(i)){console.log("✅ Caricamento in iframe...");const s=this.createSecureFrame(t,{src:i,sandbox:"allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin"});return s.addEventListener("error",()=>{console.log("❌ Errore caricamento iframe, fallback a nuova finestra"),m("Errore caricamento iframe, apertura in nuova finestra","info");const r=s.closest(".modal");r&&O(r.id),window.open(i,`aideas_app_${t.id}_fallback`,"width=1200,height=800,scrollbars=yes,resizable=yes")&&m("App aperta in nuova finestra","success")}),{iframe:s,window:s.contentWindow}}else{console.log("🔄 Fallback automatico a nuova finestra - iframe non supportato"),m("Questo sito non supporta iframe, apertura in nuova finestra","info");const s=window.open(i,`aideas_app_${t.id}_fallback`,"width=1200,height=800,scrollbars=yes,resizable=yes");if(!s)throw new Error("Popup bloccato dal browser. Consenti i popup per AIdeas.");return{window:s,external:!0,fallback:!0}}}catch(i){throw console.error("Errore lancio app URL:",i),i}}async launchGitHubApp(t,n={}){try{if(!t.githubUrl)throw new Error("URL GitHub non specificato");const i=this.parseGitHubUrl(t.githubUrl);if(!i)throw new Error("URL GitHub non valido");let a;t.metadata?.usePagesUrl?a=`https://${i.owner}.github.io/${i.repo}/`:a=`https://raw.githubusercontent.com/${i.owner}/${i.repo}/${i.branch||"main"}/index.html`;const s={...t,url:a,type:"url"};return await this.launchUrlApp(s,n)}catch(i){throw console.error("Errore lancio app GitHub:",i),i}}async launchPWA(t,n={}){try{if(!t.url)throw new Error("URL della PWA non specificato");const i=window.open(t.url,`aideas_pwa_${t.id}`,"width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,location=no,status=no,menubar=no");if(!i)throw new Error("Popup bloccato dal browser. Consenti i popup per AIdeas.");return"serviceWorker"in navigator&&t.manifest&&setTimeout(()=>{this.promptPWAInstall(t,i)},2e3),{window:i,external:!0,isPWA:!0}}catch(i){throw console.error("Errore lancio PWA:",i),i}}createSecureFrame(t,n={}){const i=`app-modal-${t.id}-${Date.now()}`,a=`
      <div class="modal-header">
        <div class="app-modal-title">
          <div class="app-modal-icon">
            ${t.icon?`<img src="${t.icon}" alt="${t.name}">`:"📱"}
          </div>
          <div>
            <h2>${N(t.name)}</h2>
            <p class="app-modal-subtitle">${N(t.description||"")}</p>
          </div>
        </div>
        <div class="app-modal-controls">
          <select class="app-launch-mode" id="app-launch-mode-${t.id}" title="Modalità di apertura">
            <option value="default">Modalità predefinita</option>
            <option value="iframe">Apri in finestra modale</option>
            <option value="newpage">Apri in nuova pagina</option>
          </select>
          <button class="btn btn-secondary btn-sm" id="app-refresh-${t.id}">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
            </svg>
            Ricarica
          </button>
          <button class="btn btn-secondary btn-sm" id="app-fullscreen-${t.id}">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M7,14H5V19H10V17H7V14M12,14H10V17H7V19H12V14M17,14V17H14V19H19V14H17M19,10H17V5H14V7H17V10H19M10,7V5H5V10H7V7H10M12,10V7H10V5H15V10H12Z"/>
            </svg>
            Schermo intero
          </button>
          <button class="modal-close">&times;</button>
        </div>
      </div>
      <div class="modal-body app-modal-body">
        <div class="app-frame-container">
          <div class="app-loading">
            <div class="spinner"></div>
            <p>Caricamento ${N(t.name)}...</p>
          </div>
        </div>
      </div>
    `,s=D(i,a,{size:"modal-xl",disableBackdropClose:!1,disableEscapeClose:!1}),r=document.createElement("iframe");return r.className="app-frame",r.src=n.src,r.sandbox=n.sandbox||"allow-scripts allow-forms allow-modals",r.style.cssText=`
      width: 100%;
      height: 70vh;
      border: none;
      border-radius: 8px;
      background: white;
    `,r.addEventListener("load",()=>{const c=s.querySelector(".app-loading");c&&(c.style.display="none"),r.style.display="block",this.injectAIdeasAPI(r,t)}),r.addEventListener("error",()=>{const c=s.querySelector(".app-frame-container");c.innerHTML=`
        <div class="app-error">
          <div class="app-error-icon">⚠️</div>
          <h3>Errore di caricamento</h3>
          <p>Impossibile caricare l'applicazione.</p>
          <button class="btn btn-primary" onclick="location.reload()">Riprova</button>
        </div>
      `}),s.querySelector(".app-frame-container").appendChild(r),this.setupAppModalControls(s,r,t),r}setupAppModalControls(t,n,i){const a=t.querySelector(`#app-launch-mode-${i.id}`);a?.addEventListener("change",async()=>{const c=a.value;c!=="default"&&(await V({title:"Cambia Modalità",message:`Vuoi riaprire l'app in modalità "${c==="iframe"?"finestra modale":"nuova pagina"}"?`,icon:"question",confirmText:"Riapri",cancelText:"Annulla",type:"default"})?(O(t.id),await this.launch(i,{forceMode:c})):a.value="default")}),t.querySelector(`#app-refresh-${i.id}`)?.addEventListener("click",()=>{n.src=n.src,m("App ricaricata","info")}),t.querySelector(`#app-fullscreen-${i.id}`)?.addEventListener("click",()=>{t.requestFullscreen?t.requestFullscreen():t.webkitRequestFullscreen?t.webkitRequestFullscreen():t.msRequestFullscreen&&t.msRequestFullscreen()});const o=new MutationObserver(c=>{c.forEach(l=>{l.type==="childList"&&l.removedNodes.forEach(p=>{p===t&&(this.cleanupApp(i.id),o.disconnect())})})});o.observe(document.body,{childList:!0})}injectAIdeasAPI(t,n){try{const i=t.contentWindow;if(!i)return;i.AIdeas={app:{id:n.id,name:n.name,version:n.version},storage:{get:a=>localStorage.getItem(`aideas_app_${n.id}_${a}`),set:(a,s)=>localStorage.setItem(`aideas_app_${n.id}_${a}`,s),remove:a=>localStorage.removeItem(`aideas_app_${n.id}_${a}`),clear:()=>{const a=`aideas_app_${n.id}_`;Object.keys(localStorage).forEach(s=>{s.startsWith(a)&&localStorage.removeItem(s)})}},utils:{showNotification:(a,s="info")=>{m(`[${n.name}] ${a}`,s)},getUserPreferences:async()=>await A.getAllSettings(),openUrl:a=>{window.open(a,"_blank")},closeApp:()=>{this.closeApp(n.id)}},lifecycle:{onAppStart:a=>{typeof a=="function"&&setTimeout(a,100)},onAppPause:a=>{window.addEventListener("blur",a)},onAppResume:a=>{window.addEventListener("focus",a)}}},console.log(`✅ AIdeas API iniettata in ${n.name}`)}catch(i){console.warn("Impossibile iniettare AIdeas API:",i)}}findEntryPoint(t,n){if(n){const s=t.find(r=>r.filename===n);if(s)return s}const i=t.find(s=>s.filename==="index.html");if(i)return i;const a=t.find(s=>s.filename.endsWith(".html"));if(a)return a;throw new Error("Entry point HTML non trovato")}replaceAllLocalPaths(t,n,i){let a=t;const s=new Map;for(const[o,c]of n){s.set(o,c),s.set("./"+o,c),s.set("../"+o,c);const l=o.split("/");if(l.length>1){const p=l[l.length-1];s.has(p)||s.set(p,c)}}a=a.replace(/\bsrc\s*=\s*["']([^"']+)["']/gi,(o,c)=>{const l=this.cleanPath(c);return s.has(l)?o.replace(c,s.get(l)):o}),a=a.replace(/\bhref\s*=\s*["']([^"']+)["']/gi,(o,c)=>{const l=this.cleanPath(c);return s.has(l)&&!c.startsWith("#")&&!c.startsWith("mailto:")?o.replace(c,s.get(l)):o}),a=a.replace(/\bimport\s+.*?\s+from\s+["']([^"']+)["']/gi,(o,c)=>{const l=this.cleanPath(c);return s.has(l)?o.replace(c,s.get(l)):o}),a=a.replace(/\brequire\s*\(\s*["']([^"']+)["']\s*\)/gi,(o,c)=>{const l=this.cleanPath(c);return s.has(l)?o.replace(c,s.get(l)):o}),a=a.replace(/\burl\s*\(\s*["']?([^"')]+)["']?\s*\)/gi,(o,c)=>{const l=this.cleanPath(c);return s.has(l)?o.replace(c,s.get(l)):o}),a=a.replace(/\bfetch\s*\(\s*["']([^"']+)["']/gi,(o,c)=>{const l=this.cleanPath(c);return s.has(l)?o.replace(c,s.get(l)):o}),a=a.replace(/\bnew\s+URL\s*\(\s*["']([^"']+)["']/gi,(o,c)=>{const l=this.cleanPath(c);return s.has(l)?o.replace(c,s.get(l)):o}),a=a.replace(/["']([^"']*\.[a-zA-Z0-9]+)["']/gi,(o,c)=>{if(!c.includes("://")&&!c.startsWith("data:")&&!c.startsWith("#")){const l=this.cleanPath(c);if(s.has(l))return o.replace(c,s.get(l))}return o});const r=`
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="aideas-app" content="${N(i.name)}">
      <meta name="aideas-version" content="${i.version||"1.0.0"}">
      <meta name="aideas-type" content="zip">
      <base href="blob:">
    `;return a.includes("<head>")?a=a.replace("<head>","<head>"+r):a.includes("<html>")?a=a.replace("<html>","<html><head>"+r+"</head>"):a=r+a,a}cleanPath(t){if(!t)return"";let n=t.split("?")[0].split("#")[0];return n=n.replace(/\\/g,"/"),n=n.trim(),n}async checkIframeCompatibility(t){try{if(console.log(`🔍 Controllo compatibilità iframe per: ${t}`),t.startsWith("blob:"))return console.log("✅ Blob URL - compatibile con iframe"),!0;if(t.startsWith("data:"))return console.log("✅ Data URL - compatibile con iframe"),!0;const n=new AbortController,i=setTimeout(()=>n.abort(),5e3);try{const a=await fetch(t,{method:"HEAD",signal:n.signal,mode:"cors"});clearTimeout(i);const s=a.headers.get("X-Frame-Options"),r=a.headers.get("Content-Security-Policy");if(console.log("📋 Headers ricevuti:",{"X-Frame-Options":s,"Content-Security-Policy":r?r.substring(0,100)+"...":"none"}),s){const o=s.toLowerCase();if(o==="deny")return console.log("❌ X-Frame-Options: DENY - iframe non supportato"),!1;if(o==="sameorigin")return console.log("⚠️ X-Frame-Options: SAMEORIGIN - iframe limitato"),window.location.origin===new URL(t).origin}if(r){const o=r.toLowerCase();if(o.includes("frame-ancestors")){if(o.includes("frame-ancestors 'none'"))return console.log("❌ CSP frame-ancestors: none - iframe non supportato"),!1;if(o.includes("frame-ancestors 'self'"))return console.log("⚠️ CSP frame-ancestors: self - iframe limitato"),window.location.origin===new URL(t).origin}}return console.log("✅ URL compatibile con iframe"),!0}catch(a){return clearTimeout(i),a.name==="AbortError"?console.log("⏰ Timeout durante controllo compatibilità iframe"):console.log("⚠️ Errore durante controllo compatibilità iframe:",a.message),console.log("🔄 Fallback: proveremo iframe comunque"),!0}}catch(n){return console.error("❌ Errore generale controllo compatibilità iframe:",n),!1}}parseGitHubUrl(t){const n=[/github\.com\/([^\/]+)\/([^\/]+)/,/([^\/]+)\.github\.io\/([^\/]+)/];for(const i of n){const a=t.match(i);if(a)return{owner:a[1],repo:a[2].replace(".git",""),branch:"main"}}return null}async validateApp(t){const n={valid:!0,error:null};if(!t||!t.id)return n.valid=!1,n.error="App non valida",n;switch(t.type){case"zip":(await A.getAppFiles(t.id)).length||(n.valid=!1,n.error="File dell'app non trovati");break;case"url":case"github":case"pwa":!t.url&&!t.githubUrl&&(n.valid=!1,n.error="URL dell'app non specificato");break;case"html":t.content||(n.valid=!1,n.error="Contenuto HTML mancante");break;default:n.valid=!1,n.error=`Tipo di app non supportato: ${t.type}`}return n}async showConcurrentAppsDialog(){return new Promise(t=>{D("concurrent-apps-dialog",`
        <div class="modal-header">
          <h2>Limite app raggiunto</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <p>Hai raggiunto il limite di ${this.maxConcurrentApps} app aperte contemporaneamente.</p>
          <p>Vuoi chiudere un'app esistente e procedere?</p>
          <div class="concurrent-apps-list">
            ${Array.from(this.activeApps.values()).map(n=>`
              <div class="concurrent-app-item">
                <span>${n.app.name}</span>
                <button class="btn btn-sm btn-secondary" onclick="this.closeApp('${n.app.id}')">Chiudi</button>
              </div>
            `).join("")}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="resolve(false)">Annulla</button>
          <button class="btn btn-primary" onclick="resolve(true)">Continua</button>
        </div>
      `,{disableBackdropClose:!0}),setTimeout(()=>t(!0),5e3)})}closeApp(t){const n=Array.from(this.activeApps.values()).find(i=>i.app.id===t);n&&(n.window&&!n.window.closed&&n.window.close(),n.cleanup&&n.cleanup(),this.activeApps.delete(t))}cleanupApp(t){this.closeApp(t)}setupEventListeners(){window.addEventListener("beforeunload",()=>{for(const[t,n]of this.activeApps)n.cleanup&&n.cleanup()})}async loadLaunchHistory(){const t=await A.getSetting("launchHistory",[]);this.launchHistory=t.slice(-50)}addToHistory(t,n){this.launchHistory.push({appId:t.id,appName:t.name,launchId:n,timestamp:new Date().toISOString()}),A.setSetting("launchHistory",this.launchHistory.slice(-50))}trackLaunch(t,n){console.log(`📊 Launch tracked: ${t.name} in ${n}ms`)}promptPWAInstall(t,n){console.log(`💡 PWA install prompt for ${t.name}`)}get activeAppCount(){return this.activeApps.size}get canLaunchMore(){return this.activeApps.size<this.maxConcurrentApps}}var L;(function(e){e.Root="root",e.Text="text",e.Directive="directive",e.Comment="comment",e.Script="script",e.Style="style",e.Tag="tag",e.CDATA="cdata",e.Doctype="doctype"})(L||(L={}));function Hn(e){return e.type===L.Tag||e.type===L.Script||e.type===L.Style}const Ut=L.Root,Un=L.Text,Dn=L.Directive,Fn=L.Comment,zn=L.Script,_n=L.Style,_e=L.Tag,$n=L.CDATA,Vn=L.Doctype;class Dt{constructor(){this.parent=null,this.prev=null,this.next=null,this.startIndex=null,this.endIndex=null}get parentNode(){return this.parent}set parentNode(t){this.parent=t}get previousSibling(){return this.prev}set previousSibling(t){this.prev=t}get nextSibling(){return this.next}set nextSibling(t){this.next=t}cloneNode(t=!1){return oe(this,t)}}class Ze extends Dt{constructor(t){super(),this.data=t}get nodeValue(){return this.data}set nodeValue(t){this.data=t}}class Ft extends Ze{constructor(){super(...arguments),this.type=L.Text}get nodeType(){return 3}}class qn extends Ze{constructor(){super(...arguments),this.type=L.Comment}get nodeType(){return 8}}class jn extends Ze{constructor(t,n){super(n),this.name=t,this.type=L.Directive}get nodeType(){return 1}}class Ke extends Dt{constructor(t){super(),this.children=t}get firstChild(){var t;return(t=this.children[0])!==null&&t!==void 0?t:null}get lastChild(){return this.children.length>0?this.children[this.children.length-1]:null}get childNodes(){return this.children}set childNodes(t){this.children=t}}class Wn extends Ke{constructor(){super(...arguments),this.type=L.CDATA}get nodeType(){return 4}}class zt extends Ke{constructor(){super(...arguments),this.type=L.Root}get nodeType(){return 9}}class Yn extends Ke{constructor(t,n,i=[],a=t==="script"?L.Script:t==="style"?L.Style:L.Tag){super(i),this.name=t,this.attribs=n,this.type=a}get nodeType(){return 1}get tagName(){return this.name}set tagName(t){this.name=t}get attributes(){return Object.keys(this.attribs).map(t=>{var n,i;return{name:t,value:this.attribs[t],namespace:(n=this["x-attribsNamespace"])===null||n===void 0?void 0:n[t],prefix:(i=this["x-attribsPrefix"])===null||i===void 0?void 0:i[t]}})}}function E(e){return Hn(e)}function Me(e){return e.type===L.CDATA}function q(e){return e.type===L.Text}function Xe(e){return e.type===L.Comment}function Zn(e){return e.type===L.Directive}function Q(e){return e.type===L.Root}function M(e){return Object.prototype.hasOwnProperty.call(e,"children")}function oe(e,t=!1){let n;if(q(e))n=new Ft(e.data);else if(Xe(e))n=new qn(e.data);else if(E(e)){const i=t?Pe(e.children):[],a=new Yn(e.name,{...e.attribs},i);i.forEach(s=>s.parent=a),e.namespace!=null&&(a.namespace=e.namespace),e["x-attribsNamespace"]&&(a["x-attribsNamespace"]={...e["x-attribsNamespace"]}),e["x-attribsPrefix"]&&(a["x-attribsPrefix"]={...e["x-attribsPrefix"]}),n=a}else if(Me(e)){const i=t?Pe(e.children):[],a=new Wn(i);i.forEach(s=>s.parent=a),n=a}else if(Q(e)){const i=t?Pe(e.children):[],a=new zt(i);i.forEach(s=>s.parent=a),e["x-mode"]&&(a["x-mode"]=e["x-mode"]),n=a}else if(Zn(e)){const i=new jn(e.name,e.data);e["x-name"]!=null&&(i["x-name"]=e["x-name"],i["x-publicId"]=e["x-publicId"],i["x-systemId"]=e["x-systemId"]),n=i}else throw new Error(`Not implemented yet: ${e.type}`);return n.startIndex=e.startIndex,n.endIndex=e.endIndex,e.sourceCodeLocation!=null&&(n.sourceCodeLocation=e.sourceCodeLocation),n}function Pe(e){const t=e.map(n=>oe(n,!0));for(let n=1;n<t.length;n++)t[n].prev=t[n-1],t[n-1].next=t[n];return t}const mt=/["&'<>$\x80-\uFFFF]/g,Kn=new Map([[34,"&quot;"],[38,"&amp;"],[39,"&apos;"],[60,"&lt;"],[62,"&gt;"]]),Xn=String.prototype.codePointAt!=null?(e,t)=>e.codePointAt(t):(e,t)=>(e.charCodeAt(t)&64512)===55296?(e.charCodeAt(t)-55296)*1024+e.charCodeAt(t+1)-56320+65536:e.charCodeAt(t);function _t(e){let t="",n=0,i;for(;(i=mt.exec(e))!==null;){const a=i.index,s=e.charCodeAt(a),r=Kn.get(s);r!==void 0?(t+=e.substring(n,a)+r,n=a+1):(t+=`${e.substring(n,a)}&#x${Xn(e,a).toString(16)};`,n=mt.lastIndex+=+((s&64512)===55296))}return t+e.substr(n)}function $t(e,t){return function(i){let a,s=0,r="";for(;a=e.exec(i);)s!==a.index&&(r+=i.substring(s,a.index)),r+=t.get(a[0].charCodeAt(0)),s=a.index+1;return r+i.substring(s)}}const Qn=$t(/["&\u00A0]/g,new Map([[34,"&quot;"],[38,"&amp;"],[160,"&nbsp;"]])),Jn=$t(/[&<>\u00A0]/g,new Map([[38,"&amp;"],[60,"&lt;"],[62,"&gt;"],[160,"&nbsp;"]])),Gn=new Map(["altGlyph","altGlyphDef","altGlyphItem","animateColor","animateMotion","animateTransform","clipPath","feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feDistantLight","feDropShadow","feFlood","feFuncA","feFuncB","feFuncG","feFuncR","feGaussianBlur","feImage","feMerge","feMergeNode","feMorphology","feOffset","fePointLight","feSpecularLighting","feSpotLight","feTile","feTurbulence","foreignObject","glyphRef","linearGradient","radialGradient","textPath"].map(e=>[e.toLowerCase(),e])),ei=new Map(["definitionURL","attributeName","attributeType","baseFrequency","baseProfile","calcMode","clipPathUnits","diffuseConstant","edgeMode","filterUnits","glyphRef","gradientTransform","gradientUnits","kernelMatrix","kernelUnitLength","keyPoints","keySplines","keyTimes","lengthAdjust","limitingConeAngle","markerHeight","markerUnits","markerWidth","maskContentUnits","maskUnits","numOctaves","pathLength","patternContentUnits","patternTransform","patternUnits","pointsAtX","pointsAtY","pointsAtZ","preserveAlpha","preserveAspectRatio","primitiveUnits","refX","refY","repeatCount","repeatDur","requiredExtensions","requiredFeatures","specularConstant","specularExponent","spreadMethod","startOffset","stdDeviation","stitchTiles","surfaceScale","systemLanguage","tableValues","targetX","targetY","textLength","viewBox","viewTarget","xChannelSelector","yChannelSelector","zoomAndPan"].map(e=>[e.toLowerCase(),e])),ti=new Set(["style","script","xmp","iframe","noembed","noframes","plaintext","noscript"]);function ni(e){return e.replace(/"/g,"&quot;")}function ii(e,t){var n;if(!e)return;const i=((n=t.encodeEntities)!==null&&n!==void 0?n:t.decodeEntities)===!1?ni:t.xmlMode||t.encodeEntities!=="utf8"?_t:Qn;return Object.keys(e).map(a=>{var s,r;const o=(s=e[a])!==null&&s!==void 0?s:"";return t.xmlMode==="foreign"&&(a=(r=ei.get(a))!==null&&r!==void 0?r:a),!t.emptyAttrs&&!t.xmlMode&&o===""?a:`${a}="${i(o)}"`}).join(" ")}const vt=new Set(["area","base","basefont","br","col","command","embed","frame","hr","img","input","isindex","keygen","link","meta","param","source","track","wbr"]);function Qe(e,t={}){const n="length"in e?e:[e];let i="";for(let a=0;a<n.length;a++)i+=ai(n[a],t);return i}function ai(e,t){switch(e.type){case Ut:return Qe(e.children,t);case Vn:case Dn:return ci(e);case Fn:return ui(e);case $n:return di(e);case zn:case _n:case _e:return oi(e,t);case Un:return li(e,t)}}const si=new Set(["mi","mo","mn","ms","mtext","annotation-xml","foreignObject","desc","title"]),ri=new Set(["svg","math"]);function oi(e,t){var n;t.xmlMode==="foreign"&&(e.name=(n=Gn.get(e.name))!==null&&n!==void 0?n:e.name,e.parent&&si.has(e.parent.name)&&(t={...t,xmlMode:!1})),!t.xmlMode&&ri.has(e.name)&&(t={...t,xmlMode:"foreign"});let i=`<${e.name}`;const a=ii(e.attribs,t);return a&&(i+=` ${a}`),e.children.length===0&&(t.xmlMode?t.selfClosingTags!==!1:t.selfClosingTags&&vt.has(e.name))?(t.xmlMode||(i+=" "),i+="/>"):(i+=">",e.children.length>0&&(i+=Qe(e.children,t)),(t.xmlMode||!vt.has(e.name))&&(i+=`</${e.name}>`)),i}function ci(e){return`<${e.data}>`}function li(e,t){var n;let i=e.data||"";return((n=t.encodeEntities)!==null&&n!==void 0?n:t.decodeEntities)!==!1&&!(!t.xmlMode&&e.parent&&ti.has(e.parent.name))&&(i=t.xmlMode||t.encodeEntities!=="utf8"?_t(i):Jn(i)),i}function di(e){return`<![CDATA[${e.children[0].data}]]>`}function ui(e){return`<!--${e.data}-->`}function Vt(e,t){return Qe(e,t)}function pi(e,t){return M(e)?e.children.map(n=>Vt(n,t)).join(""):""}function me(e){return Array.isArray(e)?e.map(me).join(""):E(e)?e.name==="br"?`
`:me(e.children):Me(e)?me(e.children):q(e)?e.data:""}function K(e){return Array.isArray(e)?e.map(K).join(""):M(e)&&!Xe(e)?K(e.children):q(e)?e.data:""}function be(e){return Array.isArray(e)?e.map(be).join(""):M(e)&&(e.type===L.Tag||Me(e))?be(e.children):q(e)?e.data:""}function xe(e){return M(e)?e.children:[]}function qt(e){return e.parent||null}function jt(e){const t=qt(e);if(t!=null)return xe(t);const n=[e];let{prev:i,next:a}=e;for(;i!=null;)n.unshift(i),{prev:i}=i;for(;a!=null;)n.push(a),{next:a}=a;return n}function hi(e,t){var n;return(n=e.attribs)===null||n===void 0?void 0:n[t]}function fi(e,t){return e.attribs!=null&&Object.prototype.hasOwnProperty.call(e.attribs,t)&&e.attribs[t]!=null}function gi(e){return e.name}function Je(e){let{next:t}=e;for(;t!==null&&!E(t);)({next:t}=t);return t}function Ge(e){let{prev:t}=e;for(;t!==null&&!E(t);)({prev:t}=t);return t}function j(e){if(e.prev&&(e.prev.next=e.next),e.next&&(e.next.prev=e.prev),e.parent){const t=e.parent.children,n=t.lastIndexOf(e);n>=0&&t.splice(n,1)}e.next=null,e.prev=null,e.parent=null}function mi(e,t){const n=t.prev=e.prev;n&&(n.next=t);const i=t.next=e.next;i&&(i.prev=t);const a=t.parent=e.parent;if(a){const s=a.children;s[s.lastIndexOf(e)]=t,e.parent=null}}function vi(e,t){if(j(t),t.next=null,t.parent=e,e.children.push(t)>1){const n=e.children[e.children.length-2];n.next=t,t.prev=n}else t.prev=null}function bi(e,t){j(t);const{parent:n}=e,i=e.next;if(t.next=i,t.prev=e,e.next=t,t.parent=n,i){if(i.prev=t,n){const a=n.children;a.splice(a.lastIndexOf(i),0,t)}}else n&&n.children.push(t)}function yi(e,t){if(j(t),t.parent=e,t.prev=null,e.children.unshift(t)!==1){const n=e.children[1];n.prev=t,t.next=n}else t.next=null}function Ei(e,t){j(t);const{parent:n}=e;if(n){const i=n.children;i.splice(i.indexOf(e),0,t)}e.prev&&(e.prev.next=t),t.parent=n,t.prev=e.prev,t.next=e,e.prev=t}function de(e,t,n=!0,i=1/0){return et(e,Array.isArray(t)?t:[t],n,i)}function et(e,t,n,i){const a=[],s=[Array.isArray(t)?t:[t]],r=[0];for(;;){if(r[0]>=s[0].length){if(r.length===1)return a;s.shift(),r.shift();continue}const o=s[0][r[0]++];if(e(o)&&(a.push(o),--i<=0))return a;n&&M(o)&&o.children.length>0&&(r.unshift(0),s.unshift(o.children))}}function Ai(e,t){return t.find(e)}function tt(e,t,n=!0){const i=Array.isArray(t)?t:[t];for(let a=0;a<i.length;a++){const s=i[a];if(E(s)&&e(s))return s;if(n&&M(s)&&s.children.length>0){const r=tt(e,s.children,!0);if(r)return r}}return null}function Wt(e,t){return(Array.isArray(t)?t:[t]).some(n=>E(n)&&e(n)||M(n)&&Wt(e,n.children))}function Ci(e,t){const n=[],i=[Array.isArray(t)?t:[t]],a=[0];for(;;){if(a[0]>=i[0].length){if(i.length===1)return n;i.shift(),a.shift();continue}const s=i[0][a[0]++];E(s)&&e(s)&&n.push(s),M(s)&&s.children.length>0&&(a.unshift(0),i.unshift(s.children))}}const ye={tag_name(e){return typeof e=="function"?t=>E(t)&&e(t.name):e==="*"?E:t=>E(t)&&t.name===e},tag_type(e){return typeof e=="function"?t=>e(t.type):t=>t.type===e},tag_contains(e){return typeof e=="function"?t=>q(t)&&e(t.data):t=>q(t)&&t.data===e}};function nt(e,t){return typeof t=="function"?n=>E(n)&&t(n.attribs[e]):n=>E(n)&&n.attribs[e]===t}function wi(e,t){return n=>e(n)||t(n)}function Yt(e){const t=Object.keys(e).map(n=>{const i=e[n];return Object.prototype.hasOwnProperty.call(ye,n)?ye[n](i):nt(n,i)});return t.length===0?null:t.reduce(wi)}function Li(e,t){const n=Yt(e);return n?n(t):!0}function Si(e,t,n,i=1/0){const a=Yt(e);return a?de(a,t,n,i):[]}function Ti(e,t,n=!0){return Array.isArray(t)||(t=[t]),tt(nt("id",e),t,n)}function J(e,t,n=!0,i=1/0){return de(ye.tag_name(e),t,n,i)}function Mi(e,t,n=!0,i=1/0){return de(nt("class",e),t,n,i)}function xi(e,t,n=!0,i=1/0){return de(ye.tag_type(e),t,n,i)}function Ii(e){let t=e.length;for(;--t>=0;){const n=e[t];if(t>0&&e.lastIndexOf(n,t-1)>=0){e.splice(t,1);continue}for(let i=n.parent;i;i=i.parent)if(e.includes(i)){e.splice(t,1);break}}return e}var B;(function(e){e[e.DISCONNECTED=1]="DISCONNECTED",e[e.PRECEDING=2]="PRECEDING",e[e.FOLLOWING=4]="FOLLOWING",e[e.CONTAINS=8]="CONTAINS",e[e.CONTAINED_BY=16]="CONTAINED_BY"})(B||(B={}));function Zt(e,t){const n=[],i=[];if(e===t)return 0;let a=M(e)?e:e.parent;for(;a;)n.unshift(a),a=a.parent;for(a=M(t)?t:t.parent;a;)i.unshift(a),a=a.parent;const s=Math.min(n.length,i.length);let r=0;for(;r<s&&n[r]===i[r];)r++;if(r===0)return B.DISCONNECTED;const o=n[r-1],c=o.children,l=n[r],p=i[r];return c.indexOf(l)>c.indexOf(p)?o===t?B.FOLLOWING|B.CONTAINED_BY:B.FOLLOWING:o===e?B.PRECEDING|B.CONTAINS:B.PRECEDING}function G(e){return e=e.filter((t,n,i)=>!i.includes(t,n+1)),e.sort((t,n)=>{const i=Zt(t,n);return i&B.PRECEDING?-1:i&B.FOLLOWING?1:0}),e}function Ri(e){const t=Ee(ki,e);return t?t.name==="feed"?Oi(t):Pi(t):null}function Oi(e){var t;const n=e.children,i={type:"atom",items:J("entry",n).map(r=>{var o;const{children:c}=r,l={media:Kt(c)};R(l,"id","id",c),R(l,"title","title",c);const p=(o=Ee("link",c))===null||o===void 0?void 0:o.attribs.href;p&&(l.link=p);const f=F("summary",c)||F("content",c);f&&(l.description=f);const g=F("updated",c);return g&&(l.pubDate=new Date(g)),l})};R(i,"id","id",n),R(i,"title","title",n);const a=(t=Ee("link",n))===null||t===void 0?void 0:t.attribs.href;a&&(i.link=a),R(i,"description","subtitle",n);const s=F("updated",n);return s&&(i.updated=new Date(s)),R(i,"author","email",n,!0),i}function Pi(e){var t,n;const i=(n=(t=Ee("channel",e.children))===null||t===void 0?void 0:t.children)!==null&&n!==void 0?n:[],a={type:e.name.substr(0,3),id:"",items:J("item",e.children).map(r=>{const{children:o}=r,c={media:Kt(o)};R(c,"id","guid",o),R(c,"title","title",o),R(c,"link","link",o),R(c,"description","description",o);const l=F("pubDate",o)||F("dc:date",o);return l&&(c.pubDate=new Date(l)),c})};R(a,"title","title",i),R(a,"link","link",i),R(a,"description","description",i);const s=F("lastBuildDate",i);return s&&(a.updated=new Date(s)),R(a,"author","managingEditor",i,!0),a}const Bi=["url","type","lang"],Ni=["fileSize","bitrate","framerate","samplingrate","channels","duration","height","width"];function Kt(e){return J("media:content",e).map(t=>{const{attribs:n}=t,i={medium:n.medium,isDefault:!!n.isDefault};for(const a of Bi)n[a]&&(i[a]=n[a]);for(const a of Ni)n[a]&&(i[a]=parseInt(n[a],10));return n.expression&&(i.expression=n.expression),i})}function Ee(e,t){return J(e,t,!0,1)[0]}function F(e,t,n=!1){return K(J(e,t,n,1)).trim()}function R(e,t,n,i,a=!1){const s=F(n,i,a);s&&(e[t]=s)}function ki(e){return e==="rss"||e==="feed"||e==="rdf:RDF"}const Ie=Object.freeze(Object.defineProperty({__proto__:null,get DocumentPosition(){return B},append:bi,appendChild:vi,compareDocumentPosition:Zt,existsOne:Wt,filter:de,find:et,findAll:Ci,findOne:tt,findOneChild:Ai,getAttributeValue:hi,getChildren:xe,getElementById:Ti,getElements:Si,getElementsByClassName:Mi,getElementsByTagName:J,getElementsByTagType:xi,getFeed:Ri,getInnerHTML:pi,getName:gi,getOuterHTML:Vt,getParent:qt,getSiblings:jt,getText:me,hasAttrib:fi,hasChildren:M,innerText:be,isCDATA:Me,isComment:Xe,isDocument:Q,isTag:E,isText:q,nextElementSibling:Je,prepend:Ei,prependChild:yi,prevElementSibling:Ge,removeElement:j,removeSubsets:Ii,replaceElement:mi,testElement:Li,textContent:K,uniqueSort:G},Symbol.toStringTag,{value:"Module"}));function Ae(e){const t=e??(this?this.root():[]);let n="";for(let i=0;i<t.length;i++)n+=K(t[i]);return n}function Hi(e,t){if(t===e)return!1;let n=t;for(;n&&n!==n.parent;)if(n=n.parent,n===e)return!0;return!1}function ee(e){return e.cheerio!=null}function Ui(e){return e.replace(/[._-](\w|$)/g,(t,n)=>n.toUpperCase())}function Di(e){return e.replace(/[A-Z]/g,"-$&").toLowerCase()}function T(e,t){const n=e.length;for(let i=0;i<n;i++)t(e[i],i);return e}var $;(function(e){e[e.LowerA=97]="LowerA",e[e.LowerZ=122]="LowerZ",e[e.UpperA=65]="UpperA",e[e.UpperZ=90]="UpperZ",e[e.Exclamation=33]="Exclamation"})($||($={}));function Fi(e){const t=e.indexOf("<");if(t===-1||t>e.length-3)return!1;const n=e.charCodeAt(t+1);return(n>=$.LowerA&&n<=$.LowerZ||n>=$.UpperA&&n<=$.UpperZ||n===$.Exclamation)&&e.includes(">",t+2)}var Be;const ce=(Be=Object.hasOwn)!==null&&Be!==void 0?Be:(e,t)=>Object.prototype.hasOwnProperty.call(e,t),le=/\s+/,$e="data-",it=/^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,zi=/^{[^]*}$|^\[[^]*]$/;function Ce(e,t,n){var i;if(!(!e||!E(e))){if((i=e.attribs)!==null&&i!==void 0||(e.attribs={}),!t)return e.attribs;if(ce(e.attribs,t))return!n&&it.test(t)?t:e.attribs[t];if(e.name==="option"&&t==="value")return Ae(e.children);if(e.name==="input"&&(e.attribs.type==="radio"||e.attribs.type==="checkbox")&&t==="value")return"on"}}function Z(e,t,n){n===null?Qt(e,t):e.attribs[t]=`${n}`}function _i(e,t){if(typeof e=="object"||t!==void 0){if(typeof t=="function"){if(typeof e!="string")throw new Error("Bad combination of arguments.");return T(this,(n,i)=>{E(n)&&Z(n,e,t.call(n,i,n.attribs[e]))})}return T(this,n=>{if(E(n))if(typeof e=="object")for(const i of Object.keys(e)){const a=e[i];Z(n,i,a)}else Z(n,e,t)})}return arguments.length>1?this:Ce(this[0],e,this.options.xmlMode)}function bt(e,t,n){return t in e?e[t]:!n&&it.test(t)?Ce(e,t,!1)!==void 0:Ce(e,t,n)}function Ne(e,t,n,i){t in e?e[t]=n:Z(e,t,!i&&it.test(t)?n?"":null:`${n}`)}function $i(e,t){var n;if(typeof e=="string"&&t===void 0){const i=this[0];if(!i)return;switch(e){case"style":{const a=this.css(),s=Object.keys(a);for(let r=0;r<s.length;r++)a[r]=s[r];return a.length=s.length,a}case"tagName":case"nodeName":return E(i)?i.name.toUpperCase():void 0;case"href":case"src":{if(!E(i))return;const a=(n=i.attribs)===null||n===void 0?void 0:n[e];return typeof URL<"u"&&(e==="href"&&(i.tagName==="a"||i.tagName==="link")||e==="src"&&(i.tagName==="img"||i.tagName==="iframe"||i.tagName==="audio"||i.tagName==="video"||i.tagName==="source"))&&a!==void 0&&this.options.baseURI?new URL(a,this.options.baseURI).href:a}case"innerText":return be(i);case"textContent":return K(i);case"outerHTML":return i.type===Ut?this.html():this.clone().wrap("<container />").parent().html();case"innerHTML":return this.html();default:return E(i)?bt(i,e,this.options.xmlMode):void 0}}if(typeof e=="object"||t!==void 0){if(typeof t=="function"){if(typeof e=="object")throw new TypeError("Bad combination of arguments.");return T(this,(i,a)=>{E(i)&&Ne(i,e,t.call(i,a,bt(i,e,this.options.xmlMode)),this.options.xmlMode)})}return T(this,i=>{if(E(i))if(typeof e=="object")for(const a of Object.keys(e)){const s=e[a];Ne(i,a,s,this.options.xmlMode)}else Ne(i,e,t,this.options.xmlMode)})}}function yt(e,t,n){var i;(i=e.data)!==null&&i!==void 0||(e.data={}),typeof t=="object"?Object.assign(e.data,t):typeof t=="string"&&n!==void 0&&(e.data[t]=n)}function Vi(e){for(const t of Object.keys(e.attribs)){if(!t.startsWith($e))continue;const n=Ui(t.slice($e.length));ce(e.data,n)||(e.data[n]=Xt(e.attribs[t]))}return e.data}function qi(e,t){const n=$e+Di(t),i=e.data;if(ce(i,t))return i[t];if(ce(e.attribs,n))return i[t]=Xt(e.attribs[n])}function Xt(e){if(e==="null")return null;if(e==="true")return!0;if(e==="false")return!1;const t=Number(e);if(e===String(t))return t;if(zi.test(e))try{return JSON.parse(e)}catch{}return e}function ji(e,t){var n;const i=this[0];if(!i||!E(i))return;const a=i;return(n=a.data)!==null&&n!==void 0||(a.data={}),e==null?Vi(a):typeof e=="object"||t!==void 0?(T(this,s=>{E(s)&&(typeof e=="object"?yt(s,e):yt(s,e,t))}),this):qi(a,e)}function Wi(e){const t=arguments.length===0,n=this[0];if(!n||!E(n))return t?void 0:this;switch(n.name){case"textarea":return this.text(e);case"select":{const i=this.find("option:selected");if(!t){if(this.attr("multiple")==null&&typeof e=="object")return this;this.find("option").removeAttr("selected");const a=typeof e=="object"?e:[e];for(const s of a)this.find(`option[value="${s}"]`).attr("selected","");return this}return this.attr("multiple")?i.toArray().map(a=>Ae(a.children)):i.attr("value")}case"input":case"option":return t?this.attr("value"):this.attr("value",e)}}function Qt(e,t){!e.attribs||!ce(e.attribs,t)||delete e.attribs[t]}function we(e){return e?e.trim().split(le):[]}function Yi(e){const t=we(e);for(const n of t)T(this,i=>{E(i)&&Qt(i,n)});return this}function Zi(e){return this.toArray().some(t=>{const n=E(t)&&t.attribs.class;let i=-1;if(n&&e.length>0)for(;(i=n.indexOf(e,i+1))>-1;){const a=i+e.length;if((i===0||le.test(n[i-1]))&&(a===n.length||le.test(n[a])))return!0}return!1})}function Jt(e){if(typeof e=="function")return T(this,(i,a)=>{if(E(i)){const s=i.attribs.class||"";Jt.call([i],e.call(i,a,s))}});if(!e||typeof e!="string")return this;const t=e.split(le),n=this.length;for(let i=0;i<n;i++){const a=this[i];if(!E(a))continue;const s=Ce(a,"class",!1);if(s){let r=` ${s} `;for(const o of t){const c=`${o} `;r.includes(` ${c}`)||(r+=c)}Z(a,"class",r.trim())}else Z(a,"class",t.join(" ").trim())}return this}function Gt(e){if(typeof e=="function")return T(this,(a,s)=>{E(a)&&Gt.call([a],e.call(a,s,a.attribs.class||""))});const t=we(e),n=t.length,i=arguments.length===0;return T(this,a=>{if(E(a))if(i)a.attribs.class="";else{const s=we(a.attribs.class);let r=!1;for(let o=0;o<n;o++){const c=s.indexOf(t[o]);c!==-1&&(s.splice(c,1),r=!0,o--)}r&&(a.attribs.class=s.join(" "))}})}function en(e,t){if(typeof e=="function")return T(this,(r,o)=>{E(r)&&en.call([r],e.call(r,o,r.attribs.class||"",t),t)});if(!e||typeof e!="string")return this;const n=e.split(le),i=n.length,a=typeof t=="boolean"?t?1:-1:0,s=this.length;for(let r=0;r<s;r++){const o=this[r];if(!E(o))continue;const c=we(o.attribs.class);for(let l=0;l<i;l++){const p=c.indexOf(n[l]);a>=0&&p===-1?c.push(n[l]):a<=0&&p!==-1&&c.splice(p,1)}o.attribs.class=c.join(" ")}return this}const Ki=Object.freeze(Object.defineProperty({__proto__:null,addClass:Jt,attr:_i,data:ji,hasClass:Zi,prop:$i,removeAttr:Yi,removeClass:Gt,toggleClass:en,val:Wi},Symbol.toStringTag,{value:"Module"}));var y;(function(e){e.Attribute="attribute",e.Pseudo="pseudo",e.PseudoElement="pseudo-element",e.Tag="tag",e.Universal="universal",e.Adjacent="adjacent",e.Child="child",e.Descendant="descendant",e.Parent="parent",e.Sibling="sibling",e.ColumnCombinator="column-combinator"})(y||(y={}));var I;(function(e){e.Any="any",e.Element="element",e.End="end",e.Equals="equals",e.Exists="exists",e.Hyphen="hyphen",e.Not="not",e.Start="start"})(I||(I={}));const Et=/^[^\\#]?(?:\\(?:[\da-f]{1,6}\s?|.)|[\w\-\u00b0-\uFFFF])+/,Xi=/\\([\da-f]{1,6}\s?|(\s)|.)/gi,Qi=new Map([[126,I.Element],[94,I.Start],[36,I.End],[42,I.Any],[33,I.Not],[124,I.Hyphen]]),Ji=new Set(["has","not","matches","is","where","host","host-context"]);function se(e){switch(e.type){case y.Adjacent:case y.Child:case y.Descendant:case y.Parent:case y.Sibling:case y.ColumnCombinator:return!0;default:return!1}}const Gi=new Set(["contains","icontains"]);function ea(e,t,n){const i=parseInt(t,16)-65536;return i!==i||n?t:i<0?String.fromCharCode(i+65536):String.fromCharCode(i>>10|55296,i&1023|56320)}function ie(e){return e.replace(Xi,ea)}function ke(e){return e===39||e===34}function At(e){return e===32||e===9||e===10||e===12||e===13}function Re(e){const t=[],n=tn(t,`${e}`,0);if(n<e.length)throw new Error(`Unmatched selector: ${e.slice(n)}`);return t}function tn(e,t,n){let i=[];function a(g){const v=t.slice(n+g).match(Et);if(!v)throw new Error(`Expected name, found ${t.slice(n)}`);const[b]=v;return n+=g+b.length,ie(b)}function s(g){for(n+=g;n<t.length&&At(t.charCodeAt(n));)n++}function r(){n+=1;const g=n;let v=1;for(;v>0&&n<t.length;n++)t.charCodeAt(n)===40&&!o(n)?v++:t.charCodeAt(n)===41&&!o(n)&&v--;if(v)throw new Error("Parenthesis not matched");return ie(t.slice(g,n-1))}function o(g){let v=0;for(;t.charCodeAt(--g)===92;)v++;return(v&1)===1}function c(){if(i.length>0&&se(i[i.length-1]))throw new Error("Did not expect successive traversals.")}function l(g){if(i.length>0&&i[i.length-1].type===y.Descendant){i[i.length-1].type=g;return}c(),i.push({type:g})}function p(g,v){i.push({type:y.Attribute,name:g,action:v,value:a(1),namespace:null,ignoreCase:"quirks"})}function f(){if(i.length&&i[i.length-1].type===y.Descendant&&i.pop(),i.length===0)throw new Error("Empty sub-selector");e.push(i)}if(s(0),t.length===n)return n;e:for(;n<t.length;){const g=t.charCodeAt(n);switch(g){case 32:case 9:case 10:case 12:case 13:{(i.length===0||i[0].type!==y.Descendant)&&(c(),i.push({type:y.Descendant})),s(1);break}case 62:{l(y.Child),s(1);break}case 60:{l(y.Parent),s(1);break}case 126:{l(y.Sibling),s(1);break}case 43:{l(y.Adjacent),s(1);break}case 46:{p("class",I.Element);break}case 35:{p("id",I.Equals);break}case 91:{s(1);let v,b=null;t.charCodeAt(n)===124?v=a(1):t.startsWith("*|",n)?(b="*",v=a(2)):(v=a(0),t.charCodeAt(n)===124&&t.charCodeAt(n+1)!==61&&(b=v,v=a(1))),s(0);let S=I.Exists;const P=Qi.get(t.charCodeAt(n));if(P){if(S=P,t.charCodeAt(n+1)!==61)throw new Error("Expected `=`");s(2)}else t.charCodeAt(n)===61&&(S=I.Equals,s(1));let w="",H=null;if(S!=="exists"){if(ke(t.charCodeAt(n))){const Y=t.charCodeAt(n);let k=n+1;for(;k<t.length&&(t.charCodeAt(k)!==Y||o(k));)k+=1;if(t.charCodeAt(k)!==Y)throw new Error("Attribute value didn't end");w=ie(t.slice(n+1,k)),n=k+1}else{const Y=n;for(;n<t.length&&(!At(t.charCodeAt(n))&&t.charCodeAt(n)!==93||o(n));)n+=1;w=ie(t.slice(Y,n))}s(0);const W=t.charCodeAt(n)|32;W===115?(H=!1,s(1)):W===105&&(H=!0,s(1))}if(t.charCodeAt(n)!==93)throw new Error("Attribute selector didn't terminate");n+=1;const ne={type:y.Attribute,name:v,action:S,value:w,namespace:b,ignoreCase:H};i.push(ne);break}case 58:{if(t.charCodeAt(n+1)===58){i.push({type:y.PseudoElement,name:a(2).toLowerCase(),data:t.charCodeAt(n)===40?r():null});continue}const v=a(1).toLowerCase();let b=null;if(t.charCodeAt(n)===40)if(Ji.has(v)){if(ke(t.charCodeAt(n+1)))throw new Error(`Pseudo-selector ${v} cannot be quoted`);if(b=[],n=tn(b,t,n+1),t.charCodeAt(n)!==41)throw new Error(`Missing closing parenthesis in :${v} (${t})`);n+=1}else{if(b=r(),Gi.has(v)){const S=b.charCodeAt(0);S===b.charCodeAt(b.length-1)&&ke(S)&&(b=b.slice(1,-1))}b=ie(b)}i.push({type:y.Pseudo,name:v,data:b});break}case 44:{f(),i=[],s(1);break}default:{if(t.startsWith("/*",n)){const S=t.indexOf("*/",n+2);if(S<0)throw new Error("Comment was not terminated");n=S+2,i.length===0&&s(0);break}let v=null,b;if(g===42)n+=1,b="*";else if(g===124){if(b="",t.charCodeAt(n+1)===124){l(y.ColumnCombinator),s(2);break}}else if(Et.test(t.slice(n)))b=a(0);else break e;t.charCodeAt(n)===124&&t.charCodeAt(n+1)!==124&&(v=b,t.charCodeAt(n+1)===42?(b="*",n+=2):b=a(1)),i.push(b==="*"?{type:y.Universal,namespace:v}:{type:y.Tag,name:b,namespace:v})}}}return f(),n}var He,Ct;function ta(){return Ct||(Ct=1,He={trueFunc:function(){return!0},falseFunc:function(){return!1}}),He}var Le=ta();const C=Ht(Le),nn=new Map([[y.Universal,50],[y.Tag,30],[y.Attribute,1],[y.Pseudo,0]]);function at(e){return!nn.has(e.type)}const na=new Map([[I.Exists,10],[I.Equals,8],[I.Not,7],[I.Start,6],[I.End,6],[I.Any,5]]);function ia(e){const t=e.map(an);for(let n=1;n<e.length;n++){const i=t[n];if(!(i<0))for(let a=n-1;a>=0&&i<t[a];a--){const s=e[a+1];e[a+1]=e[a],e[a]=s,t[a+1]=t[a],t[a]=i}}}function an(e){var t,n;let i=(t=nn.get(e.type))!==null&&t!==void 0?t:-1;return e.type===y.Attribute?(i=(n=na.get(e.action))!==null&&n!==void 0?n:4,e.action===I.Equals&&e.name==="id"&&(i=9),e.ignoreCase&&(i>>=1)):e.type===y.Pseudo&&(e.data?e.name==="has"||e.name==="contains"?i=0:Array.isArray(e.data)?(i=Math.min(...e.data.map(a=>Math.min(...a.map(an)))),i<0&&(i=0)):i=2:i=3),i}const aa=/[-[\]{}()*+?.,\\^$|#\s]/g;function wt(e){return e.replace(aa,"\\$&")}const sa=new Set(["accept","accept-charset","align","alink","axis","bgcolor","charset","checked","clear","codetype","color","compact","declare","defer","dir","direction","disabled","enctype","face","frame","hreflang","http-equiv","lang","language","link","media","method","multiple","nohref","noresize","noshade","nowrap","readonly","rel","rev","rules","scope","scrolling","selected","shape","target","text","type","valign","valuetype","vlink"]);function _(e,t){return typeof e.ignoreCase=="boolean"?e.ignoreCase:e.ignoreCase==="quirks"?!!t.quirksMode:!t.xmlMode&&sa.has(e.name)}const ra={equals(e,t,n){const{adapter:i}=n,{name:a}=t;let{value:s}=t;return _(t,n)?(s=s.toLowerCase(),r=>{const o=i.getAttributeValue(r,a);return o!=null&&o.length===s.length&&o.toLowerCase()===s&&e(r)}):r=>i.getAttributeValue(r,a)===s&&e(r)},hyphen(e,t,n){const{adapter:i}=n,{name:a}=t;let{value:s}=t;const r=s.length;return _(t,n)?(s=s.toLowerCase(),function(c){const l=i.getAttributeValue(c,a);return l!=null&&(l.length===r||l.charAt(r)==="-")&&l.substr(0,r).toLowerCase()===s&&e(c)}):function(c){const l=i.getAttributeValue(c,a);return l!=null&&(l.length===r||l.charAt(r)==="-")&&l.substr(0,r)===s&&e(c)}},element(e,t,n){const{adapter:i}=n,{name:a,value:s}=t;if(/\s/.test(s))return C.falseFunc;const r=new RegExp(`(?:^|\\s)${wt(s)}(?:$|\\s)`,_(t,n)?"i":"");return function(c){const l=i.getAttributeValue(c,a);return l!=null&&l.length>=s.length&&r.test(l)&&e(c)}},exists(e,{name:t},{adapter:n}){return i=>n.hasAttrib(i,t)&&e(i)},start(e,t,n){const{adapter:i}=n,{name:a}=t;let{value:s}=t;const r=s.length;return r===0?C.falseFunc:_(t,n)?(s=s.toLowerCase(),o=>{const c=i.getAttributeValue(o,a);return c!=null&&c.length>=r&&c.substr(0,r).toLowerCase()===s&&e(o)}):o=>{var c;return!!(!((c=i.getAttributeValue(o,a))===null||c===void 0)&&c.startsWith(s))&&e(o)}},end(e,t,n){const{adapter:i}=n,{name:a}=t;let{value:s}=t;const r=-s.length;return r===0?C.falseFunc:_(t,n)?(s=s.toLowerCase(),o=>{var c;return((c=i.getAttributeValue(o,a))===null||c===void 0?void 0:c.substr(r).toLowerCase())===s&&e(o)}):o=>{var c;return!!(!((c=i.getAttributeValue(o,a))===null||c===void 0)&&c.endsWith(s))&&e(o)}},any(e,t,n){const{adapter:i}=n,{name:a,value:s}=t;if(s==="")return C.falseFunc;if(_(t,n)){const r=new RegExp(wt(s),"i");return function(c){const l=i.getAttributeValue(c,a);return l!=null&&l.length>=s.length&&r.test(l)&&e(c)}}return r=>{var o;return!!(!((o=i.getAttributeValue(r,a))===null||o===void 0)&&o.includes(s))&&e(r)}},not(e,t,n){const{adapter:i}=n,{name:a}=t;let{value:s}=t;return s===""?r=>!!i.getAttributeValue(r,a)&&e(r):_(t,n)?(s=s.toLowerCase(),r=>{const o=i.getAttributeValue(r,a);return(o==null||o.length!==s.length||o.toLowerCase()!==s)&&e(r)}):r=>i.getAttributeValue(r,a)!==s&&e(r)}},oa=new Set([9,10,12,13,32]),Lt=48,ca=57;function la(e){if(e=e.trim().toLowerCase(),e==="even")return[2,0];if(e==="odd")return[2,1];let t=0,n=0,i=s(),a=r();if(t<e.length&&e.charAt(t)==="n"&&(t++,n=i*(a??1),o(),t<e.length?(i=s(),o(),a=r()):i=a=0),a===null||t<e.length)throw new Error(`n-th rule couldn't be parsed ('${e}')`);return[n,i*a];function s(){return e.charAt(t)==="-"?(t++,-1):(e.charAt(t)==="+"&&t++,1)}function r(){const c=t;let l=0;for(;t<e.length&&e.charCodeAt(t)>=Lt&&e.charCodeAt(t)<=ca;)l=l*10+(e.charCodeAt(t)-Lt),t++;return t===c?null:l}function o(){for(;t<e.length&&oa.has(e.charCodeAt(t));)t++}}function da(e){const t=e[0],n=e[1]-1;if(n<0&&t<=0)return C.falseFunc;if(t===-1)return s=>s<=n;if(t===0)return s=>s===n;if(t===1)return n<0?C.trueFunc:s=>s>=n;const i=Math.abs(t),a=(n%i+i)%i;return t>1?s=>s>=n&&s%i===a:s=>s<=n&&s%i===a}function fe(e){return da(la(e))}function ge(e,t){return n=>{const i=t.getParent(n);return i!=null&&t.isTag(i)&&e(n)}}const Ve={contains(e,t,{adapter:n}){return function(a){return e(a)&&n.getText(a).includes(t)}},icontains(e,t,{adapter:n}){const i=t.toLowerCase();return function(s){return e(s)&&n.getText(s).toLowerCase().includes(i)}},"nth-child"(e,t,{adapter:n,equals:i}){const a=fe(t);return a===C.falseFunc?C.falseFunc:a===C.trueFunc?ge(e,n):function(r){const o=n.getSiblings(r);let c=0;for(let l=0;l<o.length&&!i(r,o[l]);l++)n.isTag(o[l])&&c++;return a(c)&&e(r)}},"nth-last-child"(e,t,{adapter:n,equals:i}){const a=fe(t);return a===C.falseFunc?C.falseFunc:a===C.trueFunc?ge(e,n):function(r){const o=n.getSiblings(r);let c=0;for(let l=o.length-1;l>=0&&!i(r,o[l]);l--)n.isTag(o[l])&&c++;return a(c)&&e(r)}},"nth-of-type"(e,t,{adapter:n,equals:i}){const a=fe(t);return a===C.falseFunc?C.falseFunc:a===C.trueFunc?ge(e,n):function(r){const o=n.getSiblings(r);let c=0;for(let l=0;l<o.length;l++){const p=o[l];if(i(r,p))break;n.isTag(p)&&n.getName(p)===n.getName(r)&&c++}return a(c)&&e(r)}},"nth-last-of-type"(e,t,{adapter:n,equals:i}){const a=fe(t);return a===C.falseFunc?C.falseFunc:a===C.trueFunc?ge(e,n):function(r){const o=n.getSiblings(r);let c=0;for(let l=o.length-1;l>=0;l--){const p=o[l];if(i(r,p))break;n.isTag(p)&&n.getName(p)===n.getName(r)&&c++}return a(c)&&e(r)}},root(e,t,{adapter:n}){return i=>{const a=n.getParent(i);return(a==null||!n.isTag(a))&&e(i)}},scope(e,t,n,i){const{equals:a}=n;return!i||i.length===0?Ve.root(e,t,n):i.length===1?s=>a(i[0],s)&&e(s):s=>i.includes(s)&&e(s)},hover:Ue("isHovered"),visited:Ue("isVisited"),active:Ue("isActive")};function Ue(e){return function(n,i,{adapter:a}){const s=a[e];return typeof s!="function"?C.falseFunc:function(o){return s(o)&&n(o)}}}const St={empty(e,{adapter:t}){return!t.getChildren(e).some(n=>t.isTag(n)||t.getText(n)!=="")},"first-child"(e,{adapter:t,equals:n}){if(t.prevElementSibling)return t.prevElementSibling(e)==null;const i=t.getSiblings(e).find(a=>t.isTag(a));return i!=null&&n(e,i)},"last-child"(e,{adapter:t,equals:n}){const i=t.getSiblings(e);for(let a=i.length-1;a>=0;a--){if(n(e,i[a]))return!0;if(t.isTag(i[a]))break}return!1},"first-of-type"(e,{adapter:t,equals:n}){const i=t.getSiblings(e),a=t.getName(e);for(let s=0;s<i.length;s++){const r=i[s];if(n(e,r))return!0;if(t.isTag(r)&&t.getName(r)===a)break}return!1},"last-of-type"(e,{adapter:t,equals:n}){const i=t.getSiblings(e),a=t.getName(e);for(let s=i.length-1;s>=0;s--){const r=i[s];if(n(e,r))return!0;if(t.isTag(r)&&t.getName(r)===a)break}return!1},"only-of-type"(e,{adapter:t,equals:n}){const i=t.getName(e);return t.getSiblings(e).every(a=>n(e,a)||!t.isTag(a)||t.getName(a)!==i)},"only-child"(e,{adapter:t,equals:n}){return t.getSiblings(e).every(i=>n(e,i)||!t.isTag(i))}};function Tt(e,t,n,i){if(n===null){if(e.length>i)throw new Error(`Pseudo-class :${t} requires an argument`)}else if(e.length===i)throw new Error(`Pseudo-class :${t} doesn't have any arguments`)}const ua={"any-link":":is(a, area, link)[href]",link:":any-link:not(:visited)",disabled:`:is(
        :is(button, input, select, textarea, optgroup, option)[disabled],
        optgroup[disabled] > option,
        fieldset[disabled]:not(fieldset[disabled] legend:first-of-type *)
    )`,enabled:":not(:disabled)",checked:":is(:is(input[type=radio], input[type=checkbox])[checked], option:selected)",required:":is(input, select, textarea)[required]",optional:":is(input, select, textarea):not([required])",selected:"option:is([selected], select:not([multiple]):not(:has(> option[selected])) > :first-of-type)",checkbox:"[type=checkbox]",file:"[type=file]",password:"[type=password]",radio:"[type=radio]",reset:"[type=reset]",image:"[type=image]",submit:"[type=submit]",parent:":not(:empty)",header:":is(h1, h2, h3, h4, h5, h6)",button:":is(button, input[type=button])",input:":is(input, textarea, select, button)",text:"input:is(:not([type!='']), [type=text])"},sn={};function pa(e,t){return e===C.falseFunc?C.falseFunc:n=>t.isTag(n)&&e(n)}function rn(e,t){const n=t.getSiblings(e);if(n.length<=1)return[];const i=n.indexOf(e);return i<0||i===n.length-1?[]:n.slice(i+1).filter(t.isTag)}function qe(e){return{xmlMode:!!e.xmlMode,lowerCaseAttributeNames:!!e.lowerCaseAttributeNames,lowerCaseTags:!!e.lowerCaseTags,quirksMode:!!e.quirksMode,cacheResults:!!e.cacheResults,pseudos:e.pseudos,adapter:e.adapter,equals:e.equals}}const De=(e,t,n,i,a)=>{const s=a(t,qe(n),i);return s===C.trueFunc?e:s===C.falseFunc?C.falseFunc:r=>s(r)&&e(r)},Fe={is:De,matches:De,where:De,not(e,t,n,i,a){const s=a(t,qe(n),i);return s===C.falseFunc?e:s===C.trueFunc?C.falseFunc:r=>!s(r)&&e(r)},has(e,t,n,i,a){const{adapter:s}=n,r=qe(n);r.relativeSelector=!0;const o=t.some(p=>p.some(at))?[sn]:void 0,c=a(t,r,o);if(c===C.falseFunc)return C.falseFunc;const l=pa(c,s);if(o&&c!==C.trueFunc){const{shouldTestNextSiblings:p=!1}=c;return f=>{if(!e(f))return!1;o[0]=f;const g=s.getChildren(f),v=p?[...g,...rn(f,s)]:g;return s.existsOne(l,v)}}return p=>e(p)&&s.existsOne(l,s.getChildren(p))}};function ha(e,t,n,i,a){var s;const{name:r,data:o}=t;if(Array.isArray(o)){if(!(r in Fe))throw new Error(`Unknown pseudo-class :${r}(${o})`);return Fe[r](e,o,n,i,a)}const c=(s=n.pseudos)===null||s===void 0?void 0:s[r],l=typeof c=="string"?c:ua[r];if(typeof l=="string"){if(o!=null)throw new Error(`Pseudo ${r} doesn't have any arguments`);const p=Re(l);return Fe.is(e,p,n,i,a)}if(typeof c=="function")return Tt(c,r,o,1),p=>c(p,o)&&e(p);if(r in Ve)return Ve[r](e,o,n,i);if(r in St){const p=St[r];return Tt(p,r,o,2),f=>p(f,n,o)&&e(f)}throw new Error(`Unknown pseudo-class :${r}`)}function ze(e,t){const n=t.getParent(e);return n&&t.isTag(n)?n:null}function fa(e,t,n,i,a){const{adapter:s,equals:r}=n;switch(t.type){case y.PseudoElement:throw new Error("Pseudo-elements are not supported by css-select");case y.ColumnCombinator:throw new Error("Column combinators are not yet supported by css-select");case y.Attribute:{if(t.namespace!=null)throw new Error("Namespaced attributes are not yet supported by css-select");return(!n.xmlMode||n.lowerCaseAttributeNames)&&(t.name=t.name.toLowerCase()),ra[t.action](e,t,n)}case y.Pseudo:return ha(e,t,n,i,a);case y.Tag:{if(t.namespace!=null)throw new Error("Namespaced tag names are not yet supported by css-select");let{name:o}=t;return(!n.xmlMode||n.lowerCaseTags)&&(o=o.toLowerCase()),function(l){return s.getName(l)===o&&e(l)}}case y.Descendant:{if(n.cacheResults===!1||typeof WeakSet>"u")return function(l){let p=l;for(;p=ze(p,s);)if(e(p))return!0;return!1};const o=new WeakSet;return function(l){let p=l;for(;p=ze(p,s);)if(!o.has(p)){if(s.isTag(p)&&e(p))return!0;o.add(p)}return!1}}case"_flexibleDescendant":return function(c){let l=c;do if(e(l))return!0;while(l=ze(l,s));return!1};case y.Parent:return function(c){return s.getChildren(c).some(l=>s.isTag(l)&&e(l))};case y.Child:return function(c){const l=s.getParent(c);return l!=null&&s.isTag(l)&&e(l)};case y.Sibling:return function(c){const l=s.getSiblings(c);for(let p=0;p<l.length;p++){const f=l[p];if(r(c,f))break;if(s.isTag(f)&&e(f))return!0}return!1};case y.Adjacent:return s.prevElementSibling?function(c){const l=s.prevElementSibling(c);return l!=null&&e(l)}:function(c){const l=s.getSiblings(c);let p;for(let f=0;f<l.length;f++){const g=l[f];if(r(c,g))break;s.isTag(g)&&(p=g)}return!!p&&e(p)};case y.Universal:{if(t.namespace!=null&&t.namespace!=="*")throw new Error("Namespaced universal selectors are not yet supported by css-select");return e}}}function on(e){return e.type===y.Pseudo&&(e.name==="scope"||Array.isArray(e.data)&&e.data.some(t=>t.some(on)))}const ga={type:y.Descendant},ma={type:"_flexibleDescendant"},va={type:y.Pseudo,name:"scope",data:null};function ba(e,{adapter:t},n){const i=!!n?.every(a=>{const s=t.isTag(a)&&t.getParent(a);return a===sn||s&&t.isTag(s)});for(const a of e){if(!(a.length>0&&at(a[0])&&a[0].type!==y.Descendant))if(i&&!a.some(on))a.unshift(ga);else continue;a.unshift(va)}}function cn(e,t,n){var i;e.forEach(ia),n=(i=t.context)!==null&&i!==void 0?i:n;const a=Array.isArray(n),s=n&&(Array.isArray(n)?n:[n]);if(t.relativeSelector!==!1)ba(e,t,s);else if(e.some(c=>c.length>0&&at(c[0])))throw new Error("Relative selectors are not allowed when the `relativeSelector` option is disabled");let r=!1;const o=e.map(c=>{if(c.length>=2){const[l,p]=c;l.type!==y.Pseudo||l.name!=="scope"||(a&&p.type===y.Descendant?c[1]=ma:(p.type===y.Adjacent||p.type===y.Sibling)&&(r=!0))}return ya(c,t,s)}).reduce(Ea,C.falseFunc);return o.shouldTestNextSiblings=r,o}function ya(e,t,n){var i;return e.reduce((a,s)=>a===C.falseFunc?C.falseFunc:fa(a,s,t,n,cn),(i=t.rootFunc)!==null&&i!==void 0?i:C.trueFunc)}function Ea(e,t){return t===C.falseFunc||e===C.trueFunc?e:e===C.falseFunc||t===C.trueFunc?t:function(i){return e(i)||t(i)}}const ln=(e,t)=>e===t,Aa={adapter:Ie,equals:ln};function Ca(e){var t,n,i,a;const s=e??Aa;return(t=s.adapter)!==null&&t!==void 0||(s.adapter=Ie),(n=s.equals)!==null&&n!==void 0||(s.equals=(a=(i=s.adapter)===null||i===void 0?void 0:i.equals)!==null&&a!==void 0?a:ln),s}function wa(e){return function(n,i,a){const s=Ca(i);return e(n,s,a)}}const st=wa(cn);function dn(e,t,n=!1){return n&&(e=La(e,t)),Array.isArray(e)?t.removeSubsets(e):t.getChildren(e)}function La(e,t){const n=Array.isArray(e)?e.slice(0):[e],i=n.length;for(let a=0;a<i;a++){const s=rn(n[a],t);n.push(...s)}return n}const Sa=new Set(["first","last","eq","gt","nth","lt","even","odd"]);function Se(e){return e.type!=="pseudo"?!1:Sa.has(e.name)?!0:e.name==="not"&&Array.isArray(e.data)?e.data.some(t=>t.some(Se)):!1}function Ta(e,t,n){const i=t!=null?parseInt(t,10):NaN;switch(e){case"first":return 1;case"nth":case"eq":return isFinite(i)?i>=0?i+1:1/0:0;case"lt":return isFinite(i)?i>=0?Math.min(i,n):1/0:0;case"gt":return isFinite(i)?1/0:0;case"odd":return 2*n;case"even":return 2*n-1;case"last":case"not":return 1/0}}function Ma(e){for(;e.parent;)e=e.parent;return e}function rt(e){const t=[],n=[];for(const i of e)i.some(Se)?t.push(i):n.push(i);return[n,t]}const xa={type:y.Universal,namespace:null},Ia={type:y.Pseudo,name:"scope",data:null};function un(e,t,n={}){return pn([e],t,n)}function pn(e,t,n={}){if(typeof t=="function")return e.some(t);const[i,a]=rt(Re(t));return i.length>0&&e.some(st(i,n))||a.some(s=>gn(s,e,n).length>0)}function Ra(e,t,n,i){const a=typeof n=="string"?parseInt(n,10):NaN;switch(e){case"first":case"lt":return t;case"last":return t.length>0?[t[t.length-1]]:t;case"nth":case"eq":return isFinite(a)&&Math.abs(a)<t.length?[a<0?t[t.length+a]:t[a]]:[];case"gt":return isFinite(a)?t.slice(a+1):[];case"even":return t.filter((s,r)=>r%2===0);case"odd":return t.filter((s,r)=>r%2===1);case"not":{const s=new Set(fn(n,t,i));return t.filter(r=>!s.has(r))}}}function hn(e,t,n={}){return fn(Re(e),t,n)}function fn(e,t,n){if(t.length===0)return[];const[i,a]=rt(e);let s;if(i.length){const r=We(t,i,n);if(a.length===0)return r;r.length&&(s=new Set(r))}for(let r=0;r<a.length&&s?.size!==t.length;r++){const o=a[r];if((s?t.filter(p=>E(p)&&!s.has(p)):t).length===0)break;const l=gn(o,t,n);if(l.length)if(s)l.forEach(p=>s.add(p));else{if(r===a.length-1)return l;s=new Set(l)}}return typeof s<"u"?s.size===t.length?t:t.filter(r=>s.has(r)):[]}function gn(e,t,n){var i;if(e.some(se)){const a=(i=n.root)!==null&&i!==void 0?i:Ma(t[0]),s={...n,context:t,relativeSelector:!1};return e.push(Ia),Te(a,e,s,!0,t.length)}return Te(t,e,n,!1,t.length)}function Oa(e,t,n={},i=1/0){if(typeof e=="function")return mn(t,e);const[a,s]=rt(Re(e)),r=s.map(o=>Te(t,o,n,!0,i));return a.length&&r.push(je(t,a,n,i)),r.length===0?[]:r.length===1?r[0]:G(r.reduce((o,c)=>[...o,...c]))}function Te(e,t,n,i,a){const s=t.findIndex(Se),r=t.slice(0,s),o=t[s],c=t.length-1===s?a:1/0,l=Ta(o.name,o.data,c);if(l===0)return[];const f=(r.length===0&&!Array.isArray(e)?xe(e).filter(E):r.length===0?(Array.isArray(e)?e:[e]).filter(E):i||r.some(se)?je(e,[r],n,l):We(e,[r],n)).slice(0,l);let g=Ra(o.name,f,o.data,n);if(g.length===0||t.length===s+1)return g;const v=t.slice(s+1),b=v.some(se);if(b){if(se(v[0])){const{type:S}=v[0];(S===y.Sibling||S===y.Adjacent)&&(g=dn(g,Ie,!0)),v.unshift(xa)}n={...n,relativeSelector:!1,rootFunc:S=>g.includes(S)}}else n.rootFunc&&n.rootFunc!==Le.trueFunc&&(n={...n,rootFunc:Le.trueFunc});return v.some(Se)?Te(g,v,n,!1,a):b?je(g,[v],n,a):We(g,[v],n)}function je(e,t,n,i){const a=st(t,n,e);return mn(e,a,i)}function mn(e,t,n=1/0){const i=dn(e,Ie,t.shouldTestNextSiblings);return et(a=>E(a)&&t(a),i,!0,n)}function We(e,t,n){const i=(Array.isArray(e)?e:[e]).filter(E);if(i.length===0)return i;const a=st(t,n);return a===Le.trueFunc?i:i.filter(a)}const Pa=/^\s*[+~]/;function Ba(e){if(!e)return this._make([]);if(typeof e!="string"){const t=ee(e)?e.toArray():[e],n=this.toArray();return this._make(t.filter(i=>n.some(a=>Hi(a,i))))}return this._findBySelector(e,Number.POSITIVE_INFINITY)}function Na(e,t){var n;const i=this.toArray(),a=Pa.test(e)?i:this.children().toArray(),s={context:i,root:(n=this._root)===null||n===void 0?void 0:n[0],xmlMode:this.options.xmlMode,lowerCaseTags:this.options.lowerCaseTags,lowerCaseAttributeNames:this.options.lowerCaseAttributeNames,pseudos:this.options.pseudos,quirksMode:this.options.quirksMode};return this._make(Oa(e,a,s,t))}function ot(e){return function(t,...n){return function(i){var a;let s=e(t,this);return i&&(s=dt(s,i,this.options.xmlMode,(a=this._root)===null||a===void 0?void 0:a[0])),this._make(this.length>1&&s.length>1?n.reduce((r,o)=>o(r),s):s)}}}const ue=ot((e,t)=>{let n=[];for(let i=0;i<t.length;i++){const a=e(t[i]);a.length>0&&(n=n.concat(a))}return n}),ct=ot((e,t)=>{const n=[];for(let i=0;i<t.length;i++){const a=e(t[i]);a!==null&&n.push(a)}return n});function lt(e,...t){let n=null;const i=ot((a,s)=>{const r=[];return T(s,o=>{for(let c;(c=a(o))&&!n?.(c,r.length);o=c)r.push(c)}),r})(e,...t);return function(a,s){n=typeof a=="string"?o=>un(o,a,this.options):a?pe(a):null;const r=i.call(this,s);return n=null,r}}function te(e){return e.length>1?Array.from(new Set(e)):e}const ka=ct(({parent:e})=>e&&!Q(e)?e:null,te),Ha=ue(e=>{const t=[];for(;e.parent&&!Q(e.parent);)t.push(e.parent),e=e.parent;return t},G,e=>e.reverse()),Ua=lt(({parent:e})=>e&&!Q(e)?e:null,G,e=>e.reverse());function Da(e){var t;const n=[];if(!e)return this._make(n);const i={xmlMode:this.options.xmlMode,root:(t=this._root)===null||t===void 0?void 0:t[0]},a=typeof e=="string"?s=>un(s,e,i):pe(e);return T(this,s=>{for(s&&!Q(s)&&!E(s)&&(s=s.parent);s&&E(s);){if(a(s,0)){n.includes(s)||n.push(s);break}s=s.parent}}),this._make(n)}const Fa=ct(e=>Je(e)),za=ue(e=>{const t=[];for(;e.next;)e=e.next,E(e)&&t.push(e);return t},te),_a=lt(e=>Je(e),te),$a=ct(e=>Ge(e)),Va=ue(e=>{const t=[];for(;e.prev;)e=e.prev,E(e)&&t.push(e);return t},te),qa=lt(e=>Ge(e),te),ja=ue(e=>jt(e).filter(t=>E(t)&&t!==e),G),Wa=ue(e=>xe(e).filter(E),te);function Ya(){const e=this.toArray().reduce((t,n)=>M(n)?t.concat(n.children):t,[]);return this._make(e)}function Za(e){let t=0;const n=this.length;for(;t<n&&e.call(this[t],t,this[t])!==!1;)++t;return this}function Ka(e){let t=[];for(let n=0;n<this.length;n++){const i=this[n],a=e.call(i,n,i);a!=null&&(t=t.concat(a))}return this._make(t)}function pe(e){return typeof e=="function"?(t,n)=>e.call(t,n,t):ee(e)?t=>Array.prototype.includes.call(e,t):function(t){return e===t}}function Xa(e){var t;return this._make(dt(this.toArray(),e,this.options.xmlMode,(t=this._root)===null||t===void 0?void 0:t[0]))}function dt(e,t,n,i){return typeof t=="string"?hn(t,e,{xmlMode:n,root:i}):e.filter(pe(t))}function Qa(e){const t=this.toArray();return typeof e=="string"?pn(t.filter(E),e,this.options):e?t.some(pe(e)):!1}function Ja(e){let t=this.toArray();if(typeof e=="string"){const n=new Set(hn(e,t,this.options));t=t.filter(i=>!n.has(i))}else{const n=pe(e);t=t.filter((i,a)=>!n(i,a))}return this._make(t)}function Ga(e){return this.filter(typeof e=="string"?`:has(${e})`:(t,n)=>this._make(n).find(e).length>0)}function es(){return this.length>1?this._make(this[0]):this}function ts(){return this.length>0?this._make(this[this.length-1]):this}function ns(e){var t;return e=+e,e===0&&this.length<=1?this:(e<0&&(e=this.length+e),this._make((t=this[e])!==null&&t!==void 0?t:[]))}function is(e){return e==null?this.toArray():this[e<0?this.length+e:e]}function as(){return Array.prototype.slice.call(this)}function ss(e){let t,n;return e==null?(t=this.parent().children(),n=this[0]):typeof e=="string"?(t=this._make(e),n=this[0]):(t=this,n=ee(e)?e[0]:e),Array.prototype.indexOf.call(t,n)}function rs(e,t){return this._make(Array.prototype.slice.call(this,e,t))}function os(){var e;return(e=this.prevObject)!==null&&e!==void 0?e:this._make([])}function cs(e,t){const n=this._make(e,t),i=G([...this.get(),...n.get()]);return this._make(i)}function ls(e){return this.prevObject?this.add(e?this.prevObject.filter(e):this.prevObject):this}const ds=Object.freeze(Object.defineProperty({__proto__:null,_findBySelector:Na,add:cs,addBack:ls,children:Wa,closest:Da,contents:Ya,each:Za,end:os,eq:ns,filter:Xa,filterArray:dt,find:Ba,first:es,get:is,has:Ga,index:ss,is:Qa,last:ts,map:Ka,next:Fa,nextAll:za,nextUntil:_a,not:Ja,parent:ka,parents:Ha,parentsUntil:Ua,prev:$a,prevAll:Va,prevUntil:qa,siblings:ja,slice:rs,toArray:as},Symbol.toStringTag,{value:"Module"}));function X(e,t){const n=Array.isArray(e)?e:[e];t?t.children=n:t=null;for(let i=0;i<n.length;i++){const a=n[i];a.parent&&a.parent.children!==n&&j(a),t?(a.prev=n[i-1]||null,a.next=n[i+1]||null):a.prev=a.next=null,a.parent=t}return t}function us(e,t){if(e==null)return[];if(typeof e=="string")return this._parse(e,this.options,!1,null).children.slice(0);if("length"in e){if(e.length===1)return this._makeDomArray(e[0],t);const n=[];for(let i=0;i<e.length;i++){const a=e[i];if(typeof a=="object"){if(a==null)continue;if(!("length"in a)){n.push(t?oe(a,!0):a);continue}}n.push(...this._makeDomArray(a,t))}return n}return[t?oe(e,!0):e]}function vn(e){return function(...t){const n=this.length-1;return T(this,(i,a)=>{if(!M(i))return;const s=typeof t[0]=="function"?t[0].call(i,a,this._render(i.children)):t,r=this._makeDomArray(s,a<n);e(r,i.children,i)})}}function z(e,t,n,i,a){var s,r;const o=[t,n,...i],c=t===0?null:e[t-1],l=t+n>=e.length?null:e[t+n];for(let p=0;p<i.length;++p){const f=i[p],g=f.parent;if(g){const b=g.children.indexOf(f);b!==-1&&(g.children.splice(b,1),a===g&&t>b&&o[0]--)}f.parent=a,f.prev&&(f.prev.next=(s=f.next)!==null&&s!==void 0?s:null),f.next&&(f.next.prev=(r=f.prev)!==null&&r!==void 0?r:null),f.prev=p===0?c:i[p-1],f.next=p===i.length-1?l:i[p+1]}return c&&(c.next=i[0]),l&&(l.prev=i[i.length-1]),e.splice(...o)}function ps(e){return(ee(e)?e:this._make(e)).append(this),this}function hs(e){return(ee(e)?e:this._make(e)).prepend(this),this}const fs=vn((e,t,n)=>{z(t,t.length,0,e,n)}),gs=vn((e,t,n)=>{z(t,0,0,e,n)});function bn(e){return function(t){const n=this.length-1,i=this.parents().last();for(let a=0;a<this.length;a++){const s=this[a],r=typeof t=="function"?t.call(s,a,s):typeof t=="string"&&!Fi(t)?i.find(t).clone():t,[o]=this._makeDomArray(r,a<n);if(!o||!M(o))continue;let c=o,l=0;for(;l<c.children.length;){const p=c.children[l];E(p)?(c=p,l=0):l++}e(s,c,[o])}return this}}const ms=bn((e,t,n)=>{const{parent:i}=e;if(!i)return;const a=i.children,s=a.indexOf(e);X([e],t),z(a,s,0,n,i)}),vs=bn((e,t,n)=>{M(e)&&(X(e.children,t),X(n,e))});function bs(e){return this.parent(e).not("body").each((t,n)=>{this._make(n).replaceWith(n.children)}),this}function ys(e){const t=this[0];if(t){const n=this._make(typeof e=="function"?e.call(t,0,t):e).insertBefore(t);let i;for(let s=0;s<n.length;s++)n[s].type===_e&&(i=n[s]);let a=0;for(;i&&a<i.children.length;){const s=i.children[a];s.type===_e?(i=s,a=0):a++}i&&this._make(i).append(this)}return this}function Es(...e){const t=this.length-1;return T(this,(n,i)=>{if(!M(n)||!n.parent)return;const a=n.parent.children,s=a.indexOf(n);if(s===-1)return;const r=typeof e[0]=="function"?e[0].call(n,i,this._render(n.children)):e,o=this._makeDomArray(r,i<t);z(a,s+1,0,o,n.parent)})}function As(e){typeof e=="string"&&(e=this._make(e)),this.remove();const t=[];for(const n of this._makeDomArray(e)){const i=this.clone().toArray(),{parent:a}=n;if(!a)continue;const s=a.children,r=s.indexOf(n);r!==-1&&(z(s,r+1,0,i,a),t.push(...i))}return this._make(t)}function Cs(...e){const t=this.length-1;return T(this,(n,i)=>{if(!M(n)||!n.parent)return;const a=n.parent.children,s=a.indexOf(n);if(s===-1)return;const r=typeof e[0]=="function"?e[0].call(n,i,this._render(n.children)):e,o=this._makeDomArray(r,i<t);z(a,s,0,o,n.parent)})}function ws(e){const t=this._make(e);this.remove();const n=[];return T(t,i=>{const a=this.clone().toArray(),{parent:s}=i;if(!s)return;const r=s.children,o=r.indexOf(i);o!==-1&&(z(r,o,0,a,s),n.push(...a))}),this._make(n)}function Ls(e){const t=e?this.filter(e):this;return T(t,n=>{j(n),n.prev=n.next=n.parent=null}),this}function Ss(e){return T(this,(t,n)=>{const{parent:i}=t;if(!i)return;const a=i.children,s=typeof e=="function"?e.call(t,n,t):e,r=this._makeDomArray(s);X(r,null);const o=a.indexOf(t);z(a,o,1,r,i),r.includes(t)||(t.parent=t.prev=t.next=null)})}function Ts(){return T(this,e=>{if(M(e)){for(const t of e.children)t.next=t.prev=t.parent=null;e.children.length=0}})}function Ms(e){if(e===void 0){const t=this[0];return!t||!M(t)?null:this._render(t.children)}return T(this,t=>{if(!M(t))return;for(const i of t.children)i.next=i.prev=i.parent=null;const n=ee(e)?e.toArray():this._parse(`${e}`,this.options,!1,t).children;X(n,t)})}function xs(){return this._render(this)}function Is(e){return e===void 0?Ae(this):typeof e=="function"?T(this,(t,n)=>this._make(t).text(e.call(t,n,Ae([t])))):T(this,t=>{if(!M(t))return;for(const i of t.children)i.next=i.prev=i.parent=null;const n=new Ft(`${e}`);X(n,t)})}function Rs(){const e=Array.prototype.map.call(this.get(),n=>oe(n,!0)),t=new zt(e);for(const n of e)n.parent=t;return this._make(e)}const Os=Object.freeze(Object.defineProperty({__proto__:null,_makeDomArray:us,after:Es,append:fs,appendTo:ps,before:Cs,clone:Rs,empty:Ts,html:Ms,insertAfter:As,insertBefore:ws,prepend:gs,prependTo:hs,remove:Ls,replaceWith:Ss,text:Is,toString:xs,unwrap:bs,wrap:ms,wrapAll:ys,wrapInner:vs},Symbol.toStringTag,{value:"Module"}));function Ps(e,t){if(e!=null&&t!=null||typeof e=="object"&&!Array.isArray(e))return T(this,(n,i)=>{E(n)&&yn(n,e,t,i)});if(this.length!==0)return En(this[0],e)}function yn(e,t,n,i){if(typeof t=="string"){const a=En(e),s=typeof n=="function"?n.call(e,i,a[t]):n;s===""?delete a[t]:s!=null&&(a[t]=s),e.attribs.style=Bs(a)}else if(typeof t=="object"){const a=Object.keys(t);for(let s=0;s<a.length;s++){const r=a[s];yn(e,r,t[r],s)}}}function En(e,t){if(!e||!E(e))return;const n=Ns(e.attribs.style);if(typeof t=="string")return n[t];if(Array.isArray(t)){const i={};for(const a of t)n[a]!=null&&(i[a]=n[a]);return i}return n}function Bs(e){return Object.keys(e).reduce((t,n)=>`${t}${t?" ":""}${n}: ${e[n]};`,"")}function Ns(e){if(e=(e||"").trim(),!e)return{};const t={};let n;for(const i of e.split(";")){const a=i.indexOf(":");if(a<1||a===i.length-1){const s=i.trimEnd();s.length>0&&n!==void 0&&(t[n]+=`;${s}`)}else n=i.slice(0,a).trim(),t[n]=i.slice(a+1).trim()}return t}const ks=Object.freeze(Object.defineProperty({__proto__:null,css:Ps},Symbol.toStringTag,{value:"Module"})),Mt="input,select,textarea,keygen",Hs=/%20/g,xt=/\r?\n/g;function Us(){return this.serializeArray().map(n=>`${encodeURIComponent(n.name)}=${encodeURIComponent(n.value)}`).join("&").replace(Hs,"+")}function Ds(){return this.map((e,t)=>{const n=this._make(t);return E(t)&&t.name==="form"?n.find(Mt).toArray():n.filter(Mt).toArray()}).filter('[name!=""]:enabled:not(:submit, :button, :image, :reset, :file):matches([checked], :not(:checkbox, :radio))').map((e,t)=>{var n;const i=this._make(t),a=i.attr("name"),s=(n=i.val())!==null&&n!==void 0?n:"";return Array.isArray(s)?s.map(r=>({name:a,value:r.replace(xt,`\r
`)})):{name:a,value:s.replace(xt,`\r
`)}}).toArray()}const Fs=Object.freeze(Object.defineProperty({__proto__:null,serialize:Us,serializeArray:Ds},Symbol.toStringTag,{value:"Module"}));function zs(e){var t;return typeof e=="string"?{selector:e,value:"textContent"}:{selector:e.selector,value:(t=e.value)!==null&&t!==void 0?t:"textContent"}}function _s(e){const t={};for(const n in e){const i=e[n],a=Array.isArray(i),{selector:s,value:r}=zs(a?i[0]:i),o=typeof r=="function"?r:typeof r=="string"?c=>this._make(c).prop(r):c=>this._make(c).extract(r);if(a)t[n]=this._findBySelector(s,Number.POSITIVE_INFINITY).map((c,l)=>o(l,n,t)).get();else{const c=this._findBySelector(s,1);t[n]=c.length>0?o(c[0],n,t):void 0}}return t}const $s=Object.freeze(Object.defineProperty({__proto__:null,extract:_s},Symbol.toStringTag,{value:"Module"}));class Oe{constructor(t,n,i){if(this.length=0,this.options=i,this._root=n,t){for(let a=0;a<t.length;a++)this[a]=t[a];this.length=t.length}}}Oe.prototype.cheerio="[cheerio object]";Oe.prototype.splice=Array.prototype.splice;Oe.prototype[Symbol.iterator]=Array.prototype[Symbol.iterator];Object.assign(Oe.prototype,Ki,ds,Os,ks,Fs,$s);var It;(function(e){e[e.EOF=-1]="EOF",e[e.NULL=0]="NULL",e[e.TABULATION=9]="TABULATION",e[e.CARRIAGE_RETURN=13]="CARRIAGE_RETURN",e[e.LINE_FEED=10]="LINE_FEED",e[e.FORM_FEED=12]="FORM_FEED",e[e.SPACE=32]="SPACE",e[e.EXCLAMATION_MARK=33]="EXCLAMATION_MARK",e[e.QUOTATION_MARK=34]="QUOTATION_MARK",e[e.AMPERSAND=38]="AMPERSAND",e[e.APOSTROPHE=39]="APOSTROPHE",e[e.HYPHEN_MINUS=45]="HYPHEN_MINUS",e[e.SOLIDUS=47]="SOLIDUS",e[e.DIGIT_0=48]="DIGIT_0",e[e.DIGIT_9=57]="DIGIT_9",e[e.SEMICOLON=59]="SEMICOLON",e[e.LESS_THAN_SIGN=60]="LESS_THAN_SIGN",e[e.EQUALS_SIGN=61]="EQUALS_SIGN",e[e.GREATER_THAN_SIGN=62]="GREATER_THAN_SIGN",e[e.QUESTION_MARK=63]="QUESTION_MARK",e[e.LATIN_CAPITAL_A=65]="LATIN_CAPITAL_A",e[e.LATIN_CAPITAL_Z=90]="LATIN_CAPITAL_Z",e[e.RIGHT_SQUARE_BRACKET=93]="RIGHT_SQUARE_BRACKET",e[e.GRAVE_ACCENT=96]="GRAVE_ACCENT",e[e.LATIN_SMALL_A=97]="LATIN_SMALL_A",e[e.LATIN_SMALL_Z=122]="LATIN_SMALL_Z"})(It||(It={}));var Rt;(function(e){e.controlCharacterInInputStream="control-character-in-input-stream",e.noncharacterInInputStream="noncharacter-in-input-stream",e.surrogateInInputStream="surrogate-in-input-stream",e.nonVoidHtmlElementStartTagWithTrailingSolidus="non-void-html-element-start-tag-with-trailing-solidus",e.endTagWithAttributes="end-tag-with-attributes",e.endTagWithTrailingSolidus="end-tag-with-trailing-solidus",e.unexpectedSolidusInTag="unexpected-solidus-in-tag",e.unexpectedNullCharacter="unexpected-null-character",e.unexpectedQuestionMarkInsteadOfTagName="unexpected-question-mark-instead-of-tag-name",e.invalidFirstCharacterOfTagName="invalid-first-character-of-tag-name",e.unexpectedEqualsSignBeforeAttributeName="unexpected-equals-sign-before-attribute-name",e.missingEndTagName="missing-end-tag-name",e.unexpectedCharacterInAttributeName="unexpected-character-in-attribute-name",e.unknownNamedCharacterReference="unknown-named-character-reference",e.missingSemicolonAfterCharacterReference="missing-semicolon-after-character-reference",e.unexpectedCharacterAfterDoctypeSystemIdentifier="unexpected-character-after-doctype-system-identifier",e.unexpectedCharacterInUnquotedAttributeValue="unexpected-character-in-unquoted-attribute-value",e.eofBeforeTagName="eof-before-tag-name",e.eofInTag="eof-in-tag",e.missingAttributeValue="missing-attribute-value",e.missingWhitespaceBetweenAttributes="missing-whitespace-between-attributes",e.missingWhitespaceAfterDoctypePublicKeyword="missing-whitespace-after-doctype-public-keyword",e.missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers="missing-whitespace-between-doctype-public-and-system-identifiers",e.missingWhitespaceAfterDoctypeSystemKeyword="missing-whitespace-after-doctype-system-keyword",e.missingQuoteBeforeDoctypePublicIdentifier="missing-quote-before-doctype-public-identifier",e.missingQuoteBeforeDoctypeSystemIdentifier="missing-quote-before-doctype-system-identifier",e.missingDoctypePublicIdentifier="missing-doctype-public-identifier",e.missingDoctypeSystemIdentifier="missing-doctype-system-identifier",e.abruptDoctypePublicIdentifier="abrupt-doctype-public-identifier",e.abruptDoctypeSystemIdentifier="abrupt-doctype-system-identifier",e.cdataInHtmlContent="cdata-in-html-content",e.incorrectlyOpenedComment="incorrectly-opened-comment",e.eofInScriptHtmlCommentLikeText="eof-in-script-html-comment-like-text",e.eofInDoctype="eof-in-doctype",e.nestedComment="nested-comment",e.abruptClosingOfEmptyComment="abrupt-closing-of-empty-comment",e.eofInComment="eof-in-comment",e.incorrectlyClosedComment="incorrectly-closed-comment",e.eofInCdata="eof-in-cdata",e.absenceOfDigitsInNumericCharacterReference="absence-of-digits-in-numeric-character-reference",e.nullCharacterReference="null-character-reference",e.surrogateCharacterReference="surrogate-character-reference",e.characterReferenceOutsideUnicodeRange="character-reference-outside-unicode-range",e.controlCharacterReference="control-character-reference",e.noncharacterCharacterReference="noncharacter-character-reference",e.missingWhitespaceBeforeDoctypeName="missing-whitespace-before-doctype-name",e.missingDoctypeName="missing-doctype-name",e.invalidCharacterSequenceAfterDoctypeName="invalid-character-sequence-after-doctype-name",e.duplicateAttribute="duplicate-attribute",e.nonConformingDoctype="non-conforming-doctype",e.missingDoctype="missing-doctype",e.misplacedDoctype="misplaced-doctype",e.endTagWithoutMatchingOpenElement="end-tag-without-matching-open-element",e.closingOfElementWithOpenChildElements="closing-of-element-with-open-child-elements",e.disallowedContentInNoscriptInHead="disallowed-content-in-noscript-in-head",e.openElementsLeftAfterEof="open-elements-left-after-eof",e.abandonedHeadElementChild="abandoned-head-element-child",e.misplacedStartTagForHeadElement="misplaced-start-tag-for-head-element",e.nestedNoscriptInHead="nested-noscript-in-head",e.eofInElementThatCanContainOnlyText="eof-in-element-that-can-contain-only-text"})(Rt||(Rt={}));var Ot;(function(e){e[e.CHARACTER=0]="CHARACTER",e[e.NULL_CHARACTER=1]="NULL_CHARACTER",e[e.WHITESPACE_CHARACTER=2]="WHITESPACE_CHARACTER",e[e.START_TAG=3]="START_TAG",e[e.END_TAG=4]="END_TAG",e[e.COMMENT=5]="COMMENT",e[e.DOCTYPE=6]="DOCTYPE",e[e.EOF=7]="EOF",e[e.HIBERNATION=8]="HIBERNATION"})(Ot||(Ot={}));var x;(function(e){e.HTML="http://www.w3.org/1999/xhtml",e.MATHML="http://www.w3.org/1998/Math/MathML",e.SVG="http://www.w3.org/2000/svg",e.XLINK="http://www.w3.org/1999/xlink",e.XML="http://www.w3.org/XML/1998/namespace",e.XMLNS="http://www.w3.org/2000/xmlns/"})(x||(x={}));var Pt;(function(e){e.TYPE="type",e.ACTION="action",e.ENCODING="encoding",e.PROMPT="prompt",e.NAME="name",e.COLOR="color",e.FACE="face",e.SIZE="size"})(Pt||(Pt={}));var Bt;(function(e){e.NO_QUIRKS="no-quirks",e.QUIRKS="quirks",e.LIMITED_QUIRKS="limited-quirks"})(Bt||(Bt={}));var u;(function(e){e.A="a",e.ADDRESS="address",e.ANNOTATION_XML="annotation-xml",e.APPLET="applet",e.AREA="area",e.ARTICLE="article",e.ASIDE="aside",e.B="b",e.BASE="base",e.BASEFONT="basefont",e.BGSOUND="bgsound",e.BIG="big",e.BLOCKQUOTE="blockquote",e.BODY="body",e.BR="br",e.BUTTON="button",e.CAPTION="caption",e.CENTER="center",e.CODE="code",e.COL="col",e.COLGROUP="colgroup",e.DD="dd",e.DESC="desc",e.DETAILS="details",e.DIALOG="dialog",e.DIR="dir",e.DIV="div",e.DL="dl",e.DT="dt",e.EM="em",e.EMBED="embed",e.FIELDSET="fieldset",e.FIGCAPTION="figcaption",e.FIGURE="figure",e.FONT="font",e.FOOTER="footer",e.FOREIGN_OBJECT="foreignObject",e.FORM="form",e.FRAME="frame",e.FRAMESET="frameset",e.H1="h1",e.H2="h2",e.H3="h3",e.H4="h4",e.H5="h5",e.H6="h6",e.HEAD="head",e.HEADER="header",e.HGROUP="hgroup",e.HR="hr",e.HTML="html",e.I="i",e.IMG="img",e.IMAGE="image",e.INPUT="input",e.IFRAME="iframe",e.KEYGEN="keygen",e.LABEL="label",e.LI="li",e.LINK="link",e.LISTING="listing",e.MAIN="main",e.MALIGNMARK="malignmark",e.MARQUEE="marquee",e.MATH="math",e.MENU="menu",e.META="meta",e.MGLYPH="mglyph",e.MI="mi",e.MO="mo",e.MN="mn",e.MS="ms",e.MTEXT="mtext",e.NAV="nav",e.NOBR="nobr",e.NOFRAMES="noframes",e.NOEMBED="noembed",e.NOSCRIPT="noscript",e.OBJECT="object",e.OL="ol",e.OPTGROUP="optgroup",e.OPTION="option",e.P="p",e.PARAM="param",e.PLAINTEXT="plaintext",e.PRE="pre",e.RB="rb",e.RP="rp",e.RT="rt",e.RTC="rtc",e.RUBY="ruby",e.S="s",e.SCRIPT="script",e.SEARCH="search",e.SECTION="section",e.SELECT="select",e.SOURCE="source",e.SMALL="small",e.SPAN="span",e.STRIKE="strike",e.STRONG="strong",e.STYLE="style",e.SUB="sub",e.SUMMARY="summary",e.SUP="sup",e.TABLE="table",e.TBODY="tbody",e.TEMPLATE="template",e.TEXTAREA="textarea",e.TFOOT="tfoot",e.TD="td",e.TH="th",e.THEAD="thead",e.TITLE="title",e.TR="tr",e.TRACK="track",e.TT="tt",e.U="u",e.UL="ul",e.SVG="svg",e.VAR="var",e.WBR="wbr",e.XMP="xmp"})(u||(u={}));var d;(function(e){e[e.UNKNOWN=0]="UNKNOWN",e[e.A=1]="A",e[e.ADDRESS=2]="ADDRESS",e[e.ANNOTATION_XML=3]="ANNOTATION_XML",e[e.APPLET=4]="APPLET",e[e.AREA=5]="AREA",e[e.ARTICLE=6]="ARTICLE",e[e.ASIDE=7]="ASIDE",e[e.B=8]="B",e[e.BASE=9]="BASE",e[e.BASEFONT=10]="BASEFONT",e[e.BGSOUND=11]="BGSOUND",e[e.BIG=12]="BIG",e[e.BLOCKQUOTE=13]="BLOCKQUOTE",e[e.BODY=14]="BODY",e[e.BR=15]="BR",e[e.BUTTON=16]="BUTTON",e[e.CAPTION=17]="CAPTION",e[e.CENTER=18]="CENTER",e[e.CODE=19]="CODE",e[e.COL=20]="COL",e[e.COLGROUP=21]="COLGROUP",e[e.DD=22]="DD",e[e.DESC=23]="DESC",e[e.DETAILS=24]="DETAILS",e[e.DIALOG=25]="DIALOG",e[e.DIR=26]="DIR",e[e.DIV=27]="DIV",e[e.DL=28]="DL",e[e.DT=29]="DT",e[e.EM=30]="EM",e[e.EMBED=31]="EMBED",e[e.FIELDSET=32]="FIELDSET",e[e.FIGCAPTION=33]="FIGCAPTION",e[e.FIGURE=34]="FIGURE",e[e.FONT=35]="FONT",e[e.FOOTER=36]="FOOTER",e[e.FOREIGN_OBJECT=37]="FOREIGN_OBJECT",e[e.FORM=38]="FORM",e[e.FRAME=39]="FRAME",e[e.FRAMESET=40]="FRAMESET",e[e.H1=41]="H1",e[e.H2=42]="H2",e[e.H3=43]="H3",e[e.H4=44]="H4",e[e.H5=45]="H5",e[e.H6=46]="H6",e[e.HEAD=47]="HEAD",e[e.HEADER=48]="HEADER",e[e.HGROUP=49]="HGROUP",e[e.HR=50]="HR",e[e.HTML=51]="HTML",e[e.I=52]="I",e[e.IMG=53]="IMG",e[e.IMAGE=54]="IMAGE",e[e.INPUT=55]="INPUT",e[e.IFRAME=56]="IFRAME",e[e.KEYGEN=57]="KEYGEN",e[e.LABEL=58]="LABEL",e[e.LI=59]="LI",e[e.LINK=60]="LINK",e[e.LISTING=61]="LISTING",e[e.MAIN=62]="MAIN",e[e.MALIGNMARK=63]="MALIGNMARK",e[e.MARQUEE=64]="MARQUEE",e[e.MATH=65]="MATH",e[e.MENU=66]="MENU",e[e.META=67]="META",e[e.MGLYPH=68]="MGLYPH",e[e.MI=69]="MI",e[e.MO=70]="MO",e[e.MN=71]="MN",e[e.MS=72]="MS",e[e.MTEXT=73]="MTEXT",e[e.NAV=74]="NAV",e[e.NOBR=75]="NOBR",e[e.NOFRAMES=76]="NOFRAMES",e[e.NOEMBED=77]="NOEMBED",e[e.NOSCRIPT=78]="NOSCRIPT",e[e.OBJECT=79]="OBJECT",e[e.OL=80]="OL",e[e.OPTGROUP=81]="OPTGROUP",e[e.OPTION=82]="OPTION",e[e.P=83]="P",e[e.PARAM=84]="PARAM",e[e.PLAINTEXT=85]="PLAINTEXT",e[e.PRE=86]="PRE",e[e.RB=87]="RB",e[e.RP=88]="RP",e[e.RT=89]="RT",e[e.RTC=90]="RTC",e[e.RUBY=91]="RUBY",e[e.S=92]="S",e[e.SCRIPT=93]="SCRIPT",e[e.SEARCH=94]="SEARCH",e[e.SECTION=95]="SECTION",e[e.SELECT=96]="SELECT",e[e.SOURCE=97]="SOURCE",e[e.SMALL=98]="SMALL",e[e.SPAN=99]="SPAN",e[e.STRIKE=100]="STRIKE",e[e.STRONG=101]="STRONG",e[e.STYLE=102]="STYLE",e[e.SUB=103]="SUB",e[e.SUMMARY=104]="SUMMARY",e[e.SUP=105]="SUP",e[e.TABLE=106]="TABLE",e[e.TBODY=107]="TBODY",e[e.TEMPLATE=108]="TEMPLATE",e[e.TEXTAREA=109]="TEXTAREA",e[e.TFOOT=110]="TFOOT",e[e.TD=111]="TD",e[e.TH=112]="TH",e[e.THEAD=113]="THEAD",e[e.TITLE=114]="TITLE",e[e.TR=115]="TR",e[e.TRACK=116]="TRACK",e[e.TT=117]="TT",e[e.U=118]="U",e[e.UL=119]="UL",e[e.SVG=120]="SVG",e[e.VAR=121]="VAR",e[e.WBR=122]="WBR",e[e.XMP=123]="XMP"})(d||(d={}));u.A,d.A,u.ADDRESS,d.ADDRESS,u.ANNOTATION_XML,d.ANNOTATION_XML,u.APPLET,d.APPLET,u.AREA,d.AREA,u.ARTICLE,d.ARTICLE,u.ASIDE,d.ASIDE,u.B,d.B,u.BASE,d.BASE,u.BASEFONT,d.BASEFONT,u.BGSOUND,d.BGSOUND,u.BIG,d.BIG,u.BLOCKQUOTE,d.BLOCKQUOTE,u.BODY,d.BODY,u.BR,d.BR,u.BUTTON,d.BUTTON,u.CAPTION,d.CAPTION,u.CENTER,d.CENTER,u.CODE,d.CODE,u.COL,d.COL,u.COLGROUP,d.COLGROUP,u.DD,d.DD,u.DESC,d.DESC,u.DETAILS,d.DETAILS,u.DIALOG,d.DIALOG,u.DIR,d.DIR,u.DIV,d.DIV,u.DL,d.DL,u.DT,d.DT,u.EM,d.EM,u.EMBED,d.EMBED,u.FIELDSET,d.FIELDSET,u.FIGCAPTION,d.FIGCAPTION,u.FIGURE,d.FIGURE,u.FONT,d.FONT,u.FOOTER,d.FOOTER,u.FOREIGN_OBJECT,d.FOREIGN_OBJECT,u.FORM,d.FORM,u.FRAME,d.FRAME,u.FRAMESET,d.FRAMESET,u.H1,d.H1,u.H2,d.H2,u.H3,d.H3,u.H4,d.H4,u.H5,d.H5,u.H6,d.H6,u.HEAD,d.HEAD,u.HEADER,d.HEADER,u.HGROUP,d.HGROUP,u.HR,d.HR,u.HTML,d.HTML,u.I,d.I,u.IMG,d.IMG,u.IMAGE,d.IMAGE,u.INPUT,d.INPUT,u.IFRAME,d.IFRAME,u.KEYGEN,d.KEYGEN,u.LABEL,d.LABEL,u.LI,d.LI,u.LINK,d.LINK,u.LISTING,d.LISTING,u.MAIN,d.MAIN,u.MALIGNMARK,d.MALIGNMARK,u.MARQUEE,d.MARQUEE,u.MATH,d.MATH,u.MENU,d.MENU,u.META,d.META,u.MGLYPH,d.MGLYPH,u.MI,d.MI,u.MO,d.MO,u.MN,d.MN,u.MS,d.MS,u.MTEXT,d.MTEXT,u.NAV,d.NAV,u.NOBR,d.NOBR,u.NOFRAMES,d.NOFRAMES,u.NOEMBED,d.NOEMBED,u.NOSCRIPT,d.NOSCRIPT,u.OBJECT,d.OBJECT,u.OL,d.OL,u.OPTGROUP,d.OPTGROUP,u.OPTION,d.OPTION,u.P,d.P,u.PARAM,d.PARAM,u.PLAINTEXT,d.PLAINTEXT,u.PRE,d.PRE,u.RB,d.RB,u.RP,d.RP,u.RT,d.RT,u.RTC,d.RTC,u.RUBY,d.RUBY,u.S,d.S,u.SCRIPT,d.SCRIPT,u.SEARCH,d.SEARCH,u.SECTION,d.SECTION,u.SELECT,d.SELECT,u.SOURCE,d.SOURCE,u.SMALL,d.SMALL,u.SPAN,d.SPAN,u.STRIKE,d.STRIKE,u.STRONG,d.STRONG,u.STYLE,d.STYLE,u.SUB,d.SUB,u.SUMMARY,d.SUMMARY,u.SUP,d.SUP,u.TABLE,d.TABLE,u.TBODY,d.TBODY,u.TEMPLATE,d.TEMPLATE,u.TEXTAREA,d.TEXTAREA,u.TFOOT,d.TFOOT,u.TD,d.TD,u.TH,d.TH,u.THEAD,d.THEAD,u.TITLE,d.TITLE,u.TR,d.TR,u.TRACK,d.TRACK,u.TT,d.TT,u.U,d.U,u.UL,d.UL,u.SVG,d.SVG,u.VAR,d.VAR,u.WBR,d.WBR,u.XMP,d.XMP;const h=d;x.HTML+"",h.ADDRESS,h.APPLET,h.AREA,h.ARTICLE,h.ASIDE,h.BASE,h.BASEFONT,h.BGSOUND,h.BLOCKQUOTE,h.BODY,h.BR,h.BUTTON,h.CAPTION,h.CENTER,h.COL,h.COLGROUP,h.DD,h.DETAILS,h.DIR,h.DIV,h.DL,h.DT,h.EMBED,h.FIELDSET,h.FIGCAPTION,h.FIGURE,h.FOOTER,h.FORM,h.FRAME,h.FRAMESET,h.H1,h.H2,h.H3,h.H4,h.H5,h.H6,h.HEAD,h.HEADER,h.HGROUP,h.HR,h.HTML,h.IFRAME,h.IMG,h.INPUT,h.LI,h.LINK,h.LISTING,h.MAIN,h.MARQUEE,h.MENU,h.META,h.NAV,h.NOEMBED,h.NOFRAMES,h.NOSCRIPT,h.OBJECT,h.OL,h.P,h.PARAM,h.PLAINTEXT,h.PRE,h.SCRIPT,h.SECTION,h.SELECT,h.SOURCE,h.STYLE,h.SUMMARY,h.TABLE,h.TBODY,h.TD,h.TEMPLATE,h.TEXTAREA,h.TFOOT,h.TH,h.THEAD,h.TITLE,h.TR,h.TRACK,h.UL,h.WBR,h.XMP,x.MATHML+"",h.MI,h.MO,h.MN,h.MS,h.MTEXT,h.ANNOTATION_XML,x.SVG+"",h.TITLE,h.FOREIGN_OBJECT,h.DESC,x.XLINK+"",x.XML+"",x.XMLNS+"";h.H1,h.H2,h.H3,h.H4,h.H5,h.H6;u.STYLE,u.SCRIPT,u.XMP,u.IFRAME,u.NOEMBED,u.NOFRAMES,u.PLAINTEXT;var U;(function(e){e[e.DATA=0]="DATA",e[e.RCDATA=1]="RCDATA",e[e.RAWTEXT=2]="RAWTEXT",e[e.SCRIPT_DATA=3]="SCRIPT_DATA",e[e.PLAINTEXT=4]="PLAINTEXT",e[e.TAG_OPEN=5]="TAG_OPEN",e[e.END_TAG_OPEN=6]="END_TAG_OPEN",e[e.TAG_NAME=7]="TAG_NAME",e[e.RCDATA_LESS_THAN_SIGN=8]="RCDATA_LESS_THAN_SIGN",e[e.RCDATA_END_TAG_OPEN=9]="RCDATA_END_TAG_OPEN",e[e.RCDATA_END_TAG_NAME=10]="RCDATA_END_TAG_NAME",e[e.RAWTEXT_LESS_THAN_SIGN=11]="RAWTEXT_LESS_THAN_SIGN",e[e.RAWTEXT_END_TAG_OPEN=12]="RAWTEXT_END_TAG_OPEN",e[e.RAWTEXT_END_TAG_NAME=13]="RAWTEXT_END_TAG_NAME",e[e.SCRIPT_DATA_LESS_THAN_SIGN=14]="SCRIPT_DATA_LESS_THAN_SIGN",e[e.SCRIPT_DATA_END_TAG_OPEN=15]="SCRIPT_DATA_END_TAG_OPEN",e[e.SCRIPT_DATA_END_TAG_NAME=16]="SCRIPT_DATA_END_TAG_NAME",e[e.SCRIPT_DATA_ESCAPE_START=17]="SCRIPT_DATA_ESCAPE_START",e[e.SCRIPT_DATA_ESCAPE_START_DASH=18]="SCRIPT_DATA_ESCAPE_START_DASH",e[e.SCRIPT_DATA_ESCAPED=19]="SCRIPT_DATA_ESCAPED",e[e.SCRIPT_DATA_ESCAPED_DASH=20]="SCRIPT_DATA_ESCAPED_DASH",e[e.SCRIPT_DATA_ESCAPED_DASH_DASH=21]="SCRIPT_DATA_ESCAPED_DASH_DASH",e[e.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN=22]="SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN",e[e.SCRIPT_DATA_ESCAPED_END_TAG_OPEN=23]="SCRIPT_DATA_ESCAPED_END_TAG_OPEN",e[e.SCRIPT_DATA_ESCAPED_END_TAG_NAME=24]="SCRIPT_DATA_ESCAPED_END_TAG_NAME",e[e.SCRIPT_DATA_DOUBLE_ESCAPE_START=25]="SCRIPT_DATA_DOUBLE_ESCAPE_START",e[e.SCRIPT_DATA_DOUBLE_ESCAPED=26]="SCRIPT_DATA_DOUBLE_ESCAPED",e[e.SCRIPT_DATA_DOUBLE_ESCAPED_DASH=27]="SCRIPT_DATA_DOUBLE_ESCAPED_DASH",e[e.SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH=28]="SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH",e[e.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN=29]="SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN",e[e.SCRIPT_DATA_DOUBLE_ESCAPE_END=30]="SCRIPT_DATA_DOUBLE_ESCAPE_END",e[e.BEFORE_ATTRIBUTE_NAME=31]="BEFORE_ATTRIBUTE_NAME",e[e.ATTRIBUTE_NAME=32]="ATTRIBUTE_NAME",e[e.AFTER_ATTRIBUTE_NAME=33]="AFTER_ATTRIBUTE_NAME",e[e.BEFORE_ATTRIBUTE_VALUE=34]="BEFORE_ATTRIBUTE_VALUE",e[e.ATTRIBUTE_VALUE_DOUBLE_QUOTED=35]="ATTRIBUTE_VALUE_DOUBLE_QUOTED",e[e.ATTRIBUTE_VALUE_SINGLE_QUOTED=36]="ATTRIBUTE_VALUE_SINGLE_QUOTED",e[e.ATTRIBUTE_VALUE_UNQUOTED=37]="ATTRIBUTE_VALUE_UNQUOTED",e[e.AFTER_ATTRIBUTE_VALUE_QUOTED=38]="AFTER_ATTRIBUTE_VALUE_QUOTED",e[e.SELF_CLOSING_START_TAG=39]="SELF_CLOSING_START_TAG",e[e.BOGUS_COMMENT=40]="BOGUS_COMMENT",e[e.MARKUP_DECLARATION_OPEN=41]="MARKUP_DECLARATION_OPEN",e[e.COMMENT_START=42]="COMMENT_START",e[e.COMMENT_START_DASH=43]="COMMENT_START_DASH",e[e.COMMENT=44]="COMMENT",e[e.COMMENT_LESS_THAN_SIGN=45]="COMMENT_LESS_THAN_SIGN",e[e.COMMENT_LESS_THAN_SIGN_BANG=46]="COMMENT_LESS_THAN_SIGN_BANG",e[e.COMMENT_LESS_THAN_SIGN_BANG_DASH=47]="COMMENT_LESS_THAN_SIGN_BANG_DASH",e[e.COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH=48]="COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH",e[e.COMMENT_END_DASH=49]="COMMENT_END_DASH",e[e.COMMENT_END=50]="COMMENT_END",e[e.COMMENT_END_BANG=51]="COMMENT_END_BANG",e[e.DOCTYPE=52]="DOCTYPE",e[e.BEFORE_DOCTYPE_NAME=53]="BEFORE_DOCTYPE_NAME",e[e.DOCTYPE_NAME=54]="DOCTYPE_NAME",e[e.AFTER_DOCTYPE_NAME=55]="AFTER_DOCTYPE_NAME",e[e.AFTER_DOCTYPE_PUBLIC_KEYWORD=56]="AFTER_DOCTYPE_PUBLIC_KEYWORD",e[e.BEFORE_DOCTYPE_PUBLIC_IDENTIFIER=57]="BEFORE_DOCTYPE_PUBLIC_IDENTIFIER",e[e.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED=58]="DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED",e[e.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED=59]="DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED",e[e.AFTER_DOCTYPE_PUBLIC_IDENTIFIER=60]="AFTER_DOCTYPE_PUBLIC_IDENTIFIER",e[e.BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS=61]="BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS",e[e.AFTER_DOCTYPE_SYSTEM_KEYWORD=62]="AFTER_DOCTYPE_SYSTEM_KEYWORD",e[e.BEFORE_DOCTYPE_SYSTEM_IDENTIFIER=63]="BEFORE_DOCTYPE_SYSTEM_IDENTIFIER",e[e.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED=64]="DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED",e[e.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED=65]="DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED",e[e.AFTER_DOCTYPE_SYSTEM_IDENTIFIER=66]="AFTER_DOCTYPE_SYSTEM_IDENTIFIER",e[e.BOGUS_DOCTYPE=67]="BOGUS_DOCTYPE",e[e.CDATA_SECTION=68]="CDATA_SECTION",e[e.CDATA_SECTION_BRACKET=69]="CDATA_SECTION_BRACKET",e[e.CDATA_SECTION_END=70]="CDATA_SECTION_END",e[e.CHARACTER_REFERENCE=71]="CHARACTER_REFERENCE",e[e.AMBIGUOUS_AMPERSAND=72]="AMBIGUOUS_AMPERSAND"})(U||(U={}));U.DATA,U.RCDATA,U.RAWTEXT,U.SCRIPT_DATA,U.PLAINTEXT,U.CDATA_SECTION;const Vs=new Set([d.DD,d.DT,d.LI,d.OPTGROUP,d.OPTION,d.P,d.RB,d.RP,d.RT,d.RTC]);[...Vs,d.CAPTION,d.COLGROUP,d.TBODY,d.TD,d.TFOOT,d.TH,d.THEAD,d.TR];const An=new Set([d.APPLET,d.CAPTION,d.HTML,d.MARQUEE,d.OBJECT,d.TABLE,d.TD,d.TEMPLATE,d.TH]);[...An,d.OL,d.UL];[...An,d.BUTTON];d.ANNOTATION_XML,d.MI,d.MN,d.MO,d.MS,d.MTEXT;d.DESC,d.FOREIGN_OBJECT,d.TITLE;d.TR,d.TEMPLATE,d.HTML;d.TBODY,d.TFOOT,d.THEAD,d.TEMPLATE,d.HTML;d.TABLE,d.TEMPLATE,d.HTML;d.TD,d.TH;var Ye;(function(e){e[e.Marker=0]="Marker",e[e.Element=1]="Element"})(Ye||(Ye={}));Ye.Marker;new Map(["attributeName","attributeType","baseFrequency","baseProfile","calcMode","clipPathUnits","diffuseConstant","edgeMode","filterUnits","glyphRef","gradientTransform","gradientUnits","kernelMatrix","kernelUnitLength","keyPoints","keySplines","keyTimes","lengthAdjust","limitingConeAngle","markerHeight","markerUnits","markerWidth","maskContentUnits","maskUnits","numOctaves","pathLength","patternContentUnits","patternTransform","patternUnits","pointsAtX","pointsAtY","pointsAtZ","preserveAlpha","preserveAspectRatio","primitiveUnits","refX","refY","repeatCount","repeatDur","requiredExtensions","requiredFeatures","specularConstant","specularExponent","spreadMethod","startOffset","stdDeviation","stitchTiles","surfaceScale","systemLanguage","tableValues","targetX","targetY","textLength","viewBox","viewTarget","xChannelSelector","yChannelSelector","zoomAndPan"].map(e=>[e.toLowerCase(),e]));x.XLINK,x.XLINK,x.XLINK,x.XLINK,x.XLINK,x.XLINK,x.XLINK,x.XML,x.XML,x.XMLNS,x.XMLNS;new Map(["altGlyph","altGlyphDef","altGlyphItem","animateColor","animateMotion","animateTransform","clipPath","feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feDistantLight","feFlood","feFuncA","feFuncB","feFuncG","feFuncR","feGaussianBlur","feImage","feMerge","feMergeNode","feMorphology","feOffset","fePointLight","feSpecularLighting","feSpotLight","feTile","feTurbulence","foreignObject","glyphRef","linearGradient","radialGradient","textPath"].map(e=>[e.toLowerCase(),e]));d.B,d.BIG,d.BLOCKQUOTE,d.BODY,d.BR,d.CENTER,d.CODE,d.DD,d.DIV,d.DL,d.DT,d.EM,d.EMBED,d.H1,d.H2,d.H3,d.H4,d.H5,d.H6,d.HEAD,d.HR,d.I,d.IMG,d.LI,d.LISTING,d.MENU,d.META,d.NOBR,d.OL,d.P,d.PRE,d.RUBY,d.S,d.SMALL,d.SPAN,d.STRONG,d.STRIKE,d.SUB,d.SUP,d.TABLE,d.TT,d.U,d.UL,d.VAR;var Nt;(function(e){e[e.INITIAL=0]="INITIAL",e[e.BEFORE_HTML=1]="BEFORE_HTML",e[e.BEFORE_HEAD=2]="BEFORE_HEAD",e[e.IN_HEAD=3]="IN_HEAD",e[e.IN_HEAD_NO_SCRIPT=4]="IN_HEAD_NO_SCRIPT",e[e.AFTER_HEAD=5]="AFTER_HEAD",e[e.IN_BODY=6]="IN_BODY",e[e.TEXT=7]="TEXT",e[e.IN_TABLE=8]="IN_TABLE",e[e.IN_TABLE_TEXT=9]="IN_TABLE_TEXT",e[e.IN_CAPTION=10]="IN_CAPTION",e[e.IN_COLUMN_GROUP=11]="IN_COLUMN_GROUP",e[e.IN_TABLE_BODY=12]="IN_TABLE_BODY",e[e.IN_ROW=13]="IN_ROW",e[e.IN_CELL=14]="IN_CELL",e[e.IN_SELECT=15]="IN_SELECT",e[e.IN_SELECT_IN_TABLE=16]="IN_SELECT_IN_TABLE",e[e.IN_TEMPLATE=17]="IN_TEMPLATE",e[e.AFTER_BODY=18]="AFTER_BODY",e[e.IN_FRAMESET=19]="IN_FRAMESET",e[e.AFTER_FRAMESET=20]="AFTER_FRAMESET",e[e.AFTER_AFTER_BODY=21]="AFTER_AFTER_BODY",e[e.AFTER_AFTER_FRAMESET=22]="AFTER_AFTER_FRAMESET"})(Nt||(Nt={}));d.TABLE,d.TBODY,d.TFOOT,d.THEAD,d.TR;d.CAPTION,d.COL,d.COLGROUP,d.TBODY,d.TD,d.TFOOT,d.TH,d.THEAD,d.TR;u.AREA,u.BASE,u.BASEFONT,u.BGSOUND,u.BR,u.COL,u.EMBED,u.FRAME,u.HR,u.IMG,u.INPUT,u.KEYGEN,u.LINK,u.META,u.PARAM,u.SOURCE,u.TRACK,u.WBR;class qs{constructor(){this.proxies=["https://api.allorigins.win/raw?url=","https://cors-anywhere.herokuapp.com/","https://thingproxy.freeboard.io/fetch/","https://cors.bridged.cc/","https://api.codetabs.com/v1/proxy?quest=","https://corsproxy.io/?","https://cors-anywhere.1d4s.me/","https://cors-anywhere.herokuapp.com/"],this.currentProxyIndex=0}async fetchWithFallback(t,n={}){return this.fetchWithProxy(t)}async fetchWithProxy(t){let n=null;for(let i=0;i<this.proxies.length;i++){const a=(this.currentProxyIndex+i)%this.proxies.length,s=this.proxies[a];try{const r=await fetch(s+encodeURIComponent(t),{method:"GET",headers:{Accept:"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8","Accept-Language":"en-US,en;q=0.5","Accept-Encoding":"gzip, deflate",DNT:"1",Connection:"keep-alive","Upgrade-Insecure-Requests":"1","User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"},timeout:1e4});if(r.ok){const o=await r.text();if(o.includes("<html")||o.includes("<head")||o.includes("<body"))return this.currentProxyIndex=a,o}}catch(r){console.log(`Proxy ${a} fallito:`,r.message),n=r}}try{const i=await fetch(t,{method:"GET",headers:{Accept:"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8","User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}});if(i.ok)return await i.text()}catch(i){console.log("Anche l'approccio diretto è fallito:",i)}throw n||new Error("Impossibile recuperare il contenuto")}async extractMetadata(t){try{const n=localStorage.getItem("aideas-language")||"it",i=await fetch(`http://localhost:4000/extract?url=${encodeURIComponent(t)}&lang=${n}`);if(!i.ok)throw new Error("Proxy meta fallito");return await i.json()}catch{const i=new URL(t).hostname;return{title:i,description:`App web da ${i}`,icon:`https://www.google.com/s2/favicons?domain=${i}&sz=64`}}}extractBestIcon(t,n){const i=['link[rel="apple-touch-icon"][sizes="180x180"]','link[rel="apple-touch-icon"][sizes="152x152"]','link[rel="apple-touch-icon"][sizes="144x144"]','link[rel="apple-touch-icon"][sizes="120x120"]','link[rel="apple-touch-icon"]','link[rel="icon"][type="image/png"][sizes="32x32"]','link[rel="icon"][type="image/png"][sizes="16x16"]','link[rel="icon"][type="image/svg+xml"]','link[rel="shortcut icon"]','link[rel="icon"]'];for(const a of i){const s=t(a).attr("href");if(s)return new URL(s,n).href}return null}extractTitle(t){const n=[/<title[^>]*>([^<]+)<\/title>/i,/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i,/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i];for(const i of n){const a=t.match(i);if(a){const s=a[1].trim();if(s&&s.length>0)return s}}return null}extractDescription(t){const n=[/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i,/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i,/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i,/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i];for(const i of n){const a=t.match(i);if(a){const s=a[1].trim();if(s&&s.length>0)return s}}return null}extractIcon(t,n){const i=[/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i,/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:icon|shortcut icon)["']/i,/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i,/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']apple-touch-icon["']/i];for(const a of i){const s=t.match(a);if(s)try{const r=new URL(s[1],n).href;return console.log("Icona trovata:",r),r}catch{console.log("URL icona non valido:",s[1])}}return null}extractAppleTouchIcon(t,n){const i=[/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i,/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']apple-touch-icon["']/i,/<link[^>]*rel=["']apple-touch-icon-precomposed["'][^>]*href=["']([^"']+)["']/i,/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']apple-touch-icon-precomposed["']/i];for(const a of i){const s=t.match(a);if(s)try{const r=new URL(s[1],n).href;return console.log("Apple Touch Icon trovata:",r),r}catch{console.log("URL apple-touch-icon non valido:",s[1])}}return null}extractKeywords(t){const n=t.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);return n?n[1].trim():null}extractAuthor(t){const n=t.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i);return n?n[1].trim():null}extractOGImage(t){const n=t.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);return n?n[1].trim():null}extractOGTitle(t){const n=t.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);return n?n[1].trim():null}extractOGDescription(t){const n=t.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);return n?n[1].trim():null}async testProxy(t){try{return(await fetch(t+encodeURIComponent("https://httpbin.org/ip"),{method:"GET",timeout:5e3})).ok}catch{return!1}}async getProxyStatus(){const t={};for(let n=0;n<this.proxies.length;n++){const i=this.proxies[n];t[i]=await this.testProxy(i)}return t}}var js=Sn();const Ws=Ht(js);class Ys{constructor(){this.maxFileSize=50*1024*1024,this.supportedFormats=["zip"],this.categories=["productivity","entertainment","communication","development","design","finance","health","news","shopping","travel","ai","social","education","business","utility","pwa"],this.proxyService=new qs,this.init&&(this.init=this.init.bind(this)),this.showModal&&(this.showModal=this.showModal.bind(this)),this.importFromZip&&(this.importFromZip=this.importFromZip.bind(this)),this.importFromUrl&&(this.importFromUrl=this.importFromUrl.bind(this)),this.importFromGitHub&&(this.importFromGitHub=this.importFromGitHub.bind(this)),this.validateAppData&&(this.validateAppData=this.validateAppData.bind(this)),this.extractAppMetadata&&(this.extractAppMetadata=this.extractAppMetadata.bind(this)),this.setupDropZone&&(this.setupDropZone=this.setupDropZone.bind(this))}async init(){console.log("🔧 Inizializzazione AppImporter..."),this.setupDropZone(),this.setupKeyboardShortcuts()}showModal(){const t=this.createImportModal();D("app-import-modal",t,{size:"modal-xl",disableBackdropClose:!1}),setTimeout(()=>{this.setupModalEventListeners();const n=document.getElementById("form-html");n&&n.classList.add("active");const i=document.querySelector('[data-section="html"]');i&&i.classList.add("active")},100)}createImportModal(){return`
      <div class="modal-header">
        <h2>
          <svg viewBox="0 0 24 24" fill="currentColor" class="header-icon">
            <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
          </svg>
          Aggiungi Nuova App
        </h2>
        <button class="modal-close">&times;</button>
      </div>
      
      <div class="modal-body">
        <!-- Import Layout (come settings) -->
        <div class="settings-layout">
          <!-- Import Navigation -->
          <nav class="settings-nav">
            <ul class="settings-nav-list">
              <li class="settings-nav-item">
                <button class="settings-nav-btn btn btn-secondary active" type="button" data-section="html">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                  File HTML
                </button>
              </li>
              <li class="settings-nav-item">
                <button class="settings-nav-btn btn btn-secondary" type="button" data-section="url">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.9,12C3.9,10.29 5.29,8.9 7,8.9H11V7H7C4.24,7 2,9.24 2,12C2,14.76 4.24,17 7,17H11V15.1H7C5.29,15.1 3.9,13.71 3.9,12M8,13H16V11H8V13M17,7H13V8.9H17C18.71,8.9 20.1,10.29 20.1,12C20.1,13.71 18.71,15.1 17,15.1H13V17H17C19.76,17 22,14.76 22,12C22,9.24 19.76,7 17,7Z"/>
                  </svg>
                  Importa da URL
                </button>
              </li>
              <li class="settings-nav-item">
                <button class="settings-nav-btn btn btn-secondary" type="button" data-section="github">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z"/>
                  </svg>
                  Repository GitHub
                </button>
              </li>
            </ul>
          </nav>

          <!-- Import Content -->
          <div class="settings-content">
          
            <!-- HTML Import Section -->
            <div class="settings-section active" id="section-html">
              <h3>Importa da File HTML</h3>
              
              <div class="settings-group">
                <h4>Carica File</h4>
                
                <div class="setting-item">
                  <label for="html-file-input">File HTML</label>
                  <input type="file" id="html-file-input" accept=".html,text/html" class="form-input">
                  <p class="setting-description">Carica un file HTML standalone (senza risorse esterne)</p>
                </div>
              </div>
            </div>

            <!-- URL Import Section -->
            <div class="settings-section" id="section-url">
              <h3>Importa da URL</h3>
              
              <div class="settings-group">
                <h4>URL dell'Applicazione</h4>
              
                <div class="setting-item">
                  <label for="url-input">URL</label>
                  <div class="input-with-button">
                    <input 
                      type="url" 
                      id="url-input" 
                      class="form-input" 
                      placeholder="https://esempio.com/app"
                      required
                    >
                    <button class="btn btn-secondary" id="test-url-btn">Test</button>
                  </div>
                  <p class="setting-description">Inserisci l'URL dell'applicazione web. Il sistema rileverà automaticamente se è una PWA o un sito normale.</p>
                </div>
              
                <div class="setting-item" id="url-preview-container" style="display: none;">
                  <label>Anteprima del sito</label>
                  <div class="url-preview" id="url-preview">
                    <div class="preview-content">
                      <div class="preview-info">
                        <h5>Anteprima del sito:</h5>
                        <div class="preview-details">
                          <div class="preview-favicon">🌐</div>
                          <div class="preview-text">
                            <p class="preview-title">Caricamento...</p>
                            <p class="preview-url"></p>
                          </div>
                        </div>
                      </div>
                      <div class="preview-status">
                        <span class="status-badge">Verificando...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- GitHub Import Section -->
            <div class="settings-section" id="section-github">
              <h3>Importa da GitHub</h3>
              
              <div class="settings-group">
                <h4>Repository GitHub</h4>
              
                <div class="setting-item">
                  <label for="github-url-input">URL del Repository</label>
                  <input 
                    type="url" 
                    id="github-url-input" 
                    class="form-input" 
                    placeholder="https://github.com/username/repository"
                    required
                  >
                  <p class="setting-description">Inserisci l'URL di un repository GitHub. Il sistema cercherà automaticamente i file di build o demo.</p>
                </div>
              
                <div class="setting-item" id="github-preview-container" style="display: none;">
                  <label>Anteprima del Repository</label>
                  <div class="github-preview" id="github-preview">
                    <div class="preview-content">
                      <div class="preview-info">
                        <h5>Repository GitHub:</h5>
                        <div class="preview-details">
                          <div class="preview-favicon">📦</div>
                          <div class="preview-text">
                            <p class="preview-title">Caricamento...</p>
                            <p class="preview-description"></p>
                          </div>
                        </div>
                      </div>
                      <div class="preview-status">
                        <span class="status-badge">Verificando...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- App Metadata Section (Comune per tutti i tipi) -->
            <div class="settings-section" id="section-metadata" style="display: none;">
              <h3>Informazioni App</h3>
              
              <div class="settings-group">
                <h4>Dettagli Base</h4>
              
                <div class="setting-item">
                  <label for="app-name">Nome App *</label>
                  <input 
                    type="text" 
                    id="app-name" 
                    class="form-input" 
                    placeholder="Il mio Tool Fantastico"
                    required
                    maxlength="50"
                  >
                  <p class="setting-description">Nome dell'applicazione che verrà visualizzato</p>
                </div>
              
                <div class="setting-item">
                  <label for="app-version">Versione</label>
                  <input 
                    type="text" 
                    id="app-version" 
                    class="form-input" 
                    placeholder="1.0.0"
                    value="1.0.0"
                  >
                  <p class="setting-description">Versione dell'applicazione</p>
                </div>
              
                <div class="setting-item">
                  <label for="app-description">Descrizione</label>
                  <textarea 
                    id="app-description" 
                    class="form-input" 
                    rows="3"
                    placeholder="Descrivi cosa fa questa app..."
                    maxlength="200"
                  ></textarea>
                  <div class="char-count">
                    <span id="desc-char-count">0</span>/200
                  </div>
                  <p class="setting-description">Breve descrizione dell'applicazione</p>
                </div>
              </div>
              
              <div class="settings-group">
                <h4>Categorizzazione</h4>
                
                <div class="setting-item">
                  <label for="app-category">Categoria</label>
                  <select id="app-category" class="form-input">
                    <option value="">Seleziona categoria...</option>
                    ${this.categories.map(t=>`<option value="${t}">${this.getCategoryLabel(t)}</option>`).join("")}
                  </select>
                  <p class="setting-description">Categoria per organizzare le app</p>
                </div>
              
                <div class="setting-item">
                  <label for="app-tags">Tag (separati da virgola)</label>
                  <input 
                    type="text" 
                    id="app-tags" 
                    class="form-input" 
                    placeholder="ai, produttività, strumento"
                  >
                  <p class="setting-description">Tag per facilitare la ricerca</p>
                </div>
              </div>

              <div class="settings-group">
                <h4>Personalizzazione</h4>
                
                <div class="setting-item">
                  <label for="app-icon">Icona App (URL o carica file)</label>
                  <div class="icon-input-group">
                    <input 
                      type="url" 
                      id="app-icon" 
                      class="form-input" 
                      placeholder="https://esempio.com/icon.png"
                    >
                    <button class="btn btn-secondary" id="upload-icon-btn">Carica</button>
                    <input type="file" id="icon-file-input" accept="image/*" style="display: none;">
                  </div>
                  <div class="icon-preview" id="icon-preview" style="display: none;">
                    <img src="" alt="Preview icona" id="icon-preview-img">
                  </div>
                  <p class="setting-description">Icona personalizzata per l'app</p>
                </div>
              
                <div class="setting-item">
                  <label for="app-launch-mode">Modalità di apertura</label>
                  <select id="app-launch-mode" class="form-input">
                    <option value="">Usa impostazione globale</option>
                    <option value="iframe">Sempre in finestra modale</option>
                    <option value="newpage">Sempre in nuova pagina</option>
                  </select>
                  <p class="setting-description">
                    Scegli come questa app dovrebbe aprirsi di default. 
                    <span id="current-default-mode" style="font-weight: bold; color: #2563eb;"></span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <div class="import-progress" id="import-progress" style="display: none;">
          <div class="progress-bar">
            <div class="progress-fill" id="progress-fill"></div>
          </div>
          <p class="progress-text" id="progress-text">Importazione in corso...</p>
        </div>
        
        <div class="modal-actions" id="modal-actions">
          <button class="btn btn-secondary" id="cancel-import" type="button">Annulla</button>
          <button class="btn btn-primary" id="start-import" type="button" disabled>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
            </svg>
            Importa App
          </button>
        </div>
      </div>
    `}setupModalEventListeners(){const t=document.getElementById("app-import-modal");if(!t)return;const n=t.querySelectorAll(".settings-nav-btn"),i=t.querySelectorAll(".settings-section");n.forEach(o=>{o.addEventListener("click",()=>{const c=o.dataset.section;n.forEach(l=>l.classList.remove("active")),o.classList.add("active"),i.forEach(l=>{l.style.display="none",l.classList.remove("active"),l.id===`section-${c}`&&(l.style.display="block",l.classList.add("active"))})})}),this.setupHtmlImport(t),this.setupUrlImport(t),this.setupGitHubImport(t),this.setupMetadataForm(t),t.querySelector("#start-import")?.addEventListener("click",()=>{this.startImport()}),t.querySelector("#cancel-import")?.addEventListener("click",()=>{O("app-import-modal")}),t.querySelector(".modal-close")?.addEventListener("click",()=>{O("app-import-modal")}),t.addEventListener("keydown",o=>{o.key==="Escape"&&O("app-import-modal")})}setupZipImport(t){const n=t.querySelector("#zip-drop-zone"),i=t.querySelector("#zip-file-input");t.querySelector("#select-zip-btn")?.addEventListener("click",()=>{i?.click()}),i?.addEventListener("change",s=>{const r=s.target.files[0];r&&this.handleZipFile(r)}),n?.addEventListener("dragover",s=>{s.preventDefault(),n.classList.add("drag-over")}),n?.addEventListener("dragleave",s=>{s.preventDefault(),n.classList.remove("drag-over")}),n?.addEventListener("drop",s=>{s.preventDefault(),n.classList.remove("drag-over");const r=s.dataTransfer.files[0];r&&r.name.endsWith(".zip")?this.handleZipFile(r):m("Per favore seleziona un file ZIP valido","error")})}setupUrlImport(t){const n=t.querySelector("#url-input"),i=t.querySelector("#test-url-btn"),a=t.querySelector("#url-preview-container");i?.addEventListener("click",async()=>{const s=n?.value.trim();if(!s){m("Inserisci un URL valido","error");return}if(!ft(s)){m("URL non valido","error");return}try{i.disabled=!0,i.textContent="Testando...",await this.testUrl(s,a),i.textContent="Test",i.disabled=!1}catch(r){console.error("Errore test URL:",r),m("Errore durante il test dell'URL","error"),i.textContent="Test",i.disabled=!1}}),n?.addEventListener("input",()=>{const s=n.value.trim();s&&ft(s)?this.enableImportButton():this.disableImportButton()})}setupGitHubImport(t){const n=t.querySelector("#github-url-input"),i=t.querySelector("#github-preview-container");n?.addEventListener("input",async()=>{const a=n.value.trim();if(a&&this.isGitHubUrl(a))try{await this.fetchGitHubInfo(a,i),this.enableImportButton()}catch(s){console.error("Errore fetch GitHub:",s),m("Errore durante il recupero delle informazioni GitHub","error")}else this.disableImportButton(),i&&(i.style.display="none")})}setupMetadataForm(t){this.updateDefaultModeIndicator();const n=t.querySelector("#app-icon"),i=t.querySelector("#upload-icon-btn"),a=t.querySelector("#icon-file-input"),s=t.querySelector("#icon-preview");t.querySelector("#icon-preview-img"),i?.addEventListener("click",()=>{a?.click()}),a?.addEventListener("change",o=>{const c=o.target.files[0];c&&this.handleIconUpload(c,n,s)}),n?.addEventListener("input",()=>{const o=n.value.trim();o?this.showIconPreview(o,s):s.style.display="none"}),t.querySelector("#app-name")?.addEventListener("input",()=>{this.validateForm()})}async updateDefaultModeIndicator(){try{const t=await A.getSetting("defaultLaunchMode","newpage"),n=document.getElementById("current-default-mode");if(n){const i=t==="newpage"?"Nuova pagina":"Finestra modale";n.textContent=`(Impostazione globale corrente: ${i})`}}catch(t){console.warn("Impossibile caricare modalità di default:",t)}}validateForm(){const t=document.getElementById("app-name"),n=document.getElementById("start-import");if(t&&n){const i=t.value.trim().length>0;n.disabled=!i}}setupHtmlImport(t){t.querySelector("#html-file-input")?.addEventListener("change",i=>{const a=i.target.files[0];a&&this.handleHtmlFile(a)})}async handleZipFile(t){try{if(t.size>this.maxFileSize){m(`File troppo grande. Massimo: ${re(this.maxFileSize)}`,"error");return}m("Analizzando file ZIP...","info");const i=await new Ws().loadAsync(t),a=[];let s=null;for(const[p,f]of Object.entries(i.files)){if(f.dir)continue;const g=await f.async("text"),v={filename:p,content:g,size:g.length,mimeType:this.getMimeType(p)};if(a.push(v),p==="aideas.json")try{s=JSON.parse(g)}catch(b){console.warn("Manifest aideas.json non valido:",b)}}if(!a.some(p=>p.filename.endsWith(".html"))){m("Il ZIP deve contenere almeno un file HTML","error");return}const o=this.extractZipMetadata(a,s);this.populateMetadataForm(o);const c=document.getElementById("section-metadata");c&&(c.style.display="block"),this.currentImportData={type:"zip",files:a,manifest:s,metadata:o,originalFile:t};const l=document.getElementById("start-import");l&&(l.disabled=!1),m("ZIP analizzato con successo!","success")}catch(n){console.error("Errore durante l'analisi del ZIP:",n),m("Errore durante l'analisi del file ZIP","error")}}async testUrl(t,n){if(!n)return;n.style.display="block";const i=n.querySelector(".status-badge"),a=n.querySelector(".preview-title"),s=n.querySelector(".preview-url");i.textContent="Verificando...",i.className="status-badge",a.textContent="Caricamento...",s.textContent=t;try{const r=await this.extractUrlMetadata(t);a.textContent=r.title||r.name||gt(t),i.textContent=r.isPWA?"✓ PWA Rilevata":"✓ Sito Web",i.className=r.isPWA?"status-badge badge-success":"status-badge badge-info",this.populateMetadataForm(r);const o=document.getElementById("section-metadata");o&&(o.style.display="block"),this.currentImportData={type:r.isPWA?"pwa":"url",url:t,metadata:r};const c=document.getElementById("start-import");c&&(c.disabled=!1)}catch(r){console.error("Errore test URL:",r),i.textContent="⚠ Errore",i.className="status-badge badge-error",a.textContent="Impossibile verificare il sito"}}async fetchGitHubInfo(t,n){if(!n)return;const i=this.parseGitHubUrl(t);if(!i){m("URL GitHub non valido","error");return}try{const a=`https://api.github.com/repos/${i.owner}/${i.repo}`,s=await fetch(a);if(!s.ok)throw new Error("Repository non trovato o non accessibile");const r=await s.json();n.style.display="block",n.querySelector("#repo-avatar").src=r.owner.avatar_url,n.querySelector("#repo-name").textContent=r.full_name,n.querySelector("#repo-description").textContent=r.description||"Nessuna descrizione",n.querySelector("#repo-stars").textContent=r.stargazers_count,n.querySelector("#repo-forks").textContent=r.forks_count,n.querySelector("#repo-updated").textContent=new Date(r.updated_at).toLocaleDateString();const o={name:r.name,description:r.description,category:"tools",version:"1.0.0",githubUrl:t};this.populateMetadataForm(o);const c=document.getElementById("section-metadata");c&&(c.style.display="block"),this.currentImportData={type:"github",url:t,githubUrl:t,repoData:r,metadata:o};const l=document.getElementById("start-import");l&&(l.disabled=!1)}catch(a){console.error("Errore fetch GitHub:",a),m(`Errore: ${a.message}`,"error")}}async startImport(){if(!this.currentImportData){m("Nessun dato da importare","error");return}try{this.showImportProgress(!0);const t=this.collectFormData(),n=this.validateAppData(t);if(!n.valid)throw new Error(n.error);const i={...this.currentImportData.metadata,...t,type:this.currentImportData.type,url:this.currentImportData.url,githubUrl:this.currentImportData.githubUrl,files:this.currentImportData.files,content:this.currentImportData.content};console.log(`🚀 Installazione app: ${i.name}`),console.log(`📋 Modalità di lancio app-specifica: ${i.metadata?.launchMode||"non specificata"}`);const a=await A.getSetting("defaultLaunchMode","newpage");console.log(`🌐 Modalità di lancio globale: ${a}`);const s=i.metadata?.launchMode||a;console.log(`✅ Modalità finale per questa app: ${s}`),this.updateImportProgress(50,"Salvando app...");const r=await A.installApp(i);this.updateImportProgress(100,"Importazione completata!"),setTimeout(()=>{O("app-import-modal"),m(`App "${i.name}" importata con successo!`,"success"),window.aideasApp&&window.aideasApp.loadApps&&window.aideasApp.loadApps()},1e3)}catch(t){console.error("Errore durante l'importazione:",t),m(`Errore importazione: ${t.message}`,"error"),this.showImportProgress(!1)}}extractZipMetadata(t,n){const i={name:n?.name||"App Importata",description:n?.description||"",version:n?.version||"1.0.0",category:n?.category||"tools",tags:n?.tags||[],icon:n?.icon||null,permissions:n?.permissions||[]};if(!i.icon){const a=t.find(s=>s.filename.match(/^(icon|logo|app-icon)\.(png|jpg|jpeg|svg)$/i));if(a){const s=new Blob([a.content],{type:a.mimeType});i.icon=URL.createObjectURL(s)}}return i}async extractUrlMetadata(t){const n=gt(t),i=new URL(t).origin;try{const a=await this.fetchManifest(t);if(a)return{name:a.name||a.short_name||n,title:a.name||a.short_name||n,description:a.description||`Progressive Web App da ${n}`,category:"pwa",url:t,icon:this.getBestIcon(a.icons,i),isPWA:!0,manifest:a,version:a.version||"1.0.0",theme_color:a.theme_color,background_color:a.background_color};const s=await this.fetchHtmlMetadata(t);if(s){const r=s.icon||s.appleTouchIcon||`https://www.google.com/s2/favicons?domain=${n}&sz=64`;return{name:s.title||s.ogTitle||n,title:s.title||s.ogTitle||n,description:s.description||s.ogDescription||`App web da ${n}`,category:"tools",url:t,icon:r,isPWA:!1,version:"1.0.0"}}return{name:n,title:n,description:`App web da ${n}`,category:"tools",url:t,icon:`https://www.google.com/s2/favicons?domain=${n}&sz=64`,isPWA:!1,version:"1.0.0"}}catch(a){return console.error("Errore estrazione metadati:",a),{name:n,title:n,description:`App web da ${n}`,category:"tools",url:t,icon:`https://www.google.com/s2/favicons?domain=${n}&sz=64`,isPWA:!1,version:"1.0.0"}}}async fetchManifest(t){try{const i=`${new URL(t).origin}/manifest.json`,a=await fetch(i,{method:"GET",headers:{Accept:"application/json"}});if(a.ok){const s=await a.json();if(s.name||s.short_name)return s}return null}catch(n){return console.log("Manifest non trovato:",n),null}}async fetchHtmlMetadata(t){try{const n=await this.proxyService.extractMetadata(t);return{title:n.title||n.ogTitle,description:n.description||n.ogDescription,icon:n.icon,appleTouchIcon:n.appleTouchIcon,keywords:n.keywords,author:n.author,ogImage:n.ogImage,ogTitle:n.ogTitle,ogDescription:n.ogDescription}}catch(n){console.log("Impossibile estrarre metadati HTML con proxy, provo approccio diretto:",n);try{const i=await fetch(t,{method:"GET",headers:{Accept:"text/html"}});if(!i.ok)throw new Error("Pagina non accessibile");const a=await i.text(),s=a.match(/<title[^>]*>([^<]+)<\/title>/i),r=a.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i),o=a.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i),c=a.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i),l=new URL(t).origin;return{title:s?s[1].trim():null,description:r?r[1].trim():null,icon:o?new URL(o[1],l).href:null,appleTouchIcon:c?new URL(c[1],l).href:null}}catch(i){return console.log("Anche l'approccio diretto è fallito:",i),null}}}getBestIcon(t,n){if(!t||!Array.isArray(t))return null;const i=["512x512","192x192","144x144","96x96"];for(const a of i){const s=t.find(r=>r.sizes===a||r.sizes&&r.sizes.includes(a));if(s)return new URL(s.src,n).href}return t.length>0?new URL(t[0].src,n).href:null}parseGitHubUrl(t){const n=[/github\.com\/([^\/]+)\/([^\/]+)/,/([^\/]+)\.github\.io\/([^\/]+)/];for(const i of n){const a=t.match(i);if(a)return{owner:a[1],repo:a[2].replace(".git","")}}return null}isGitHubUrl(t){return t.includes("github.com")||t.includes("github.io")}getMimeType(t){const n=t.split(".").pop().toLowerCase();return{html:"text/html",css:"text/css",js:"application/javascript",json:"application/json",png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",gif:"image/gif",svg:"image/svg+xml",txt:"text/plain"}[n]||"application/octet-stream"}getCategoryLabel(t){return{productivity:"Produttività",entertainment:"Intrattenimento",tools:"Strumenti",games:"Giochi",ai:"Intelligenza Artificiale",social:"Social",education:"Educazione",business:"Business",utility:"Utilità",pwa:"Progressive Web App"}[t]||t}populateMetadataForm(t){const n={"app-name":t.name||t.title,"app-description":t.description,"app-version":t.version,"app-category":t.category,"app-tags":Array.isArray(t.tags)?t.tags.join(", "):t.tags,"app-icon":t.icon};for(const[i,a]of Object.entries(n)){const s=document.getElementById(i);s&&a&&(s.value=a,s.dispatchEvent(new Event("input")),s.dispatchEvent(new Event("change")))}if(t.isPWA&&t.manifest){if(t.theme_color){const i=document.getElementById("app-theme-color");i&&(i.value=t.theme_color)}if(t.background_color){const i=document.getElementById("app-bg-color");i&&(i.value=t.background_color)}}}collectFormData(){const t=document.getElementById("app-name"),n=document.getElementById("app-description"),i=document.getElementById("app-version"),a=document.getElementById("app-category"),s=document.getElementById("app-launch-mode"),r=document.getElementById("app-tags"),o=document.getElementById("app-icon"),c=r?.value?r.value.split(",").map(p=>p.trim()).filter(p=>p):[],l={name:t?.value.trim()||"",description:n?.value.trim()||"",version:i?.value.trim()||"1.0.0",category:a?.value||"tools",tags:c,icon:o?.value.trim()||null};return s&&s.value?(l.metadata=l.metadata||{},l.metadata.launchMode=s.value,console.log(`📝 Modalità di lancio specificata per app: ${s.value}`)):console.log("📝 Nessuna modalità specifica, userà impostazione globale"),l}validateAppData(t){return t.name?t.name.length>50?{valid:!1,error:"Nome app troppo lungo (max 50 caratteri)"}:t.description&&t.description.length>200?{valid:!1,error:"Descrizione troppo lunga (max 200 caratteri)"}:{valid:!0}:{valid:!1,error:"Nome app richiesto"}}showImportProgress(t){const n=document.getElementById("import-progress"),i=document.getElementById("modal-actions");n&&i&&(n.style.display=t?"block":"none",i.style.display=t?"none":"flex")}updateImportProgress(t,n){const i=document.getElementById("progress-fill"),a=document.getElementById("progress-text");i&&(i.style.width=`${t}%`),a&&(a.textContent=n)}enableImportButton(){const t=document.getElementById("start-import");t&&(t.disabled=!1)}disableImportButton(){const t=document.getElementById("start-import");t&&(t.disabled=!0)}setupDropZone(){["dragenter","dragover","dragleave","drop"].forEach(t=>{document.addEventListener(t,n=>{n.preventDefault(),n.stopPropagation()},!1)}),document.addEventListener("drop",t=>{const n=t.dataTransfer.files[0];n&&n.name.endsWith(".zip")&&(this.showModal(),setTimeout(()=>{this.handleZipFile(n)},200))})}setupKeyboardShortcuts(){document.addEventListener("keydown",t=>{(t.ctrlKey||t.metaKey)&&t.key==="i"&&(t.preventDefault(),this.showModal())})}async handleIconUpload(t,n,i){if(!t.type.startsWith("image/")){m("Per favore seleziona un file immagine","error");return}if(t.size>2*1024*1024){m("Immagine troppo grande (max 2MB)","error");return}try{const a=new FileReader;a.onload=s=>{const r=s.target.result;n.value=r,this.showIconPreview(r,i)},a.readAsDataURL(t)}catch(a){console.error("Errore upload icona:",a),m("Errore durante l'upload dell'icona","error")}}showIconPreview(t,n){if(!n)return;const i=n.querySelector("#icon-preview-img");i&&(i.src=t,i.onload=()=>{n.style.display="block"},i.onerror=()=>{n.style.display="none",m("Impossibile caricare l'icona","warning")})}async handleHtmlFile(t){if(!t.type.startsWith("text/html")){m("Per favore seleziona un file HTML","error");return}if(t.size>2*1024*1024){m("File troppo grande (max 2MB)","error");return}try{const n=await t.text(),i=this.extractHtmlMetadata(n,t.name);this.populateMetadataForm(i);const a=document.getElementById("section-metadata");a&&(a.style.display="block",a.classList.add("active")),this.currentImportData={type:"html",content:n,metadata:i},this.enableImportButton(),m("File HTML analizzato con successo!","success")}catch(n){console.error("Errore durante l'importazione del file HTML:",n),m("Errore durante l'importazione del file HTML","error")}}extractHtmlMetadata(t,n){const a=new DOMParser().parseFromString(t,"text/html"),s=a.querySelector("title")?.textContent?.trim()||a.querySelector('meta[property="og:title"]')?.getAttribute("content")||n.replace(".html","").replace(/[-_]/g," "),r=a.querySelector('meta[name="description"]')?.getAttribute("content")||a.querySelector('meta[property="og:description"]')?.getAttribute("content")||"App web standalone";let o=null;const c=a.querySelector('link[rel="icon"]')?.getAttribute("href")||a.querySelector('link[rel="shortcut icon"]')?.getAttribute("href")||a.querySelector('link[rel="apple-touch-icon"]')?.getAttribute("href");c&&(c.startsWith("data:")||c.startsWith("http")?o=c:o=null);const p=(a.querySelector('meta[name="keywords"]')?.getAttribute("content")||"").split(",").map(v=>v.trim()).filter(v=>v.length>0);let f="tools";const g=a.body?.textContent?.toLowerCase()||"";return g.includes("calcolatric")||g.includes("calculator")?f="utilities":g.includes("game")||g.includes("gioco")?f="games":(g.includes("editor")||g.includes("text"))&&(f="productivity"),{name:s,description:r,category:f,type:"html",content:t,icon:o,tags:p,version:"1.0.0"}}}class Zs{static render(t,n="grid"){return n==="list"?this.renderListView(t):this.renderGridView(t)}static renderGridView(t){const{id:n,name:i,description:a,category:s,version:r,type:o,lastUsed:c,installDate:l,favorite:p,tags:f,icon:g,url:v,githubUrl:b,metadata:S}=t,P=N(i||"App Senza Nome"),w=N(a||"Nessuna descrizione disponibile"),H=this.getCategoryInfo(s),ne=this.getAppIcon(t),W=this.getTypeInfo(o),Y=he(c);return`
      <div class="app-card" data-app-id="${n}" data-category="${s}" data-type="${o}">
        <!-- App Icon & Status -->
        <div class="app-card-header">
          <div class="app-icon-container">
            ${ne}
            <div class="app-type-badge" title="${W.label}">
              ${W.icon}
            </div>
          </div>
          
          <!-- Favorite Button -->
          <button 
            class="app-card-favorite ${p?"is-favorite":""}" 
            data-app-id="${n}"
            aria-label="${p?"Rimuovi dai preferiti":"Aggiungi ai preferiti"}"
            title="${p?"Rimuovi dai preferiti":"Aggiungi ai preferiti"}"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z"/>
            </svg>
          </button>
        </div>

        <!-- App Info -->
        <div class="app-card-body">
          <!-- App Name -->
          <div class="app-card-title">
            <div class="app-name" title="${P}">${P}</div>
          </div>

          <!-- Tags -->
          ${f&&f.length>0?`
            <div class="app-tags">
              ${f.slice(0,3).map(k=>`
                <span class="app-tag">${N(k)}</span>
              `).join("")}
              ${f.length>3?`<span class="app-tag-more">+${f.length-3}</span>`:""}
            </div>
          `:""}

          <!-- Metadata -->
          <div class="app-metadata">
            <div class="app-category" title="Categoria">
              ${H.icon}
              <span>${H.name}</span>
            </div>
            <div class="app-last-used" title="Ultimo utilizzo: ${new Date(c).toLocaleString()}">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.7L16.2,16.2Z"/>
              </svg>
              <span>${Y}</span>
            </div>
          </div>

          <!-- App Description -->
          <div class="app-description-container">
            <p class="app-description" title="${w}">
              ${this.truncateText(w,100)}
            </p>
          </div>
        </div>

        <!-- App Actions -->
        <div class="app-card-actions">
          <button 
            class="app-card-launch btn btn-primary" 
            data-app-id="${n}"
            aria-label="Avvia ${P}"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
            </svg>
            Avvia
          </button>
          
          <div class="app-card-menu-container">
            <button 
              class="app-card-menu btn btn-secondary" 
              data-app-id="${n}"
              aria-label="Menu ${P}"
              title="Opzioni app"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Hover Overlay -->
        <div class="app-card-overlay">
          <div class="app-card-overlay-content">
            <div class="app-overlay-stats">
              <div class="stat">
                <span class="stat-label">Installata:</span>
                <span class="stat-value">${he(l)}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Tipo:</span>
                <span class="stat-value">${W.label}</span>
              </div>
              ${S?.size?`
                <div class="stat">
                  <span class="stat-label">Dimensione:</span>
                  <span class="stat-value">${re(S.size)}</span>
                </div>
              `:""}
            </div>
          </div>
        </div>
      </div>
    `}static renderListView(t){const{id:n,name:i,description:a,category:s,version:r,type:o,lastUsed:c,installDate:l,favorite:p,tags:f,metadata:g}=t,v=N(i||"App Senza Nome");N(a||"Nessuna descrizione disponibile");const b=this.getCategoryInfo(s),S=this.getAppIcon(t),P=this.getTypeInfo(o),w=he(c),H=he(l);return`
      <div class="app-card app-card-list" data-app-id="${n}" data-category="${s}" data-type="${o}">
        <!-- App Icon -->
        <div class="app-list-icon">
          ${S}
          <div class="app-type-badge-mini" title="${P.label}">
            ${P.icon}
          </div>
        </div>

        <!-- App Info -->
        <div class="app-list-info">
          <div class="app-list-header">
            <h3 class="app-list-name">${v}</h3>
            <span class="app-list-version">v${r||"1.0.0"}</span>
            <div class="app-list-category" title="Categoria">
              ${b.icon}
              <span>${b.name}</span>
            </div>
          </div>
          
          <!-- Tags in list view -->
          ${f&&f.length>0?`
            <div class="app-list-tags">
              ${f.slice(0,5).map(ne=>`
                <span class="app-tag app-tag-small">${N(ne)}</span>
              `).join("")}
              ${f.length>5?`<span class="app-tag-more app-tag-small">+${f.length-5}</span>`:""}
            </div>
          `:""}
        </div>

        <!-- App Metadata -->
        <div class="app-list-metadata">
          <div class="app-list-stat">
            <span class="stat-label">Ultimo utilizzo:</span>
            <span class="stat-value">${w}</span>
          </div>
          <div class="app-list-stat">
            <span class="stat-label">Installata:</span>
            <span class="stat-value">${H}</span>
          </div>
          ${g?.size?`
            <div class="app-list-stat">
              <span class="stat-label">Dimensione:</span>
              <span class="stat-value">${re(g.size)}</span>
            </div>
          `:""}
        </div>

        <!-- App Actions -->
        <div class="app-list-actions">
          <button 
            class="app-card-favorite ${p?"is-favorite":""}" 
            data-app-id="${n}"
            aria-label="${p?"Rimuovi dai preferiti":"Aggiungi ai preferiti"}"
            title="${p?"Rimuovi dai preferiti":"Aggiungi ai preferiti"}"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z"/>
            </svg>
          </button>
          
          <button 
            class="app-card-launch btn btn-primary" 
            data-app-id="${n}"
            aria-label="Avvia ${v}"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
            </svg>
            Avvia
          </button>
          
          <button 
            class="app-card-menu btn btn-secondary" 
            data-app-id="${n}"
            aria-label="Menu ${v}"
            title="Opzioni app"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z"/>
            </svg>
          </button>
        </div>
      </div>
    `}static getAppIcon(t){if(t.icon){if(t.icon.startsWith("data:")||t.icon.startsWith("http"))return`<img src="${t.icon}" alt="${t.name}" class="app-icon" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="app-icon-fallback" style="display: none;">${this.getDefaultIcon(t.type)}</div>`;if(t.icon.includes("<svg"))return`<div class="app-icon app-icon-svg">${t.icon}</div>`}return`<div class="app-icon app-icon-default">${this.getDefaultIcon(t.type)}</div>`}static getDefaultIcon(t){const n={zip:`<svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
      </svg>`,url:`<svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.36,14C16.44,13.34 16.5,12.68 16.5,12C16.5,11.32 16.44,10.66 16.36,10H19.74C19.9,10.64 20,11.31 20,12C20,12.69 19.9,13.36 19.74,14M14.59,19.56C15.19,18.45 15.65,17.25 15.97,16H18.92C17.96,17.65 16.43,18.93 14.59,19.56M14.34,14H9.66C9.56,13.34 9.5,12.68 9.5,12C9.5,11.32 9.56,10.65 9.66,10H14.34C14.43,10.65 14.5,11.32 14.5,12C14.5,12.68 14.43,13.34 14.34,14M12,19.96C11.17,18.76 10.5,17.43 10.09,16H13.91C13.5,17.43 12.83,18.76 12,19.96M8,8H5.08C6.03,6.34 7.57,5.06 9.4,4.44C8.8,5.55 8.35,6.75 8,8M5.08,16H8C8.35,17.25 8.8,18.45 9.4,19.56C7.57,18.93 6.03,17.65 5.08,16M4.26,14C4.1,13.36 4,12.69 4,12C4,11.31 4.1,10.64 4.26,10H7.64C7.56,10.66 7.5,11.32 7.5,12C7.5,12.68 7.56,13.34 7.64,14M12,4.03C12.83,5.23 13.5,6.57 13.91,8H10.09C10.5,6.57 11.17,5.23 12,4.03M18.92,8H15.97C15.65,6.75 15.19,5.55 14.59,4.44C16.43,5.07 17.96,6.34 18.92,8Z"/>
      </svg>`,github:`<svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z"/>
      </svg>`,pwa:`<svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C9,20 10,19 11,17H12C14,15 16,13 17,8M18.5,2C16.7,2 15.14,2.9 14.22,4.22L15.63,5.63C16.07,5 16.72,4.5 17.5,4.5C18.61,4.5 19.5,5.39 19.5,6.5C19.5,7.28 19,7.93 18.37,8.37L19.78,9.78C21.1,8.86 22,7.3 22,5.5C22,3.57 20.43,2 18.5,2Z"/>
      </svg>`};return n[t]||n.url}static getTypeInfo(t){const n={zip:{label:"App ZIP",icon:`<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
        </svg>`},url:{label:"Web App",icon:`<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M10.59,13.41C11,13.8 11,14.4 10.59,14.81C10.2,15.2 9.6,15.2 9.19,14.81L7.77,13.39L6.36,14.81C5.95,15.22 5.34,15.22 4.93,14.81C4.53,14.4 4.53,13.8 4.93,13.39L6.34,12L4.93,10.59C4.53,10.2 4.53,9.59 4.93,9.18C5.34,8.78 5.95,8.78 6.36,9.18L7.77,10.6L9.19,9.19C9.6,8.78 10.2,8.78 10.59,9.19C11,9.6 11,10.2 10.59,10.61L9.17,12L10.59,13.41M19.07,4.93C19.47,5.34 19.47,5.95 19.07,6.36L17.65,7.77L19.07,9.19C19.47,9.6 19.47,10.2 19.07,10.61C18.66,11 18.05,11 17.64,10.61L16.23,9.19L14.81,10.61C14.4,11 13.8,11 13.39,10.61C13,10.2 13,9.6 13.39,9.19L14.81,7.77L13.39,6.36C13,5.95 13,5.34 13.39,4.93C13.8,4.53 14.4,4.53 14.81,4.93L16.23,6.34L17.64,4.93C18.05,4.53 18.66,4.53 19.07,4.93Z"/>
        </svg>`},github:{label:"GitHub App",icon:`<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z"/>
        </svg>`},pwa:{label:"PWA",icon:`<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z"/>
        </svg>`}};return n[t]||n.url}static getCategoryInfo(t){const n={productivity:{name:"Produttività",icon:`<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M16,6L18.29,8.29L13.41,13.17L9.41,9.17L2,16.59L3.41,18L9.41,12L13.41,16L19.71,9.71L22,12V6H16Z"/>
        </svg>`},entertainment:{name:"Intrattenimento",icon:`<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M13,2.05V5.08C16.39,5.57 19,8.47 19,12C19,12.9 18.82,13.75 18.5,14.54L21.12,16.07C21.68,14.83 22,13.45 22,12C22,6.82 18.05,2.55 13,2.05M12,19A7,7 0 0,1 5,12C5,8.47 7.61,5.57 11,5.08V2.05C5.94,2.55 2,6.81 2,12A10,10 0 0,0 12,22C15.3,22 18.23,20.39 20.05,17.91L17.45,16.38C16.17,18 14.21,19 12,19Z"/>
        </svg>`},tools:{name:"Strumenti",icon:`<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.7,19L13.6,9.9C14.5,7.6 14,4.9 12.1,3C10.1,1 7.1,0.6 4.7,1.7L9,6L6,9L1.6,4.7C0.4,7.1 0.9,10.1 2.9,12.1C4.8,14 7.5,14.5 9.8,13.6L18.9,22.7C19.3,23.1 19.9,23.1 20.3,22.7L22.6,20.4C23.1,20 23.1,19.3 22.7,19Z"/>
        </svg>`},games:{name:"Giochi",icon:`<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M7.97,16L5,19C4.67,19.3 4.23,19.5 3.75,19.5A1.75,1.75 0 0,1 2,17.75V17.5L3,10.12C3.21,7.81 5.14,6 7.5,6H16.5C18.86,6 20.79,7.81 21,10.12L22,17.5V17.75A1.75,1.75 0 0,1 20.25,19.5C19.77,19.5 19.33,19.3 19,19L16.03,16H7.97M9.5,8A1.5,1.5 0 0,0 8,9.5A1.5,1.5 0 0,0 9.5,11A1.5,1.5 0 0,0 11,9.5A1.5,1.5 0 0,0 9.5,8M14.5,8A1.5,1.5 0 0,0 13,9.5A1.5,1.5 0 0,0 14.5,11A1.5,1.5 0 0,0 16,9.5A1.5,1.5 0 0,0 14.5,8Z"/>
        </svg>`},ai:{name:"Intelligenza Artificiale",icon:`<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7.27C13.6,7.61 14,8.26 14,9A2,2 0 0,1 12,11A2,2 0 0,1 10,9A2,2 0 0,1 12,7A2,2 0 0,1 14,9A2,2 0 0,1 12,11A2,2 0 0,1 10,9C10,8.26 10.4,7.61 11,7.27V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M9,9A2,2 0 0,1 11,11A2,2 0 0,1 9,13A2,2 0 0,1 7,11A2,2 0 0,1 9,9M15,9A2,2 0 0,1 17,11A2,2 0 0,1 15,13A2,2 0 0,1 13,11A2,2 0 0,1 15,9M12,12A2,2 0 0,1 14,14C14,14.74 13.6,15.39 13,15.73V17.27C13.6,17.61 14,18.26 14,19A2,2 0 0,1 12,21A2,2 0 0,1 10,19A2,2 0 0,1 12,17A2,2 0 0,1 14,19A2,2 0 0,1 12,21A2,2 0 0,1 10,19C10,18.26 10.4,17.61 11,17.27V15.73C10.4,15.39 10,14.74 10,14A2,2 0 0,1 12,12Z"/>
        </svg>`},social:{name:"Social",icon:`<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z"/>
        </svg>`},uncategorized:{name:"Altro",icon:`<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z"/>
        </svg>`}};return n[t]||n.uncategorized}static truncateText(t,n){return!t||t.length<=n?t:t.substring(0,n).trim()+"..."}static generateContextMenu(t){const{id:n,name:i,type:a,favorite:s,githubUrl:r,url:o}=t;return`
      <div class="app-context-menu" data-app-id="${n}">
        <div class="context-menu-item" data-action="launch">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
          </svg>
          Avvia
        </div>
        
        <div class="context-menu-item" data-action="favorite">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z"/>
          </svg>
          ${s?"Rimuovi dai preferiti":"Aggiungi ai preferiti"}
        </div>
        
        <div class="context-menu-separator"></div>
        
        <div class="context-menu-item" data-action="edit">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
          </svg>
          Modifica
        </div>
        
        <div class="context-menu-item" data-action="duplicate">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"/>
          </svg>
          Duplica
        </div>
        
        <div class="context-menu-item" data-action="export">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
          Esporta
        </div>
        
        ${r||o?`
          <div class="context-menu-separator"></div>
          ${r?`
            <div class="context-menu-item" data-action="open-github">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z"/>
              </svg>
              Apri GitHub
            </div>
          `:""}
          ${o&&a==="url"?`
            <div class="context-menu-item" data-action="open-original">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z"/>
              </svg>
              Apri originale
            </div>
          `:""}
        `:""}
        
        <div class="context-menu-separator"></div>
        
        <div class="context-menu-item context-menu-danger" data-action="delete">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
          </svg>
          Elimina
        </div>
      </div>
    `}}class Ks{constructor(){this.currentSettings={},this.defaultSettings={language:"it",theme:"auto",defaultLaunchMode:"newpage",maxConcurrentApps:5,showAppTooltips:!0,enableKeyboardShortcuts:!0,autoUpdateApps:!1,viewMode:"grid",sortBy:"lastUsed",showWelcomeMessage:!0,enableAnimations:!0,compactMode:!1,syncEnabled:!1,syncProvider:"github",autoSyncInterval:60,backupBeforeSync:!0,analyticsEnabled:!1,crashReportingEnabled:!0,allowTelemetry:!1,validateAppsOnLaunch:!0,sandboxMode:"strict",enableServiceWorker:!0,cacheStrategy:"aggressive",preloadApps:!1,lazyLoadImages:!0,enableDebugMode:!1,showConsoleErrors:!1,enableExperimentalFeatures:!1},this.disabledFeatures={syncEnabled:!0,autoUpdateApps:!0,analyticsEnabled:!0,crashReportingEnabled:!0,allowTelemetry:!0,enableServiceWorker:!0,preloadApps:!0,enableExperimentalFeatures:!0},this.init=this.init.bind(this),this.showModal=this.showModal.bind(this),this.loadSettings=this.loadSettings.bind(this),this.saveSettings=this.saveSettings.bind(this),this.resetSettings=this.resetSettings.bind(this),this.exportSettings=this.exportSettings.bind(this),this.importSettings=this.importSettings.bind(this)}async init(){try{console.log("⚙️ Inizializzazione pannello impostazioni..."),await this.loadSettings(),await this.validateAndFixSettings(),this.applySettings(),console.log("✅ Pannello impostazioni inizializzato")}catch(t){console.error("❌ Errore inizializzazione pannello impostazioni:",t)}}async validateAndFixSettings(){console.log("🔍 Verifica impostazioni...");let t=!1;const n={...this.currentSettings};(!n.defaultLaunchMode||!["iframe","newpage"].includes(n.defaultLaunchMode))&&(console.log('⚠️ defaultLaunchMode non valido, correzione a "newpage"'),n.defaultLaunchMode="newpage",t=!0);const i={maxConcurrentApps:{min:1,max:10,default:5},autoSyncInterval:{min:5,max:1440,default:60},language:{valid:["it","en"],default:"it"},theme:{valid:["light","dark","auto"],default:"auto"}};for(const[a,s]of Object.entries(i)){const r=n[a];s.min!==void 0&&s.max!==void 0?(typeof r!="number"||r<s.min||r>s.max)&&(console.log(`⚠️ ${a} non valido (${r}), correzione a ${s.default}`),n[a]=s.default,t=!0):s.valid&&(s.valid.includes(r)||(console.log(`⚠️ ${a} non valido (${r}), correzione a ${s.default}`),n[a]=s.default,t=!0))}if(t){console.log("💾 Salvataggio correzioni impostazioni..."),this.currentSettings=n;for(const[a,s]of Object.entries(n))await A.setSetting(a,s);console.log("✅ Impostazioni corrette salvate")}else console.log("✅ Tutte le impostazioni sono valide")}async loadSettings(){try{const t=await A.getAllSettings();this.currentSettings={...this.defaultSettings,...t}}catch(t){console.error("Errore caricamento impostazioni:",t),this.currentSettings={...this.defaultSettings}}}applySettings(){this.applyTheme(this.currentSettings.theme),this.applyLanguage(this.currentSettings.language),this.applyAnimations(this.currentSettings.enableAnimations),this.applyCompactMode(this.currentSettings.compactMode),this.applyDebugMode(this.currentSettings.enableDebugMode)}showModal(){const t=this.createSettingsModal();D("settings-modal",t,{size:"modal-xl",disableBackdropClose:!1}),setTimeout(()=>{this.setupModalEventListeners(),this.populateForm(),this.markDisabledFeatures(),this.showSection("general")},100)}createSettingsModal(){return`
      <div class="modal-header">
        <h2>
          <svg viewBox="0 0 24 24" fill="currentColor" class="header-icon">
            <path d="M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10M10,22C9.75,22 9.54,21.82 9.5,21.58L9.13,18.93C8.5,18.68 7.96,18.34 7.44,17.94L4.95,18.95C4.73,19.03 4.46,18.95 4.34,18.73L2.34,15.27C2.21,15.05 2.27,14.78 2.46,14.63L4.57,12.97L4.5,12L4.57,11L2.46,9.37C2.27,9.22 2.21,8.95 2.34,8.73L4.34,5.27C4.46,5.05 4.73,4.96 4.95,5.05L7.44,6.05C7.96,5.66 8.5,5.32 9.13,5.07L9.5,2.42C9.54,2.18 9.75,2 10,2H14C14.25,2 14.46,2.18 14.5,2.42L14.87,5.07C15.5,5.32 16.04,5.66 16.56,6.05L19.05,5.05C19.27,4.96 19.54,5.05 19.66,5.27L21.66,8.73C21.79,8.95 21.73,9.22 21.54,9.37L19.43,11L19.5,12L19.43,13L21.54,14.63C21.73,14.78 21.79,15.05 21.66,15.27L19.66,18.73C19.54,18.95 19.27,19.04 19.05,18.95L16.56,17.95C16.04,18.34 15.5,18.68 14.87,18.93L14.5,21.58C14.46,21.82 14.25,22 14,22H10M11.25,4L10.88,6.61C9.68,6.86 8.62,7.5 7.85,8.39L5.44,7.35L4.69,8.65L6.8,10.2C6.4,11.37 6.4,12.64 6.8,13.8L4.68,15.36L5.43,16.66L7.86,15.62C8.63,16.5 9.68,17.14 10.87,17.38L11.24,20H12.76L13.13,17.39C14.32,17.14 15.37,16.5 16.14,15.62L18.57,16.66L19.32,15.36L17.2,13.81C17.6,12.64 17.6,11.37 17.2,10.2L19.31,8.65L18.56,7.35L16.15,8.39C15.38,7.5 14.32,6.86 13.12,6.62L12.75,4H11.25Z"/>
          </svg>
          Impostazioni AIdeas
        </h2>
        <button class="modal-close">&times;</button>
      </div>
      
      <div class="modal-body">
        <!-- Settings Navigation -->
        <div class="settings-layout">
          <nav class="settings-nav">
            <ul class="settings-nav-list">
              <li class="settings-nav-item">
                <button class="settings-nav-btn btn btn-secondary active" type="button" data-section="general">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4Z"/>
                  </svg>
                  Generale
                </button>
              </li>
              <li class="settings-nav-item">
                <button class="settings-nav-btn btn btn-secondary" type="button" data-section="launcher">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
                  </svg>
                  Launcher
                </button>
              </li>
              <li class="settings-nav-item">
                <button class="settings-nav-btn btn btn-secondary" type="button" data-section="interface">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21,16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V7.5C3,7.12 3.21,6.79 3.53,6.62L11.43,2.18C11.59,2.06 11.79,2 12,2C12.21,2 12.41,2.06 12.57,2.18L20.47,6.62C20.79,6.79 21,7.12 21,7.5V16.5M12,4.15L6.04,7.5L12,10.85L17.96,7.5L12,4.15Z"/>
                  </svg>
                  Interfaccia
                </button>
              </li>
              <li class="settings-nav-item">
                <button class="settings-nav-btn btn btn-secondary" type="button" data-section="sync">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,18A6,6 0 0,1 6,12C6,11 6.25,10.03 6.7,9.2L5.24,7.74C4.46,8.97 4,10.43 4,12A8,8 0 0,0 12,20V23L16,19L12,15M12,4V1L8,5L12,9V6A6,6 0 0,1 18,12C18,13 17.75,13.97 17.3,14.8L18.76,16.26C19.54,15.03 20,13.57 20,12A8,8 0 0,0 12,4Z"/>
                  </svg>
                  Sincronizzazione
                </button>
              </li>
              <li class="settings-nav-item">
                <button class="settings-nav-btn btn btn-secondary" type="button" data-section="privacy">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11H16V18H8V11H9.2V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.4,8.7 10.4,10V11H13.6V10C13.6,8.7 12.8,8.2 12,8.2Z"/>
                  </svg>
                  Privacy & Sicurezza
                </button>
              </li>
              <li class="settings-nav-item">
                <button class="settings-nav-btn btn btn-secondary" type="button" data-section="performance">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12H16A4,4 0 0,0 12,8V6Z"/>
                  </svg>
                  Performance
                </button>
              </li>
              <li class="settings-nav-item">
                <button class="settings-nav-btn btn btn-secondary" type="button" data-section="advanced">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C9,20 10,19 11,17H12C14,15 16,13 17,8M18.5,2C16.7,2 15.14,2.9 14.22,4.22L15.63,5.63C16.07,5 16.72,4.5 17.5,4.5C18.61,4.5 19.5,5.39 19.5,6.5C19.5,7.28 19,7.93 18.37,8.37L19.78,9.78C21.1,8.86 22,7.3 22,5.5C22,3.57 20.43,2 18.5,2Z"/>
                  </svg>
                  Avanzate
                </button>
              </li>
            </ul>
          </nav>

          <!-- Settings Content -->
          <div class="settings-content">
            
            <!-- General Section -->
            <div class="settings-section active" id="section-general">
              <h3>Impostazioni Generali</h3>
              
              <div class="settings-group">
                <h4>Localizzazione</h4>
                
                <div class="setting-item">
                  <label for="setting-language">Lingua</label>
                  <select id="setting-language" class="form-input">
                    <option value="it">Italiano</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                  <p class="setting-description">Lingua dell'interfaccia utente</p>
                </div>
                
                <div class="setting-item">
                  <label for="setting-theme">Tema</label>
                  <select id="setting-theme" class="form-input">
                    <option value="auto">Automatico (segue sistema)</option>
                    <option value="light">Chiaro</option>
                    <option value="dark">Scuro</option>
                  </select>
                  <p class="setting-description">Aspetto dell'interfaccia</p>
                </div>
              </div>
              
              <div class="settings-group">
                <h4>Comportamento</h4>
                
                <div class="setting-item">
                  <label class="setting-checkbox">
                    <input type="checkbox" id="setting-showWelcomeMessage">
                    <span class="checkmark"></span>
                    Mostra messaggio di benvenuto
                  </label>
                  <p class="setting-description">Visualizza il messaggio al primo avvio</p>
                </div>
                
                <div class="setting-item">
                  <label class="setting-checkbox">
                    <input type="checkbox" id="setting-enableKeyboardShortcuts">
                    <span class="checkmark"></span>
                    Abilita scorciatoie da tastiera
                  </label>
                  <p class="setting-description">Ctrl+K per ricerca, Ctrl+N per nuova app, etc.</p>
                </div>
              </div>
            </div>

            <!-- Launcher Section -->
            <div class="settings-section" id="section-launcher">
              <h3>Configurazione Launcher</h3>
              
              <div class="settings-group">
                <h4>Modalità di Apertura App</h4>
                
                <div class="setting-item">
                  <label for="setting-defaultLaunchMode">Modalità predefinita</label>
                  <select id="setting-defaultLaunchMode" class="form-input">
                    <option value="iframe">Finestra modale (sicura)</option>
                    <option value="newpage">Nuova pagina del browser</option>
                  </select>
                  <p class="setting-description">Come aprire le app per default</p>
                </div>
                
                <div class="setting-item">
                  <label for="setting-maxConcurrentApps">App concorrenti massime</label>
                  <input type="number" id="setting-maxConcurrentApps" class="form-input" min="1" max="20" value="5">
                  <p class="setting-description">Numero massimo di app aperte contemporaneamente</p>
                </div>
                
                <div class="setting-item" id="setting-autoUpdateApps-container">
                  <label class="setting-checkbox">
                    <input type="checkbox" id="setting-autoUpdateApps">
                    <span class="checkmark"></span>
                    Aggiornamento automatico app
                  </label>
                  <p class="setting-description">Controlla automaticamente aggiornamenti da GitHub</p>
                </div>
                
                <div class="setting-item">
                  <label class="setting-checkbox">
                    <input type="checkbox" id="setting-validateAppsOnLaunch">
                    <span class="checkmark"></span>
                    Valida app al lancio
                  </label>
                  <p class="setting-description">Controlla integrità delle app prima dell'esecuzione</p>
                </div>
              </div>
              
              <div class="settings-group">
                <h4>Sandbox e Sicurezza</h4>
                
                <div class="setting-item">
                  <label for="setting-sandboxMode">Modalità sandbox</label>
                  <select id="setting-sandboxMode" class="form-input">
                    <option value="strict">Rigorosa (massima sicurezza)</option>
                    <option value="moderate">Moderata (bilanciata)</option>
                    <option value="permissive">Permissiva (più libertà)</option>
                  </select>
                  <p class="setting-description">Livello di restrizioni per l'esecuzione delle app</p>
                </div>
              </div>
            </div>

            <!-- Interface Section -->
            <div class="settings-section" id="section-interface">
              <h3>Configurazione Interfaccia</h3>
              
              <div class="settings-group">
                <h4>Visualizzazione</h4>
                
                <div class="setting-item">
                  <label for="setting-viewMode">Vista predefinita</label>
                  <select id="setting-viewMode" class="form-input">
                    <option value="grid">Griglia</option>
                    <option value="list">Lista</option>
                  </select>
                  <p class="setting-description">Come visualizzare le app nella dashboard</p>
                </div>
                
                <div class="setting-item">
                  <label for="setting-sortBy">Ordinamento predefinito</label>
                  <select id="setting-sortBy" class="form-input">
                    <option value="lastUsed">Ultimo utilizzo</option>
                    <option value="name">Nome A-Z</option>
                    <option value="installDate">Data installazione</option>
                    <option value="category">Categoria</option>
                  </select>
                  <p class="setting-description">Criterio di ordinamento delle app</p>
                </div>
                
                <div class="setting-item">
                  <label class="setting-checkbox">
                    <input type="checkbox" id="setting-compactMode">
                    <span class="checkmark"></span>
                    Modalità compatta
                  </label>
                  <p class="setting-description">Interfaccia più densa con meno spazi</p>
                </div>
                
                <div class="setting-item">
                  <label class="setting-checkbox">
                    <input type="checkbox" id="setting-enableAnimations">
                    <span class="checkmark"></span>
                    Abilita animazioni
                  </label>
                  <p class="setting-description">Transizioni ed effetti animati</p>
                </div>
                
                <div class="setting-item">
                  <label class="setting-checkbox">
                    <input type="checkbox" id="setting-showAppTooltips">
                    <span class="checkmark"></span>
                    Mostra tooltip
                  </label>
                  <p class="setting-description">Suggerimenti al passaggio del mouse</p>
                </div>
              </div>
            </div>

            <!-- Sync Section -->
            <div class="settings-section" id="section-sync">
              <h3>Sincronizzazione e Backup</h3>
              
              <div class="settings-group">
                <h4>Configurazione Cloud</h4>
                
                <div class="setting-item" id="setting-syncEnabled-container">
                  <label class="setting-checkbox">
                    <input type="checkbox" id="setting-syncEnabled">
                    <span class="checkmark"></span>
                    Abilita sincronizzazione
                  </label>
                  <p class="setting-description">Sincronizza app e impostazioni su cloud</p>
                </div>
                
                <div class="setting-item">
                  <label for="setting-syncProvider">Provider di sincronizzazione</label>
                  <select id="setting-syncProvider" class="form-input">
                    <option value="github">GitHub Gist</option>
                    <option value="googledrive">Google Drive</option>
                  </select>
                  <p class="setting-description">Servizio cloud per la sincronizzazione</p>
                </div>
                
                <div class="setting-item">
                  <label for="setting-autoSyncInterval">Intervallo auto-sync (minuti)</label>
                  <input type="number" id="setting-autoSyncInterval" class="form-input" min="5" max="1440" value="60">
                  <p class="setting-description">Frequenza di sincronizzazione automatica</p>
                </div>
                
                <div class="setting-item">
                  <label class="setting-checkbox">
                    <input type="checkbox" id="setting-backupBeforeSync">
                    <span class="checkmark"></span>
                    Backup prima della sincronizzazione
                  </label>
                  <p class="setting-description">Crea backup locale prima di ogni sync</p>
                </div>
              </div>
              
              <div class="settings-group">
                <h4>Gestione Dati</h4>
                
                <div class="setting-actions">
                  <button class="btn btn-secondary" id="export-settings-btn">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                    Esporta Impostazioni
                  </button>
                  
                  <button class="btn btn-secondary" id="import-settings-btn">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                    Importa Impostazioni
                  </button>
                  
                  <button class="btn btn-warning" id="reset-settings-btn">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,4C14.1,4 16.1,4.8 17.6,6.3C20.7,9.4 20.7,14.5 17.6,17.6C15.8,19.5 13.3,20.2 10.9,19.9L11.4,17.9C13.1,18.1 14.9,17.5 16.2,16.2C18.5,13.9 18.5,10.1 16.2,7.7C15.1,6.6 13.5,6 12,6V10.6L7,5.6L12,0.6V4M6.3,17.6C3.7,15 3.3,11 5.1,7.9L6.6,9.4C5.5,11.6 5.9,14.4 7.8,16.2C8.3,16.7 8.9,17.1 9.6,17.4L9,19.4C8,19 7.1,18.4 6.3,17.6Z"/>
                    </svg>
                    Ripristina Predefinite
                  </button>
                </div>
              </div>
            </div>

            <!-- Privacy Section -->
            <div class="settings-section" id="section-privacy">
              <h3>Privacy e Sicurezza</h3>
              
              <div class="settings-group">
                <h4>Raccolta Dati</h4>
                
                <div class="setting-item" id="setting-analyticsEnabled-container">
                  <label class="setting-checkbox">
                    <input type="checkbox" id="setting-analyticsEnabled">
                    <span class="checkmark"></span>
                    Abilita analytics
                  </label>
                  <p class="setting-description">Raccolta dati anonimi per migliorare l'app</p>
                </div>
                
                <div class="setting-item" id="setting-crashReportingEnabled-container">
                  <label class="setting-checkbox">
                    <input type="checkbox" id="setting-crashReportingEnabled">
                    <span class="checkmark"></span>
                    Report errori automatici
                  </label>
                  <p class="setting-description">Invia automaticamente report degli errori</p>
                </div>
                
                <div class="setting-item" id="setting-allowTelemetry-container">
                  <label class="setting-checkbox">
                    <input type="checkbox" id="setting-allowTelemetry">
                    <span class="checkmark"></span>
                    Telemetria di utilizzo
                  </label>
                  <p class="setting-description">Condividi statistiche d'uso anonime</p>
                </div>
              </div>
              
              <div class="settings-group">
                <h4>Gestione Privacy</h4>
                
                <div class="setting-actions">
                  <button class="btn btn-secondary" id="clear-cache-btn">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                    </svg>
                    Svuota Cache
                  </button>
                  
                  <button class="btn btn-warning" id="clear-all-data-btn">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                    </svg>
                    Elimina Tutti i Dati
                  </button>
                </div>
              </div>
            </div>

            <!-- Performance Section -->
            <div class="settings-section" id="section-performance">
              <h3>Performance e Cache</h3>
              
              <div class="settings-group">
                <h4>Ottimizzazioni</h4>
                
                <div class="setting-item" id="setting-enableServiceWorker-container">
                  <label class="setting-checkbox">
                    <input type="checkbox" id="setting-enableServiceWorker">
                    <span class="checkmark"></span>
                    Abilita Service Worker
                  </label>
                  <p class="setting-description">Cache intelligente e funzionalità offline</p>
                </div>
                
                <div class="setting-item">
                  <label for="setting-cacheStrategy">Strategia cache</label>
                  <select id="setting-cacheStrategy" class="form-input">
                    <option value="aggressive">Aggressiva (più veloce, più spazio)</option>
                    <option value="moderate">Moderata (bilanciata)</option>
                    <option value="minimal">Minimale (meno spazio)</option>
                  </select>
                  <p class="setting-description">Quanto contenuto cachare per l'offline</p>
                </div>
                
                <div class="setting-item" id="setting-preloadApps-container">
                  <label class="setting-checkbox">
                    <input type="checkbox" id="setting-preloadApps">
                    <span class="checkmark"></span>
                    Precarica app frequenti
                  </label>
                  <p class="setting-description">Carica in background le app più usate</p>
                </div>
                
                <div class="setting-item">
                  <label class="setting-checkbox">
                    <input type="checkbox" id="setting-lazyLoadImages">
                    <span class="checkmark"></span>
                    Caricamento lazy delle immagini
                  </label>
                  <p class="setting-description">Carica le immagini solo quando necessario</p>
                </div>
              </div>
              
              <div class="settings-group">
                <h4>Statistiche Storage</h4>
                <div class="storage-stats" id="storage-stats">
                  <div class="stat-item">
                    <span class="stat-label">Spazio utilizzato:</span>
                    <span class="stat-value" id="storage-used">Caricamento...</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">App installate:</span>
                    <span class="stat-value" id="apps-count">Caricamento...</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">Cache size:</span>
                    <span class="stat-value" id="cache-size">Caricamento...</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Advanced Section -->
            <div class="settings-section" id="section-advanced">
              <h3>Impostazioni Avanzate</h3>
              
              <div class="settings-group">
                <h4>Developer Options</h4>
                
                <div class="setting-item">
                  <label class="setting-checkbox">
                    <input type="checkbox" id="setting-enableDebugMode">
                    <span class="checkmark"></span>
                    Modalità debug
                  </label>
                  <p class="setting-description">Mostra informazioni di debug nell'interfaccia</p>
                </div>
                
                <div class="setting-item">
                  <label class="setting-checkbox">
                    <input type="checkbox" id="setting-showConsoleErrors">
                    <span class="checkmark"></span>
                    Mostra errori console
                  </label>
                  <p class="setting-description">Visualizza errori JavaScript nell'interfaccia</p>
                </div>
                
                <div class="setting-item" id="setting-enableExperimentalFeatures-container">
                  <label class="setting-checkbox">
                    <input type="checkbox" id="setting-enableExperimentalFeatures">
                    <span class="checkmark"></span>
                    Funzionalità sperimentali
                  </label>
                  <p class="setting-description">Abilita features in fase di test</p>
                </div>
              </div>
              
              <div class="settings-group">
                <h4>Informazioni Sistema</h4>
                <div class="system-info" id="system-info">
                  <div class="info-item">
                    <span class="info-label">Versione SAKAI:</span>
                    <span class="info-value">1.0.0</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">User Agent:</span>
                    <span class="info-value" id="user-agent">Caricamento...</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Platform:</span>
                    <span class="info-value" id="platform">Caricamento...</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">PWA Support:</span>
                    <span class="info-value" id="pwa-support">Caricamento...</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-secondary" id="cancel-settings" type="button">Annulla</button>
        <button class="btn btn-primary" id="save-settings" type="button">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M15,9H5V5H15M12,19A3,3 0 0,1 9,16A3,3 0 0,1 12,13A3,3 0 0,1 15,16A3,3 0 0,1 12,19M17,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3Z"/>
          </svg>
          Salva Impostazioni
        </button>
      </div>
    `}markDisabledFeatures(){const t=document.getElementById("settings-modal");t&&Object.entries(this.disabledFeatures).forEach(([n,i])=>{if(i){const a=t.querySelector(`#setting-${this.camelToKebab(n)}-container`),s=t.querySelector(`#setting-${this.camelToKebab(n)}`);a&&a.classList.add("disabled"),s&&(s.disabled=!0,s.checked=!1)}})}setupModalEventListeners(){const t=document.getElementById("settings-modal");if(!t)return;t.querySelectorAll(".settings-nav-btn").forEach(i=>{i.addEventListener("click",()=>{const a=i.dataset.section;this.showSection(a)})}),t.querySelector("#export-settings-btn")?.addEventListener("click",()=>{this.exportSettings()}),t.querySelector("#import-settings-btn")?.addEventListener("click",()=>{this.importSettings()}),t.querySelector("#reset-settings-btn")?.addEventListener("click",()=>{this.resetSettings()}),t.querySelector("#clear-cache-btn")?.addEventListener("click",()=>{this.clearCache()}),t.querySelector("#clear-all-data-btn")?.addEventListener("click",()=>{this.clearAllData()}),t.querySelector("#cancel-settings")?.addEventListener("click",()=>{O("settings-modal")}),t.querySelector("#save-settings")?.addEventListener("click",()=>{this.saveSettings()}),t.querySelector("#setting-theme")?.addEventListener("change",i=>{this.applyTheme(i.target.value)}),t.querySelector("#setting-enableAnimations")?.addEventListener("change",i=>{this.applyAnimations(i.target.checked)}),t.querySelector("#setting-compactMode")?.addEventListener("change",i=>{this.applyCompactMode(i.target.checked)}),this.loadStorageStats(),this.loadSystemInfo()}showSection(t){const n=document.getElementById("settings-modal");if(!n)return;n.querySelectorAll(".settings-section").forEach(r=>{r.style.display="none",r.classList.remove("active")});const a=n.querySelector(`#section-${t}`);a&&(a.style.display="block",a.classList.add("active")),n.querySelectorAll(".settings-nav-btn").forEach(r=>{r.classList.remove("active"),r.dataset.section===t&&r.classList.add("active")})}populateForm(){const t=document.getElementById("settings-modal");if(!t)return;const n={language:"setting-language",theme:"setting-theme",showWelcomeMessage:"setting-showWelcomeMessage",enableKeyboardShortcuts:"setting-enableKeyboardShortcuts",defaultLaunchMode:"setting-defaultLaunchMode",maxConcurrentApps:"setting-maxConcurrentApps",autoUpdateApps:"setting-autoUpdateApps",validateAppsOnLaunch:"setting-validateAppsOnLaunch",sandboxMode:"setting-sandboxMode",viewMode:"setting-viewMode",sortBy:"setting-sortBy",compactMode:"setting-compactMode",enableAnimations:"setting-enableAnimations",showAppTooltips:"setting-showAppTooltips",syncEnabled:"setting-syncEnabled",syncProvider:"setting-syncProvider",autoSyncInterval:"setting-autoSyncInterval",backupBeforeSync:"setting-backupBeforeSync",analyticsEnabled:"setting-analyticsEnabled",crashReportingEnabled:"setting-crashReportingEnabled",allowTelemetry:"setting-allowTelemetry",enableServiceWorker:"setting-enableServiceWorker",cacheStrategy:"setting-cacheStrategy",preloadApps:"setting-preloadApps",lazyLoadImages:"setting-lazyLoadImages",enableDebugMode:"setting-enableDebugMode",showConsoleErrors:"setting-showConsoleErrors",enableExperimentalFeatures:"setting-enableExperimentalFeatures"};for(const[i,a]of Object.entries(this.currentSettings)){const s=n[i];if(s){const r=t.querySelector(`#${s}`);r&&!r.disabled&&(r.type==="checkbox"?r.checked=!!a:r.value=a)}}}async saveSettings(){try{const t=this.collectFormData();this.currentSettings={...this.currentSettings,...t};for(const[n,i]of Object.entries(this.currentSettings))await A.setSetting(n,i);this.applySettings(),O("settings-modal"),m("Impostazioni salvate con successo","success"),this.requiresReload(t)&&await V({title:"Ricarica Pagina",message:"Alcune modifiche richiedono il ricaricamento della pagina. Ricaricare ora?",icon:"info",confirmText:"Ricarica",cancelText:"Più tardi",type:"default"})&&window.location.reload()}catch(t){console.error("Errore salvataggio impostazioni:",t),m("Errore durante il salvataggio delle impostazioni","error")}}collectFormData(){const t={},n=document.getElementById("settings-modal");if(!n)return t;const i={"setting-language":"language","setting-theme":"theme","setting-showWelcomeMessage":"showWelcomeMessage","setting-enableKeyboardShortcuts":"enableKeyboardShortcuts","setting-defaultLaunchMode":"defaultLaunchMode","setting-maxConcurrentApps":"maxConcurrentApps","setting-autoUpdateApps":"autoUpdateApps","setting-validateAppsOnLaunch":"validateAppsOnLaunch","setting-sandboxMode":"sandboxMode","setting-viewMode":"viewMode","setting-sortBy":"sortBy","setting-compactMode":"compactMode","setting-enableAnimations":"enableAnimations","setting-showAppTooltips":"showAppTooltips","setting-syncEnabled":"syncEnabled","setting-syncProvider":"syncProvider","setting-autoSyncInterval":"autoSyncInterval","setting-backupBeforeSync":"backupBeforeSync","setting-analyticsEnabled":"analyticsEnabled","setting-crashReportingEnabled":"crashReportingEnabled","setting-allowTelemetry":"allowTelemetry","setting-enableServiceWorker":"enableServiceWorker","setting-cacheStrategy":"cacheStrategy","setting-preloadApps":"preloadApps","setting-lazyLoadImages":"lazyLoadImages","setting-enableDebugMode":"enableDebugMode","setting-showConsoleErrors":"showConsoleErrors","setting-enableExperimentalFeatures":"enableExperimentalFeatures"};return n.querySelectorAll('input[id^="setting-"], select[id^="setting-"], textarea[id^="setting-"]').forEach(s=>{const r=s.id,o=i[r];o&&!s.disabled&&(s.type==="checkbox"?t[o]=s.checked:s.type==="number"?t[o]=parseInt(s.value)||0:t[o]=s.value)}),t}applyTheme(t){const n=document.documentElement;if(t==="auto"){const i=window.matchMedia("(prefers-color-scheme: dark)").matches;n.setAttribute("data-theme",i?"dark":"light")}else n.setAttribute("data-theme",t)}applyLanguage(t){document.documentElement.setAttribute("lang",t)}applyAnimations(t){const n=document.documentElement;t?n.classList.remove("no-animations"):n.classList.add("no-animations")}applyCompactMode(t){const n=document.documentElement;t?n.classList.add("compact-mode"):n.classList.remove("compact-mode")}applyDebugMode(t){const n=document.documentElement;t?n.classList.add("debug-mode"):n.classList.remove("debug-mode")}async resetSettings(){if(await V({title:"Reset Impostazioni",message:"Sei sicuro di voler ripristinare tutte le impostazioni ai valori predefiniti?",icon:"warning",confirmText:"Reset",cancelText:"Annulla",type:"default"}))try{this.currentSettings={...this.defaultSettings};for(const[n,i]of Object.entries(this.currentSettings))await A.setSetting(n,i);this.populateForm(),this.applySettings(),m("Impostazioni ripristinate ai valori predefiniti","success")}catch(n){console.error("Errore reset impostazioni:",n),m("Errore durante il ripristino delle impostazioni","error")}}async exportSettings(){try{const t={version:"1.0.0",timestamp:new Date().toISOString(),settings:this.currentSettings,deviceInfo:Bn()},n=new Blob([JSON.stringify(t,null,2)],{type:"application/json"}),i=URL.createObjectURL(n),a=document.createElement("a");a.href=i,a.download=`sakai-settings-${new Date().toISOString().split("T")[0]}.json`,document.body.appendChild(a),a.click(),document.body.removeChild(a),URL.revokeObjectURL(i),m("Impostazioni esportate con successo","success")}catch(t){console.error("Errore export impostazioni:",t),m("Errore durante l'esportazione delle impostazioni","error")}}importSettings(){const t=document.createElement("input");t.type="file",t.accept=".json",t.onchange=async n=>{try{const i=n.target.files[0];if(!i)return;const a=await i.text(),s=JSON.parse(a);if(!s.settings||!s.version)throw new Error("Formato file non valido");this.currentSettings={...this.defaultSettings,...s.settings};for(const[r,o]of Object.entries(this.currentSettings))await A.setSetting(r,o);this.populateForm(),this.applySettings(),m("Impostazioni importate con successo","success")}catch(i){console.error("Errore import impostazioni:",i),m("Errore durante l'importazione delle impostazioni","error")}},t.click()}async clearCache(){try{if("caches"in window){const t=await caches.keys();await Promise.all(t.map(n=>caches.delete(n)))}m("Cache svuotata con successo","success"),this.loadStorageStats()}catch(t){console.error("Errore svuotamento cache:",t),m("Errore durante lo svuotamento della cache","error")}}async clearAllData(){if(!(!await V({title:"Elimina Tutti i Dati",message:"ATTENZIONE: Questa operazione eliminerà TUTTI i dati di SAKAI incluse app, impostazioni e cache. Continuare?",icon:"warning",confirmText:"Elimina",cancelText:"Annulla",type:"default"})||!await V({title:"Conferma Eliminazione",message:"Sei veramente sicuro? Questa operazione NON può essere annullata!",icon:"warning",confirmText:"Elimina",cancelText:"Annulla",type:"default"})))try{if(await A.close(),indexedDB.deleteDatabase("SAKAI_DB"),Object.keys(localStorage).forEach(i=>{i.startsWith("sakai_")&&localStorage.removeItem(i)}),"caches"in window){const i=await caches.keys();await Promise.all(i.map(a=>caches.delete(a)))}m("Tutti i dati sono stati eliminati","success"),setTimeout(()=>{window.location.reload()},2e3)}catch(i){console.error("Errore eliminazione dati:",i),m("Errore durante l'eliminazione dei dati","error")}}async loadStorageStats(){try{const t=document.getElementById("settings-modal");if(!t)return;const n=await A.getStats(),i=await A.getAllApps(),a=await A.estimateDbSize(),s=t.querySelector("#storage-used"),r=t.querySelector("#apps-count"),o=t.querySelector("#cache-size");if(s&&(s.textContent=re(a)),r&&(r.textContent=i.length.toString()),o){const c=n.cacheSize||0;o.textContent=re(c)}}catch(t){console.error("Errore caricamento statistiche storage:",t);const n=document.getElementById("settings-modal");n&&["storage-used","apps-count","cache-size"].forEach(a=>{const s=n.querySelector(`#${a}`);s&&(s.textContent="Errore caricamento")})}}loadSystemInfo(){try{const t=document.getElementById("settings-modal");if(!t)return;const n=t.querySelector("#user-agent"),i=t.querySelector("#platform"),a=t.querySelector("#pwa-support");if(n&&(n.textContent=navigator.userAgent.substring(0,50)+"..."),i&&(i.textContent=navigator.platform||"Sconosciuto"),a){const s="serviceWorker"in navigator,r="manifest"in document.createElement("link"),o="PushManager"in window,c=[];s&&c.push("Service Worker"),r&&c.push("Web App Manifest"),o&&c.push("Push Notifications"),a.textContent=c.length>0?c.join(", "):"Non supportato"}}catch(t){console.error("Errore caricamento informazioni sistema:",t);const n=document.getElementById("settings-modal");n&&["user-agent","platform","pwa-support"].forEach(a=>{const s=n.querySelector(`#${a}`);s&&(s.textContent="Errore caricamento")})}}camelToKebab(t){return t.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g,"$1-$2").toLowerCase()}kebabToCamel(t){return t.replace(/-([a-z])/g,n=>n[1].toUpperCase())}requiresReload(t){return["language","theme","enableServiceWorker","cacheStrategy"].some(i=>{const a=this.currentSettings[i],s=t[i];return a!==void 0&&a!==s})}getSetting(t,n=null){return this.currentSettings[t]!==void 0?this.currentSettings[t]:n}async setSetting(t,n){this.currentSettings[t]=n,await A.setSetting(t,n),this.applySettings()}}const Xs="modulepreload",Qs=function(e){return"/"+e},kt={},Js=function(t,n,i){let a=Promise.resolve();if(n&&n.length>0){let c=function(l){return Promise.all(l.map(p=>Promise.resolve(p).then(f=>({status:"fulfilled",value:f}),f=>({status:"rejected",reason:f}))))};document.getElementsByTagName("link");const r=document.querySelector("meta[property=csp-nonce]"),o=r?.nonce||r?.getAttribute("nonce");a=c(n.map(l=>{if(l=Qs(l),l in kt)return;kt[l]=!0;const p=l.endsWith(".css"),f=p?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${l}"]${f}`))return;const g=document.createElement("link");if(g.rel=p?"stylesheet":Xs,p||(g.as="script"),g.crossOrigin="",g.href=l,o&&g.setAttribute("nonce",o),document.head.appendChild(g),p)return new Promise((v,b)=>{g.addEventListener("load",v),g.addEventListener("error",()=>b(new Error(`Unable to preload CSS for ${l}`)))})}))}function s(r){const o=new Event("vite:preloadError",{cancelable:!0});if(o.payload=r,window.dispatchEvent(o),!o.defaultPrevented)throw r}return a.then(r=>{for(const o of r||[])o.status==="rejected"&&s(o.reason);return t().catch(s)})},ve={enabled:localStorage.getItem("aideas_debug")==="true",verbose:localStorage.getItem("aideas_verbose_logging")==="true"};ve.enabled&&(window.AIdeas_DEV={async inspectStorage(){const e=await Js(()=>Promise.resolve().then(()=>Tn),void 0).then(a=>a.default),t=await e.getStats(),n=await e.getAllApps(),i=await e.getAllSettings();console.group("🔍 AIdeas Storage Inspection"),console.log("Stats:",t),console.table(n),console.log("Settings:",i),console.groupEnd()},getPerformance(){return{timing:performance.timing,navigation:performance.navigation,memory:performance.memory}},getErrors(){return window.AIdeas_ERRORS||[]},clearAllData(){V({title:"Pulisci Dati",message:"Eliminare tutti i dati di AIdeas? Questa operazione non può essere annullata!",icon:"danger",confirmText:"Elimina",cancelText:"Annulla",type:"danger"}).then(e=>{e&&(localStorage.clear(),sessionStorage.clear(),indexedDB.deleteDatabase("aideas-db"),m("Tutti i dati eliminati","success"),setTimeout(()=>window.location.reload(),1e3))})},enableVerbose(){localStorage.setItem("aideas_verbose_logging","true"),ve.verbose=!0,console.log("Verbose logging enabled")},disableVerbose(){localStorage.removeItem("aideas_verbose_logging"),ve.verbose=!1,console.log("Verbose logging disabled")}});class ut{static init(){window.AIdeas_ERRORS=this.errors,window.addEventListener("error",t=>{this.trackError({type:"runtime",message:t.message,source:t.filename,lineno:t.lineno,colno:t.colno,stack:t.error?.stack,timestamp:new Date().toISOString()})}),window.addEventListener("unhandledrejection",t=>{this.trackError({type:"promise",message:t.reason?.message||"Unhandled Promise Rejection",stack:t.reason?.stack,timestamp:new Date().toISOString()})})}static trackError(t){this.errors.push(t),ve.enabled&&console.error("[AIdeas Error Tracker]",t),this.errors.length>100&&this.errors.shift()}static getErrors(){return this.errors}static clearErrors(){return this.errors=[],!0}}pt(ut,"errors",[]);ut.init();class Gs{constructor(){this.currentView="all",this.currentSort="lastUsed",this.currentViewMode="grid",this.searchQuery="",this.apps=[],this.filteredApps=[],this.storage=A,this.appLauncher=new kn,this.appImporter=new Ys,this.settingsPanel=new Ks,ut.init(),this.init=this.init.bind(this),this.setupEventListeners=this.setupEventListeners.bind(this),this.loadApps=this.loadApps.bind(this),this.renderApps=this.renderApps.bind(this),this.filterApps=this.filterApps.bind(this),this.handleSearch=this.handleSearch.bind(this),this.handleCategoryChange=this.handleCategoryChange.bind(this),this.handleSortChange=this.handleSortChange.bind(this),this.handleViewChange=this.handleViewChange.bind(this),this.showAppMenu=this.showAppMenu.bind(this)}async init(){try{console.log("🚀 Inizializzazione AIdeas..."),await this.storage.ensureDbOpen(),await this.verifyCriticalSettings(),localStorage.getItem("aideas_debug")==="true"&&await this.testSettings(),await this.appLauncher.init(),await this.appImporter.init(),await this.settingsPanel.init(),await this.loadApps(),this.setupEventListeners(),this.hideLoadingScreen(),console.log("✅ AIdeas inizializzata con successo")}catch(t){console.error("❌ Errore inizializzazione AIdeas:",t),this.showErrorScreen(t)}}async verifyCriticalSettings(){console.log("🔍 Verifica impostazioni critiche...");const t=await this.storage.getSetting("defaultLaunchMode");(!t||!["iframe","newpage"].includes(t))&&(console.log('⚠️ defaultLaunchMode non valido, correzione a "newpage"'),await this.storage.setSetting("defaultLaunchMode","newpage"));const n={maxConcurrentApps:{min:1,max:10,default:5},language:{valid:["it","en"],default:"it"},theme:{valid:["light","dark","auto"],default:"auto"}};for(const[i,a]of Object.entries(n)){const s=await this.storage.getSetting(i);a.min!==void 0&&a.max!==void 0?(typeof s!="number"||s<a.min||s>a.max)&&(console.log(`⚠️ ${i} non valido (${s}), correzione a ${a.default}`),await this.storage.setSetting(i,a.default)):a.valid&&(a.valid.includes(s)||(console.log(`⚠️ ${i} non valido (${s}), correzione a ${a.default}`),await this.storage.setSetting(i,a.default)))}console.log("✅ Impostazioni critiche verificate")}showLoadingScreen(){const t=document.getElementById("loading-screen"),n=document.getElementById("app");t&&n&&(t.style.display="flex",n.style.display="none")}hideLoadingScreen(){const t=document.getElementById("loading-screen"),n=document.getElementById("app");t&&(t.style.opacity="0",setTimeout(()=>{t.style.display="none"},300)),n&&(n.style.display="block")}showErrorScreen(t){console.error("Errore critico:",t);const n=document.getElementById("loading-screen");n&&(n.innerHTML=`
        <div class="error-screen">
          <div class="error-icon">⚠️</div>
          <h1>Errore di Inizializzazione</h1>
          <p>Si è verificato un errore durante l'avvio dell'applicazione.</p>
          <p class="error-details">${t.message}</p>
          <button onclick="location.reload()" class="btn btn-primary">Riprova</button>
        </div>
      `)}async showWelcomeMessage(){await this.storage.getSetting("showWelcomeMessage",!0)&&m("Benvenuto in AIdeas! 🎉","success",3e3)}async initializeStorage(){try{const t=await A.getStats();console.log("📊 Database stats:",t)}catch(t){throw console.error("Errore inizializzazione storage:",t),t}}async loadUserSettings(){try{const t=await A.getAllSettings();this.currentViewMode=t.viewMode||"grid",this.currentSort=t.sortBy||"lastUsed",t.theme?document.documentElement.setAttribute("data-theme",t.theme):document.documentElement.setAttribute("data-theme","dark"),t.language&&document.documentElement.setAttribute("lang",t.language)}catch(t){console.error("Errore caricamento impostazioni:",t),document.documentElement.setAttribute("data-theme","dark")}}setupEventListeners(){const t=document.getElementById("sidebar-toggle"),n=document.getElementById("sidebar"),i=document.querySelector(".app-layout");t?.addEventListener("click",()=>{n?.classList.toggle("sidebar-open"),n?.classList.contains("sidebar-open")?i?.classList.remove("sidebar-collapsed"):i?.classList.add("sidebar-collapsed")});const a=document.getElementById("mobile-search-toggle"),s=document.getElementById("mobile-search-close"),r=document.querySelector(".search-container"),o=document.querySelector(".header-search"),c=document.getElementById("search-input");a?.addEventListener("click",()=>{o?.classList.toggle("search-active"),o?.classList.contains("search-active")&&setTimeout(()=>{c?.focus()},100)}),s?.addEventListener("click",()=>{o?.classList.remove("search-active"),c?.blur()}),document.addEventListener("click",w=>{!r?.contains(w.target)&&!a?.contains(w.target)&&o?.classList.remove("search-active")});const l=document.getElementById("search-input");l?.addEventListener("input",this.handleSearch),l?.addEventListener("keydown",w=>{w.key==="Escape"&&(o?.classList.remove("search-active"),l.blur())}),document.querySelectorAll("[data-category]").forEach(w=>{w.addEventListener("click",this.handleCategoryChange)}),document.getElementById("sort-select")?.addEventListener("change",this.handleSortChange),document.querySelectorAll(".view-btn").forEach(w=>{w.addEventListener("click",this.handleViewChange)}),document.querySelectorAll("#add-app-btn, #fab-add, #empty-add-btn").forEach(w=>{w.addEventListener("click",()=>this.showAddAppModal())}),document.getElementById("settings-btn")?.addEventListener("click",()=>{this.showSettingsModal()});const S=document.getElementById("user-btn"),P=document.getElementById("user-dropdown");S?.addEventListener("click",w=>{w.stopPropagation(),P?.classList.toggle("show")}),document.addEventListener("click",()=>{P?.classList.remove("show")}),document.getElementById("settings-link")?.addEventListener("click",w=>{w.preventDefault(),this.showSettingsModal()}),document.getElementById("export-link")?.addEventListener("click",w=>{w.preventDefault(),this.exportData()}),document.getElementById("import-link")?.addEventListener("click",w=>{w.preventDefault(),this.importData()}),document.getElementById("about-link")?.addEventListener("click",w=>{w.preventDefault(),this.showAboutModal()}),document.getElementById("sync-btn")?.addEventListener("click",()=>{this.syncManager.showSyncModal()}),document.getElementById("app-store-btn")?.addEventListener("click",()=>{this.showAppStoreModal()}),document.addEventListener("keydown",this.handleKeyboardShortcuts.bind(this)),window.addEventListener("resize",this.handleResize.bind(this)),document.addEventListener("click",w=>{!n?.contains(w.target)&&!t?.contains(w.target)&&(n?.classList.remove("sidebar-open"),i?.classList.add("sidebar-collapsed"))})}async loadApps(){try{this.apps=await A.getAllApps(),this.filterApps(),this.updateCategoryCounts()}catch(t){console.error("Errore caricamento apps:",t),m("Errore durante il caricamento delle app","error")}}filterApps(){let t=[...this.apps];if(this.currentView==="favorites")t=t.filter(n=>n.favorite);else if(this.currentView==="recent"){const n=new Date;n.setDate(n.getDate()-30),t=t.filter(i=>new Date(i.lastUsed)>n)}else this.currentView!=="all"&&(t=t.filter(n=>n.category===this.currentView));if(this.searchQuery){const n=this.searchQuery.toLowerCase();t=t.filter(i=>i.name.toLowerCase().includes(n)||i.description.toLowerCase().includes(n)||i.tags.some(a=>a.toLowerCase().includes(n)))}t.sort((n,i)=>{switch(this.currentSort){case"name":return n.name.localeCompare(i.name);case"installDate":return new Date(i.installDate)-new Date(n.installDate);case"category":return n.category.localeCompare(i.category);case"lastUsed":default:return new Date(i.lastUsed)-new Date(n.lastUsed)}}),this.filteredApps=t,this.renderApps()}renderApps(){const t=document.getElementById("apps-grid"),n=document.getElementById("empty-state");if(t){if(t.className=`apps-${this.currentViewMode}`,this.filteredApps.length===0){t.style.display="none",n.style.display="flex";return}n.style.display="none",this.currentViewMode==="launcher"?(t.style.display="grid",t.innerHTML=this.filteredApps.map(i=>this.renderLauncherItem(i)).join("")):(t.style.display=this.currentViewMode==="list"?"flex":"grid",t.innerHTML=this.filteredApps.map(i=>Zs.render(i)).join("")),this.setupAppCardListeners()}}renderLauncherItem(t){const n=t.icon?`<img src="${t.icon}" alt="${t.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`:"",i=`
      <svg viewBox="0 0 24 24" fill="currentColor" style="display: ${t.icon?"none":"flex"};">
        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
      </svg>
    `,a=t.type?`
      <div class="app-launcher-badge">
        <svg viewBox="0 0 24 24" fill="currentColor">
          ${t.type==="pwa"?'<path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4Z"/>':t.type==="zip"?'<path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>':'<path d="M3.27,1L2,2.27L5.18,5.44L5.64,6H21L19.73,7L21,8.27L19,10.27V20A1,1 0 0,1 18,21H6A1,1 0 0,1 5,20V10L3.27,8.27L1,6L2.28,4.73L3.27,1M7,18H17V10H7V18Z"/>'}
        </svg>
      </div>
    `:"";return`
      <div class="app-launcher-item" data-app-id="${t.id}" data-app-name="${t.name}">
        <div class="app-launcher-icon">
          ${n}
          ${i}
          ${a}
        </div>
        <div class="app-launcher-name">${t.name}</div>
      </div>
    `}setupAppCardListeners(){document.querySelectorAll(".app-card-launch").forEach(t=>{t.addEventListener("click",async n=>{n.stopPropagation();const i=parseInt(t.dataset.appId);await this.launchApp(i)})}),document.querySelectorAll(".app-card-favorite").forEach(t=>{t.addEventListener("click",async n=>{n.stopPropagation();const i=parseInt(t.dataset.appId);await this.toggleFavorite(i)})}),document.querySelectorAll(".app-card-menu").forEach(t=>{t.addEventListener("click",n=>{n.stopPropagation();const i=parseInt(t.dataset.appId);this.showAppMenu(i,n.target)})}),document.querySelectorAll(".app-card").forEach(t=>{t.addEventListener("click",async()=>{const n=parseInt(t.dataset.appId);await this.launchApp(n)})}),document.querySelectorAll(".app-launcher-item").forEach(t=>{let n,i=!1;t.addEventListener("click",async a=>{if(!i){const s=parseInt(t.dataset.appId);await this.launchApp(s)}i=!1}),t.addEventListener("mousedown",a=>{n=setTimeout(()=>{i=!0;const s=parseInt(t.dataset.appId);this.showLauncherAppInfo(s,t)},500)}),t.addEventListener("mouseup",()=>{clearTimeout(n)}),t.addEventListener("mouseleave",()=>{clearTimeout(n)}),t.addEventListener("touchstart",a=>{n=setTimeout(()=>{i=!0;const s=parseInt(t.dataset.appId);this.showLauncherAppInfo(s,t)},500)}),t.addEventListener("touchend",()=>{clearTimeout(n)}),t.addEventListener("touchcancel",()=>{clearTimeout(n)})})}async launchApp(t){try{const n=await A.getApp(t);if(!n){m("App non trovata","error");return}await A.updateLastUsed(t),await this.appLauncher.launch(n),await this.loadApps()}catch(n){console.error("Errore lancio app:",n),m("Errore durante il lancio dell'app","error")}}async toggleFavorite(t){try{const n=await A.toggleFavorite(t);m(n?"Aggiunta ai preferiti":"Rimossa dai preferiti","success"),await this.loadApps()}catch(n){console.error("Errore toggle favorite:",n),m("Errore durante l'operazione","error")}}handleSearch(t){this.searchQuery=t.target.value.trim(),this.filterApps()}handleCategoryChange(t){t.preventDefault();const n=t.target.dataset.category||t.target.closest("[data-category]").dataset.category;document.querySelectorAll(".nav-link").forEach(a=>{a.classList.remove("active")});const i=t.target.closest(".nav-link");i&&i.classList.add("active"),this.currentView=n,this.updateSectionTitle(),this.filterApps()}handleSortChange(t){this.currentSort=t.target.value,A.setSetting("sortBy",this.currentSort),this.filterApps()}handleViewChange(t){const n=t.target.dataset.view||t.target.closest("[data-view]").dataset.view;document.querySelectorAll(".view-btn[data-view]").forEach(a=>{a.classList.remove("active")});const i=t.target.closest(".view-btn[data-view]");i&&i.classList.add("active"),this.currentViewMode=n,A.setSetting("viewMode",this.currentViewMode),this.renderApps()}handleKeyboardShortcuts(t){(t.ctrlKey||t.metaKey)&&t.key==="k"&&(t.preventDefault(),document.getElementById("search-input")?.focus()),(t.ctrlKey||t.metaKey)&&t.key==="n"&&(t.preventDefault(),this.showAddAppModal()),t.key==="Escape"&&this.closeAllModals()}handleResize(){const t=document.getElementById("sidebar"),n=document.querySelector(".app-layout");window.innerWidth>768||t?.classList.contains("sidebar-open")&&(t.classList.remove("sidebar-open"),n?.classList.add("sidebar-collapsed"))}updateSectionTitle(){const t=document.getElementById("section-title"),n=document.getElementById("section-subtitle"),a={all:{title:"Tutte le App",subtitle:"Gestisci le tue applicazioni web"},favorites:{title:"App Preferite",subtitle:"Le tue app più amate"},recent:{title:"App Recenti",subtitle:"Utilizzate negli ultimi 30 giorni"}}[this.currentView]||{title:this.currentView.charAt(0).toUpperCase()+this.currentView.slice(1),subtitle:`App della categoria ${this.currentView}`};t&&(t.textContent=a.title),n&&(n.textContent=a.subtitle)}updateCategoryCounts(){const t=document.getElementById("all-count");t&&(t.textContent=this.apps.length);const n=document.getElementById("favorites-count"),i=this.apps.filter(a=>a.favorite).length;n&&(n.textContent=i),this.updateDynamicCategories()}updateDynamicCategories(){const t=document.getElementById("dynamic-categories");if(!t)return;const n=new Map;this.apps.forEach(a=>{const s=a.category||"uncategorized";n.set(s,(n.get(s)||0)+1)});const i=Array.from(n.entries()).sort(([a],[s])=>a.localeCompare(s)).map(([a,s])=>`
        <li class="nav-item">
          <a href="#" class="nav-link" data-category="${a}">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z"/>
            </svg>
            ${a}
            <span class="nav-badge">${s}</span>
          </a>
        </li>
      `).join("");t.innerHTML=i,t.querySelectorAll("[data-category]").forEach(a=>{a.addEventListener("click",this.handleCategoryChange)})}showAddAppModal(){console.log("🔧 Tentativo apertura modal aggiungi app..."),this.appImporter&&typeof this.appImporter.showModal=="function"?this.appImporter.showModal():(console.error("❌ AppImporter non disponibile o showModal non è una funzione"),m("Errore: componente importazione non disponibile","error"))}showSettingsModal(){this.settingsPanel.showModal()}showAboutModal(){D("about-modal",`
      <div class="modal-header">
        <h2>Su AIdeas</h2>
        <button class="modal-close" onclick="hideModal('about-modal')">&times;</button>
      </div>
      <div class="modal-body">
        <div class="about-content">
          <div class="about-logo">
            <svg viewBox="0 0 100 100" class="about-icon">
              <defs>
                <linearGradient id="aboutGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#2563eb"/>
                  <stop offset="100%" style="stop-color:#1d4ed8"/>
                </linearGradient>
              </defs>
              <rect x="10" y="10" width="80" height="80" rx="16" fill="url(#aboutGradient)"/>
              <text x="50" y="65" text-anchor="middle" fill="white" font-size="32" font-weight="bold">S</text>
            </svg>
          </div>
          <h3>AIdeas v1.0.0</h3>
          <p><strong>Swiss Army Knife by AI</strong></p>
          <p>Launcher per applicazioni web generate da AI</p>
          <div class="about-features">
            <h4>Caratteristiche:</h4>
            <ul>
              <li>✅ 100% Client-side</li>
              <li>✅ Funziona offline</li>
              <li>✅ Sincronizzazione cloud opzionale</li>
              <li>✅ Sandbox sicuro per le app</li>
              <li>✅ Import/Export profili</li>
            </ul>
          </div>
          <div class="about-links">
            <a href="https://github.com/aideas-run/aideas-run" target="_blank" rel="noopener">GitHub</a>
            <a href="https://aideas.run/docs" target="_blank" rel="noopener">Documentazione</a>
          </div>
        </div>
      </div>
    `)}showAppStoreModal(){D("app-store-modal",`
      <div class="modal-header">
        <h2>AIdeas App Store</h2>
        <button class="modal-close" onclick="hideModal('app-store-modal')">&times;</button>
      </div>
      <div class="modal-body">
        <p>App Store in arrivo nella prossima versione...</p>
        <p>Nel frattempo puoi aggiungere app tramite:</p>
        <ul>
          <li>File ZIP</li>
          <li>URL diretto</li>
          <li>Repository GitHub</li>
        </ul>
      </div>
    `)}async exportData(){try{const t=await A.exportAllData(),n=new Blob([JSON.stringify(t,null,2)],{type:"application/json"}),i=URL.createObjectURL(n),a=document.createElement("a");a.href=i,a.download=`aideas-backup-${new Date().toISOString().split("T")[0]}.json`,document.body.appendChild(a),a.click(),document.body.removeChild(a),URL.revokeObjectURL(i),m("Dati esportati con successo","success")}catch(t){console.error("Errore export:",t),m("Errore durante l'esportazione","error")}}importData(){const t=document.createElement("input");t.type="file",t.accept=".json",t.onchange=async n=>{try{const i=n.target.files[0];if(!i)return;const a=await i.text(),s=JSON.parse(a);await A.importData(s),await this.loadApps(),m("Dati importati con successo","success")}catch(i){console.error("Errore import:",i),m("Errore durante l'importazione","error")}},t.click()}async initializeComponents(){await this.appImporter.init(),await this.settingsPanel.init()}async initializeSync(){}async checkFirstRun(){await A.getSetting("firstRun",!0)&&(await A.setSetting("firstRun",!1),m("Benvenuto in AIdeas! Inizia aggiungendo la tua prima app.","info",5e3))}updateUI(){this.updateSectionTitle(),this.updateCategoryCounts(),document.querySelectorAll(".view-btn[data-view]").forEach(s=>{s.classList.remove("active")});const t=document.querySelector(`[data-view="${this.currentViewMode}"]`);t&&t.classList.add("active");const n=document.getElementById("sort-select");n&&(n.value=this.currentSort);const i=document.getElementById("sidebar"),a=document.querySelector(".app-layout");i&&a&&(i.classList.contains("sidebar-open")?a.classList.remove("sidebar-collapsed"):a.classList.add("sidebar-collapsed"))}closeAllModals(){document.querySelectorAll(".modal").forEach(t=>{O(t.id)})}showError(t){m(t,"error")}async showAppMenu(t,n){const i=await A.getApp(t);if(!i)return;const a=`
      <div class="app-context-menu">
        <div class="context-menu-item" data-action="edit">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
          </svg>
          Modifica
        </div>
        <div class="context-menu-separator"></div>
        <div class="context-menu-item context-menu-danger" data-action="delete">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
          </svg>
          Elimina
        </div>
      </div>
    `;document.querySelectorAll(".app-context-menu").forEach(g=>g.remove());const s=document.createElement("div");s.innerHTML=a,document.body.appendChild(s.firstElementChild);const r=document.querySelector(".app-context-menu"),o=n.getBoundingClientRect(),c=r.getBoundingClientRect();let l=o.bottom+window.scrollY+4,p=o.left+window.scrollX;l+c.height>window.innerHeight+window.scrollY&&(l=o.top+window.scrollY-c.height-4),p+c.width>window.innerWidth+window.scrollX&&(p=o.right+window.scrollX-c.width),r.style.top=`${l}px`,r.style.left=`${p}px`;const f=g=>{r.contains(g.target)||(r.remove(),document.removeEventListener("mousedown",f))};setTimeout(()=>document.addEventListener("mousedown",f),10),r.querySelector('[data-action="edit"]').addEventListener("click",async()=>{r.remove(),await this.showEditAppModal(i)}),r.querySelector('[data-action="delete"]').addEventListener("click",async()=>{r.remove(),await Nn(i.name)&&(await A.deleteApp(t),m("App eliminata","success"),this.loadApps())})}async showEditAppModal(t){const n={...t},i=`
      <div class="modal-header">
        <h2>
          <svg viewBox="0 0 24 24" fill="currentColor" class="header-icon"><path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/></svg>
          Modifica App
        </h2>
        <button class="modal-close" id="close-edit-modal">&times;</button>
      </div>
      <div class="modal-body">
        <form id="edit-app-form">
          <div class="form-group">
            <label for="edit-app-name">Nome App</label>
            <input type="text" id="edit-app-name" class="form-input" value="${n.name||""}" maxlength="50" required>
          </div>
          <div class="form-group">
            <label for="edit-app-description">Descrizione</label>
            <textarea id="edit-app-description" class="form-input" rows="3" maxlength="200">${n.description||""}</textarea>
          </div>
          <div class="form-group">
            <label for="edit-app-version">Versione</label>
            <input type="text" id="edit-app-version" class="form-input" value="${n.version||"1.0.0"}">
          </div>
          <div class="form-group">
            <label for="edit-app-category">Categoria</label>
            <input type="text" id="edit-app-category" class="form-input" value="${n.category||""}">
          </div>
          <div class="form-group">
            <label for="edit-app-tags">Tag (separati da virgola)</label>
            <input type="text" id="edit-app-tags" class="form-input" value="${(n.tags||[]).join(", ")}">
          </div>
          <div class="form-group">
            <label for="edit-app-icon">Icona (URL)</label>
            <input type="url" id="edit-app-icon" class="form-input" value="${n.icon||""}">
          </div>
          <div class="form-group">
            <label for="edit-app-launch-mode">Modalità di apertura predefinita</label>
            <select id="edit-app-launch-mode" class="form-input">
              <option value="">Usa impostazione globale</option>
              <option value="iframe" ${n.metadata?.launchMode==="iframe"?"selected":""}>Sempre in finestra modale</option>
              <option value="newpage" ${n.metadata?.launchMode==="newpage"?"selected":""}>Sempre in nuova pagina</option>
            </select>
            <p class="setting-description">Scegli come questa app dovrebbe aprirsi di default</p>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="cancel-edit-app">Annulla</button>
        <button class="btn btn-primary" id="save-edit-app">Salva Modifiche</button>
      </div>
    `;D("edit-app-modal",i,{size:"modal-md"}),setTimeout(()=>{document.getElementById("cancel-edit-app")?.addEventListener("click",()=>{O("edit-app-modal")}),document.getElementById("close-edit-modal")?.addEventListener("click",()=>{O("edit-app-modal")}),document.getElementById("save-edit-app").addEventListener("click",async a=>{a.preventDefault();const s={name:document.getElementById("edit-app-name").value.trim(),description:document.getElementById("edit-app-description").value.trim(),version:document.getElementById("edit-app-version").value.trim(),category:document.getElementById("edit-app-category").value.trim(),tags:document.getElementById("edit-app-tags").value.split(",").map(o=>o.trim()).filter(Boolean),icon:document.getElementById("edit-app-icon").value.trim()},r=document.getElementById("edit-app-launch-mode");if(r&&r.value?(s.metadata||(s.metadata={}),s.metadata.launchMode=r.value):n.metadata?.launchMode&&(s.metadata||(s.metadata={}),s.metadata.launchMode=null),!s.name){m("Il nome è obbligatorio","error");return}await A.updateApp(t.id,s),O("edit-app-modal"),m("App modificata con successo","success"),await this.loadApps()})},200)}async showLauncherAppInfo(t,n){const i=await A.getApp(t);if(!i)return;const a=`
      <div class="modal-header">
        <div class="app-modal-title">
          <div class="app-modal-icon">
            ${i.icon?`<img src="${i.icon}" alt="${i.name}">`:"📱"}
          </div>
          <div>
            <h2>${i.name}</h2>
            <p class="app-modal-subtitle">${i.description||""}</p>
          </div>
        </div>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="app-info-grid">
          <div class="app-info-section">
            <h4>Informazioni</h4>
            <div class="app-info-item">
              <span class="info-label">Versione:</span>
              <span class="info-value">${i.version||"N/A"}</span>
            </div>
            <div class="app-info-item">
              <span class="info-label">Categoria:</span>
              <span class="info-value">${i.category||"Non categorizzata"}</span>
            </div>
            <div class="app-info-item">
              <span class="info-label">Tipo:</span>
              <span class="info-value">${i.type||"URL"}</span>
            </div>
            <div class="app-info-item">
              <span class="info-label">Ultimo utilizzo:</span>
              <span class="info-value">${i.lastUsed?new Date(i.lastUsed).toLocaleDateString("it-IT"):"Mai"}</span>
            </div>
          </div>
          
          ${i.tags&&i.tags.length>0?`
            <div class="app-info-section">
              <h4>Tag</h4>
              <div class="app-tags">
                ${i.tags.map(r=>`<span class="app-tag">${r}</span>`).join("")}
              </div>
            </div>
          `:""}
        </div>
        
        <div class="app-actions">
          <button class="btn btn-primary" id="launch-app-btn" data-app-id="${i.id}">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8,5V19L19,12M19,5V19H21V5M2,5V19H4V5H2Z"/>
            </svg>
            Avvia App
          </button>
          <button class="btn btn-secondary" id="edit-app-btn" data-app-id="${i.id}">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
            </svg>
            Modifica
          </button>
        </div>
      </div>
    `,s=D("launcher-app-info",a,{size:"modal-md",disableBackdropClose:!1,disableEscapeClose:!1});s.querySelector("#launch-app-btn")?.addEventListener("click",async()=>{O("launcher-app-info"),await this.launchApp(t)}),s.querySelector("#edit-app-btn")?.addEventListener("click",async()=>{O("launcher-app-info"),await this.showEditAppModal(i)})}async testSettings(){console.log("🧪 Test impostazioni...");try{const t="test_setting",n="test_value_"+Date.now();await this.storage.setSetting(t,n);const i=await this.storage.getSetting(t);console.log(i===n?"✅ Test salvataggio/caricamento impostazioni: PASS":"❌ Test salvataggio/caricamento impostazioni: FAIL"),await this.storage.setSetting(t,null);const a=await this.storage.getAllSettings();console.log("📋 Impostazioni attuali:",a);const s=["defaultLaunchMode","language","theme"];for(const r of s){const o=await this.storage.getSetting(r);console.log(`🔍 ${r}: ${o}`)}}catch(t){console.error("❌ Errore test impostazioni:",t)}}}document.addEventListener("DOMContentLoaded",async()=>{const e=new Gs;window.aideasApp=e,await e.init()});window.addEventListener("error",e=>{console.error("Errore globale:",e.error),m("Si è verificato un errore imprevisto","error")});window.addEventListener("unhandledrejection",e=>{console.error("Promise rejections non gestita:",e.reason),m("Errore durante un'operazione asincrona","error")});
//# sourceMappingURL=main-Dpuq4Bi4.js.map
