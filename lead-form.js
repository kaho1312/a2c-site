/* A2C lead form: client-side checks, consent metadata (language, page URL, consent text version), honeypot,
   optional Cloudflare Turnstile (loaded only when the form comes close to the viewport), JSON POST to the leads Worker.
   The server re-validates everything and records its own timestamp. */
(function(){var d=document;d.addEventListener('DOMContentLoaded',function(){
var f=d.getElementById('lead-form');if(!f)return;
var ep=f.getAttribute('data-endpoint');var S={};f.querySelectorAll('template.lf-strings').forEach(function(t){[].forEach.call(t.content.querySelectorAll('[data-k]'),function(e){S[e.getAttribute('data-k')]=e.textContent})});
var msg=f.querySelector('.lf-msg'),btn=f.querySelector('.lf-submit'),ts=f.querySelector('.cf-turnstile');
f.elements.lang.value=d.documentElement.lang||'es';
if(ts&&'IntersectionObserver' in window){var io=new IntersectionObserver(function(es){if(es.some(function(e){return e.isIntersecting})){io.disconnect();var s=d.createElement('script');s.src='https://challenges.cloudflare.com/turnstile/v0/api.js';s.async=true;s.defer=true;d.head.appendChild(s)}},{rootMargin:'600px'});io.observe(f)}
function show(t,ok){msg.hidden=false;msg.textContent=t;msg.className='lf-msg '+(ok?'ok':'bad')}
function bad(el,on){var w=el.closest('.lf-f,.lf-check');if(w)w.classList.toggle('lf-bad',on);el.setAttribute('aria-invalid',on?'true':'false')}
f.addEventListener('submit',function(e){e.preventDefault();
 var E=f.elements,errs=0;['name','business','industry','email','city'].forEach(function(n){var el=E[n],v=(el.value||'').trim(),b=!v||(n==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));bad(el,b);if(b)errs++});
 bad(E.consent_privacy,!E.consent_privacy.checked);if(!E.consent_privacy.checked)errs++;
 var pref=(f.querySelector('input[name=preferred_contact]:checked')||{}).value||'email',wa=(E.whatsapp.value||'').trim(),waOk=/^\+?[0-9 ()-]{8,20}$/.test(wa);
 if(errs){show(S.err_req);var first=f.querySelector('[aria-invalid=true]');if(first)first.focus();return}
 if(pref==='whatsapp'&&(!waOk||!E.consent_whatsapp.checked)){bad(E.whatsapp,!waOk);bad(E.consent_whatsapp,!E.consent_whatsapp.checked);show(S.err_wa);return}
 if(pref==='call'&&!waOk){bad(E.whatsapp,true);show(S.err_call);E.whatsapp.focus();return}
 if(wa&&!waOk){bad(E.whatsapp,true);show(S.err_req);return}
 E.page_url.value=location.href.split('#')[0];
 var data={};new FormData(f).forEach(function(v,k){data[k]=v});data.preferred_contact=pref;
 ['consent_email','consent_whatsapp','consent_privacy'].forEach(function(k){data[k]=E[k].checked});
 btn.disabled=true;show(S.sending,true);
 fetch(ep+'/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).then(function(r){return r.json().catch(function(){return{}}).then(function(j){return{s:r.status,j:j}})}).then(function(x){
  if(x.s===200&&x.j.ok){f.reset();E.lang.value=d.documentElement.lang||'es';show(S.ok,true);if(window.turnstile)try{turnstile.reset()}catch(_){}}
  else{show(x.s===429?S.err_rate:S.err);if(window.turnstile)try{turnstile.reset()}catch(_){}}
 }).catch(function(){show(S.err)}).then(function(){btn.disabled=false})});
f.addEventListener('input',function(e){if(e.target.getAttribute('aria-invalid')==='true')bad(e.target,false)});
})})();
