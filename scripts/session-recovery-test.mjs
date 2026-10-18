import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';
const compiled=ts.transpileModule(await readFile('src/lib/session-client.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const saved=JSON.stringify({id:'ses_test',token:'synthetic-capability'});
async function scenario(responses,initial=saved){
 const storage=new Map(initial===null?[]:[['zdrop-session',initial]]);let calls=0;
 const mod={exports:{}};
 vm.runInNewContext(compiled,{module:mod,exports:mod.exports,require:()=>({}),AbortController,sessionStorage:{getItem:key=>storage.get(key)||null,removeItem:key=>storage.delete(key)},
  setTimeout:(fn,ms)=>setTimeout(fn,ms===30000?ms:0),clearTimeout,
  fetch:async()=>{const next=responses[Math.min(calls++,responses.length-1)];if(next instanceof Error)throw next;return {ok:next.status===200,status:next.status,statusText:'Synthetic',text:async()=>JSON.stringify(next.body||{error:'Synthetic temporary error'})};}
 });
 try{return {result:await mod.exports.restoreSession(),storage,calls};}catch(error){return {error,storage,calls};}
}
const busy=await scenario([{status:409},{status:200,body:{session:{id:'ses_test',status:'ACTIVE'}}}]);
assert.equal(busy.result.status,'ACTIVE');assert.equal(busy.calls,2);assert.equal(busy.storage.get('zdrop-session'),saved);
const offline=await scenario([new Error('offline')]);assert.ok(offline.error);assert.equal(offline.calls,4);assert.equal(offline.storage.get('zdrop-session'),saved);
for(const status of [403,404,410]){const result=await scenario([{status}]);assert.equal(result.result,null);assert.equal(result.storage.size,0);}
const deleted=await scenario([{status:200,body:{session:{status:'DELETED'}}}]);assert.equal(deleted.storage.size,0);
const invalid=await scenario([],'{bad');assert.equal(invalid.storage.size,0);assert.equal(invalid.calls,0);
console.log('PASS: session recovery retries lock contention, preserves capabilities while offline, and clears invalid/terminal access.');
