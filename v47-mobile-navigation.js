/* Jasper's Plant Room v4.25.0 — fluid mobile profile carousel */
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
  const VERSION='v4.25.0';
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
    let scale=1,panX=0,panY=0,gesture=null,resetTimer=0;
    const apply=()=>{
      img.style.setProperty('--v410-scale',String(scale));
      img.style.setProperty('--v410-pan-x',`${panX}px`);img.style.setProperty('--v410-pan-y',`${panY}px`);
      const zoomed=scale>1.01;
      dlg.dataset.v410Zoomed=zoomed?'1':'0';dlg.classList.toggle('v410-zoomed',zoomed);
    };
    const reset=(animate=false)=>{
      clearTimeout(resetTimer);gesture=null;delete dlg.dataset.v410Pinching;scale=1;panX=0;panY=0;
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

    stage.addEventListener('touchstart',e=>{
      if(e.touches.length===2){
        e.preventDefault();e.stopImmediatePropagation();clearTimeout(resetTimer);dlg.classList.remove('v410-zoom-resetting');
        dlg.dataset.v410Pinching='1';
        const mid=midpoint(e.touches[0],e.touches[1]);
        gesture={type:'pinch',distance:distance(e.touches[0],e.touches[1]),scale,panX,panY,midX:mid.x,midY:mid.y};
      }else if(e.touches.length===1&&scale>1.01){
        e.preventDefault();e.stopImmediatePropagation();
        gesture={type:'pan',x:e.touches[0].clientX,y:e.touches[0].clientY,panX,panY};dlg.classList.add('v410-zoom-panning');
      }
    },{capture:true,passive:false});
    stage.addEventListener('touchmove',e=>{
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
      if(!gesture)return;
      e.preventDefault();e.stopImmediatePropagation();dlg.classList.remove('v410-zoom-panning');
      if(e.touches.length===1&&scale>1.01){
        gesture={type:'pan',x:e.touches[0].clientX,y:e.touches[0].clientY,panX,panY};
      }else{
        gesture=null;delete dlg.dataset.v410Pinching;if(scale<=1.03)reset(true);else{containPan();apply();}
      }
    },{capture:true,passive:false});
    stage.addEventListener('touchcancel',()=>{gesture=null;delete dlg.dataset.v410Pinching;dlg.classList.remove('v410-zoom-panning');if(scale<=1.03)reset(true);},{capture:true,passive:true});
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


/* Jasper's Plant Room v4.25.0 — fluid mobile profile carousel. */
(function(){
  const mq=window.matchMedia('(max-width:700px)');
  const dlg=document.getElementById('plantDialog');
  if(!dlg)return;

  const names=['gallery','growth','details','care'];
  const style=document.createElement('style');
  style.id='v425PlantCarouselStyles';
  style.textContent=`
@media(max-width:700px){
  #plantDialog .v411-tabs.v425-tabs-ready{overflow:visible}
  #plantDialog .v411-tabs.v425-tabs-ready .v411-tab{
    z-index:2;transition:color 170ms ease,background 170ms ease,transform 110ms ease
  }
  #plantDialog .v411-tabs.v425-tabs-ready .v411-tab:active{transform:scale(.965)}
  #plantDialog .v411-tabs.v425-tabs-ready .v411-tab[aria-selected="true"]{
    background:rgba(36,60,51,.62);color:#f2f6f4
  }
  #plantDialog .v411-tabs.v425-tabs-ready .v411-tab[aria-selected="true"]::after{display:none}
  #plantDialog .v425-tab-indicator{
    position:absolute;z-index:3;bottom:4px;height:2px;border-radius:999px;background:#d5be85;
    box-shadow:0 0 9px rgba(213,190,133,.34);
    transition:transform 250ms cubic-bezier(.22,.8,.2,1),width 250ms cubic-bezier(.22,.8,.2,1);
    pointer-events:none
  }
  #plantDialog .v425-tab-indicator[data-dragging="1"]{transition:none}
  #plantDialog .v425-tab-viewport{
    width:100%;overflow:hidden;touch-action:pan-y;overscroll-behavior-x:contain;
    transition:height 240ms cubic-bezier(.22,.8,.2,1)
  }
  #plantDialog .v425-tab-track{
    display:flex;align-items:flex-start;width:100%;transform:translate3d(0,0,0);
    transition:transform 275ms cubic-bezier(.22,.8,.2,1);will-change:transform
  }
  #plantDialog .v425-tab-track[data-dragging="1"]{transition:none}
  #plantDialog .v425-tab-track>.v411-panel{
    display:block!important;flex:0 0 100%;width:100%;min-width:100%;box-sizing:border-box;
    touch-action:pan-y;overflow:visible
  }
  #plantDialog .v411-panel[data-v411-panel="details"]{padding-bottom:148px}
  #plantDialog .v411-panel[data-v411-panel="details"][data-active="1"] .v417-care-summary.v425-details-summary{
    position:fixed;z-index:2147482850;left:12px;right:12px;
    margin:0;padding:7px;border:1px solid rgba(123,159,142,.34);border-radius:17px;
    background:rgba(12,23,19,.94);backdrop-filter:blur(17px);-webkit-backdrop-filter:blur(17px);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.045),0 14px 38px rgba(0,0,0,.46)
  }
  body.owner-mode #plantDialog .v411-panel[data-v411-panel="details"][data-active="1"] .v425-details-summary{
    bottom:calc(82px + env(safe-area-inset-bottom))
  }
  body:not(.owner-mode) #plantDialog .v411-panel[data-v411-panel="details"][data-active="1"] .v425-details-summary{
    bottom:calc(12px + env(safe-area-inset-bottom))
  }
  #plantDialog .v425-details-summary .v417-care-state{padding:9px 10px}
  #plantDialog .v425-details-summary .v417-care-state strong{font-size:12px}
}
@media(prefers-reduced-motion:reduce){
  #plantDialog .v425-tab-track,#plantDialog .v425-tab-viewport,#plantDialog .v425-tab-indicator{transition:none!important}
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
    const tabs=inner.querySelector('.v411-tabs'),indicator=tabs?.querySelector('.v425-tab-indicator');
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

  function updateHeight(inner,animate=true){
    const viewport=inner.querySelector('.v425-tab-viewport');
    const panels=panelsOf(inner),index=activeIndex(inner),panel=panels[index];
    if(!viewport||!panel)return;
    if(!animate||reduceMotion())viewport.style.transition='none';
    viewport.style.height=`${Math.max(1,panel.scrollHeight)}px`;
    if(!animate||reduceMotion())requestAnimationFrame(()=>viewport.style.removeProperty('transition'));
  }

  function syncAccessibility(inner,index){
    panelsOf(inner).forEach((panel,i)=>{
      if(!panel)return;
      panel.setAttribute('aria-hidden',i===index?'false':'true');
      if(i===index)panel.removeAttribute('inert');else panel.setAttribute('inert','');
    });
  }

  function settle(inner,index,{animate=true,resetScroll=true}={}){
    const viewport=inner.querySelector('.v425-tab-viewport'),track=inner.querySelector('.v425-tab-track');
    if(!viewport||!track)return;
    const width=Math.max(1,viewport.clientWidth);
    track.dataset.dragging='0';
    if(!animate||reduceMotion())track.style.transition='none';
    track.style.transform=`translate3d(${-index*width}px,0,0)`;
    if(!animate||reduceMotion())requestAnimationFrame(()=>track.style.removeProperty('transition'));
    positionIndicator(inner,index,false);
    syncAccessibility(inner,index);
    updateHeight(inner,animate);
    if(resetScroll)resetProfileScroll(inner);
  }

  function moveSummary(inner){
    const details=inner.querySelector('.v411-panel[data-v411-panel="details"]');
    const summary=inner.querySelector('.v417-care-summary');
    if(!details||!summary)return;
    summary.classList.add('v425-details-summary');
    if(summary.parentElement!==details)details.appendChild(summary);
  }

  function setup(inner){
    if(!mq.matches||!dlg.open)return;
    const tabs=inner.querySelector('.v411-tabs'),panels=panelsOf(inner);
    if(!tabs||panels.some(panel=>!panel))return;
    moveSummary(inner);

    let viewport=inner.querySelector('.v425-tab-viewport');
    if(!viewport){
      viewport=document.createElement('div');viewport.className='v425-tab-viewport';
      const track=document.createElement('div');track.className='v425-tab-track';
      tabs.insertAdjacentElement('afterend',viewport);viewport.appendChild(track);
      panels.forEach(panel=>track.appendChild(panel));

      const indicator=document.createElement('span');indicator.className='v425-tab-indicator';indicator.setAttribute('aria-hidden','true');
      tabs.appendChild(indicator);tabs.classList.add('v425-tabs-ready');

      tabs.addEventListener('click',event=>{
        if(!event.target.closest('.v411-tab'))return;
        requestAnimationFrame(()=>{
          const index=activeIndex(inner);
          settle(inner,index,{animate:true,resetScroll:true});
        });
      });

      const resizeObserver=new ResizeObserver(()=>{
        if(!gesture||gesture.inner!==inner)updateHeight(inner,false);
      });
      panels.forEach(panel=>resizeObserver.observe(panel));
      observers.set(inner,resizeObserver);
      inner.dataset.v425Carousel='1';
      requestAnimationFrame(()=>settle(inner,activeIndex(inner),{animate:false,resetScroll:false}));
    }else{
      requestAnimationFrame(()=>{moveSummary(inner);updateHeight(inner,false);positionIndicator(inner,activeIndex(inner),false);});
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
    const panel=event.target.closest?.('.v425-tab-track>.v411-panel');
    const inner=panel?.closest('.dialog-inner'),viewport=inner?.querySelector('.v425-tab-viewport');
    if(!panel||!inner||!viewport||panel.dataset.active!=='1')return;
    if(event.target.closest?.('button,a,input,textarea,select,[contenteditable="true"]'))return;
    const touch=event.touches[0];if(touch.clientX<=28)return;
    const index=activeIndex(inner),width=Math.max(1,viewport.clientWidth);
    gesture={inner,viewport,track:inner.querySelector('.v425-tab-track'),index,width,startX:touch.clientX,startY:touch.clientY,startTime:performance.now(),dx:0,locked:null};
  },{capture:true,passive:true});

  dlg.addEventListener('touchmove',event=>{
    if(!gesture||event.touches.length!==1)return;
    const touch=event.touches[0],rawDx=touch.clientX-gesture.startX,dy=touch.clientY-gesture.startY;
    if(gesture.locked===null&&(Math.abs(rawDx)>8||Math.abs(dy)>8)){
      gesture.locked=Math.abs(rawDx)>Math.abs(dy)*1.15?'tabs':'scroll';
    }
    if(gesture.locked!=='tabs')return;
    event.preventDefault();
    let dx=rawDx;
    if((gesture.index===0&&dx>0)||(gesture.index===names.length-1&&dx<0))dx*=.24;
    gesture.dx=dx;gesture.track.dataset.dragging='1';
    gesture.track.style.transform=`translate3d(${-gesture.index*gesture.width+dx}px,0,0)`;
    const progress=gesture.index-dx/gesture.width;
    positionIndicator(gesture.inner,progress,true);
  },{capture:true,passive:false});

  dlg.addEventListener('touchend',event=>{
    if(!gesture)return;
    const current=gesture,changed=event.changedTouches[0];
    const rawDx=changed?changed.clientX-current.startX:current.dx;
    const elapsed=Math.max(1,performance.now()-current.startTime);
    const velocity=Math.abs(rawDx)/elapsed;
    gesture=null;
    if(current.locked!=='tabs'){settle(current.inner,current.index,{animate:false,resetScroll:false});return;}

    event.preventDefault();event.stopPropagation();
    const direction=rawDx<0?1:-1,targetIndex=current.index+direction;
    const commit=(Math.abs(rawDx)>=current.width*.18||(Math.abs(rawDx)>=30&&velocity>.42))&&targetIndex>=0&&targetIndex<names.length;
    if(!commit){settle(current.inner,current.index,{animate:true,resetScroll:false});return;}

    const target=current.inner.querySelector(`.v411-tab[data-v411-tab="${names[targetIndex]}"]`);
    if(!target){settle(current.inner,current.index,{animate:true,resetScroll:false});return;}
    target.click();
    navigator.vibrate?.(7);
  },{capture:true,passive:false});

  dlg.addEventListener('touchcancel',()=>{
    if(gesture)settle(gesture.inner,gesture.index,{animate:true,resetScroll:false});
    gesture=null;
  },{capture:true,passive:true});

  new MutationObserver(schedule).observe(dlg,{childList:true,subtree:true});
  dlg.addEventListener('close',()=>{
    gesture=null;queued=false;
    dlg.querySelectorAll('.dialog-inner').forEach(inner=>observers.get(inner)?.disconnect());
  });
  if(typeof mq.addEventListener==='function')mq.addEventListener('change',schedule);
  schedule();
})();

