/* Jasper's Plant Room v4.32.0 — seamless mobile photo carousel */
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

/* Dashboard: compact counters for Jasper's main plant groups. */
(function(){
  const css=`
#v414SpeciesStats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin:-20px 0 30px}
.v414-species-stat{min-width:0;padding:11px 12px;border:1px solid #294037;border-radius:14px;background:linear-gradient(145deg,#14251f,#101d19);cursor:pointer;-webkit-tap-highlight-color:transparent}
.v414-species-stat:hover{border-color:#557064;background:linear-gradient(145deg,#192d25,#12221c)}
.v414-species-stat:focus-visible{outline:2px solid #d5be85;outline-offset:2px}
.v414-species-stat strong{display:block;color:#e9f1ed;font-size:21px;line-height:1;font-variant-numeric:tabular-nums}
.v414-species-stat span{display:block;margin-top:6px;color:#8fa39a;font-size:10px;font-weight:780;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.v414-species-stat[data-group="anthurium"]{border-color:#3b4b42}.v414-species-stat[data-group="anthurium"] strong{color:#d8c49a}
.v414-species-stat[data-group="alocasia"] strong{color:#a8cdb9}.v414-species-stat[data-group="philodendron"] strong{color:#b6c9a4}
@media(min-width:701px){
  #v414SpeciesStats{gap:8px;margin:-22px 0 30px}
  .v414-species-stat{display:flex;align-items:center;gap:9px;padding:9px 12px;border-radius:12px}
  .v414-species-stat strong{font-size:18px}
  .v414-species-stat span{margin:0;font-size:10px}
}
@media(max-width:700px){
  #v414SpeciesStats{gap:5px;margin:-23px 0 24px}
  .v414-species-stat{padding:10px 7px;border-radius:12px;text-align:center}
  .v414-species-stat strong{font-size:19px}
  .v414-species-stat span{font-size:8.5px;letter-spacing:-.01em}
}
`;
  const style=document.createElement('style');style.id='v414SpeciesCounterStyles';style.textContent=css;document.head.appendChild(style);
  function renderSpeciesCounters(){
    const stats=document.getElementById('stats');if(!stats||typeof db==='undefined')return;
    let row=document.getElementById('v414SpeciesStats');
    if(!row){row=document.createElement('div');row.id='v414SpeciesStats';row.setAttribute('aria-label','Collection by plant group');stats.insertAdjacentElement('afterend',row);}
    const counts={anthurium:0,alocasia:0,philodendron:0,other:0};
    (db.plants||[]).forEach(p=>{
      const group=String(p.group||'').trim().toLowerCase();
      if(group.includes('anthurium'))counts.anthurium++;
      else if(group.includes('alocasia'))counts.alocasia++;
      else if(group.includes('philodendron'))counts.philodendron++;
      else counts.other++;
    });
    row.innerHTML=`<div class="v414-species-stat" role="button" tabindex="0" data-group="anthurium"><strong>${counts.anthurium}</strong><span>Anthurium</span></div><div class="v414-species-stat" role="button" tabindex="0" data-group="alocasia"><strong>${counts.alocasia}</strong><span>Alocasia</span></div><div class="v414-species-stat" role="button" tabindex="0" data-group="philodendron"><strong>${counts.philodendron}</strong><span>Philodendron</span></div><div class="v414-species-stat" role="button" tabindex="0" data-group="other"><strong>${counts.other}</strong><span>Others</span></div>`;
    row.querySelectorAll('.v414-species-stat').forEach(card=>{
      card.setAttribute('aria-label',`View ${card.querySelector('span').textContent} in Plants`);
      card.onclick=()=>openSpecies(card.dataset.group);
      card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openSpecies(card.dataset.group);}};
    });
  }
  const speciesOf=p=>{const group=String(p?.group||'').trim().toLowerCase();return group.includes('anthurium')?'anthurium':group.includes('alocasia')?'alocasia':group.includes('philodendron')?'philodendron':'other';};
  const labelOf={anthurium:'Anthurium',alocasia:'Alocasia',philodendron:'Philodendron',other:'Others'};
  let combinedOther=false;
  function filterRenderedSpecies(group){
    const grid=document.getElementById('plantGrid');if(!grid)return;
    grid.querySelectorAll('.plant-card[data-id]').forEach(card=>{
      const plant=(db.plants||[]).find(p=>String(p.cloudId)===String(card.dataset.id));
      if(speciesOf(plant)!==group)card.remove();
    });
    if(!grid.querySelector('.plant-card')&&!grid.querySelector('.empty'))grid.innerHTML=`<div class="empty">No ${labelOf[group].toLowerCase()} match the other filters.</div>`;
  }
  if(typeof renderPlants==='function'){
    const previousPlants=renderPlants;
    renderPlants=function(){
      const result=previousPlants.apply(this,arguments);
      if(combinedOther)filterRenderedSpecies('other');
      return result;
    };
  }
  function openSpecies(group){
    const select=document.getElementById('groupFilter'),tab=document.querySelector('[data-view="plants"]');
    if(!select||!tab)return;tab.click();
    [...select.options].filter(option=>option.value.startsWith('__v415_species_')).forEach(option=>option.remove());
    if(group==='other'){combinedOther=true;select.value='';}
    else{
      combinedOther=false;
      const existing=[...select.options].find(option=>String(option.value).trim().toLowerCase()===group);
      if(!existing)return;select.value=existing.value;
    }
    renderPlants();
    setTimeout(()=>document.getElementById('plantsView')?.scrollIntoView({behavior:'smooth',block:'start'}),20);
  }
  const groupFilter=document.getElementById('groupFilter');
  groupFilter?.querySelectorAll('option[value^="__v415_species_"]').forEach(option=>option.remove());
  groupFilter?.addEventListener('input',()=>{combinedOther=false;},{capture:true});
  if(typeof renderStats==='function'){
    const previous=renderStats;renderStats=function(){const result=previous.apply(this,arguments);renderSpeciesCounters();return result;};
  }
  renderSpeciesCounters();
})();

/* Dashboard date card: age of the newest Growth Progress photo. */
(function(){
  function renderGrowthUpdateAge(){
    const target=document.getElementById('snapshotText');if(!target||typeof db==='undefined')return;
    const dates=(db.photos||[]).filter(photo=>photo.kind==='growth').map(photo=>String(photo.photo_date||photo.created_at||'').slice(0,10)).filter(Boolean).sort();
    if(!dates.length){target.textContent='No growth photos yet';target.removeAttribute('title');return;}
    const latest=dates[dates.length-1],days=Math.max(0,Math.round((parseDate(isoToday())-parseDate(latest))/86400000));
    const age=days===0?'Today':days===1?'Yesterday':`${days} days ago`;
    target.textContent=`Last growth update · ${age}`;
    target.title=`Newest Growth Progress photo: ${fmt(latest)}`;
  }
  if(typeof renderStats==='function'){
    const previous=renderStats;renderStats=function(){const result=previous.apply(this,arguments);renderGrowthUpdateAge();return result;};
  }
  renderGrowthUpdateAge();
})();

/* Header: compact version label and account / backup dropdown. */
(function(){
  const VERSION='v4.32.0';
  const css=`
.top-actions{align-items:center}
#v416Version{flex:0 0 auto;padding:5px 8px;border:1px solid #2d463b;border-radius:999px;background:#12211b;color:#8fa39a;font-size:10px;font-weight:800;letter-spacing:.04em}
#v416HeaderMenu{position:relative;flex:0 0 auto}
#v416HeaderMenuButton{display:grid;place-items:center;width:40px;height:40px;padding:0;border:1px solid #334d42;border-radius:12px;background:#172820;color:#edf4f0;font-size:24px;line-height:1;cursor:pointer;-webkit-tap-highlight-color:transparent}
#v416HeaderMenuButton:hover,#v416HeaderMenuButton[aria-expanded="true"]{background:#20362d;border-color:#526d61}
#v416HeaderMenuPanel{position:absolute;z-index:2147483100;top:calc(100% + 9px);right:0;width:210px;padding:7px;border:1px solid #365045;border-radius:14px;background:#12211c;box-shadow:0 18px 48px rgba(0,0,0,.5)}
#v416HeaderMenuPanel[hidden]{display:none!important}
#v416HeaderMenuPanel .v416-menu-heading{padding:7px 9px 6px;color:#70857b;font-size:9px;font-weight:850;letter-spacing:.13em;text-transform:uppercase}
#v416HeaderMenuPanel>.ghost,#v416HeaderMenuPanel>.file-label{display:flex;width:100%;min-height:42px;align-items:center;box-sizing:border-box;margin:0;padding:0 10px;border:0;border-radius:9px;background:transparent;color:#dce7e1;font-size:12px;text-align:left;cursor:pointer}
body.owner-mode #v416HeaderMenuPanel>.admin-only{display:flex!important}
body:not(.owner-mode) #v416HeaderMenuPanel>.admin-only{display:none!important}
#v416HeaderMenuPanel>#adminLoginBtn{display:flex}
#v416HeaderMenuPanel>.ghost:hover,#v416HeaderMenuPanel>.file-label:hover{background:#1d322a}
#v416HeaderMenuPanel #signOutBtn{color:#efb0b0}
@media(max-width:700px){
  #v416Version{padding:4px 6px;font-size:8.5px}
  #v416HeaderMenuButton{width:40px;height:40px}
  #v416HeaderMenuPanel{position:fixed;top:max(68px,calc(env(safe-area-inset-top) + 58px));right:max(10px,env(safe-area-inset-right));width:min(230px,calc(100vw - 20px))}
}
`;
  const style=document.createElement('style');style.id='v416HeaderMenuStyles';style.textContent=css;document.head.appendChild(style);
  function init(){
    const host=document.querySelector('.top-actions');if(!host||document.getElementById('v416HeaderMenu'))return;
    const version=document.createElement('span');version.id='v416Version';version.textContent=VERSION;version.setAttribute('aria-label',`Plant Room version ${VERSION.slice(1)}`);
    const menu=document.createElement('div');menu.id='v416HeaderMenu';
    menu.innerHTML='<button type="button" id="v416HeaderMenuButton" aria-label="Account and backup menu" aria-expanded="false">⋮</button><div id="v416HeaderMenuPanel" role="menu" hidden><div class="v416-menu-heading">Account & backup</div></div>';
    host.append(version,menu);
    const panel=menu.querySelector('#v416HeaderMenuPanel'),button=menu.querySelector('#v416HeaderMenuButton');
    ['exportBtn','importLabel','signOutBtn','adminLoginBtn'].forEach(id=>{const item=document.getElementById(id);if(item)panel.appendChild(item);});
    const close=()=>{panel.hidden=true;button.setAttribute('aria-expanded','false');};
    const toggle=()=>{const opening=panel.hidden;panel.hidden=!opening;button.setAttribute('aria-expanded',String(opening));};
    button.onclick=e=>{e.stopPropagation();toggle();};
    panel.addEventListener('click',e=>e.stopPropagation());
    ['exportBtn','signOutBtn','adminLoginBtn'].forEach(id=>document.getElementById(id)?.addEventListener('click',close));
    document.getElementById('importInput')?.addEventListener('change',close);
    document.addEventListener('click',close);
    document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
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
    document.body.style.overflow='';
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
    const t=e.touches[0];if(t.clientX>24)return;
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
      reset();closePlant();
    }else{
      if(surface)surface.style.transform='translate3d(0,0,0)';dlg.style.setProperty('--v49-plant-backdrop','.72');
      if(reduceMotion())reset();else setTimeout(reset,190);
    }
  },{capture:true,passive:false});
  dlg.addEventListener('touchcancel',()=>{gesture=null;reset();},{capture:true,passive:true});
  dlg.addEventListener('close',()=>{
    reset();document.body.style.overflow='';document.body.classList.remove('v47-plant-open');
  });
  dlg.addEventListener('click',e=>{
    if(!e.target.closest('#closePlant'))return;
    gesture=null;reset();
    requestAnimationFrame(()=>{
      if(dlg.open)dlg.close();
      document.body.style.overflow='';
      document.body.classList.remove('v47-plant-open');
    });
  },true);
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
      if(dlg.dataset.v410Zoomed==='1'||dlg.dataset.v410Pinching==='1')return;
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
      if(dlg.dataset.v410Pinching==='1'){gesture=null;return;}
      const active=gesture.locked==='back',t=e.changedTouches[0],finalX=t?.clientX??gesture.lastX;
      const dx=Math.max(gesture.dx,finalX-gesture.startX),elapsed=Math.max(1,performance.now()-gesture.lastTime),velocity=(finalX-gesture.lastX)/elapsed;
      gesture=null;if(!active)return;
      e.preventDefault();e.stopImmediatePropagation();dlg.classList.remove('v492-photo-moving');dlg.classList.add('v492-photo-moving','v492-photo-settling');
      const dismiss=dx>=Math.min(120,window.innerWidth*.28)||(dx>55&&velocity>.45);
      if(dismiss){
        reset();close();
      }else{
        dlg.style.setProperty('--v492-photo-x','0px');dlg.style.setProperty('--v492-photo-backdrop','.97');
        if(reduceMotion())reset();else setTimeout(reset,190);
      }
    },{capture:true,passive:false});
    dlg.addEventListener('touchcancel',()=>{gesture=null;reset();},{capture:true,passive:true});
    dlg.addEventListener('close',()=>{
      reset();document.body.style.overflow='';
      if(dlg.id==='photoLightbox'&&typeof photoLightboxState!=='undefined')photoLightboxState.bodyOverflow='';
    });
    dlg.addEventListener('click',e=>{
      if(!e.target.closest('#photoLightboxClose,#growthViewClose'))return;
      gesture=null;reset();
      requestAnimationFrame(()=>{
        if(dlg.open)dlg.close();
        document.body.style.overflow='';
      });
    },true);
  }
  const scan=()=>{enhance(document.getElementById('photoLightbox'));enhance(document.getElementById('growthPhotoViewer'));};
  scan();new MutationObserver(scan).observe(document.body,{childList:true});
})();

