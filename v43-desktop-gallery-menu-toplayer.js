/* Jasper's Plant Room v4.3.2 — keep desktop gallery overflow menu above native dialog */
(function(){
  const desktopMq=window.matchMedia('(min-width:701px)');

  const css=`
@media(min-width:701px){
  #desktopGalleryMenu[popover]{
    position:fixed!important;
    right:auto!important;
    bottom:auto!important;
    margin:0!important;
  }
  #desktopGalleryMenu[popover]:popover-open{display:block!important}
}
`;
  const style=document.createElement('style');
  style.id='v43DesktopGalleryMenuTopLayerStyles';
  style.textContent=css;
  document.getElementById(style.id)?.remove();
  document.head.appendChild(style);

  function syncMenuTopLayer(){
    if(!desktopMq.matches)return;
    const menu=document.getElementById('desktopGalleryMenu');
    if(!menu)return;

    if(typeof menu.showPopover==='function'){
      if(menu.getAttribute('popover')!=='manual')menu.setAttribute('popover','manual');
      const open=menu.matches(':popover-open');
      if(!menu.hidden && !open){
        try{menu.showPopover();}catch(_e){}
      }else if(menu.hidden && open){
        try{menu.hidePopover();}catch(_e){}
      }
      return;
    }

    /* Fallback for older desktop browsers: keep the menu inside the already-open native dialog. */
    const dlg=document.getElementById('plantDialog');
    if(dlg?.open && menu.parentElement!==dlg)dlg.appendChild(menu);
  }

  function schedule(){requestAnimationFrame(syncMenuTopLayer);}
  schedule();

  const observer=new MutationObserver(schedule);
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','open']});
  document.addEventListener('click',schedule,true);
  if(typeof desktopMq.addEventListener==='function')desktopMq.addEventListener('change',schedule);
})();
