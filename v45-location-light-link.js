/* Jasper's Plant Room v4.5.2 — growing zone -> measured PPFD light link with compact star brightness */
(function(){
  const mobileMq=window.matchMedia('(max-width:700px)');
  let syncQueued=false;

  const FALLBACK_PPFD={
    'Dark Abyss / Anthurium shelf':'130–180 µmol/m²/s',
    'Overhead Hoya shelf':'50–70 µmol/m²/s',
    'Bottom Alocasia pup shelf':'200–225 µmol/m²/s',
    'Mid-level Alocasia shelf':'155–210 µmol/m²/s',
    'Top shelf below AC':'150–170 µmol/m²/s',
    'Beside small fish tank':'70–110 µmol/m²/s',
    'TV shelf above TV':'180–240 µmol/m²/s',
    'Big fish tank / window area':'average 80–120 µmol/m²/s; can rise above this with sunlight',
    'Gaming table':'~120 µmol/m²/s'
  };

  const style=document.createElement('style');
  style.id='v45LocationLightStyles';
  style.textContent=`
#fullPlantEditDialog .v45-location-row{display:flex;align-items:stretch;gap:7px;margin-top:6px}
#fullPlantEditDialog .v45-location-row>input{min-width:0;flex:1 1 auto;margin:0!important}
#fullPlantEditDialog .v45-location-select{
  flex:0 0 178px;max-width:44%;box-sizing:border-box;border:1px solid #314a40;border-radius:11px;
  background:#172820;color:#dce7e1;padding:0 10px;font:inherit;font-size:12px;font-weight:700;outline:none;cursor:pointer;
}
#fullPlantEditDialog .v45-location-select:focus{border-color:#8cae9e;box-shadow:0 0 0 2px rgba(140,174,158,.12)}
#fullPlantEditDialog .v45-location-help,.add-plant-form .v45-location-help{
  display:block;margin-top:5px;color:#71877d;font-size:10px;font-weight:500;line-height:1.35;
}
@media(max-width:700px){
  #fullPlantEditDialog .v45-location-row{display:flex!important;align-items:stretch!important;gap:7px!important}
  #fullPlantEditDialog .v45-location-row>input{width:auto!important;min-width:0!important;flex:1 1 auto!important}
  #fullPlantEditDialog .v45-location-select{
    appearance:none!important;-webkit-appearance:none!important;display:block!important;
    flex:0 0 50px!important;width:50px!important;max-width:50px!important;min-width:50px!important;min-height:45px!important;
    padding:0!important;text-align:center!important;font-size:18px!important;line-height:1!important;
  }
}
`;
  document.getElementById(style.id)?.remove();
  document.head.appendChild(style);

  function zones(){
    try{return (typeof db!=='undefined'&&Array.isArray(db.locations))?db.locations:[];}catch(_e){return [];}
  }

  function zoneByName(name){
    const wanted=String(name||'').trim().toLowerCase();
    if(!wanted)return null;
    return zones().find(z=>String(z?.name||'').trim().toLowerCase()===wanted)||null;
  }

  function ppfdPhrase(name){
    const zone=zoneByName(name);
    const details=String(zone?.details||'');
    const m=details.match(/PPFD:\s*([^.]*(?:µmol\/m²\/s)[^.]*)/i);
    if(m?.[1])return m[1].trim();
    return FALLBACK_PPFD[name]||'';
  }

  function numericRange(phrase){
    const normalized=String(phrase||'').replace(/,/g,'');
    const numbers=(normalized.match(/\d+(?:\.\d+)?/g)||[]).map(Number).filter(Number.isFinite);
    if(!numbers.length)return null;
    const min=numbers[0],max=numbers.length>1?numbers[1]:numbers[0];
    return {min:Math.min(min,max),max:Math.max(min,max)};
  }

  function starsFor(phrase){
    const range=numericRange(phrase);
    if(!range)return '★★★';
    const average=(range.min+range.max)/2;
    let level=1;
    if(average>=200)level=5;
    else if(average>=160)level=4;
    else if(average>=120)level=3;
    else if(average>=80)level=2;
    return '★'.repeat(level);
  }

  function zoneLightText(name){
    const phrase=ppfdPhrase(name);
    if(!phrase)return '';
    return `${starsFor(phrase)} · PPFD ${phrase}`;
  }

  function setLightFromZone(locationInput,lightInput,name){
    if(!lightInput)return;
    const value=zoneLightText(name);
    if(!value)return;
    if(locationInput)locationInput.dataset.v45SelectedZone=name;
    lightInput.value=value;
    lightInput.dataset.v45AutoLight=value;
    lightInput.dispatchEvent(new Event('input',{bubbles:true}));
    lightInput.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function clearOldAutoLight(lightInput){
    if(!lightInput)return;
    const old=lightInput.dataset.v45AutoLight||'';
    if(old && lightInput.value===old){
      lightInput.value='';
      lightInput.dispatchEvent(new Event('input',{bubbles:true}));
      lightInput.dispatchEvent(new Event('change',{bubbles:true}));
    }
    delete lightInput.dataset.v45AutoLight;
  }

  function bindAddPlant(){
    const location=document.getElementById('newPlantLocation');
    const light=document.getElementById('newPlantLight');
    if(!location||!light)return;

    if(location.dataset.v45LightBound!=='1'){
      location.dataset.v45LightBound='1';
      location.addEventListener('change',()=>{
        const name=location.value;
        if(!name || name==='__new__'){
          clearOldAutoLight(light);
          return;
        }
        setLightFromZone(location,light,name);
      });
    }

    const label=location.closest('label');
    if(label && !label.querySelector('.v45-location-help')){
      const help=document.createElement('span');
      help.className='v45-location-help';
      help.textContent='Choosing a measured growing zone auto-fills Light from that zone’s PPFD. ★ = dimmest, ★★★★★ = brightest. A new/custom zone leaves Light manual.';
      label.appendChild(help);
    }
  }

  function buildEditLocationSelect(input){
    if(!input || input.dataset.v45LocationBound==='1')return;
    input.dataset.v45LocationBound='1';

    const row=document.createElement('div');
    row.className='v45-location-row';
    input.parentNode.insertBefore(row,input);
    row.appendChild(input);

    const select=document.createElement('select');
    select.className='v45-location-select';
    select.setAttribute('aria-label','Choose growing zone');
    row.appendChild(select);

    select.addEventListener('change',()=>{
      const name=select.value;
      if(!name)return;
      input.value=name;
      input.dataset.v45SelectedZone=name;
      input.dispatchEvent(new Event('input',{bubbles:true}));
      input.dispatchEvent(new Event('change',{bubbles:true}));
      setLightFromZone(input,document.getElementById('fullEditLight'),name);
      input.focus({preventScroll:true});
      select.value='';
    });

    input.addEventListener('input',e=>{
      if(e.isTrusted)delete input.dataset.v45SelectedZone;
    });
  }

  function refreshEditLocationSelect(){
    const input=document.getElementById('fullEditLocation');
    if(!input)return;
    buildEditLocationSelect(input);
    const select=input.parentElement?.querySelector('.v45-location-select');
    if(!select)return;

    const label=mobileMq.matches?'⌄':'Locations…';
    const names=zones().map(z=>String(z?.name||'').trim()).filter(Boolean);
    const signature=label+'|'+names.join('|');
    if(select.dataset.v45Signature!==signature){
      select.dataset.v45Signature=signature;
      select.innerHTML='';
      const first=document.createElement('option');
      first.value='';first.textContent=label;
      select.appendChild(first);
      names.forEach(name=>{
        const opt=document.createElement('option');
        opt.value=name;opt.textContent=name;
        select.appendChild(opt);
      });
    }else if(select.options?.[0] && select.options[0].textContent!==label){
      select.options[0].textContent=label;
    }

    const fieldLabel=input.closest('label');
    if(fieldLabel && !fieldLabel.querySelector('.v45-location-help')){
      const help=document.createElement('span');
      help.className='v45-location-help';
      help.textContent='Choose a growing zone to auto-fill its measured PPFD into Light. ★ = dimmest, ★★★★★ = brightest. Type a location manually to leave Light unchanged.';
      fieldLabel.appendChild(help);
    }
  }

  function sync(){
    syncQueued=false;
    bindAddPlant();
    refreshEditLocationSelect();
  }

  function schedule(){
    if(syncQueued)return;
    syncQueued=true;
    requestAnimationFrame(sync);
  }

  schedule();
  const observer=new MutationObserver(schedule);
  observer.observe(document.body,{childList:true,subtree:true});
  if(typeof mobileMq.addEventListener==='function')mobileMq.addEventListener('change',schedule);
})();