/* Mobile plant profile: sticky Gallery / Growth / Details / Care sections. */
(function(){
  const mq=window.matchMedia('(max-width:700px)');
  const css=`
@media(max-width:700px){
  #plantDialog .profile-tabs{display:none!important}
  #plantDialog .v411-tabs{
    position:sticky;top:calc(58px + env(safe-area-inset-top));z-index:48;
    display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:3px;
    margin:0 -14px;padding:7px 10px 8px;background:rgba(15,26,23,.97);
    border-bottom:1px solid rgba(255,255,255,.07);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)
  }
  #plantDialog .v411-tab{
    position:relative;min-width:0;min-height:42px;padding:0 3px;border:0;border-radius:10px;
    background:transparent;color:#83978e;font:780 11px/1 system-ui,sans-serif;letter-spacing:.01em;
    -webkit-tap-highlight-color:transparent
  }
  #plantDialog .v411-tab[aria-selected="true"]{background:#1c3028;color:#f0f5f2}
  #plantDialog .v411-tab[aria-selected="true"]::after{
    content:'';position:absolute;left:22%;right:22%;bottom:4px;height:2px;border-radius:99px;background:#d5be85
  }
  #plantDialog .v411-tab-count{display:inline-block;margin-left:2px;color:#d5be85;font-size:9px;font-variant-numeric:tabular-nums}
  #plantDialog .v411-panel{display:none;min-height:calc(100dvh - 150px);padding-top:10px}
  #plantDialog .v411-panel[data-active="1"]{display:block}
  #plantDialog .v411-panel[data-v411-panel="gallery"]{padding-top:0}
  #plantDialog .v411-panel>.profile-panel{display:block!important;margin-bottom:18px}
  #plantDialog .v411-panel>.gallery-main-wrap{margin-top:0}
  #plantDialog .v411-section-title{margin:8px 0 3px;font-size:18px;line-height:1.2}
  #plantDialog .v411-section-note{margin:0 0 13px;color:#89a097;font-size:11px;line-height:1.4}
  #plantDialog .v411-care-details{display:block;margin:6px 0 14px;border-top:1px solid #263b33;border-bottom:1px solid #263b33}
  #plantDialog .v411-empty{margin:18px 0;padding:16px;border:1px dashed #30473e;border-radius:14px;color:#8ea198;text-align:center;font-size:12px}
  #plantDialog .v411-panel .chatgpt-share-row,#plantDialog .v411-panel #plantAiReviewPanel{margin-top:14px}
}
@media(min-width:701px){#plantDialog .v411-tabs{display:none!important}#plantDialog .v411-panel{display:block!important;min-height:0!important;padding:0!important}}
`;
  const style=document.createElement('style');style.id='v411TabbedPlantStyles';style.textContent=css;document.head.appendChild(style);
  const dlg=document.getElementById('plantDialog');
  if(!dlg)return;
  let queued=false;

  function sectionIntro(panel,title,note){
    if(panel.querySelector('.v411-section-title'))return;
    const h=document.createElement('h3');h.className='v411-section-title';h.textContent=title;
    const p=document.createElement('p');p.className='v411-section-note';p.textContent=note;
    panel.append(h,p);
  }
  function activate(inner,name,{scroll=true}={}){
    if(!['gallery','growth','details','care'].includes(name))name='gallery';
    inner.querySelectorAll('.v411-tab').forEach(tab=>{
      const active=tab.dataset.v411Tab===name;tab.setAttribute('aria-selected',active?'true':'false');tab.tabIndex=active?0:-1;
    });
    inner.querySelectorAll('.v411-panel').forEach(panel=>panel.dataset.active=panel.dataset.v411Panel===name?'1':'0');
    if(scroll){
      const tabs=inner.querySelector('.v411-tabs');
      requestAnimationFrame(()=>tabs?.scrollIntoView({block:'start',behavior:'auto'}));
    }
  }
  function build(inner){
    const head=inner.querySelector('.modal-head');if(!head)return false;
    let tabs=inner.querySelector('.v411-tabs');
    if(!tabs){
      const oldTabs=inner.querySelector('.profile-tabs');
      const growthCount=oldTabs?.querySelector('[data-profile-tab="growth"] .chip')?.textContent?.trim()||'';
      const initial=oldTabs?.querySelector('.profile-tab.active')?.dataset.profileTab||'gallery';
      tabs=document.createElement('div');tabs.className='v411-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Plant profile sections');
      tabs.innerHTML=`<button type="button" class="v411-tab" data-v411-tab="gallery" role="tab">Gallery</button><button type="button" class="v411-tab" data-v411-tab="growth" role="tab">Growth${growthCount?` <span class="v411-tab-count">${growthCount}</span>`:''}</button><button type="button" class="v411-tab" data-v411-tab="details" role="tab">Details</button><button type="button" class="v411-tab" data-v411-tab="care" role="tab">Care</button>`;
      head.insertAdjacentElement('afterend',tabs);
      const panels=['gallery','growth','details','care'].map(name=>{
        const panel=document.createElement('section');panel.className='v411-panel';panel.dataset.v411Panel=name;panel.setAttribute('role','tabpanel');tabs.insertAdjacentElement('afterend',panel);
        return panel;
      });
      tabs.after(...panels);
      tabs.querySelectorAll('.v411-tab').forEach(tab=>tab.addEventListener('click',()=>activate(inner,tab.dataset.v411Tab)));
      activate(inner,initial,{scroll:false});
      inner.dataset.v411Structured='1';
    }else if(tabs.previousElementSibling!==head){
      head.insertAdjacentElement('afterend',tabs);
    }
    return true;
  }
  function moveContent(inner){
    const gallery=inner.querySelector('[data-v411-panel="gallery"]');
    const growth=inner.querySelector('[data-v411-panel="growth"]');
    const details=inner.querySelector('[data-v411-panel="details"]');
    const care=inner.querySelector('[data-v411-panel="care"]');
    if(!gallery||!growth||!details||!care)return;
    const hero=inner.querySelector('.gallery-main-wrap');if(hero&&hero.parentElement!==gallery)gallery.appendChild(hero);
    const caption=inner.querySelector('#mainPhotoCaption');if(caption&&caption.parentElement!==gallery)gallery.appendChild(caption);
    const galleryPanel=inner.querySelector('.profile-panel[data-panel="gallery"]');if(galleryPanel&&galleryPanel.parentElement!==gallery)gallery.appendChild(galleryPanel);
    const growthPanel=inner.querySelector('.profile-panel[data-panel="growth"]');if(growthPanel&&growthPanel.parentElement!==growth)growth.appendChild(growthPanel);

    if(!details.querySelector('.v411-section-title'))sectionIntro(details,'Plant details','Pot, medium, location, lighting and growing environment.');
    const detailGrid=inner.querySelector('.detail-grid');
    if(!care.querySelector('.v411-section-title'))sectionIntro(care,'Care','Latest checks, care notes and plant actions.');
    let careDetails=care.querySelector('.v411-care-details');
    if(!careDetails){careDetails=document.createElement('div');careDetails.className='v411-care-details';care.appendChild(careDetails);}
    if(detailGrid){
      detailGrid.querySelectorAll('.detail').forEach(row=>{
        const label=row.querySelector('span')?.textContent?.trim().toLowerCase();
        if(label==='last care'||label==='next check')careDetails.appendChild(row);
      });
      if(detailGrid.parentElement!==details)details.appendChild(detailGrid);
    }
    const rule=inner.querySelector('.rule-box');if(rule&&rule.parentElement!==care)care.appendChild(rule);
    const actions=inner.querySelector('.quick-actions');if(actions&&actions.parentElement!==care)care.appendChild(actions);
    inner.querySelectorAll('.chatgpt-share-row,#plantAiReviewPanel').forEach(el=>{if(el.parentElement!==care)care.appendChild(el);});
    care.querySelector('.v411-empty')?.remove();
    const meaningful=[...care.children].some(el=>!el.classList.contains('v411-section-title')&&!el.classList.contains('v411-section-note')&&!(el.classList.contains('v411-care-details')&&!el.children.length));
    if(!meaningful){const empty=document.createElement('div');empty.className='v411-empty';empty.textContent='No care information has been added yet.';care.appendChild(empty);}
    careDetails.hidden=!careDetails.children.length;
  }
  function sync(){
    queued=false;if(!mq.matches||!dlg.open)return;
    const inner=dlg.querySelector('.dialog-inner');if(!inner||!build(inner))return;
    moveContent(inner);
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(sync);}
  new MutationObserver(schedule).observe(dlg,{childList:true,subtree:true});
  dlg.addEventListener('close',()=>{queued=false;});
  if(typeof mq.addEventListener==='function')mq.addEventListener('change',schedule);
  schedule();
})();

/* Reliable long-hold image actions: avoid Safari text-selection menus. */
(function(){
  const css=`
@media(max-width:700px){
  #v413ImageActions{width:100%;max-width:none;margin:auto 0 0;padding:0;border:0;background:transparent;color:#edf4f0}
  #v413ImageActions::backdrop{background:rgba(0,0,0,.68);backdrop-filter:blur(3px)}
  #v413ImageActions .v413-image-sheet{box-sizing:border-box;width:100%;padding:9px 12px max(14px,env(safe-area-inset-bottom));border:1px solid #30483e;border-bottom:0;border-radius:23px 23px 0 0;background:#13221d;box-shadow:0 -18px 46px rgba(0,0,0,.45)}
  #v413ImageActions .v413-image-grab{width:40px;height:4px;margin:2px auto 13px;border-radius:99px;background:#4b6259}
  #v413ImageActions .v413-image-title{padding:0 5px 11px}
  #v413ImageActions .v413-image-title strong{display:block;font-size:16px}
  #v413ImageActions .v413-image-title span{display:block;margin-top:3px;color:#8fa39a;font-size:11px}
  #v413ImageActions .v413-image-action{width:100%;min-height:51px;margin:0 0 7px;padding:0 14px;border:1px solid #304b3f;border-radius:13px;background:#1a2d26;color:#edf4f0;text-align:left;font-size:14px;font-weight:760}
  #v413ImageActions .v413-image-action:disabled{opacity:.55}
  #v413ImageActions .v413-image-cancel{text-align:center;color:#a9bbb3;background:#101b17}
}
`;
  const style=document.createElement('style');style.id='v413ImageActionStyles';style.textContent=css;document.head.appendChild(style);
  let source='';
  function ensureSheet(){
    let dlg=document.getElementById('v413ImageActions');if(dlg)return dlg;
    dlg=document.createElement('dialog');dlg.id='v413ImageActions';dlg.setAttribute('aria-label','Image actions');
    dlg.innerHTML='<div class="v413-image-sheet"><div class="v413-image-grab"></div><div class="v413-image-title"><strong>Photo actions</strong><span>Save, share or copy this original image.</span></div><button type="button" class="v413-image-action" id="v413ImageSave">Save / Share image</button><button type="button" class="v413-image-action" id="v413ImageCopy">Copy image</button><button type="button" class="v413-image-action v413-image-cancel" id="v413ImageCancel">Cancel</button></div>';
    document.body.appendChild(dlg);
    dlg.querySelector('#v413ImageCancel').onclick=()=>dlg.close();
    dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close();});
    dlg.addEventListener('cancel',e=>{e.preventDefault();dlg.close();});
    dlg.querySelector('#v413ImageSave').onclick=async()=>{
      const btn=dlg.querySelector('#v413ImageSave');btn.disabled=true;btn.textContent='Preparing image…';
      try{if(typeof window.plantShareOrSaveImage==='function')await window.plantShareOrSaveImage(source,'plant-photo');}
      finally{btn.disabled=false;btn.textContent='Save / Share image';}
    };
    dlg.querySelector('#v413ImageCopy').onclick=async()=>{
      const btn=dlg.querySelector('#v413ImageCopy');btn.disabled=true;btn.textContent='Copying image…';
      try{
        const response=await fetch(source,{mode:'cors'});if(!response.ok)throw new Error('Image download failed');
        const blob=await response.blob();
        if(!navigator.clipboard?.write||typeof ClipboardItem==='undefined')throw new Error('Image copying is unavailable in this browser');
        let copyBlob=blob;
        if(blob.type!=='image/png'){
          const bitmap=await createImageBitmap(blob),canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
          const ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0);bitmap.close?.();
          copyBlob=await new Promise((resolve,reject)=>canvas.toBlob(x=>x?resolve(x):reject(new Error('Could not convert image')),'image/png'));
        }
        await navigator.clipboard.write([new ClipboardItem({'image/png':copyBlob})]);
        btn.textContent='Copied';setTimeout(()=>{btn.textContent='Copy image';btn.disabled=false;},900);return;
      }catch(error){
        console.warn('Copy image failed',error);alert('Safari could not copy this image directly. Use Save / Share image instead.');
      }
      btn.disabled=false;btn.textContent='Copy image';
    };
    return dlg;
  }
  function openSheet(src){source=src||'';if(!source)return;const dlg=ensureSheet();if(!dlg.open)dlg.showModal();}
  function enhance(dlg){
    if(!dlg||dlg.dataset.v413ImageHold==='1')return;
    const stage=dlg.querySelector('#photoLightboxStage,#growthViewStage'),img=dlg.querySelector('#photoLightboxImg,#growthViewImg');
    if(!stage||!img)return;dlg.dataset.v413ImageHold='1';
    let timer=0,start=null;
    const cancel=()=>{clearTimeout(timer);timer=0;start=null;};
    stage.addEventListener('contextmenu',e=>{if(window.matchMedia('(hover:none) and (pointer:coarse)').matches){e.preventDefault();e.stopImmediatePropagation();}},true);
    stage.addEventListener('touchstart',e=>{
      cancel();if(e.touches.length!==1||dlg.dataset.v410Zoomed==='1')return;
      if(e.target===img)e.preventDefault();
      const t=e.touches[0];start={x:t.clientX,y:t.clientY};
      timer=setTimeout(()=>{timer=0;start=null;navigator.vibrate?.(18);openSheet(img.currentSrc||img.src);},520);
    },{capture:true,passive:false});
    stage.addEventListener('touchmove',e=>{
      if(!start||e.touches.length!==1){cancel();return;}
      const t=e.touches[0];if(Math.hypot(t.clientX-start.x,t.clientY-start.y)>9)cancel();
    },{capture:true,passive:true});
    stage.addEventListener('touchend',cancel,{capture:true,passive:true});
    stage.addEventListener('touchcancel',cancel,{capture:true,passive:true});
    dlg.addEventListener('close',cancel);
  }
  const scan=()=>{enhance(document.getElementById('photoLightbox'));enhance(document.getElementById('growthPhotoViewer'));};
  scan();new MutationObserver(scan).observe(document.body,{childList:true});
})();

