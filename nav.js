/* Mobile menu (< 760px): disclosure button with aria-expanded; closes on link click, Esc, outside click, or when the viewport grows. */
(function(){var d=document;d.addEventListener('DOMContentLoaded',function(){
var b=d.querySelector('.menu-btn'),n=b&&d.getElementById(b.getAttribute('aria-controls'));if(!n)return;
function isOpen(){return b.getAttribute('aria-expanded')==='true'}
function set(o,refocus){b.setAttribute('aria-expanded',o?'true':'false');n.classList.toggle('open',o);d.documentElement.classList.toggle('menu-open',o);if(!o&&refocus)b.focus()}
b.addEventListener('click',function(){set(!isOpen())});
n.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('a'))set(false)});
d.addEventListener('keydown',function(e){if((e.key==='Escape'||e.key==='Esc')&&isOpen()){e.preventDefault();set(false,true)}});
d.addEventListener('click',function(e){if(isOpen()&&!n.contains(e.target)&&!b.contains(e.target))set(false)});
var mq=matchMedia('(min-width:760px)'),f=function(){if(mq.matches&&isOpen())set(false)};
if(mq.addEventListener)mq.addEventListener('change',f);else if(mq.addListener)mq.addListener(f);
})})();
