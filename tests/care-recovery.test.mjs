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
  const recovery=index.indexOf('v52-care-recovery.js?v=5.2.1');
  const boot=index.indexOf('<script>boot();</script>');
  assert.ok(recovery>0&&recovery<boot);
  assert.match(worker,/jasper-plant-room-shell-v5\.2\.1/);
  assert.match(worker,/v52-care-recovery\.js\?v=5\.2\.1/);
});

test('write boundary uses explicit idempotency id, UUID guard, timeouts and UI restoration',()=>{
  assert.match(index,/id:attempt\.id/);
  assert.match(index,/isDuplicateError\(ins\.error\)/);
  assert.match(index,/isUuid\(plantId\)/);
  assert.match(index,/withCareTimeout/);
  assert.match(index,/buttons\.forEach\(item=>item\.disabled=true\)/);
  assert.match(index,/finally\{buttons\.forEach/);
  assert.match(index,/finally\{btn\.disabled=false;btn\.textContent=label;/);
});
