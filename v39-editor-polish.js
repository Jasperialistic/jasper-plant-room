/* Jasper's Plant Room v4.36.0 — efficient editor presets */
(function(){
  const mobileMq=window.matchMedia('(max-width:700px)');

  const presetMap={
    fullEditGroup:['Alocasia','Anthurium','Philodendron','Monstera','Fern','Other'],
    fullEditPotType:['Clear nursery pot with drainage','Nursery pot with drainage','Orchid pot with side holes','Net pot','Self-watering pot','No-drainage vessel'],
    fullEditOuter:['No outer pot','Cache pot with no drainage','Cache pot with drainage + tray','Cache pot with LECA reservoir','Self-watering reservoir cache'],
    fullEditMedium:['Airy aroid mix','Pon','LECA','Pon + Aquasoil','Pon + aroid mix','Sphagnum moss','Semi-hydro mix'],
    fullEditMode:['Top-water to runoff; drain fully','Top-water; no standing reservoir','Bottom-touch reservoir','LECA reservoir','Self-watering wick reservoir','Semi-hydro reservoir','Keep evenly moist; no standing water']
  };

  const css=`
#fullPlantEditDialog .v39-combo-row{display:flex;align-items:stretch;gap:7px;margin-top:6px}
#fullPlantEditDialog .v39-combo-row>input{margin-top:0!important;min-width:0;flex:1 1 auto}
#fullPlantEditDialog .v39-preset-select{
  flex:0 0 160px;max-width:42%;box-sizing:border-box;border:1px solid #314a40;border-radius:11px;
  background:#172820;color:#dce7e1;padding:0 10px;font:inherit;font-size:12px;font-weight:700;outline:none;cursor:pointer;
}
#fullPlantEditDialog .v39-preset-select:focus{border-color:#8cae9e;box-shadow:0 0 0 2px rgba(140,174,158,.12)}
@media(max-width:700px){
  #fullPlantEditDialog .v39-preset-select{display:none!important}
  #fullPlantEditDialog .v39-combo-row{display:block;margin-top:6px}
  #fullPlantEditDialog .v39-combo-row>input{width:100%}

  #mobilePlantBar #mobilePlantEdit{display:none!important}
  #plantDialog .modal-head>div{flex:1 1 auto;min-width:0}
  #mobilePlantHeaderEdit{
    flex:0 0 auto;min-width:52px;height:40px;margin-left:auto;border:1px solid #365047;border-radius:11px;
    background:#1a2d26;color:#edf4f0;padding:0 11px;font-size:12px;font-weight:820;line-height:1;cursor:pointer;
  }
  #mobilePlantHeaderEdit:active{transform:scale(.96)}
}
`;
  const style=document.createElement('style');
  style.id='v39EditorPolishStyles';
  style.textContent=css;
  document.getElementById(style.id)?.remove();
  document.head.appendChild(style);

  function enhancePresetFields(){
    const dlg=document.getElementById('fullPlantEditDialog');
    if(!dlg)return;
    Object.entries(presetMap).forEach(([id,options])=>{
      const input=dlg.querySelector('#'+id);
      if(!input || input.dataset.v39PresetBound==='1')return;
      input.dataset.v39PresetBound='1';

      const row=document.createElement('div');
      row.className='v39-combo-row';
      input.parentNode.insertBefore(row,input);
      row.appendChild(input);

      const select=document.createElement('select');
      select.className='v39-preset-select';
      select.setAttribute('aria-label','Choose a preset value');
      select.innerHTML='<option value="">Presets…</option>'+options.map(v=>'<option value="'+String(v).replace(/&/g,'&amp;').replace(/"/g,'&quot;')+'">'+String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</option>').join('');
      select.addEventListener('change',()=>{
        if(!select.value)return;
        input.value=select.value;
        input.dispatchEvent(new Event('input',{bubbles:true}));
        input.dispatchEvent(new Event('change',{bubbles:true}));
        input.focus();
        select.value='';
      });
      row.appendChild(select);
    });
  }

  function ensureMobileHeaderEdit(){
    const dlg=document.getElementById('plantDialog');
    const owner=document.body.classList.contains('owner-mode');
    const active=!!(mobileMq.matches && owner && dlg?.open);
    const existing=document.getElementById('mobilePlantHeaderEdit');
    if(!active){existing?.remove();return;}

    const head=dlg.querySelector('.modal-head');
    const close=dlg.querySelector('#closePlant');
    if(!head||!close)return;
    if(existing && existing.parentElement===head)return;
    existing?.remove();

    const btn=document.createElement('button');
    btn.type='button';
    btn.id='mobilePlantHeaderEdit';
    btn.textContent='Edit';
    btn.setAttribute('aria-label','Edit plant details');
    btn.onclick=e=>{
      e.preventDefault();
      e.stopPropagation();
      const source=dlg.querySelector('#editPlantBtn');
      if(source){source.click();return;}
      const more=document.getElementById('mobilePlantMore');
      if(more)more.click();
    };
    head.insertBefore(btn,close);
  }

  function sync(){
    enhancePresetFields();
    ensureMobileHeaderEdit();
  }

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
