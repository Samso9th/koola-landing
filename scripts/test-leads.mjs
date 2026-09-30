import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.ts';
const origin='https://koola.store';
const env={API_ORIGIN:'https://api.koola.store'};
const lead={name:'Amina Musa',email:'amina@example.test',phone:'08031234567',city:'Kano',role:'customer',consent:true,website:''};
function request(body=lead,headers={}){return new Request(origin+'/api/leads',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,...headers},body:JSON.stringify(body)});}
test('landing Worker sends valid leads to the core API without D1',async()=>{const original=globalThis.fetch;let seen;globalThis.fetch=async(url,options)=>{seen={url,body:JSON.parse(options.body)};return Response.json({ok:true,data:{accepted:true}})};try{const response=await worker.fetch(request(),env);assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true});assert.equal(seen.url,'https://api.koola.store/api/v1/leads');assert.deepEqual(seen.body,{name:'Amina Musa',email:'amina@example.test',phone:'+2348031234567',city:'Kano',role:'customer',consent:true});}finally{globalThis.fetch=original}});
test('bad input never reaches the API',async()=>{const original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;return Response.json({ok:true})};try{assert.equal((await worker.fetch(request({...lead,consent:false}),env)).status,400);assert.equal((await worker.fetch(request(lead,{Origin:'https://other.test'}),env)).status,403);assert.equal(calls,0);}finally{globalThis.fetch=original}});
test('API outage is a visible failure, not a false signup',async()=>{const original=globalThis.fetch;globalThis.fetch=async()=>new Response('unavailable',{status:503});try{const response=await worker.fetch(request(),env);assert.equal(response.status,503);assert.equal((await response.json()).error,'service_unavailable');}finally{globalThis.fetch=original}});
