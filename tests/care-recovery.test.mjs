import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const require=createRequire(import.meta.url);
const care=require('../v52-care-recovery.js');
const [index,worker]=await Promise.all([
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  readFile(new URL('../service-worker.js',import.meta.url),'utf8'),
]);

const canonical={cloudId:'cc3c6a2e-238f-4f0d-9cb9-28d6fff5fcd8',legacyId:'spanish-moss-big',name:'Spanish Moss — Big'};

test('exact base spanish moss id resolves only to its canonical UUID record',()=>{
  const fallback={cloudId:'base:spanish-moss-big',legacyId:'spanish-moss-big',name:'Spanish Moss — Big'};
  assert.equal(care.canonicalFromList(fallback,[canonical]),canonical);
  assert.equal(care.isUuid(canonical.cloudId),true);
  assert.equal(care.isUuid(fallback.cloudId),false);
});

test('synthetic and unknown legacy records never become UUID write identities',()=>{
  assert.equal(care.canonicalFromList({cloudId:'base:legacy-only',legacyId:'legacy-only'},[canonical]),null);
  assert.equal(care.legacyIdOf({cloudId:'base:legacy-only'}),'legacy-only');
  assert.throws(()=>care.canonicalFromList(
    {cloudId:'base:spanish-moss-big',legacyId:'spanish-moss-big'},
    [canonical,{...canonical,cloudId:'5857a74b-73c4-4625-b743-1a9b77d5e808'}],
  ),/More than one cloud plant/);
});

test('retry fingerprints are stable and duplicate insert errors are recognized',()=>{
  const intent={plantId:canonical.cloudId,date:'2026-10-11',action:'Watered',details:'',nextCheck:'2026-10-14'};
  assert.equal(care.careFingerprint(intent),care.careFingerprint({...intent}));
  assert.equal(care.isDuplicateError({code:'23505'}),true);
  assert.equal(care.isDuplicateError({message:'duplicate key value'}),true);
  assert.equal(care.isDuplicateError({code:'22P02'}),false);
});

test('care recovery loads before boot and is precached in the bumped shell',()=>{
  const recovery=index.indexOf('v52-care-recovery.js?v=5.2.3');
  const boot=index.indexOf('<script>boot();</script>');
  assert.ok(recovery>0&&recovery<boot);
  assert.match(worker,/jasper-plant-room-shell-v5\.2\.3/);
  assert.match(worker,/v52-care-recovery\.js\?v=5\.2\.3/);
});

