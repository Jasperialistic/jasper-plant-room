/* Jasper's Plant Room v4.1 — full structured plant editor */
(function(){
  const mq=window.matchMedia('(max-width:700px)');
  let editingPlantId=null;
  let reopenTab='gallery';

  const css=`
#fullPlantEditDialog{
  width:min(760px,calc(100vw - 28px));max-height:min(88dvh,920px);padding:0;border:1px solid #30483e;
  border-radius:20px;background:#101c18;color:#edf4f0;box-shadow:0 24px 70px rgba(0,0,0,.52);overflow:hidden;
}
#fullPlantEditDialog::backdrop{background:rgba(2,7,5,.78);backdrop-filter:blur(3px)}
#fullPlantEditDialog .full-edit-shell{display:flex;flex-direction:column;max-height:min(88dvh,920px)}
#fullPlantEditDialog .full-edit-head{
  position:sticky;top:0;z-index:4;display:flex;align-items:center;justify-content:space-between;gap:14px;
  padding:15px 17px 13px;background:rgba(16,28,24,.97);border-bottom:1px solid #263b33;backdrop-filter:blur(14px);
}
#fullPlantEditDialog .full-edit-head .eyebrow{display:block;color:#93aa9f;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
#fullPlantEditDialog .full-edit-head h2{margin:3px 0 0;font-size:20px;line-height:1.1}
#fullPlantEditDialog .full-edit-close{width:44px;height:44px;flex:0 0 44px;border:1px solid #324a40;border-radius:50%;background:#182a23;color:#edf4f0;font-size:25px;line-height:1}
#fullPlantEditDialog .full-edit-body{padding:14px 16px 96px;overflow:auto;overscroll-behavior:contain}
#fullPlantEditDialog .full-edit-section{margin:0 0 14px;padding:13px;border:1px solid #294037;border-radius:15px;background:#12211b}
#fullPlantEditDialog .full-edit-section-title{margin:0 0 11px;color:#d8e3dd;font-size:12px;font-weight:850;letter-spacing:.03em}
#fullPlantEditDialog .full-edit-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 11px}
#fullPlantEditDialog label{display:block;margin:0;color:#9db0a8;font-size:11px;font-weight:700;line-height:1.35}
#fullPlantEditDialog label.full-span{grid-column:1/-1}
#fullPlantEditDialog input,#fullPlantEditDialog textarea{
  width:100%;box-sizing:border-box;margin-top:6px;border:1px solid #314a40;border-radius:11px;background:#0d1814;color:#edf4f0;
  padding:10px 11px;font:inherit;font-size:13px;line-height:1.4;outline:none;
}
#fullPlantEditDialog textarea{resize:vertical;min-height:76px}
#fullPlantEditDialog input:focus,#fullPlantEditDialog textarea:focus{border-color:#8cae9e;box-shadow:0 0 0 2px rgba(140,174,158,.12)}
#fullPlantEditDialog .field-help{display:block;margin-top:5px;color:#71877d;font-size:10px;font-weight:500;line-height:1.35}
#fullPlantEditDialog .full-edit-footer{
  position:absolute;left:0;right:0;bottom:0;z-index:5;display:flex;align-items:center;justify-content:flex-end;gap:8px;
  padding:10px 15px max(10px,env(safe-area-inset-bottom));background:linear-gradient(rgba(16,28,24,.76),#101c18 32%);border-top:1px solid #263b33;
}
#fullPlantEditDialog .full-edit-footer button{min-height:44px;border-radius:12px;padding:0 15px;font-weight:800}
#fullPlantEditDialog .full-edit-cancel{border:1px solid #344b42;background:#172820;color:#dce7e1}
#fullPlantEditDialog .full-edit-save{border:1px solid #d5be85;background:#d5be85;color:#152017;min-width:130px}
#fullPlantEditDialog .full-edit-save:disabled{opacity:.55}
#fullPlantEditDialog .full-edit-status{margin-right:auto;color:#91a69d;font-size:11px;line-height:1.3}

@media(max-width:700px){
  #fullPlantEditDialog{
    width:100vw;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;border-radius:0;background:#0f1a17;
  }
  #fullPlantEditDialog .full-edit-shell{height:100dvh;max-height:none}
  #fullPlantEditDialog .full-edit-head{padding:max(10px,env(safe-area-inset-top)) 14px 10px;background:rgba(15,26,23,.97)}
  #fullPlantEditDialog .full-edit-head h2{font-size:19px}
  #fullPlantEditDialog .full-edit-body{padding:12px 12px calc(92px + env(safe-area-inset-bottom))}
  #fullPlantEditDialog .full-edit-section{padding:12px;margin-bottom:11px;border-radius:14px}
  #fullPlantEditDialog .full-edit-grid{grid-template-columns:1fr;gap:10px}
  #fullPlantEditDialog label.full-span{grid-column:auto}
  #fullPlantEditDialog input,#fullPlantEditDialog textarea{min-height:45px;font-size:16px}
  #fullPlantEditDialog textarea{min-height:84px}
  #fullPlantEditDialog .full-edit-footer{padding:8px 10px max(9px,env(safe-area-inset-bottom));gap:7px}
  #fullPlantEditDialog .full-edit-status{display:none}
  #fullPlantEditDialog .full-edit-cancel{flex:0 0 auto}
  #fullPlantEditDialog .full-edit-save{flex:1;min-height:50px}

  #mobilePlantEdit{
    min-height:50px;flex:0 0 68px;border:1px solid #365047;border-radius:13px;background:#1a2d26;color:#edf4f0;
    font-size:12px;font-weight:820;padding:0 9px;
  }
}
`;

  const style=document.createElement('style');
  style.id='v38FullPlantEditorStyles';
  style.textContent=css;
  document.getElementById(style.id)?.remove();
  document.head.appendChild(style);

  function currentPlant(){
    const dialog=document.getElementById('plantDialog');
    const title=dialog?.querySelector('.modal-head h2')?.textContent?.trim();
    if(!title || typeof db==='undefined')return null;
    const matches=(db.plants||[]).filter(p=>p.name===title);
    if(matches.length===1)return matches[0];
    const src=dialog?.querySelector('#mainPhoto')?.src||'';
    return matches.find(p=>{
      try{return typeof photo==='function' && src.includes(photo(p));}catch(_e){return false;}
    })||matches[0]||null;
  }

  function text(v){return v==null?'':String(v);}
  function nullable(v){const s=String(v??'').trim();return s||null;}
  function numberOrNull(v){const s=String(v??'').trim();if(!s)return null;const n=Number(s);return Number.isFinite(n)?Math.max(0,Math.round(n)):null;}

  function ensureDialog(){
    let dlg=document.getElementById('fullPlantEditDialog');
    if(dlg)return dlg;
    dlg=document.createElement('dialog');
    dlg.id='fullPlantEditDialog';
    dlg.setAttribute('aria-label','Edit complete plant details');
    dlg.innerHTML=`
      <div class="full-edit-shell">
        <div class="full-edit-head">
          <div><span class="eyebrow">PLANT DETAILS</span><h2 id="fullEditTitle">Edit plant</h2></div>
          <button type="button" class="full-edit-close" id="fullEditClose" aria-label="Close">×</button>
        </div>
        <div class="full-edit-body">
          <section class="full-edit-section">
            <div class="full-edit-section-title">Identity</div>
            <div class="full-edit-grid">
              <label>Plant name<input id="fullEditName" autocomplete="off"></label>
              <label>Plant group<input id="fullEditGroup" list="plantGroupSuggestions" placeholder="e.g. Alocasia"></label>
            </div>
          </section>

          <section class="full-edit-section">
            <div class="full-edit-section-title">Growing environment</div>
            <div class="full-edit-grid">
              <label>Location<input id="fullEditLocation" placeholder="e.g. Mid-level Alocasia shelf"></label>
              <label>Light<input id="fullEditLight" placeholder="e.g. Sansi 15 W, ~55 cm"></label>
              <label class="full-span">Environment<textarea id="fullEditEnvironment" rows="3" placeholder="Airflow, AC exposure, humidity, position, etc."></textarea><span class="field-help">Use this for the plant's local microclimate rather than general room notes.</span></label>
            </div>
          </section>

          <section class="full-edit-section">
            <div class="full-edit-section-title">Pot & root-zone setup</div>
            <div class="full-edit-grid">
              <label>Pot / size<input id="fullEditPot" placeholder="e.g. 10 × 10 cm"></label>
              <label>Pot type<input id="fullEditPotType" list="potTypeSuggestions" placeholder="e.g. Clear nursery pot with drainage"></label>
              <label>Outer pot / cache pot<input id="fullEditOuter" list="outerPotSuggestions" placeholder="e.g. Snug cache pot, no drainage"></label>
              <label>Medium<input id="fullEditMedium" list="mediumSuggestions" placeholder="e.g. Airy aroid mix"></label>
              <label class="full-span">Watering mode<input id="fullEditMode" list="wateringModeSuggestions" placeholder="e.g. Top-water to runoff; no standing reservoir"><span class="field-help">Keep this specific: top-water, reservoir, semi-hydro, wick/self-watering, bottom-touch reservoir, etc.</span></label>
            </div>
          </section>

          <section class="full-edit-section">
            <div class="full-edit-section-title">Care logic</div>
            <div class="full-edit-grid">
              <label>Default check interval (days)<input id="fullEditCheckDays" type="number" min="0" step="1" inputmode="numeric" placeholder="e.g. 3"></label>
              <label>Confidence / status<input id="fullEditConfidence" placeholder="Optional"></label>
              <label class="full-span">Care rule<textarea id="fullEditRule" rows="3" placeholder="What condition should trigger watering/checking?"></textarea></label>
              <label class="full-span">Plant notes<textarea id="fullEditNotes" rows="4" placeholder="Longer observations, quirks, setup notes, history, etc."></textarea></label>
            </div>
          </section>

          <datalist id="plantGroupSuggestions"><option value="Alocasia"><option value="Anthurium"><option value="Philodendron"><option value="Monstera"><option value="Fern"><option value="Other"></datalist>
          <datalist id="potTypeSuggestions"><option value="Clear nursery pot with drainage"><option value="Nursery pot with drainage"><option value="Orchid pot with side holes"><option value="Net pot"><option value="Self-watering pot"><option value="No-drainage vessel"></datalist>
          <datalist id="outerPotSuggestions"><option value="No outer pot"><option value="Cache pot with no drainage"><option value="Cache pot with drainage + tray"><option value="Cache pot with LECA reservoir"><option value="Self-watering reservoir cache"></datalist>
          <datalist id="mediumSuggestions"><option value="Airy aroid mix"><option value="Pon"><option value="LECA"><option value="Pon + aroid mix"><option value="Sphagnum moss"><option value="Semi-hydro mix"></datalist>
          <datalist id="wateringModeSuggestions"><option value="Top-water to runoff; drain fully"><option value="Top-water; no standing reservoir"><option value="Bottom-touch reservoir"><option value="LECA reservoir"><option value="Self-watering wick reservoir"><option value="Semi-hydro reservoir"><option value="Keep evenly moist; no standing water"></datalist>
        </div>
        <div class="full-edit-footer">
          <span class="full-edit-status" id="fullEditStatus"></span>
          <button type="button" class="full-edit-cancel" id="fullEditCancel">Cancel</button>
          <button type="button" class="full-edit-save" id="fullEditSave">Save details</button>
        </div>
      </div>`;
    document.body.appendChild(dlg);
    dlg.querySelector('#fullEditClose').onclick=()=>dlg.close();
    dlg.querySelector('#fullEditCancel').onclick=()=>dlg.close();
    dlg.querySelector('#fullEditSave').onclick=saveDetails;
    dlg.addEventListener('cancel',e=>{e.preventDefault();dlg.close();});
    return dlg;
  }

  function fillForm(p){
    const values={
      fullEditName:p.name,
      fullEditGroup:p.group,
      fullEditLocation:p.location,
      fullEditLight:p.light,
      fullEditEnvironment:p.environment,
      fullEditPot:p.pot,
      fullEditPotType:p.potType,
      fullEditOuter:p.outer,
      fullEditMedium:p.medium,
      fullEditMode:p.mode,
      fullEditCheckDays:p.checkDays,
      fullEditConfidence:p.confidence,
      fullEditRule:p.rule,
      fullEditNotes:p.notes
    };
    Object.entries(values).forEach(([id,value])=>{const el=document.getElementById(id);if(el)el.value=text(value);});
    document.getElementById('fullEditTitle').textContent=p.name||'Edit plant';
    document.getElementById('fullEditStatus').textContent='Structured fields sync to Supabase';
  }

  function openFullEditor(p){
    if(!p)return;
    if(typeof requireOwner==='function' && !requireOwner())return;
    editingPlantId=p.cloudId;
    const active=document.querySelector('#plantDialog .profile-tab.active')?.dataset.profileTab;
    reopenTab=active||'gallery';
    const dlg=ensureDialog();
    fillForm(p);
    if(!dlg.open)dlg.showModal();
    requestAnimationFrame(()=>document.getElementById('fullEditName')?.focus({preventScroll:true}));
  }

  async function saveDetails(){
    if(!editingPlantId)return;
    const p=(typeof db!=='undefined'&&db.plants||[]).find(x=>String(x.cloudId)===String(editingPlantId));
    if(!p)return;
    const name=document.getElementById('fullEditName').value.trim();
    if(!name){alert('Plant name cannot be empty.');return;}

    const payload={
      name,
      plant_group:nullable(document.getElementById('fullEditGroup').value),
      location:nullable(document.getElementById('fullEditLocation').value),
      light:nullable(document.getElementById('fullEditLight').value),
      environment:nullable(document.getElementById('fullEditEnvironment').value),
      pot:nullable(document.getElementById('fullEditPot').value),
      pot_type:nullable(document.getElementById('fullEditPotType').value),
      outer_pot:nullable(document.getElementById('fullEditOuter').value),
      medium:nullable(document.getElementById('fullEditMedium').value),
      watering_mode:nullable(document.getElementById('fullEditMode').value),
      check_days:numberOrNull(document.getElementById('fullEditCheckDays').value),
      confidence:nullable(document.getElementById('fullEditConfidence').value),
      check_rule:nullable(document.getElementById('fullEditRule').value),
      notes:nullable(document.getElementById('fullEditNotes').value)
    };

    const save=document.getElementById('fullEditSave');
    const status=document.getElementById('fullEditStatus');
    save.disabled=true;
    status.textContent='Saving…';
    try{
      if(typeof setCloudStatus==='function')setCloudStatus('Saving plant details…');
      const res=await sb.from('plants').update(payload).eq('id',editingPlantId).select('id,name,plant_group,location,light,environment,pot,pot_type,outer_pot,medium,watering_mode,check_days,check_rule,notes,confidence').single();
      if(res.error)throw res.error;
      if(!res.data?.id)throw new Error('Plant update returned no row.');
      ensureDialog().close();
      if(typeof loadCloud==='function')await loadCloud();
      if(typeof openPlant==='function')openPlant(editingPlantId,reopenTab);
      if(typeof setCloudStatus==='function')setCloudStatus('Owner · cloud synced');
    }catch(error){
      console.error('Full plant detail save failed',error);
      status.textContent='Save failed';
      if(typeof setCloudStatus==='function')setCloudStatus('Sync error',true);
      alert(error?.message||'Could not save plant details.');
    }finally{
      save.disabled=false;
    }
  }

  function bindDesktopAndExistingEdit(){
    const btn=document.querySelector('#plantDialog #editPlantBtn');
    if(!btn || btn.dataset.fullEditorBound==='1')return;
    btn.dataset.fullEditorBound='1';
    btn.onclick=e=>{
      e.preventDefault();e.stopPropagation();
      openFullEditor(currentPlant());
    };
  }

  function ensureMobileEditButton(){
    const bar=document.getElementById('mobilePlantBar');
    if(!bar)return;
    let btn=bar.querySelector('#mobilePlantEdit');
    if(!btn){
      btn=document.createElement('button');
      btn.type='button';
      btn.id='mobilePlantEdit';
      btn.textContent='Edit';
      btn.setAttribute('aria-label','Edit plant details');
      const more=bar.querySelector('#mobilePlantMore');
      bar.insertBefore(btn,more||null);
      btn.onclick=()=>openFullEditor(currentPlant());
    }
  }

  function sync(){
    bindDesktopAndExistingEdit();
    ensureMobileEditButton();
  }

  sync();
  const observer=new MutationObserver(()=>requestAnimationFrame(sync));
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open','class']});
  if(typeof mq.addEventListener==='function')mq.addEventListener('change',sync);
})();
