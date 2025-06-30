var Tn=Object.defineProperty;var Mn=(t,e,n)=>e in t?Tn(t,e,{enumerable:!0,configurable:!0,writable:!0,value:n}):t[e]=n;var ft=(t,e,n)=>Mn(t,typeof e!="symbol"?e+"":e,n);import{D as xn,g as Dt,r as In}from"./vendor-B9NWz7lO.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))i(a);new MutationObserver(a=>{for(const s of a)if(s.type==="childList")for(const r of s.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&i(r)}).observe(document,{childList:!0,subtree:!0});function n(a){const s={};return a.integrity&&(s.integrity=a.integrity),a.referrerPolicy&&(s.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?s.credentials="include":a.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(a){if(a.ep)return;a.ep=!0;const s=n(a);fetch(a.href,s)}})();class ae{constructor(){if(ae.instance)return ae.instance;this.db=new xn("AIdeas_DB"),this.initDatabase(),ae.instance=this}initDatabase(){this.db.version(1).stores({apps:"++id, name, description, category, version, url, type, githubUrl, installDate, lastUsed, favorite, *tags",appFiles:"++id, appId, filename, content, size, mimeType",settings:"key, value, lastModified",syncEvents:"++id, timestamp, action, data, synced, deviceId",catalog:"++id, name, description, author, githubUrl, rating, downloads, featured, *categories"}),this.db.apps.hook("creating",(e,n,i)=>{n.installDate=n.installDate||new Date,n.lastUsed=n.lastUsed||new Date,n.favorite=n.favorite||!1,n.tags=n.tags||[]}),this.db.syncEvents.hook("creating",(e,n,i)=>{n.timestamp=n.timestamp||new Date,n.synced=n.synced||!1,n.deviceId=n.deviceId||this.getDeviceId()})}async installApp(e){try{const n={name:e.name,description:e.description||"",category:e.category||"uncategorized",version:e.version||"1.0.0",url:e.url||null,type:e.type,githubUrl:e.githubUrl||null,icon:e.icon||null,manifest:e.manifest||{},permissions:e.permissions||[],tags:e.tags||[],metadata:e.metadata||{},content:e.content||null},i=await this.db.apps.add(n);return e.files&&e.files.length>0&&await this.saveAppFiles(i,e.files),await this.addSyncEvent("app_installed",{appId:i,app:n}),i}catch(n){throw console.error("Errore installazione app:",n),new Error(`Impossibile installare l'app: ${n.message}`)}}async getAllApps(e={}){try{let n=this.db.apps.orderBy("lastUsed").reverse();return e.category&&(n=n.filter(i=>i.category===e.category)),e.search&&(n=n.filter(i=>i.name.toLowerCase().includes(e.search.toLowerCase())||i.description.toLowerCase().includes(e.search.toLowerCase())||i.tags.some(a=>a.toLowerCase().includes(e.search.toLowerCase())))),e.favorite&&(n=n.filter(i=>i.favorite===!0)),await n.toArray()}catch(n){return console.error("Errore recupero app:",n),[]}}async getApp(e){try{return await this.db.apps.get(e)}catch(n){return console.error("Errore recupero app:",n),null}}async updateApp(e,n){try{return await this.db.apps.update(e,n),await this.addSyncEvent("app_updated",{appId:e,updates:n}),!0}catch(i){return console.error("Errore aggiornamento app:",i),!1}}async setAppMetadata(e,n){try{const i=await this.getApp(e);if(!i)throw new Error("App non trovata");const a={...i.metadata,...n};return await this.db.apps.update(e,{metadata:a}),console.log(`✅ Metadati aggiornati per app ${e}:`,n),!0}catch(i){return console.error("Errore aggiornamento metadati app:",i),!1}}async getAppMetadata(e,n=null){try{const i=await this.getApp(e);return!i||!i.metadata?null:n?i.metadata[n]||null:i.metadata}catch(i){return console.error("Errore recupero metadati app:",i),null}}async migrateAppsForContent(){try{console.log("🔄 Inizio migrazione app HTML...");const e=await this.db.apps.toArray();console.log(`📊 Trovate ${e.length} app totali`);let n=0;for(const i of e)if(console.log(`🔍 Controllo app: ${i.name} (tipo: ${i.type})`),i.type==="html"&&!i.content){console.log(`📝 App HTML senza contenuto trovata: ${i.name}`);const a=await this.getAppFiles(i.id);console.log(`📁 Trovati ${a.length} file per app ${i.name}`);const s=a.find(r=>r.filename.endsWith(".html"));s?(console.log(`✅ File HTML trovato: ${s.filename}`),await this.db.apps.update(i.id,{content:s.content}),n++,console.log(`✅ App ${i.name} migrata con successo`)):console.log(`⚠️ Nessun file HTML trovato per app ${i.name}`)}return n>0?console.log(`✅ Migrate ${n} app HTML per aggiungere campo content`):console.log("ℹ️ Nessuna app HTML da migrare"),n}catch(e){return console.error("❌ Errore migrazione app:",e),console.error("Stack trace:",e.stack),0}}async deleteApp(e){try{return await this.db.transaction("rw",[this.db.apps,this.db.appFiles],async()=>{await this.db.apps.delete(e),await this.db.appFiles.where("appId").equals(e).delete()}),await this.addSyncEvent("app_deleted",{appId:e}),!0}catch(n){return console.error("Errore eliminazione app:",n),!1}}async updateLastUsed(e){try{await this.db.apps.update(e,{lastUsed:new Date})}catch(n){console.error("Errore aggiornamento ultimo utilizzo:",n)}}async toggleFavorite(e){try{const n=await this.db.apps.get(e);return n?(await this.db.apps.update(e,{favorite:!n.favorite}),!n.favorite):!1}catch(n){return console.error("Errore toggle preferito:",n),!1}}async saveAppFiles(e,n){try{const i=n.map(a=>this.db.appFiles.add({appId:e,filename:a.filename,content:a.content,size:a.size||a.content.length,mimeType:a.mimeType||this.getMimeType(a.filename)}));return await Promise.all(i),!0}catch(i){return console.error("Errore salvataggio file app:",i),!1}}async getAppFiles(e){try{return await this.db.appFiles.where("appId").equals(e).toArray()}catch(n){return console.error("Errore recupero file app:",n),[]}}async getSetting(e,n=null){try{const i=await this.db.settings.get(e);return i?i.value:n}catch(i){return console.error("Errore recupero impostazione:",i),n}}async setSetting(e,n){try{return await this.db.settings.put({key:e,value:n,lastModified:new Date}),!0}catch(i){return console.error("Errore salvataggio impostazione:",i),!1}}async getAllSettings(){try{const e=await this.db.settings.toArray(),n={};return e.forEach(i=>{n[i.key]=i.value}),n}catch(e){return console.error("Errore recupero impostazioni:",e),{}}}async addSyncEvent(e,n){try{await this.db.syncEvents.add({action:e,data:n,timestamp:new Date,synced:!1,deviceId:await this.getDeviceId()})}catch(i){console.error("Errore aggiunta evento sync:",i)}}async getUnsyncedEvents(){try{return await this.db.syncEvents.where("synced").equals(!1).toArray()}catch(e){return console.error("Errore recupero eventi non sincronizzati:",e),[]}}async markEventsSynced(e){try{await this.db.syncEvents.where("id").anyOf(e).modify({synced:!0})}catch(n){console.error("Errore aggiornamento eventi sync:",n)}}async updateCatalog(e){try{return await this.db.catalog.clear(),await this.db.catalog.bulkAdd(e),!0}catch(n){return console.error("Errore aggiornamento catalogo:",n),!1}}async searchCatalog(e,n={}){try{let i=this.db.catalog.orderBy("downloads").reverse();return e&&(i=i.filter(a=>a.name.toLowerCase().includes(e.toLowerCase())||a.description.toLowerCase().includes(e.toLowerCase())||a.categories.some(s=>s.toLowerCase().includes(e.toLowerCase())))),n.category&&(i=i.filter(a=>a.categories.includes(n.category))),n.featured&&(i=i.filter(a=>a.featured===!0)),await i.limit(n.limit||50).toArray()}catch(i){return console.error("Errore ricerca catalogo:",i),[]}}async getDeviceId(){let e=await this.getSetting("deviceId");return e||(e="device_"+Math.random().toString(36).substr(2,9)+"_"+Date.now(),await this.setSetting("deviceId",e)),e}getMimeType(e){const n=e.split(".").pop().toLowerCase();return{html:"text/html",css:"text/css",js:"application/javascript",json:"application/json",png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",gif:"image/gif",svg:"image/svg+xml",txt:"text/plain"}[n]||"application/octet-stream"}async exportAllData(){try{const[e,n,i]=await Promise.all([this.db.apps.toArray(),this.db.settings.toArray(),this.db.syncEvents.toArray()]);return{version:"1.0.0",timestamp:new Date().toISOString(),deviceId:await this.getDeviceId(),data:{apps:e,settings:n,syncEvents:i}}}catch(e){throw console.error("Errore export dati:",e),e}}async importData(e){try{if(!e.data)throw new Error("Formato dati non valido");const{apps:n,settings:i,syncEvents:a}=e.data;return await this.db.transaction("rw",[this.db.apps,this.db.settings,this.db.syncEvents],async()=>{n&&await this.db.apps.bulkPut(n),i&&await this.db.settings.bulkPut(i),a&&await this.db.syncEvents.bulkPut(a)}),!0}catch(n){throw console.error("Errore import dati:",n),n}}async ensureDbOpen(){if(!this.db.isOpen())try{await this.db.open(),console.log("📂 Database riaperto con successo")}catch(e){console.error("❌ Errore riapertura database:",e)}}async getStats(){try{if(await this.ensureDbOpen(),!this.db||!this.db.isOpen())return console.warn("Database non inizializzato"),null;const n=(await this.db.apps.toArray().catch(()=>[])).filter(l=>l&&typeof l=="object"),i=n.map(l=>l.category).filter(l=>typeof l=="string"&&l.length>0),a=n.filter(l=>l.favorite===!0).length,s=n.length,r=await this.db.appFiles.count().catch(()=>0),o=await this.db.settings.count().catch(()=>0),c=n.length>0?n.reduce((l,u)=>u.installDate&&(!l||new Date(u.installDate)>new Date(l))?u.installDate:l,null):null;return{totalApps:s,totalFiles:r,settingsCount:o,favoriteApps:a,categories:Array.from(new Set(i)).length,lastInstall:c,dbSize:await this.estimateDbSize()}}catch(e){return console.error("Errore recupero statistiche:",e),null}}async estimateDbSize(){try{return"storage"in navigator&&"estimate"in navigator.storage&&(await navigator.storage.estimate()).usage||0}catch{return 0}}async close(){this.db&&this.db.close()}}const y=new ae,kn=Object.freeze(Object.defineProperty({__proto__:null,default:y},Symbol.toStringTag,{value:"Module"}));let Rn=0;function m(t,e="info",n=4e3,i={}){const a=document.getElementById("toast-container");if(!a){console.warn("Toast container non trovato");return}const s=`toast-${++Rn}`,r=document.createElement("div");r.id=s,r.className=`toast toast-${e}`,r.setAttribute("role","alert"),r.setAttribute("aria-live","polite");const o={success:`<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
    </svg>`,error:`<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
    </svg>`,warning:`<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M13,13H11V7H13M12,17.3A1.3,1.3 0 0,1 10.7,16A1.3,1.3 0 0,1 12,14.7A1.3,1.3 0 0,1 13.3,16A1.3,1.3 0 0,1 12,17.3M15.73,3H8.27L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3Z"/>
    </svg>`,info:`<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
    </svg>`};r.innerHTML=`
    <div class="toast-icon">
      ${o[e]||o.info}
    </div>
    <div class="toast-content">
      <div class="toast-message">${B(t)}</div>
      ${i.action?`<button class="toast-action">${i.action}</button>`:""}
    </div>
    <button class="toast-close" aria-label="Chiudi notifica">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
      </svg>
    </button>
  `;const c=r.querySelector(".toast-close"),l=r.querySelector(".toast-action"),u=()=>{r.classList.add("toast-removing"),setTimeout(()=>{r.parentNode&&r.parentNode.removeChild(r)},300)};return c.addEventListener("click",u),l&&i.onAction&&l.addEventListener("click",()=>{i.onAction(),u()}),a.appendChild(r),requestAnimationFrame(()=>{r.classList.add("toast-show")}),n>0&&setTimeout(u,n),s}function On(t){const e=document.getElementById(t);e&&e.querySelector(".toast-close").click()}function Pn(){document.querySelectorAll(".toast").forEach(e=>{e.querySelector(".toast-close").click()})}function gt(t){t?On(t):Pn()}function N(t,e,n={}){const i=document.getElementById("modals-container");if(!i){console.warn("Modals container non trovato");return}const a=document.getElementById(t);a&&a.remove();const s=document.createElement("div");s.id=t,s.className="modal",s.setAttribute("role","dialog"),s.setAttribute("aria-modal","true"),s.setAttribute("aria-labelledby",`${t}-title`),s.innerHTML=`
    <div class="modal-backdrop"></div>
    <div class="modal-dialog ${n.size||"modal-md"}">
      <div class="modal-content">
        ${e}
      </div>
    </div>
  `;const r=s.querySelector(".modal-backdrop"),o=s.querySelectorAll(".modal-close"),c=f=>{f&&f.preventDefault(),s.classList.add("modal-closing"),setTimeout(()=>{s.parentNode&&s.parentNode.removeChild(s),n.returnFocus&&n.returnFocus.focus()},300)};n.disableBackdropClose||r.addEventListener("click",c),o.forEach(f=>{f.addEventListener("click",c)});const l=f=>{f.key==="Escape"&&!n.disableEscapeClose&&(c(),document.removeEventListener("keydown",l))};document.addEventListener("keydown",l);const u=document.activeElement;return n.returnFocus=u,i.appendChild(s),requestAnimationFrame(()=>{s.classList.add("modal-show");const f=s.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');f.length>0&&f[0].focus()}),s}function k(t){const e=document.getElementById(t);if(e){const n=e.querySelector(".modal-close");n&&n.click()}}function B(t){const e=document.createElement("div");return e.textContent=t,e.innerHTML}function re(t,e=2){if(t===0)return"0 Bytes";const n=1024,i=e<0?0:e,a=["Bytes","KB","MB","GB","TB"],s=Math.floor(Math.log(t)/Math.log(n));return parseFloat((t/Math.pow(n,s)).toFixed(i))+" "+a[s]}function he(t){const e=new Date(t);if(isNaN(e.getTime()))return"Data non valida";const i=new Date-e,a=Math.floor(i/1e3),s=Math.floor(a/60),r=Math.floor(s/60),o=Math.floor(r/24),c=Math.floor(o/7),l=Math.floor(o/30),u=Math.floor(o/365);return a<60?"Proprio ora":s<60?`${s} minut${s===1?"o":"i"} fa`:r<24?`${r} or${r===1?"a":"e"} fa`:o<7?`${o} giorn${o===1?"o":"i"} fa`:c<4?`${c} settiman${c===1?"a":"e"} fa`:l<12?`${l} mes${l===1?"e":"i"} fa`:`${u} ann${u===1?"o":"i"} fa`}function Ft(t="id"){return`${t}-${Math.random().toString(36).substr(2,9)}-${Date.now()}`}function Bn(){return window.innerWidth<=768||/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)}function Nn(){return"serviceWorker"in navigator&&"manifests"in window}function Hn(){return{userAgent:navigator.userAgent,platform:navigator.platform,language:navigator.language,online:navigator.onLine,cookieEnabled:navigator.cookieEnabled,screen:{width:screen.width,height:screen.height,colorDepth:screen.colorDepth},viewport:{width:window.innerWidth,height:window.innerHeight},isMobile:Bn(),isPWASupported:Nn()}}function mt(t){try{return new URL(t),!0}catch{return!1}}function vt(t){try{return new URL(t).hostname}catch{return""}}async function Pe(t){const n=new TextEncoder().encode(t),i=await crypto.subtle.digest("SHA-256",n);return Array.from(new Uint8Array(i)).map(s=>s.toString(16).padStart(2,"0")).join("")}function V(t={}){return new Promise(e=>{const{title:n="Conferma",message:i="Sei sicuro di voler continuare?",icon:a="question",confirmText:s="Conferma",cancelText:r="Annulla",type:o="default"}=t,c=document.createElement("div");c.className="confirm-popup";const l={question:`<svg viewBox="0 0 24 24" fill="currentColor" class="confirm-popup-icon">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
      </svg>`,warning:`<svg viewBox="0 0 24 24" fill="currentColor" class="confirm-popup-icon">
        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
      </svg>`,danger:`<svg viewBox="0 0 24 24" fill="currentColor" class="confirm-popup-icon">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>`,info:`<svg viewBox="0 0 24 24" fill="currentColor" class="confirm-popup-icon">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
      </svg>`},u=l[a]||l.question,f=o==="danger"?"confirm-popup-btn-danger":"confirm-popup-btn-primary";c.innerHTML=`
      <div class="confirm-popup-content">
        <div class="confirm-popup-header">
          <h3 class="confirm-popup-title">
            ${u}
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
    `;const g=b=>{document.body.removeChild(c),e(b==="confirm")};c.addEventListener("click",b=>{b.target===c&&g("cancel")}),c.querySelectorAll("[data-action]").forEach(b=>{b.addEventListener("click",S=>{S.preventDefault(),g(b.dataset.action)})});const v=b=>{b.key==="Escape"&&(document.removeEventListener("keydown",v),g("cancel"))};document.addEventListener("keydown",v),document.body.appendChild(c),setTimeout(()=>{c.querySelector(".confirm-popup-btn-secondary").focus()},100)})}function zn(t){return V({title:"Elimina App",message:`Sei sicuro di voler eliminare "${t}"? Questa azione non può essere annullata.`,icon:"danger",confirmText:"Elimina",cancelText:"Annulla",type:"danger"})}class Un{constructor(){this.activeApps=new Map,this.launchHistory=[],this.maxConcurrentApps=5,this.launch=this.launch.bind(this),this.launchZipApp=this.launchZipApp.bind(this),this.launchUrlApp=this.launchUrlApp.bind(this),this.launchGitHubApp=this.launchGitHubApp.bind(this),this.launchPWA=this.launchPWA.bind(this),this.createSecureFrame=this.createSecureFrame.bind(this),this.closeApp=this.closeApp.bind(this),this.setupEventListeners=this.setupEventListeners.bind(this)}async init(){this.setupEventListeners(),await this.loadLaunchHistory()}async launch(e,n={}){try{console.log(`🚀 Launching app: ${e.name} (${e.type})`);const i=await y.getSetting("defaultLaunchMode","newpage"),a=e.metadata?.launchMode,s=n.forceMode||a||i;if(n.launchMode=s,s==="iframe"&&this.activeApps.size>=this.maxConcurrentApps&&!n.force&&!await this.showConcurrentAppsDialog())return;const r=await this.validateApp(e);if(!r.valid)throw new Error(r.error);const o=Ft("launch"),c=Date.now();m(`Caricamento ${e.name}...`,"info",0);let l;switch(e.type){case"zip":l=await this.launchZipApp(e,n);break;case"html":l=await this.launchHtmlApp(e,n);break;case"github":l=await this.launchGitHubApp(e,n);break;case"pwa":l=await this.launchPWA(e,n);break;default:l=await this.launchUrlApp(e,n)}return this.activeApps.set(o,{app:e,iframe:l,startTime:Date.now(),launchMode:s}),this.addToHistory(e,o),gt(),l}catch(i){throw console.error("Errore lancio app:",i),gt(),m(`Errore nel lancio di ${e.name}: ${i.message}`,"error"),i}}async launchZipApp(e,n={}){try{const i=await y.getAppFiles(e.id);if(!i.length)throw new Error("File dell'app non trovati");const a=this.findEntryPoint(i,e.manifest?.entryPoint);if(!a)throw new Error("Entry point non trovato");const s=new Map,r=new Map;for(const u of i){const f=new Blob([u.content],{type:u.mimeType}),g=URL.createObjectURL(f);s.set(u.filename,u),r.set(u.filename,g)}let o=a.content;o=this.replaceAllLocalPaths(o,r,e);const c=new Blob([o],{type:"text/html"}),l=URL.createObjectURL(c);if(n.launchMode==="newpage"){const u=window.open("",`aideas_zip_${e.id}_${Date.now()}`,"width=1200,height=800,scrollbars=yes,resizable=yes");if(!u)throw new Error("Popup bloccato dal browser. Consenti i popup per AIdeas.");u.document.write(o),u.document.close(),this.injectAIdeasAPI({contentWindow:u},e);const f=()=>{for(const g of r.values())URL.revokeObjectURL(g);URL.revokeObjectURL(l)};return u.addEventListener("beforeunload",f),{window:u,external:!0,cleanup:f}}else{const u=this.createSecureFrame(e,{src:l,sandbox:"allow-scripts allow-forms allow-modals allow-popups-to-escape-sandbox allow-same-origin",files:s,blobUrls:r});return u.addEventListener("unload",()=>{for(const f of r.values())URL.revokeObjectURL(f);URL.revokeObjectURL(l)}),{iframe:u,window:u.contentWindow,cleanup:()=>{for(const f of r.values())URL.revokeObjectURL(f);URL.revokeObjectURL(l)}}}}catch(i){throw console.error("Errore lancio app ZIP:",i),i}}async launchHtmlApp(e,n={}){try{if(!e.content)throw new Error("Contenuto HTML mancante");let i=await this.injectCSPForHTMLApp(e.content,e.id);const a=new Blob([i],{type:"text/html"}),s=URL.createObjectURL(a);if(n.launchMode==="newpage"){const r=window.open("",`aideas_html_${e.id}_${Date.now()}`,"width=1200,height=800,scrollbars=yes,resizable=yes");if(!r)throw new Error("Popup bloccato dal browser. Consenti i popup per AIdeas.");return r.document.open(),r.document.write(i),r.document.close(),{window:r,external:!0,cleanup:()=>{URL.revokeObjectURL(s)}}}else{const r=this.createSecureFrame(e,{src:s,sandbox:"allow-scripts allow-forms allow-modals allow-popups-to-escape-sandbox allow-same-origin"});return r.addEventListener("unload",()=>{URL.revokeObjectURL(s)}),{iframe:r,window:r.contentWindow,cleanup:()=>{URL.revokeObjectURL(s)}}}}catch(i){throw console.error("Errore lancio app HTML:",i),i}}analyzeHTMLForExternalResources(e){const n={scripts:new Set,styles:new Set,fonts:new Set,images:new Set,frames:new Set,connections:new Set},i={scripts:/<script[^>]*src=["']([^"']+)["'][^>]*>/gi,styles:/<link[^>]*href=["']([^"']+)["'][^>]*>/gi,images:/<img[^>]*src=["']([^"']+)["'][^>]*>/gi,frames:/<iframe[^>]*src=["']([^"']+)["'][^>]*>/gi,connections:/fetch\(["']([^"']+)["']\)|XMLHttpRequest\(["']([^"']+)["']\)/gi},a=r=>{try{if(r.startsWith("//"))r="https:"+r;else{if(r.startsWith("/"))return null;if(!r.startsWith("http"))return null}return new URL(r).hostname}catch{return null}};let s;for(;(s=i.scripts.exec(e))!==null;){const r=a(s[1]);r&&n.scripts.add(r)}for(;(s=i.styles.exec(e))!==null;){const r=a(s[1]);if(r){const o=s[0];o.includes('rel="stylesheet"')||o.includes('type="text/css"')?n.styles.add(r):o.includes('rel="preload"')&&o.includes('as="font"')&&n.fonts.add(r)}}for(;(s=i.images.exec(e))!==null;){const r=a(s[1]);r&&n.images.add(r)}for(;(s=i.frames.exec(e))!==null;){const r=a(s[1]);r&&n.frames.add(r)}for(;(s=i.connections.exec(e))!==null;){const r=s[1]||s[2],o=a(r);o&&n.connections.add(o)}return{scripts:Array.from(n.scripts),styles:Array.from(n.styles),fonts:Array.from(n.fonts),images:Array.from(n.images),frames:Array.from(n.frames),connections:Array.from(n.connections)}}generateCustomCSP(e){const n=new Set;Object.values(e).forEach(s=>{s.forEach(r=>n.add(r))});const i=Array.from(n);let a="default-src 'self' data: blob: 'unsafe-inline' 'unsafe-eval'; ";return a+="script-src 'self' data: blob: 'unsafe-inline' 'unsafe-eval' "+i.join(" ")+"; ",a+="style-src 'self' data: blob: 'unsafe-inline' "+i.join(" ")+"; ",a+="img-src 'self' data: blob: "+i.join(" ")+"; ",a+="font-src 'self' data: blob: "+i.join(" ")+"; ",a+="connect-src 'self' data: blob: "+i.join(" ")+"; ",a+="frame-src 'self' data: blob: "+i.join(" ")+"; ",a+="object-src 'self' data: blob:; ",a+="base-uri 'self'; ",a+="form-action 'self';",a}async injectCSPForHTMLApp(e,n=null){try{let i=null,a=null;if(n){const r=await y.getAppMetadata(n,"customCSP"),o=await y.getAppMetadata(n,"externalDomains"),c=await y.getAppMetadata(n,"lastAnalyzed");if(r&&o&&c){const l=(Date.now()-c)/36e5;l<24&&(console.log(`♻️ Usando CSP cached per app ${n} (analizzata ${l.toFixed(1)} ore fa)`),i=r,a=o)}}i||(console.log(`🔍 Analisi HTML per app ${n||"senza ID"}...`),a=this.analyzeHTMLForExternalResources(e),i=this.generateCustomCSP(a),n&&(await y.setAppMetadata(n,{customCSP:i,externalDomains:a,lastAnalyzed:Date.now()}),console.log(`💾 CSP cached per app ${n}`))),console.log("🔍 Domini trovati nell'HTML:",a);let s;return e.includes('<meta http-equiv="Content-Security-Policy"')?s=e.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/g,`<meta http-equiv="Content-Security-Policy" content="${i}">`):s=e.replace(/<head>/i,`<head>
  <meta http-equiv="Content-Security-Policy" content="${i}">`),s}catch(i){console.warn("Errore nell'analisi CSP, uso CSP di fallback:",i);const a="default-src * data: blob: 'unsafe-inline' 'unsafe-eval'; script-src * data: blob: 'unsafe-inline' 'unsafe-eval'; style-src * data: blob: 'unsafe-inline'; img-src * data: blob:; font-src * data: blob:; connect-src * data: blob:; frame-src * data: blob:; object-src * data: blob:; base-uri *; form-action *;";let s;return e.includes('<meta http-equiv="Content-Security-Policy"')?s=e.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/g,`<meta http-equiv="Content-Security-Policy" content="${a}">`):s=e.replace(/<head>/i,`<head>
  <meta http-equiv="Content-Security-Policy" content="${a}">`),s}}async launchUrlApp(e,n={}){try{if(!e.url)throw new Error("URL dell'app non specificato");let i=e.url;if(n.launchMode==="newpage"||n.forceNewWindow){console.log("🪟 Apertura in nuova finestra (modalità esplicita)");const a=window.open(i,`aideas_app_${e.id}`,"width=1200,height=800,scrollbars=yes,resizable=yes");if(!a)throw new Error("Popup bloccato dal browser. Consenti i popup per AIdeas.");return{window:a,external:!0}}else if(console.log("🔍 Tentativo apertura in iframe..."),await this.checkIframeCompatibility(i)){console.log("✅ Caricamento in iframe...");const s=this.createSecureFrame(e,{src:i,sandbox:"allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin"});return s.addEventListener("error",()=>{console.log("❌ Errore caricamento iframe, fallback a nuova finestra"),m("Errore caricamento iframe, apertura in nuova finestra","info");const r=s.closest(".modal");r&&k(r.id),window.open(i,`aideas_app_${e.id}_fallback`,"width=1200,height=800,scrollbars=yes,resizable=yes")&&m("App aperta in nuova finestra","success")}),{iframe:s,window:s.contentWindow}}else{console.log("🔄 Fallback automatico a nuova finestra - iframe non supportato"),m("Questo sito non supporta iframe, apertura in nuova finestra","info");const s=window.open(i,`aideas_app_${e.id}_fallback`,"width=1200,height=800,scrollbars=yes,resizable=yes");if(!s)throw new Error("Popup bloccato dal browser. Consenti i popup per AIdeas.");return{window:s,external:!0,fallback:!0}}}catch(i){throw console.error("Errore lancio app URL:",i),i}}async launchGitHubApp(e,n={}){try{if(!e.githubUrl)throw new Error("URL GitHub non specificato");const i=this.parseGitHubUrl(e.githubUrl);if(!i)throw new Error("URL GitHub non valido");let a;e.metadata?.usePagesUrl?a=`https://${i.owner}.github.io/${i.repo}/`:a=`https://raw.githubusercontent.com/${i.owner}/${i.repo}/${i.branch||"main"}/index.html`;const s={...e,url:a,type:"url"};return await this.launchUrlApp(s,n)}catch(i){throw console.error("Errore lancio app GitHub:",i),i}}async launchPWA(e,n={}){try{if(!e.url)throw new Error("URL della PWA non specificato");const i=window.open(e.url,`aideas_pwa_${e.id}`,"width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,location=no,status=no,menubar=no");if(!i)throw new Error("Popup bloccato dal browser. Consenti i popup per AIdeas.");return"serviceWorker"in navigator&&e.manifest&&setTimeout(()=>{this.promptPWAInstall(e,i)},2e3),{window:i,external:!0,isPWA:!0}}catch(i){throw console.error("Errore lancio PWA:",i),i}}createSecureFrame(e,n={}){const i=`app-modal-${e.id}-${Date.now()}`,a=`
      <div class="modal-header">
        <div class="app-modal-title">
          <div class="app-modal-icon">
            ${e.icon?`<img src="${e.icon}" alt="${e.name}">`:"📱"}
          </div>
          <div>
            <h2>${B(e.name)}</h2>
            <p class="app-modal-subtitle">${B(e.description||"")}</p>
          </div>
        </div>
        <div class="app-modal-controls">
          <select class="app-launch-mode" id="app-launch-mode-${e.id}" title="Modalità di apertura">
            <option value="default">Modalità predefinita</option>
            <option value="iframe">Apri in finestra modale</option>
            <option value="newpage">Apri in nuova pagina</option>
          </select>
          <button class="btn btn-secondary btn-sm" id="app-refresh-${e.id}">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
            </svg>
            Ricarica
          </button>
          <button class="btn btn-secondary btn-sm" id="app-fullscreen-${e.id}">
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
            <p>Caricamento ${B(e.name)}...</p>
          </div>
        </div>
      </div>
    `,s=N(i,a,{size:"modal-xl",disableBackdropClose:!1,disableEscapeClose:!1}),r=document.createElement("iframe");return r.className="app-frame",r.src=n.src,r.sandbox=n.sandbox||"allow-scripts allow-forms allow-modals",r.style.cssText=`
      width: 100%;
      height: 70vh;
      border: none;
      border-radius: 8px;
      background: white;
    `,r.addEventListener("load",()=>{const c=s.querySelector(".app-loading");c&&(c.style.display="none"),r.style.display="block",this.injectAIdeasAPI(r,e)}),r.addEventListener("error",()=>{const c=s.querySelector(".app-frame-container");c.innerHTML=`
        <div class="app-error">
          <div class="app-error-icon">⚠️</div>
          <h3>Errore di caricamento</h3>
          <p>Impossibile caricare l'applicazione.</p>
          <button class="btn btn-primary" onclick="location.reload()">Riprova</button>
        </div>
      `}),s.querySelector(".app-frame-container").appendChild(r),this.setupAppModalControls(s,r,e),r}setupAppModalControls(e,n,i){const a=e.querySelector(`#app-launch-mode-${i.id}`);a?.addEventListener("change",async()=>{const c=a.value;c!=="default"&&(await V({title:"Cambia Modalità",message:`Vuoi riaprire l'app in modalità "${c==="iframe"?"finestra modale":"nuova pagina"}"?`,icon:"question",confirmText:"Riapri",cancelText:"Annulla",type:"default"})?(k(e.id),await this.launch(i,{forceMode:c})):a.value="default")}),e.querySelector(`#app-refresh-${i.id}`)?.addEventListener("click",()=>{n.src=n.src,m("App ricaricata","info")}),e.querySelector(`#app-fullscreen-${i.id}`)?.addEventListener("click",()=>{e.requestFullscreen?e.requestFullscreen():e.webkitRequestFullscreen?e.webkitRequestFullscreen():e.msRequestFullscreen&&e.msRequestFullscreen()});const o=new MutationObserver(c=>{c.forEach(l=>{l.type==="childList"&&l.removedNodes.forEach(u=>{u===e&&(this.cleanupApp(i.id),o.disconnect())})})});o.observe(document.body,{childList:!0})}injectAIdeasAPI(e,n){try{const i=e.contentWindow;if(!i)return;i.AIdeas={app:{id:n.id,name:n.name,version:n.version},storage:{get:a=>localStorage.getItem(`aideas_app_${n.id}_${a}`),set:(a,s)=>localStorage.setItem(`aideas_app_${n.id}_${a}`,s),remove:a=>localStorage.removeItem(`aideas_app_${n.id}_${a}`),clear:()=>{const a=`aideas_app_${n.id}_`;Object.keys(localStorage).forEach(s=>{s.startsWith(a)&&localStorage.removeItem(s)})}},utils:{showNotification:(a,s="info")=>{m(`[${n.name}] ${a}`,s)},getUserPreferences:async()=>await y.getAllSettings(),openUrl:a=>{window.open(a,"_blank")},closeApp:()=>{this.closeApp(n.id)}},lifecycle:{onAppStart:a=>{typeof a=="function"&&setTimeout(a,100)},onAppPause:a=>{window.addEventListener("blur",a)},onAppResume:a=>{window.addEventListener("focus",a)}}},console.log(`✅ AIdeas API iniettata in ${n.name}`)}catch(i){console.warn("Impossibile iniettare AIdeas API:",i)}}findEntryPoint(e,n){if(n){const s=e.find(r=>r.filename===n);if(s)return s}const i=e.find(s=>s.filename==="index.html");if(i)return i;const a=e.find(s=>s.filename.endsWith(".html"));if(a)return a;throw new Error("Entry point HTML non trovato")}replaceAllLocalPaths(e,n,i){let a=e;const s=new Map;for(const[o,c]of n){s.set(o,c),s.set("./"+o,c),s.set("../"+o,c);const l=o.split("/");if(l.length>1){const u=l[l.length-1];s.has(u)||s.set(u,c)}}a=a.replace(/\bsrc\s*=\s*["']([^"']+)["']/gi,(o,c)=>{const l=this.cleanPath(c);return s.has(l)?o.replace(c,s.get(l)):o}),a=a.replace(/\bhref\s*=\s*["']([^"']+)["']/gi,(o,c)=>{const l=this.cleanPath(c);return s.has(l)&&!c.startsWith("#")&&!c.startsWith("mailto:")?o.replace(c,s.get(l)):o}),a=a.replace(/\bimport\s+.*?\s+from\s+["']([^"']+)["']/gi,(o,c)=>{const l=this.cleanPath(c);return s.has(l)?o.replace(c,s.get(l)):o}),a=a.replace(/\brequire\s*\(\s*["']([^"']+)["']\s*\)/gi,(o,c)=>{const l=this.cleanPath(c);return s.has(l)?o.replace(c,s.get(l)):o}),a=a.replace(/\burl\s*\(\s*["']?([^"')]+)["']?\s*\)/gi,(o,c)=>{const l=this.cleanPath(c);return s.has(l)?o.replace(c,s.get(l)):o}),a=a.replace(/\bfetch\s*\(\s*["']([^"']+)["']/gi,(o,c)=>{const l=this.cleanPath(c);return s.has(l)?o.replace(c,s.get(l)):o}),a=a.replace(/\bnew\s+URL\s*\(\s*["']([^"']+)["']/gi,(o,c)=>{const l=this.cleanPath(c);return s.has(l)?o.replace(c,s.get(l)):o}),a=a.replace(/["']([^"']*\.[a-zA-Z0-9]+)["']/gi,(o,c)=>{if(!c.includes("://")&&!c.startsWith("data:")&&!c.startsWith("#")){const l=this.cleanPath(c);if(s.has(l))return o.replace(c,s.get(l))}return o});const r=`
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="aideas-app" content="${B(i.name)}">
      <meta name="aideas-version" content="${i.version||"1.0.0"}">
      <meta name="aideas-type" content="zip">
      <base href="blob:">
    `;return a.includes("<head>")?a=a.replace("<head>","<head>"+r):a.includes("<html>")?a=a.replace("<html>","<html><head>"+r+"</head>"):a=r+a,a}cleanPath(e){if(!e)return"";let n=e.split("?")[0].split("#")[0];return n=n.replace(/\\/g,"/"),n=n.trim(),n}async checkIframeCompatibility(e){try{if(console.log(`🔍 Controllo compatibilità iframe per: ${e}`),e.startsWith("blob:"))return console.log("✅ Blob URL - compatibile con iframe"),!0;if(e.startsWith("data:"))return console.log("✅ Data URL - compatibile con iframe"),!0;const n=new AbortController,i=setTimeout(()=>n.abort(),5e3);try{const a=await fetch(e,{method:"HEAD",signal:n.signal,mode:"cors"});clearTimeout(i);const s=a.headers.get("X-Frame-Options"),r=a.headers.get("Content-Security-Policy");if(console.log("📋 Headers ricevuti:",{"X-Frame-Options":s,"Content-Security-Policy":r?r.substring(0,100)+"...":"none"}),s){const o=s.toLowerCase();if(o==="deny")return console.log("❌ X-Frame-Options: DENY - iframe non supportato"),!1;if(o==="sameorigin")return console.log("⚠️ X-Frame-Options: SAMEORIGIN - iframe limitato"),window.location.origin===new URL(e).origin}if(r){const o=r.toLowerCase();if(o.includes("frame-ancestors")){if(o.includes("frame-ancestors 'none'"))return console.log("❌ CSP frame-ancestors: none - iframe non supportato"),!1;if(o.includes("frame-ancestors 'self'"))return console.log("⚠️ CSP frame-ancestors: self - iframe limitato"),window.location.origin===new URL(e).origin}}return console.log("✅ URL compatibile con iframe"),!0}catch(a){return clearTimeout(i),a.name==="AbortError"?console.log("⏰ Timeout durante controllo compatibilità iframe"):console.log("⚠️ Errore durante controllo compatibilità iframe:",a.message),console.log("🔄 Fallback: proveremo iframe comunque"),!0}}catch(n){return console.error("❌ Errore generale controllo compatibilità iframe:",n),!1}}parseGitHubUrl(e){const n=[/github\.com\/([^\/]+)\/([^\/]+)/,/([^\/]+)\.github\.io\/([^\/]+)/];for(const i of n){const a=e.match(i);if(a)return{owner:a[1],repo:a[2].replace(".git",""),branch:"main"}}return null}async validateApp(e){const n={valid:!0,error:null};if(!e||!e.id)return n.valid=!1,n.error="App non valida",n;switch(e.type){case"zip":(await y.getAppFiles(e.id)).length||(n.valid=!1,n.error="File dell'app non trovati");break;case"url":case"github":case"pwa":!e.url&&!e.githubUrl&&(n.valid=!1,n.error="URL dell'app non specificato");break;case"html":e.content||(n.valid=!1,n.error="Contenuto HTML mancante");break;default:n.valid=!1,n.error=`Tipo di app non supportato: ${e.type}`}return n}async showConcurrentAppsDialog(){return new Promise(e=>{N("concurrent-apps-dialog",`
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
      `,{disableBackdropClose:!0}),setTimeout(()=>e(!0),5e3)})}closeApp(e){const n=Array.from(this.activeApps.values()).find(i=>i.app.id===e);n&&(n.window&&!n.window.closed&&n.window.close(),n.cleanup&&n.cleanup(),this.activeApps.delete(e))}cleanupApp(e){this.closeApp(e)}setupEventListeners(){window.addEventListener("beforeunload",()=>{for(const[e,n]of this.activeApps)n.cleanup&&n.cleanup()})}async loadLaunchHistory(){const e=await y.getSetting("launchHistory",[]);this.launchHistory=e.slice(-50)}addToHistory(e,n){this.launchHistory.push({appId:e.id,appName:e.name,launchId:n,timestamp:new Date().toISOString()}),y.setSetting("launchHistory",this.launchHistory.slice(-50))}trackLaunch(e,n){console.log(`📊 Launch tracked: ${e.name} in ${n}ms`)}promptPWAInstall(e,n){console.log(`💡 PWA install prompt for ${e.name}`)}get activeAppCount(){return this.activeApps.size}get canLaunchMore(){return this.activeApps.size<this.maxConcurrentApps}}var L;(function(t){t.Root="root",t.Text="text",t.Directive="directive",t.Comment="comment",t.Script="script",t.Style="style",t.Tag="tag",t.CDATA="cdata",t.Doctype="doctype"})(L||(L={}));function Dn(t){return t.type===L.Tag||t.type===L.Script||t.type===L.Style}const _t=L.Root,Fn=L.Text,_n=L.Directive,$n=L.Comment,Vn=L.Script,qn=L.Style,Ve=L.Tag,jn=L.CDATA,Wn=L.Doctype;class $t{constructor(){this.parent=null,this.prev=null,this.next=null,this.startIndex=null,this.endIndex=null}get parentNode(){return this.parent}set parentNode(e){this.parent=e}get previousSibling(){return this.prev}set previousSibling(e){this.prev=e}get nextSibling(){return this.next}set nextSibling(e){this.next=e}cloneNode(e=!1){return oe(this,e)}}class Xe extends $t{constructor(e){super(),this.data=e}get nodeValue(){return this.data}set nodeValue(e){this.data=e}}class Vt extends Xe{constructor(){super(...arguments),this.type=L.Text}get nodeType(){return 3}}class Zn extends Xe{constructor(){super(...arguments),this.type=L.Comment}get nodeType(){return 8}}class Yn extends Xe{constructor(e,n){super(n),this.name=e,this.type=L.Directive}get nodeType(){return 1}}class Qe extends $t{constructor(e){super(),this.children=e}get firstChild(){var e;return(e=this.children[0])!==null&&e!==void 0?e:null}get lastChild(){return this.children.length>0?this.children[this.children.length-1]:null}get childNodes(){return this.children}set childNodes(e){this.children=e}}class Kn extends Qe{constructor(){super(...arguments),this.type=L.CDATA}get nodeType(){return 4}}class qt extends Qe{constructor(){super(...arguments),this.type=L.Root}get nodeType(){return 9}}class Xn extends Qe{constructor(e,n,i=[],a=e==="script"?L.Script:e==="style"?L.Style:L.Tag){super(i),this.name=e,this.attribs=n,this.type=a}get nodeType(){return 1}get tagName(){return this.name}set tagName(e){this.name=e}get attributes(){return Object.keys(this.attribs).map(e=>{var n,i;return{name:e,value:this.attribs[e],namespace:(n=this["x-attribsNamespace"])===null||n===void 0?void 0:n[e],prefix:(i=this["x-attribsPrefix"])===null||i===void 0?void 0:i[e]}})}}function w(t){return Dn(t)}function xe(t){return t.type===L.CDATA}function q(t){return t.type===L.Text}function Je(t){return t.type===L.Comment}function Qn(t){return t.type===L.Directive}function Q(t){return t.type===L.Root}function M(t){return Object.prototype.hasOwnProperty.call(t,"children")}function oe(t,e=!1){let n;if(q(t))n=new Vt(t.data);else if(Je(t))n=new Zn(t.data);else if(w(t)){const i=e?Be(t.children):[],a=new Xn(t.name,{...t.attribs},i);i.forEach(s=>s.parent=a),t.namespace!=null&&(a.namespace=t.namespace),t["x-attribsNamespace"]&&(a["x-attribsNamespace"]={...t["x-attribsNamespace"]}),t["x-attribsPrefix"]&&(a["x-attribsPrefix"]={...t["x-attribsPrefix"]}),n=a}else if(xe(t)){const i=e?Be(t.children):[],a=new Kn(i);i.forEach(s=>s.parent=a),n=a}else if(Q(t)){const i=e?Be(t.children):[],a=new qt(i);i.forEach(s=>s.parent=a),t["x-mode"]&&(a["x-mode"]=t["x-mode"]),n=a}else if(Qn(t)){const i=new Yn(t.name,t.data);t["x-name"]!=null&&(i["x-name"]=t["x-name"],i["x-publicId"]=t["x-publicId"],i["x-systemId"]=t["x-systemId"]),n=i}else throw new Error(`Not implemented yet: ${t.type}`);return n.startIndex=t.startIndex,n.endIndex=t.endIndex,t.sourceCodeLocation!=null&&(n.sourceCodeLocation=t.sourceCodeLocation),n}function Be(t){const e=t.map(n=>oe(n,!0));for(let n=1;n<e.length;n++)e[n].prev=e[n-1],e[n-1].next=e[n];return e}const yt=/["&'<>$\x80-\uFFFF]/g,Jn=new Map([[34,"&quot;"],[38,"&amp;"],[39,"&apos;"],[60,"&lt;"],[62,"&gt;"]]),Gn=String.prototype.codePointAt!=null?(t,e)=>t.codePointAt(e):(t,e)=>(t.charCodeAt(e)&64512)===55296?(t.charCodeAt(e)-55296)*1024+t.charCodeAt(e+1)-56320+65536:t.charCodeAt(e);function jt(t){let e="",n=0,i;for(;(i=yt.exec(t))!==null;){const a=i.index,s=t.charCodeAt(a),r=Jn.get(s);r!==void 0?(e+=t.substring(n,a)+r,n=a+1):(e+=`${t.substring(n,a)}&#x${Gn(t,a).toString(16)};`,n=yt.lastIndex+=+((s&64512)===55296))}return e+t.substr(n)}function Wt(t,e){return function(i){let a,s=0,r="";for(;a=t.exec(i);)s!==a.index&&(r+=i.substring(s,a.index)),r+=e.get(a[0].charCodeAt(0)),s=a.index+1;return r+i.substring(s)}}const ei=Wt(/["&\u00A0]/g,new Map([[34,"&quot;"],[38,"&amp;"],[160,"&nbsp;"]])),ti=Wt(/[&<>\u00A0]/g,new Map([[38,"&amp;"],[60,"&lt;"],[62,"&gt;"],[160,"&nbsp;"]])),ni=new Map(["altGlyph","altGlyphDef","altGlyphItem","animateColor","animateMotion","animateTransform","clipPath","feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feDistantLight","feDropShadow","feFlood","feFuncA","feFuncB","feFuncG","feFuncR","feGaussianBlur","feImage","feMerge","feMergeNode","feMorphology","feOffset","fePointLight","feSpecularLighting","feSpotLight","feTile","feTurbulence","foreignObject","glyphRef","linearGradient","radialGradient","textPath"].map(t=>[t.toLowerCase(),t])),ii=new Map(["definitionURL","attributeName","attributeType","baseFrequency","baseProfile","calcMode","clipPathUnits","diffuseConstant","edgeMode","filterUnits","glyphRef","gradientTransform","gradientUnits","kernelMatrix","kernelUnitLength","keyPoints","keySplines","keyTimes","lengthAdjust","limitingConeAngle","markerHeight","markerUnits","markerWidth","maskContentUnits","maskUnits","numOctaves","pathLength","patternContentUnits","patternTransform","patternUnits","pointsAtX","pointsAtY","pointsAtZ","preserveAlpha","preserveAspectRatio","primitiveUnits","refX","refY","repeatCount","repeatDur","requiredExtensions","requiredFeatures","specularConstant","specularExponent","spreadMethod","startOffset","stdDeviation","stitchTiles","surfaceScale","systemLanguage","tableValues","targetX","targetY","textLength","viewBox","viewTarget","xChannelSelector","yChannelSelector","zoomAndPan"].map(t=>[t.toLowerCase(),t])),ai=new Set(["style","script","xmp","iframe","noembed","noframes","plaintext","noscript"]);function si(t){return t.replace(/"/g,"&quot;")}function ri(t,e){var n;if(!t)return;const i=((n=e.encodeEntities)!==null&&n!==void 0?n:e.decodeEntities)===!1?si:e.xmlMode||e.encodeEntities!=="utf8"?jt:ei;return Object.keys(t).map(a=>{var s,r;const o=(s=t[a])!==null&&s!==void 0?s:"";return e.xmlMode==="foreign"&&(a=(r=ii.get(a))!==null&&r!==void 0?r:a),!e.emptyAttrs&&!e.xmlMode&&o===""?a:`${a}="${i(o)}"`}).join(" ")}const bt=new Set(["area","base","basefont","br","col","command","embed","frame","hr","img","input","isindex","keygen","link","meta","param","source","track","wbr"]);function Ge(t,e={}){const n="length"in t?t:[t];let i="";for(let a=0;a<n.length;a++)i+=oi(n[a],e);return i}function oi(t,e){switch(t.type){case _t:return Ge(t.children,e);case Wn:case _n:return ui(t);case $n:return fi(t);case jn:return hi(t);case Vn:case qn:case Ve:return di(t,e);case Fn:return pi(t,e)}}const ci=new Set(["mi","mo","mn","ms","mtext","annotation-xml","foreignObject","desc","title"]),li=new Set(["svg","math"]);function di(t,e){var n;e.xmlMode==="foreign"&&(t.name=(n=ni.get(t.name))!==null&&n!==void 0?n:t.name,t.parent&&ci.has(t.parent.name)&&(e={...e,xmlMode:!1})),!e.xmlMode&&li.has(t.name)&&(e={...e,xmlMode:"foreign"});let i=`<${t.name}`;const a=ri(t.attribs,e);return a&&(i+=` ${a}`),t.children.length===0&&(e.xmlMode?e.selfClosingTags!==!1:e.selfClosingTags&&bt.has(t.name))?(e.xmlMode||(i+=" "),i+="/>"):(i+=">",t.children.length>0&&(i+=Ge(t.children,e)),(e.xmlMode||!bt.has(t.name))&&(i+=`</${t.name}>`)),i}function ui(t){return`<${t.data}>`}function pi(t,e){var n;let i=t.data||"";return((n=e.encodeEntities)!==null&&n!==void 0?n:e.decodeEntities)!==!1&&!(!e.xmlMode&&t.parent&&ai.has(t.parent.name))&&(i=e.xmlMode||e.encodeEntities!=="utf8"?jt(i):ti(i)),i}function hi(t){return`<![CDATA[${t.children[0].data}]]>`}function fi(t){return`<!--${t.data}-->`}function Zt(t,e){return Ge(t,e)}function gi(t,e){return M(t)?t.children.map(n=>Zt(n,e)).join(""):""}function me(t){return Array.isArray(t)?t.map(me).join(""):w(t)?t.name==="br"?`
`:me(t.children):xe(t)?me(t.children):q(t)?t.data:""}function K(t){return Array.isArray(t)?t.map(K).join(""):M(t)&&!Je(t)?K(t.children):q(t)?t.data:""}function be(t){return Array.isArray(t)?t.map(be).join(""):M(t)&&(t.type===L.Tag||xe(t))?be(t.children):q(t)?t.data:""}function Ie(t){return M(t)?t.children:[]}function Yt(t){return t.parent||null}function Kt(t){const e=Yt(t);if(e!=null)return Ie(e);const n=[t];let{prev:i,next:a}=t;for(;i!=null;)n.unshift(i),{prev:i}=i;for(;a!=null;)n.push(a),{next:a}=a;return n}function mi(t,e){var n;return(n=t.attribs)===null||n===void 0?void 0:n[e]}function vi(t,e){return t.attribs!=null&&Object.prototype.hasOwnProperty.call(t.attribs,e)&&t.attribs[e]!=null}function yi(t){return t.name}function et(t){let{next:e}=t;for(;e!==null&&!w(e);)({next:e}=e);return e}function tt(t){let{prev:e}=t;for(;e!==null&&!w(e);)({prev:e}=e);return e}function j(t){if(t.prev&&(t.prev.next=t.next),t.next&&(t.next.prev=t.prev),t.parent){const e=t.parent.children,n=e.lastIndexOf(t);n>=0&&e.splice(n,1)}t.next=null,t.prev=null,t.parent=null}function bi(t,e){const n=e.prev=t.prev;n&&(n.next=e);const i=e.next=t.next;i&&(i.prev=e);const a=e.parent=t.parent;if(a){const s=a.children;s[s.lastIndexOf(t)]=e,t.parent=null}}function Ei(t,e){if(j(e),e.next=null,e.parent=t,t.children.push(e)>1){const n=t.children[t.children.length-2];n.next=e,e.prev=n}else e.prev=null}function wi(t,e){j(e);const{parent:n}=t,i=t.next;if(e.next=i,e.prev=t,t.next=e,e.parent=n,i){if(i.prev=e,n){const a=n.children;a.splice(a.lastIndexOf(i),0,e)}}else n&&n.children.push(e)}function Ai(t,e){if(j(e),e.parent=t,e.prev=null,t.children.unshift(e)!==1){const n=t.children[1];n.prev=e,e.next=n}else e.next=null}function Ci(t,e){j(e);const{parent:n}=t;if(n){const i=n.children;i.splice(i.indexOf(t),0,e)}t.prev&&(t.prev.next=e),e.parent=n,e.prev=t.prev,e.next=t,t.prev=e}function de(t,e,n=!0,i=1/0){return nt(t,Array.isArray(e)?e:[e],n,i)}function nt(t,e,n,i){const a=[],s=[Array.isArray(e)?e:[e]],r=[0];for(;;){if(r[0]>=s[0].length){if(r.length===1)return a;s.shift(),r.shift();continue}const o=s[0][r[0]++];if(t(o)&&(a.push(o),--i<=0))return a;n&&M(o)&&o.children.length>0&&(r.unshift(0),s.unshift(o.children))}}function Li(t,e){return e.find(t)}function it(t,e,n=!0){const i=Array.isArray(e)?e:[e];for(let a=0;a<i.length;a++){const s=i[a];if(w(s)&&t(s))return s;if(n&&M(s)&&s.children.length>0){const r=it(t,s.children,!0);if(r)return r}}return null}function Xt(t,e){return(Array.isArray(e)?e:[e]).some(n=>w(n)&&t(n)||M(n)&&Xt(t,n.children))}function Si(t,e){const n=[],i=[Array.isArray(e)?e:[e]],a=[0];for(;;){if(a[0]>=i[0].length){if(i.length===1)return n;i.shift(),a.shift();continue}const s=i[0][a[0]++];w(s)&&t(s)&&n.push(s),M(s)&&s.children.length>0&&(a.unshift(0),i.unshift(s.children))}}const Ee={tag_name(t){return typeof t=="function"?e=>w(e)&&t(e.name):t==="*"?w:e=>w(e)&&e.name===t},tag_type(t){return typeof t=="function"?e=>t(e.type):e=>e.type===t},tag_contains(t){return typeof t=="function"?e=>q(e)&&t(e.data):e=>q(e)&&e.data===t}};function at(t,e){return typeof e=="function"?n=>w(n)&&e(n.attribs[t]):n=>w(n)&&n.attribs[t]===e}function Ti(t,e){return n=>t(n)||e(n)}function Qt(t){const e=Object.keys(t).map(n=>{const i=t[n];return Object.prototype.hasOwnProperty.call(Ee,n)?Ee[n](i):at(n,i)});return e.length===0?null:e.reduce(Ti)}function Mi(t,e){const n=Qt(t);return n?n(e):!0}function xi(t,e,n,i=1/0){const a=Qt(t);return a?de(a,e,n,i):[]}function Ii(t,e,n=!0){return Array.isArray(e)||(e=[e]),it(at("id",t),e,n)}function J(t,e,n=!0,i=1/0){return de(Ee.tag_name(t),e,n,i)}function ki(t,e,n=!0,i=1/0){return de(at("class",t),e,n,i)}function Ri(t,e,n=!0,i=1/0){return de(Ee.tag_type(t),e,n,i)}function Oi(t){let e=t.length;for(;--e>=0;){const n=t[e];if(e>0&&t.lastIndexOf(n,e-1)>=0){t.splice(e,1);continue}for(let i=n.parent;i;i=i.parent)if(t.includes(i)){t.splice(e,1);break}}return t}var P;(function(t){t[t.DISCONNECTED=1]="DISCONNECTED",t[t.PRECEDING=2]="PRECEDING",t[t.FOLLOWING=4]="FOLLOWING",t[t.CONTAINS=8]="CONTAINS",t[t.CONTAINED_BY=16]="CONTAINED_BY"})(P||(P={}));function Jt(t,e){const n=[],i=[];if(t===e)return 0;let a=M(t)?t:t.parent;for(;a;)n.unshift(a),a=a.parent;for(a=M(e)?e:e.parent;a;)i.unshift(a),a=a.parent;const s=Math.min(n.length,i.length);let r=0;for(;r<s&&n[r]===i[r];)r++;if(r===0)return P.DISCONNECTED;const o=n[r-1],c=o.children,l=n[r],u=i[r];return c.indexOf(l)>c.indexOf(u)?o===e?P.FOLLOWING|P.CONTAINED_BY:P.FOLLOWING:o===t?P.PRECEDING|P.CONTAINS:P.PRECEDING}function G(t){return t=t.filter((e,n,i)=>!i.includes(e,n+1)),t.sort((e,n)=>{const i=Jt(e,n);return i&P.PRECEDING?-1:i&P.FOLLOWING?1:0}),t}function Pi(t){const e=we(Ui,t);return e?e.name==="feed"?Bi(e):Ni(e):null}function Bi(t){var e;const n=t.children,i={type:"atom",items:J("entry",n).map(r=>{var o;const{children:c}=r,l={media:Gt(c)};R(l,"id","id",c),R(l,"title","title",c);const u=(o=we("link",c))===null||o===void 0?void 0:o.attribs.href;u&&(l.link=u);const f=D("summary",c)||D("content",c);f&&(l.description=f);const g=D("updated",c);return g&&(l.pubDate=new Date(g)),l})};R(i,"id","id",n),R(i,"title","title",n);const a=(e=we("link",n))===null||e===void 0?void 0:e.attribs.href;a&&(i.link=a),R(i,"description","subtitle",n);const s=D("updated",n);return s&&(i.updated=new Date(s)),R(i,"author","email",n,!0),i}function Ni(t){var e,n;const i=(n=(e=we("channel",t.children))===null||e===void 0?void 0:e.children)!==null&&n!==void 0?n:[],a={type:t.name.substr(0,3),id:"",items:J("item",t.children).map(r=>{const{children:o}=r,c={media:Gt(o)};R(c,"id","guid",o),R(c,"title","title",o),R(c,"link","link",o),R(c,"description","description",o);const l=D("pubDate",o)||D("dc:date",o);return l&&(c.pubDate=new Date(l)),c})};R(a,"title","title",i),R(a,"link","link",i),R(a,"description","description",i);const s=D("lastBuildDate",i);return s&&(a.updated=new Date(s)),R(a,"author","managingEditor",i,!0),a}const Hi=["url","type","lang"],zi=["fileSize","bitrate","framerate","samplingrate","channels","duration","height","width"];function Gt(t){return J("media:content",t).map(e=>{const{attribs:n}=e,i={medium:n.medium,isDefault:!!n.isDefault};for(const a of Hi)n[a]&&(i[a]=n[a]);for(const a of zi)n[a]&&(i[a]=parseInt(n[a],10));return n.expression&&(i.expression=n.expression),i})}function we(t,e){return J(t,e,!0,1)[0]}function D(t,e,n=!1){return K(J(t,e,n,1)).trim()}function R(t,e,n,i,a=!1){const s=D(n,i,a);s&&(t[e]=s)}function Ui(t){return t==="rss"||t==="feed"||t==="rdf:RDF"}const ke=Object.freeze(Object.defineProperty({__proto__:null,get DocumentPosition(){return P},append:wi,appendChild:Ei,compareDocumentPosition:Jt,existsOne:Xt,filter:de,find:nt,findAll:Si,findOne:it,findOneChild:Li,getAttributeValue:mi,getChildren:Ie,getElementById:Ii,getElements:xi,getElementsByClassName:ki,getElementsByTagName:J,getElementsByTagType:Ri,getFeed:Pi,getInnerHTML:gi,getName:yi,getOuterHTML:Zt,getParent:Yt,getSiblings:Kt,getText:me,hasAttrib:vi,hasChildren:M,innerText:be,isCDATA:xe,isComment:Je,isDocument:Q,isTag:w,isText:q,nextElementSibling:et,prepend:Ci,prependChild:Ai,prevElementSibling:tt,removeElement:j,removeSubsets:Oi,replaceElement:bi,testElement:Mi,textContent:K,uniqueSort:G},Symbol.toStringTag,{value:"Module"}));function Ae(t){const e=t??(this?this.root():[]);let n="";for(let i=0;i<e.length;i++)n+=K(e[i]);return n}function Di(t,e){if(e===t)return!1;let n=e;for(;n&&n!==n.parent;)if(n=n.parent,n===t)return!0;return!1}function ee(t){return t.cheerio!=null}function Fi(t){return t.replace(/[._-](\w|$)/g,(e,n)=>n.toUpperCase())}function _i(t){return t.replace(/[A-Z]/g,"-$&").toLowerCase()}function T(t,e){const n=t.length;for(let i=0;i<n;i++)e(t[i],i);return t}var $;(function(t){t[t.LowerA=97]="LowerA",t[t.LowerZ=122]="LowerZ",t[t.UpperA=65]="UpperA",t[t.UpperZ=90]="UpperZ",t[t.Exclamation=33]="Exclamation"})($||($={}));function $i(t){const e=t.indexOf("<");if(e===-1||e>t.length-3)return!1;const n=t.charCodeAt(e+1);return(n>=$.LowerA&&n<=$.LowerZ||n>=$.UpperA&&n<=$.UpperZ||n===$.Exclamation)&&t.includes(">",e+2)}var Ne;const ce=(Ne=Object.hasOwn)!==null&&Ne!==void 0?Ne:(t,e)=>Object.prototype.hasOwnProperty.call(t,e),le=/\s+/,qe="data-",st=/^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,Vi=/^{[^]*}$|^\[[^]*]$/;function Ce(t,e,n){var i;if(!(!t||!w(t))){if((i=t.attribs)!==null&&i!==void 0||(t.attribs={}),!e)return t.attribs;if(ce(t.attribs,e))return!n&&st.test(e)?e:t.attribs[e];if(t.name==="option"&&e==="value")return Ae(t.children);if(t.name==="input"&&(t.attribs.type==="radio"||t.attribs.type==="checkbox")&&e==="value")return"on"}}function Y(t,e,n){n===null?tn(t,e):t.attribs[e]=`${n}`}function qi(t,e){if(typeof t=="object"||e!==void 0){if(typeof e=="function"){if(typeof t!="string")throw new Error("Bad combination of arguments.");return T(this,(n,i)=>{w(n)&&Y(n,t,e.call(n,i,n.attribs[t]))})}return T(this,n=>{if(w(n))if(typeof t=="object")for(const i of Object.keys(t)){const a=t[i];Y(n,i,a)}else Y(n,t,e)})}return arguments.length>1?this:Ce(this[0],t,this.options.xmlMode)}function Et(t,e,n){return e in t?t[e]:!n&&st.test(e)?Ce(t,e,!1)!==void 0:Ce(t,e,n)}function He(t,e,n,i){e in t?t[e]=n:Y(t,e,!i&&st.test(e)?n?"":null:`${n}`)}function ji(t,e){var n;if(typeof t=="string"&&e===void 0){const i=this[0];if(!i)return;switch(t){case"style":{const a=this.css(),s=Object.keys(a);for(let r=0;r<s.length;r++)a[r]=s[r];return a.length=s.length,a}case"tagName":case"nodeName":return w(i)?i.name.toUpperCase():void 0;case"href":case"src":{if(!w(i))return;const a=(n=i.attribs)===null||n===void 0?void 0:n[t];return typeof URL<"u"&&(t==="href"&&(i.tagName==="a"||i.tagName==="link")||t==="src"&&(i.tagName==="img"||i.tagName==="iframe"||i.tagName==="audio"||i.tagName==="video"||i.tagName==="source"))&&a!==void 0&&this.options.baseURI?new URL(a,this.options.baseURI).href:a}case"innerText":return be(i);case"textContent":return K(i);case"outerHTML":return i.type===_t?this.html():this.clone().wrap("<container />").parent().html();case"innerHTML":return this.html();default:return w(i)?Et(i,t,this.options.xmlMode):void 0}}if(typeof t=="object"||e!==void 0){if(typeof e=="function"){if(typeof t=="object")throw new TypeError("Bad combination of arguments.");return T(this,(i,a)=>{w(i)&&He(i,t,e.call(i,a,Et(i,t,this.options.xmlMode)),this.options.xmlMode)})}return T(this,i=>{if(w(i))if(typeof t=="object")for(const a of Object.keys(t)){const s=t[a];He(i,a,s,this.options.xmlMode)}else He(i,t,e,this.options.xmlMode)})}}function wt(t,e,n){var i;(i=t.data)!==null&&i!==void 0||(t.data={}),typeof e=="object"?Object.assign(t.data,e):typeof e=="string"&&n!==void 0&&(t.data[e]=n)}function Wi(t){for(const e of Object.keys(t.attribs)){if(!e.startsWith(qe))continue;const n=Fi(e.slice(qe.length));ce(t.data,n)||(t.data[n]=en(t.attribs[e]))}return t.data}function Zi(t,e){const n=qe+_i(e),i=t.data;if(ce(i,e))return i[e];if(ce(t.attribs,n))return i[e]=en(t.attribs[n])}function en(t){if(t==="null")return null;if(t==="true")return!0;if(t==="false")return!1;const e=Number(t);if(t===String(e))return e;if(Vi.test(t))try{return JSON.parse(t)}catch{}return t}function Yi(t,e){var n;const i=this[0];if(!i||!w(i))return;const a=i;return(n=a.data)!==null&&n!==void 0||(a.data={}),t==null?Wi(a):typeof t=="object"||e!==void 0?(T(this,s=>{w(s)&&(typeof t=="object"?wt(s,t):wt(s,t,e))}),this):Zi(a,t)}function Ki(t){const e=arguments.length===0,n=this[0];if(!n||!w(n))return e?void 0:this;switch(n.name){case"textarea":return this.text(t);case"select":{const i=this.find("option:selected");if(!e){if(this.attr("multiple")==null&&typeof t=="object")return this;this.find("option").removeAttr("selected");const a=typeof t=="object"?t:[t];for(const s of a)this.find(`option[value="${s}"]`).attr("selected","");return this}return this.attr("multiple")?i.toArray().map(a=>Ae(a.children)):i.attr("value")}case"input":case"option":return e?this.attr("value"):this.attr("value",t)}}function tn(t,e){!t.attribs||!ce(t.attribs,e)||delete t.attribs[e]}function Le(t){return t?t.trim().split(le):[]}function Xi(t){const e=Le(t);for(const n of e)T(this,i=>{w(i)&&tn(i,n)});return this}function Qi(t){return this.toArray().some(e=>{const n=w(e)&&e.attribs.class;let i=-1;if(n&&t.length>0)for(;(i=n.indexOf(t,i+1))>-1;){const a=i+t.length;if((i===0||le.test(n[i-1]))&&(a===n.length||le.test(n[a])))return!0}return!1})}function nn(t){if(typeof t=="function")return T(this,(i,a)=>{if(w(i)){const s=i.attribs.class||"";nn.call([i],t.call(i,a,s))}});if(!t||typeof t!="string")return this;const e=t.split(le),n=this.length;for(let i=0;i<n;i++){const a=this[i];if(!w(a))continue;const s=Ce(a,"class",!1);if(s){let r=` ${s} `;for(const o of e){const c=`${o} `;r.includes(` ${c}`)||(r+=c)}Y(a,"class",r.trim())}else Y(a,"class",e.join(" ").trim())}return this}function an(t){if(typeof t=="function")return T(this,(a,s)=>{w(a)&&an.call([a],t.call(a,s,a.attribs.class||""))});const e=Le(t),n=e.length,i=arguments.length===0;return T(this,a=>{if(w(a))if(i)a.attribs.class="";else{const s=Le(a.attribs.class);let r=!1;for(let o=0;o<n;o++){const c=s.indexOf(e[o]);c!==-1&&(s.splice(c,1),r=!0,o--)}r&&(a.attribs.class=s.join(" "))}})}function sn(t,e){if(typeof t=="function")return T(this,(r,o)=>{w(r)&&sn.call([r],t.call(r,o,r.attribs.class||"",e),e)});if(!t||typeof t!="string")return this;const n=t.split(le),i=n.length,a=typeof e=="boolean"?e?1:-1:0,s=this.length;for(let r=0;r<s;r++){const o=this[r];if(!w(o))continue;const c=Le(o.attribs.class);for(let l=0;l<i;l++){const u=c.indexOf(n[l]);a>=0&&u===-1?c.push(n[l]):a<=0&&u!==-1&&c.splice(u,1)}o.attribs.class=c.join(" ")}return this}const Ji=Object.freeze(Object.defineProperty({__proto__:null,addClass:nn,attr:qi,data:Yi,hasClass:Qi,prop:ji,removeAttr:Xi,removeClass:an,toggleClass:sn,val:Ki},Symbol.toStringTag,{value:"Module"}));var E;(function(t){t.Attribute="attribute",t.Pseudo="pseudo",t.PseudoElement="pseudo-element",t.Tag="tag",t.Universal="universal",t.Adjacent="adjacent",t.Child="child",t.Descendant="descendant",t.Parent="parent",t.Sibling="sibling",t.ColumnCombinator="column-combinator"})(E||(E={}));var I;(function(t){t.Any="any",t.Element="element",t.End="end",t.Equals="equals",t.Exists="exists",t.Hyphen="hyphen",t.Not="not",t.Start="start"})(I||(I={}));const At=/^[^\\#]?(?:\\(?:[\da-f]{1,6}\s?|.)|[\w\-\u00b0-\uFFFF])+/,Gi=/\\([\da-f]{1,6}\s?|(\s)|.)/gi,ea=new Map([[126,I.Element],[94,I.Start],[36,I.End],[42,I.Any],[33,I.Not],[124,I.Hyphen]]),ta=new Set(["has","not","matches","is","where","host","host-context"]);function se(t){switch(t.type){case E.Adjacent:case E.Child:case E.Descendant:case E.Parent:case E.Sibling:case E.ColumnCombinator:return!0;default:return!1}}const na=new Set(["contains","icontains"]);function ia(t,e,n){const i=parseInt(e,16)-65536;return i!==i||n?e:i<0?String.fromCharCode(i+65536):String.fromCharCode(i>>10|55296,i&1023|56320)}function ie(t){return t.replace(Gi,ia)}function ze(t){return t===39||t===34}function Ct(t){return t===32||t===9||t===10||t===12||t===13}function Re(t){const e=[],n=rn(e,`${t}`,0);if(n<t.length)throw new Error(`Unmatched selector: ${t.slice(n)}`);return e}function rn(t,e,n){let i=[];function a(g){const v=e.slice(n+g).match(At);if(!v)throw new Error(`Expected name, found ${e.slice(n)}`);const[b]=v;return n+=g+b.length,ie(b)}function s(g){for(n+=g;n<e.length&&Ct(e.charCodeAt(n));)n++}function r(){n+=1;const g=n;let v=1;for(;v>0&&n<e.length;n++)e.charCodeAt(n)===40&&!o(n)?v++:e.charCodeAt(n)===41&&!o(n)&&v--;if(v)throw new Error("Parenthesis not matched");return ie(e.slice(g,n-1))}function o(g){let v=0;for(;e.charCodeAt(--g)===92;)v++;return(v&1)===1}function c(){if(i.length>0&&se(i[i.length-1]))throw new Error("Did not expect successive traversals.")}function l(g){if(i.length>0&&i[i.length-1].type===E.Descendant){i[i.length-1].type=g;return}c(),i.push({type:g})}function u(g,v){i.push({type:E.Attribute,name:g,action:v,value:a(1),namespace:null,ignoreCase:"quirks"})}function f(){if(i.length&&i[i.length-1].type===E.Descendant&&i.pop(),i.length===0)throw new Error("Empty sub-selector");t.push(i)}if(s(0),e.length===n)return n;e:for(;n<e.length;){const g=e.charCodeAt(n);switch(g){case 32:case 9:case 10:case 12:case 13:{(i.length===0||i[0].type!==E.Descendant)&&(c(),i.push({type:E.Descendant})),s(1);break}case 62:{l(E.Child),s(1);break}case 60:{l(E.Parent),s(1);break}case 126:{l(E.Sibling),s(1);break}case 43:{l(E.Adjacent),s(1);break}case 46:{u("class",I.Element);break}case 35:{u("id",I.Equals);break}case 91:{s(1);let v,b=null;e.charCodeAt(n)===124?v=a(1):e.startsWith("*|",n)?(b="*",v=a(2)):(v=a(0),e.charCodeAt(n)===124&&e.charCodeAt(n+1)!==61&&(b=v,v=a(1))),s(0);let S=I.Exists;const O=ea.get(e.charCodeAt(n));if(O){if(S=O,e.charCodeAt(n+1)!==61)throw new Error("Expected `=`");s(2)}else e.charCodeAt(n)===61&&(S=I.Equals,s(1));let C="",z=null;if(S!=="exists"){if(ze(e.charCodeAt(n))){const Z=e.charCodeAt(n);let H=n+1;for(;H<e.length&&(e.charCodeAt(H)!==Z||o(H));)H+=1;if(e.charCodeAt(H)!==Z)throw new Error("Attribute value didn't end");C=ie(e.slice(n+1,H)),n=H+1}else{const Z=n;for(;n<e.length&&(!Ct(e.charCodeAt(n))&&e.charCodeAt(n)!==93||o(n));)n+=1;C=ie(e.slice(Z,n))}s(0);const W=e.charCodeAt(n)|32;W===115?(z=!1,s(1)):W===105&&(z=!0,s(1))}if(e.charCodeAt(n)!==93)throw new Error("Attribute selector didn't terminate");n+=1;const ne={type:E.Attribute,name:v,action:S,value:C,namespace:b,ignoreCase:z};i.push(ne);break}case 58:{if(e.charCodeAt(n+1)===58){i.push({type:E.PseudoElement,name:a(2).toLowerCase(),data:e.charCodeAt(n)===40?r():null});continue}const v=a(1).toLowerCase();let b=null;if(e.charCodeAt(n)===40)if(ta.has(v)){if(ze(e.charCodeAt(n+1)))throw new Error(`Pseudo-selector ${v} cannot be quoted`);if(b=[],n=rn(b,e,n+1),e.charCodeAt(n)!==41)throw new Error(`Missing closing parenthesis in :${v} (${e})`);n+=1}else{if(b=r(),na.has(v)){const S=b.charCodeAt(0);S===b.charCodeAt(b.length-1)&&ze(S)&&(b=b.slice(1,-1))}b=ie(b)}i.push({type:E.Pseudo,name:v,data:b});break}case 44:{f(),i=[],s(1);break}default:{if(e.startsWith("/*",n)){const S=e.indexOf("*/",n+2);if(S<0)throw new Error("Comment was not terminated");n=S+2,i.length===0&&s(0);break}let v=null,b;if(g===42)n+=1,b="*";else if(g===124){if(b="",e.charCodeAt(n+1)===124){l(E.ColumnCombinator),s(2);break}}else if(At.test(e.slice(n)))b=a(0);else break e;e.charCodeAt(n)===124&&e.charCodeAt(n+1)!==124&&(v=b,e.charCodeAt(n+1)===42?(b="*",n+=2):b=a(1)),i.push(b==="*"?{type:E.Universal,namespace:v}:{type:E.Tag,name:b,namespace:v})}}}return f(),n}var Ue,Lt;function aa(){return Lt||(Lt=1,Ue={trueFunc:function(){return!0},falseFunc:function(){return!1}}),Ue}var Se=aa();const A=Dt(Se),on=new Map([[E.Universal,50],[E.Tag,30],[E.Attribute,1],[E.Pseudo,0]]);function rt(t){return!on.has(t.type)}const sa=new Map([[I.Exists,10],[I.Equals,8],[I.Not,7],[I.Start,6],[I.End,6],[I.Any,5]]);function ra(t){const e=t.map(cn);for(let n=1;n<t.length;n++){const i=e[n];if(!(i<0))for(let a=n-1;a>=0&&i<e[a];a--){const s=t[a+1];t[a+1]=t[a],t[a]=s,e[a+1]=e[a],e[a]=i}}}function cn(t){var e,n;let i=(e=on.get(t.type))!==null&&e!==void 0?e:-1;return t.type===E.Attribute?(i=(n=sa.get(t.action))!==null&&n!==void 0?n:4,t.action===I.Equals&&t.name==="id"&&(i=9),t.ignoreCase&&(i>>=1)):t.type===E.Pseudo&&(t.data?t.name==="has"||t.name==="contains"?i=0:Array.isArray(t.data)?(i=Math.min(...t.data.map(a=>Math.min(...a.map(cn)))),i<0&&(i=0)):i=2:i=3),i}const oa=/[-[\]{}()*+?.,\\^$|#\s]/g;function St(t){return t.replace(oa,"\\$&")}const ca=new Set(["accept","accept-charset","align","alink","axis","bgcolor","charset","checked","clear","codetype","color","compact","declare","defer","dir","direction","disabled","enctype","face","frame","hreflang","http-equiv","lang","language","link","media","method","multiple","nohref","noresize","noshade","nowrap","readonly","rel","rev","rules","scope","scrolling","selected","shape","target","text","type","valign","valuetype","vlink"]);function _(t,e){return typeof t.ignoreCase=="boolean"?t.ignoreCase:t.ignoreCase==="quirks"?!!e.quirksMode:!e.xmlMode&&ca.has(t.name)}const la={equals(t,e,n){const{adapter:i}=n,{name:a}=e;let{value:s}=e;return _(e,n)?(s=s.toLowerCase(),r=>{const o=i.getAttributeValue(r,a);return o!=null&&o.length===s.length&&o.toLowerCase()===s&&t(r)}):r=>i.getAttributeValue(r,a)===s&&t(r)},hyphen(t,e,n){const{adapter:i}=n,{name:a}=e;let{value:s}=e;const r=s.length;return _(e,n)?(s=s.toLowerCase(),function(c){const l=i.getAttributeValue(c,a);return l!=null&&(l.length===r||l.charAt(r)==="-")&&l.substr(0,r).toLowerCase()===s&&t(c)}):function(c){const l=i.getAttributeValue(c,a);return l!=null&&(l.length===r||l.charAt(r)==="-")&&l.substr(0,r)===s&&t(c)}},element(t,e,n){const{adapter:i}=n,{name:a,value:s}=e;if(/\s/.test(s))return A.falseFunc;const r=new RegExp(`(?:^|\\s)${St(s)}(?:$|\\s)`,_(e,n)?"i":"");return function(c){const l=i.getAttributeValue(c,a);return l!=null&&l.length>=s.length&&r.test(l)&&t(c)}},exists(t,{name:e},{adapter:n}){return i=>n.hasAttrib(i,e)&&t(i)},start(t,e,n){const{adapter:i}=n,{name:a}=e;let{value:s}=e;const r=s.length;return r===0?A.falseFunc:_(e,n)?(s=s.toLowerCase(),o=>{const c=i.getAttributeValue(o,a);return c!=null&&c.length>=r&&c.substr(0,r).toLowerCase()===s&&t(o)}):o=>{var c;return!!(!((c=i.getAttributeValue(o,a))===null||c===void 0)&&c.startsWith(s))&&t(o)}},end(t,e,n){const{adapter:i}=n,{name:a}=e;let{value:s}=e;const r=-s.length;return r===0?A.falseFunc:_(e,n)?(s=s.toLowerCase(),o=>{var c;return((c=i.getAttributeValue(o,a))===null||c===void 0?void 0:c.substr(r).toLowerCase())===s&&t(o)}):o=>{var c;return!!(!((c=i.getAttributeValue(o,a))===null||c===void 0)&&c.endsWith(s))&&t(o)}},any(t,e,n){const{adapter:i}=n,{name:a,value:s}=e;if(s==="")return A.falseFunc;if(_(e,n)){const r=new RegExp(St(s),"i");return function(c){const l=i.getAttributeValue(c,a);return l!=null&&l.length>=s.length&&r.test(l)&&t(c)}}return r=>{var o;return!!(!((o=i.getAttributeValue(r,a))===null||o===void 0)&&o.includes(s))&&t(r)}},not(t,e,n){const{adapter:i}=n,{name:a}=e;let{value:s}=e;return s===""?r=>!!i.getAttributeValue(r,a)&&t(r):_(e,n)?(s=s.toLowerCase(),r=>{const o=i.getAttributeValue(r,a);return(o==null||o.length!==s.length||o.toLowerCase()!==s)&&t(r)}):r=>i.getAttributeValue(r,a)!==s&&t(r)}},da=new Set([9,10,12,13,32]),Tt=48,ua=57;function pa(t){if(t=t.trim().toLowerCase(),t==="even")return[2,0];if(t==="odd")return[2,1];let e=0,n=0,i=s(),a=r();if(e<t.length&&t.charAt(e)==="n"&&(e++,n=i*(a??1),o(),e<t.length?(i=s(),o(),a=r()):i=a=0),a===null||e<t.length)throw new Error(`n-th rule couldn't be parsed ('${t}')`);return[n,i*a];function s(){return t.charAt(e)==="-"?(e++,-1):(t.charAt(e)==="+"&&e++,1)}function r(){const c=e;let l=0;for(;e<t.length&&t.charCodeAt(e)>=Tt&&t.charCodeAt(e)<=ua;)l=l*10+(t.charCodeAt(e)-Tt),e++;return e===c?null:l}function o(){for(;e<t.length&&da.has(t.charCodeAt(e));)e++}}function ha(t){const e=t[0],n=t[1]-1;if(n<0&&e<=0)return A.falseFunc;if(e===-1)return s=>s<=n;if(e===0)return s=>s===n;if(e===1)return n<0?A.trueFunc:s=>s>=n;const i=Math.abs(e),a=(n%i+i)%i;return e>1?s=>s>=n&&s%i===a:s=>s<=n&&s%i===a}function fe(t){return ha(pa(t))}function ge(t,e){return n=>{const i=e.getParent(n);return i!=null&&e.isTag(i)&&t(n)}}const je={contains(t,e,{adapter:n}){return function(a){return t(a)&&n.getText(a).includes(e)}},icontains(t,e,{adapter:n}){const i=e.toLowerCase();return function(s){return t(s)&&n.getText(s).toLowerCase().includes(i)}},"nth-child"(t,e,{adapter:n,equals:i}){const a=fe(e);return a===A.falseFunc?A.falseFunc:a===A.trueFunc?ge(t,n):function(r){const o=n.getSiblings(r);let c=0;for(let l=0;l<o.length&&!i(r,o[l]);l++)n.isTag(o[l])&&c++;return a(c)&&t(r)}},"nth-last-child"(t,e,{adapter:n,equals:i}){const a=fe(e);return a===A.falseFunc?A.falseFunc:a===A.trueFunc?ge(t,n):function(r){const o=n.getSiblings(r);let c=0;for(let l=o.length-1;l>=0&&!i(r,o[l]);l--)n.isTag(o[l])&&c++;return a(c)&&t(r)}},"nth-of-type"(t,e,{adapter:n,equals:i}){const a=fe(e);return a===A.falseFunc?A.falseFunc:a===A.trueFunc?ge(t,n):function(r){const o=n.getSiblings(r);let c=0;for(let l=0;l<o.length;l++){const u=o[l];if(i(r,u))break;n.isTag(u)&&n.getName(u)===n.getName(r)&&c++}return a(c)&&t(r)}},"nth-last-of-type"(t,e,{adapter:n,equals:i}){const a=fe(e);return a===A.falseFunc?A.falseFunc:a===A.trueFunc?ge(t,n):function(r){const o=n.getSiblings(r);let c=0;for(let l=o.length-1;l>=0;l--){const u=o[l];if(i(r,u))break;n.isTag(u)&&n.getName(u)===n.getName(r)&&c++}return a(c)&&t(r)}},root(t,e,{adapter:n}){return i=>{const a=n.getParent(i);return(a==null||!n.isTag(a))&&t(i)}},scope(t,e,n,i){const{equals:a}=n;return!i||i.length===0?je.root(t,e,n):i.length===1?s=>a(i[0],s)&&t(s):s=>i.includes(s)&&t(s)},hover:De("isHovered"),visited:De("isVisited"),active:De("isActive")};function De(t){return function(n,i,{adapter:a}){const s=a[t];return typeof s!="function"?A.falseFunc:function(o){return s(o)&&n(o)}}}const Mt={empty(t,{adapter:e}){return!e.getChildren(t).some(n=>e.isTag(n)||e.getText(n)!=="")},"first-child"(t,{adapter:e,equals:n}){if(e.prevElementSibling)return e.prevElementSibling(t)==null;const i=e.getSiblings(t).find(a=>e.isTag(a));return i!=null&&n(t,i)},"last-child"(t,{adapter:e,equals:n}){const i=e.getSiblings(t);for(let a=i.length-1;a>=0;a--){if(n(t,i[a]))return!0;if(e.isTag(i[a]))break}return!1},"first-of-type"(t,{adapter:e,equals:n}){const i=e.getSiblings(t),a=e.getName(t);for(let s=0;s<i.length;s++){const r=i[s];if(n(t,r))return!0;if(e.isTag(r)&&e.getName(r)===a)break}return!1},"last-of-type"(t,{adapter:e,equals:n}){const i=e.getSiblings(t),a=e.getName(t);for(let s=i.length-1;s>=0;s--){const r=i[s];if(n(t,r))return!0;if(e.isTag(r)&&e.getName(r)===a)break}return!1},"only-of-type"(t,{adapter:e,equals:n}){const i=e.getName(t);return e.getSiblings(t).every(a=>n(t,a)||!e.isTag(a)||e.getName(a)!==i)},"only-child"(t,{adapter:e,equals:n}){return e.getSiblings(t).every(i=>n(t,i)||!e.isTag(i))}};function xt(t,e,n,i){if(n===null){if(t.length>i)throw new Error(`Pseudo-class :${e} requires an argument`)}else if(t.length===i)throw new Error(`Pseudo-class :${e} doesn't have any arguments`)}const fa={"any-link":":is(a, area, link)[href]",link:":any-link:not(:visited)",disabled:`:is(
        :is(button, input, select, textarea, optgroup, option)[disabled],
        optgroup[disabled] > option,
        fieldset[disabled]:not(fieldset[disabled] legend:first-of-type *)
    )`,enabled:":not(:disabled)",checked:":is(:is(input[type=radio], input[type=checkbox])[checked], option:selected)",required:":is(input, select, textarea)[required]",optional:":is(input, select, textarea):not([required])",selected:"option:is([selected], select:not([multiple]):not(:has(> option[selected])) > :first-of-type)",checkbox:"[type=checkbox]",file:"[type=file]",password:"[type=password]",radio:"[type=radio]",reset:"[type=reset]",image:"[type=image]",submit:"[type=submit]",parent:":not(:empty)",header:":is(h1, h2, h3, h4, h5, h6)",button:":is(button, input[type=button])",input:":is(input, textarea, select, button)",text:"input:is(:not([type!='']), [type=text])"},ln={};function ga(t,e){return t===A.falseFunc?A.falseFunc:n=>e.isTag(n)&&t(n)}function dn(t,e){const n=e.getSiblings(t);if(n.length<=1)return[];const i=n.indexOf(t);return i<0||i===n.length-1?[]:n.slice(i+1).filter(e.isTag)}function We(t){return{xmlMode:!!t.xmlMode,lowerCaseAttributeNames:!!t.lowerCaseAttributeNames,lowerCaseTags:!!t.lowerCaseTags,quirksMode:!!t.quirksMode,cacheResults:!!t.cacheResults,pseudos:t.pseudos,adapter:t.adapter,equals:t.equals}}const Fe=(t,e,n,i,a)=>{const s=a(e,We(n),i);return s===A.trueFunc?t:s===A.falseFunc?A.falseFunc:r=>s(r)&&t(r)},_e={is:Fe,matches:Fe,where:Fe,not(t,e,n,i,a){const s=a(e,We(n),i);return s===A.falseFunc?t:s===A.trueFunc?A.falseFunc:r=>!s(r)&&t(r)},has(t,e,n,i,a){const{adapter:s}=n,r=We(n);r.relativeSelector=!0;const o=e.some(u=>u.some(rt))?[ln]:void 0,c=a(e,r,o);if(c===A.falseFunc)return A.falseFunc;const l=ga(c,s);if(o&&c!==A.trueFunc){const{shouldTestNextSiblings:u=!1}=c;return f=>{if(!t(f))return!1;o[0]=f;const g=s.getChildren(f),v=u?[...g,...dn(f,s)]:g;return s.existsOne(l,v)}}return u=>t(u)&&s.existsOne(l,s.getChildren(u))}};function ma(t,e,n,i,a){var s;const{name:r,data:o}=e;if(Array.isArray(o)){if(!(r in _e))throw new Error(`Unknown pseudo-class :${r}(${o})`);return _e[r](t,o,n,i,a)}const c=(s=n.pseudos)===null||s===void 0?void 0:s[r],l=typeof c=="string"?c:fa[r];if(typeof l=="string"){if(o!=null)throw new Error(`Pseudo ${r} doesn't have any arguments`);const u=Re(l);return _e.is(t,u,n,i,a)}if(typeof c=="function")return xt(c,r,o,1),u=>c(u,o)&&t(u);if(r in je)return je[r](t,o,n,i);if(r in Mt){const u=Mt[r];return xt(u,r,o,2),f=>u(f,n,o)&&t(f)}throw new Error(`Unknown pseudo-class :${r}`)}function $e(t,e){const n=e.getParent(t);return n&&e.isTag(n)?n:null}function va(t,e,n,i,a){const{adapter:s,equals:r}=n;switch(e.type){case E.PseudoElement:throw new Error("Pseudo-elements are not supported by css-select");case E.ColumnCombinator:throw new Error("Column combinators are not yet supported by css-select");case E.Attribute:{if(e.namespace!=null)throw new Error("Namespaced attributes are not yet supported by css-select");return(!n.xmlMode||n.lowerCaseAttributeNames)&&(e.name=e.name.toLowerCase()),la[e.action](t,e,n)}case E.Pseudo:return ma(t,e,n,i,a);case E.Tag:{if(e.namespace!=null)throw new Error("Namespaced tag names are not yet supported by css-select");let{name:o}=e;return(!n.xmlMode||n.lowerCaseTags)&&(o=o.toLowerCase()),function(l){return s.getName(l)===o&&t(l)}}case E.Descendant:{if(n.cacheResults===!1||typeof WeakSet>"u")return function(l){let u=l;for(;u=$e(u,s);)if(t(u))return!0;return!1};const o=new WeakSet;return function(l){let u=l;for(;u=$e(u,s);)if(!o.has(u)){if(s.isTag(u)&&t(u))return!0;o.add(u)}return!1}}case"_flexibleDescendant":return function(c){let l=c;do if(t(l))return!0;while(l=$e(l,s));return!1};case E.Parent:return function(c){return s.getChildren(c).some(l=>s.isTag(l)&&t(l))};case E.Child:return function(c){const l=s.getParent(c);return l!=null&&s.isTag(l)&&t(l)};case E.Sibling:return function(c){const l=s.getSiblings(c);for(let u=0;u<l.length;u++){const f=l[u];if(r(c,f))break;if(s.isTag(f)&&t(f))return!0}return!1};case E.Adjacent:return s.prevElementSibling?function(c){const l=s.prevElementSibling(c);return l!=null&&t(l)}:function(c){const l=s.getSiblings(c);let u;for(let f=0;f<l.length;f++){const g=l[f];if(r(c,g))break;s.isTag(g)&&(u=g)}return!!u&&t(u)};case E.Universal:{if(e.namespace!=null&&e.namespace!=="*")throw new Error("Namespaced universal selectors are not yet supported by css-select");return t}}}function un(t){return t.type===E.Pseudo&&(t.name==="scope"||Array.isArray(t.data)&&t.data.some(e=>e.some(un)))}const ya={type:E.Descendant},ba={type:"_flexibleDescendant"},Ea={type:E.Pseudo,name:"scope",data:null};function wa(t,{adapter:e},n){const i=!!n?.every(a=>{const s=e.isTag(a)&&e.getParent(a);return a===ln||s&&e.isTag(s)});for(const a of t){if(!(a.length>0&&rt(a[0])&&a[0].type!==E.Descendant))if(i&&!a.some(un))a.unshift(ya);else continue;a.unshift(Ea)}}function pn(t,e,n){var i;t.forEach(ra),n=(i=e.context)!==null&&i!==void 0?i:n;const a=Array.isArray(n),s=n&&(Array.isArray(n)?n:[n]);if(e.relativeSelector!==!1)wa(t,e,s);else if(t.some(c=>c.length>0&&rt(c[0])))throw new Error("Relative selectors are not allowed when the `relativeSelector` option is disabled");let r=!1;const o=t.map(c=>{if(c.length>=2){const[l,u]=c;l.type!==E.Pseudo||l.name!=="scope"||(a&&u.type===E.Descendant?c[1]=ba:(u.type===E.Adjacent||u.type===E.Sibling)&&(r=!0))}return Aa(c,e,s)}).reduce(Ca,A.falseFunc);return o.shouldTestNextSiblings=r,o}function Aa(t,e,n){var i;return t.reduce((a,s)=>a===A.falseFunc?A.falseFunc:va(a,s,e,n,pn),(i=e.rootFunc)!==null&&i!==void 0?i:A.trueFunc)}function Ca(t,e){return e===A.falseFunc||t===A.trueFunc?t:t===A.falseFunc||e===A.trueFunc?e:function(i){return t(i)||e(i)}}const hn=(t,e)=>t===e,La={adapter:ke,equals:hn};function Sa(t){var e,n,i,a;const s=t??La;return(e=s.adapter)!==null&&e!==void 0||(s.adapter=ke),(n=s.equals)!==null&&n!==void 0||(s.equals=(a=(i=s.adapter)===null||i===void 0?void 0:i.equals)!==null&&a!==void 0?a:hn),s}function Ta(t){return function(n,i,a){const s=Sa(i);return t(n,s,a)}}const ot=Ta(pn);function fn(t,e,n=!1){return n&&(t=Ma(t,e)),Array.isArray(t)?e.removeSubsets(t):e.getChildren(t)}function Ma(t,e){const n=Array.isArray(t)?t.slice(0):[t],i=n.length;for(let a=0;a<i;a++){const s=dn(n[a],e);n.push(...s)}return n}const xa=new Set(["first","last","eq","gt","nth","lt","even","odd"]);function Te(t){return t.type!=="pseudo"?!1:xa.has(t.name)?!0:t.name==="not"&&Array.isArray(t.data)?t.data.some(e=>e.some(Te)):!1}function Ia(t,e,n){const i=e!=null?parseInt(e,10):NaN;switch(t){case"first":return 1;case"nth":case"eq":return isFinite(i)?i>=0?i+1:1/0:0;case"lt":return isFinite(i)?i>=0?Math.min(i,n):1/0:0;case"gt":return isFinite(i)?1/0:0;case"odd":return 2*n;case"even":return 2*n-1;case"last":case"not":return 1/0}}function ka(t){for(;t.parent;)t=t.parent;return t}function ct(t){const e=[],n=[];for(const i of t)i.some(Te)?e.push(i):n.push(i);return[n,e]}const Ra={type:E.Universal,namespace:null},Oa={type:E.Pseudo,name:"scope",data:null};function gn(t,e,n={}){return mn([t],e,n)}function mn(t,e,n={}){if(typeof e=="function")return t.some(e);const[i,a]=ct(Re(e));return i.length>0&&t.some(ot(i,n))||a.some(s=>bn(s,t,n).length>0)}function Pa(t,e,n,i){const a=typeof n=="string"?parseInt(n,10):NaN;switch(t){case"first":case"lt":return e;case"last":return e.length>0?[e[e.length-1]]:e;case"nth":case"eq":return isFinite(a)&&Math.abs(a)<e.length?[a<0?e[e.length+a]:e[a]]:[];case"gt":return isFinite(a)?e.slice(a+1):[];case"even":return e.filter((s,r)=>r%2===0);case"odd":return e.filter((s,r)=>r%2===1);case"not":{const s=new Set(yn(n,e,i));return e.filter(r=>!s.has(r))}}}function vn(t,e,n={}){return yn(Re(t),e,n)}function yn(t,e,n){if(e.length===0)return[];const[i,a]=ct(t);let s;if(i.length){const r=Ye(e,i,n);if(a.length===0)return r;r.length&&(s=new Set(r))}for(let r=0;r<a.length&&s?.size!==e.length;r++){const o=a[r];if((s?e.filter(u=>w(u)&&!s.has(u)):e).length===0)break;const l=bn(o,e,n);if(l.length)if(s)l.forEach(u=>s.add(u));else{if(r===a.length-1)return l;s=new Set(l)}}return typeof s<"u"?s.size===e.length?e:e.filter(r=>s.has(r)):[]}function bn(t,e,n){var i;if(t.some(se)){const a=(i=n.root)!==null&&i!==void 0?i:ka(e[0]),s={...n,context:e,relativeSelector:!1};return t.push(Oa),Me(a,t,s,!0,e.length)}return Me(e,t,n,!1,e.length)}function Ba(t,e,n={},i=1/0){if(typeof t=="function")return En(e,t);const[a,s]=ct(Re(t)),r=s.map(o=>Me(e,o,n,!0,i));return a.length&&r.push(Ze(e,a,n,i)),r.length===0?[]:r.length===1?r[0]:G(r.reduce((o,c)=>[...o,...c]))}function Me(t,e,n,i,a){const s=e.findIndex(Te),r=e.slice(0,s),o=e[s],c=e.length-1===s?a:1/0,l=Ia(o.name,o.data,c);if(l===0)return[];const f=(r.length===0&&!Array.isArray(t)?Ie(t).filter(w):r.length===0?(Array.isArray(t)?t:[t]).filter(w):i||r.some(se)?Ze(t,[r],n,l):Ye(t,[r],n)).slice(0,l);let g=Pa(o.name,f,o.data,n);if(g.length===0||e.length===s+1)return g;const v=e.slice(s+1),b=v.some(se);if(b){if(se(v[0])){const{type:S}=v[0];(S===E.Sibling||S===E.Adjacent)&&(g=fn(g,ke,!0)),v.unshift(Ra)}n={...n,relativeSelector:!1,rootFunc:S=>g.includes(S)}}else n.rootFunc&&n.rootFunc!==Se.trueFunc&&(n={...n,rootFunc:Se.trueFunc});return v.some(Te)?Me(g,v,n,!1,a):b?Ze(g,[v],n,a):Ye(g,[v],n)}function Ze(t,e,n,i){const a=ot(e,n,t);return En(t,a,i)}function En(t,e,n=1/0){const i=fn(t,ke,e.shouldTestNextSiblings);return nt(a=>w(a)&&e(a),i,!0,n)}function Ye(t,e,n){const i=(Array.isArray(t)?t:[t]).filter(w);if(i.length===0)return i;const a=ot(e,n);return a===Se.trueFunc?i:i.filter(a)}const Na=/^\s*[+~]/;function Ha(t){if(!t)return this._make([]);if(typeof t!="string"){const e=ee(t)?t.toArray():[t],n=this.toArray();return this._make(e.filter(i=>n.some(a=>Di(a,i))))}return this._findBySelector(t,Number.POSITIVE_INFINITY)}function za(t,e){var n;const i=this.toArray(),a=Na.test(t)?i:this.children().toArray(),s={context:i,root:(n=this._root)===null||n===void 0?void 0:n[0],xmlMode:this.options.xmlMode,lowerCaseTags:this.options.lowerCaseTags,lowerCaseAttributeNames:this.options.lowerCaseAttributeNames,pseudos:this.options.pseudos,quirksMode:this.options.quirksMode};return this._make(Ba(t,a,s,e))}function lt(t){return function(e,...n){return function(i){var a;let s=t(e,this);return i&&(s=pt(s,i,this.options.xmlMode,(a=this._root)===null||a===void 0?void 0:a[0])),this._make(this.length>1&&s.length>1?n.reduce((r,o)=>o(r),s):s)}}}const ue=lt((t,e)=>{let n=[];for(let i=0;i<e.length;i++){const a=t(e[i]);a.length>0&&(n=n.concat(a))}return n}),dt=lt((t,e)=>{const n=[];for(let i=0;i<e.length;i++){const a=t(e[i]);a!==null&&n.push(a)}return n});function ut(t,...e){let n=null;const i=lt((a,s)=>{const r=[];return T(s,o=>{for(let c;(c=a(o))&&!n?.(c,r.length);o=c)r.push(c)}),r})(t,...e);return function(a,s){n=typeof a=="string"?o=>gn(o,a,this.options):a?pe(a):null;const r=i.call(this,s);return n=null,r}}function te(t){return t.length>1?Array.from(new Set(t)):t}const Ua=dt(({parent:t})=>t&&!Q(t)?t:null,te),Da=ue(t=>{const e=[];for(;t.parent&&!Q(t.parent);)e.push(t.parent),t=t.parent;return e},G,t=>t.reverse()),Fa=ut(({parent:t})=>t&&!Q(t)?t:null,G,t=>t.reverse());function _a(t){var e;const n=[];if(!t)return this._make(n);const i={xmlMode:this.options.xmlMode,root:(e=this._root)===null||e===void 0?void 0:e[0]},a=typeof t=="string"?s=>gn(s,t,i):pe(t);return T(this,s=>{for(s&&!Q(s)&&!w(s)&&(s=s.parent);s&&w(s);){if(a(s,0)){n.includes(s)||n.push(s);break}s=s.parent}}),this._make(n)}const $a=dt(t=>et(t)),Va=ue(t=>{const e=[];for(;t.next;)t=t.next,w(t)&&e.push(t);return e},te),qa=ut(t=>et(t),te),ja=dt(t=>tt(t)),Wa=ue(t=>{const e=[];for(;t.prev;)t=t.prev,w(t)&&e.push(t);return e},te),Za=ut(t=>tt(t),te),Ya=ue(t=>Kt(t).filter(e=>w(e)&&e!==t),G),Ka=ue(t=>Ie(t).filter(w),te);function Xa(){const t=this.toArray().reduce((e,n)=>M(n)?e.concat(n.children):e,[]);return this._make(t)}function Qa(t){let e=0;const n=this.length;for(;e<n&&t.call(this[e],e,this[e])!==!1;)++e;return this}function Ja(t){let e=[];for(let n=0;n<this.length;n++){const i=this[n],a=t.call(i,n,i);a!=null&&(e=e.concat(a))}return this._make(e)}function pe(t){return typeof t=="function"?(e,n)=>t.call(e,n,e):ee(t)?e=>Array.prototype.includes.call(t,e):function(e){return t===e}}function Ga(t){var e;return this._make(pt(this.toArray(),t,this.options.xmlMode,(e=this._root)===null||e===void 0?void 0:e[0]))}function pt(t,e,n,i){return typeof e=="string"?vn(e,t,{xmlMode:n,root:i}):t.filter(pe(e))}function es(t){const e=this.toArray();return typeof t=="string"?mn(e.filter(w),t,this.options):t?e.some(pe(t)):!1}function ts(t){let e=this.toArray();if(typeof t=="string"){const n=new Set(vn(t,e,this.options));e=e.filter(i=>!n.has(i))}else{const n=pe(t);e=e.filter((i,a)=>!n(i,a))}return this._make(e)}function ns(t){return this.filter(typeof t=="string"?`:has(${t})`:(e,n)=>this._make(n).find(t).length>0)}function is(){return this.length>1?this._make(this[0]):this}function as(){return this.length>0?this._make(this[this.length-1]):this}function ss(t){var e;return t=+t,t===0&&this.length<=1?this:(t<0&&(t=this.length+t),this._make((e=this[t])!==null&&e!==void 0?e:[]))}function rs(t){return t==null?this.toArray():this[t<0?this.length+t:t]}function os(){return Array.prototype.slice.call(this)}function cs(t){let e,n;return t==null?(e=this.parent().children(),n=this[0]):typeof t=="string"?(e=this._make(t),n=this[0]):(e=this,n=ee(t)?t[0]:t),Array.prototype.indexOf.call(e,n)}function ls(t,e){return this._make(Array.prototype.slice.call(this,t,e))}function ds(){var t;return(t=this.prevObject)!==null&&t!==void 0?t:this._make([])}function us(t,e){const n=this._make(t,e),i=G([...this.get(),...n.get()]);return this._make(i)}function ps(t){return this.prevObject?this.add(t?this.prevObject.filter(t):this.prevObject):this}const hs=Object.freeze(Object.defineProperty({__proto__:null,_findBySelector:za,add:us,addBack:ps,children:Ka,closest:_a,contents:Xa,each:Qa,end:ds,eq:ss,filter:Ga,filterArray:pt,find:Ha,first:is,get:rs,has:ns,index:cs,is:es,last:as,map:Ja,next:$a,nextAll:Va,nextUntil:qa,not:ts,parent:Ua,parents:Da,parentsUntil:Fa,prev:ja,prevAll:Wa,prevUntil:Za,siblings:Ya,slice:ls,toArray:os},Symbol.toStringTag,{value:"Module"}));function X(t,e){const n=Array.isArray(t)?t:[t];e?e.children=n:e=null;for(let i=0;i<n.length;i++){const a=n[i];a.parent&&a.parent.children!==n&&j(a),e?(a.prev=n[i-1]||null,a.next=n[i+1]||null):a.prev=a.next=null,a.parent=e}return e}function fs(t,e){if(t==null)return[];if(typeof t=="string")return this._parse(t,this.options,!1,null).children.slice(0);if("length"in t){if(t.length===1)return this._makeDomArray(t[0],e);const n=[];for(let i=0;i<t.length;i++){const a=t[i];if(typeof a=="object"){if(a==null)continue;if(!("length"in a)){n.push(e?oe(a,!0):a);continue}}n.push(...this._makeDomArray(a,e))}return n}return[e?oe(t,!0):t]}function wn(t){return function(...e){const n=this.length-1;return T(this,(i,a)=>{if(!M(i))return;const s=typeof e[0]=="function"?e[0].call(i,a,this._render(i.children)):e,r=this._makeDomArray(s,a<n);t(r,i.children,i)})}}function F(t,e,n,i,a){var s,r;const o=[e,n,...i],c=e===0?null:t[e-1],l=e+n>=t.length?null:t[e+n];for(let u=0;u<i.length;++u){const f=i[u],g=f.parent;if(g){const b=g.children.indexOf(f);b!==-1&&(g.children.splice(b,1),a===g&&e>b&&o[0]--)}f.parent=a,f.prev&&(f.prev.next=(s=f.next)!==null&&s!==void 0?s:null),f.next&&(f.next.prev=(r=f.prev)!==null&&r!==void 0?r:null),f.prev=u===0?c:i[u-1],f.next=u===i.length-1?l:i[u+1]}return c&&(c.next=i[0]),l&&(l.prev=i[i.length-1]),t.splice(...o)}function gs(t){return(ee(t)?t:this._make(t)).append(this),this}function ms(t){return(ee(t)?t:this._make(t)).prepend(this),this}const vs=wn((t,e,n)=>{F(e,e.length,0,t,n)}),ys=wn((t,e,n)=>{F(e,0,0,t,n)});function An(t){return function(e){const n=this.length-1,i=this.parents().last();for(let a=0;a<this.length;a++){const s=this[a],r=typeof e=="function"?e.call(s,a,s):typeof e=="string"&&!$i(e)?i.find(e).clone():e,[o]=this._makeDomArray(r,a<n);if(!o||!M(o))continue;let c=o,l=0;for(;l<c.children.length;){const u=c.children[l];w(u)?(c=u,l=0):l++}t(s,c,[o])}return this}}const bs=An((t,e,n)=>{const{parent:i}=t;if(!i)return;const a=i.children,s=a.indexOf(t);X([t],e),F(a,s,0,n,i)}),Es=An((t,e,n)=>{M(t)&&(X(t.children,e),X(n,t))});function ws(t){return this.parent(t).not("body").each((e,n)=>{this._make(n).replaceWith(n.children)}),this}function As(t){const e=this[0];if(e){const n=this._make(typeof t=="function"?t.call(e,0,e):t).insertBefore(e);let i;for(let s=0;s<n.length;s++)n[s].type===Ve&&(i=n[s]);let a=0;for(;i&&a<i.children.length;){const s=i.children[a];s.type===Ve?(i=s,a=0):a++}i&&this._make(i).append(this)}return this}function Cs(...t){const e=this.length-1;return T(this,(n,i)=>{if(!M(n)||!n.parent)return;const a=n.parent.children,s=a.indexOf(n);if(s===-1)return;const r=typeof t[0]=="function"?t[0].call(n,i,this._render(n.children)):t,o=this._makeDomArray(r,i<e);F(a,s+1,0,o,n.parent)})}function Ls(t){typeof t=="string"&&(t=this._make(t)),this.remove();const e=[];for(const n of this._makeDomArray(t)){const i=this.clone().toArray(),{parent:a}=n;if(!a)continue;const s=a.children,r=s.indexOf(n);r!==-1&&(F(s,r+1,0,i,a),e.push(...i))}return this._make(e)}function Ss(...t){const e=this.length-1;return T(this,(n,i)=>{if(!M(n)||!n.parent)return;const a=n.parent.children,s=a.indexOf(n);if(s===-1)return;const r=typeof t[0]=="function"?t[0].call(n,i,this._render(n.children)):t,o=this._makeDomArray(r,i<e);F(a,s,0,o,n.parent)})}function Ts(t){const e=this._make(t);this.remove();const n=[];return T(e,i=>{const a=this.clone().toArray(),{parent:s}=i;if(!s)return;const r=s.children,o=r.indexOf(i);o!==-1&&(F(r,o,0,a,s),n.push(...a))}),this._make(n)}function Ms(t){const e=t?this.filter(t):this;return T(e,n=>{j(n),n.prev=n.next=n.parent=null}),this}function xs(t){return T(this,(e,n)=>{const{parent:i}=e;if(!i)return;const a=i.children,s=typeof t=="function"?t.call(e,n,e):t,r=this._makeDomArray(s);X(r,null);const o=a.indexOf(e);F(a,o,1,r,i),r.includes(e)||(e.parent=e.prev=e.next=null)})}function Is(){return T(this,t=>{if(M(t)){for(const e of t.children)e.next=e.prev=e.parent=null;t.children.length=0}})}function ks(t){if(t===void 0){const e=this[0];return!e||!M(e)?null:this._render(e.children)}return T(this,e=>{if(!M(e))return;for(const i of e.children)i.next=i.prev=i.parent=null;const n=ee(t)?t.toArray():this._parse(`${t}`,this.options,!1,e).children;X(n,e)})}function Rs(){return this._render(this)}function Os(t){return t===void 0?Ae(this):typeof t=="function"?T(this,(e,n)=>this._make(e).text(t.call(e,n,Ae([e])))):T(this,e=>{if(!M(e))return;for(const i of e.children)i.next=i.prev=i.parent=null;const n=new Vt(`${t}`);X(n,e)})}function Ps(){const t=Array.prototype.map.call(this.get(),n=>oe(n,!0)),e=new qt(t);for(const n of t)n.parent=e;return this._make(t)}const Bs=Object.freeze(Object.defineProperty({__proto__:null,_makeDomArray:fs,after:Cs,append:vs,appendTo:gs,before:Ss,clone:Ps,empty:Is,html:ks,insertAfter:Ls,insertBefore:Ts,prepend:ys,prependTo:ms,remove:Ms,replaceWith:xs,text:Os,toString:Rs,unwrap:ws,wrap:bs,wrapAll:As,wrapInner:Es},Symbol.toStringTag,{value:"Module"}));function Ns(t,e){if(t!=null&&e!=null||typeof t=="object"&&!Array.isArray(t))return T(this,(n,i)=>{w(n)&&Cn(n,t,e,i)});if(this.length!==0)return Ln(this[0],t)}function Cn(t,e,n,i){if(typeof e=="string"){const a=Ln(t),s=typeof n=="function"?n.call(t,i,a[e]):n;s===""?delete a[e]:s!=null&&(a[e]=s),t.attribs.style=Hs(a)}else if(typeof e=="object"){const a=Object.keys(e);for(let s=0;s<a.length;s++){const r=a[s];Cn(t,r,e[r],s)}}}function Ln(t,e){if(!t||!w(t))return;const n=zs(t.attribs.style);if(typeof e=="string")return n[e];if(Array.isArray(e)){const i={};for(const a of e)n[a]!=null&&(i[a]=n[a]);return i}return n}function Hs(t){return Object.keys(t).reduce((e,n)=>`${e}${e?" ":""}${n}: ${t[n]};`,"")}function zs(t){if(t=(t||"").trim(),!t)return{};const e={};let n;for(const i of t.split(";")){const a=i.indexOf(":");if(a<1||a===i.length-1){const s=i.trimEnd();s.length>0&&n!==void 0&&(e[n]+=`;${s}`)}else n=i.slice(0,a).trim(),e[n]=i.slice(a+1).trim()}return e}const Us=Object.freeze(Object.defineProperty({__proto__:null,css:Ns},Symbol.toStringTag,{value:"Module"})),It="input,select,textarea,keygen",Ds=/%20/g,kt=/\r?\n/g;function Fs(){return this.serializeArray().map(n=>`${encodeURIComponent(n.name)}=${encodeURIComponent(n.value)}`).join("&").replace(Ds,"+")}function _s(){return this.map((t,e)=>{const n=this._make(e);return w(e)&&e.name==="form"?n.find(It).toArray():n.filter(It).toArray()}).filter('[name!=""]:enabled:not(:submit, :button, :image, :reset, :file):matches([checked], :not(:checkbox, :radio))').map((t,e)=>{var n;const i=this._make(e),a=i.attr("name"),s=(n=i.val())!==null&&n!==void 0?n:"";return Array.isArray(s)?s.map(r=>({name:a,value:r.replace(kt,`\r
`)})):{name:a,value:s.replace(kt,`\r
`)}}).toArray()}const $s=Object.freeze(Object.defineProperty({__proto__:null,serialize:Fs,serializeArray:_s},Symbol.toStringTag,{value:"Module"}));function Vs(t){var e;return typeof t=="string"?{selector:t,value:"textContent"}:{selector:t.selector,value:(e=t.value)!==null&&e!==void 0?e:"textContent"}}function qs(t){const e={};for(const n in t){const i=t[n],a=Array.isArray(i),{selector:s,value:r}=Vs(a?i[0]:i),o=typeof r=="function"?r:typeof r=="string"?c=>this._make(c).prop(r):c=>this._make(c).extract(r);if(a)e[n]=this._findBySelector(s,Number.POSITIVE_INFINITY).map((c,l)=>o(l,n,e)).get();else{const c=this._findBySelector(s,1);e[n]=c.length>0?o(c[0],n,e):void 0}}return e}const js=Object.freeze(Object.defineProperty({__proto__:null,extract:qs},Symbol.toStringTag,{value:"Module"}));class Oe{constructor(e,n,i){if(this.length=0,this.options=i,this._root=n,e){for(let a=0;a<e.length;a++)this[a]=e[a];this.length=e.length}}}Oe.prototype.cheerio="[cheerio object]";Oe.prototype.splice=Array.prototype.splice;Oe.prototype[Symbol.iterator]=Array.prototype[Symbol.iterator];Object.assign(Oe.prototype,Ji,hs,Bs,Us,$s,js);var Rt;(function(t){t[t.EOF=-1]="EOF",t[t.NULL=0]="NULL",t[t.TABULATION=9]="TABULATION",t[t.CARRIAGE_RETURN=13]="CARRIAGE_RETURN",t[t.LINE_FEED=10]="LINE_FEED",t[t.FORM_FEED=12]="FORM_FEED",t[t.SPACE=32]="SPACE",t[t.EXCLAMATION_MARK=33]="EXCLAMATION_MARK",t[t.QUOTATION_MARK=34]="QUOTATION_MARK",t[t.AMPERSAND=38]="AMPERSAND",t[t.APOSTROPHE=39]="APOSTROPHE",t[t.HYPHEN_MINUS=45]="HYPHEN_MINUS",t[t.SOLIDUS=47]="SOLIDUS",t[t.DIGIT_0=48]="DIGIT_0",t[t.DIGIT_9=57]="DIGIT_9",t[t.SEMICOLON=59]="SEMICOLON",t[t.LESS_THAN_SIGN=60]="LESS_THAN_SIGN",t[t.EQUALS_SIGN=61]="EQUALS_SIGN",t[t.GREATER_THAN_SIGN=62]="GREATER_THAN_SIGN",t[t.QUESTION_MARK=63]="QUESTION_MARK",t[t.LATIN_CAPITAL_A=65]="LATIN_CAPITAL_A",t[t.LATIN_CAPITAL_Z=90]="LATIN_CAPITAL_Z",t[t.RIGHT_SQUARE_BRACKET=93]="RIGHT_SQUARE_BRACKET",t[t.GRAVE_ACCENT=96]="GRAVE_ACCENT",t[t.LATIN_SMALL_A=97]="LATIN_SMALL_A",t[t.LATIN_SMALL_Z=122]="LATIN_SMALL_Z"})(Rt||(Rt={}));var Ot;(function(t){t.controlCharacterInInputStream="control-character-in-input-stream",t.noncharacterInInputStream="noncharacter-in-input-stream",t.surrogateInInputStream="surrogate-in-input-stream",t.nonVoidHtmlElementStartTagWithTrailingSolidus="non-void-html-element-start-tag-with-trailing-solidus",t.endTagWithAttributes="end-tag-with-attributes",t.endTagWithTrailingSolidus="end-tag-with-trailing-solidus",t.unexpectedSolidusInTag="unexpected-solidus-in-tag",t.unexpectedNullCharacter="unexpected-null-character",t.unexpectedQuestionMarkInsteadOfTagName="unexpected-question-mark-instead-of-tag-name",t.invalidFirstCharacterOfTagName="invalid-first-character-of-tag-name",t.unexpectedEqualsSignBeforeAttributeName="unexpected-equals-sign-before-attribute-name",t.missingEndTagName="missing-end-tag-name",t.unexpectedCharacterInAttributeName="unexpected-character-in-attribute-name",t.unknownNamedCharacterReference="unknown-named-character-reference",t.missingSemicolonAfterCharacterReference="missing-semicolon-after-character-reference",t.unexpectedCharacterAfterDoctypeSystemIdentifier="unexpected-character-after-doctype-system-identifier",t.unexpectedCharacterInUnquotedAttributeValue="unexpected-character-in-unquoted-attribute-value",t.eofBeforeTagName="eof-before-tag-name",t.eofInTag="eof-in-tag",t.missingAttributeValue="missing-attribute-value",t.missingWhitespaceBetweenAttributes="missing-whitespace-between-attributes",t.missingWhitespaceAfterDoctypePublicKeyword="missing-whitespace-after-doctype-public-keyword",t.missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers="missing-whitespace-between-doctype-public-and-system-identifiers",t.missingWhitespaceAfterDoctypeSystemKeyword="missing-whitespace-after-doctype-system-keyword",t.missingQuoteBeforeDoctypePublicIdentifier="missing-quote-before-doctype-public-identifier",t.missingQuoteBeforeDoctypeSystemIdentifier="missing-quote-before-doctype-system-identifier",t.missingDoctypePublicIdentifier="missing-doctype-public-identifier",t.missingDoctypeSystemIdentifier="missing-doctype-system-identifier",t.abruptDoctypePublicIdentifier="abrupt-doctype-public-identifier",t.abruptDoctypeSystemIdentifier="abrupt-doctype-system-identifier",t.cdataInHtmlContent="cdata-in-html-content",t.incorrectlyOpenedComment="incorrectly-opened-comment",t.eofInScriptHtmlCommentLikeText="eof-in-script-html-comment-like-text",t.eofInDoctype="eof-in-doctype",t.nestedComment="nested-comment",t.abruptClosingOfEmptyComment="abrupt-closing-of-empty-comment",t.eofInComment="eof-in-comment",t.incorrectlyClosedComment="incorrectly-closed-comment",t.eofInCdata="eof-in-cdata",t.absenceOfDigitsInNumericCharacterReference="absence-of-digits-in-numeric-character-reference",t.nullCharacterReference="null-character-reference",t.surrogateCharacterReference="surrogate-character-reference",t.characterReferenceOutsideUnicodeRange="character-reference-outside-unicode-range",t.controlCharacterReference="control-character-reference",t.noncharacterCharacterReference="noncharacter-character-reference",t.missingWhitespaceBeforeDoctypeName="missing-whitespace-before-doctype-name",t.missingDoctypeName="missing-doctype-name",t.invalidCharacterSequenceAfterDoctypeName="invalid-character-sequence-after-doctype-name",t.duplicateAttribute="duplicate-attribute",t.nonConformingDoctype="non-conforming-doctype",t.missingDoctype="missing-doctype",t.misplacedDoctype="misplaced-doctype",t.endTagWithoutMatchingOpenElement="end-tag-without-matching-open-element",t.closingOfElementWithOpenChildElements="closing-of-element-with-open-child-elements",t.disallowedContentInNoscriptInHead="disallowed-content-in-noscript-in-head",t.openElementsLeftAfterEof="open-elements-left-after-eof",t.abandonedHeadElementChild="abandoned-head-element-child",t.misplacedStartTagForHeadElement="misplaced-start-tag-for-head-element",t.nestedNoscriptInHead="nested-noscript-in-head",t.eofInElementThatCanContainOnlyText="eof-in-element-that-can-contain-only-text"})(Ot||(Ot={}));var Pt;(function(t){t[t.CHARACTER=0]="CHARACTER",t[t.NULL_CHARACTER=1]="NULL_CHARACTER",t[t.WHITESPACE_CHARACTER=2]="WHITESPACE_CHARACTER",t[t.START_TAG=3]="START_TAG",t[t.END_TAG=4]="END_TAG",t[t.COMMENT=5]="COMMENT",t[t.DOCTYPE=6]="DOCTYPE",t[t.EOF=7]="EOF",t[t.HIBERNATION=8]="HIBERNATION"})(Pt||(Pt={}));var x;(function(t){t.HTML="http://www.w3.org/1999/xhtml",t.MATHML="http://www.w3.org/1998/Math/MathML",t.SVG="http://www.w3.org/2000/svg",t.XLINK="http://www.w3.org/1999/xlink",t.XML="http://www.w3.org/XML/1998/namespace",t.XMLNS="http://www.w3.org/2000/xmlns/"})(x||(x={}));var Bt;(function(t){t.TYPE="type",t.ACTION="action",t.ENCODING="encoding",t.PROMPT="prompt",t.NAME="name",t.COLOR="color",t.FACE="face",t.SIZE="size"})(Bt||(Bt={}));var Nt;(function(t){t.NO_QUIRKS="no-quirks",t.QUIRKS="quirks",t.LIMITED_QUIRKS="limited-quirks"})(Nt||(Nt={}));var p;(function(t){t.A="a",t.ADDRESS="address",t.ANNOTATION_XML="annotation-xml",t.APPLET="applet",t.AREA="area",t.ARTICLE="article",t.ASIDE="aside",t.B="b",t.BASE="base",t.BASEFONT="basefont",t.BGSOUND="bgsound",t.BIG="big",t.BLOCKQUOTE="blockquote",t.BODY="body",t.BR="br",t.BUTTON="button",t.CAPTION="caption",t.CENTER="center",t.CODE="code",t.COL="col",t.COLGROUP="colgroup",t.DD="dd",t.DESC="desc",t.DETAILS="details",t.DIALOG="dialog",t.DIR="dir",t.DIV="div",t.DL="dl",t.DT="dt",t.EM="em",t.EMBED="embed",t.FIELDSET="fieldset",t.FIGCAPTION="figcaption",t.FIGURE="figure",t.FONT="font",t.FOOTER="footer",t.FOREIGN_OBJECT="foreignObject",t.FORM="form",t.FRAME="frame",t.FRAMESET="frameset",t.H1="h1",t.H2="h2",t.H3="h3",t.H4="h4",t.H5="h5",t.H6="h6",t.HEAD="head",t.HEADER="header",t.HGROUP="hgroup",t.HR="hr",t.HTML="html",t.I="i",t.IMG="img",t.IMAGE="image",t.INPUT="input",t.IFRAME="iframe",t.KEYGEN="keygen",t.LABEL="label",t.LI="li",t.LINK="link",t.LISTING="listing",t.MAIN="main",t.MALIGNMARK="malignmark",t.MARQUEE="marquee",t.MATH="math",t.MENU="menu",t.META="meta",t.MGLYPH="mglyph",t.MI="mi",t.MO="mo",t.MN="mn",t.MS="ms",t.MTEXT="mtext",t.NAV="nav",t.NOBR="nobr",t.NOFRAMES="noframes",t.NOEMBED="noembed",t.NOSCRIPT="noscript",t.OBJECT="object",t.OL="ol",t.OPTGROUP="optgroup",t.OPTION="option",t.P="p",t.PARAM="param",t.PLAINTEXT="plaintext",t.PRE="pre",t.RB="rb",t.RP="rp",t.RT="rt",t.RTC="rtc",t.RUBY="ruby",t.S="s",t.SCRIPT="script",t.SEARCH="search",t.SECTION="section",t.SELECT="select",t.SOURCE="source",t.SMALL="small",t.SPAN="span",t.STRIKE="strike",t.STRONG="strong",t.STYLE="style",t.SUB="sub",t.SUMMARY="summary",t.SUP="sup",t.TABLE="table",t.TBODY="tbody",t.TEMPLATE="template",t.TEXTAREA="textarea",t.TFOOT="tfoot",t.TD="td",t.TH="th",t.THEAD="thead",t.TITLE="title",t.TR="tr",t.TRACK="track",t.TT="tt",t.U="u",t.UL="ul",t.SVG="svg",t.VAR="var",t.WBR="wbr",t.XMP="xmp"})(p||(p={}));var d;(function(t){t[t.UNKNOWN=0]="UNKNOWN",t[t.A=1]="A",t[t.ADDRESS=2]="ADDRESS",t[t.ANNOTATION_XML=3]="ANNOTATION_XML",t[t.APPLET=4]="APPLET",t[t.AREA=5]="AREA",t[t.ARTICLE=6]="ARTICLE",t[t.ASIDE=7]="ASIDE",t[t.B=8]="B",t[t.BASE=9]="BASE",t[t.BASEFONT=10]="BASEFONT",t[t.BGSOUND=11]="BGSOUND",t[t.BIG=12]="BIG",t[t.BLOCKQUOTE=13]="BLOCKQUOTE",t[t.BODY=14]="BODY",t[t.BR=15]="BR",t[t.BUTTON=16]="BUTTON",t[t.CAPTION=17]="CAPTION",t[t.CENTER=18]="CENTER",t[t.CODE=19]="CODE",t[t.COL=20]="COL",t[t.COLGROUP=21]="COLGROUP",t[t.DD=22]="DD",t[t.DESC=23]="DESC",t[t.DETAILS=24]="DETAILS",t[t.DIALOG=25]="DIALOG",t[t.DIR=26]="DIR",t[t.DIV=27]="DIV",t[t.DL=28]="DL",t[t.DT=29]="DT",t[t.EM=30]="EM",t[t.EMBED=31]="EMBED",t[t.FIELDSET=32]="FIELDSET",t[t.FIGCAPTION=33]="FIGCAPTION",t[t.FIGURE=34]="FIGURE",t[t.FONT=35]="FONT",t[t.FOOTER=36]="FOOTER",t[t.FOREIGN_OBJECT=37]="FOREIGN_OBJECT",t[t.FORM=38]="FORM",t[t.FRAME=39]="FRAME",t[t.FRAMESET=40]="FRAMESET",t[t.H1=41]="H1",t[t.H2=42]="H2",t[t.H3=43]="H3",t[t.H4=44]="H4",t[t.H5=45]="H5",t[t.H6=46]="H6",t[t.HEAD=47]="HEAD",t[t.HEADER=48]="HEADER",t[t.HGROUP=49]="HGROUP",t[t.HR=50]="HR",t[t.HTML=51]="HTML",t[t.I=52]="I",t[t.IMG=53]="IMG",t[t.IMAGE=54]="IMAGE",t[t.INPUT=55]="INPUT",t[t.IFRAME=56]="IFRAME",t[t.KEYGEN=57]="KEYGEN",t[t.LABEL=58]="LABEL",t[t.LI=59]="LI",t[t.LINK=60]="LINK",t[t.LISTING=61]="LISTING",t[t.MAIN=62]="MAIN",t[t.MALIGNMARK=63]="MALIGNMARK",t[t.MARQUEE=64]="MARQUEE",t[t.MATH=65]="MATH",t[t.MENU=66]="MENU",t[t.META=67]="META",t[t.MGLYPH=68]="MGLYPH",t[t.MI=69]="MI",t[t.MO=70]="MO",t[t.MN=71]="MN",t[t.MS=72]="MS",t[t.MTEXT=73]="MTEXT",t[t.NAV=74]="NAV",t[t.NOBR=75]="NOBR",t[t.NOFRAMES=76]="NOFRAMES",t[t.NOEMBED=77]="NOEMBED",t[t.NOSCRIPT=78]="NOSCRIPT",t[t.OBJECT=79]="OBJECT",t[t.OL=80]="OL",t[t.OPTGROUP=81]="OPTGROUP",t[t.OPTION=82]="OPTION",t[t.P=83]="P",t[t.PARAM=84]="PARAM",t[t.PLAINTEXT=85]="PLAINTEXT",t[t.PRE=86]="PRE",t[t.RB=87]="RB",t[t.RP=88]="RP",t[t.RT=89]="RT",t[t.RTC=90]="RTC",t[t.RUBY=91]="RUBY",t[t.S=92]="S",t[t.SCRIPT=93]="SCRIPT",t[t.SEARCH=94]="SEARCH",t[t.SECTION=95]="SECTION",t[t.SELECT=96]="SELECT",t[t.SOURCE=97]="SOURCE",t[t.SMALL=98]="SMALL",t[t.SPAN=99]="SPAN",t[t.STRIKE=100]="STRIKE",t[t.STRONG=101]="STRONG",t[t.STYLE=102]="STYLE",t[t.SUB=103]="SUB",t[t.SUMMARY=104]="SUMMARY",t[t.SUP=105]="SUP",t[t.TABLE=106]="TABLE",t[t.TBODY=107]="TBODY",t[t.TEMPLATE=108]="TEMPLATE",t[t.TEXTAREA=109]="TEXTAREA",t[t.TFOOT=110]="TFOOT",t[t.TD=111]="TD",t[t.TH=112]="TH",t[t.THEAD=113]="THEAD",t[t.TITLE=114]="TITLE",t[t.TR=115]="TR",t[t.TRACK=116]="TRACK",t[t.TT=117]="TT",t[t.U=118]="U",t[t.UL=119]="UL",t[t.SVG=120]="SVG",t[t.VAR=121]="VAR",t[t.WBR=122]="WBR",t[t.XMP=123]="XMP"})(d||(d={}));p.A,d.A,p.ADDRESS,d.ADDRESS,p.ANNOTATION_XML,d.ANNOTATION_XML,p.APPLET,d.APPLET,p.AREA,d.AREA,p.ARTICLE,d.ARTICLE,p.ASIDE,d.ASIDE,p.B,d.B,p.BASE,d.BASE,p.BASEFONT,d.BASEFONT,p.BGSOUND,d.BGSOUND,p.BIG,d.BIG,p.BLOCKQUOTE,d.BLOCKQUOTE,p.BODY,d.BODY,p.BR,d.BR,p.BUTTON,d.BUTTON,p.CAPTION,d.CAPTION,p.CENTER,d.CENTER,p.CODE,d.CODE,p.COL,d.COL,p.COLGROUP,d.COLGROUP,p.DD,d.DD,p.DESC,d.DESC,p.DETAILS,d.DETAILS,p.DIALOG,d.DIALOG,p.DIR,d.DIR,p.DIV,d.DIV,p.DL,d.DL,p.DT,d.DT,p.EM,d.EM,p.EMBED,d.EMBED,p.FIELDSET,d.FIELDSET,p.FIGCAPTION,d.FIGCAPTION,p.FIGURE,d.FIGURE,p.FONT,d.FONT,p.FOOTER,d.FOOTER,p.FOREIGN_OBJECT,d.FOREIGN_OBJECT,p.FORM,d.FORM,p.FRAME,d.FRAME,p.FRAMESET,d.FRAMESET,p.H1,d.H1,p.H2,d.H2,p.H3,d.H3,p.H4,d.H4,p.H5,d.H5,p.H6,d.H6,p.HEAD,d.HEAD,p.HEADER,d.HEADER,p.HGROUP,d.HGROUP,p.HR,d.HR,p.HTML,d.HTML,p.I,d.I,p.IMG,d.IMG,p.IMAGE,d.IMAGE,p.INPUT,d.INPUT,p.IFRAME,d.IFRAME,p.KEYGEN,d.KEYGEN,p.LABEL,d.LABEL,p.LI,d.LI,p.LINK,d.LINK,p.LISTING,d.LISTING,p.MAIN,d.MAIN,p.MALIGNMARK,d.MALIGNMARK,p.MARQUEE,d.MARQUEE,p.MATH,d.MATH,p.MENU,d.MENU,p.META,d.META,p.MGLYPH,d.MGLYPH,p.MI,d.MI,p.MO,d.MO,p.MN,d.MN,p.MS,d.MS,p.MTEXT,d.MTEXT,p.NAV,d.NAV,p.NOBR,d.NOBR,p.NOFRAMES,d.NOFRAMES,p.NOEMBED,d.NOEMBED,p.NOSCRIPT,d.NOSCRIPT,p.OBJECT,d.OBJECT,p.OL,d.OL,p.OPTGROUP,d.OPTGROUP,p.OPTION,d.OPTION,p.P,d.P,p.PARAM,d.PARAM,p.PLAINTEXT,d.PLAINTEXT,p.PRE,d.PRE,p.RB,d.RB,p.RP,d.RP,p.RT,d.RT,p.RTC,d.RTC,p.RUBY,d.RUBY,p.S,d.S,p.SCRIPT,d.SCRIPT,p.SEARCH,d.SEARCH,p.SECTION,d.SECTION,p.SELECT,d.SELECT,p.SOURCE,d.SOURCE,p.SMALL,d.SMALL,p.SPAN,d.SPAN,p.STRIKE,d.STRIKE,p.STRONG,d.STRONG,p.STYLE,d.STYLE,p.SUB,d.SUB,p.SUMMARY,d.SUMMARY,p.SUP,d.SUP,p.TABLE,d.TABLE,p.TBODY,d.TBODY,p.TEMPLATE,d.TEMPLATE,p.TEXTAREA,d.TEXTAREA,p.TFOOT,d.TFOOT,p.TD,d.TD,p.TH,d.TH,p.THEAD,d.THEAD,p.TITLE,d.TITLE,p.TR,d.TR,p.TRACK,d.TRACK,p.TT,d.TT,p.U,d.U,p.UL,d.UL,p.SVG,d.SVG,p.VAR,d.VAR,p.WBR,d.WBR,p.XMP,d.XMP;const h=d;x.HTML+"",h.ADDRESS,h.APPLET,h.AREA,h.ARTICLE,h.ASIDE,h.BASE,h.BASEFONT,h.BGSOUND,h.BLOCKQUOTE,h.BODY,h.BR,h.BUTTON,h.CAPTION,h.CENTER,h.COL,h.COLGROUP,h.DD,h.DETAILS,h.DIR,h.DIV,h.DL,h.DT,h.EMBED,h.FIELDSET,h.FIGCAPTION,h.FIGURE,h.FOOTER,h.FORM,h.FRAME,h.FRAMESET,h.H1,h.H2,h.H3,h.H4,h.H5,h.H6,h.HEAD,h.HEADER,h.HGROUP,h.HR,h.HTML,h.IFRAME,h.IMG,h.INPUT,h.LI,h.LINK,h.LISTING,h.MAIN,h.MARQUEE,h.MENU,h.META,h.NAV,h.NOEMBED,h.NOFRAMES,h.NOSCRIPT,h.OBJECT,h.OL,h.P,h.PARAM,h.PLAINTEXT,h.PRE,h.SCRIPT,h.SECTION,h.SELECT,h.SOURCE,h.STYLE,h.SUMMARY,h.TABLE,h.TBODY,h.TD,h.TEMPLATE,h.TEXTAREA,h.TFOOT,h.TH,h.THEAD,h.TITLE,h.TR,h.TRACK,h.UL,h.WBR,h.XMP,x.MATHML+"",h.MI,h.MO,h.MN,h.MS,h.MTEXT,h.ANNOTATION_XML,x.SVG+"",h.TITLE,h.FOREIGN_OBJECT,h.DESC,x.XLINK+"",x.XML+"",x.XMLNS+"";h.H1,h.H2,h.H3,h.H4,h.H5,h.H6;p.STYLE,p.SCRIPT,p.XMP,p.IFRAME,p.NOEMBED,p.NOFRAMES,p.PLAINTEXT;var U;(function(t){t[t.DATA=0]="DATA",t[t.RCDATA=1]="RCDATA",t[t.RAWTEXT=2]="RAWTEXT",t[t.SCRIPT_DATA=3]="SCRIPT_DATA",t[t.PLAINTEXT=4]="PLAINTEXT",t[t.TAG_OPEN=5]="TAG_OPEN",t[t.END_TAG_OPEN=6]="END_TAG_OPEN",t[t.TAG_NAME=7]="TAG_NAME",t[t.RCDATA_LESS_THAN_SIGN=8]="RCDATA_LESS_THAN_SIGN",t[t.RCDATA_END_TAG_OPEN=9]="RCDATA_END_TAG_OPEN",t[t.RCDATA_END_TAG_NAME=10]="RCDATA_END_TAG_NAME",t[t.RAWTEXT_LESS_THAN_SIGN=11]="RAWTEXT_LESS_THAN_SIGN",t[t.RAWTEXT_END_TAG_OPEN=12]="RAWTEXT_END_TAG_OPEN",t[t.RAWTEXT_END_TAG_NAME=13]="RAWTEXT_END_TAG_NAME",t[t.SCRIPT_DATA_LESS_THAN_SIGN=14]="SCRIPT_DATA_LESS_THAN_SIGN",t[t.SCRIPT_DATA_END_TAG_OPEN=15]="SCRIPT_DATA_END_TAG_OPEN",t[t.SCRIPT_DATA_END_TAG_NAME=16]="SCRIPT_DATA_END_TAG_NAME",t[t.SCRIPT_DATA_ESCAPE_START=17]="SCRIPT_DATA_ESCAPE_START",t[t.SCRIPT_DATA_ESCAPE_START_DASH=18]="SCRIPT_DATA_ESCAPE_START_DASH",t[t.SCRIPT_DATA_ESCAPED=19]="SCRIPT_DATA_ESCAPED",t[t.SCRIPT_DATA_ESCAPED_DASH=20]="SCRIPT_DATA_ESCAPED_DASH",t[t.SCRIPT_DATA_ESCAPED_DASH_DASH=21]="SCRIPT_DATA_ESCAPED_DASH_DASH",t[t.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN=22]="SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN",t[t.SCRIPT_DATA_ESCAPED_END_TAG_OPEN=23]="SCRIPT_DATA_ESCAPED_END_TAG_OPEN",t[t.SCRIPT_DATA_ESCAPED_END_TAG_NAME=24]="SCRIPT_DATA_ESCAPED_END_TAG_NAME",t[t.SCRIPT_DATA_DOUBLE_ESCAPE_START=25]="SCRIPT_DATA_DOUBLE_ESCAPE_START",t[t.SCRIPT_DATA_DOUBLE_ESCAPED=26]="SCRIPT_DATA_DOUBLE_ESCAPED",t[t.SCRIPT_DATA_DOUBLE_ESCAPED_DASH=27]="SCRIPT_DATA_DOUBLE_ESCAPED_DASH",t[t.SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH=28]="SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH",t[t.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN=29]="SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN",t[t.SCRIPT_DATA_DOUBLE_ESCAPE_END=30]="SCRIPT_DATA_DOUBLE_ESCAPE_END",t[t.BEFORE_ATTRIBUTE_NAME=31]="BEFORE_ATTRIBUTE_NAME",t[t.ATTRIBUTE_NAME=32]="ATTRIBUTE_NAME",t[t.AFTER_ATTRIBUTE_NAME=33]="AFTER_ATTRIBUTE_NAME",t[t.BEFORE_ATTRIBUTE_VALUE=34]="BEFORE_ATTRIBUTE_VALUE",t[t.ATTRIBUTE_VALUE_DOUBLE_QUOTED=35]="ATTRIBUTE_VALUE_DOUBLE_QUOTED",t[t.ATTRIBUTE_VALUE_SINGLE_QUOTED=36]="ATTRIBUTE_VALUE_SINGLE_QUOTED",t[t.ATTRIBUTE_VALUE_UNQUOTED=37]="ATTRIBUTE_VALUE_UNQUOTED",t[t.AFTER_ATTRIBUTE_VALUE_QUOTED=38]="AFTER_ATTRIBUTE_VALUE_QUOTED",t[t.SELF_CLOSING_START_TAG=39]="SELF_CLOSING_START_TAG",t[t.BOGUS_COMMENT=40]="BOGUS_COMMENT",t[t.MARKUP_DECLARATION_OPEN=41]="MARKUP_DECLARATION_OPEN",t[t.COMMENT_START=42]="COMMENT_START",t[t.COMMENT_START_DASH=43]="COMMENT_START_DASH",t[t.COMMENT=44]="COMMENT",t[t.COMMENT_LESS_THAN_SIGN=45]="COMMENT_LESS_THAN_SIGN",t[t.COMMENT_LESS_THAN_SIGN_BANG=46]="COMMENT_LESS_THAN_SIGN_BANG",t[t.COMMENT_LESS_THAN_SIGN_BANG_DASH=47]="COMMENT_LESS_THAN_SIGN_BANG_DASH",t[t.COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH=48]="COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH",t[t.COMMENT_END_DASH=49]="COMMENT_END_DASH",t[t.COMMENT_END=50]="COMMENT_END",t[t.COMMENT_END_BANG=51]="COMMENT_END_BANG",t[t.DOCTYPE=52]="DOCTYPE",t[t.BEFORE_DOCTYPE_NAME=53]="BEFORE_DOCTYPE_NAME",t[t.DOCTYPE_NAME=54]="DOCTYPE_NAME",t[t.AFTER_DOCTYPE_NAME=55]="AFTER_DOCTYPE_NAME",t[t.AFTER_DOCTYPE_PUBLIC_KEYWORD=56]="AFTER_DOCTYPE_PUBLIC_KEYWORD",t[t.BEFORE_DOCTYPE_PUBLIC_IDENTIFIER=57]="BEFORE_DOCTYPE_PUBLIC_IDENTIFIER",t[t.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED=58]="DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED",t[t.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED=59]="DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED",t[t.AFTER_DOCTYPE_PUBLIC_IDENTIFIER=60]="AFTER_DOCTYPE_PUBLIC_IDENTIFIER",t[t.BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS=61]="BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS",t[t.AFTER_DOCTYPE_SYSTEM_KEYWORD=62]="AFTER_DOCTYPE_SYSTEM_KEYWORD",t[t.BEFORE_DOCTYPE_SYSTEM_IDENTIFIER=63]="BEFORE_DOCTYPE_SYSTEM_IDENTIFIER",t[t.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED=64]="DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED",t[t.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED=65]="DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED",t[t.AFTER_DOCTYPE_SYSTEM_IDENTIFIER=66]="AFTER_DOCTYPE_SYSTEM_IDENTIFIER",t[t.BOGUS_DOCTYPE=67]="BOGUS_DOCTYPE",t[t.CDATA_SECTION=68]="CDATA_SECTION",t[t.CDATA_SECTION_BRACKET=69]="CDATA_SECTION_BRACKET",t[t.CDATA_SECTION_END=70]="CDATA_SECTION_END",t[t.CHARACTER_REFERENCE=71]="CHARACTER_REFERENCE",t[t.AMBIGUOUS_AMPERSAND=72]="AMBIGUOUS_AMPERSAND"})(U||(U={}));U.DATA,U.RCDATA,U.RAWTEXT,U.SCRIPT_DATA,U.PLAINTEXT,U.CDATA_SECTION;const Ws=new Set([d.DD,d.DT,d.LI,d.OPTGROUP,d.OPTION,d.P,d.RB,d.RP,d.RT,d.RTC]);[...Ws,d.CAPTION,d.COLGROUP,d.TBODY,d.TD,d.TFOOT,d.TH,d.THEAD,d.TR];const Sn=new Set([d.APPLET,d.CAPTION,d.HTML,d.MARQUEE,d.OBJECT,d.TABLE,d.TD,d.TEMPLATE,d.TH]);[...Sn,d.OL,d.UL];[...Sn,d.BUTTON];d.ANNOTATION_XML,d.MI,d.MN,d.MO,d.MS,d.MTEXT;d.DESC,d.FOREIGN_OBJECT,d.TITLE;d.TR,d.TEMPLATE,d.HTML;d.TBODY,d.TFOOT,d.THEAD,d.TEMPLATE,d.HTML;d.TABLE,d.TEMPLATE,d.HTML;d.TD,d.TH;var Ke;(function(t){t[t.Marker=0]="Marker",t[t.Element=1]="Element"})(Ke||(Ke={}));Ke.Marker;new Map(["attributeName","attributeType","baseFrequency","baseProfile","calcMode","clipPathUnits","diffuseConstant","edgeMode","filterUnits","glyphRef","gradientTransform","gradientUnits","kernelMatrix","kernelUnitLength","keyPoints","keySplines","keyTimes","lengthAdjust","limitingConeAngle","markerHeight","markerUnits","markerWidth","maskContentUnits","maskUnits","numOctaves","pathLength","patternContentUnits","patternTransform","patternUnits","pointsAtX","pointsAtY","pointsAtZ","preserveAlpha","preserveAspectRatio","primitiveUnits","refX","refY","repeatCount","repeatDur","requiredExtensions","requiredFeatures","specularConstant","specularExponent","spreadMethod","startOffset","stdDeviation","stitchTiles","surfaceScale","systemLanguage","tableValues","targetX","targetY","textLength","viewBox","viewTarget","xChannelSelector","yChannelSelector","zoomAndPan"].map(t=>[t.toLowerCase(),t]));x.XLINK,x.XLINK,x.XLINK,x.XLINK,x.XLINK,x.XLINK,x.XLINK,x.XML,x.XML,x.XMLNS,x.XMLNS;new Map(["altGlyph","altGlyphDef","altGlyphItem","animateColor","animateMotion","animateTransform","clipPath","feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feDistantLight","feFlood","feFuncA","feFuncB","feFuncG","feFuncR","feGaussianBlur","feImage","feMerge","feMergeNode","feMorphology","feOffset","fePointLight","feSpecularLighting","feSpotLight","feTile","feTurbulence","foreignObject","glyphRef","linearGradient","radialGradient","textPath"].map(t=>[t.toLowerCase(),t]));d.B,d.BIG,d.BLOCKQUOTE,d.BODY,d.BR,d.CENTER,d.CODE,d.DD,d.DIV,d.DL,d.DT,d.EM,d.EMBED,d.H1,d.H2,d.H3,d.H4,d.H5,d.H6,d.HEAD,d.HR,d.I,d.IMG,d.LI,d.LISTING,d.MENU,d.META,d.NOBR,d.OL,d.P,d.PRE,d.RUBY,d.S,d.SMALL,d.SPAN,d.STRONG,d.STRIKE,d.SUB,d.SUP,d.TABLE,d.TT,d.U,d.UL,d.VAR;var Ht;(function(t){t[t.INITIAL=0]="INITIAL",t[t.BEFORE_HTML=1]="BEFORE_HTML",t[t.BEFORE_HEAD=2]="BEFORE_HEAD",t[t.IN_HEAD=3]="IN_HEAD",t[t.IN_HEAD_NO_SCRIPT=4]="IN_HEAD_NO_SCRIPT",t[t.AFTER_HEAD=5]="AFTER_HEAD",t[t.IN_BODY=6]="IN_BODY",t[t.TEXT=7]="TEXT",t[t.IN_TABLE=8]="IN_TABLE",t[t.IN_TABLE_TEXT=9]="IN_TABLE_TEXT",t[t.IN_CAPTION=10]="IN_CAPTION",t[t.IN_COLUMN_GROUP=11]="IN_COLUMN_GROUP",t[t.IN_TABLE_BODY=12]="IN_TABLE_BODY",t[t.IN_ROW=13]="IN_ROW",t[t.IN_CELL=14]="IN_CELL",t[t.IN_SELECT=15]="IN_SELECT",t[t.IN_SELECT_IN_TABLE=16]="IN_SELECT_IN_TABLE",t[t.IN_TEMPLATE=17]="IN_TEMPLATE",t[t.AFTER_BODY=18]="AFTER_BODY",t[t.IN_FRAMESET=19]="IN_FRAMESET",t[t.AFTER_FRAMESET=20]="AFTER_FRAMESET",t[t.AFTER_AFTER_BODY=21]="AFTER_AFTER_BODY",t[t.AFTER_AFTER_FRAMESET=22]="AFTER_AFTER_FRAMESET"})(Ht||(Ht={}));d.TABLE,d.TBODY,d.TFOOT,d.THEAD,d.TR;d.CAPTION,d.COL,d.COLGROUP,d.TBODY,d.TD,d.TFOOT,d.TH,d.THEAD,d.TR;p.AREA,p.BASE,p.BASEFONT,p.BGSOUND,p.BR,p.COL,p.EMBED,p.FRAME,p.HR,p.IMG,p.INPUT,p.KEYGEN,p.LINK,p.META,p.PARAM,p.SOURCE,p.TRACK,p.WBR;class Zs{constructor(){this.proxies=["https://api.allorigins.win/raw?url=","https://cors-anywhere.herokuapp.com/","https://thingproxy.freeboard.io/fetch/","https://cors.bridged.cc/","https://api.codetabs.com/v1/proxy?quest=","https://corsproxy.io/?","https://cors-anywhere.1d4s.me/","https://cors-anywhere.herokuapp.com/"],this.currentProxyIndex=0}async fetchWithFallback(e,n={}){return this.fetchWithProxy(e)}async fetchWithProxy(e){let n=null;for(let i=0;i<this.proxies.length;i++){const a=(this.currentProxyIndex+i)%this.proxies.length,s=this.proxies[a];try{const r=await fetch(s+encodeURIComponent(e),{method:"GET",headers:{Accept:"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8","Accept-Language":"en-US,en;q=0.5","Accept-Encoding":"gzip, deflate",DNT:"1",Connection:"keep-alive","Upgrade-Insecure-Requests":"1","User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"},timeout:1e4});if(r.ok){const o=await r.text();if(o.includes("<html")||o.includes("<head")||o.includes("<body"))return this.currentProxyIndex=a,o}}catch(r){console.log(`Proxy ${a} fallito:`,r.message),n=r}}try{const i=await fetch(e,{method:"GET",headers:{Accept:"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8","User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}});if(i.ok)return await i.text()}catch(i){console.log("Anche l'approccio diretto è fallito:",i)}throw n||new Error("Impossibile recuperare il contenuto")}async extractMetadata(e){try{const n=localStorage.getItem("aideas-language")||"it",i=await fetch(`http://localhost:4000/extract?url=${encodeURIComponent(e)}&lang=${n}`);if(!i.ok)throw new Error("Proxy meta fallito");return await i.json()}catch{const i=new URL(e).hostname;return{title:i,description:`App web da ${i}`,icon:`https://www.google.com/s2/favicons?domain=${i}&sz=64`}}}extractBestIcon(e,n){const i=['link[rel="apple-touch-icon"][sizes="180x180"]','link[rel="apple-touch-icon"][sizes="152x152"]','link[rel="apple-touch-icon"][sizes="144x144"]','link[rel="apple-touch-icon"][sizes="120x120"]','link[rel="apple-touch-icon"]','link[rel="icon"][type="image/png"][sizes="32x32"]','link[rel="icon"][type="image/png"][sizes="16x16"]','link[rel="icon"][type="image/svg+xml"]','link[rel="shortcut icon"]','link[rel="icon"]'];for(const a of i){const s=e(a).attr("href");if(s)return new URL(s,n).href}return null}extractTitle(e){const n=[/<title[^>]*>([^<]+)<\/title>/i,/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i,/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i];for(const i of n){const a=e.match(i);if(a){const s=a[1].trim();if(s&&s.length>0)return s}}return null}extractDescription(e){const n=[/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i,/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i,/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i,/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i];for(const i of n){const a=e.match(i);if(a){const s=a[1].trim();if(s&&s.length>0)return s}}return null}extractIcon(e,n){const i=[/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i,/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:icon|shortcut icon)["']/i,/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i,/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']apple-touch-icon["']/i];for(const a of i){const s=e.match(a);if(s)try{const r=new URL(s[1],n).href;return console.log("Icona trovata:",r),r}catch{console.log("URL icona non valido:",s[1])}}return null}extractAppleTouchIcon(e,n){const i=[/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i,/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']apple-touch-icon["']/i,/<link[^>]*rel=["']apple-touch-icon-precomposed["'][^>]*href=["']([^"']+)["']/i,/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']apple-touch-icon-precomposed["']/i];for(const a of i){const s=e.match(a);if(s)try{const r=new URL(s[1],n).href;return console.log("Apple Touch Icon trovata:",r),r}catch{console.log("URL apple-touch-icon non valido:",s[1])}}return null}extractKeywords(e){const n=e.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);return n?n[1].trim():null}extractAuthor(e){const n=e.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i);return n?n[1].trim():null}extractOGImage(e){const n=e.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);return n?n[1].trim():null}extractOGTitle(e){const n=e.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);return n?n[1].trim():null}extractOGDescription(e){const n=e.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);return n?n[1].trim():null}async testProxy(e){try{return(await fetch(e+encodeURIComponent("https://httpbin.org/ip"),{method:"GET",timeout:5e3})).ok}catch{return!1}}async getProxyStatus(){const e={};for(let n=0;n<this.proxies.length;n++){const i=this.proxies[n];e[i]=await this.testProxy(i)}return e}}var Ys=In();const Ks=Dt(Ys);class Xs{constructor(){this.maxFileSize=50*1024*1024,this.supportedFormats=["zip"],this.categories=["productivity","entertainment","communication","development","design","finance","health","news","shopping","travel","ai","social","education","business","utility","pwa"],this.proxyService=new Zs,this.init&&(this.init=this.init.bind(this)),this.showModal&&(this.showModal=this.showModal.bind(this)),this.importFromZip&&(this.importFromZip=this.importFromZip.bind(this)),this.importFromUrl&&(this.importFromUrl=this.importFromUrl.bind(this)),this.importFromGitHub&&(this.importFromGitHub=this.importFromGitHub.bind(this)),this.validateAppData&&(this.validateAppData=this.validateAppData.bind(this)),this.extractAppMetadata&&(this.extractAppMetadata=this.extractAppMetadata.bind(this)),this.setupDropZone&&(this.setupDropZone=this.setupDropZone.bind(this))}async init(){console.log("🔧 Inizializzazione AppImporter..."),this.setupDropZone(),this.setupKeyboardShortcuts()}showModal(){const e=this.createImportModal();N("app-import-modal",e,{size:"modal-xl",disableBackdropClose:!1}),setTimeout(()=>{this.setupModalEventListeners();const n=document.getElementById("form-html");n&&n.classList.add("active");const i=document.querySelector('[data-section="html"]');i&&i.classList.add("active")},100)}createImportModal(){return`
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
                    ${this.categories.map(e=>`<option value="${e}">${this.getCategoryLabel(e)}</option>`).join("")}
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
    `}setupModalEventListeners(){const e=document.getElementById("app-import-modal");if(!e)return;const n=e.querySelectorAll(".settings-nav-btn"),i=e.querySelectorAll(".settings-section");n.forEach(o=>{o.addEventListener("click",()=>{const c=o.dataset.section;n.forEach(l=>l.classList.remove("active")),o.classList.add("active"),i.forEach(l=>{l.style.display="none",l.classList.remove("active"),l.id===`section-${c}`&&(l.style.display="block",l.classList.add("active"))})})}),this.setupHtmlImport(e),this.setupUrlImport(e),this.setupGitHubImport(e),this.setupMetadataForm(e),e.querySelector("#start-import")?.addEventListener("click",()=>{this.startImport()}),e.querySelector("#cancel-import")?.addEventListener("click",()=>{k("app-import-modal")}),e.querySelector(".modal-close")?.addEventListener("click",()=>{k("app-import-modal")}),e.addEventListener("keydown",o=>{o.key==="Escape"&&k("app-import-modal")})}setupZipImport(e){const n=e.querySelector("#zip-drop-zone"),i=e.querySelector("#zip-file-input");e.querySelector("#select-zip-btn")?.addEventListener("click",()=>{i?.click()}),i?.addEventListener("change",s=>{const r=s.target.files[0];r&&this.handleZipFile(r)}),n?.addEventListener("dragover",s=>{s.preventDefault(),n.classList.add("drag-over")}),n?.addEventListener("dragleave",s=>{s.preventDefault(),n.classList.remove("drag-over")}),n?.addEventListener("drop",s=>{s.preventDefault(),n.classList.remove("drag-over");const r=s.dataTransfer.files[0];r&&r.name.endsWith(".zip")?this.handleZipFile(r):m("Per favore seleziona un file ZIP valido","error")})}setupUrlImport(e){const n=e.querySelector("#url-input"),i=e.querySelector("#test-url-btn"),a=e.querySelector("#url-preview-container");i?.addEventListener("click",async()=>{const s=n?.value.trim();if(!s){m("Inserisci un URL valido","error");return}if(!mt(s)){m("URL non valido","error");return}try{i.disabled=!0,i.textContent="Testando...",await this.testUrl(s,a),i.textContent="Test",i.disabled=!1}catch(r){console.error("Errore test URL:",r),m("Errore durante il test dell'URL","error"),i.textContent="Test",i.disabled=!1}}),n?.addEventListener("input",()=>{const s=n.value.trim();s&&mt(s)?this.enableImportButton():this.disableImportButton()})}setupGitHubImport(e){const n=e.querySelector("#github-url-input"),i=e.querySelector("#github-preview-container");n?.addEventListener("input",async()=>{const a=n.value.trim();if(a&&this.isGitHubUrl(a))try{await this.fetchGitHubInfo(a,i),this.enableImportButton()}catch(s){console.error("Errore fetch GitHub:",s),m("Errore durante il recupero delle informazioni GitHub","error")}else this.disableImportButton(),i&&(i.style.display="none")})}setupMetadataForm(e){this.updateDefaultModeIndicator();const n=e.querySelector("#app-icon"),i=e.querySelector("#upload-icon-btn"),a=e.querySelector("#icon-file-input"),s=e.querySelector("#icon-preview");e.querySelector("#icon-preview-img"),i?.addEventListener("click",()=>{a?.click()}),a?.addEventListener("change",o=>{const c=o.target.files[0];c&&this.handleIconUpload(c,n,s)}),n?.addEventListener("input",()=>{const o=n.value.trim();o?this.showIconPreview(o,s):s.style.display="none"}),e.querySelector("#app-name")?.addEventListener("input",()=>{this.validateForm()})}async updateDefaultModeIndicator(){try{const e=await y.getSetting("defaultLaunchMode","newpage"),n=document.getElementById("current-default-mode");if(n){const i=e==="newpage"?"Nuova pagina":"Finestra modale";n.textContent=`(Impostazione globale corrente: ${i})`}}catch(e){console.warn("Impossibile caricare modalità di default:",e)}}validateForm(){const e=document.getElementById("app-name"),n=document.getElementById("start-import");if(e&&n){const i=e.value.trim().length>0;n.disabled=!i}}setupHtmlImport(e){e.querySelector("#html-file-input")?.addEventListener("change",i=>{const a=i.target.files[0];a&&this.handleHtmlFile(a)})}async handleZipFile(e){try{if(e.size>this.maxFileSize){m(`File troppo grande. Massimo: ${re(this.maxFileSize)}`,"error");return}m("Analizzando file ZIP...","info");const i=await new Ks().loadAsync(e),a=[];let s=null;for(const[u,f]of Object.entries(i.files)){if(f.dir)continue;const g=await f.async("text"),v={filename:u,content:g,size:g.length,mimeType:this.getMimeType(u)};if(a.push(v),u==="aideas.json")try{s=JSON.parse(g)}catch(b){console.warn("Manifest aideas.json non valido:",b)}}if(!a.some(u=>u.filename.endsWith(".html"))){m("Il ZIP deve contenere almeno un file HTML","error");return}const o=this.extractZipMetadata(a,s);this.populateMetadataForm(o);const c=document.getElementById("section-metadata");c&&(c.style.display="block"),this.currentImportData={type:"zip",files:a,manifest:s,metadata:o,originalFile:e};const l=document.getElementById("start-import");l&&(l.disabled=!1),m("ZIP analizzato con successo!","success")}catch(n){console.error("Errore durante l'analisi del ZIP:",n),m("Errore durante l'analisi del file ZIP","error")}}async testUrl(e,n){if(!n)return;n.style.display="block";const i=n.querySelector(".status-badge"),a=n.querySelector(".preview-title"),s=n.querySelector(".preview-url");i.textContent="Verificando...",i.className="status-badge",a.textContent="Caricamento...",s.textContent=e;try{const r=await this.extractUrlMetadata(e);a.textContent=r.title||r.name||vt(e),i.textContent=r.isPWA?"✓ PWA Rilevata":"✓ Sito Web",i.className=r.isPWA?"status-badge badge-success":"status-badge badge-info",this.populateMetadataForm(r);const o=document.getElementById("section-metadata");o&&(o.style.display="block"),this.currentImportData={type:r.isPWA?"pwa":"url",url:e,metadata:r};const c=document.getElementById("start-import");c&&(c.disabled=!1)}catch(r){console.error("Errore test URL:",r),i.textContent="⚠ Errore",i.className="status-badge badge-error",a.textContent="Impossibile verificare il sito"}}async fetchGitHubInfo(e,n){if(!n)return;const i=this.parseGitHubUrl(e);if(!i){m("URL GitHub non valido","error");return}try{const a=`https://api.github.com/repos/${i.owner}/${i.repo}`,s=await fetch(a);if(!s.ok)throw new Error("Repository non trovato o non accessibile");const r=await s.json();n.style.display="block",n.querySelector("#repo-avatar").src=r.owner.avatar_url,n.querySelector("#repo-name").textContent=r.full_name,n.querySelector("#repo-description").textContent=r.description||"Nessuna descrizione",n.querySelector("#repo-stars").textContent=r.stargazers_count,n.querySelector("#repo-forks").textContent=r.forks_count,n.querySelector("#repo-updated").textContent=new Date(r.updated_at).toLocaleDateString();const o={name:r.name,description:r.description,category:"tools",version:"1.0.0",githubUrl:e};this.populateMetadataForm(o);const c=document.getElementById("section-metadata");c&&(c.style.display="block"),this.currentImportData={type:"github",url:e,githubUrl:e,repoData:r,metadata:o};const l=document.getElementById("start-import");l&&(l.disabled=!1)}catch(a){console.error("Errore fetch GitHub:",a),m(`Errore: ${a.message}`,"error")}}async startImport(){if(!this.currentImportData){m("Nessun dato da importare","error");return}try{this.showImportProgress(!0);const e=this.collectFormData(),n=this.validateAppData(e);if(!n.valid)throw new Error(n.error);const i={...this.currentImportData.metadata,...e,type:this.currentImportData.type,url:this.currentImportData.url,githubUrl:this.currentImportData.githubUrl,files:this.currentImportData.files,content:this.currentImportData.content};console.log(`🚀 Installazione app: ${i.name}`),console.log(`📋 Modalità di lancio app-specifica: ${i.metadata?.launchMode||"non specificata"}`);const a=await y.getSetting("defaultLaunchMode","newpage");console.log(`🌐 Modalità di lancio globale: ${a}`);const s=i.metadata?.launchMode||a;console.log(`✅ Modalità finale per questa app: ${s}`),this.updateImportProgress(50,"Salvando app...");const r=await y.installApp(i);this.updateImportProgress(100,"Importazione completata!"),setTimeout(()=>{k("app-import-modal"),m(`App "${i.name}" importata con successo!`,"success"),window.aideasApp&&window.aideasApp.loadApps&&window.aideasApp.loadApps()},1e3)}catch(e){console.error("Errore durante l'importazione:",e),m(`Errore importazione: ${e.message}`,"error"),this.showImportProgress(!1)}}extractZipMetadata(e,n){const i={name:n?.name||"App Importata",description:n?.description||"",version:n?.version||"1.0.0",category:n?.category||"tools",tags:n?.tags||[],icon:n?.icon||null,permissions:n?.permissions||[]};if(!i.icon){const a=e.find(s=>s.filename.match(/^(icon|logo|app-icon)\.(png|jpg|jpeg|svg)$/i));if(a){const s=new Blob([a.content],{type:a.mimeType});i.icon=URL.createObjectURL(s)}}return i}async extractUrlMetadata(e){const n=vt(e),i=new URL(e).origin;try{const a=await this.fetchManifest(e);if(a)return{name:a.name||a.short_name||n,title:a.name||a.short_name||n,description:a.description||`Progressive Web App da ${n}`,category:"pwa",url:e,icon:this.getBestIcon(a.icons,i),isPWA:!0,manifest:a,version:a.version||"1.0.0",theme_color:a.theme_color,background_color:a.background_color};const s=await this.fetchHtmlMetadata(e);if(s){const r=s.icon||s.appleTouchIcon||`https://www.google.com/s2/favicons?domain=${n}&sz=64`;return{name:s.title||s.ogTitle||n,title:s.title||s.ogTitle||n,description:s.description||s.ogDescription||`App web da ${n}`,category:"tools",url:e,icon:r,isPWA:!1,version:"1.0.0"}}return{name:n,title:n,description:`App web da ${n}`,category:"tools",url:e,icon:`https://www.google.com/s2/favicons?domain=${n}&sz=64`,isPWA:!1,version:"1.0.0"}}catch(a){return console.error("Errore estrazione metadati:",a),{name:n,title:n,description:`App web da ${n}`,category:"tools",url:e,icon:`https://www.google.com/s2/favicons?domain=${n}&sz=64`,isPWA:!1,version:"1.0.0"}}}async fetchManifest(e){try{const i=`${new URL(e).origin}/manifest.json`,a=await fetch(i,{method:"GET",headers:{Accept:"application/json"}});if(a.ok){const s=await a.json();if(s.name||s.short_name)return s}return null}catch(n){return console.log("Manifest non trovato:",n),null}}async fetchHtmlMetadata(e){try{const n=await this.proxyService.extractMetadata(e);return{title:n.title||n.ogTitle,description:n.description||n.ogDescription,icon:n.icon,appleTouchIcon:n.appleTouchIcon,keywords:n.keywords,author:n.author,ogImage:n.ogImage,ogTitle:n.ogTitle,ogDescription:n.ogDescription}}catch(n){console.log("Impossibile estrarre metadati HTML con proxy, provo approccio diretto:",n);try{const i=await fetch(e,{method:"GET",headers:{Accept:"text/html"}});if(!i.ok)throw new Error("Pagina non accessibile");const a=await i.text(),s=a.match(/<title[^>]*>([^<]+)<\/title>/i),r=a.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i),o=a.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i),c=a.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i),l=new URL(e).origin;return{title:s?s[1].trim():null,description:r?r[1].trim():null,icon:o?new URL(o[1],l).href:null,appleTouchIcon:c?new URL(c[1],l).href:null}}catch(i){return console.log("Anche l'approccio diretto è fallito:",i),null}}}getBestIcon(e,n){if(!e||!Array.isArray(e))return null;const i=["512x512","192x192","144x144","96x96"];for(const a of i){const s=e.find(r=>r.sizes===a||r.sizes&&r.sizes.includes(a));if(s)return new URL(s.src,n).href}return e.length>0?new URL(e[0].src,n).href:null}parseGitHubUrl(e){const n=[/github\.com\/([^\/]+)\/([^\/]+)/,/([^\/]+)\.github\.io\/([^\/]+)/];for(const i of n){const a=e.match(i);if(a)return{owner:a[1],repo:a[2].replace(".git","")}}return null}isGitHubUrl(e){return e.includes("github.com")||e.includes("github.io")}getMimeType(e){const n=e.split(".").pop().toLowerCase();return{html:"text/html",css:"text/css",js:"application/javascript",json:"application/json",png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",gif:"image/gif",svg:"image/svg+xml",txt:"text/plain"}[n]||"application/octet-stream"}getCategoryLabel(e){return{productivity:"Produttività",entertainment:"Intrattenimento",tools:"Strumenti",games:"Giochi",ai:"Intelligenza Artificiale",social:"Social",education:"Educazione",business:"Business",utility:"Utilità",pwa:"Progressive Web App"}[e]||e}populateMetadataForm(e){const n={"app-name":e.name||e.title,"app-description":e.description,"app-version":e.version,"app-category":e.category,"app-tags":Array.isArray(e.tags)?e.tags.join(", "):e.tags,"app-icon":e.icon};for(const[i,a]of Object.entries(n)){const s=document.getElementById(i);s&&a&&(s.value=a,s.dispatchEvent(new Event("input")),s.dispatchEvent(new Event("change")))}if(e.isPWA&&e.manifest){if(e.theme_color){const i=document.getElementById("app-theme-color");i&&(i.value=e.theme_color)}if(e.background_color){const i=document.getElementById("app-bg-color");i&&(i.value=e.background_color)}}}collectFormData(){const e=document.getElementById("app-name"),n=document.getElementById("app-description"),i=document.getElementById("app-version"),a=document.getElementById("app-category"),s=document.getElementById("app-launch-mode"),r=document.getElementById("app-tags"),o=document.getElementById("app-icon"),c=r?.value?r.value.split(",").map(u=>u.trim()).filter(u=>u):[],l={name:e?.value.trim()||"",description:n?.value.trim()||"",version:i?.value.trim()||"1.0.0",category:a?.value||"tools",tags:c,icon:o?.value.trim()||null};return s&&s.value?(l.metadata=l.metadata||{},l.metadata.launchMode=s.value,console.log(`📝 Modalità di lancio specificata per app: ${s.value}`)):console.log("📝 Nessuna modalità specifica, userà impostazione globale"),l}validateAppData(e){return e.name?e.name.length>50?{valid:!1,error:"Nome app troppo lungo (max 50 caratteri)"}:e.description&&e.description.length>200?{valid:!1,error:"Descrizione troppo lunga (max 200 caratteri)"}:{valid:!0}:{valid:!1,error:"Nome app richiesto"}}showImportProgress(e){const n=document.getElementById("import-progress"),i=document.getElementById("modal-actions");n&&i&&(n.style.display=e?"block":"none",i.style.display=e?"none":"flex")}updateImportProgress(e,n){const i=document.getElementById("progress-fill"),a=document.getElementById("progress-text");i&&(i.style.width=`${e}%`),a&&(a.textContent=n)}enableImportButton(){const e=document.getElementById("start-import");e&&(e.disabled=!1)}disableImportButton(){const e=document.getElementById("start-import");e&&(e.disabled=!0)}setupDropZone(){["dragenter","dragover","dragleave","drop"].forEach(e=>{document.addEventListener(e,n=>{n.preventDefault(),n.stopPropagation()},!1)}),document.addEventListener("drop",e=>{const n=e.dataTransfer.files[0];n&&n.name.endsWith(".zip")&&(this.showModal(),setTimeout(()=>{this.handleZipFile(n)},200))})}setupKeyboardShortcuts(){document.addEventListener("keydown",e=>{(e.ctrlKey||e.metaKey)&&e.key==="i"&&(e.preventDefault(),this.showModal())})}async handleIconUpload(e,n,i){if(!e.type.startsWith("image/")){m("Per favore seleziona un file immagine","error");return}if(e.size>2*1024*1024){m("Immagine troppo grande (max 2MB)","error");return}try{const a=new FileReader;a.onload=s=>{const r=s.target.result;n.value=r,this.showIconPreview(r,i)},a.readAsDataURL(e)}catch(a){console.error("Errore upload icona:",a),m("Errore durante l'upload dell'icona","error")}}showIconPreview(e,n){if(!n)return;const i=n.querySelector("#icon-preview-img");i&&(i.src=e,i.onload=()=>{n.style.display="block"},i.onerror=()=>{n.style.display="none",m("Impossibile caricare l'icona","warning")})}async handleHtmlFile(e){if(!e.type.startsWith("text/html")){m("Per favore seleziona un file HTML","error");return}if(e.size>2*1024*1024){m("File troppo grande (max 2MB)","error");return}try{const n=await e.text(),i=this.extractHtmlMetadata(n,e.name);this.populateMetadataForm(i);const a=document.getElementById("section-metadata");a&&(a.style.display="block",a.classList.add("active")),this.currentImportData={type:"html",content:n,metadata:i},this.enableImportButton(),m("File HTML analizzato con successo!","success")}catch(n){console.error("Errore durante l'importazione del file HTML:",n),m("Errore durante l'importazione del file HTML","error")}}extractHtmlMetadata(e,n){const a=new DOMParser().parseFromString(e,"text/html"),s=a.querySelector("title")?.textContent?.trim()||a.querySelector('meta[property="og:title"]')?.getAttribute("content")||n.replace(".html","").replace(/[-_]/g," "),r=a.querySelector('meta[name="description"]')?.getAttribute("content")||a.querySelector('meta[property="og:description"]')?.getAttribute("content")||"App web standalone";let o=null;const c=a.querySelector('link[rel="icon"]')?.getAttribute("href")||a.querySelector('link[rel="shortcut icon"]')?.getAttribute("href")||a.querySelector('link[rel="apple-touch-icon"]')?.getAttribute("href");c&&(c.startsWith("data:")||c.startsWith("http")?o=c:o=null);const u=(a.querySelector('meta[name="keywords"]')?.getAttribute("content")||"").split(",").map(v=>v.trim()).filter(v=>v.length>0);let f="tools";const g=a.body?.textContent?.toLowerCase()||"";return g.includes("calcolatric")||g.includes("calculator")?f="utilities":g.includes("game")||g.includes("gioco")?f="games":(g.includes("editor")||g.includes("text"))&&(f="productivity"),{name:s,description:r,category:f,type:"html",content:e,icon:o,tags:u,version:"1.0.0"}}}class Qs{static render(e,n="grid"){return n==="list"?this.renderListView(e):this.renderGridView(e)}static renderGridView(e){const{id:n,name:i,description:a,category:s,version:r,type:o,lastUsed:c,installDate:l,favorite:u,tags:f,icon:g,url:v,githubUrl:b,metadata:S}=e,O=B(i||"App Senza Nome"),C=B(a||"Nessuna descrizione disponibile"),z=this.getCategoryInfo(s),ne=this.getAppIcon(e),W=this.getTypeInfo(o),Z=he(c);return`
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
            class="app-card-favorite ${u?"is-favorite":""}" 
            data-app-id="${n}"
            aria-label="${u?"Rimuovi dai preferiti":"Aggiungi ai preferiti"}"
            title="${u?"Rimuovi dai preferiti":"Aggiungi ai preferiti"}"
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
            <div class="app-name" title="${O}">${O}</div>
          </div>

          <!-- Tags -->
          ${f&&f.length>0?`
            <div class="app-tags">
              ${f.slice(0,3).map(H=>`
                <span class="app-tag">${B(H)}</span>
              `).join("")}
              ${f.length>3?`<span class="app-tag-more">+${f.length-3}</span>`:""}
            </div>
          `:""}

          <!-- Metadata -->
          <div class="app-metadata">
            <div class="app-category" title="Categoria">
              ${z.icon}
              <span>${z.name}</span>
            </div>
            <div class="app-last-used" title="Ultimo utilizzo: ${new Date(c).toLocaleString()}">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.7L16.2,16.2Z"/>
              </svg>
              <span>${Z}</span>
            </div>
          </div>

          <!-- App Description -->
          <div class="app-description-container">
            <p class="app-description" title="${C}">
              ${this.truncateText(C,100)}
            </p>
          </div>
        </div>

        <!-- App Actions -->
        <div class="app-card-actions">
          <button 
            class="app-card-launch btn btn-primary" 
            data-app-id="${n}"
            aria-label="Avvia ${O}"
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
              aria-label="Menu ${O}"
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
    `}static renderListView(e){const{id:n,name:i,description:a,category:s,version:r,type:o,lastUsed:c,installDate:l,favorite:u,tags:f,metadata:g}=e,v=B(i||"App Senza Nome");B(a||"Nessuna descrizione disponibile");const b=this.getCategoryInfo(s),S=this.getAppIcon(e),O=this.getTypeInfo(o),C=he(c),z=he(l);return`
      <div class="app-card app-card-list" data-app-id="${n}" data-category="${s}" data-type="${o}">
        <!-- App Icon -->
        <div class="app-list-icon">
          ${S}
          <div class="app-type-badge-mini" title="${O.label}">
            ${O.icon}
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
                <span class="app-tag app-tag-small">${B(ne)}</span>
              `).join("")}
              ${f.length>5?`<span class="app-tag-more app-tag-small">+${f.length-5}</span>`:""}
            </div>
          `:""}
        </div>

        <!-- App Metadata -->
        <div class="app-list-metadata">
          <div class="app-list-stat">
            <span class="stat-label">Ultimo utilizzo:</span>
            <span class="stat-value">${C}</span>
          </div>
          <div class="app-list-stat">
            <span class="stat-label">Installata:</span>
            <span class="stat-value">${z}</span>
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
            class="app-card-favorite ${u?"is-favorite":""}" 
            data-app-id="${n}"
            aria-label="${u?"Rimuovi dai preferiti":"Aggiungi ai preferiti"}"
            title="${u?"Rimuovi dai preferiti":"Aggiungi ai preferiti"}"
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
    `}static getAppIcon(e){if(e.icon){if(e.icon.startsWith("data:")||e.icon.startsWith("http"))return`<img src="${e.icon}" alt="${e.name}" class="app-icon" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="app-icon-fallback" style="display: none;">${this.getDefaultIcon(e.type)}</div>`;if(e.icon.includes("<svg"))return`<div class="app-icon app-icon-svg">${e.icon}</div>`}return`<div class="app-icon app-icon-default">${this.getDefaultIcon(e.type)}</div>`}static getDefaultIcon(e){const n={zip:`<svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
      </svg>`,url:`<svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.36,14C16.44,13.34 16.5,12.68 16.5,12C16.5,11.32 16.44,10.66 16.36,10H19.74C19.9,10.64 20,11.31 20,12C20,12.69 19.9,13.36 19.74,14M14.59,19.56C15.19,18.45 15.65,17.25 15.97,16H18.92C17.96,17.65 16.43,18.93 14.59,19.56M14.34,14H9.66C9.56,13.34 9.5,12.68 9.5,12C9.5,11.32 9.56,10.65 9.66,10H14.34C14.43,10.65 14.5,11.32 14.5,12C14.5,12.68 14.43,13.34 14.34,14M12,19.96C11.17,18.76 10.5,17.43 10.09,16H13.91C13.5,17.43 12.83,18.76 12,19.96M8,8H5.08C6.03,6.34 7.57,5.06 9.4,4.44C8.8,5.55 8.35,6.75 8,8M5.08,16H8C8.35,17.25 8.8,18.45 9.4,19.56C7.57,18.93 6.03,17.65 5.08,16M4.26,14C4.1,13.36 4,12.69 4,12C4,11.31 4.1,10.64 4.26,10H7.64C7.56,10.66 7.5,11.32 7.5,12C7.5,12.68 7.56,13.34 7.64,14M12,4.03C12.83,5.23 13.5,6.57 13.91,8H10.09C10.5,6.57 11.17,5.23 12,4.03M18.92,8H15.97C15.65,6.75 15.19,5.55 14.59,4.44C16.43,5.07 17.96,6.34 18.92,8Z"/>
      </svg>`,github:`<svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z"/>
      </svg>`,pwa:`<svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C9,20 10,19 11,17H12C14,15 16,13 17,8M18.5,2C16.7,2 15.14,2.9 14.22,4.22L15.63,5.63C16.07,5 16.72,4.5 17.5,4.5C18.61,4.5 19.5,5.39 19.5,6.5C19.5,7.28 19,7.93 18.37,8.37L19.78,9.78C21.1,8.86 22,7.3 22,5.5C22,3.57 20.43,2 18.5,2Z"/>
      </svg>`};return n[e]||n.url}static getTypeInfo(e){const n={zip:{label:"App ZIP",icon:`<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
        </svg>`},url:{label:"Web App",icon:`<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M10.59,13.41C11,13.8 11,14.4 10.59,14.81C10.2,15.2 9.6,15.2 9.19,14.81L7.77,13.39L6.36,14.81C5.95,15.22 5.34,15.22 4.93,14.81C4.53,14.4 4.53,13.8 4.93,13.39L6.34,12L4.93,10.59C4.53,10.2 4.53,9.59 4.93,9.18C5.34,8.78 5.95,8.78 6.36,9.18L7.77,10.6L9.19,9.19C9.6,8.78 10.2,8.78 10.59,9.19C11,9.6 11,10.2 10.59,10.61L9.17,12L10.59,13.41M19.07,4.93C19.47,5.34 19.47,5.95 19.07,6.36L17.65,7.77L19.07,9.19C19.47,9.6 19.47,10.2 19.07,10.61C18.66,11 18.05,11 17.64,10.61L16.23,9.19L14.81,10.61C14.4,11 13.8,11 13.39,10.61C13,10.2 13,9.6 13.39,9.19L14.81,7.77L13.39,6.36C13,5.95 13,5.34 13.39,4.93C13.8,4.53 14.4,4.53 14.81,4.93L16.23,6.34L17.64,4.93C18.05,4.53 18.66,4.53 19.07,4.93Z"/>
        </svg>`},github:{label:"GitHub App",icon:`<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z"/>
        </svg>`},pwa:{label:"PWA",icon:`<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z"/>
        </svg>`}};return n[e]||n.url}static getCategoryInfo(e){const n={productivity:{name:"Produttività",icon:`<svg viewBox="0 0 24 24" fill="currentColor">
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
        </svg>`}};return n[e]||n.uncategorized}static truncateText(e,n){return!e||e.length<=n?e:e.substring(0,n).trim()+"..."}static generateContextMenu(e){const{id:n,name:i,type:a,favorite:s,githubUrl:r,url:o}=e;return`
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
    `}}const ve={GITHUB:{BASE:"https://api.github.com"},GOOGLE:{DRIVE:"https://www.googleapis.com/drive/v3",AUTH:"https://accounts.google.com/o/oauth2/v2/auth",TOKEN:"https://oauth2.googleapis.com/token"}},zt={GITHUB_URL:/github\.com\/([^\/]+)\/([^\/]+)/,GITHUB_PAGES:/([^\.]+)\.github\.io\/([^\/]+)/};class Js{constructor(){this.baseUrl=ve.GITHUB.BASE,this.rateLimitRemaining=5e3,this.rateLimitReset=null,this.authenticated=!1,this.userInfo=null,this.cache=new Map,this.cacheTimeout=5*60*1e3}async authenticate(e){try{if(!e||!e.startsWith("ghp_"))throw new Error("Token GitHub non valido");const n=await this.makeRequest("/user",{headers:{Authorization:`token ${e}`,Accept:"application/vnd.github.v3+json"}});if(!n.ok)throw new Error(`Autenticazione fallita: ${n.statusText}`);return this.userInfo=await n.json(),this.authenticated=!0,await this.saveToken(e),console.log("✅ GitHub autenticato:",this.userInfo.login),this.userInfo}catch(n){throw console.error("❌ Errore autenticazione GitHub:",n),this.authenticated=!1,n}}async isAuthenticated(){if(this.authenticated&&this.userInfo)return!0;try{const e=await this.getToken();if(e)return await this.authenticate(e),this.authenticated}catch(e){console.error("Errore verifica autenticazione:",e)}return!1}async logout(){this.authenticated=!1,this.userInfo=null,await this.clearToken(),this.cache.clear()}async getRepository(e,n){try{const i=`repo:${e}/${n}`,a=this.getFromCache(i);if(a)return a;const s=`/repos/${e}/${n}`,r=await this.makeRequest(s);if(!r.ok)throw r.status===404?new Error("Repository non trovato"):new Error(`Errore API GitHub: ${r.statusText}`);const o=await r.json();return this.setCache(i,o),o}catch(i){throw console.error("Errore recupero repository:",i),i}}async getFileContent(e,n,i,a="main"){try{const s=`file:${e}/${n}/${i}@${a}`,r=this.getFromCache(s);if(r)return r;const o=`/repos/${e}/${n}/contents/${i}?ref=${a}`,c=await this.makeRequest(o);if(!c.ok)throw c.status===404?new Error(`File ${i} non trovato`):new Error(`Errore recupero file: ${c.statusText}`);const l=await c.json();return l.encoding==="base64"&&(l.decodedContent=atob(l.content.replace(/\n/g,""))),this.setCache(s,l),l}catch(s){throw console.error("Errore recupero file:",s),s}}async getDirectoryContents(e,n,i="",a="main"){try{const s=`dir:${e}/${n}/${i}@${a}`,r=this.getFromCache(s);if(r)return r;const o=`/repos/${e}/${n}/contents/${i}?ref=${a}`,c=await this.makeRequest(o);if(!c.ok)throw new Error(`Errore recupero directory: ${c.statusText}`);const l=await c.json();return this.setCache(s,l),l}catch(s){throw console.error("Errore recupero directory:",s),s}}async downloadRepositoryZip(e,n,i="main"){try{const a=`/repos/${e}/${n}/zipball/${i}`,s=await this.makeRequest(a,{headers:await this.getAuthHeaders()});if(!s.ok)throw new Error(`Errore download repository: ${s.statusText}`);return await s.blob()}catch(a){throw console.error("Errore download repository:",a),a}}async searchRepositories(e,n={}){try{const a=`/search/repositories?${new URLSearchParams({q:e,sort:n.sort||"stars",order:n.order||"desc",per_page:n.perPage||20,page:n.page||1}).toString()}`,s=await this.makeRequest(a);if(!s.ok)throw new Error(`Errore ricerca: ${s.statusText}`);return await s.json()}catch(i){throw console.error("Errore ricerca repository:",i),i}}async createGist(e){try{const n=await this.makeRequest("/gists",{method:"POST",headers:{...await this.getAuthHeaders(),"Content-Type":"application/json"},body:JSON.stringify({description:e.description||"AIdeas Sync Data",public:e.public||!1,files:e.files})});if(!n.ok)throw new Error(`Errore creazione Gist: ${n.statusText}`);const i=await n.json();return console.log("✅ Gist creato:",i.id),i}catch(n){throw console.error("Errore creazione Gist:",n),n}}async updateGist(e,n){try{const i=await this.makeRequest(`/gists/${e}`,{method:"PATCH",headers:{...await this.getAuthHeaders(),"Content-Type":"application/json"},body:JSON.stringify({description:n.description,files:n.files})});if(!i.ok)throw new Error(`Errore aggiornamento Gist: ${i.statusText}`);const a=await i.json();return console.log("✅ Gist aggiornato:",a.id),a}catch(i){throw console.error("Errore aggiornamento Gist:",i),i}}async getGist(e){try{const n=`gist:${e}`,i=this.getFromCache(n);if(i)return i;const a=await this.makeRequest(`/gists/${e}`,{headers:await this.getAuthHeaders()});if(!a.ok)throw a.status===404?new Error("Gist non trovato"):new Error(`Errore recupero Gist: ${a.statusText}`);const s=await a.json();return this.setCache(n,s,6e4),s}catch(n){throw console.error("Errore recupero Gist:",n),n}}async deleteGist(e){try{const n=await this.makeRequest(`/gists/${e}`,{method:"DELETE",headers:await this.getAuthHeaders()});if(!n.ok)throw new Error(`Errore eliminazione Gist: ${n.statusText}`);return console.log("✅ Gist eliminato:",e),!0}catch(n){throw console.error("Errore eliminazione Gist:",n),n}}async listGists(e={}){try{const i=`/gists?${new URLSearchParams({per_page:e.perPage||30,page:e.page||1}).toString()}`,a=await this.makeRequest(i,{headers:await this.getAuthHeaders()});if(!a.ok)throw new Error(`Errore lista Gist: ${a.statusText}`);return await a.json()}catch(n){throw console.error("Errore lista Gist:",n),n}}parseGitHubUrl(e){const n=e.match(zt.GITHUB_URL);if(n)return{owner:n[1],repo:n[2].replace(".git",""),branch:"main"};const i=e.match(zt.GITHUB_PAGES);return i?{owner:i[1],repo:i[2],branch:"gh-pages",isPages:!0}:null}async getGitHubPages(e,n){try{const i=`/repos/${e}/${n}/pages`,a=await this.makeRequest(i,{headers:await this.getAuthHeaders()});return a.ok?await a.json():null}catch{return null}}async getReleases(e,n){try{const i=`/repos/${e}/${n}/releases`,a=await this.makeRequest(i);if(!a.ok)throw new Error(`Errore recupero release: ${a.statusText}`);return await a.json()}catch(i){throw console.error("Errore recupero release:",i),i}}async makeRequest(e,n={}){const i=e.startsWith("http")?e:`${this.baseUrl}${e}`;if(this.rateLimitRemaining<=10){const r=new Date(this.rateLimitReset*1e3)-new Date;r>0&&(console.warn(`⏳ Rate limit GitHub, attesa ${Math.ceil(r/1e3)}s`),await new Promise(o=>setTimeout(o,r)))}const a=await fetch(i,{...n,headers:{"User-Agent":"AIdeas-App/1.0.0",...n.headers}});return this.updateRateLimit(a),a}updateRateLimit(e){const n=e.headers.get("X-RateLimit-Remaining"),i=e.headers.get("X-RateLimit-Reset");n&&(this.rateLimitRemaining=parseInt(n)),i&&(this.rateLimitReset=parseInt(i)),this.rateLimitRemaining<=50&&console.warn(`⚠️ Rate limit GitHub basso: ${this.rateLimitRemaining} rimanenti`)}async getAuthHeaders(){const e=await this.getToken();if(!e)throw new Error("Token GitHub non trovato");return{Authorization:`token ${e}`,Accept:"application/vnd.github.v3+json"}}async saveToken(e){const n=btoa(e);localStorage.setItem("aideas_github_token",n)}async getToken(){const e=localStorage.getItem("aideas_github_token");if(!e)return null;try{return atob(e)}catch(n){return console.error("Errore decrittazione token:",n),null}}async clearToken(){localStorage.removeItem("aideas_github_token")}getFromCache(e){const n=this.cache.get(e);return n?Date.now()-n.timestamp>this.cacheTimeout?(this.cache.delete(e),null):n.data:null}setCache(e,n,i=null){this.cache.set(e,{data:n,timestamp:Date.now(),timeout:i||this.cacheTimeout})}clearCache(){this.cache.clear()}async uploadSyncData(e,n=null){try{const i={description:"AIdeas Sync Data",public:!1,files:{"aideas-sync.json":{content:JSON.stringify(e,null,2)},"aideas-meta.json":{content:JSON.stringify({version:"1.0.0",timestamp:new Date().toISOString(),device:navigator.userAgent,checksum:await this.generateChecksum(e)},null,2)}}};let a;return n?a=await this.updateGist(n,i):a=await this.createGist(i),{success:!0,gistId:a.id,url:a.html_url,size:JSON.stringify(e).length}}catch(i){throw console.error("Errore upload sync data:",i),i}}async downloadSyncData(e){try{const n=await this.getGist(e),i=n.files["aideas-sync.json"],a=n.files["aideas-meta.json"];if(!i)throw new Error("File sync non trovato nel Gist");const s=JSON.parse(i.content);let r=null;if(a){r=JSON.parse(a.content);const o=await this.generateChecksum(s);r.checksum&&r.checksum!==o&&console.warn("⚠️ Checksum sync data non corrisponde")}return{success:!0,data:s,metadata:r,gistInfo:{id:n.id,url:n.html_url,updatedAt:n.updated_at}}}catch(n){throw console.error("Errore download sync data:",n),n}}async generateChecksum(e){const n=JSON.stringify(e),a=new TextEncoder().encode(n),s=await crypto.subtle.digest("SHA-256",a);return Array.from(new Uint8Array(s)).map(o=>o.toString(16).padStart(2,"0")).join("")}getRateLimitInfo(){return{remaining:this.rateLimitRemaining,reset:this.rateLimitReset?new Date(this.rateLimitReset*1e3):null,authenticated:this.authenticated}}async testConnection(){try{if(!await this.isAuthenticated())return{success:!1,error:"Non autenticato"};const n=await this.makeRequest("/user",{headers:await this.getAuthHeaders()});return{success:n.ok,user:n.ok?await n.json():null,rateLimit:this.getRateLimitInfo()}}catch(e){return{success:!1,error:e.message}}}}class Gs{constructor(){this.baseUrl=ve.GOOGLE.DRIVE,this.authUrl=ve.GOOGLE.AUTH,this.tokenUrl=ve.GOOGLE.TOKEN,this.clientId=null,this.clientSecret=null,this.redirectUri=window.location.origin+"/auth/google",this.authenticated=!1,this.accessToken=null,this.refreshToken=null,this.tokenExpiry=null,this.userInfo=null,this.scopes=["https://www.googleapis.com/auth/drive.file","https://www.googleapis.com/auth/drive.appdata","https://www.googleapis.com/auth/userinfo.profile"],this.cache=new Map,this.cacheTimeout=5*60*1e3,this.aideasFolder=null}configure(e,n=null){this.clientId=e,this.clientSecret=n}async authenticate(e=!0){try{if(!this.clientId)throw new Error("Client ID Google non configurato");const n=this.generateCodeVerifier(),i=await this.generateCodeChallenge(n);sessionStorage.setItem("google_code_verifier",n);const a=new URLSearchParams({client_id:this.clientId,redirect_uri:this.redirectUri,scope:this.scopes.join(" "),response_type:"code",access_type:"offline",prompt:"consent",code_challenge:i,code_challenge_method:"S256",state:Ft("auth")}),s=`${this.authUrl}?${a.toString()}`;return e?await this.authenticateWithPopup(s):(window.location.href=s,{pending:!0})}catch(n){throw console.error("Errore autenticazione Google:",n),n}}async authenticateWithPopup(e){return new Promise((n,i)=>{const a=window.open(e,"google-auth","width=500,height=600,scrollbars=yes,resizable=yes");if(!a){i(new Error("Popup bloccato dal browser"));return}const s=setInterval(()=>{a.closed&&(clearInterval(s),i(new Error("Autenticazione annullata")))},1e3),r=async o=>{if(o.origin===window.location.origin)if(o.data.type==="GOOGLE_AUTH_SUCCESS"){clearInterval(s),a.close(),window.removeEventListener("message",r);try{const c=await this.handleAuthCallback(o.data.code,o.data.state);n(c)}catch(c){i(c)}}else o.data.type==="GOOGLE_AUTH_ERROR"&&(clearInterval(s),a.close(),window.removeEventListener("message",r),i(new Error(o.data.error)))};window.addEventListener("message",r)})}async handleAuthCallback(e,n){try{const i=sessionStorage.getItem("google_code_verifier");if(!i)throw new Error("Code verifier non trovato");const a=await this.exchangeCodeForToken(e,i);return this.accessToken=a.access_token,this.refreshToken=a.refresh_token,this.tokenExpiry=new Date(Date.now()+a.expires_in*1e3),this.authenticated=!0,this.userInfo=await this.getUserInfo(),await this.saveCredentials(),await this.initializeAIdeasFolder(),console.log("✅ Google Drive autenticato:",this.userInfo.name),sessionStorage.removeItem("google_code_verifier"),{success:!0,user:this.userInfo,tokens:{access_token:this.accessToken,expires_at:this.tokenExpiry}}}catch(i){throw console.error("Errore callback auth:",i),i}}async exchangeCodeForToken(e,n){const i={client_id:this.clientId,code:e,code_verifier:n,grant_type:"authorization_code",redirect_uri:this.redirectUri};this.clientSecret&&(i.client_secret=this.clientSecret);const a=await fetch(this.tokenUrl,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams(i)});if(!a.ok){const s=await a.json();throw new Error(`Token exchange failed: ${s.error_description||s.error}`)}return await a.json()}async refreshAccessToken(){try{if(!this.refreshToken)throw new Error("Refresh token non disponibile");const e={client_id:this.clientId,refresh_token:this.refreshToken,grant_type:"refresh_token"};this.clientSecret&&(e.client_secret=this.clientSecret);const n=await fetch(this.tokenUrl,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams(e)});if(!n.ok)throw new Error("Token refresh failed");const i=await n.json();return this.accessToken=i.access_token,this.tokenExpiry=new Date(Date.now()+i.expires_in*1e3),i.refresh_token&&(this.refreshToken=i.refresh_token),await this.saveCredentials(),i}catch(e){throw console.error("Errore refresh token:",e),this.authenticated=!1,e}}async ensureValidToken(){if(!this.accessToken)return!1;if(this.tokenExpiry&&Date.now()>=this.tokenExpiry.getTime()-3e5)try{await this.refreshAccessToken()}catch{return!1}return!0}async getUserInfo(){try{const e=await this.makeRequest("https://www.googleapis.com/oauth2/v2/userinfo");if(!e.ok)throw new Error("Errore recupero info utente");return await e.json()}catch(e){throw console.error("Errore info utente:",e),e}}async isAuthenticated(){if(this.authenticated&&await this.ensureValidToken())return!0;try{if(await this.loadCredentials()&&await this.ensureValidToken())return this.authenticated=!0,!0}catch(e){console.error("Errore verifica autenticazione:",e)}return!1}async logout(){this.authenticated=!1,this.accessToken=null,this.refreshToken=null,this.tokenExpiry=null,this.userInfo=null,this.aideasFolder=null,await this.clearCredentials(),this.cache.clear()}async initializeAIdeasFolder(){try{const e=await this.findAIdeasFolder();if(e)return this.aideasFolder=e,e;const n=await this.createFolder("AIdeas",null,{description:"AIdeas App Data - Swiss Army Knife by AI"});return this.aideasFolder=n,n}catch(e){throw console.error("Errore inizializzazione cartella AIdeas:",e),e}}async findAIdeasFolder(){try{const n=await this.makeRequest(`/files?q=${encodeURIComponent("name='AIdeas' and mimeType='application/vnd.google-apps.folder' and trashed=false")}`);if(!n.ok)throw new Error("Errore ricerca cartella AIdeas");const i=await n.json();return i.files.length>0?i.files[0]:null}catch(e){return console.error("Errore ricerca cartella:",e),null}}async createFolder(e,n=null,i={}){try{const a={name:e,mimeType:"application/vnd.google-apps.folder",...i};n&&(a.parents=[n]);const s=await this.makeRequest("/files",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(a)});if(!s.ok)throw new Error("Errore creazione cartella");const r=await s.json();return console.log("✅ Cartella creata:",r.name),r}catch(a){throw console.error("Errore creazione cartella:",a),a}}async uploadFile(e,n,i,a=null,s={}){try{const r={name:e,...s};a&&(r.parents=[a]);const o="-------314159265358979323846",c=`\r
--${o}--`;let l=`--${o}\r
`;if(l+=`Content-Type: application/json\r
\r
`,l+=JSON.stringify(r)+`\r
`,l+=`--${o}\r
`,l+=`Content-Type: ${i}\r
\r
`,typeof n=="string")l+=n;else return await this.uploadFileBlob(e,n,i,a,s);l+=c;const u=await this.makeRequest("/upload/files?uploadType=multipart",{method:"POST",headers:{"Content-Type":`multipart/related; boundary="${o}"`},body:l});if(!u.ok)throw new Error("Errore upload file");const f=await u.json();return console.log("✅ File caricato:",f.name),f}catch(r){throw console.error("Errore upload file:",r),r}}async uploadFileBlob(e,n,i,a=null,s={}){try{const r={name:e,...s};a&&(r.parents=[a]);const o=await this.makeRequest("/files",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(r)});if(!o.ok)throw new Error("Errore creazione metadati file");const c=await o.json(),l=await this.makeRequest(`/upload/files/${c.id}?uploadType=media`,{method:"PATCH",headers:{"Content-Type":i},body:n});if(!l.ok)throw new Error("Errore upload contenuto file");const u=await l.json();return console.log("✅ File blob caricato:",u.name),u}catch(r){throw console.error("Errore upload blob:",r),r}}async downloadFile(e){try{const n=await this.makeRequest(`/files/${e}?alt=media`);if(!n.ok)throw new Error("Errore download file");return await n.blob()}catch(n){throw console.error("Errore download file:",n),n}}async getFileMetadata(e,n="id,name,mimeType,size,modifiedTime,parents"){try{const i=await this.makeRequest(`/files/${e}?fields=${n}`);if(!i.ok)throw new Error("Errore recupero metadati file");return await i.json()}catch(i){throw console.error("Errore metadati file:",i),i}}async listFiles(e=null,n={}){try{let i="trashed=false";e&&(i+=` and '${e}' in parents`),n.mimeType&&(i+=` and mimeType='${n.mimeType}'`),n.nameContains&&(i+=` and name contains '${n.nameContains}'`);const a=new URLSearchParams({q:i,fields:n.fields||"files(id,name,mimeType,size,modifiedTime)",pageSize:n.pageSize||100});n.orderBy&&a.set("orderBy",n.orderBy);const s=await this.makeRequest(`/files?${a.toString()}`);if(!s.ok)throw new Error("Errore lista file");return(await s.json()).files||[]}catch(i){throw console.error("Errore lista file:",i),i}}async deleteFile(e){try{if(!(await this.makeRequest(`/files/${e}`,{method:"DELETE"})).ok)throw new Error("Errore eliminazione file");return console.log("✅ File eliminato:",e),!0}catch(n){throw console.error("Errore eliminazione file:",n),n}}async uploadSyncData(e){try{this.aideasFolder||await this.initializeAIdeasFolder();const n=JSON.stringify(e,null,2),i={version:"1.0.0",timestamp:new Date().toISOString(),device:navigator.userAgent,checksum:await this.generateChecksum(e)},a=await this.uploadFile("aideas-sync.json",n,"application/json",this.aideasFolder.id,{description:"AIdeas Sync Data - Apps and Settings"}),s=await this.uploadFile("aideas-meta.json",JSON.stringify(i,null,2),"application/json",this.aideasFolder.id,{description:"AIdeas Sync Metadata"});return{success:!0,syncFile:{id:a.id,name:a.name,size:n.length},metaFile:{id:s.id,name:s.name},metadata:i}}catch(n){throw console.error("Errore upload sync data:",n),n}}async downloadSyncData(){try{this.aideasFolder||await this.initializeAIdeasFolder();const e=await this.listFiles(this.aideasFolder.id,{nameContains:"aideas-sync.json"});if(e.length===0)throw new Error("File sync non trovato");const n=e[0],a=await(await this.downloadFile(n.id)).text(),s=JSON.parse(a);let r=null;try{const o=await this.listFiles(this.aideasFolder.id,{nameContains:"aideas-meta.json"});if(o.length>0){const l=await(await this.downloadFile(o[0].id)).text();r=JSON.parse(l);const u=await this.generateChecksum(s);r.checksum&&r.checksum!==u&&console.warn("⚠️ Checksum sync data non corrisponde")}}catch{console.warn("Warning: impossibile caricare metadati sync")}return{success:!0,data:s,metadata:r,fileInfo:{id:n.id,name:n.name,size:n.size,modifiedTime:n.modifiedTime}}}catch(e){throw console.error("Errore download sync data:",e),e}}async makeRequest(e,n={}){if(!await this.ensureValidToken())throw new Error("Token non valido, riautenticarsi");const i=e.startsWith("http")?e:`${this.baseUrl}${e}`;return await fetch(i,{...n,headers:{Authorization:`Bearer ${this.accessToken}`,...n.headers}})}generateCodeVerifier(){const e=new Uint8Array(32);return crypto.getRandomValues(e),this.base64URLEncode(e)}async generateCodeChallenge(e){const i=new TextEncoder().encode(e),a=await crypto.subtle.digest("SHA-256",i);return this.base64URLEncode(new Uint8Array(a))}base64URLEncode(e){return btoa(String.fromCharCode(...e)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"")}async generateChecksum(e){const n=JSON.stringify(e),a=new TextEncoder().encode(n),s=await crypto.subtle.digest("SHA-256",a);return Array.from(new Uint8Array(s)).map(o=>o.toString(16).padStart(2,"0")).join("")}async saveCredentials(){const e={accessToken:this.accessToken,refreshToken:this.refreshToken,tokenExpiry:this.tokenExpiry?.toISOString(),userInfo:this.userInfo},n=btoa(JSON.stringify(e));localStorage.setItem("aideas_googledrive_creds",n)}async loadCredentials(){try{const e=localStorage.getItem("aideas_googledrive_creds");if(!e)return!1;const n=JSON.parse(atob(e));return this.accessToken=n.accessToken,this.refreshToken=n.refreshToken,this.tokenExpiry=n.tokenExpiry?new Date(n.tokenExpiry):null,this.userInfo=n.userInfo,!0}catch(e){return console.error("Errore caricamento credenziali:",e),!1}}async clearCredentials(){localStorage.removeItem("aideas_googledrive_creds")}async testConnection(){try{return await this.isAuthenticated()?{success:!0,user:await this.getUserInfo(),quotaInfo:await this.getStorageQuota()}:{success:!1,error:"Non autenticato"}}catch(e){return{success:!1,error:e.message}}}async getStorageQuota(){try{const e=await this.makeRequest("/about?fields=storageQuota");if(!e.ok)throw new Error("Errore recupero quota");return await e.json()}catch(e){return console.error("Errore quota storage:",e),null}}getFromCache(e){const n=this.cache.get(e);return n?Date.now()-n.timestamp>this.cacheTimeout?(this.cache.delete(e),null):n.data:null}setCache(e,n){this.cache.set(e,{data:n,timestamp:Date.now()})}clearCache(){this.cache.clear()}}class er{constructor(){this.syncProviders={github:new Js,googledrive:new Gs},Object.entries(this.syncProviders).forEach(([e,n])=>{n?console.log(`[SyncManager] Provider '${e}' istanziato:`,n.constructor.name):console.error(`[SyncManager] Provider '${e}' non istanziato correttamente!`)}),this.syncStatus={isEnabled:!1,lastSync:null,provider:"github",isInProgress:!1,autoSyncInterval:null},this.syncQueue=[],this.conflictResolutions=[],this.init=this.init.bind(this),this.enableSync=this.enableSync.bind(this),this.disableSync=this.disableSync.bind(this),this.performSync=this.performSync.bind(this),this.showSyncModal=this.showSyncModal.bind(this),this.handleConflict=this.handleConflict.bind(this),this.autoSync=this.autoSync.bind(this)}async init(){console.log("🔄 Inizializzazione SyncManager...");try{await this.loadSyncConfig(),this.syncStatus.isEnabled&&await this.setupAutoSync(),this.setupBackgroundSync()}catch(e){console.error("Errore inizializzazione SyncManager:",e)}}async loadSyncConfig(){try{this.syncStatus.isEnabled=await y.getSetting("syncEnabled",!1),this.syncStatus.provider=await y.getSetting("syncProvider","github"),this.syncStatus.lastSync=await y.getSetting("lastSyncTime",null);const e=await y.getSetting("autoSyncInterval",60);this.syncStatus.autoSyncInterval=e*60*1e3}catch(e){console.error("Errore caricamento configurazione sync:",e)}}async enableSync(e="github",n={}){try{if(this.syncStatus.isEnabled=!0,this.syncStatus.provider=e,!await this.syncProviders[e].testConnection(n))throw new Error("Impossibile connettersi al provider di sincronizzazione");await y.setSetting("syncEnabled",!0),await y.setSetting("syncProvider",e),await this.saveCredentials(e,n),await this.setupAutoSync(),m("Sincronizzazione abilitata con successo","success")}catch(i){console.error("Errore abilitazione sync:",i),m(`Errore: ${i.message}`,"error"),this.syncStatus.isEnabled=!1}}async disableSync(){try{this.syncStatus.isEnabled=!1,this.autoSyncTimer&&(clearInterval(this.autoSyncTimer),this.autoSyncTimer=null),await y.setSetting("syncEnabled",!1),await this.clearCredentials(),m("Sincronizzazione disabilitata","info")}catch(e){console.error("Errore disabilitazione sync:",e),m("Errore durante la disabilitazione della sincronizzazione","error")}}async performSync(e="bidirectional"){if(this.syncStatus.isInProgress){m("Sincronizzazione già in corso","warning");return}if(!this.syncStatus.isEnabled){m("Sincronizzazione non abilitata","warning");return}try{this.syncStatus.isInProgress=!0,this.updateSyncStatus("Sincronizzazione in corso...");const n=this.syncProviders[this.syncStatus.provider],i=await this.getCredentials(this.syncStatus.provider);await y.getSetting("backupBeforeSync",!0)&&await this.createBackup();let s;switch(e){case"upload":s=await this.uploadToCloud(n,i);break;case"download":s=await this.downloadFromCloud(n,i);break;case"bidirectional":default:s=await this.bidirectionalSync(n,i);break}return this.syncStatus.lastSync=new Date,await y.setSetting("lastSyncTime",this.syncStatus.lastSync.toISOString()),this.updateSyncStatus("Sincronizzazione completata"),m("Sincronizzazione completata con successo","success"),s}catch(n){throw console.error("Errore durante la sincronizzazione:",n),this.updateSyncStatus("Errore sincronizzazione"),m(`Errore sincronizzazione: ${n.message}`,"error"),n}finally{this.syncStatus.isInProgress=!1}}async bidirectionalSync(e,n){try{const i=await this.getLocalData(),a=await Pe(JSON.stringify(i)),s=await e.download(n);if(!s)return await this.uploadToCloud(e,n);const r=await Pe(JSON.stringify(s.data));if(a===r)return{status:"no_changes",message:"Nessuna modifica da sincronizzare"};const o=await this.analyzeChanges(i,s.data);if(o.conflicts.length>0){const l=await this.resolveConflicts(o.conflicts);o.resolutions=l}const c=await this.mergeData(i,s.data,o);return await this.saveLocalData(c),await e.upload(n,{data:c,timestamp:new Date().toISOString(),version:"1.0.0",device:await y.getSetting("deviceId")}),{status:"success",changes:o.changes,conflicts:o.conflicts.length,resolved:o.resolutions?o.resolutions.length:0}}catch(i){throw console.error("Errore sync bidirezionale:",i),i}}async uploadToCloud(e,n){try{const i=await this.getLocalData(),a={data:i,timestamp:new Date().toISOString(),version:"1.0.0",device:await y.getSetting("deviceId"),hash:await Pe(JSON.stringify(i))};return await e.upload(n,a),{status:"uploaded",message:"Dati caricati sul cloud"}}catch(i){throw console.error("Errore upload cloud:",i),i}}async downloadFromCloud(e,n){try{const i=await e.download(n);if(!i)throw new Error("Nessun dato trovato sul cloud");if(!this.validateRemoteData(i))throw new Error("Dati remoti non validi");return await this.saveLocalData(i.data),{status:"downloaded",message:"Dati scaricati dal cloud"}}catch(i){throw console.error("Errore download cloud:",i),i}}async analyzeChanges(e,n){const i={changes:{apps:{added:[],modified:[],deleted:[]},settings:{added:[],modified:[],deleted:[]}},conflicts:[]},a=new Map(e.apps.map(r=>[r.id,r])),s=new Map(n.apps.map(r=>[r.id,r]));for(const[r,o]of a)if(!s.has(r))i.changes.apps.added.push(o);else{const c=s.get(r),l=new Date(o.lastUsed||o.installDate),u=new Date(c.lastUsed||c.installDate);l>u?i.changes.apps.modified.push({local:o,remote:c,winner:"local"}):u>l?i.changes.apps.modified.push({local:o,remote:c,winner:"remote"}):JSON.stringify(o)!==JSON.stringify(c)&&i.conflicts.push({type:"app",id:r,local:o,remote:c})}for(const[r,o]of s)a.has(r)||i.changes.apps.added.push(o);return i}async resolveConflicts(e){const n=[];for(const i of e){const a=await this.showConflictDialog(i);n.push(a)}return n}async showConflictDialog(e){return new Promise(n=>{const i=`
        <div class="modal-header">
          <h2>🔄 Conflitto di Sincronizzazione</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="conflict-info">
            <p>È stato rilevato un conflitto per <strong>${e.type}</strong>:</p>
            <p><strong>ID:</strong> ${e.id}</p>
          </div>
          
          <div class="conflict-options">
            <div class="conflict-option">
              <h4>Versione Locale</h4>
              <div class="conflict-data">
                <pre>${JSON.stringify(e.local,null,2)}</pre>
              </div>
              <button class="btn btn-primary" id="choose-local">Usa Versione Locale</button>
            </div>
            
            <div class="conflict-option">
              <h4>Versione Remota</h4>
              <div class="conflict-data">
                <pre>${JSON.stringify(e.remote,null,2)}</pre>
              </div>
              <button class="btn btn-primary" id="choose-remote">Usa Versione Remota</button>
            </div>
          </div>
          
          <div class="conflict-actions">
            <button class="btn btn-secondary" id="skip-conflict">Salta (mantieni locale)</button>
          </div>
        </div>
      `,a=N("conflict-modal",i,{size:"modal-xl"});a.querySelector("#choose-local")?.addEventListener("click",()=>{k("conflict-modal"),n({action:"use_local",data:e.local})}),a.querySelector("#choose-remote")?.addEventListener("click",()=>{k("conflict-modal"),n({action:"use_remote",data:e.remote})}),a.querySelector("#skip-conflict")?.addEventListener("click",()=>{k("conflict-modal"),n({action:"skip",data:e.local})})})}async mergeData(e,n,i){const a={apps:[...e.apps],settings:[...e.settings]};for(const s of i.changes.apps.added)a.apps.push(s);for(const s of i.changes.apps.modified){const r=a.apps.findIndex(o=>o.id===s.local.id);r!==-1&&(a.apps[r]=s.winner==="local"?s.local:s.remote)}if(i.resolutions){for(const s of i.resolutions)if(s.action==="use_remote"){const r=a.apps.findIndex(o=>o.id===s.data.id);r!==-1?a.apps[r]=s.data:a.apps.push(s.data)}}return a}showSyncModal(){const e=this.createSyncModal();N("sync-modal",e,{size:"modal-lg",disableBackdropClose:!1}),setTimeout(()=>{this.setupSyncModalListeners(),this.updateSyncModalStatus()},100)}createSyncModal(){return`
      <div class="modal-header">
        <h2>
          <svg viewBox="0 0 24 24" fill="currentColor" class="header-icon">
            <path d="M12,18A6,6 0 0,1 6,12C6,11 6.25,10.03 6.7,9.2L5.24,7.74C4.46,8.97 4,10.43 4,12A8,8 0 0,0 12,20V23L16,19L12,15M12,4V1L8,5L12,9V6A6,6 0 0,1 18,12C18,13 17.75,13.97 17.3,14.8L18.76,16.26C19.54,15.03 20,13.57 20,12A8,8 0 0,0 12,4Z"/>
          </svg>
          Gestione Sincronizzazione
        </h2>
        <button class="modal-close">&times;</button>
      </div>
      
      <div class="modal-body">
        <!-- Sync Status -->
        <div class="sync-status-card">
          <div class="sync-status-header">
            <h3>Stato Sincronizzazione</h3>
            <div class="sync-status-indicator" id="sync-status-indicator">
              <span class="status-dot"></span>
              <span class="status-text" id="sync-status-text">Caricamento...</span>
            </div>
          </div>
          
          <div class="sync-status-details" id="sync-status-details">
            <div class="status-item">
              <span class="status-label">Provider:</span>
              <span class="status-value" id="sync-provider">-</span>
            </div>
            <div class="status-item">
              <span class="status-label">Ultima sincronizzazione:</span>
              <span class="status-value" id="last-sync">-</span>
            </div>
            <div class="status-item">
              <span class="status-label">Auto-sync:</span>
              <span class="status-value" id="auto-sync-status">-</span>
            </div>
          </div>
        </div>

        <!-- Sync Setup -->
        <div class="sync-setup" id="sync-setup" style="display: none;">
          <h3>Configura Sincronizzazione</h3>
          
          <div class="provider-selection">
            <h4>Scegli Provider</h4>
            <div class="provider-options">
              <label class="provider-option">
                <input type="radio" name="sync-provider" value="github" checked>
                <div class="provider-card">
                  <div class="provider-icon">⚡</div>
                  <div class="provider-info">
                    <h5>GitHub Gist</h5>
                    <p>Sincronizzazione tramite GitHub Gist privati</p>
                  </div>
                </div>
              </label>
              
              <label class="provider-option">
                <input type="radio" name="sync-provider" value="googledrive">
                <div class="provider-card">
                  <div class="provider-icon">📱</div>
                  <div class="provider-info">
                    <h5>Google Drive</h5>
                    <p>Sincronizzazione tramite Google Drive</p>
                  </div>
                </div>
              </label>
            </div>
          </div>
          
          <!-- GitHub Setup -->
          <div class="provider-setup" id="github-setup">
            <h4>Configurazione GitHub</h4>
            <div class="form-group">
              <label for="github-token">Personal Access Token</label>
              <input type="password" id="github-token" class="form-input" placeholder="ghp_xxxxxxxxxxxx">
              <div class="form-help">
                <p>Crea un token su <a href="https://github.com/settings/tokens" target="_blank">GitHub Settings</a> con scope "gist"</p>
              </div>
            </div>
          </div>
          
          <!-- Google Drive Setup -->
          <div class="provider-setup" id="googledrive-setup" style="display: none;">
            <h4>Configurazione Google Drive</h4>
            <div class="form-group">
              <p>Clicca il pulsante per autorizzare l'accesso a Google Drive:</p>
              <button class="btn btn-primary" id="google-auth-btn">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56,12.25C22.56,11.47 22.49,10.72 22.37,10H12V14.26H17.92C17.66,15.69 16.88,16.93 15.71,17.77V20.96H19.28C21.45,18.96 22.56,15.83 22.56,12.25Z"/>
                  <path d="M12,23C15.24,23 17.96,21.92 19.28,20.96L15.71,17.77C14.74,18.42 13.48,18.81 12,18.81C8.91,18.81 6.26,16.77 5.4,13.96H1.67V17.28C2.98,19.89 7.24,23 12,23Z"/>
                  <path d="M5.4,13.96C5.18,13.31 5.05,12.62 5.05,11.91C5.05,11.2 5.18,10.51 5.4,9.86V6.54H1.67C0.61,8.65 0,10.72 0,11.91C0,13.1 0.61,15.17 1.67,17.28L5.4,13.96Z"/>
                  <path d="M12,4.75C13.77,4.75 15.35,5.36 16.6,6.55L19.84,3.31C17.96,1.56 15.24,0.5 12,0.5C7.24,0.5 2.98,3.61 1.67,6.22L5.4,9.54C6.26,6.73 8.91,4.75 12,4.75Z"/>
                </svg>
                Autorizza Google Drive
              </button>
            </div>
          </div>
        </div>

        <!-- Sync Actions -->
        <div class="sync-actions" id="sync-actions">
          <div class="action-group">
            <h4>Azioni Sincronizzazione</h4>
            
            <div class="action-buttons">
              <button class="btn btn-primary" id="sync-now-btn" disabled>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,18A6,6 0 0,1 6,12C6,11 6.25,10.03 6.7,9.2L5.24,7.74C4.46,8.97 4,10.43 4,12A8,8 0 0,0 12,20V23L16,19L12,15M12,4V1L8,5L12,9V6A6,6 0 0,1 18,12C18,13 17.75,13.97 17.3,14.8L18.76,16.26C19.54,15.03 20,13.57 20,12A8,8 0 0,0 12,4Z"/>
                </svg>
                Sincronizza Ora
              </button>
              
              <button class="btn btn-secondary" id="upload-only-btn" disabled>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z"/>
                </svg>
                Solo Upload
              </button>
              
              <button class="btn btn-secondary" id="download-only-btn" disabled>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
                </svg>
                Solo Download
              </button>
            </div>
          </div>
          
          <div class="action-group">
            <h4>Gestione Backup</h4>
            
            <div class="action-buttons">
              <button class="btn btn-secondary" id="create-backup-btn">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                Crea Backup
              </button>
              
              <button class="btn btn-secondary" id="restore-backup-btn">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                Ripristina Backup
              </button>
              
              <button class="btn btn-warning" id="disable-sync-btn">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M14.5,9L12,11.5L9.5,9L8,10.5L10.5,13L8,15.5L9.5,17L12,14.5L14.5,17L16,15.5L13.5,13L16,10.5L14.5,9Z"/>
                </svg>
                Disabilita Sync
              </button>
            </div>
          </div>
        </div>

        <!-- Sync Progress -->
        <div class="sync-progress" id="sync-progress" style="display: none;">
          <div class="progress-info">
            <h4>Sincronizzazione in corso...</h4>
            <p id="sync-progress-text">Preparazione...</p>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" id="sync-progress-fill"></div>
          </div>
        </div>

        <!-- Sync History -->
        <div class="sync-history">
          <h4>Cronologia Sincronizzazioni</h4>
          <div class="history-list" id="sync-history-list">
            <p class="history-empty">Nessuna sincronizzazione effettuata</p>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-secondary" id="close-sync-modal">Chiudi</button>
        <button class="btn btn-primary" id="setup-sync-btn">Configura Sincronizzazione</button>
      </div>
    `}setupSyncModalListeners(){const e=document.getElementById("sync-modal");if(!e)return;e.querySelectorAll('input[name="sync-provider"]').forEach(i=>{i.addEventListener("change",()=>{this.showProviderSetup(i.value)})}),e.querySelector("#setup-sync-btn")?.addEventListener("click",()=>{this.setupSyncFromModal()}),e.querySelector("#sync-now-btn")?.addEventListener("click",()=>{this.performSync("bidirectional")}),e.querySelector("#upload-only-btn")?.addEventListener("click",()=>{this.performSync("upload")}),e.querySelector("#download-only-btn")?.addEventListener("click",()=>{this.performSync("download")}),e.querySelector("#create-backup-btn")?.addEventListener("click",()=>{this.createBackup()}),e.querySelector("#restore-backup-btn")?.addEventListener("click",()=>{this.restoreBackup()}),e.querySelector("#disable-sync-btn")?.addEventListener("click",()=>{this.disableSync()}),e.querySelector("#google-auth-btn")?.addEventListener("click",()=>{this.authenticateGoogle()}),e.querySelector("#close-sync-modal")?.addEventListener("click",()=>{k("sync-modal")})}async getLocalData(){try{const[e,n]=await Promise.all([y.getAllApps(),y.getAllSettings()]);return{apps:e,settings:n}}catch(e){throw console.error("Errore recupero dati locali:",e),e}}async saveLocalData(e){try{await y.importData({data:e})}catch(n){throw console.error("Errore salvataggio dati locali:",n),n}}validateRemoteData(e){return e&&e.data&&Array.isArray(e.data.apps)&&Array.isArray(e.data.settings)}async createBackup(){try{const e=await y.exportAllData(),n=new Blob([JSON.stringify(e,null,2)],{type:"application/json"}),i=URL.createObjectURL(n),a=document.createElement("a");a.href=i,a.download=`aideas-backup-${new Date().toISOString().split("T")[0]}.json`,document.body.appendChild(a),a.click(),document.body.removeChild(a),URL.revokeObjectURL(i),m("Backup creato con successo","success")}catch(e){console.error("Errore creazione backup:",e),m("Errore durante la creazione del backup","error")}}async saveCredentials(e,n){const i=`aideas_sync_${e}`,a=btoa(JSON.stringify(n));localStorage.setItem(i,a)}async getCredentials(e){const n=`aideas_sync_${e}`,i=localStorage.getItem(n);if(!i)return null;try{return JSON.parse(atob(i))}catch(a){return console.error("Errore decrittazione credenziali:",a),null}}async clearCredentials(){Object.keys(localStorage).filter(n=>n.startsWith("aideas_sync_")).forEach(n=>localStorage.removeItem(n))}async setupAutoSync(){this.autoSyncTimer&&clearInterval(this.autoSyncTimer),this.syncStatus.isEnabled&&this.syncStatus.autoSyncInterval>0&&(this.autoSyncTimer=setInterval(()=>{this.autoSync()},this.syncStatus.autoSyncInterval))}async autoSync(){try{if(!this.syncStatus.isEnabled||this.syncStatus.isInProgress)return;console.log("🔄 Auto-sync in corso..."),await this.performSync("bidirectional")}catch(e){console.error("Errore auto-sync:",e)}}setupBackgroundSync(){"serviceWorker"in navigator&&navigator.serviceWorker.addEventListener("message",e=>{e.data.type==="BACKGROUND_SYNC"&&e.data.action==="sync-apps"&&this.performSync("bidirectional").catch(console.error)})}updateSyncStatus(e){const n=document.getElementById("sync-status-text");n&&(n.textContent=e)}showProviderSetup(e){}updateSyncModalStatus(){}setupSyncFromModal(){}authenticateGoogle(){}restoreBackup(){}}class tr{constructor(){this.currentSettings={},this.defaultSettings={language:"it",theme:"auto",defaultLaunchMode:"newpage",maxConcurrentApps:5,showAppTooltips:!0,enableKeyboardShortcuts:!0,autoUpdateApps:!1,viewMode:"grid",sortBy:"lastUsed",showWelcomeMessage:!0,enableAnimations:!0,compactMode:!1,syncEnabled:!1,syncProvider:"github",autoSyncInterval:60,backupBeforeSync:!0,analyticsEnabled:!1,crashReportingEnabled:!0,allowTelemetry:!1,validateAppsOnLaunch:!0,sandboxMode:"strict",enableServiceWorker:!0,cacheStrategy:"aggressive",preloadApps:!1,lazyLoadImages:!0,enableDebugMode:!1,showConsoleErrors:!1,enableExperimentalFeatures:!1},this.disabledFeatures={autoUpdateApps:!0,analyticsEnabled:!0,crashReportingEnabled:!0,allowTelemetry:!0,enableServiceWorker:!0,preloadApps:!0,enableExperimentalFeatures:!0},this.init=this.init.bind(this),this.showModal=this.showModal.bind(this),this.loadSettings=this.loadSettings.bind(this),this.saveSettings=this.saveSettings.bind(this),this.resetSettings=this.resetSettings.bind(this),this.exportSettings=this.exportSettings.bind(this),this.importSettings=this.importSettings.bind(this)}async init(){try{console.log("⚙️ Inizializzazione pannello impostazioni..."),await this.loadSettings(),await this.validateAndFixSettings(),this.applySettings(),console.log("✅ Pannello impostazioni inizializzato")}catch(e){console.error("❌ Errore inizializzazione pannello impostazioni:",e)}}async validateAndFixSettings(){console.log("🔍 Verifica impostazioni...");let e=!1;const n={...this.currentSettings};(!n.defaultLaunchMode||!["iframe","newpage"].includes(n.defaultLaunchMode))&&(console.log('⚠️ defaultLaunchMode non valido, correzione a "newpage"'),n.defaultLaunchMode="newpage",e=!0);const i={maxConcurrentApps:{min:1,max:10,default:5},autoSyncInterval:{min:5,max:1440,default:60},language:{valid:["it","en"],default:"it"},theme:{valid:["light","dark","auto"],default:"auto"}};for(const[a,s]of Object.entries(i)){const r=n[a];s.min!==void 0&&s.max!==void 0?(typeof r!="number"||r<s.min||r>s.max)&&(console.log(`⚠️ ${a} non valido (${r}), correzione a ${s.default}`),n[a]=s.default,e=!0):s.valid&&(s.valid.includes(r)||(console.log(`⚠️ ${a} non valido (${r}), correzione a ${s.default}`),n[a]=s.default,e=!0))}if(e){console.log("💾 Salvataggio correzioni impostazioni..."),this.currentSettings=n;for(const[a,s]of Object.entries(n))await y.setSetting(a,s);console.log("✅ Impostazioni corrette salvate")}else console.log("✅ Tutte le impostazioni sono valide")}async loadSettings(){try{const e=await y.getAllSettings();this.currentSettings={...this.defaultSettings,...e}}catch(e){console.error("Errore caricamento impostazioni:",e),this.currentSettings={...this.defaultSettings}}}applySettings(){this.applyTheme(this.currentSettings.theme),this.applyLanguage(this.currentSettings.language),this.applyAnimations(this.currentSettings.enableAnimations),this.applyCompactMode(this.currentSettings.compactMode),this.applyDebugMode(this.currentSettings.enableDebugMode)}showModal(){const e=this.createSettingsModal();N("settings-modal",e,{size:"modal-xl",disableBackdropClose:!1}),setTimeout(()=>{this.setupModalEventListeners(),this.populateForm(),this.markDisabledFeatures(),this.showSection("general")},100)}createSettingsModal(){return`
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
    `}markDisabledFeatures(){const e=document.getElementById("settings-modal");e&&Object.entries(this.disabledFeatures).forEach(([n,i])=>{if(i){const a=e.querySelector(`#setting-${this.camelToKebab(n)}-container`),s=e.querySelector(`#setting-${this.camelToKebab(n)}`);a&&a.classList.add("disabled"),s&&(s.disabled=!0,s.checked=!1)}})}setupModalEventListeners(){const e=document.getElementById("settings-modal");if(!e)return;e.querySelectorAll(".settings-nav-btn").forEach(i=>{i.addEventListener("click",()=>{const a=i.dataset.section;this.showSection(a)})}),e.querySelector("#export-settings-btn")?.addEventListener("click",()=>{this.exportSettings()}),e.querySelector("#import-settings-btn")?.addEventListener("click",()=>{this.importSettings()}),e.querySelector("#reset-settings-btn")?.addEventListener("click",()=>{this.resetSettings()}),e.querySelector("#clear-cache-btn")?.addEventListener("click",()=>{this.clearCache()}),e.querySelector("#clear-all-data-btn")?.addEventListener("click",()=>{this.clearAllData()}),e.querySelector("#cancel-settings")?.addEventListener("click",()=>{k("settings-modal")}),e.querySelector("#save-settings")?.addEventListener("click",()=>{this.saveSettings()}),e.querySelector("#setting-theme")?.addEventListener("change",i=>{this.applyTheme(i.target.value)}),e.querySelector("#setting-enableAnimations")?.addEventListener("change",i=>{this.applyAnimations(i.target.checked)}),e.querySelector("#setting-compactMode")?.addEventListener("change",i=>{this.applyCompactMode(i.target.checked)}),this.loadStorageStats(),this.loadSystemInfo()}showSection(e){const n=document.getElementById("settings-modal");if(!n)return;n.querySelectorAll(".settings-section").forEach(r=>{r.style.display="none",r.classList.remove("active")});const a=n.querySelector(`#section-${e}`);a&&(a.style.display="block",a.classList.add("active")),n.querySelectorAll(".settings-nav-btn").forEach(r=>{r.classList.remove("active"),r.dataset.section===e&&r.classList.add("active")})}populateForm(){const e=document.getElementById("settings-modal");if(!e)return;const n={language:"setting-language",theme:"setting-theme",showWelcomeMessage:"setting-showWelcomeMessage",enableKeyboardShortcuts:"setting-enableKeyboardShortcuts",defaultLaunchMode:"setting-defaultLaunchMode",maxConcurrentApps:"setting-maxConcurrentApps",autoUpdateApps:"setting-autoUpdateApps",validateAppsOnLaunch:"setting-validateAppsOnLaunch",sandboxMode:"setting-sandboxMode",viewMode:"setting-viewMode",sortBy:"setting-sortBy",compactMode:"setting-compactMode",enableAnimations:"setting-enableAnimations",showAppTooltips:"setting-showAppTooltips",syncEnabled:"setting-syncEnabled",syncProvider:"setting-syncProvider",autoSyncInterval:"setting-autoSyncInterval",backupBeforeSync:"setting-backupBeforeSync",analyticsEnabled:"setting-analyticsEnabled",crashReportingEnabled:"setting-crashReportingEnabled",allowTelemetry:"setting-allowTelemetry",enableServiceWorker:"setting-enableServiceWorker",cacheStrategy:"setting-cacheStrategy",preloadApps:"setting-preloadApps",lazyLoadImages:"setting-lazyLoadImages",enableDebugMode:"setting-enableDebugMode",showConsoleErrors:"setting-showConsoleErrors",enableExperimentalFeatures:"setting-enableExperimentalFeatures"};for(const[i,a]of Object.entries(this.currentSettings)){const s=n[i];if(s){const r=e.querySelector(`#${s}`);r&&!r.disabled&&(r.type==="checkbox"?r.checked=!!a:r.value=a)}}}async saveSettings(){try{const e=this.collectFormData();this.currentSettings={...this.currentSettings,...e};for(const[n,i]of Object.entries(this.currentSettings))await y.setSetting(n,i);this.applySettings(),k("settings-modal"),m("Impostazioni salvate con successo","success"),this.requiresReload(e)&&await V({title:"Ricarica Pagina",message:"Alcune modifiche richiedono il ricaricamento della pagina. Ricaricare ora?",icon:"info",confirmText:"Ricarica",cancelText:"Più tardi",type:"default"})&&window.location.reload()}catch(e){console.error("Errore salvataggio impostazioni:",e),m("Errore durante il salvataggio delle impostazioni","error")}}collectFormData(){const e={},n=document.getElementById("settings-modal");if(!n)return e;const i={"setting-language":"language","setting-theme":"theme","setting-showWelcomeMessage":"showWelcomeMessage","setting-enableKeyboardShortcuts":"enableKeyboardShortcuts","setting-defaultLaunchMode":"defaultLaunchMode","setting-maxConcurrentApps":"maxConcurrentApps","setting-autoUpdateApps":"autoUpdateApps","setting-validateAppsOnLaunch":"validateAppsOnLaunch","setting-sandboxMode":"sandboxMode","setting-viewMode":"viewMode","setting-sortBy":"sortBy","setting-compactMode":"compactMode","setting-enableAnimations":"enableAnimations","setting-showAppTooltips":"showAppTooltips","setting-syncEnabled":"syncEnabled","setting-syncProvider":"syncProvider","setting-autoSyncInterval":"autoSyncInterval","setting-backupBeforeSync":"backupBeforeSync","setting-analyticsEnabled":"analyticsEnabled","setting-crashReportingEnabled":"crashReportingEnabled","setting-allowTelemetry":"allowTelemetry","setting-enableServiceWorker":"enableServiceWorker","setting-cacheStrategy":"cacheStrategy","setting-preloadApps":"preloadApps","setting-lazyLoadImages":"lazyLoadImages","setting-enableDebugMode":"enableDebugMode","setting-showConsoleErrors":"showConsoleErrors","setting-enableExperimentalFeatures":"enableExperimentalFeatures"};return n.querySelectorAll('input[id^="setting-"], select[id^="setting-"], textarea[id^="setting-"]').forEach(s=>{const r=s.id,o=i[r];o&&!s.disabled&&(s.type==="checkbox"?e[o]=s.checked:s.type==="number"?e[o]=parseInt(s.value)||0:e[o]=s.value)}),e}applyTheme(e){const n=document.documentElement;if(e==="auto"){const i=window.matchMedia("(prefers-color-scheme: dark)").matches;n.setAttribute("data-theme",i?"dark":"light")}else n.setAttribute("data-theme",e)}applyLanguage(e){document.documentElement.setAttribute("lang",e)}applyAnimations(e){const n=document.documentElement;e?n.classList.remove("no-animations"):n.classList.add("no-animations")}applyCompactMode(e){const n=document.documentElement;e?n.classList.add("compact-mode"):n.classList.remove("compact-mode")}applyDebugMode(e){const n=document.documentElement;e?n.classList.add("debug-mode"):n.classList.remove("debug-mode")}async resetSettings(){if(await V({title:"Reset Impostazioni",message:"Sei sicuro di voler ripristinare tutte le impostazioni ai valori predefiniti?",icon:"warning",confirmText:"Reset",cancelText:"Annulla",type:"default"}))try{this.currentSettings={...this.defaultSettings};for(const[n,i]of Object.entries(this.currentSettings))await y.setSetting(n,i);this.populateForm(),this.applySettings(),m("Impostazioni ripristinate ai valori predefiniti","success")}catch(n){console.error("Errore reset impostazioni:",n),m("Errore durante il ripristino delle impostazioni","error")}}async exportSettings(){try{const e={version:"1.0.0",timestamp:new Date().toISOString(),settings:this.currentSettings,deviceInfo:Hn()},n=new Blob([JSON.stringify(e,null,2)],{type:"application/json"}),i=URL.createObjectURL(n),a=document.createElement("a");a.href=i,a.download=`sakai-settings-${new Date().toISOString().split("T")[0]}.json`,document.body.appendChild(a),a.click(),document.body.removeChild(a),URL.revokeObjectURL(i),m("Impostazioni esportate con successo","success")}catch(e){console.error("Errore export impostazioni:",e),m("Errore durante l'esportazione delle impostazioni","error")}}importSettings(){const e=document.createElement("input");e.type="file",e.accept=".json",e.onchange=async n=>{try{const i=n.target.files[0];if(!i)return;const a=await i.text(),s=JSON.parse(a);if(!s.settings||!s.version)throw new Error("Formato file non valido");this.currentSettings={...this.defaultSettings,...s.settings};for(const[r,o]of Object.entries(this.currentSettings))await y.setSetting(r,o);this.populateForm(),this.applySettings(),m("Impostazioni importate con successo","success")}catch(i){console.error("Errore import impostazioni:",i),m("Errore durante l'importazione delle impostazioni","error")}},e.click()}async clearCache(){try{if("caches"in window){const e=await caches.keys();await Promise.all(e.map(n=>caches.delete(n)))}m("Cache svuotata con successo","success"),this.loadStorageStats()}catch(e){console.error("Errore svuotamento cache:",e),m("Errore durante lo svuotamento della cache","error")}}async clearAllData(){if(!(!await V({title:"Elimina Tutti i Dati",message:"ATTENZIONE: Questa operazione eliminerà TUTTI i dati di SAKAI incluse app, impostazioni e cache. Continuare?",icon:"warning",confirmText:"Elimina",cancelText:"Annulla",type:"default"})||!await V({title:"Conferma Eliminazione",message:"Sei veramente sicuro? Questa operazione NON può essere annullata!",icon:"warning",confirmText:"Elimina",cancelText:"Annulla",type:"default"})))try{if(await y.close(),indexedDB.deleteDatabase("SAKAI_DB"),Object.keys(localStorage).forEach(i=>{i.startsWith("sakai_")&&localStorage.removeItem(i)}),"caches"in window){const i=await caches.keys();await Promise.all(i.map(a=>caches.delete(a)))}m("Tutti i dati sono stati eliminati","success"),setTimeout(()=>{window.location.reload()},2e3)}catch(i){console.error("Errore eliminazione dati:",i),m("Errore durante l'eliminazione dei dati","error")}}async loadStorageStats(){try{const e=document.getElementById("settings-modal");if(!e)return;const n=await y.getStats(),i=await y.getAllApps(),a=await y.estimateDbSize(),s=e.querySelector("#storage-used"),r=e.querySelector("#apps-count"),o=e.querySelector("#cache-size");if(s&&(s.textContent=re(a)),r&&(r.textContent=i.length.toString()),o){const c=n.cacheSize||0;o.textContent=re(c)}}catch(e){console.error("Errore caricamento statistiche storage:",e);const n=document.getElementById("settings-modal");n&&["storage-used","apps-count","cache-size"].forEach(a=>{const s=n.querySelector(`#${a}`);s&&(s.textContent="Errore caricamento")})}}loadSystemInfo(){try{const e=document.getElementById("settings-modal");if(!e)return;const n=e.querySelector("#user-agent"),i=e.querySelector("#platform"),a=e.querySelector("#pwa-support");if(n&&(n.textContent=navigator.userAgent.substring(0,50)+"..."),i&&(i.textContent=navigator.platform||"Sconosciuto"),a){const s="serviceWorker"in navigator,r="manifest"in document.createElement("link"),o="PushManager"in window,c=[];s&&c.push("Service Worker"),r&&c.push("Web App Manifest"),o&&c.push("Push Notifications"),a.textContent=c.length>0?c.join(", "):"Non supportato"}}catch(e){console.error("Errore caricamento informazioni sistema:",e);const n=document.getElementById("settings-modal");n&&["user-agent","platform","pwa-support"].forEach(a=>{const s=n.querySelector(`#${a}`);s&&(s.textContent="Errore caricamento")})}}camelToKebab(e){return e.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g,"$1-$2").toLowerCase()}kebabToCamel(e){return e.replace(/-([a-z])/g,n=>n[1].toUpperCase())}requiresReload(e){return["language","theme","enableServiceWorker","cacheStrategy"].some(i=>{const a=this.currentSettings[i],s=e[i];return a!==void 0&&a!==s})}getSetting(e,n=null){return this.currentSettings[e]!==void 0?this.currentSettings[e]:n}async setSetting(e,n){this.currentSettings[e]=n,await y.setSetting(e,n),this.applySettings()}}const nr="modulepreload",ir=function(t){return"/"+t},Ut={},ar=function(e,n,i){let a=Promise.resolve();if(n&&n.length>0){let c=function(l){return Promise.all(l.map(u=>Promise.resolve(u).then(f=>({status:"fulfilled",value:f}),f=>({status:"rejected",reason:f}))))};document.getElementsByTagName("link");const r=document.querySelector("meta[property=csp-nonce]"),o=r?.nonce||r?.getAttribute("nonce");a=c(n.map(l=>{if(l=ir(l),l in Ut)return;Ut[l]=!0;const u=l.endsWith(".css"),f=u?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${l}"]${f}`))return;const g=document.createElement("link");if(g.rel=u?"stylesheet":nr,u||(g.as="script"),g.crossOrigin="",g.href=l,o&&g.setAttribute("nonce",o),document.head.appendChild(g),u)return new Promise((v,b)=>{g.addEventListener("load",v),g.addEventListener("error",()=>b(new Error(`Unable to preload CSS for ${l}`)))})}))}function s(r){const o=new Event("vite:preloadError",{cancelable:!0});if(o.payload=r,window.dispatchEvent(o),!o.defaultPrevented)throw r}return a.then(r=>{for(const o of r||[])o.status==="rejected"&&s(o.reason);return e().catch(s)})},ye={enabled:localStorage.getItem("aideas_debug")==="true",verbose:localStorage.getItem("aideas_verbose_logging")==="true"};ye.enabled&&(window.AIdeas_DEV={async inspectStorage(){const t=await ar(()=>Promise.resolve().then(()=>kn),void 0).then(a=>a.default),e=await t.getStats(),n=await t.getAllApps(),i=await t.getAllSettings();console.group("🔍 AIdeas Storage Inspection"),console.log("Stats:",e),console.table(n),console.log("Settings:",i),console.groupEnd()},getPerformance(){return{timing:performance.timing,navigation:performance.navigation,memory:performance.memory}},getErrors(){return window.AIdeas_ERRORS||[]},clearAllData(){V({title:"Pulisci Dati",message:"Eliminare tutti i dati di AIdeas? Questa operazione non può essere annullata!",icon:"danger",confirmText:"Elimina",cancelText:"Annulla",type:"danger"}).then(t=>{t&&(localStorage.clear(),sessionStorage.clear(),indexedDB.deleteDatabase("aideas-db"),m("Tutti i dati eliminati","success"),setTimeout(()=>window.location.reload(),1e3))})},enableVerbose(){localStorage.setItem("aideas_verbose_logging","true"),ye.verbose=!0,console.log("Verbose logging enabled")},disableVerbose(){localStorage.removeItem("aideas_verbose_logging"),ye.verbose=!1,console.log("Verbose logging disabled")}});class ht{static init(){window.AIdeas_ERRORS=this.errors,window.addEventListener("error",e=>{this.trackError({type:"runtime",message:e.message,source:e.filename,lineno:e.lineno,colno:e.colno,stack:e.error?.stack,timestamp:new Date().toISOString()})}),window.addEventListener("unhandledrejection",e=>{this.trackError({type:"promise",message:e.reason?.message||"Unhandled Promise Rejection",stack:e.reason?.stack,timestamp:new Date().toISOString()})})}static trackError(e){this.errors.push(e),ye.enabled&&console.error("[AIdeas Error Tracker]",e),this.errors.length>100&&this.errors.shift()}static getErrors(){return this.errors}static clearErrors(){return this.errors=[],!0}}ft(ht,"errors",[]);ht.init();class sr{constructor(){this.currentView="all",this.currentSort="lastUsed",this.currentViewMode="grid",this.searchQuery="",this.apps=[],this.filteredApps=[],this.storage=y,this.appLauncher=new Un,this.appImporter=new Xs,this.settingsPanel=new tr,this.syncManager=new er,ht.init(),this.init=this.init.bind(this),this.setupEventListeners=this.setupEventListeners.bind(this),this.loadApps=this.loadApps.bind(this),this.renderApps=this.renderApps.bind(this),this.filterApps=this.filterApps.bind(this),this.handleSearch=this.handleSearch.bind(this),this.handleCategoryChange=this.handleCategoryChange.bind(this),this.handleSortChange=this.handleSortChange.bind(this),this.handleViewChange=this.handleViewChange.bind(this),this.showAppMenu=this.showAppMenu.bind(this)}async init(){try{console.log("🚀 Inizializzazione AIdeas..."),await this.storage.ensureDbOpen(),await this.verifyCriticalSettings(),localStorage.getItem("aideas_debug")==="true"&&await this.testSettings(),await this.appLauncher.init(),await this.appImporter.init(),await this.settingsPanel.init(),await this.syncManager.init(),this.syncManager.syncProviders&&this.syncManager.syncProviders.googledrive&&this.syncManager.syncProviders.googledrive.configure(void 0,void 0),await this.loadApps(),this.setupEventListeners(),this.hideLoadingScreen(),console.log("✅ AIdeas inizializzata con successo")}catch(e){console.error("❌ Errore inizializzazione AIdeas:",e),this.showErrorScreen(e)}}async verifyCriticalSettings(){console.log("🔍 Verifica impostazioni critiche...");const e=await this.storage.getSetting("defaultLaunchMode");(!e||!["iframe","newpage"].includes(e))&&(console.log('⚠️ defaultLaunchMode non valido, correzione a "newpage"'),await this.storage.setSetting("defaultLaunchMode","newpage"));const n={maxConcurrentApps:{min:1,max:10,default:5},language:{valid:["it","en"],default:"it"},theme:{valid:["light","dark","auto"],default:"auto"}};for(const[i,a]of Object.entries(n)){const s=await this.storage.getSetting(i);a.min!==void 0&&a.max!==void 0?(typeof s!="number"||s<a.min||s>a.max)&&(console.log(`⚠️ ${i} non valido (${s}), correzione a ${a.default}`),await this.storage.setSetting(i,a.default)):a.valid&&(a.valid.includes(s)||(console.log(`⚠️ ${i} non valido (${s}), correzione a ${a.default}`),await this.storage.setSetting(i,a.default)))}console.log("✅ Impostazioni critiche verificate")}showLoadingScreen(){const e=document.getElementById("loading-screen"),n=document.getElementById("app");e&&n&&(e.style.display="flex",n.style.display="none")}hideLoadingScreen(){const e=document.getElementById("loading-screen"),n=document.getElementById("app");e&&(e.style.opacity="0",setTimeout(()=>{e.style.display="none"},300)),n&&(n.style.display="block")}showErrorScreen(e){console.error("Errore critico:",e);const n=document.getElementById("loading-screen");n&&(n.innerHTML=`
        <div class="error-screen">
          <div class="error-icon">⚠️</div>
          <h1>Errore di Inizializzazione</h1>
          <p>Si è verificato un errore durante l'avvio dell'applicazione.</p>
          <p class="error-details">${e.message}</p>
          <button onclick="location.reload()" class="btn btn-primary">Riprova</button>
        </div>
      `)}async showWelcomeMessage(){await this.storage.getSetting("showWelcomeMessage",!0)&&m("Benvenuto in AIdeas! 🎉","success",3e3)}async initializeStorage(){try{const e=await y.getStats();console.log("📊 Database stats:",e)}catch(e){throw console.error("Errore inizializzazione storage:",e),e}}async loadUserSettings(){try{const e=await y.getAllSettings();this.currentViewMode=e.viewMode||"grid",this.currentSort=e.sortBy||"lastUsed",e.theme?document.documentElement.setAttribute("data-theme",e.theme):document.documentElement.setAttribute("data-theme","dark"),e.language&&document.documentElement.setAttribute("lang",e.language)}catch(e){console.error("Errore caricamento impostazioni:",e),document.documentElement.setAttribute("data-theme","dark")}}setupEventListeners(){const e=document.getElementById("sidebar-toggle"),n=document.getElementById("sidebar"),i=document.querySelector(".app-layout");e?.addEventListener("click",()=>{n?.classList.toggle("sidebar-open"),n?.classList.contains("sidebar-open")?i?.classList.remove("sidebar-collapsed"):i?.classList.add("sidebar-collapsed")});const a=document.getElementById("mobile-search-toggle"),s=document.getElementById("mobile-search-close"),r=document.querySelector(".search-container"),o=document.querySelector(".header-search"),c=document.getElementById("search-input");a?.addEventListener("click",()=>{o?.classList.toggle("search-active"),o?.classList.contains("search-active")&&setTimeout(()=>{c?.focus()},100)}),s?.addEventListener("click",()=>{o?.classList.remove("search-active"),c?.blur()}),document.addEventListener("click",C=>{!r?.contains(C.target)&&!a?.contains(C.target)&&o?.classList.remove("search-active")});const l=document.getElementById("search-input");l?.addEventListener("input",this.handleSearch),l?.addEventListener("keydown",C=>{C.key==="Escape"&&(o?.classList.remove("search-active"),l.blur())}),document.querySelectorAll("[data-category]").forEach(C=>{C.addEventListener("click",this.handleCategoryChange)}),document.getElementById("sort-select")?.addEventListener("change",this.handleSortChange),document.querySelectorAll(".view-btn").forEach(C=>{C.addEventListener("click",this.handleViewChange)}),document.querySelectorAll("#add-app-btn, #fab-add, #empty-add-btn").forEach(C=>{C.addEventListener("click",()=>this.showAddAppModal())}),document.getElementById("settings-btn")?.addEventListener("click",()=>{this.showSettingsModal()});const S=document.getElementById("user-btn"),O=document.getElementById("user-dropdown");S?.addEventListener("click",C=>{C.stopPropagation(),O?.classList.toggle("show")}),document.addEventListener("click",()=>{O?.classList.remove("show")}),document.getElementById("settings-link")?.addEventListener("click",C=>{C.preventDefault(),this.showSettingsModal()}),document.getElementById("export-link")?.addEventListener("click",C=>{C.preventDefault(),this.exportData()}),document.getElementById("import-link")?.addEventListener("click",C=>{C.preventDefault(),this.importData()}),document.getElementById("about-link")?.addEventListener("click",C=>{C.preventDefault(),this.showAboutModal()}),document.getElementById("sync-btn")?.addEventListener("click",()=>{this.syncManager.showSyncModal()}),document.getElementById("app-store-btn")?.addEventListener("click",()=>{this.showAppStoreModal()}),document.addEventListener("keydown",this.handleKeyboardShortcuts.bind(this)),window.addEventListener("resize",this.handleResize.bind(this)),document.addEventListener("click",C=>{!n?.contains(C.target)&&!e?.contains(C.target)&&(n?.classList.remove("sidebar-open"),i?.classList.add("sidebar-collapsed"))})}async loadApps(){try{this.apps=await y.getAllApps(),this.filterApps(),this.updateCategoryCounts()}catch(e){console.error("Errore caricamento apps:",e),m("Errore durante il caricamento delle app","error")}}filterApps(){let e=[...this.apps];if(this.currentView==="favorites")e=e.filter(n=>n.favorite);else if(this.currentView==="recent"){const n=new Date;n.setDate(n.getDate()-30),e=e.filter(i=>new Date(i.lastUsed)>n)}else this.currentView!=="all"&&(e=e.filter(n=>n.category===this.currentView));if(this.searchQuery){const n=this.searchQuery.toLowerCase();e=e.filter(i=>i.name.toLowerCase().includes(n)||i.description.toLowerCase().includes(n)||i.tags.some(a=>a.toLowerCase().includes(n)))}e.sort((n,i)=>{switch(this.currentSort){case"name":return n.name.localeCompare(i.name);case"installDate":return new Date(i.installDate)-new Date(n.installDate);case"category":return n.category.localeCompare(i.category);case"lastUsed":default:return new Date(i.lastUsed)-new Date(n.lastUsed)}}),this.filteredApps=e,this.renderApps()}renderApps(){const e=document.getElementById("apps-grid"),n=document.getElementById("empty-state");if(e){if(e.className=`apps-${this.currentViewMode}`,this.filteredApps.length===0){e.style.display="none",n.style.display="flex";return}n.style.display="none",this.currentViewMode==="launcher"?(e.style.display="grid",e.innerHTML=this.filteredApps.map(i=>this.renderLauncherItem(i)).join("")):(e.style.display=this.currentViewMode==="list"?"flex":"grid",e.innerHTML=this.filteredApps.map(i=>Qs.render(i)).join("")),this.setupAppCardListeners()}}renderLauncherItem(e){const n=e.icon?`<img src="${e.icon}" alt="${e.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`:"",i=`
      <svg viewBox="0 0 24 24" fill="currentColor" style="display: ${e.icon?"none":"flex"};">
        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
      </svg>
    `,a=e.type?`
      <div class="app-launcher-badge">
        <svg viewBox="0 0 24 24" fill="currentColor">
          ${e.type==="pwa"?'<path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4Z"/>':e.type==="zip"?'<path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>':'<path d="M3.27,1L2,2.27L5.18,5.44L5.64,6H21L19.73,7L21,8.27L19,10.27V20A1,1 0 0,1 18,21H6A1,1 0 0,1 5,20V10L3.27,8.27L1,6L2.28,4.73L3.27,1M7,18H17V10H7V18Z"/>'}
        </svg>
      </div>
    `:"";return`
      <div class="app-launcher-item" data-app-id="${e.id}" data-app-name="${e.name}">
        <div class="app-launcher-icon">
          ${n}
          ${i}
          ${a}
        </div>
        <div class="app-launcher-name">${e.name}</div>
      </div>
    `}setupAppCardListeners(){document.querySelectorAll(".app-card-launch").forEach(e=>{e.addEventListener("click",async n=>{n.stopPropagation();const i=parseInt(e.dataset.appId);await this.launchApp(i)})}),document.querySelectorAll(".app-card-favorite").forEach(e=>{e.addEventListener("click",async n=>{n.stopPropagation();const i=parseInt(e.dataset.appId);await this.toggleFavorite(i)})}),document.querySelectorAll(".app-card-menu").forEach(e=>{e.addEventListener("click",n=>{n.stopPropagation();const i=parseInt(e.dataset.appId);this.showAppMenu(i,n.target)})}),document.querySelectorAll(".app-card").forEach(e=>{e.addEventListener("click",async()=>{const n=parseInt(e.dataset.appId);await this.launchApp(n)})}),document.querySelectorAll(".app-launcher-item").forEach(e=>{let n,i=!1;e.addEventListener("click",async a=>{if(!i){const s=parseInt(e.dataset.appId);await this.launchApp(s)}i=!1}),e.addEventListener("mousedown",a=>{n=setTimeout(()=>{i=!0;const s=parseInt(e.dataset.appId);this.showLauncherAppInfo(s,e)},500)}),e.addEventListener("mouseup",()=>{clearTimeout(n)}),e.addEventListener("mouseleave",()=>{clearTimeout(n)}),e.addEventListener("touchstart",a=>{n=setTimeout(()=>{i=!0;const s=parseInt(e.dataset.appId);this.showLauncherAppInfo(s,e)},500)}),e.addEventListener("touchend",()=>{clearTimeout(n)}),e.addEventListener("touchcancel",()=>{clearTimeout(n)})})}async launchApp(e){try{const n=await y.getApp(e);if(!n){m("App non trovata","error");return}await y.updateLastUsed(e),await this.appLauncher.launch(n),await this.loadApps()}catch(n){console.error("Errore lancio app:",n),m("Errore durante il lancio dell'app","error")}}async toggleFavorite(e){try{const n=await y.toggleFavorite(e);m(n?"Aggiunta ai preferiti":"Rimossa dai preferiti","success"),await this.loadApps()}catch(n){console.error("Errore toggle favorite:",n),m("Errore durante l'operazione","error")}}handleSearch(e){this.searchQuery=e.target.value.trim(),this.filterApps()}handleCategoryChange(e){e.preventDefault();const n=e.target.dataset.category||e.target.closest("[data-category]").dataset.category;document.querySelectorAll(".nav-link").forEach(a=>{a.classList.remove("active")});const i=e.target.closest(".nav-link");i&&i.classList.add("active"),this.currentView=n,this.updateSectionTitle(),this.filterApps()}handleSortChange(e){this.currentSort=e.target.value,y.setSetting("sortBy",this.currentSort),this.filterApps()}handleViewChange(e){const n=e.target.dataset.view||e.target.closest("[data-view]").dataset.view;document.querySelectorAll(".view-btn[data-view]").forEach(a=>{a.classList.remove("active")});const i=e.target.closest(".view-btn[data-view]");i&&i.classList.add("active"),this.currentViewMode=n,y.setSetting("viewMode",this.currentViewMode),this.renderApps()}handleKeyboardShortcuts(e){(e.ctrlKey||e.metaKey)&&e.key==="k"&&(e.preventDefault(),document.getElementById("search-input")?.focus()),(e.ctrlKey||e.metaKey)&&e.key==="n"&&(e.preventDefault(),this.showAddAppModal()),e.key==="Escape"&&this.closeAllModals()}handleResize(){const e=document.getElementById("sidebar"),n=document.querySelector(".app-layout");window.innerWidth>768||e?.classList.contains("sidebar-open")&&(e.classList.remove("sidebar-open"),n?.classList.add("sidebar-collapsed"))}updateSectionTitle(){const e=document.getElementById("section-title"),n=document.getElementById("section-subtitle"),a={all:{title:"Tutte le App",subtitle:"Gestisci le tue applicazioni web"},favorites:{title:"App Preferite",subtitle:"Le tue app più amate"},recent:{title:"App Recenti",subtitle:"Utilizzate negli ultimi 30 giorni"}}[this.currentView]||{title:this.currentView.charAt(0).toUpperCase()+this.currentView.slice(1),subtitle:`App della categoria ${this.currentView}`};e&&(e.textContent=a.title),n&&(n.textContent=a.subtitle)}updateCategoryCounts(){const e=document.getElementById("all-count");e&&(e.textContent=this.apps.length);const n=document.getElementById("favorites-count"),i=this.apps.filter(a=>a.favorite).length;n&&(n.textContent=i),this.updateDynamicCategories()}updateDynamicCategories(){const e=document.getElementById("dynamic-categories");if(!e)return;const n=new Map;this.apps.forEach(a=>{const s=a.category||"uncategorized";n.set(s,(n.get(s)||0)+1)});const i=Array.from(n.entries()).sort(([a],[s])=>a.localeCompare(s)).map(([a,s])=>`
        <li class="nav-item">
          <a href="#" class="nav-link" data-category="${a}">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z"/>
            </svg>
            ${a}
            <span class="nav-badge">${s}</span>
          </a>
        </li>
      `).join("");e.innerHTML=i,e.querySelectorAll("[data-category]").forEach(a=>{a.addEventListener("click",this.handleCategoryChange)})}showAddAppModal(){console.log("🔧 Tentativo apertura modal aggiungi app..."),this.appImporter&&typeof this.appImporter.showModal=="function"?this.appImporter.showModal():(console.error("❌ AppImporter non disponibile o showModal non è una funzione"),m("Errore: componente importazione non disponibile","error"))}showSettingsModal(){this.settingsPanel.showModal()}showAboutModal(){N("about-modal",`
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
    `)}showAppStoreModal(){N("app-store-modal",`
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
    `)}async exportData(){try{const e=await y.exportAllData(),n=new Blob([JSON.stringify(e,null,2)],{type:"application/json"}),i=URL.createObjectURL(n),a=document.createElement("a");a.href=i,a.download=`aideas-backup-${new Date().toISOString().split("T")[0]}.json`,document.body.appendChild(a),a.click(),document.body.removeChild(a),URL.revokeObjectURL(i),m("Dati esportati con successo","success")}catch(e){console.error("Errore export:",e),m("Errore durante l'esportazione","error")}}importData(){const e=document.createElement("input");e.type="file",e.accept=".json",e.onchange=async n=>{try{const i=n.target.files[0];if(!i)return;const a=await i.text(),s=JSON.parse(a);await y.importData(s),await this.loadApps(),m("Dati importati con successo","success")}catch(i){console.error("Errore import:",i),m("Errore durante l'importazione","error")}},e.click()}async initializeComponents(){await this.appImporter.init(),await this.settingsPanel.init()}async initializeSync(){}async checkFirstRun(){await y.getSetting("firstRun",!0)&&(await y.setSetting("firstRun",!1),m("Benvenuto in AIdeas! Inizia aggiungendo la tua prima app.","info",5e3))}updateUI(){this.updateSectionTitle(),this.updateCategoryCounts(),document.querySelectorAll(".view-btn[data-view]").forEach(s=>{s.classList.remove("active")});const e=document.querySelector(`[data-view="${this.currentViewMode}"]`);e&&e.classList.add("active");const n=document.getElementById("sort-select");n&&(n.value=this.currentSort);const i=document.getElementById("sidebar"),a=document.querySelector(".app-layout");i&&a&&(i.classList.contains("sidebar-open")?a.classList.remove("sidebar-collapsed"):a.classList.add("sidebar-collapsed"))}closeAllModals(){document.querySelectorAll(".modal").forEach(e=>{k(e.id)})}showError(e){m(e,"error")}async showAppMenu(e,n){const i=await y.getApp(e);if(!i)return;const a=`
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
    `;document.querySelectorAll(".app-context-menu").forEach(g=>g.remove());const s=document.createElement("div");s.innerHTML=a,document.body.appendChild(s.firstElementChild);const r=document.querySelector(".app-context-menu"),o=n.getBoundingClientRect(),c=r.getBoundingClientRect();let l=o.bottom+window.scrollY+4,u=o.left+window.scrollX;l+c.height>window.innerHeight+window.scrollY&&(l=o.top+window.scrollY-c.height-4),u+c.width>window.innerWidth+window.scrollX&&(u=o.right+window.scrollX-c.width),r.style.top=`${l}px`,r.style.left=`${u}px`;const f=g=>{r.contains(g.target)||(r.remove(),document.removeEventListener("mousedown",f))};setTimeout(()=>document.addEventListener("mousedown",f),10),r.querySelector('[data-action="edit"]').addEventListener("click",async()=>{r.remove(),await this.showEditAppModal(i)}),r.querySelector('[data-action="delete"]').addEventListener("click",async()=>{r.remove(),await zn(i.name)&&(await y.deleteApp(e),m("App eliminata","success"),this.loadApps())})}async showEditAppModal(e){const n={...e},i=`
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
    `;N("edit-app-modal",i,{size:"modal-md"}),setTimeout(()=>{document.getElementById("cancel-edit-app")?.addEventListener("click",()=>{k("edit-app-modal")}),document.getElementById("close-edit-modal")?.addEventListener("click",()=>{k("edit-app-modal")}),document.getElementById("save-edit-app").addEventListener("click",async a=>{a.preventDefault();const s={name:document.getElementById("edit-app-name").value.trim(),description:document.getElementById("edit-app-description").value.trim(),version:document.getElementById("edit-app-version").value.trim(),category:document.getElementById("edit-app-category").value.trim(),tags:document.getElementById("edit-app-tags").value.split(",").map(o=>o.trim()).filter(Boolean),icon:document.getElementById("edit-app-icon").value.trim()},r=document.getElementById("edit-app-launch-mode");if(r&&r.value?(s.metadata||(s.metadata={}),s.metadata.launchMode=r.value):n.metadata?.launchMode&&(s.metadata||(s.metadata={}),s.metadata.launchMode=null),!s.name){m("Il nome è obbligatorio","error");return}await y.updateApp(e.id,s),k("edit-app-modal"),m("App modificata con successo","success"),await this.loadApps()})},200)}async showLauncherAppInfo(e,n){const i=await y.getApp(e);if(!i)return;const a=`
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
    `,s=N("launcher-app-info",a,{size:"modal-md",disableBackdropClose:!1,disableEscapeClose:!1});s.querySelector("#launch-app-btn")?.addEventListener("click",async()=>{k("launcher-app-info"),await this.launchApp(e)}),s.querySelector("#edit-app-btn")?.addEventListener("click",async()=>{k("launcher-app-info"),await this.showEditAppModal(i)})}async testSettings(){console.log("🧪 Test impostazioni...");try{const e="test_setting",n="test_value_"+Date.now();await this.storage.setSetting(e,n);const i=await this.storage.getSetting(e);console.log(i===n?"✅ Test salvataggio/caricamento impostazioni: PASS":"❌ Test salvataggio/caricamento impostazioni: FAIL"),await this.storage.setSetting(e,null);const a=await this.storage.getAllSettings();console.log("📋 Impostazioni attuali:",a);const s=["defaultLaunchMode","language","theme"];for(const r of s){const o=await this.storage.getSetting(r);console.log(`🔍 ${r}: ${o}`)}}catch(e){console.error("❌ Errore test impostazioni:",e)}}}document.addEventListener("DOMContentLoaded",async()=>{const t=new sr;window.aideasApp=t,await t.init()});window.addEventListener("error",t=>{console.error("Errore globale:",t.error),m("Si è verificato un errore imprevisto","error")});window.addEventListener("unhandledrejection",t=>{console.error("Promise rejections non gestita:",t.reason),m("Errore durante un'operazione asincrona","error")});
//# sourceMappingURL=main-BCY9yISv.js.map
