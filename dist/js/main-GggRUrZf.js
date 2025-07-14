const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["js/main-material-DP-Rqvbr.js","js/vendor-C4dKogtF.js"])))=>i.map(i=>d[i]);
var x=Object.defineProperty;var z=(n,e,t)=>e in n?x(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t;var y=(n,e,t)=>z(n,typeof e!="symbol"?e+"":e,t);import{D as M}from"./vendor-C4dKogtF.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))r(i);new MutationObserver(i=>{for(const o of i)if(o.type==="childList")for(const s of o.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&r(s)}).observe(document,{childList:!0,subtree:!0});function t(i){const o={};return i.integrity&&(o.integrity=i.integrity),i.referrerPolicy&&(o.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?o.credentials="include":i.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function r(i){if(i.ep)return;i.ep=!0;const o=t(i);fetch(i.href,o)}})();const T="modulepreload",R=function(n){return"/"+n},w={},b=function(e,t,r){let i=Promise.resolve();if(t&&t.length>0){let d=function(l){return Promise.all(l.map(p=>Promise.resolve(p).then(m=>({status:"fulfilled",value:m}),m=>({status:"rejected",reason:m}))))};document.getElementsByTagName("link");const s=document.querySelector("meta[property=csp-nonce]"),c=s?.nonce||s?.getAttribute("nonce");i=d(t.map(l=>{if(l=R(l),l in w)return;w[l]=!0;const p=l.endsWith(".css"),m=p?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${l}"]${m}`))return;const u=document.createElement("link");if(u.rel=p?"stylesheet":T,p||(u.as="script"),u.crossOrigin="",u.href=l,c&&u.setAttribute("nonce",c),document.head.appendChild(u),p)return new Promise((f,g)=>{u.addEventListener("load",f),u.addEventListener("error",()=>g(new Error(`Unable to preload CSS for ${l}`)))})}))}function o(s){const c=new Event("vite:preloadError",{cancelable:!0});if(c.payload=s,window.dispatchEvent(c),!c.defaultPrevented)throw s}return i.then(s=>{for(const c of s||[])c.status==="rejected"&&o(c.reason);return e().catch(o)})},P=["🚀","⚡","🎯","💡","🔧","📱","💻","🌐","🎮","📚","🎨","🎵","📷","📹","🎬","📺","📻","🎙️","🎤","🎧","🏠","🏢","🏪","🏨","🏥","🏫","🏛️","⛪","🕌","🕍","🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚐","🍕","🍔","🍟","🌭","🍿","🧂","🥨","🥯","🥖","🧀","⚽","🏀","🏈","⚾","🎾","🏐","🏉","🎱","🏓","🏸","🎪","🎭","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🎷","🌍","🌎","🌏","🌐","🗺️","🗾","🧭","🏔️","⛰️","🌋","💎","🔮","🎁","🎈","🎉","🎊","🎋","🎍","🎎","🎏","🔮","🧿","⚗️","🔭","📡","💻","🖥️","🖨️","⌨️","🖱️","📱","📲","💾","💿","📀","🎥","📺","📻","📷","📹"],k=n=>{const e={produttività:["⚡","🚀","💡","🔧","📊","📈","✅","🎯"],intrattenimento:["🎮","🎬","🎵","🎨","🎪","🎭","🎤","🎧"],sviluppo:["💻","🔧","⚙️","🔨","📱","🌐","🚀","⚡"],social:["👥","💬","📱","🌐","📞","📧","💌","📢"],utility:["🔧","⚙️","🛠️","📋","📝","📌","📍","🔍"],altro:["❓","💭","💡","🎯","⭐","💫","✨","🌟"]},t=n?.toLowerCase()||"altro",r=e[t]||e.altro;return r[Math.floor(Math.random()*r.length)]},B={GITHUB:{BASE:"https://api.github.com"}},D={GITHUB_URL:/github\.com\/([^\/]+)\/([^\/]+)/,GITHUB_PAGES:/([^\.]+)\.github\.io\/([^\/]+)/};let O=0;function E(n,e="info",t=4e3,r={}){const i=document.getElementById("toast-container");if(!i){console.warn("Toast container non trovato");return}const o=`toast-${++O}`,s=document.createElement("div");s.id=o,s.className=`toast toast-${e}`,s.setAttribute("role","alert"),s.setAttribute("aria-live","polite");const c={success:`<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
    </svg>`,error:`<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
    </svg>`,warning:`<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M13,13H11V7H13M12,17.3A1.3,1.3 0 0,1 10.7,16A1.3,1.3 0 0,1 12,14.7A1.3,1.3 0 0,1 13.3,16A1.3,1.3 0 0,1 12,17.3M15.73,3H8.27L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3Z"/>
    </svg>`,info:`<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
    </svg>`};s.innerHTML=`
    <div class="toast-icon">
      ${c[e]||c.info}
    </div>
    <div class="toast-content">
      <div class="toast-message">${C(n)}</div>
      ${r.action?`<button class="toast-action">${r.action}</button>`:""}
    </div>
    <button class="toast-close" aria-label="Chiudi notifica">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
      </svg>
    </button>
  `;const d=s.querySelector(".toast-close"),l=s.querySelector(".toast-action"),p=()=>{s.classList.add("toast-removing"),setTimeout(()=>{s.parentNode&&s.parentNode.removeChild(s)},300)};return d.addEventListener("click",p),l&&r.onAction&&l.addEventListener("click",()=>{r.onAction(),p()}),i.appendChild(s),requestAnimationFrame(()=>{s.classList.add("toast-show")}),t>0&&setTimeout(p,t),o}function C(n){const e=document.createElement("div");return e.textContent=n,e.innerHTML}function $(n={}){return new Promise(e=>{const{title:t="Conferma",message:r="Sei sicuro di voler continuare?",icon:i="question",confirmText:o="Conferma",cancelText:s="Annulla",type:c="default"}=n,d=document.createElement("div");d.className="confirm-popup";const l={question:`<svg viewBox="0 0 24 24" fill="currentColor" class="confirm-popup-icon">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
      </svg>`,warning:`<svg viewBox="0 0 24 24" fill="currentColor" class="confirm-popup-icon">
        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
      </svg>`,danger:`<svg viewBox="0 0 24 24" fill="currentColor" class="confirm-popup-icon">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>`,info:`<svg viewBox="0 0 24 24" fill="currentColor" class="confirm-popup-icon">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
      </svg>`},p=l[i]||l.question,m=c==="danger"?"confirm-popup-btn-danger":"confirm-popup-btn-primary";d.innerHTML=`
      <div class="confirm-popup-content">
        <div class="confirm-popup-header">
          <h3 class="confirm-popup-title">
            ${p}
            ${t}
          </h3>
        </div>
        <div class="confirm-popup-body">
          ${r}
        </div>
        <div class="confirm-popup-footer">
          <button class="confirm-popup-btn confirm-popup-btn-secondary" data-action="cancel">
            ${s}
          </button>
          <button class="confirm-popup-btn ${m}" data-action="confirm">
            ${o}
          </button>
        </div>
      </div>
    `;const u=g=>{document.body.removeChild(d),e(g==="confirm")};d.addEventListener("click",g=>{g.target===d&&u("cancel")}),d.querySelectorAll("[data-action]").forEach(g=>{g.addEventListener("click",L=>{L.preventDefault(),u(g.dataset.action)})});const f=g=>{g.key==="Escape"&&(document.removeEventListener("keydown",f),u("cancel"))};document.addEventListener("keydown",f),document.body.appendChild(d),setTimeout(()=>{d.querySelector(".confirm-popup-btn-secondary").focus()},100)})}const a={enabled:localStorage.getItem("aideas_debug")==="true",verbose:localStorage.getItem("aideas_verbose_logging")==="true",log(...n){this.enabled&&console.log("🔍 [AIdeas]",...n)},info(...n){this.enabled&&this.verbose&&console.info("ℹ️ [AIdeas]",...n)},success(...n){this.enabled&&this.verbose&&console.log("✅ [AIdeas]",...n)},warn(...n){this.enabled&&console.warn("⚠️ [AIdeas]",...n)},error(...n){console.error("❌ [AIdeas]",...n)},service(n,...e){this.enabled&&console.log(`🔧 [${n}]`,...e)},network(n,e,...t){this.enabled&&this.verbose&&console.log(`🌐 [Network] ${n}`,e,...t)},perf(n,e){this.enabled&&this.verbose&&console.log(`⚡ [Performance] ${n}:`,e)},table(n){this.enabled&&console.table(n)},group(n){this.enabled&&console.group(`📁 ${n}`)},groupEnd(){this.enabled&&console.groupEnd()}};a.enabled&&(window.AIdeas_DEV={async inspectStorage(){const n=await b(()=>Promise.resolve().then(()=>H),void 0).then(i=>i.default),e=await n.getStats(),t=await n.getAllApps(),r=await n.getAllSettings();console.group("🔍 AIdeas Storage Inspection"),console.log("Stats:",e),console.table(t),console.log("Settings:",r),console.groupEnd()},getPerformance(){return{timing:performance.timing,navigation:performance.navigation,memory:performance.memory}},getErrors(){return window.AIdeas_ERRORS||[]},clearAllData(){$({title:"Pulisci Dati",message:"Eliminare tutti i dati di AIdeas? Questa operazione non può essere annullata!",icon:"danger",confirmText:"Elimina",cancelText:"Annulla",type:"danger"}).then(n=>{n&&(localStorage.clear(),sessionStorage.clear(),indexedDB.deleteDatabase("aideas-db"),E("Tutti i dati eliminati","success"),setTimeout(()=>window.location.reload(),1e3))})},enableVerbose(){localStorage.setItem("aideas_verbose_logging","true"),a.verbose=!0,console.log("Verbose logging enabled")},disableVerbose(){localStorage.removeItem("aideas_verbose_logging"),a.verbose=!1,console.log("Verbose logging disabled")}});class S{static init(){window.AIdeas_ERRORS=this.errors,window.addEventListener("error",e=>{this.trackError({type:"runtime",message:e.message,source:e.filename,lineno:e.lineno,colno:e.colno,stack:e.error?.stack,timestamp:new Date().toISOString()})}),window.addEventListener("unhandledrejection",e=>{this.trackError({type:"promise",message:e.reason?.message||"Unhandled Promise Rejection",stack:e.reason?.stack,timestamp:new Date().toISOString()})})}static trackError(e){this.errors.push(e),a.enabled&&console.error("[AIdeas Error Tracker]",e),this.errors.length>100&&this.errors.shift()}static getErrors(){return this.errors}static clearErrors(){return this.errors=[],!0}}y(S,"errors",[]);S.init();class F{constructor(){this.retryStrategies=new Map,this.errorHistory=[],this.maxHistorySize=100,this.operationStack=[],this.isOnline=navigator.onLine,this.setupNetworkMonitoring(),this.setupDefaultRetryStrategies()}setupNetworkMonitoring(){window.addEventListener("online",()=>{this.isOnline=!0,a.success("🌐 Connessione ripristinata"),this.retryFailedOperations()}),window.addEventListener("offline",()=>{this.isOnline=!1,a.warn("🔴 Connessione persa")})}setupDefaultRetryStrategies(){this.retryStrategies.set("NETWORK_ERROR",{maxRetries:3,delayMs:1e3,backoffMultiplier:2,shouldRetry:e=>this.isNetworkError(e),onRetry:e=>a.warn(`🔄 Tentativo ${e} per errore di rete`)}),this.retryStrategies.set("RATE_LIMIT",{maxRetries:5,delayMs:5e3,backoffMultiplier:1.5,shouldRetry:e=>this.isRateLimitError(e),onRetry:e=>a.warn(`⏳ Tentativo ${e} per rate limit`)}),this.retryStrategies.set("TEMPORARY_ERROR",{maxRetries:2,delayMs:2e3,backoffMultiplier:1.5,shouldRetry:e=>this.isTemporaryError(e),onRetry:e=>a.warn(`🔄 Tentativo ${e} per errore temporaneo`)}),this.retryStrategies.set("STORAGE_ERROR",{maxRetries:2,delayMs:1e3,backoffMultiplier:2,shouldRetry:e=>this.isStorageError(e),onRetry:e=>a.warn(`💾 Tentativo ${e} per errore di storage`)})}async withRetry(e,t={}){const r={operationName:t.operationName||"Operazione sconosciuta",timeout:t.timeout||3e4,rollbackFn:t.rollbackFn||null,retryStrategy:t.retryStrategy||"NETWORK_ERROR",context:t.context||{},validateResult:t.validateResult||null,...t},i=this.pushOperation(r);try{const o=await this.executeWithRetry(e,r);if(r.validateResult&&!r.validateResult(o))throw new Error("Risultato operazione non valido");return this.popOperation(i),o}catch(o){r.rollbackFn&&await this.executeRollback(r.rollbackFn,o,r),this.popOperation(i);const s=this.categorizeError(o,r);throw this.recordError(s,r),s}}async executeWithRetry(e,t){const r=this.retryStrategies.get(t.retryStrategy);if(!r)throw new Error(`Strategia retry sconosciuta: ${t.retryStrategy}`);let i,o=0;for(;o<=r.maxRetries;)try{if(t.timeout){const s=new Promise((c,d)=>{setTimeout(()=>d(new Error("Timeout operazione")),t.timeout)});return await Promise.race([e(),s])}else return await e()}catch(s){if(i=s,o++,o<=r.maxRetries&&r.shouldRetry(s)){const c=r.delayMs*Math.pow(r.backoffMultiplier,o-1);r.onRetry(o),a.warn(`⏳ Attesa ${c}ms prima del prossimo tentativo`),await this.sleep(c);continue}break}throw i}async executeRollback(e,t,r){try{a.warn(`🔄 Esecuzione rollback per ${r.operationName}`),await e(t,r.context),a.success("✅ Rollback completato")}catch(i){a.error("❌ Errore durante rollback:",i)}}categorizeError(e,t){const r={originalError:e,category:"UNKNOWN",severity:"MEDIUM",isRetryable:!1,userMessage:"",technicalMessage:e.message,suggestedAction:"",operationName:t.operationName,timestamp:new Date().toISOString(),context:t.context};return this.isNetworkError(e)?(r.category="NETWORK",r.severity="HIGH",r.isRetryable=!0,r.userMessage="Problema di connessione. Verifica la tua connessione internet.",r.suggestedAction="Riprova quando la connessione è stabile"):this.isRateLimitError(e)?(r.category="RATE_LIMIT",r.severity="MEDIUM",r.isRetryable=!0,r.userMessage="Troppi tentativi ravvicinati. Riprova tra qualche minuto.",r.suggestedAction="Attendi qualche minuto prima di riprovare"):this.isAuthError(e)?(r.category="AUTHENTICATION",r.severity="HIGH",r.isRetryable=!1,r.userMessage="Problema di autenticazione. Verifica le credenziali.",r.suggestedAction="Riconfigutra le credenziali di accesso"):this.isValidationError(e)?(r.category="VALIDATION",r.severity="LOW",r.isRetryable=!1,r.userMessage="Dati non validi. Controlla i parametri inseriti.",r.suggestedAction="Verifica e correggi i dati inseriti"):this.isStorageError(e)?(r.category="STORAGE",r.severity="HIGH",r.isRetryable=!0,r.userMessage="Problema di archiviazione. Spazio insufficiente o database corrotto.",r.suggestedAction="Libera spazio o riavvia l'applicazione"):this.isTemporaryError(e)&&(r.category="TEMPORARY",r.severity="LOW",r.isRetryable=!0,r.userMessage="Errore temporaneo. Riprova tra qualche istante.",r.suggestedAction="Riprova l'operazione"),r}isNetworkError(e){return this.isOnline?["network error","connection refused","connection timeout","dns lookup failed","fetch failed","cors error","net::","connection_failed"].some(r=>e.message.toLowerCase().includes(r)):!0}isRateLimitError(e){return["rate limit","too many requests","quota exceeded","api limit","throttled"].some(r=>e.message.toLowerCase().includes(r))||e.status===429}isAuthError(e){return["authentication","unauthorized","invalid token","access denied","permission denied","forbidden"].some(r=>e.message.toLowerCase().includes(r))||[401,403].includes(e.status)}isValidationError(e){return["validation","invalid","required","missing","bad request","malformed"].some(r=>e.message.toLowerCase().includes(r))||e.status===400}isStorageError(e){return["quota","storage","database","indexeddb","space","disk full"].some(r=>e.message.toLowerCase().includes(r))}isTemporaryError(e){return["temporary","timeout","busy","locked","retry","server error"].some(r=>e.message.toLowerCase().includes(r))||[500,502,503,504].includes(e.status)}pushOperation(e){const t=Date.now()+Math.random();return this.operationStack.push({id:t,...e,startTime:Date.now()}),t}popOperation(e){const t=this.operationStack.findIndex(r=>r.id===e);t!==-1&&this.operationStack.splice(t,1)}recordError(e,t){switch(this.errorHistory.push({...e,id:Date.now()+Math.random(),timestamp:new Date().toISOString()}),this.errorHistory.length>this.maxHistorySize&&this.errorHistory.shift(),e.severity){case"HIGH":a.error(`❌ ${t.operationName}:`,e.technicalMessage);break;case"MEDIUM":a.warn(`⚠️ ${t.operationName}:`,e.technicalMessage);break;case"LOW":a.log(`ℹ️ ${t.operationName}:`,e.technicalMessage);break}}async retryFailedOperations(){const e=this.operationStack.filter(t=>t.retryWhenOnline&&Date.now()-t.startTime<3e5);if(e.length>0){a.log(`🔄 Riprovo ${e.length} operazioni dopo ripristino connessione`);for(const t of e)try{t.retryFunction&&await t.retryFunction()}catch(r){a.warn(`❌ Errore nel riprovare operazione ${t.operationName}:`,r)}}}getErrorStats(){const e=Date.now(),t=this.errorHistory.filter(o=>e-new Date(o.timestamp).getTime()<24*60*60*1e3),r={},i={};return t.forEach(o=>{r[o.category]=(r[o.category]||0)+1,i[o.severity]=(i[o.severity]||0)+1}),{total:this.errorHistory.length,last24h:t.length,categories:r,severities:i,isOnline:this.isOnline,activeOperations:this.operationStack.length}}clearErrorHistory(){this.errorHistory=[],a.log("🧹 Storia errori pulita")}sleep(e){return new Promise(t=>setTimeout(t,e))}async createBackup(e,t){try{const r={operationName:e,data:t,timestamp:new Date().toISOString(),id:`backup_${Date.now()}`},i=JSON.parse(localStorage.getItem("aideas_backups")||"[]");return i.push(r),i.length>5&&i.shift(),localStorage.setItem("aideas_backups",JSON.stringify(i)),a.log(`💾 Backup creato per ${e}`),r.id}catch(r){return a.warn("⚠️ Errore creazione backup:",r),null}}async restoreBackup(e){try{const r=JSON.parse(localStorage.getItem("aideas_backups")||"[]").find(i=>i.id===e);if(!r)throw new Error("Backup non trovato");return a.log(`🔄 Ripristino backup per ${r.operationName}`),r.data}catch(t){throw a.error("❌ Errore ripristino backup:",t),t}}}const _=new F;class h{constructor(){if(h.instance)return h.instance;this.db=new M("AIdeas_DB"),this.initDatabase(),h.instance=this}initDatabase(){this.db.version(1).stores({apps:"++id, name, description, category, version, url, type, githubUrl, installDate, lastUsed, favorite, *tags",appFiles:"++id, appId, filename, content, size, mimeType",settings:"key, value, lastModified",syncEvents:"++id, timestamp, action, data, synced, deviceId",catalog:"++id, name, description, author, githubUrl, rating, downloads, featured, *categories"}),this.db.apps.hook("creating",(e,t,r)=>{t.installDate=t.installDate||new Date,t.lastUsed=t.lastUsed||new Date,t.favorite=t.favorite||!1,t.tags=t.tags||[]}),this.db.syncEvents.hook("creating",(e,t,r)=>{t.timestamp=t.timestamp||new Date,t.synced=t.synced||!1,t.deviceId=t.deviceId||this.getDeviceId()})}async installApp(e){return await _.withRetry(async()=>{if(!e.name||!e.name.trim())throw new Error("Nome app richiesto");if(await this.db.apps.where("name").equals(e.name).first())throw new Error(`App con nome "${e.name}" già installata`);let r=e.icon;r||(r=k(e.category),a.success(`Assegnata emoji automatica per ${e.name}: ${r}`));const i={name:e.name,description:e.description||"",category:e.category||"uncategorized",version:e.version||"1.0.0",url:e.url||null,type:e.type,githubUrl:e.githubUrl||null,icon:r,manifest:e.manifest||{},permissions:e.permissions||[],tags:e.tags||[],metadata:e.metadata||{},content:e.content||null,openMode:e.openMode||window?.appSettings?.defaultOpenMode||"modal"},o=await this.db.apps.add(i);if(e.files&&e.files.length>0)try{await this.saveAppFiles(o,e.files)}catch(s){throw await this.db.apps.delete(o),new Error(`Errore salvataggio file: ${s.message}`)}(e.type!=="url"||!e.url)&&window.dispatchEvent(new CustomEvent("app-installed",{detail:{appId:o,app:i}})),await this.setSetting("lastDataModification",new Date().toISOString());try{await this.addSyncEvent("app_installed",{appId:o,app:i})}catch(s){a.warn("Errore registrazione evento sync:",s)}return a.success(`✅ App "${e.name}" installata con successo (ID: ${o})`),o},{operationName:`Installazione app: ${e.name}`,retryStrategy:"STORAGE_ERROR",timeout:15e3,context:{appName:e.name,appType:e.type},rollbackFn:async(t,r)=>{a.warn(`🔄 Rollback installazione app: ${r.appName}`)},validateResult:t=>t&&typeof t=="number"&&t>0})}async getAllApps(e={}){try{let t=this.db.apps.orderBy("lastUsed").reverse();return e.category&&(t=t.filter(r=>r.category===e.category)),e.search&&(t=t.filter(r=>r.name.toLowerCase().includes(e.search.toLowerCase())||r.description.toLowerCase().includes(e.search.toLowerCase())||r.tags.some(i=>i.toLowerCase().includes(e.search.toLowerCase())))),e.favorite&&(t=t.filter(r=>r.favorite===!0)),await t.toArray()}catch(t){return a.error("Errore recupero app:",t),[]}}async getApp(e){try{return await this.db.apps.get(e)}catch(t){return a.error("Errore recupero app:",t),null}}async getAppData(e){try{const t=await this.getApp(e);if(!t)return null;const r=await this.getAppFiles(e),i={};return r.forEach(o=>{i[o.filename]=o.content}),{...t,files:i}}catch(t){return a.error("Errore recupero dati app:",t),null}}async getAppWithFiles(e){try{const t=await this.getApp(e);if(!t)return null;const r=await this.getAppFiles(e);return{...t,files:r}}catch(t){return a.error("Errore recupero app con file:",t),null}}async updateApp(e,t){try{return await this.db.apps.update(e,t),await this.setSetting("lastDataModification",new Date().toISOString()),await this.addSyncEvent("app_updated",{appId:e,updates:t}),!0}catch(r){return a.error("Errore aggiornamento app:",r),!1}}async setAppMetadata(e,t){try{const r=await this.getApp(e);if(!r)throw new Error("App non trovata");const i={...r.metadata,...t};return await this.db.apps.update(e,{metadata:i}),a.success(`Metadati aggiornati per app ${e}:`,t),!0}catch(r){return a.error("Errore aggiornamento metadati app:",r),!1}}async getAppMetadata(e,t=null){try{const r=await this.getApp(e);return!r||!r.metadata?null:t?r.metadata[t]||null:r.metadata}catch(r){return a.error("Errore recupero metadati app:",r),null}}async migrateAppsForContent(){try{a.service("StorageService","Inizio migrazione app HTML...");const e=await this.db.apps.toArray();a.info(`Trovate ${e.length} app totali`);let t=0;for(const r of e)if(a.info(`Controllo app: ${r.name} (tipo: ${r.type})`),r.type==="html"&&!r.content){a.info(`App HTML senza contenuto trovata: ${r.name}`);const i=await this.getAppFiles(r.id);a.info(`Trovati ${i.length} file per app ${r.name}`);const o=i.find(s=>s.filename.endsWith(".html"));o?(a.success(`File HTML trovato: ${o.filename}`),await this.db.apps.update(r.id,{content:o.content}),t++,a.success(`App ${r.name} migrata con successo`)):a.warn(`Nessun file HTML trovato per app ${r.name}`)}return t>0?a.success(`Migrate ${t} app HTML per aggiungere campo content`):a.info("Nessuna app HTML da migrare"),t}catch(e){return a.error("Errore migrazione app:",e),a.error("Stack trace:",e.stack),0}}async deleteApp(e){try{return await this.db.transaction("rw",[this.db.apps,this.db.appFiles],async()=>{await this.db.apps.delete(e),await this.db.appFiles.where("appId").equals(e).delete()}),await this.setSetting("lastDataModification",new Date().toISOString()),await this.addSyncEvent("app_deleted",{appId:e}),!0}catch(t){return a.error("Errore eliminazione app:",t),!1}}async updateLastUsed(e){try{await this.db.apps.update(e,{lastUsed:new Date})}catch(t){a.error("Errore aggiornamento ultimo utilizzo:",t)}}async toggleFavorite(e){try{const t=await this.db.apps.get(e);return t?(await this.db.apps.update(e,{favorite:!t.favorite}),!t.favorite):!1}catch(t){return a.error("Errore toggle preferito:",t),!1}}async saveAppFiles(e,t){try{const r=t.map(i=>this.db.appFiles.add({appId:e,filename:i.filename,content:i.content,size:i.size||i.content.length,mimeType:i.mimeType||this.getMimeType(i.filename)}));return await Promise.all(r),!0}catch(r){return a.error("Errore salvataggio file app:",r),!1}}async getAppFiles(e){try{return await this.db.appFiles.where("appId").equals(e).toArray()}catch(t){return a.error("Errore recupero file app:",t),[]}}async getSetting(e,t=null){try{const r=await this.db.settings.get(e);return r?r.value:t}catch(r){return a.error("Errore recupero impostazione:",r),t}}async setSetting(e,t){try{return await this.db.settings.put({key:e,value:t,lastModified:new Date}),!0}catch(r){return a.error("Errore salvataggio impostazione:",r),!1}}async getAllSettings(){try{const e=await this.db.settings.toArray(),t={};return e.forEach(r=>{t[r.key]=r.value}),t}catch(e){return a.error("Errore recupero impostazioni:",e),{}}}async setAllSettings(e){try{const t=[];for(const[r,i]of Object.entries(e))t.push(this.db.settings.put({key:r,value:i,lastModified:new Date}));return await Promise.all(t),!0}catch(t){return a.error("Errore salvataggio impostazioni:",t),!1}}async addSyncEvent(e,t){try{await this.db.syncEvents.add({action:e,data:t,timestamp:new Date,synced:!1,deviceId:await this.getDeviceId()})}catch(r){a.error("Errore aggiunta evento sync:",r)}}async getUnsyncedEvents(){try{return await this.db.syncEvents.where("synced").equals(!1).toArray()}catch(e){return a.error("Errore recupero eventi non sincronizzati:",e),[]}}async markEventsSynced(e){try{await this.db.syncEvents.where("id").anyOf(e).modify({synced:!0})}catch(t){a.error("Errore aggiornamento eventi sync:",t)}}async updateCatalog(e){try{return await this.db.catalog.clear(),await this.db.catalog.bulkAdd(e),!0}catch(t){return a.error("Errore aggiornamento catalogo:",t),!1}}async searchCatalog(e,t={}){try{let r=this.db.catalog.orderBy("downloads").reverse();return e&&(r=r.filter(i=>i.name.toLowerCase().includes(e.toLowerCase())||i.description.toLowerCase().includes(e.toLowerCase())||i.categories.some(o=>o.toLowerCase().includes(e.toLowerCase())))),t.category&&(r=r.filter(i=>i.categories.includes(t.category))),t.featured&&(r=r.filter(i=>i.featured===!0)),await r.limit(t.limit||50).toArray()}catch(r){return a.error("Errore ricerca catalogo:",r),[]}}async getDeviceId(){let e=await this.getSetting("deviceId");return e||(e="device_"+Math.random().toString(36).substr(2,9)+"_"+Date.now(),await this.setSetting("deviceId",e)),e}getMimeType(e){const t=e.split(".").pop().toLowerCase();return{html:"text/html",css:"text/css",js:"application/javascript",json:"application/json",png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",gif:"image/gif",svg:"image/svg+xml",txt:"text/plain"}[t]||"application/octet-stream"}async exportAllData(){try{const[e,t,r]=await Promise.all([this.db.apps.toArray(),this.db.settings.toArray(),this.db.syncEvents.toArray()]);return{version:"1.0.0",timestamp:new Date().toISOString(),deviceId:await this.getDeviceId(),data:{apps:e,settings:t,syncEvents:r}}}catch(e){throw a.error("Errore export dati:",e),e}}async exportBackupData(){try{const[e,t,r]=await Promise.all([this.db.apps.toArray(),this.db.settings.toArray(),this.db.appFiles.toArray()]),i={};t.forEach(c=>{i[c.key]=c.value});const o={};r.forEach(c=>{o[c.appId]||(o[c.appId]=[]),o[c.appId].push({filename:c.filename,content:c.content,size:c.size,mimeType:c.mimeType})});let s=await this.getSetting("lastDataModification");return s||(s=new Date().toISOString(),await this.setSetting("lastDataModification",s)),{settings:i,apps:e,appFiles:o,timestamp:s,version:"1.0.0"}}catch(e){throw a.error("Errore export backup:",e),e}}async importBackupData(e){try{if(a.log("📥 Importazione backup dati:",{hasSettings:!!e.settings,hasApps:!!e.apps,hasAppFiles:!!e.appFiles,appsCount:e.apps?.length||0,appFilesCount:e.appFiles?Object.keys(e.appFiles).length:0,version:e.version}),!e.settings||!e.apps)throw new Error("Formato backup non valido - settings o apps mancanti");if(!Array.isArray(e.apps))throw new Error("Formato backup non valido - apps deve essere un array");return await this.db.transaction("rw",[this.db.apps,this.db.settings,this.db.appFiles],async()=>{if(e.settings&&typeof e.settings=="object"){const t=Object.entries(e.settings).map(([r,i])=>({key:r,value:i,lastModified:new Date}));await this.db.settings.clear(),await this.db.settings.bulkAdd(t),a.log("✅ Settings importate:",Object.keys(e.settings).length)}if(e.apps&&e.apps.length>0){await this.db.apps.clear();const t={};for(const r of e.apps){const i=r.id,{id:o,...s}=r,c=await this.db.apps.add(s);t[i]=c}if(a.log("✅ Apps importate:",e.apps.length),e.appFiles&&typeof e.appFiles=="object"){await this.db.appFiles.clear();let r=0;for(const[i,o]of Object.entries(e.appFiles)){const s=t[i];if(s&&Array.isArray(o)){const c=o.map(d=>({appId:s,filename:d.filename,content:d.content,size:d.size||d.content.length,mimeType:d.mimeType||this.getMimeType(d.filename)}));await this.db.appFiles.bulkAdd(c),r+=c.length}}a.log("✅ File delle app importati:",r)}}}),await this.addSyncEvent("backup_imported",{appsCount:e.apps?.length||0,appFilesCount:e.appFiles?Object.keys(e.appFiles).length:0,timestamp:e.timestamp,version:e.version}),a.log("✅ Backup completo importato con successo"),!0}catch(t){throw a.error("❌ Errore import backup:",t),t}}async importData(e){try{if(!e.data)throw new Error("Formato dati non valido");const{apps:t,settings:r,syncEvents:i}=e.data;return await this.db.transaction("rw",[this.db.apps,this.db.settings,this.db.syncEvents],async()=>{t&&await this.db.apps.bulkPut(t),r&&await this.db.settings.bulkPut(r),i&&await this.db.syncEvents.bulkPut(i)}),!0}catch(t){throw a.error("Errore import dati:",t),t}}async ensureDbOpen(){if(!this.db.isOpen())try{await this.db.open(),a.log("📂 Database riaperto con successo")}catch(e){a.error("❌ Errore riapertura database:",e)}}async getStats(){try{if(await this.ensureDbOpen(),!this.db||!this.db.isOpen())return a.warn("Database non inizializzato"),null;const t=(await this.db.apps.toArray().catch(()=>[])).filter(l=>l&&typeof l=="object"),r=t.map(l=>l.category).filter(l=>typeof l=="string"&&l.length>0),i=t.filter(l=>l.favorite===!0).length,o=t.length,s=await this.db.appFiles.count().catch(()=>0),c=await this.db.settings.count().catch(()=>0),d=t.length>0?t.reduce((l,p)=>p.installDate&&(!l||new Date(p.installDate)>new Date(l))?p.installDate:l,null):null;return{totalApps:o,totalFiles:s,settingsCount:c,favoriteApps:i,categories:Array.from(new Set(r)).length,lastInstall:d,dbSize:await this.estimateDbSize()}}catch(e){return a.error("Errore recupero statistiche:",e),null}}async estimateDbSize(){try{return"storage"in navigator&&"estimate"in navigator.storage&&(await navigator.storage.estimate()).usage||0}catch{return 0}}async close(){this.db&&this.db.close()}}const A=new h,H=Object.freeze(Object.defineProperty({__proto__:null,default:A},Symbol.toStringTag,{value:"Module"}));class I{constructor(){this.loadingTimeout=null,this.initialized=!1}async init(){try{a.log("🎨 Inizializzazione UI Loader..."),this.showLoadingScreen(),await A.ensureDbOpen(),await this.loadMaterialUI(),a.success("✅ UI Loader inizializzato con successo")}catch(e){a.error("❌ Errore inizializzazione UI Loader:",e),E("Impossibile caricare l'interfaccia","error"),this.showErrorScreen(e)}}showLoadingScreen(){const e=document.getElementById("loading-screen");if(e){e.style.display="flex",e.style.opacity="1";const t=e.querySelector(".loading-subtitle");t&&(t.textContent="Inizializzazione Material UI...")}}addLoadingStyles(){if(document.getElementById("loading-styles"))return;const e=document.createElement("style");e.id="loading-styles",e.textContent=`
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
    `,document.head.appendChild(e)}async loadMaterialUI(){if(a.log("🎨 Caricamento Material UI..."),this.initialized){a.log("⚠️ Material UI già inizializzato, skip");return}this.loadingTimeout=setTimeout(()=>{throw new Error("Timeout caricamento Material UI (10s)")},1e4);try{this.updateLoadingText("Importazione moduli...","Caricamento React e Material UI");const{initializeAIdeasWithMaterialUI:e}=await b(async()=>{const{initializeAIdeasWithMaterialUI:t}=await import("./main-material-DP-Rqvbr.js");return{initializeAIdeasWithMaterialUI:t}},__vite__mapDeps([0,1]));a.log("🔧 Funzione di inizializzazione ottenuta:",typeof e),this.updateLoadingText("Inizializzazione interfaccia...","Avvio componenti Material UI"),a.log("🚀 Avvio inizializzazione Material UI..."),await e(),this.initialized=!0,clearTimeout(this.loadingTimeout),a.success("✅ Material UI caricata con successo"),this.hideLoadingScreen()}catch(e){throw clearTimeout(this.loadingTimeout),a.error("❌ Errore durante caricamento Material UI:",e),e}}updateLoadingText(e,t){const r=document.querySelector(".loading-text"),i=document.querySelector(".loading-subtitle");r&&(r.textContent=e),i&&(i.textContent=t)}showErrorScreen(e){const t=document.getElementById("loading-screen");if(t){t.classList.add("error-screen"),this.updateLoadingText("Errore caricamento interfaccia",e.message||"Errore sconosciuto");const r=t.querySelector(".loading-spinner");r&&(r.innerHTML='<div style="font-size: 60px; color: white;">❌</div>')}}hideLoadingScreen(){try{const e=document.getElementById("loading-screen");e&&(e.classList.add("loading-fade-out"),setTimeout(()=>{e.style.display="none",a.log("🎯 Loading screen nascosto")},500))}catch(e){a.error("❌ Errore nascondere loading screen:",e)}}cleanup(){this.loadingTimeout&&clearTimeout(this.loadingTimeout);const e=document.getElementById("loading-styles");e&&e.remove()}}window.UILoader=I;const v=new I;document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>v.init()):v.init();export{B as A,a as D,_ as E,D as R,A as S,b as _,P as a,S as b,H as c,k as g,E as s};
//# sourceMappingURL=main-GggRUrZf.js.map
