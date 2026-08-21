/* Jasper's Plant Room v4.36.0 — idle-safe editor access */
(function(){
  const mobileMq=window.matchMedia('(max-width:700px)');

  const style=document.createElement('style');
  style.id='v40EditorAccessTweaks';
  style.textContent=`
@media(max-width:700px){
  #fullPlantEditDialog .v39-combo-row{display:flex!important;align-items:stretch!important;gap:7px!important}
  #fullPlantEditDialog .v39-combo-row>input{width:auto!important;min-width:0!important;flex:1 1 auto!important}
  #fullPlantEditDialog .v39-preset-select{
    display:block!important;appearance:none!important;-webkit-appearance:none!important;
    flex:0 0 50px!important;width:50px!important;max-width:50px!important;min-height:45px!important;
    padding:0!important;text-align:center!important;font-size:18px!important;line-height:1!important;
  }
}
#desktopDetailsEditBar{display:flex;justify-content:flex-end;align-items:center;margin:8px 0 10px}
#desktopDetailsEditBar #editPlantBtn{margin:0!important;min-height:40px;padding:0 14px;border-radius:11px;font-weight:800}
`;
  document.getElementById(style.id)?.remove();
  document.head.appendChild(style);

  function syncPresetButtons(){
    const label=mobileMq.matches?'⌄':'Presets…';
    document.querySelectorAll('#fullPlantEditDialog .v39-preset-select').forEach(select=>{
      const first=select.options?.[0];
      if(first&&first.textContent!==label)first.textContent=label;
      if(select.getAttribute('aria-label')!=='Choose preset')select.setAttribute('aria-label','Choose preset');
    });
  }

  function syncDesktopEdit(){
    const dlg=document.getElementById('plantDialog');
    if(!dlg)return;
    const btn=dlg.querySelector('#editPlantBtn');
    const quick=dlg.querySelector('.quick-actions');
    const bar=dlg.querySelector('#desktopDetailsEditBar');

    if(mobileMq.matches){
      if(btn&&quick&&btn.parentElement!==quick)quick.appendChild(btn);
      bar?.remove();
      return;
    }

    if(!dlg.open||!document.body.classList.contains('owner-mode')||!btn)return;
    const details=dlg.querySelector('.detail-grid');
    if(!details)return;
    let holder=bar;
    if(!holder){
      holder=document.createElement('div');
      holder.id='desktopDetailsEditBar';
      details.parentNode.insertBefore(holder,details);
    }
    if(btn.parentElement!==holder)holder.appendChild(btn);
  }

  function sync(){syncPresetButtons();syncDesktopEdit();}
  let syncQueued=false;
  function scheduleSync(){
    if(syncQueued)return;
    syncQueued=true;
    requestAnimationFrame(()=>{syncQueued=false;sync();});
  }
  sync();
  const observer=new MutationObserver(scheduleSync);
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','open']});
  if(typeof mobileMq.addEventListener==='function')mobileMq.addEventListener('change',sync);
})();
