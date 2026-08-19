/* Jasper's Plant Room v4.7.0 — native-style mobile navigation + owner quick actions */
(function(){
  const mq=window.matchMedia('(max-width:700px)');
  let syncQueued=false;

  const icons={
    home:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 10.8 12 3.9l8.5 6.9v8.3a1.4 1.4 0 0 1-1.4 1.4h-4.6v-6.2h-5v6.2H4.9a1.4 1.4 0 0 1-1.4-1.4z"/></svg>',
    plants:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21V10.4M12 13.6c-4.7.2-7.6-2.1-8.4-6.8 4.8-.5 7.8 1.7 8.4 6.8Zm0-3.1c.6-4.5 3.3-6.8 8.4-6.5-.4 4.7-3.2 6.9-8.4 6.5Z"/></svg>',
    zones:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6.4-5.6 6.4-11.1A6.4 6.4 0 1 0 5.6 9.9C5.6 15.4 12 21 12 21Z"/><circle cx="12" cy="9.7" r="2.3"/></svg>',
    more:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>'
  };

  const style=document.createElement('style');
  style.id='v47MobileNavigationStyles';
  style.textContent=`
#mobileAppNav,#mobileQuickActions,#mobileMoreSheet,#mobileGrowthPicker{display:none}
@media(max-width:700px){
  body.v47-mobile-nav-ready .shell{padding-bottom:calc(104px + env(safe-area-inset-bottom))!important}
  body.v47-mobile-nav-ready .tabs{display:none!important}

  #mobileAppNav{
    position:fixed;z-index:2147482500;left:10px;right:10px;bottom:max(8px,env(safe-area-inset-bottom));
    display:grid;grid-template-columns:1fr 1fr 72px 1fr 1fr;align-items:end;gap:2px;
    box-sizing:border-box;min-height:72px;padding:7px 7px 8px;border:1px solid rgba(255,255,255,.1);border-radius:21px;
    background:rgba(14,25,21,.94);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);
    box-shadow:0 14px 42px rgba(0,0,0,.48);
  }
  body.v47-plant-open #mobileAppNav{display:none!important}
  #mobileAppNav button{font:inherit;-webkit-tap-highlight-color:transparent}
  #mobileAppNav .mobile-nav-item{
    min-width:0;height:56px;border:0;border-radius:14px;background:transparent;color:#789087;
    display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:3px 2px;
    font-size:9.5px;font-weight:780;line-height:1;letter-spacing:.01em;
  }
  #mobileAppNav .mobile-nav-item svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
  #mobileAppNav .mobile-nav-item[data-active="1"]{color:#edf4f0;background:rgba(145,183,164,.1)}
  #mobileAppNav .mobile-nav-item[data-active="1"] svg{color:#d5be85}
  #mobileAppNav .mobile-nav-add-wrap{height:59px;display:flex;align-items:flex-start;justify-content:center}
  #mobileAppNav #mobileNavAdd{
    width:58px;height:58px;margin-top:-17px;border:1px solid #e0ca92;border-radius:19px;background:#d5be85;color:#142018;
    box-shadow:0 10px 26px rgba(0,0,0,.38);font-size:31px;font-weight:400;line-height:1;padding:0;
  }
  #mobileAppNav #mobileNavAdd:active{transform:translateY(1px)}
  #mobileAppNav #mobileNavAdd[data-active="1"]{box-shadow:0 0 0 3px rgba(213,190,133,.2),0 10px 26px rgba(0,0,0,.38)}

  #mobileQuickActions,#mobileMoreSheet,#mobileGrowthPicker{
    width:100%;max-width:none;margin:auto 0 0;padding:0;border:0;background:transparent;color:#edf4f0;
  }
  #mobileQuickActions[open],#mobileMoreSheet[open],#mobileGrowthPicker[open]{display:block}
  #mobileQuickActions::backdrop,#mobileMoreSheet::backdrop,#mobileGrowthPicker::backdrop{background:rgba(0,0,0,.66);backdrop-filter:blur(2px)}
  .v47-sheet{
    width:100%;box-sizing:border-box;padding:9px 12px max(14px,env(safe-area-inset-bottom));
    border:1px solid #2c433a;border-bottom:0;border-radius:23px 23px 0 0;background:#13221d;
    box-shadow:0 -18px 44px rgba(0,0,0,.42);
  }
  .v47-sheet-grab{width:40px;height:4px;margin:2px auto 13px;border-radius:999px;background:#496057}
  .v47-sheet-title{padding:0 5px 11px}
  .v47-sheet-title strong{display:block;font-size:16px;line-height:1.2}
  .v47-sheet-title span{display:block;margin-top:4px;color:#8fa49a;font-size:11px;line-height:1.35}
  .v47-sheet-action{
    width:100%;min-height:52px;margin:0 0 7px;padding:0 14px;border:1px solid #2d473b;border-radius:14px;
    background:#192b24;color:#edf4f0;text-align:left;font-size:14px;font-weight:760;
  }
  .v47-sheet-action small{display:block;margin-top:2px;color:#8fa49a;font-size:10px;font-weight:550}
  .v47-sheet-action.v47-accent{border-color:#d5be85;background:#d5be85;color:#152017}
  .v47-sheet-action.v47-accent small{color:#4b594f}
  .v47-sheet-cancel{text-align:center;color:#a9bbb3;background:#101b17}
  #mobileGrowthPicker select{
    width:100%;min-height:50px;box-sizing:border-box;margin:0 0 10px;padding:0 12px;border:1px solid #365047;border-radius:13px;
    background:#0f1c17;color:#edf4f0;font:inherit;font-size:16px;
  }
  .v47-picker-actions{display:grid;grid-template-columns:1fr 1.35fr;gap:8px}
  .v47-picker-actions .v47-sheet-action{margin:0;text-align:center}
}
`;
  document.getElementById(style.id)?.remove();
  document.head.appendChild(style);

  function isOwner(){return document.body?.classList.contains('owner-mode');}
  function tab(view){return document.querySelector(`.tab[data-view="${view}"]`);}
  function activeView(){return document.querySelector('.tab.active')?.dataset.view||'dashboard';}

  function navigate(view){
    const source=tab(view);
    if(!source)return false;
    if(source.classList.contains('admin-only')&&!isOwner()){
      document.getElementById('adminLoginBtn')?.click();
      return false;
    }
    source.click();
    if(view!=='addplant')window.scrollTo({top:0,behavior:'smooth'});
    scheduleSync();
    return true;
  }

  function closeSheet(dlg){if(dlg?.open)dlg.close();}
  function bindBackdropClose(dlg){
    dlg.addEventListener('click',event=>{if(event.target===dlg)dlg.close();});
    dlg.addEventListener('cancel',event=>{event.preventDefault();dlg.close();});
  }

  function ensureQuickSheet(){
    let dlg=document.getElementById('mobileQuickActions');
    if(dlg)return dlg;
    dlg=document.createElement('dialog');
    dlg.id='mobileQuickActions';
    dlg.setAttribute('aria-label','Quick plant actions');
    dlg.innerHTML=`<div class="v47-sheet">
      <div class="v47-sheet-grab"></div>
      <div class="v47-sheet-title"><strong>Quick action</strong><span>Owner shortcuts for the things you add most often.</span></div>
      <button type="button" class="v47-sheet-action v47-accent" data-v47-quick="addplant">＋ Add Plant<small>Create a new collection entry</small></button>
      <button type="button" class="v47-sheet-action" data-v47-quick="growth">Growth Photo<small>Choose a plant, then add a progress photo</small></button>
      <button type="button" class="v47-sheet-action" data-v47-quick="care">Care Entry<small>Log watering, checks, repotting or custom care</small></button>
      <button type="button" class="v47-sheet-action v47-sheet-cancel" data-v47-close>Cancel</button>
    </div>`;
    document.body.appendChild(dlg);
    bindBackdropClose(dlg);
    dlg.querySelector('[data-v47-close]').onclick=()=>dlg.close();
    dlg.querySelector('[data-v47-quick="addplant"]').onclick=()=>{dlg.close();setTimeout(()=>navigate('addplant'),0);};
    dlg.querySelector('[data-v47-quick="growth"]').onclick=()=>{dlg.close();setTimeout(openGrowthPicker,0);};
    dlg.querySelector('[data-v47-quick="care"]').onclick=()=>{
      dlg.close();
      setTimeout(()=>{
        if(typeof openLogDialog==='function')openLogDialog();
        else document.getElementById('addLogBtn')?.click();
      },0);
    };
    return dlg;
  }

  function ensureMoreSheet(){
    let dlg=document.getElementById('mobileMoreSheet');
    if(dlg)return dlg;
    dlg=document.createElement('dialog');
    dlg.id='mobileMoreSheet';
    dlg.setAttribute('aria-label','More Plant Room sections');
    dlg.innerHTML=`<div class="v47-sheet">
      <div class="v47-sheet-grab"></div>
      <div class="v47-sheet-title"><strong>More</strong><span>Other Plant Room sections.</span></div>
      <button type="button" class="v47-sheet-action admin-only" data-v47-view="log">Care log<small>Full cloud-synced care history</small></button>
      <button type="button" class="v47-sheet-action" data-v47-view="backlog">To profile<small>Plants still waiting for a full profile</small></button>
      <button type="button" class="v47-sheet-action v47-sheet-cancel" data-v47-close>Cancel</button>
    </div>`;
    document.body.appendChild(dlg);
    bindBackdropClose(dlg);
    dlg.querySelector('[data-v47-close]').onclick=()=>dlg.close();
    dlg.querySelectorAll('[data-v47-view]').forEach(btn=>btn.onclick=()=>{
      const view=btn.dataset.v47View;
      dlg.close();
      setTimeout(()=>navigate(view),0);
    });
    return dlg;
  }

  function plantChoices(){
    try{
      if(typeof db==='undefined'||!Array.isArray(db.plants))return [];
      return db.plants
        .filter(p=>p&&!String(p.cloudId||'').startsWith('base:'))
        .slice()
        .sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));
    }catch(_e){return [];}
  }

  function ensureGrowthPicker(){
    let dlg=document.getElementById('mobileGrowthPicker');
    if(dlg)return dlg;
    dlg=document.createElement('dialog');
    dlg.id='mobileGrowthPicker';
    dlg.setAttribute('aria-label','Choose plant for growth photo');
    dlg.innerHTML=`<div class="v47-sheet">
      <div class="v47-sheet-grab"></div>
      <div class="v47-sheet-title"><strong>Add Growth Photo</strong><span>Choose the plant first.</span></div>
      <select id="mobileGrowthPlant" aria-label="Plant"></select>
      <div class="v47-picker-actions">
        <button type="button" class="v47-sheet-action v47-sheet-cancel" data-v47-close>Cancel</button>
        <button type="button" class="v47-sheet-action v47-accent" id="mobileGrowthContinue">Continue</button>
      </div>
    </div>`;
    document.body.appendChild(dlg);
    bindBackdropClose(dlg);
    dlg.querySelector('[data-v47-close]').onclick=()=>dlg.close();
    dlg.querySelector('#mobileGrowthContinue').onclick=()=>{
      const id=dlg.querySelector('#mobileGrowthPlant').value;
      const p=plantChoices().find(x=>String(x.cloudId)===id);
      if(!p)return;
      dlg.close();
      setTimeout(()=>{
        if(typeof openPhotoDialog==='function')openPhotoDialog(p,'growth');
      },0);
    };
    return dlg;
  }

  function openGrowthPicker(){
    if(!isOwner()){
      document.getElementById('adminLoginBtn')?.click();
      return;
    }
    const choices=plantChoices();
    if(!choices.length){navigate('plants');return;}
    const dlg=ensureGrowthPicker();
    const select=dlg.querySelector('#mobileGrowthPlant');
    select.innerHTML=choices.map(p=>`<option value="${String(p.cloudId).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">${String(p.name||'Unnamed plant').replace(/&/g,'&amp;').replace(/</g,'&lt;')}</option>`).join('');
    if(!dlg.open)dlg.showModal();
  }

  function ensureNav(){
    let nav=document.getElementById('mobileAppNav');
    if(nav)return nav;
    nav=document.createElement('nav');
    nav.id='mobileAppNav';
    nav.setAttribute('aria-label','Plant Room mobile navigation');
    nav.innerHTML=`
      <button type="button" class="mobile-nav-item" data-v47-nav="dashboard" aria-label="Home">${icons.home}<span>Home</span></button>
      <button type="button" class="mobile-nav-item" data-v47-nav="plants" aria-label="Plants">${icons.plants}<span>Plants</span></button>
      <div class="mobile-nav-add-wrap"><button type="button" id="mobileNavAdd" aria-label="Quick add">＋</button></div>
      <button type="button" class="mobile-nav-item" data-v47-nav="locations" aria-label="Zones">${icons.zones}<span>Zones</span></button>
      <button type="button" class="mobile-nav-item" data-v47-more aria-label="More">${icons.more}<span>More</span></button>`;
    document.body.appendChild(nav);
    nav.querySelectorAll('[data-v47-nav]').forEach(btn=>btn.onclick=()=>navigate(btn.dataset.v47Nav));
    nav.querySelector('#mobileNavAdd').onclick=()=>{
      if(!isOwner()){
        document.getElementById('adminLoginBtn')?.click();
        return;
      }
      const dlg=ensureQuickSheet();
      if(!dlg.open)dlg.showModal();
    };
    nav.querySelector('[data-v47-more]').onclick=()=>{
      const dlg=ensureMoreSheet();
      if(!dlg.open)dlg.showModal();
    };
    return nav;
  }

  function syncActiveState(){
    if(!mq.matches)return;
    const nav=ensureNav();
    const active=activeView();
    nav.querySelectorAll('[data-v47-nav]').forEach(btn=>btn.dataset.active=btn.dataset.v47Nav===active?'1':'0');
    nav.querySelector('#mobileNavAdd').dataset.active=active==='addplant'?'1':'0';
    nav.querySelector('[data-v47-more]').dataset.active=(active==='log'||active==='backlog')?'1':'0';
    document.body.classList.toggle('v47-plant-open',!!document.getElementById('plantDialog')?.open);
    document.body.classList.add('v47-mobile-nav-ready');
  }

  function syncOwnerVisibility(){
    const more=ensureMoreSheet();
    const care=more.querySelector('[data-v47-view="log"]');
    if(care)care.style.display=isOwner()?'':'none';
  }

  function runSync(){
    syncQueued=false;
    if(!mq.matches){
      document.body?.classList.remove('v47-mobile-nav-ready','v47-plant-open');
      return;
    }
    ensureNav();
    syncActiveState();
    syncOwnerVisibility();
  }
  function scheduleSync(){
    if(syncQueued)return;
    syncQueued=true;
    requestAnimationFrame(runSync);
  }

  function init(){
    scheduleSync();
    document.addEventListener('click',event=>{
      if(event.target.closest('.tab,[data-view],#closePlant'))setTimeout(scheduleSync,0);
    },true);
    const observer=new MutationObserver(scheduleSync);
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','open']});
    if(typeof mq.addEventListener==='function')mq.addEventListener('change',scheduleSync);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
