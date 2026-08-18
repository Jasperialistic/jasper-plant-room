/* Jasper's Plant Room v2.5 — top-layer album viewer hotfix */
(function(){
  const css = `
#photoLightbox.photo-lightbox{
  position:fixed;inset:0;z-index:2147483647;margin:0;padding:0;border:0;
  width:100vw;height:100vh;height:100dvh;max-width:none;max-height:none;
  background:#030706;color:#fff;overflow:hidden;box-sizing:border-box;
}
#photoLightbox.photo-lightbox:not([open]){display:none!important}
#photoLightbox.photo-lightbox[open]{display:grid!important;grid-template-rows:auto minmax(0,1fr) auto;align-items:center;justify-items:center}
#photoLightbox.photo-lightbox::backdrop{background:rgba(3,7,6,.97)}
#photoLightbox .photo-lightbox-top{position:relative;z-index:6;width:100%;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 14px;box-sizing:border-box;background:linear-gradient(rgba(0,0,0,.7),rgba(0,0,0,0))}
#photoLightbox .photo-lightbox-title{min-width:0;padding-right:8px}
#photoLightbox .photo-lightbox-title strong{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px}
#photoLightbox .photo-lightbox-title span{display:block;color:#aebbb6;font-size:12px;margin-top:3px}
#photoLightbox .photo-lightbox-close{display:grid;place-items:center;flex:0 0 auto;border:0;background:rgba(255,255,255,.13);color:#fff;width:44px;height:44px;border-radius:50%;font-size:27px;line-height:1;cursor:pointer}
#photoLightbox .photo-lightbox-stage{position:relative;width:100%;height:100%;min-width:0;min-height:0;display:grid;place-items:center;overflow:hidden;touch-action:pan-y;overscroll-behavior:contain;background:#030706}
#photoLightbox .photo-lightbox-img{display:block;width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain;user-select:none;-webkit-user-select:none;-webkit-user-drag:none}
#photoLightbox .photo-lightbox-nav{position:absolute;z-index:7;top:50%;transform:translateY(-50%);display:grid;place-items:center;width:54px;height:72px;border:1px solid rgba(255,255,255,.12);border-radius:16px;background:rgba(0,0,0,.52);color:#fff;font-size:36px;line-height:1;cursor:pointer;box-shadow:0 8px 25px rgba(0,0,0,.28)}
#photoLightbox .photo-lightbox-nav:hover{background:rgba(255,255,255,.16)}
#photoLightbox .photo-lightbox-prev{left:14px}
#photoLightbox .photo-lightbox-next{right:14px}
#photoLightbox .photo-lightbox-nav[hidden]{display:none!important}
#photoLightbox .photo-lightbox-bottom{position:relative;z-index:6;width:min(940px,100%);text-align:center;color:#fff;padding:9px 14px 12px;box-sizing:border-box;background:linear-gradient(rgba(0,0,0,0),rgba(0,0,0,.72))}
#photoLightbox .photo-lightbox-caption{font-size:13px;line-height:1.45;color:#d5dfdb;min-height:18px}
#photoLightbox .photo-lightbox-counter{font-size:12px;color:#9baba5;margin-top:4px;font-variant-numeric:tabular-nums}
#photoLightbox .photo-lightbox-hint{font-size:11px;color:#74857e;margin-top:3px}
@media(max-width:650px){
  #photoLightbox .photo-lightbox-top{padding:7px 9px}
  #photoLightbox .photo-lightbox-close{width:40px;height:40px;font-size:25px}
  #photoLightbox .photo-lightbox-nav{width:42px;height:62px;border-radius:12px;font-size:31px;background:rgba(0,0,0,.58)}
  #photoLightbox .photo-lightbox-prev{left:4px}
  #photoLightbox .photo-lightbox-next{right:4px}
  #photoLightbox .photo-lightbox-bottom{padding:7px 9px 10px}
  #photoLightbox .photo-lightbox-hint{display:none}
}
`;
  const style=document.createElement('style');
  style.id='v25PhotoViewerStyles';
  style.textContent=css;
  document.head.appendChild(style);

  ensurePhotoLightbox = function(){
    let lb=document.getElementById('photoLightbox');
    if(lb && lb.tagName!=='DIALOG'){
      lb.remove();
      lb=null;
    }
    if(lb)return lb;

    lb=document.createElement('dialog');
    lb.id='photoLightbox';
    lb.className='photo-lightbox';
    lb.setAttribute('aria-label','Plant photo viewer');
    lb.innerHTML=`
      <div class="photo-lightbox-top">
        <div class="photo-lightbox-title"><strong id="photoLightboxPlant"></strong><span id="photoLightboxMeta"></span></div>
        <button type="button" class="photo-lightbox-close" id="photoLightboxClose" aria-label="Close photo viewer">×</button>
      </div>
      <div class="photo-lightbox-stage" id="photoLightboxStage">
        <button type="button" class="photo-lightbox-nav photo-lightbox-prev" id="photoLightboxPrev" aria-label="Previous photo">‹</button>
        <img class="photo-lightbox-img" id="photoLightboxImg" alt="" draggable="false">
        <button type="button" class="photo-lightbox-nav photo-lightbox-next" id="photoLightboxNext" aria-label="Next photo">›</button>
      </div>
      <div class="photo-lightbox-bottom">
        <div class="photo-lightbox-caption" id="photoLightboxCaption"></div>
        <div class="photo-lightbox-counter" id="photoLightboxCounter"></div>
        <div class="photo-lightbox-hint">← → to browse · Esc to close · swipe on phone</div>
      </div>`;
    document.body.appendChild(lb);

    const closeBtn=document.getElementById('photoLightboxClose');
    const prevBtn=document.getElementById('photoLightboxPrev');
    const nextBtn=document.getElementById('photoLightboxNext');
    const stage=document.getElementById('photoLightboxStage');

    closeBtn.onclick=function(e){e.stopPropagation();closePhotoLightbox();};
    prevBtn.onclick=function(e){e.stopPropagation();movePhotoLightbox(-1);};
    nextBtn.onclick=function(e){e.stopPropagation();movePhotoLightbox(1);};

    stage.addEventListener('click',function(e){
      if(e.target===stage)closePhotoLightbox();
    });

    let touchStart=null;
    stage.addEventListener('touchstart',function(e){
      if(e.touches.length!==1){touchStart=null;return;}
      const t=e.touches[0];
      touchStart={x:t.clientX,y:t.clientY};
    },{passive:true});
    stage.addEventListener('touchend',function(e){
      if(!touchStart || !e.changedTouches.length)return;
      const t=e.changedTouches[0];
      const dx=t.clientX-touchStart.x;
      const dy=t.clientY-touchStart.y;
      touchStart=null;
      if(Math.abs(dx)>45 && Math.abs(dx)>Math.abs(dy)*1.15){
        e.preventDefault();
        movePhotoLightbox(dx>0?-1:1);
      }
    },{passive:false});
    stage.addEventListener('touchcancel',function(){touchStart=null;},{passive:true});

    lb.addEventListener('cancel',function(e){
      e.preventDefault();
      closePhotoLightbox();
    });
    lb.addEventListener('close',function(){
      document.body.style.overflow=photoLightboxState.bodyOverflow||'';
    });

    if(!window.__plantV25PhotoKeysBound){
      window.__plantV25PhotoKeysBound=true;
      document.addEventListener('keydown',function(e){
        const current=document.getElementById('photoLightbox');
        if(!current || current.tagName!=='DIALOG' || !current.open)return;
        if(e.key==='Escape'){
          e.preventDefault();e.stopPropagation();closePhotoLightbox();
        }else if(e.key==='ArrowLeft'){
          e.preventDefault();e.stopPropagation();movePhotoLightbox(-1);
        }else if(e.key==='ArrowRight'){
          e.preventDefault();e.stopPropagation();movePhotoLightbox(1);
        }
      },true);
    }
    return lb;
  };

  openPhotoLightbox = function(p,key){
    const arr=galleryPhotos(p);
    if(!arr.length)return;
    let i=arr.findIndex(x=>x.key===key);
    if(i<0)i=0;
    photoLightboxState={...photoLightboxState,plantId:p.cloudId,keys:arr.map(x=>x.key),index:i,bodyOverflow:document.body.style.overflow,pointerX:null};
    const lb=ensurePhotoLightbox();
    document.body.style.overflow='hidden';
    if(!lb.open)lb.showModal();
    renderPhotoLightbox();
    requestAnimationFrame(()=>document.getElementById('photoLightboxClose')?.focus({preventScroll:true}));
  };

  movePhotoLightbox = function(delta){
    const n=photoLightboxState.keys.length;
    if(!n)return;
    photoLightboxState.index=(photoLightboxState.index+delta+n)%n;
    renderPhotoLightbox();
  };

  renderPhotoLightbox = function(){
    const p=db.plants.find(x=>String(x.cloudId)===String(photoLightboxState.plantId));
    if(!p){closePhotoLightbox();return;}
    const key=photoLightboxState.keys[photoLightboxState.index];
    const item=galleryItemByKey(p,key);
    if(!item){closePhotoLightbox();return;}

    const img=document.getElementById('photoLightboxImg');
    img.src=item.url;
    img.alt=`${p.name} photo ${photoLightboxState.index+1}`;
    document.getElementById('photoLightboxPlant').textContent=p.name;
    document.getElementById('photoLightboxMeta').textContent=item.photo_date?fmt(item.photo_date):(item.base?'Collection photo':'Gallery photo');
    document.getElementById('photoLightboxCaption').textContent=item.note||'';
    document.getElementById('photoLightboxCounter').textContent=`${photoLightboxState.index+1} / ${photoLightboxState.keys.length}`;

    const many=photoLightboxState.keys.length>1;
    document.getElementById('photoLightboxPrev').hidden=!many;
    document.getElementById('photoLightboxNext').hidden=!many;
    if(typeof setPlantPreview==='function')setPlantPreview(p,key);
  };

  closePhotoLightbox = function(){
    const lb=document.getElementById('photoLightbox');
    if(lb && lb.tagName==='DIALOG' && lb.open)lb.close();
    else document.body.style.overflow=photoLightboxState.bodyOverflow||'';
  };
})();
