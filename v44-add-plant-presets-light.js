/* Jasper's Plant Room v4.4.1 — Add Plant presets + shared PPFD light presets, render-loop fix */
(function(){
  const mobileMq=window.matchMedia('(max-width:700px)');
  let syncQueued=false;

  const LIGHT_PRESETS=[
    'Too dim · under 40 µmol/m²/s PPFD',
    'Can be brighter · 40–80 µmol/m²/s PPFD',
    'Ideal for most aroids · 80–150 µmol/m²/s PPFD',
    'Bright / strong growth · 150–250 µmol/m²/s PPFD',
    'High · over 250 µmol/m²/s PPFD; acclimate carefully'
  ];

  const ADD_PRESETS={
    newPlantGroup:['Alocasia','Anthurium','Philodendron','Monstera','Hoya','Tillandsia','Fern','Other'],
    newPlantLight:LIGHT_PRESETS,
    newPlantPotType:['Clear nursery pot with drainage','Nursery pot with drainage','Orchid pot with side holes','Net pot','Self-watering pot','No-drainage vessel'],
    newPlantOuter:['No outer pot','Cache pot with no drainage','Cache pot with drainage + tray','Cache pot with LECA reservoir','Self-watering reservoir cache'],
    newPlantMedium:['Airy aroid mix','Pon','LECA','Pon + aroid mix','Sphagnum moss','Semi-hydro mix'],
    newPlantMode:['Top-water to runoff; drain fully','Top-water; no standing reservoir','Bottom-touch reservoir','LECA reservoir','Self-watering wick reservoir','Semi-hydro reservoir','Keep evenly moist; no standing water']
  };

  const EDIT_PRESETS={
    fullEditLight:LIGHT_PRESETS
  };

  const style=document.createElement('style');
  style.id='v44AddPlantPresetStyles';
  style.textContent=`
.add-plant-form .v44-combo-row,
#fullPlantEditDialog .v44-combo-row{display:flex;align-items:stretch;gap:7px;margin-top:0}
.add-plant-form .v44-combo-row>input,
#fullPlantEditDialog .v44-combo-row>input{min-width:0;flex:1 1 auto;margin:0!important}
.add-plant-form .v44-preset-select,
#fullPlantEditDialog .v44-preset-select{
  flex:0 0 178px;max-width:44%;box-sizing:border-box;border:1px solid #314a40;border-radius:11px;
  background:#172820;color:#dce7e1;padding:0 10px;font:inherit;font-size:12px;font-weight:700;outline:none;cursor:pointer;
}
.add-plant-form .v44-preset-select:focus,
#fullPlantEditDialog .v44-preset-select:focus{border-color:#8cae9e;box-shadow:0 0 0 2px rgba(140,174,158,.12)}
.add-plant-form .v44-light-help,
#fullPlantEditDialog .v44-light-help{display:block;margin-top:5px;color:#71877d;font-size:10px;font-weight:500;line-height:1.35}
@media(max-width:700px){
  .add-plant-form .v44-combo-row,
  #fullPlantEditDialog .v44-combo-row{display:flex!important;align-items:stretch!important;gap:7px!important}
  .add-plant-form .v44-combo-row>input,
  #fullPlantEditDialog .v44-combo-row>input{width:auto!important;min-width:0!important;flex:1 1 auto!important}
  .add-plant-form .v44-preset-select,
  #fullPlantEditDialog .v44-preset-select{
    appearance:none!important;-webkit-appearance:none!important;display:block!important;
    flex:0 0 50px!important;width:50px!important;max-width:50px!important;min-width:50px!important;min-height:45px!important;
    padding:0!important;text-align:center!important;font-size:18px!important;line-height:1!important;
  }
}
`;
  document.getElementById(style.id)?.remove();
  document.head.appendChild(style);

  function escHtml(value){
    return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
  }

  function enhanceField(input,options){
    if(!input || input.dataset.v44PresetBound==='1')return;
    input.dataset.v44PresetBound='1';

    const row=document.createElement('div');
    row.className='v44-combo-row';
    input.parentNode.insertBefore(row,input);
    row.appendChild(input);

    const select=document.createElement('select');
    select.className='v44-preset-select';
    select.setAttribute('aria-label','Choose preset');
    select.innerHTML='<option value="">Presets…</option>'+options.map(v=>`<option value="${escHtml(v)}">${escHtml(v)}</option>`).join('');
    select.addEventListener('change',()=>{
      if(!select.value)return;
      const chosen=select.value;
      select.value='';
      input.value=chosen;
      input.dispatchEvent(new Event('input',{bubbles:true}));
      input.dispatchEvent(new Event('change',{bubbles:true}));
      input.focus({preventScroll:true});
    });
    row.appendChild(select);
  }

  function syncPresetLabels(){
    const desired=mobileMq.matches?'⌄':'Presets…';
    document.querySelectorAll('.v44-preset-select').forEach(select=>{
      const first=select.options?.[0];
      if(first && first.textContent!==desired)first.textContent=desired;
    });
  }

  function enhanceAddPlant(){
    const form=document.getElementById('addPlantForm');
    if(!form)return;

    const group=document.getElementById('newPlantGroup');
    if(group && group.dataset.v44InitialGroupCleared!=='1'){
      group.dataset.v44InitialGroupCleared='1';
      if(group.value.trim().toLowerCase()==='alocasia')group.value='';
    }

    if(form.dataset.v44ResetBound!=='1'){
      form.dataset.v44ResetBound='1';
      form.addEventListener('reset',()=>{
        setTimeout(()=>{
          const g=document.getElementById('newPlantGroup');
          if(g)g.value='';
        },0);
      });
    }

    Object.entries(ADD_PRESETS).forEach(([id,options])=>enhanceField(document.getElementById(id),options));

    const light=document.getElementById('newPlantLight');
    const label=light?.closest('label');
    if(label && !label.querySelector('.v44-light-help')){
      const help=document.createElement('span');
      help.className='v44-light-help';
      help.textContent='PPFD presets are practical collection-wide starting points; keep custom light notes if a plant needs something more specific.';
      label.appendChild(help);
    }
  }

  function enhanceEditLight(){
    Object.entries(EDIT_PRESETS).forEach(([id,options])=>enhanceField(document.getElementById(id),options));
    const light=document.getElementById('fullEditLight');
    const label=light?.closest('label');
    if(label && !label.querySelector('.v44-light-help')){
      const help=document.createElement('span');
      help.className='v44-light-help';
      help.textContent='Use the PPFD preset as a quick light rating, then edit the text if you want to add fixture or distance details.';
      label.appendChild(help);
    }
  }

  function runSync(){
    syncQueued=false;
    enhanceAddPlant();
    enhanceEditLight();
    syncPresetLabels();
  }

  function sync(){
    if(syncQueued)return;
    syncQueued=true;
    requestAnimationFrame(runSync);
  }

  sync();
  const observer=new MutationObserver(sync);
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','open']});
  if(typeof mobileMq.addEventListener==='function')mobileMq.addEventListener('change',sync);
})();