/* Dashboard: one-tap care actions on each owner check-queue card. */
(function(){
  const css=`
body.owner-mode #queue .queue-item.v413-care-ready{grid-template-columns:64px minmax(0,1fr) auto;cursor:default}
#queue .v413-care-actions{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr .72fr;gap:7px;padding-top:9px;border-top:1px solid #263c33}
#queue .v413-care-action{min-height:43px;padding:0 8px;border:1px solid #345044;border-radius:11px;background:#192d25;color:#e9f1ed;font-size:12px;font-weight:800}
#queue .v413-care-action[data-v413-care="water"]{border-color:#d5be85;background:#d5be85;color:#152017}
#queue .v413-care-action:disabled{opacity:.55}
@media(min-width:701px){
  #queue .v413-care-actions{grid-column:2/-1;grid-template-columns:repeat(3,minmax(92px,126px));justify-content:end;gap:6px;padding-top:8px}
  #queue .v413-care-action{min-height:36px;border-radius:9px;font-size:11px}
}
@media(max-width:700px){
  body.owner-mode #queue .queue-item.v413-care-ready{grid-template-columns:52px minmax(0,1fr) auto;gap:10px;padding:10px}
  #queue .v413-care-actions{gap:5px;padding-top:8px}
  #queue .v413-care-action{min-height:46px;padding:0 5px;font-size:10.5px}
}
`;
  const style=document.createElement('style');style.id='v413DashboardCareStyles';style.textContent=css;document.head.appendChild(style);
  async function runCare(card,p,type,button){
    if(!p||typeof addCare!=='function')return;
    if(type==='custom'){if(typeof openLogDialog==='function')openLogDialog(p.cloudId);return;}
    const today=isoToday();let action='',next=null;
    if(type==='moist'){action='Checked — still moist';next=addDays(today,1);}
    if(type==='water'){action='Watered';next=p.checkDays?addDays(today,p.checkDays):null;}
    const buttons=card.querySelectorAll('.v413-care-action');buttons.forEach(x=>x.disabled=true);button.textContent='Saving…';
    try{await addCare(p,action,'',next);}
    catch(error){console.error('Dashboard care action failed',error);alert(error?.message||'Could not save this care entry.');buttons.forEach(x=>x.disabled=false);button.textContent=type==='water'?'Watered':'Still moist';}
  }
  function addUpcomingCountdown(card,p){
    if(statusOf(p)!=='upcoming'||!p.nextCheck)return;
    const badge=card.querySelector('.status');if(!badge)return;
    const days=Math.max(1,Math.round((parseDate(p.nextCheck)-parseDate(isoToday()))/86400000));
    badge.textContent=`Upcoming · ${days} day${days===1?'':'s'}`;
    badge.setAttribute('aria-label',`Upcoming check in ${days} day${days===1?'':'s'}`);
  }
  function enhanceQueue(){
    if(!document.body.classList.contains('owner-mode')||typeof db==='undefined')return;
    document.querySelectorAll('#queue .queue-item[data-id]').forEach(card=>{
      if(card.dataset.v413Care==='1')return;
      const p=(db.plants||[]).find(x=>String(x.cloudId)===String(card.dataset.id));if(!p)return;
      addUpcomingCountdown(card,p);
      card.dataset.v413Care='1';card.classList.add('v413-care-ready');
      const actions=document.createElement('div');actions.className='v413-care-actions';
      actions.innerHTML='<button type="button" class="v413-care-action" data-v413-care="moist">Still moist</button><button type="button" class="v413-care-action" data-v413-care="water">Watered</button><button type="button" class="v413-care-action" data-v413-care="custom">Custom</button>';
      actions.querySelectorAll('button').forEach(button=>button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();runCare(card,p,button.dataset.v413Care,button);}));
      card.appendChild(actions);
      card.querySelector('.queue-thumb')?.addEventListener('click',e=>{e.stopPropagation();openPlant(p.cloudId);});
      card.querySelector('.queue-main')?.addEventListener('click',e=>{e.stopPropagation();openPlant(p.cloudId);});
    });
  }
  if(typeof renderQueue==='function'){
    const previous=renderQueue;renderQueue=function(){const result=previous.apply(this,arguments);enhanceQueue();return result;};
  }
  const observer=new MutationObserver(()=>requestAnimationFrame(enhanceQueue));observer.observe(document.getElementById('queue'),{childList:true});
  enhanceQueue();
})();

/* Care UI: separate saved care state from buttons that perform new actions. */
(function(){
  const css=`
.v417-care-summary{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:16px 0 4px}
.v417-care-state{min-width:0;padding:11px 12px;border:1px solid #2d463b;border-radius:13px;background:#12211c}
.v417-care-state span{display:block;color:#82968d;font-size:9px;font-weight:850;letter-spacing:.1em;text-transform:uppercase}
.v417-care-state strong{display:block;margin-top:5px;color:#e8f0ec;font-size:13px;line-height:1.25;overflow-wrap:anywhere}
.v417-care-state small{display:block;margin-top:3px;color:#8fa39a;font-size:10px}
.v417-care-state[data-care-kind="water"]{border-color:#3d6658;background:#173027}.v417-care-state[data-care-kind="water"] strong{color:#a9dfc5}
.v417-care-state[data-care-kind="moist"]{border-color:#6e5c36;background:#2a2418}.v417-care-state[data-care-kind="moist"] strong{color:#efd18b}
#plantDialog .quick-actions{margin-top:10px;padding-top:12px;border-top:1px solid #263b33}
#plantDialog .quick-actions::before{content:'LOG NEW ACTION';flex:0 0 100%;color:#71877d;font-size:9px;font-weight:850;letter-spacing:.11em}
#plantDialog .quick-actions [data-quick]{border:1px solid #355045!important;background:#172820!important;color:#dce8e2!important;font-weight:780!important}
#plantDialog .quick-actions [data-quick="water"]{border-color:#477363!important;color:#b9e2ce!important}
#plantDialog .quick-actions [data-quick="moist"]{border-color:#685a3a!important;color:#ead092!important}
#plantDialog .quick-actions [data-quick="custom"]{color:#aebfb7!important}
@media(max-width:700px){
  .v417-care-summary{gap:6px;margin-top:13px}
  .v417-care-state{padding:10px 9px}
  .v417-care-state strong{font-size:12px}
}
`;
  const style=document.createElement('style');style.id='v417CareStateStyles';style.textContent=css;document.head.appendChild(style);
  const actionKind=action=>{const value=String(action||'').toLowerCase();return /water|shower|reservoir topped/.test(value)?'water':/moist|checked/.test(value)?'moist':'other';};
  const dateLabel=date=>date===isoToday()?'Today':fmt(date);
  function enhanceProfile(p){
    const actions=document.querySelector('#plantDialog .quick-actions');if(!actions||!p)return;
    actions.querySelectorAll('[data-quick]').forEach(button=>button.classList.remove('primary'));
    let summary=document.querySelector('#plantDialog .v417-care-summary');
    if(!summary){summary=document.createElement('div');summary.className='v417-care-summary';actions.before(summary);}
    const last=p.lastAction||'No care recorded',kind=actionKind(last),next=p.nextCheck?fmt(p.nextCheck):(isReservoir(p)?'Reservoir-based':'Not scheduled');
    summary.innerHTML=`<div class="v417-care-state" data-care-kind="${kind}"><span>Last recorded</span><strong>${esc(last)}</strong><small>${p.lastCare?dateLabel(p.lastCare):'No date'}</small></div><div class="v417-care-state"><span>Next check</span><strong>${esc(next)}</strong><small>${p.nextCheck?esc(statusLabel(p)):'Care as needed'}</small></div>`;
  }
  if(typeof openPlant==='function'){
    const previousOpenPlant=openPlant;
    openPlant=function(cloudId){const result=previousOpenPlant.apply(this,arguments),p=(db.plants||[]).find(x=>String(x.cloudId)===String(cloudId));requestAnimationFrame(()=>enhanceProfile(p));return result;};
  }
  function clarifyGridStatuses(){
    document.querySelectorAll('#plantGrid .plant-card[data-id]').forEach(card=>{
      const p=(db.plants||[]).find(x=>String(x.cloudId)===String(card.dataset.id)),badge=card.querySelector('.status');
      if(!p||!badge)return;
      const status=statusOf(p);if(status==='upcoming'&&p.nextCheck)badge.textContent=`Next ${fmt(p.nextCheck)}`;
    });
  }
  if(typeof renderPlants==='function'){
    const previousRenderPlants=renderPlants;renderPlants=function(){const result=previousRenderPlants.apply(this,arguments);clarifyGridStatuses();return result;};
  }
  clarifyGridStatuses();
})();

/* Enlarged gallery and growth photos: pinch zoom and one-finger pan. */
(function(){
  const css=`
@media(max-width:700px){
  #photoLightboxImg,#growthViewImg{transform:translate3d(var(--v410-pan-x,0px),var(--v410-pan-y,0px),0) scale(var(--v410-scale,1));transform-origin:center center;will-change:transform}
  #photoLightbox.v410-zoom-resetting #photoLightboxImg,#growthPhotoViewer.v410-zoom-resetting #growthViewImg{transition:transform 160ms ease-out}
  #photoLightbox.v410-zoomed .photo-lightbox-stage,#growthPhotoViewer.v410-zoomed .growth-view-stage{touch-action:none;cursor:grab}
  #photoLightbox.v410-zoomed .photo-lightbox-img,#growthPhotoViewer.v410-zoomed .growth-view-img{cursor:grab}
  #photoLightbox.v410-zoom-panning .photo-lightbox-img,#growthPhotoViewer.v410-zoom-panning .growth-view-img{cursor:grabbing}
  #photoLightbox,#growthPhotoViewer,#photoLightbox button,#growthPhotoViewer button,#photoLightbox .photo-lightbox-top,#photoLightbox .photo-lightbox-bottom,#growthPhotoViewer .growth-view-top,#growthPhotoViewer .growth-view-bottom{
    -webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important
  }
  #photoLightboxImg,#growthViewImg{
    -webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important;-webkit-user-drag:none!important
  }
  #photoLightboxShare,#growthViewShare,#photoLightbox .photo-lightbox-actions{display:none!important}
}
`;
  const style=document.createElement('style');
  style.id='v410PhotoZoomStyles';style.textContent=css;document.head.appendChild(style);
  const distance=(a,b)=>Math.hypot(b.clientX-a.clientX,b.clientY-a.clientY);
  const midpoint=(a,b)=>({x:(a.clientX+b.clientX)/2,y:(a.clientY+b.clientY)/2});
  const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));

  function enhance(dlg){
    if(!dlg||dlg.dataset.v410Zoom==='1')return;
    const stage=dlg.querySelector('#photoLightboxStage,#growthViewStage');
    const img=dlg.querySelector('#photoLightboxImg,#growthViewImg');
    if(!stage||!img)return;
    dlg.dataset.v410Zoom='1';
    let scale=1,panX=0,panY=0,gesture=null,resetTimer=0,tapStart=null,lastTap=0,lastTapX=0,lastTapY=0;
    const apply=()=>{
      img.style.setProperty('--v410-scale',String(scale));
      img.style.setProperty('--v410-pan-x',`${panX}px`);img.style.setProperty('--v410-pan-y',`${panY}px`);
      const zoomed=scale>1.01;
      dlg.dataset.v410Zoomed=zoomed?'1':'0';dlg.classList.toggle('v410-zoomed',zoomed);
    };
    const reset=(animate=false)=>{
      clearTimeout(resetTimer);gesture=null;tapStart=null;lastTap=0;delete dlg.dataset.v410Pinching;scale=1;panX=0;panY=0;
      dlg.classList.remove('v410-zoom-panning');dlg.classList.toggle('v410-zoom-resetting',animate);
      apply();
      if(animate)resetTimer=setTimeout(()=>dlg.classList.remove('v410-zoom-resetting'),170);
      else dlg.classList.remove('v410-zoom-resetting');
    };
    const maxPan=()=>{
      const rect=stage.getBoundingClientRect();
      return {x:Math.max(0,rect.width*(scale-1)/2),y:Math.max(0,rect.height*(scale-1)/2)};
    };
    const containPan=()=>{
      const max=maxPan();panX=clamp(panX,-max.x,max.x);panY=clamp(panY,-max.y,max.y);
    };
    const animateTransform=()=>{
      clearTimeout(resetTimer);dlg.classList.add('v410-zoom-resetting');apply();
      resetTimer=setTimeout(()=>dlg.classList.remove('v410-zoom-resetting'),170);
    };
    const zoomAt=(clientX,clientY)=>{
      const rect=stage.getBoundingClientRect(),target=2.5;
      gesture=null;scale=target;
      panX=-(clientX-(rect.left+rect.width/2))*(target-1);
      panY=-(clientY-(rect.top+rect.height/2))*(target-1);
      containPan();animateTransform();
    };

    stage.addEventListener('touchstart',e=>{
      if(e.touches.length===1){
        const touch=e.touches[0];tapStart={x:touch.clientX,y:touch.clientY,time:performance.now(),moved:false};
      }else tapStart=null;
      if(e.touches.length===2){
        lastTap=0;e.preventDefault();e.stopImmediatePropagation();clearTimeout(resetTimer);dlg.classList.remove('v410-zoom-resetting');
        dlg.dataset.v410Pinching='1';
        const mid=midpoint(e.touches[0],e.touches[1]);
        gesture={type:'pinch',distance:distance(e.touches[0],e.touches[1]),scale,panX,panY,midX:mid.x,midY:mid.y};
      }else if(e.touches.length===1&&scale>1.01){
        e.preventDefault();e.stopImmediatePropagation();
        gesture={type:'pan',x:e.touches[0].clientX,y:e.touches[0].clientY,panX,panY};dlg.classList.add('v410-zoom-panning');
      }
    },{capture:true,passive:false});
    stage.addEventListener('touchmove',e=>{
      if(tapStart&&e.touches.length){
        const touch=e.touches[0];
        if(Math.hypot(touch.clientX-tapStart.x,touch.clientY-tapStart.y)>10){tapStart.moved=true;lastTap=0;}
      }
      if(!gesture)return;
      if(gesture.type==='pinch'&&e.touches.length>=2){
        e.preventDefault();e.stopImmediatePropagation();
        const mid=midpoint(e.touches[0],e.touches[1]);
        scale=clamp(gesture.scale*distance(e.touches[0],e.touches[1])/Math.max(1,gesture.distance),1,5);
        panX=gesture.panX+(mid.x-gesture.midX);panY=gesture.panY+(mid.y-gesture.midY);containPan();apply();
      }else if(gesture.type==='pan'&&e.touches.length===1){
        e.preventDefault();e.stopImmediatePropagation();
        panX=gesture.panX+e.touches[0].clientX-gesture.x;panY=gesture.panY+e.touches[0].clientY-gesture.y;containPan();apply();
      }
    },{capture:true,passive:false});
    stage.addEventListener('touchend',e=>{
      const changed=e.changedTouches[0],now=performance.now();
      const isTap=!!(tapStart&&changed&&!tapStart.moved&&now-tapStart.time<=260&&
        Math.hypot(changed.clientX-tapStart.x,changed.clientY-tapStart.y)<=10&&e.touches.length===0);
      tapStart=null;
      if(isTap){
        const doubleTap=lastTap>0&&now-lastTap<=340&&Math.hypot(changed.clientX-lastTapX,changed.clientY-lastTapY)<=38;
        if(doubleTap){
          e.preventDefault();e.stopPropagation();dlg.classList.remove('v410-zoom-panning');
          lastTap=0;gesture=null;delete dlg.dataset.v410Pinching;
          if(scale>1.01)reset(true);else zoomAt(changed.clientX,changed.clientY);
          navigator.vibrate?.(5);
          return;
        }
        lastTap=now;lastTapX=changed.clientX;lastTapY=changed.clientY;
      }
      if(!gesture)return;
      e.preventDefault();e.stopImmediatePropagation();dlg.classList.remove('v410-zoom-panning');
      if(e.touches.length===1&&scale>1.01){
        gesture={type:'pan',x:e.touches[0].clientX,y:e.touches[0].clientY,panX,panY};
      }else{
        gesture=null;delete dlg.dataset.v410Pinching;if(scale<=1.03)reset(true);else{containPan();apply();}
      }
    },{capture:true,passive:false});
    stage.addEventListener('touchcancel',()=>{gesture=null;tapStart=null;lastTap=0;delete dlg.dataset.v410Pinching;dlg.classList.remove('v410-zoom-panning');if(scale<=1.03)reset(true);},{capture:true,passive:true});
    new MutationObserver(()=>reset(false)).observe(img,{attributes:true,attributeFilter:['src']});
    dlg.addEventListener('close',()=>reset(false));
    apply();
  }
  const scan=()=>{enhance(document.getElementById('photoLightbox'));enhance(document.getElementById('growthPhotoViewer'));};
  scan();new MutationObserver(scan).observe(document.body,{childList:true});
})();


