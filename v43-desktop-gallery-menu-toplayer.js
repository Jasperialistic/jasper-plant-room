/* Jasper's Plant Room v4.3.3 — true modal desktop gallery overflow menu */
(function(){
  const desktopMq=window.matchMedia('(min-width:701px)');

  const css=`
@media(min-width:701px){
  #desktopGalleryMenu.v43-dialog-menu{
    position:fixed!important;
    right:auto!important;
    bottom:auto!important;
    margin:0!important;
    padding:6px!important;
    border:1px solid #314a40!important;
    border-radius:13px!important;
    background:#14231d!important;
    color:#edf4f0!important;
    overflow:visible!important;
    box-shadow:0 18px 45px rgba(0,0,0,.48)!important;
  }
  #desktopGalleryMenu.v43-dialog-menu::backdrop{
    background:transparent!important;
  }
  #desktopGalleryMenu.v43-dialog-menu[hidden]{display:none!important}
}
`;
  const style=document.createElement('style');
  style.id='v43DesktopGalleryMenuTopLayerStyles';
  style.textContent=css;
  document.getElementById(style.id)?.remove();
  document.head.appendChild(style);

  function promoteToDialog(menu){
    if(!menu || menu.tagName==='DIALOG')return menu;

    const dlg=document.createElement('dialog');
    dlg.id='desktopGalleryMenu';
    dlg.className='v43-dialog-menu';
    dlg.setAttribute('aria-label','Gallery photo options');
    dlg.setAttribute('role','menu');
    dlg.hidden=menu.hidden;

    /* Keep the exact anchor position calculated by v42. */
    dlg.style.left=menu.style.left||'';
    dlg.style.top=menu.style.top||'';
    dlg.style.width=menu.style.width||'';

    /* Move, do not clone: this preserves v42's existing button click handlers. */
    while(menu.firstChild)dlg.appendChild(menu.firstChild);
    menu.replaceWith(dlg);

    dlg.addEventListener('click',e=>{
      /* A click on the transparent modal backdrop is retargeted to the dialog. */
      if(e.target===dlg){
        e.preventDefault();
        e.stopPropagation();
        dlg.hidden=true;
      }
    });
    dlg.addEventListener('mousedown',e=>{
      if(e.target===dlg){e.preventDefault();e.stopPropagation();}
    });
    dlg.addEventListener('mouseup',e=>{
      if(e.target===dlg){e.preventDefault();e.stopPropagation();}
    });
    dlg.addEventListener('cancel',e=>{
      e.preventDefault();
      dlg.hidden=true;
    });

    return dlg;
  }

  function syncMenuTopLayer(){
    if(!desktopMq.matches)return;
    let menu=document.getElementById('desktopGalleryMenu');
    if(!menu)return;

    menu=promoteToDialog(menu);
    if(!menu || menu.tagName!=='DIALOG')return;

    /* v42 controls visibility with the hidden property; mirror that into showModal/close. */
    if(!menu.hidden && !menu.open){
      try{menu.showModal();}catch(_e){}
    }else if(menu.hidden && menu.open){
      try{menu.close();}catch(_e){}
    }
  }

  function schedule(){requestAnimationFrame(syncMenuTopLayer);}
  schedule();

  const observer=new MutationObserver(schedule);
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','open','style']});
  document.addEventListener('click',schedule,true);
  if(typeof desktopMq.addEventListener==='function')desktopMq.addEventListener('change',schedule);
})();
