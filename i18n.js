(function(){var K='a2c-lang',d=document;
function set(l){d.documentElement.lang=l;d.querySelectorAll('[data-es]').forEach(function(e){var v=e.getAttribute('data-'+l);if(v!==null)e.innerHTML=v});
d.querySelectorAll('[data-'+l+'-href]').forEach(function(e){e.href=e.getAttribute('data-'+l+'-href')});
var b=d.getElementById('lang');if(b){b.textContent=l==='es'?'EN':'ES';b.setAttribute('aria-label',l==='es'?'Switch to English':'Cambiar a español')}
var t=d.querySelector('meta[name="title-'+l+'"]');if(t)d.title=t.content;try{localStorage.setItem(K,l)}catch(e){}}
var s='es';try{s=localStorage.getItem(K)||'es'}catch(e){}
d.addEventListener('DOMContentLoaded',function(){d.querySelectorAll('[data-es]').forEach(function(e){e.setAttribute('data-es',e.innerHTML)});
var b=d.getElementById('lang');if(b)b.addEventListener('click',function(){set(d.documentElement.lang==='es'?'en':'es')});if(s!=='es')set(s);else set('es')});})();
