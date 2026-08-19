/* Jasper's Plant Room v3.4 — aliases / shorthand */
(function(){
  const normalise=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[’‘“”]/g,"'").replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
  const parseAliases=s=>[...new Set(String(s||'').split(/[,\n]/).map(x=>normalise(x)).filter(Boolean))];

  if(typeof rowToPlant==='function'){
    const previousRowToPlant=rowToPlant;
    rowToPlant=function(r){
      const p=previousRowToPlant(r);
      p.aliases=Array.isArray(r.aliases)?r.aliases:[];
      return p;
    };
  }

  async function hydrateAliases(){
    if(!db?.plants?.length)return;
    const ids=db.plants.map(p=>p.cloudId).filter(x=>x&&!String(x).startsWith('base:'));
    if(!ids.length)return;
    const {data,error}=await sb.from('plants').select('id,aliases').in('id',ids);
    if(error){console.warn('Alias hydrate failed',error);return;}
    const map=new Map((data||[]).map(x=>[String(x.id),Array.isArray(x.aliases)?x.aliases:[]]));
    db.plants.forEach(p=>{if(map.has(String(p.cloudId)))p.aliases=map.get(String(p.cloudId));else if(!p.aliases)p.aliases=[];});
  }
  window.hydratePlantAliases=hydrateAliases;

  if(typeof loadCloud==='function'){
    const previousLoadCloud=loadCloud;
    loadCloud=async function(...args){
      const out=await previousLoadCloud(...args);
      await hydrateAliases();
      return out;
    };
  }

  window.resolvePlantByAlias=function(query){
    const q=normalise(query);
    if(!q)return {plant:null,matches:[]};
    const exact=db.plants.filter(p=>{
      const names=[p.name,p.legacyId,...(p.aliases||[])].map(normalise);
      return names.includes(q);
    });
    if(exact.length===1)return {plant:exact[0],matches:exact};
    if(exact.length>1)return {plant:null,matches:exact};
    const partial=db.plants.filter(p=>{
      const names=[p.name,p.legacyId,...(p.aliases||[])].map(normalise);
      return names.some(x=>x.includes(q)||q.includes(x));
    });
    return {plant:partial.length===1?partial[0]:null,matches:partial};
  };

  if(typeof renderPlants==='function'){
    renderPlants=function(){
      const q=normalise(document.querySelector('#search')?.value||''),g=document.querySelector('#groupFilter')?.value||'',l=document.querySelector('#locationFilter')?.value||'',s=isOwner?(document.querySelector('#statusFilter')?.value||''):'';
      const list=db.plants.filter(p=>{
        const hay=[p.name,p.legacyId,p.group,p.location,p.medium,p.pot,p.potType,p.outer,...(p.aliases||[])].map(normalise).join(' ');
        if(q&&!hay.includes(q))return false;
        if(g&&p.group!==g)return false;
        if(l&&p.location!==l)return false;
        const st=statusOf(p);
        if(s==='due'&&!['today','overdue'].includes(st))return false;
        if(s==='upcoming'&&st!=='upcoming')return false;
        if(s==='reservoir'&&st!=='reservoir')return false;
        return true;
      });
      document.querySelector('#plantGrid').innerHTML=list.length?list.map(p=>`<article class="plant-card" data-id="${p.cloudId}"><img class="plant-photo" src="${photo(p)}" alt="${esc(p.name)}"><div class="plant-body"><div class="plant-top"><div><h3>${esc(p.name)}</h3><div class="plant-sub">${esc(p.location||'')}</div></div>${isOwner?`<span class="status ${statusOf(p)}">${statusLabel(p)}</span>`:''}</div><div class="chips"><span class="chip">${esc(p.group||'Plant')}</span>${p.pot?`<span class="chip">${esc(p.pot)}</span>`:''}${p.mode?`<span class="chip">${esc(p.mode)}</span>`:''}</div>${isOwner?`<div class="care-line"><div>Last care<strong>${fmt(p.lastCare)}</strong></div><div>Next check<strong>${p.nextCheck?fmt(p.nextCheck):'Reservoir-based'}</strong></div></div>`:''}</div></article>`).join(''):'<div class="empty">No plants match these filters.</div>';
      document.querySelectorAll('#plantGrid .plant-card').forEach(el=>el.onclick=()=>openPlant(el.dataset.id));
    };
  }

  function ensureAliasField(){
    const form=document.querySelector('#editDialog form');
    if(!form||document.getElementById('editAliases'))return;
    const nameInput=document.getElementById('editName');
    const nameLabel=nameInput?.closest('label');
    if(!nameLabel)return;
    const label=document.createElement('label');
    label.id='editAliasesLabel';
    label.innerHTML='Aliases / shortcuts<input id="editAliases" placeholder="vitta, vita, pd mint"><small style="display:block;margin-top:6px;color:var(--muted);line-height:1.35">Comma-separated. Used by website search, Telegram and future AI lookup.</small>';
    nameLabel.insertAdjacentElement('afterend',label);
  }

  if(typeof openEditDialog==='function'){
    const previousOpenEditDialog=openEditDialog;
    openEditDialog=function(p){
      ensureAliasField();
      previousOpenEditDialog(p);
      const input=document.getElementById('editAliases');
      if(input)input.value=(p.aliases||[]).join(', ');
    };
  }

  if(!window.__v34AliasSaveBound){
    window.__v34AliasSaveBound=true;
    document.addEventListener('click',async e=>{
      const btn=e.target.closest?.('#saveEditBtn');
      if(!btn)return;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      if(!requireOwner())return;
      ensureAliasField();
      const id=document.getElementById('editPlantId').value;
      const payload={
        name:document.getElementById('editName').value.trim(),
        aliases:parseAliases(document.getElementById('editAliases')?.value||''),
        location:document.getElementById('editLocation').value.trim(),
        pot:document.getElementById('editPot').value.trim(),
        medium:document.getElementById('editMedium').value.trim(),
        notes:document.getElementById('editNotes').value.trim()
      };
      const res=await sb.from('plants').update(payload).eq('id',id);
      if(res.error){alert(res.error.message);return;}
      document.getElementById('editDialog').close();
      await loadCloud();
      openPlant(id);
    },true);
  }

  async function boot(){
    ensureAliasField();
    const search=document.getElementById('search');
    if(search)search.placeholder='Search plant, alias, shelf, medium…';
    await hydrateAliases();
    if(document.getElementById('plantsView')?.classList.contains('active'))renderPlants();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,250),{once:true});else setTimeout(boot,250);
})();
