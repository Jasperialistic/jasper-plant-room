(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.PlantCareRecovery=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  function isUuid(value){return UUID_RE.test(String(value||''));}

  function legacyIdOf(plant){
    const explicit=String(plant?.legacyId||'').trim();
    if(explicit)return explicit;
    const id=String(plant?.cloudId||plant?.id||'');
    return id.startsWith('base:')?id.slice(5):'';
  }

  function canonicalFromList(plant,plants){
    const candidates=Array.isArray(plants)?plants:[];
    const supplied=String(plant?.cloudId||plant?.id||'');
    if(isUuid(supplied)){
      return candidates.find(item=>String(item?.cloudId||item?.id||'')===supplied)||plant;
    }
    const legacy=legacyIdOf(plant);
    if(!legacy)return null;
    const matches=candidates.filter(item=>{
      const id=String(item?.cloudId||item?.id||'');
      return isUuid(id)&&String(item?.legacyId||'')===legacy;
    });
    if(matches.length>1)throw new Error(`More than one cloud plant matches ${legacy}. Nothing was saved.`);
    return matches[0]||null;
  }

  function careFingerprint({plantId,date,action,details='',nextCheck=null}){
    return JSON.stringify([String(plantId),String(date),String(action),String(details),nextCheck||null]);
  }

  function isDuplicateError(error){
    return String(error?.code||'')==='23505'||/duplicate key|already exists/i.test(String(error?.message||''));
  }

  return {isUuid,legacyIdOf,canonicalFromList,careFingerprint,isDuplicateError};
});
