/* Jasper's Plant Room v3.0 — compact growth timeline gallery */
(function(){
  const PAGE_SIZE=30;
  const visibleByPlant=new Map();
  let growthViewerState={plantId:null,items:[],index:0,bodyOverflow:'',touchStart:null};

  const style=document.createElement('style');
  style.id='v30GrowthGalleryStyles';
  style.textContent=`
/* v3.0 growth timeline */
.growth-gallery-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:8px 0 12px}
.growth-gallery-head .growth-summary{display:flex;align-items:baseline;gap:8px;min-width:0}
.growth-gallery-head .growth-summary strong{font-size:.92rem}
.growth-gallery-head .growth-summary span{font-size:.75rem;color:var(--muted)}
.growth-gallery-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px}
.growth-thumb{position:relative;display:block;width:100%;aspect-ratio:4/5;padding:0;border:0;border-radius:12px;overflow:hidden;background:#0b1210;cursor:pointer;color:#fff}
.growth-thumb img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .18s ease,opacity .18s ease}
.growth-thumb:hover img{transform:scale(1.018)}
.growth-thumb .growth-date{position:absolute;left:0;right:0;bottom:0;padding:22px 7px 6px;background:linear-gradient(transparent,rgba(0,0,0,.78));font-size:.66rem;line-height:1.2;text-align:left;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.growth-more-wrap{display:flex;justify-content:center;margin:14px 0 2px}
.growth-more-wrap button{min-width:150px}
.growth-empty{padding:28px 18px;border:1px dashed rgba(255,255,255,.13);border-radius:16px;text-align:center;color:var(--muted);line-height:1.5}

#growthPhotoViewer{position:fixed;inset:0;width:100vw;height:100vh;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;background:#030706;color:#fff;overflow:hidden;box-sizing:border-box}
#growthPhotoViewer:not([open]){display:none!important}
#growthPhotoViewer[open]{display:grid!important;grid-template-rows:auto minmax(0,1fr) auto;align-items:center;justify-items:center}
#growthPhotoViewer::backdrop{background:rgba(3,7,6,.97)}
.growth-view-top{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 12px;box-sizing:border-box;background:linear-gradient(rgba(0,0,0,.72),rgba(0,0,0,0));z-index:4}
.growth-view-title{min-width:0}
.growth-view-title strong{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px}
.growth-view-title span{display:block;color:#9caaa5;font-size:11px;margin-top:2px}
.growth-view-actions{display:flex;gap:7px;align-items:center;flex:0 0 auto;position:relative}
.growth-view-icon{display:grid;place-items:center;border:0;background:rgba(255,255,255,.12);color:#fff;width:42px;height:42px;border-radius:50%;font-size:22px;cursor:pointer}
.growth-view-menu{position:absolute;right:48px;top:45px;min-width:155px;padding:6px;background:#14231e;border:1px solid #31483f;border-radius:12px;box-shadow:0 16px 38px rgba(0,0,0,.45);z-index:12}
.growth-view-menu[hidden]{display:none!important}
.growth-view-menu button{display:block;width:100%;padding:9px 10px;border:0;border-radius:8px;text-align:left;background:transparent;color:#edf4f0;cursor:pointer;font-size:12px}
.growth-view-menu button:hover{background:rgba(255,255,255,.07)}
.growth-view-menu button.danger{color:#efabab}
.growth-view-stage{position:relative;width:100%;height:100%;min-width:0;min-height:0;display:grid;place-items:center;overflow:hidden;touch-action:pan-y;overscroll-behavior:contain}
.growth-view-img{display:block;width:auto;height:auto;max-width:min(84vw,1180px);max-height:min(77dvh,830px);object-fit:contain;border-radius:7px;user-select:none;-webkit-user-select:none;-webkit-user-drag:none}
.growth-view-nav{position:absolute;top:50%;transform:translateY(-50%);display:grid;place-items:center;width:52px;height:70px;border:1px solid rgba(255,255,255,.12);border-radius:15px;background:rgba(0,0,0,.5);color:#fff;font-size:34px;cursor:pointer;z-index:5}
.growth-view-nav:hover{background:rgba(255,255,255,.14)}
.growth-view-prev{left:18px}.growth-view-next{right:18px}
.growth-view-nav[hidden]{display:none!important}
.growth-view-bottom{width:min(900px,100%);padding:8px 14px 12px;box-sizing:border-box;text-align:center;background:linear-gradient(rgba(0,0,0,0),rgba(0,0,0,.72));z-index:4}
.growth-view-date{font-size:12px;color:#d8e1dd}
.growth-view-note{font-size:12px;color:#9eada7;line-height:1.4;min-height:17px;margin-top:3px}
.growth-view-counter{font-size:11px;color:#71817b;margin-top:3px;font-variant-numeric:tabular-nums}

@media(max-width:650px){
  .growth-gallery-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:4px}
  .growth-thumb{border-radius:7px}
  .growth-thumb .growth-date{padding:16px 5px 5px;font-size:.6rem}
  .growth-gallery-head{margin-top:6px}
  .growth-gallery-head .growth-summary span{display:none}
  .growth-view-top{padding:6px 8px}
  .growth-view-icon{width:39px;height:39px;font-size:21px}
  .growth-view-img{max-width:100vw;max-height:calc(100dvh - 118px);border-radius:0}
  .growth-view-nav{width:39px;height:58px;border-radius:11px;font-size:29px;background:rgba(0,0,0,.55)}
  .growth-view-prev{left:2px}.growth-view-next{right:2px}
  .growth-view-bottom{padding:6px 10px 9px}
}
`;
  document.head.appendChild(style);

  function growthItems(p){
    let arr=[];
    try{arr=cloudPhotos(p,'growth')||[];}catch(_){arr=[];}
    return arr.slice().sort((a,b)=>
      String(b.photo_date||'').localeCompare(String(a.photo_date||'')) ||
      String(b.created_at||'').localeCompare(String(a.created_at||''))
    );
  }

  function growthLabel(x){
    try{return x.photo_date?fmt(x.photo_date):'Progress photo';}catch(_){return x.photo_date||'Progress photo';}
  }

  function currentLimit(p){
    const key=String(p.cloudId);
    if(!visibleByPlant.has(key))visibleByPlant.set(key,PAGE_SIZE);
    return visibleByPlant.get(key);
  }

  growthHTML=function(p){
    const arr=growthItems(p);
    const limit=currentLimit(p);
    const shown=arr.slice(0,limit);
    const head=`<div class="growth-gallery-head"><div class="growth-summary"><strong>Growth timeline</strong><span>${arr.length} photo${arr.length===1?'':'s'} · newest first</span></div>${isOwner?'<button type="button" class="primary small" data-add-photo="growth">+ Add growth photo</button>':''}</div>`;
    if(!arr.length)return `${head}<div class="growth-empty">No growth photos yet.${isOwner?'<br>Add the first one and this becomes the plant\'s visual history.':''}</div>`;
    const grid=`<div class="growth-gallery-grid">${shown.map(x=>`<button type="button" class="growth-thumb" data-growth-view="${esc(x.id)}" aria-label="Open growth photo ${esc(growthLabel(x))}"><img loading="lazy" src="${x.url}" alt="${esc(p.name)} growth progress"><span class="growth-date">${esc(growthLabel(x))}</span></button>`).join('')}</div>`;
    const more=arr.length>shown.length?`<div class="growth-more-wrap"><button type="button" class="ghost small" data-growth-more>Show older photos (${arr.length-shown.length})</button></div>`:'';
    return head+grid+more;
  };

  function ensureGrowthViewer(){
    let dlg=document.getElementById('growthPhotoViewer');
    if(dlg)return dlg;
    dlg=document.createElement('dialog');
    dlg.id='growthPhotoViewer';
    dlg.setAttribute('aria-label','Growth progress photo viewer');
    dlg.innerHTML=`
      <div class="growth-view-top">
        <div class="growth-view-title"><strong id="growthViewPlant"></strong><span>Growth progress</span></div>
        <div class="growth-view-actions">
          <button type="button" class="growth-view-icon" id="growthViewManage" aria-label="Manage photo" title="Manage photo">⋯</button>
          <div class="growth-view-menu" id="growthViewMenu" hidden><button type="button" class="danger" id="growthViewDelete">Delete this photo</button></div>
          <button type="button" class="growth-view-icon" id="growthViewClose" aria-label="Close">×</button>
        </div>
      </div>
      <div class="growth-view-stage" id="growthViewStage">
        <button type="button" class="growth-view-nav growth-view-prev" id="growthViewPrev" aria-label="Previous photo">‹</button>
        <img class="growth-view-img" id="growthViewImg" alt="" draggable="false">
        <button type="button" class="growth-view-nav growth-view-next" id="growthViewNext" aria-label="Next photo">›</button>
      </div>
      <div class="growth-view-bottom">
        <div class="growth-view-date" id="growthViewDate"></div>
        <div class="growth-view-note" id="growthViewNote"></div>
        <div class="growth-view-counter" id="growthViewCounter"></div>
      </div>`;
    document.body.appendChild(dlg);

    const stage=document.getElementById('growthViewStage');
    document.getElementById('growthViewClose').onclick=closeGrowthViewer;
    document.getElementById('growthViewPrev').onclick=e=>{e.stopPropagation();moveGrowthViewer(-1);};
    document.getElementById('growthViewNext').onclick=e=>{e.stopPropagation();moveGrowthViewer(1);};
    document.getElementById('growthViewManage').onclick=e=>{e.stopPropagation();const menu=document.getElementById('growthViewMenu');menu.hidden=!menu.hidden;};
    document.getElementById('growthViewDelete').onclick=async()=>{
      const item=growthViewerState.items[growthViewerState.index];
      const p=db.plants.find(x=>String(x.cloudId)===String(growthViewerState.plantId));
      if(!item||!p)return;
      closeGrowthViewer();
      await deletePhoto(item.id,p.cloudId,'growth');
    };
    dlg.addEventListener('click',e=>{
      const menu=document.getElementById('growthViewMenu');
      if(!menu.hidden && !menu.contains(e.target) && e.target.id!=='growthViewManage')menu.hidden=true;
    });
    dlg.addEventListener('cancel',e=>{e.preventDefault();closeGrowthViewer();});

    stage.addEventListener('touchstart',e=>{
      if(e.touches.length!==1){growthViewerState.touchStart=null;return;}
      const t=e.touches[0];growthViewerState.touchStart={x:t.clientX,y:t.clientY};
    },{passive:true});
    stage.addEventListener('touchend',e=>{
      if(!growthViewerState.touchStart||!e.changedTouches.length)return;
      const t=e.changedTouches[0],dx=t.clientX-growthViewerState.touchStart.x,dy=t.clientY-growthViewerState.touchStart.y;
      growthViewerState.touchStart=null;
      if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.15){e.preventDefault();moveGrowthViewer(dx>0?-1:1);}
    },{passive:false});
    stage.addEventListener('touchcancel',()=>growthViewerState.touchStart=null,{passive:true});

    if(!window.__v30GrowthKeys){
      window.__v30GrowthKeys=true;
      document.addEventListener('keydown',e=>{
        const current=document.getElementById('growthPhotoViewer');
        if(!current||!current.open)return;
        if(e.key==='Escape'){e.preventDefault();closeGrowthViewer();}
        else if(e.key==='ArrowLeft'){e.preventDefault();moveGrowthViewer(-1);}
        else if(e.key==='ArrowRight'){e.preventDefault();moveGrowthViewer(1);}
      },true);
    }
    return dlg;
  }

  function openGrowthViewer(p,id){
    const items=growthItems(p);
    if(!items.length)return;
    let index=items.findIndex(x=>String(x.id)===String(id));
    if(index<0)index=0;
    growthViewerState={plantId:p.cloudId,items,index,bodyOverflow:document.body.style.overflow,touchStart:null};
    const dlg=ensureGrowthViewer();
    document.body.style.overflow='hidden';
    if(!dlg.open)dlg.showModal();
    renderGrowthViewer();
  }

  function renderGrowthViewer(){
    const p=db.plants.find(x=>String(x.cloudId)===String(growthViewerState.plantId));
    const item=growthViewerState.items[growthViewerState.index];
    if(!p||!item){closeGrowthViewer();return;}
    document.getElementById('growthViewImg').src=item.url;
    document.getElementById('growthViewImg').alt=`${p.name} growth photo ${growthViewerState.index+1}`;
    document.getElementById('growthViewPlant').textContent=p.name;
    document.getElementById('growthViewDate').textContent=growthLabel(item);
    document.getElementById('growthViewNote').textContent=item.note||'';
    document.getElementById('growthViewCounter').textContent=`${growthViewerState.index+1} / ${growthViewerState.items.length}`;
    const many=growthViewerState.items.length>1;
    document.getElementById('growthViewPrev').hidden=!many;
    document.getElementById('growthViewNext').hidden=!many;
    document.getElementById('growthViewManage').hidden=!isOwner;
    document.getElementById('growthViewMenu').hidden=true;
  }

  function moveGrowthViewer(delta){
    const n=growthViewerState.items.length;
    if(n<2)return;
    growthViewerState.index=(growthViewerState.index+delta+n)%n;
    renderGrowthViewer();
  }

  function closeGrowthViewer(){
    const dlg=document.getElementById('growthPhotoViewer');
    if(dlg&&dlg.open)dlg.close();
    document.body.style.overflow=growthViewerState.bodyOverflow||'';
  }
  window.openGrowthViewer=openGrowthViewer;
  window.closeGrowthViewer=closeGrowthViewer;

  function bindGrowthGallery(p){
    const root=document.getElementById('plantDialog');
    if(!root)return;
    root.querySelectorAll('[data-growth-view]').forEach(btn=>{
      btn.onclick=()=>openGrowthViewer(p,btn.dataset.growthView);
    });
    root.querySelectorAll('[data-add-photo="growth"]').forEach(btn=>{
      btn.onclick=()=>openPhotoDialog(p,'growth');
    });
    const more=root.querySelector('[data-growth-more]');
    if(more){
      more.onclick=()=>{
        const key=String(p.cloudId);
        visibleByPlant.set(key,currentLimit(p)+PAGE_SIZE);
        const panel=root.querySelector('[data-panel="growth"]');
        if(panel){panel.innerHTML=growthHTML(p);bindGrowthGallery(p);}
      };
    }
  }

  if(typeof openPlant==='function'){
    const previousOpenPlant=openPlant;
    openPlant=function(cloudId,activeTab='gallery'){
      const result=previousOpenPlant(cloudId,activeTab);
      const p=db.plants.find(x=>String(x.cloudId)===String(cloudId));
      if(p)requestAnimationFrame(()=>bindGrowthGallery(p));
      return result;
    };
  }
})();