/* Jasper's Plant Room v4.21.0 — guarded growing-zone deletion. */
(function(){
  const style=document.createElement('style');
  style.id='v421ZoneDeleteStyles';
  style.textContent=`
#zoneEditDialog .v421-zone-delete{margin-right:auto;border:1px solid #7f403f;background:#321d1c;color:#ffb4af;font-weight:800}
#zoneEditDialog .v421-zone-delete:hover{border-color:#b85b58;background:#482524;color:#ffd2ce}
#zoneEditDialog .v421-zone-delete:disabled{cursor:wait;opacity:.58}
@media(max-width:700px){
  #zoneEditDialog .modal-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  #zoneEditDialog .v421-zone-delete{grid-column:1/-1;width:100%;margin:0}
}
`;
  document.head.appendChild(style);

  const normalise=value=>String(value||'').trim().toLowerCase();
  const zoneFor=id=>{
    try{return (db.locations||[]).find(zone=>String(zone.id)===String(id));}
    catch(_error){return null;}
  };
  const assignedPlants=zone=>{
    try{return (db.plants||[]).filter(plant=>normalise(plant.location)===normalise(zone.name));}
    catch(_error){return [];}
  };
  const storagePath=value=>{
    const raw=String(value||'');
    if(!raw)return '';
    const marker='/storage/v1/object/public/plant-media/';
    const index=raw.indexOf(marker);
    if(index>=0){
      const encoded=raw.slice(index+marker.length).split('?')[0];
      try{return decodeURIComponent(encoded);}catch(_error){return encoded;}
    }
    if(!/^https?:\/\//i.test(raw))return raw.replace(/^\/+/, '');
    return '';
  };

  function ensureDeleteButton(){
    const dialog=document.getElementById('zoneEditDialog');
    const actions=dialog?.querySelector('.modal-actions');
    if(!dialog||!actions)return null;
    let button=document.getElementById('deleteZoneBtn');
    if(button)return button;
    button=document.createElement('button');
    button.type='button';
    button.id='deleteZoneBtn';
    button.className='v421-zone-delete';
    button.textContent='Delete zone';
    button.addEventListener('click',deleteCurrentZone);
    actions.prepend(button);
    return button;
  }

  async function deleteCurrentZone(){
    if(typeof requireOwner==='function'&&!requireOwner())return;
    const dialog=document.getElementById('zoneEditDialog');
    const id=document.getElementById('zoneEditId')?.value;
    const zone=zoneFor(id);
    const button=ensureDeleteButton();
    if(!zone||!id||!button)return;

    const plants=assignedPlants(zone);
    if(plants.length){
      const names=plants.slice(0,5).map(plant=>plant.name).join(', ');
      const more=plants.length>5?` and ${plants.length-5} more`:'';
      alert(`“${zone.name}” still contains ${plants.length} plant${plants.length===1?'':'s'} (${names}${more}). Move ${plants.length===1?'it':'them'} to another zone first, then delete this zone.`);
      return;
    }

    if(!confirm(`Delete “${zone.name}” permanently?\n\nThis cannot be undone.`))return;

    const original=button.textContent;
    button.disabled=true;
    button.textContent='Deleting…';
    try{
      const result=await sb.from('grow_zones').delete().eq('id',id).select('id');
      if(result.error)throw result.error;
      if(!result.data?.length)throw new Error('The zone was not deleted. Please refresh and try again.');

      const oldPhotoPath=storagePath(zone.photo);
      if(oldPhotoPath){
        const removed=await sb.storage.from('plant-media').remove([oldPhotoPath]);
        if(removed.error)console.warn('Zone deleted, but its old label photo could not be cleaned up.',removed.error);
      }

      if(dialog?.open)dialog.close();
      await loadCloud();
      document.querySelector('[data-view="locations"]')?.click();
    }catch(error){
      console.error('Delete zone failed',error);
      alert(`Could not delete zone: ${error?.message||error}`);
    }finally{
      button.disabled=false;
      button.textContent=original;
    }
  }

  ensureDeleteButton();
  new MutationObserver(ensureDeleteButton).observe(document.body,{childList:true,subtree:true});
})();


/* Jasper's Plant Room v4.22.0 — restrained visual depth and surface texture. */
(function(){
  const style=document.createElement('style');
  style.id='v422VisualDepthStyles';
  style.textContent=`
:root{
  --v422-surface-top:#182b24;
  --v422-surface-bottom:#101c18;
  --v422-edge:rgba(115,151,134,.25);
  --v422-highlight:rgba(255,255,255,.042);
  --v422-shadow-shallow:0 2px 5px rgba(0,0,0,.22),0 10px 25px rgba(0,0,0,.16);
  --v422-shadow-medium:0 3px 7px rgba(0,0,0,.28),0 16px 38px rgba(0,0,0,.25);
  --v422-shadow-deep:0 8px 20px rgba(0,0,0,.38),0 38px 110px rgba(0,0,0,.62);
}
body{
  background-color:#09110e;
  background-image:
    radial-gradient(circle at 12% -8%,rgba(66,126,99,.31) 0,transparent 33%),
    radial-gradient(circle at 92% 21%,rgba(163,122,55,.075) 0,transparent 25%),
    radial-gradient(circle at 30% 88%,rgba(38,82,65,.12) 0,transparent 29%),
    repeating-linear-gradient(117deg,rgba(255,255,255,.006) 0 1px,transparent 1px 5px),
    linear-gradient(180deg,#0c1612 0%,#0b1411 48%,#080f0d 100%);
  background-attachment:fixed;
}
.hero h1,.section-head h2{text-shadow:0 2px 18px rgba(0,0,0,.34)}
.topbar{
  box-shadow:inset 0 -1px 0 rgba(255,255,255,.025),0 10px 34px rgba(0,0,0,.22);
}

.stat{
  background:linear-gradient(145deg,rgba(25,44,37,.97),rgba(15,27,23,.98));
  border-color:var(--v422-edge);
  box-shadow:inset 0 1px 0 var(--v422-highlight),inset 0 -1px 0 rgba(0,0,0,.2),var(--v422-shadow-shallow);
}
.queue-item,.timeline-item{
  background:linear-gradient(145deg,rgba(23,41,34,.97),rgba(15,28,23,.98));
  border-color:rgba(104,139,122,.22);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.03),0 2px 4px rgba(0,0,0,.2),0 9px 22px rgba(0,0,0,.14);
  transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease,background .18s ease;
}
.queue-thumb{
  outline:1px solid rgba(185,210,198,.12);
  outline-offset:-1px;
  box-shadow:0 7px 16px rgba(0,0,0,.32);
  filter:saturate(1.035) contrast(1.02);
}

.plant-card,.location-card,.backlog-card,.add-plant-card{
  background:linear-gradient(150deg,var(--v422-surface-top) 0%,#13231d 47%,var(--v422-surface-bottom) 100%);
  border-color:var(--v422-edge);
  box-shadow:inset 0 1px 0 var(--v422-highlight),inset 0 -1px 0 rgba(0,0,0,.25),var(--v422-shadow-medium);
}
.plant-card,.location-card{
  transform:translateZ(0);
  transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease,filter .2s ease;
}
.plant-photo,.location-photo{
  filter:saturate(1.04) contrast(1.025);
  border-bottom:1px solid rgba(184,210,197,.11);
  box-shadow:0 14px 26px -20px rgba(0,0,0,.9);
}
.location-card.has-photo .location-card-content{
  background:linear-gradient(180deg,rgba(25,44,37,.98),rgba(15,27,23,.99));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.027);
}
.gallery-tile,.growth-card{
  border:1px solid rgba(126,157,143,.2);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.025),0 10px 24px rgba(0,0,0,.22);
}

.status,.chip{
  box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 3px 8px rgba(0,0,0,.14);
}
.toolbar input,.toolbar select,label select,label input,label textarea{
  background:linear-gradient(180deg,#14241e,#101d19);
  border-color:rgba(102,138,120,.3);
  box-shadow:inset 0 2px 5px rgba(0,0,0,.19),0 1px 0 rgba(255,255,255,.018);
  transition:border-color .18s ease,box-shadow .18s ease,background .18s ease;
}
.toolbar input:focus,.toolbar select:focus,label select:focus,label input:focus,label textarea:focus{
  border-color:rgba(178,203,190,.52);
  box-shadow:inset 0 2px 5px rgba(0,0,0,.2),0 0 0 3px rgba(107,151,130,.12);
}
.dialog,.auth-card{
  background:linear-gradient(155deg,#162720 0%,#101c18 52%,#0a1210 100%);
  border-color:rgba(127,166,147,.4);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.05),var(--v422-shadow-deep);
}
.dialog::backdrop{background:rgba(3,7,6,.76);backdrop-filter:blur(7px)}
.primary{
  box-shadow:inset 0 1px 0 rgba(255,255,255,.22),0 6px 15px rgba(0,0,0,.21);
}
.ghost{
  box-shadow:inset 0 1px 0 rgba(255,255,255,.025),0 4px 11px rgba(0,0,0,.12);
}

#plantGrid[data-v48-view="list"] .plant-photo{
  border-right:1px solid rgba(184,210,197,.11);
  border-bottom:0;
}
#plantGrid[data-v48-view="compact"] .plant-photo{border-bottom:0}

@media(hover:hover) and (pointer:fine){
  .stat:hover{
    transform:translateY(-1px);
    border-color:rgba(135,174,155,.35);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 4px 8px rgba(0,0,0,.22),0 14px 30px rgba(0,0,0,.19);
  }
  .queue-item:hover{
    transform:translateY(-2px);
    border-color:rgba(133,172,153,.42);
    background:linear-gradient(145deg,rgba(27,48,40,.98),rgba(17,31,26,.99));
    box-shadow:inset 0 1px 0 rgba(255,255,255,.045),0 5px 10px rgba(0,0,0,.24),0 16px 32px rgba(0,0,0,.2);
  }
  .plant-card:hover,.location-card:hover{
    transform:translateY(-4px) scale(1.006);
    border-color:rgba(146,185,166,.5);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 7px 15px rgba(0,0,0,.3),0 24px 50px rgba(0,0,0,.32);
  }
}

@media(max-width:700px){
  body{background-attachment:scroll}
  .stat{box-shadow:inset 0 1px 0 var(--v422-highlight),0 2px 4px rgba(0,0,0,.2),0 8px 18px rgba(0,0,0,.15)}
  .queue-item{box-shadow:inset 0 1px 0 rgba(255,255,255,.028),0 2px 4px rgba(0,0,0,.22),0 8px 18px rgba(0,0,0,.16)}
  .plant-card,.location-card,.backlog-card{box-shadow:inset 0 1px 0 var(--v422-highlight),0 3px 6px rgba(0,0,0,.27),0 13px 27px rgba(0,0,0,.22)}
  #plantGrid[data-v48-view="compact"]{
    gap:7px;
    margin-left:0;
    margin-right:0;
  }
  #plantGrid[data-v48-view="compact"] .plant-card{
    border:1px solid rgba(115,151,134,.24);
    border-radius:12px;
    box-shadow:0 2px 5px rgba(0,0,0,.26),0 10px 20px rgba(0,0,0,.2);
  }
  #plantGrid[data-v48-view="compact"] .plant-photo{filter:saturate(1.045) contrast(1.03)}
  .plant-card:active,.location-card:active,.queue-item:active{transform:scale(.985)}
}

@media(prefers-reduced-motion:reduce){
  .stat,.queue-item,.plant-card,.location-card{transition:none!important}
}
`;
  document.head.appendChild(style);
})();


/* Jasper's Plant Room v4.27.0 — integrated mobile care summary. */
(function(){
  const mq=window.matchMedia('(max-width:700px)');
  const dlg=document.getElementById('plantDialog');
  if(!dlg)return;
  const names=['gallery','growth','details','care'];

  const style=document.createElement('style');
  style.id='v427PlantCarouselStyles';
  style.textContent=`
@media(max-width:700px){
  #plantDialog .v411-tabs.v426-tabs-ready{overflow:visible}
  #plantDialog .v411-tabs.v426-tabs-ready .v411-tab{
    z-index:2;border:1px solid rgba(111,145,129,.2);background:rgba(16,29,24,.52);
    transition:color 170ms ease,background 170ms ease,border-color 170ms ease,box-shadow 170ms ease,transform 110ms ease
  }
  #plantDialog .v411-tabs.v426-tabs-ready .v411-tab:active{transform:scale(.965)}
  #plantDialog .v411-tabs.v426-tabs-ready .v411-tab[aria-selected="true"]{
    border-color:rgba(213,190,133,.46);background:rgba(36,60,51,.8);color:#f2f6f4;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.045),0 5px 15px rgba(0,0,0,.22)
  }
  #plantDialog .v411-tabs.v426-tabs-ready .v411-tab[aria-selected="true"]::after{display:none}
  #plantDialog .v426-tab-indicator{
    position:absolute;z-index:3;bottom:4px;height:2px;border-radius:999px;background:#d5be85;
    box-shadow:0 0 9px rgba(213,190,133,.34);
    transition:transform 250ms cubic-bezier(.22,.8,.2,1),width 250ms cubic-bezier(.22,.8,.2,1);pointer-events:none
  }
  #plantDialog .v426-tab-indicator[data-dragging="1"]{transition:none}
  #plantDialog .v426-tab-viewport{
    position:relative;width:100%;overflow:hidden;touch-action:pan-y;overscroll-behavior-x:contain;
    transition:height 240ms cubic-bezier(.22,.8,.2,1)
  }
  #plantDialog .v426-tab-track{
    position:relative;z-index:1;display:flex;align-items:flex-start;width:100%;transform:translate3d(0,0,0);
    transition:transform 285ms cubic-bezier(.22,.8,.2,1);will-change:transform
  }
  #plantDialog .v426-tab-track[data-dragging="1"]{transition:none}
  #plantDialog .v426-tab-track>.v411-panel{
    display:block!important;position:relative;flex:0 0 calc(100% - 20px);width:calc(100% - 20px);min-width:calc(100% - 20px);
    min-height:calc(100dvh - 166px);box-sizing:border-box;margin:8px 10px 20px;padding:13px 12px 22px!important;
    border:1px solid rgba(112,151,132,.32);border-radius:20px;
    background:radial-gradient(circle at 12% 0,rgba(96,142,120,.1),transparent 34%),linear-gradient(150deg,rgba(24,42,35,.98),rgba(13,24,20,.99));
    box-shadow:inset 0 1px 0 rgba(255,255,255,.045),inset 0 -1px 0 rgba(0,0,0,.22),0 14px 34px rgba(0,0,0,.35);
    opacity:var(--v426-panel-opacity,.34);filter:brightness(var(--v426-panel-brightness,.82));
    transform:scale(var(--v426-panel-scale,.985));transform-origin:center top;
    transition:opacity 220ms ease,filter 240ms ease,transform 260ms cubic-bezier(.22,.8,.2,1),border-color 220ms ease,box-shadow 220ms ease;
    touch-action:pan-y;overflow:visible;will-change:opacity,transform,filter
  }
  #plantDialog .v426-tab-track[data-dragging="1"]>.v411-panel{transition:none}
  #plantDialog .v426-tab-track>.v411-panel[data-v426-current="1"]{
    border-color:rgba(139,180,160,.43);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.055),inset 0 -1px 0 rgba(0,0,0,.22),0 17px 42px rgba(0,0,0,.43)
  }
  #plantDialog .v426-swipe-shadow{
    position:absolute;z-index:6;top:11px;bottom:23px;width:64px;opacity:0;pointer-events:none;
    background:linear-gradient(90deg,transparent,rgba(0,0,0,.34) 48%,rgba(211,230,220,.055) 50%,rgba(0,0,0,.27) 52%,transparent);
    transition:opacity 170ms ease;will-change:transform,opacity
  }
  #plantDialog .v426-swipe-shadow[data-dragging="1"]{transition:none}
  #plantDialog .v426-tab-track>.v411-panel[data-v411-panel="details"]{
    display:flex!important;flex-direction:column;min-height:calc(100dvh - 166px);
    padding:10px 12px 12px!important
  }
  #plantDialog .v411-panel[data-v411-panel="details"] .v411-section-title{
    margin:1px 0 2px;font-size:16px
  }
  #plantDialog .v411-panel[data-v411-panel="details"] .v411-section-note{
    margin:0 0 7px;font-size:10px;line-height:1.3
  }
  #plantDialog .v411-panel[data-v411-panel="details"] .detail-grid{
    display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:3px 12px;
    width:100%;margin:2px 0 9px
  }
  #plantDialog .v411-panel[data-v411-panel="details"] .detail{
    min-width:0;padding:6px 0;border-bottom-color:rgba(99,137,119,.24)
  }
  #plantDialog .v411-panel[data-v411-panel="details"] .detail span{
    font-size:8.5px;line-height:1.15;letter-spacing:.075em
  }
  #plantDialog .v411-panel[data-v411-panel="details"] .detail strong{
    margin-top:2px;font-size:11.5px;line-height:1.22
  }
  #plantDialog .v411-panel[data-v411-panel="details"]>.v417-care-summary.v426-details-summary{
    display:grid!important;position:static!important;z-index:auto;flex:0 0 auto;width:100%;
    margin:auto 0 0!important;padding:10px 0 0;border:0;border-top:1px solid rgba(112,151,132,.28);
    border-radius:0;background:transparent;backdrop-filter:none;-webkit-backdrop-filter:none;box-shadow:none
  }
  #plantDialog .v426-details-summary .v417-care-state{
    padding:8px 9px;border-color:rgba(112,151,132,.3);
    background:linear-gradient(145deg,rgba(24,44,36,.96),rgba(15,28,23,.98));
    box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 7px 17px rgba(0,0,0,.2)
  }
  #plantDialog .v426-details-summary .v417-care-state strong{font-size:11.5px}
}
@media(max-width:700px) and (max-height:700px){
  #plantDialog .v411-panel[data-v411-panel="details"] .v411-section-note{display:none}
  #plantDialog .v411-panel[data-v411-panel="details"] .detail-grid{gap:1px 10px;margin:1px 0 6px}
  #plantDialog .v411-panel[data-v411-panel="details"] .detail{padding:4px 0}
  #plantDialog .v426-details-summary .v417-care-state{padding:6px 8px}
}
@media(prefers-reduced-motion:reduce){
  #plantDialog .v426-tab-track,#plantDialog .v426-tab-viewport,#plantDialog .v426-tab-indicator,
  #plantDialog .v426-tab-track>.v411-panel,#plantDialog .v426-swipe-shadow{transition:none!important}
}
`;
  document.head.appendChild(style);

  const reduceMotion=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const observers=new WeakMap();
  let gesture=null,queued=false;
  const panelsOf=inner=>names.map(name=>inner.querySelector(`.v411-panel[data-v411-panel="${name}"]`));
  const activeIndex=inner=>{
    const name=inner.querySelector('.v411-tab[aria-selected="true"]')?.dataset.v411Tab||
      inner.querySelector('.v411-panel[data-active="1"]')?.dataset.v411Panel||'gallery';
    return Math.max(0,names.indexOf(name));
  };

  function resetProfileScroll(inner){
    requestAnimationFrame(()=>{
      [dlg,document.getElementById('plantDialogBody'),inner].forEach(target=>{
        if(!target)return;
        try{target.scrollTo(0,0);}catch(_error){target.scrollTop=0;}
        target.scrollTop=0;
      });
    });
  }

  function positionIndicator(inner,position,dragging=false){
    const tabs=inner.querySelector('.v411-tabs'),indicator=tabs?.querySelector('.v426-tab-indicator');
    const buttons=tabs?[...tabs.querySelectorAll('.v411-tab')]:[];
    if(!indicator||!buttons.length)return;
    const safe=Math.max(0,Math.min(buttons.length-1,position));
    const low=Math.floor(safe),high=Math.ceil(safe),mix=safe-low;
    const a=buttons[low],b=buttons[high]||a;
    const left=a.offsetLeft+(b.offsetLeft-a.offsetLeft)*mix;
    const width=a.offsetWidth+(b.offsetWidth-a.offsetWidth)*mix;
    indicator.dataset.dragging=dragging?'1':'0';
    indicator.style.width=`${Math.max(18,width*.56)}px`;
    indicator.style.transform=`translate3d(${left+width*.22}px,0,0)`;
  }

  function setPanelEffects(inner,position,dragging=false){
    panelsOf(inner).forEach((panel,index)=>{
      if(!panel)return;
      const presence=Math.max(0,1-Math.abs(index-position));
      panel.style.setProperty('--v426-panel-opacity',(0.34+presence*.66).toFixed(3));
      panel.style.setProperty('--v426-panel-brightness',(0.82+presence*.18).toFixed(3));
      panel.style.setProperty('--v426-panel-scale',(0.985+presence*.015).toFixed(4));
      panel.dataset.v426Current=presence>.72?'1':'0';
    });
    const track=inner.querySelector('.v426-tab-track');
    if(track)track.dataset.dragging=dragging?'1':'0';
  }

  function showSwipeShadow(inner,x,amount){
    const shadow=inner.querySelector('.v426-swipe-shadow');if(!shadow)return;
    shadow.dataset.dragging='1';shadow.style.transform=`translate3d(${x-32}px,0,0)`;
    shadow.style.opacity=String(Math.min(.92,Math.max(0,amount)));
  }
  function hideSwipeShadow(inner){
    const shadow=inner.querySelector('.v426-swipe-shadow');if(!shadow)return;
    shadow.dataset.dragging='0';shadow.style.opacity='0';
  }

  function updateHeight(inner,animate=true){
    const viewport=inner.querySelector('.v426-tab-viewport');
    const panel=panelsOf(inner)[activeIndex(inner)];
    if(!viewport||!panel)return;
    const computed=getComputedStyle(panel);
    const height=panel.offsetHeight+(parseFloat(computed.marginTop)||0)+(parseFloat(computed.marginBottom)||0);
    if(!animate||reduceMotion())viewport.style.transition='none';
    viewport.style.height=`${Math.max(1,height)}px`;
    if(!animate||reduceMotion())requestAnimationFrame(()=>viewport.style.removeProperty('transition'));
  }

  function syncAccessibility(inner,index){
    panelsOf(inner).forEach((panel,i)=>{
      if(!panel)return;
      panel.setAttribute('aria-hidden',i===index?'false':'true');
      if(i===index)panel.removeAttribute('inert');else panel.setAttribute('inert','');
    });
    inner.dataset.v426ActiveTab=names[index];
    const summary=inner.querySelector('.v426-details-summary');
    if(summary){
      summary.setAttribute('aria-hidden',index===2?'false':'true');
      if(index===2)summary.removeAttribute('inert');else summary.setAttribute('inert','');
    }
  }

  function settle(inner,index,{animate=true,resetScroll=true}={}){
    const viewport=inner.querySelector('.v426-tab-viewport'),track=inner.querySelector('.v426-tab-track');
    if(!viewport||!track)return;
    const width=Math.max(1,viewport.clientWidth);
    track.dataset.dragging='0';
    if(!animate||reduceMotion())track.style.transition='none';
    track.style.transform=`translate3d(${-index*width}px,0,0)`;
    if(!animate||reduceMotion())requestAnimationFrame(()=>track.style.removeProperty('transition'));
    positionIndicator(inner,index,false);setPanelEffects(inner,index,false);hideSwipeShadow(inner);
    syncAccessibility(inner,index);updateHeight(inner,animate);
    if(resetScroll)resetProfileScroll(inner);
  }

  function rowValue(row){
    if(!row)return'';
    const copy=row.cloneNode(true);copy.querySelector('span')?.remove();
    return copy.textContent.trim().replace(/\s+/g,' ');
  }

  function ensureSummary(inner){
    let summary=inner.querySelector('.v417-care-summary');
    if(summary)return summary;
    const rows=[...inner.querySelectorAll('.detail')];
    const last=rows.find(row=>/^last care$/i.test(row.querySelector('span')?.textContent?.trim()||''));
    const next=rows.find(row=>/^next check$/i.test(row.querySelector('span')?.textContent?.trim()||''));
    if(!last&&!next)return null;
    summary=document.createElement('div');summary.className='v417-care-summary';
    const card=(label,value,note)=>{
      const item=document.createElement('div');item.className='v417-care-state';
      const caption=document.createElement('span');caption.textContent=label;
      const strong=document.createElement('strong');strong.textContent=value||'Not recorded';
      const small=document.createElement('small');small.textContent=note;
      item.append(caption,strong,small);return item;
    };
    summary.append(card('Last recorded',rowValue(last),'Care history'),card('Next check',rowValue(next),'Care schedule'));
    return summary;
  }

  function moveSummary(inner){
    const details=inner.querySelector('.v411-panel[data-v411-panel="details"]'),summary=ensureSummary(inner);
    if(!details||!summary)return false;
    summary.classList.add('v426-details-summary');
    if(summary.parentElement!==details||summary!==details.lastElementChild)details.appendChild(summary);
    syncAccessibility(inner,activeIndex(inner));return true;
  }

  function restoreSummary(inner){
    const summary=inner.querySelector('.v426-details-summary');if(!summary)return;
    summary.classList.remove('v426-details-summary');summary.removeAttribute('aria-hidden');summary.removeAttribute('inert');
    const actions=inner.querySelector('.quick-actions'),care=inner.querySelector('.v411-panel[data-v411-panel="care"]');
    if(actions)actions.before(summary);else if(care)care.appendChild(summary);
    delete inner.dataset.v426ActiveTab;
  }

  function setup(inner){
    if(!mq.matches||!dlg.open)return;
    const tabs=inner.querySelector('.v411-tabs'),panels=panelsOf(inner);
    if(!tabs||panels.some(panel=>!panel))return;
    let viewport=inner.querySelector('.v426-tab-viewport');
    if(!viewport){
      viewport=document.createElement('div');viewport.className='v426-tab-viewport';
      const track=document.createElement('div');track.className='v426-tab-track';
      tabs.insertAdjacentElement('afterend',viewport);viewport.appendChild(track);panels.forEach(panel=>track.appendChild(panel));
      const shadow=document.createElement('span');shadow.className='v426-swipe-shadow';shadow.setAttribute('aria-hidden','true');viewport.appendChild(shadow);
      const indicator=document.createElement('span');indicator.className='v426-tab-indicator';indicator.setAttribute('aria-hidden','true');
      tabs.appendChild(indicator);tabs.classList.add('v426-tabs-ready');
      tabs.addEventListener('click',event=>{
        if(!event.target.closest('.v411-tab'))return;
        requestAnimationFrame(()=>{const index=activeIndex(inner);settle(inner,index,{animate:true,resetScroll:true});moveSummary(inner);});
      });
      const resizeObserver=new ResizeObserver(()=>{if(!gesture||gesture.inner!==inner)updateHeight(inner,false);});
      panels.forEach(panel=>resizeObserver.observe(panel));observers.set(inner,resizeObserver);
      inner.dataset.v426Carousel='1';
      requestAnimationFrame(()=>{
        settle(inner,activeIndex(inner),{animate:false,resetScroll:false});moveSummary(inner);
        setTimeout(()=>moveSummary(inner),80);setTimeout(()=>moveSummary(inner),260);
      });
    }else{
      requestAnimationFrame(()=>{
        moveSummary(inner);updateHeight(inner,false);
        const index=activeIndex(inner);positionIndicator(inner,index,false);setPanelEffects(inner,index,false);
      });
    }
  }

  function schedule(){
    if(queued)return;queued=true;
    requestAnimationFrame(()=>{
      queued=false;if(!mq.matches||!dlg.open)return;
      const inner=dlg.querySelector('.dialog-inner');if(inner)setup(inner);
    });
  }

  dlg.addEventListener('touchstart',event=>{
    if(!mq.matches||!dlg.open||event.touches.length!==1)return;
    const panel=event.target.closest?.('.v426-tab-track>.v411-panel');
    const inner=panel?.closest('.dialog-inner'),viewport=inner?.querySelector('.v426-tab-viewport');
    if(!panel||!inner||!viewport||panel.dataset.active!=='1')return;
    if(event.target.closest?.('button,a,input,textarea,select,[contenteditable="true"]'))return;
    const touch=event.touches[0];if(touch.clientX<=28)return;
    const index=activeIndex(inner),width=Math.max(1,viewport.clientWidth);
    gesture={inner,viewport,track:inner.querySelector('.v426-tab-track'),index,width,startX:touch.clientX,startY:touch.clientY,startTime:performance.now(),dx:0,locked:null};
  },{capture:true,passive:true});

  dlg.addEventListener('touchmove',event=>{
    if(!gesture||event.touches.length!==1)return;
    const touch=event.touches[0],rawDx=touch.clientX-gesture.startX,dy=touch.clientY-gesture.startY;
    if(gesture.locked===null&&(Math.abs(rawDx)>8||Math.abs(dy)>8))gesture.locked=Math.abs(rawDx)>Math.abs(dy)*1.15?'tabs':'scroll';
    if(gesture.locked!=='tabs')return;
    event.preventDefault();
    let dx=rawDx;if((gesture.index===0&&dx>0)||(gesture.index===names.length-1&&dx<0))dx*=.24;
    gesture.dx=dx;gesture.track.dataset.dragging='1';
    gesture.track.style.transform=`translate3d(${-gesture.index*gesture.width+dx}px,0,0)`;
    const progress=gesture.index-dx/gesture.width;
    positionIndicator(gesture.inner,progress,true);setPanelEffects(gesture.inner,progress,true);
    showSwipeShadow(gesture.inner,dx<0?gesture.width+dx:dx,Math.min(.88,Math.abs(dx)/(gesture.width*.34)));
  },{capture:true,passive:false});

  dlg.addEventListener('touchend',event=>{
    if(!gesture)return;
    const current=gesture,changed=event.changedTouches[0];
    const rawDx=changed?changed.clientX-current.startX:current.dx;
    const velocity=Math.abs(rawDx)/Math.max(1,performance.now()-current.startTime);
    gesture=null;
    if(current.locked!=='tabs'){settle(current.inner,current.index,{animate:false,resetScroll:false});return;}
    event.preventDefault();event.stopPropagation();
    const direction=rawDx<0?1:-1,targetIndex=current.index+direction;
    const commit=(Math.abs(rawDx)>=current.width*.18||(Math.abs(rawDx)>=30&&velocity>.42))&&targetIndex>=0&&targetIndex<names.length;
    if(!commit){settle(current.inner,current.index,{animate:true,resetScroll:false});return;}
    const target=current.inner.querySelector(`.v411-tab[data-v411-tab="${names[targetIndex]}"]`);
    if(!target){settle(current.inner,current.index,{animate:true,resetScroll:false});return;}
    target.click();navigator.vibrate?.(7);
  },{capture:true,passive:false});

  dlg.addEventListener('touchcancel',()=>{
    if(gesture)settle(gesture.inner,gesture.index,{animate:true,resetScroll:false});gesture=null;
  },{capture:true,passive:true});

  new MutationObserver(schedule).observe(dlg,{childList:true,subtree:true});
  dlg.addEventListener('close',()=>{
    gesture=null;queued=false;
    dlg.querySelectorAll('.dialog-inner').forEach(inner=>{observers.get(inner)?.disconnect();restoreSummary(inner);});
  });
  if(typeof mq.addEventListener==='function')mq.addEventListener('change',()=>{
    if(mq.matches)schedule();else dlg.querySelectorAll('.dialog-inner').forEach(restoreSummary);
  });
  schedule();
})();


/* Jasper's Plant Room v4.28.0 — compact mobile care actions. */
(function(){
  const mq=window.matchMedia('(max-width:700px)');
  const dlg=document.getElementById('plantDialog');
  if(!dlg)return;

  const style=document.createElement('style');
  style.id='v428CompactCareActionsStyles';
  style.textContent=`
@media(max-width:700px){
  #plantDialog .v411-panel[data-v411-panel="care"] .v411-care-details{display:none!important}
  #plantDialog .v411-panel[data-v411-panel="care"] .quick-actions.v428-care-actions{
    --v428-care-count:2;
    display:grid!important;grid-template-columns:repeat(var(--v428-care-count),minmax(0,1fr)) 46px;
    align-items:stretch;gap:6px;margin:10px 0 0;padding:8px;
    border:1px solid rgba(103,143,124,.26);border-radius:15px;
    background:rgba(10,20,17,.46);box-shadow:inset 0 1px 0 rgba(255,255,255,.025)
  }
  #plantDialog .v411-panel[data-v411-panel="care"] .quick-actions.v428-care-actions::before{
    content:'QUICK LOG';grid-column:1/-1;min-height:0;margin:0 1px 1px;
    color:#71877d;font-size:8.5px;font-weight:850;letter-spacing:.115em
  }
  #plantDialog .v428-care-actions [data-quick]{
    display:flex!important;align-items:center;justify-content:center;gap:5px;min-width:0;min-height:44px;
    margin:0!important;padding:0 8px!important;border-radius:11px!important;
    font-size:11px!important;font-weight:800!important;line-height:1!important;white-space:nowrap;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 4px 11px rgba(0,0,0,.16)
  }
  #plantDialog .v428-care-actions [data-quick] svg{
    flex:0 0 auto;width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.8;
    stroke-linecap:round;stroke-linejoin:round
  }
  #plantDialog .v428-care-actions [data-quick="custom"]{
    width:46px;min-width:46px;padding:0!important;border-color:rgba(213,190,133,.42)!important;
    background:rgba(213,190,133,.1)!important;color:#dec88f!important;font-size:25px!important;font-weight:450!important
  }
  #plantDialog .v428-care-actions [data-quick]:active{transform:scale(.96)}
  #plantDialog .v411-section-title.v428-details-title{
    display:flex!important;align-items:center;justify-content:space-between;gap:10px
  }
  #plantDialog .v428-edit-details{
    display:grid;place-items:center;flex:0 0 auto;width:36px;height:36px;min-height:36px;margin:-5px 0 -4px;
    padding:0!important;border:1px solid rgba(112,151,132,.3)!important;border-radius:11px!important;
    background:rgba(20,38,31,.78)!important;color:#a9bdb3!important;box-shadow:none!important
  }
  #plantDialog .v428-edit-details svg{
    width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round
  }
}
@media(max-width:360px){
  #plantDialog .v428-care-actions [data-quick]{gap:3px;padding:0 5px!important;font-size:10px!important}
  #plantDialog .v428-care-actions [data-quick] svg{width:14px;height:14px}
}
`;
  document.head.appendChild(style);

  const icons={
    moist:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5S6.7 9.3 6.7 14a5.3 5.3 0 0 0 10.6 0C17.3 9.3 12 3.5 12 3.5Z"/><path d="M9.3 14.3c.2 1.3 1 2.1 2.3 2.4"/></svg>',
    water:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5S6.7 9.3 6.7 14a5.3 5.3 0 0 0 10.6 0C17.3 9.3 12 3.5 12 3.5Z"/><path d="m9.5 14 1.7 1.7 3.6-3.8"/></svg>',
    reservoir:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8.5h16v8.8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><path d="M7 14c1.2-.9 2.3-.9 3.5 0s2.3.9 3.5 0 2.3-.9 3.5 0"/></svg>',
    edit:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4.5 19.5 3.8-.8 10-10a2.1 2.1 0 0 0-3-3l-10 10Z"/><path d="m13.8 7.2 3 3"/></svg>'
  };

  function labelAction(button,label,aria,icon){
    if(!button)return;
    if(button.dataset.v428Label!==label){
      button.innerHTML=`${icon}<span>${label}</span>`;
      button.dataset.v428Label=label;
    }
    button.setAttribute('aria-label',aria);
    button.title=aria;
  }

  function enhance(inner){
    if(!mq.matches||!dlg.open||!inner)return;
    const actions=inner.querySelector('.v411-panel[data-v411-panel="care"] .quick-actions');
    if(actions){
      actions.classList.add('v428-care-actions');
      const moist=actions.querySelector('[data-quick="moist"]');
      const water=actions.querySelector('[data-quick="water"]');
      const reservoir=actions.querySelector('[data-quick="reservoir"]');
      const custom=actions.querySelector('[data-quick="custom"]');
      labelAction(moist,'Moist','Checked — still moist',icons.moist);
      labelAction(water,'Watered','Watered today',icons.water);
      labelAction(reservoir,'Reservoir','Reservoir topped up',icons.reservoir);
      if(custom){
        if(custom.dataset.v428Label!=='plus'){custom.textContent='＋';custom.dataset.v428Label='plus';}
        custom.setAttribute('aria-label','Add custom care entry');
        custom.title='Add custom care entry';
      }
      const count=[moist,water,reservoir].filter(Boolean).length;
      actions.style.setProperty('--v428-care-count',String(Math.max(1,count)));
    }

    const details=inner.querySelector('.v411-panel[data-v411-panel="details"]');
    const title=details?.querySelector('.v411-section-title');
    const edit=inner.querySelector('#editPlantBtn');
    if(title&&edit){
      title.classList.add('v428-details-title');
      edit.classList.add('v428-edit-details');
      if(edit.dataset.v428Label!=='edit'){edit.innerHTML=icons.edit;edit.dataset.v428Label='edit';}
      edit.setAttribute('aria-label','Edit plant details');
      edit.title='Edit plant details';
      if(edit.parentElement!==title)title.appendChild(edit);
    }
  }

  function restore(inner){
    const actions=inner.querySelector('.quick-actions');
    if(actions){
      actions.classList.remove('v428-care-actions');actions.style.removeProperty('--v428-care-count');
      const labels={moist:'Checked — still moist',water:'Watered today',reservoir:'Reservoir topped',custom:'Add custom entry'};
      actions.querySelectorAll('[data-quick]').forEach(button=>{
        const label=labels[button.dataset.quick];if(label)button.textContent=label;
        delete button.dataset.v428Label;button.removeAttribute('title');
      });
    }
    const title=inner.querySelector('.v428-details-title');title?.classList.remove('v428-details-title');
    const edit=inner.querySelector('#editPlantBtn');
    if(edit){
      edit.classList.remove('v428-edit-details');edit.textContent='Edit details';delete edit.dataset.v428Label;
      edit.removeAttribute('aria-label');edit.removeAttribute('title');
      actions?.appendChild(edit);
    }
  }

  let queued=false;
  function schedule(){
    if(queued)return;queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      const inner=dlg.querySelector('.dialog-inner');
      if(mq.matches)enhance(inner);else if(inner)restore(inner);
    });
  }
  new MutationObserver(schedule).observe(dlg,{childList:true,subtree:true});
  dlg.addEventListener('close',()=>{queued=false;});
  if(typeof mq.addEventListener==='function')mq.addEventListener('change',schedule);
  schedule();
})();


