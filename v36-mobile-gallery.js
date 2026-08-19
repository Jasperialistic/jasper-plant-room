/* Jasper's Plant Room v3.9 — app-like mobile gallery management */
(function(){
  const MOBILE_QUERY='(max-width:700px)';
  const LONG_PRESS_MS=360;
  const MOVE_CANCEL_PX=10;
  const mq=window.matchMedia(MOBILE_QUERY);
  let dragState=null;

  const css=`
@media(max-width:700px){
  body.owner-mode #plantDialog [data-panel="gallery"]{position:relative}
  body.owner-mode #plantDialog [data-panel="gallery"] .gallery-grid{
    grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;
  }
  body.owner-mode #plantDialog [data-panel="gallery"] .gallery-tile.manage{
    position:relative;overflow:hidden;border-radius:14px;background:#101b17;
    border:1px solid #263b33;box-shadow:0 5px 16px rgba(0,0,0,.16);
    transition:transform .16s ease,opacity .16s ease,box-shadow .16s ease,border-color .16s ease;
  }
  body.owner-mode #plantDialog [data-panel="gallery"] .gallery-tile.manage .gallery-image-wrap{
    position:relative;aspect-ratio:4/5;overflow:hidden;background:#0b1310;
    -webkit-user-select:none;user-select:none;-webkit-touch-callout:none;
  }
  body.owner-mode #plantDialog [data-panel="gallery"] .gallery-tile.manage .gallery-image-wrap img{
    display:block;width:100%;height:100%;object-fit:cover;
    -webkit-user-select:none;user-select:none;-webkit-user-drag:none;
  }
  body.owner-mode #plantDialog [data-panel="gallery"] .gallery-controls{display:none!important}
  body.owner-mode #plantDialog [data-panel="gallery"] .gallery-caption{
    padding:7px 9px 9px;font-size:11px;line-height:1.35;
    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
  }
  body.owner-mode #plantDialog [data-panel="gallery"] .photo-meta{
    font-size:10px;line-height:1.25;padding:18px 7px 6px;
    background:linear-gradient(transparent,rgba(0,0,0,.78));
  }
  .mobile-gallery-hint{
    display:flex;align-items:center;gap:7px;margin:7px 0 10px;padding:9px 11px;
    border:1px solid #2b4339;border-radius:12px;background:#111f1a;color:#a8bbb2;
    font-size:11px;line-height:1.35;
  }
  .mobile-gallery-hint strong{color:#e6eee9;font-weight:750}
  .mobile-gallery-menu-button{
    position:absolute;z-index:8;top:7px;right:7px;width:38px;height:38px;border:1px solid rgba(255,255,255,.18);
    border-radius:50%;display:grid;place-items:center;padding:0;background:rgba(4,10,8,.78);color:#fff;
    font-size:23px;line-height:1;letter-spacing:1px;box-shadow:0 5px 14px rgba(0,0,0,.26);
  }
  .mobile-gallery-menu-button:active{transform:scale(.94)}
  .gallery-tile.manage.mobile-gallery-dragging{
    z-index:25;opacity:.86;transform:scale(.965);border-color:#d3b777;
    box-shadow:0 15px 35px rgba(0,0,0,.42);
  }
  .gallery-grid.mobile-gallery-reordering .gallery-tile.manage:not(.mobile-gallery-dragging){opacity:.72}
  .gallery-grid.mobile-gallery-saving{pointer-events:none;opacity:.72}

  #mobileGalleryActions{
    width:100%;max-width:none;margin:auto 0 0;padding:0;border:0;background:transparent;color:#edf4f0;
  }
  #mobileGalleryActions::backdrop{background:rgba(0,0,0,.62);backdrop-filter:blur(2px)}
  #mobileGalleryActions .mobile-gallery-sheet{
    width:100%;box-sizing:border-box;padding:9px 12px max(14px,env(safe-area-inset-bottom));
    border-radius:22px 22px 0 0;background:#13221d;border:1px solid #2c433a;border-bottom:0;
    box-shadow:0 -18px 44px rgba(0,0,0,.4);
  }
  #mobileGalleryActions .mobile-gallery-sheet-grab{
    width:40px;height:4px;border-radius:999px;background:#496057;margin:2px auto 12px;
  }
  #mobileGalleryActions .mobile-gallery-sheet-title{padding:0 5px 10px}
  #mobileGalleryActions .mobile-gallery-sheet-title strong{display:block;font-size:14px}
  #mobileGalleryActions .mobile-gallery-sheet-title span{display:block;margin-top:3px;color:#90a59b;font-size:11px}
  #mobileGalleryActions .mobile-gallery-action{
    width:100%;min-height:50px;margin:0 0 7px;padding:0 14px;border-radius:13px;
    border:1px solid #2b4439;background:#192b24;color:#edf4f0;text-align:left;font-size:14px;font-weight:680;
  }
  #mobileGalleryActions .mobile-gallery-action[disabled]{opacity:.48}
  #mobileGalleryActions .mobile-gallery-action.danger{color:#f1b4b4;border-color:#663e3e;background:#2a1c1c}
  #mobileGalleryActions .mobile-gallery-cancel{text-align:center;color:#a9bbb3;background:#101b17}
}
`;

  const style=document.createElement('style');
  style.id='v36MobileGalleryStyles';
  style.textContent=css;
  document.getElementById(style.id)?.remove();
  document.head.appendChild(style);

  function mobileOwnerMode(){
    return mq.matches && document.body.classList.contains('owner-mode');
  }

  function getTileKey(tile){
    return tile?.dataset.mobileGalleryKey ||
      tile?.querySelector('[data-gallery-key]')?.dataset.galleryKey ||
      tile?.querySelector('[data-gallery-thumb]')?.dataset.galleryThumb ||
      tile?.querySelector('[data-gallery-edit]')?.dataset.galleryEdit ||
      tile?.querySelector('[data-gallery-delete]')?.dataset.galleryDelete || '';
  }

  function ensureActionSheet(){
    let dlg=document.getElementById('mobileGalleryActions');
    if(dlg)return dlg;
    dlg=document.createElement('dialog');
    dlg.id='mobileGalleryActions';
    dlg.setAttribute('aria-label','Gallery photo actions');
    dlg.innerHTML='<div class="mobile-gallery-sheet"><div class="mobile-gallery-sheet-grab"></div><div class="mobile-gallery-sheet-title"><strong>Photo options</strong><span>Manage this gallery photo</span></div><div id="mobileGalleryActionList"></div><button type="button" class="mobile-gallery-action mobile-gallery-cancel" id="mobileGalleryCancel">Cancel</button></div>';
    document.body.appendChild(dlg);
    dlg.querySelector('#mobileGalleryCancel').onclick=()=>dlg.close();
    dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close();});
    dlg.addEventListener('cancel',e=>{e.preventDefault();dlg.close();});
    return dlg;
  }

  function openActionSheet(tile){
    if(!mobileOwnerMode())return;
    const dlg=ensureActionSheet();
    const list=dlg.querySelector('#mobileGalleryActionList');
    const thumb=tile.querySelector('[data-gallery-thumb]');
    const edit=tile.querySelector('[data-gallery-edit]');
    const del=tile.querySelector('[data-gallery-delete]');
    const actions=[];

    if(thumb){
      const current=thumb.classList.contains('primary-control') || /★\s*Thumbnail/i.test(thumb.textContent||'');
      actions.push({label:current?'★ Current thumbnail':'☆ Set as thumbnail',source:thumb,disabled:current});
    }
    if(edit)actions.push({label:'Edit date / caption',source:edit});
    if(del)actions.push({label:'Delete photo',source:del,danger:true});

    list.innerHTML='';
    actions.forEach(action=>{
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='mobile-gallery-action'+(action.danger?' danger':'');
      btn.textContent=action.label;
      btn.disabled=!!action.disabled;
      btn.onclick=()=>{
        if(btn.disabled)return;
        dlg.close();
        setTimeout(()=>action.source.click(),0);
      };
      list.appendChild(btn);
    });
    if(!dlg.open)dlg.showModal();
  }

  function cancelPendingDrag(){
    if(!dragState)return;
    clearTimeout(dragState.timer);
    dragState.timer=null;
  }

  function beginDrag(){
    if(!dragState || dragState.active)return;
    const {tile,grid}=dragState;
    dragState.active=true;
    dragState.originalKeys=[...grid.querySelectorAll('.gallery-tile.manage[data-mobile-gallery-key]')].map(x=>x.dataset.mobileGalleryKey);
    tile.classList.add('mobile-gallery-dragging');
    grid.classList.add('mobile-gallery-reordering');
    const hint=grid.parentElement?.querySelector('.mobile-gallery-hint');
    if(hint)hint.innerHTML='<strong>Reordering</strong> Drag this photo to its new position, then release.';
    try{navigator.vibrate?.(18);}catch(_e){}
  }

  function moveDraggedTile(x,y){
    if(!dragState?.active)return;
    const {tile,grid}=dragState;
    const hit=document.elementFromPoint(x,y)?.closest('.gallery-tile.manage[data-mobile-gallery-key]');
    if(!hit || hit===tile || hit.parentElement!==grid)return;
    const tiles=[...grid.querySelectorAll('.gallery-tile.manage[data-mobile-gallery-key]')];
    const from=tiles.indexOf(tile),to=tiles.indexOf(hit);
    if(from<0||to<0||from===to)return;
    if(from<to)grid.insertBefore(tile,hit.nextSibling);
    else grid.insertBefore(tile,hit);
  }

  function findPlantForGalleryKey(key){
    try{
      const title=document.querySelector('#plantDialog .modal-head h2')?.textContent?.trim();
      const byTitle=(typeof db!=='undefined'&&db?.plants||[]).filter(p=>p.name===title);
      const titled=byTitle.find(p=>typeof galleryPhotos==='function'&&galleryPhotos(p).some(x=>x.key===key));
      if(titled)return titled;
      return (typeof db!=='undefined'&&db?.plants||[]).find(p=>typeof galleryPhotos==='function'&&galleryPhotos(p).some(x=>x.key===key));
    }catch(_e){return null;}
  }

  async function finishDrag(){
    if(!dragState)return;
    cancelPendingDrag();
    const state=dragState;
    dragState=null;
    if(!state.active)return;

    const {tile,grid,key,originalKeys}=state;
    tile.classList.remove('mobile-gallery-dragging');
    grid.classList.remove('mobile-gallery-reordering');
    tile.dataset.mobileSuppressClick='1';
    setTimeout(()=>{delete tile.dataset.mobileSuppressClick;},450);

    const keys=[...grid.querySelectorAll('.gallery-tile.manage[data-mobile-gallery-key]')].map(x=>x.dataset.mobileGalleryKey);
    const changed=keys.length===originalKeys.length && keys.some((k,i)=>k!==originalKeys[i]);
    const hint=grid.parentElement?.querySelector('.mobile-gallery-hint');
    if(!changed){
      if(hint)hint.innerHTML='<strong>Tip:</strong> Hold a photo, then drag it to reorder. Tap ⋯ for edit/delete.';
      return;
    }

    const plant=findPlantForGalleryKey(key);
    if(!plant || typeof galleryPhotos!=='function' || typeof persistGalleryOrder!=='function'){
      if(hint)hint.textContent='Could not save the new order. Please reopen the plant and try again.';
      return;
    }

    const current=galleryPhotos(plant);
    const byKey=new Map(current.map(item=>[item.key,item]));
    const ordered=keys.map(k=>byKey.get(k)).filter(Boolean);
    if(ordered.length!==current.length){
      if(hint)hint.textContent='Gallery changed while reordering. Please try again.';
      return;
    }

    grid.classList.add('mobile-gallery-saving');
    if(hint)hint.innerHTML='<strong>Saving order…</strong> Syncing the new sequence.';
    try{
      if(typeof setCloudStatus==='function')setCloudStatus('Reordering gallery…');
      await persistGalleryOrder(plant,ordered);
      if(typeof loadCloud==='function')await loadCloud();
      if(typeof openPlant==='function')openPlant(plant.cloudId,'gallery');
    }catch(error){
      console.error('Mobile gallery reorder failed',error);
      grid.classList.remove('mobile-gallery-saving');
      if(hint)hint.textContent='Could not save the new order. Please try again.';
      if(typeof setCloudStatus==='function')setCloudStatus('Sync error',true);
      alert(error?.message||'Could not save gallery order.');
    }
  }

  function bindDrag(tile,wrap,grid,key){
    if(tile.dataset.mobileDragBound==='1')return;
    tile.dataset.mobileDragBound='1';

    wrap.addEventListener('contextmenu',e=>{
      if(mobileOwnerMode())e.preventDefault();
    });

    wrap.addEventListener('touchstart',e=>{
      if(!mobileOwnerMode() || e.touches.length!==1 || e.target.closest('.mobile-gallery-menu-button'))return;
      const t=e.touches[0];
      dragState={tile,wrap,grid,key,touchId:t.identifier,startX:t.clientX,startY:t.clientY,active:false,timer:null};
      dragState.timer=setTimeout(beginDrag,LONG_PRESS_MS);
    },{passive:true});

    wrap.addEventListener('touchmove',e=>{
      if(!dragState || dragState.tile!==tile)return;
      const t=[...e.touches].find(x=>x.identifier===dragState.touchId);
      if(!t)return;
      const dx=t.clientX-dragState.startX,dy=t.clientY-dragState.startY;
      if(!dragState.active && Math.hypot(dx,dy)>MOVE_CANCEL_PX){
        cancelPendingDrag();
        dragState=null;
        return;
      }
      if(dragState.active){
        e.preventDefault();
        moveDraggedTile(t.clientX,t.clientY);
      }
    },{passive:false});

    wrap.addEventListener('touchend',e=>{
      if(!dragState || dragState.tile!==tile)return;
      if(dragState.active)e.preventDefault();
      finishDrag();
    },{passive:false});

    wrap.addEventListener('touchcancel',()=>{
      if(!dragState || dragState.tile!==tile)return;
      const wasActive=dragState.active;
      cancelPendingDrag();
      if(wasActive){
        tile.classList.remove('mobile-gallery-dragging');
        grid.classList.remove('mobile-gallery-reordering');
      }
      dragState=null;
    },{passive:true});

    tile.addEventListener('click',e=>{
      if(tile.dataset.mobileSuppressClick==='1'){
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },true);
  }

  function enhanceMobileGallery(){
    if(!mobileOwnerMode())return;
    const panel=document.querySelector('#plantDialog [data-panel="gallery"]');
    const grid=panel?.querySelector('.gallery-grid');
    if(!panel||!grid)return;

    if(!panel.querySelector('.mobile-gallery-hint')){
      const hint=document.createElement('div');
      hint.className='mobile-gallery-hint';
      hint.innerHTML='<strong>Tip:</strong> Hold a photo, then drag it to reorder. Tap ⋯ for edit/delete.';
      grid.parentElement.insertBefore(hint,grid);
    }

    grid.querySelectorAll('.gallery-tile.manage').forEach(tile=>{
      const key=getTileKey(tile);
      const wrap=tile.querySelector('.gallery-image-wrap');
      if(!key||!wrap)return;
      tile.dataset.mobileGalleryKey=key;

      if(!wrap.querySelector('.mobile-gallery-menu-button')){
        const menu=document.createElement('button');
        menu.type='button';
        menu.className='mobile-gallery-menu-button';
        menu.setAttribute('aria-label','Photo options');
        menu.textContent='⋯';
        menu.addEventListener('touchstart',e=>e.stopPropagation(),{passive:true});
        menu.onclick=e=>{e.preventDefault();e.stopPropagation();openActionSheet(tile);};
        wrap.appendChild(menu);
      }
      bindDrag(tile,wrap,grid,key);
    });
  }

  function scheduleEnhance(){requestAnimationFrame(enhanceMobileGallery);}

  scheduleEnhance();
  const observer=new MutationObserver(scheduleEnhance);
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','open']});
  if(typeof mq.addEventListener==='function')mq.addEventListener('change',scheduleEnhance);
})();