test('write boundary uses explicit idempotency id, UUID guard, timeouts and UI restoration',()=>{
  assert.match(index,/createWriter\(/);
  assert.match(index,/\.eq\('user_id',owner\)\.select\('id,last_care,last_action,next_check'\)\.single\(\)/);
  assert.match(index,/withCareTimeout/);
  assert.match(index,/buttons\.forEach\(item=>item\.disabled=true\)/);
  assert.match(index,/finally\{buttons\.forEach/);
  assert.match(index,/finally\{btn\.disabled=false;btn\.textContent=label;/);
});

function fakeWriter(overrides={},journal=new Map()){
  const logs=new Map(),calls={inserts:0,updates:0,status:[]};
  const options={
    ownerId:()=> 'owner-fixture',today:()=> '2026-10-12',makeId:()=> '1bbf8709-351b-4235-b2a7-f9ffaf162a74',
    resolvePlant:async p=>care.canonicalFromList(p,[canonical]),
    readAttempt:key=>journal.get(key),writeAttempt:(key,value)=>journal.set(key,value),removeAttempt:key=>journal.delete(key),
    findLog:async id=>logs.get(id)||null,
    insertLog:async row=>{calls.inserts++;logs.set(row.id,row);},
    updatePlant:async(id,owner,row)=>{calls.updates++;return {id,...row};},
    status:(text)=>calls.status.push(text),...overrides,
  };
  return {write:care.createWriter(options),options,logs,calls,journal};
}

test('base fixture care transaction writes and verifies the canonical UUID and NULL schedule',async()=>{
  const f=fakeWriter();
  assert.deepEqual(await f.write({cloudId:'base:spanish-moss-big'},'Reservoir topped up'),{saved:true});
  assert.equal([...f.logs.values()][0].plant_id,canonical.cloudId);
  assert.equal(f.calls.inserts,1);assert.equal(f.calls.updates,1);assert.equal(f.journal.size,0);
});

test('unresolved base plants and missing owner never issue writes',async()=>{
  const f=fakeWriter();
  await assert.rejects(f.write({cloudId:'base:unknown'},'Watered'),/no valid cloud identity/);
  const unauth=fakeWriter({ownerId:()=>null});
  await assert.rejects(unauth.write(canonical,'Watered'),/Owner sign-in/);
  assert.equal(f.calls.inserts+unauth.calls.inserts,0);
});

test('failed schedule retains intent and retry after reload creates no duplicate care row',async()=>{
  const f=fakeWriter({updatePlant:async()=>{throw new Error('connection lost');}});
  await assert.rejects(f.write(canonical,'Watered','','2026-10-14'),/Care entry saved; its schedule was not confirmed/);
  assert.equal(f.journal.size,1);
  const resumed=care.createWriter({...f.options,updatePlant:async(id,owner,row)=>({id,...row})});
  assert.deepEqual(await resumed(canonical,'Watered','','2026-10-14'),{saved:true});
  assert.equal(f.calls.inserts,1);assert.equal(f.logs.size,1);assert.equal(f.journal.size,0);
});

test('lost insert response is safely recovered using the same ID',async()=>{
  const f=fakeWriter();
  f.options.insertLog=async row=>{f.calls.inserts++;f.logs.set(row.id,row);throw new Error('request timed out');};
  const writer=care.createWriter(f.options);
  await assert.rejects(writer(canonical,'Checked — still moist','','2026-10-13'),/not confirmed/);
  assert.deepEqual(await writer(canonical,'Checked — still moist','','2026-10-13'),{saved:true});
  assert.equal(f.calls.inserts,1);assert.equal(f.logs.size,1);
});

test('zero-row or incorrect schedule cannot report success',async()=>{
  const f=fakeWriter({updatePlant:async()=>null});
  await assert.rejects(f.write(canonical,'Watered'),/schedule.*not confirmed/);
  assert.notEqual(f.calls.status.at(-1),'Owner · cloud synced');
});

test('concurrent duplicate taps share one transaction and conflicting actions are rejected',async()=>{
  let release;const wait=new Promise(resolve=>release=resolve);
  const f=fakeWriter({findLog:async id=>{await wait;return f.logs.get(id)||null;}});
  const a=f.write(canonical,'Watered'),b=f.write(canonical,'Watered');
  await new Promise(resolve=>setImmediate(resolve));
  await assert.rejects(f.write(canonical,'Checked — still moist'),/already saving/);
  release();await Promise.all([a,b]);assert.equal(f.calls.inserts,1);assert.equal(f.calls.updates,1);
});

test('refresh failure after verified writes reports saved with refresh warning',async()=>{
  const f=fakeWriter({refresh:async()=>{throw new Error('offline');}});
  assert.deepEqual(await f.write(canonical,'Other'),{saved:true,refreshFailed:true});
  assert.equal(f.calls.status.at(-1),'Care saved · refresh unavailable');
});

test('owner UI tolerates Noir removing legacy header nodes before boot',()=>{
  assert.match(index,/const setText=\(selector,text\)=>\{const node=\$\(selector\);if\(node\)node\.textContent=text;\}/);
  assert.doesNotMatch(index,/\$\('#brandSubtitle'\)\.textContent/);
  assert.doesNotMatch(index,/\$\('#heroEyebrow'\)\.textContent/);
});
