/* Jasper's Plant Room v4.9.3 — two-level mobile edge-back navigation */
(function(){
  const mq=window.matchMedia('(max-width:700px)');
  let syncQueued=false;

  const icons={
    home:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 10.8 12 3.9l8.5 6.9v8.3a1.4 1.4 0 0 1-1.4 1.4h-4.6v-6.2h-5v6.2H4.9a1.4 1.4 0 0 1-1.4-1.4z"/></svg>',
    plants:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21V10.4M12 13.6c-4.7.2-7.6-2.1-8.4-6.8 4.8-.5 7.8 1.7 8.4 6.8Zm0-3.1c.6-4.5 3.3-6.8 8.4-6.5-.4 4.7-3.2 6.9-8.4 6.5Z"/></svg>',
    zones:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6.4-5.6 6.4-11.1A6.4 6.4 0 1 0 5.6 9.9C5.6 15.4 12 21 12 21Z"/><circle cx="12" cy="9.7" r="2.3"/></svg>',
    more:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>'
  };

  const plantViewIcons={
    list:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="3" height="3" rx=".5"/><path d="M9 6.5h12M9 12h12M9 17.5h12"/><rect x="3" y="10.5" width="3" height="3" rx=".5"/><rect x="3" y="16" width="3" height="3" rx=".5"/></svg>',
    compact:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="5" height="5" rx="1"/><rect x="9.5" y="3" width="5" height="5" rx="1"/><rect x="16" y="3" width="5" height="5" rx="1"/><rect x="3" y="9.5" width="5" height="5" rx="1"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><rect x="16" y="9.5" width="5" height="5" rx="1"/><rect x="3" y="16" width="5" height="5" rx="1"/><rect x="9.5" y="16" width="5" height="5" rx="1"/><rect x="16" y="16" width="5" height="5" rx="1"/></svg>',
    large:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="1.3"/><rect x="13" y="3" width="8" height="8" rx="1.3"/><rect x="3" y="13" width="8" height="8" rx="1.3"/><rect x="13" y="13" width="8" height="8" rx="1.3"/></svg>'
  };

  const style=document.createElement('style');
  style.id='v47MobileNavigationStyles';
  style.textContent=`
#mobileAppNav,#mobileQuickActions,#mobileMoreSheet,#mobileGrowthPicker{display:none}

/* v4.8 Plants view selector */
.v48-plant-viewbar{display:flex;align-items:center;justify-content:flex-end;gap:9px;margin:0 0 12px}
.v48-plant-viewbar-label{color:#82958d;font-size:11px;font-weight:750;letter-spacing:.08em;text-transform:uppercase}
.v48-plant-view-buttons{display:inline-flex;gap:3px;padding:3px;border:1px solid #2b4238;border-radius:12px;background:#101c18}
.v48-plant-view-btn{width:39px;height:35px;display:grid;place-items:center;padding:0;border:0;border-radius:9px;background:transparent;color:#71877d;cursor:pointer;-webkit-tap-highlight-color:transparent}
.v48-plant-view-btn:hover{color:#dce8e2;background:#192b24}
.v48-plant-view-btn[data-active="1"]{color:#152017;background:#d5be85}
.v48-plant-view-btn svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.v48-plant-view-btn[aria-label="Compact grid"] svg rect,.v48-plant-view-btn[aria-label="Large grid"] svg rect{fill:currentColor;stroke:none}

#plantGrid[data-v48-view="large"]{grid-template-columns:repeat(3,1fr);gap:16px}
#plantGrid[data-v48-view="list"]{grid-template-columns:1fr;gap:10px}
#plantGrid[data-v48-view="list"] .plant-card{display:grid;grid-template-columns:132px minmax(0,1fr);align-items:stretch;min-height:118px;transform:none}
#plantGrid[data-v48-view="list"] .plant-photo{width:132px;height:100%;min-height:118px;aspect-ratio:auto;object-fit:cover}
#plantGrid[data-v48-view="list"] .plant-body{min-width:0;padding:12px 14px}
#plantGrid[data-v48-view="list"] .plant-top h3{font-size:19px}
#plantGrid[data-v48-view="list"] .chips{margin:9px 0}
#plantGrid[data-v48-view="list"] .care-line{padding-top:9px}

#plantGrid[data-v48-view="compact"]{grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:9px}
#plantGrid[data-v48-view="compact"] .plant-card{position:relative;min-width:0;border-radius:12px;overflow:hidden;transform:none;background:#0d1714}
#plantGrid[data-v48-view="compact"] .plant-photo{display:block;width:100%;aspect-ratio:1/1;object-fit:cover}
#plantGrid[data-v48-view="compact"] .plant-body{position:absolute;z-index:2;left:0;right:0;bottom:0;min-width:0;padding:30px 8px 8px;background:linear-gradient(transparent,rgba(4,9,7,.82));pointer-events:none}
#plantGrid[data-v48-view="compact"] .plant-top{display:block;min-width:0}
#plantGrid[data-v48-view="compact"] .plant-top h3{margin:0;overflow:hidden;color:#fff;font-family:Inter,ui-sans-serif,system-ui,sans-serif;font-size:12px;font-weight:780;line-height:1.15;text-overflow:ellipsis;white-space:nowrap;text-shadow:0 1px 4px rgba(0,0,0,.7)}
#plantGrid[data-v48-view="compact"] .plant-sub,#plantGrid[data-v48-view="compact"] .chips,#plantGrid[data-v48-view="compact"] .care-line,#plantGrid[data-v48-view="compact"] .status{display:none!important}
#plantGrid .empty{grid-column:1/-1}

@media(max-width:900px) and (min-width:701px){
  #plantGrid[data-v48-view="large"]{grid-template-columns:repeat(2,1fr)}
  #plantGrid[data-v48-view="compact"]{grid-template-columns:repeat(4,1fr)}
}

@media(max-width:700px){
  /* iPhone / PWA safe areas: keep interactive header controls below the Dynamic Island. */
  .topbar{
    min-height:68px!important;
    padding-top:max(10px,env(safe-area-inset-top))!important;
    padding-right:max(14px,env(safe-area-inset-right))!important;
    padding-bottom:10px!important;
    padding-left:max(14px,env(safe-area-inset-left))!important;
  }
  .auth-gate{
    padding-top:max(20px,calc(env(safe-area-inset-top) + 10px))!important;
    padding-right:max(20px,env(safe-area-inset-right))!important;
    padding-bottom:max(20px,env(safe-area-inset-bottom))!important;
    padding-left:max(20px,env(safe-area-inset-left))!important;
  }

  body.v47-mobile-nav-ready .shell{padding-bottom:calc(104px + env(safe-area-inset-bottom))!important}
  body.v47-mobile-nav-ready .tabs{display:none!important}

  .v48-plant-viewbar{margin:0 0 10px}
  .v48-plant-viewbar-label{display:none}
  .v48-plant-view-buttons{margin-left:auto}
  .v48-plant-view-btn{width:41px;height:37px}

  #plantGrid[data-v48-view="compact"]{grid-template-columns:repeat(3,minmax(0,1fr));gap:3px;margin-left:-12px;margin-right:-12px}
  #plantGrid[data-v48-view="compact"] .plant-card{border:0;border-radius:0}
  #plantGrid[data-v48-view="compact"] .plant-body{padding:26px 6px 6px}
  #plantGrid[data-v48-view="compact"] .plant-top h3{font-size:10px}

  #plantGrid[data-v48-view="large"]{grid-template-columns:1fr;gap:14px}
  #plantGrid[data-v48-view="list"]{gap:8px}
  #plantGrid[data-v48-view="list"] .plant-card{grid-template-columns:92px minmax(0,1fr);min-height:92px;border-radius:14px}
  #plantGrid[data-v48-view="list"] .plant-photo{width:92px;min-height:92px}
  #plantGrid[data-v48-view="list"] .plant-body{padding:9px 10px}
  #plantGrid[data-v48-view="list"] .plant-top h3{font-size:16px;line-height:1.15}
  #plantGrid[data-v48-view="list"] .plant-sub{font-size:10px;margin-top:3px}
  #plantGrid[data-v48-view="list"] .chips{gap:4px;margin:7px 0}
  #plantGrid[data-v48-view="list"] .chip{padding:3px 6px;font-size:9px}
  #plantGrid[data-v48-view="list"] .care-line{display:none}
  #plantGrid[data-v48-view="list"] .status{padding:4px 6px;font-size:9px}

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

  function plantViewStorageKey(){return `jasperPlantRoom.plantsView.${mq.matches?'mobile':'desktop'}`;}
  function defaultPlantView(){return mq.matches?'compact':'large';}
  function savedPlantView(){
    try{
      const value=localStorage.getItem(plantViewStorageKey());
      return ['list','compact','large'].includes(value)?value:defaultPlantView();
    }catch(_e){return defaultPlantView();}
  }
  function applyPlantView(mode,persist){
    if(!['list','compact','large'].includes(mode))mode=defaultPlantView();
    const grid=document.getElementById('plantGrid');
    if(grid)grid.dataset.v48View=mode;
    document.querySelectorAll('[data-v48-plant-view]').forEach(btn=>{
      const active=btn.dataset.v48PlantView===mode;
      btn.dataset.active=active?'1':'0';
      btn.setAttribute('aria-pressed',active?'true':'false');
    });
    if(persist){
      try{localStorage.setItem(plantViewStorageKey(),mode);}catch(_e){}
    }
  }
  function ensurePlantViewControls(){
    const view=document.getElementById('plantsView');
    const toolbar=view?.querySelector('.toolbar');
    if(!view||!toolbar)return null;
    let bar=document.getElementById('plantViewSwitcher');
    if(!bar){
      bar=document.createElement('div');
      bar.id='plantViewSwitcher';
      bar.className='v48-plant-viewbar';
      bar.innerHTML=`<span class="v48-plant-viewbar-label">View</span><div class="v48-plant-view-buttons" role="group" aria-label="Plant view">
        <button type="button" class="v48-plant-view-btn" data-v48-plant-view="list" aria-label="List" title="List">${plantViewIcons.list}</button>
        <button type="button" class="v48-plant-view-btn" data-v48-plant-view="compact" aria-label="Compact grid" title="Compact grid">${plantViewIcons.compact}</button>
        <button type="button" class="v48-plant-view-btn" data-v48-plant-view="large" aria-label="Large grid" title="Large grid">${plantViewIcons.large}</button>
      </div>`;
      view.insertBefore(bar,toolbar);
      bar.querySelectorAll('[data-v48-plant-view]').forEach(btn=>{
        btn.addEventListener('click',()=>applyPlantView(btn.dataset.v48PlantView,true));
      });
    }
    return bar;
  }
  function syncPlantView(){
    ensurePlantViewControls();
    applyPlantView(savedPlantView(),false);
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
    syncPlantView();
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
    syncPlantView();
    scheduleSync();
    document.addEventListener('click',event=>{
      if(event.target.closest('.tab,[data-view],#closePlant'))setTimeout(scheduleSync,0);
    },true);
    const observer=new MutationObserver(scheduleSync);
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','open']});
    if(typeof mq.addEventListener==='function')mq.addEventListener('change',()=>{
      syncPlantView();
      scheduleSync();
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();

/* Mobile plant profile: back button + interactive swipe from the left edge. */
(function(){
  const css=`
@media(max-width:700px){
  #plantDialog{--v49-plant-backdrop:.72}
  #plantDialog::backdrop{background:rgba(2,7,5,var(--v49-plant-backdrop))}
  #plantDialog.v49-plant-dragging #plantDialogBody{box-shadow:-18px 0 42px rgba(0,0,0,.34)}
  #plantDialog.v49-plant-settling #plantDialogBody{transition:transform 190ms cubic-bezier(.2,.8,.2,1)}
  #plantDialog .v49-plant-back{
    display:grid;place-items:center;flex:0 0 auto;width:44px;height:44px;padding:0;
    border:0;border-radius:50%;background:rgba(255,255,255,.08);color:#eaf2ee;
    font:400 30px/1 system-ui,sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent
  }
  #plantDialog .modal-head>div{flex:1 1 auto;min-width:0}
}
@media(min-width:701px){#plantDialog .v49-plant-back{display:none!important}}
`;
  const style=document.createElement('style');
  style.id='v49PlantEdgeBackStyles';style.textContent=css;
  document.getElementById(style.id)?.remove();document.head.appendChild(style);

  const dlg=document.getElementById('plantDialog');
  if(!dlg)return;
  const reduceMotion=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const closePlant=()=>{
    if(typeof closePhotoLightbox==='function')closePhotoLightbox();
    if(dlg.open)dlg.close();
    document.body.classList.remove('v47-plant-open');
  };
  function reset(){
    dlg.classList.remove('v49-plant-dragging','v49-plant-settling');
    const surface=document.getElementById('plantDialogBody');
    if(surface)surface.style.transform='';
    dlg.style.setProperty('--v49-plant-backdrop','.72');
  }
  function ensureBackButton(){
    const head=dlg.querySelector('.modal-head');
    if(!head||head.querySelector('.v49-plant-back'))return;
    const back=document.createElement('button');
    back.type='button';back.className='v49-plant-back';back.setAttribute('aria-label','Back to plants grid');back.textContent='‹';
    back.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();closePlant();});
    head.insertBefore(back,head.firstChild);
  }
  new MutationObserver(ensureBackButton).observe(dlg,{childList:true,subtree:true});
  ensureBackButton();

  let gesture=null;
  dlg.addEventListener('touchstart',e=>{
    if(!dlg.open||e.touches.length!==1)return;
    const t=e.touches[0];if(t.clientX>56)return;
    gesture={startX:t.clientX,startY:t.clientY,lastX:t.clientX,lastTime:performance.now(),dx:0,locked:null};
  },{capture:true,passive:true});
  dlg.addEventListener('touchmove',e=>{
    if(!gesture||e.touches.length!==1)return;
    const t=e.touches[0],dx=Math.max(0,t.clientX-gesture.startX),dy=t.clientY-gesture.startY;
    if(gesture.locked===null&&(dx>7||Math.abs(dy)>7))gesture.locked=dx>Math.abs(dy)*1.1?'back':'scroll';
    if(gesture.locked!=='back')return;
    e.preventDefault();e.stopPropagation();gesture.dx=dx;gesture.lastX=t.clientX;gesture.lastTime=performance.now();
    const surface=document.getElementById('plantDialogBody');
    dlg.classList.add('v49-plant-dragging');if(surface)surface.style.transform=`translate3d(${dx}px,0,0)`;
    dlg.style.setProperty('--v49-plant-backdrop',String(Math.max(.08,.72*(1-dx/window.innerWidth))));
  },{capture:true,passive:false});
  dlg.addEventListener('touchend',e=>{
    if(!gesture)return;
    const active=gesture.locked==='back',t=e.changedTouches[0],finalX=t?.clientX??gesture.lastX;
    const dx=Math.max(gesture.dx,finalX-gesture.startX),elapsed=Math.max(1,performance.now()-gesture.lastTime),velocity=(finalX-gesture.lastX)/elapsed;
    gesture=null;if(!active)return;
    e.preventDefault();e.stopImmediatePropagation();dlg.classList.remove('v49-plant-dragging');dlg.classList.add('v49-plant-settling');
    const dismiss=dx>=Math.min(120,window.innerWidth*.28)||(dx>55&&velocity>.45);
    const surface=document.getElementById('plantDialogBody');
    if(dismiss){
      if(surface)surface.style.transform='translate3d(105vw,0,0)';dlg.style.setProperty('--v49-plant-backdrop','0');
      const finish=()=>{reset();closePlant();};
      if(reduceMotion())finish();else setTimeout(finish,190);
    }else{
      if(surface)surface.style.transform='translate3d(0,0,0)';dlg.style.setProperty('--v49-plant-backdrop','.72');
      if(reduceMotion())reset();else setTimeout(reset,190);
    }
  },{capture:true,passive:false});
  dlg.addEventListener('touchcancel',()=>{gesture=null;reset();},{capture:true,passive:true});
  dlg.addEventListener('close',reset);
})();

/* Full-screen photo: edge-swipe back one level to the open plant profile. */
(function(){
  const css=`
@media(max-width:700px){
  #photoLightbox,#growthPhotoViewer{--v492-photo-x:0px;--v492-photo-backdrop:.97}
  #photoLightbox::backdrop,#growthPhotoViewer::backdrop{background:rgba(3,7,6,var(--v492-photo-backdrop))}
  #photoLightbox.v492-photo-moving>*:not(.v49-photo-back),#growthPhotoViewer.v492-photo-moving>*:not(.v49-photo-back){transform:translate3d(var(--v492-photo-x),0,0)}
  #photoLightbox.v492-photo-settling>*:not(.v49-photo-back),#growthPhotoViewer.v492-photo-settling>*:not(.v49-photo-back){transition:transform 190ms cubic-bezier(.2,.8,.2,1)}
  .v492-photo-back{display:grid;place-items:center;flex:0 0 auto;width:44px;height:44px;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,.13);color:#fff;font:400 30px/1 system-ui,sans-serif;cursor:pointer}
  #photoLightbox .photo-lightbox-title,#growthPhotoViewer .growth-view-title{flex:1 1 auto;min-width:0}
}
@media(min-width:701px){.v492-photo-back{display:none!important}}
`;
  const style=document.createElement('style');
  style.id='v492PhotoEdgeBackStyles';style.textContent=css;document.head.appendChild(style);
  const reduceMotion=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  function enhance(dlg){
    if(!dlg||dlg.dataset.v492PhotoBack==='1')return;
    dlg.dataset.v492PhotoBack='1';
    const close=()=>dlg.querySelector('#photoLightboxClose,#growthViewClose')?.click();
    const top=dlg.querySelector('.photo-lightbox-top,.growth-view-top');
    if(top&&!top.querySelector('.v492-photo-back')){
      const back=document.createElement('button');
      back.type='button';back.className='v492-photo-back';back.setAttribute('aria-label','Back to plant gallery');back.textContent='‹';
      back.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();close();});top.insertBefore(back,top.firstChild);
    }
    const reset=()=>{
      dlg.classList.remove('v492-photo-moving','v492-photo-settling');
      dlg.style.setProperty('--v492-photo-x','0px');dlg.style.setProperty('--v492-photo-backdrop','.97');
    };
    let gesture=null;
    dlg.addEventListener('touchstart',e=>{
      if(!dlg.open||e.touches.length!==1)return;
      const t=e.touches[0];if(t.clientX>56)return;
      gesture={startX:t.clientX,startY:t.clientY,lastX:t.clientX,lastTime:performance.now(),dx:0,locked:null};
    },{capture:true,passive:true});
    dlg.addEventListener('touchmove',e=>{
      if(!gesture||e.touches.length!==1)return;
      const t=e.touches[0],dx=Math.max(0,t.clientX-gesture.startX),dy=t.clientY-gesture.startY;
      if(gesture.locked===null&&(dx>7||Math.abs(dy)>7))gesture.locked=dx>Math.abs(dy)*1.1?'back':'scroll';
      if(gesture.locked!=='back')return;
      e.preventDefault();e.stopPropagation();gesture.dx=dx;gesture.lastX=t.clientX;gesture.lastTime=performance.now();
      dlg.classList.add('v492-photo-moving');dlg.style.setProperty('--v492-photo-x',`${dx}px`);
      dlg.style.setProperty('--v492-photo-backdrop',String(Math.max(.08,.97*(1-dx/window.innerWidth))));
    },{capture:true,passive:false});
    dlg.addEventListener('touchend',e=>{
      if(!gesture)return;
      const active=gesture.locked==='back',t=e.changedTouches[0],finalX=t?.clientX??gesture.lastX;
      const dx=Math.max(gesture.dx,finalX-gesture.startX),elapsed=Math.max(1,performance.now()-gesture.lastTime),velocity=(finalX-gesture.lastX)/elapsed;
      gesture=null;if(!active)return;
      e.preventDefault();e.stopImmediatePropagation();dlg.classList.remove('v492-photo-moving');dlg.classList.add('v492-photo-moving','v492-photo-settling');
      const dismiss=dx>=Math.min(120,window.innerWidth*.28)||(dx>55&&velocity>.45);
      if(dismiss){
        dlg.style.setProperty('--v492-photo-x','105vw');dlg.style.setProperty('--v492-photo-backdrop','0');
        const finish=()=>{reset();close();};if(reduceMotion())finish();else setTimeout(finish,190);
      }else{
        dlg.style.setProperty('--v492-photo-x','0px');dlg.style.setProperty('--v492-photo-backdrop','.97');
        if(reduceMotion())reset();else setTimeout(reset,190);
      }
    },{capture:true,passive:false});
    dlg.addEventListener('touchcancel',()=>{gesture=null;reset();},{capture:true,passive:true});
    dlg.addEventListener('close',reset);
  }
  const scan=()=>{enhance(document.getElementById('photoLightbox'));enhance(document.getElementById('growthPhotoViewer'));};
  scan();new MutationObserver(scan).observe(document.body,{childList:true});
})();
