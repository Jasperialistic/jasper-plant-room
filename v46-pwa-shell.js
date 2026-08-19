/* Jasper's Plant Room v4.6.0 — installable mobile app shell */
(function(){
  const mobileMq=window.matchMedia('(max-width:700px)');
  let deferredInstallPrompt=null;

  const style=document.createElement('style');
  style.id='v46PwaShellStyles';
  style.textContent=`
@media(max-width:700px){
  #pwaInstallBtn{
    min-height:38px!important;padding:0 11px!important;border:1px solid #425f53!important;border-radius:11px!important;
    background:#172820!important;color:#edf4f0!important;font-size:12px!important;font-weight:800!important;white-space:nowrap!important;
  }
  #pwaInstallBtn .pwa-install-dot{display:inline-block;width:7px;height:7px;margin-right:6px;border-radius:50%;background:#d3b777;vertical-align:1px}
  body.pwa-standalone{overscroll-behavior-y:none}
}
#pwaInstallGuide{
  width:min(420px,calc(100vw - 28px));padding:0;border:1px solid #30483e;border-radius:18px;background:#101c18;color:#edf4f0;
  box-shadow:0 24px 70px rgba(0,0,0,.55);overflow:hidden;
}
#pwaInstallGuide::backdrop{background:rgba(2,7,5,.78);backdrop-filter:blur(3px)}
#pwaInstallGuide .pwa-guide-body{padding:19px}
#pwaInstallGuide h3{margin:0 0 8px;font-size:18px}
#pwaInstallGuide p{margin:0 0 14px;color:#9db0a8;font-size:13px;line-height:1.55}
#pwaInstallGuide ol{margin:0;padding-left:20px;color:#dce7e1;font-size:13px;line-height:1.7}
#pwaInstallGuide .pwa-guide-actions{display:flex;justify-content:flex-end;padding:11px 14px;border-top:1px solid #263b33;background:#0d1814}
#pwaInstallGuide button{min-height:42px;padding:0 15px;border:1px solid #d5be85;border-radius:11px;background:#d5be85;color:#152017;font-weight:850}
`;
  document.getElementById(style.id)?.remove();
  document.head.appendChild(style);

  function isStandalone(){
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone===true;
  }

  function isIOS(){
    return /iPad|iPhone|iPod/i.test(navigator.userAgent) || (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  }

  function syncStandaloneClass(){
    document.body?.classList.toggle('pwa-standalone',isStandalone());
    if(isStandalone())document.getElementById('pwaInstallBtn')?.remove();
  }

  function ensureGuide(){
    let dlg=document.getElementById('pwaInstallGuide');
    if(dlg)return dlg;
    dlg=document.createElement('dialog');
    dlg.id='pwaInstallGuide';
    dlg.innerHTML=`
      <div class="pwa-guide-body">
        <h3>Add Plant Room to Home Screen</h3>
        <p>Install it once and Plant Room can launch in its own app-style window.</p>
        <ol><li>Open the browser Share menu.</li><li>Choose <strong>Add to Home Screen</strong>.</li><li>Tap <strong>Add</strong>.</li></ol>
      </div>
      <div class="pwa-guide-actions"><button type="button" id="pwaGuideDone">Got it</button></div>`;
    document.body.appendChild(dlg);
    dlg.querySelector('#pwaGuideDone').onclick=()=>dlg.close();
    dlg.addEventListener('cancel',e=>{e.preventDefault();dlg.close();});
    return dlg;
  }

  async function installFromButton(){
    if(deferredInstallPrompt){
      const prompt=deferredInstallPrompt;
      deferredInstallPrompt=null;
      try{
        await prompt.prompt();
        await prompt.userChoice;
      }catch(_e){}
      if(!deferredInstallPrompt)document.getElementById('pwaInstallBtn')?.remove();
      return;
    }
    if(isIOS()){
      const dlg=ensureGuide();
      if(!dlg.open)dlg.showModal();
    }
  }

  function ensureInstallButton(){
    if(!mobileMq.matches||isStandalone())return;
    if(!deferredInstallPrompt&&!isIOS())return;
    if(document.getElementById('pwaInstallBtn'))return;
    const host=document.querySelector('.top-actions')||document.querySelector('.auth-actions')||document.querySelector('.topbar');
    if(!host)return;
    const btn=document.createElement('button');
    btn.type='button';
    btn.id='pwaInstallBtn';
    btn.setAttribute('aria-label','Install Plant Room app');
    btn.innerHTML='<span class="pwa-install-dot"></span>Install app';
    btn.addEventListener('click',installFromButton);
    host.appendChild(btn);
  }

  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();
    deferredInstallPrompt=event;
    ensureInstallButton();
  });

  window.addEventListener('appinstalled',()=>{
    deferredInstallPrompt=null;
    document.getElementById('pwaInstallBtn')?.remove();
    syncStandaloneClass();
  });

  if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost')){
    window.addEventListener('load',()=>{
      navigator.serviceWorker.register('./service-worker.js',{scope:'./',updateViaCache:'none'}).catch(err=>console.warn('Plant Room service worker:',err));
    },{once:true});
  }

  const displayMq=window.matchMedia('(display-mode: standalone)');
  if(typeof displayMq.addEventListener==='function')displayMq.addEventListener('change',syncStandaloneClass);
  if(typeof mobileMq.addEventListener==='function')mobileMq.addEventListener('change',ensureInstallButton);

  function init(){
    syncStandaloneClass();
    ensureInstallButton();
    setTimeout(ensureInstallButton,600);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
