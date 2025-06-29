var Cn=Object.defineProperty;var wn=(t,e,n)=>e in t?Cn(t,e,{enumerable:!0,configurable:!0,writable:!0,value:n}):t[e]=n;var pe=(t,e,n)=>wn(t,typeof e!="symbol"?e+"":e,n);import{D as Ln,g as He,r as Sn}from"./vendor-B9NWz7lO.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const r of s)if(r.type==="childList")for(const a of r.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&i(a)}).observe(document,{childList:!0,subtree:!0});function n(s){const r={};return s.integrity&&(r.integrity=s.integrity),s.referrerPolicy&&(r.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?r.credentials="include":s.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function i(s){if(s.ep)return;s.ep=!0;const r=n(s);fetch(s.href,r)}})();class st{constructor(){if(st.instance)return st.instance;this.db=new Ln("AIdeas_DB"),this.initDatabase(),st.instance=this}initDatabase(){this.db.version(1).stores({apps:"++id, name, description, category, version, url, type, githubUrl, installDate, lastUsed, favorite, *tags",appFiles:"++id, appId, filename, content, size, mimeType",settings:"key, value, lastModified",syncEvents:"++id, timestamp, action, data, synced, deviceId",catalog:"++id, name, description, author, githubUrl, rating, downloads, featured, *categories"}),this.db.apps.hook("creating",(e,n,i)=>{n.installDate=n.installDate||new Date,n.lastUsed=n.lastUsed||new Date,n.favorite=n.favorite||!1,n.tags=n.tags||[]}),this.db.syncEvents.hook("creating",(e,n,i)=>{n.timestamp=n.timestamp||new Date,n.synced=n.synced||!1,n.deviceId=n.deviceId||this.getDeviceId()})}async installApp(e){try{const n={name:e.name,description:e.description||"",category:e.category||"uncategorized",version:e.version||"1.0.0",url:e.url||null,type:e.type,githubUrl:e.githubUrl||null,icon:e.icon||null,manifest:e.manifest||{},permissions:e.permissions||[],tags:e.tags||[],metadata:e.metadata||{},content:e.content||null},i=await this.db.apps.add(n);return e.files&&e.files.length>0&&await this.saveAppFiles(i,e.files),await this.addSyncEvent("app_installed",{appId:i,app:n}),i}catch(n){throw console.error("Errore installazione app:",n),new Error(`Impossibile installare l'app: ${n.message}`)}}async getAllApps(e={}){try{let n=this.db.apps.orderBy("lastUsed").reverse();return e.category&&(n=n.filter(i=>i.category===e.category)),e.search&&(n=n.filter(i=>i.name.toLowerCase().includes(e.search.toLowerCase())||i.description.toLowerCase().includes(e.search.toLowerCase())||i.tags.some(s=>s.toLowerCase().includes(e.search.toLowerCase())))),e.favorite&&(n=n.filter(i=>i.favorite===!0)),await n.toArray()}catch(n){return console.error("Errore recupero app:",n),[]}}async getApp(e){try{return await this.db.apps.get(e)}catch(n){return console.error("Errore recupero app:",n),null}}async updateApp(e,n){try{return await this.db.apps.update(e,n),await this.addSyncEvent("app_updated",{appId:e,updates:n}),!0}catch(i){return console.error("Errore aggiornamento app:",i),!1}}async migrateAppsForContent(){try{console.log("🔄 Inizio migrazione app HTML...");const e=await this.db.apps.toArray();console.log(`📊 Trovate ${e.length} app totali`);let n=0;for(const i of e)if(console.log(`🔍 Controllo app: ${i.name} (tipo: ${i.type})`),i.type==="html"&&!i.content){console.log(`📝 App HTML senza contenuto trovata: ${i.name}`);const s=await this.getAppFiles(i.id);console.log(`📁 Trovati ${s.length} file per app ${i.name}`);const r=s.find(a=>a.filename.endsWith(".html"));r?(console.log(`✅ File HTML trovato: ${r.filename}`),await this.db.apps.update(i.id,{content:r.content}),n++,console.log(`✅ App ${i.name} migrata con successo`)):console.log(`⚠️ Nessun file HTML trovato per app ${i.name}`)}return n>0?console.log(`✅ Migrate ${n} app HTML per aggiungere campo content`):console.log("ℹ️ Nessuna app HTML da migrare"),n}catch(e){return console.error("❌ Errore migrazione app:",e),console.error("Stack trace:",e.stack),0}}async deleteApp(e){try{return await this.db.transaction("rw",[this.db.apps,this.db.appFiles],async()=>{await this.db.apps.delete(e),await this.db.appFiles.where("appId").equals(e).delete()}),await this.addSyncEvent("app_deleted",{appId:e}),!0}catch(n){return console.error("Errore eliminazione app:",n),!1}}async updateLastUsed(e){try{await this.db.apps.update(e,{lastUsed:new Date})}catch(n){console.error("Errore aggiornamento ultimo utilizzo:",n)}}async toggleFavorite(e){try{const n=await this.db.apps.get(e);return n?(await this.db.apps.update(e,{favorite:!n.favorite}),!n.favorite):!1}catch(n){return console.error("Errore toggle preferito:",n),!1}}async saveAppFiles(e,n){try{const i=n.map(s=>this.db.appFiles.add({appId:e,filename:s.filename,content:s.content,size:s.size||s.content.length,mimeType:s.mimeType||this.getMimeType(s.filename)}));return await Promise.all(i),!0}catch(i){return console.error("Errore salvataggio file app:",i),!1}}async getAppFiles(e){try{return await this.db.appFiles.where("appId").equals(e).toArray()}catch(n){return console.error("Errore recupero file app:",n),[]}}async getSetting(e,n=null){try{const i=await this.db.settings.get(e);return i?i.value:n}catch(i){return console.error("Errore recupero impostazione:",i),n}}async setSetting(e,n){try{return await this.db.settings.put({key:e,value:n,lastModified:new Date}),!0}catch(i){return console.error("Errore salvataggio impostazione:",i),!1}}async getAllSettings(){try{const e=await this.db.settings.toArray(),n={};return e.forEach(i=>{n[i.key]=i.value}),n}catch(e){return console.error("Errore recupero impostazioni:",e),{}}}async addSyncEvent(e,n){try{await this.db.syncEvents.add({action:e,data:n,timestamp:new Date,synced:!1,deviceId:await this.getDeviceId()})}catch(i){console.error("Errore aggiunta evento sync:",i)}}async getUnsyncedEvents(){try{return await this.db.syncEvents.where("synced").equals(!1).toArray()}catch(e){return console.error("Errore recupero eventi non sincronizzati:",e),[]}}async markEventsSynced(e){try{await this.db.syncEvents.where("id").anyOf(e).modify({synced:!0})}catch(n){console.error("Errore aggiornamento eventi sync:",n)}}async updateCatalog(e){try{return await this.db.catalog.clear(),await this.db.catalog.bulkAdd(e),!0}catch(n){return console.error("Errore aggiornamento catalogo:",n),!1}}async searchCatalog(e,n={}){try{let i=this.db.catalog.orderBy("downloads").reverse();return e&&(i=i.filter(s=>s.name.toLowerCase().includes(e.toLowerCase())||s.description.toLowerCase().includes(e.toLowerCase())||s.categories.some(r=>r.toLowerCase().includes(e.toLowerCase())))),n.category&&(i=i.filter(s=>s.categories.includes(n.category))),n.featured&&(i=i.filter(s=>s.featured===!0)),await i.limit(n.limit||50).toArray()}catch(i){return console.error("Errore ricerca catalogo:",i),[]}}async getDeviceId(){let e=await this.getSetting("deviceId");return e||(e="device_"+Math.random().toString(36).substr(2,9)+"_"+Date.now(),await this.setSetting("deviceId",e)),e}getMimeType(e){const n=e.split(".").pop().toLowerCase();return{html:"text/html",css:"text/css",js:"application/javascript",json:"application/json",png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",gif:"image/gif",svg:"image/svg+xml",txt:"text/plain"}[n]||"application/octet-stream"}async exportAllData(){try{const[e,n,i]=await Promise.all([this.db.apps.toArray(),this.db.settings.toArray(),this.db.syncEvents.toArray()]);return{version:"1.0.0",timestamp:new Date().toISOString(),deviceId:await this.getDeviceId(),data:{apps:e,settings:n,syncEvents:i}}}catch(e){throw console.error("Errore export dati:",e),e}}async importData(e){try{if(!e.data)throw new Error("Formato dati non valido");const{apps:n,settings:i,syncEvents:s}=e.data;return await this.db.transaction("rw",[this.db.apps,this.db.settings,this.db.syncEvents],async()=>{n&&await this.db.apps.bulkPut(n),i&&await this.db.settings.bulkPut(i),s&&await this.db.syncEvents.bulkPut(s)}),!0}catch(n){throw console.error("Errore import dati:",n),n}}async ensureDbOpen(){if(!this.db.isOpen())try{await this.db.open(),console.log("📂 Database riaperto con successo")}catch(e){console.error("❌ Errore riapertura database:",e)}}async getStats(){try{if(await this.ensureDbOpen(),!this.db||!this.db.isOpen())return console.warn("Database non inizializzato"),null;const n=(await this.db.apps.toArray().catch(()=>[])).filter(l=>l&&typeof l=="object"),i=n.map(l=>l.category).filter(l=>typeof l=="string"&&l.length>0),s=n.filter(l=>l.favorite===!0).length,r=n.length,a=await this.db.appFiles.count().catch(()=>0),o=await this.db.settings.count().catch(()=>0),c=n.length>0?n.reduce((l,p)=>p.installDate&&(!l||new Date(p.installDate)>new Date(l))?p.installDate:l,null):null;return{totalApps:r,totalFiles:a,settingsCount:o,favoriteApps:s,categories:Array.from(new Set(i)).length,lastInstall:c,dbSize:await this.estimateDbSize()}}catch(e){return console.error("Errore recupero statistiche:",e),null}}async estimateDbSize(){try{return"storage"in navigator&&"estimate"in navigator.storage&&(await navigator.storage.estimate()).usage||0}catch{return 0}}async close(){this.db&&this.db.close()}}const C=new st,Tn=Object.freeze(Object.defineProperty({__proto__:null,default:C},Symbol.toStringTag,{value:"Module"}));let Mn=0;function v(t,e="info",n=4e3,i={}){const s=document.getElementById("toast-container");if(!s){console.warn("Toast container non trovato");return}const r=`toast-${++Mn}`,a=document.createElement("div");a.id=r,a.className=`toast toast-${e}`,a.setAttribute("role","alert"),a.setAttribute("aria-live","polite");const o={success:`<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
    </svg>`,error:`<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
    </svg>`,warning:`<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M13,13H11V7H13M12,17.3A1.3,1.3 0 0,1 10.7,16A1.3,1.3 0 0,1 12,14.7A1.3,1.3 0 0,1 13.3,16A1.3,1.3 0 0,1 12,17.3M15.73,3H8.27L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3Z"/>
    </svg>`,info:`<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
    </svg>`};a.innerHTML=`
    <div class="toast-icon">
      ${o[e]||o.info}
    </div>
    <div class="toast-content">
      <div class="toast-message">${N(t)}</div>
      ${i.action?`<button class="toast-action">${i.action}</button>`:""}
    </div>
    <button class="toast-close" aria-label="Chiudi notifica">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
      </svg>
    </button>
  `;const c=a.querySelector(".toast-close"),l=a.querySelector(".toast-action"),p=()=>{a.classList.add("toast-removing"),setTimeout(()=>{a.parentNode&&a.parentNode.removeChild(a)},300)};return c.addEventListener("click",p),l&&i.onAction&&l.addEventListener("click",()=>{i.onAction(),p()}),s.appendChild(a),requestAnimationFrame(()=>{a.classList.add("toast-show")}),n>0&&setTimeout(p,n),r}function xn(t){const e=document.getElementById(t);e&&e.querySelector(".toast-close").click()}function In(){document.querySelectorAll(".toast").forEach(e=>{e.querySelector(".toast-close").click()})}function he(t){t?xn(t):In()}function D(t,e,n={}){const i=document.getElementById("modals-container");if(!i){console.warn("Modals container non trovato");return}const s=document.getElementById(t);s&&s.remove();const r=document.createElement("div");r.id=t,r.className="modal",r.setAttribute("role","dialog"),r.setAttribute("aria-modal","true"),r.setAttribute("aria-labelledby",`${t}-title`),r.innerHTML=`
    <div class="modal-backdrop"></div>
    <div class="modal-dialog ${n.size||"modal-md"}">
      <div class="modal-content">
        ${e}
      </div>
    </div>
  `;const a=r.querySelector(".modal-backdrop"),o=r.querySelectorAll(".modal-close"),c=f=>{f&&f.preventDefault(),r.classList.add("modal-closing"),setTimeout(()=>{r.parentNode&&r.parentNode.removeChild(r),n.returnFocus&&n.returnFocus.focus()},300)};n.disableBackdropClose||a.addEventListener("click",c),o.forEach(f=>{f.addEventListener("click",c)});const l=f=>{f.key==="Escape"&&!n.disableEscapeClose&&(c(),document.removeEventListener("keydown",l))};document.addEventListener("keydown",l);const p=document.activeElement;return n.returnFocus=p,i.appendChild(r),requestAnimationFrame(()=>{r.classList.add("modal-show");const f=r.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');f.length>0&&f[0].focus()}),r}function B(t){const e=document.getElementById(t);if(e){const n=e.querySelector(".modal-close");n&&n.click()}}function N(t){const e=document.createElement("div");return e.textContent=t,e.innerHTML}function at(t,e=2){if(t===0)return"0 Bytes";const n=1024,i=e<0?0:e,s=["Bytes","KB","MB","GB","TB"],r=Math.floor(Math.log(t)/Math.log(n));return parseFloat((t/Math.pow(n,r)).toFixed(i))+" "+s[r]}function ht(t){const e=new Date(t);if(isNaN(e.getTime()))return"Data non valida";const i=new Date-e,s=Math.floor(i/1e3),r=Math.floor(s/60),a=Math.floor(r/60),o=Math.floor(a/24),c=Math.floor(o/7),l=Math.floor(o/30),p=Math.floor(o/365);return s<60?"Proprio ora":r<60?`${r} minut${r===1?"o":"i"} fa`:a<24?`${a} or${a===1?"a":"e"} fa`:o<7?`${o} giorn${o===1?"o":"i"} fa`:c<4?`${c} settiman${c===1?"a":"e"} fa`:l<12?`${l} mes${l===1?"e":"i"} fa`:`${p} ann${p===1?"o":"i"} fa`}function Rn(t="id"){return`${t}-${Math.random().toString(36).substr(2,9)}-${Date.now()}`}function On(){return window.innerWidth<=768||/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)}function Bn(){return"serviceWorker"in navigator&&"manifests"in window}function Pn(){return{userAgent:navigator.userAgent,platform:navigator.platform,language:navigator.language,online:navigator.onLine,cookieEnabled:navigator.cookieEnabled,screen:{width:screen.width,height:screen.height,colorDepth:screen.colorDepth},viewport:{width:window.innerWidth,height:window.innerHeight},isMobile:On(),isPWASupported:Bn()}}function fe(t){try{return new URL(t),!0}catch{return!1}}function ge(t){try{return new URL(t).hostname}catch{return""}}function V(t={}){return new Promise(e=>{const{title:n="Conferma",message:i="Sei sicuro di voler continuare?",icon:s="question",confirmText:r="Conferma",cancelText:a="Annulla",type:o="default"}=t,c=document.createElement("div");c.className="confirm-popup";const l={question:`<svg viewBox="0 0 24 24" fill="currentColor" class="confirm-popup-icon">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
      </svg>`,warning:`<svg viewBox="0 0 24 24" fill="currentColor" class="confirm-popup-icon">
        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
      </svg>`,danger:`<svg viewBox="0 0 24 24" fill="currentColor" class="confirm-popup-icon">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>`,info:`<svg viewBox="0 0 24 24" fill="currentColor" class="confirm-popup-icon">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
      </svg>`},p=l[s]||l.question,f=o==="danger"?"confirm-popup-btn-danger":"confirm-popup-btn-primary";c.innerHTML=`
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
            ${a}
          </button>
          <button class="confirm-popup-btn ${f}" data-action="confirm">
            ${r}
          </button>
        </div>
      </div>
    `;const g=b=>{document.body.removeChild(c),e(b==="confirm")};c.addEventListener("click",b=>{b.target===c&&g("cancel")}),c.querySelectorAll("[data-action]").forEach(b=>{b.addEventListener("click",S=>{S.preventDefault(),g(b.dataset.action)})});const m=b=>{b.key==="Escape"&&(document.removeEventListener("keydown",m),g("cancel"))};document.addEventListener("keydown",m),document.body.appendChild(c),setTimeout(()=>{c.querySelector(".confirm-popup-btn-secondary").focus()},100)})}function Nn(t){return V({title:"Elimina App",message:`Sei sicuro di voler eliminare "${t}"? Questa azione non può essere annullata.`,icon:"danger",confirmText:"Elimina",cancelText:"Annulla",type:"danger"})}class kn{constructor(){this.activeApps=new Map,this.launchHistory=[],this.maxConcurrentApps=5,this.launch=this.launch.bind(this),this.launchZipApp=this.launchZipApp.bind(this),this.launchUrlApp=this.launchUrlApp.bind(this),this.launchGitHubApp=this.launchGitHubApp.bind(this),this.launchPWA=this.launchPWA.bind(this),this.createSecureFrame=this.createSecureFrame.bind(this),this.closeApp=this.closeApp.bind(this),this.setupEventListeners=this.setupEventListeners.bind(this)}async init(){this.setupEventListeners(),await this.loadLaunchHistory()}async launch(e,n={}){try{console.log(`🚀 Launching app: ${e.name} (${e.type})`);const i=await C.getSetting("defaultLaunchMode","iframe"),s=e.metadata?.launchMode,r=n.forceMode||s||i;if(n.launchMode=r,r==="iframe"&&this.activeApps.size>=this.maxConcurrentApps&&!n.force&&!await this.showConcurrentAppsDialog())return;const a=await this.validateApp(e);if(!a.valid)throw new Error(a.error);const o=Rn("launch"),c=Date.now();v(`Caricamento ${e.name}...`,"info",0);let l;switch(e.type){case"zip":l=await this.launchZipApp(e,n);break;case"html":l=await this.launchHtmlApp(e,n);break;case"github":l=await this.launchGitHubApp(e,n);break;case"pwa":l=await this.launchPWA(e,n);break;default:l=await this.launchUrlApp(e,n)}return this.activeApps.set(o,{app:e,iframe:l,startTime:Date.now(),launchMode:r}),this.addToHistory(e,o),he(),l}catch(i){throw console.error("Errore lancio app:",i),he(),v(`Errore nel lancio di ${e.name}: ${i.message}`,"error"),i}}async launchZipApp(e,n={}){try{const i=await C.getAppFiles(e.id);if(!i.length)throw new Error("File dell'app non trovati");const s=this.findEntryPoint(i,e.manifest?.entryPoint);if(!s)throw new Error("Entry point non trovato");const r=new Map,a=new Map;for(const p of i){const f=new Blob([p.content],{type:p.mimeType}),g=URL.createObjectURL(f);r.set(p.filename,p),a.set(p.filename,g)}let o=s.content;o=this.replaceAllLocalPaths(o,a,e);const c=new Blob([o],{type:"text/html"}),l=URL.createObjectURL(c);if(n.launchMode==="newpage"){const p=window.open("",`aideas_zip_${e.id}_${Date.now()}`,"width=1200,height=800,scrollbars=yes,resizable=yes");if(!p)throw new Error("Popup bloccato dal browser. Consenti i popup per AIdeas.");p.document.write(o),p.document.close(),this.injectAIdeasAPI({contentWindow:p},e);const f=()=>{for(const g of a.values())URL.revokeObjectURL(g);URL.revokeObjectURL(l)};return p.addEventListener("beforeunload",f),{window:p,external:!0,cleanup:f}}else{const p=this.createSecureFrame(e,{src:l,sandbox:"allow-scripts allow-forms allow-modals allow-popups-to-escape-sandbox allow-same-origin",files:r,blobUrls:a});return p.addEventListener("unload",()=>{for(const f of a.values())URL.revokeObjectURL(f);URL.revokeObjectURL(l)}),{iframe:p,window:p.contentWindow,cleanup:()=>{for(const f of a.values())URL.revokeObjectURL(f);URL.revokeObjectURL(l)}}}}catch(i){throw console.error("Errore lancio app ZIP:",i),i}}async launchHtmlApp(e,n={}){try{if(!e.content)throw new Error("Contenuto HTML mancante");const i=new Blob([e.content],{type:"text/html"}),s=URL.createObjectURL(i);if(n.launchMode==="newpage"){const r=window.open("",`aideas_html_${e.id}_${Date.now()}`,"width=1200,height=800,scrollbars=yes,resizable=yes");if(!r)throw new Error("Popup bloccato dal browser. Consenti i popup per AIdeas.");r.document.write(e.content),r.document.close(),this.injectAIdeasAPI({contentWindow:r},e);const a=()=>{URL.revokeObjectURL(s)};return r.addEventListener("beforeunload",a),{window:r,external:!0,cleanup:a}}else{const r=this.createSecureFrame(e,{src:s,sandbox:"allow-scripts allow-forms allow-modals allow-popups-to-escape-sandbox allow-same-origin"});return r.addEventListener("unload",()=>{URL.revokeObjectURL(s)}),{iframe:r,window:r.contentWindow,cleanup:()=>{URL.revokeObjectURL(s)}}}}catch(i){throw console.error("Errore lancio app HTML:",i),i}}async launchUrlApp(e,n={}){try{if(!e.url)throw new Error("URL dell'app non specificato");let i=e.url;if(n.launchMode==="newpage"||n.forceNewWindow){const s=window.open(i,`aideas_app_${e.id}`,"width=1200,height=800,scrollbars=yes,resizable=yes");if(!s)throw new Error("Popup bloccato dal browser. Consenti i popup per AIdeas.");return{window:s,external:!0}}else if(await this.checkIframeCompatibility(i)){const r=this.createSecureFrame(e,{src:i,sandbox:"allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin"});return{iframe:r,window:r.contentWindow}}else{v("Questo sito non supporta iframe, apertura in nuova finestra","info");const r=window.open(i,`aideas_app_${e.id}`,"width=1200,height=800,scrollbars=yes,resizable=yes");if(!r)throw new Error("Popup bloccato dal browser. Consenti i popup per AIdeas.");return{window:r,external:!0,fallback:!0}}}catch(i){throw console.error("Errore lancio app URL:",i),i}}async launchGitHubApp(e,n={}){try{if(!e.githubUrl)throw new Error("URL GitHub non specificato");const i=this.parseGitHubUrl(e.githubUrl);if(!i)throw new Error("URL GitHub non valido");let s;e.metadata?.usePagesUrl?s=`https://${i.owner}.github.io/${i.repo}/`:s=`https://raw.githubusercontent.com/${i.owner}/${i.repo}/${i.branch||"main"}/index.html`;const r={...e,url:s,type:"url"};return await this.launchUrlApp(r,n)}catch(i){throw console.error("Errore lancio app GitHub:",i),i}}async launchPWA(e,n={}){try{if(!e.url)throw new Error("URL della PWA non specificato");const i=window.open(e.url,`aideas_pwa_${e.id}`,"width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,location=no,status=no,menubar=no");if(!i)throw new Error("Popup bloccato dal browser. Consenti i popup per AIdeas.");return"serviceWorker"in navigator&&e.manifest&&setTimeout(()=>{this.promptPWAInstall(e,i)},2e3),{window:i,external:!0,isPWA:!0}}catch(i){throw console.error("Errore lancio PWA:",i),i}}createSecureFrame(e,n={}){const i=`app-modal-${e.id}-${Date.now()}`,s=`
      <div class="modal-header">
        <div class="app-modal-title">
          <div class="app-modal-icon">
            ${e.icon?`<img src="${e.icon}" alt="${e.name}">`:"📱"}
          </div>
          <div>
            <h2>${N(e.name)}</h2>
            <p class="app-modal-subtitle">${N(e.description||"")}</p>
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
            <p>Caricamento ${N(e.name)}...</p>
          </div>
        </div>
      </div>
    `,r=D(i,s,{size:"modal-xl",disableBackdropClose:!1,disableEscapeClose:!1}),a=document.createElement("iframe");return a.className="app-frame",a.src=n.src,a.sandbox=n.sandbox||"allow-scripts allow-forms allow-modals",a.style.cssText=`
      width: 100%;
      height: 70vh;
      border: none;
      border-radius: 8px;
      background: white;
    `,a.addEventListener("load",()=>{const c=r.querySelector(".app-loading");c&&(c.style.display="none"),a.style.display="block",this.injectAIdeasAPI(a,e)}),a.addEventListener("error",()=>{const c=r.querySelector(".app-frame-container");c.innerHTML=`
        <div class="app-error">
          <div class="app-error-icon">⚠️</div>
          <h3>Errore di caricamento</h3>
          <p>Impossibile caricare l'applicazione.</p>
          <button class="btn btn-primary" onclick="location.reload()">Riprova</button>
        </div>
      `}),r.querySelector(".app-frame-container").appendChild(a),this.setupAppModalControls(r,a,e),a}setupAppModalControls(e,n,i){const s=e.querySelector(`#app-launch-mode-${i.id}`);s?.addEventListener("change",async()=>{const c=s.value;c!=="default"&&(await V({title:"Cambia Modalità",message:`Vuoi riaprire l'app in modalità "${c==="iframe"?"finestra modale":"nuova pagina"}"?`,icon:"question",confirmText:"Riapri",cancelText:"Annulla",type:"default"})?(B(e.id),await this.launch(i,{forceMode:c})):s.value="default")}),e.querySelector(`#app-refresh-${i.id}`)?.addEventListener("click",()=>{n.src=n.src,v("App ricaricata","info")}),e.querySelector(`#app-fullscreen-${i.id}`)?.addEventListener("click",()=>{e.requestFullscreen?e.requestFullscreen():e.webkitRequestFullscreen?e.webkitRequestFullscreen():e.msRequestFullscreen&&e.msRequestFullscreen()});const o=new MutationObserver(c=>{c.forEach(l=>{l.type==="childList"&&l.removedNodes.forEach(p=>{p===e&&(this.cleanupApp(i.id),o.disconnect())})})});o.observe(document.body,{childList:!0})}injectAIdeasAPI(e,n){try{const i=e.contentWindow;if(!i)return;i.AIdeas={app:{id:n.id,name:n.name,version:n.version},storage:{get:s=>localStorage.getItem(`aideas_app_${n.id}_${s}`),set:(s,r)=>localStorage.setItem(`aideas_app_${n.id}_${s}`,r),remove:s=>localStorage.removeItem(`aideas_app_${n.id}_${s}`),clear:()=>{const s=`aideas_app_${n.id}_`;Object.keys(localStorage).forEach(r=>{r.startsWith(s)&&localStorage.removeItem(r)})}},utils:{showNotification:(s,r="info")=>{v(`[${n.name}] ${s}`,r)},getUserPreferences:async()=>await C.getAllSettings(),openUrl:s=>{window.open(s,"_blank")},closeApp:()=>{this.closeApp(n.id)}},lifecycle:{onAppStart:s=>{typeof s=="function"&&setTimeout(s,100)},onAppPause:s=>{window.addEventListener("blur",s)},onAppResume:s=>{window.addEventListener("focus",s)}}},console.log(`✅ AIdeas API iniettata in ${n.name}`)}catch(i){console.warn("Impossibile iniettare AIdeas API:",i)}}findEntryPoint(e,n){if(n){const r=e.find(a=>a.filename===n);if(r)return r}const i=e.find(r=>r.filename==="index.html");if(i)return i;const s=e.find(r=>r.filename.endsWith(".html"));if(s)return s;throw new Error("Entry point HTML non trovato")}replaceAllLocalPaths(e,n,i){let s=e;const r=new Map;for(const[o,c]of n){r.set(o,c),r.set("./"+o,c),r.set("../"+o,c);const l=o.split("/");if(l.length>1){const p=l[l.length-1];r.has(p)||r.set(p,c)}}s=s.replace(/\bsrc\s*=\s*["']([^"']+)["']/gi,(o,c)=>{const l=this.cleanPath(c);return r.has(l)?o.replace(c,r.get(l)):o}),s=s.replace(/\bhref\s*=\s*["']([^"']+)["']/gi,(o,c)=>{const l=this.cleanPath(c);return r.has(l)&&!c.startsWith("#")&&!c.startsWith("mailto:")?o.replace(c,r.get(l)):o}),s=s.replace(/\bimport\s+.*?\s+from\s+["']([^"']+)["']/gi,(o,c)=>{const l=this.cleanPath(c);return r.has(l)?o.replace(c,r.get(l)):o}),s=s.replace(/\brequire\s*\(\s*["']([^"']+)["']\s*\)/gi,(o,c)=>{const l=this.cleanPath(c);return r.has(l)?o.replace(c,r.get(l)):o}),s=s.replace(/\burl\s*\(\s*["']?([^"')]+)["']?\s*\)/gi,(o,c)=>{const l=this.cleanPath(c);return r.has(l)?o.replace(c,r.get(l)):o}),s=s.replace(/\bfetch\s*\(\s*["']([^"']+)["']/gi,(o,c)=>{const l=this.cleanPath(c);return r.has(l)?o.replace(c,r.get(l)):o}),s=s.replace(/\bnew\s+URL\s*\(\s*["']([^"']+)["']/gi,(o,c)=>{const l=this.cleanPath(c);return r.has(l)?o.replace(c,r.get(l)):o}),s=s.replace(/["']([^"']*\.[a-zA-Z0-9]+)["']/gi,(o,c)=>{if(!c.includes("://")&&!c.startsWith("data:")&&!c.startsWith("#")){const l=this.cleanPath(c);if(r.has(l))return o.replace(c,r.get(l))}return o});const a=`
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="aideas-app" content="${N(i.name)}">
      <meta name="aideas-version" content="${i.version||"1.0.0"}">
      <meta name="aideas-type" content="zip">
      <base href="blob:">
    `;return s.includes("<head>")?s=s.replace("<head>","<head>"+a):s.includes("<html>")?s=s.replace("<html>","<html><head>"+a+"</head>"):s=a+s,s}cleanPath(e){if(!e)return"";let n=e.split("?")[0].split("#")[0];return n=n.replace(/\\/g,"/"),n=n.trim(),n}async checkIframeCompatibility(e){try{const n=await fetch(e,{method:"HEAD"}),i=n.headers.get("X-Frame-Options"),s=n.headers.get("Content-Security-Policy");return!(i&&(i.toLowerCase()==="deny"||i.toLowerCase()==="sameorigin")||s&&s.includes("frame-ancestors"))}catch{return!0}}parseGitHubUrl(e){const n=[/github\.com\/([^\/]+)\/([^\/]+)/,/([^\/]+)\.github\.io\/([^\/]+)/];for(const i of n){const s=e.match(i);if(s)return{owner:s[1],repo:s[2].replace(".git",""),branch:"main"}}return null}async validateApp(e){const n={valid:!0,error:null};if(!e||!e.id)return n.valid=!1,n.error="App non valida",n;switch(e.type){case"zip":(await C.getAppFiles(e.id)).length||(n.valid=!1,n.error="File dell'app non trovati");break;case"url":case"github":case"pwa":!e.url&&!e.githubUrl&&(n.valid=!1,n.error="URL dell'app non specificato");break;case"html":e.content||(n.valid=!1,n.error="Contenuto HTML mancante");break;default:n.valid=!1,n.error=`Tipo di app non supportato: ${e.type}`}return n}async showConcurrentAppsDialog(){return new Promise(e=>{D("concurrent-apps-dialog",`
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
      `,{disableBackdropClose:!0}),setTimeout(()=>e(!0),5e3)})}closeApp(e){const n=Array.from(this.activeApps.values()).find(i=>i.app.id===e);n&&(n.window&&!n.window.closed&&n.window.close(),n.cleanup&&n.cleanup(),this.activeApps.delete(e))}cleanupApp(e){this.closeApp(e)}setupEventListeners(){window.addEventListener("beforeunload",()=>{for(const[e,n]of this.activeApps)n.cleanup&&n.cleanup()})}async loadLaunchHistory(){const e=await C.getSetting("launchHistory",[]);this.launchHistory=e.slice(-50)}addToHistory(e,n){this.launchHistory.push({appId:e.id,appName:e.name,launchId:n,timestamp:new Date().toISOString()}),C.setSetting("launchHistory",this.launchHistory.slice(-50))}trackLaunch(e,n){console.log(`📊 Launch tracked: ${e.name} in ${n}ms`)}promptPWAInstall(e,n){console.log(`💡 PWA install prompt for ${e.name}`)}get activeAppCount(){return this.activeApps.size}get canLaunchMore(){return this.activeApps.size<this.maxConcurrentApps}}var L;(function(t){t.Root="root",t.Text="text",t.Directive="directive",t.Comment="comment",t.Script="script",t.Style="style",t.Tag="tag",t.CDATA="cdata",t.Doctype="doctype"})(L||(L={}));function Hn(t){return t.type===L.Tag||t.type===L.Script||t.type===L.Style}const Ue=L.Root,Un=L.Text,Dn=L.Directive,Fn=L.Comment,zn=L.Script,_n=L.Style,_t=L.Tag,$n=L.CDATA,Vn=L.Doctype;class De{constructor(){this.parent=null,this.prev=null,this.next=null,this.startIndex=null,this.endIndex=null}get parentNode(){return this.parent}set parentNode(e){this.parent=e}get previousSibling(){return this.prev}set previousSibling(e){this.prev=e}get nextSibling(){return this.next}set nextSibling(e){this.next=e}cloneNode(e=!1){return ot(this,e)}}class Zt extends De{constructor(e){super(),this.data=e}get nodeValue(){return this.data}set nodeValue(e){this.data=e}}class Fe extends Zt{constructor(){super(...arguments),this.type=L.Text}get nodeType(){return 3}}class qn extends Zt{constructor(){super(...arguments),this.type=L.Comment}get nodeType(){return 8}}class jn extends Zt{constructor(e,n){super(n),this.name=e,this.type=L.Directive}get nodeType(){return 1}}class Kt extends De{constructor(e){super(),this.children=e}get firstChild(){var e;return(e=this.children[0])!==null&&e!==void 0?e:null}get lastChild(){return this.children.length>0?this.children[this.children.length-1]:null}get childNodes(){return this.children}set childNodes(e){this.children=e}}class Wn extends Kt{constructor(){super(...arguments),this.type=L.CDATA}get nodeType(){return 4}}class ze extends Kt{constructor(){super(...arguments),this.type=L.Root}get nodeType(){return 9}}class Yn extends Kt{constructor(e,n,i=[],s=e==="script"?L.Script:e==="style"?L.Style:L.Tag){super(i),this.name=e,this.attribs=n,this.type=s}get nodeType(){return 1}get tagName(){return this.name}set tagName(e){this.name=e}get attributes(){return Object.keys(this.attribs).map(e=>{var n,i;return{name:e,value:this.attribs[e],namespace:(n=this["x-attribsNamespace"])===null||n===void 0?void 0:n[e],prefix:(i=this["x-attribsPrefix"])===null||i===void 0?void 0:i[e]}})}}function E(t){return Hn(t)}function Mt(t){return t.type===L.CDATA}function q(t){return t.type===L.Text}function Xt(t){return t.type===L.Comment}function Zn(t){return t.type===L.Directive}function Q(t){return t.type===L.Root}function M(t){return Object.prototype.hasOwnProperty.call(t,"children")}function ot(t,e=!1){let n;if(q(t))n=new Fe(t.data);else if(Xt(t))n=new qn(t.data);else if(E(t)){const i=e?Bt(t.children):[],s=new Yn(t.name,{...t.attribs},i);i.forEach(r=>r.parent=s),t.namespace!=null&&(s.namespace=t.namespace),t["x-attribsNamespace"]&&(s["x-attribsNamespace"]={...t["x-attribsNamespace"]}),t["x-attribsPrefix"]&&(s["x-attribsPrefix"]={...t["x-attribsPrefix"]}),n=s}else if(Mt(t)){const i=e?Bt(t.children):[],s=new Wn(i);i.forEach(r=>r.parent=s),n=s}else if(Q(t)){const i=e?Bt(t.children):[],s=new ze(i);i.forEach(r=>r.parent=s),t["x-mode"]&&(s["x-mode"]=t["x-mode"]),n=s}else if(Zn(t)){const i=new jn(t.name,t.data);t["x-name"]!=null&&(i["x-name"]=t["x-name"],i["x-publicId"]=t["x-publicId"],i["x-systemId"]=t["x-systemId"]),n=i}else throw new Error(`Not implemented yet: ${t.type}`);return n.startIndex=t.startIndex,n.endIndex=t.endIndex,t.sourceCodeLocation!=null&&(n.sourceCodeLocation=t.sourceCodeLocation),n}function Bt(t){const e=t.map(n=>ot(n,!0));for(let n=1;n<e.length;n++)e[n].prev=e[n-1],e[n-1].next=e[n];return e}const me=/["&'<>$\x80-\uFFFF]/g,Kn=new Map([[34,"&quot;"],[38,"&amp;"],[39,"&apos;"],[60,"&lt;"],[62,"&gt;"]]),Xn=String.prototype.codePointAt!=null?(t,e)=>t.codePointAt(e):(t,e)=>(t.charCodeAt(e)&64512)===55296?(t.charCodeAt(e)-55296)*1024+t.charCodeAt(e+1)-56320+65536:t.charCodeAt(e);function _e(t){let e="",n=0,i;for(;(i=me.exec(t))!==null;){const s=i.index,r=t.charCodeAt(s),a=Kn.get(r);a!==void 0?(e+=t.substring(n,s)+a,n=s+1):(e+=`${t.substring(n,s)}&#x${Xn(t,s).toString(16)};`,n=me.lastIndex+=+((r&64512)===55296))}return e+t.substr(n)}function $e(t,e){return function(i){let s,r=0,a="";for(;s=t.exec(i);)r!==s.index&&(a+=i.substring(r,s.index)),a+=e.get(s[0].charCodeAt(0)),r=s.index+1;return a+i.substring(r)}}const Qn=$e(/["&\u00A0]/g,new Map([[34,"&quot;"],[38,"&amp;"],[160,"&nbsp;"]])),Jn=$e(/[&<>\u00A0]/g,new Map([[38,"&amp;"],[60,"&lt;"],[62,"&gt;"],[160,"&nbsp;"]])),Gn=new Map(["altGlyph","altGlyphDef","altGlyphItem","animateColor","animateMotion","animateTransform","clipPath","feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feDistantLight","feDropShadow","feFlood","feFuncA","feFuncB","feFuncG","feFuncR","feGaussianBlur","feImage","feMerge","feMergeNode","feMorphology","feOffset","fePointLight","feSpecularLighting","feSpotLight","feTile","feTurbulence","foreignObject","glyphRef","linearGradient","radialGradient","textPath"].map(t=>[t.toLowerCase(),t])),ti=new Map(["definitionURL","attributeName","attributeType","baseFrequency","baseProfile","calcMode","clipPathUnits","diffuseConstant","edgeMode","filterUnits","glyphRef","gradientTransform","gradientUnits","kernelMatrix","kernelUnitLength","keyPoints","keySplines","keyTimes","lengthAdjust","limitingConeAngle","markerHeight","markerUnits","markerWidth","maskContentUnits","maskUnits","numOctaves","pathLength","patternContentUnits","patternTransform","patternUnits","pointsAtX","pointsAtY","pointsAtZ","preserveAlpha","preserveAspectRatio","primitiveUnits","refX","refY","repeatCount","repeatDur","requiredExtensions","requiredFeatures","specularConstant","specularExponent","spreadMethod","startOffset","stdDeviation","stitchTiles","surfaceScale","systemLanguage","tableValues","targetX","targetY","textLength","viewBox","viewTarget","xChannelSelector","yChannelSelector","zoomAndPan"].map(t=>[t.toLowerCase(),t])),ei=new Set(["style","script","xmp","iframe","noembed","noframes","plaintext","noscript"]);function ni(t){return t.replace(/"/g,"&quot;")}function ii(t,e){var n;if(!t)return;const i=((n=e.encodeEntities)!==null&&n!==void 0?n:e.decodeEntities)===!1?ni:e.xmlMode||e.encodeEntities!=="utf8"?_e:Qn;return Object.keys(t).map(s=>{var r,a;const o=(r=t[s])!==null&&r!==void 0?r:"";return e.xmlMode==="foreign"&&(s=(a=ti.get(s))!==null&&a!==void 0?a:s),!e.emptyAttrs&&!e.xmlMode&&o===""?s:`${s}="${i(o)}"`}).join(" ")}const ve=new Set(["area","base","basefont","br","col","command","embed","frame","hr","img","input","isindex","keygen","link","meta","param","source","track","wbr"]);function Qt(t,e={}){const n="length"in t?t:[t];let i="";for(let s=0;s<n.length;s++)i+=si(n[s],e);return i}function si(t,e){switch(t.type){case Ue:return Qt(t.children,e);case Vn:case Dn:return ci(t);case Fn:return ui(t);case $n:return di(t);case zn:case _n:case _t:return oi(t,e);case Un:return li(t,e)}}const ri=new Set(["mi","mo","mn","ms","mtext","annotation-xml","foreignObject","desc","title"]),ai=new Set(["svg","math"]);function oi(t,e){var n;e.xmlMode==="foreign"&&(t.name=(n=Gn.get(t.name))!==null&&n!==void 0?n:t.name,t.parent&&ri.has(t.parent.name)&&(e={...e,xmlMode:!1})),!e.xmlMode&&ai.has(t.name)&&(e={...e,xmlMode:"foreign"});let i=`<${t.name}`;const s=ii(t.attribs,e);return s&&(i+=` ${s}`),t.children.length===0&&(e.xmlMode?e.selfClosingTags!==!1:e.selfClosingTags&&ve.has(t.name))?(e.xmlMode||(i+=" "),i+="/>"):(i+=">",t.children.length>0&&(i+=Qt(t.children,e)),(e.xmlMode||!ve.has(t.name))&&(i+=`</${t.name}>`)),i}function ci(t){return`<${t.data}>`}function li(t,e){var n;let i=t.data||"";return((n=e.encodeEntities)!==null&&n!==void 0?n:e.decodeEntities)!==!1&&!(!e.xmlMode&&t.parent&&ei.has(t.parent.name))&&(i=e.xmlMode||e.encodeEntities!=="utf8"?_e(i):Jn(i)),i}function di(t){return`<![CDATA[${t.children[0].data}]]>`}function ui(t){return`<!--${t.data}-->`}function Ve(t,e){return Qt(t,e)}function pi(t,e){return M(t)?t.children.map(n=>Ve(n,e)).join(""):""}function mt(t){return Array.isArray(t)?t.map(mt).join(""):E(t)?t.name==="br"?`
`:mt(t.children):Mt(t)?mt(t.children):q(t)?t.data:""}function K(t){return Array.isArray(t)?t.map(K).join(""):M(t)&&!Xt(t)?K(t.children):q(t)?t.data:""}function bt(t){return Array.isArray(t)?t.map(bt).join(""):M(t)&&(t.type===L.Tag||Mt(t))?bt(t.children):q(t)?t.data:""}function xt(t){return M(t)?t.children:[]}function qe(t){return t.parent||null}function je(t){const e=qe(t);if(e!=null)return xt(e);const n=[t];let{prev:i,next:s}=t;for(;i!=null;)n.unshift(i),{prev:i}=i;for(;s!=null;)n.push(s),{next:s}=s;return n}function hi(t,e){var n;return(n=t.attribs)===null||n===void 0?void 0:n[e]}function fi(t,e){return t.attribs!=null&&Object.prototype.hasOwnProperty.call(t.attribs,e)&&t.attribs[e]!=null}function gi(t){return t.name}function Jt(t){let{next:e}=t;for(;e!==null&&!E(e);)({next:e}=e);return e}function Gt(t){let{prev:e}=t;for(;e!==null&&!E(e);)({prev:e}=e);return e}function j(t){if(t.prev&&(t.prev.next=t.next),t.next&&(t.next.prev=t.prev),t.parent){const e=t.parent.children,n=e.lastIndexOf(t);n>=0&&e.splice(n,1)}t.next=null,t.prev=null,t.parent=null}function mi(t,e){const n=e.prev=t.prev;n&&(n.next=e);const i=e.next=t.next;i&&(i.prev=e);const s=e.parent=t.parent;if(s){const r=s.children;r[r.lastIndexOf(t)]=e,t.parent=null}}function vi(t,e){if(j(e),e.next=null,e.parent=t,t.children.push(e)>1){const n=t.children[t.children.length-2];n.next=e,e.prev=n}else e.prev=null}function bi(t,e){j(e);const{parent:n}=t,i=t.next;if(e.next=i,e.prev=t,t.next=e,e.parent=n,i){if(i.prev=e,n){const s=n.children;s.splice(s.lastIndexOf(i),0,e)}}else n&&n.children.push(e)}function yi(t,e){if(j(e),e.parent=t,e.prev=null,t.children.unshift(e)!==1){const n=t.children[1];n.prev=e,e.next=n}else e.next=null}function Ei(t,e){j(e);const{parent:n}=t;if(n){const i=n.children;i.splice(i.indexOf(t),0,e)}t.prev&&(t.prev.next=e),e.parent=n,e.prev=t.prev,e.next=t,t.prev=e}function dt(t,e,n=!0,i=1/0){return te(t,Array.isArray(e)?e:[e],n,i)}function te(t,e,n,i){const s=[],r=[Array.isArray(e)?e:[e]],a=[0];for(;;){if(a[0]>=r[0].length){if(a.length===1)return s;r.shift(),a.shift();continue}const o=r[0][a[0]++];if(t(o)&&(s.push(o),--i<=0))return s;n&&M(o)&&o.children.length>0&&(a.unshift(0),r.unshift(o.children))}}function Ai(t,e){return e.find(t)}function ee(t,e,n=!0){const i=Array.isArray(e)?e:[e];for(let s=0;s<i.length;s++){const r=i[s];if(E(r)&&t(r))return r;if(n&&M(r)&&r.children.length>0){const a=ee(t,r.children,!0);if(a)return a}}return null}function We(t,e){return(Array.isArray(e)?e:[e]).some(n=>E(n)&&t(n)||M(n)&&We(t,n.children))}function Ci(t,e){const n=[],i=[Array.isArray(e)?e:[e]],s=[0];for(;;){if(s[0]>=i[0].length){if(i.length===1)return n;i.shift(),s.shift();continue}const r=i[0][s[0]++];E(r)&&t(r)&&n.push(r),M(r)&&r.children.length>0&&(s.unshift(0),i.unshift(r.children))}}const yt={tag_name(t){return typeof t=="function"?e=>E(e)&&t(e.name):t==="*"?E:e=>E(e)&&e.name===t},tag_type(t){return typeof t=="function"?e=>t(e.type):e=>e.type===t},tag_contains(t){return typeof t=="function"?e=>q(e)&&t(e.data):e=>q(e)&&e.data===t}};function ne(t,e){return typeof e=="function"?n=>E(n)&&e(n.attribs[t]):n=>E(n)&&n.attribs[t]===e}function wi(t,e){return n=>t(n)||e(n)}function Ye(t){const e=Object.keys(t).map(n=>{const i=t[n];return Object.prototype.hasOwnProperty.call(yt,n)?yt[n](i):ne(n,i)});return e.length===0?null:e.reduce(wi)}function Li(t,e){const n=Ye(t);return n?n(e):!0}function Si(t,e,n,i=1/0){const s=Ye(t);return s?dt(s,e,n,i):[]}function Ti(t,e,n=!0){return Array.isArray(e)||(e=[e]),ee(ne("id",t),e,n)}function J(t,e,n=!0,i=1/0){return dt(yt.tag_name(t),e,n,i)}function Mi(t,e,n=!0,i=1/0){return dt(ne("class",t),e,n,i)}function xi(t,e,n=!0,i=1/0){return dt(yt.tag_type(t),e,n,i)}function Ii(t){let e=t.length;for(;--e>=0;){const n=t[e];if(e>0&&t.lastIndexOf(n,e-1)>=0){t.splice(e,1);continue}for(let i=n.parent;i;i=i.parent)if(t.includes(i)){t.splice(e,1);break}}return t}var P;(function(t){t[t.DISCONNECTED=1]="DISCONNECTED",t[t.PRECEDING=2]="PRECEDING",t[t.FOLLOWING=4]="FOLLOWING",t[t.CONTAINS=8]="CONTAINS",t[t.CONTAINED_BY=16]="CONTAINED_BY"})(P||(P={}));function Ze(t,e){const n=[],i=[];if(t===e)return 0;let s=M(t)?t:t.parent;for(;s;)n.unshift(s),s=s.parent;for(s=M(e)?e:e.parent;s;)i.unshift(s),s=s.parent;const r=Math.min(n.length,i.length);let a=0;for(;a<r&&n[a]===i[a];)a++;if(a===0)return P.DISCONNECTED;const o=n[a-1],c=o.children,l=n[a],p=i[a];return c.indexOf(l)>c.indexOf(p)?o===e?P.FOLLOWING|P.CONTAINED_BY:P.FOLLOWING:o===t?P.PRECEDING|P.CONTAINS:P.PRECEDING}function G(t){return t=t.filter((e,n,i)=>!i.includes(e,n+1)),t.sort((e,n)=>{const i=Ze(e,n);return i&P.PRECEDING?-1:i&P.FOLLOWING?1:0}),t}function Ri(t){const e=Et(ki,t);return e?e.name==="feed"?Oi(e):Bi(e):null}function Oi(t){var e;const n=t.children,i={type:"atom",items:J("entry",n).map(a=>{var o;const{children:c}=a,l={media:Ke(c)};R(l,"id","id",c),R(l,"title","title",c);const p=(o=Et("link",c))===null||o===void 0?void 0:o.attribs.href;p&&(l.link=p);const f=F("summary",c)||F("content",c);f&&(l.description=f);const g=F("updated",c);return g&&(l.pubDate=new Date(g)),l})};R(i,"id","id",n),R(i,"title","title",n);const s=(e=Et("link",n))===null||e===void 0?void 0:e.attribs.href;s&&(i.link=s),R(i,"description","subtitle",n);const r=F("updated",n);return r&&(i.updated=new Date(r)),R(i,"author","email",n,!0),i}function Bi(t){var e,n;const i=(n=(e=Et("channel",t.children))===null||e===void 0?void 0:e.children)!==null&&n!==void 0?n:[],s={type:t.name.substr(0,3),id:"",items:J("item",t.children).map(a=>{const{children:o}=a,c={media:Ke(o)};R(c,"id","guid",o),R(c,"title","title",o),R(c,"link","link",o),R(c,"description","description",o);const l=F("pubDate",o)||F("dc:date",o);return l&&(c.pubDate=new Date(l)),c})};R(s,"title","title",i),R(s,"link","link",i),R(s,"description","description",i);const r=F("lastBuildDate",i);return r&&(s.updated=new Date(r)),R(s,"author","managingEditor",i,!0),s}const Pi=["url","type","lang"],Ni=["fileSize","bitrate","framerate","samplingrate","channels","duration","height","width"];function Ke(t){return J("media:content",t).map(e=>{const{attribs:n}=e,i={medium:n.medium,isDefault:!!n.isDefault};for(const s of Pi)n[s]&&(i[s]=n[s]);for(const s of Ni)n[s]&&(i[s]=parseInt(n[s],10));return n.expression&&(i.expression=n.expression),i})}function Et(t,e){return J(t,e,!0,1)[0]}function F(t,e,n=!1){return K(J(t,e,n,1)).trim()}function R(t,e,n,i,s=!1){const r=F(n,i,s);r&&(t[e]=r)}function ki(t){return t==="rss"||t==="feed"||t==="rdf:RDF"}const It=Object.freeze(Object.defineProperty({__proto__:null,get DocumentPosition(){return P},append:bi,appendChild:vi,compareDocumentPosition:Ze,existsOne:We,filter:dt,find:te,findAll:Ci,findOne:ee,findOneChild:Ai,getAttributeValue:hi,getChildren:xt,getElementById:Ti,getElements:Si,getElementsByClassName:Mi,getElementsByTagName:J,getElementsByTagType:xi,getFeed:Ri,getInnerHTML:pi,getName:gi,getOuterHTML:Ve,getParent:qe,getSiblings:je,getText:mt,hasAttrib:fi,hasChildren:M,innerText:bt,isCDATA:Mt,isComment:Xt,isDocument:Q,isTag:E,isText:q,nextElementSibling:Jt,prepend:Ei,prependChild:yi,prevElementSibling:Gt,removeElement:j,removeSubsets:Ii,replaceElement:mi,testElement:Li,textContent:K,uniqueSort:G},Symbol.toStringTag,{value:"Module"}));function At(t){const e=t??(this?this.root():[]);let n="";for(let i=0;i<e.length;i++)n+=K(e[i]);return n}function Hi(t,e){if(e===t)return!1;let n=e;for(;n&&n!==n.parent;)if(n=n.parent,n===t)return!0;return!1}function tt(t){return t.cheerio!=null}function Ui(t){return t.replace(/[._-](\w|$)/g,(e,n)=>n.toUpperCase())}function Di(t){return t.replace(/[A-Z]/g,"-$&").toLowerCase()}function T(t,e){const n=t.length;for(let i=0;i<n;i++)e(t[i],i);return t}var $;(function(t){t[t.LowerA=97]="LowerA",t[t.LowerZ=122]="LowerZ",t[t.UpperA=65]="UpperA",t[t.UpperZ=90]="UpperZ",t[t.Exclamation=33]="Exclamation"})($||($={}));function Fi(t){const e=t.indexOf("<");if(e===-1||e>t.length-3)return!1;const n=t.charCodeAt(e+1);return(n>=$.LowerA&&n<=$.LowerZ||n>=$.UpperA&&n<=$.UpperZ||n===$.Exclamation)&&t.includes(">",e+2)}var Pt;const ct=(Pt=Object.hasOwn)!==null&&Pt!==void 0?Pt:(t,e)=>Object.prototype.hasOwnProperty.call(t,e),lt=/\s+/,$t="data-",ie=/^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,zi=/^{[^]*}$|^\[[^]*]$/;function Ct(t,e,n){var i;if(!(!t||!E(t))){if((i=t.attribs)!==null&&i!==void 0||(t.attribs={}),!e)return t.attribs;if(ct(t.attribs,e))return!n&&ie.test(e)?e:t.attribs[e];if(t.name==="option"&&e==="value")return At(t.children);if(t.name==="input"&&(t.attribs.type==="radio"||t.attribs.type==="checkbox")&&e==="value")return"on"}}function Z(t,e,n){n===null?Qe(t,e):t.attribs[e]=`${n}`}function _i(t,e){if(typeof t=="object"||e!==void 0){if(typeof e=="function"){if(typeof t!="string")throw new Error("Bad combination of arguments.");return T(this,(n,i)=>{E(n)&&Z(n,t,e.call(n,i,n.attribs[t]))})}return T(this,n=>{if(E(n))if(typeof t=="object")for(const i of Object.keys(t)){const s=t[i];Z(n,i,s)}else Z(n,t,e)})}return arguments.length>1?this:Ct(this[0],t,this.options.xmlMode)}function be(t,e,n){return e in t?t[e]:!n&&ie.test(e)?Ct(t,e,!1)!==void 0:Ct(t,e,n)}function Nt(t,e,n,i){e in t?t[e]=n:Z(t,e,!i&&ie.test(e)?n?"":null:`${n}`)}function $i(t,e){var n;if(typeof t=="string"&&e===void 0){const i=this[0];if(!i)return;switch(t){case"style":{const s=this.css(),r=Object.keys(s);for(let a=0;a<r.length;a++)s[a]=r[a];return s.length=r.length,s}case"tagName":case"nodeName":return E(i)?i.name.toUpperCase():void 0;case"href":case"src":{if(!E(i))return;const s=(n=i.attribs)===null||n===void 0?void 0:n[t];return typeof URL<"u"&&(t==="href"&&(i.tagName==="a"||i.tagName==="link")||t==="src"&&(i.tagName==="img"||i.tagName==="iframe"||i.tagName==="audio"||i.tagName==="video"||i.tagName==="source"))&&s!==void 0&&this.options.baseURI?new URL(s,this.options.baseURI).href:s}case"innerText":return bt(i);case"textContent":return K(i);case"outerHTML":return i.type===Ue?this.html():this.clone().wrap("<container />").parent().html();case"innerHTML":return this.html();default:return E(i)?be(i,t,this.options.xmlMode):void 0}}if(typeof t=="object"||e!==void 0){if(typeof e=="function"){if(typeof t=="object")throw new TypeError("Bad combination of arguments.");return T(this,(i,s)=>{E(i)&&Nt(i,t,e.call(i,s,be(i,t,this.options.xmlMode)),this.options.xmlMode)})}return T(this,i=>{if(E(i))if(typeof t=="object")for(const s of Object.keys(t)){const r=t[s];Nt(i,s,r,this.options.xmlMode)}else Nt(i,t,e,this.options.xmlMode)})}}function ye(t,e,n){var i;(i=t.data)!==null&&i!==void 0||(t.data={}),typeof e=="object"?Object.assign(t.data,e):typeof e=="string"&&n!==void 0&&(t.data[e]=n)}function Vi(t){for(const e of Object.keys(t.attribs)){if(!e.startsWith($t))continue;const n=Ui(e.slice($t.length));ct(t.data,n)||(t.data[n]=Xe(t.attribs[e]))}return t.data}function qi(t,e){const n=$t+Di(e),i=t.data;if(ct(i,e))return i[e];if(ct(t.attribs,n))return i[e]=Xe(t.attribs[n])}function Xe(t){if(t==="null")return null;if(t==="true")return!0;if(t==="false")return!1;const e=Number(t);if(t===String(e))return e;if(zi.test(t))try{return JSON.parse(t)}catch{}return t}function ji(t,e){var n;const i=this[0];if(!i||!E(i))return;const s=i;return(n=s.data)!==null&&n!==void 0||(s.data={}),t==null?Vi(s):typeof t=="object"||e!==void 0?(T(this,r=>{E(r)&&(typeof t=="object"?ye(r,t):ye(r,t,e))}),this):qi(s,t)}function Wi(t){const e=arguments.length===0,n=this[0];if(!n||!E(n))return e?void 0:this;switch(n.name){case"textarea":return this.text(t);case"select":{const i=this.find("option:selected");if(!e){if(this.attr("multiple")==null&&typeof t=="object")return this;this.find("option").removeAttr("selected");const s=typeof t=="object"?t:[t];for(const r of s)this.find(`option[value="${r}"]`).attr("selected","");return this}return this.attr("multiple")?i.toArray().map(s=>At(s.children)):i.attr("value")}case"input":case"option":return e?this.attr("value"):this.attr("value",t)}}function Qe(t,e){!t.attribs||!ct(t.attribs,e)||delete t.attribs[e]}function wt(t){return t?t.trim().split(lt):[]}function Yi(t){const e=wt(t);for(const n of e)T(this,i=>{E(i)&&Qe(i,n)});return this}function Zi(t){return this.toArray().some(e=>{const n=E(e)&&e.attribs.class;let i=-1;if(n&&t.length>0)for(;(i=n.indexOf(t,i+1))>-1;){const s=i+t.length;if((i===0||lt.test(n[i-1]))&&(s===n.length||lt.test(n[s])))return!0}return!1})}function Je(t){if(typeof t=="function")return T(this,(i,s)=>{if(E(i)){const r=i.attribs.class||"";Je.call([i],t.call(i,s,r))}});if(!t||typeof t!="string")return this;const e=t.split(lt),n=this.length;for(let i=0;i<n;i++){const s=this[i];if(!E(s))continue;const r=Ct(s,"class",!1);if(r){let a=` ${r} `;for(const o of e){const c=`${o} `;a.includes(` ${c}`)||(a+=c)}Z(s,"class",a.trim())}else Z(s,"class",e.join(" ").trim())}return this}function Ge(t){if(typeof t=="function")return T(this,(s,r)=>{E(s)&&Ge.call([s],t.call(s,r,s.attribs.class||""))});const e=wt(t),n=e.length,i=arguments.length===0;return T(this,s=>{if(E(s))if(i)s.attribs.class="";else{const r=wt(s.attribs.class);let a=!1;for(let o=0;o<n;o++){const c=r.indexOf(e[o]);c!==-1&&(r.splice(c,1),a=!0,o--)}a&&(s.attribs.class=r.join(" "))}})}function tn(t,e){if(typeof t=="function")return T(this,(a,o)=>{E(a)&&tn.call([a],t.call(a,o,a.attribs.class||"",e),e)});if(!t||typeof t!="string")return this;const n=t.split(lt),i=n.length,s=typeof e=="boolean"?e?1:-1:0,r=this.length;for(let a=0;a<r;a++){const o=this[a];if(!E(o))continue;const c=wt(o.attribs.class);for(let l=0;l<i;l++){const p=c.indexOf(n[l]);s>=0&&p===-1?c.push(n[l]):s<=0&&p!==-1&&c.splice(p,1)}o.attribs.class=c.join(" ")}return this}const Ki=Object.freeze(Object.defineProperty({__proto__:null,addClass:Je,attr:_i,data:ji,hasClass:Zi,prop:$i,removeAttr:Yi,removeClass:Ge,toggleClass:tn,val:Wi},Symbol.toStringTag,{value:"Module"}));var y;(function(t){t.Attribute="attribute",t.Pseudo="pseudo",t.PseudoElement="pseudo-element",t.Tag="tag",t.Universal="universal",t.Adjacent="adjacent",t.Child="child",t.Descendant="descendant",t.Parent="parent",t.Sibling="sibling",t.ColumnCombinator="column-combinator"})(y||(y={}));var I;(function(t){t.Any="any",t.Element="element",t.End="end",t.Equals="equals",t.Exists="exists",t.Hyphen="hyphen",t.Not="not",t.Start="start"})(I||(I={}));const Ee=/^[^\\#]?(?:\\(?:[\da-f]{1,6}\s?|.)|[\w\-\u00b0-\uFFFF])+/,Xi=/\\([\da-f]{1,6}\s?|(\s)|.)/gi,Qi=new Map([[126,I.Element],[94,I.Start],[36,I.End],[42,I.Any],[33,I.Not],[124,I.Hyphen]]),Ji=new Set(["has","not","matches","is","where","host","host-context"]);function rt(t){switch(t.type){case y.Adjacent:case y.Child:case y.Descendant:case y.Parent:case y.Sibling:case y.ColumnCombinator:return!0;default:return!1}}const Gi=new Set(["contains","icontains"]);function ts(t,e,n){const i=parseInt(e,16)-65536;return i!==i||n?e:i<0?String.fromCharCode(i+65536):String.fromCharCode(i>>10|55296,i&1023|56320)}function it(t){return t.replace(Xi,ts)}function kt(t){return t===39||t===34}function Ae(t){return t===32||t===9||t===10||t===12||t===13}function Rt(t){const e=[],n=en(e,`${t}`,0);if(n<t.length)throw new Error(`Unmatched selector: ${t.slice(n)}`);return e}function en(t,e,n){let i=[];function s(g){const m=e.slice(n+g).match(Ee);if(!m)throw new Error(`Expected name, found ${e.slice(n)}`);const[b]=m;return n+=g+b.length,it(b)}function r(g){for(n+=g;n<e.length&&Ae(e.charCodeAt(n));)n++}function a(){n+=1;const g=n;let m=1;for(;m>0&&n<e.length;n++)e.charCodeAt(n)===40&&!o(n)?m++:e.charCodeAt(n)===41&&!o(n)&&m--;if(m)throw new Error("Parenthesis not matched");return it(e.slice(g,n-1))}function o(g){let m=0;for(;e.charCodeAt(--g)===92;)m++;return(m&1)===1}function c(){if(i.length>0&&rt(i[i.length-1]))throw new Error("Did not expect successive traversals.")}function l(g){if(i.length>0&&i[i.length-1].type===y.Descendant){i[i.length-1].type=g;return}c(),i.push({type:g})}function p(g,m){i.push({type:y.Attribute,name:g,action:m,value:s(1),namespace:null,ignoreCase:"quirks"})}function f(){if(i.length&&i[i.length-1].type===y.Descendant&&i.pop(),i.length===0)throw new Error("Empty sub-selector");t.push(i)}if(r(0),e.length===n)return n;t:for(;n<e.length;){const g=e.charCodeAt(n);switch(g){case 32:case 9:case 10:case 12:case 13:{(i.length===0||i[0].type!==y.Descendant)&&(c(),i.push({type:y.Descendant})),r(1);break}case 62:{l(y.Child),r(1);break}case 60:{l(y.Parent),r(1);break}case 126:{l(y.Sibling),r(1);break}case 43:{l(y.Adjacent),r(1);break}case 46:{p("class",I.Element);break}case 35:{p("id",I.Equals);break}case 91:{r(1);let m,b=null;e.charCodeAt(n)===124?m=s(1):e.startsWith("*|",n)?(b="*",m=s(2)):(m=s(0),e.charCodeAt(n)===124&&e.charCodeAt(n+1)!==61&&(b=m,m=s(1))),r(0);let S=I.Exists;const O=Qi.get(e.charCodeAt(n));if(O){if(S=O,e.charCodeAt(n+1)!==61)throw new Error("Expected `=`");r(2)}else e.charCodeAt(n)===61&&(S=I.Equals,r(1));let w="",H=null;if(S!=="exists"){if(kt(e.charCodeAt(n))){const Y=e.charCodeAt(n);let k=n+1;for(;k<e.length&&(e.charCodeAt(k)!==Y||o(k));)k+=1;if(e.charCodeAt(k)!==Y)throw new Error("Attribute value didn't end");w=it(e.slice(n+1,k)),n=k+1}else{const Y=n;for(;n<e.length&&(!Ae(e.charCodeAt(n))&&e.charCodeAt(n)!==93||o(n));)n+=1;w=it(e.slice(Y,n))}r(0);const W=e.charCodeAt(n)|32;W===115?(H=!1,r(1)):W===105&&(H=!0,r(1))}if(e.charCodeAt(n)!==93)throw new Error("Attribute selector didn't terminate");n+=1;const nt={type:y.Attribute,name:m,action:S,value:w,namespace:b,ignoreCase:H};i.push(nt);break}case 58:{if(e.charCodeAt(n+1)===58){i.push({type:y.PseudoElement,name:s(2).toLowerCase(),data:e.charCodeAt(n)===40?a():null});continue}const m=s(1).toLowerCase();let b=null;if(e.charCodeAt(n)===40)if(Ji.has(m)){if(kt(e.charCodeAt(n+1)))throw new Error(`Pseudo-selector ${m} cannot be quoted`);if(b=[],n=en(b,e,n+1),e.charCodeAt(n)!==41)throw new Error(`Missing closing parenthesis in :${m} (${e})`);n+=1}else{if(b=a(),Gi.has(m)){const S=b.charCodeAt(0);S===b.charCodeAt(b.length-1)&&kt(S)&&(b=b.slice(1,-1))}b=it(b)}i.push({type:y.Pseudo,name:m,data:b});break}case 44:{f(),i=[],r(1);break}default:{if(e.startsWith("/*",n)){const S=e.indexOf("*/",n+2);if(S<0)throw new Error("Comment was not terminated");n=S+2,i.length===0&&r(0);break}let m=null,b;if(g===42)n+=1,b="*";else if(g===124){if(b="",e.charCodeAt(n+1)===124){l(y.ColumnCombinator),r(2);break}}else if(Ee.test(e.slice(n)))b=s(0);else break t;e.charCodeAt(n)===124&&e.charCodeAt(n+1)!==124&&(m=b,e.charCodeAt(n+1)===42?(b="*",n+=2):b=s(1)),i.push(b==="*"?{type:y.Universal,namespace:m}:{type:y.Tag,name:b,namespace:m})}}}return f(),n}var Ht,Ce;function es(){return Ce||(Ce=1,Ht={trueFunc:function(){return!0},falseFunc:function(){return!1}}),Ht}var Lt=es();const A=He(Lt),nn=new Map([[y.Universal,50],[y.Tag,30],[y.Attribute,1],[y.Pseudo,0]]);function se(t){return!nn.has(t.type)}const ns=new Map([[I.Exists,10],[I.Equals,8],[I.Not,7],[I.Start,6],[I.End,6],[I.Any,5]]);function is(t){const e=t.map(sn);for(let n=1;n<t.length;n++){const i=e[n];if(!(i<0))for(let s=n-1;s>=0&&i<e[s];s--){const r=t[s+1];t[s+1]=t[s],t[s]=r,e[s+1]=e[s],e[s]=i}}}function sn(t){var e,n;let i=(e=nn.get(t.type))!==null&&e!==void 0?e:-1;return t.type===y.Attribute?(i=(n=ns.get(t.action))!==null&&n!==void 0?n:4,t.action===I.Equals&&t.name==="id"&&(i=9),t.ignoreCase&&(i>>=1)):t.type===y.Pseudo&&(t.data?t.name==="has"||t.name==="contains"?i=0:Array.isArray(t.data)?(i=Math.min(...t.data.map(s=>Math.min(...s.map(sn)))),i<0&&(i=0)):i=2:i=3),i}const ss=/[-[\]{}()*+?.,\\^$|#\s]/g;function we(t){return t.replace(ss,"\\$&")}const rs=new Set(["accept","accept-charset","align","alink","axis","bgcolor","charset","checked","clear","codetype","color","compact","declare","defer","dir","direction","disabled","enctype","face","frame","hreflang","http-equiv","lang","language","link","media","method","multiple","nohref","noresize","noshade","nowrap","readonly","rel","rev","rules","scope","scrolling","selected","shape","target","text","type","valign","valuetype","vlink"]);function _(t,e){return typeof t.ignoreCase=="boolean"?t.ignoreCase:t.ignoreCase==="quirks"?!!e.quirksMode:!e.xmlMode&&rs.has(t.name)}const as={equals(t,e,n){const{adapter:i}=n,{name:s}=e;let{value:r}=e;return _(e,n)?(r=r.toLowerCase(),a=>{const o=i.getAttributeValue(a,s);return o!=null&&o.length===r.length&&o.toLowerCase()===r&&t(a)}):a=>i.getAttributeValue(a,s)===r&&t(a)},hyphen(t,e,n){const{adapter:i}=n,{name:s}=e;let{value:r}=e;const a=r.length;return _(e,n)?(r=r.toLowerCase(),function(c){const l=i.getAttributeValue(c,s);return l!=null&&(l.length===a||l.charAt(a)==="-")&&l.substr(0,a).toLowerCase()===r&&t(c)}):function(c){const l=i.getAttributeValue(c,s);return l!=null&&(l.length===a||l.charAt(a)==="-")&&l.substr(0,a)===r&&t(c)}},element(t,e,n){const{adapter:i}=n,{name:s,value:r}=e;if(/\s/.test(r))return A.falseFunc;const a=new RegExp(`(?:^|\\s)${we(r)}(?:$|\\s)`,_(e,n)?"i":"");return function(c){const l=i.getAttributeValue(c,s);return l!=null&&l.length>=r.length&&a.test(l)&&t(c)}},exists(t,{name:e},{adapter:n}){return i=>n.hasAttrib(i,e)&&t(i)},start(t,e,n){const{adapter:i}=n,{name:s}=e;let{value:r}=e;const a=r.length;return a===0?A.falseFunc:_(e,n)?(r=r.toLowerCase(),o=>{const c=i.getAttributeValue(o,s);return c!=null&&c.length>=a&&c.substr(0,a).toLowerCase()===r&&t(o)}):o=>{var c;return!!(!((c=i.getAttributeValue(o,s))===null||c===void 0)&&c.startsWith(r))&&t(o)}},end(t,e,n){const{adapter:i}=n,{name:s}=e;let{value:r}=e;const a=-r.length;return a===0?A.falseFunc:_(e,n)?(r=r.toLowerCase(),o=>{var c;return((c=i.getAttributeValue(o,s))===null||c===void 0?void 0:c.substr(a).toLowerCase())===r&&t(o)}):o=>{var c;return!!(!((c=i.getAttributeValue(o,s))===null||c===void 0)&&c.endsWith(r))&&t(o)}},any(t,e,n){const{adapter:i}=n,{name:s,value:r}=e;if(r==="")return A.falseFunc;if(_(e,n)){const a=new RegExp(we(r),"i");return function(c){const l=i.getAttributeValue(c,s);return l!=null&&l.length>=r.length&&a.test(l)&&t(c)}}return a=>{var o;return!!(!((o=i.getAttributeValue(a,s))===null||o===void 0)&&o.includes(r))&&t(a)}},not(t,e,n){const{adapter:i}=n,{name:s}=e;let{value:r}=e;return r===""?a=>!!i.getAttributeValue(a,s)&&t(a):_(e,n)?(r=r.toLowerCase(),a=>{const o=i.getAttributeValue(a,s);return(o==null||o.length!==r.length||o.toLowerCase()!==r)&&t(a)}):a=>i.getAttributeValue(a,s)!==r&&t(a)}},os=new Set([9,10,12,13,32]),Le=48,cs=57;function ls(t){if(t=t.trim().toLowerCase(),t==="even")return[2,0];if(t==="odd")return[2,1];let e=0,n=0,i=r(),s=a();if(e<t.length&&t.charAt(e)==="n"&&(e++,n=i*(s??1),o(),e<t.length?(i=r(),o(),s=a()):i=s=0),s===null||e<t.length)throw new Error(`n-th rule couldn't be parsed ('${t}')`);return[n,i*s];function r(){return t.charAt(e)==="-"?(e++,-1):(t.charAt(e)==="+"&&e++,1)}function a(){const c=e;let l=0;for(;e<t.length&&t.charCodeAt(e)>=Le&&t.charCodeAt(e)<=cs;)l=l*10+(t.charCodeAt(e)-Le),e++;return e===c?null:l}function o(){for(;e<t.length&&os.has(t.charCodeAt(e));)e++}}function ds(t){const e=t[0],n=t[1]-1;if(n<0&&e<=0)return A.falseFunc;if(e===-1)return r=>r<=n;if(e===0)return r=>r===n;if(e===1)return n<0?A.trueFunc:r=>r>=n;const i=Math.abs(e),s=(n%i+i)%i;return e>1?r=>r>=n&&r%i===s:r=>r<=n&&r%i===s}function ft(t){return ds(ls(t))}function gt(t,e){return n=>{const i=e.getParent(n);return i!=null&&e.isTag(i)&&t(n)}}const Vt={contains(t,e,{adapter:n}){return function(s){return t(s)&&n.getText(s).includes(e)}},icontains(t,e,{adapter:n}){const i=e.toLowerCase();return function(r){return t(r)&&n.getText(r).toLowerCase().includes(i)}},"nth-child"(t,e,{adapter:n,equals:i}){const s=ft(e);return s===A.falseFunc?A.falseFunc:s===A.trueFunc?gt(t,n):function(a){const o=n.getSiblings(a);let c=0;for(let l=0;l<o.length&&!i(a,o[l]);l++)n.isTag(o[l])&&c++;return s(c)&&t(a)}},"nth-last-child"(t,e,{adapter:n,equals:i}){const s=ft(e);return s===A.falseFunc?A.falseFunc:s===A.trueFunc?gt(t,n):function(a){const o=n.getSiblings(a);let c=0;for(let l=o.length-1;l>=0&&!i(a,o[l]);l--)n.isTag(o[l])&&c++;return s(c)&&t(a)}},"nth-of-type"(t,e,{adapter:n,equals:i}){const s=ft(e);return s===A.falseFunc?A.falseFunc:s===A.trueFunc?gt(t,n):function(a){const o=n.getSiblings(a);let c=0;for(let l=0;l<o.length;l++){const p=o[l];if(i(a,p))break;n.isTag(p)&&n.getName(p)===n.getName(a)&&c++}return s(c)&&t(a)}},"nth-last-of-type"(t,e,{adapter:n,equals:i}){const s=ft(e);return s===A.falseFunc?A.falseFunc:s===A.trueFunc?gt(t,n):function(a){const o=n.getSiblings(a);let c=0;for(let l=o.length-1;l>=0;l--){const p=o[l];if(i(a,p))break;n.isTag(p)&&n.getName(p)===n.getName(a)&&c++}return s(c)&&t(a)}},root(t,e,{adapter:n}){return i=>{const s=n.getParent(i);return(s==null||!n.isTag(s))&&t(i)}},scope(t,e,n,i){const{equals:s}=n;return!i||i.length===0?Vt.root(t,e,n):i.length===1?r=>s(i[0],r)&&t(r):r=>i.includes(r)&&t(r)},hover:Ut("isHovered"),visited:Ut("isVisited"),active:Ut("isActive")};function Ut(t){return function(n,i,{adapter:s}){const r=s[t];return typeof r!="function"?A.falseFunc:function(o){return r(o)&&n(o)}}}const Se={empty(t,{adapter:e}){return!e.getChildren(t).some(n=>e.isTag(n)||e.getText(n)!=="")},"first-child"(t,{adapter:e,equals:n}){if(e.prevElementSibling)return e.prevElementSibling(t)==null;const i=e.getSiblings(t).find(s=>e.isTag(s));return i!=null&&n(t,i)},"last-child"(t,{adapter:e,equals:n}){const i=e.getSiblings(t);for(let s=i.length-1;s>=0;s--){if(n(t,i[s]))return!0;if(e.isTag(i[s]))break}return!1},"first-of-type"(t,{adapter:e,equals:n}){const i=e.getSiblings(t),s=e.getName(t);for(let r=0;r<i.length;r++){const a=i[r];if(n(t,a))return!0;if(e.isTag(a)&&e.getName(a)===s)break}return!1},"last-of-type"(t,{adapter:e,equals:n}){const i=e.getSiblings(t),s=e.getName(t);for(let r=i.length-1;r>=0;r--){const a=i[r];if(n(t,a))return!0;if(e.isTag(a)&&e.getName(a)===s)break}return!1},"only-of-type"(t,{adapter:e,equals:n}){const i=e.getName(t);return e.getSiblings(t).every(s=>n(t,s)||!e.isTag(s)||e.getName(s)!==i)},"only-child"(t,{adapter:e,equals:n}){return e.getSiblings(t).every(i=>n(t,i)||!e.isTag(i))}};function Te(t,e,n,i){if(n===null){if(t.length>i)throw new Error(`Pseudo-class :${e} requires an argument`)}else if(t.length===i)throw new Error(`Pseudo-class :${e} doesn't have any arguments`)}const us={"any-link":":is(a, area, link)[href]",link:":any-link:not(:visited)",disabled:`:is(
        :is(button, input, select, textarea, optgroup, option)[disabled],
        optgroup[disabled] > option,
        fieldset[disabled]:not(fieldset[disabled] legend:first-of-type *)
    )`,enabled:":not(:disabled)",checked:":is(:is(input[type=radio], input[type=checkbox])[checked], option:selected)",required:":is(input, select, textarea)[required]",optional:":is(input, select, textarea):not([required])",selected:"option:is([selected], select:not([multiple]):not(:has(> option[selected])) > :first-of-type)",checkbox:"[type=checkbox]",file:"[type=file]",password:"[type=password]",radio:"[type=radio]",reset:"[type=reset]",image:"[type=image]",submit:"[type=submit]",parent:":not(:empty)",header:":is(h1, h2, h3, h4, h5, h6)",button:":is(button, input[type=button])",input:":is(input, textarea, select, button)",text:"input:is(:not([type!='']), [type=text])"},rn={};function ps(t,e){return t===A.falseFunc?A.falseFunc:n=>e.isTag(n)&&t(n)}function an(t,e){const n=e.getSiblings(t);if(n.length<=1)return[];const i=n.indexOf(t);return i<0||i===n.length-1?[]:n.slice(i+1).filter(e.isTag)}function qt(t){return{xmlMode:!!t.xmlMode,lowerCaseAttributeNames:!!t.lowerCaseAttributeNames,lowerCaseTags:!!t.lowerCaseTags,quirksMode:!!t.quirksMode,cacheResults:!!t.cacheResults,pseudos:t.pseudos,adapter:t.adapter,equals:t.equals}}const Dt=(t,e,n,i,s)=>{const r=s(e,qt(n),i);return r===A.trueFunc?t:r===A.falseFunc?A.falseFunc:a=>r(a)&&t(a)},Ft={is:Dt,matches:Dt,where:Dt,not(t,e,n,i,s){const r=s(e,qt(n),i);return r===A.falseFunc?t:r===A.trueFunc?A.falseFunc:a=>!r(a)&&t(a)},has(t,e,n,i,s){const{adapter:r}=n,a=qt(n);a.relativeSelector=!0;const o=e.some(p=>p.some(se))?[rn]:void 0,c=s(e,a,o);if(c===A.falseFunc)return A.falseFunc;const l=ps(c,r);if(o&&c!==A.trueFunc){const{shouldTestNextSiblings:p=!1}=c;return f=>{if(!t(f))return!1;o[0]=f;const g=r.getChildren(f),m=p?[...g,...an(f,r)]:g;return r.existsOne(l,m)}}return p=>t(p)&&r.existsOne(l,r.getChildren(p))}};function hs(t,e,n,i,s){var r;const{name:a,data:o}=e;if(Array.isArray(o)){if(!(a in Ft))throw new Error(`Unknown pseudo-class :${a}(${o})`);return Ft[a](t,o,n,i,s)}const c=(r=n.pseudos)===null||r===void 0?void 0:r[a],l=typeof c=="string"?c:us[a];if(typeof l=="string"){if(o!=null)throw new Error(`Pseudo ${a} doesn't have any arguments`);const p=Rt(l);return Ft.is(t,p,n,i,s)}if(typeof c=="function")return Te(c,a,o,1),p=>c(p,o)&&t(p);if(a in Vt)return Vt[a](t,o,n,i);if(a in Se){const p=Se[a];return Te(p,a,o,2),f=>p(f,n,o)&&t(f)}throw new Error(`Unknown pseudo-class :${a}`)}function zt(t,e){const n=e.getParent(t);return n&&e.isTag(n)?n:null}function fs(t,e,n,i,s){const{adapter:r,equals:a}=n;switch(e.type){case y.PseudoElement:throw new Error("Pseudo-elements are not supported by css-select");case y.ColumnCombinator:throw new Error("Column combinators are not yet supported by css-select");case y.Attribute:{if(e.namespace!=null)throw new Error("Namespaced attributes are not yet supported by css-select");return(!n.xmlMode||n.lowerCaseAttributeNames)&&(e.name=e.name.toLowerCase()),as[e.action](t,e,n)}case y.Pseudo:return hs(t,e,n,i,s);case y.Tag:{if(e.namespace!=null)throw new Error("Namespaced tag names are not yet supported by css-select");let{name:o}=e;return(!n.xmlMode||n.lowerCaseTags)&&(o=o.toLowerCase()),function(l){return r.getName(l)===o&&t(l)}}case y.Descendant:{if(n.cacheResults===!1||typeof WeakSet>"u")return function(l){let p=l;for(;p=zt(p,r);)if(t(p))return!0;return!1};const o=new WeakSet;return function(l){let p=l;for(;p=zt(p,r);)if(!o.has(p)){if(r.isTag(p)&&t(p))return!0;o.add(p)}return!1}}case"_flexibleDescendant":return function(c){let l=c;do if(t(l))return!0;while(l=zt(l,r));return!1};case y.Parent:return function(c){return r.getChildren(c).some(l=>r.isTag(l)&&t(l))};case y.Child:return function(c){const l=r.getParent(c);return l!=null&&r.isTag(l)&&t(l)};case y.Sibling:return function(c){const l=r.getSiblings(c);for(let p=0;p<l.length;p++){const f=l[p];if(a(c,f))break;if(r.isTag(f)&&t(f))return!0}return!1};case y.Adjacent:return r.prevElementSibling?function(c){const l=r.prevElementSibling(c);return l!=null&&t(l)}:function(c){const l=r.getSiblings(c);let p;for(let f=0;f<l.length;f++){const g=l[f];if(a(c,g))break;r.isTag(g)&&(p=g)}return!!p&&t(p)};case y.Universal:{if(e.namespace!=null&&e.namespace!=="*")throw new Error("Namespaced universal selectors are not yet supported by css-select");return t}}}function on(t){return t.type===y.Pseudo&&(t.name==="scope"||Array.isArray(t.data)&&t.data.some(e=>e.some(on)))}const gs={type:y.Descendant},ms={type:"_flexibleDescendant"},vs={type:y.Pseudo,name:"scope",data:null};function bs(t,{adapter:e},n){const i=!!n?.every(s=>{const r=e.isTag(s)&&e.getParent(s);return s===rn||r&&e.isTag(r)});for(const s of t){if(!(s.length>0&&se(s[0])&&s[0].type!==y.Descendant))if(i&&!s.some(on))s.unshift(gs);else continue;s.unshift(vs)}}function cn(t,e,n){var i;t.forEach(is),n=(i=e.context)!==null&&i!==void 0?i:n;const s=Array.isArray(n),r=n&&(Array.isArray(n)?n:[n]);if(e.relativeSelector!==!1)bs(t,e,r);else if(t.some(c=>c.length>0&&se(c[0])))throw new Error("Relative selectors are not allowed when the `relativeSelector` option is disabled");let a=!1;const o=t.map(c=>{if(c.length>=2){const[l,p]=c;l.type!==y.Pseudo||l.name!=="scope"||(s&&p.type===y.Descendant?c[1]=ms:(p.type===y.Adjacent||p.type===y.Sibling)&&(a=!0))}return ys(c,e,r)}).reduce(Es,A.falseFunc);return o.shouldTestNextSiblings=a,o}function ys(t,e,n){var i;return t.reduce((s,r)=>s===A.falseFunc?A.falseFunc:fs(s,r,e,n,cn),(i=e.rootFunc)!==null&&i!==void 0?i:A.trueFunc)}function Es(t,e){return e===A.falseFunc||t===A.trueFunc?t:t===A.falseFunc||e===A.trueFunc?e:function(i){return t(i)||e(i)}}const ln=(t,e)=>t===e,As={adapter:It,equals:ln};function Cs(t){var e,n,i,s;const r=t??As;return(e=r.adapter)!==null&&e!==void 0||(r.adapter=It),(n=r.equals)!==null&&n!==void 0||(r.equals=(s=(i=r.adapter)===null||i===void 0?void 0:i.equals)!==null&&s!==void 0?s:ln),r}function ws(t){return function(n,i,s){const r=Cs(i);return t(n,r,s)}}const re=ws(cn);function dn(t,e,n=!1){return n&&(t=Ls(t,e)),Array.isArray(t)?e.removeSubsets(t):e.getChildren(t)}function Ls(t,e){const n=Array.isArray(t)?t.slice(0):[t],i=n.length;for(let s=0;s<i;s++){const r=an(n[s],e);n.push(...r)}return n}const Ss=new Set(["first","last","eq","gt","nth","lt","even","odd"]);function St(t){return t.type!=="pseudo"?!1:Ss.has(t.name)?!0:t.name==="not"&&Array.isArray(t.data)?t.data.some(e=>e.some(St)):!1}function Ts(t,e,n){const i=e!=null?parseInt(e,10):NaN;switch(t){case"first":return 1;case"nth":case"eq":return isFinite(i)?i>=0?i+1:1/0:0;case"lt":return isFinite(i)?i>=0?Math.min(i,n):1/0:0;case"gt":return isFinite(i)?1/0:0;case"odd":return 2*n;case"even":return 2*n-1;case"last":case"not":return 1/0}}function Ms(t){for(;t.parent;)t=t.parent;return t}function ae(t){const e=[],n=[];for(const i of t)i.some(St)?e.push(i):n.push(i);return[n,e]}const xs={type:y.Universal,namespace:null},Is={type:y.Pseudo,name:"scope",data:null};function un(t,e,n={}){return pn([t],e,n)}function pn(t,e,n={}){if(typeof e=="function")return t.some(e);const[i,s]=ae(Rt(e));return i.length>0&&t.some(re(i,n))||s.some(r=>gn(r,t,n).length>0)}function Rs(t,e,n,i){const s=typeof n=="string"?parseInt(n,10):NaN;switch(t){case"first":case"lt":return e;case"last":return e.length>0?[e[e.length-1]]:e;case"nth":case"eq":return isFinite(s)&&Math.abs(s)<e.length?[s<0?e[e.length+s]:e[s]]:[];case"gt":return isFinite(s)?e.slice(s+1):[];case"even":return e.filter((r,a)=>a%2===0);case"odd":return e.filter((r,a)=>a%2===1);case"not":{const r=new Set(fn(n,e,i));return e.filter(a=>!r.has(a))}}}function hn(t,e,n={}){return fn(Rt(t),e,n)}function fn(t,e,n){if(e.length===0)return[];const[i,s]=ae(t);let r;if(i.length){const a=Wt(e,i,n);if(s.length===0)return a;a.length&&(r=new Set(a))}for(let a=0;a<s.length&&r?.size!==e.length;a++){const o=s[a];if((r?e.filter(p=>E(p)&&!r.has(p)):e).length===0)break;const l=gn(o,e,n);if(l.length)if(r)l.forEach(p=>r.add(p));else{if(a===s.length-1)return l;r=new Set(l)}}return typeof r<"u"?r.size===e.length?e:e.filter(a=>r.has(a)):[]}function gn(t,e,n){var i;if(t.some(rt)){const s=(i=n.root)!==null&&i!==void 0?i:Ms(e[0]),r={...n,context:e,relativeSelector:!1};return t.push(Is),Tt(s,t,r,!0,e.length)}return Tt(e,t,n,!1,e.length)}function Os(t,e,n={},i=1/0){if(typeof t=="function")return mn(e,t);const[s,r]=ae(Rt(t)),a=r.map(o=>Tt(e,o,n,!0,i));return s.length&&a.push(jt(e,s,n,i)),a.length===0?[]:a.length===1?a[0]:G(a.reduce((o,c)=>[...o,...c]))}function Tt(t,e,n,i,s){const r=e.findIndex(St),a=e.slice(0,r),o=e[r],c=e.length-1===r?s:1/0,l=Ts(o.name,o.data,c);if(l===0)return[];const f=(a.length===0&&!Array.isArray(t)?xt(t).filter(E):a.length===0?(Array.isArray(t)?t:[t]).filter(E):i||a.some(rt)?jt(t,[a],n,l):Wt(t,[a],n)).slice(0,l);let g=Rs(o.name,f,o.data,n);if(g.length===0||e.length===r+1)return g;const m=e.slice(r+1),b=m.some(rt);if(b){if(rt(m[0])){const{type:S}=m[0];(S===y.Sibling||S===y.Adjacent)&&(g=dn(g,It,!0)),m.unshift(xs)}n={...n,relativeSelector:!1,rootFunc:S=>g.includes(S)}}else n.rootFunc&&n.rootFunc!==Lt.trueFunc&&(n={...n,rootFunc:Lt.trueFunc});return m.some(St)?Tt(g,m,n,!1,s):b?jt(g,[m],n,s):Wt(g,[m],n)}function jt(t,e,n,i){const s=re(e,n,t);return mn(t,s,i)}function mn(t,e,n=1/0){const i=dn(t,It,e.shouldTestNextSiblings);return te(s=>E(s)&&e(s),i,!0,n)}function Wt(t,e,n){const i=(Array.isArray(t)?t:[t]).filter(E);if(i.length===0)return i;const s=re(e,n);return s===Lt.trueFunc?i:i.filter(s)}const Bs=/^\s*[+~]/;function Ps(t){if(!t)return this._make([]);if(typeof t!="string"){const e=tt(t)?t.toArray():[t],n=this.toArray();return this._make(e.filter(i=>n.some(s=>Hi(s,i))))}return this._findBySelector(t,Number.POSITIVE_INFINITY)}function Ns(t,e){var n;const i=this.toArray(),s=Bs.test(t)?i:this.children().toArray(),r={context:i,root:(n=this._root)===null||n===void 0?void 0:n[0],xmlMode:this.options.xmlMode,lowerCaseTags:this.options.lowerCaseTags,lowerCaseAttributeNames:this.options.lowerCaseAttributeNames,pseudos:this.options.pseudos,quirksMode:this.options.quirksMode};return this._make(Os(t,s,r,e))}function oe(t){return function(e,...n){return function(i){var s;let r=t(e,this);return i&&(r=de(r,i,this.options.xmlMode,(s=this._root)===null||s===void 0?void 0:s[0])),this._make(this.length>1&&r.length>1?n.reduce((a,o)=>o(a),r):r)}}}const ut=oe((t,e)=>{let n=[];for(let i=0;i<e.length;i++){const s=t(e[i]);s.length>0&&(n=n.concat(s))}return n}),ce=oe((t,e)=>{const n=[];for(let i=0;i<e.length;i++){const s=t(e[i]);s!==null&&n.push(s)}return n});function le(t,...e){let n=null;const i=oe((s,r)=>{const a=[];return T(r,o=>{for(let c;(c=s(o))&&!n?.(c,a.length);o=c)a.push(c)}),a})(t,...e);return function(s,r){n=typeof s=="string"?o=>un(o,s,this.options):s?pt(s):null;const a=i.call(this,r);return n=null,a}}function et(t){return t.length>1?Array.from(new Set(t)):t}const ks=ce(({parent:t})=>t&&!Q(t)?t:null,et),Hs=ut(t=>{const e=[];for(;t.parent&&!Q(t.parent);)e.push(t.parent),t=t.parent;return e},G,t=>t.reverse()),Us=le(({parent:t})=>t&&!Q(t)?t:null,G,t=>t.reverse());function Ds(t){var e;const n=[];if(!t)return this._make(n);const i={xmlMode:this.options.xmlMode,root:(e=this._root)===null||e===void 0?void 0:e[0]},s=typeof t=="string"?r=>un(r,t,i):pt(t);return T(this,r=>{for(r&&!Q(r)&&!E(r)&&(r=r.parent);r&&E(r);){if(s(r,0)){n.includes(r)||n.push(r);break}r=r.parent}}),this._make(n)}const Fs=ce(t=>Jt(t)),zs=ut(t=>{const e=[];for(;t.next;)t=t.next,E(t)&&e.push(t);return e},et),_s=le(t=>Jt(t),et),$s=ce(t=>Gt(t)),Vs=ut(t=>{const e=[];for(;t.prev;)t=t.prev,E(t)&&e.push(t);return e},et),qs=le(t=>Gt(t),et),js=ut(t=>je(t).filter(e=>E(e)&&e!==t),G),Ws=ut(t=>xt(t).filter(E),et);function Ys(){const t=this.toArray().reduce((e,n)=>M(n)?e.concat(n.children):e,[]);return this._make(t)}function Zs(t){let e=0;const n=this.length;for(;e<n&&t.call(this[e],e,this[e])!==!1;)++e;return this}function Ks(t){let e=[];for(let n=0;n<this.length;n++){const i=this[n],s=t.call(i,n,i);s!=null&&(e=e.concat(s))}return this._make(e)}function pt(t){return typeof t=="function"?(e,n)=>t.call(e,n,e):tt(t)?e=>Array.prototype.includes.call(t,e):function(e){return t===e}}function Xs(t){var e;return this._make(de(this.toArray(),t,this.options.xmlMode,(e=this._root)===null||e===void 0?void 0:e[0]))}function de(t,e,n,i){return typeof e=="string"?hn(e,t,{xmlMode:n,root:i}):t.filter(pt(e))}function Qs(t){const e=this.toArray();return typeof t=="string"?pn(e.filter(E),t,this.options):t?e.some(pt(t)):!1}function Js(t){let e=this.toArray();if(typeof t=="string"){const n=new Set(hn(t,e,this.options));e=e.filter(i=>!n.has(i))}else{const n=pt(t);e=e.filter((i,s)=>!n(i,s))}return this._make(e)}function Gs(t){return this.filter(typeof t=="string"?`:has(${t})`:(e,n)=>this._make(n).find(t).length>0)}function tr(){return this.length>1?this._make(this[0]):this}function er(){return this.length>0?this._make(this[this.length-1]):this}function nr(t){var e;return t=+t,t===0&&this.length<=1?this:(t<0&&(t=this.length+t),this._make((e=this[t])!==null&&e!==void 0?e:[]))}function ir(t){return t==null?this.toArray():this[t<0?this.length+t:t]}function sr(){return Array.prototype.slice.call(this)}function rr(t){let e,n;return t==null?(e=this.parent().children(),n=this[0]):typeof t=="string"?(e=this._make(t),n=this[0]):(e=this,n=tt(t)?t[0]:t),Array.prototype.indexOf.call(e,n)}function ar(t,e){return this._make(Array.prototype.slice.call(this,t,e))}function or(){var t;return(t=this.prevObject)!==null&&t!==void 0?t:this._make([])}function cr(t,e){const n=this._make(t,e),i=G([...this.get(),...n.get()]);return this._make(i)}function lr(t){return this.prevObject?this.add(t?this.prevObject.filter(t):this.prevObject):this}const dr=Object.freeze(Object.defineProperty({__proto__:null,_findBySelector:Ns,add:cr,addBack:lr,children:Ws,closest:Ds,contents:Ys,each:Zs,end:or,eq:nr,filter:Xs,filterArray:de,find:Ps,first:tr,get:ir,has:Gs,index:rr,is:Qs,last:er,map:Ks,next:Fs,nextAll:zs,nextUntil:_s,not:Js,parent:ks,parents:Hs,parentsUntil:Us,prev:$s,prevAll:Vs,prevUntil:qs,siblings:js,slice:ar,toArray:sr},Symbol.toStringTag,{value:"Module"}));function X(t,e){const n=Array.isArray(t)?t:[t];e?e.children=n:e=null;for(let i=0;i<n.length;i++){const s=n[i];s.parent&&s.parent.children!==n&&j(s),e?(s.prev=n[i-1]||null,s.next=n[i+1]||null):s.prev=s.next=null,s.parent=e}return e}function ur(t,e){if(t==null)return[];if(typeof t=="string")return this._parse(t,this.options,!1,null).children.slice(0);if("length"in t){if(t.length===1)return this._makeDomArray(t[0],e);const n=[];for(let i=0;i<t.length;i++){const s=t[i];if(typeof s=="object"){if(s==null)continue;if(!("length"in s)){n.push(e?ot(s,!0):s);continue}}n.push(...this._makeDomArray(s,e))}return n}return[e?ot(t,!0):t]}function vn(t){return function(...e){const n=this.length-1;return T(this,(i,s)=>{if(!M(i))return;const r=typeof e[0]=="function"?e[0].call(i,s,this._render(i.children)):e,a=this._makeDomArray(r,s<n);t(a,i.children,i)})}}function z(t,e,n,i,s){var r,a;const o=[e,n,...i],c=e===0?null:t[e-1],l=e+n>=t.length?null:t[e+n];for(let p=0;p<i.length;++p){const f=i[p],g=f.parent;if(g){const b=g.children.indexOf(f);b!==-1&&(g.children.splice(b,1),s===g&&e>b&&o[0]--)}f.parent=s,f.prev&&(f.prev.next=(r=f.next)!==null&&r!==void 0?r:null),f.next&&(f.next.prev=(a=f.prev)!==null&&a!==void 0?a:null),f.prev=p===0?c:i[p-1],f.next=p===i.length-1?l:i[p+1]}return c&&(c.next=i[0]),l&&(l.prev=i[i.length-1]),t.splice(...o)}function pr(t){return(tt(t)?t:this._make(t)).append(this),this}function hr(t){return(tt(t)?t:this._make(t)).prepend(this),this}const fr=vn((t,e,n)=>{z(e,e.length,0,t,n)}),gr=vn((t,e,n)=>{z(e,0,0,t,n)});function bn(t){return function(e){const n=this.length-1,i=this.parents().last();for(let s=0;s<this.length;s++){const r=this[s],a=typeof e=="function"?e.call(r,s,r):typeof e=="string"&&!Fi(e)?i.find(e).clone():e,[o]=this._makeDomArray(a,s<n);if(!o||!M(o))continue;let c=o,l=0;for(;l<c.children.length;){const p=c.children[l];E(p)?(c=p,l=0):l++}t(r,c,[o])}return this}}const mr=bn((t,e,n)=>{const{parent:i}=t;if(!i)return;const s=i.children,r=s.indexOf(t);X([t],e),z(s,r,0,n,i)}),vr=bn((t,e,n)=>{M(t)&&(X(t.children,e),X(n,t))});function br(t){return this.parent(t).not("body").each((e,n)=>{this._make(n).replaceWith(n.children)}),this}function yr(t){const e=this[0];if(e){const n=this._make(typeof t=="function"?t.call(e,0,e):t).insertBefore(e);let i;for(let r=0;r<n.length;r++)n[r].type===_t&&(i=n[r]);let s=0;for(;i&&s<i.children.length;){const r=i.children[s];r.type===_t?(i=r,s=0):s++}i&&this._make(i).append(this)}return this}function Er(...t){const e=this.length-1;return T(this,(n,i)=>{if(!M(n)||!n.parent)return;const s=n.parent.children,r=s.indexOf(n);if(r===-1)return;const a=typeof t[0]=="function"?t[0].call(n,i,this._render(n.children)):t,o=this._makeDomArray(a,i<e);z(s,r+1,0,o,n.parent)})}function Ar(t){typeof t=="string"&&(t=this._make(t)),this.remove();const e=[];for(const n of this._makeDomArray(t)){const i=this.clone().toArray(),{parent:s}=n;if(!s)continue;const r=s.children,a=r.indexOf(n);a!==-1&&(z(r,a+1,0,i,s),e.push(...i))}return this._make(e)}function Cr(...t){const e=this.length-1;return T(this,(n,i)=>{if(!M(n)||!n.parent)return;const s=n.parent.children,r=s.indexOf(n);if(r===-1)return;const a=typeof t[0]=="function"?t[0].call(n,i,this._render(n.children)):t,o=this._makeDomArray(a,i<e);z(s,r,0,o,n.parent)})}function wr(t){const e=this._make(t);this.remove();const n=[];return T(e,i=>{const s=this.clone().toArray(),{parent:r}=i;if(!r)return;const a=r.children,o=a.indexOf(i);o!==-1&&(z(a,o,0,s,r),n.push(...s))}),this._make(n)}function Lr(t){const e=t?this.filter(t):this;return T(e,n=>{j(n),n.prev=n.next=n.parent=null}),this}function Sr(t){return T(this,(e,n)=>{const{parent:i}=e;if(!i)return;const s=i.children,r=typeof t=="function"?t.call(e,n,e):t,a=this._makeDomArray(r);X(a,null);const o=s.indexOf(e);z(s,o,1,a,i),a.includes(e)||(e.parent=e.prev=e.next=null)})}function Tr(){return T(this,t=>{if(M(t)){for(const e of t.children)e.next=e.prev=e.parent=null;t.children.length=0}})}function Mr(t){if(t===void 0){const e=this[0];return!e||!M(e)?null:this._render(e.children)}return T(this,e=>{if(!M(e))return;for(const i of e.children)i.next=i.prev=i.parent=null;const n=tt(t)?t.toArray():this._parse(`${t}`,this.options,!1,e).children;X(n,e)})}function xr(){return this._render(this)}function Ir(t){return t===void 0?At(this):typeof t=="function"?T(this,(e,n)=>this._make(e).text(t.call(e,n,At([e])))):T(this,e=>{if(!M(e))return;for(const i of e.children)i.next=i.prev=i.parent=null;const n=new Fe(`${t}`);X(n,e)})}function Rr(){const t=Array.prototype.map.call(this.get(),n=>ot(n,!0)),e=new ze(t);for(const n of t)n.parent=e;return this._make(t)}const Or=Object.freeze(Object.defineProperty({__proto__:null,_makeDomArray:ur,after:Er,append:fr,appendTo:pr,before:Cr,clone:Rr,empty:Tr,html:Mr,insertAfter:Ar,insertBefore:wr,prepend:gr,prependTo:hr,remove:Lr,replaceWith:Sr,text:Ir,toString:xr,unwrap:br,wrap:mr,wrapAll:yr,wrapInner:vr},Symbol.toStringTag,{value:"Module"}));function Br(t,e){if(t!=null&&e!=null||typeof t=="object"&&!Array.isArray(t))return T(this,(n,i)=>{E(n)&&yn(n,t,e,i)});if(this.length!==0)return En(this[0],t)}function yn(t,e,n,i){if(typeof e=="string"){const s=En(t),r=typeof n=="function"?n.call(t,i,s[e]):n;r===""?delete s[e]:r!=null&&(s[e]=r),t.attribs.style=Pr(s)}else if(typeof e=="object"){const s=Object.keys(e);for(let r=0;r<s.length;r++){const a=s[r];yn(t,a,e[a],r)}}}function En(t,e){if(!t||!E(t))return;const n=Nr(t.attribs.style);if(typeof e=="string")return n[e];if(Array.isArray(e)){const i={};for(const s of e)n[s]!=null&&(i[s]=n[s]);return i}return n}function Pr(t){return Object.keys(t).reduce((e,n)=>`${e}${e?" ":""}${n}: ${t[n]};`,"")}function Nr(t){if(t=(t||"").trim(),!t)return{};const e={};let n;for(const i of t.split(";")){const s=i.indexOf(":");if(s<1||s===i.length-1){const r=i.trimEnd();r.length>0&&n!==void 0&&(e[n]+=`;${r}`)}else n=i.slice(0,s).trim(),e[n]=i.slice(s+1).trim()}return e}const kr=Object.freeze(Object.defineProperty({__proto__:null,css:Br},Symbol.toStringTag,{value:"Module"})),Me="input,select,textarea,keygen",Hr=/%20/g,xe=/\r?\n/g;function Ur(){return this.serializeArray().map(n=>`${encodeURIComponent(n.name)}=${encodeURIComponent(n.value)}`).join("&").replace(Hr,"+")}function Dr(){return this.map((t,e)=>{const n=this._make(e);return E(e)&&e.name==="form"?n.find(Me).toArray():n.filter(Me).toArray()}).filter('[name!=""]:enabled:not(:submit, :button, :image, :reset, :file):matches([checked], :not(:checkbox, :radio))').map((t,e)=>{var n;const i=this._make(e),s=i.attr("name"),r=(n=i.val())!==null&&n!==void 0?n:"";return Array.isArray(r)?r.map(a=>({name:s,value:a.replace(xe,`\r
`)})):{name:s,value:r.replace(xe,`\r
`)}}).toArray()}const Fr=Object.freeze(Object.defineProperty({__proto__:null,serialize:Ur,serializeArray:Dr},Symbol.toStringTag,{value:"Module"}));function zr(t){var e;return typeof t=="string"?{selector:t,value:"textContent"}:{selector:t.selector,value:(e=t.value)!==null&&e!==void 0?e:"textContent"}}function _r(t){const e={};for(const n in t){const i=t[n],s=Array.isArray(i),{selector:r,value:a}=zr(s?i[0]:i),o=typeof a=="function"?a:typeof a=="string"?c=>this._make(c).prop(a):c=>this._make(c).extract(a);if(s)e[n]=this._findBySelector(r,Number.POSITIVE_INFINITY).map((c,l)=>o(l,n,e)).get();else{const c=this._findBySelector(r,1);e[n]=c.length>0?o(c[0],n,e):void 0}}return e}const $r=Object.freeze(Object.defineProperty({__proto__:null,extract:_r},Symbol.toStringTag,{value:"Module"}));class Ot{constructor(e,n,i){if(this.length=0,this.options=i,this._root=n,e){for(let s=0;s<e.length;s++)this[s]=e[s];this.length=e.length}}}Ot.prototype.cheerio="[cheerio object]";Ot.prototype.splice=Array.prototype.splice;Ot.prototype[Symbol.iterator]=Array.prototype[Symbol.iterator];Object.assign(Ot.prototype,Ki,dr,Or,kr,Fr,$r);var Ie;(function(t){t[t.EOF=-1]="EOF",t[t.NULL=0]="NULL",t[t.TABULATION=9]="TABULATION",t[t.CARRIAGE_RETURN=13]="CARRIAGE_RETURN",t[t.LINE_FEED=10]="LINE_FEED",t[t.FORM_FEED=12]="FORM_FEED",t[t.SPACE=32]="SPACE",t[t.EXCLAMATION_MARK=33]="EXCLAMATION_MARK",t[t.QUOTATION_MARK=34]="QUOTATION_MARK",t[t.AMPERSAND=38]="AMPERSAND",t[t.APOSTROPHE=39]="APOSTROPHE",t[t.HYPHEN_MINUS=45]="HYPHEN_MINUS",t[t.SOLIDUS=47]="SOLIDUS",t[t.DIGIT_0=48]="DIGIT_0",t[t.DIGIT_9=57]="DIGIT_9",t[t.SEMICOLON=59]="SEMICOLON",t[t.LESS_THAN_SIGN=60]="LESS_THAN_SIGN",t[t.EQUALS_SIGN=61]="EQUALS_SIGN",t[t.GREATER_THAN_SIGN=62]="GREATER_THAN_SIGN",t[t.QUESTION_MARK=63]="QUESTION_MARK",t[t.LATIN_CAPITAL_A=65]="LATIN_CAPITAL_A",t[t.LATIN_CAPITAL_Z=90]="LATIN_CAPITAL_Z",t[t.RIGHT_SQUARE_BRACKET=93]="RIGHT_SQUARE_BRACKET",t[t.GRAVE_ACCENT=96]="GRAVE_ACCENT",t[t.LATIN_SMALL_A=97]="LATIN_SMALL_A",t[t.LATIN_SMALL_Z=122]="LATIN_SMALL_Z"})(Ie||(Ie={}));var Re;(function(t){t.controlCharacterInInputStream="control-character-in-input-stream",t.noncharacterInInputStream="noncharacter-in-input-stream",t.surrogateInInputStream="surrogate-in-input-stream",t.nonVoidHtmlElementStartTagWithTrailingSolidus="non-void-html-element-start-tag-with-trailing-solidus",t.endTagWithAttributes="end-tag-with-attributes",t.endTagWithTrailingSolidus="end-tag-with-trailing-solidus",t.unexpectedSolidusInTag="unexpected-solidus-in-tag",t.unexpectedNullCharacter="unexpected-null-character",t.unexpectedQuestionMarkInsteadOfTagName="unexpected-question-mark-instead-of-tag-name",t.invalidFirstCharacterOfTagName="invalid-first-character-of-tag-name",t.unexpectedEqualsSignBeforeAttributeName="unexpected-equals-sign-before-attribute-name",t.missingEndTagName="missing-end-tag-name",t.unexpectedCharacterInAttributeName="unexpected-character-in-attribute-name",t.unknownNamedCharacterReference="unknown-named-character-reference",t.missingSemicolonAfterCharacterReference="missing-semicolon-after-character-reference",t.unexpectedCharacterAfterDoctypeSystemIdentifier="unexpected-character-after-doctype-system-identifier",t.unexpectedCharacterInUnquotedAttributeValue="unexpected-character-in-unquoted-attribute-value",t.eofBeforeTagName="eof-before-tag-name",t.eofInTag="eof-in-tag",t.missingAttributeValue="missing-attribute-value",t.missingWhitespaceBetweenAttributes="missing-whitespace-between-attributes",t.missingWhitespaceAfterDoctypePublicKeyword="missing-whitespace-after-doctype-public-keyword",t.missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers="missing-whitespace-between-doctype-public-and-system-identifiers",t.missingWhitespaceAfterDoctypeSystemKeyword="missing-whitespace-after-doctype-system-keyword",t.missingQuoteBeforeDoctypePublicIdentifier="missing-quote-before-doctype-public-identifier",t.missingQuoteBeforeDoctypeSystemIdentifier="missing-quote-before-doctype-system-identifier",t.missingDoctypePublicIdentifier="missing-doctype-public-identifier",t.missingDoctypeSystemIdentifier="missing-doctype-system-identifier",t.abruptDoctypePublicIdentifier="abrupt-doctype-public-identifier",t.abruptDoctypeSystemIdentifier="abrupt-doctype-system-identifier",t.cdataInHtmlContent="cdata-in-html-content",t.incorrectlyOpenedComment="incorrectly-opened-comment",t.eofInScriptHtmlCommentLikeText="eof-in-script-html-comment-like-text",t.eofInDoctype="eof-in-doctype",t.nestedComment="nested-comment",t.abruptClosingOfEmptyComment="abrupt-closing-of-empty-comment",t.eofInComment="eof-in-comment",t.incorrectlyClosedComment="incorrectly-closed-comment",t.eofInCdata="eof-in-cdata",t.absenceOfDigitsInNumericCharacterReference="absence-of-digits-in-numeric-character-reference",t.nullCharacterReference="null-character-reference",t.surrogateCharacterReference="surrogate-character-reference",t.characterReferenceOutsideUnicodeRange="character-reference-outside-unicode-range",t.controlCharacterReference="control-character-reference",t.noncharacterCharacterReference="noncharacter-character-reference",t.missingWhitespaceBeforeDoctypeName="missing-whitespace-before-doctype-name",t.missingDoctypeName="missing-doctype-name",t.invalidCharacterSequenceAfterDoctypeName="invalid-character-sequence-after-doctype-name",t.duplicateAttribute="duplicate-attribute",t.nonConformingDoctype="non-conforming-doctype",t.missingDoctype="missing-doctype",t.misplacedDoctype="misplaced-doctype",t.endTagWithoutMatchingOpenElement="end-tag-without-matching-open-element",t.closingOfElementWithOpenChildElements="closing-of-element-with-open-child-elements",t.disallowedContentInNoscriptInHead="disallowed-content-in-noscript-in-head",t.openElementsLeftAfterEof="open-elements-left-after-eof",t.abandonedHeadElementChild="abandoned-head-element-child",t.misplacedStartTagForHeadElement="misplaced-start-tag-for-head-element",t.nestedNoscriptInHead="nested-noscript-in-head",t.eofInElementThatCanContainOnlyText="eof-in-element-that-can-contain-only-text"})(Re||(Re={}));var Oe;(function(t){t[t.CHARACTER=0]="CHARACTER",t[t.NULL_CHARACTER=1]="NULL_CHARACTER",t[t.WHITESPACE_CHARACTER=2]="WHITESPACE_CHARACTER",t[t.START_TAG=3]="START_TAG",t[t.END_TAG=4]="END_TAG",t[t.COMMENT=5]="COMMENT",t[t.DOCTYPE=6]="DOCTYPE",t[t.EOF=7]="EOF",t[t.HIBERNATION=8]="HIBERNATION"})(Oe||(Oe={}));var x;(function(t){t.HTML="http://www.w3.org/1999/xhtml",t.MATHML="http://www.w3.org/1998/Math/MathML",t.SVG="http://www.w3.org/2000/svg",t.XLINK="http://www.w3.org/1999/xlink",t.XML="http://www.w3.org/XML/1998/namespace",t.XMLNS="http://www.w3.org/2000/xmlns/"})(x||(x={}));var Be;(function(t){t.TYPE="type",t.ACTION="action",t.ENCODING="encoding",t.PROMPT="prompt",t.NAME="name",t.COLOR="color",t.FACE="face",t.SIZE="size"})(Be||(Be={}));var Pe;(function(t){t.NO_QUIRKS="no-quirks",t.QUIRKS="quirks",t.LIMITED_QUIRKS="limited-quirks"})(Pe||(Pe={}));var u;(function(t){t.A="a",t.ADDRESS="address",t.ANNOTATION_XML="annotation-xml",t.APPLET="applet",t.AREA="area",t.ARTICLE="article",t.ASIDE="aside",t.B="b",t.BASE="base",t.BASEFONT="basefont",t.BGSOUND="bgsound",t.BIG="big",t.BLOCKQUOTE="blockquote",t.BODY="body",t.BR="br",t.BUTTON="button",t.CAPTION="caption",t.CENTER="center",t.CODE="code",t.COL="col",t.COLGROUP="colgroup",t.DD="dd",t.DESC="desc",t.DETAILS="details",t.DIALOG="dialog",t.DIR="dir",t.DIV="div",t.DL="dl",t.DT="dt",t.EM="em",t.EMBED="embed",t.FIELDSET="fieldset",t.FIGCAPTION="figcaption",t.FIGURE="figure",t.FONT="font",t.FOOTER="footer",t.FOREIGN_OBJECT="foreignObject",t.FORM="form",t.FRAME="frame",t.FRAMESET="frameset",t.H1="h1",t.H2="h2",t.H3="h3",t.H4="h4",t.H5="h5",t.H6="h6",t.HEAD="head",t.HEADER="header",t.HGROUP="hgroup",t.HR="hr",t.HTML="html",t.I="i",t.IMG="img",t.IMAGE="image",t.INPUT="input",t.IFRAME="iframe",t.KEYGEN="keygen",t.LABEL="label",t.LI="li",t.LINK="link",t.LISTING="listing",t.MAIN="main",t.MALIGNMARK="malignmark",t.MARQUEE="marquee",t.MATH="math",t.MENU="menu",t.META="meta",t.MGLYPH="mglyph",t.MI="mi",t.MO="mo",t.MN="mn",t.MS="ms",t.MTEXT="mtext",t.NAV="nav",t.NOBR="nobr",t.NOFRAMES="noframes",t.NOEMBED="noembed",t.NOSCRIPT="noscript",t.OBJECT="object",t.OL="ol",t.OPTGROUP="optgroup",t.OPTION="option",t.P="p",t.PARAM="param",t.PLAINTEXT="plaintext",t.PRE="pre",t.RB="rb",t.RP="rp",t.RT="rt",t.RTC="rtc",t.RUBY="ruby",t.S="s",t.SCRIPT="script",t.SEARCH="search",t.SECTION="section",t.SELECT="select",t.SOURCE="source",t.SMALL="small",t.SPAN="span",t.STRIKE="strike",t.STRONG="strong",t.STYLE="style",t.SUB="sub",t.SUMMARY="summary",t.SUP="sup",t.TABLE="table",t.TBODY="tbody",t.TEMPLATE="template",t.TEXTAREA="textarea",t.TFOOT="tfoot",t.TD="td",t.TH="th",t.THEAD="thead",t.TITLE="title",t.TR="tr",t.TRACK="track",t.TT="tt",t.U="u",t.UL="ul",t.SVG="svg",t.VAR="var",t.WBR="wbr",t.XMP="xmp"})(u||(u={}));var d;(function(t){t[t.UNKNOWN=0]="UNKNOWN",t[t.A=1]="A",t[t.ADDRESS=2]="ADDRESS",t[t.ANNOTATION_XML=3]="ANNOTATION_XML",t[t.APPLET=4]="APPLET",t[t.AREA=5]="AREA",t[t.ARTICLE=6]="ARTICLE",t[t.ASIDE=7]="ASIDE",t[t.B=8]="B",t[t.BASE=9]="BASE",t[t.BASEFONT=10]="BASEFONT",t[t.BGSOUND=11]="BGSOUND",t[t.BIG=12]="BIG",t[t.BLOCKQUOTE=13]="BLOCKQUOTE",t[t.BODY=14]="BODY",t[t.BR=15]="BR",t[t.BUTTON=16]="BUTTON",t[t.CAPTION=17]="CAPTION",t[t.CENTER=18]="CENTER",t[t.CODE=19]="CODE",t[t.COL=20]="COL",t[t.COLGROUP=21]="COLGROUP",t[t.DD=22]="DD",t[t.DESC=23]="DESC",t[t.DETAILS=24]="DETAILS",t[t.DIALOG=25]="DIALOG",t[t.DIR=26]="DIR",t[t.DIV=27]="DIV",t[t.DL=28]="DL",t[t.DT=29]="DT",t[t.EM=30]="EM",t[t.EMBED=31]="EMBED",t[t.FIELDSET=32]="FIELDSET",t[t.FIGCAPTION=33]="FIGCAPTION",t[t.FIGURE=34]="FIGURE",t[t.FONT=35]="FONT",t[t.FOOTER=36]="FOOTER",t[t.FOREIGN_OBJECT=37]="FOREIGN_OBJECT",t[t.FORM=38]="FORM",t[t.FRAME=39]="FRAME",t[t.FRAMESET=40]="FRAMESET",t[t.H1=41]="H1",t[t.H2=42]="H2",t[t.H3=43]="H3",t[t.H4=44]="H4",t[t.H5=45]="H5",t[t.H6=46]="H6",t[t.HEAD=47]="HEAD",t[t.HEADER=48]="HEADER",t[t.HGROUP=49]="HGROUP",t[t.HR=50]="HR",t[t.HTML=51]="HTML",t[t.I=52]="I",t[t.IMG=53]="IMG",t[t.IMAGE=54]="IMAGE",t[t.INPUT=55]="INPUT",t[t.IFRAME=56]="IFRAME",t[t.KEYGEN=57]="KEYGEN",t[t.LABEL=58]="LABEL",t[t.LI=59]="LI",t[t.LINK=60]="LINK",t[t.LISTING=61]="LISTING",t[t.MAIN=62]="MAIN",t[t.MALIGNMARK=63]="MALIGNMARK",t[t.MARQUEE=64]="MARQUEE",t[t.MATH=65]="MATH",t[t.MENU=66]="MENU",t[t.META=67]="META",t[t.MGLYPH=68]="MGLYPH",t[t.MI=69]="MI",t[t.MO=70]="MO",t[t.MN=71]="MN",t[t.MS=72]="MS",t[t.MTEXT=73]="MTEXT",t[t.NAV=74]="NAV",t[t.NOBR=75]="NOBR",t[t.NOFRAMES=76]="NOFRAMES",t[t.NOEMBED=77]="NOEMBED",t[t.NOSCRIPT=78]="NOSCRIPT",t[t.OBJECT=79]="OBJECT",t[t.OL=80]="OL",t[t.OPTGROUP=81]="OPTGROUP",t[t.OPTION=82]="OPTION",t[t.P=83]="P",t[t.PARAM=84]="PARAM",t[t.PLAINTEXT=85]="PLAINTEXT",t[t.PRE=86]="PRE",t[t.RB=87]="RB",t[t.RP=88]="RP",t[t.RT=89]="RT",t[t.RTC=90]="RTC",t[t.RUBY=91]="RUBY",t[t.S=92]="S",t[t.SCRIPT=93]="SCRIPT",t[t.SEARCH=94]="SEARCH",t[t.SECTION=95]="SECTION",t[t.SELECT=96]="SELECT",t[t.SOURCE=97]="SOURCE",t[t.SMALL=98]="SMALL",t[t.SPAN=99]="SPAN",t[t.STRIKE=100]="STRIKE",t[t.STRONG=101]="STRONG",t[t.STYLE=102]="STYLE",t[t.SUB=103]="SUB",t[t.SUMMARY=104]="SUMMARY",t[t.SUP=105]="SUP",t[t.TABLE=106]="TABLE",t[t.TBODY=107]="TBODY",t[t.TEMPLATE=108]="TEMPLATE",t[t.TEXTAREA=109]="TEXTAREA",t[t.TFOOT=110]="TFOOT",t[t.TD=111]="TD",t[t.TH=112]="TH",t[t.THEAD=113]="THEAD",t[t.TITLE=114]="TITLE",t[t.TR=115]="TR",t[t.TRACK=116]="TRACK",t[t.TT=117]="TT",t[t.U=118]="U",t[t.UL=119]="UL",t[t.SVG=120]="SVG",t[t.VAR=121]="VAR",t[t.WBR=122]="WBR",t[t.XMP=123]="XMP"})(d||(d={}));u.A,d.A,u.ADDRESS,d.ADDRESS,u.ANNOTATION_XML,d.ANNOTATION_XML,u.APPLET,d.APPLET,u.AREA,d.AREA,u.ARTICLE,d.ARTICLE,u.ASIDE,d.ASIDE,u.B,d.B,u.BASE,d.BASE,u.BASEFONT,d.BASEFONT,u.BGSOUND,d.BGSOUND,u.BIG,d.BIG,u.BLOCKQUOTE,d.BLOCKQUOTE,u.BODY,d.BODY,u.BR,d.BR,u.BUTTON,d.BUTTON,u.CAPTION,d.CAPTION,u.CENTER,d.CENTER,u.CODE,d.CODE,u.COL,d.COL,u.COLGROUP,d.COLGROUP,u.DD,d.DD,u.DESC,d.DESC,u.DETAILS,d.DETAILS,u.DIALOG,d.DIALOG,u.DIR,d.DIR,u.DIV,d.DIV,u.DL,d.DL,u.DT,d.DT,u.EM,d.EM,u.EMBED,d.EMBED,u.FIELDSET,d.FIELDSET,u.FIGCAPTION,d.FIGCAPTION,u.FIGURE,d.FIGURE,u.FONT,d.FONT,u.FOOTER,d.FOOTER,u.FOREIGN_OBJECT,d.FOREIGN_OBJECT,u.FORM,d.FORM,u.FRAME,d.FRAME,u.FRAMESET,d.FRAMESET,u.H1,d.H1,u.H2,d.H2,u.H3,d.H3,u.H4,d.H4,u.H5,d.H5,u.H6,d.H6,u.HEAD,d.HEAD,u.HEADER,d.HEADER,u.HGROUP,d.HGROUP,u.HR,d.HR,u.HTML,d.HTML,u.I,d.I,u.IMG,d.IMG,u.IMAGE,d.IMAGE,u.INPUT,d.INPUT,u.IFRAME,d.IFRAME,u.KEYGEN,d.KEYGEN,u.LABEL,d.LABEL,u.LI,d.LI,u.LINK,d.LINK,u.LISTING,d.LISTING,u.MAIN,d.MAIN,u.MALIGNMARK,d.MALIGNMARK,u.MARQUEE,d.MARQUEE,u.MATH,d.MATH,u.MENU,d.MENU,u.META,d.META,u.MGLYPH,d.MGLYPH,u.MI,d.MI,u.MO,d.MO,u.MN,d.MN,u.MS,d.MS,u.MTEXT,d.MTEXT,u.NAV,d.NAV,u.NOBR,d.NOBR,u.NOFRAMES,d.NOFRAMES,u.NOEMBED,d.NOEMBED,u.NOSCRIPT,d.NOSCRIPT,u.OBJECT,d.OBJECT,u.OL,d.OL,u.OPTGROUP,d.OPTGROUP,u.OPTION,d.OPTION,u.P,d.P,u.PARAM,d.PARAM,u.PLAINTEXT,d.PLAINTEXT,u.PRE,d.PRE,u.RB,d.RB,u.RP,d.RP,u.RT,d.RT,u.RTC,d.RTC,u.RUBY,d.RUBY,u.S,d.S,u.SCRIPT,d.SCRIPT,u.SEARCH,d.SEARCH,u.SECTION,d.SECTION,u.SELECT,d.SELECT,u.SOURCE,d.SOURCE,u.SMALL,d.SMALL,u.SPAN,d.SPAN,u.STRIKE,d.STRIKE,u.STRONG,d.STRONG,u.STYLE,d.STYLE,u.SUB,d.SUB,u.SUMMARY,d.SUMMARY,u.SUP,d.SUP,u.TABLE,d.TABLE,u.TBODY,d.TBODY,u.TEMPLATE,d.TEMPLATE,u.TEXTAREA,d.TEXTAREA,u.TFOOT,d.TFOOT,u.TD,d.TD,u.TH,d.TH,u.THEAD,d.THEAD,u.TITLE,d.TITLE,u.TR,d.TR,u.TRACK,d.TRACK,u.TT,d.TT,u.U,d.U,u.UL,d.UL,u.SVG,d.SVG,u.VAR,d.VAR,u.WBR,d.WBR,u.XMP,d.XMP;const h=d;x.HTML+"",h.ADDRESS,h.APPLET,h.AREA,h.ARTICLE,h.ASIDE,h.BASE,h.BASEFONT,h.BGSOUND,h.BLOCKQUOTE,h.BODY,h.BR,h.BUTTON,h.CAPTION,h.CENTER,h.COL,h.COLGROUP,h.DD,h.DETAILS,h.DIR,h.DIV,h.DL,h.DT,h.EMBED,h.FIELDSET,h.FIGCAPTION,h.FIGURE,h.FOOTER,h.FORM,h.FRAME,h.FRAMESET,h.H1,h.H2,h.H3,h.H4,h.H5,h.H6,h.HEAD,h.HEADER,h.HGROUP,h.HR,h.HTML,h.IFRAME,h.IMG,h.INPUT,h.LI,h.LINK,h.LISTING,h.MAIN,h.MARQUEE,h.MENU,h.META,h.NAV,h.NOEMBED,h.NOFRAMES,h.NOSCRIPT,h.OBJECT,h.OL,h.P,h.PARAM,h.PLAINTEXT,h.PRE,h.SCRIPT,h.SECTION,h.SELECT,h.SOURCE,h.STYLE,h.SUMMARY,h.TABLE,h.TBODY,h.TD,h.TEMPLATE,h.TEXTAREA,h.TFOOT,h.TH,h.THEAD,h.TITLE,h.TR,h.TRACK,h.UL,h.WBR,h.XMP,x.MATHML+"",h.MI,h.MO,h.MN,h.MS,h.MTEXT,h.ANNOTATION_XML,x.SVG+"",h.TITLE,h.FOREIGN_OBJECT,h.DESC,x.XLINK+"",x.XML+"",x.XMLNS+"";h.H1,h.H2,h.H3,h.H4,h.H5,h.H6;u.STYLE,u.SCRIPT,u.XMP,u.IFRAME,u.NOEMBED,u.NOFRAMES,u.PLAINTEXT;var U;(function(t){t[t.DATA=0]="DATA",t[t.RCDATA=1]="RCDATA",t[t.RAWTEXT=2]="RAWTEXT",t[t.SCRIPT_DATA=3]="SCRIPT_DATA",t[t.PLAINTEXT=4]="PLAINTEXT",t[t.TAG_OPEN=5]="TAG_OPEN",t[t.END_TAG_OPEN=6]="END_TAG_OPEN",t[t.TAG_NAME=7]="TAG_NAME",t[t.RCDATA_LESS_THAN_SIGN=8]="RCDATA_LESS_THAN_SIGN",t[t.RCDATA_END_TAG_OPEN=9]="RCDATA_END_TAG_OPEN",t[t.RCDATA_END_TAG_NAME=10]="RCDATA_END_TAG_NAME",t[t.RAWTEXT_LESS_THAN_SIGN=11]="RAWTEXT_LESS_THAN_SIGN",t[t.RAWTEXT_END_TAG_OPEN=12]="RAWTEXT_END_TAG_OPEN",t[t.RAWTEXT_END_TAG_NAME=13]="RAWTEXT_END_TAG_NAME",t[t.SCRIPT_DATA_LESS_THAN_SIGN=14]="SCRIPT_DATA_LESS_THAN_SIGN",t[t.SCRIPT_DATA_END_TAG_OPEN=15]="SCRIPT_DATA_END_TAG_OPEN",t[t.SCRIPT_DATA_END_TAG_NAME=16]="SCRIPT_DATA_END_TAG_NAME",t[t.SCRIPT_DATA_ESCAPE_START=17]="SCRIPT_DATA_ESCAPE_START",t[t.SCRIPT_DATA_ESCAPE_START_DASH=18]="SCRIPT_DATA_ESCAPE_START_DASH",t[t.SCRIPT_DATA_ESCAPED=19]="SCRIPT_DATA_ESCAPED",t[t.SCRIPT_DATA_ESCAPED_DASH=20]="SCRIPT_DATA_ESCAPED_DASH",t[t.SCRIPT_DATA_ESCAPED_DASH_DASH=21]="SCRIPT_DATA_ESCAPED_DASH_DASH",t[t.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN=22]="SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN",t[t.SCRIPT_DATA_ESCAPED_END_TAG_OPEN=23]="SCRIPT_DATA_ESCAPED_END_TAG_OPEN",t[t.SCRIPT_DATA_ESCAPED_END_TAG_NAME=24]="SCRIPT_DATA_ESCAPED_END_TAG_NAME",t[t.SCRIPT_DATA_DOUBLE_ESCAPE_START=25]="SCRIPT_DATA_DOUBLE_ESCAPE_START",t[t.SCRIPT_DATA_DOUBLE_ESCAPED=26]="SCRIPT_DATA_DOUBLE_ESCAPED",t[t.SCRIPT_DATA_DOUBLE_ESCAPED_DASH=27]="SCRIPT_DATA_DOUBLE_ESCAPED_DASH",t[t.SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH=28]="SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH",t[t.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN=29]="SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN",t[t.SCRIPT_DATA_DOUBLE_ESCAPE_END=30]="SCRIPT_DATA_DOUBLE_ESCAPE_END",t[t.BEFORE_ATTRIBUTE_NAME=31]="BEFORE_ATTRIBUTE_NAME",t[t.ATTRIBUTE_NAME=32]="ATTRIBUTE_NAME",t[t.AFTER_ATTRIBUTE_NAME=33]="AFTER_ATTRIBUTE_NAME",t[t.BEFORE_ATTRIBUTE_VALUE=34]="BEFORE_ATTRIBUTE_VALUE",t[t.ATTRIBUTE_VALUE_DOUBLE_QUOTED=35]="ATTRIBUTE_VALUE_DOUBLE_QUOTED",t[t.ATTRIBUTE_VALUE_SINGLE_QUOTED=36]="ATTRIBUTE_VALUE_SINGLE_QUOTED",t[t.ATTRIBUTE_VALUE_UNQUOTED=37]="ATTRIBUTE_VALUE_UNQUOTED",t[t.AFTER_ATTRIBUTE_VALUE_QUOTED=38]="AFTER_ATTRIBUTE_VALUE_QUOTED",t[t.SELF_CLOSING_START_TAG=39]="SELF_CLOSING_START_TAG",t[t.BOGUS_COMMENT=40]="BOGUS_COMMENT",t[t.MARKUP_DECLARATION_OPEN=41]="MARKUP_DECLARATION_OPEN",t[t.COMMENT_START=42]="COMMENT_START",t[t.COMMENT_START_DASH=43]="COMMENT_START_DASH",t[t.COMMENT=44]="COMMENT",t[t.COMMENT_LESS_THAN_SIGN=45]="COMMENT_LESS_THAN_SIGN",t[t.COMMENT_LESS_THAN_SIGN_BANG=46]="COMMENT_LESS_THAN_SIGN_BANG",t[t.COMMENT_LESS_THAN_SIGN_BANG_DASH=47]="COMMENT_LESS_THAN_SIGN_BANG_DASH",t[t.COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH=48]="COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH",t[t.COMMENT_END_DASH=49]="COMMENT_END_DASH",t[t.COMMENT_END=50]="COMMENT_END",t[t.COMMENT_END_BANG=51]="COMMENT_END_BANG",t[t.DOCTYPE=52]="DOCTYPE",t[t.BEFORE_DOCTYPE_NAME=53]="BEFORE_DOCTYPE_NAME",t[t.DOCTYPE_NAME=54]="DOCTYPE_NAME",t[t.AFTER_DOCTYPE_NAME=55]="AFTER_DOCTYPE_NAME",t[t.AFTER_DOCTYPE_PUBLIC_KEYWORD=56]="AFTER_DOCTYPE_PUBLIC_KEYWORD",t[t.BEFORE_DOCTYPE_PUBLIC_IDENTIFIER=57]="BEFORE_DOCTYPE_PUBLIC_IDENTIFIER",t[t.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED=58]="DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED",t[t.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED=59]="DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED",t[t.AFTER_DOCTYPE_PUBLIC_IDENTIFIER=60]="AFTER_DOCTYPE_PUBLIC_IDENTIFIER",t[t.BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS=61]="BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS",t[t.AFTER_DOCTYPE_SYSTEM_KEYWORD=62]="AFTER_DOCTYPE_SYSTEM_KEYWORD",t[t.BEFORE_DOCTYPE_SYSTEM_IDENTIFIER=63]="BEFORE_DOCTYPE_SYSTEM_IDENTIFIER",t[t.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED=64]="DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED",t[t.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED=65]="DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED",t[t.AFTER_DOCTYPE_SYSTEM_IDENTIFIER=66]="AFTER_DOCTYPE_SYSTEM_IDENTIFIER",t[t.BOGUS_DOCTYPE=67]="BOGUS_DOCTYPE",t[t.CDATA_SECTION=68]="CDATA_SECTION",t[t.CDATA_SECTION_BRACKET=69]="CDATA_SECTION_BRACKET",t[t.CDATA_SECTION_END=70]="CDATA_SECTION_END",t[t.CHARACTER_REFERENCE=71]="CHARACTER_REFERENCE",t[t.AMBIGUOUS_AMPERSAND=72]="AMBIGUOUS_AMPERSAND"})(U||(U={}));U.DATA,U.RCDATA,U.RAWTEXT,U.SCRIPT_DATA,U.PLAINTEXT,U.CDATA_SECTION;const Vr=new Set([d.DD,d.DT,d.LI,d.OPTGROUP,d.OPTION,d.P,d.RB,d.RP,d.RT,d.RTC]);[...Vr,d.CAPTION,d.COLGROUP,d.TBODY,d.TD,d.TFOOT,d.TH,d.THEAD,d.TR];const An=new Set([d.APPLET,d.CAPTION,d.HTML,d.MARQUEE,d.OBJECT,d.TABLE,d.TD,d.TEMPLATE,d.TH]);[...An,d.OL,d.UL];[...An,d.BUTTON];d.ANNOTATION_XML,d.MI,d.MN,d.MO,d.MS,d.MTEXT;d.DESC,d.FOREIGN_OBJECT,d.TITLE;d.TR,d.TEMPLATE,d.HTML;d.TBODY,d.TFOOT,d.THEAD,d.TEMPLATE,d.HTML;d.TABLE,d.TEMPLATE,d.HTML;d.TD,d.TH;var Yt;(function(t){t[t.Marker=0]="Marker",t[t.Element=1]="Element"})(Yt||(Yt={}));Yt.Marker;new Map(["attributeName","attributeType","baseFrequency","baseProfile","calcMode","clipPathUnits","diffuseConstant","edgeMode","filterUnits","glyphRef","gradientTransform","gradientUnits","kernelMatrix","kernelUnitLength","keyPoints","keySplines","keyTimes","lengthAdjust","limitingConeAngle","markerHeight","markerUnits","markerWidth","maskContentUnits","maskUnits","numOctaves","pathLength","patternContentUnits","patternTransform","patternUnits","pointsAtX","pointsAtY","pointsAtZ","preserveAlpha","preserveAspectRatio","primitiveUnits","refX","refY","repeatCount","repeatDur","requiredExtensions","requiredFeatures","specularConstant","specularExponent","spreadMethod","startOffset","stdDeviation","stitchTiles","surfaceScale","systemLanguage","tableValues","targetX","targetY","textLength","viewBox","viewTarget","xChannelSelector","yChannelSelector","zoomAndPan"].map(t=>[t.toLowerCase(),t]));x.XLINK,x.XLINK,x.XLINK,x.XLINK,x.XLINK,x.XLINK,x.XLINK,x.XML,x.XML,x.XMLNS,x.XMLNS;new Map(["altGlyph","altGlyphDef","altGlyphItem","animateColor","animateMotion","animateTransform","clipPath","feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feDistantLight","feFlood","feFuncA","feFuncB","feFuncG","feFuncR","feGaussianBlur","feImage","feMerge","feMergeNode","feMorphology","feOffset","fePointLight","feSpecularLighting","feSpotLight","feTile","feTurbulence","foreignObject","glyphRef","linearGradient","radialGradient","textPath"].map(t=>[t.toLowerCase(),t]));d.B,d.BIG,d.BLOCKQUOTE,d.BODY,d.BR,d.CENTER,d.CODE,d.DD,d.DIV,d.DL,d.DT,d.EM,d.EMBED,d.H1,d.H2,d.H3,d.H4,d.H5,d.H6,d.HEAD,d.HR,d.I,d.IMG,d.LI,d.LISTING,d.MENU,d.META,d.NOBR,d.OL,d.P,d.PRE,d.RUBY,d.S,d.SMALL,d.SPAN,d.STRONG,d.STRIKE,d.SUB,d.SUP,d.TABLE,d.TT,d.U,d.UL,d.VAR;var Ne;(function(t){t[t.INITIAL=0]="INITIAL",t[t.BEFORE_HTML=1]="BEFORE_HTML",t[t.BEFORE_HEAD=2]="BEFORE_HEAD",t[t.IN_HEAD=3]="IN_HEAD",t[t.IN_HEAD_NO_SCRIPT=4]="IN_HEAD_NO_SCRIPT",t[t.AFTER_HEAD=5]="AFTER_HEAD",t[t.IN_BODY=6]="IN_BODY",t[t.TEXT=7]="TEXT",t[t.IN_TABLE=8]="IN_TABLE",t[t.IN_TABLE_TEXT=9]="IN_TABLE_TEXT",t[t.IN_CAPTION=10]="IN_CAPTION",t[t.IN_COLUMN_GROUP=11]="IN_COLUMN_GROUP",t[t.IN_TABLE_BODY=12]="IN_TABLE_BODY",t[t.IN_ROW=13]="IN_ROW",t[t.IN_CELL=14]="IN_CELL",t[t.IN_SELECT=15]="IN_SELECT",t[t.IN_SELECT_IN_TABLE=16]="IN_SELECT_IN_TABLE",t[t.IN_TEMPLATE=17]="IN_TEMPLATE",t[t.AFTER_BODY=18]="AFTER_BODY",t[t.IN_FRAMESET=19]="IN_FRAMESET",t[t.AFTER_FRAMESET=20]="AFTER_FRAMESET",t[t.AFTER_AFTER_BODY=21]="AFTER_AFTER_BODY",t[t.AFTER_AFTER_FRAMESET=22]="AFTER_AFTER_FRAMESET"})(Ne||(Ne={}));d.TABLE,d.TBODY,d.TFOOT,d.THEAD,d.TR;d.CAPTION,d.COL,d.COLGROUP,d.TBODY,d.TD,d.TFOOT,d.TH,d.THEAD,d.TR;u.AREA,u.BASE,u.BASEFONT,u.BGSOUND,u.BR,u.COL,u.EMBED,u.FRAME,u.HR,u.IMG,u.INPUT,u.KEYGEN,u.LINK,u.META,u.PARAM,u.SOURCE,u.TRACK,u.WBR;class qr{constructor(){this.proxies=["https://api.allorigins.win/raw?url=","https://cors-anywhere.herokuapp.com/","https://thingproxy.freeboard.io/fetch/","https://cors.bridged.cc/","https://api.codetabs.com/v1/proxy?quest=","https://corsproxy.io/?","https://cors-anywhere.1d4s.me/","https://cors-anywhere.herokuapp.com/"],this.currentProxyIndex=0}async fetchWithFallback(e,n={}){return this.fetchWithProxy(e)}async fetchWithProxy(e){let n=null;for(let i=0;i<this.proxies.length;i++){const s=(this.currentProxyIndex+i)%this.proxies.length,r=this.proxies[s];try{const a=await fetch(r+encodeURIComponent(e),{method:"GET",headers:{Accept:"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8","Accept-Language":"en-US,en;q=0.5","Accept-Encoding":"gzip, deflate",DNT:"1",Connection:"keep-alive","Upgrade-Insecure-Requests":"1","User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"},timeout:1e4});if(a.ok){const o=await a.text();if(o.includes("<html")||o.includes("<head")||o.includes("<body"))return this.currentProxyIndex=s,o}}catch(a){console.log(`Proxy ${s} fallito:`,a.message),n=a}}try{const i=await fetch(e,{method:"GET",headers:{Accept:"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8","User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}});if(i.ok)return await i.text()}catch(i){console.log("Anche l'approccio diretto è fallito:",i)}throw n||new Error("Impossibile recuperare il contenuto")}async extractMetadata(e){try{const n=localStorage.getItem("aideas-language")||"it",i=await fetch(`http://localhost:4000/extract?url=${encodeURIComponent(e)}&lang=${n}`);if(!i.ok)throw new Error("Proxy meta fallito");return await i.json()}catch{const i=new URL(e).hostname;return{title:i,description:`App web da ${i}`,icon:`https://www.google.com/s2/favicons?domain=${i}&sz=64`}}}extractBestIcon(e,n){const i=['link[rel="apple-touch-icon"][sizes="180x180"]','link[rel="apple-touch-icon"][sizes="152x152"]','link[rel="apple-touch-icon"][sizes="144x144"]','link[rel="apple-touch-icon"][sizes="120x120"]','link[rel="apple-touch-icon"]','link[rel="icon"][type="image/png"][sizes="32x32"]','link[rel="icon"][type="image/png"][sizes="16x16"]','link[rel="icon"][type="image/svg+xml"]','link[rel="shortcut icon"]','link[rel="icon"]'];for(const s of i){const r=e(s).attr("href");if(r)return new URL(r,n).href}return null}extractTitle(e){const n=[/<title[^>]*>([^<]+)<\/title>/i,/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i,/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i];for(const i of n){const s=e.match(i);if(s){const r=s[1].trim();if(r&&r.length>0)return r}}return null}extractDescription(e){const n=[/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i,/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i,/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i,/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i];for(const i of n){const s=e.match(i);if(s){const r=s[1].trim();if(r&&r.length>0)return r}}return null}extractIcon(e,n){const i=[/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i,/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:icon|shortcut icon)["']/i,/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i,/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']apple-touch-icon["']/i];for(const s of i){const r=e.match(s);if(r)try{const a=new URL(r[1],n).href;return console.log("Icona trovata:",a),a}catch{console.log("URL icona non valido:",r[1])}}return null}extractAppleTouchIcon(e,n){const i=[/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i,/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']apple-touch-icon["']/i,/<link[^>]*rel=["']apple-touch-icon-precomposed["'][^>]*href=["']([^"']+)["']/i,/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']apple-touch-icon-precomposed["']/i];for(const s of i){const r=e.match(s);if(r)try{const a=new URL(r[1],n).href;return console.log("Apple Touch Icon trovata:",a),a}catch{console.log("URL apple-touch-icon non valido:",r[1])}}return null}extractKeywords(e){const n=e.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);return n?n[1].trim():null}extractAuthor(e){const n=e.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i);return n?n[1].trim():null}extractOGImage(e){const n=e.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);return n?n[1].trim():null}extractOGTitle(e){const n=e.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);return n?n[1].trim():null}extractOGDescription(e){const n=e.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);return n?n[1].trim():null}async testProxy(e){try{return(await fetch(e+encodeURIComponent("https://httpbin.org/ip"),{method:"GET",timeout:5e3})).ok}catch{return!1}}async getProxyStatus(){const e={};for(let n=0;n<this.proxies.length;n++){const i=this.proxies[n];e[i]=await this.testProxy(i)}return e}}var jr=Sn();const Wr=He(jr);class Yr{constructor(){this.maxFileSize=50*1024*1024,this.supportedFormats=["zip"],this.categories=["productivity","entertainment","communication","development","design","finance","health","news","shopping","travel","ai","social","education","business","utility","pwa"],this.proxyService=new qr,this.init&&(this.init=this.init.bind(this)),this.showModal&&(this.showModal=this.showModal.bind(this)),this.importFromZip&&(this.importFromZip=this.importFromZip.bind(this)),this.importFromUrl&&(this.importFromUrl=this.importFromUrl.bind(this)),this.importFromGitHub&&(this.importFromGitHub=this.importFromGitHub.bind(this)),this.validateAppData&&(this.validateAppData=this.validateAppData.bind(this)),this.extractAppMetadata&&(this.extractAppMetadata=this.extractAppMetadata.bind(this)),this.setupDropZone&&(this.setupDropZone=this.setupDropZone.bind(this))}async init(){console.log("🔧 Inizializzazione AppImporter..."),this.setupDropZone(),this.setupKeyboardShortcuts()}showModal(){const e=this.createImportModal();D("app-import-modal",e,{size:"modal-xl",disableBackdropClose:!1}),setTimeout(()=>{this.setupModalEventListeners();const n=document.getElementById("form-html");n&&n.classList.add("active");const i=document.querySelector('[data-section="html"]');i&&i.classList.add("active")},100)}createImportModal(){return`
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
                  <p class="setting-description">Scegli come questa app dovrebbe aprirsi di default</p>
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
    `}setupModalEventListeners(){const e=document.getElementById("app-import-modal");if(!e)return;const n=e.querySelectorAll(".settings-nav-btn"),i=e.querySelectorAll(".settings-section");n.forEach(o=>{o.addEventListener("click",()=>{const c=o.dataset.section;n.forEach(l=>l.classList.remove("active")),o.classList.add("active"),i.forEach(l=>{l.style.display="none",l.classList.remove("active"),l.id===`section-${c}`&&(l.style.display="block",l.classList.add("active"))})})}),this.setupHtmlImport(e),this.setupUrlImport(e),this.setupGitHubImport(e),this.setupMetadataForm(e),e.querySelector("#start-import")?.addEventListener("click",()=>{this.startImport()}),e.querySelector("#cancel-import")?.addEventListener("click",()=>{B("app-import-modal")}),e.querySelector(".modal-close")?.addEventListener("click",()=>{B("app-import-modal")}),e.addEventListener("keydown",o=>{o.key==="Escape"&&B("app-import-modal")})}setupZipImport(e){const n=e.querySelector("#zip-drop-zone"),i=e.querySelector("#zip-file-input");e.querySelector("#select-zip-btn")?.addEventListener("click",()=>{i?.click()}),i?.addEventListener("change",r=>{const a=r.target.files[0];a&&this.handleZipFile(a)}),n?.addEventListener("dragover",r=>{r.preventDefault(),n.classList.add("drag-over")}),n?.addEventListener("dragleave",r=>{r.preventDefault(),n.classList.remove("drag-over")}),n?.addEventListener("drop",r=>{r.preventDefault(),n.classList.remove("drag-over");const a=r.dataTransfer.files[0];a&&a.name.endsWith(".zip")?this.handleZipFile(a):v("Per favore seleziona un file ZIP valido","error")})}setupUrlImport(e){const n=e.querySelector("#url-input"),i=e.querySelector("#test-url-btn"),s=e.querySelector("#url-preview-container");i?.addEventListener("click",async()=>{const r=n?.value.trim();if(!r){v("Inserisci un URL valido","error");return}if(!fe(r)){v("URL non valido","error");return}try{i.disabled=!0,i.textContent="Testando...",await this.testUrl(r,s),i.textContent="Test",i.disabled=!1}catch(a){console.error("Errore test URL:",a),v("Errore durante il test dell'URL","error"),i.textContent="Test",i.disabled=!1}}),n?.addEventListener("input",()=>{const r=n.value.trim();r&&fe(r)?this.enableImportButton():this.disableImportButton()})}setupGitHubImport(e){const n=e.querySelector("#github-url-input"),i=e.querySelector("#github-preview-container");n?.addEventListener("input",async()=>{const s=n.value.trim();if(s&&this.isGitHubUrl(s))try{await this.fetchGitHubInfo(s,i),this.enableImportButton()}catch(r){console.error("Errore fetch GitHub:",r),v("Errore durante il recupero delle informazioni GitHub","error")}else this.disableImportButton(),i&&(i.style.display="none")})}setupMetadataForm(e){const n=e.querySelector("#app-description"),i=e.querySelector("#desc-char-count"),s=e.querySelector("#app-icon"),r=e.querySelector("#upload-icon-btn"),a=e.querySelector("#icon-file-input"),o=e.querySelector("#icon-preview");n?.addEventListener("input",()=>{const c=n.value.length;i&&(i.textContent=c,i.style.color=c>180?"var(--color-error)":"var(--color-gray-500)")}),r?.addEventListener("click",()=>{a?.click()}),a?.addEventListener("change",c=>{const l=c.target.files[0];l&&this.handleIconUpload(l,s,o)}),s?.addEventListener("blur",()=>{const c=s.value.trim();c&&this.showIconPreview(c,o)})}setupHtmlImport(e){e.querySelector("#html-file-input")?.addEventListener("change",i=>{const s=i.target.files[0];s&&this.handleHtmlFile(s)})}async handleZipFile(e){try{if(e.size>this.maxFileSize){v(`File troppo grande. Massimo: ${at(this.maxFileSize)}`,"error");return}v("Analizzando file ZIP...","info");const i=await new Wr().loadAsync(e),s=[];let r=null;for(const[p,f]of Object.entries(i.files)){if(f.dir)continue;const g=await f.async("text"),m={filename:p,content:g,size:g.length,mimeType:this.getMimeType(p)};if(s.push(m),p==="aideas.json")try{r=JSON.parse(g)}catch(b){console.warn("Manifest aideas.json non valido:",b)}}if(!s.some(p=>p.filename.endsWith(".html"))){v("Il ZIP deve contenere almeno un file HTML","error");return}const o=this.extractZipMetadata(s,r);this.populateMetadataForm(o);const c=document.getElementById("section-metadata");c&&(c.style.display="block"),this.currentImportData={type:"zip",files:s,manifest:r,metadata:o,originalFile:e};const l=document.getElementById("start-import");l&&(l.disabled=!1),v("ZIP analizzato con successo!","success")}catch(n){console.error("Errore durante l'analisi del ZIP:",n),v("Errore durante l'analisi del file ZIP","error")}}async testUrl(e,n){if(!n)return;n.style.display="block";const i=n.querySelector(".status-badge"),s=n.querySelector(".preview-title"),r=n.querySelector(".preview-url");i.textContent="Verificando...",i.className="status-badge",s.textContent="Caricamento...",r.textContent=e;try{const a=await this.extractUrlMetadata(e);s.textContent=a.title||a.name||ge(e),i.textContent=a.isPWA?"✓ PWA Rilevata":"✓ Sito Web",i.className=a.isPWA?"status-badge badge-success":"status-badge badge-info",this.populateMetadataForm(a);const o=document.getElementById("section-metadata");o&&(o.style.display="block"),this.currentImportData={type:a.isPWA?"pwa":"url",url:e,metadata:a};const c=document.getElementById("start-import");c&&(c.disabled=!1)}catch(a){console.error("Errore test URL:",a),i.textContent="⚠ Errore",i.className="status-badge badge-error",s.textContent="Impossibile verificare il sito"}}async fetchGitHubInfo(e,n){if(!n)return;const i=this.parseGitHubUrl(e);if(!i){v("URL GitHub non valido","error");return}try{const s=`https://api.github.com/repos/${i.owner}/${i.repo}`,r=await fetch(s);if(!r.ok)throw new Error("Repository non trovato o non accessibile");const a=await r.json();n.style.display="block",n.querySelector("#repo-avatar").src=a.owner.avatar_url,n.querySelector("#repo-name").textContent=a.full_name,n.querySelector("#repo-description").textContent=a.description||"Nessuna descrizione",n.querySelector("#repo-stars").textContent=a.stargazers_count,n.querySelector("#repo-forks").textContent=a.forks_count,n.querySelector("#repo-updated").textContent=new Date(a.updated_at).toLocaleDateString();const o={name:a.name,description:a.description,category:"tools",version:"1.0.0",githubUrl:e};this.populateMetadataForm(o);const c=document.getElementById("section-metadata");c&&(c.style.display="block"),this.currentImportData={type:"github",url:e,githubUrl:e,repoData:a,metadata:o};const l=document.getElementById("start-import");l&&(l.disabled=!1)}catch(s){console.error("Errore fetch GitHub:",s),v(`Errore: ${s.message}`,"error")}}async startImport(){if(!this.currentImportData){v("Nessun dato da importare","error");return}try{this.showImportProgress(!0);const e=this.collectFormData(),n=this.validateAppData(e);if(!n.valid)throw new Error(n.error);const i={...this.currentImportData.metadata,...e,type:this.currentImportData.type,url:this.currentImportData.url,githubUrl:this.currentImportData.githubUrl,files:this.currentImportData.files,content:this.currentImportData.content};this.updateImportProgress(50,"Salvando app...");const s=await C.installApp(i);this.updateImportProgress(100,"Importazione completata!"),setTimeout(()=>{B("app-import-modal"),v(`App "${i.name}" importata con successo!`,"success"),window.aideasApp&&window.aideasApp.loadApps&&window.aideasApp.loadApps()},1e3)}catch(e){console.error("Errore durante l'importazione:",e),v(`Errore importazione: ${e.message}`,"error"),this.showImportProgress(!1)}}extractZipMetadata(e,n){const i={name:n?.name||"App Importata",description:n?.description||"",version:n?.version||"1.0.0",category:n?.category||"tools",tags:n?.tags||[],icon:n?.icon||null,permissions:n?.permissions||[]};if(!i.icon){const s=e.find(r=>r.filename.match(/^(icon|logo|app-icon)\.(png|jpg|jpeg|svg)$/i));if(s){const r=new Blob([s.content],{type:s.mimeType});i.icon=URL.createObjectURL(r)}}return i}async extractUrlMetadata(e){const n=ge(e),i=new URL(e).origin;try{const s=await this.fetchManifest(e);if(s)return{name:s.name||s.short_name||n,title:s.name||s.short_name||n,description:s.description||`Progressive Web App da ${n}`,category:"pwa",url:e,icon:this.getBestIcon(s.icons,i),isPWA:!0,manifest:s,version:s.version||"1.0.0",theme_color:s.theme_color,background_color:s.background_color};const r=await this.fetchHtmlMetadata(e);if(r){const a=r.icon||r.appleTouchIcon||`https://www.google.com/s2/favicons?domain=${n}&sz=64`;return{name:r.title||r.ogTitle||n,title:r.title||r.ogTitle||n,description:r.description||r.ogDescription||`App web da ${n}`,category:"tools",url:e,icon:a,isPWA:!1,version:"1.0.0"}}return{name:n,title:n,description:`App web da ${n}`,category:"tools",url:e,icon:`https://www.google.com/s2/favicons?domain=${n}&sz=64`,isPWA:!1,version:"1.0.0"}}catch(s){return console.error("Errore estrazione metadati:",s),{name:n,title:n,description:`App web da ${n}`,category:"tools",url:e,icon:`https://www.google.com/s2/favicons?domain=${n}&sz=64`,isPWA:!1,version:"1.0.0"}}}async fetchManifest(e){try{const i=`${new URL(e).origin}/manifest.json`,s=await fetch(i,{method:"GET",headers:{Accept:"application/json"}});if(s.ok){const r=await s.json();if(r.name||r.short_name)return r}return null}catch(n){return console.log("Manifest non trovato:",n),null}}async fetchHtmlMetadata(e){try{const n=await this.proxyService.extractMetadata(e);return{title:n.title||n.ogTitle,description:n.description||n.ogDescription,icon:n.icon,appleTouchIcon:n.appleTouchIcon,keywords:n.keywords,author:n.author,ogImage:n.ogImage,ogTitle:n.ogTitle,ogDescription:n.ogDescription}}catch(n){console.log("Impossibile estrarre metadati HTML con proxy, provo approccio diretto:",n);try{const i=await fetch(e,{method:"GET",headers:{Accept:"text/html"}});if(!i.ok)throw new Error("Pagina non accessibile");const s=await i.text(),r=s.match(/<title[^>]*>([^<]+)<\/title>/i),a=s.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i),o=s.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i),c=s.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i),l=new URL(e).origin;return{title:r?r[1].trim():null,description:a?a[1].trim():null,icon:o?new URL(o[1],l).href:null,appleTouchIcon:c?new URL(c[1],l).href:null}}catch(i){return console.log("Anche l'approccio diretto è fallito:",i),null}}}getBestIcon(e,n){if(!e||!Array.isArray(e))return null;const i=["512x512","192x192","144x144","96x96"];for(const s of i){const r=e.find(a=>a.sizes===s||a.sizes&&a.sizes.includes(s));if(r)return new URL(r.src,n).href}return e.length>0?new URL(e[0].src,n).href:null}parseGitHubUrl(e){const n=[/github\.com\/([^\/]+)\/([^\/]+)/,/([^\/]+)\.github\.io\/([^\/]+)/];for(const i of n){const s=e.match(i);if(s)return{owner:s[1],repo:s[2].replace(".git","")}}return null}isGitHubUrl(e){return e.includes("github.com")||e.includes("github.io")}getMimeType(e){const n=e.split(".").pop().toLowerCase();return{html:"text/html",css:"text/css",js:"application/javascript",json:"application/json",png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",gif:"image/gif",svg:"image/svg+xml",txt:"text/plain"}[n]||"application/octet-stream"}getCategoryLabel(e){return{productivity:"Produttività",entertainment:"Intrattenimento",tools:"Strumenti",games:"Giochi",ai:"Intelligenza Artificiale",social:"Social",education:"Educazione",business:"Business",utility:"Utilità",pwa:"Progressive Web App"}[e]||e}populateMetadataForm(e){const n={"app-name":e.name||e.title,"app-description":e.description,"app-version":e.version,"app-category":e.category,"app-tags":Array.isArray(e.tags)?e.tags.join(", "):e.tags,"app-icon":e.icon};for(const[i,s]of Object.entries(n)){const r=document.getElementById(i);r&&s&&(r.value=s,r.dispatchEvent(new Event("input")),r.dispatchEvent(new Event("change")))}if(e.isPWA&&e.manifest){if(e.theme_color){const i=document.getElementById("app-theme-color");i&&(i.value=e.theme_color)}if(e.background_color){const i=document.getElementById("app-bg-color");i&&(i.value=e.background_color)}}}collectFormData(){const e=document.getElementById("app-name"),n=document.getElementById("app-description"),i=document.getElementById("app-version"),s=document.getElementById("app-category"),r=document.getElementById("app-launch-mode"),a=document.getElementById("app-tags"),o=document.getElementById("app-icon"),c=a?.value?a.value.split(",").map(p=>p.trim()).filter(p=>p):[],l={name:e?.value.trim()||"",description:n?.value.trim()||"",version:i?.value.trim()||"1.0.0",category:s?.value||"tools",tags:c,icon:o?.value.trim()||null};return r&&r.value&&(l.metadata=l.metadata||{},l.metadata.launchMode=r.value),l}validateAppData(e){return e.name?e.name.length>50?{valid:!1,error:"Nome app troppo lungo (max 50 caratteri)"}:e.description&&e.description.length>200?{valid:!1,error:"Descrizione troppo lunga (max 200 caratteri)"}:{valid:!0}:{valid:!1,error:"Nome app richiesto"}}showImportProgress(e){const n=document.getElementById("import-progress"),i=document.getElementById("modal-actions");n&&i&&(n.style.display=e?"block":"none",i.style.display=e?"none":"flex")}updateImportProgress(e,n){const i=document.getElementById("progress-fill"),s=document.getElementById("progress-text");i&&(i.style.width=`${e}%`),s&&(s.textContent=n)}enableImportButton(){const e=document.getElementById("start-import");e&&(e.disabled=!1)}disableImportButton(){const e=document.getElementById("start-import");e&&(e.disabled=!0)}setupDropZone(){["dragenter","dragover","dragleave","drop"].forEach(e=>{document.addEventListener(e,n=>{n.preventDefault(),n.stopPropagation()},!1)}),document.addEventListener("drop",e=>{const n=e.dataTransfer.files[0];n&&n.name.endsWith(".zip")&&(this.showModal(),setTimeout(()=>{this.handleZipFile(n)},200))})}setupKeyboardShortcuts(){document.addEventListener("keydown",e=>{(e.ctrlKey||e.metaKey)&&e.key==="i"&&(e.preventDefault(),this.showModal())})}async handleIconUpload(e,n,i){if(!e.type.startsWith("image/")){v("Per favore seleziona un file immagine","error");return}if(e.size>2*1024*1024){v("Immagine troppo grande (max 2MB)","error");return}try{const s=new FileReader;s.onload=r=>{const a=r.target.result;n.value=a,this.showIconPreview(a,i)},s.readAsDataURL(e)}catch(s){console.error("Errore upload icona:",s),v("Errore durante l'upload dell'icona","error")}}showIconPreview(e,n){if(!n)return;const i=n.querySelector("#icon-preview-img");i&&(i.src=e,i.onload=()=>{n.style.display="block"},i.onerror=()=>{n.style.display="none",v("Impossibile caricare l'icona","warning")})}async handleHtmlFile(e){if(!e.type.startsWith("text/html")){v("Per favore seleziona un file HTML","error");return}if(e.size>2*1024*1024){v("File troppo grande (max 2MB)","error");return}try{const n=await e.text(),i=this.extractHtmlMetadata(n,e.name);this.populateMetadataForm(i);const s=document.getElementById("section-metadata");s&&(s.style.display="block",s.classList.add("active")),this.currentImportData={type:"html",content:n,metadata:i},this.enableImportButton(),v("File HTML analizzato con successo!","success")}catch(n){console.error("Errore durante l'importazione del file HTML:",n),v("Errore durante l'importazione del file HTML","error")}}extractHtmlMetadata(e,n){const s=new DOMParser().parseFromString(e,"text/html"),r=s.querySelector("title")?.textContent?.trim()||s.querySelector('meta[property="og:title"]')?.getAttribute("content")||n.replace(".html","").replace(/[-_]/g," "),a=s.querySelector('meta[name="description"]')?.getAttribute("content")||s.querySelector('meta[property="og:description"]')?.getAttribute("content")||"App web standalone";let o=null;const c=s.querySelector('link[rel="icon"]')?.getAttribute("href")||s.querySelector('link[rel="shortcut icon"]')?.getAttribute("href")||s.querySelector('link[rel="apple-touch-icon"]')?.getAttribute("href");c&&(c.startsWith("data:")||c.startsWith("http")?o=c:o=null);const p=(s.querySelector('meta[name="keywords"]')?.getAttribute("content")||"").split(",").map(m=>m.trim()).filter(m=>m.length>0);let f="tools";const g=s.body?.textContent?.toLowerCase()||"";return g.includes("calcolatric")||g.includes("calculator")?f="utilities":g.includes("game")||g.includes("gioco")?f="games":(g.includes("editor")||g.includes("text"))&&(f="productivity"),{name:r,description:a,category:f,type:"html",content:e,icon:o,tags:p,version:"1.0.0"}}}class Zr{static render(e,n="grid"){return n==="list"?this.renderListView(e):this.renderGridView(e)}static renderGridView(e){const{id:n,name:i,description:s,category:r,version:a,type:o,lastUsed:c,installDate:l,favorite:p,tags:f,icon:g,url:m,githubUrl:b,metadata:S}=e,O=N(i||"App Senza Nome"),w=N(s||"Nessuna descrizione disponibile"),H=this.getCategoryInfo(r),nt=this.getAppIcon(e),W=this.getTypeInfo(o),Y=ht(c);return`
      <div class="app-card" data-app-id="${n}" data-category="${r}" data-type="${o}">
        <!-- App Icon & Status -->
        <div class="app-card-header">
          <div class="app-icon-container">
            ${nt}
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
            <div class="app-name" title="${O}">${O}</div>
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
                <span class="stat-value">${ht(l)}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Tipo:</span>
                <span class="stat-value">${W.label}</span>
              </div>
              ${S?.size?`
                <div class="stat">
                  <span class="stat-label">Dimensione:</span>
                  <span class="stat-value">${at(S.size)}</span>
                </div>
              `:""}
            </div>
          </div>
        </div>
      </div>
    `}static renderListView(e){const{id:n,name:i,description:s,category:r,version:a,type:o,lastUsed:c,installDate:l,favorite:p,tags:f,metadata:g}=e,m=N(i||"App Senza Nome");N(s||"Nessuna descrizione disponibile");const b=this.getCategoryInfo(r),S=this.getAppIcon(e),O=this.getTypeInfo(o),w=ht(c),H=ht(l);return`
      <div class="app-card app-card-list" data-app-id="${n}" data-category="${r}" data-type="${o}">
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
            <h3 class="app-list-name">${m}</h3>
            <span class="app-list-version">v${a||"1.0.0"}</span>
            <div class="app-list-category" title="Categoria">
              ${b.icon}
              <span>${b.name}</span>
            </div>
          </div>
          
          <!-- Tags in list view -->
          ${f&&f.length>0?`
            <div class="app-list-tags">
              ${f.slice(0,5).map(nt=>`
                <span class="app-tag app-tag-small">${N(nt)}</span>
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
              <span class="stat-value">${at(g.size)}</span>
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
            aria-label="Avvia ${m}"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
            </svg>
            Avvia
          </button>
          
          <button 
            class="app-card-menu btn btn-secondary" 
            data-app-id="${n}"
            aria-label="Menu ${m}"
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
        </svg>`}};return n[e]||n.uncategorized}static truncateText(e,n){return!e||e.length<=n?e:e.substring(0,n).trim()+"..."}static generateContextMenu(e){const{id:n,name:i,type:s,favorite:r,githubUrl:a,url:o}=e;return`
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
          ${r?"Rimuovi dai preferiti":"Aggiungi ai preferiti"}
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
        
        ${a||o?`
          <div class="context-menu-separator"></div>
          ${a?`
            <div class="context-menu-item" data-action="open-github">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z"/>
              </svg>
              Apri GitHub
            </div>
          `:""}
          ${o&&s==="url"?`
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
    `}}class Kr{constructor(){this.currentSettings={},this.defaultSettings={language:"it",theme:"auto",defaultLaunchMode:"newpage",maxConcurrentApps:5,showAppTooltips:!0,enableKeyboardShortcuts:!0,autoUpdateApps:!1,viewMode:"grid",sortBy:"lastUsed",showWelcomeMessage:!0,enableAnimations:!0,compactMode:!1,syncEnabled:!1,syncProvider:"github",autoSyncInterval:60,backupBeforeSync:!0,analyticsEnabled:!1,crashReportingEnabled:!0,allowTelemetry:!1,validateAppsOnLaunch:!0,sandboxMode:"strict",enableServiceWorker:!0,cacheStrategy:"aggressive",preloadApps:!1,lazyLoadImages:!0,enableDebugMode:!1,showConsoleErrors:!1,enableExperimentalFeatures:!1},this.disabledFeatures={syncEnabled:!0,autoUpdateApps:!0,analyticsEnabled:!0,crashReportingEnabled:!0,allowTelemetry:!0,enableServiceWorker:!0,preloadApps:!0,enableExperimentalFeatures:!0},this.init=this.init.bind(this),this.showModal=this.showModal.bind(this),this.loadSettings=this.loadSettings.bind(this),this.saveSettings=this.saveSettings.bind(this),this.resetSettings=this.resetSettings.bind(this),this.exportSettings=this.exportSettings.bind(this),this.importSettings=this.importSettings.bind(this)}async init(){console.log("🔧 Inizializzazione SettingsPanel..."),await this.loadSettings(),this.applySettings()}async loadSettings(){try{const e=await C.getAllSettings();this.currentSettings={...this.defaultSettings,...e}}catch(e){console.error("Errore caricamento impostazioni:",e),this.currentSettings={...this.defaultSettings}}}applySettings(){this.applyTheme(this.currentSettings.theme),this.applyLanguage(this.currentSettings.language),this.applyAnimations(this.currentSettings.enableAnimations),this.applyCompactMode(this.currentSettings.compactMode),this.applyDebugMode(this.currentSettings.enableDebugMode)}showModal(){const e=this.createSettingsModal();D("settings-modal",e,{size:"modal-xl",disableBackdropClose:!1}),setTimeout(()=>{this.setupModalEventListeners(),this.populateForm(),this.markDisabledFeatures(),this.showSection("general")},100)}createSettingsModal(){return`
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
    `}markDisabledFeatures(){const e=document.getElementById("settings-modal");e&&Object.entries(this.disabledFeatures).forEach(([n,i])=>{if(i){const s=e.querySelector(`#setting-${this.camelToKebab(n)}-container`),r=e.querySelector(`#setting-${this.camelToKebab(n)}`);s&&s.classList.add("disabled"),r&&(r.disabled=!0,r.checked=!1)}})}setupModalEventListeners(){const e=document.getElementById("settings-modal");if(!e)return;e.querySelectorAll(".settings-nav-btn").forEach(i=>{i.addEventListener("click",()=>{const s=i.dataset.section;this.showSection(s)})}),e.querySelector("#export-settings-btn")?.addEventListener("click",()=>{this.exportSettings()}),e.querySelector("#import-settings-btn")?.addEventListener("click",()=>{this.importSettings()}),e.querySelector("#reset-settings-btn")?.addEventListener("click",()=>{this.resetSettings()}),e.querySelector("#clear-cache-btn")?.addEventListener("click",()=>{this.clearCache()}),e.querySelector("#clear-all-data-btn")?.addEventListener("click",()=>{this.clearAllData()}),e.querySelector("#cancel-settings")?.addEventListener("click",()=>{B("settings-modal")}),e.querySelector("#save-settings")?.addEventListener("click",()=>{this.saveSettings()}),e.querySelector("#setting-theme")?.addEventListener("change",i=>{this.applyTheme(i.target.value)}),e.querySelector("#setting-enableAnimations")?.addEventListener("change",i=>{this.applyAnimations(i.target.checked)}),e.querySelector("#setting-compactMode")?.addEventListener("change",i=>{this.applyCompactMode(i.target.checked)}),this.loadStorageStats(),this.loadSystemInfo()}showSection(e){const n=document.getElementById("settings-modal");if(!n)return;n.querySelectorAll(".settings-section").forEach(a=>{a.style.display="none",a.classList.remove("active")});const s=n.querySelector(`#section-${e}`);s&&(s.style.display="block",s.classList.add("active")),n.querySelectorAll(".settings-nav-btn").forEach(a=>{a.classList.remove("active"),a.dataset.section===e&&a.classList.add("active")})}populateForm(){const e=document.getElementById("settings-modal");if(!e)return;const n={language:"setting-language",theme:"setting-theme",showWelcomeMessage:"setting-showWelcomeMessage",enableKeyboardShortcuts:"setting-enableKeyboardShortcuts",defaultLaunchMode:"setting-defaultLaunchMode",maxConcurrentApps:"setting-maxConcurrentApps",autoUpdateApps:"setting-autoUpdateApps",validateAppsOnLaunch:"setting-validateAppsOnLaunch",sandboxMode:"setting-sandboxMode",viewMode:"setting-viewMode",sortBy:"setting-sortBy",compactMode:"setting-compactMode",enableAnimations:"setting-enableAnimations",showAppTooltips:"setting-showAppTooltips",syncEnabled:"setting-syncEnabled",syncProvider:"setting-syncProvider",autoSyncInterval:"setting-autoSyncInterval",backupBeforeSync:"setting-backupBeforeSync",analyticsEnabled:"setting-analyticsEnabled",crashReportingEnabled:"setting-crashReportingEnabled",allowTelemetry:"setting-allowTelemetry",enableServiceWorker:"setting-enableServiceWorker",cacheStrategy:"setting-cacheStrategy",preloadApps:"setting-preloadApps",lazyLoadImages:"setting-lazyLoadImages",enableDebugMode:"setting-enableDebugMode",showConsoleErrors:"setting-showConsoleErrors",enableExperimentalFeatures:"setting-enableExperimentalFeatures"};for(const[i,s]of Object.entries(this.currentSettings)){const r=n[i];if(r){const a=e.querySelector(`#${r}`);a&&!a.disabled&&(a.type==="checkbox"?a.checked=!!s:a.value=s)}}}async saveSettings(){try{const e=this.collectFormData();this.currentSettings={...this.currentSettings,...e};for(const[n,i]of Object.entries(this.currentSettings))await C.setSetting(n,i);this.applySettings(),B("settings-modal"),v("Impostazioni salvate con successo","success"),this.requiresReload(e)&&await V({title:"Ricarica Pagina",message:"Alcune modifiche richiedono il ricaricamento della pagina. Ricaricare ora?",icon:"info",confirmText:"Ricarica",cancelText:"Più tardi",type:"default"})&&window.location.reload()}catch(e){console.error("Errore salvataggio impostazioni:",e),v("Errore durante il salvataggio delle impostazioni","error")}}collectFormData(){const e={},n=document.getElementById("settings-modal");if(!n)return e;const i={"setting-language":"language","setting-theme":"theme","setting-showWelcomeMessage":"showWelcomeMessage","setting-enableKeyboardShortcuts":"enableKeyboardShortcuts","setting-defaultLaunchMode":"defaultLaunchMode","setting-maxConcurrentApps":"maxConcurrentApps","setting-autoUpdateApps":"autoUpdateApps","setting-validateAppsOnLaunch":"validateAppsOnLaunch","setting-sandboxMode":"sandboxMode","setting-viewMode":"viewMode","setting-sortBy":"sortBy","setting-compactMode":"compactMode","setting-enableAnimations":"enableAnimations","setting-showAppTooltips":"showAppTooltips","setting-syncEnabled":"syncEnabled","setting-syncProvider":"syncProvider","setting-autoSyncInterval":"autoSyncInterval","setting-backupBeforeSync":"backupBeforeSync","setting-analyticsEnabled":"analyticsEnabled","setting-crashReportingEnabled":"crashReportingEnabled","setting-allowTelemetry":"allowTelemetry","setting-enableServiceWorker":"enableServiceWorker","setting-cacheStrategy":"cacheStrategy","setting-preloadApps":"preloadApps","setting-lazyLoadImages":"lazyLoadImages","setting-enableDebugMode":"enableDebugMode","setting-showConsoleErrors":"showConsoleErrors","setting-enableExperimentalFeatures":"enableExperimentalFeatures"};return n.querySelectorAll('input[id^="setting-"], select[id^="setting-"], textarea[id^="setting-"]').forEach(r=>{const a=r.id,o=i[a];o&&!r.disabled&&(r.type==="checkbox"?e[o]=r.checked:r.type==="number"?e[o]=parseInt(r.value)||0:e[o]=r.value)}),e}applyTheme(e){const n=document.documentElement;if(e==="auto"){const i=window.matchMedia("(prefers-color-scheme: dark)").matches;n.setAttribute("data-theme",i?"dark":"light")}else n.setAttribute("data-theme",e)}applyLanguage(e){document.documentElement.setAttribute("lang",e)}applyAnimations(e){const n=document.documentElement;e?n.classList.remove("no-animations"):n.classList.add("no-animations")}applyCompactMode(e){const n=document.documentElement;e?n.classList.add("compact-mode"):n.classList.remove("compact-mode")}applyDebugMode(e){const n=document.documentElement;e?n.classList.add("debug-mode"):n.classList.remove("debug-mode")}async resetSettings(){if(await V({title:"Reset Impostazioni",message:"Sei sicuro di voler ripristinare tutte le impostazioni ai valori predefiniti?",icon:"warning",confirmText:"Reset",cancelText:"Annulla",type:"default"}))try{this.currentSettings={...this.defaultSettings};for(const[n,i]of Object.entries(this.currentSettings))await C.setSetting(n,i);this.populateForm(),this.applySettings(),v("Impostazioni ripristinate ai valori predefiniti","success")}catch(n){console.error("Errore reset impostazioni:",n),v("Errore durante il ripristino delle impostazioni","error")}}async exportSettings(){try{const e={version:"1.0.0",timestamp:new Date().toISOString(),settings:this.currentSettings,deviceInfo:Pn()},n=new Blob([JSON.stringify(e,null,2)],{type:"application/json"}),i=URL.createObjectURL(n),s=document.createElement("a");s.href=i,s.download=`sakai-settings-${new Date().toISOString().split("T")[0]}.json`,document.body.appendChild(s),s.click(),document.body.removeChild(s),URL.revokeObjectURL(i),v("Impostazioni esportate con successo","success")}catch(e){console.error("Errore export impostazioni:",e),v("Errore durante l'esportazione delle impostazioni","error")}}importSettings(){const e=document.createElement("input");e.type="file",e.accept=".json",e.onchange=async n=>{try{const i=n.target.files[0];if(!i)return;const s=await i.text(),r=JSON.parse(s);if(!r.settings||!r.version)throw new Error("Formato file non valido");this.currentSettings={...this.defaultSettings,...r.settings};for(const[a,o]of Object.entries(this.currentSettings))await C.setSetting(a,o);this.populateForm(),this.applySettings(),v("Impostazioni importate con successo","success")}catch(i){console.error("Errore import impostazioni:",i),v("Errore durante l'importazione delle impostazioni","error")}},e.click()}async clearCache(){try{if("caches"in window){const e=await caches.keys();await Promise.all(e.map(n=>caches.delete(n)))}v("Cache svuotata con successo","success"),this.loadStorageStats()}catch(e){console.error("Errore svuotamento cache:",e),v("Errore durante lo svuotamento della cache","error")}}async clearAllData(){if(!(!await V({title:"Elimina Tutti i Dati",message:"ATTENZIONE: Questa operazione eliminerà TUTTI i dati di SAKAI incluse app, impostazioni e cache. Continuare?",icon:"warning",confirmText:"Elimina",cancelText:"Annulla",type:"default"})||!await V({title:"Conferma Eliminazione",message:"Sei veramente sicuro? Questa operazione NON può essere annullata!",icon:"warning",confirmText:"Elimina",cancelText:"Annulla",type:"default"})))try{if(await C.close(),indexedDB.deleteDatabase("SAKAI_DB"),Object.keys(localStorage).forEach(i=>{i.startsWith("sakai_")&&localStorage.removeItem(i)}),"caches"in window){const i=await caches.keys();await Promise.all(i.map(s=>caches.delete(s)))}v("Tutti i dati sono stati eliminati","success"),setTimeout(()=>{window.location.reload()},2e3)}catch(i){console.error("Errore eliminazione dati:",i),v("Errore durante l'eliminazione dei dati","error")}}async loadStorageStats(){try{const e=document.getElementById("settings-modal");if(!e)return;const n=await C.getStats(),i=await C.getAllApps(),s=await C.estimateDbSize(),r=e.querySelector("#storage-used"),a=e.querySelector("#apps-count"),o=e.querySelector("#cache-size");if(r&&(r.textContent=at(s)),a&&(a.textContent=i.length.toString()),o){const c=n.cacheSize||0;o.textContent=at(c)}}catch(e){console.error("Errore caricamento statistiche storage:",e);const n=document.getElementById("settings-modal");n&&["storage-used","apps-count","cache-size"].forEach(s=>{const r=n.querySelector(`#${s}`);r&&(r.textContent="Errore caricamento")})}}loadSystemInfo(){try{const e=document.getElementById("settings-modal");if(!e)return;const n=e.querySelector("#user-agent"),i=e.querySelector("#platform"),s=e.querySelector("#pwa-support");if(n&&(n.textContent=navigator.userAgent.substring(0,50)+"..."),i&&(i.textContent=navigator.platform||"Sconosciuto"),s){const r="serviceWorker"in navigator,a="manifest"in document.createElement("link"),o="PushManager"in window,c=[];r&&c.push("Service Worker"),a&&c.push("Web App Manifest"),o&&c.push("Push Notifications"),s.textContent=c.length>0?c.join(", "):"Non supportato"}}catch(e){console.error("Errore caricamento informazioni sistema:",e);const n=document.getElementById("settings-modal");n&&["user-agent","platform","pwa-support"].forEach(s=>{const r=n.querySelector(`#${s}`);r&&(r.textContent="Errore caricamento")})}}camelToKebab(e){return e.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g,"$1-$2").toLowerCase()}kebabToCamel(e){return e.replace(/-([a-z])/g,n=>n[1].toUpperCase())}requiresReload(e){return["language","theme","enableServiceWorker","cacheStrategy"].some(i=>{const s=this.currentSettings[i],r=e[i];return s!==void 0&&s!==r})}getSetting(e,n=null){return this.currentSettings[e]!==void 0?this.currentSettings[e]:n}async setSetting(e,n){this.currentSettings[e]=n,await C.setSetting(e,n),this.applySettings()}}const Xr="modulepreload",Qr=function(t){return"/aideas.run/"+t},ke={},Jr=function(e,n,i){let s=Promise.resolve();if(n&&n.length>0){let c=function(l){return Promise.all(l.map(p=>Promise.resolve(p).then(f=>({status:"fulfilled",value:f}),f=>({status:"rejected",reason:f}))))};document.getElementsByTagName("link");const a=document.querySelector("meta[property=csp-nonce]"),o=a?.nonce||a?.getAttribute("nonce");s=c(n.map(l=>{if(l=Qr(l),l in ke)return;ke[l]=!0;const p=l.endsWith(".css"),f=p?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${l}"]${f}`))return;const g=document.createElement("link");if(g.rel=p?"stylesheet":Xr,p||(g.as="script"),g.crossOrigin="",g.href=l,o&&g.setAttribute("nonce",o),document.head.appendChild(g),p)return new Promise((m,b)=>{g.addEventListener("load",m),g.addEventListener("error",()=>b(new Error(`Unable to preload CSS for ${l}`)))})}))}function r(a){const o=new Event("vite:preloadError",{cancelable:!0});if(o.payload=a,window.dispatchEvent(o),!o.defaultPrevented)throw a}return s.then(a=>{for(const o of a||[])o.status==="rejected"&&r(o.reason);return e().catch(r)})},vt={enabled:localStorage.getItem("aideas_debug")==="true",verbose:localStorage.getItem("aideas_verbose_logging")==="true"};vt.enabled&&(window.AIdeas_DEV={async inspectStorage(){const t=await Jr(()=>Promise.resolve().then(()=>Tn),void 0).then(s=>s.default),e=await t.getStats(),n=await t.getAllApps(),i=await t.getAllSettings();console.group("🔍 AIdeas Storage Inspection"),console.log("Stats:",e),console.table(n),console.log("Settings:",i),console.groupEnd()},getPerformance(){return{timing:performance.timing,navigation:performance.navigation,memory:performance.memory}},getErrors(){return window.AIdeas_ERRORS||[]},clearAllData(){V({title:"Pulisci Dati",message:"Eliminare tutti i dati di AIdeas? Questa operazione non può essere annullata!",icon:"danger",confirmText:"Elimina",cancelText:"Annulla",type:"danger"}).then(t=>{t&&(localStorage.clear(),sessionStorage.clear(),indexedDB.deleteDatabase("aideas-db"),v("Tutti i dati eliminati","success"),setTimeout(()=>window.location.reload(),1e3))})},enableVerbose(){localStorage.setItem("aideas_verbose_logging","true"),vt.verbose=!0,console.log("Verbose logging enabled")},disableVerbose(){localStorage.removeItem("aideas_verbose_logging"),vt.verbose=!1,console.log("Verbose logging disabled")}});class ue{static init(){window.AIdeas_ERRORS=this.errors,window.addEventListener("error",e=>{this.trackError({type:"runtime",message:e.message,source:e.filename,lineno:e.lineno,colno:e.colno,stack:e.error?.stack,timestamp:new Date().toISOString()})}),window.addEventListener("unhandledrejection",e=>{this.trackError({type:"promise",message:e.reason?.message||"Unhandled Promise Rejection",stack:e.reason?.stack,timestamp:new Date().toISOString()})})}static trackError(e){this.errors.push(e),vt.enabled&&console.error("[AIdeas Error Tracker]",e),this.errors.length>100&&this.errors.shift()}static getErrors(){return this.errors}static clearErrors(){return this.errors=[],!0}}pe(ue,"errors",[]);ue.init();class Gr{constructor(){this.currentView="all",this.currentSort="lastUsed",this.currentViewMode="grid",this.searchQuery="",this.apps=[],this.filteredApps=[],this.storage=C,this.appLauncher=new kn,this.appImporter=new Yr,this.settingsPanel=new Kr,ue.init(),this.init=this.init.bind(this),this.setupEventListeners=this.setupEventListeners.bind(this),this.loadApps=this.loadApps.bind(this),this.renderApps=this.renderApps.bind(this),this.filterApps=this.filterApps.bind(this),this.handleSearch=this.handleSearch.bind(this),this.handleCategoryChange=this.handleCategoryChange.bind(this),this.handleSortChange=this.handleSortChange.bind(this),this.handleViewChange=this.handleViewChange.bind(this),this.showAppMenu=this.showAppMenu.bind(this)}async init(){try{console.log("🚀 Inizializzazione AIdeas..."),this.setupEventListeners(),console.log("📱 Mostra loading screen..."),this.showLoadingScreen(),console.log("💾 Inizializza servizi..."),await C.ensureDbOpen(),console.log("🔄 Avvia migrazione app HTML...");const e=await C.migrateAppsForContent();console.log(`✅ Migrazione completata: ${e} app migrate`),console.log("📦 Carica app..."),await this.loadApps(),console.log("🔧 Inizializza componenti..."),await this.initializeComponents(),console.log("🔄 Inizializza sincronizzazione..."),await this.initializeSync(),console.log("✅ AIdeas inizializzato con successo"),console.log("👋 Controlla first run..."),await this.checkFirstRun(),console.log("🎉 Inizializzazione completata!"),console.log("👁️ Nascondi loading screen..."),this.hideLoadingScreen()}catch(e){console.error("❌ Errore inizializzazione AIdeas:",e),console.error("Stack trace:",e.stack),this.showError("Errore durante l'inizializzazione dell'applicazione")}}showLoadingScreen(){const e=document.getElementById("loading-screen"),n=document.getElementById("app");e&&n&&(e.style.display="flex",n.style.display="none")}hideLoadingScreen(){const e=document.getElementById("loading-screen"),n=document.getElementById("app");e&&n&&(e.style.opacity="0",setTimeout(()=>{e.style.display="none",n.style.display="block",n.style.opacity="0",requestAnimationFrame(()=>{n.style.transition="opacity 0.3s ease",n.style.opacity="1"})},300))}async initializeStorage(){try{const e=await C.getStats();console.log("📊 Database stats:",e)}catch(e){throw console.error("Errore inizializzazione storage:",e),e}}async loadUserSettings(){try{const e=await C.getAllSettings();this.currentViewMode=e.viewMode||"grid",this.currentSort=e.sortBy||"lastUsed",e.theme?document.documentElement.setAttribute("data-theme",e.theme):document.documentElement.setAttribute("data-theme","dark"),e.language&&document.documentElement.setAttribute("lang",e.language)}catch(e){console.error("Errore caricamento impostazioni:",e),document.documentElement.setAttribute("data-theme","dark")}}setupEventListeners(){const e=document.getElementById("sidebar-toggle"),n=document.getElementById("sidebar"),i=document.querySelector(".app-layout");e?.addEventListener("click",()=>{n?.classList.toggle("sidebar-open"),n?.classList.contains("sidebar-open")?i?.classList.remove("sidebar-collapsed"):i?.classList.add("sidebar-collapsed")});const s=document.getElementById("mobile-search-toggle"),r=document.getElementById("mobile-search-close"),a=document.querySelector(".search-container"),o=document.querySelector(".header-search"),c=document.getElementById("search-input");s?.addEventListener("click",()=>{o?.classList.toggle("search-active"),o?.classList.contains("search-active")&&setTimeout(()=>{c?.focus()},100)}),r?.addEventListener("click",()=>{o?.classList.remove("search-active"),c?.blur()}),document.addEventListener("click",w=>{!a?.contains(w.target)&&!s?.contains(w.target)&&o?.classList.remove("search-active")});const l=document.getElementById("search-input");l?.addEventListener("input",this.handleSearch),l?.addEventListener("keydown",w=>{w.key==="Escape"&&(o?.classList.remove("search-active"),l.blur())}),document.querySelectorAll("[data-category]").forEach(w=>{w.addEventListener("click",this.handleCategoryChange)}),document.getElementById("sort-select")?.addEventListener("change",this.handleSortChange),document.querySelectorAll(".view-btn").forEach(w=>{w.addEventListener("click",this.handleViewChange)}),document.querySelectorAll("#add-app-btn, #fab-add, #empty-add-btn").forEach(w=>{w.addEventListener("click",()=>this.showAddAppModal())}),document.getElementById("settings-btn")?.addEventListener("click",()=>{this.showSettingsModal()});const S=document.getElementById("user-btn"),O=document.getElementById("user-dropdown");S?.addEventListener("click",w=>{w.stopPropagation(),O?.classList.toggle("show")}),document.addEventListener("click",()=>{O?.classList.remove("show")}),document.getElementById("settings-link")?.addEventListener("click",w=>{w.preventDefault(),this.showSettingsModal()}),document.getElementById("export-link")?.addEventListener("click",w=>{w.preventDefault(),this.exportData()}),document.getElementById("import-link")?.addEventListener("click",w=>{w.preventDefault(),this.importData()}),document.getElementById("about-link")?.addEventListener("click",w=>{w.preventDefault(),this.showAboutModal()}),document.getElementById("sync-btn")?.addEventListener("click",()=>{this.syncManager.showSyncModal()}),document.getElementById("app-store-btn")?.addEventListener("click",()=>{this.showAppStoreModal()}),document.addEventListener("keydown",this.handleKeyboardShortcuts.bind(this)),window.addEventListener("resize",this.handleResize.bind(this)),document.addEventListener("click",w=>{!n?.contains(w.target)&&!e?.contains(w.target)&&(n?.classList.remove("sidebar-open"),i?.classList.add("sidebar-collapsed"))})}async loadApps(){try{this.apps=await C.getAllApps(),this.filterApps(),this.updateCategoryCounts()}catch(e){console.error("Errore caricamento apps:",e),v("Errore durante il caricamento delle app","error")}}filterApps(){let e=[...this.apps];if(this.currentView==="favorites")e=e.filter(n=>n.favorite);else if(this.currentView==="recent"){const n=new Date;n.setDate(n.getDate()-30),e=e.filter(i=>new Date(i.lastUsed)>n)}else this.currentView!=="all"&&(e=e.filter(n=>n.category===this.currentView));if(this.searchQuery){const n=this.searchQuery.toLowerCase();e=e.filter(i=>i.name.toLowerCase().includes(n)||i.description.toLowerCase().includes(n)||i.tags.some(s=>s.toLowerCase().includes(n)))}e.sort((n,i)=>{switch(this.currentSort){case"name":return n.name.localeCompare(i.name);case"installDate":return new Date(i.installDate)-new Date(n.installDate);case"category":return n.category.localeCompare(i.category);case"lastUsed":default:return new Date(i.lastUsed)-new Date(n.lastUsed)}}),this.filteredApps=e,this.renderApps()}renderApps(){const e=document.getElementById("apps-grid"),n=document.getElementById("empty-state");if(e){if(e.className=`apps-${this.currentViewMode}`,this.filteredApps.length===0){e.style.display="none",n.style.display="flex";return}n.style.display="none",this.currentViewMode==="launcher"?(e.style.display="grid",e.innerHTML=this.filteredApps.map(i=>this.renderLauncherItem(i)).join("")):(e.style.display=this.currentViewMode==="list"?"flex":"grid",e.innerHTML=this.filteredApps.map(i=>Zr.render(i)).join("")),this.setupAppCardListeners()}}renderLauncherItem(e){const n=e.icon?`<img src="${e.icon}" alt="${e.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`:"",i=`
      <svg viewBox="0 0 24 24" fill="currentColor" style="display: ${e.icon?"none":"flex"};">
        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
      </svg>
    `,s=e.type?`
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
          ${s}
        </div>
        <div class="app-launcher-name">${e.name}</div>
      </div>
    `}setupAppCardListeners(){document.querySelectorAll(".app-card-launch").forEach(e=>{e.addEventListener("click",async n=>{n.stopPropagation();const i=parseInt(e.dataset.appId);await this.launchApp(i)})}),document.querySelectorAll(".app-card-favorite").forEach(e=>{e.addEventListener("click",async n=>{n.stopPropagation();const i=parseInt(e.dataset.appId);await this.toggleFavorite(i)})}),document.querySelectorAll(".app-card-menu").forEach(e=>{e.addEventListener("click",n=>{n.stopPropagation();const i=parseInt(e.dataset.appId);this.showAppMenu(i,n.target)})}),document.querySelectorAll(".app-card").forEach(e=>{e.addEventListener("click",async()=>{const n=parseInt(e.dataset.appId);await this.launchApp(n)})}),document.querySelectorAll(".app-launcher-item").forEach(e=>{let n,i=!1;e.addEventListener("click",async s=>{if(!i){const r=parseInt(e.dataset.appId);await this.launchApp(r)}i=!1}),e.addEventListener("mousedown",s=>{n=setTimeout(()=>{i=!0;const r=parseInt(e.dataset.appId);this.showLauncherAppInfo(r,e)},500)}),e.addEventListener("mouseup",()=>{clearTimeout(n)}),e.addEventListener("mouseleave",()=>{clearTimeout(n)}),e.addEventListener("touchstart",s=>{n=setTimeout(()=>{i=!0;const r=parseInt(e.dataset.appId);this.showLauncherAppInfo(r,e)},500)}),e.addEventListener("touchend",()=>{clearTimeout(n)}),e.addEventListener("touchcancel",()=>{clearTimeout(n)})})}async launchApp(e){try{const n=await C.getApp(e);if(!n){v("App non trovata","error");return}await C.updateLastUsed(e),await this.appLauncher.launch(n),await this.loadApps()}catch(n){console.error("Errore lancio app:",n),v("Errore durante il lancio dell'app","error")}}async toggleFavorite(e){try{const n=await C.toggleFavorite(e);v(n?"Aggiunta ai preferiti":"Rimossa dai preferiti","success"),await this.loadApps()}catch(n){console.error("Errore toggle favorite:",n),v("Errore durante l'operazione","error")}}handleSearch(e){this.searchQuery=e.target.value.trim(),this.filterApps()}handleCategoryChange(e){e.preventDefault();const n=e.target.dataset.category||e.target.closest("[data-category]").dataset.category;document.querySelectorAll(".nav-link").forEach(i=>{i.classList.remove("active")}),e.target.closest(".nav-link").classList.add("active"),this.currentView=n,this.updateSectionTitle(),this.filterApps()}handleSortChange(e){this.currentSort=e.target.value,C.setSetting("sortBy",this.currentSort),this.filterApps()}handleViewChange(e){const n=e.target.dataset.view||e.target.closest("[data-view]").dataset.view;document.querySelectorAll(".view-btn[data-view]").forEach(s=>{s.classList.remove("active")});const i=e.target.closest(".view-btn[data-view]");i&&i.classList.add("active"),this.currentViewMode=n,C.setSetting("viewMode",this.currentViewMode),this.renderApps()}handleKeyboardShortcuts(e){(e.ctrlKey||e.metaKey)&&e.key==="k"&&(e.preventDefault(),document.getElementById("search-input")?.focus()),(e.ctrlKey||e.metaKey)&&e.key==="n"&&(e.preventDefault(),this.showAddAppModal()),e.key==="Escape"&&this.closeAllModals()}handleResize(){const e=document.getElementById("sidebar"),n=document.querySelector(".app-layout");window.innerWidth>768||e?.classList.contains("sidebar-open")&&(e.classList.remove("sidebar-open"),n?.classList.add("sidebar-collapsed"))}updateSectionTitle(){const e=document.getElementById("section-title"),n=document.getElementById("section-subtitle"),s={all:{title:"Tutte le App",subtitle:"Gestisci le tue applicazioni web"},favorites:{title:"App Preferite",subtitle:"Le tue app più amate"},recent:{title:"App Recenti",subtitle:"Utilizzate negli ultimi 30 giorni"}}[this.currentView]||{title:this.currentView.charAt(0).toUpperCase()+this.currentView.slice(1),subtitle:`App della categoria ${this.currentView}`};e&&(e.textContent=s.title),n&&(n.textContent=s.subtitle)}updateCategoryCounts(){const e=document.getElementById("all-count");e&&(e.textContent=this.apps.length);const n=document.getElementById("favorites-count"),i=this.apps.filter(s=>s.favorite).length;n&&(n.textContent=i),this.updateDynamicCategories()}updateDynamicCategories(){const e=document.getElementById("dynamic-categories");if(!e)return;const n=new Map;this.apps.forEach(s=>{const r=s.category||"uncategorized";n.set(r,(n.get(r)||0)+1)});const i=Array.from(n.entries()).sort(([s],[r])=>s.localeCompare(r)).map(([s,r])=>`
        <li class="nav-item">
          <a href="#" class="nav-link" data-category="${s}">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z"/>
            </svg>
            ${s}
            <span class="nav-badge">${r}</span>
          </a>
        </li>
      `).join("");e.innerHTML=i,e.querySelectorAll("[data-category]").forEach(s=>{s.addEventListener("click",this.handleCategoryChange)})}showAddAppModal(){console.log("🔧 Tentativo apertura modal aggiungi app..."),this.appImporter&&typeof this.appImporter.showModal=="function"?this.appImporter.showModal():(console.error("❌ AppImporter non disponibile o showModal non è una funzione"),v("Errore: componente importazione non disponibile","error"))}showSettingsModal(){this.settingsPanel.showModal()}showAboutModal(){D("about-modal",`
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
    `)}async exportData(){try{const e=await C.exportAllData(),n=new Blob([JSON.stringify(e,null,2)],{type:"application/json"}),i=URL.createObjectURL(n),s=document.createElement("a");s.href=i,s.download=`aideas-backup-${new Date().toISOString().split("T")[0]}.json`,document.body.appendChild(s),s.click(),document.body.removeChild(s),URL.revokeObjectURL(i),v("Dati esportati con successo","success")}catch(e){console.error("Errore export:",e),v("Errore durante l'esportazione","error")}}importData(){const e=document.createElement("input");e.type="file",e.accept=".json",e.onchange=async n=>{try{const i=n.target.files[0];if(!i)return;const s=await i.text(),r=JSON.parse(s);await C.importData(r),await this.loadApps(),v("Dati importati con successo","success")}catch(i){console.error("Errore import:",i),v("Errore durante l'importazione","error")}},e.click()}async initializeComponents(){await this.appImporter.init(),await this.settingsPanel.init()}async initializeSync(){}async checkFirstRun(){await C.getSetting("firstRun",!0)&&(await C.setSetting("firstRun",!1),v("Benvenuto in AIdeas! Inizia aggiungendo la tua prima app.","info",5e3))}updateUI(){this.updateSectionTitle(),this.updateCategoryCounts(),document.querySelectorAll(".view-btn[data-view]").forEach(r=>{r.classList.remove("active")});const e=document.querySelector(`[data-view="${this.currentViewMode}"]`);e&&e.classList.add("active");const n=document.getElementById("sort-select");n&&(n.value=this.currentSort);const i=document.getElementById("sidebar"),s=document.querySelector(".app-layout");i&&s&&(i.classList.contains("sidebar-open")?s.classList.remove("sidebar-collapsed"):s.classList.add("sidebar-collapsed"))}closeAllModals(){document.querySelectorAll(".modal").forEach(e=>{B(e.id)})}showError(e){v(e,"error")}async showAppMenu(e,n){const i=await C.getApp(e);if(!i)return;const s=`
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
    `;document.querySelectorAll(".app-context-menu").forEach(g=>g.remove());const r=document.createElement("div");r.innerHTML=s,document.body.appendChild(r.firstElementChild);const a=document.querySelector(".app-context-menu"),o=n.getBoundingClientRect(),c=a.getBoundingClientRect();let l=o.bottom+window.scrollY+4,p=o.left+window.scrollX;l+c.height>window.innerHeight+window.scrollY&&(l=o.top+window.scrollY-c.height-4),p+c.width>window.innerWidth+window.scrollX&&(p=o.right+window.scrollX-c.width),a.style.top=`${l}px`,a.style.left=`${p}px`;const f=g=>{a.contains(g.target)||(a.remove(),document.removeEventListener("mousedown",f))};setTimeout(()=>document.addEventListener("mousedown",f),10),a.querySelector('[data-action="edit"]').addEventListener("click",async()=>{a.remove(),await this.showEditAppModal(i)}),a.querySelector('[data-action="delete"]').addEventListener("click",async()=>{a.remove(),await Nn(i.name)&&(await C.deleteApp(e),v("App eliminata","success"),this.loadApps())})}async showEditAppModal(e){const n={...e},i=`
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
    `;D("edit-app-modal",i,{size:"modal-md"}),setTimeout(()=>{document.getElementById("cancel-edit-app")?.addEventListener("click",()=>{B("edit-app-modal")}),document.getElementById("close-edit-modal")?.addEventListener("click",()=>{B("edit-app-modal")}),document.getElementById("save-edit-app").addEventListener("click",async s=>{s.preventDefault();const r={name:document.getElementById("edit-app-name").value.trim(),description:document.getElementById("edit-app-description").value.trim(),version:document.getElementById("edit-app-version").value.trim(),category:document.getElementById("edit-app-category").value.trim(),tags:document.getElementById("edit-app-tags").value.split(",").map(o=>o.trim()).filter(Boolean),icon:document.getElementById("edit-app-icon").value.trim()},a=document.getElementById("edit-app-launch-mode");if(a&&a.value?(r.metadata||(r.metadata={}),r.metadata.launchMode=a.value):n.metadata?.launchMode&&(r.metadata||(r.metadata={}),r.metadata.launchMode=null),!r.name){v("Il nome è obbligatorio","error");return}await C.updateApp(e.id,r),B("edit-app-modal"),v("App modificata con successo","success"),await this.loadApps()})},200)}async showLauncherAppInfo(e,n){const i=await C.getApp(e);if(!i)return;const s=`
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
                ${i.tags.map(a=>`<span class="app-tag">${a}</span>`).join("")}
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
    `,r=D("launcher-app-info",s,{size:"modal-md",disableBackdropClose:!1,disableEscapeClose:!1});r.querySelector("#launch-app-btn")?.addEventListener("click",async()=>{B("launcher-app-info"),await this.launchApp(e)}),r.querySelector("#edit-app-btn")?.addEventListener("click",async()=>{B("launcher-app-info"),await this.showEditAppModal(i)})}}document.addEventListener("DOMContentLoaded",async()=>{const t=new Gr;window.aideasApp=t,await t.init()});window.addEventListener("error",t=>{console.error("Errore globale:",t.error),v("Si è verificato un errore imprevisto","error")});window.addEventListener("unhandledrejection",t=>{console.error("Promise rejections non gestita:",t.reason),v("Errore durante un'operazione asincrona","error")});
//# sourceMappingURL=main-CnCEZ6I6.js.map
