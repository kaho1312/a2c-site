/* A2C fx: WebGL "liquid iridescence" background (port inspired by React Bits Iridescence / Liquid Chrome, MIT, DavidHDev),
   split/blur text, magnetic CTA, scroll reveal, card glow. Respects prefers-reduced-motion; CSS gradient fallback without WebGL. */
(function(){
var d=document,rm=matchMedia('(prefers-reduced-motion: reduce)').matches;
d.documentElement.classList.add('js');
function bg(){
 var c=d.getElementById('bg');if(!c)return;
 var gl=c.getContext('webgl',{antialias:false,alpha:false,powerPreference:'low-power'});
 if(!gl){c.remove();return}
 var vs='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
 var fs='precision mediump float;uniform vec2 r;uniform float t;uniform vec2 m;'+
 'void main(){vec2 uv=(2.*gl_FragCoord.xy-r)/min(r.x,r.y);uv+=(m-.5)*.25;float tt=t*.12;'+
 'for(float i=1.;i<8.;i++){uv.x+=.55/i*cos(i*2.3*uv.y+tt+i*1.7);uv.y+=.55/i*cos(i*1.7*uv.x+tt*1.3);}'+
 'float a=.5+.5*sin(uv.x+uv.y),b=.5+.5*cos(uv.y*1.3-tt),c2=.5+.5*sin(uv.x*.8+tt*.7);'+
 'vec3 col=mix(vec3(.02,.03,.06),vec3(.18,.85,.75),a*b*.85);col=mix(col,vec3(.42,.5,1.),c2*.45*(1.-a));col=mix(col,vec3(.62,.38,.95),pow(b,4.)*.4);'+
 'float h=pow(abs(sin(uv.x*1.5+uv.y)),12.);col+=h*.25;col=mix(vec3(1.),col*1.6,.9);gl_FragColor=vec4(col,1.);}';
 function sh(ty,s){var o=gl.createShader(ty);gl.shaderSource(o,s);gl.compileShader(o);return o}
 var pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(pr);
 if(!gl.getProgramParameter(pr,gl.LINK_STATUS)){c.remove();return}
 gl.useProgram(pr);var b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);
 gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
 var l=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,2,gl.FLOAT,false,0,0);
 var ur=gl.getUniformLocation(pr,'r'),ut=gl.getUniformLocation(pr,'t'),um=gl.getUniformLocation(pr,'m');
 var mx=.5,my=.5,tx=.5,ty=.5,scale=Math.min(devicePixelRatio||1,1)*(innerWidth<760?.5:.6);
 function rs(){c.width=innerWidth*scale|0;c.height=innerHeight*scale|0;gl.viewport(0,0,c.width,c.height);gl.uniform2f(ur,c.width,c.height)}
 rs();addEventListener('resize',rs);
 addEventListener('pointermove',function(e){tx=e.clientX/innerWidth;ty=1-e.clientY/innerHeight},{passive:true});
 var t0=performance.now(),vis=true;d.addEventListener('visibilitychange',function(){vis=!d.hidden;if(vis&&!rm)requestAnimationFrame(f)});
 function f(n){mx+=(tx-mx)*.04;my+=(ty-my)*.04;gl.uniform1f(ut,rm?20.:(n-t0)/1000+20.);gl.uniform2f(um,mx,my);gl.drawArrays(gl.TRIANGLES,0,3);if(!rm&&vis)requestAnimationFrame(f)}
 requestAnimationFrame(f);
}
function split(){
 if(rm)return;
 d.querySelectorAll('.split').forEach(function(el){
  var txt=el.textContent,i=0;el.setAttribute('aria-label',txt);
  el.innerHTML=txt.split(' ').map(function(w){return '<span class="wd" aria-hidden="true">'+Array.from(w).map(function(ch){return '<span class="ch" style="--i:'+(i++)+'">'+ch+'</span>'}).join('')+'</span>'}).join(' ');
 });
}
function magnetic(){
 if(rm||!matchMedia('(hover:hover)').matches)return;
 d.querySelectorAll('.magnetic').forEach(function(b){
  b.addEventListener('pointermove',function(e){var r=b.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;b.style.transform='translate('+x*.25+'px,'+y*.35+'px)'});
  b.addEventListener('pointerleave',function(){b.style.transition='transform .5s cubic-bezier(.2,.7,.2,1),box-shadow .3s';b.style.transform='';setTimeout(function(){b.style.transition=''},500)});
 });
}
function reveal(){
 var els=d.querySelectorAll('.reveal');
 if(rm||!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in')});return}
 var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.15});
 els.forEach(function(e,i){e.style.transitionDelay=(i%3)*90+'ms';io.observe(e)});
 d.querySelectorAll('.card').forEach(function(c){c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();c.style.setProperty('--mx',e.clientX-r.left+'px');c.style.setProperty('--my',e.clientY-r.top+'px')})});
}
d.addEventListener('a2c:lang',function(){split()});
function chat(){if(rm)return;var w=d.querySelector('.demo-wrap');if(!w)return;function go(){w.classList.remove('play');void w.offsetWidth;w.classList.add('play')}go();setInterval(function(){if(!d.hidden)go()},14000)}
d.addEventListener('DOMContentLoaded',function(){bg();chat();magnetic();reveal()});
})();
