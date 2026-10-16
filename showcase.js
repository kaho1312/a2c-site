/* A2C industry showcase: tabs + WhatsApp-style chats that play message by message with typing indicators.
   Progressive enhancement: without JS every conversation is shown in full, one after another.
   prefers-reduced-motion: tabs work, conversations are shown complete and static (no typing, no animation). */
(function(){var d=document;d.addEventListener('DOMContentLoaded',function(){
var root=d.querySelector('[data-sc]');if(!root)return;
var rm=matchMedia('(prefers-reduced-motion: reduce)').matches;
var tabs=[].slice.call(root.querySelectorAll('.sc-tab')),panels=[].slice.call(root.querySelectorAll('.sc-panel'));
root.classList.add('sc-js');
var timers=[],cur=null,seen=false;
function clear(){timers.forEach(clearTimeout);timers=[];root.querySelectorAll('.sc-typing').forEach(function(t){t.remove()})}
function wait(ms){return new Promise(function(r){timers.push(setTimeout(r,ms))})}
function txtLen(el){return (el.textContent||'').trim().length}
function toBottom(th){th.scrollTop=th.scrollHeight}
function typing(th,side){var t=d.createElement('div');t.className='sc-typing '+side;t.setAttribute('aria-hidden','true');t.innerHTML='<span></span><span></span><span></span>';th.appendChild(t);toBottom(th);return t}
function play(panel){clear();var th=panel.querySelector('.sc-thread'),items=[].slice.call(th.querySelectorAll('.sc-i')),rp=panel.querySelector('.sc-replay');
 if(rp)rp.hidden=true;
 if(rm){items.forEach(function(i){i.classList.add('sc-show')});th.scrollTop=0;if(rp)rp.hidden=true;return}
 th.classList.add('sc-play');items.forEach(function(i){i.classList.remove('sc-show')});th.scrollTop=0;
 var token={};cur=token;var chain=wait(350);
 items.forEach(function(it){chain=chain.then(function(){if(cur!==token)return;
  var out=it.classList.contains('out')||it.classList.contains('sc-card'),sys=it.classList.contains('sc-sys'),n=txtLen(it);
  if(sys)return wait(500).then(function(){if(cur!==token)return;it.classList.add('sc-show');toBottom(th)});
  var ty=typing(th,out?'out':'in');
  return wait(out?Math.min(650+n*9,1700):Math.min(700+n*14,1600)).then(function(){if(cur!==token)return;ty.remove();it.classList.add('sc-show');toBottom(th);return wait(out?650:450)})})});
 chain.then(function(){if(cur===token&&rp)rp.hidden=false})}
function select(i,focus){tabs.forEach(function(t,j){var on=i===j;t.setAttribute('aria-selected',on?'true':'false');t.tabIndex=on?0:-1;panels[j].hidden=!on});
 if(focus)tabs[i].focus({preventScroll:true});var tl=tabs[i].parentNode,t=tabs[i];if(t.offsetLeft<tl.scrollLeft||t.offsetLeft+t.offsetWidth>tl.scrollLeft+tl.clientWidth)tl.scrollLeft=t.offsetLeft-16;
 if(seen||rm)play(panels[i])}
tabs.forEach(function(t,i){t.addEventListener('click',function(){select(i)});
 t.addEventListener('keydown',function(e){var k=e.key,n=tabs.length,j=null;if(k==='ArrowRight')j=(i+1)%n;else if(k==='ArrowLeft')j=(i-1+n)%n;else if(k==='Home')j=0;else if(k==='End')j=n-1;if(j!==null){e.preventDefault();select(j,true)}})});
panels.forEach(function(p){var rp=p.querySelector('.sc-replay');if(rp)rp.addEventListener('click',function(){play(p)})});
var start=0;if(location.hash){var h=location.hash.slice(1);panels.forEach(function(p,i){if(p.id===h)start=i})}
select(start);
// pre-select industry in the lead form from a showcase link
root.querySelectorAll('[data-industry]').forEach(function(a){a.addEventListener('click',function(){var s=d.getElementById('lf-industry');if(s)s.value=a.getAttribute('data-industry')})});
if(rm)return;
panels.forEach(function(p){p.querySelector('.sc-thread').classList.add('sc-play')});
function vis(){var r=root.getBoundingClientRect();return r.top<innerHeight*.7&&r.bottom>innerHeight*.2}
function check(){if(seen||!vis())return;seen=true;removeEventListener('scroll',check);removeEventListener('resize',check);panels.forEach(function(p){if(!p.hidden)play(p)})}
addEventListener('scroll',check,{passive:true});addEventListener('resize',check);check();
})})();
