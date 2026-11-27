import { createClient } from 'npm:@supabase/supabase-js@2.112.3';
const allowed=new Set(['http://127.0.0.1:3100','http://localhost:3100','https://yeonho-youngeun.github.io']);
Deno.serve(async req=>{
 const origin=req.headers.get('origin')||'';
 const headers={'Access-Control-Allow-Origin':allowed.has(origin)?origin:'null','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};
 const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if(!allowed.has(origin))return reply({error:'허용되지 않은 요청입니다.'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
 try{
 if(req.method==='GET'){
 const {data,error}=await db.from('wedding_messages').select('id,name,message,gender,created_at').eq('visible',true).order('created_at',{ascending:false}).limit(200);
 if(error)throw error;return reply({entries:data.reverse()});
 }
 if(req.method!=='POST')return reply({error:'지원하지 않는 요청입니다.'},405);
 const raw=await req.text();if(raw.length>6000)return reply({error:'메시지가 너무 깁니다.'},413);
 const p=JSON.parse(raw);const name=typeof p.name==='string'?p.name.trim():'';const message=typeof p.message==='string'?p.message.trim():'';
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p.request_id)||name.length<1||name.length>30||message.length<1||message.length>500||!['male','female'].includes(p.gender))return reply({error:'이름은 30자, 메시지는 500자 이내로 입력해주세요.'},400);
 const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')+ip));
 const key=Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('');
 const {error}=await db.rpc('save_wedding_message',{p_request:p.request_id,p_name:name,p_message:message,p_gender:p.gender,p_key:key});
 if(error){if(error.message.includes('rate_limit'))return reply({error:'10초 후 다시 작성해주세요.'},429);throw error;}
 return reply({saved:true});
 }catch{return reply({error:'요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.'},503);}
});
