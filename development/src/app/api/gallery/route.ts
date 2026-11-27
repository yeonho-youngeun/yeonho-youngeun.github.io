import { readdir } from 'node:fs/promises';
import path from 'node:path';
export async function GET(){
 const files=(await readdir(path.join(process.cwd(),'public/invitation/assets/gallery'))).filter(file=>/\.(jpe?g|png|webp|avif|gif)$/i.test(file)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
 const html=files.map((file,index)=>{const src='assets/gallery/'+encodeURIComponent(file);return `<div class="notion-gallery-card" data-src="${src}" data-caption="${index+1}"><img src="${src}" alt="웨딩 사진 ${index+1}" loading="lazy"></div>`;}).join('')||'<p class="small-note">갤러리 사진을 준비 중입니다.</p>';
 return new Response('document.write('+JSON.stringify(html).replace(/</g,'\\u003c')+');',{headers:{'Content-Type':'application/javascript','Cache-Control':'no-store'}});
}