/* Jasper's Plant Room v4.29.0 — built-in patch notes. */
(function(){
  const releases=[{"version":"4.32.0","date":"20 Aug 2026","title":"Seamless mobile photo carousel","changes":["Rebuilt enlarged Gallery and Growth Progress swiping as a continuous follow-your-finger carousel.","Added softly framed photo edges, depth shadows and a fade between neighbouring photos.","Preserved double-tap zoom, pinch, pan, long-press actions and edge-swipe back."]},{"version":"4.31.0","date":"20 Aug 2026","title":"Mobile photo double-tap zoom","changes":["Added double-tap reset for zoomed Gallery and Growth Progress photos.","Added app-style double-tap zoom into the tapped area when the photo is at its default scale.","Preserved pinch, pan, swipe navigation and long-press image actions."]},{"version":"4.30.0","date":"20 Aug 2026","title":"Desktop Patch Notes and reliable updates","changes":["Added an explicit Patch notes entry to the desktop account menu.","Made the desktop version badge open Patch Notes directly.","Fixed skipped-release service-worker upgrades so an older desktop cache cannot remain stuck indefinitely."]},{"version":"4.29.0","date":"20 Aug 2026","title":"Built-in patch notes","changes":["Added Patch notes to the top-right account and backup menu.","Added this notepad-style release history from the newest update back to the original Plant Room build."]},{"version":"4.28.0","date":"20 Aug 2026","title":"Compact mobile care actions","changes":["Replaced bulky Care buttons with compact 44px Moist, Watered and Reservoir actions.","Changed Add custom entry to a square ＋ button.","Moved Edit details to a pencil action in the Details heading.","Removed duplicate Last care and Next check rows from the mobile Care tab."]},{"version":"4.27.0","date":"20 Aug 2026","title":"Integrated Details care summary","changes":["Removed the floating care summary dock.","Placed Last recorded and Next check at the bottom of Details.","Compressed mobile Details into a two-column layout so the summary fits in the first view."]},{"version":"4.26.0","date":"20 Aug 2026","title":"Carousel surface polish","changes":["Separated carousel tabs into bordered, rounded surfaces.","Added progressive opacity, brightness and seam shadows while swiping.","Fixed unreliable care-summary rendering caused by the transformed carousel track."]},{"version":"4.25.0","date":"20 Aug 2026","title":"Fluid mobile profile carousel","changes":["Rebuilt Gallery, Growth, Details and Care as a continuous finger-following carousel.","Added smooth settling, direction locking, tab-indicator tracking and edge resistance."]},{"version":"4.24.0","date":"20 Aug 2026","title":"Mobile profile gestures","changes":["Added left and right swipe navigation between plant-profile tabs.","Reset each tab to the top when selected.","Reduced the left-edge back gesture area to avoid interfering with tab swipes."]},{"version":"4.23.0","date":"20 Aug 2026","title":"Desktop image actions","changes":["Restored the normal desktop right-click image menu for gallery and growth photos.","Kept mobile Save / Share controls and long-press actions intact."]},{"version":"4.22.0","date":"20 Aug 2026","title":"Visual depth pass","changes":["Added restrained shadows, layered surfaces, highlights and background texture.","Improved card, modal, form, image and hover depth without changing the dark botanical theme."]},{"version":"4.21.0","date":"20 Aug 2026","title":"Growing-zone deletion","changes":["Added Delete zone inside the zone editor.","Blocked deletion while plants are still assigned to the zone.","Added guarded cleanup of the zone label photo."]},{"version":"4.20.0","date":"20 Aug 2026","title":"Location label photos","changes":["Added label-photo upload and replacement to Edit Location.","Kept location images as simple labels without opening the photo viewer."]},{"version":"4.19.0","date":"20 Aug 2026","title":"Dashboard timing information","changes":["Added day countdowns to Upcoming care labels.","Replaced Collection snapshot with the age of the latest Growth Progress update."]},{"version":"4.18.0","date":"19 Aug 2026","title":"Dashboard filters and header cleanup","changes":["Added plant-group counters and dashboard filtering.","Used registered plant groups for consistent filters.","Simplified header controls, species labels and update prompts."]},{"version":"4.17.0","date":"19 Aug 2026","title":"Clearer care state","changes":["Separated saved Last recorded / Next check information from buttons that create new care actions.","Clarified care status wording and Upcoming dates."]},{"version":"4.16.0","date":"19 Aug 2026","title":"Dashboard quick care","changes":["Added one-tap Moist, Watered and Custom actions to dashboard care cards.","Added compact plant-group counters and refined desktop dashboard shortcuts."]},{"version":"4.15.0","date":"19 Aug 2026","title":"Reliable app updates","changes":["Improved stale-cache detection and update prompting.","Strengthened PWA refresh behaviour after new releases."]},{"version":"4.14.0","date":"19 Aug 2026","title":"Growth captions","changes":["Added editing for Growth Progress photo captions.","Improved gallery state cleanup after closing viewers."]},{"version":"4.13.0","date":"19 Aug 2026","title":"Mobile image actions","changes":["Added reliable long-press Save, Share and Copy actions for photos.","Prevented Safari text-selection menus from replacing image actions."]},{"version":"4.12.0","date":"19 Aug 2026","title":"Photo zoom and pan","changes":["Added pinch zoom and one-finger panning to enlarged gallery and growth photos.","Improved nested photo-viewer gesture handling."]},{"version":"4.11.0","date":"19 Aug 2026","title":"Structured plant-profile tabs","changes":["Introduced sticky Gallery, Growth, Details and Care sections on mobile.","Reorganised plant information and actions into clearer app-style panels."]},{"version":"4.10.0","date":"19 Aug 2026","title":"Mobile modal reliability","changes":["Fixed nested swipe modal freezes and two-level navigation problems.","Improved close-button cleanup and cleared viewer scroll state."]},{"version":"4.9.0","date":"19 Aug 2026","title":"Edge-back navigation","changes":["Added app-style edge-swipe back for plant profiles and full-screen photos.","Preserved separate back levels between photo viewer and plant profile."]},{"version":"4.8.0","date":"19 Aug 2026","title":"Plant views and safe areas","changes":["Added List, Compact grid and Large grid plant views.","Added iPhone Dynamic Island and safe-area spacing fixes.","Stored separate mobile and desktop view preferences."]},{"version":"4.7.0","date":"19 Aug 2026","title":"App-style mobile navigation","changes":["Added the Home, Plants, ＋, Zones and More bottom navigation.","Added owner quick actions for plants, growth photos and care entries."]},{"version":"4.6.0","date":"19 Aug 2026","title":"Installable Plant Room app","changes":["Added the PWA manifest, app icons and conservative offline shell.","Enabled standalone home-screen installation on supported phones."]},{"version":"4.5.2","date":"19 Aug 2026","title":"Compact zone light ratings","changes":["Simplified measured location-light ratings into a compact star display."]},{"version":"4.5.1","date":"19 Aug 2026","title":"Zone light stars","changes":["Converted auto-filled growing-zone light readings into easy star ratings."]},{"version":"4.5.0","date":"19 Aug 2026","title":"Measured zone lighting","changes":["Linked growing zones to measured PPFD light values.","Allowed Add Plant to inherit the selected zone's lighting."]},{"version":"4.4.1","date":"19 Aug 2026","title":"Preset stability fix","changes":["Fixed the Light preset editor render loop."]},{"version":"4.4.0","date":"19 Aug 2026","title":"Add Plant presets","changes":["Added reusable plant setup presets.","Added PPFD-based lighting choices to Add Plant."]},{"version":"4.3.3","date":"19 Aug 2026","title":"Desktop gallery modal","changes":["Converted desktop gallery controls into a true modal surface."]},{"version":"4.3.2","date":"19 Aug 2026","title":"Gallery menu stacking fix","changes":["Fixed desktop gallery menus appearing behind the plant dialog."]},{"version":"4.3.1","date":"19 Aug 2026","title":"Cleaner desktop photo controls","changes":["Consolidated desktop gallery photo commands into a compact menu."]},{"version":"4.3.0","date":"19 Aug 2026","title":"Desktop gallery workflow","changes":["Added drag reordering on desktop.","Added mouse-wheel browsing for enlarged photos."]},{"version":"4.2.1","date":"19 Aug 2026","title":"Editor access refinements","changes":["Improved mobile access to presets and repositioned desktop editing controls."]},{"version":"4.2.0","date":"19 Aug 2026","title":"Plant editor polish","changes":["Polished structured presets and mobile editing access."]},{"version":"4.1.0","date":"19 Aug 2026","title":"Full plant editor","changes":["Added the complete structured editor for plant identity, pot, medium, lighting, location and care settings."]},{"version":"4.0.0","date":"19 Aug 2026","title":"App-like mobile plant profile","changes":["Rebuilt the mobile plant page with an app-style full-screen profile.","Improved mobile presentation of galleries, growth history and plant details."]},{"version":"3.9.0","date":"19 Aug 2026","title":"Mobile gallery management","changes":["Added app-like drag reordering for mobile galleries.","Improved gallery asset loading and cache refresh."]},{"version":"3.8.0","date":"19 Aug 2026","title":"Mobile plant and viewer UX","changes":["Added tap-outside closing, sticky mobile headers and safer full-screen photo controls.","Added native Save / Share actions to gallery and growth viewers."]},{"version":"3.7.0","date":"19 Aug 2026","title":"Visual evidence bridge","changes":["Added temporary visual-evidence support for ChatGPT-assisted plant review."]},{"version":"3.6.1","date":"19 Aug 2026","title":"AI review reuse","changes":["Reused unchanged AI plant reviews instead of regenerating identical results."]},{"version":"3.6.0","date":"19 Aug 2026","title":"AI visual review","changes":["Added an AI Review action to individual plant profiles."]},{"version":"3.5.0","date":"19 Aug 2026","title":"Focused Telegram references","changes":["Created focused plant-reference packets for Telegram workflows."]},{"version":"3.4.0","date":"19 Aug 2026","title":"Plant aliases and shortcut search","changes":["Added alternate plant names and quicker search matching."]},{"version":"3.3.0","date":"19 Aug 2026","title":"Inbound Telegram archive","changes":["Added an archive for plant material received through Telegram."]},{"version":"3.2.0","date":"19 Aug 2026","title":"JasperJungleBot integration","changes":["Added direct sending through JasperJungleBot."]},{"version":"3.1.0","date":"19 Aug 2026","title":"Direct Telegram sharing","changes":["Added a direct Telegram share action for plant profiles."]},{"version":"3.0.0","date":"19 Aug 2026","title":"Compact growth timeline","changes":["Added the chronological Growth Progress photo gallery."]},{"version":"2.9.0","date":"19 Aug 2026","title":"Actual photo sharing","changes":["Allowed original plant photos to be included in sharing workflows."]},{"version":"2.8.0","date":"19 Aug 2026","title":"Share with ChatGPT","changes":["Added a plant-profile workflow for sharing plant context with ChatGPT."]},{"version":"2.7.0","date":"18 Aug 2026","title":"Permanent bundled-photo deletion","changes":["Allowed removed bundled gallery photos to be permanently deleted."]},{"version":"2.6.0","date":"18 Aug 2026","title":"Desktop photo fit","changes":["Improved photo sizing and containment on desktop."]},{"version":"2.5.0","date":"18 Aug 2026","title":"Photo viewer top-layer fix","changes":["Fixed the full-screen album viewer appearing below other dialogs."]},{"version":"2.4.0","date":"18 Aug 2026","title":"Album photo viewer","changes":["Added the full album-style plant photo viewer."]},{"version":"2.3.0","date":"18 Aug 2026","title":"Owner Add Plant","changes":["Added the owner-only Add Plant tab and creation workflow."]},{"version":"2.2.0","date":"18 Aug 2026","title":"Gallery manager and growing zones","changes":["Added gallery management tools.","Added interactive growing-zone cards and editing."]},{"version":"2.1.0","date":"18 Aug 2026","title":"Thumbnail and tab fixes","changes":["Added gallery thumbnail selection.","Fixed main section tab navigation."]},{"version":"2.0.0","date":"18 Aug 2026","title":"Cloud-hosted Plant Room","changes":["Prepared Plant Room for GitHub Pages.","Added the reusable UI patch deployment workflow."]},{"version":"1.0.0","date":"18 Aug 2026","title":"Initial Plant Room","changes":["Created the original dark botanical dashboard.","Added the plant collection, care queue, care log, locations and local data import / export foundation."]}];
  const style=document.createElement('style');
  style.id='v429PatchNotesStyles';
  style.textContent=`
#v416HeaderMenuPanel>#v429PatchNotesBtn{
  display:flex;width:100%;min-height:42px;align-items:center;gap:8px;box-sizing:border-box;margin:0;padding:0 10px;
  border:0;border-radius:9px;background:transparent;color:#dce7e1;font-size:12px;text-align:left;cursor:pointer
}
#v416HeaderMenuPanel>#v429PatchNotesBtn:hover{background:#1d322a}
#v429PatchNotesDialog{
  width:min(780px,calc(100vw - 30px));max-width:780px;height:min(84dvh,820px);max-height:820px;
  margin:auto;padding:0;border:1px solid rgba(129,166,148,.42);border-radius:22px;
  background:#101c18;color:#e8f0ec;box-shadow:0 35px 110px rgba(0,0,0,.68);overflow:hidden
}
#v429PatchNotesDialog::backdrop{background:rgba(2,6,5,.8);backdrop-filter:blur(7px)}
#v429PatchNotesDialog .v429-notebook{display:flex;flex-direction:column;height:100%;min-height:0}
#v429PatchNotesDialog .v429-head{
  position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:16px;
  padding:17px 18px;border-bottom:1px solid rgba(118,155,137,.28);
  background:linear-gradient(180deg,#1a3027,#13231d);box-shadow:0 8px 22px rgba(0,0,0,.22)
}
#v429PatchNotesDialog .v429-head-copy{min-width:0}
#v429PatchNotesDialog .v429-kicker{display:block;color:#d5be85;font:850 9px/1.2 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.14em;text-transform:uppercase}
#v429PatchNotesDialog h2{margin:5px 0 0;font:600 22px/1.15 Georgia,serif;color:#f0f5f2}
#v429PatchNotesDialog .v429-head small{display:block;margin-top:4px;color:#8ea299;font-size:10px}
#v429PatchNotesClose{
  display:grid;place-items:center;flex:0 0 auto;width:42px;height:42px;padding:0;border:1px solid #385247;
  border-radius:13px;background:#172a23;color:#e8f0ec;font-size:24px;line-height:1;cursor:pointer
}
#v429PatchNotesDialog .v429-paper{
  position:relative;flex:1 1 auto;min-height:0;overflow:auto;overscroll-behavior:contain;
  padding:20px 24px 38px 48px;
  background-color:#111e19;
  background-image:repeating-linear-gradient(180deg,transparent 0,transparent 31px,rgba(125,158,143,.075) 32px);
  scrollbar-color:#3e5b4e #101b17
}
#v429PatchNotesDialog .v429-paper::before{
  content:'';position:absolute;top:0;bottom:0;left:30px;width:1px;background:rgba(197,111,102,.28);pointer-events:none
}
#v429PatchNotesDialog .v429-release{
  position:relative;padding:0 0 20px;margin:0 0 20px;border-bottom:1px dashed rgba(121,157,139,.25)
}
#v429PatchNotesDialog .v429-release:last-child{margin-bottom:0;border-bottom:0}
#v429PatchNotesDialog .v429-release-head{display:flex;align-items:baseline;gap:9px;flex-wrap:wrap}
#v429PatchNotesDialog .v429-version{
  display:inline-flex;padding:4px 7px;border:1px solid rgba(213,190,133,.38);border-radius:7px;
  background:rgba(213,190,133,.09);color:#dfca91;font:800 11px/1 ui-monospace,SFMono-Regular,Consolas,monospace
}
#v429PatchNotesDialog .v429-release h3{margin:0;color:#eef4f1;font:700 15px/1.3 ui-monospace,SFMono-Regular,Consolas,monospace}
#v429PatchNotesDialog .v429-date{margin-left:auto;color:#71877d;font:600 9px/1.2 ui-monospace,SFMono-Regular,Consolas,monospace}
#v429PatchNotesDialog ul{margin:9px 0 0;padding:0 0 0 18px;color:#b6c6be;font:500 12px/1.6 ui-monospace,SFMono-Regular,Consolas,monospace}
#v429PatchNotesDialog li+li{margin-top:3px}
@media(max-width:700px){
  #v429PatchNotesDialog{
    width:100%;max-width:none;height:100dvh;max-height:none;margin:0;padding:0;border:0;border-radius:0
  }
  #v429PatchNotesDialog .v429-head{
    padding:max(13px,env(safe-area-inset-top)) 14px 13px
  }
  #v429PatchNotesDialog .v429-paper{
    padding:18px max(18px,env(safe-area-inset-right)) calc(30px + env(safe-area-inset-bottom)) max(42px,calc(env(safe-area-inset-left) + 42px))
  }
  #v429PatchNotesDialog .v429-paper::before{left:max(27px,calc(env(safe-area-inset-left) + 27px))}
  #v429PatchNotesDialog .v429-release-head{gap:7px}
  #v429PatchNotesDialog .v429-date{flex:0 0 100%;margin-left:0}
}
`;
  document.head.appendChild(style);

  function ensureDialog(){
    let dialog=document.getElementById('v429PatchNotesDialog');
    if(dialog)return dialog;
    dialog=document.createElement('dialog');dialog.id='v429PatchNotesDialog';dialog.setAttribute('aria-label','Plant Room patch notes');
    const notebook=document.createElement('div');notebook.className='v429-notebook';
    const head=document.createElement('header');head.className='v429-head';
    const copy=document.createElement('div');copy.className='v429-head-copy';
    const kicker=document.createElement('span');kicker.className='v429-kicker';kicker.textContent='Jasper\'s Plant Room';
    const title=document.createElement('h2');title.textContent='Patch notes';
    const note=document.createElement('small');note.textContent='Newest first · '+releases.length+' recorded releases';
    copy.append(kicker,title,note);
    const close=document.createElement('button');close.type='button';close.id='v429PatchNotesClose';close.setAttribute('aria-label','Close patch notes');close.textContent='×';
    head.append(copy,close);
    const paper=document.createElement('div');paper.className='v429-paper';
    releases.forEach(release=>{
      const section=document.createElement('section');section.className='v429-release';
      const releaseHead=document.createElement('div');releaseHead.className='v429-release-head';
      const version=document.createElement('span');version.className='v429-version';version.textContent='v'+release.version;
      const heading=document.createElement('h3');heading.textContent=release.title;
      const date=document.createElement('span');date.className='v429-date';date.textContent=release.date;
      releaseHead.append(version,heading,date);
      const list=document.createElement('ul');
      release.changes.forEach(change=>{const item=document.createElement('li');item.textContent=change;list.appendChild(item);});
      section.append(releaseHead,list);paper.appendChild(section);
    });
    notebook.append(head,paper);dialog.appendChild(notebook);document.body.appendChild(dialog);
    close.addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
    return dialog;
  }

  function openPatchNotes(){
    const dialog=ensureDialog();
    const paper=dialog.querySelector('.v429-paper');if(paper)paper.scrollTop=0;
    if(!dialog.open)dialog.showModal();
  }

  function installMenuItem(){
    const panel=document.getElementById('v416HeaderMenuPanel');
    if(!panel||document.getElementById('v429PatchNotesBtn'))return;
    const button=document.createElement('button');button.type='button';button.id='v429PatchNotesBtn';
    button.setAttribute('role','menuitem');button.textContent='▤  Patch notes';
    const signOut=document.getElementById('signOutBtn'),login=document.getElementById('adminLoginBtn');
    panel.insertBefore(button,signOut||login||null);
    button.addEventListener('click',()=>{
      panel.hidden=true;document.getElementById('v416HeaderMenuButton')?.setAttribute('aria-expanded','false');
      openPatchNotes();
    });
  }

  installMenuItem();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installMenuItem,{once:true});
  new MutationObserver(installMenuItem).observe(document.body,{childList:true,subtree:true});
})();


