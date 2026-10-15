export const SEASONS = ['Spring','Summer','Autumn','Winter'];
export const WEEKDAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
export const CATEGORIES = {spells:12,crops:53,recipes:144,potions:9,blobs:100,fish:22,critters:95,vampsters:100};
export const CATEGORY_NAMES = {spells:'Spells',crops:'Crops',recipes:'Recipes',potions:'Potions',blobs:'Soul Blobs',fish:'Fish',critters:'Critters',vampsters:'Vampsters'};
export const uid = () => globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function ordinal(date) { return ((Number(date.year)-1)*112)+(SEASONS.indexOf(date.season)*28)+(Number(date.day)-1); }
export function fromOrdinal(n) { const dayNumber = Math.max(0,Math.floor(n)); return {year:Math.floor(dayNumber/112)+1,season:SEASONS[Math.floor(dayNumber%112/28)],day:(dayNumber%28)+1}; }
export function addDays(date,n) {return fromOrdinal(ordinal(date)+n);}
export const keyOf = date => `${date.year}|${date.season}|${date.day}`;
export const fromKey = key => {const [year,season,day]=String(key).split('|');return {year:Number(year),season,day:Number(day)};};
export const weekday = date => WEEKDAYS[(date.day-1)%7];
export const formatDate = date => `${weekday(date).slice(0,3)}, ${date.season} ${date.day} · Year ${date.year}`;
export const dateShort = date => `${date.season} ${date.day}, Y${date.year}`;
export const sameDate = (a,b)=>ordinal(a)===ordinal(b);
export const clampNum = (n,lo=0,hi=999999) => Math.max(lo,Math.min(hi,Number.isFinite(Number(n))?Number(n):lo));
export function freshPlaythrough(title='My Vampire',at={year:1,season:'Spring',day:1}) {return {
 id:uid(), title, current:{...at}, view:{...at}, createdAt:new Date().toISOString(), settings:{backupLastAt:null,onboarding:false,lastChangedAt:null,favorites:['plant','social']},
 diary:{}, activities:{}, crops:{}, plantings:{}, residents:{}, social:{}, businesses:{}, upgrades:{}, quests:{}, reminders:{}, collectionRecords:{}, sessions:{}, pendingGoals:[], coins:{},
};}
export function normalize(data) { const blank=freshPlaythrough(); const normalized={...blank,...data}; for(const k of ['diary','activities','crops','plantings','residents','social','businesses','upgrades','quests','reminders','collectionRecords','sessions','coins']) normalized[k]=data?.[k] && typeof data[k]==='object' && !Array.isArray(data[k]) ? data[k] : {}; normalized.settings={...blank.settings,...data?.settings}; normalized.pendingGoals=Array.isArray(data?.pendingGoals)?data.pendingGoals:[];return normalized;}
export function activity(data,{date=data.current,kind,label,refId=null,detail='',id=uid(),sessionId=null}) {const active=Object.values(data.sessions).find(s=>s.active);data.activities[id]={id,date:keyOf(date),at:new Date().toISOString(),kind,label,detail,refId,sessionId:sessionId??active?.id??null};return id;}
export const activitiesOn = (data,date) => Object.values(data.activities).filter(a=>a.date===keyOf(date)).sort((a,b)=>a.at.localeCompare(b.at));
export const getSession = data => Object.values(data.sessions).find(s=>s.active);
export const eventsForSession=(data,id)=>Object.values(data.activities).filter(a=>a.sessionId===id).sort((a,b)=>ordinal(fromKey(a.date))-ordinal(fromKey(b.date))||a.at.localeCompare(b.at));
export function canPlant(crop,date) {if(!crop?.seasons?.length||!Number.isFinite(+crop.grow)||+crop.grow<1) return false; const day=ordinal(date),growth=Math.floor(+crop.grow);for(let i=0;i<=growth;i++){const s=fromOrdinal(day+i).season;if(!crop.seasons.includes(s)) return false;}return true;}
export function maturity(crop,planting){return addDays(fromKey(planting.date),Number(crop.grow));}
export function plantingState(data,plant,date) {
 const crop=data.crops[plant.cropId];if(!crop)return null;const viewing=ordinal(date),start=ordinal(fromKey(plant.date));if(viewing<start)return null;
 const harvests=[...(plant.harvests||[])].sort((a,b)=>a-b);let due=start+Number(crop.grow),last=null;
 for(const h of harvests){if(h<=viewing){last=h;if(crop.regrow>0)due=h+Number(crop.regrow);else return {crop,plant,due:null,status:'harvested',last};} else break;}
 return {crop,plant,due,status:viewing>=due?'ready':'growing',last};
}
export function readyPlantings(data,date){return Object.values(data.plantings).map(p=>plantingState(data,p,date)).filter(s=>s?.status==='ready');}
export function collectionTotals(data){let counts=Object.fromEntries(Object.keys(CATEGORIES).map(k=>[k,0]));let named=Object.fromEntries(Object.keys(CATEGORIES).map(k=>[k,0]));for(const v of Object.values(data.collectionRecords)){if(v.category in counts){counts[v.category]+=Number(v.count||0);if(v.name)named[v.category]+=Number(v.count||0);}}return {counts,named,total:Object.values(counts).reduce((a,b)=>a+b,0),max:Object.values(CATEGORIES).reduce((a,b)=>a+b,0)};}
export function countDiscoveries(data,category,count,{date=data.current,baseline=false,name=''}={}) {const allowed=CATEGORIES[category]-collectionTotals(data).counts[category];const add=Math.min(Math.max(0,Math.floor(count)),allowed);if(!add)return 0;const id=uid();data.collectionRecords[id]={id,category,count:add,name,baseline,date:baseline?null:keyOf(date)};if(!baseline)activity(data,{date,kind:'discovery',label:name?`Discovered ${name}`:`Discovered ${add} ${CATEGORY_NAMES[category]}`,refId:id});return add;}
export function nameExistingDiscovery(data,category,name){const slot=Object.values(data.collectionRecords).find(v=>v.category===category&&!v.name&&v.count>0);if(!slot)return false;if(slot.count===1){slot.name=name;}else{slot.count-=1;const id=uid();data.collectionRecords[id]={...slot,id,name,count:1};}return true;}
export function isBusinessClosed(b,date){return (b.closedDays||[]).includes((date.day-1)%7)||(b.exceptions||[]).includes(keyOf(date));}
export function businessStatus(b,date){if(!b.scheduleKnown)return 'Hours unknown';return isBusinessClosed(b,date)?'Closed':'Scheduled open';}
export function nextBusinessDay(b,earliest){for(let i=0;i<112;i++){const date=fromOrdinal(earliest+i);if(!b?.scheduleKnown||!isBusinessClosed(b,date))return earliest+i;}return earliest;}
export function nextRepeat(origin,repeat,after){if(repeat==='none')return null;const step={daily:1,weekly:7,seasonal:28,yearly:112}[repeat];if(!step)return null;return origin+(Math.floor((after-origin)/step)+1)*step;}
export function carryReminders(data,from,to){for(const r of Object.values(data.reminders)){
 if(r.done||r.due>from)continue;
 if(!r.autoReschedule)continue;
 const b=r.businessId&&data.businesses[r.businessId];let next=nextBusinessDay(b,to);
 if(r.repeat!=='none'){const upcoming=nextRepeat(r.original,r.repeat,from);if(upcoming!==null&&upcoming<=next)next=nextBusinessDay(b,next);}
 if(next>r.due){r.moves=[...(r.moves||[]),{from:r.due,to:next}];r.due=next;}
 }}
