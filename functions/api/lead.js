// Cloudflare Pages Functions: POST /api/lead
// Configure WE_COM_WEBHOOK_URL as a Pages secret; never expose it in client JS.
const TYPES = new Set(['电商代运营','广告投放','短视频/直播/内容创作','客服外包','店铺搭建','外贸出海','其他合作']);
const json = (data, status = 200) => new Response(JSON.stringify(data), {status, headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const clean = (value, limit) => typeof value === 'string' ? value.trim().slice(0,limit).replace(/[<>]/g,'') : '';
export async function onRequestPost({request,env}) {
  if (!env.WE_COM_WEBHOOK_URL || !/^https:\/\/qyapi\.weixin\.qq\.com\/cgi-bin\/webhook\/send\?key=[\w-]+$/.test(env.WE_COM_WEBHOOK_URL)) {
    return json({ok:false,message:'消息接收渠道尚未启用，请拨打商务电话联系。'},503);
  }
  if (!request.headers.get('content-type')?.toLowerCase().includes('application/json')) return json({ok:false,message:'请求格式不正确'},415);
  if (Number(request.headers.get('content-length')||0)>4096) return json({ok:false,message:'填写内容过长'},413);
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return json({ok:false,message:'非法请求来源'},403);
  let body;
  try {body=await request.json();} catch {return json({ok:false,message:'请求内容无效'},400);}
  if (body.website) return json({ok:true,message:'已接收'}); // honeypot
  const name=clean(body.name,40), phone=clean(body.phone,20), service=clean(body.service,50), needs=clean(body.needs||'',600);
  if (!name || name.length>40 || !/^[0-9+()\-\s]{7,20}$/.test(phone) || !TYPES.has(service)) return json({ok:false,message:'请检查称呼、电话和咨询类型。'},400);
  // Avoid logging PII or webhook secret.
  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (env.LEAD_RATE_LIMIT) {
    try {
      const key = `lead:${ip}`;
      const {success}=await env.LEAD_RATE_LIMIT.limit({key});
      if (!success) return json({ok:false,message:'提交过于频繁，请稍后再试。'},429);
    }catch{} // Optional Cloudflare rate-limit binding; not required for deployment
  }
  const dt=new Date().toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false});
  const text=`【官网新客户咨询】\n时间：${dt}（北京时间）\n客户称呼：${name}\n联系电话：${phone}\n意向服务：${service}\n需求：${needs || '待沟通'}\n来源：脑洞发电企业官网`;
  try {
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),8000);
    let resp;
    try {resp=await fetch(env.WE_COM_WEBHOOK_URL,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({msgtype:'text',text:{content:text}}),signal:controller.signal});} finally {clearTimeout(timeout);}
    if(!resp.ok) return json({ok:false,message:'消息暂时无法送达，请拨打商务电话。'},502);
    const result=await resp.json();
    if(result.errcode!==0) return json({ok:false,message:'消息暂时无法送达，请拨打商务电话。'},502);
    return json({ok:true,message:'提交成功，商务人员将尽快与您联系。'});
  }catch{return json({ok:false,message:'网络繁忙，暂时无法提交，请电话联系。'},502);}
}
export function onRequestGet(){return json({ok:false,message:'请使用表单提交'},405)}
