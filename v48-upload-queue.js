/* Jasper's Plant Room v4.42.0 — bounded, recoverable media uploads. */
(function v442UploadQueue(){
  'use strict';

  const BUCKET='plant-media';
  const MAX_FILE_BYTES=40*1024*1024;
  const MAX_ATTEMPTS=3;
  const RETRY_DELAYS=[700,1600];
  const batches=new Map();
  let createBatch=null;

  const style=document.createElement('style');
  style.id='v442UploadQueueStyles';
  style.textContent=`
.v442-upload-queue{display:grid;gap:8px;margin-top:12px;padding:10px;border:1px solid var(--kemuri-line,#303334);border-radius:12px;background:rgba(8,10,10,.5)}
.v442-upload-queue[hidden]{display:none}.v442-upload-list{display:grid;gap:6px;max-height:210px;overflow:auto}
.v442-upload-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:8px 9px;border:1px solid rgba(255,255,255,.06);border-radius:9px;background:rgba(255,255,255,.025)}
.v442-upload-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:#d7dbd8}
.v442-upload-state{font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#8f9994}.v442-upload-item[data-state="complete"] .v442-upload-state{color:#91af9b}.v442-upload-item[data-state="failed"] .v442-upload-state{color:#d18d91}
.v442-upload-summary{font-size:11px;color:#a4aca8;line-height:1.45}.v442-upload-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:7px}.v442-upload-actions button{min-height:34px;padding:0 11px}
`;
  document.head.appendChild(style);

  const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const duplicateError=error=>/already exists|duplicate|409 conflict/i.test(String(error?.message||error||''));
  const transientError=error=>{
    const status=Number(error?.status||error?.statusCode||error?.context?.status||0);
    return status===408||status===425||status===429||status>=500||
      /network|fetch|timeout|timed out|temporar|connection|502|503|504|520/i.test(String(error?.message||error||''));
  };

  function queueHost(id,anchor){
    let host=document.getElementById(id);
    if(host)return host;
    host=document.createElement('section');host.id=id;host.className='v442-upload-queue';host.hidden=true;
    host.innerHTML='<div class="v442-upload-summary"></div><div class="v442-upload-list"></div><div class="v442-upload-actions"><button type="button" class="ghost" data-v442-retry hidden>Retry failed</button><button type="button" class="ghost" data-v442-finish hidden>Keep successes</button></div>';
    anchor?.insertAdjacentElement('afterend',host);
    return host;
  }

  function safeLabel(file,index){
    const name=String(file?.name||`Photo ${index+1}`);
    return name.length>72?`${name.slice(0,34)}…${name.slice(-34)}`:name;
  }

  function buildItems({plantId,files,kind,date,note='',startOrder=0}){
    return [...files].map((file,index)=>({
      key:crypto.randomUUID(),file,index,plantId,kind,date,note,
      path:`${session.user.id}/${plantId}/${kind}/${crypto.randomUUID()}-${safeName(file.name||`photo-${index+1}.jpg`)}`,
      sortOrder:kind==='gallery'?startOrder+index*10:0,
      isThumbnail:kind==='gallery'&&index===0,
      state:'queued',attempts:0,error:null,metadata:null,thumbnailPath:''
    }));
  }

  function mountBatch(batch){
    const host=batch.host;host.hidden=false;host.dataset.batchId=batch.id;
    const list=host.querySelector('.v442-upload-list');list.replaceChildren();
    batch.items.forEach(item=>{
      const row=document.createElement('div');row.className='v442-upload-item';row.dataset.key=item.key;row.dataset.state=item.state;
      const name=document.createElement('span');name.className='v442-upload-name';name.textContent=safeLabel(item.file,item.index);
      const state=document.createElement('span');state.className='v442-upload-state';state.textContent=item.state;
      row.append(name,state);list.appendChild(row);
    });
    host.querySelector('[data-v442-retry]').onclick=()=>retryFailed(batch);
    host.querySelector('[data-v442-finish]').onclick=()=>batch.finish?.(batch);
    renderBatch(batch);
  }

  function renderItem(batch,item){
    const row=batch.host.querySelector(`[data-key="${CSS.escape(item.key)}"]`);if(!row)return;
    row.dataset.state=item.state;
    row.querySelector('.v442-upload-state').textContent=item.state==='retrying'?`retry ${item.attempts}/${MAX_ATTEMPTS}`:item.state;
    row.title=item.error?String(item.error.message||item.error):'';
  }

  function report(batch){
    const complete=batch.items.filter(item=>item.state==='complete').length;
    const failed=batch.items.filter(item=>item.state==='failed').length;
    const active=batch.items.filter(item=>['preparing','uploading','confirming','retrying'].includes(item.state)).length;
    return {complete,failed,active,total:batch.items.length};
  }

  function renderBatch(batch){
    const summary=report(batch),host=batch.host;
    host.querySelector('.v442-upload-summary').textContent=summary.active?
      `${summary.complete} complete · ${summary.active} active · ${summary.total-summary.complete-summary.active} queued`:
      `${summary.complete} of ${summary.total} complete${summary.failed?` · ${summary.failed} failed`:''}`;
    host.querySelector('[data-v442-retry]').hidden=!summary.failed||batch.running;
    host.querySelector('[data-v442-finish]').hidden=!summary.failed||batch.running||!batch.finish;
    return summary;
  }

  async function existingMetadata(path){
    const result=await sb.from('plant_photos').select('id,storage_path,is_thumbnail').eq('storage_path',path).limit(1).maybeSingle();
    if(result.error)throw result.error;
    return result.data||null;
  }

  async function persistMetadata(item){
    const existing=await existingMetadata(item.path);
    if(existing)return existing;
    const result=await sb.from('plant_photos').insert({
      user_id:session.user.id,plant_id:item.plantId,kind:item.kind,storage_path:item.path,
      thumbnail_path:item.thumbnailPath,photo_date:item.date||isoToday(),note:item.note,
      sort_order:item.sortOrder,is_thumbnail:item.isThumbnail
    }).select('id,storage_path,is_thumbnail').single();
    if(result.error)throw result.error;
    return result.data;
  }

  function validate(item){
    if(!(item.file instanceof Blob)||!String(item.file.type||'').startsWith('image/'))throw new Error('Not a supported image file.');
    if(!item.file.size)throw new Error('The image file is empty.');
    if(item.file.size>MAX_FILE_BYTES)throw new Error('Image exceeds the 40 MB safety limit.');
    if(typeof window.plantUploadPair!=='function')throw new Error('The media pipeline is unavailable. Reload and try again.');
  }

  async function uploadItem(batch,item){
    let lastError=null;
    for(let attempt=1;attempt<=MAX_ATTEMPTS;attempt++){
      item.attempts=attempt;item.error=null;item.state=attempt===1?'preparing':'retrying';renderItem(batch,item);renderBatch(batch);
      try{
        validate(item);
        item.state='uploading';renderItem(batch,item);
        item.thumbnailPath=await window.plantUploadPair(item.path,item.file);
        item.state='confirming';renderItem(batch,item);
        item.metadata=await persistMetadata(item);
        item.state='complete';renderItem(batch,item);renderBatch(batch);return;
      }catch(error){
        lastError=error;
        if(duplicateError(error))continue;
        if(attempt>=MAX_ATTEMPTS||!transientError(error))break;
        await pause(RETRY_DELAYS[attempt-1]||1600);
      }
    }
    item.error=lastError||new Error('Upload failed.');item.state='failed';renderItem(batch,item);renderBatch(batch);
  }

  async function ensureGalleryThumbnail(batch){
    if(batch.kind!=='gallery')return;
    const complete=batch.items.filter(item=>item.state==='complete');
    if(!complete.length||complete.some(item=>item.metadata?.is_thumbnail))return;
    const first=complete[0];
    const result=await sb.from('plant_photos').update({is_thumbnail:true}).eq('id',first.metadata.id).eq('plant_id',batch.plantId);
    if(result.error)throw result.error;
    first.metadata.is_thumbnail=true;
  }

  async function processBatch(batch,items=batch.items.filter(item=>item.state==='queued'||item.state==='failed')){
    if(batch.running||!items.length)return report(batch);
    batch.running=true;items.forEach(item=>{item.state='queued';item.error=null;renderItem(batch,item);});renderBatch(batch);
    let cursor=0;
    const concurrency=matchMedia('(max-width:700px)').matches||Number(navigator.deviceMemory||4)<=3?1:2;
    const worker=async()=>{while(cursor<items.length){const item=items[cursor++];await uploadItem(batch,item);}};
    await Promise.all(Array.from({length:Math.min(concurrency,items.length)},worker));
    try{await ensureGalleryThumbnail(batch);}catch(error){console.warn('Could not select a fallback gallery thumbnail',error);}
    batch.running=false;const summary=renderBatch(batch);
    if(!summary.failed)await batch.complete?.(batch);
    return summary;
  }

  async function retryFailed(batch){
    await processBatch(batch,batch.items.filter(item=>item.state==='failed'));
  }

  function newBatch({host,items,plantId,kind,complete,finish}){
    const batch={id:crypto.randomUUID(),host,items,plantId,kind,complete,finish,running:false};
    batches.set(batch.id,batch);mountBatch(batch);return batch;
  }

  async function finishCreatedPlant(batch,{partial=false}={}){
    const button=document.getElementById('createPlantBtn');
    resetAddPlantForm();button.disabled=false;
    const summary=report(batch),message=document.getElementById('addPlantMessage');
    message.textContent=partial?
      `Plant added with ${summary.complete} photo${summary.complete===1?'':'s'}; ${summary.failed} failed item${summary.failed===1?' was':'s were'} left unchanged.`:
      `Plant added with ${summary.complete} photo${summary.complete===1?'':'s'}.`;
    batch.host.hidden=true;createBatch=null;
    document.querySelector('[data-view="plants"]')?.click();
    await loadCloud();setTimeout(()=>openPlant(batch.plantId,'gallery'),100);
  }

  async function uploadNewPlantPhotosQueued(plantId,files,photoDate){
    const host=queueHost('v442AddUploadQueue',document.getElementById('addPlantMessage'));
    const items=buildItems({plantId,files,kind:'gallery',date:photoDate||isoToday(),startOrder:10});
    const batch=newBatch({
      host,items,plantId,kind:'gallery',
      complete:batch=>finishCreatedPlant(batch),
      finish:batch=>finishCreatedPlant(batch,{partial:true})
    });
    createBatch=batch;
    await processBatch(batch);
    return report(batch);
  }

  async function createNewPlantQueued(event){
    event?.preventDefault();if(!requireOwner())return;
    if(createBatch){document.getElementById('addPlantMessage').textContent='Finish or retry the current upload before creating another plant.';return;}
    const name=document.getElementById('newPlantName').value.trim();
    if(!name){document.getElementById('addPlantMessage').textContent='Plant name is required.';return;}
    let location=document.getElementById('newPlantLocation').value;
    if(location==='__new__'){
      location=document.getElementById('newPlantNewZone').value.trim();
      if(!location){document.getElementById('addPlantMessage').textContent='Enter a name for the new growing zone.';return;}
      if(!db.locations.some(item=>String(item.name).toLowerCase()===location.toLowerCase())){
        const zone=await sb.from('grow_zones').insert({name:location,details:'',sort_order:db.locations.length*10}).select('id').single();
        if(zone.error){document.getElementById('addPlantMessage').textContent=zone.error.message;return;}
      }
    }
    if(!location){document.getElementById('addPlantMessage').textContent='Choose a growing zone.';return;}
    const button=document.getElementById('createPlantBtn');button.disabled=true;
    document.getElementById('addPlantMessage').textContent='Creating plant…';
    try{
      let legacy=slugifyPlantName(name),suffix=0;
      while(db.plants.some(plant=>plant.legacyId===legacy)){suffix++;legacy=`${slugifyPlantName(name)}-${suffix+1}`;}
      const checkDays=parseInt(document.getElementById('newPlantCheckDays').value,10)||null;
      const payload={
        user_id:session.user.id,legacy_id:legacy,name,plant_group:document.getElementById('newPlantGroup').value||'Other',location,
        light:document.getElementById('newPlantLight').value.trim()||null,environment:document.getElementById('newPlantEnvironment').value.trim()||null,
        pot:document.getElementById('newPlantPot').value.trim()||null,pot_type:document.getElementById('newPlantPotType').value.trim()||null,
        outer_pot:document.getElementById('newPlantOuter').value.trim()||null,medium:document.getElementById('newPlantMedium').value.trim()||null,
        watering_mode:document.getElementById('newPlantMode').value.trim()||null,last_care:document.getElementById('newPlantLastCare').value||null,
        last_action:document.getElementById('newPlantLastAction').value.trim()||null,next_check:document.getElementById('newPlantNextCheck').value||null,
        check_days:checkDays,check_rule:document.getElementById('newPlantRule').value.trim()||null,notes:document.getElementById('newPlantNotes').value.trim()||null,
        confidence:document.getElementById('newPlantConfidence').value||null
      };
      const inserted=await sb.from('plants').insert(payload).select('*').single();if(inserted.error)throw inserted.error;
      const files=[...document.getElementById('newPlantPhotos').files];
      if(files.length){
        document.getElementById('addPlantMessage').textContent=`Plant created. Preparing ${files.length} photo${files.length===1?'':'s'}…`;
        const summary=await uploadNewPlantPhotosQueued(inserted.data.id,files,document.getElementById('newPlantPhotoDate').value||isoToday());
        if(summary.failed){button.disabled=true;document.getElementById('addPlantMessage').textContent=`Plant saved. ${summary.complete} photos complete; retry or keep the successful uploads.`;}
        return;
      }
      await loadCloud();resetAddPlantForm();button.disabled=false;document.getElementById('addPlantMessage').textContent='Plant added to the cloud collection.';
      document.querySelector('[data-view="plants"]')?.click();setTimeout(()=>openPlant(inserted.data.id,'gallery'),100);
    }catch(error){console.error(error);document.getElementById('addPlantMessage').textContent=error.message||String(error);button.disabled=false;}
  }

  async function completeExistingBatch(batch,{partial=false}={}){
    const summary=report(batch),message=document.getElementById('uploadMessage');
    message.textContent=partial?`${summary.complete} photos saved; ${summary.failed} failed item${summary.failed===1?' was':'s were'} left unchanged.`:`${summary.complete} photo${summary.complete===1?'':'s'} saved.`;
    await loadCloud();document.getElementById('photoDialog')?.close();openPlant(batch.plantId,batch.kind);
  }

  async function uploadPhotoQueued(){
    if(!requireOwner())return;
    const files=[...document.getElementById('photoFile').files],plantId=document.getElementById('photoPlantId').value,
      kind=document.getElementById('photoKind').value,date=document.getElementById('photoDate').value||isoToday(),
      note=document.getElementById('photoNote').value.trim(),message=document.getElementById('uploadMessage'),button=document.getElementById('uploadPhotoBtn');
    if(!files.length){message.textContent='Choose one or more photos first.';return;}
    const plant=db.plants.find(item=>String(item.cloudId)===String(plantId));
    const startOrder=kind==='gallery'&&plant?nextGalleryOrder(plant):0;
    const host=queueHost('v442PhotoUploadQueue',message);button.disabled=true;
    const batch=newBatch({
      host,items:buildItems({plantId,files,kind,date,note,startOrder}),plantId,kind,
      complete:item=>completeExistingBatch(item),
      finish:item=>completeExistingBatch(item,{partial:true})
    });
    message.textContent=`Preparing ${files.length} photo${files.length===1?'':'s'} with a bounded queue…`;
    await processBatch(batch);button.disabled=false;
    const summary=report(batch);if(summary.failed)message.textContent=`${summary.complete} complete. Retry ${summary.failed} failed item${summary.failed===1?'':'s'} or keep the successful uploads.`;
  }

  function install(){
    const photoInput=document.getElementById('photoFile');if(photoInput){photoInput.multiple=true;photoInput.closest('label')?.firstChild&&(photoInput.closest('label').firstChild.textContent='Photos');}
    const form=document.getElementById('addPlantForm');
    if(form&&typeof createNewPlant==='function'){
      form.removeEventListener('submit',createNewPlant);createNewPlant=createNewPlantQueued;form.addEventListener('submit',createNewPlantQueued);
    }
    uploadNewPlantPhotos=uploadNewPlantPhotosQueued;uploadNewPlantPhotos.v442UploadQueue=true;
    uploadPhoto=uploadPhotoQueued;uploadPhoto.v442UploadQueue=true;
    const uploadButton=document.getElementById('uploadPhotoBtn');if(uploadButton)uploadButton.onclick=uploadPhotoQueued;
  }

  install();
})();