export const remindersDue=(data,date)=>Object.values(data.reminders).filter(r=>!r.done&&r.due<=ordinal(date));
export const remindersTomorrow=(data,date)=>Object.values(data.reminders).filter(r=>!r.done&&r.due===ordinal(addDays(date,1)));
export function completeReminder(data,id,date){const r=data.reminders[id];if(!r)return;r.completions=[...(r.completions||[]),keyOf(date)];activity(data,{date,kind:'reminder',label:`Completed reminder: ${r.text}`,refId:id});if(r.repeat==='none'){r.done=true;return;}const next=nextRepeat(r.original,r.repeat,ordinal(date));r.due=nextBusinessDay(r.businessId&&data.businesses[r.businessId],next);}
export function seasonActivity(data,year,season){const start=ordinal({year,season,day:1});return Object.values(data.activities).filter(a=>{const n=ordinal(fromKey(a.date));return n>=start&&n<start+28;});}
export function yearActivity(data,year){return Object.values(data.activities).filter(a=>fromKey(a.date).year===year);}
export function tallyEvents(events){const groups={};for(const e of events)groups[e.kind]=(groups[e.kind]||0)+1;return groups;}
export function coinKey(year,season){return `${year}|${season}`;}
// Three-way merge: independent properties merge, divergent writes to one property conflict.
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
export function threeWayMerge(base,local,remote){const conflicts=[];const ABSENT=Symbol('absent');function merge(b,l,r,path){
 if(path[0]==='view')return l; // browsing history is a local UI preference, not a substantive collision
 if(path.join('.')==='settings.lastChangedAt'||path.join('.')==='settings.backupLastAt')return [l,r].filter(Boolean).sort().at(-1)||null;
 if(equal(l,r))return l;if(equal(l,b))return r;if(equal(r,b))return l;
 if(object(l)&&object(r)&&(object(b)||b===undefined)){
 const result={};const names=new Set([...Object.keys(b||{}),...Object.keys(l),...Object.keys(r)]);
 for(const name of names){const val=merge(b?.[name],l[name],r[name],[...path,name]);if(val!==ABSENT)result[name]=val;}return result;
 }
 conflicts.push({path:path.join('.'),base:b,local:l,remote:r});return l===undefined?ABSENT:l;
 }return {merged:merge(base,local,remote,[]),conflicts};}
export function applyConflictChoices(merged,conflicts,choices){const result=structuredClone(merged);for(const c of conflicts){const path=c.path.split('.');let node=result;for(const p of path.slice(0,-1)){if(!(p in node))node[p]={};node=node[p];}const val=choices[c.path]==='cloud'?c.remote:c.local;if(val===undefined)delete node[path.at(-1)];else node[path.at(-1)]=val;}return result;}
