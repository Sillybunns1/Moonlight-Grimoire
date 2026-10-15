import {normalize,threeWayMerge,applyConflictChoices} from './domain.js';
const config=globalThis.GRIMOIRE_CONFIG||{};
export const configured=Boolean(config.supabaseUrl?.startsWith('https://')&&config.supabasePublishableKey);
const root=String(config.supabaseUrl||'').replace(/\/$/,'');
const key=config.supabasePublishableKey||'';
const tokenName='moonlight-auth-v1';
let auth=(()=>{try{return JSON.parse(localStorage.getItem(tokenName)||'null');}catch{return null;}})();
function setAuth(value){auth=value;if(value)localStorage.setItem(tokenName,JSON.stringify(value));else localStorage.removeItem(tokenName);}
async function request(path,body,options={}){
  if(!configured)throw new Error('Cloud is not configured. See README.md.');
  const headers={'apikey':key,...(body!==undefined?{'Content-Type':'application/json'}:{}),...options.headers};
  if(options.auth!==false){if(auth?.refresh_token && (auth.expires_at||0)*1000<Date.now()+60000 && !options.noRefresh)await refresh();if(auth?.access_token)headers.Authorization=`Bearer ${auth.access_token}`;}
  const response=await fetch(root+path,{method:options.method|| (body===undefined?'GET':'POST'),headers,body:body===undefined?undefined:JSON.stringify(body)});
  const raw=await response.text();let data;try{data=raw?JSON.parse(raw):null;}catch{data=raw;}
  if(!response.ok)throw new Error(data?.msg||data?.error_description||data?.message||data?.error||`Cloud request failed: HTTP ${response.status}`);
  return data;
}
export function session(){return auth;}
export async function refresh(){if(!auth?.refresh_token)return null;const data=await request('/auth/v1/token?grant_type=refresh_token',{refresh_token:auth.refresh_token},{auth:false});setAuth({...data,expires_at:Math.floor(Date.now()/1000)+data.expires_in});return auth;}
export async function validSession(){if(!auth)return null;if(typeof navigator!=='undefined'&&!navigator.onLine)return auth.user||null;try{if((auth.expires_at||0)*1000 < Date.now()+60000)await refresh();const user=await request('/auth/v1/user',undefined,{noRefresh:true});if(user){auth.user=user;setAuth(auth);}return user;}catch(error){if(/401|403|invalid.*token|refresh.*not found|expired.*token/i.test(error.message||'')){setAuth(null);return null;}return auth.user||null;}}
export async function signIn(email,password){const data=await request('/auth/v1/token?grant_type=password',{email,password},{auth:false});setAuth({...data,expires_at:Math.floor(Date.now()/1000)+data.expires_in});return data.user;}
export async function signUp(email,password){const redirect=encodeURIComponent(location.href.split('#')[0]);return request(`/auth/v1/signup?redirect_to=${redirect}`,{email,password},{auth:false});}
export async function requestPasswordReset(email){const redirect=encodeURIComponent(location.href.split('#')[0]);return request(`/auth/v1/recover?redirect_to=${redirect}`,{email},{auth:false});}
export async function completePasswordReset(password){return request('/auth/v1/user',{password},{method:'PUT'});}
export function acceptRecoveryTokens(){const params=new URLSearchParams(location.hash.replace(/^#/,''));if(params.get('type')==='recovery' && params.get('access_token')){setAuth({access_token:params.get('access_token'),refresh_token:params.get('refresh_token'),expires_at:Math.floor(Date.now()/1000)+Number(params.get('expires_in')||3600)});history.replaceState({},'',location.pathname+location.search);return true;}return false;}
export async function signOut(){try{if(auth?.access_token)await request('/auth/v1/logout',{},{});}catch{}setAuth(null);}
export async function listRemote(){return request('/rest/v1/playthroughs?select=id,payload,version,updated_at&order=updated_at.desc',undefined,{headers:{Accept:'application/json'}});}
export async function createRemote(userId,row){const records=await request('/rest/v1/playthroughs',{id:row.data.id,owner:userId,payload:row.data},{headers:{Prefer:'return=representation'}});return Array.isArray(records)?records[0]:records;}
export async function saveRemote(row,version,payload){return request('/rest/v1/rpc/save_playthrough',{p_id:row.data.id,p_expected_version:version,p_payload:payload});}
export async function deleteRemote(id){return request(`/rest/v1/playthroughs?id=eq.${encodeURIComponent(id)}`,undefined,{method:'DELETE'});}
const dbName='moonlight-grimoire-offline-v1';
async function open(){return new Promise((resolve,reject)=>{const req=indexedDB.open(dbName,1);req.onupgradeneeded=()=>req.result.createObjectStore('saves');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
export async function getCache(user){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('saves','readonly');const q=tx.objectStore('saves').get(user);q.onsuccess=()=>{resolve(q.result||[]);db.close();};q.onerror=()=>{reject(q.error);db.close();};});}
export async function putCache(user,rows){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('saves','readwrite');tx.objectStore('saves').put(rows,user);tx.oncomplete=()=>{resolve();db.close();};tx.onerror=()=>{reject(tx.error);db.close();};});}
export function localRow(data){return {data:normalize(data),base:null,version:null,dirty:true};}
export function remoteRow(remote){return {data:normalize(remote.payload),base:structuredClone(remote.payload),version:remote.version,dirty:false};}
export function mergeForSync(row,remote){if(!row.dirty)return {merged:remote.payload,conflicts:[]};if(row.version===null)return {merged:row.data,conflicts:[]};if(row.version===remote.version)return {merged:row.data,conflicts:[]};return threeWayMerge(row.base||{},row.data,remote.payload);}
export {applyConflictChoices};
