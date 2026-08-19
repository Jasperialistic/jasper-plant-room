/* Jasper's Plant Room v2.8 — Share with ChatGPT */
(function(){
  const css=`
.chatgpt-share-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:2px 0 14px}
.chatgpt-share-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px}
.chatgpt-share-note{color:var(--muted);font-size:.76rem;line-height:1.4}
#createAndSharePlantBtn{white-space:nowrap}
#chatgptReadyDialog{border:1px solid var(--line);border-radius:18px;background:var(--panel);color:var(--text);width:min(520px,calc(100vw - 28px));padding:0;box-shadow:var(--shadow)}
#chatgptReadyDialog::backdrop{background:rgba(3,7,6,.72)}
.chatgpt-ready-inner{padding:20px}.chatgpt-ready-inner h3{margin:0 0 8px}.chatgpt-ready-inner p{margin:0 0 14px;color:var(--muted);line-height:1.5}.chatgpt-ready-actions{display:flex;gap:9px;flex-wrap:wrap}.chatgpt-ready-actions button{flex:1 1 180px}
.chatgpt-share-status{font-size:.78rem;color:var(--muted);min-height:18px;margin-top:10px}
@media(max-width:650px){.chatgpt-share-row{margin-top:4px}.chatgpt-share-row .chatgpt-share-btn{width:100%}.chatgpt-share-note{width:100%}.add-plant-actions #createAndSharePlantBtn{flex:1 1 100%;width:100%}}
`;
  const style=document.createElement('style');
  style.id='v28ChatGPTShareStyles';
  style.textContent=css;
  document.head.appendChild(style);

  function val(v){return v===null||v===undefined||v===''?'—':String(v);}
  function dateVal(v){try{return v?fmt(v):'—';}catch(_){return val(v);}}
  function publicVisualUrls(p){
    let items=[];
    try{items=galleryPhotos(p)||[];}catch(_){items=[];}
    return items
      .filter(x=>x && typeof x.url==='string' && /^https?:\/\//i.test(x.url))
      .map(x=>({url:x.url,date:x.photo_date||'',note:x.note||'',thumb:!!x.is_thumbnail}))
      .filter((x,i,a)=>a.findIndex(y=>y.url===x.url)===i);
  }
  function publicGrowthUrls(p){
    let items=[];
    try{items=cloudPhotos(p,'growth')||[];}catch(_){items=[];}
    return items
      .filter(x=>x && typeof x.url==='string' && /^https?:\/\//i.test(x.url))
      .map(x=>({url:x.url,date:x.photo_date||'',note:x.note||''}));
  }
  function plantSharePacket(p){
    const gallery=publicVisualUrls(p);
    const growth=publicGrowthUrls(p);
    const lines=[
      'JASPER PLANT REFERENCE — LIVE WEBSITE',
      `Plant: ${val(p.name)}`,
      `Plant ID: ${val(p.cloudId)}`,
      `Group: ${val(p.group)}`,
      `Growing zone: ${val(p.location)}`,
      `Pot: ${val(p.pot)}`,
      `Pot type: ${val(p.potType)}`,
      `Outer/cache pot: ${val(p.outer)}`,
      `Medium: ${val(p.medium)}`,
      `Watering mode: ${val(p.mode)}`,
      `Light: ${val(p.light)}`,
      `Environment: ${val(p.environment)}`,
      `Last care: ${dateVal(p.lastCare)}${p.lastAction?' — '+p.lastAction:''}`,
      `Next check: ${dateVal(p.nextCheck)}`,
      `Check interval: ${p.checkDays?`${p.checkDays} day(s)`:'—'}`,
      `Care/check rule: ${val(p.rule)}`,
      `Notes: ${val(p.notes)}`,
      `ID confidence: ${val(p.confidence)}`,
      '',
      `Cloud gallery photos (${gallery.length}):`
    ];
    if(gallery.length){
      gallery.forEach((x,i)=>lines.push(`${i+1}. ${x.url}${x.thumb?' [thumbnail]':''}${x.date?' | '+x.date:''}${x.note?' | '+x.note:''}`));
    }else{
      lines.push('No directly shareable cloud gallery URLs yet. Bundled/embedded photos are visible on the website but are not included as direct visual URLs.');
    }
    if(growth.length){
      lines.push('',`Growth progress photos (${growth.length}):`);
      growth.forEach((x,i)=>lines.push(`${i+1}. ${x.url}${x.date?' | '+x.date:''}${x.note?' | '+x.note:''}`));
    }
    lines.push(
      '',
      'ChatGPT: please use this live plant record as the source of truth. Open and visually inspect the linked cloud photos, compare them with the plant data/history in Supabase, then give me feedback and update the care/check information if appropriate. Do not guess from the filenames alone.'
    );
    return lines.join('\n');
  }

  async function copyPacket(text){
    if(navigator.clipboard && window.isSecureContext){
      await navigator.clipboard.writeText(text);
      return true;
    }
    const ta=document.createElement('textarea');
    ta.value=text;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();
    const ok=document.execCommand('copy');ta.remove();return ok;
  }

  function toast(message){
    let el=document.getElementById('chatgptShareToast');
    if(!el){
      el=document.createElement('div');el.id='chatgptShareToast';
      Object.assign(el.style,{position:'fixed',left:'50%',bottom:'22px',transform:'translateX(-50%)',zIndex:'2147483647',background:'#172820',color:'#edf4f0',border:'1px solid #365246',borderRadius:'999px',padding:'10px 16px',boxShadow:'0 10px 30px rgba(0,0,0,.35)',fontSize:'13px',maxWidth:'calc(100vw - 30px)',textAlign:'center',opacity:'0',transition:'opacity .18s'});
      document.body.appendChild(el);
    }
    el.textContent=message;el.style.opacity='1';clearTimeout(el._timer);el._timer=setTimeout(()=>el.style.opacity='0',3200);
  }

  async function sharePlantWithChatGPT(p){
    const text=plantSharePacket(p);
    const shareData={title:`${p.name} — Jasper's Plant Room`,text};
    if(navigator.share){
      try{
        await navigator.share(shareData);
        return 'shared';
      }catch(err){
        if(err && err.name==='AbortError')return 'cancelled';
        console.warn('Native share failed; falling back to clipboard',err);
      }
    }
    try{
      await copyPacket(text);
      toast('Plant reference copied — paste it into this ChatGPT conversation.');
      return 'copied';
    }catch(err){
      console.error(err);
      alert('Could not open the share sheet or copy the reference. Please try again.');
      return 'failed';
    }
  }
  window.sharePlantWithChatGPT=sharePlantWithChatGPT;
  window.plantSharePacket=plantSharePacket;

  function injectPlantShareButton(p){
    if(!isOwner)return;
    const body=document.getElementById('plantDialogBody');
    if(!body || document.getElementById('sharePlantChatGPTBtn'))return;
    const head=body.querySelector('.modal-head');
    if(!head)return;
    const row=document.createElement('div');
    row.className='chatgpt-share-row';
    row.innerHTML=`<button type="button" class="ghost small chatgpt-share-btn" id="sharePlantChatGPTBtn">↗ Share with ChatGPT</button><span class="chatgpt-share-note">Sends this plant's live data + direct cloud gallery links for visual review.</span>`;
    head.insertAdjacentElement('afterend',row);
    document.getElementById('sharePlantChatGPTBtn').onclick=()=>sharePlantWithChatGPT(p);
  }

  if(typeof openPlant==='function'){
    const originalOpenPlant=openPlant;
    openPlant=function(cloudId,activeTab='gallery'){
      const result=originalOpenPlant(cloudId,activeTab);
      const p=db.plants.find(x=>String(x.cloudId)===String(cloudId));
      if(p)requestAnimationFrame(()=>injectPlantShareButton(p));
      return result;
    };
  }

  function ensureReadyDialog(){
    let dlg=document.getElementById('chatgptReadyDialog');
    if(dlg)return dlg;
    dlg=document.createElement('dialog');
    dlg.id='chatgptReadyDialog';
    dlg.innerHTML=`<div class="chatgpt-ready-inner"><div class="eyebrow">PLANT CREATED</div><h3 id="chatgptReadyTitle">Ready for ChatGPT</h3><p id="chatgptReadyText">Your new plant and its uploaded photos are in Supabase. One more tap opens your phone share sheet; on PC it copies the reference for this conversation.</p><div class="chatgpt-ready-actions"><button type="button" class="primary" id="chatgptReadyShare">Share with ChatGPT</button><button type="button" class="ghost" id="chatgptReadyClose">Not now</button></div><div class="chatgpt-share-status" id="chatgptReadyStatus"></div></div>`;
    document.body.appendChild(dlg);
    document.getElementById('chatgptReadyClose').onclick=()=>dlg.close();
    return dlg;
  }

  async function waitForCreatedPlant(beforeIds,name,timeoutMs=30000){
    const started=Date.now();
    while(Date.now()-started<timeoutMs){
      const candidates=db.plants.filter(p=>p.cloudId && !beforeIds.has(String(p.cloudId)));
      const exact=candidates.find(p=>String(p.name||'').trim().toLowerCase()===String(name||'').trim().toLowerCase());
      if(exact)return exact;
      if(candidates.length===1)return candidates[0];
      await new Promise(r=>setTimeout(r,250));
    }
    return null;
  }

  function injectAddPlantShareButton(){
    if(!isOwner)return;
    const actions=document.querySelector('#addPlantForm .add-plant-actions');
    const form=document.getElementById('addPlantForm');
    const createBtn=document.getElementById('createPlantBtn');
    if(!actions || !form || !createBtn || document.getElementById('createAndSharePlantBtn'))return;
    const btn=document.createElement('button');
    btn.type='button';btn.id='createAndSharePlantBtn';btn.className='ghost';btn.textContent='Create plant & Share with ChatGPT';
    actions.insertBefore(btn,document.getElementById('clearPlantBtn')||null);
    const help=document.createElement('div');
    help.className='add-plant-help';help.style.flexBasis='100%';help.textContent='Creates the plant first. Then one tap shares the live record + cloud photo links to ChatGPT for visual review.';
    actions.appendChild(help);

    btn.onclick=async()=>{
      if(!form.reportValidity())return;
      const name=(document.getElementById('newPlantName')?.value||'').trim();
      const beforeIds=new Set(db.plants.map(p=>String(p.cloudId)));
      btn.disabled=true;btn.textContent='Creating plant…';
      const message=document.getElementById('addPlantMessage');
      if(message)message.textContent='Creating plant, then preparing the ChatGPT reference…';
      try{
        form.requestSubmit(createBtn);
        const p=await waitForCreatedPlant(beforeIds,name);
        if(!p){
          toast('Plant creation did not finish in time. If it was created, open it and use Share with ChatGPT.');
          return;
        }
        const dlg=ensureReadyDialog();
        document.getElementById('chatgptReadyTitle').textContent=`${p.name} is ready`;
        const cloudCount=publicVisualUrls(p).length;
        document.getElementById('chatgptReadyText').textContent=`Saved to the live database${cloudCount?` with ${cloudCount} shareable cloud photo${cloudCount===1?'':'s'}`:''}. Tap below and choose ChatGPT on your phone, or the reference will be copied on PC.`;
        document.getElementById('chatgptReadyStatus').textContent='';
        document.getElementById('chatgptReadyShare').onclick=async()=>{
          const status=document.getElementById('chatgptReadyStatus');status.textContent='Preparing reference…';
          const result=await sharePlantWithChatGPT(p);
          status.textContent=result==='copied'?'Copied. Paste it into this conversation.':result==='shared'?'Shared.':'Share cancelled.';
          if(result==='shared'||result==='copied')setTimeout(()=>{if(dlg.open)dlg.close();},500);
        };
        if(!dlg.open)dlg.showModal();
      }finally{
        btn.disabled=false;btn.textContent='Create plant & Share with ChatGPT';
      }
    };
  }

  function boot(){
    injectAddPlantShareButton();
    const observer=new MutationObserver(()=>{
      if(isOwner)injectAddPlantShareButton();
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
