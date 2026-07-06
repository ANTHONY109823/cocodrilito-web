/** Script síncrono: evita que Next.js/Vercel reemplacen el favicon de agencia tras hidratación. */
export function buildTenantFaviconGuardScript(iconHref: string, type?: string): string {
  const href = JSON.stringify(iconHref)
  const mime = JSON.stringify(type ?? '')

  return `(function(){try{
var H=${href},T=${mime};
if(!H||H==='/favicon.svg')return;
function pin(){
  var ok=false;
  document.querySelectorAll('link[rel*="icon"],link[rel="shortcut icon"]').forEach(function(n){
    var u=n.getAttribute('href')||'';
    if(u===H||n.getAttribute('data-pinned-tenant-icon')){ok=true;return;}
    if(u.indexOf('/icon?')===0||u.indexOf('/favicon.ico')===0||u==='/icon'||u==='/brand/icon'||u.indexOf('/brand/icon')===0||u==='/favicon.svg'||u.indexOf('vercel')>-1){
      n.parentNode&&n.parentNode.removeChild(n);
    }
  });
  if(!ok){
    var l=document.createElement('link');
    l.rel='icon';l.href=H;l.setAttribute('data-pinned-tenant-icon','1');l.setAttribute('sizes','any');
    if(T)l.type=T;
    document.head.appendChild(l);
    var s=document.createElement('link');
    s.rel='shortcut icon';s.href=H;s.setAttribute('data-pinned-tenant-icon','1');
    if(T)s.type=T;
    document.head.appendChild(s);
  }
}
pin();
var _t;function _s(){clearTimeout(_t);_t=setTimeout(pin,16);}
new MutationObserver(_s).observe(document.head,{childList:true,subtree:true});
document.addEventListener('DOMContentLoaded',pin);
}catch(e){}})();`
}
