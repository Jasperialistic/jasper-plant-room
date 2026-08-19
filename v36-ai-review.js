/* Jasper's Plant Room v3.6 — AI visual review */
(function(){
  let currentPlantId='';
  let busy=false;

  function fmtMoney(v){const n=Number(v||0);return '$'+(n<0.01?n.toFixed(6):n.toFixed(4));}
  function ensurePanel(){
    let panel=document.getElementById('plantAiReviewPanel');
    if(panel)return panel;
    panel=document.createElement('div');
    panel.id='plantAiReviewPanel';
    panel.style.cssText='margin-top:14px;padding:14px;border:1px solid #2d493d;border-radius:14px;background:rgba(18,36,29,.72);line-height:1.5';
    panel.innerHTML='<small style="color:var(--muted)">No AI visual review saved yet.</small>';
    const anchor=document.querySelector('#plantDialogBody .chatgpt-share-note')||document.querySelector('#plantDialogBody .chatgpt-share-row');
    if(anchor)anchor.insertAdjacentElement('afterend',panel);else document.querySelector('#plantDialogBody')?.appendChild(panel);
    return panel;
  }
  function bullets(items){const a=Array.isArray(items)?items.filter(Boolean):[];return a.length?'<ul>'+a.map(x=>'<li>'+esc(String(x))+'</li>').join('')+'</ul>':'<div>None noted.</div>';}
  function renderResult(result){
    const panel=ensurePanel(),r=result.review||{};
    const concerns=Array.isArray(r.concerns)&&r.concerns.length?'<ul>'+r.concerns.map(x=>'<li><strong>'+esc(String(x.issue||'Concern'))+'</strong> ('+esc(String(x.severity||'low'))+') — '+esc(String(x.evidence||''))+'</li>').join('')+'</ul>':'<div>No visible concerns noted.</div>';
    panel.innerHTML='<div class="eyebrow">AI VISUAL REVIEW</div><strong>'+esc(String(r.overall_status||'unclear'))+' · '+esc(String(r.confidence||'—'))+' confidence</strong><p style="margin:8px 0">'+esc(String(r.summary||''))+'</p><details><summary>Changes</summary>'+bullets(r.changes_since_previous)+'</details><details><summary>Concerns</summary>'+concerns+'</details><details><summary>Check next</summary>'+bullets(r.recommended_checks)+'</details><small style="display:block;margin-top:10px;color:var(--muted)">'+esc(String(result.model||'gpt-5.6-luna'))+' · this review '+fmtMoney(result.usage?.cost_usd)+' · month '+fmtMoney(result.budget?.spent_usd)+' / '+fmtMoney(result.budget?.limit_usd)+'</small>';
  }
  async function loadLatest(plantId){
    const panel=ensurePanel();
    try{
      const {data,error}=await sb.from('plant_ai_reviews').select('*').eq('plant_id',plantId).order('created_at',{ascending:false}).limit(1).maybeSingle();
      if(error)throw error;
      if(!data)return;
      renderResult({review:data.review,model:data.model,usage:{cost_usd:data.cost_usd},budget:null});
    }catch(err){console.warn('AI review load failed',err);panel.innerHTML='<small style="color:var(--muted)">AI review history could not be loaded.</small>';}
  }
  async function analyze(p,btn){
    if(busy)return;busy=true;btn.disabled=true;const old=btn.textContent;btn.textContent='Analyzing latest growth…';
    try{
      const {data,error}=await sb.functions.invoke('plant_ai_review',{body:{plant_id:p.cloudId,source:'website'}});
      if(error){let msg=error.message||'AI review failed';try{if(error.context){const j=await error.context.json();if(j?.error)msg=j.error;}}catch(_){ }throw new Error(msg);}
      if(data?.error)throw new Error(data.error);
      renderResult(data);
      alert('AI review saved. Cost: '+fmtMoney(data.usage?.cost_usd)+' · month: '+fmtMoney(data.budget?.spent_usd)+' / '+fmtMoney(data.budget?.limit_usd));
    }catch(err){console.error(err);alert(err instanceof Error?err.message:String(err));}
    finally{busy=false;btn.disabled=false;btn.textContent=old;}
  }
  function install(plantId){
    if(!isOwner)return;
    const p=db.plants.find(x=>String(x.cloudId)===String(plantId));if(!p)return;
    let btn=document.getElementById('analyzePlantAiBtn');
    if(!btn){btn=document.createElement('button');btn.id='analyzePlantAiBtn';btn.type='button';btn.className='ghost small';const row=document.querySelector('#plantDialogBody .chatgpt-share-row')||document.querySelector('#plantDialogBody .quick-actions');if(row)row.appendChild(btn);else document.querySelector('#plantDialogBody')?.appendChild(btn);}
    btn.textContent='🤖 Analyze latest growth';btn.title='Analyze the latest 2 Growth Progress photos; thumbnail is used only when no growth photos exist.';btn.onclick=e=>{e.preventDefault();e.stopPropagation();analyze(p,btn);};
    ensurePanel();loadLatest(plantId);
  }
  if(typeof openPlant==='function'){
    const prev=openPlant;
    openPlant=function(cloudId,activeTab='gallery'){currentPlantId=String(cloudId||'');const out=prev(cloudId,activeTab);setTimeout(()=>install(currentPlantId),100);return out;};
  }
})();
