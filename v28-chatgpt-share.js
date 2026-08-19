/* Jasper's Plant Room v2.9 — Share live plant data + actual cloud image files with ChatGPT */
(function(){
  const css=`
.chatgpt-share-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:2px 0 14px}
.chatgpt-share-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px}
.chatgpt-share-btn[disabled]{opacity:.6;cursor:wait}
.chatgpt-share-note{color:var(--muted);font-size:.76rem;line-height:1.4}
#createAndSharePlantBtn{white-space:nowrap}
#chatgptReadyDialog{border:1px solid var(--line);border-radius:18px;background:var(--panel);color:var(--text);width:min(540px,calc(100vw - 28px));padding:0;box-shadow:var(--shadow)}
#chatgptReadyDialog::backdrop{background:rgba(3,7,6,.72)}
.chatgpt-ready-inner{padding:20px}.chatgpt-ready-inner h3{margin:0 0 8px}.chatgpt-ready-inner p{margin:0 0 14px;color:var(--muted);line-height:1.5}.chatgpt-ready-actions{display:flex;gap:9px;flex-wrap:wrap}.chatgpt-ready-actions button{flex:1 1 180px}
.chatgpt-share-status{font-size:.78rem;color:var(--muted);min-height:18px;margin-top:10px}
@media(max-width:650px){.chatgpt-share-row{margin-top:4px}.chatgpt-share-row .chatgpt-share-btn{width:100%}.chatgpt-share-note{width:100%}.add-plant-actions #createAndSharePlantBtn{flex:1 1 100%;width:100%}}
`;
  const style=document.createElement('style');style.id='v29ChatGPTShareStyles';style.textContent=css;document.head.appendChild(style);

  const preparedCache=new Map();
  function val(v){return v===null||v===undefined||v===''?'—':String(v);}
  function dateVal(v){try{return v?fmt(v):'—';}catch(_){return val(v);}}
  function safeFileName(s){return String(s||'plant-photo').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').slice(-120)||'plant-photo';}
  function shareableVisualItems(p){
    let gallery=[],growth=[];
    try{gallery=(galleryPhotos(p)||[]).filter(x=>x&&typeof x.url==='string'&&/^https?:\/\//i.test(x.url));}catch(_){gallery=[];}
    try{growth=(cloudPhotos(p,'growth')||[]).filter(x=>x&&typeof x.url==='string'&&/^https?:\/\//i.test(x.url));}catch(_){growth=[];}
    gallery=[...gallery].sort((a,b)=>(b.is_thumbnail?1:0)-(a.is_thumbnail?1:0)||(Number(a.effective_order??a.sort_order??0)-Number(b.effective_order??b.sort_order??0)));
    growth=[...growth].sort((a,b)=>String(b.photo_date||'').localeCompare(String(a.photo_date||'')));
    const all=[...gallery,...growth];
    const dedup=[];
    for(const x of all){if(!dedup.some(y=>y.url===x.url))dedup.push(x);}
    return dedup.slice(0,8);
  }
  function publicVisualUrls(p){return shareableVisualItems(p).map(x=>({url:x.url,date:x.photo_date||'',note:x.note||'',thumb:!!x.is_thumbnail,kind:x.kind||'gallery'}));}
  function publicGrowthUrls(p){let items=[];try{items=cloudPhotos(p,'growth')||[];}catch(_){items=[];}return items.filter(x=>x&&typeof x.url==='string'&&/^https?:\/\//i.test(x.url)).map(x=>({url:x.url,date:x.photo_date||'',note:x.note||''}));}
  function plantSharePacket(p){
    const gallery=publicVisualUrls(p).filter(x=>x.kind!=='growth');
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
    if(gallery.length)gallery.forEach((x,i)=>lines.push(`${i+1}. ${x.url}${x.thumb?' [thumbnail]':''}${x.date?' | '+x.date:''}${x.note?' | '+x.note:''}`));
    else lines.push('No directly shareable cloud gallery URLs yet.');
    if(growth.length){lines.push('',`Growth progress photos (${growth.length}):`);growth.forEach((x,i)=>lines.push(`${i+1}. ${x.url}${x.date?' | '+x.date:''}${x.note?' | '+x.note:''}`));}
    lines.push('','ChatGPT: use this live plant record as the source of truth. The share action should also include the actual cloud image files as attachments. Visually inspect the attached images, compare them with the plant data/history in Supabase, then give feedback and update care/check information if appropriate. If no image attachments arrived, say so clearly rather than guessing from filenames or URLs.');
    return lines.join('\n');
  }
  window.plantSharePacket=plantSharePacket;

  async function copyPacket(text){
    if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);return true;}
    const ta=document.createElement('textarea');ta.value=text;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();const ok=document.execCommand('copy');ta.remove();return ok;
  }
  function toast(message){
    let el=document.getElementById('chatgptShareToast');
    if(!el){el=document.createElement('div');el.id='chatgptShareToast';Object.assign(el.style,{position:'fixed',left:'50%',bottom:'22px',transform:'translateX(-50%)',zIndex:'2147483647',background:'#172820',color:'#edf4f0',border:'1px solid #365246',borderRadius:'999px',padding:'10px 16px',boxShadow:'0 10px 30px rgba(0,0,0,.35)',fontSize:'13px',maxWidth:'calc(100vw - 30px)',textAlign:'center',opacity:'0',transition:'opacity .18s'});document.body.appendChild(el);}
    el.textContent=message;el.style.opacity='1';clearTimeout(el._timer);el._timer=setTimeout(()=>el.style.opacity='0',4200);
  }

  async function fetchVisualFiles(p){
    const items=shareableVisualItems(p);const files=[];
    for(let i=0;i<items.length;i++){
      const x=items[i];
      try{
        const r=await fetch(x.url,{mode:'cors',credentials:'omit',cache:'force-cache'});
        if(!r.ok)throw new Error(`HTTP ${r.status}`);
        const blob=await r.blob();
        if(!/^image\//i.test(blob.type||''))throw new Error('Not an image response');
        const raw=decodeURIComponent((new URL(x.url)).pathname.split('/').pop()||`${p.name}-${i+1}.jpg`);
        const fileName=safeFileName(raw)||`plant-photo-${i+1}.jpg`;
        files.push(new File([blob],fileName,{type:blob.type||'image/jpeg',lastModified:Date.now()}));
      }catch(err){console.warn('Could not prepare image attachment',x.url,err);}
    }
    return files;
  }
  function cacheKey(p){return `${p.cloudId}|${shareableVisualItems(p).map(x=>x.url).join('|')}`;}
  async function preparePlantShare(p){
    const key=cacheKey(p);
    if(preparedCache.has(key))return preparedCache.get(key);
    const promise=(async()=>{
      const text=plantSharePacket(p);
      const files=await fetchVisualFiles(p);
      const canFileShare=!!(navigator.share&&files.length&&navigator.canShare&&navigator.canShare({files}));
      return {text,files,canFileShare,key};
    })();
    preparedCache.set(key,promise);
    try{return await promise;}catch(err){preparedCache.delete(key);throw err;}
  }
  window.preparePlantShare=preparePlantShare;

  async function performPreparedShare(p,prepared){
    const data={title:`${p.name} — Jasper's Plant Room`,text:prepared.text};
    if(prepared.canFileShare)data.files=prepared.files;
    if(navigator.share){
      try{await navigator.share(data);return prepared.canFileShare?'shared-files':'shared-text';}
      catch(err){if(err&&err.name==='AbortError')return 'cancelled';console.warn('Native share failed; falling back to clipboard',err);}
    }
    try{await copyPacket(prepared.text);toast(prepared.files.length?'Reference copied. This browser cannot attach the image files automatically — use the phone Share button for one-tap visual sharing.':'Plant reference copied — paste it into this ChatGPT conversation.');return 'copied';}
    catch(err){console.error(err);alert('Could not open the share sheet or copy the reference. Please try again.');return 'failed';}
  }
  async function sharePlantWithChatGPT(p,prepared=null){
    try{
      const pack=prepared||await preparePlantShare(p);
      return await performPreparedShare(p,pack);
    }catch(err){console.error(err);const text=plantSharePacket(p);try{await copyPacket(text);toast('Could not prepare photo attachments. Plant reference copied instead.');return 'copied';}catch(_){return 'failed';}}
  }
  window.sharePlantWithChatGPT=sharePlantWithChatGPT;

  function injectPlantShareButton(p){
    if(!isOwner)return;
    const body=document.getElementById('plantDialogBody');if(!body||document.getElementById('sharePlantChatGPTBtn'))return;
    const head=body.querySelector('.modal-head');if(!head)return;
    const row=document.createElement('div');row.className='chatgpt-share-row';row.innerHTML=`<button type="button" class="ghost small chatgpt-share-btn" id="sharePlantChatGPTBtn" disabled>↗ Preparing photos…</button><span class="chatgpt-share-note" id="sharePlantChatGPTNote">Preparing the live record + actual cloud image attachments.</span>`;head.insertAdjacentElement('afterend',row);
    const btn=document.getElementById('sharePlantChatGPTBtn'),note=document.getElementById('sharePlantChatGPTNote');
    preparePlantShare(p).then(prepared=>{
      btn.disabled=false;btn.textContent='↗ Share with ChatGPT';
      if(prepared.canFileShare)note.textContent=`Ready to share ${prepared.files.length} actual image attachment${prepared.files.length===1?'':'s'} + live plant data.`;
      else if(prepared.files.length)note.textContent='Photos prepared, but this browser cannot share image files directly. Phone sharing is recommended.';
      else note.textContent='Live plant data ready; no cloud image files could be prepared.';
      btn.onclick=()=>performPreparedShare(p,prepared);
    }).catch(()=>{btn.disabled=false;btn.textContent='↗ Share with ChatGPT';note.textContent='Photo preparation failed; sharing will fall back to the text reference.';btn.onclick=()=>sharePlantWithChatGPT(p);});
  }
  if(typeof openPlant==='function'){
    const originalOpenPlant=openPlant;
    openPlant=function(cloudId,activeTab='gallery'){
      const result=originalOpenPlant(cloudId,activeTab);const p=db.plants.find(x=>String(x.cloudId)===String(cloudId));if(p)requestAnimationFrame(()=>injectPlantShareButton(p));return result;
    };
  }

  function ensureReadyDialog(){
    let dlg=document.getElementById('chatgptReadyDialog');if(dlg)return dlg;
    dlg=document.createElement('dialog');dlg.id='chatgptReadyDialog';dlg.innerHTML=`<div class="chatgpt-ready-inner"><div class="eyebrow">PLANT CREATED</div><h3 id="chatgptReadyTitle">Ready for ChatGPT</h3><p id="chatgptReadyText">Your new plant is in Supabase. The site is preparing its actual cloud photos for sharing.</p><div class="chatgpt-ready-actions"><button type="button" class="primary" id="chatgptReadyShare" disabled>Preparing photos…</button><button type="button" class="ghost" id="chatgptReadyClose">Not now</button></div><div class="chatgpt-share-status" id="chatgptReadyStatus"></div></div>`;document.body.appendChild(dlg);document.getElementById('chatgptReadyClose').onclick=()=>dlg.close();return dlg;
  }
  async function waitForCreatedPlant(beforeIds,name,timeoutMs=30000){
    const started=Date.now();while(Date.now()-started<timeoutMs){const candidates=db.plants.filter(p=>p.cloudId&&!beforeIds.has(String(p.cloudId)));const exact=candidates.find(p=>String(p.name||'').trim().toLowerCase()===String(name||'').trim().toLowerCase());if(exact)return exact;if(candidates.length===1)return candidates[0];await new Promise(r=>setTimeout(r,250));}return null;
  }
  function injectAddPlantShareButton(){
    if(!isOwner)return;
    const actions=document.querySelector('#addPlantForm .add-plant-actions'),form=document.getElementById('addPlantForm'),createBtn=document.getElementById('createPlantBtn');if(!actions||!form||!createBtn||document.getElementById('createAndSharePlantBtn'))return;
    const btn=document.createElement('button');btn.type='button';btn.id='createAndSharePlantBtn';btn.className='ghost';btn.textContent='Create plant & Share with ChatGPT';actions.insertBefore(btn,document.getElementById('clearPlantBtn')||null);
    const help=document.createElement('div');help.className='add-plant-help';help.style.flexBasis='100%';help.textContent='Creates the plant and uploads its photos first, then prepares the actual cloud image files + live record for ChatGPT.';actions.appendChild(help);
    btn.onclick=async()=>{
      if(!form.reportValidity())return;
      const name=(document.getElementById('newPlantName')?.value||'').trim(),beforeIds=new Set(db.plants.map(p=>String(p.cloudId)));btn.disabled=true;btn.textContent='Creating plant…';const message=document.getElementById('addPlantMessage');if(message)message.textContent='Creating plant and uploading photos…';
      try{
        form.requestSubmit(createBtn);const p=await waitForCreatedPlant(beforeIds,name);if(!p){toast('Plant creation did not finish in time. If it was created, open it and use Share with ChatGPT.');return;}
        const dlg=ensureReadyDialog(),shareBtn=document.getElementById('chatgptReadyShare'),status=document.getElementById('chatgptReadyStatus');document.getElementById('chatgptReadyTitle').textContent=`${p.name} is ready`;document.getElementById('chatgptReadyText').textContent='Saved to the live database. Preparing the actual uploaded photos so your next tap can send them with the plant record.';shareBtn.disabled=true;shareBtn.textContent='Preparing photos…';status.textContent='';if(!dlg.open)dlg.showModal();
        const prepared=await preparePlantShare(p);shareBtn.disabled=false;shareBtn.textContent='Share with ChatGPT';document.getElementById('chatgptReadyText').textContent=prepared.canFileShare?`Ready with ${prepared.files.length} actual image attachment${prepared.files.length===1?'':'s'} + the live plant record. Tap below and choose ChatGPT.`:prepared.files.length?'The photos are prepared, but this browser cannot pass image files through the share sheet. On phone this usually works; otherwise the text reference will be copied.':'The live record is ready, but no cloud photos could be prepared.';
        shareBtn.onclick=async()=>{status.textContent='Opening share sheet…';const result=await performPreparedShare(p,prepared);status.textContent=result==='shared-files'?'Shared with actual photo attachments.':result==='shared-text'?'Shared, but this browser sent text only.':result==='copied'?'Reference copied.':'Share cancelled.';if(result==='shared-files'||result==='shared-text'||result==='copied')setTimeout(()=>{if(dlg.open)dlg.close();},700);};
      }finally{btn.disabled=false;btn.textContent='Create plant & Share with ChatGPT';}
    };
  }
  function boot(){injectAddPlantShareButton();const observer=new MutationObserver(()=>{if(isOwner)injectAddPlantShareButton();});observer.observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
