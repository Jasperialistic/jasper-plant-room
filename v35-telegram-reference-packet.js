/* Jasper's Plant Room v3.5 — focused Telegram reference packet */
(function(){
  let currentPlantId=null;
  let sending=false;

  const previousOpenPlant=typeof openPlant==='function'?openPlant:null;
  if(previousOpenPlant){
    openPlant=function(cloudId,activeTab='gallery'){
      currentPlantId=String(cloudId||'');
      return previousOpenPlant(cloudId,activeTab);
    };
  }

  function toast(message){
    let el=document.getElementById('v35TelegramReferenceToast');
    if(!el){
      el=document.createElement('div');
      el.id='v35TelegramReferenceToast';
      Object.assign(el.style,{position:'fixed',left:'50%',bottom:'22px',transform:'translateX(-50%)',zIndex:'2147483647',background:'#172820',color:'#edf4f0',border:'1px solid #365246',borderRadius:'999px',padding:'10px 16px',boxShadow:'0 10px 30px rgba(0,0,0,.35)',fontSize:'13px',maxWidth:'calc(100vw - 30px)',textAlign:'center',opacity:'0',transition:'opacity .18s'});
      document.body.appendChild(el);
    }
    el.textContent=message;
    el.style.opacity='1';
    clearTimeout(el._timer);
    el._timer=setTimeout(()=>el.style.opacity='0',4200);
  }

  function sourceUrl(item){
    if(item?.url)return item.url;
    if(item?.storage_path&&typeof publicUrl==='function')return publicUrl(item.storage_path);
    return '';
  }

  function latestGrowth(p){
    return (db.photos||[])
      .filter(x=>String(x.plant_id)===String(p.cloudId)&&x.kind==='growth')
      .slice()
      .sort((a,b)=>String(b.photo_date||'').localeCompare(String(a.photo_date||''))||String(b.created_at||'').localeCompare(String(a.created_at||''))||Number(b.sort_order||0)-Number(a.sort_order||0))
      .slice(0,3);
  }

  async function imageToJpeg(url){
    const response=await fetch(url,{cache:'no-store'});
    if(!response.ok)throw new Error(`Could not prepare reference image (${response.status})`);
    const sourceBlob=await response.blob();
    const objectUrl=URL.createObjectURL(sourceBlob);
    try{
      const img=new Image();
      img.decoding='async';
      await new Promise((resolve,reject)=>{
        img.onload=resolve;
        img.onerror=()=>reject(new Error('This image could not be converted for Telegram.'));
        img.src=objectUrl;
      });
      const maxEdge=2400;
      const scale=Math.min(1,maxEdge/Math.max(img.naturalWidth||1,img.naturalHeight||1));
      const width=Math.max(1,Math.round(img.naturalWidth*scale));
      const height=Math.max(1,Math.round(img.naturalHeight*scale));
      const canvas=document.createElement('canvas');
      canvas.width=width;canvas.height=height;
      const ctx=canvas.getContext('2d',{alpha:false});
      if(!ctx)throw new Error('Could not prepare image canvas.');
      ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);
      ctx.drawImage(img,0,0,width,height);
      const blob=await new Promise((resolve,reject)=>canvas.toBlob(x=>x?resolve(x):reject(new Error('JPEG conversion failed.')),'image/jpeg',0.91));
      return blob;
    }finally{
      URL.revokeObjectURL(objectUrl);
    }
  }

  async function uploadReferenceJpeg(p,source,index){
    const url=sourceUrl(source.item);
    if(!url)throw new Error('Reference image has no readable source.');
    const jpeg=await imageToJpeg(url);
    const slot=source.role==='thumbnail'?'thumbnail':`growth-${index}`;
    const path=`${session.user.id}/${p.cloudId}/share-cache/reference-${slot}.jpg`;
    const up=await sb.storage.from('plant-media').upload(path,jpeg,{contentType:'image/jpeg',upsert:true,cacheControl:'3600'});
    if(up.error)throw up.error;
    return {
      storage_path:path,
      role:source.role,
      photo_date:source.item?.photo_date||'',
      note:source.item?.note||''
    };
  }

  async function sendReferencePacket(btn,p){
    const gallery=galleryPhotos(p);
    const thumb=gallery.find(x=>x.is_thumbnail)||gallery[0]||null;
    const growth=latestGrowth(p);
    const sources=[];
    if(thumb)sources.push({role:'thumbnail',item:thumb});
    growth.forEach(x=>sources.push({role:'growth',item:x}));

    const media=[];
    for(let i=0;i<sources.length;i++){
      btn.textContent=`Preparing photo ${i+1}/${sources.length}…`;
      try{
        media.push(await uploadReferenceJpeg(p,sources[i],i));
      }catch(err){
        if(sources[i].role==='thumbnail')throw err;
        console.warn('Skipped one growth reference image',err);
      }
    }

    btn.textContent='Sending reference packet…';
    const {data,error}=await sb.functions.invoke('plant_telegram_share',{body:{plant_id:p.cloudId,reference_media:media}});
    if(error){
      let message=error.message||'Telegram reference send failed';
      try{if(error.context){const parsed=await error.context.json();if(parsed?.error)message=parsed.error;}}catch(_){ }
      throw new Error(message);
    }
    if(data?.error)throw new Error(data.error);
    return data;
  }

  if(!window.__v35TelegramReferenceBound){
    window.__v35TelegramReferenceBound=true;
    document.addEventListener('click',async e=>{
      const btn=e.target.closest?.('#sharePlantTelegramBtn');
      if(!btn||!btn.classList.contains('bot-connected'))return;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      if(sending)return;
      const p=db.plants.find(x=>String(x.cloudId)===String(currentPlantId));
      if(!p)return;
      sending=true;
      const old=btn.textContent;
      btn.disabled=true;
      btn.classList.add('bot-working');
      try{
        const result=await sendReferencePacket(btn,p);
        const g=Number(result?.growth_reference_sent||0);
        toast(`Sent ${p.name}: current thumbnail${g?` + latest ${g} growth photo${g===1?'':'s'}`:''}.`);
      }catch(err){
        console.error(err);
        alert(err instanceof Error?err.message:String(err));
      }finally{
        sending=false;
        btn.disabled=false;
        btn.classList.remove('bot-working');
        btn.textContent=old;
      }
    },true);
  }
})();
