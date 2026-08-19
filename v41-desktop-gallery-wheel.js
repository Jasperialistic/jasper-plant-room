/* Jasper's Plant Room v4.3 — desktop gallery drag reorder + mouse-wheel photo browsing */
(function(){
  const desktopMq=window.matchMedia('(min-width:701px)');
  let dragState=null;
  let wheelAccum=0;
  let wheelLocked=false;
  let wheelResetTimer=null;

  const css=`
@media(min-width:701px){
  body.owner-mode #plantDialog [data-panel="gallery"]{position:relative}
  body.owner-mode #plantDialog [data-panel="gallery"] [data-gallery-move]{display:none!important}
  body.owner-mode #plantDialog [data-panel="gallery"] .gallery-tile.manage{
    transition:transform .16s ease,opacity .16s ease,box-shadow .16s ease,border-color .16s ease;
  }
  body.owner-mode #plantDialog [data-panel="gallery"] .gallery-tile.manage .gallery-image-wrap{
    cursor:grab;-webkit-user-select:none;user-select:none;
  }
  body.owner-mode #plantDialog [data-panel="gallery"] .gallery-tile.manage .gallery-image-wrap:active{cursor:grabbing}
  body.owner-mode #plantDialog [data-panel="gallery"] .gallery-tile.manage.desktop-gallery-dragging{
    opacity:.56;transform:scale(.975);border-color:#d3b777!important;
    box-shadow:0 16px 34px rgba(0,0,0,.34);z-index:10;
  }
  body.owner-mode #plantDialog [data-panel="gallery"] .gallery-grid.desktop-gallery-reordering .gallery-tile.manage:not(.desktop-gallery-dragging){opacity:.8}
  body.owner-mode #plantDialog [data-panel="gallery"] .gallery-grid.desktop-gallery-saving{pointer-events:none;opacity:.72}
  .desktop-gallery-hint{
    display:flex;align-items:center;gap:7px;margin:7px 0 10px;padding:9px 11px;
    border:1px solid #2b4339;border-radius:11px;background:#111f1a;color:#9fb2aa;
    font-size:11px;line-height:1.35;
  }
  .desktop-gallery-hint strong{color:#e6eee9;font-weight:760}
}
`;
  const style=document.createElement('style');
  style.id='v41DesktopGalleryWheelStyles';
  style.textContent=css;
  document.getElementById(style.id)?.remove();
  document.head.appendChild(style);

  function desktopOwnerMode(){
    return desktopMq.matches && document.body.classList.contains('owner-mode');
  }

  function getTileKey(tile){
    return tile?.dataset.desktopGalleryKey ||
      tile?.querySelector('[data-gallery-key]')?.dataset.galleryKey ||
      tile?.querySelector('[data-gallery-thumb]')?.dataset.galleryThumb ||
      tile?.querySelector('[data-gallery-edit]')?.dataset.galleryEdit ||
      tile?.querySelector('[data-gallery-delete]')?.dataset.galleryDelete || '';
  }

  function findPlantForGalleryKey(key){
    try{
      const title=document.querySelector('#plantDialog .modal-head h2')?.textContent?.trim();
      const plants=(typeof db!=='undefined'&&db?.plants)||[];
      const byTitle=plants.filter(p=>p.name===title);
      const titled=byTitle.find(p=>typeof galleryPhotos==='function'&&galleryPhotos(p).some(x=>x.key===key));
      if(titled)return titled;
      return plants.find(p=>typeof galleryPhotos==='function'&&galleryPhotos(p).some(x=>x.key===key))||null;
    }catch(_e){return null;}
  }

  function currentKeys(grid){
    return [...grid.querySelectorAll('.gallery-tile.manage[data-desktop-gallery-key]')].map(x=>x.dataset.desktopGalleryKey);
  }

  function restoreOriginalOrder(state){
    const {grid,originalKeys}=state;
    const byKey=new Map([...grid.querySelectorAll('.gallery-tile.manage[data-desktop-gallery-key]')].map(tile=>[tile.dataset.desktopGalleryKey,tile]));
    originalKeys.forEach(key=>{const tile=byKey.get(key);if(tile)grid.appendChild(tile);});
  }

  function clearDragVisuals(state){
    if(!state)return;
    state.tile.classList.remove('desktop-gallery-dragging');
    state.grid.classList.remove('desktop-gallery-reordering');
  }

  async function saveDraggedOrder(state){
    if(!state || state.saving)return;
    state.saving=true;
    clearDragVisuals(state);
    const {grid,key,originalKeys,tile}=state;
    const keys=currentKeys(grid);
    const changed=keys.length===originalKeys.length && keys.some((k,i)=>k!==originalKeys[i]);
    const hint=grid.parentElement?.querySelector('.desktop-gallery-hint');

    tile.dataset.desktopSuppressClick='1';
    setTimeout(()=>{delete tile.dataset.desktopSuppressClick;},400);

    if(!changed){
      if(hint)hint.innerHTML='<strong>Tip:</strong> Drag a photo to reorder the gallery. Click a photo to open it.';
      dragState=null;
      return;
    }

    const plant=findPlantForGalleryKey(key);
    if(!plant || typeof galleryPhotos!=='function' || typeof persistGalleryOrder!=='function'){
      restoreOriginalOrder(state);
      if(hint)hint.textContent='Could not save the new order. Reopen the plant and try again.';
      dragState=null;
      return;
    }

    const current=galleryPhotos(plant);
    const byKey=new Map(current.map(item=>[item.key,item]));
    const ordered=keys.map(k=>byKey.get(k)).filter(Boolean);
    if(ordered.length!==current.length){
      restoreOriginalOrder(state);
      if(hint)hint.textContent='Gallery changed while reordering. Please try again.';
      dragState=null;
      return;
    }

    grid.classList.add('desktop-gallery-saving');
    if(hint)hint.innerHTML='<strong>Saving order…</strong> Syncing the new sequence.';
    try{
      if(typeof setCloudStatus==='function')setCloudStatus('Reordering gallery…');
      await persistGalleryOrder(plant,ordered);
      if(typeof loadCloud==='function')await loadCloud();
      if(typeof openPlant==='function')openPlant(plant.cloudId,'gallery');
    }catch(error){
      console.error('Desktop gallery reorder failed',error);
      grid.classList.remove('desktop-gallery-saving');
      restoreOriginalOrder(state);
      if(hint)hint.textContent='Could not save the new order. Please try again.';
      if(typeof setCloudStatus==='function')setCloudStatus('Sync error',true);
      alert(error?.message||'Could not save gallery order.');
    }finally{
      dragState=null;
    }
  }

  function bindDesktopDrag(tile,wrap,grid,key){
    if(tile.dataset.desktopDragBound==='1')return;
    tile.dataset.desktopDragBound='1';
    tile.dataset.desktopGalleryKey=key;
    wrap.setAttribute('draggable','true');
    const img=wrap.querySelector('img');
    if(img)img.draggable=false;

    wrap.addEventListener('dragstart',e=>{
      if(!desktopOwnerMode()){
        e.preventDefault();
        return;
      }
      dragState={tile,wrap,grid,key,originalKeys:currentKeys(grid),saving:false,dropped:false};
      tile.classList.add('desktop-gallery-dragging');
      grid.classList.add('desktop-gallery-reordering');
      try{
        e.dataTransfer.effectAllowed='move';
        e.dataTransfer.setData('text/plain',key);
      }catch(_e){}
      const hint=grid.parentElement?.querySelector('.desktop-gallery-hint');
      if(hint)hint.innerHTML='<strong>Reordering</strong> Drop the photo in its new position.';
    });

    wrap.addEventListener('dragend',()=>{
      const state=dragState;
      if(!state || state.tile!==tile || state.saving)return;
      if(!state.dropped){
        restoreOriginalOrder(state);
        clearDragVisuals(state);
        const hint=grid.parentElement?.querySelector('.desktop-gallery-hint');
        if(hint)hint.innerHTML='<strong>Tip:</strong> Drag a photo to reorder the gallery. Click a photo to open it.';
        dragState=null;
      }
    });

    tile.addEventListener('click',e=>{
      if(tile.dataset.desktopSuppressClick==='1'){
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },true);
  }

  function bindGridDrop(grid){
    if(grid.dataset.desktopDropBound==='1')return;
    grid.dataset.desktopDropBound='1';

    grid.addEventListener('dragover',e=>{
      if(!desktopOwnerMode() || !dragState || dragState.grid!==grid)return;
      e.preventDefault();
      try{e.dataTransfer.dropEffect='move';}catch(_e){}
      const hit=e.target.closest('.gallery-tile.manage[data-desktop-gallery-key]');
      const tile=dragState.tile;
      if(!hit || hit===tile || hit.parentElement!==grid)return;
      const tiles=[...grid.querySelectorAll('.gallery-tile.manage[data-desktop-gallery-key]')];
      const from=tiles.indexOf(tile),to=tiles.indexOf(hit);
      if(from<0||to<0||from===to)return;
      if(from<to)grid.insertBefore(tile,hit.nextSibling);
      else grid.insertBefore(tile,hit);
    });

    grid.addEventListener('drop',e=>{
      if(!desktopOwnerMode() || !dragState || dragState.grid!==grid)return;
      e.preventDefault();
      dragState.dropped=true;
      saveDraggedOrder(dragState);
    });
  }

  function enhanceDesktopGallery(){
    if(!desktopOwnerMode())return;
    const panel=document.querySelector('#plantDialog [data-panel="gallery"]');
    const grid=panel?.querySelector('.gallery-grid');
    if(!panel||!grid)return;

    if(!panel.querySelector('.desktop-gallery-hint')){
      const hint=document.createElement('div');
      hint.className='desktop-gallery-hint';
      hint.innerHTML='<strong>Tip:</strong> Drag a photo to reorder the gallery. Click a photo to open it.';
      grid.parentElement.insertBefore(hint,grid);
    }

    bindGridDrop(grid);
    grid.querySelectorAll('.gallery-tile.manage').forEach(tile=>{
      const wrap=tile.querySelector('.gallery-image-wrap');
      const key=getTileKey(tile);
      if(!wrap||!key)return;
      bindDesktopDrag(tile,wrap,grid,key);
    });
  }

  function resetWheelGesture(){
    wheelAccum=0;
    wheelLocked=false;
    wheelResetTimer=null;
  }

  function enhancePhotoWheel(){
    const lb=document.getElementById('photoLightbox');
    const stage=lb?.querySelector('#photoLightboxStage');
    if(!stage || stage.dataset.desktopWheelBound==='1')return;
    stage.dataset.desktopWheelBound='1';

    stage.addEventListener('wheel',e=>{
      if(!desktopMq.matches || !lb.open)return;
      const count=(typeof photoLightboxState!=='undefined'&&photoLightboxState?.keys?.length)||0;
      if(count<2)return;
      e.preventDefault();

      clearTimeout(wheelResetTimer);
      wheelResetTimer=setTimeout(resetWheelGesture,180);
      if(wheelLocked)return;

      const delta=Math.abs(e.deltaY)>=Math.abs(e.deltaX)?e.deltaY:e.deltaX;
      wheelAccum+=delta;
      if(Math.abs(wheelAccum)<45)return;

      wheelLocked=true;
      const direction=wheelAccum>0?1:-1;
      wheelAccum=0;
      if(typeof movePhotoLightbox==='function')movePhotoLightbox(direction);
    },{passive:false});

    const hint=lb.querySelector('.photo-lightbox-hint');
    if(hint && !/mouse wheel/i.test(hint.textContent||'')){
      hint.textContent='← → or mouse wheel to browse · Esc to close · tap black area to close';
    }
  }

  function sync(){
    requestAnimationFrame(()=>{
      enhanceDesktopGallery();
      enhancePhotoWheel();
    });
  }

  sync();
  const observer=new MutationObserver(sync);
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','open']});
  if(typeof desktopMq.addEventListener==='function')desktopMq.addEventListener('change',sync);
})();