/* Jasper's Plant Room v4.30.0 — desktop Patch Notes shortcut. */
(function(){
  const mq=window.matchMedia('(min-width:701px)');
  const style=document.createElement('style');
  style.id='v430DesktopPatchNotesStyles';
  style.textContent=`
@media(min-width:701px){
  #v416HeaderMenuPanel>#v429PatchNotesBtn{display:flex!important}
  #v416Version.v430-patch-shortcut{
    cursor:pointer;transition:border-color 160ms ease,color 160ms ease,background 160ms ease,transform 100ms ease
  }
  #v416Version.v430-patch-shortcut:hover{
    border-color:rgba(213,190,133,.48);background:rgba(213,190,133,.09);color:#dbc58d
  }
  #v416Version.v430-patch-shortcut:active{transform:scale(.96)}
  #v416Version.v430-patch-shortcut:focus-visible{outline:2px solid rgba(213,190,133,.52);outline-offset:2px}
}
`;
  document.head.appendChild(style);

  function bind(){
    if(!mq.matches)return;
    const badge=document.getElementById('v416Version'),button=document.getElementById('v429PatchNotesBtn');
    if(!badge||!button||badge.dataset.v430PatchShortcut==='1')return;
    badge.dataset.v430PatchShortcut='1';badge.classList.add('v430-patch-shortcut');
    badge.setAttribute('role','button');badge.tabIndex=0;badge.title='Open Patch Notes';
    const open=()=>button.click();
    badge.addEventListener('click',open);
    badge.addEventListener('keydown',event=>{
      if(event.key==='Enter'||event.key===' '){event.preventDefault();open();}
    });
  }

  bind();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});
  new MutationObserver(bind).observe(document.body,{childList:true,subtree:true});
  if(typeof mq.addEventListener==='function')mq.addEventListener('change',bind);
})();


