/* A2C i18n.
   Home pages are static per language: / (es), /en/, /de/ (built by tools/build-i18n.py). On those pages
   (<html data-url-lang>) the URL's language always wins: nothing is swapped and no stored preference is applied;
   the switcher is plain links between the URLs (the current #section is carried over).
   Single-URL pages (privacy notice, 404) switch in place with [data-setlang] buttons. They start in the language
   of the path (/en/..., /de/... on the 404 page), else the language of the last home page visited, else Spanish. */
(function(){var K='a2c-lang',d=document,h=d.documentElement,L=['es','en','de'],urlLang=h.hasAttribute('data-url-lang');
function store(l){try{localStorage.setItem(K,l)}catch(e){}}
function apply(l){h.lang=l;
d.querySelectorAll('[data-es]').forEach(function(e){var v=e.getAttribute('data-'+l);if(v!==null)e.innerHTML=v});
d.querySelectorAll('[data-'+l+'-href]').forEach(function(e){e.href=e.getAttribute('data-'+l+'-href')});
d.querySelectorAll('[data-'+l+'-label]').forEach(function(e){e.setAttribute('aria-label',e.getAttribute('data-'+l+'-label'))});
d.querySelectorAll('[data-setlang]').forEach(function(b){var on=b.getAttribute('data-setlang')===l;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on?'true':'false')});
var t=d.querySelector('meta[name="title-'+l+'"]');if(t)d.title=t.content}
function start(){var l;
 if(urlLang){l=L.indexOf(h.lang)>=0?h.lang:'es';
  d.querySelectorAll('.langsw a[href]').forEach(function(a){a.addEventListener('click',function(){var u=a.getAttribute('href').split('#')[0];if(location.hash)a.setAttribute('href',u+location.hash)})});
 }else{
  d.querySelectorAll('[data-es]').forEach(function(e){if(!e.getAttribute('data-es'))e.setAttribute('data-es',e.innerHTML)});
  var m=h.hasAttribute('data-path-lang')&&location.pathname.match(/^\/(en|de)(\/|$)/),s=null;try{s=localStorage.getItem(K)}catch(e){}
  l=m?m[1]:(L.indexOf(s)>=0?s:'es');apply(l);
  d.querySelectorAll('[data-setlang]').forEach(function(b){b.addEventListener('click',function(){var x=b.getAttribute('data-setlang');store(x);apply(x);d.dispatchEvent(new CustomEvent('a2c:lang',{detail:x}))})});
 }
 store(l);d.dispatchEvent(new CustomEvent('a2c:lang',{detail:l}))}
d.addEventListener('DOMContentLoaded',start);})();
