import{S as A,g as vn,s as m,h as le,a as O,e as N,b as D,c as Y,i as ue,f as st,d as de,j as pt,k as bn,l as yn}from"./main-BEtm3PPz.js";import{g as Oe,r as En}from"./vendor-Cc5w31rP.js";import{E as An}from"./debug-mVuGYsv3.js";class Cn{constructor(){this.activeApps=new Map,this.launchHistory=[],this.maxConcurrentApps=5,this.launch=this.launch.bind(this),this.launchZipApp=this.launchZipApp.bind(this),this.launchUrlApp=this.launchUrlApp.bind(this),this.launchGitHubApp=this.launchGitHubApp.bind(this),this.launchPWA=this.launchPWA.bind(this),this.createSecureFrame=this.createSecureFrame.bind(this),this.closeApp=this.closeApp.bind(this),this.setupEventListeners=this.setupEventListeners.bind(this)}async init(){this.setupEventListeners(),await this.loadLaunchHistory()}async launch(e,n={}){try{console.log(`🚀 Launching app: ${e.name} (${e.type})`);const i=await A.getSetting("defaultLaunchMode","newpage"),a=e.metadata?.launchMode,s=n.forceMode||a||i;if(n.launchMode=s,s==="iframe"&&this.activeApps.size>=this.maxConcurrentApps&&!n.force&&!await this.showConcurrentAppsDialog())return;const r=await this.validateApp(e);if(!r.valid)throw new Error(r.error);const o=vn("launch"),l=Date.now();m(`Caricamento ${e.name}...`,"info",0);let u;switch(e.type){case"zip":u=await this.launchZipApp(e,n);break;case"html":u=await this.launchHtmlApp(e,n);break;case"github":u=await this.launchGitHubApp(e,n);break;case"pwa":u=await this.launchPWA(e,n);break;default:u=await this.launchUrlApp(e,n)}return this.activeApps.set(o,{app:e,iframe:u,startTime:Date.now(),launchMode:s}),this.addToHistory(e,o),le(),u}catch(i){throw console.error("Errore lancio app:",i),le(),m(`Errore nel lancio di ${e.name}: ${i.message}`,"error"),i}}async launchZipApp(e,n={}){try{const i=await A.getAppFiles(e.id);if(!i.length)throw new Error("File dell'app non trovati");const a=this.findEntryPoint(i,e.manifest?.entryPoint);if(!a)throw new Error("Entry point non trovato");const s=new Map,r=new Map;for(const p of i){const f=new Blob([p.content],{type:p.mimeType}),g=URL.createObjectURL(f);s.set(p.filename,p),r.set(p.filename,g)}let o=a.content;o=this.replaceAllLocalPaths(o,r,e);const l=new Blob([o],{type:"text/html"}),u=URL.createObjectURL(l);if(n.launchMode==="newpage"){const p=window.open("",`aideas_zip_${e.id}_${Date.now()}`,"width=1200,height=800,scrollbars=yes,resizable=yes");if(!p)throw new Error("Popup bloccato dal browser. Consenti i popup per AIdeas.");p.document.write(o),p.document.close(),this.injectAIdeasAPI({contentWindow:p},e);const f=()=>{for(const g of r.values())URL.revokeObjectURL(g);URL.revokeObjectURL(u)};return p.addEventListener("beforeunload",f),{window:p,external:!0,cleanup:f}}else{const p=this.createSecureFrame(e,{src:u,sandbox:"allow-scripts allow-forms allow-modals allow-popups-to-escape-sandbox allow-same-origin",files:s,blobUrls:r});return p.addEventListener("unload",()=>{for(const f of r.values())URL.revokeObjectURL(f);URL.revokeObjectURL(u)}),{iframe:p,window:p.contentWindow,cleanup:()=>{for(const f of r.values())URL.revokeObjectURL(f);URL.revokeObjectURL(u)}}}}catch(i){throw console.error("Errore lancio app ZIP:",i),i}}async launchHtmlApp(e,n={}){try{if(!e.content)throw new Error("Contenuto HTML mancante");let i=await this.injectCSPForHTMLApp(e.content,e.id);const a=new Blob([i],{type:"text/html"}),s=URL.createObjectURL(a);if(n.launchMode==="newpage"){const r=window.open("",`aideas_html_${e.id}_${Date.now()}`,"width=1200,height=800,scrollbars=yes,resizable=yes");if(!r)throw new Error("Popup bloccato dal browser. Consenti i popup per AIdeas.");return r.document.open(),r.document.write(i),r.document.close(),{window:r,external:!0,cleanup:()=>{URL.revokeObjectURL(s)}}}else{const r=this.createSecureFrame(e,{src:s,sandbox:"allow-scripts allow-forms allow-modals allow-popups-to-escape-sandbox allow-same-origin"});return r.addEventListener("unload",()=>{URL.revokeObjectURL(s)}),{iframe:r,window:r.contentWindow,cleanup:()=>{URL.revokeObjectURL(s)}}}}catch(i){throw console.error("Errore lancio app HTML:",i),i}}analyzeHTMLForExternalResources(e){const n={scripts:new Set,styles:new Set,fonts:new Set,images:new Set,frames:new Set,connections:new Set},i={scripts:/<script[^>]*src=["']([^"']+)["'][^>]*>/gi,styles:/<link[^>]*href=["']([^"']+)["'][^>]*>/gi,images:/<img[^>]*src=["']([^"']+)["'][^>]*>/gi,frames:/<iframe[^>]*src=["']([^"']+)["'][^>]*>/gi,connections:/fetch\(["']([^"']+)["']\)|XMLHttpRequest\(["']([^"']+)["']\)/gi},a=r=>{try{if(r.startsWith("//"))r="https:"+r;else{if(r.startsWith("/"))return null;if(!r.startsWith("http"))return null}return new URL(r).hostname}catch{return null}};let s;for(;(s=i.scripts.exec(e))!==null;){const r=a(s[1]);r&&n.scripts.add(r)}for(;(s=i.styles.exec(e))!==null;){const r=a(s[1]);if(r){const o=s[0];o.includes('rel="stylesheet"')||o.includes('type="text/css"')?n.styles.add(r):o.includes('rel="preload"')&&o.includes('as="font"')&&n.fonts.add(r)}}for(;(s=i.images.exec(e))!==null;){const r=a(s[1]);r&&n.images.add(r)}for(;(s=i.frames.exec(e))!==null;){const r=a(s[1]);r&&n.frames.add(r)}for(;(s=i.connections.exec(e))!==null;){const r=s[1]||s[2],o=a(r);o&&n.connections.add(o)}return{scripts:Array.from(n.scripts),styles:Array.from(n.styles),fonts:Array.from(n.fonts),images:Array.from(n.images),frames:Array.from(n.frames),connections:Array.from(n.connections)}}generateCustomCSP(e){const n=new Set;Object.values(e).forEach(s=>{s.forEach(r=>n.add(r))});const i=Array.from(n);let a="default-src 'self' data: blob: 'unsafe-inline' 'unsafe-eval'; ";return a+="script-src 'self' data: blob: 'unsafe-inline' 'unsafe-eval' "+i.join(" ")+"; ",a+="style-src 'self' data: blob: 'unsafe-inline' "+i.join(" ")+"; ",a+="img-src 'self' data: blob: "+i.join(" ")+"; ",a+="font-src 'self' data: blob: "+i.join(" ")+"; ",a+="connect-src 'self' data: blob: "+i.join(" ")+"; ",a+="frame-src 'self' data: blob: "+i.join(" ")+"; ",a+="object-src 'self' data: blob:; ",a+="base-uri 'self'; ",a+="form-action 'self';",a}async injectCSPForHTMLApp(e,n=null){try{let i=null,a=null;if(n){const r=await A.getAppMetadata(n,"customCSP"),o=await A.getAppMetadata(n,"externalDomains"),l=await A.getAppMetadata(n,"lastAnalyzed");if(r&&o&&l){const u=(Date.now()-l)/36e5;u<24&&(console.log(`♻️ Usando CSP cached per app ${n} (analizzata ${u.toFixed(1)} ore fa)`),i=r,a=o)}}i||(console.log(`🔍 Analisi HTML per app ${n||"senza ID"}...`),a=this.analyzeHTMLForExternalResources(e),i=this.generateCustomCSP(a),n&&(await A.setAppMetadata(n,{customCSP:i,externalDomains:a,lastAnalyzed:Date.now()}),console.log(`💾 CSP cached per app ${n}`))),console.log("🔍 Domini trovati nell'HTML:",a);let s;return e.includes('<meta http-equiv="Content-Security-Policy"')?s=e.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/g,`<meta http-equiv="Content-Security-Policy" content="${i}">`):s=e.replace(/<head>/i,`<head>
  <meta http-equiv="Content-Security-Policy" content="${i}">`),s}catch(i){console.warn("Errore nell'analisi CSP, uso CSP di fallback:",i);const a="default-src * data: blob: 'unsafe-inline' 'unsafe-eval'; script-src * data: blob: 'unsafe-inline' 'unsafe-eval'; style-src * data: blob: 'unsafe-inline'; img-src * data: blob:; font-src * data: blob:; connect-src * data: blob:; frame-src * data: blob:; object-src * data: blob:; base-uri *; form-action *;";let s;return e.includes('<meta http-equiv="Content-Security-Policy"')?s=e.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/g,`<meta http-equiv="Content-Security-Policy" content="${a}">`):s=e.replace(/<head>/i,`<head>
  <meta http-equiv="Content-Security-Policy" content="${a}">`),s}}async launchUrlApp(e,n={}){try{if(!e.url)throw new Error("URL dell'app non specificato");let i=e.url;if(n.launchMode==="newpage"||n.forceNewWindow){console.log("🪟 Apertura in nuova finestra (modalità esplicita)");const a=window.open(i,`aideas_app_${e.id}`,"width=1200,height=800,scrollbars=yes,resizable=yes");if(!a)throw new Error("Popup bloccato dal browser. Consenti i popup per AIdeas.");return{window:a,external:!0}}else if(console.log("🔍 Tentativo apertura in iframe..."),await this.checkIframeCompatibility(i)){console.log("✅ Caricamento in iframe...");const s=this.createSecureFrame(e,{src:i,sandbox:"allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin"});return s.addEventListener("error",()=>{console.log("❌ Errore caricamento iframe, fallback a nuova finestra"),m("Errore caricamento iframe, apertura in nuova finestra","info");const r=s.closest(".modal");r&&O(r.id),window.open(i,`aideas_app_${e.id}_fallback`,"width=1200,height=800,scrollbars=yes,resizable=yes")&&m("App aperta in nuova finestra","success")}),{iframe:s,window:s.contentWindow}}else{console.log("🔄 Fallback automatico a nuova finestra - iframe non supportato"),m("Questo sito non supporta iframe, apertura in nuova finestra","info");const s=window.open(i,`aideas_app_${e.id}_fallback`,"width=1200,height=800,scrollbars=yes,resizable=yes");if(!s)throw new Error("Popup bloccato dal browser. Consenti i popup per AIdeas.");return{window:s,external:!0,fallback:!0}}}catch(i){throw console.error("Errore lancio app URL:",i),i}}async launchGitHubApp(e,n={}){try{if(!e.githubUrl)throw new Error("URL GitHub non specificato");const i=this.parseGitHubUrl(e.githubUrl);if(!i)throw new Error("URL GitHub non valido");let a;e.metadata?.usePagesUrl?a=`https://${i.owner}.github.io/${i.repo}/`:a=`https://raw.githubusercontent.com/${i.owner}/${i.repo}/${i.branch||"main"}/index.html`;const s={...e,url:a,type:"url"};return await this.launchUrlApp(s,n)}catch(i){throw console.error("Errore lancio app GitHub:",i),i}}async launchPWA(e,n={}){try{if(!e.url)throw new Error("URL della PWA non specificato");const i=window.open(e.url,`aideas_pwa_${e.id}`,"width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,location=no,status=no,menubar=no");if(!i)throw new Error("Popup bloccato dal browser. Consenti i popup per AIdeas.");return"serviceWorker"in navigator&&e.manifest&&setTimeout(()=>{this.promptPWAInstall(e,i)},2e3),{window:i,external:!0,isPWA:!0}}catch(i){throw console.error("Errore lancio PWA:",i),i}}createSecureFrame(e,n={}){const i=`app-modal-${e.id}-${Date.now()}`,a=`
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
    `,s=D(i,a,{size:"modal-xl",disableBackdropClose:!1,disableEscapeClose:!1}),r=document.createElement("iframe");return r.className="app-frame",r.src=n.src,r.sandbox=n.sandbox||"allow-scripts allow-forms allow-modals",r.style.cssText=`
      width: 100%;
      height: 70vh;
      border: none;
      border-radius: 8px;
      background: white;
    `,r.addEventListener("load",()=>{const l=s.querySelector(".app-loading");l&&(l.style.display="none"),r.style.display="block",this.injectAIdeasAPI(r,e)}),r.addEventListener("error",()=>{const l=s.querySelector(".app-frame-container");l.innerHTML=`
        <div class="app-error">
          <div class="app-error-icon">⚠️</div>
          <h3>Errore di caricamento</h3>
          <p>Impossibile caricare l'applicazione.</p>
          <button class="btn btn-primary" onclick="location.reload()">Riprova</button>
        </div>
      `}),s.querySelector(".app-frame-container").appendChild(r),this.setupAppModalControls(s,r,e),r}setupAppModalControls(e,n,i){const a=e.querySelector(`#app-launch-mode-${i.id}`);a?.addEventListener("change",async()=>{const l=a.value;l!=="default"&&(await Y({title:"Cambia Modalità",message:`Vuoi riaprire l'app in modalità "${l==="iframe"?"finestra modale":"nuova pagina"}"?`,icon:"question",confirmText:"Riapri",cancelText:"Annulla",type:"default"})?(O(e.id),await this.launch(i,{forceMode:l})):a.value="default")}),e.querySelector(`#app-refresh-${i.id}`)?.addEventListener("click",()=>{n.src=n.src,m("App ricaricata","info")}),e.querySelector(`#app-fullscreen-${i.id}`)?.addEventListener("click",()=>{e.requestFullscreen?e.requestFullscreen():e.webkitRequestFullscreen?e.webkitRequestFullscreen():e.msRequestFullscreen&&e.msRequestFullscreen()});const o=new MutationObserver(l=>{l.forEach(u=>{u.type==="childList"&&u.removedNodes.forEach(p=>{p===e&&(this.cleanupApp(i.id),o.disconnect())})})});o.observe(document.body,{childList:!0})}injectAIdeasAPI(e,n){try{const i=e.contentWindow;if(!i)return;i.AIdeas={app:{id:n.id,name:n.name,version:n.version},storage:{get:a=>localStorage.getItem(`aideas_app_${n.id}_${a}`),set:(a,s)=>localStorage.setItem(`aideas_app_${n.id}_${a}`,s),remove:a=>localStorage.removeItem(`aideas_app_${n.id}_${a}`),clear:()=>{const a=`aideas_app_${n.id}_`;Object.keys(localStorage).forEach(s=>{s.startsWith(a)&&localStorage.removeItem(s)})}},utils:{showNotification:(a,s="info")=>{m(`[${n.name}] ${a}`,s)},getUserPreferences:async()=>await A.getAllSettings(),openUrl:a=>{window.open(a,"_blank")},closeApp:()=>{this.closeApp(n.id)}},lifecycle:{onAppStart:a=>{typeof a=="function"&&setTimeout(a,100)},onAppPause:a=>{window.addEventListener("blur",a)},onAppResume:a=>{window.addEventListener("focus",a)}}},console.log(`✅ AIdeas API iniettata in ${n.name}`)}catch(i){console.warn("Impossibile iniettare AIdeas API:",i)}}findEntryPoint(e,n){if(n){const s=e.find(r=>r.filename===n);if(s)return s}const i=e.find(s=>s.filename==="index.html");if(i)return i;const a=e.find(s=>s.filename.endsWith(".html"));if(a)return a;throw new Error("Entry point HTML non trovato")}replaceAllLocalPaths(e,n,i){let a=e;const s=new Map;for(const[o,l]of n){s.set(o,l),s.set("./"+o,l),s.set("../"+o,l);const u=o.split("/");if(u.length>1){const p=u[u.length-1];s.has(p)||s.set(p,l)}}a=a.replace(/\bsrc\s*=\s*["']([^"']+)["']/gi,(o,l)=>{const u=this.cleanPath(l);return s.has(u)?o.replace(l,s.get(u)):o}),a=a.replace(/\bhref\s*=\s*["']([^"']+)["']/gi,(o,l)=>{const u=this.cleanPath(l);return s.has(u)&&!l.startsWith("#")&&!l.startsWith("mailto:")?o.replace(l,s.get(u)):o}),a=a.replace(/\bimport\s+.*?\s+from\s+["']([^"']+)["']/gi,(o,l)=>{const u=this.cleanPath(l);return s.has(u)?o.replace(l,s.get(u)):o}),a=a.replace(/\brequire\s*\(\s*["']([^"']+)["']\s*\)/gi,(o,l)=>{const u=this.cleanPath(l);return s.has(u)?o.replace(l,s.get(u)):o}),a=a.replace(/\burl\s*\(\s*["']?([^"')]+)["']?\s*\)/gi,(o,l)=>{const u=this.cleanPath(l);return s.has(u)?o.replace(l,s.get(u)):o}),a=a.replace(/\bfetch\s*\(\s*["']([^"']+)["']/gi,(o,l)=>{const u=this.cleanPath(l);return s.has(u)?o.replace(l,s.get(u)):o}),a=a.replace(/\bnew\s+URL\s*\(\s*["']([^"']+)["']/gi,(o,l)=>{const u=this.cleanPath(l);return s.has(u)?o.replace(l,s.get(u)):o}),a=a.replace(/["']([^"']*\.[a-zA-Z0-9]+)["']/gi,(o,l)=>{if(!l.includes("://")&&!l.startsWith("data:")&&!l.startsWith("#")){const u=this.cleanPath(l);if(s.has(u))return o.replace(l,s.get(u))}return o});const r=`
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="aideas-app" content="${N(i.name)}">
      <meta name="aideas-version" content="${i.version||"1.0.0"}">
      <meta name="aideas-type" content="zip">
      <base href="blob:">
    `;return a.includes("<head>")?a=a.replace("<head>","<head>"+r):a.includes("<html>")?a=a.replace("<html>","<html><head>"+r+"</head>"):a=r+a,a}cleanPath(e){if(!e)return"";let n=e.split("?")[0].split("#")[0];return n=n.replace(/\\/g,"/"),n=n.trim(),n}async checkIframeCompatibility(e){try{if(console.log(`🔍 Controllo compatibilità iframe per: ${e}`),e.startsWith("blob:"))return console.log("✅ Blob URL - compatibile con iframe"),!0;if(e.startsWith("data:"))return console.log("✅ Data URL - compatibile con iframe"),!0;const n=new AbortController,i=setTimeout(()=>n.abort(),5e3);try{const a=await fetch(e,{method:"HEAD",signal:n.signal,mode:"cors"});clearTimeout(i);const s=a.headers.get("X-Frame-Options"),r=a.headers.get("Content-Security-Policy");if(console.log("📋 Headers ricevuti:",{"X-Frame-Options":s,"Content-Security-Policy":r?r.substring(0,100)+"...":"none"}),s){const o=s.toLowerCase();if(o==="deny")return console.log("❌ X-Frame-Options: DENY - iframe non supportato"),!1;if(o==="sameorigin")return console.log("⚠️ X-Frame-Options: SAMEORIGIN - iframe limitato"),window.location.origin===new URL(e).origin}if(r){const o=r.toLowerCase();if(o.includes("frame-ancestors")){if(o.includes("frame-ancestors 'none'"))return console.log("❌ CSP frame-ancestors: none - iframe non supportato"),!1;if(o.includes("frame-ancestors 'self'"))return console.log("⚠️ CSP frame-ancestors: self - iframe limitato"),window.location.origin===new URL(e).origin}}return console.log("✅ URL compatibile con iframe"),!0}catch(a){return clearTimeout(i),a.name==="AbortError"?console.log("⏰ Timeout durante controllo compatibilità iframe"):console.log("⚠️ Errore durante controllo compatibilità iframe:",a.message),console.log("🔄 Fallback: proveremo iframe comunque"),!0}}catch(n){return console.error("❌ Errore generale controllo compatibilità iframe:",n),!1}}parseGitHubUrl(e){const n=[/github\.com\/([^\/]+)\/([^\/]+)/,/([^\/]+)\.github\.io\/([^\/]+)/];for(const i of n){const a=e.match(i);if(a)return{owner:a[1],repo:a[2].replace(".git",""),branch:"main"}}return null}async validateApp(e){const n={valid:!0,error:null};if(!e||!e.id)return n.valid=!1,n.error="App non valida",n;switch(e.type){case"zip":(await A.getAppFiles(e.id)).length||(n.valid=!1,n.error="File dell'app non trovati");break;case"url":case"github":case"pwa":!e.url&&!e.githubUrl&&(n.valid=!1,n.error="URL dell'app non specificato");break;case"html":e.content||(n.valid=!1,n.error="Contenuto HTML mancante");break;default:n.valid=!1,n.error=`Tipo di app non supportato: ${e.type}`}return n}async showConcurrentAppsDialog(){return new Promise(e=>{D("concurrent-apps-dialog",`
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
      `,{disableBackdropClose:!0}),setTimeout(()=>e(!0),5e3)})}closeApp(e){const n=Array.from(this.activeApps.values()).find(i=>i.app.id===e);n&&(n.window&&!n.window.closed&&n.window.close(),n.cleanup&&n.cleanup(),this.activeApps.delete(e))}cleanupApp(e){this.closeApp(e)}setupEventListeners(){window.addEventListener("beforeunload",()=>{for(const[e,n]of this.activeApps)n.cleanup&&n.cleanup()})}async loadLaunchHistory(){const e=await A.getSetting("launchHistory",[]);this.launchHistory=e.slice(-50)}addToHistory(e,n){this.launchHistory.push({appId:e.id,appName:e.name,launchId:n,timestamp:new Date().toISOString()}),A.setSetting("launchHistory",this.launchHistory.slice(-50))}trackLaunch(e,n){console.log(`📊 Launch tracked: ${e.name} in ${n}ms`)}promptPWAInstall(e,n){console.log(`💡 PWA install prompt for ${e.name}`)}get activeAppCount(){return this.activeApps.size}get canLaunchMore(){return this.activeApps.size<this.maxConcurrentApps}}var w;(function(t){t.Root="root",t.Text="text",t.Directive="directive",t.Comment="comment",t.Script="script",t.Style="style",t.Tag="tag",t.CDATA="cdata",t.Doctype="doctype"})(w||(w={}));function Ln(t){return t.type===w.Tag||t.type===w.Script||t.type===w.Style}const Pe=w.Root,wn=w.Text,Sn=w.Directive,Tn=w.Comment,Mn=w.Script,xn=w.Style,Ft=w.Tag,In=w.CDATA,Rn=w.Doctype;class Be{constructor(){this.parent=null,this.prev=null,this.next=null,this.startIndex=null,this.endIndex=null}get parentNode(){return this.parent}set parentNode(e){this.parent=e}get previousSibling(){return this.prev}set previousSibling(e){this.prev=e}get nextSibling(){return this.next}set nextSibling(e){this.next=e}cloneNode(e=!1){return rt(this,e)}}class Wt extends Be{constructor(e){super(),this.data=e}get nodeValue(){return this.data}set nodeValue(e){this.data=e}}class Ne extends Wt{constructor(){super(...arguments),this.type=w.Text}get nodeType(){return 3}}class On extends Wt{constructor(){super(...arguments),this.type=w.Comment}get nodeType(){return 8}}class Pn extends Wt{constructor(e,n){super(n),this.name=e,this.type=w.Directive}get nodeType(){return 1}}class Yt extends Be{constructor(e){super(),this.children=e}get firstChild(){var e;return(e=this.children[0])!==null&&e!==void 0?e:null}get lastChild(){return this.children.length>0?this.children[this.children.length-1]:null}get childNodes(){return this.children}set childNodes(e){this.children=e}}class Bn extends Yt{constructor(){super(...arguments),this.type=w.CDATA}get nodeType(){return 4}}class He extends Yt{constructor(){super(...arguments),this.type=w.Root}get nodeType(){return 9}}class Nn extends Yt{constructor(e,n,i=[],a=e==="script"?w.Script:e==="style"?w.Style:w.Tag){super(i),this.name=e,this.attribs=n,this.type=a}get nodeType(){return 1}get tagName(){return this.name}set tagName(e){this.name=e}get attributes(){return Object.keys(this.attribs).map(e=>{var n,i;return{name:e,value:this.attribs[e],namespace:(n=this["x-attribsNamespace"])===null||n===void 0?void 0:n[e],prefix:(i=this["x-attribsPrefix"])===null||i===void 0?void 0:i[e]}})}}function y(t){return Ln(t)}function St(t){return t.type===w.CDATA}function V(t){return t.type===w.Text}function Zt(t){return t.type===w.Comment}function Hn(t){return t.type===w.Directive}function Q(t){return t.type===w.Root}function M(t){return Object.prototype.hasOwnProperty.call(t,"children")}function rt(t,e=!1){let n;if(V(t))n=new Ne(t.data);else if(Zt(t))n=new On(t.data);else if(y(t)){const i=e?Rt(t.children):[],a=new Nn(t.name,{...t.attribs},i);i.forEach(s=>s.parent=a),t.namespace!=null&&(a.namespace=t.namespace),t["x-attribsNamespace"]&&(a["x-attribsNamespace"]={...t["x-attribsNamespace"]}),t["x-attribsPrefix"]&&(a["x-attribsPrefix"]={...t["x-attribsPrefix"]}),n=a}else if(St(t)){const i=e?Rt(t.children):[],a=new Bn(i);i.forEach(s=>s.parent=a),n=a}else if(Q(t)){const i=e?Rt(t.children):[],a=new He(i);i.forEach(s=>s.parent=a),t["x-mode"]&&(a["x-mode"]=t["x-mode"]),n=a}else if(Hn(t)){const i=new Pn(t.name,t.data);t["x-name"]!=null&&(i["x-name"]=t["x-name"],i["x-publicId"]=t["x-publicId"],i["x-systemId"]=t["x-systemId"]),n=i}else throw new Error(`Not implemented yet: ${t.type}`);return n.startIndex=t.startIndex,n.endIndex=t.endIndex,t.sourceCodeLocation!=null&&(n.sourceCodeLocation=t.sourceCodeLocation),n}function Rt(t){const e=t.map(n=>rt(n,!0));for(let n=1;n<e.length;n++)e[n].prev=e[n-1],e[n-1].next=e[n];return e}const pe=/["&'<>$\x80-\uFFFF]/g,kn=new Map([[34,"&quot;"],[38,"&amp;"],[39,"&apos;"],[60,"&lt;"],[62,"&gt;"]]),Un=String.prototype.codePointAt!=null?(t,e)=>t.codePointAt(e):(t,e)=>(t.charCodeAt(e)&64512)===55296?(t.charCodeAt(e)-55296)*1024+t.charCodeAt(e+1)-56320+65536:t.charCodeAt(e);function ke(t){let e="",n=0,i;for(;(i=pe.exec(t))!==null;){const a=i.index,s=t.charCodeAt(a),r=kn.get(s);r!==void 0?(e+=t.substring(n,a)+r,n=a+1):(e+=`${t.substring(n,a)}&#x${Un(t,a).toString(16)};`,n=pe.lastIndex+=+((s&64512)===55296))}return e+t.substr(n)}function Ue(t,e){return function(i){let a,s=0,r="";for(;a=t.exec(i);)s!==a.index&&(r+=i.substring(s,a.index)),r+=e.get(a[0].charCodeAt(0)),s=a.index+1;return r+i.substring(s)}}const Dn=Ue(/["&\u00A0]/g,new Map([[34,"&quot;"],[38,"&amp;"],[160,"&nbsp;"]])),Fn=Ue(/[&<>\u00A0]/g,new Map([[38,"&amp;"],[60,"&lt;"],[62,"&gt;"],[160,"&nbsp;"]])),zn=new Map(["altGlyph","altGlyphDef","altGlyphItem","animateColor","animateMotion","animateTransform","clipPath","feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feDistantLight","feDropShadow","feFlood","feFuncA","feFuncB","feFuncG","feFuncR","feGaussianBlur","feImage","feMerge","feMergeNode","feMorphology","feOffset","fePointLight","feSpecularLighting","feSpotLight","feTile","feTurbulence","foreignObject","glyphRef","linearGradient","radialGradient","textPath"].map(t=>[t.toLowerCase(),t])),_n=new Map(["definitionURL","attributeName","attributeType","baseFrequency","baseProfile","calcMode","clipPathUnits","diffuseConstant","edgeMode","filterUnits","glyphRef","gradientTransform","gradientUnits","kernelMatrix","kernelUnitLength","keyPoints","keySplines","keyTimes","lengthAdjust","limitingConeAngle","markerHeight","markerUnits","markerWidth","maskContentUnits","maskUnits","numOctaves","pathLength","patternContentUnits","patternTransform","patternUnits","pointsAtX","pointsAtY","pointsAtZ","preserveAlpha","preserveAspectRatio","primitiveUnits","refX","refY","repeatCount","repeatDur","requiredExtensions","requiredFeatures","specularConstant","specularExponent","spreadMethod","startOffset","stdDeviation","stitchTiles","surfaceScale","systemLanguage","tableValues","targetX","targetY","textLength","viewBox","viewTarget","xChannelSelector","yChannelSelector","zoomAndPan"].map(t=>[t.toLowerCase(),t])),$n=new Set(["style","script","xmp","iframe","noembed","noframes","plaintext","noscript"]);function Vn(t){return t.replace(/"/g,"&quot;")}function qn(t,e){var n;if(!t)return;const i=((n=e.encodeEntities)!==null&&n!==void 0?n:e.decodeEntities)===!1?Vn:e.xmlMode||e.encodeEntities!=="utf8"?ke:Dn;return Object.keys(t).map(a=>{var s,r;const o=(s=t[a])!==null&&s!==void 0?s:"";return e.xmlMode==="foreign"&&(a=(r=_n.get(a))!==null&&r!==void 0?r:a),!e.emptyAttrs&&!e.xmlMode&&o===""?a:`${a}="${i(o)}"`}).join(" ")}const he=new Set(["area","base","basefont","br","col","command","embed","frame","hr","img","input","isindex","keygen","link","meta","param","source","track","wbr"]);function Kt(t,e={}){const n="length"in t?t:[t];let i="";for(let a=0;a<n.length;a++)i+=jn(n[a],e);return i}function jn(t,e){switch(t.type){case Pe:return Kt(t.children,e);case Rn:case Sn:return Kn(t);case Tn:return Jn(t);case In:return Qn(t);case Mn:case xn:case Ft:return Zn(t,e);case wn:return Xn(t,e)}}const Wn=new Set(["mi","mo","mn","ms","mtext","annotation-xml","foreignObject","desc","title"]),Yn=new Set(["svg","math"]);function Zn(t,e){var n;e.xmlMode==="foreign"&&(t.name=(n=zn.get(t.name))!==null&&n!==void 0?n:t.name,t.parent&&Wn.has(t.parent.name)&&(e={...e,xmlMode:!1})),!e.xmlMode&&Yn.has(t.name)&&(e={...e,xmlMode:"foreign"});let i=`<${t.name}`;const a=qn(t.attribs,e);return a&&(i+=` ${a}`),t.children.length===0&&(e.xmlMode?e.selfClosingTags!==!1:e.selfClosingTags&&he.has(t.name))?(e.xmlMode||(i+=" "),i+="/>"):(i+=">",t.children.length>0&&(i+=Kt(t.children,e)),(e.xmlMode||!he.has(t.name))&&(i+=`</${t.name}>`)),i}function Kn(t){return`<${t.data}>`}function Xn(t,e){var n;let i=t.data||"";return((n=e.encodeEntities)!==null&&n!==void 0?n:e.decodeEntities)!==!1&&!(!e.xmlMode&&t.parent&&$n.has(t.parent.name))&&(i=e.xmlMode||e.encodeEntities!=="utf8"?ke(i):Fn(i)),i}function Qn(t){return`<![CDATA[${t.children[0].data}]]>`}function Jn(t){return`<!--${t.data}-->`}function De(t,e){return Kt(t,e)}function Gn(t,e){return M(t)?t.children.map(n=>De(n,e)).join(""):""}function gt(t){return Array.isArray(t)?t.map(gt).join(""):y(t)?t.name==="br"?`
`:gt(t.children):St(t)?gt(t.children):V(t)?t.data:""}function K(t){return Array.isArray(t)?t.map(K).join(""):M(t)&&!Zt(t)?K(t.children):V(t)?t.data:""}function mt(t){return Array.isArray(t)?t.map(mt).join(""):M(t)&&(t.type===w.Tag||St(t))?mt(t.children):V(t)?t.data:""}function Tt(t){return M(t)?t.children:[]}function Fe(t){return t.parent||null}function ze(t){const e=Fe(t);if(e!=null)return Tt(e);const n=[t];let{prev:i,next:a}=t;for(;i!=null;)n.unshift(i),{prev:i}=i;for(;a!=null;)n.push(a),{next:a}=a;return n}function ti(t,e){var n;return(n=t.attribs)===null||n===void 0?void 0:n[e]}function ei(t,e){return t.attribs!=null&&Object.prototype.hasOwnProperty.call(t.attribs,e)&&t.attribs[e]!=null}function ni(t){return t.name}function Xt(t){let{next:e}=t;for(;e!==null&&!y(e);)({next:e}=e);return e}function Qt(t){let{prev:e}=t;for(;e!==null&&!y(e);)({prev:e}=e);return e}function q(t){if(t.prev&&(t.prev.next=t.next),t.next&&(t.next.prev=t.prev),t.parent){const e=t.parent.children,n=e.lastIndexOf(t);n>=0&&e.splice(n,1)}t.next=null,t.prev=null,t.parent=null}function ii(t,e){const n=e.prev=t.prev;n&&(n.next=e);const i=e.next=t.next;i&&(i.prev=e);const a=e.parent=t.parent;if(a){const s=a.children;s[s.lastIndexOf(t)]=e,t.parent=null}}function ai(t,e){if(q(e),e.next=null,e.parent=t,t.children.push(e)>1){const n=t.children[t.children.length-2];n.next=e,e.prev=n}else e.prev=null}function si(t,e){q(e);const{parent:n}=t,i=t.next;if(e.next=i,e.prev=t,t.next=e,e.parent=n,i){if(i.prev=e,n){const a=n.children;a.splice(a.lastIndexOf(i),0,e)}}else n&&n.children.push(e)}function ri(t,e){if(q(e),e.parent=t,e.prev=null,t.children.unshift(e)!==1){const n=t.children[1];n.prev=e,e.next=n}else e.next=null}function oi(t,e){q(e);const{parent:n}=t;if(n){const i=n.children;i.splice(i.indexOf(t),0,e)}t.prev&&(t.prev.next=e),e.parent=n,e.prev=t.prev,e.next=t,t.prev=e}function lt(t,e,n=!0,i=1/0){return Jt(t,Array.isArray(e)?e:[e],n,i)}function Jt(t,e,n,i){const a=[],s=[Array.isArray(e)?e:[e]],r=[0];for(;;){if(r[0]>=s[0].length){if(r.length===1)return a;s.shift(),r.shift();continue}const o=s[0][r[0]++];if(t(o)&&(a.push(o),--i<=0))return a;n&&M(o)&&o.children.length>0&&(r.unshift(0),s.unshift(o.children))}}function ci(t,e){return e.find(t)}function Gt(t,e,n=!0){const i=Array.isArray(e)?e:[e];for(let a=0;a<i.length;a++){const s=i[a];if(y(s)&&t(s))return s;if(n&&M(s)&&s.children.length>0){const r=Gt(t,s.children,!0);if(r)return r}}return null}function _e(t,e){return(Array.isArray(e)?e:[e]).some(n=>y(n)&&t(n)||M(n)&&_e(t,n.children))}function li(t,e){const n=[],i=[Array.isArray(e)?e:[e]],a=[0];for(;;){if(a[0]>=i[0].length){if(i.length===1)return n;i.shift(),a.shift();continue}const s=i[0][a[0]++];y(s)&&t(s)&&n.push(s),M(s)&&s.children.length>0&&(a.unshift(0),i.unshift(s.children))}}const vt={tag_name(t){return typeof t=="function"?e=>y(e)&&t(e.name):t==="*"?y:e=>y(e)&&e.name===t},tag_type(t){return typeof t=="function"?e=>t(e.type):e=>e.type===t},tag_contains(t){return typeof t=="function"?e=>V(e)&&t(e.data):e=>V(e)&&e.data===t}};function te(t,e){return typeof e=="function"?n=>y(n)&&e(n.attribs[t]):n=>y(n)&&n.attribs[t]===e}function ui(t,e){return n=>t(n)||e(n)}function $e(t){const e=Object.keys(t).map(n=>{const i=t[n];return Object.prototype.hasOwnProperty.call(vt,n)?vt[n](i):te(n,i)});return e.length===0?null:e.reduce(ui)}function di(t,e){const n=$e(t);return n?n(e):!0}function pi(t,e,n,i=1/0){const a=$e(t);return a?lt(a,e,n,i):[]}function hi(t,e,n=!0){return Array.isArray(e)||(e=[e]),Gt(te("id",t),e,n)}function J(t,e,n=!0,i=1/0){return lt(vt.tag_name(t),e,n,i)}function fi(t,e,n=!0,i=1/0){return lt(te("class",t),e,n,i)}function gi(t,e,n=!0,i=1/0){return lt(vt.tag_type(t),e,n,i)}function mi(t){let e=t.length;for(;--e>=0;){const n=t[e];if(e>0&&t.lastIndexOf(n,e-1)>=0){t.splice(e,1);continue}for(let i=n.parent;i;i=i.parent)if(t.includes(i)){t.splice(e,1);break}}return t}var B;(function(t){t[t.DISCONNECTED=1]="DISCONNECTED",t[t.PRECEDING=2]="PRECEDING",t[t.FOLLOWING=4]="FOLLOWING",t[t.CONTAINS=8]="CONTAINS",t[t.CONTAINED_BY=16]="CONTAINED_BY"})(B||(B={}));function Ve(t,e){const n=[],i=[];if(t===e)return 0;let a=M(t)?t:t.parent;for(;a;)n.unshift(a),a=a.parent;for(a=M(e)?e:e.parent;a;)i.unshift(a),a=a.parent;const s=Math.min(n.length,i.length);let r=0;for(;r<s&&n[r]===i[r];)r++;if(r===0)return B.DISCONNECTED;const o=n[r-1],l=o.children,u=n[r],p=i[r];return l.indexOf(u)>l.indexOf(p)?o===e?B.FOLLOWING|B.CONTAINED_BY:B.FOLLOWING:o===t?B.PRECEDING|B.CONTAINS:B.PRECEDING}function G(t){return t=t.filter((e,n,i)=>!i.includes(e,n+1)),t.sort((e,n)=>{const i=Ve(e,n);return i&B.PRECEDING?-1:i&B.FOLLOWING?1:0}),t}function vi(t){const e=bt(Ci,t);return e?e.name==="feed"?bi(e):yi(e):null}function bi(t){var e;const n=t.children,i={type:"atom",items:J("entry",n).map(r=>{var o;const{children:l}=r,u={media:qe(l)};R(u,"id","id",l),R(u,"title","title",l);const p=(o=bt("link",l))===null||o===void 0?void 0:o.attribs.href;p&&(u.link=p);const f=F("summary",l)||F("content",l);f&&(u.description=f);const g=F("updated",l);return g&&(u.pubDate=new Date(g)),u})};R(i,"id","id",n),R(i,"title","title",n);const a=(e=bt("link",n))===null||e===void 0?void 0:e.attribs.href;a&&(i.link=a),R(i,"description","subtitle",n);const s=F("updated",n);return s&&(i.updated=new Date(s)),R(i,"author","email",n,!0),i}function yi(t){var e,n;const i=(n=(e=bt("channel",t.children))===null||e===void 0?void 0:e.children)!==null&&n!==void 0?n:[],a={type:t.name.substr(0,3),id:"",items:J("item",t.children).map(r=>{const{children:o}=r,l={media:qe(o)};R(l,"id","guid",o),R(l,"title","title",o),R(l,"link","link",o),R(l,"description","description",o);const u=F("pubDate",o)||F("dc:date",o);return u&&(l.pubDate=new Date(u)),l})};R(a,"title","title",i),R(a,"link","link",i),R(a,"description","description",i);const s=F("lastBuildDate",i);return s&&(a.updated=new Date(s)),R(a,"author","managingEditor",i,!0),a}const Ei=["url","type","lang"],Ai=["fileSize","bitrate","framerate","samplingrate","channels","duration","height","width"];function qe(t){return J("media:content",t).map(e=>{const{attribs:n}=e,i={medium:n.medium,isDefault:!!n.isDefault};for(const a of Ei)n[a]&&(i[a]=n[a]);for(const a of Ai)n[a]&&(i[a]=parseInt(n[a],10));return n.expression&&(i.expression=n.expression),i})}function bt(t,e){return J(t,e,!0,1)[0]}function F(t,e,n=!1){return K(J(t,e,n,1)).trim()}function R(t,e,n,i,a=!1){const s=F(n,i,a);s&&(t[e]=s)}function Ci(t){return t==="rss"||t==="feed"||t==="rdf:RDF"}const Mt=Object.freeze(Object.defineProperty({__proto__:null,get DocumentPosition(){return B},append:si,appendChild:ai,compareDocumentPosition:Ve,existsOne:_e,filter:lt,find:Jt,findAll:li,findOne:Gt,findOneChild:ci,getAttributeValue:ti,getChildren:Tt,getElementById:hi,getElements:pi,getElementsByClassName:fi,getElementsByTagName:J,getElementsByTagType:gi,getFeed:vi,getInnerHTML:Gn,getName:ni,getOuterHTML:De,getParent:Fe,getSiblings:ze,getText:gt,hasAttrib:ei,hasChildren:M,innerText:mt,isCDATA:St,isComment:Zt,isDocument:Q,isTag:y,isText:V,nextElementSibling:Xt,prepend:oi,prependChild:ri,prevElementSibling:Qt,removeElement:q,removeSubsets:mi,replaceElement:ii,testElement:di,textContent:K,uniqueSort:G},Symbol.toStringTag,{value:"Module"}));function yt(t){const e=t??(this?this.root():[]);let n="";for(let i=0;i<e.length;i++)n+=K(e[i]);return n}function Li(t,e){if(e===t)return!1;let n=e;for(;n&&n!==n.parent;)if(n=n.parent,n===t)return!0;return!1}function tt(t){return t.cheerio!=null}function wi(t){return t.replace(/[._-](\w|$)/g,(e,n)=>n.toUpperCase())}function Si(t){return t.replace(/[A-Z]/g,"-$&").toLowerCase()}function S(t,e){const n=t.length;for(let i=0;i<n;i++)e(t[i],i);return t}var $;(function(t){t[t.LowerA=97]="LowerA",t[t.LowerZ=122]="LowerZ",t[t.UpperA=65]="UpperA",t[t.UpperZ=90]="UpperZ",t[t.Exclamation=33]="Exclamation"})($||($={}));function Ti(t){const e=t.indexOf("<");if(e===-1||e>t.length-3)return!1;const n=t.charCodeAt(e+1);return(n>=$.LowerA&&n<=$.LowerZ||n>=$.UpperA&&n<=$.UpperZ||n===$.Exclamation)&&t.includes(">",e+2)}var Ot;const ot=(Ot=Object.hasOwn)!==null&&Ot!==void 0?Ot:(t,e)=>Object.prototype.hasOwnProperty.call(t,e),ct=/\s+/,zt="data-",ee=/^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,Mi=/^{[^]*}$|^\[[^]*]$/;function Et(t,e,n){var i;if(!(!t||!y(t))){if((i=t.attribs)!==null&&i!==void 0||(t.attribs={}),!e)return t.attribs;if(ot(t.attribs,e))return!n&&ee.test(e)?e:t.attribs[e];if(t.name==="option"&&e==="value")return yt(t.children);if(t.name==="input"&&(t.attribs.type==="radio"||t.attribs.type==="checkbox")&&e==="value")return"on"}}function Z(t,e,n){n===null?We(t,e):t.attribs[e]=`${n}`}function xi(t,e){if(typeof t=="object"||e!==void 0){if(typeof e=="function"){if(typeof t!="string")throw new Error("Bad combination of arguments.");return S(this,(n,i)=>{y(n)&&Z(n,t,e.call(n,i,n.attribs[t]))})}return S(this,n=>{if(y(n))if(typeof t=="object")for(const i of Object.keys(t)){const a=t[i];Z(n,i,a)}else Z(n,t,e)})}return arguments.length>1?this:Et(this[0],t,this.options.xmlMode)}function fe(t,e,n){return e in t?t[e]:!n&&ee.test(e)?Et(t,e,!1)!==void 0:Et(t,e,n)}function Pt(t,e,n,i){e in t?t[e]=n:Z(t,e,!i&&ee.test(e)?n?"":null:`${n}`)}function Ii(t,e){var n;if(typeof t=="string"&&e===void 0){const i=this[0];if(!i)return;switch(t){case"style":{const a=this.css(),s=Object.keys(a);for(let r=0;r<s.length;r++)a[r]=s[r];return a.length=s.length,a}case"tagName":case"nodeName":return y(i)?i.name.toUpperCase():void 0;case"href":case"src":{if(!y(i))return;const a=(n=i.attribs)===null||n===void 0?void 0:n[t];return typeof URL<"u"&&(t==="href"&&(i.tagName==="a"||i.tagName==="link")||t==="src"&&(i.tagName==="img"||i.tagName==="iframe"||i.tagName==="audio"||i.tagName==="video"||i.tagName==="source"))&&a!==void 0&&this.options.baseURI?new URL(a,this.options.baseURI).href:a}case"innerText":return mt(i);case"textContent":return K(i);case"outerHTML":return i.type===Pe?this.html():this.clone().wrap("<container />").parent().html();case"innerHTML":return this.html();default:return y(i)?fe(i,t,this.options.xmlMode):void 0}}if(typeof t=="object"||e!==void 0){if(typeof e=="function"){if(typeof t=="object")throw new TypeError("Bad combination of arguments.");return S(this,(i,a)=>{y(i)&&Pt(i,t,e.call(i,a,fe(i,t,this.options.xmlMode)),this.options.xmlMode)})}return S(this,i=>{if(y(i))if(typeof t=="object")for(const a of Object.keys(t)){const s=t[a];Pt(i,a,s,this.options.xmlMode)}else Pt(i,t,e,this.options.xmlMode)})}}function ge(t,e,n){var i;(i=t.data)!==null&&i!==void 0||(t.data={}),typeof e=="object"?Object.assign(t.data,e):typeof e=="string"&&n!==void 0&&(t.data[e]=n)}function Ri(t){for(const e of Object.keys(t.attribs)){if(!e.startsWith(zt))continue;const n=wi(e.slice(zt.length));ot(t.data,n)||(t.data[n]=je(t.attribs[e]))}return t.data}function Oi(t,e){const n=zt+Si(e),i=t.data;if(ot(i,e))return i[e];if(ot(t.attribs,n))return i[e]=je(t.attribs[n])}function je(t){if(t==="null")return null;if(t==="true")return!0;if(t==="false")return!1;const e=Number(t);if(t===String(e))return e;if(Mi.test(t))try{return JSON.parse(t)}catch{}return t}function Pi(t,e){var n;const i=this[0];if(!i||!y(i))return;const a=i;return(n=a.data)!==null&&n!==void 0||(a.data={}),t==null?Ri(a):typeof t=="object"||e!==void 0?(S(this,s=>{y(s)&&(typeof t=="object"?ge(s,t):ge(s,t,e))}),this):Oi(a,t)}function Bi(t){const e=arguments.length===0,n=this[0];if(!n||!y(n))return e?void 0:this;switch(n.name){case"textarea":return this.text(t);case"select":{const i=this.find("option:selected");if(!e){if(this.attr("multiple")==null&&typeof t=="object")return this;this.find("option").removeAttr("selected");const a=typeof t=="object"?t:[t];for(const s of a)this.find(`option[value="${s}"]`).attr("selected","");return this}return this.attr("multiple")?i.toArray().map(a=>yt(a.children)):i.attr("value")}case"input":case"option":return e?this.attr("value"):this.attr("value",t)}}function We(t,e){!t.attribs||!ot(t.attribs,e)||delete t.attribs[e]}function At(t){return t?t.trim().split(ct):[]}function Ni(t){const e=At(t);for(const n of e)S(this,i=>{y(i)&&We(i,n)});return this}function Hi(t){return this.toArray().some(e=>{const n=y(e)&&e.attribs.class;let i=-1;if(n&&t.length>0)for(;(i=n.indexOf(t,i+1))>-1;){const a=i+t.length;if((i===0||ct.test(n[i-1]))&&(a===n.length||ct.test(n[a])))return!0}return!1})}function Ye(t){if(typeof t=="function")return S(this,(i,a)=>{if(y(i)){const s=i.attribs.class||"";Ye.call([i],t.call(i,a,s))}});if(!t||typeof t!="string")return this;const e=t.split(ct),n=this.length;for(let i=0;i<n;i++){const a=this[i];if(!y(a))continue;const s=Et(a,"class",!1);if(s){let r=` ${s} `;for(const o of e){const l=`${o} `;r.includes(` ${l}`)||(r+=l)}Z(a,"class",r.trim())}else Z(a,"class",e.join(" ").trim())}return this}function Ze(t){if(typeof t=="function")return S(this,(a,s)=>{y(a)&&Ze.call([a],t.call(a,s,a.attribs.class||""))});const e=At(t),n=e.length,i=arguments.length===0;return S(this,a=>{if(y(a))if(i)a.attribs.class="";else{const s=At(a.attribs.class);let r=!1;for(let o=0;o<n;o++){const l=s.indexOf(e[o]);l!==-1&&(s.splice(l,1),r=!0,o--)}r&&(a.attribs.class=s.join(" "))}})}function Ke(t,e){if(typeof t=="function")return S(this,(r,o)=>{y(r)&&Ke.call([r],t.call(r,o,r.attribs.class||"",e),e)});if(!t||typeof t!="string")return this;const n=t.split(ct),i=n.length,a=typeof e=="boolean"?e?1:-1:0,s=this.length;for(let r=0;r<s;r++){const o=this[r];if(!y(o))continue;const l=At(o.attribs.class);for(let u=0;u<i;u++){const p=l.indexOf(n[u]);a>=0&&p===-1?l.push(n[u]):a<=0&&p!==-1&&l.splice(p,1)}o.attribs.class=l.join(" ")}return this}const ki=Object.freeze(Object.defineProperty({__proto__:null,addClass:Ye,attr:xi,data:Pi,hasClass:Hi,prop:Ii,removeAttr:Ni,removeClass:Ze,toggleClass:Ke,val:Bi},Symbol.toStringTag,{value:"Module"}));var b;(function(t){t.Attribute="attribute",t.Pseudo="pseudo",t.PseudoElement="pseudo-element",t.Tag="tag",t.Universal="universal",t.Adjacent="adjacent",t.Child="child",t.Descendant="descendant",t.Parent="parent",t.Sibling="sibling",t.ColumnCombinator="column-combinator"})(b||(b={}));var I;(function(t){t.Any="any",t.Element="element",t.End="end",t.Equals="equals",t.Exists="exists",t.Hyphen="hyphen",t.Not="not",t.Start="start"})(I||(I={}));const me=/^[^\\#]?(?:\\(?:[\da-f]{1,6}\s?|.)|[\w\-\u00b0-\uFFFF])+/,Ui=/\\([\da-f]{1,6}\s?|(\s)|.)/gi,Di=new Map([[126,I.Element],[94,I.Start],[36,I.End],[42,I.Any],[33,I.Not],[124,I.Hyphen]]),Fi=new Set(["has","not","matches","is","where","host","host-context"]);function at(t){switch(t.type){case b.Adjacent:case b.Child:case b.Descendant:case b.Parent:case b.Sibling:case b.ColumnCombinator:return!0;default:return!1}}const zi=new Set(["contains","icontains"]);function _i(t,e,n){const i=parseInt(e,16)-65536;return i!==i||n?e:i<0?String.fromCharCode(i+65536):String.fromCharCode(i>>10|55296,i&1023|56320)}function it(t){return t.replace(Ui,_i)}function Bt(t){return t===39||t===34}function ve(t){return t===32||t===9||t===10||t===12||t===13}function xt(t){const e=[],n=Xe(e,`${t}`,0);if(n<t.length)throw new Error(`Unmatched selector: ${t.slice(n)}`);return e}function Xe(t,e,n){let i=[];function a(g){const v=e.slice(n+g).match(me);if(!v)throw new Error(`Expected name, found ${e.slice(n)}`);const[E]=v;return n+=g+E.length,it(E)}function s(g){for(n+=g;n<e.length&&ve(e.charCodeAt(n));)n++}function r(){n+=1;const g=n;let v=1;for(;v>0&&n<e.length;n++)e.charCodeAt(n)===40&&!o(n)?v++:e.charCodeAt(n)===41&&!o(n)&&v--;if(v)throw new Error("Parenthesis not matched");return it(e.slice(g,n-1))}function o(g){let v=0;for(;e.charCodeAt(--g)===92;)v++;return(v&1)===1}function l(){if(i.length>0&&at(i[i.length-1]))throw new Error("Did not expect successive traversals.")}function u(g){if(i.length>0&&i[i.length-1].type===b.Descendant){i[i.length-1].type=g;return}l(),i.push({type:g})}function p(g,v){i.push({type:b.Attribute,name:g,action:v,value:a(1),namespace:null,ignoreCase:"quirks"})}function f(){if(i.length&&i[i.length-1].type===b.Descendant&&i.pop(),i.length===0)throw new Error("Empty sub-selector");t.push(i)}if(s(0),e.length===n)return n;t:for(;n<e.length;){const g=e.charCodeAt(n);switch(g){case 32:case 9:case 10:case 12:case 13:{(i.length===0||i[0].type!==b.Descendant)&&(l(),i.push({type:b.Descendant})),s(1);break}case 62:{u(b.Child),s(1);break}case 60:{u(b.Parent),s(1);break}case 126:{u(b.Sibling),s(1);break}case 43:{u(b.Adjacent),s(1);break}case 46:{p("class",I.Element);break}case 35:{p("id",I.Equals);break}case 91:{s(1);let v,E=null;e.charCodeAt(n)===124?v=a(1):e.startsWith("*|",n)?(E="*",v=a(2)):(v=a(0),e.charCodeAt(n)===124&&e.charCodeAt(n+1)!==61&&(E=v,v=a(1))),s(0);let T=I.Exists;const P=Di.get(e.charCodeAt(n));if(P){if(T=P,e.charCodeAt(n+1)!==61)throw new Error("Expected `=`");s(2)}else e.charCodeAt(n)===61&&(T=I.Equals,s(1));let L="",k=null;if(T!=="exists"){if(Bt(e.charCodeAt(n))){const W=e.charCodeAt(n);let H=n+1;for(;H<e.length&&(e.charCodeAt(H)!==W||o(H));)H+=1;if(e.charCodeAt(H)!==W)throw new Error("Attribute value didn't end");L=it(e.slice(n+1,H)),n=H+1}else{const W=n;for(;n<e.length&&(!ve(e.charCodeAt(n))&&e.charCodeAt(n)!==93||o(n));)n+=1;L=it(e.slice(W,n))}s(0);const j=e.charCodeAt(n)|32;j===115?(k=!1,s(1)):j===105&&(k=!0,s(1))}if(e.charCodeAt(n)!==93)throw new Error("Attribute selector didn't terminate");n+=1;const nt={type:b.Attribute,name:v,action:T,value:L,namespace:E,ignoreCase:k};i.push(nt);break}case 58:{if(e.charCodeAt(n+1)===58){i.push({type:b.PseudoElement,name:a(2).toLowerCase(),data:e.charCodeAt(n)===40?r():null});continue}const v=a(1).toLowerCase();let E=null;if(e.charCodeAt(n)===40)if(Fi.has(v)){if(Bt(e.charCodeAt(n+1)))throw new Error(`Pseudo-selector ${v} cannot be quoted`);if(E=[],n=Xe(E,e,n+1),e.charCodeAt(n)!==41)throw new Error(`Missing closing parenthesis in :${v} (${e})`);n+=1}else{if(E=r(),zi.has(v)){const T=E.charCodeAt(0);T===E.charCodeAt(E.length-1)&&Bt(T)&&(E=E.slice(1,-1))}E=it(E)}i.push({type:b.Pseudo,name:v,data:E});break}case 44:{f(),i=[],s(1);break}default:{if(e.startsWith("/*",n)){const T=e.indexOf("*/",n+2);if(T<0)throw new Error("Comment was not terminated");n=T+2,i.length===0&&s(0);break}let v=null,E;if(g===42)n+=1,E="*";else if(g===124){if(E="",e.charCodeAt(n+1)===124){u(b.ColumnCombinator),s(2);break}}else if(me.test(e.slice(n)))E=a(0);else break t;e.charCodeAt(n)===124&&e.charCodeAt(n+1)!==124&&(v=E,e.charCodeAt(n+1)===42?(E="*",n+=2):E=a(1)),i.push(E==="*"?{type:b.Universal,namespace:v}:{type:b.Tag,name:E,namespace:v})}}}return f(),n}var Nt,be;function $i(){return be||(be=1,Nt={trueFunc:function(){return!0},falseFunc:function(){return!1}}),Nt}var Ct=$i();const C=Oe(Ct),Qe=new Map([[b.Universal,50],[b.Tag,30],[b.Attribute,1],[b.Pseudo,0]]);function ne(t){return!Qe.has(t.type)}const Vi=new Map([[I.Exists,10],[I.Equals,8],[I.Not,7],[I.Start,6],[I.End,6],[I.Any,5]]);function qi(t){const e=t.map(Je);for(let n=1;n<t.length;n++){const i=e[n];if(!(i<0))for(let a=n-1;a>=0&&i<e[a];a--){const s=t[a+1];t[a+1]=t[a],t[a]=s,e[a+1]=e[a],e[a]=i}}}function Je(t){var e,n;let i=(e=Qe.get(t.type))!==null&&e!==void 0?e:-1;return t.type===b.Attribute?(i=(n=Vi.get(t.action))!==null&&n!==void 0?n:4,t.action===I.Equals&&t.name==="id"&&(i=9),t.ignoreCase&&(i>>=1)):t.type===b.Pseudo&&(t.data?t.name==="has"||t.name==="contains"?i=0:Array.isArray(t.data)?(i=Math.min(...t.data.map(a=>Math.min(...a.map(Je)))),i<0&&(i=0)):i=2:i=3),i}const ji=/[-[\]{}()*+?.,\\^$|#\s]/g;function ye(t){return t.replace(ji,"\\$&")}const Wi=new Set(["accept","accept-charset","align","alink","axis","bgcolor","charset","checked","clear","codetype","color","compact","declare","defer","dir","direction","disabled","enctype","face","frame","hreflang","http-equiv","lang","language","link","media","method","multiple","nohref","noresize","noshade","nowrap","readonly","rel","rev","rules","scope","scrolling","selected","shape","target","text","type","valign","valuetype","vlink"]);function _(t,e){return typeof t.ignoreCase=="boolean"?t.ignoreCase:t.ignoreCase==="quirks"?!!e.quirksMode:!e.xmlMode&&Wi.has(t.name)}const Yi={equals(t,e,n){const{adapter:i}=n,{name:a}=e;let{value:s}=e;return _(e,n)?(s=s.toLowerCase(),r=>{const o=i.getAttributeValue(r,a);return o!=null&&o.length===s.length&&o.toLowerCase()===s&&t(r)}):r=>i.getAttributeValue(r,a)===s&&t(r)},hyphen(t,e,n){const{adapter:i}=n,{name:a}=e;let{value:s}=e;const r=s.length;return _(e,n)?(s=s.toLowerCase(),function(l){const u=i.getAttributeValue(l,a);return u!=null&&(u.length===r||u.charAt(r)==="-")&&u.substr(0,r).toLowerCase()===s&&t(l)}):function(l){const u=i.getAttributeValue(l,a);return u!=null&&(u.length===r||u.charAt(r)==="-")&&u.substr(0,r)===s&&t(l)}},element(t,e,n){const{adapter:i}=n,{name:a,value:s}=e;if(/\s/.test(s))return C.falseFunc;const r=new RegExp(`(?:^|\\s)${ye(s)}(?:$|\\s)`,_(e,n)?"i":"");return function(l){const u=i.getAttributeValue(l,a);return u!=null&&u.length>=s.length&&r.test(u)&&t(l)}},exists(t,{name:e},{adapter:n}){return i=>n.hasAttrib(i,e)&&t(i)},start(t,e,n){const{adapter:i}=n,{name:a}=e;let{value:s}=e;const r=s.length;return r===0?C.falseFunc:_(e,n)?(s=s.toLowerCase(),o=>{const l=i.getAttributeValue(o,a);return l!=null&&l.length>=r&&l.substr(0,r).toLowerCase()===s&&t(o)}):o=>{var l;return!!(!((l=i.getAttributeValue(o,a))===null||l===void 0)&&l.startsWith(s))&&t(o)}},end(t,e,n){const{adapter:i}=n,{name:a}=e;let{value:s}=e;const r=-s.length;return r===0?C.falseFunc:_(e,n)?(s=s.toLowerCase(),o=>{var l;return((l=i.getAttributeValue(o,a))===null||l===void 0?void 0:l.substr(r).toLowerCase())===s&&t(o)}):o=>{var l;return!!(!((l=i.getAttributeValue(o,a))===null||l===void 0)&&l.endsWith(s))&&t(o)}},any(t,e,n){const{adapter:i}=n,{name:a,value:s}=e;if(s==="")return C.falseFunc;if(_(e,n)){const r=new RegExp(ye(s),"i");return function(l){const u=i.getAttributeValue(l,a);return u!=null&&u.length>=s.length&&r.test(u)&&t(l)}}return r=>{var o;return!!(!((o=i.getAttributeValue(r,a))===null||o===void 0)&&o.includes(s))&&t(r)}},not(t,e,n){const{adapter:i}=n,{name:a}=e;let{value:s}=e;return s===""?r=>!!i.getAttributeValue(r,a)&&t(r):_(e,n)?(s=s.toLowerCase(),r=>{const o=i.getAttributeValue(r,a);return(o==null||o.length!==s.length||o.toLowerCase()!==s)&&t(r)}):r=>i.getAttributeValue(r,a)!==s&&t(r)}},Zi=new Set([9,10,12,13,32]),Ee=48,Ki=57;function Xi(t){if(t=t.trim().toLowerCase(),t==="even")return[2,0];if(t==="odd")return[2,1];let e=0,n=0,i=s(),a=r();if(e<t.length&&t.charAt(e)==="n"&&(e++,n=i*(a??1),o(),e<t.length?(i=s(),o(),a=r()):i=a=0),a===null||e<t.length)throw new Error(`n-th rule couldn't be parsed ('${t}')`);return[n,i*a];function s(){return t.charAt(e)==="-"?(e++,-1):(t.charAt(e)==="+"&&e++,1)}function r(){const l=e;let u=0;for(;e<t.length&&t.charCodeAt(e)>=Ee&&t.charCodeAt(e)<=Ki;)u=u*10+(t.charCodeAt(e)-Ee),e++;return e===l?null:u}function o(){for(;e<t.length&&Zi.has(t.charCodeAt(e));)e++}}function Qi(t){const e=t[0],n=t[1]-1;if(n<0&&e<=0)return C.falseFunc;if(e===-1)return s=>s<=n;if(e===0)return s=>s===n;if(e===1)return n<0?C.trueFunc:s=>s>=n;const i=Math.abs(e),a=(n%i+i)%i;return e>1?s=>s>=n&&s%i===a:s=>s<=n&&s%i===a}function ht(t){return Qi(Xi(t))}function ft(t,e){return n=>{const i=e.getParent(n);return i!=null&&e.isTag(i)&&t(n)}}const _t={contains(t,e,{adapter:n}){return function(a){return t(a)&&n.getText(a).includes(e)}},icontains(t,e,{adapter:n}){const i=e.toLowerCase();return function(s){return t(s)&&n.getText(s).toLowerCase().includes(i)}},"nth-child"(t,e,{adapter:n,equals:i}){const a=ht(e);return a===C.falseFunc?C.falseFunc:a===C.trueFunc?ft(t,n):function(r){const o=n.getSiblings(r);let l=0;for(let u=0;u<o.length&&!i(r,o[u]);u++)n.isTag(o[u])&&l++;return a(l)&&t(r)}},"nth-last-child"(t,e,{adapter:n,equals:i}){const a=ht(e);return a===C.falseFunc?C.falseFunc:a===C.trueFunc?ft(t,n):function(r){const o=n.getSiblings(r);let l=0;for(let u=o.length-1;u>=0&&!i(r,o[u]);u--)n.isTag(o[u])&&l++;return a(l)&&t(r)}},"nth-of-type"(t,e,{adapter:n,equals:i}){const a=ht(e);return a===C.falseFunc?C.falseFunc:a===C.trueFunc?ft(t,n):function(r){const o=n.getSiblings(r);let l=0;for(let u=0;u<o.length;u++){const p=o[u];if(i(r,p))break;n.isTag(p)&&n.getName(p)===n.getName(r)&&l++}return a(l)&&t(r)}},"nth-last-of-type"(t,e,{adapter:n,equals:i}){const a=ht(e);return a===C.falseFunc?C.falseFunc:a===C.trueFunc?ft(t,n):function(r){const o=n.getSiblings(r);let l=0;for(let u=o.length-1;u>=0;u--){const p=o[u];if(i(r,p))break;n.isTag(p)&&n.getName(p)===n.getName(r)&&l++}return a(l)&&t(r)}},root(t,e,{adapter:n}){return i=>{const a=n.getParent(i);return(a==null||!n.isTag(a))&&t(i)}},scope(t,e,n,i){const{equals:a}=n;return!i||i.length===0?_t.root(t,e,n):i.length===1?s=>a(i[0],s)&&t(s):s=>i.includes(s)&&t(s)},hover:Ht("isHovered"),visited:Ht("isVisited"),active:Ht("isActive")};function Ht(t){return function(n,i,{adapter:a}){const s=a[t];return typeof s!="function"?C.falseFunc:function(o){return s(o)&&n(o)}}}const Ae={empty(t,{adapter:e}){return!e.getChildren(t).some(n=>e.isTag(n)||e.getText(n)!=="")},"first-child"(t,{adapter:e,equals:n}){if(e.prevElementSibling)return e.prevElementSibling(t)==null;const i=e.getSiblings(t).find(a=>e.isTag(a));return i!=null&&n(t,i)},"last-child"(t,{adapter:e,equals:n}){const i=e.getSiblings(t);for(let a=i.length-1;a>=0;a--){if(n(t,i[a]))return!0;if(e.isTag(i[a]))break}return!1},"first-of-type"(t,{adapter:e,equals:n}){const i=e.getSiblings(t),a=e.getName(t);for(let s=0;s<i.length;s++){const r=i[s];if(n(t,r))return!0;if(e.isTag(r)&&e.getName(r)===a)break}return!1},"last-of-type"(t,{adapter:e,equals:n}){const i=e.getSiblings(t),a=e.getName(t);for(let s=i.length-1;s>=0;s--){const r=i[s];if(n(t,r))return!0;if(e.isTag(r)&&e.getName(r)===a)break}return!1},"only-of-type"(t,{adapter:e,equals:n}){const i=e.getName(t);return e.getSiblings(t).every(a=>n(t,a)||!e.isTag(a)||e.getName(a)!==i)},"only-child"(t,{adapter:e,equals:n}){return e.getSiblings(t).every(i=>n(t,i)||!e.isTag(i))}};function Ce(t,e,n,i){if(n===null){if(t.length>i)throw new Error(`Pseudo-class :${e} requires an argument`)}else if(t.length===i)throw new Error(`Pseudo-class :${e} doesn't have any arguments`)}const Ji={"any-link":":is(a, area, link)[href]",link:":any-link:not(:visited)",disabled:`:is(
        :is(button, input, select, textarea, optgroup, option)[disabled],
        optgroup[disabled] > option,
        fieldset[disabled]:not(fieldset[disabled] legend:first-of-type *)
    )`,enabled:":not(:disabled)",checked:":is(:is(input[type=radio], input[type=checkbox])[checked], option:selected)",required:":is(input, select, textarea)[required]",optional:":is(input, select, textarea):not([required])",selected:"option:is([selected], select:not([multiple]):not(:has(> option[selected])) > :first-of-type)",checkbox:"[type=checkbox]",file:"[type=file]",password:"[type=password]",radio:"[type=radio]",reset:"[type=reset]",image:"[type=image]",submit:"[type=submit]",parent:":not(:empty)",header:":is(h1, h2, h3, h4, h5, h6)",button:":is(button, input[type=button])",input:":is(input, textarea, select, button)",text:"input:is(:not([type!='']), [type=text])"},Ge={};function Gi(t,e){return t===C.falseFunc?C.falseFunc:n=>e.isTag(n)&&t(n)}function tn(t,e){const n=e.getSiblings(t);if(n.length<=1)return[];const i=n.indexOf(t);return i<0||i===n.length-1?[]:n.slice(i+1).filter(e.isTag)}function $t(t){return{xmlMode:!!t.xmlMode,lowerCaseAttributeNames:!!t.lowerCaseAttributeNames,lowerCaseTags:!!t.lowerCaseTags,quirksMode:!!t.quirksMode,cacheResults:!!t.cacheResults,pseudos:t.pseudos,adapter:t.adapter,equals:t.equals}}const kt=(t,e,n,i,a)=>{const s=a(e,$t(n),i);return s===C.trueFunc?t:s===C.falseFunc?C.falseFunc:r=>s(r)&&t(r)},Ut={is:kt,matches:kt,where:kt,not(t,e,n,i,a){const s=a(e,$t(n),i);return s===C.falseFunc?t:s===C.trueFunc?C.falseFunc:r=>!s(r)&&t(r)},has(t,e,n,i,a){const{adapter:s}=n,r=$t(n);r.relativeSelector=!0;const o=e.some(p=>p.some(ne))?[Ge]:void 0,l=a(e,r,o);if(l===C.falseFunc)return C.falseFunc;const u=Gi(l,s);if(o&&l!==C.trueFunc){const{shouldTestNextSiblings:p=!1}=l;return f=>{if(!t(f))return!1;o[0]=f;const g=s.getChildren(f),v=p?[...g,...tn(f,s)]:g;return s.existsOne(u,v)}}return p=>t(p)&&s.existsOne(u,s.getChildren(p))}};function ta(t,e,n,i,a){var s;const{name:r,data:o}=e;if(Array.isArray(o)){if(!(r in Ut))throw new Error(`Unknown pseudo-class :${r}(${o})`);return Ut[r](t,o,n,i,a)}const l=(s=n.pseudos)===null||s===void 0?void 0:s[r],u=typeof l=="string"?l:Ji[r];if(typeof u=="string"){if(o!=null)throw new Error(`Pseudo ${r} doesn't have any arguments`);const p=xt(u);return Ut.is(t,p,n,i,a)}if(typeof l=="function")return Ce(l,r,o,1),p=>l(p,o)&&t(p);if(r in _t)return _t[r](t,o,n,i);if(r in Ae){const p=Ae[r];return Ce(p,r,o,2),f=>p(f,n,o)&&t(f)}throw new Error(`Unknown pseudo-class :${r}`)}function Dt(t,e){const n=e.getParent(t);return n&&e.isTag(n)?n:null}function ea(t,e,n,i,a){const{adapter:s,equals:r}=n;switch(e.type){case b.PseudoElement:throw new Error("Pseudo-elements are not supported by css-select");case b.ColumnCombinator:throw new Error("Column combinators are not yet supported by css-select");case b.Attribute:{if(e.namespace!=null)throw new Error("Namespaced attributes are not yet supported by css-select");return(!n.xmlMode||n.lowerCaseAttributeNames)&&(e.name=e.name.toLowerCase()),Yi[e.action](t,e,n)}case b.Pseudo:return ta(t,e,n,i,a);case b.Tag:{if(e.namespace!=null)throw new Error("Namespaced tag names are not yet supported by css-select");let{name:o}=e;return(!n.xmlMode||n.lowerCaseTags)&&(o=o.toLowerCase()),function(u){return s.getName(u)===o&&t(u)}}case b.Descendant:{if(n.cacheResults===!1||typeof WeakSet>"u")return function(u){let p=u;for(;p=Dt(p,s);)if(t(p))return!0;return!1};const o=new WeakSet;return function(u){let p=u;for(;p=Dt(p,s);)if(!o.has(p)){if(s.isTag(p)&&t(p))return!0;o.add(p)}return!1}}case"_flexibleDescendant":return function(l){let u=l;do if(t(u))return!0;while(u=Dt(u,s));return!1};case b.Parent:return function(l){return s.getChildren(l).some(u=>s.isTag(u)&&t(u))};case b.Child:return function(l){const u=s.getParent(l);return u!=null&&s.isTag(u)&&t(u)};case b.Sibling:return function(l){const u=s.getSiblings(l);for(let p=0;p<u.length;p++){const f=u[p];if(r(l,f))break;if(s.isTag(f)&&t(f))return!0}return!1};case b.Adjacent:return s.prevElementSibling?function(l){const u=s.prevElementSibling(l);return u!=null&&t(u)}:function(l){const u=s.getSiblings(l);let p;for(let f=0;f<u.length;f++){const g=u[f];if(r(l,g))break;s.isTag(g)&&(p=g)}return!!p&&t(p)};case b.Universal:{if(e.namespace!=null&&e.namespace!=="*")throw new Error("Namespaced universal selectors are not yet supported by css-select");return t}}}function en(t){return t.type===b.Pseudo&&(t.name==="scope"||Array.isArray(t.data)&&t.data.some(e=>e.some(en)))}const na={type:b.Descendant},ia={type:"_flexibleDescendant"},aa={type:b.Pseudo,name:"scope",data:null};function sa(t,{adapter:e},n){const i=!!n?.every(a=>{const s=e.isTag(a)&&e.getParent(a);return a===Ge||s&&e.isTag(s)});for(const a of t){if(!(a.length>0&&ne(a[0])&&a[0].type!==b.Descendant))if(i&&!a.some(en))a.unshift(na);else continue;a.unshift(aa)}}function nn(t,e,n){var i;t.forEach(qi),n=(i=e.context)!==null&&i!==void 0?i:n;const a=Array.isArray(n),s=n&&(Array.isArray(n)?n:[n]);if(e.relativeSelector!==!1)sa(t,e,s);else if(t.some(l=>l.length>0&&ne(l[0])))throw new Error("Relative selectors are not allowed when the `relativeSelector` option is disabled");let r=!1;const o=t.map(l=>{if(l.length>=2){const[u,p]=l;u.type!==b.Pseudo||u.name!=="scope"||(a&&p.type===b.Descendant?l[1]=ia:(p.type===b.Adjacent||p.type===b.Sibling)&&(r=!0))}return ra(l,e,s)}).reduce(oa,C.falseFunc);return o.shouldTestNextSiblings=r,o}function ra(t,e,n){var i;return t.reduce((a,s)=>a===C.falseFunc?C.falseFunc:ea(a,s,e,n,nn),(i=e.rootFunc)!==null&&i!==void 0?i:C.trueFunc)}function oa(t,e){return e===C.falseFunc||t===C.trueFunc?t:t===C.falseFunc||e===C.trueFunc?e:function(i){return t(i)||e(i)}}const an=(t,e)=>t===e,ca={adapter:Mt,equals:an};function la(t){var e,n,i,a;const s=t??ca;return(e=s.adapter)!==null&&e!==void 0||(s.adapter=Mt),(n=s.equals)!==null&&n!==void 0||(s.equals=(a=(i=s.adapter)===null||i===void 0?void 0:i.equals)!==null&&a!==void 0?a:an),s}function ua(t){return function(n,i,a){const s=la(i);return t(n,s,a)}}const ie=ua(nn);function sn(t,e,n=!1){return n&&(t=da(t,e)),Array.isArray(t)?e.removeSubsets(t):e.getChildren(t)}function da(t,e){const n=Array.isArray(t)?t.slice(0):[t],i=n.length;for(let a=0;a<i;a++){const s=tn(n[a],e);n.push(...s)}return n}const pa=new Set(["first","last","eq","gt","nth","lt","even","odd"]);function Lt(t){return t.type!=="pseudo"?!1:pa.has(t.name)?!0:t.name==="not"&&Array.isArray(t.data)?t.data.some(e=>e.some(Lt)):!1}function ha(t,e,n){const i=e!=null?parseInt(e,10):NaN;switch(t){case"first":return 1;case"nth":case"eq":return isFinite(i)?i>=0?i+1:1/0:0;case"lt":return isFinite(i)?i>=0?Math.min(i,n):1/0:0;case"gt":return isFinite(i)?1/0:0;case"odd":return 2*n;case"even":return 2*n-1;case"last":case"not":return 1/0}}function fa(t){for(;t.parent;)t=t.parent;return t}function ae(t){const e=[],n=[];for(const i of t)i.some(Lt)?e.push(i):n.push(i);return[n,e]}const ga={type:b.Universal,namespace:null},ma={type:b.Pseudo,name:"scope",data:null};function rn(t,e,n={}){return on([t],e,n)}function on(t,e,n={}){if(typeof e=="function")return t.some(e);const[i,a]=ae(xt(e));return i.length>0&&t.some(ie(i,n))||a.some(s=>un(s,t,n).length>0)}function va(t,e,n,i){const a=typeof n=="string"?parseInt(n,10):NaN;switch(t){case"first":case"lt":return e;case"last":return e.length>0?[e[e.length-1]]:e;case"nth":case"eq":return isFinite(a)&&Math.abs(a)<e.length?[a<0?e[e.length+a]:e[a]]:[];case"gt":return isFinite(a)?e.slice(a+1):[];case"even":return e.filter((s,r)=>r%2===0);case"odd":return e.filter((s,r)=>r%2===1);case"not":{const s=new Set(ln(n,e,i));return e.filter(r=>!s.has(r))}}}function cn(t,e,n={}){return ln(xt(t),e,n)}function ln(t,e,n){if(e.length===0)return[];const[i,a]=ae(t);let s;if(i.length){const r=qt(e,i,n);if(a.length===0)return r;r.length&&(s=new Set(r))}for(let r=0;r<a.length&&s?.size!==e.length;r++){const o=a[r];if((s?e.filter(p=>y(p)&&!s.has(p)):e).length===0)break;const u=un(o,e,n);if(u.length)if(s)u.forEach(p=>s.add(p));else{if(r===a.length-1)return u;s=new Set(u)}}return typeof s<"u"?s.size===e.length?e:e.filter(r=>s.has(r)):[]}function un(t,e,n){var i;if(t.some(at)){const a=(i=n.root)!==null&&i!==void 0?i:fa(e[0]),s={...n,context:e,relativeSelector:!1};return t.push(ma),wt(a,t,s,!0,e.length)}return wt(e,t,n,!1,e.length)}function ba(t,e,n={},i=1/0){if(typeof t=="function")return dn(e,t);const[a,s]=ae(xt(t)),r=s.map(o=>wt(e,o,n,!0,i));return a.length&&r.push(Vt(e,a,n,i)),r.length===0?[]:r.length===1?r[0]:G(r.reduce((o,l)=>[...o,...l]))}function wt(t,e,n,i,a){const s=e.findIndex(Lt),r=e.slice(0,s),o=e[s],l=e.length-1===s?a:1/0,u=ha(o.name,o.data,l);if(u===0)return[];const f=(r.length===0&&!Array.isArray(t)?Tt(t).filter(y):r.length===0?(Array.isArray(t)?t:[t]).filter(y):i||r.some(at)?Vt(t,[r],n,u):qt(t,[r],n)).slice(0,u);let g=va(o.name,f,o.data,n);if(g.length===0||e.length===s+1)return g;const v=e.slice(s+1),E=v.some(at);if(E){if(at(v[0])){const{type:T}=v[0];(T===b.Sibling||T===b.Adjacent)&&(g=sn(g,Mt,!0)),v.unshift(ga)}n={...n,relativeSelector:!1,rootFunc:T=>g.includes(T)}}else n.rootFunc&&n.rootFunc!==Ct.trueFunc&&(n={...n,rootFunc:Ct.trueFunc});return v.some(Lt)?wt(g,v,n,!1,a):E?Vt(g,[v],n,a):qt(g,[v],n)}function Vt(t,e,n,i){const a=ie(e,n,t);return dn(t,a,i)}function dn(t,e,n=1/0){const i=sn(t,Mt,e.shouldTestNextSiblings);return Jt(a=>y(a)&&e(a),i,!0,n)}function qt(t,e,n){const i=(Array.isArray(t)?t:[t]).filter(y);if(i.length===0)return i;const a=ie(e,n);return a===Ct.trueFunc?i:i.filter(a)}const ya=/^\s*[+~]/;function Ea(t){if(!t)return this._make([]);if(typeof t!="string"){const e=tt(t)?t.toArray():[t],n=this.toArray();return this._make(e.filter(i=>n.some(a=>Li(a,i))))}return this._findBySelector(t,Number.POSITIVE_INFINITY)}function Aa(t,e){var n;const i=this.toArray(),a=ya.test(t)?i:this.children().toArray(),s={context:i,root:(n=this._root)===null||n===void 0?void 0:n[0],xmlMode:this.options.xmlMode,lowerCaseTags:this.options.lowerCaseTags,lowerCaseAttributeNames:this.options.lowerCaseAttributeNames,pseudos:this.options.pseudos,quirksMode:this.options.quirksMode};return this._make(ba(t,a,s,e))}function se(t){return function(e,...n){return function(i){var a;let s=t(e,this);return i&&(s=ce(s,i,this.options.xmlMode,(a=this._root)===null||a===void 0?void 0:a[0])),this._make(this.length>1&&s.length>1?n.reduce((r,o)=>o(r),s):s)}}}const ut=se((t,e)=>{let n=[];for(let i=0;i<e.length;i++){const a=t(e[i]);a.length>0&&(n=n.concat(a))}return n}),re=se((t,e)=>{const n=[];for(let i=0;i<e.length;i++){const a=t(e[i]);a!==null&&n.push(a)}return n});function oe(t,...e){let n=null;const i=se((a,s)=>{const r=[];return S(s,o=>{for(let l;(l=a(o))&&!n?.(l,r.length);o=l)r.push(l)}),r})(t,...e);return function(a,s){n=typeof a=="string"?o=>rn(o,a,this.options):a?dt(a):null;const r=i.call(this,s);return n=null,r}}function et(t){return t.length>1?Array.from(new Set(t)):t}const Ca=re(({parent:t})=>t&&!Q(t)?t:null,et),La=ut(t=>{const e=[];for(;t.parent&&!Q(t.parent);)e.push(t.parent),t=t.parent;return e},G,t=>t.reverse()),wa=oe(({parent:t})=>t&&!Q(t)?t:null,G,t=>t.reverse());function Sa(t){var e;const n=[];if(!t)return this._make(n);const i={xmlMode:this.options.xmlMode,root:(e=this._root)===null||e===void 0?void 0:e[0]},a=typeof t=="string"?s=>rn(s,t,i):dt(t);return S(this,s=>{for(s&&!Q(s)&&!y(s)&&(s=s.parent);s&&y(s);){if(a(s,0)){n.includes(s)||n.push(s);break}s=s.parent}}),this._make(n)}const Ta=re(t=>Xt(t)),Ma=ut(t=>{const e=[];for(;t.next;)t=t.next,y(t)&&e.push(t);return e},et),xa=oe(t=>Xt(t),et),Ia=re(t=>Qt(t)),Ra=ut(t=>{const e=[];for(;t.prev;)t=t.prev,y(t)&&e.push(t);return e},et),Oa=oe(t=>Qt(t),et),Pa=ut(t=>ze(t).filter(e=>y(e)&&e!==t),G),Ba=ut(t=>Tt(t).filter(y),et);function Na(){const t=this.toArray().reduce((e,n)=>M(n)?e.concat(n.children):e,[]);return this._make(t)}function Ha(t){let e=0;const n=this.length;for(;e<n&&t.call(this[e],e,this[e])!==!1;)++e;return this}function ka(t){let e=[];for(let n=0;n<this.length;n++){const i=this[n],a=t.call(i,n,i);a!=null&&(e=e.concat(a))}return this._make(e)}function dt(t){return typeof t=="function"?(e,n)=>t.call(e,n,e):tt(t)?e=>Array.prototype.includes.call(t,e):function(e){return t===e}}function Ua(t){var e;return this._make(ce(this.toArray(),t,this.options.xmlMode,(e=this._root)===null||e===void 0?void 0:e[0]))}function ce(t,e,n,i){return typeof e=="string"?cn(e,t,{xmlMode:n,root:i}):t.filter(dt(e))}function Da(t){const e=this.toArray();return typeof t=="string"?on(e.filter(y),t,this.options):t?e.some(dt(t)):!1}function Fa(t){let e=this.toArray();if(typeof t=="string"){const n=new Set(cn(t,e,this.options));e=e.filter(i=>!n.has(i))}else{const n=dt(t);e=e.filter((i,a)=>!n(i,a))}return this._make(e)}function za(t){return this.filter(typeof t=="string"?`:has(${t})`:(e,n)=>this._make(n).find(t).length>0)}function _a(){return this.length>1?this._make(this[0]):this}function $a(){return this.length>0?this._make(this[this.length-1]):this}function Va(t){var e;return t=+t,t===0&&this.length<=1?this:(t<0&&(t=this.length+t),this._make((e=this[t])!==null&&e!==void 0?e:[]))}function qa(t){return t==null?this.toArray():this[t<0?this.length+t:t]}function ja(){return Array.prototype.slice.call(this)}function Wa(t){let e,n;return t==null?(e=this.parent().children(),n=this[0]):typeof t=="string"?(e=this._make(t),n=this[0]):(e=this,n=tt(t)?t[0]:t),Array.prototype.indexOf.call(e,n)}function Ya(t,e){return this._make(Array.prototype.slice.call(this,t,e))}function Za(){var t;return(t=this.prevObject)!==null&&t!==void 0?t:this._make([])}function Ka(t,e){const n=this._make(t,e),i=G([...this.get(),...n.get()]);return this._make(i)}function Xa(t){return this.prevObject?this.add(t?this.prevObject.filter(t):this.prevObject):this}const Qa=Object.freeze(Object.defineProperty({__proto__:null,_findBySelector:Aa,add:Ka,addBack:Xa,children:Ba,closest:Sa,contents:Na,each:Ha,end:Za,eq:Va,filter:Ua,filterArray:ce,find:Ea,first:_a,get:qa,has:za,index:Wa,is:Da,last:$a,map:ka,next:Ta,nextAll:Ma,nextUntil:xa,not:Fa,parent:Ca,parents:La,parentsUntil:wa,prev:Ia,prevAll:Ra,prevUntil:Oa,siblings:Pa,slice:Ya,toArray:ja},Symbol.toStringTag,{value:"Module"}));function X(t,e){const n=Array.isArray(t)?t:[t];e?e.children=n:e=null;for(let i=0;i<n.length;i++){const a=n[i];a.parent&&a.parent.children!==n&&q(a),e?(a.prev=n[i-1]||null,a.next=n[i+1]||null):a.prev=a.next=null,a.parent=e}return e}function Ja(t,e){if(t==null)return[];if(typeof t=="string")return this._parse(t,this.options,!1,null).children.slice(0);if("length"in t){if(t.length===1)return this._makeDomArray(t[0],e);const n=[];for(let i=0;i<t.length;i++){const a=t[i];if(typeof a=="object"){if(a==null)continue;if(!("length"in a)){n.push(e?rt(a,!0):a);continue}}n.push(...this._makeDomArray(a,e))}return n}return[e?rt(t,!0):t]}function pn(t){return function(...e){const n=this.length-1;return S(this,(i,a)=>{if(!M(i))return;const s=typeof e[0]=="function"?e[0].call(i,a,this._render(i.children)):e,r=this._makeDomArray(s,a<n);t(r,i.children,i)})}}function z(t,e,n,i,a){var s,r;const o=[e,n,...i],l=e===0?null:t[e-1],u=e+n>=t.length?null:t[e+n];for(let p=0;p<i.length;++p){const f=i[p],g=f.parent;if(g){const E=g.children.indexOf(f);E!==-1&&(g.children.splice(E,1),a===g&&e>E&&o[0]--)}f.parent=a,f.prev&&(f.prev.next=(s=f.next)!==null&&s!==void 0?s:null),f.next&&(f.next.prev=(r=f.prev)!==null&&r!==void 0?r:null),f.prev=p===0?l:i[p-1],f.next=p===i.length-1?u:i[p+1]}return l&&(l.next=i[0]),u&&(u.prev=i[i.length-1]),t.splice(...o)}function Ga(t){return(tt(t)?t:this._make(t)).append(this),this}function ts(t){return(tt(t)?t:this._make(t)).prepend(this),this}const es=pn((t,e,n)=>{z(e,e.length,0,t,n)}),ns=pn((t,e,n)=>{z(e,0,0,t,n)});function hn(t){return function(e){const n=this.length-1,i=this.parents().last();for(let a=0;a<this.length;a++){const s=this[a],r=typeof e=="function"?e.call(s,a,s):typeof e=="string"&&!Ti(e)?i.find(e).clone():e,[o]=this._makeDomArray(r,a<n);if(!o||!M(o))continue;let l=o,u=0;for(;u<l.children.length;){const p=l.children[u];y(p)?(l=p,u=0):u++}t(s,l,[o])}return this}}const is=hn((t,e,n)=>{const{parent:i}=t;if(!i)return;const a=i.children,s=a.indexOf(t);X([t],e),z(a,s,0,n,i)}),as=hn((t,e,n)=>{M(t)&&(X(t.children,e),X(n,t))});function ss(t){return this.parent(t).not("body").each((e,n)=>{this._make(n).replaceWith(n.children)}),this}function rs(t){const e=this[0];if(e){const n=this._make(typeof t=="function"?t.call(e,0,e):t).insertBefore(e);let i;for(let s=0;s<n.length;s++)n[s].type===Ft&&(i=n[s]);let a=0;for(;i&&a<i.children.length;){const s=i.children[a];s.type===Ft?(i=s,a=0):a++}i&&this._make(i).append(this)}return this}function os(...t){const e=this.length-1;return S(this,(n,i)=>{if(!M(n)||!n.parent)return;const a=n.parent.children,s=a.indexOf(n);if(s===-1)return;const r=typeof t[0]=="function"?t[0].call(n,i,this._render(n.children)):t,o=this._makeDomArray(r,i<e);z(a,s+1,0,o,n.parent)})}function cs(t){typeof t=="string"&&(t=this._make(t)),this.remove();const e=[];for(const n of this._makeDomArray(t)){const i=this.clone().toArray(),{parent:a}=n;if(!a)continue;const s=a.children,r=s.indexOf(n);r!==-1&&(z(s,r+1,0,i,a),e.push(...i))}return this._make(e)}function ls(...t){const e=this.length-1;return S(this,(n,i)=>{if(!M(n)||!n.parent)return;const a=n.parent.children,s=a.indexOf(n);if(s===-1)return;const r=typeof t[0]=="function"?t[0].call(n,i,this._render(n.children)):t,o=this._makeDomArray(r,i<e);z(a,s,0,o,n.parent)})}function us(t){const e=this._make(t);this.remove();const n=[];return S(e,i=>{const a=this.clone().toArray(),{parent:s}=i;if(!s)return;const r=s.children,o=r.indexOf(i);o!==-1&&(z(r,o,0,a,s),n.push(...a))}),this._make(n)}function ds(t){const e=t?this.filter(t):this;return S(e,n=>{q(n),n.prev=n.next=n.parent=null}),this}function ps(t){return S(this,(e,n)=>{const{parent:i}=e;if(!i)return;const a=i.children,s=typeof t=="function"?t.call(e,n,e):t,r=this._makeDomArray(s);X(r,null);const o=a.indexOf(e);z(a,o,1,r,i),r.includes(e)||(e.parent=e.prev=e.next=null)})}function hs(){return S(this,t=>{if(M(t)){for(const e of t.children)e.next=e.prev=e.parent=null;t.children.length=0}})}function fs(t){if(t===void 0){const e=this[0];return!e||!M(e)?null:this._render(e.children)}return S(this,e=>{if(!M(e))return;for(const i of e.children)i.next=i.prev=i.parent=null;const n=tt(t)?t.toArray():this._parse(`${t}`,this.options,!1,e).children;X(n,e)})}function gs(){return this._render(this)}function ms(t){return t===void 0?yt(this):typeof t=="function"?S(this,(e,n)=>this._make(e).text(t.call(e,n,yt([e])))):S(this,e=>{if(!M(e))return;for(const i of e.children)i.next=i.prev=i.parent=null;const n=new Ne(`${t}`);X(n,e)})}function vs(){const t=Array.prototype.map.call(this.get(),n=>rt(n,!0)),e=new He(t);for(const n of t)n.parent=e;return this._make(t)}const bs=Object.freeze(Object.defineProperty({__proto__:null,_makeDomArray:Ja,after:os,append:es,appendTo:Ga,before:ls,clone:vs,empty:hs,html:fs,insertAfter:cs,insertBefore:us,prepend:ns,prependTo:ts,remove:ds,replaceWith:ps,text:ms,toString:gs,unwrap:ss,wrap:is,wrapAll:rs,wrapInner:as},Symbol.toStringTag,{value:"Module"}));function ys(t,e){if(t!=null&&e!=null||typeof t=="object"&&!Array.isArray(t))return S(this,(n,i)=>{y(n)&&fn(n,t,e,i)});if(this.length!==0)return gn(this[0],t)}function fn(t,e,n,i){if(typeof e=="string"){const a=gn(t),s=typeof n=="function"?n.call(t,i,a[e]):n;s===""?delete a[e]:s!=null&&(a[e]=s),t.attribs.style=Es(a)}else if(typeof e=="object"){const a=Object.keys(e);for(let s=0;s<a.length;s++){const r=a[s];fn(t,r,e[r],s)}}}function gn(t,e){if(!t||!y(t))return;const n=As(t.attribs.style);if(typeof e=="string")return n[e];if(Array.isArray(e)){const i={};for(const a of e)n[a]!=null&&(i[a]=n[a]);return i}return n}function Es(t){return Object.keys(t).reduce((e,n)=>`${e}${e?" ":""}${n}: ${t[n]};`,"")}function As(t){if(t=(t||"").trim(),!t)return{};const e={};let n;for(const i of t.split(";")){const a=i.indexOf(":");if(a<1||a===i.length-1){const s=i.trimEnd();s.length>0&&n!==void 0&&(e[n]+=`;${s}`)}else n=i.slice(0,a).trim(),e[n]=i.slice(a+1).trim()}return e}const Cs=Object.freeze(Object.defineProperty({__proto__:null,css:ys},Symbol.toStringTag,{value:"Module"})),Le="input,select,textarea,keygen",Ls=/%20/g,we=/\r?\n/g;function ws(){return this.serializeArray().map(n=>`${encodeURIComponent(n.name)}=${encodeURIComponent(n.value)}`).join("&").replace(Ls,"+")}function Ss(){return this.map((t,e)=>{const n=this._make(e);return y(e)&&e.name==="form"?n.find(Le).toArray():n.filter(Le).toArray()}).filter('[name!=""]:enabled:not(:submit, :button, :image, :reset, :file):matches([checked], :not(:checkbox, :radio))').map((t,e)=>{var n;const i=this._make(e),a=i.attr("name"),s=(n=i.val())!==null&&n!==void 0?n:"";return Array.isArray(s)?s.map(r=>({name:a,value:r.replace(we,`\r
`)})):{name:a,value:s.replace(we,`\r
`)}}).toArray()}const Ts=Object.freeze(Object.defineProperty({__proto__:null,serialize:ws,serializeArray:Ss},Symbol.toStringTag,{value:"Module"}));function Ms(t){var e;return typeof t=="string"?{selector:t,value:"textContent"}:{selector:t.selector,value:(e=t.value)!==null&&e!==void 0?e:"textContent"}}function xs(t){const e={};for(const n in t){const i=t[n],a=Array.isArray(i),{selector:s,value:r}=Ms(a?i[0]:i),o=typeof r=="function"?r:typeof r=="string"?l=>this._make(l).prop(r):l=>this._make(l).extract(r);if(a)e[n]=this._findBySelector(s,Number.POSITIVE_INFINITY).map((l,u)=>o(u,n,e)).get();else{const l=this._findBySelector(s,1);e[n]=l.length>0?o(l[0],n,e):void 0}}return e}const Is=Object.freeze(Object.defineProperty({__proto__:null,extract:xs},Symbol.toStringTag,{value:"Module"}));class It{constructor(e,n,i){if(this.length=0,this.options=i,this._root=n,e){for(let a=0;a<e.length;a++)this[a]=e[a];this.length=e.length}}}It.prototype.cheerio="[cheerio object]";It.prototype.splice=Array.prototype.splice;It.prototype[Symbol.iterator]=Array.prototype[Symbol.iterator];Object.assign(It.prototype,ki,Qa,bs,Cs,Ts,Is);var Se;(function(t){t[t.EOF=-1]="EOF",t[t.NULL=0]="NULL",t[t.TABULATION=9]="TABULATION",t[t.CARRIAGE_RETURN=13]="CARRIAGE_RETURN",t[t.LINE_FEED=10]="LINE_FEED",t[t.FORM_FEED=12]="FORM_FEED",t[t.SPACE=32]="SPACE",t[t.EXCLAMATION_MARK=33]="EXCLAMATION_MARK",t[t.QUOTATION_MARK=34]="QUOTATION_MARK",t[t.AMPERSAND=38]="AMPERSAND",t[t.APOSTROPHE=39]="APOSTROPHE",t[t.HYPHEN_MINUS=45]="HYPHEN_MINUS",t[t.SOLIDUS=47]="SOLIDUS",t[t.DIGIT_0=48]="DIGIT_0",t[t.DIGIT_9=57]="DIGIT_9",t[t.SEMICOLON=59]="SEMICOLON",t[t.LESS_THAN_SIGN=60]="LESS_THAN_SIGN",t[t.EQUALS_SIGN=61]="EQUALS_SIGN",t[t.GREATER_THAN_SIGN=62]="GREATER_THAN_SIGN",t[t.QUESTION_MARK=63]="QUESTION_MARK",t[t.LATIN_CAPITAL_A=65]="LATIN_CAPITAL_A",t[t.LATIN_CAPITAL_Z=90]="LATIN_CAPITAL_Z",t[t.RIGHT_SQUARE_BRACKET=93]="RIGHT_SQUARE_BRACKET",t[t.GRAVE_ACCENT=96]="GRAVE_ACCENT",t[t.LATIN_SMALL_A=97]="LATIN_SMALL_A",t[t.LATIN_SMALL_Z=122]="LATIN_SMALL_Z"})(Se||(Se={}));var Te;(function(t){t.controlCharacterInInputStream="control-character-in-input-stream",t.noncharacterInInputStream="noncharacter-in-input-stream",t.surrogateInInputStream="surrogate-in-input-stream",t.nonVoidHtmlElementStartTagWithTrailingSolidus="non-void-html-element-start-tag-with-trailing-solidus",t.endTagWithAttributes="end-tag-with-attributes",t.endTagWithTrailingSolidus="end-tag-with-trailing-solidus",t.unexpectedSolidusInTag="unexpected-solidus-in-tag",t.unexpectedNullCharacter="unexpected-null-character",t.unexpectedQuestionMarkInsteadOfTagName="unexpected-question-mark-instead-of-tag-name",t.invalidFirstCharacterOfTagName="invalid-first-character-of-tag-name",t.unexpectedEqualsSignBeforeAttributeName="unexpected-equals-sign-before-attribute-name",t.missingEndTagName="missing-end-tag-name",t.unexpectedCharacterInAttributeName="unexpected-character-in-attribute-name",t.unknownNamedCharacterReference="unknown-named-character-reference",t.missingSemicolonAfterCharacterReference="missing-semicolon-after-character-reference",t.unexpectedCharacterAfterDoctypeSystemIdentifier="unexpected-character-after-doctype-system-identifier",t.unexpectedCharacterInUnquotedAttributeValue="unexpected-character-in-unquoted-attribute-value",t.eofBeforeTagName="eof-before-tag-name",t.eofInTag="eof-in-tag",t.missingAttributeValue="missing-attribute-value",t.missingWhitespaceBetweenAttributes="missing-whitespace-between-attributes",t.missingWhitespaceAfterDoctypePublicKeyword="missing-whitespace-after-doctype-public-keyword",t.missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers="missing-whitespace-between-doctype-public-and-system-identifiers",t.missingWhitespaceAfterDoctypeSystemKeyword="missing-whitespace-after-doctype-system-keyword",t.missingQuoteBeforeDoctypePublicIdentifier="missing-quote-before-doctype-public-identifier",t.missingQuoteBeforeDoctypeSystemIdentifier="missing-quote-before-doctype-system-identifier",t.missingDoctypePublicIdentifier="missing-doctype-public-identifier",t.missingDoctypeSystemIdentifier="missing-doctype-system-identifier",t.abruptDoctypePublicIdentifier="abrupt-doctype-public-identifier",t.abruptDoctypeSystemIdentifier="abrupt-doctype-system-identifier",t.cdataInHtmlContent="cdata-in-html-content",t.incorrectlyOpenedComment="incorrectly-opened-comment",t.eofInScriptHtmlCommentLikeText="eof-in-script-html-comment-like-text",t.eofInDoctype="eof-in-doctype",t.nestedComment="nested-comment",t.abruptClosingOfEmptyComment="abrupt-closing-of-empty-comment",t.eofInComment="eof-in-comment",t.incorrectlyClosedComment="incorrectly-closed-comment",t.eofInCdata="eof-in-cdata",t.absenceOfDigitsInNumericCharacterReference="absence-of-digits-in-numeric-character-reference",t.nullCharacterReference="null-character-reference",t.surrogateCharacterReference="surrogate-character-reference",t.characterReferenceOutsideUnicodeRange="character-reference-outside-unicode-range",t.controlCharacterReference="control-character-reference",t.noncharacterCharacterReference="noncharacter-character-reference",t.missingWhitespaceBeforeDoctypeName="missing-whitespace-before-doctype-name",t.missingDoctypeName="missing-doctype-name",t.invalidCharacterSequenceAfterDoctypeName="invalid-character-sequence-after-doctype-name",t.duplicateAttribute="duplicate-attribute",t.nonConformingDoctype="non-conforming-doctype",t.missingDoctype="missing-doctype",t.misplacedDoctype="misplaced-doctype",t.endTagWithoutMatchingOpenElement="end-tag-without-matching-open-element",t.closingOfElementWithOpenChildElements="closing-of-element-with-open-child-elements",t.disallowedContentInNoscriptInHead="disallowed-content-in-noscript-in-head",t.openElementsLeftAfterEof="open-elements-left-after-eof",t.abandonedHeadElementChild="abandoned-head-element-child",t.misplacedStartTagForHeadElement="misplaced-start-tag-for-head-element",t.nestedNoscriptInHead="nested-noscript-in-head",t.eofInElementThatCanContainOnlyText="eof-in-element-that-can-contain-only-text"})(Te||(Te={}));var Me;(function(t){t[t.CHARACTER=0]="CHARACTER",t[t.NULL_CHARACTER=1]="NULL_CHARACTER",t[t.WHITESPACE_CHARACTER=2]="WHITESPACE_CHARACTER",t[t.START_TAG=3]="START_TAG",t[t.END_TAG=4]="END_TAG",t[t.COMMENT=5]="COMMENT",t[t.DOCTYPE=6]="DOCTYPE",t[t.EOF=7]="EOF",t[t.HIBERNATION=8]="HIBERNATION"})(Me||(Me={}));var x;(function(t){t.HTML="http://www.w3.org/1999/xhtml",t.MATHML="http://www.w3.org/1998/Math/MathML",t.SVG="http://www.w3.org/2000/svg",t.XLINK="http://www.w3.org/1999/xlink",t.XML="http://www.w3.org/XML/1998/namespace",t.XMLNS="http://www.w3.org/2000/xmlns/"})(x||(x={}));var xe;(function(t){t.TYPE="type",t.ACTION="action",t.ENCODING="encoding",t.PROMPT="prompt",t.NAME="name",t.COLOR="color",t.FACE="face",t.SIZE="size"})(xe||(xe={}));var Ie;(function(t){t.NO_QUIRKS="no-quirks",t.QUIRKS="quirks",t.LIMITED_QUIRKS="limited-quirks"})(Ie||(Ie={}));var d;(function(t){t.A="a",t.ADDRESS="address",t.ANNOTATION_XML="annotation-xml",t.APPLET="applet",t.AREA="area",t.ARTICLE="article",t.ASIDE="aside",t.B="b",t.BASE="base",t.BASEFONT="basefont",t.BGSOUND="bgsound",t.BIG="big",t.BLOCKQUOTE="blockquote",t.BODY="body",t.BR="br",t.BUTTON="button",t.CAPTION="caption",t.CENTER="center",t.CODE="code",t.COL="col",t.COLGROUP="colgroup",t.DD="dd",t.DESC="desc",t.DETAILS="details",t.DIALOG="dialog",t.DIR="dir",t.DIV="div",t.DL="dl",t.DT="dt",t.EM="em",t.EMBED="embed",t.FIELDSET="fieldset",t.FIGCAPTION="figcaption",t.FIGURE="figure",t.FONT="font",t.FOOTER="footer",t.FOREIGN_OBJECT="foreignObject",t.FORM="form",t.FRAME="frame",t.FRAMESET="frameset",t.H1="h1",t.H2="h2",t.H3="h3",t.H4="h4",t.H5="h5",t.H6="h6",t.HEAD="head",t.HEADER="header",t.HGROUP="hgroup",t.HR="hr",t.HTML="html",t.I="i",t.IMG="img",t.IMAGE="image",t.INPUT="input",t.IFRAME="iframe",t.KEYGEN="keygen",t.LABEL="label",t.LI="li",t.LINK="link",t.LISTING="listing",t.MAIN="main",t.MALIGNMARK="malignmark",t.MARQUEE="marquee",t.MATH="math",t.MENU="menu",t.META="meta",t.MGLYPH="mglyph",t.MI="mi",t.MO="mo",t.MN="mn",t.MS="ms",t.MTEXT="mtext",t.NAV="nav",t.NOBR="nobr",t.NOFRAMES="noframes",t.NOEMBED="noembed",t.NOSCRIPT="noscript",t.OBJECT="object",t.OL="ol",t.OPTGROUP="optgroup",t.OPTION="option",t.P="p",t.PARAM="param",t.PLAINTEXT="plaintext",t.PRE="pre",t.RB="rb",t.RP="rp",t.RT="rt",t.RTC="rtc",t.RUBY="ruby",t.S="s",t.SCRIPT="script",t.SEARCH="search",t.SECTION="section",t.SELECT="select",t.SOURCE="source",t.SMALL="small",t.SPAN="span",t.STRIKE="strike",t.STRONG="strong",t.STYLE="style",t.SUB="sub",t.SUMMARY="summary",t.SUP="sup",t.TABLE="table",t.TBODY="tbody",t.TEMPLATE="template",t.TEXTAREA="textarea",t.TFOOT="tfoot",t.TD="td",t.TH="th",t.THEAD="thead",t.TITLE="title",t.TR="tr",t.TRACK="track",t.TT="tt",t.U="u",t.UL="ul",t.SVG="svg",t.VAR="var",t.WBR="wbr",t.XMP="xmp"})(d||(d={}));var c;(function(t){t[t.UNKNOWN=0]="UNKNOWN",t[t.A=1]="A",t[t.ADDRESS=2]="ADDRESS",t[t.ANNOTATION_XML=3]="ANNOTATION_XML",t[t.APPLET=4]="APPLET",t[t.AREA=5]="AREA",t[t.ARTICLE=6]="ARTICLE",t[t.ASIDE=7]="ASIDE",t[t.B=8]="B",t[t.BASE=9]="BASE",t[t.BASEFONT=10]="BASEFONT",t[t.BGSOUND=11]="BGSOUND",t[t.BIG=12]="BIG",t[t.BLOCKQUOTE=13]="BLOCKQUOTE",t[t.BODY=14]="BODY",t[t.BR=15]="BR",t[t.BUTTON=16]="BUTTON",t[t.CAPTION=17]="CAPTION",t[t.CENTER=18]="CENTER",t[t.CODE=19]="CODE",t[t.COL=20]="COL",t[t.COLGROUP=21]="COLGROUP",t[t.DD=22]="DD",t[t.DESC=23]="DESC",t[t.DETAILS=24]="DETAILS",t[t.DIALOG=25]="DIALOG",t[t.DIR=26]="DIR",t[t.DIV=27]="DIV",t[t.DL=28]="DL",t[t.DT=29]="DT",t[t.EM=30]="EM",t[t.EMBED=31]="EMBED",t[t.FIELDSET=32]="FIELDSET",t[t.FIGCAPTION=33]="FIGCAPTION",t[t.FIGURE=34]="FIGURE",t[t.FONT=35]="FONT",t[t.FOOTER=36]="FOOTER",t[t.FOREIGN_OBJECT=37]="FOREIGN_OBJECT",t[t.FORM=38]="FORM",t[t.FRAME=39]="FRAME",t[t.FRAMESET=40]="FRAMESET",t[t.H1=41]="H1",t[t.H2=42]="H2",t[t.H3=43]="H3",t[t.H4=44]="H4",t[t.H5=45]="H5",t[t.H6=46]="H6",t[t.HEAD=47]="HEAD",t[t.HEADER=48]="HEADER",t[t.HGROUP=49]="HGROUP",t[t.HR=50]="HR",t[t.HTML=51]="HTML",t[t.I=52]="I",t[t.IMG=53]="IMG",t[t.IMAGE=54]="IMAGE",t[t.INPUT=55]="INPUT",t[t.IFRAME=56]="IFRAME",t[t.KEYGEN=57]="KEYGEN",t[t.LABEL=58]="LABEL",t[t.LI=59]="LI",t[t.LINK=60]="LINK",t[t.LISTING=61]="LISTING",t[t.MAIN=62]="MAIN",t[t.MALIGNMARK=63]="MALIGNMARK",t[t.MARQUEE=64]="MARQUEE",t[t.MATH=65]="MATH",t[t.MENU=66]="MENU",t[t.META=67]="META",t[t.MGLYPH=68]="MGLYPH",t[t.MI=69]="MI",t[t.MO=70]="MO",t[t.MN=71]="MN",t[t.MS=72]="MS",t[t.MTEXT=73]="MTEXT",t[t.NAV=74]="NAV",t[t.NOBR=75]="NOBR",t[t.NOFRAMES=76]="NOFRAMES",t[t.NOEMBED=77]="NOEMBED",t[t.NOSCRIPT=78]="NOSCRIPT",t[t.OBJECT=79]="OBJECT",t[t.OL=80]="OL",t[t.OPTGROUP=81]="OPTGROUP",t[t.OPTION=82]="OPTION",t[t.P=83]="P",t[t.PARAM=84]="PARAM",t[t.PLAINTEXT=85]="PLAINTEXT",t[t.PRE=86]="PRE",t[t.RB=87]="RB",t[t.RP=88]="RP",t[t.RT=89]="RT",t[t.RTC=90]="RTC",t[t.RUBY=91]="RUBY",t[t.S=92]="S",t[t.SCRIPT=93]="SCRIPT",t[t.SEARCH=94]="SEARCH",t[t.SECTION=95]="SECTION",t[t.SELECT=96]="SELECT",t[t.SOURCE=97]="SOURCE",t[t.SMALL=98]="SMALL",t[t.SPAN=99]="SPAN",t[t.STRIKE=100]="STRIKE",t[t.STRONG=101]="STRONG",t[t.STYLE=102]="STYLE",t[t.SUB=103]="SUB",t[t.SUMMARY=104]="SUMMARY",t[t.SUP=105]="SUP",t[t.TABLE=106]="TABLE",t[t.TBODY=107]="TBODY",t[t.TEMPLATE=108]="TEMPLATE",t[t.TEXTAREA=109]="TEXTAREA",t[t.TFOOT=110]="TFOOT",t[t.TD=111]="TD",t[t.TH=112]="TH",t[t.THEAD=113]="THEAD",t[t.TITLE=114]="TITLE",t[t.TR=115]="TR",t[t.TRACK=116]="TRACK",t[t.TT=117]="TT",t[t.U=118]="U",t[t.UL=119]="UL",t[t.SVG=120]="SVG",t[t.VAR=121]="VAR",t[t.WBR=122]="WBR",t[t.XMP=123]="XMP"})(c||(c={}));d.A,c.A,d.ADDRESS,c.ADDRESS,d.ANNOTATION_XML,c.ANNOTATION_XML,d.APPLET,c.APPLET,d.AREA,c.AREA,d.ARTICLE,c.ARTICLE,d.ASIDE,c.ASIDE,d.B,c.B,d.BASE,c.BASE,d.BASEFONT,c.BASEFONT,d.BGSOUND,c.BGSOUND,d.BIG,c.BIG,d.BLOCKQUOTE,c.BLOCKQUOTE,d.BODY,c.BODY,d.BR,c.BR,d.BUTTON,c.BUTTON,d.CAPTION,c.CAPTION,d.CENTER,c.CENTER,d.CODE,c.CODE,d.COL,c.COL,d.COLGROUP,c.COLGROUP,d.DD,c.DD,d.DESC,c.DESC,d.DETAILS,c.DETAILS,d.DIALOG,c.DIALOG,d.DIR,c.DIR,d.DIV,c.DIV,d.DL,c.DL,d.DT,c.DT,d.EM,c.EM,d.EMBED,c.EMBED,d.FIELDSET,c.FIELDSET,d.FIGCAPTION,c.FIGCAPTION,d.FIGURE,c.FIGURE,d.FONT,c.FONT,d.FOOTER,c.FOOTER,d.FOREIGN_OBJECT,c.FOREIGN_OBJECT,d.FORM,c.FORM,d.FRAME,c.FRAME,d.FRAMESET,c.FRAMESET,d.H1,c.H1,d.H2,c.H2,d.H3,c.H3,d.H4,c.H4,d.H5,c.H5,d.H6,c.H6,d.HEAD,c.HEAD,d.HEADER,c.HEADER,d.HGROUP,c.HGROUP,d.HR,c.HR,d.HTML,c.HTML,d.I,c.I,d.IMG,c.IMG,d.IMAGE,c.IMAGE,d.INPUT,c.INPUT,d.IFRAME,c.IFRAME,d.KEYGEN,c.KEYGEN,d.LABEL,c.LABEL,d.LI,c.LI,d.LINK,c.LINK,d.LISTING,c.LISTING,d.MAIN,c.MAIN,d.MALIGNMARK,c.MALIGNMARK,d.MARQUEE,c.MARQUEE,d.MATH,c.MATH,d.MENU,c.MENU,d.META,c.META,d.MGLYPH,c.MGLYPH,d.MI,c.MI,d.MO,c.MO,d.MN,c.MN,d.MS,c.MS,d.MTEXT,c.MTEXT,d.NAV,c.NAV,d.NOBR,c.NOBR,d.NOFRAMES,c.NOFRAMES,d.NOEMBED,c.NOEMBED,d.NOSCRIPT,c.NOSCRIPT,d.OBJECT,c.OBJECT,d.OL,c.OL,d.OPTGROUP,c.OPTGROUP,d.OPTION,c.OPTION,d.P,c.P,d.PARAM,c.PARAM,d.PLAINTEXT,c.PLAINTEXT,d.PRE,c.PRE,d.RB,c.RB,d.RP,c.RP,d.RT,c.RT,d.RTC,c.RTC,d.RUBY,c.RUBY,d.S,c.S,d.SCRIPT,c.SCRIPT,d.SEARCH,c.SEARCH,d.SECTION,c.SECTION,d.SELECT,c.SELECT,d.SOURCE,c.SOURCE,d.SMALL,c.SMALL,d.SPAN,c.SPAN,d.STRIKE,c.STRIKE,d.STRONG,c.STRONG,d.STYLE,c.STYLE,d.SUB,c.SUB,d.SUMMARY,c.SUMMARY,d.SUP,c.SUP,d.TABLE,c.TABLE,d.TBODY,c.TBODY,d.TEMPLATE,c.TEMPLATE,d.TEXTAREA,c.TEXTAREA,d.TFOOT,c.TFOOT,d.TD,c.TD,d.TH,c.TH,d.THEAD,c.THEAD,d.TITLE,c.TITLE,d.TR,c.TR,d.TRACK,c.TRACK,d.TT,c.TT,d.U,c.U,d.UL,c.UL,d.SVG,c.SVG,d.VAR,c.VAR,d.WBR,c.WBR,d.XMP,c.XMP;const h=c;x.HTML+"",h.ADDRESS,h.APPLET,h.AREA,h.ARTICLE,h.ASIDE,h.BASE,h.BASEFONT,h.BGSOUND,h.BLOCKQUOTE,h.BODY,h.BR,h.BUTTON,h.CAPTION,h.CENTER,h.COL,h.COLGROUP,h.DD,h.DETAILS,h.DIR,h.DIV,h.DL,h.DT,h.EMBED,h.FIELDSET,h.FIGCAPTION,h.FIGURE,h.FOOTER,h.FORM,h.FRAME,h.FRAMESET,h.H1,h.H2,h.H3,h.H4,h.H5,h.H6,h.HEAD,h.HEADER,h.HGROUP,h.HR,h.HTML,h.IFRAME,h.IMG,h.INPUT,h.LI,h.LINK,h.LISTING,h.MAIN,h.MARQUEE,h.MENU,h.META,h.NAV,h.NOEMBED,h.NOFRAMES,h.NOSCRIPT,h.OBJECT,h.OL,h.P,h.PARAM,h.PLAINTEXT,h.PRE,h.SCRIPT,h.SECTION,h.SELECT,h.SOURCE,h.STYLE,h.SUMMARY,h.TABLE,h.TBODY,h.TD,h.TEMPLATE,h.TEXTAREA,h.TFOOT,h.TH,h.THEAD,h.TITLE,h.TR,h.TRACK,h.UL,h.WBR,h.XMP,x.MATHML+"",h.MI,h.MO,h.MN,h.MS,h.MTEXT,h.ANNOTATION_XML,x.SVG+"",h.TITLE,h.FOREIGN_OBJECT,h.DESC,x.XLINK+"",x.XML+"",x.XMLNS+"";h.H1,h.H2,h.H3,h.H4,h.H5,h.H6;d.STYLE,d.SCRIPT,d.XMP,d.IFRAME,d.NOEMBED,d.NOFRAMES,d.PLAINTEXT;var U;(function(t){t[t.DATA=0]="DATA",t[t.RCDATA=1]="RCDATA",t[t.RAWTEXT=2]="RAWTEXT",t[t.SCRIPT_DATA=3]="SCRIPT_DATA",t[t.PLAINTEXT=4]="PLAINTEXT",t[t.TAG_OPEN=5]="TAG_OPEN",t[t.END_TAG_OPEN=6]="END_TAG_OPEN",t[t.TAG_NAME=7]="TAG_NAME",t[t.RCDATA_LESS_THAN_SIGN=8]="RCDATA_LESS_THAN_SIGN",t[t.RCDATA_END_TAG_OPEN=9]="RCDATA_END_TAG_OPEN",t[t.RCDATA_END_TAG_NAME=10]="RCDATA_END_TAG_NAME",t[t.RAWTEXT_LESS_THAN_SIGN=11]="RAWTEXT_LESS_THAN_SIGN",t[t.RAWTEXT_END_TAG_OPEN=12]="RAWTEXT_END_TAG_OPEN",t[t.RAWTEXT_END_TAG_NAME=13]="RAWTEXT_END_TAG_NAME",t[t.SCRIPT_DATA_LESS_THAN_SIGN=14]="SCRIPT_DATA_LESS_THAN_SIGN",t[t.SCRIPT_DATA_END_TAG_OPEN=15]="SCRIPT_DATA_END_TAG_OPEN",t[t.SCRIPT_DATA_END_TAG_NAME=16]="SCRIPT_DATA_END_TAG_NAME",t[t.SCRIPT_DATA_ESCAPE_START=17]="SCRIPT_DATA_ESCAPE_START",t[t.SCRIPT_DATA_ESCAPE_START_DASH=18]="SCRIPT_DATA_ESCAPE_START_DASH",t[t.SCRIPT_DATA_ESCAPED=19]="SCRIPT_DATA_ESCAPED",t[t.SCRIPT_DATA_ESCAPED_DASH=20]="SCRIPT_DATA_ESCAPED_DASH",t[t.SCRIPT_DATA_ESCAPED_DASH_DASH=21]="SCRIPT_DATA_ESCAPED_DASH_DASH",t[t.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN=22]="SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN",t[t.SCRIPT_DATA_ESCAPED_END_TAG_OPEN=23]="SCRIPT_DATA_ESCAPED_END_TAG_OPEN",t[t.SCRIPT_DATA_ESCAPED_END_TAG_NAME=24]="SCRIPT_DATA_ESCAPED_END_TAG_NAME",t[t.SCRIPT_DATA_DOUBLE_ESCAPE_START=25]="SCRIPT_DATA_DOUBLE_ESCAPE_START",t[t.SCRIPT_DATA_DOUBLE_ESCAPED=26]="SCRIPT_DATA_DOUBLE_ESCAPED",t[t.SCRIPT_DATA_DOUBLE_ESCAPED_DASH=27]="SCRIPT_DATA_DOUBLE_ESCAPED_DASH",t[t.SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH=28]="SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH",t[t.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN=29]="SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN",t[t.SCRIPT_DATA_DOUBLE_ESCAPE_END=30]="SCRIPT_DATA_DOUBLE_ESCAPE_END",t[t.BEFORE_ATTRIBUTE_NAME=31]="BEFORE_ATTRIBUTE_NAME",t[t.ATTRIBUTE_NAME=32]="ATTRIBUTE_NAME",t[t.AFTER_ATTRIBUTE_NAME=33]="AFTER_ATTRIBUTE_NAME",t[t.BEFORE_ATTRIBUTE_VALUE=34]="BEFORE_ATTRIBUTE_VALUE",t[t.ATTRIBUTE_VALUE_DOUBLE_QUOTED=35]="ATTRIBUTE_VALUE_DOUBLE_QUOTED",t[t.ATTRIBUTE_VALUE_SINGLE_QUOTED=36]="ATTRIBUTE_VALUE_SINGLE_QUOTED",t[t.ATTRIBUTE_VALUE_UNQUOTED=37]="ATTRIBUTE_VALUE_UNQUOTED",t[t.AFTER_ATTRIBUTE_VALUE_QUOTED=38]="AFTER_ATTRIBUTE_VALUE_QUOTED",t[t.SELF_CLOSING_START_TAG=39]="SELF_CLOSING_START_TAG",t[t.BOGUS_COMMENT=40]="BOGUS_COMMENT",t[t.MARKUP_DECLARATION_OPEN=41]="MARKUP_DECLARATION_OPEN",t[t.COMMENT_START=42]="COMMENT_START",t[t.COMMENT_START_DASH=43]="COMMENT_START_DASH",t[t.COMMENT=44]="COMMENT",t[t.COMMENT_LESS_THAN_SIGN=45]="COMMENT_LESS_THAN_SIGN",t[t.COMMENT_LESS_THAN_SIGN_BANG=46]="COMMENT_LESS_THAN_SIGN_BANG",t[t.COMMENT_LESS_THAN_SIGN_BANG_DASH=47]="COMMENT_LESS_THAN_SIGN_BANG_DASH",t[t.COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH=48]="COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH",t[t.COMMENT_END_DASH=49]="COMMENT_END_DASH",t[t.COMMENT_END=50]="COMMENT_END",t[t.COMMENT_END_BANG=51]="COMMENT_END_BANG",t[t.DOCTYPE=52]="DOCTYPE",t[t.BEFORE_DOCTYPE_NAME=53]="BEFORE_DOCTYPE_NAME",t[t.DOCTYPE_NAME=54]="DOCTYPE_NAME",t[t.AFTER_DOCTYPE_NAME=55]="AFTER_DOCTYPE_NAME",t[t.AFTER_DOCTYPE_PUBLIC_KEYWORD=56]="AFTER_DOCTYPE_PUBLIC_KEYWORD",t[t.BEFORE_DOCTYPE_PUBLIC_IDENTIFIER=57]="BEFORE_DOCTYPE_PUBLIC_IDENTIFIER",t[t.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED=58]="DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED",t[t.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED=59]="DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED",t[t.AFTER_DOCTYPE_PUBLIC_IDENTIFIER=60]="AFTER_DOCTYPE_PUBLIC_IDENTIFIER",t[t.BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS=61]="BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS",t[t.AFTER_DOCTYPE_SYSTEM_KEYWORD=62]="AFTER_DOCTYPE_SYSTEM_KEYWORD",t[t.BEFORE_DOCTYPE_SYSTEM_IDENTIFIER=63]="BEFORE_DOCTYPE_SYSTEM_IDENTIFIER",t[t.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED=64]="DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED",t[t.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED=65]="DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED",t[t.AFTER_DOCTYPE_SYSTEM_IDENTIFIER=66]="AFTER_DOCTYPE_SYSTEM_IDENTIFIER",t[t.BOGUS_DOCTYPE=67]="BOGUS_DOCTYPE",t[t.CDATA_SECTION=68]="CDATA_SECTION",t[t.CDATA_SECTION_BRACKET=69]="CDATA_SECTION_BRACKET",t[t.CDATA_SECTION_END=70]="CDATA_SECTION_END",t[t.CHARACTER_REFERENCE=71]="CHARACTER_REFERENCE",t[t.AMBIGUOUS_AMPERSAND=72]="AMBIGUOUS_AMPERSAND"})(U||(U={}));U.DATA,U.RCDATA,U.RAWTEXT,U.SCRIPT_DATA,U.PLAINTEXT,U.CDATA_SECTION;const Rs=new Set([c.DD,c.DT,c.LI,c.OPTGROUP,c.OPTION,c.P,c.RB,c.RP,c.RT,c.RTC]);[...Rs,c.CAPTION,c.COLGROUP,c.TBODY,c.TD,c.TFOOT,c.TH,c.THEAD,c.TR];const mn=new Set([c.APPLET,c.CAPTION,c.HTML,c.MARQUEE,c.OBJECT,c.TABLE,c.TD,c.TEMPLATE,c.TH]);[...mn,c.OL,c.UL];[...mn,c.BUTTON];c.ANNOTATION_XML,c.MI,c.MN,c.MO,c.MS,c.MTEXT;c.DESC,c.FOREIGN_OBJECT,c.TITLE;c.TR,c.TEMPLATE,c.HTML;c.TBODY,c.TFOOT,c.THEAD,c.TEMPLATE,c.HTML;c.TABLE,c.TEMPLATE,c.HTML;c.TD,c.TH;var jt;(function(t){t[t.Marker=0]="Marker",t[t.Element=1]="Element"})(jt||(jt={}));jt.Marker;new Map(["attributeName","attributeType","baseFrequency","baseProfile","calcMode","clipPathUnits","diffuseConstant","edgeMode","filterUnits","glyphRef","gradientTransform","gradientUnits","kernelMatrix","kernelUnitLength","keyPoints","keySplines","keyTimes","lengthAdjust","limitingConeAngle","markerHeight","markerUnits","markerWidth","maskContentUnits","maskUnits","numOctaves","pathLength","patternContentUnits","patternTransform","patternUnits","pointsAtX","pointsAtY","pointsAtZ","preserveAlpha","preserveAspectRatio","primitiveUnits","refX","refY","repeatCount","repeatDur","requiredExtensions","requiredFeatures","specularConstant","specularExponent","spreadMethod","startOffset","stdDeviation","stitchTiles","surfaceScale","systemLanguage","tableValues","targetX","targetY","textLength","viewBox","viewTarget","xChannelSelector","yChannelSelector","zoomAndPan"].map(t=>[t.toLowerCase(),t]));x.XLINK,x.XLINK,x.XLINK,x.XLINK,x.XLINK,x.XLINK,x.XLINK,x.XML,x.XML,x.XMLNS,x.XMLNS;new Map(["altGlyph","altGlyphDef","altGlyphItem","animateColor","animateMotion","animateTransform","clipPath","feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feDistantLight","feFlood","feFuncA","feFuncB","feFuncG","feFuncR","feGaussianBlur","feImage","feMerge","feMergeNode","feMorphology","feOffset","fePointLight","feSpecularLighting","feSpotLight","feTile","feTurbulence","foreignObject","glyphRef","linearGradient","radialGradient","textPath"].map(t=>[t.toLowerCase(),t]));c.B,c.BIG,c.BLOCKQUOTE,c.BODY,c.BR,c.CENTER,c.CODE,c.DD,c.DIV,c.DL,c.DT,c.EM,c.EMBED,c.H1,c.H2,c.H3,c.H4,c.H5,c.H6,c.HEAD,c.HR,c.I,c.IMG,c.LI,c.LISTING,c.MENU,c.META,c.NOBR,c.OL,c.P,c.PRE,c.RUBY,c.S,c.SMALL,c.SPAN,c.STRONG,c.STRIKE,c.SUB,c.SUP,c.TABLE,c.TT,c.U,c.UL,c.VAR;var Re;(function(t){t[t.INITIAL=0]="INITIAL",t[t.BEFORE_HTML=1]="BEFORE_HTML",t[t.BEFORE_HEAD=2]="BEFORE_HEAD",t[t.IN_HEAD=3]="IN_HEAD",t[t.IN_HEAD_NO_SCRIPT=4]="IN_HEAD_NO_SCRIPT",t[t.AFTER_HEAD=5]="AFTER_HEAD",t[t.IN_BODY=6]="IN_BODY",t[t.TEXT=7]="TEXT",t[t.IN_TABLE=8]="IN_TABLE",t[t.IN_TABLE_TEXT=9]="IN_TABLE_TEXT",t[t.IN_CAPTION=10]="IN_CAPTION",t[t.IN_COLUMN_GROUP=11]="IN_COLUMN_GROUP",t[t.IN_TABLE_BODY=12]="IN_TABLE_BODY",t[t.IN_ROW=13]="IN_ROW",t[t.IN_CELL=14]="IN_CELL",t[t.IN_SELECT=15]="IN_SELECT",t[t.IN_SELECT_IN_TABLE=16]="IN_SELECT_IN_TABLE",t[t.IN_TEMPLATE=17]="IN_TEMPLATE",t[t.AFTER_BODY=18]="AFTER_BODY",t[t.IN_FRAMESET=19]="IN_FRAMESET",t[t.AFTER_FRAMESET=20]="AFTER_FRAMESET",t[t.AFTER_AFTER_BODY=21]="AFTER_AFTER_BODY",t[t.AFTER_AFTER_FRAMESET=22]="AFTER_AFTER_FRAMESET"})(Re||(Re={}));c.TABLE,c.TBODY,c.TFOOT,c.THEAD,c.TR;c.CAPTION,c.COL,c.COLGROUP,c.TBODY,c.TD,c.TFOOT,c.TH,c.THEAD,c.TR;d.AREA,d.BASE,d.BASEFONT,d.BGSOUND,d.BR,d.COL,d.EMBED,d.FRAME,d.HR,d.IMG,d.INPUT,d.KEYGEN,d.LINK,d.META,d.PARAM,d.SOURCE,d.TRACK,d.WBR;class Os{constructor(){this.proxies=["https://api.allorigins.win/raw?url=","https://cors-anywhere.herokuapp.com/","https://thingproxy.freeboard.io/fetch/","https://cors.bridged.cc/","https://api.codetabs.com/v1/proxy?quest=","https://corsproxy.io/?","https://cors-anywhere.1d4s.me/","https://cors-anywhere.herokuapp.com/"],this.currentProxyIndex=0}async fetchWithFallback(e,n={}){return this.fetchWithProxy(e)}async fetchWithProxy(e){let n=null;for(let i=0;i<this.proxies.length;i++){const a=(this.currentProxyIndex+i)%this.proxies.length,s=this.proxies[a];try{const r=await fetch(s+encodeURIComponent(e),{method:"GET",headers:{Accept:"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8","Accept-Language":"en-US,en;q=0.5","Accept-Encoding":"gzip, deflate",DNT:"1",Connection:"keep-alive","Upgrade-Insecure-Requests":"1","User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"},timeout:1e4});if(r.ok){const o=await r.text();if(o.includes("<html")||o.includes("<head")||o.includes("<body"))return this.currentProxyIndex=a,o}}catch(r){console.log(`Proxy ${a} fallito:`,r.message),n=r}}try{const i=await fetch(e,{method:"GET",headers:{Accept:"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8","User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}});if(i.ok)return await i.text()}catch(i){console.log("Anche l'approccio diretto è fallito:",i)}throw n||new Error("Impossibile recuperare il contenuto")}async extractMetadata(e){try{const n=localStorage.getItem("aideas-language")||"it",i=await fetch(`http://localhost:4000/extract?url=${encodeURIComponent(e)}&lang=${n}`);if(!i.ok)throw new Error("Proxy meta fallito");return await i.json()}catch{const i=new URL(e).hostname;return{title:i,description:`App web da ${i}`,icon:`https://www.google.com/s2/favicons?domain=${i}&sz=64`}}}extractBestIcon(e,n){const i=['link[rel="apple-touch-icon"][sizes="180x180"]','link[rel="apple-touch-icon"][sizes="152x152"]','link[rel="apple-touch-icon"][sizes="144x144"]','link[rel="apple-touch-icon"][sizes="120x120"]','link[rel="apple-touch-icon"]','link[rel="icon"][type="image/png"][sizes="32x32"]','link[rel="icon"][type="image/png"][sizes="16x16"]','link[rel="icon"][type="image/svg+xml"]','link[rel="shortcut icon"]','link[rel="icon"]'];for(const a of i){const s=e(a).attr("href");if(s)return new URL(s,n).href}return null}extractTitle(e){const n=[/<title[^>]*>([^<]+)<\/title>/i,/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i,/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i];for(const i of n){const a=e.match(i);if(a){const s=a[1].trim();if(s&&s.length>0)return s}}return null}extractDescription(e){const n=[/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i,/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i,/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i,/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i];for(const i of n){const a=e.match(i);if(a){const s=a[1].trim();if(s&&s.length>0)return s}}return null}extractIcon(e,n){const i=[/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i,/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:icon|shortcut icon)["']/i,/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i,/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']apple-touch-icon["']/i];for(const a of i){const s=e.match(a);if(s)try{const r=new URL(s[1],n).href;return console.log("Icona trovata:",r),r}catch{console.log("URL icona non valido:",s[1])}}return null}extractAppleTouchIcon(e,n){const i=[/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i,/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']apple-touch-icon["']/i,/<link[^>]*rel=["']apple-touch-icon-precomposed["'][^>]*href=["']([^"']+)["']/i,/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']apple-touch-icon-precomposed["']/i];for(const a of i){const s=e.match(a);if(s)try{const r=new URL(s[1],n).href;return console.log("Apple Touch Icon trovata:",r),r}catch{console.log("URL apple-touch-icon non valido:",s[1])}}return null}extractKeywords(e){const n=e.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);return n?n[1].trim():null}extractAuthor(e){const n=e.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i);return n?n[1].trim():null}extractOGImage(e){const n=e.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);return n?n[1].trim():null}extractOGTitle(e){const n=e.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);return n?n[1].trim():null}extractOGDescription(e){const n=e.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);return n?n[1].trim():null}async testProxy(e){try{return(await fetch(e+encodeURIComponent("https://httpbin.org/ip"),{method:"GET",timeout:5e3})).ok}catch{return!1}}async getProxyStatus(){const e={};for(let n=0;n<this.proxies.length;n++){const i=this.proxies[n];e[i]=await this.testProxy(i)}return e}}var Ps=En();const Bs=Oe(Ps);class Ns{constructor(){this.maxFileSize=50*1024*1024,this.supportedFormats=["zip"],this.categories=["productivity","entertainment","communication","development","design","finance","health","news","shopping","travel","ai","social","education","business","utility","pwa"],this.proxyService=new Os,this.init&&(this.init=this.init.bind(this)),this.showModal&&(this.showModal=this.showModal.bind(this)),this.importFromZip&&(this.importFromZip=this.importFromZip.bind(this)),this.importFromUrl&&(this.importFromUrl=this.importFromUrl.bind(this)),this.importFromGitHub&&(this.importFromGitHub=this.importFromGitHub.bind(this)),this.validateAppData&&(this.validateAppData=this.validateAppData.bind(this)),this.extractAppMetadata&&(this.extractAppMetadata=this.extractAppMetadata.bind(this)),this.setupDropZone&&(this.setupDropZone=this.setupDropZone.bind(this))}async init(){console.log("🔧 Inizializzazione AppImporter..."),this.setupDropZone(),this.setupKeyboardShortcuts()}showModal(){const e=this.createImportModal();D("app-import-modal",e,{size:"modal-xl",disableBackdropClose:!1}),setTimeout(()=>{this.setupModalEventListeners();const n=document.getElementById("form-html");n&&n.classList.add("active");const i=document.querySelector('[data-section="html"]');i&&i.classList.add("active")},100)}createImportModal(){return`
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
    `}setupModalEventListeners(){const e=document.getElementById("app-import-modal");if(!e)return;const n=e.querySelectorAll(".settings-nav-btn"),i=e.querySelectorAll(".settings-section");n.forEach(o=>{o.addEventListener("click",()=>{const l=o.dataset.section;n.forEach(u=>u.classList.remove("active")),o.classList.add("active"),i.forEach(u=>{u.style.display="none",u.classList.remove("active"),u.id===`section-${l}`&&(u.style.display="block",u.classList.add("active"))})})}),this.setupHtmlImport(e),this.setupUrlImport(e),this.setupGitHubImport(e),this.setupMetadataForm(e),e.querySelector("#start-import")?.addEventListener("click",()=>{this.startImport()}),e.querySelector("#cancel-import")?.addEventListener("click",()=>{O("app-import-modal")}),e.querySelector(".modal-close")?.addEventListener("click",()=>{O("app-import-modal")}),e.addEventListener("keydown",o=>{o.key==="Escape"&&O("app-import-modal")})}setupZipImport(e){const n=e.querySelector("#zip-drop-zone"),i=e.querySelector("#zip-file-input");e.querySelector("#select-zip-btn")?.addEventListener("click",()=>{i?.click()}),i?.addEventListener("change",s=>{const r=s.target.files[0];r&&this.handleZipFile(r)}),n?.addEventListener("dragover",s=>{s.preventDefault(),n.classList.add("drag-over")}),n?.addEventListener("dragleave",s=>{s.preventDefault(),n.classList.remove("drag-over")}),n?.addEventListener("drop",s=>{s.preventDefault(),n.classList.remove("drag-over");const r=s.dataTransfer.files[0];r&&r.name.endsWith(".zip")?this.handleZipFile(r):m("Per favore seleziona un file ZIP valido","error")})}setupUrlImport(e){const n=e.querySelector("#url-input"),i=e.querySelector("#test-url-btn"),a=e.querySelector("#url-preview-container");i?.addEventListener("click",async()=>{const s=n?.value.trim();if(!s){m("Inserisci un URL valido","error");return}if(!ue(s)){m("URL non valido","error");return}try{i.disabled=!0,i.textContent="Testando...",await this.testUrl(s,a),i.textContent="Test",i.disabled=!1}catch(r){console.error("Errore test URL:",r),m("Errore durante il test dell'URL","error"),i.textContent="Test",i.disabled=!1}}),n?.addEventListener("input",()=>{const s=n.value.trim();s&&ue(s)?this.enableImportButton():this.disableImportButton()})}setupGitHubImport(e){const n=e.querySelector("#github-url-input"),i=e.querySelector("#github-preview-container");n?.addEventListener("input",async()=>{const a=n.value.trim();if(a&&this.isGitHubUrl(a))try{await this.fetchGitHubInfo(a,i),this.enableImportButton()}catch(s){console.error("Errore fetch GitHub:",s),m("Errore durante il recupero delle informazioni GitHub","error")}else this.disableImportButton(),i&&(i.style.display="none")})}setupMetadataForm(e){this.updateDefaultModeIndicator();const n=e.querySelector("#app-icon"),i=e.querySelector("#upload-icon-btn"),a=e.querySelector("#icon-file-input"),s=e.querySelector("#icon-preview");e.querySelector("#icon-preview-img"),i?.addEventListener("click",()=>{a?.click()}),a?.addEventListener("change",o=>{const l=o.target.files[0];l&&this.handleIconUpload(l,n,s)}),n?.addEventListener("input",()=>{const o=n.value.trim();o?this.showIconPreview(o,s):s.style.display="none"}),e.querySelector("#app-name")?.addEventListener("input",()=>{this.validateForm()})}async updateDefaultModeIndicator(){try{const e=await A.getSetting("defaultLaunchMode","newpage"),n=document.getElementById("current-default-mode");if(n){const i=e==="newpage"?"Nuova pagina":"Finestra modale";n.textContent=`(Impostazione globale corrente: ${i})`}}catch(e){console.warn("Impossibile caricare modalità di default:",e)}}validateForm(){const e=document.getElementById("app-name"),n=document.getElementById("start-import");if(e&&n){const i=e.value.trim().length>0;n.disabled=!i}}setupHtmlImport(e){e.querySelector("#html-file-input")?.addEventListener("change",i=>{const a=i.target.files[0];a&&this.handleHtmlFile(a)})}async handleZipFile(e){try{if(e.size>this.maxFileSize){m(`File troppo grande. Massimo: ${st(this.maxFileSize)}`,"error");return}m("Analizzando file ZIP...","info");const i=await new Bs().loadAsync(e),a=[];let s=null;for(const[p,f]of Object.entries(i.files)){if(f.dir)continue;const g=await f.async("text"),v={filename:p,content:g,size:g.length,mimeType:this.getMimeType(p)};if(a.push(v),p==="aideas.json")try{s=JSON.parse(g)}catch(E){console.warn("Manifest aideas.json non valido:",E)}}if(!a.some(p=>p.filename.endsWith(".html"))){m("Il ZIP deve contenere almeno un file HTML","error");return}const o=this.extractZipMetadata(a,s);this.populateMetadataForm(o);const l=document.getElementById("section-metadata");l&&(l.style.display="block"),this.currentImportData={type:"zip",files:a,manifest:s,metadata:o,originalFile:e};const u=document.getElementById("start-import");u&&(u.disabled=!1),m("ZIP analizzato con successo!","success")}catch(n){console.error("Errore durante l'analisi del ZIP:",n),m("Errore durante l'analisi del file ZIP","error")}}async testUrl(e,n){if(!n)return;n.style.display="block";const i=n.querySelector(".status-badge"),a=n.querySelector(".preview-title"),s=n.querySelector(".preview-url");i.textContent="Verificando...",i.className="status-badge",a.textContent="Caricamento...",s.textContent=e;try{const r=await this.extractUrlMetadata(e);a.textContent=r.title||r.name||de(e),i.textContent=r.isPWA?"✓ PWA Rilevata":"✓ Sito Web",i.className=r.isPWA?"status-badge badge-success":"status-badge badge-info",this.populateMetadataForm(r);const o=document.getElementById("section-metadata");o&&(o.style.display="block"),this.currentImportData={type:r.isPWA?"pwa":"url",url:e,metadata:r};const l=document.getElementById("start-import");l&&(l.disabled=!1)}catch(r){console.error("Errore test URL:",r),i.textContent="⚠ Errore",i.className="status-badge badge-error",a.textContent="Impossibile verificare il sito"}}async fetchGitHubInfo(e,n){if(!n)return;const i=this.parseGitHubUrl(e);if(!i){m("URL GitHub non valido","error");return}try{const a=`https://api.github.com/repos/${i.owner}/${i.repo}`,s=await fetch(a);if(!s.ok)throw new Error("Repository non trovato o non accessibile");const r=await s.json();n.style.display="block",n.querySelector("#repo-avatar").src=r.owner.avatar_url,n.querySelector("#repo-name").textContent=r.full_name,n.querySelector("#repo-description").textContent=r.description||"Nessuna descrizione",n.querySelector("#repo-stars").textContent=r.stargazers_count,n.querySelector("#repo-forks").textContent=r.forks_count,n.querySelector("#repo-updated").textContent=new Date(r.updated_at).toLocaleDateString();const o={name:r.name,description:r.description,category:"tools",version:"1.0.0",githubUrl:e};this.populateMetadataForm(o);const l=document.getElementById("section-metadata");l&&(l.style.display="block"),this.currentImportData={type:"github",url:e,githubUrl:e,repoData:r,metadata:o};const u=document.getElementById("start-import");u&&(u.disabled=!1)}catch(a){console.error("Errore fetch GitHub:",a),m(`Errore: ${a.message}`,"error")}}async startImport(){if(!this.currentImportData){m("Nessun dato da importare","error");return}try{this.showImportProgress(!0);const e=this.collectFormData(),n=this.validateAppData(e);if(!n.valid)throw new Error(n.error);const i={...this.currentImportData.metadata,...e,type:this.currentImportData.type,url:this.currentImportData.url,githubUrl:this.currentImportData.githubUrl,files:this.currentImportData.files,content:this.currentImportData.content};console.log(`🚀 Installazione app: ${i.name}`),console.log(`📋 Modalità di lancio app-specifica: ${i.metadata?.launchMode||"non specificata"}`);const a=await A.getSetting("defaultLaunchMode","newpage");console.log(`🌐 Modalità di lancio globale: ${a}`);const s=i.metadata?.launchMode||a;console.log(`✅ Modalità finale per questa app: ${s}`),this.updateImportProgress(50,"Salvando app...");const r=await A.installApp(i);this.updateImportProgress(100,"Importazione completata!"),setTimeout(()=>{O("app-import-modal"),m(`App "${i.name}" importata con successo!`,"success"),window.aideasApp&&window.aideasApp.loadApps&&window.aideasApp.loadApps()},1e3)}catch(e){console.error("Errore durante l'importazione:",e),m(`Errore importazione: ${e.message}`,"error"),this.showImportProgress(!1)}}extractZipMetadata(e,n){const i={name:n?.name||"App Importata",description:n?.description||"",version:n?.version||"1.0.0",category:n?.category||"tools",tags:n?.tags||[],icon:n?.icon||null,permissions:n?.permissions||[]};if(!i.icon){const a=e.find(s=>s.filename.match(/^(icon|logo|app-icon)\.(png|jpg|jpeg|svg)$/i));if(a){const s=new Blob([a.content],{type:a.mimeType});i.icon=URL.createObjectURL(s)}}return i}async extractUrlMetadata(e){const n=de(e),i=new URL(e).origin;try{const a=await this.fetchManifest(e);if(a)return{name:a.name||a.short_name||n,title:a.name||a.short_name||n,description:a.description||`Progressive Web App da ${n}`,category:"pwa",url:e,icon:this.getBestIcon(a.icons,i),isPWA:!0,manifest:a,version:a.version||"1.0.0",theme_color:a.theme_color,background_color:a.background_color};const s=await this.fetchHtmlMetadata(e);if(s){const r=s.icon||s.appleTouchIcon||`https://www.google.com/s2/favicons?domain=${n}&sz=64`;return{name:s.title||s.ogTitle||n,title:s.title||s.ogTitle||n,description:s.description||s.ogDescription||`App web da ${n}`,category:"tools",url:e,icon:r,isPWA:!1,version:"1.0.0"}}return{name:n,title:n,description:`App web da ${n}`,category:"tools",url:e,icon:`https://www.google.com/s2/favicons?domain=${n}&sz=64`,isPWA:!1,version:"1.0.0"}}catch(a){return console.error("Errore estrazione metadati:",a),{name:n,title:n,description:`App web da ${n}`,category:"tools",url:e,icon:`https://www.google.com/s2/favicons?domain=${n}&sz=64`,isPWA:!1,version:"1.0.0"}}}async fetchManifest(e){try{const i=`${new URL(e).origin}/manifest.json`,a=await fetch(i,{method:"GET",headers:{Accept:"application/json"}});if(a.ok){const s=await a.json();if(s.name||s.short_name)return s}return null}catch(n){return console.log("Manifest non trovato:",n),null}}async fetchHtmlMetadata(e){try{const n=await this.proxyService.extractMetadata(e);return{title:n.title||n.ogTitle,description:n.description||n.ogDescription,icon:n.icon,appleTouchIcon:n.appleTouchIcon,keywords:n.keywords,author:n.author,ogImage:n.ogImage,ogTitle:n.ogTitle,ogDescription:n.ogDescription}}catch(n){console.log("Impossibile estrarre metadati HTML con proxy, provo approccio diretto:",n);try{const i=await fetch(e,{method:"GET",headers:{Accept:"text/html"}});if(!i.ok)throw new Error("Pagina non accessibile");const a=await i.text(),s=a.match(/<title[^>]*>([^<]+)<\/title>/i),r=a.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i),o=a.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i),l=a.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i),u=new URL(e).origin;return{title:s?s[1].trim():null,description:r?r[1].trim():null,icon:o?new URL(o[1],u).href:null,appleTouchIcon:l?new URL(l[1],u).href:null}}catch(i){return console.log("Anche l'approccio diretto è fallito:",i),null}}}getBestIcon(e,n){if(!e||!Array.isArray(e))return null;const i=["512x512","192x192","144x144","96x96"];for(const a of i){const s=e.find(r=>r.sizes===a||r.sizes&&r.sizes.includes(a));if(s)return new URL(s.src,n).href}return e.length>0?new URL(e[0].src,n).href:null}parseGitHubUrl(e){const n=[/github\.com\/([^\/]+)\/([^\/]+)/,/([^\/]+)\.github\.io\/([^\/]+)/];for(const i of n){const a=e.match(i);if(a)return{owner:a[1],repo:a[2].replace(".git","")}}return null}isGitHubUrl(e){return e.includes("github.com")||e.includes("github.io")}getMimeType(e){const n=e.split(".").pop().toLowerCase();return{html:"text/html",css:"text/css",js:"application/javascript",json:"application/json",png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",gif:"image/gif",svg:"image/svg+xml",txt:"text/plain"}[n]||"application/octet-stream"}getCategoryLabel(e){return{productivity:"Produttività",entertainment:"Intrattenimento",tools:"Strumenti",games:"Giochi",ai:"Intelligenza Artificiale",social:"Social",education:"Educazione",business:"Business",utility:"Utilità",pwa:"Progressive Web App"}[e]||e}populateMetadataForm(e){const n={"app-name":e.name||e.title,"app-description":e.description,"app-version":e.version,"app-category":e.category,"app-tags":Array.isArray(e.tags)?e.tags.join(", "):e.tags,"app-icon":e.icon};for(const[i,a]of Object.entries(n)){const s=document.getElementById(i);s&&a&&(s.value=a,s.dispatchEvent(new Event("input")),s.dispatchEvent(new Event("change")))}if(e.isPWA&&e.manifest){if(e.theme_color){const i=document.getElementById("app-theme-color");i&&(i.value=e.theme_color)}if(e.background_color){const i=document.getElementById("app-bg-color");i&&(i.value=e.background_color)}}}collectFormData(){const e=document.getElementById("app-name"),n=document.getElementById("app-description"),i=document.getElementById("app-version"),a=document.getElementById("app-category"),s=document.getElementById("app-launch-mode"),r=document.getElementById("app-tags"),o=document.getElementById("app-icon"),l=r?.value?r.value.split(",").map(p=>p.trim()).filter(p=>p):[],u={name:e?.value.trim()||"",description:n?.value.trim()||"",version:i?.value.trim()||"1.0.0",category:a?.value||"tools",tags:l,icon:o?.value.trim()||null};return s&&s.value?(u.metadata=u.metadata||{},u.metadata.launchMode=s.value,console.log(`📝 Modalità di lancio specificata per app: ${s.value}`)):console.log("📝 Nessuna modalità specifica, userà impostazione globale"),u}validateAppData(e){return e.name?e.name.length>50?{valid:!1,error:"Nome app troppo lungo (max 50 caratteri)"}:e.description&&e.description.length>200?{valid:!1,error:"Descrizione troppo lunga (max 200 caratteri)"}:{valid:!0}:{valid:!1,error:"Nome app richiesto"}}showImportProgress(e){const n=document.getElementById("import-progress"),i=document.getElementById("modal-actions");n&&i&&(n.style.display=e?"block":"none",i.style.display=e?"none":"flex")}updateImportProgress(e,n){const i=document.getElementById("progress-fill"),a=document.getElementById("progress-text");i&&(i.style.width=`${e}%`),a&&(a.textContent=n)}enableImportButton(){const e=document.getElementById("start-import");e&&(e.disabled=!1)}disableImportButton(){const e=document.getElementById("start-import");e&&(e.disabled=!0)}setupDropZone(){["dragenter","dragover","dragleave","drop"].forEach(e=>{document.addEventListener(e,n=>{n.preventDefault(),n.stopPropagation()},!1)}),document.addEventListener("drop",e=>{const n=e.dataTransfer.files[0];n&&n.name.endsWith(".zip")&&(this.showModal(),setTimeout(()=>{this.handleZipFile(n)},200))})}setupKeyboardShortcuts(){document.addEventListener("keydown",e=>{(e.ctrlKey||e.metaKey)&&e.key==="i"&&(e.preventDefault(),this.showModal())})}async handleIconUpload(e,n,i){if(!e.type.startsWith("image/")){m("Per favore seleziona un file immagine","error");return}if(e.size>2*1024*1024){m("Immagine troppo grande (max 2MB)","error");return}try{const a=new FileReader;a.onload=s=>{const r=s.target.result;n.value=r,this.showIconPreview(r,i)},a.readAsDataURL(e)}catch(a){console.error("Errore upload icona:",a),m("Errore durante l'upload dell'icona","error")}}showIconPreview(e,n){if(!n)return;const i=n.querySelector("#icon-preview-img");i&&(i.src=e,i.onload=()=>{n.style.display="block"},i.onerror=()=>{n.style.display="none",m("Impossibile caricare l'icona","warning")})}async handleHtmlFile(e){if(!e.type.startsWith("text/html")){m("Per favore seleziona un file HTML","error");return}if(e.size>2*1024*1024){m("File troppo grande (max 2MB)","error");return}try{const n=await e.text(),i=this.extractHtmlMetadata(n,e.name);this.populateMetadataForm(i);const a=document.getElementById("section-metadata");a&&(a.style.display="block",a.classList.add("active")),this.currentImportData={type:"html",content:n,metadata:i},this.enableImportButton(),m("File HTML analizzato con successo!","success")}catch(n){console.error("Errore durante l'importazione del file HTML:",n),m("Errore durante l'importazione del file HTML","error")}}extractHtmlMetadata(e,n){const a=new DOMParser().parseFromString(e,"text/html"),s=a.querySelector("title")?.textContent?.trim()||a.querySelector('meta[property="og:title"]')?.getAttribute("content")||n.replace(".html","").replace(/[-_]/g," "),r=a.querySelector('meta[name="description"]')?.getAttribute("content")||a.querySelector('meta[property="og:description"]')?.getAttribute("content")||"App web standalone";let o=null;const l=a.querySelector('link[rel="icon"]')?.getAttribute("href")||a.querySelector('link[rel="shortcut icon"]')?.getAttribute("href")||a.querySelector('link[rel="apple-touch-icon"]')?.getAttribute("href");l&&(l.startsWith("data:")||l.startsWith("http")?o=l:o=null);const p=(a.querySelector('meta[name="keywords"]')?.getAttribute("content")||"").split(",").map(v=>v.trim()).filter(v=>v.length>0);let f="tools";const g=a.body?.textContent?.toLowerCase()||"";return g.includes("calcolatric")||g.includes("calculator")?f="utilities":g.includes("game")||g.includes("gioco")?f="games":(g.includes("editor")||g.includes("text"))&&(f="productivity"),{name:s,description:r,category:f,type:"html",content:e,icon:o,tags:p,version:"1.0.0"}}}class Hs{static render(e,n="grid"){return n==="list"?this.renderListView(e):this.renderGridView(e)}static renderGridView(e){const{id:n,name:i,description:a,category:s,version:r,type:o,lastUsed:l,installDate:u,favorite:p,tags:f,icon:g,url:v,githubUrl:E,metadata:T}=e,P=N(i||"App Senza Nome"),L=N(a||"Nessuna descrizione disponibile"),k=this.getCategoryInfo(s),nt=this.getAppIcon(e),j=this.getTypeInfo(o),W=pt(l);return`
      <div class="app-card" data-app-id="${n}" data-category="${s}" data-type="${o}">
        <!-- App Icon & Status -->
        <div class="app-card-header">
          <div class="app-icon-container">
            ${nt}
            <div class="app-type-badge" title="${j.label}">
              ${j.icon}
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
              ${f.slice(0,3).map(H=>`
                <span class="app-tag">${N(H)}</span>
              `).join("")}
              ${f.length>3?`<span class="app-tag-more">+${f.length-3}</span>`:""}
            </div>
          `:""}

          <!-- Metadata -->
          <div class="app-metadata">
            <div class="app-category" title="Categoria">
              ${k.icon}
              <span>${k.name}</span>
            </div>
            <div class="app-last-used" title="Ultimo utilizzo: ${new Date(l).toLocaleString()}">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.7L16.2,16.2Z"/>
              </svg>
              <span>${W}</span>
            </div>
          </div>

          <!-- App Description -->
          <div class="app-description-container">
            <p class="app-description" title="${L}">
              ${this.truncateText(L,100)}
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
                <span class="stat-value">${pt(u)}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Tipo:</span>
                <span class="stat-value">${j.label}</span>
              </div>
              ${T?.size?`
                <div class="stat">
                  <span class="stat-label">Dimensione:</span>
                  <span class="stat-value">${st(T.size)}</span>
                </div>
              `:""}
            </div>
          </div>
        </div>
      </div>
    `}static renderListView(e){const{id:n,name:i,description:a,category:s,version:r,type:o,lastUsed:l,installDate:u,favorite:p,tags:f,metadata:g}=e,v=N(i||"App Senza Nome");N(a||"Nessuna descrizione disponibile");const E=this.getCategoryInfo(s),T=this.getAppIcon(e),P=this.getTypeInfo(o),L=pt(l),k=pt(u);return`
      <div class="app-card app-card-list" data-app-id="${n}" data-category="${s}" data-type="${o}">
        <!-- App Icon -->
        <div class="app-list-icon">
          ${T}
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
              ${E.icon}
              <span>${E.name}</span>
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
            <span class="stat-value">${L}</span>
          </div>
          <div class="app-list-stat">
            <span class="stat-label">Installata:</span>
            <span class="stat-value">${k}</span>
          </div>
          ${g?.size?`
            <div class="app-list-stat">
              <span class="stat-label">Dimensione:</span>
              <span class="stat-value">${st(g.size)}</span>
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
    `}}class ks{constructor(){this.currentSettings={},this.defaultSettings={language:"it",theme:"auto",uiMode:"auto",viewMode:"grid",sortBy:"lastUsed",showWelcomeMessage:!0,enableAnimations:!0,compactMode:!1,defaultLaunchMode:"newpage",maxConcurrentApps:5,showAppTooltips:!0,enableKeyboardShortcuts:!0,autoUpdateApps:!1,syncEnabled:!1,syncProvider:"github",autoSyncInterval:60,backupBeforeSync:!0,analyticsEnabled:!1,crashReportingEnabled:!0,allowTelemetry:!1,validateAppsOnLaunch:!0,sandboxMode:"strict",enableServiceWorker:!0,cacheStrategy:"aggressive",preloadApps:!1,lazyLoadImages:!0,enableDebugMode:!1,showConsoleErrors:!1,enableExperimentalFeatures:!1},this.disabledFeatures={syncEnabled:!0,autoUpdateApps:!0,analyticsEnabled:!0,crashReportingEnabled:!0,allowTelemetry:!0,enableServiceWorker:!0,preloadApps:!0,enableExperimentalFeatures:!0},this.init=this.init.bind(this),this.showModal=this.showModal.bind(this),this.loadSettings=this.loadSettings.bind(this),this.saveSettings=this.saveSettings.bind(this),this.resetSettings=this.resetSettings.bind(this),this.exportSettings=this.exportSettings.bind(this),this.importSettings=this.importSettings.bind(this)}async init(){try{console.log("⚙️ Inizializzazione pannello impostazioni..."),await this.loadSettings(),await this.validateAndFixSettings(),this.applySettings(),console.log("✅ Pannello impostazioni inizializzato")}catch(e){console.error("❌ Errore inizializzazione pannello impostazioni:",e)}}async validateAndFixSettings(){console.log("🔍 Verifica impostazioni...");let e=!1;const n={...this.currentSettings};(!n.defaultLaunchMode||!["iframe","newpage"].includes(n.defaultLaunchMode))&&(console.log('⚠️ defaultLaunchMode non valido, correzione a "newpage"'),n.defaultLaunchMode="newpage",e=!0);const i={maxConcurrentApps:{min:1,max:10,default:5},autoSyncInterval:{min:5,max:1440,default:60},language:{valid:["it","en"],default:"it"},theme:{valid:["light","dark","auto"],default:"auto"},uiMode:{valid:["vanilla","material","auto"],default:"auto"}};for(const[a,s]of Object.entries(i)){const r=n[a];s.min!==void 0&&s.max!==void 0?(typeof r!="number"||r<s.min||r>s.max)&&(console.log(`⚠️ ${a} non valido (${r}), correzione a ${s.default}`),n[a]=s.default,e=!0):s.valid&&(s.valid.includes(r)||(console.log(`⚠️ ${a} non valido (${r}), correzione a ${s.default}`),n[a]=s.default,e=!0))}if(e){console.log("💾 Salvataggio correzioni impostazioni..."),this.currentSettings=n;for(const[a,s]of Object.entries(n))await A.setSetting(a,s);console.log("✅ Impostazioni corrette salvate")}else console.log("✅ Tutte le impostazioni sono valide")}async loadSettings(){try{const e=await A.getAllSettings();this.currentSettings={...this.defaultSettings,...e}}catch(e){console.error("Errore caricamento impostazioni:",e),this.currentSettings={...this.defaultSettings}}}applySettings(){this.applyTheme(this.currentSettings.theme),this.applyLanguage(this.currentSettings.language),this.applyAnimations(this.currentSettings.enableAnimations),this.applyCompactMode(this.currentSettings.compactMode),this.applyDebugMode(this.currentSettings.enableDebugMode)}showModal(){const e=this.createSettingsModal();D("settings-modal",e,{size:"modal-xl",disableBackdropClose:!1}),setTimeout(()=>{this.setupModalEventListeners(),this.populateForm(),this.markDisabledFeatures(),this.showSection("general")},100)}createSettingsModal(){return`
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
                  <label for="setting-uiMode">Interfaccia Utente</label>
                  <select id="setting-uiMode" class="form-input">
                    <option value="auto">Automatico (rileva e fallback)</option>
                    <option value="vanilla">Vanilla (classica)</option>
                    <option value="material">Material UI (moderna)</option>
                  </select>
                  <p class="setting-description">Tipo di interfaccia da utilizzare</p>
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
                  <button class="btn btn-primary" id="test-ui-change-btn">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18M20,8.69V4H15.31L12,0.69L8.69,4H4V8.69L0.69,12L4,15.31V20H8.69L12,23.31L15.31,20H20V15.31L23.31,12L20,8.69Z"/>
                    </svg>
                    Testa Cambio UI
                  </button>
                  
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
    `}markDisabledFeatures(){const e=document.getElementById("settings-modal");e&&Object.entries(this.disabledFeatures).forEach(([n,i])=>{if(i){const a=e.querySelector(`#setting-${this.camelToKebab(n)}-container`),s=e.querySelector(`#setting-${this.camelToKebab(n)}`);a&&a.classList.add("disabled"),s&&(s.disabled=!0,s.checked=!1)}})}setupModalEventListeners(){const e=document.getElementById("settings-modal");if(!e)return;e.querySelectorAll(".settings-nav-btn").forEach(i=>{i.addEventListener("click",()=>{const a=i.dataset.section;this.showSection(a)})}),e.querySelector("#export-settings-btn")?.addEventListener("click",()=>{this.exportSettings()}),e.querySelector("#import-settings-btn")?.addEventListener("click",()=>{this.importSettings()}),e.querySelector("#reset-settings-btn")?.addEventListener("click",()=>{this.resetSettings()}),e.querySelector("#clear-cache-btn")?.addEventListener("click",()=>{this.clearCache()}),e.querySelector("#clear-all-data-btn")?.addEventListener("click",()=>{this.clearAllData()}),e.querySelector("#test-ui-change-btn")?.addEventListener("click",()=>{this.testUIChange()}),e.querySelector("#cancel-settings")?.addEventListener("click",()=>{O("settings-modal")}),e.querySelector("#save-settings")?.addEventListener("click",()=>{this.saveSettings()}),e.querySelector("#setting-theme")?.addEventListener("change",i=>{this.applyTheme(i.target.value)}),e.querySelector("#setting-enableAnimations")?.addEventListener("change",i=>{this.applyAnimations(i.target.checked)}),e.querySelector("#setting-compactMode")?.addEventListener("change",i=>{this.applyCompactMode(i.target.checked)}),this.loadStorageStats(),this.loadSystemInfo()}showSection(e){const n=document.getElementById("settings-modal");if(!n)return;n.querySelectorAll(".settings-section").forEach(r=>{r.style.display="none",r.classList.remove("active")});const a=n.querySelector(`#section-${e}`);a&&(a.style.display="block",a.classList.add("active")),n.querySelectorAll(".settings-nav-btn").forEach(r=>{r.classList.remove("active"),r.dataset.section===e&&r.classList.add("active")})}populateForm(){const e=document.getElementById("settings-modal");if(!e)return;const n={language:"setting-language",theme:"setting-theme",uiMode:"setting-uiMode",showWelcomeMessage:"setting-showWelcomeMessage",enableKeyboardShortcuts:"setting-enableKeyboardShortcuts",defaultLaunchMode:"setting-defaultLaunchMode",maxConcurrentApps:"setting-maxConcurrentApps",autoUpdateApps:"setting-autoUpdateApps",validateAppsOnLaunch:"setting-validateAppsOnLaunch",sandboxMode:"setting-sandboxMode",viewMode:"setting-viewMode",sortBy:"setting-sortBy",compactMode:"setting-compactMode",enableAnimations:"setting-enableAnimations",showAppTooltips:"setting-showAppTooltips",syncEnabled:"setting-syncEnabled",syncProvider:"setting-syncProvider",autoSyncInterval:"setting-autoSyncInterval",backupBeforeSync:"setting-backupBeforeSync",analyticsEnabled:"setting-analyticsEnabled",crashReportingEnabled:"setting-crashReportingEnabled",allowTelemetry:"setting-allowTelemetry",enableServiceWorker:"setting-enableServiceWorker",cacheStrategy:"setting-cacheStrategy",preloadApps:"setting-preloadApps",lazyLoadImages:"setting-lazyLoadImages",enableDebugMode:"setting-enableDebugMode",showConsoleErrors:"setting-showConsoleErrors",enableExperimentalFeatures:"setting-enableExperimentalFeatures"};for(const[i,a]of Object.entries(this.currentSettings)){const s=n[i];if(s){const r=e.querySelector(`#${s}`);r&&!r.disabled&&(r.type==="checkbox"?r.checked=!!a:r.value=a)}}}async saveSettings(){try{const e=this.collectFormData();this.currentSettings={...this.currentSettings,...e};for(const[n,i]of Object.entries(this.currentSettings))await A.setSetting(n,i);this.applySettings(),O("settings-modal"),m("Impostazioni salvate con successo","success"),this.requiresReload(e)&&await Y({title:"Ricarica Pagina",message:"Alcune modifiche richiedono il ricaricamento della pagina. Ricaricare ora?",icon:"info",confirmText:"Ricarica",cancelText:"Più tardi",type:"default"})&&window.location.reload()}catch(e){console.error("Errore salvataggio impostazioni:",e),m("Errore durante il salvataggio delle impostazioni","error")}}collectFormData(){const e={},n=document.getElementById("settings-modal");if(!n)return e;const i={"setting-language":"language","setting-theme":"theme","setting-uiMode":"uiMode","setting-showWelcomeMessage":"showWelcomeMessage","setting-enableKeyboardShortcuts":"enableKeyboardShortcuts","setting-defaultLaunchMode":"defaultLaunchMode","setting-maxConcurrentApps":"maxConcurrentApps","setting-autoUpdateApps":"autoUpdateApps","setting-validateAppsOnLaunch":"validateAppsOnLaunch","setting-sandboxMode":"sandboxMode","setting-viewMode":"viewMode","setting-sortBy":"sortBy","setting-compactMode":"compactMode","setting-enableAnimations":"enableAnimations","setting-showAppTooltips":"showAppTooltips","setting-syncEnabled":"syncEnabled","setting-syncProvider":"syncProvider","setting-autoSyncInterval":"autoSyncInterval","setting-backupBeforeSync":"backupBeforeSync","setting-analyticsEnabled":"analyticsEnabled","setting-crashReportingEnabled":"crashReportingEnabled","setting-allowTelemetry":"allowTelemetry","setting-enableServiceWorker":"enableServiceWorker","setting-cacheStrategy":"cacheStrategy","setting-preloadApps":"preloadApps","setting-lazyLoadImages":"lazyLoadImages","setting-enableDebugMode":"enableDebugMode","setting-showConsoleErrors":"showConsoleErrors","setting-enableExperimentalFeatures":"enableExperimentalFeatures"};return n.querySelectorAll('input[id^="setting-"], select[id^="setting-"], textarea[id^="setting-"]').forEach(s=>{const r=s.id,o=i[r];o&&!s.disabled&&(s.type==="checkbox"?e[o]=s.checked:s.type==="number"?e[o]=parseInt(s.value)||0:e[o]=s.value)}),e}applyTheme(e){const n=document.documentElement;if(e==="auto"){const i=window.matchMedia("(prefers-color-scheme: dark)").matches;n.setAttribute("data-theme",i?"dark":"light")}else n.setAttribute("data-theme",e)}applyLanguage(e){document.documentElement.setAttribute("lang",e)}applyAnimations(e){const n=document.documentElement;e?n.classList.remove("no-animations"):n.classList.add("no-animations")}applyCompactMode(e){const n=document.documentElement;e?n.classList.add("compact-mode"):n.classList.remove("compact-mode")}applyDebugMode(e){const n=document.documentElement;e?n.classList.add("debug-mode"):n.classList.remove("debug-mode")}async resetSettings(){if(await Y({title:"Reset Impostazioni",message:"Sei sicuro di voler ripristinare tutte le impostazioni ai valori predefiniti?",icon:"warning",confirmText:"Reset",cancelText:"Annulla",type:"default"}))try{this.currentSettings={...this.defaultSettings};for(const[n,i]of Object.entries(this.currentSettings))await A.setSetting(n,i);this.populateForm(),this.applySettings(),m("Impostazioni ripristinate ai valori predefiniti","success")}catch(n){console.error("Errore reset impostazioni:",n),m("Errore durante il ripristino delle impostazioni","error")}}async exportSettings(){try{const e={version:"1.0.0",timestamp:new Date().toISOString(),settings:this.currentSettings,deviceInfo:bn()},n=new Blob([JSON.stringify(e,null,2)],{type:"application/json"}),i=URL.createObjectURL(n),a=document.createElement("a");a.href=i,a.download=`sakai-settings-${new Date().toISOString().split("T")[0]}.json`,document.body.appendChild(a),a.click(),document.body.removeChild(a),URL.revokeObjectURL(i),m("Impostazioni esportate con successo","success")}catch(e){console.error("Errore export impostazioni:",e),m("Errore durante l'esportazione delle impostazioni","error")}}importSettings(){const e=document.createElement("input");e.type="file",e.accept=".json",e.onchange=async n=>{try{const i=n.target.files[0];if(!i)return;const a=await i.text(),s=JSON.parse(a);if(!s.settings||!s.version)throw new Error("Formato file non valido");this.currentSettings={...this.defaultSettings,...s.settings};for(const[r,o]of Object.entries(this.currentSettings))await A.setSetting(r,o);this.populateForm(),this.applySettings(),m("Impostazioni importate con successo","success")}catch(i){console.error("Errore import impostazioni:",i),m("Errore durante l'importazione delle impostazioni","error")}},e.click()}async clearCache(){try{if("caches"in window){const e=await caches.keys();await Promise.all(e.map(n=>caches.delete(n)))}m("Cache svuotata con successo","success"),this.loadStorageStats()}catch(e){console.error("Errore svuotamento cache:",e),m("Errore durante lo svuotamento della cache","error")}}async clearAllData(){if(!(!await Y({title:"Elimina Tutti i Dati",message:"ATTENZIONE: Questa operazione eliminerà TUTTI i dati di SAKAI incluse app, impostazioni e cache. Continuare?",icon:"warning",confirmText:"Elimina",cancelText:"Annulla",type:"default"})||!await Y({title:"Conferma Eliminazione",message:"Sei veramente sicuro? Questa operazione NON può essere annullata!",icon:"warning",confirmText:"Elimina",cancelText:"Annulla",type:"default"})))try{if(await A.close(),indexedDB.deleteDatabase("SAKAI_DB"),Object.keys(localStorage).forEach(i=>{i.startsWith("sakai_")&&localStorage.removeItem(i)}),"caches"in window){const i=await caches.keys();await Promise.all(i.map(a=>caches.delete(a)))}m("Tutti i dati sono stati eliminati","success"),setTimeout(()=>{window.location.reload()},2e3)}catch(i){console.error("Errore eliminazione dati:",i),m("Errore durante l'eliminazione dei dati","error")}}async loadStorageStats(){try{const e=document.getElementById("settings-modal");if(!e)return;const n=await A.getStats(),i=await A.getAllApps(),a=await A.estimateDbSize(),s=e.querySelector("#storage-used"),r=e.querySelector("#apps-count"),o=e.querySelector("#cache-size");if(s&&(s.textContent=st(a)),r&&(r.textContent=i.length.toString()),o){const l=n.cacheSize||0;o.textContent=st(l)}}catch(e){console.error("Errore caricamento statistiche storage:",e);const n=document.getElementById("settings-modal");n&&["storage-used","apps-count","cache-size"].forEach(a=>{const s=n.querySelector(`#${a}`);s&&(s.textContent="Errore caricamento")})}}loadSystemInfo(){try{const e=document.getElementById("settings-modal");if(!e)return;const n=e.querySelector("#user-agent"),i=e.querySelector("#platform"),a=e.querySelector("#pwa-support");if(n&&(n.textContent=navigator.userAgent.substring(0,50)+"..."),i&&(i.textContent=navigator.platform||"Sconosciuto"),a){const s="serviceWorker"in navigator,r="manifest"in document.createElement("link"),o="PushManager"in window,l=[];s&&l.push("Service Worker"),r&&l.push("Web App Manifest"),o&&l.push("Push Notifications"),a.textContent=l.length>0?l.join(", "):"Non supportato"}}catch(e){console.error("Errore caricamento informazioni sistema:",e);const n=document.getElementById("settings-modal");n&&["user-agent","platform","pwa-support"].forEach(a=>{const s=n.querySelector(`#${a}`);s&&(s.textContent="Errore caricamento")})}}camelToKebab(e){return e.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g,"$1-$2").toLowerCase()}kebabToCamel(e){return e.replace(/-([a-z])/g,n=>n[1].toUpperCase())}requiresReload(e){return["language","theme","uiMode","enableServiceWorker","cacheStrategy"].some(i=>{const a=this.currentSettings[i],s=e[i];return a!==void 0&&a!==s})}getSetting(e,n=null){return this.currentSettings[e]!==void 0?this.currentSettings[e]:n}async setSetting(e,n){this.currentSettings[e]=n,await A.setSetting(e,n),this.applySettings()}async testUIChange(){try{const e=this.currentSettings.uiMode||"auto";let n;switch(e){case"auto":n="material";break;case"material":n="vanilla";break;case"vanilla":n="auto";break;default:n="auto"}await this.setSetting("uiMode",n),await Y({title:"Cambio Interfaccia",message:`Passaggio da ${e} a ${n}. La pagina verrà ricaricata. Continuare?`,icon:"info",confirmText:"Cambia",cancelText:"Annulla",type:"default"})?(m(`Cambio interfaccia a ${n}...`,"info"),setTimeout(()=>{window.location.reload()},1e3)):await this.setSetting("uiMode",e)}catch(e){console.error("Errore test cambio UI:",e),m("Errore durante il test del cambio interfaccia","error")}}}class zs{constructor(){this.currentView="all",this.currentSort="lastUsed",this.currentViewMode="grid",this.searchQuery="",this.apps=[],this.filteredApps=[],this.storage=A,this.appLauncher=new Cn,this.appImporter=new Ns,this.settingsPanel=new ks,An.init(),this.init=this.init.bind(this),this.setupEventListeners=this.setupEventListeners.bind(this),this.loadApps=this.loadApps.bind(this),this.renderApps=this.renderApps.bind(this),this.filterApps=this.filterApps.bind(this),this.handleSearch=this.handleSearch.bind(this),this.handleCategoryChange=this.handleCategoryChange.bind(this),this.handleSortChange=this.handleSortChange.bind(this),this.handleViewChange=this.handleViewChange.bind(this),this.showAppMenu=this.showAppMenu.bind(this)}async init(){try{console.log("🚀 Inizializzazione AIdeas..."),await this.storage.ensureDbOpen(),await this.verifyCriticalSettings(),localStorage.getItem("aideas_debug")==="true"&&await this.testSettings(),await this.appLauncher.init(),await this.appImporter.init(),await this.settingsPanel.init(),await this.loadApps(),this.setupEventListeners(),this.hideLoadingScreen(),console.log("✅ AIdeas inizializzata con successo")}catch(e){console.error("❌ Errore inizializzazione AIdeas:",e),this.showErrorScreen(e)}}async verifyCriticalSettings(){console.log("🔍 Verifica impostazioni critiche...");const e=await this.storage.getSetting("defaultLaunchMode");(!e||!["iframe","newpage"].includes(e))&&(console.log('⚠️ defaultLaunchMode non valido, correzione a "newpage"'),await this.storage.setSetting("defaultLaunchMode","newpage"));const n={maxConcurrentApps:{min:1,max:10,default:5},language:{valid:["it","en"],default:"it"},theme:{valid:["light","dark","auto"],default:"auto"}};for(const[i,a]of Object.entries(n)){const s=await this.storage.getSetting(i);a.min!==void 0&&a.max!==void 0?(typeof s!="number"||s<a.min||s>a.max)&&(console.log(`⚠️ ${i} non valido (${s}), correzione a ${a.default}`),await this.storage.setSetting(i,a.default)):a.valid&&(a.valid.includes(s)||(console.log(`⚠️ ${i} non valido (${s}), correzione a ${a.default}`),await this.storage.setSetting(i,a.default)))}console.log("✅ Impostazioni critiche verificate")}showLoadingScreen(){const e=document.getElementById("loading-screen"),n=document.getElementById("app");e&&n&&(e.style.display="flex",n.style.display="none")}hideLoadingScreen(){const e=document.getElementById("loading-screen"),n=document.getElementById("app");e&&(e.style.opacity="0",setTimeout(()=>{e.style.display="none"},300)),n&&(n.style.display="block")}showErrorScreen(e){console.error("Errore critico:",e);const n=document.getElementById("loading-screen");n&&(n.innerHTML=`
        <div class="error-screen">
          <div class="error-icon">⚠️</div>
          <h1>Errore di Inizializzazione</h1>
          <p>Si è verificato un errore durante l'avvio dell'applicazione.</p>
          <p class="error-details">${e.message}</p>
          <button onclick="location.reload()" class="btn btn-primary">Riprova</button>
        </div>
      `)}async showWelcomeMessage(){await this.storage.getSetting("showWelcomeMessage",!0)&&m("Benvenuto in AIdeas! 🎉","success",3e3)}async initializeStorage(){try{const e=await A.getStats();console.log("📊 Database stats:",e)}catch(e){throw console.error("Errore inizializzazione storage:",e),e}}async loadUserSettings(){try{const e=await A.getAllSettings();this.currentViewMode=e.viewMode||"grid",this.currentSort=e.sortBy||"lastUsed",e.theme?document.documentElement.setAttribute("data-theme",e.theme):document.documentElement.setAttribute("data-theme","dark"),e.language&&document.documentElement.setAttribute("lang",e.language)}catch(e){console.error("Errore caricamento impostazioni:",e),document.documentElement.setAttribute("data-theme","dark")}}setupEventListeners(){const e=document.getElementById("sidebar-toggle"),n=document.getElementById("sidebar"),i=document.querySelector(".app-layout");e?.addEventListener("click",()=>{n?.classList.toggle("sidebar-open"),n?.classList.contains("sidebar-open")?i?.classList.remove("sidebar-collapsed"):i?.classList.add("sidebar-collapsed")});const a=document.getElementById("mobile-search-toggle"),s=document.getElementById("mobile-search-close"),r=document.querySelector(".search-container"),o=document.querySelector(".header-search"),l=document.getElementById("search-input");a?.addEventListener("click",()=>{o?.classList.toggle("search-active"),o?.classList.contains("search-active")&&setTimeout(()=>{l?.focus()},100)}),s?.addEventListener("click",()=>{o?.classList.remove("search-active"),l?.blur()}),document.addEventListener("click",L=>{!r?.contains(L.target)&&!a?.contains(L.target)&&o?.classList.remove("search-active")});const u=document.getElementById("search-input");u?.addEventListener("input",this.handleSearch),u?.addEventListener("keydown",L=>{L.key==="Escape"&&(o?.classList.remove("search-active"),u.blur())}),document.querySelectorAll("[data-category]").forEach(L=>{L.addEventListener("click",this.handleCategoryChange)}),document.getElementById("sort-select")?.addEventListener("change",this.handleSortChange),document.querySelectorAll(".view-btn").forEach(L=>{L.addEventListener("click",this.handleViewChange)}),document.querySelectorAll("#add-app-btn, #fab-add, #empty-add-btn").forEach(L=>{L.addEventListener("click",()=>this.showAddAppModal())}),document.getElementById("settings-btn")?.addEventListener("click",()=>{this.showSettingsModal()});const T=document.getElementById("user-btn"),P=document.getElementById("user-dropdown");T?.addEventListener("click",L=>{L.stopPropagation(),P?.classList.toggle("show")}),document.addEventListener("click",()=>{P?.classList.remove("show")}),document.getElementById("settings-link")?.addEventListener("click",L=>{L.preventDefault(),this.showSettingsModal()}),document.getElementById("export-link")?.addEventListener("click",L=>{L.preventDefault(),this.exportData()}),document.getElementById("import-link")?.addEventListener("click",L=>{L.preventDefault(),this.importData()}),document.getElementById("about-link")?.addEventListener("click",L=>{L.preventDefault(),this.showAboutModal()}),document.getElementById("sync-btn")?.addEventListener("click",()=>{this.syncManager.showSyncModal()}),document.getElementById("app-store-btn")?.addEventListener("click",()=>{this.showAppStoreModal()}),document.addEventListener("keydown",this.handleKeyboardShortcuts.bind(this)),window.addEventListener("resize",this.handleResize.bind(this)),document.addEventListener("click",L=>{!n?.contains(L.target)&&!e?.contains(L.target)&&(n?.classList.remove("sidebar-open"),i?.classList.add("sidebar-collapsed"))})}async loadApps(){try{this.apps=await A.getAllApps(),this.filterApps(),this.updateCategoryCounts()}catch(e){console.error("Errore caricamento apps:",e),m("Errore durante il caricamento delle app","error")}}filterApps(){let e=[...this.apps];if(this.currentView==="favorites")e=e.filter(n=>n.favorite);else if(this.currentView==="recent"){const n=new Date;n.setDate(n.getDate()-30),e=e.filter(i=>new Date(i.lastUsed)>n)}else this.currentView!=="all"&&(e=e.filter(n=>n.category===this.currentView));if(this.searchQuery){const n=this.searchQuery.toLowerCase();e=e.filter(i=>i.name.toLowerCase().includes(n)||i.description.toLowerCase().includes(n)||i.tags.some(a=>a.toLowerCase().includes(n)))}e.sort((n,i)=>{switch(this.currentSort){case"name":return n.name.localeCompare(i.name);case"installDate":return new Date(i.installDate)-new Date(n.installDate);case"category":return n.category.localeCompare(i.category);case"lastUsed":default:return new Date(i.lastUsed)-new Date(n.lastUsed)}}),this.filteredApps=e,this.renderApps()}renderApps(){const e=document.getElementById("apps-grid"),n=document.getElementById("empty-state");if(e){if(e.className=`apps-${this.currentViewMode}`,this.filteredApps.length===0){e.style.display="none",n.style.display="flex";return}n.style.display="none",this.currentViewMode==="launcher"?(e.style.display="grid",e.innerHTML=this.filteredApps.map(i=>this.renderLauncherItem(i)).join("")):(e.style.display=this.currentViewMode==="list"?"flex":"grid",e.innerHTML=this.filteredApps.map(i=>Hs.render(i)).join("")),this.setupAppCardListeners()}}renderLauncherItem(e){const n=e.icon?`<img src="${e.icon}" alt="${e.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`:"",i=`
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
    `}setupAppCardListeners(){document.querySelectorAll(".app-card-launch").forEach(e=>{e.addEventListener("click",async n=>{n.stopPropagation();const i=parseInt(e.dataset.appId);await this.launchApp(i)})}),document.querySelectorAll(".app-card-favorite").forEach(e=>{e.addEventListener("click",async n=>{n.stopPropagation();const i=parseInt(e.dataset.appId);await this.toggleFavorite(i)})}),document.querySelectorAll(".app-card-menu").forEach(e=>{e.addEventListener("click",n=>{n.stopPropagation();const i=parseInt(e.dataset.appId);this.showAppMenu(i,n.target)})}),document.querySelectorAll(".app-card").forEach(e=>{e.addEventListener("click",async()=>{const n=parseInt(e.dataset.appId);await this.launchApp(n)})}),document.querySelectorAll(".app-launcher-item").forEach(e=>{let n,i=!1;e.addEventListener("click",async a=>{if(!i){const s=parseInt(e.dataset.appId);await this.launchApp(s)}i=!1}),e.addEventListener("mousedown",a=>{n=setTimeout(()=>{i=!0;const s=parseInt(e.dataset.appId);this.showLauncherAppInfo(s,e)},500)}),e.addEventListener("mouseup",()=>{clearTimeout(n)}),e.addEventListener("mouseleave",()=>{clearTimeout(n)}),e.addEventListener("touchstart",a=>{n=setTimeout(()=>{i=!0;const s=parseInt(e.dataset.appId);this.showLauncherAppInfo(s,e)},500)}),e.addEventListener("touchend",()=>{clearTimeout(n)}),e.addEventListener("touchcancel",()=>{clearTimeout(n)})})}async launchApp(e){try{const n=await A.getApp(e);if(!n){m("App non trovata","error");return}await A.updateLastUsed(e),await this.appLauncher.launch(n),await this.loadApps()}catch(n){console.error("Errore lancio app:",n),m("Errore durante il lancio dell'app","error")}}async toggleFavorite(e){try{const n=await A.toggleFavorite(e);m(n?"Aggiunta ai preferiti":"Rimossa dai preferiti","success"),await this.loadApps()}catch(n){console.error("Errore toggle favorite:",n),m("Errore durante l'operazione","error")}}handleSearch(e){this.searchQuery=e.target.value.trim(),this.filterApps()}handleCategoryChange(e){e.preventDefault();const n=e.target.dataset.category||e.target.closest("[data-category]").dataset.category;document.querySelectorAll(".nav-link").forEach(a=>{a.classList.remove("active")});const i=e.target.closest(".nav-link");i&&i.classList.add("active"),this.currentView=n,this.updateSectionTitle(),this.filterApps()}handleSortChange(e){this.currentSort=e.target.value,A.setSetting("sortBy",this.currentSort),this.filterApps()}handleViewChange(e){const n=e.target.dataset.view||e.target.closest("[data-view]").dataset.view;document.querySelectorAll(".view-btn[data-view]").forEach(a=>{a.classList.remove("active")});const i=e.target.closest(".view-btn[data-view]");i&&i.classList.add("active"),this.currentViewMode=n,A.setSetting("viewMode",this.currentViewMode),this.renderApps()}handleKeyboardShortcuts(e){(e.ctrlKey||e.metaKey)&&e.key==="k"&&(e.preventDefault(),document.getElementById("search-input")?.focus()),(e.ctrlKey||e.metaKey)&&e.key==="n"&&(e.preventDefault(),this.showAddAppModal()),e.key==="Escape"&&this.closeAllModals()}handleResize(){const e=document.getElementById("sidebar"),n=document.querySelector(".app-layout");window.innerWidth>768||e?.classList.contains("sidebar-open")&&(e.classList.remove("sidebar-open"),n?.classList.add("sidebar-collapsed"))}updateSectionTitle(){const e=document.getElementById("section-title"),n=document.getElementById("section-subtitle"),a={all:{title:"Tutte le App",subtitle:"Gestisci le tue applicazioni web"},favorites:{title:"App Preferite",subtitle:"Le tue app più amate"},recent:{title:"App Recenti",subtitle:"Utilizzate negli ultimi 30 giorni"}}[this.currentView]||{title:this.currentView.charAt(0).toUpperCase()+this.currentView.slice(1),subtitle:`App della categoria ${this.currentView}`};e&&(e.textContent=a.title),n&&(n.textContent=a.subtitle)}updateCategoryCounts(){const e=document.getElementById("all-count");e&&(e.textContent=this.apps.length);const n=document.getElementById("favorites-count"),i=this.apps.filter(a=>a.favorite).length;n&&(n.textContent=i),this.updateDynamicCategories()}updateDynamicCategories(){const e=document.getElementById("dynamic-categories");if(!e)return;const n=new Map;this.apps.forEach(a=>{const s=a.category||"uncategorized";n.set(s,(n.get(s)||0)+1)});const i=Array.from(n.entries()).sort(([a],[s])=>a.localeCompare(s)).map(([a,s])=>`
        <li class="nav-item">
          <a href="#" class="nav-link" data-category="${a}">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z"/>
            </svg>
            ${a}
            <span class="nav-badge">${s}</span>
          </a>
        </li>
      `).join("");e.innerHTML=i,e.querySelectorAll("[data-category]").forEach(a=>{a.addEventListener("click",this.handleCategoryChange)})}showAddAppModal(){console.log("🔧 Tentativo apertura modal aggiungi app..."),this.appImporter&&typeof this.appImporter.showModal=="function"?this.appImporter.showModal():(console.error("❌ AppImporter non disponibile o showModal non è una funzione"),m("Errore: componente importazione non disponibile","error"))}showSettingsModal(){this.settingsPanel.showModal()}showAboutModal(){D("about-modal",`
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
    `)}async exportData(){try{const e=await A.exportAllData(),n=new Blob([JSON.stringify(e,null,2)],{type:"application/json"}),i=URL.createObjectURL(n),a=document.createElement("a");a.href=i,a.download=`aideas-backup-${new Date().toISOString().split("T")[0]}.json`,document.body.appendChild(a),a.click(),document.body.removeChild(a),URL.revokeObjectURL(i),m("Dati esportati con successo","success")}catch(e){console.error("Errore export:",e),m("Errore durante l'esportazione","error")}}importData(){const e=document.createElement("input");e.type="file",e.accept=".json",e.onchange=async n=>{try{const i=n.target.files[0];if(!i)return;const a=await i.text(),s=JSON.parse(a);await A.importData(s),await this.loadApps(),m("Dati importati con successo","success")}catch(i){console.error("Errore import:",i),m("Errore durante l'importazione","error")}},e.click()}async initializeComponents(){await this.appImporter.init(),await this.settingsPanel.init()}async initializeSync(){}async checkFirstRun(){await A.getSetting("firstRun",!0)&&(await A.setSetting("firstRun",!1),m("Benvenuto in AIdeas! Inizia aggiungendo la tua prima app.","info",5e3))}updateUI(){this.updateSectionTitle(),this.updateCategoryCounts(),document.querySelectorAll(".view-btn[data-view]").forEach(s=>{s.classList.remove("active")});const e=document.querySelector(`[data-view="${this.currentViewMode}"]`);e&&e.classList.add("active");const n=document.getElementById("sort-select");n&&(n.value=this.currentSort);const i=document.getElementById("sidebar"),a=document.querySelector(".app-layout");i&&a&&(i.classList.contains("sidebar-open")?a.classList.remove("sidebar-collapsed"):a.classList.add("sidebar-collapsed"))}closeAllModals(){document.querySelectorAll(".modal").forEach(e=>{O(e.id)})}showError(e){m(e,"error")}async showAppMenu(e,n){const i=await A.getApp(e);if(!i)return;const a=`
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
    `;document.querySelectorAll(".app-context-menu").forEach(g=>g.remove());const s=document.createElement("div");s.innerHTML=a,document.body.appendChild(s.firstElementChild);const r=document.querySelector(".app-context-menu"),o=n.getBoundingClientRect(),l=r.getBoundingClientRect();let u=o.bottom+window.scrollY+4,p=o.left+window.scrollX;u+l.height>window.innerHeight+window.scrollY&&(u=o.top+window.scrollY-l.height-4),p+l.width>window.innerWidth+window.scrollX&&(p=o.right+window.scrollX-l.width),r.style.top=`${u}px`,r.style.left=`${p}px`;const f=g=>{r.contains(g.target)||(r.remove(),document.removeEventListener("mousedown",f))};setTimeout(()=>document.addEventListener("mousedown",f),10),r.querySelector('[data-action="edit"]').addEventListener("click",async()=>{r.remove(),await this.showEditAppModal(i)}),r.querySelector('[data-action="delete"]').addEventListener("click",async()=>{r.remove(),await yn(i.name)&&(await A.deleteApp(e),m("App eliminata","success"),this.loadApps())})}async showEditAppModal(e){const n={...e},i=`
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
    `;D("edit-app-modal",i,{size:"modal-md"}),setTimeout(()=>{document.getElementById("cancel-edit-app")?.addEventListener("click",()=>{O("edit-app-modal")}),document.getElementById("close-edit-modal")?.addEventListener("click",()=>{O("edit-app-modal")}),document.getElementById("save-edit-app").addEventListener("click",async a=>{a.preventDefault();const s={name:document.getElementById("edit-app-name").value.trim(),description:document.getElementById("edit-app-description").value.trim(),version:document.getElementById("edit-app-version").value.trim(),category:document.getElementById("edit-app-category").value.trim(),tags:document.getElementById("edit-app-tags").value.split(",").map(o=>o.trim()).filter(Boolean),icon:document.getElementById("edit-app-icon").value.trim()},r=document.getElementById("edit-app-launch-mode");if(r&&r.value?(s.metadata||(s.metadata={}),s.metadata.launchMode=r.value):n.metadata?.launchMode&&(s.metadata||(s.metadata={}),s.metadata.launchMode=null),!s.name){m("Il nome è obbligatorio","error");return}await A.updateApp(e.id,s),O("edit-app-modal"),m("App modificata con successo","success"),await this.loadApps()})},200)}async showLauncherAppInfo(e,n){const i=await A.getApp(e);if(!i)return;const a=`
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
    `,s=D("launcher-app-info",a,{size:"modal-md",disableBackdropClose:!1,disableEscapeClose:!1});s.querySelector("#launch-app-btn")?.addEventListener("click",async()=>{O("launcher-app-info"),await this.launchApp(e)}),s.querySelector("#edit-app-btn")?.addEventListener("click",async()=>{O("launcher-app-info"),await this.showEditAppModal(i)})}async testSettings(){console.log("🧪 Test impostazioni...");try{const e="test_setting",n="test_value_"+Date.now();await this.storage.setSetting(e,n);const i=await this.storage.getSetting(e);console.log(i===n?"✅ Test salvataggio/caricamento impostazioni: PASS":"❌ Test salvataggio/caricamento impostazioni: FAIL"),await this.storage.setSetting(e,null);const a=await this.storage.getAllSettings();console.log("📋 Impostazioni attuali:",a);const s=["defaultLaunchMode","language","theme"];for(const r of s){const o=await this.storage.getSetting(r);console.log(`🔍 ${r}: ${o}`)}}catch(e){console.error("❌ Errore test impostazioni:",e)}}}window.addEventListener("error",t=>{console.error("Errore globale:",t.error),m("Si è verificato un errore imprevisto","error")});window.addEventListener("unhandledrejection",t=>{console.error("Promise rejections non gestita:",t.reason),m("Errore durante un'operazione asincrona","error")});export{zs as default};
//# sourceMappingURL=main-B4D_wlup.js.map
