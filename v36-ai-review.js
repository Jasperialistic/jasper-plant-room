/* Jasper's Plant Room v3.7 — AI review + ChatGPT visual evidence bridge */
(function(){
  let currentPlantId='';
  let busy=false;

  function fmtMoney(v){const n=Number(v||0);return '$'+(n<0.01?n.toFixed(6):n.toFixed(4));}
  function ensurePanel(){
    let panel=document.getElementById('plantAiReviewPanel');
    if(panel)return panel;
    panel=document.createElement('div');panel.id='plantAiReviewPanel';
    panel.style.cssText='margin-top:14px;padding:14px;border:1px solid #2d493d;border-radius:14px;background:rgba(18,36,29,.72);line-height:1.5';
    panel.innerHTML='<small style="color:var(--muted)">No AI visual review saved yet.</small>';
    const anchor=document.querySelector('#plantDialogBody .chatgpt-share-note')||document.querySelector('#plantDialogBody .chatgpt-share-row');
    if(anchor)anchor.insertAdjacentElement('afterend',panel);else document.querySelector('#plantDialogBody')?.appendChild(panel);return panel;
  }
  function bullets(items){const a=Array.isArray(items)?items.filter(Boolean):[];return a.length?'<ul>'+a.map(x=>'<li>'+esc(String(x))+'</li>').join('')+'</ul>':'<div>None noted.</div>';}
  function renderResult(result){
    const panel=ensurePanel(),r=result.review||{};
    const concerns=Array.isArray(r.concerns)&&r.concerns.length?'<ul>'+r.concerns.map(x=>'<li><strong>'+esc(String(x.issue||'Concern'))+'</strong> ('+esc(String(x.severity||'low'))+') — '+esc(String(x.evidence||''))+'</li>').join('')+'</ul>':'<div>No visible concerns noted.</div>';
    const reuse=result.reused?'<div style="margin-top:7px;color:var(--accent);font-size:12px">Same growth photos · reused saved review · $0 new API cost</div>':'';
    const bridge=Number(result.evidence_saved||0)>0?'<div style="margin-top:5px;color:var(--ok);font-size:12px">✓ ChatGPT visual evidence ready · '+Number(result.evidence_saved)+' photo'+(Number(result.evidence_saved)===1?'':'s')+'</div>':'';
    const budget=result.budget?'<small style="display:block;margin-top:10px;color:var(--muted)">'+esc(String(result.model||'gpt-5.6-luna'))+' · '+(result.reused?'new cost '+fmtMoney(0):'this review '+fmtMoney(result.usage?.cost_usd))+' · month '+fmtMoney(result.budget?.spent_usd)+' / '+fmtMoney(result.budget?.limit_usd)+'</small>':'<small style="display:block;margin-top:10px;color:var(--muted)">'+esc(String(result.model||'gpt-5.6-luna'))+' · saved review '+fmtMoney(result.usage?.cost_usd)+'</small>';
    panel.innerHTML='<div class="eyebrow">AI VISUAL REVIEW</div><strong>'+esc(String(r.overall_status||'unclear'))+' · '+esc(String(r.confidence||'—'))+' confidence</strong><p style="margin:8px 0">'+esc(String(r.summary||''))+'</p><details><summary>Changes</summary>'+bullets(r.changes_since_previous)+'</details><details><summary>Concerns</summary>'+concerns+'</details><details><summary>Check next</summary>'+bullets(r.recommended_checks)+'</details>'+reuse+bridge+budget;
  }
  async function loadLatest(plantId){
    const panel=ensurePanel();
    try{const {data,error}=await sb.from('plant_ai_reviews').select('*').eq('plant_id',plantId).order('created_at',{ascending:false}).limit(1).maybeSingle();if(error)throw error;if(!data)return;renderResult({review:data.review,model:data.model,usage:{cost_usd:data.cost_usd},budget:null});}
    catch(err){console.warn('AI review load failed',err);panel.innerHTML='<small style="color:var(--muted)">AI review history could not be loaded.</small>';}
  }
  function sourceUrl(item){if(item?.url)return item.url;if(item?.storage_path&&typeof publicUrl==='function')return publicUrl(item.storage_path);return '';}
  function latestGrowth(p){return (db.photos||[]).filter(x=>String(x.plant_id)===String(p.cloudId)&&x.kind==='growth').slice().sort((a,b)=>String(b.photo_date||'').localeCompare(String(a.photo_date||''))||String(b.created_at||'').localeCompare(String(a.created_at||''))||Number(b.sort_order||0)-Number(a.sort_order||0)).slice(0,2);}
  async function imageEvidence(item){
    const url=sourceUrl(item);if(!url)throw new Error('Growth photo has no readable source.');
    const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw new Error('Could not prepare ChatGPT evidence image ('+response.status+').');
    const blob=await response.blob(),objectUrl=URL.createObjectURL(blob);
    try{
      const img=new Image();img.decoding='async';await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('Could not decode growth photo for ChatGPT evidence.'));img.src=objectUrl;});
      const maxEdge=1600,scale=Math.min(1,maxEdge/Math.max(img.naturalWidth||1,img.naturalHeight||1)),width=Math.max(1,Math.round(img.naturalWidth*scale)),height=Math.max(1,Math.round(img.naturalHeight*scale));
      const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw new Error('Could not prepare evidence canvas.');ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.drawImage(img,0,0,width,height);
      const jpg=await new Promise((resolve,reject)=>canvas.toBlob(x=>x?resolve(x):reject(new Error('Evidence JPEG conversion failed.')),'image/jpeg',0.82));
      const dataUrl=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=()=>reject(new Error('Could not encode evidence image.'));r.readAsDataURL(jpg);});
      return {photo_id:item.id||item.photo_id||null,data_url:dataUrl,width,height,byte_size:jpg.size};
    }finally{URL.revokeObjectURL(objectUrl);}
  }
  async function buildEvidence(p,btn){
    const growth=latestGrowth(p);if(!growth.length)return [];
    const out=[];for(let i=0;i<growth.length;i++){btn.textContent='Preparing visual evidence '+(i+1)+'/'+growth.length+'…';out.push(await imageEvidence(growth[i]));}return out;
  }
  async function analyze(p,btn){
    if(busy)return;busy=true;btn.disabled=true;const old=btn.textContent;
    try{
      const evidence=await buildEvidence(p,btn);btn.textContent='Checking latest growth…';
      const {data,error}=await sb.functions.invoke('plant_ai_review_safe',{body:{plant_id:p.cloudId,source:'website',evidence_images:evidence}});
      if(error){let msg=error.message||'AI review failed';try{if(error.context){const j=await error.context.json();if(j?.error)msg=j.error;}}catch(_){ }throw new Error(msg);}if(data?.error)throw new Error(data.error);
      renderResult(data);
      const ready=Number(data.evidence_saved||0)>0?' · ChatGPT evidence ready':'';
      if(data.reused)alert('No new growth photos since the last AI review. Reused the saved review for $0.00 new cost.'+ready+' Month: '+fmtMoney(data.budget?.spent_usd)+' / '+fmtMoney(data.budget?.limit_usd));
      else alert('AI review saved. Cost: '+fmtMoney(data.usage?.cost_usd)+' · month: '+fmtMoney(data.budget?.spent_usd)+' / '+fmtMoney(data.budget?.limit_usd)+ready);
    }catch(err){console.error(err);alert(err instanceof Error?err.message:String(err));}
    finally{busy=false;btn.disabled=false;btn.textContent=old;}
  }
  function install(plantId){
    if(!isOwner)return;const p=db.plants.find(x=>String(x.cloudId)===String(plantId));if(!p)return;
    let btn=document.getElementById('analyzePlantAiBtn');if(!btn){btn=document.createElement('button');btn.id='analyzePlantAiBtn';btn.type='button';btn.className='ghost small';const row=document.querySelector('#plantDialogBody .chatgpt-share-row')||document.querySelector('#plantDialogBody .quick-actions');if(row)row.appendChild(btn);else document.querySelector('#plantDialogBody')?.appendChild(btn);}
    btn.textContent='🤖 Analyze latest growth';btn.title='Analyze the latest 2 Growth Progress photos and save compact visual evidence so ChatGPT can inspect those same photos later. Unchanged photos reuse the saved review for $0 new API cost.';btn.onclick=e=>{e.preventDefault();e.stopPropagation();analyze(p,btn);};ensurePanel();loadLatest(plantId);
  }
  if(typeof openPlant==='function'){const prev=openPlant;openPlant=function(cloudId,activeTab='gallery'){currentPlantId=String(cloudId||'');const out=prev(cloudId,activeTab);setTimeout(()=>install(currentPlantId),100);return out;};}
})();
