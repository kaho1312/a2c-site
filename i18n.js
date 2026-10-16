(function(){var K='a2c-lang',d=document,L=['es','en','de'];
function set(l){if(L.indexOf(l)<0)l='es';d.documentElement.lang=l;
d.querySelectorAll('[data-es]').forEach(function(e){var v=e.getAttribute('data-'+l);if(v!==null)e.innerHTML=v});
d.querySelectorAll('[data-'+l+'-href]').forEach(function(e){e.href=e.getAttribute('data-'+l+'-href')});
d.querySelectorAll('[data-'+l+'-label]').forEach(function(e){e.setAttribute('aria-label',e.getAttribute('data-'+l+'-label'))});
d.querySelectorAll('[data-setlang]').forEach(function(b){var on=b.getAttribute('data-setlang')===l;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on?'true':'false')});
var t=d.querySelector('meta[name="title-'+l+'"]');if(t)d.title=t.content;try{localStorage.setItem(K,l)}catch(e){}d.dispatchEvent(new CustomEvent('a2c:lang',{detail:l}))}
var s=null;try{s=localStorage.getItem(K)}catch(e){}
if(!s){var n=((navigator.languages&&navigator.languages[0])||navigator.language||'es').toLowerCase().slice(0,2);s=L.indexOf(n)>=0?n:'es'}
d.addEventListener('DOMContentLoaded',function(){d.querySelectorAll('[data-es]').forEach(function(e){e.setAttribute('data-es',e.innerHTML)});
d.querySelectorAll('[data-setlang]').forEach(function(b){b.addEventListener('click',function(){set(b.getAttribute('data-setlang'))})});set(s)});})();