/* Jasper's Plant Room v4.32.0 — seamless mobile photo carousel. */
(function v432Carousel(){
  const mq=window.matchMedia('(max-width:700px)');
  const reduceMotion=()=>window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  let growthHint=null;

  const style=document.createElement('style');
  style.id='v432PhotoCarouselStyles';
  style.textContent=`
@media(max-width:700px){
  #photoLightboxStage,#growthViewStage{isolation:isolate}
  #photoLightboxStage .v432-photo-rail,#growthViewStage .v432-photo-rail{
    position:absolute;inset:0;width:300%;height:100%;display:flex;z-index:0;
    transform:translate3d(calc(-33.333333% + var(--v432-drag-x,0px)),0,0);
    will-change:transform
  }
  #photoLightboxStage .v432-photo-rail.v432-dragging,#growthViewStage .v432-photo-rail.v432-dragging{transition:none}
  #photoLightboxStage .v432-photo-rail.v432-snapping,#growthViewStage .v432-photo-rail.v432-snapping{
    transition:transform 255ms cubic-bezier(.22,.72,.2,1)
  }
  #photoLightboxStage .v432-photo-slide,#growthViewStage .v432-photo-slide{
    position:relative;flex:0 0 33.333333%;width:33.333333%;height:100%;
    display:grid;place-items:center;box-sizing:border-box;padding:6px 9px;overflow:hidden
  }
  #photoLightboxStage .v432-photo-slide::after,#growthViewStage .v432-photo-slide::after{
    content:"";position:absolute;inset:4% 0;pointer-events:none;
    box-shadow:inset 18px 0 24px -25px rgba(213,190,133,.52),inset -18px 0 24px -25px rgba(213,190,133,.52);
    opacity:.72
  }
  #photoLightboxStage .v432-photo-slide img,#growthViewStage .v432-photo-slide img{
    display:block;width:auto!important;height:auto!important;
    max-width:calc(100% - 4px)!important;max-height:calc(100% - 8px)!important;
    object-fit:contain;border:1px solid rgba(222,211,176,.24)!important;border-radius:11px!important;
    box-shadow:0 18px 42px rgba(0,0,0,.58),0 3px 12px rgba(0,0,0,.42),0 0 0 1px rgba(255,255,255,.035);
    transition:opacity 210ms ease,box-shadow 210ms ease;box-sizing:border-box
  }
  #photoLightboxStage .v432-photo-prev img,#growthViewStage .v432-photo-prev img{opacity:var(--v432-prev-opacity,.72)}
  #photoLightboxStage .v432-photo-current img,#growthViewStage .v432-photo-current img{opacity:var(--v432-current-opacity,1)}
  #photoLightboxStage .v432-photo-next img,#growthViewStage .v432-photo-next img{opacity:var(--v432-next-opacity,.72)}
  #photoLightboxStage .v432-photo-rail.v432-dragging img,#growthViewStage .v432-photo-rail.v432-dragging img{transition:none}
  #photoLightboxStage .v432-photo-clone,#growthViewStage .v432-photo-clone{
    pointer-events:none;-webkit-user-select:none;user-select:none;-webkit-user-drag:none
  }
  #photoLightboxStage .photo-lightbox-nav,#growthViewStage .growth-view-nav{z-index:6}
  #photoLightbox.v410-zoomed .v432-photo-rail,#growthPhotoViewer.v410-zoomed .v432-photo-rail{
    transform:translate3d(-33.333333%,0,0)!important;transition:none!important
  }
}
@media(max-width:700px) and (prefers-reduced-motion:reduce){
  #photoLightboxStage .v432-photo-rail,#growthViewStage .v432-photo-rail,
  #photoLightboxStage .v432-photo-slide img,#growthViewStage .v432-photo-slide img{transition:none!important}
}
`;
  document.head.appendChild(style);

  const absolute=url=>{try{return new URL(url||'',location.href).href;}catch(_){return url||'';}};
  const growthItems=p=>{
    try{return (cloudPhotos(p,'growth')||[]).slice().sort((a,b)=>
      String(b.photo_date||'').localeCompare(String(a.photo_date||''))||
      String(b.created_at||'').localeCompare(String(a.created_at||''))
    );}catch(_){return [];}
  };
  const galleryModel=()=>{
    try{
      if(typeof photoLightboxState==='undefined'||typeof db==='undefined')return null;
      const state=photoLightboxState,n=state.keys?.length||0;
      const p=(db.plants||[]).find(x=>String(x.cloudId)===String(state.plantId));
      if(!p||!n)return null;
      const urls=state.keys.map(key=>galleryItemByKey(p,key)?.url||'');
      return {urls,index:Math.max(0,Math.min(n-1,state.index||0))};
    }catch(_){return null;}
  };
  const growthModel=img=>{
    try{
      if(typeof db==='undefined')return null;
      const current=absolute(img.currentSrc||img.src),plants=db.plants||[];
      let p=growthHint&&plants.find(x=>String(x.cloudId)===String(growthHint.plantId));
      let items=p?growthItems(p):[];
      if(!items.some(x=>absolute(x.url)===current)){
        p=plants.find(plant=>growthItems(plant).some(x=>absolute(x.url)===current));
        items=p?growthItems(p):[];
      }
      if(!p||!items.length)return null;
      let index=items.findIndex(x=>absolute(x.url)===current);
      const counter=document.getElementById('growthViewCounter')?.textContent||'';
      const match=counter.match(/(\d+)\s*\/\s*(\d+)/);
      if(match&&Number(match[2])===items.length)index=Number(match[1])-1;
      if(index<0&&growthHint)index=items.findIndex(x=>String(x.id)===String(growthHint.id));
      if(index<0)index=0;
      growthHint={plantId:p.cloudId,id:items[index]?.id};
      return {urls:items.map(x=>x.url||''),index};
    }catch(_){return null;}
  };

  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-growth-view]');
    if(!button||typeof db==='undefined')return;
    const id=button.dataset.growthView;
    for(const p of db.plants||[]){
      const items=growthItems(p),index=items.findIndex(x=>String(x.id)===String(id));
      if(index>=0){growthHint={plantId:p.cloudId,id};break;}
    }
  },true);

  function enhance(dlg){
    if(!dlg||dlg.dataset.v432Carousel==='1')return;
    const stage=dlg.querySelector('#photoLightboxStage,#growthViewStage');
    const img=dlg.querySelector('#photoLightboxImg,#growthViewImg');
    if(!stage||!img)return;
    dlg.dataset.v432Carousel='1';

    const rail=document.createElement('div');
    rail.className='v432-photo-rail';
    rail.innerHTML='<div class="v432-photo-slide v432-photo-prev"><img class="v432-photo-clone" alt="" aria-hidden="true"></div><div class="v432-photo-slide v432-photo-current"></div><div class="v432-photo-slide v432-photo-next"><img class="v432-photo-clone" alt="" aria-hidden="true"></div>';
    stage.insertBefore(rail,stage.firstChild);
    rail.querySelector('.v432-photo-current').appendChild(img);
    const prevImg=rail.querySelector('.v432-photo-prev img'),nextImg=rail.querySelector('.v432-photo-next img');
    const prevButton=dlg.querySelector('#photoLightboxPrev,#growthViewPrev');
    const nextButton=dlg.querySelector('#photoLightboxNext,#growthViewNext');
    let drag=null,timer=0,count=0;

    const setVisual=(dx,progress=0,direction=0)=>{
      rail.style.setProperty('--v432-drag-x',`${dx}px`);
      rail.style.setProperty('--v432-current-opacity',String(1-progress*.13));
      rail.style.setProperty('--v432-prev-opacity',String(direction>0?.72+progress*.28:.72));
      rail.style.setProperty('--v432-next-opacity',String(direction<0?.72+progress*.28:.72));
    };
    const model=()=>dlg.id==='photoLightbox'?galleryModel():growthModel(img);
    const sync=()=>{
      const data=model();
      count=data?.urls?.length||0;rail.dataset.count=String(count);
      if(!data||!count){prevImg.removeAttribute('src');nextImg.removeAttribute('src');return;}
      const index=Math.max(0,Math.min(count-1,data.index||0));
      prevImg.src=data.urls[(index-1+count)%count]||'';
      nextImg.src=data.urls[(index+1)%count]||'';
      prevImg.alt='Previous photo';nextImg.alt='Next photo';
    };
    const reset=()=>{
      clearTimeout(timer);drag=null;
      rail.classList.remove('v432-dragging','v432-snapping');
      setVisual(0,0,0);
    };
    const finishMove=direction=>{
      const button=direction<0?prevButton:nextButton;
      button?.click();
      sync();reset();
    };
    const isOpen=()=>dlg.id==='photoLightbox'?!dlg.hidden:!!dlg.open;

    stage.addEventListener('pointerdown',event=>{
      if(mq.matches&&event.pointerType==='touch')event.stopImmediatePropagation();
    },true);
    stage.addEventListener('pointerup',event=>{
      if(mq.matches&&event.pointerType==='touch')event.stopImmediatePropagation();
    },true);

    stage.addEventListener('touchstart',event=>{
      if(!mq.matches||!isOpen()||event.touches.length!==1||count<2)return;
      if(dlg.dataset.v410Zoomed==='1'||dlg.dataset.v410Pinching==='1')return;
      const t=event.touches[0];
      if(t.clientX<=56)return;
      clearTimeout(timer);rail.classList.remove('v432-snapping');rail.classList.add('v432-dragging');
      drag={x:t.clientX,y:t.clientY,dx:0,locked:null,lastX:t.clientX,lastTime:performance.now(),velocity:0};
    },{capture:true,passive:true});

    stage.addEventListener('touchmove',event=>{
      if(!drag||event.touches.length!==1)return;
      if(dlg.dataset.v410Zoomed==='1'||dlg.dataset.v410Pinching==='1'){reset();return;}
      const t=event.touches[0],rawX=t.clientX-drag.x,rawY=t.clientY-drag.y;
      if(drag.locked===null&&(Math.abs(rawX)>7||Math.abs(rawY)>7)){
        drag.locked=Math.abs(rawX)>Math.abs(rawY)*1.08?'photo':'vertical';
        if(drag.locked==='vertical'){reset();return;}
      }
      if(drag.locked!=='photo')return;
      event.preventDefault();event.stopImmediatePropagation();
      const width=Math.max(1,stage.clientWidth),now=performance.now(),elapsed=Math.max(1,now-drag.lastTime);
      drag.velocity=(t.clientX-drag.lastX)/elapsed;drag.lastX=t.clientX;drag.lastTime=now;
      drag.dx=Math.max(-width*1.04,Math.min(width*1.04,rawX));
      setVisual(drag.dx,Math.min(1,Math.abs(drag.dx)/width),Math.sign(drag.dx));
    },{capture:true,passive:false});

    stage.addEventListener('touchend',event=>{
      if(!drag)return;
      if(dlg.dataset.v410Zoomed==='1'||dlg.dataset.v410Pinching==='1'){reset();return;}
      const active=drag.locked==='photo',dx=drag.dx,velocity=drag.velocity;
      drag=null;if(!active){reset();return;}
      event.preventDefault();event.stopImmediatePropagation();
      const width=Math.max(1,stage.clientWidth);
      const commit=Math.abs(dx)>=Math.min(92,width*.19)||Math.abs(velocity)>.48;
      rail.classList.remove('v432-dragging');
      if(!commit){
        rail.classList.add('v432-snapping');setVisual(0,0,0);
        timer=setTimeout(reset,reduceMotion()?0:270);return;
      }
      const direction=dx>0?-1:1,target=dx>0?width:-width;
      rail.classList.add('v432-snapping');setVisual(target,1,Math.sign(dx));
      timer=setTimeout(()=>finishMove(direction),reduceMotion()?0:270);
    },{capture:true,passive:false});

    stage.addEventListener('touchcancel',reset,{capture:true,passive:true});
    new MutationObserver(sync).observe(img,{attributes:true,attributeFilter:['src']});
    new MutationObserver(()=>{if(!isOpen())reset();else requestAnimationFrame(sync);})
      .observe(dlg,{attributes:true,attributeFilter:['hidden','open']});
    dlg.addEventListener('close',reset);
    sync();
  }

  const scan=()=>{
    enhance(document.getElementById('photoLightbox'));
    enhance(document.getElementById('growthPhotoViewer'));
  };
  scan();
  new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
  if(typeof mq.addEventListener==='function')mq.addEventListener('change',()=>{if(!mq.matches)document.querySelectorAll('.v432-photo-rail').forEach(rail=>{rail.classList.remove('v432-dragging','v432-snapping');rail.style.removeProperty('--v432-drag-x');});});
})();
