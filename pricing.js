// Package prices in MXN / USD / EUR + currency switcher. Default currency follows the language (ES: MXN, EN: USD, DE: EUR)
// until the visitor picks one. USD/EUR converted from MXN with ECB reference rates of 2026-10-16
// (1 EUR = 1.1253 USD = 20.6871 MXN) and rounded to marketing prices.
(function(){var d=document,K='a2c-cur',lang='es',cur=null,picked=null;
try{picked=localStorage.getItem(K)}catch(e){}
var P={esencial:{MXN:[2900,7900],USD:[159,430],EUR:[139,380]},reservas:{MXN:[4900,14900],USD:[269,810],EUR:[239,720]},recepcionista:{MXN:[7500,19900],USD:[409,1080],EUR:[359,960]}},
MIN={MXN:6,USD:0.35,EUR:0.30},META={MXN:700,USD:40,EUR:35},DIAG={MXN:2500,USD:139,EUR:119},DEF={es:'MXN',en:'USD',de:'EUR'},LOC={es:'es-MX',en:'en-US',de:'de-DE'},
T={es:{mo:'/mes',setup:'de setup único',taxM:'+ IVA',taxO:'+ impuestos aplicables',min:'Minuto extra: aprox. {p}',
meta:'<strong>Tarifas de Meta:</strong> las tarifas de mensajes de WhatsApp que cobra Meta se facturan al costo (aprox. {p}/mes para un negocio típico; dependen del volumen).',
diag:'<strong>La primera llamada es gratis.</strong> ¿Quieres ir más a fondo? El diagnóstico detallado con reporte escrito cuesta {p} {tax}.',
from:'Desde {p}/mes {tax}',recep:'Recepcionista 24/7: {p}/mes {tax}',sw:'Moneda'},
en:{mo:'/month',setup:'one-time setup',taxM:'+ IVA',taxO:'plus applicable taxes',min:'Extra minutes: approx. {p}/min',
meta:'<strong>Meta fees:</strong> WhatsApp message fees charged by Meta are billed to you at cost (approx. {p}/month for a typical business; depends on volume).',
diag:'<strong>Your first call is free.</strong> Want to go deeper? Our in-depth diagnosis with a written report costs {p} {tax}.',
from:'From {p}/month {tax}',recep:'Recepcionista 24/7: {p}/month {tax}',sw:'Currency'},
de:{mo:'/Monat',setup:'einmalige Einrichtung',taxM:'zzgl. IVA',taxO:'zzgl. MwSt./Steuern',min:'Zusatzminute: ca. {p}',
meta:'<strong>Meta-Gebühren:</strong> Die WhatsApp-Nachrichtengebühren von Meta werden Ihnen zum Selbstkostenpreis weiterberechnet (ca. {p}/Monat bei einem typischen Unternehmen; abhängig vom Volumen).',
diag:'<strong>Das Erstgespräch ist kostenlos.</strong> Sie möchten tiefer einsteigen? Unsere ausführliche Diagnose mit schriftlichem Bericht kostet {p} {tax}.',
from:'Ab {p}/Monat {tax}',recep:'Recepcionista 24/7: {p}/Monat {tax}',sw:'Währung'}};
function num(v){return new Intl.NumberFormat(LOC[lang],{minimumFractionDigits:v%1?2:0,maximumFractionDigits:2}).format(v)}
function money(c,v){return lang==='de'&&c==='EUR'?num(v)+' €':c+' '+num(v)}
function tax(){return cur==='MXN'?T[lang].taxM:T[lang].taxO}
function render(){var t=T[lang];
d.querySelectorAll('[data-price]').forEach(function(e){var k=e.getAttribute('data-price'),pk=e.getAttribute('data-pkg'),h='';
if(k==='monthly')h='<span class="cur">'+cur+'</span> '+num(P[pk][cur][0])+'<small>'+t.mo+'</small><span class="tax">'+tax()+'</span>';
else if(k==='setup')h='+ '+money(cur,P[pk][cur][1])+' '+t.setup+' '+tax();
else if(k==='minute')h=t.min.replace('{p}',money(cur,MIN[cur]));
else if(k==='meta')h=t.meta.replace('{p}',money(cur,META[cur]));
else if(k==='diag')h=t.diag.replace('{p}',money(cur,DIAG[cur])).replace('{tax}',tax());
else if(k==='from')h=t.from.replace('{p}',money(cur,P[pk][cur][0])).replace('{tax}',tax());
else if(k==='recep')h=t.recep.replace('{p}',money(cur,P[pk][cur][0])).replace('{tax}',tax());
e.innerHTML=h});
d.querySelectorAll('[data-cur]').forEach(function(b){var on=b.getAttribute('data-cur')===cur;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on?'true':'false')});
var g=d.querySelector('.cursw');if(g)g.setAttribute('aria-label',t.sw)}
d.addEventListener('a2c:lang',function(ev){lang=ev.detail in T?ev.detail:'es';cur=picked||DEF[lang];render()});
d.addEventListener('DOMContentLoaded',function(){d.querySelectorAll('[data-cur]').forEach(function(b){b.addEventListener('click',function(){cur=picked=b.getAttribute('data-cur');try{localStorage.setItem(K,cur)}catch(e){}render()})})});})();
