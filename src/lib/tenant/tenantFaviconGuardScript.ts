/** Script síncrono: asegura favicon de agencia sin tocar nodos de React/Next. */
export function buildTenantFaviconGuardScript(iconHref: string, type?: string): string {
  const href = JSON.stringify(iconHref)
  const mime = JSON.stringify(type ?? '')

  // Solo añade nuestros <link> si faltan. No usa removeChild ni MutationObserver:
  // modificar el <head> concurrente con React provoca removeChild null y rompe clicks.
  return `(function(){try{
var H=${href},T=${mime};
if(!H||H==='/favicon.svg')return;
function ensure(){
  if(document.querySelector('link[data-pinned-tenant-icon="1"]'))return;
  var l=document.createElement('link');
  l.rel='icon';l.href=H;l.setAttribute('data-pinned-tenant-icon','1');l.setAttribute('sizes','any');
  if(T)l.type=T;
  document.head.appendChild(l);
  var s=document.createElement('link');
  s.rel='shortcut icon';s.href=H;s.setAttribute('data-pinned-tenant-icon','1');
  if(T)s.type=T;
  document.head.appendChild(s);
}
ensure();
document.addEventListener('DOMContentLoaded',ensure);
}catch(e){}})();`
}
