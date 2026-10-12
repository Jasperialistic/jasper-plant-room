(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.PlantCareRecovery=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  // The existing contract has two writes. Retain one intent ID until BOTH are
  // confirmed, so a timeout, reload or failed schedule update can be retried.
  function createWriter(options){
    const running=new Map(),attempts=new Map();
    return async function write(plant,action,details='',nextCheck=null){
      const owner=options.ownerId();
      if(!owner)throw new Error('Owner sign-in is required to log care.');
      if(!String(action||'').trim())throw new Error('Choose a care action.');
      if(nextCheck&&!/^\d{4}-\d{2}-\d{2}$/.test(nextCheck))throw new Error('Next check must be a date like 2026-10-12.');
      const canonical=await options.resolvePlant(plant),plantId=String(canonical?.cloudId||canonical?.id||'');
      if(!isUuid(plantId))throw new Error('This plant has no valid cloud identity. Nothing was saved.');
      const date=options.today(),key=JSON.stringify([owner,careFingerprint({plantId,date,action,details,nextCheck})]);
      const active=running.get(plantId);
      if(active){if(active.key===key)return active.promise;throw new Error('A care action is already saving for this plant. Please wait.');}
      const attempt=attempts.get(key)||options.readAttempt?.(key)||{id:options.makeId()};
      attempts.set(key,attempt);options.writeAttempt?.(key,attempt);
      let phase='log';
      const operation=(async()=>{
        options.status?.('Saving…');
        try{
          const payload={id:attempt.id,user_id:owner,plant_id:plantId,care_date:date,plant_name:canonical.name,action,details,location:canonical.location||null};
          let existing=await options.findLog(attempt.id,owner);
          if(!existing){
            try{await options.insertLog(payload);}catch(error){if(!isDuplicateError(error))throw error;}
            existing=await options.findLog(attempt.id,owner);
          }
          if(!existing||existing.plant_id!==plantId||existing.user_id!==owner||existing.care_date!==date||existing.action!==action||String(existing.details||'')!==String(details)){
            throw new Error('The care entry could not be verified.');
          }
          phase='schedule';
          const expected={last_care:date,last_action:action,next_check:nextCheck||null};
          const updated=await options.updatePlant(plantId,owner,expected);
          if(!updated||updated.id!==plantId||updated.last_care!==date||updated.last_action!==action||(updated.next_check||null)!==expected.next_check){
            throw new Error('The plant schedule update could not be verified.');
          }
          phase='complete';attempts.delete(key);options.removeAttempt?.(key);
          try{await options.refresh?.(canonical,existing,updated);}catch(error){options.status?.('Care saved · refresh unavailable',true);return {saved:true,refreshFailed:true};}
          options.status?.('Owner · cloud synced');return {saved:true};
        }catch(error){
          const message=phase==='schedule'?'Care entry saved; its schedule was not confirmed. Retry to finish safely.':'Care save was not confirmed. Retry safely.';
          options.status?.(message,true);
          throw new Error(`${message} ${error?.message||String(error)}`);
        }finally{running.delete(plantId);}
      })();
      running.set(plantId,{key,promise:operation});return operation;
    };
  }

  return {isUuid,legacyIdOf,canonicalFromList,careFingerprint,isDuplicateError,createWriter};
});
