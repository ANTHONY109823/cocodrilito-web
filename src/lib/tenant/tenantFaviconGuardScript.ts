/** Script síncrono: evita que Next.js/Vercel reemplacen el favicon de agencia tras hidratación. */
export function buildTenantFaviconGuardScript(iconHref: string, type?: string): string {
  const href = JSON.stringify(iconHref)
  const mime = JSON.stringify(type ?? '')

  // Evita removeChild en nodos que React/Next aún gestionan: eso dispara
  // "Cannot read properties of null (reading 'removeChild')" y congela la UI.
  return `(function(){try{
var H=${href},T=${mime};
if(!H||H==='/favicon.svg')return;
var busy=false,obs=null;
function isOurs(n){
  return !!n.getAttribute('data-pinned-tenant-icon')||(n.getAttribute('href')||'')===H;
}
function isPlatform(u){
  return u.indexOf('/icon?')===0||u.indexOf('/favicon.ico')===0||u==='/icon'||u==='/brand/icon'||u.indexOf('/brand/icon')===0||u==='/favicon.svg'||u.indexOf('vercel')>-1;
}
function ensurePinned(){
  if(busy)return;
  busy=true;
  try{
    if(obs)obs.disconnect();
    var list=document.querySelectorAll('link[rel*="icon"],link[rel="shortcut icon"],link[rel="apple-touch-icon"]');
    var has=false;
    for(var i=0;i<list.length;i++){
      var n=list[i];
      if(isOurs(n)){has=true;continue;}
      var u=n.getAttribute('href')||'';
      if(!isPlatform(u))continue;
      try{
        n.setAttribute('href',H);
        n.setAttribute('data-pinned-tenant-icon','1');
        if(T)n.setAttribute('type',T);
        has=true;
      }catch(_e){}
    }
    if(!has){
      var l=document.createElement('link');
      l.rel='icon';l.href=H;l.setAttribute('data-pinned-tenant-icon','1');l.setAttribute('sizes','any');
      if(T)l.type=T;
      document.head.appendChild(l);
      var s=document.createElement('link');
      s.rel='shortcut icon';s.href=H;s.setAttribute('data-pinned-tenant-icon','1');
      if(T)s.type=T;
      document.head.appendChild(s);
    }
  }catch(_e){}
  finally{
    busy=false;
    if(obs)obs.observe(document.head,{childList:true,subtree:true});
  }
}
ensurePinned();
var _t;
function _s(){if(busy)return;clearTimeout(_t);_t=setTimeout(ensurePinned,50);}
obs=new MutationObserver(_s);
obs.observe(document.head,{childList:true,subtree:true});
document.addEventListener('DOMContentLoaded',ensurePinned);
}catch(e){}})();`
}
