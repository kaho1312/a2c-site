// Package prices in MXN / USD / EUR + currency switcher. Default currency follows the page language (ES: MXN, EN: USD, DE: EUR)
// until the visitor picks one. USD/EUR converted from MXN with ECB reference rates of 2026-10-16
// (1 EUR = 1.1253 USD = 20.6871 MXN) and rounded to marketing prices.
// German formatting puts the amount first in every currency ("139 €", "159 USD", "2.900 MXN").
// tools/build-i18n.py uses window.A2C_PRICING.html() to pre-render the prices of /en/ and /de/.
(function(){var d=typeof document!=='undefined'?document:null,K='a2c-cur',lang='es',cur=null,picked=null;
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
from:'From {p}/month {tax}',recep:'Recepcionista 24/7 (24/7 Receptionist): {p}/month {tax}',sw:'Currency'},
de:{mo:'/Monat',setup:'einmalige Einrichtung',taxM:'zzgl. IVA',taxO:'zzgl. MwSt./Steuern',min:'Zusatzminute: ca. {p}',
meta:'<strong>Meta-Gebühren:</strong> Die WhatsApp-Nachrichtengebühren von Meta werden Ihnen zum Selbstkostenpreis weiterberechnet (ca. {p}/Monat bei einem typischen Unternehmen; abhängig vom Volumen).',
diag:'<strong>Das Erstgespräch ist kostenlos.</strong> Sie möchten tiefer einsteigen? Unsere ausführliche Diagnose mit schriftlichem Bericht kostet {p} {tax}.',
from:'Ab {p}/Monat {tax}',recep:'Recepcionista 24/7 (Rezeption rund um die Uhr): {p}/Monat {tax}',sw:'Währung'}};
function num(l,v){return new Intl.NumberFormat(LOC[l],{minimumFractionDigits:v%1?2:0,maximumFractionDigits:2}).format(v)}
function sym(c){return c==='EUR'?'€':c}
function money(l,c,v){return l==='de'?num(l,v)+'\u00a0'+sym(c):c+' '+num(l,v)}
function tax(l,c){return c==='MXN'?T[l].taxM:T[l].taxO}
function html(l,k,pk,c){var t=T[l];
if(k==='monthly')return l==='de'?num(l,P[pk][c][0])+'<span class="cur cur-a">'+sym(c)+'</span><small>'+t.mo+'</small><span class="tax">'+tax(l,c)+'</span>'
 :'<span class="cur">'+c+'</span> '+num(l,P[pk][c][0])+'<small>'+t.mo+'</small><span class="tax">'+tax(l,c)+'</span>';
if(k==='setup')return '+ '+money(l,c,P[pk][c][1])+' '+t.setup+' '+tax(l,c);
if(k==='minute')return t.min.replace('{p}',money(l,c,MIN[c]));
if(k==='meta')return t.meta.replace('{p}',money(l,c,META[c]));
if(k==='diag')return t.diag.replace('{p}',money(l,c,DIAG[c])).replace('{tax}',tax(l,c));
if(k==='from')return t.from.replace('{p}',money(l,c,P[pk][c][0])).replace('{tax}',tax(l,c));
if(k==='recep')return t.recep.replace('{p}',money(l,c,P[pk][c][0])).replace('{tax}',tax(l,c));
return ''}
if(typeof window!=='undefined')window.A2C_PRICING={html:html,DEF:DEF};
if(!d)return;
function render(){var t=T[lang];
d.querySelectorAll('[data-price]').forEach(function(e){e.innerHTML=html(lang,e.getAttribute('data-price'),e.getAttribute('data-pkg'),cur)});
d.querySelectorAll('[data-cur]').forEach(function(b){var on=b.getAttribute('data-cur')===cur;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on?'true':'false')});
var g=d.querySelector('.cursw');if(g)g.setAttribute('aria-label',t.sw)}
d.addEventListener('a2c:lang',function(ev){lang=ev.detail in T?ev.detail:'es';cur=picked||DEF[lang];render()});
d.addEventListener('DOMContentLoaded',function(){d.querySelectorAll('[data-cur]').forEach(function(b){b.addEventListener('click',function(){cur=picked=b.getAttribute('data-cur');try{localStorage.setItem(K,cur)}catch(e){}render()})})});})();
