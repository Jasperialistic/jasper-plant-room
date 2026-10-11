/* Jasper's Plant Room v5.0.0 — single-pass media preparation.
   Replaces the two-pass upload pair (optimizeUpload + makeThumbnail) with one
   decode and two encodes per photo. Cuts image CPU work per growth-photo upload
   roughly in half on the same hardware, which is the dominant heat source during
   multi-photo batches on phones. Originals are preserved byte-for-byte when no
   resize is needed or when re-encoding would not shrink the file. */
(function v50MediaEfficiency(){
  'use strict';

  const BUCKET='plant-media';
  const MAX_EDGE=2200;
  const JPEG_QUALITY=.84;
  const THUMB_EDGE=640;
  const THUMB_QUALITY=.72;
  const OPTIMIZE_MIN_BYTES=500000;

  const previousPair=typeof window.plantUploadPair==='function'?window.plantUploadPair:null;

  function decodeOnce(file){
    if(typeof createImageBitmap==='function'){
      return createImageBitmap(file,{imageOrientation:'from-image'})
        .then(bitmap=>({image:bitmap,isBitmap:true}))
        .catch(()=>decodeViaElement(file));
    }
    return decodeViaElement(file);
  }

  function decodeViaElement(file){
    return new Promise((resolve,reject)=>{
      const url=URL.createObjectURL(file),image=new Image();
      image.onload=()=>{URL.revokeObjectURL(url);resolve({image,isBitmap:false});};
      image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Image could not be decoded.'));};
      image.src=url;
    });
  }

  function releaseDecoder({image,isBitmap}){
    try{
      if(isBitmap&&typeof image?.close==='function')image.close();
      else if(image)image.src='';
    }catch(error){console.debug('Decoder release skipped',error);}
  }

  function drawScaled(source,width,height,maxEdge,quality){
    const scale=Math.min(1,maxEdge/Math.max(width,height));
    const targetWidth=Math.max(1,Math.round(width*scale)),targetHeight=Math.max(1,Math.round(height*scale));
    const canvas=document.createElement('canvas');canvas.width=targetWidth;canvas.height=targetHeight;
    const context=canvas.getContext('2d',{alpha:false});
    if(!context)throw new Error('This browser cannot prepare photos.');
    context.fillStyle='#08100d';context.fillRect(0,0,targetWidth,targetHeight);
    context.drawImage(source,0,0,targetWidth,targetHeight);
    return new Promise(resolve=>canvas.toBlob(blob=>{
      canvas.width=1;canvas.height=1;resolve(blob);
    },'image/jpeg',quality));
  }

  /* One decode; up to two encodes (resized original + 640px thumbnail). */
  async function preparePair(file){
    if(!(file instanceof Blob)||!String(file.type||'').startsWith('image/')||!file.size){
      return {prepared:file,thumb:null};
    }
    let decoder;
    try{decoder=await decodeOnce(file);}catch(error){
      console.warn('Photo decode failed; uploading untouched',error);
      return {prepared:file,thumb:null};
    }
    try{
      const width=decoder.image.naturalWidth||decoder.image.width;
      const height=decoder.image.naturalHeight||decoder.image.height;
      if(!width||!height)return {prepared:file,thumb:null};
      const thumb=await drawScaled(decoder.image,width,height,THUMB_EDGE,THUMB_QUALITY);
      if(!thumb)throw new Error('The thumbnail could not be encoded.');
      const needsResize=file.size>OPTIMIZE_MIN_BYTES&&Math.max(width,height)>MAX_EDGE;
      let prepared=file;
      if(needsResize){
        const resized=await drawScaled(decoder.image,width,height,MAX_EDGE,JPEG_QUALITY);
        if(resized&&resized.size<file.size){
          const originalName=String(file.name||'plant-photo').replace(/\.[^.]+$/,'');
          prepared=new File([resized],`${originalName}.jpg`,{type:'image/jpeg',lastModified:Date.now()});
        }
      }
      return {prepared,thumb};
    }finally{
      releaseDecoder(decoder);
    }
  }

  /* Same contract as v47's uploadPair: uploads original + 640px thumbnail and
     returns the thumbnail storage path. Storage "already exists" is retry-safe. */
  async function uploadPair(path,file){
    const {prepared,thumb}=await preparePair(file);
    if(!thumb){
      if(previousPair)return previousPair(path,file);
      throw new Error('The photo could not be prepared for upload.');
    }
    const tPath=path.replace(/\/(?:gallery|growth)\//i,'/thumbs/').replace(/\.[^/.]+$/,'')+'.thumb.jpg';
    const original=await sb.storage.from(BUCKET).upload(path,prepared,{
      contentType:prepared?.type||file.type,cacheControl:'31536000',upsert:false,plantPrepared:true
    });
    if(original.error&&!/already exists|duplicate/i.test(original.error.message||''))throw original.error;
    const thumbUpload=await sb.storage.from(BUCKET).upload(tPath,thumb,{
      contentType:'image/jpeg',cacheControl:'31536000',upsert:false
    });
    if(thumbUpload.error&&!/already exists|duplicate/i.test(thumbUpload.error.message||''))throw thumbUpload.error;
    return tPath;
  }

  window.plantUploadPair=uploadPair;
  window.v50PreparePair=preparePair;
  window.v50MediaEfficiency=true;
})();
