import test from 'node:test';import assert from 'node:assert/strict';
import {freshPlaythrough,collectionTotals,activitiesOn,readyPlantings,keyOf} from '../src/domain.js';
const root={innerHTML:'',addEventListener(){}};
globalThis.__GRIMOIRE_TEST__=true;
globalThis.document={querySelector(q){return q==='#app'?root:null;}};
globalThis.localStorage={getItem(){return null;},setItem(){},removeItem(){}};
globalThis.window={addEventListener(){},scrollTo(){}};
Object.defineProperty(globalThis,'navigator',{value:{onLine:false},configurable:true});
const records=new Map();
globalThis.indexedDB={open(){const r={};setTimeout(()=>{r.result={transaction(){const tx={objectStore(){return {put(value,key){records.set(key,value);setTimeout(()=>tx.oncomplete?.(),0);},get(key){const q={};setTimeout(()=>{q.result=records.get(key);q.onsuccess?.();},0);return q;}};}};return tx;},close(){}};r.onsuccess?.();},0);return r;}};
class MockData{constructor(form){this.items=form.items;}get(k){return this.items[k]?.[0]??null;}getAll(k){return this.items[k]??[];}has(k){return k in this.items;}}
globalThis.FormData=MockData;
const {state,handleForm,handleAction}=await import('../src/app.js');
const form=(type,values)=>({dataset:{form:type},items:Object.fromEntries(Object.entries(values).map(([k,v])=>[k,Array.isArray(v)?v:[String(v)]]))});
const d=freshPlaythrough('Integration Test');state.rows=[{data:d,base:null,version:null,dirty:false}];state.selectedId=d.id;state.page='garden';
test('crop discovery creates a single collection count and dated chronicle event',async()=>{
 state.modal={type:'crop'};
 await handleForm(form('crop',{name:'Blood Grapes',grow:'5',regrow:'4',seasons:['Spring']}));
 assert.equal(Object.keys(state.rows[0].data.crops).length,1);
 assert.equal(collectionTotals(state.rows[0].data).counts.crops,1);
 assert.match(activitiesOn(state.rows[0].data,d.current).map(x=>x.label).join('|'),/Discovered Blood Grapes/);
});
test('planting produces due alert on day 6, and confirming harvest schedules regrowth on day 10',async()=>{
 const cropId=Object.keys(state.rows[0].data.crops)[0];
 state.modal={type:'plant'};
 await handleForm(form('plant',{fyear:'1',fseason:'Spring',fday:'1',cropId,quantity:'1'}));
 let latest=state.rows[0].data;
 const plantedId=Object.keys(latest.plantings)[0];
 assert.equal(readyPlantings(latest,{year:1,season:'Spring',day:5}).length,0);
 assert.equal(readyPlantings(latest,{year:1,season:'Spring',day:6}).length,1);
 await handleAction('harvest:'+plantedId);
 await handleAction('confirmMajor');
 latest=state.rows[0].data;
 assert.equal(latest.plantings[plantedId].harvests.length,0); // Day 1 harvest was not permitted.
 // Test actual due-date context.
 latest.current={year:1,season:'Spring',day:6};latest.view={year:1,season:'Spring',day:6};state.page='journal';
 await handleAction('harvest:'+plantedId);
 await handleAction('confirmMajor');
 latest=state.rows[0].data;
 assert.equal(latest.plantings[plantedId].harvests.length,1);
 assert.equal(readyPlantings(latest,{year:1,season:'Spring',day:9}).length,0);
 assert.equal(readyPlantings(latest,{year:1,season:'Spring',day:10}).length,1);
});
test('count-only discovery adds a dated event',async()=>{
 state.modal={type:'discovery'};
 await handleForm(form('discovery',{fyear:'1',fseason:'Spring',fday:'3',category:'fish',count:'3',name:''}));
 const latest=state.rows[0].data;
 assert.equal(collectionTotals(latest).counts.fish,3);
 assert.match(activitiesOn(latest,{year:1,season:'Spring',day:3}).map(x=>x.label).join('|'),/Discovered 3 Fish/);
});
