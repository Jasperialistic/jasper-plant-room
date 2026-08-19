/* Jasper's Plant Room v4.0 — app-like mobile plant profile */
(function(){
  const mq=window.matchMedia('(max-width:700px)');

  const css=`
@media(max-width:700px){
  #plantDialog.dialog{
    width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;
    margin:0!important;padding:0!important;border:0!important;border-radius:0!important;background:#0f1a17!important;
  }
  #plantDialog::backdrop{background:rgba(2,7,5,.88)}
  #plantDialog #plantDialogBody{min-height:100dvh;background:#0f1a17}
  #plantDialog .dialog-inner{
    box-sizing:border-box;min-height:100dvh;padding:0 14px calc(86px + env(safe-area-inset-bottom))!important;
  }
  #plantDialog .modal-head{
    position:sticky!important;top:0!important;z-index:50!important;
    display:flex;align-items:center;justify-content:space-between;gap:12px;
    margin:0 -14px!important;padding:max(10px,env(safe-area-inset-top)) 14px 10px!important;
    min-height:58px;box-sizing:border-box;
    background:rgba(15,26,23,.96)!important;backdrop-filter:blur(14px);
    border-bottom:1px solid rgba(255,255,255,.07);
  }
  #plantDialog .modal-head>div{min-width:0}
  #plantDialog .modal-head .eyebrow{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:10px}
  #plantDialog .modal-head h2{margin:2px 0 0;font-size:20px;line-height:1.08;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #plantDialog .modal-head .icon-btn{width:44px!important;height:44px!important;flex:0 0 auto;border-radius:50%!important}

  #plantDialog #mainPhoto.gallery-main{
    display:block;width:calc(100% + 28px)!important;height:min(47dvh,500px)!important;max-height:none!important;
    margin:0 -14px!important;border-radius:0!important;object-fit:contain!important;background:#07100d;
    cursor:zoom-in;-webkit-user-select:none;user-select:none;-webkit-user-drag:none;
  }

  #plantDialog .profile-tabs{
    position:sticky;top:calc(64px + env(safe-area-inset-top));z-index:42;
    display:grid!important;grid-template-columns:1fr 1fr!important;gap:7px!important;
    margin:0 -14px 12px!important;padding:9px 14px!important;
    background:rgba(15,26,23,.96);backdrop-filter:blur(14px);
    border-bottom:1px solid rgba(255,255,255,.06);
  }
  #plantDialog .profile-tab{min-height:44px!important;border-radius:12px!important;font-size:12px!important;font-weight:760!important}
  #plantDialog .profile-panel{margin-bottom:18px}

  #plantDialog .detail-grid{
    display:block!important;margin:12px 0 16px!important;border-top:1px solid #263b33;border-bottom:1px solid #263b33;
  }
  #plantDialog .detail{
    display:grid!important;grid-template-columns:minmax(100px,34%) minmax(0,1fr)!important;gap:14px!important;
    align-items:start!important;padding:12px 2px!important;margin:0!important;border:0!important;border-bottom:1px solid #22362e!important;
    border-radius:0!important;background:transparent!important;box-shadow:none!important;
  }
  #plantDialog .detail:last-child{border-bottom:0!important}
  #plantDialog .detail span{font-size:11px!important;line-height:1.35;color:#91a69d!important;text-transform:none!important;letter-spacing:.01em!important}
  #plantDialog .detail strong{font-size:13px!important;line-height:1.42;text-align:right;font-weight:680!important;overflow-wrap:anywhere}
  #plantDialog .rule-box{margin:14px 0 16px!important;border-radius:14px!important;padding:13px!important;line-height:1.5}
  #plantDialog .quick-actions{margin:14px 0 8px!important;padding:12px!important;border:1px solid #294036;border-radius:15px;background:#111f1a}
  #plantDialog .quick-actions::before{content:'Care actions';display:block;width:100%;margin:0 0 8px;color:#91a69d;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}
  #plantDialog .quick-actions #editPlantBtn{display:none!important}
  #plantDialog .quick-actions button{min-height:44px!important}

  #mobilePlantBar{
    position:fixed;z-index:2147483000;left:10px;right:10px;bottom:max(9px,env(safe-area-inset-bottom));
    display:flex;align-items:center;gap:8px;padding:8px;border:1px solid rgba(255,255,255,.09);border-radius:18px;
    background:rgba(17,31,26,.94);backdrop-filter:blur(16px);box-shadow:0 14px 38px rgba(0,0,0,.42);
  }
  #mobilePlantBar[hidden]{display:none!important}
  #mobilePlantGrowth{
    min-height:50px;flex:1;border:1px solid #d5be85;border-radius:13px;background:#d5be85;color:#152017;
    font-size:14px;font-weight:850;padding:0 16px;
  }
  #mobilePlantMore{
    width:50px;height:50px;flex:0 0 50px;border:1px solid #365047;border-radius:13px;background:#1a2d26;color:#edf4f0;
    font-size:25px;line-height:1;letter-spacing:1px;padding:0;
  }

  #mobilePlantActions{
    width:100%;max-width:none;margin:auto 0 0;padding:0;border:0;background:transparent;color:#edf4f0;
  }
  #mobilePlantActions::backdrop{background:rgba(0,0,0,.64);backdrop-filter:blur(2px)}
  #mobilePlantActions .mobile-plant-sheet{
    width:100%;box-sizing:border-box;padding:9px 12px max(14px,env(safe-area-inset-bottom));
    border-radius:22px 22px 0 0;background:#13221d;border:1px solid #2c433a;border-bottom:0;box-shadow:0 -18px 44px rgba(0,0,0,.4);
  }
  #mobilePlantActions .mobile-plant-grab{width:40px;height:4px;border-radius:999px;background:#496057;margin:2px auto 12px}
  #mobilePlantActions .mobile-plant-title{padding:0 5px 10px}
  #mobilePlantActions .mobile-plant-title strong{display:block;font-size:15px}
  #mobilePlantActions .mobile-plant-title span{display:block;margin-top:3px;color:#90a59b;font-size:11px}
  #mobilePlantActions .mobile-plant-action{
    width:100%;min-height:50px;margin:0 0 7px;padding:0 14px;border-radius:13px;border:1px solid #2b4439;
    background:#192b24;color:#edf4f0;text-align:left;font-size:14px;font-weight:700;
  }
  #mobilePlantActions .mobile-plant-cancel{text-align:center;color:#a9bbb3;background:#101b17}
}
`;

  const style=document.createElement('style');
  style.id='v37MobilePlantScreenStyles';
  style.textContent=css;
  document.getElementById(style.id)?.remove();
  document.head.appendChild(style);

  function isMobileOwner(){return mq.matches && document.body.classList.contains('owner-mode');}
  function plantDialog(){return document.getElementById('plantDialog');}

  function currentPlant(){
    try{
      const title=plantDialog()?.querySelector('.modal-head h2')?.textContent?.trim();
      if(!title || typeof db==='undefined')return null;
      const matches=(db.plants||[]).filter(p=>p.name===title);
      if(matches.length===1)return matches[0];
      const src=plantDialog()?.querySelector('#mainPhoto')?.src||'';
      return matches.find(p=>{
        try{return typeof photo==='function' && src.includes(photo(p));}catch(_e){return false;}
      })||matches[0]||null;
    }catch(_e){return null;}
  }

  function ensureBottomBar(){
    let bar=document.getElementById('mobilePlantBar');
    if(bar)return bar;
    bar=document.createElement('div');
    bar.id='mobilePlantBar';
    bar.hidden=true;
    bar.innerHTML='<button type="button" id="mobilePlantGrowth">＋ Growth photo</button><button type="button" id="mobilePlantMore" aria-label="More plant actions">⋯</button>';
    document.body.appendChild(bar);
    bar.querySelector('#mobilePlantGrowth').onclick=()=>{
      const dlg=plantDialog();
      const source=dlg?.querySelector('[data-add-photo="growth"]');
      if(source){source.click();return;}
      const p=currentPlant();
      if(p && typeof openPhotoDialog==='function')openPhotoDialog(p,'growth');
    };
    bar.querySelector('#mobilePlantMore').onclick=()=>openManagementSheet();
    return bar;
  }

  function ensureManagementSheet(){
    let dlg=document.getElementById('mobilePlantActions');
    if(dlg)return dlg;
    dlg=document.createElement('dialog');
    dlg.id='mobilePlantActions';
    dlg.setAttribute('aria-label','Plant management actions');
    dlg.innerHTML='<div class="mobile-plant-sheet"><div class="mobile-plant-grab"></div><div class="mobile-plant-title"><strong>Manage plant</strong><span>Less-frequent plant actions</span></div><div id="mobilePlantActionList"></div><button type="button" class="mobile-plant-action mobile-plant-cancel" id="mobilePlantCancel">Cancel</button></div>';
    document.body.appendChild(dlg);
    dlg.querySelector('#mobilePlantCancel').onclick=()=>dlg.close();
    dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close();});
    dlg.addEventListener('cancel',e=>{e.preventDefault();dlg.close();});
    return dlg;
  }

  function proxyAction(label,source,list){
    if(!source)return;
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='mobile-plant-action';
    btn.textContent=label;
    btn.onclick=()=>{
      const sheet=document.getElementById('mobilePlantActions');
      sheet?.close();
      setTimeout(()=>source.click(),0);
    };
    list.appendChild(btn);
  }

  function openManagementSheet(){
    if(!isMobileOwner())return;
    const pd=plantDialog();
    if(!pd?.open)return;
    const sheet=ensureManagementSheet();
    const list=sheet.querySelector('#mobilePlantActionList');
    list.innerHTML='';
    proxyAction('Edit plant details',pd.querySelector('#editPlantBtn'),list);
    proxyAction('Add gallery photo',pd.querySelector('[data-add-photo="gallery"]'),list);
    proxyAction('Add custom care entry',pd.querySelector('[data-quick="custom"]'),list);
    if(!sheet.open)sheet.showModal();
  }

  function bindHeroPhoto(){
    const img=plantDialog()?.querySelector('#mainPhoto');
    if(!img || img.dataset.mobileHeroBound==='1')return;
    img.dataset.mobileHeroBound='1';
    img.setAttribute('role','button');
    img.setAttribute('aria-label','Open plant photo viewer');
    img.addEventListener('click',()=>{
      const p=currentPlant();
      if(!p || typeof galleryPhotos!=='function' || typeof openPhotoLightbox!=='function')return;
      const arr=galleryPhotos(p);
      if(!arr.length)return;
      const preferred=arr.find(x=>x.is_thumbnail)||arr.find(x=>x.url===img.src)||arr[0];
      openPhotoLightbox(p,preferred.key);
    });
  }

  function syncMobilePlantScreen(){
    const dlg=plantDialog();
    const bar=ensureBottomBar();
    const active=!!(mq.matches && dlg?.open);
    bar.hidden=!(active && document.body.classList.contains('owner-mode'));
    if(active)bindHeroPhoto();
  }

  syncMobilePlantScreen();
  const observer=new MutationObserver(syncMobilePlantScreen);
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','open']});
  if(typeof mq.addEventListener==='function')mq.addEventListener('change',syncMobilePlantScreen);
})();
