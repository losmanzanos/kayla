/* Mariposa Mental Wellness — Main JS */
(function(){'use strict';

/* ── iOS Safari hero height fix ── */
(function(){
  function isM(){ return window.innerWidth<=768; }
  function lockH(){
    if(isM()){
      document.documentElement.style.setProperty('--hero-h', window.innerHeight+'px');
    } else {
      document.documentElement.style.removeProperty('--hero-h');
    }
  }
  lockH();
  window.addEventListener('orientationchange', function(){ setTimeout(lockH,300); });
  window.addEventListener('resize', function(){ if(!isM()) lockH(); });
})();

/* ── Nav scroll behavior ── */
var hdr = document.querySelector('nav');
function updateNav(){
  if(!hdr) return;
  var threshold = window.innerWidth<=768 ? 10 : 20;
  if(window.scrollY > threshold){ hdr.classList.add('scrolled'); }
  else { hdr.classList.remove('scrolled'); }
}
if(hdr){
  window.addEventListener('scroll', updateNav, {passive:true});
  updateNav();
}

/* ── Mobile menu ── */
var btn = document.getElementById('hamburger');
var menu = document.getElementById('mobile-menu');

function openMenu(){
  if(!menu) return;
  menu.classList.add('open');
  document.body.style.overflow = 'hidden';
  if(btn){ btn.classList.add('open'); btn.setAttribute('aria-expanded','true'); }
  menu.setAttribute('aria-hidden','false');
}
function closeMenu(){
  if(!menu) return;
  menu.classList.remove('open');
  document.body.style.overflow = '';
  if(btn){ btn.classList.remove('open'); btn.setAttribute('aria-expanded','false'); }
  menu.setAttribute('aria-hidden','true');
}
if(btn){ btn.addEventListener('click', function(){ btn.classList.contains('open') ? closeMenu() : openMenu(); }); }
document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeMenu(); });
if(menu){ menu.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', closeMenu); }); }

/* ── Scroll reveal ── */
var observer = new IntersectionObserver(function(entries){
  entries.forEach(function(e){
    if(e.isIntersecting) e.target.classList.add('visible');
  });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(function(el){ observer.observe(el); });
setTimeout(function(){
  document.querySelectorAll('.hero .reveal, .page-hero .reveal').forEach(function(el){ el.classList.add('visible'); });
}, 100);

/* ── FAQ accordion ── */
document.querySelectorAll('.faq-question').forEach(function(q){
  q.addEventListener('click', function(){
    var item = q.parentElement;
    var wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(function(i){ i.classList.remove('open'); });
    if(!wasOpen) item.classList.add('open');
  });
});

/* ── Active nav link ── */
(function(){
  var path = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(function(a){
    var href = a.getAttribute('href');
    if(href && href !== '/' && path.indexOf(href.replace(/\//g,'').replace('#','')) > -1){
      a.classList.add('active');
    }
    if(href === '/' && (path === '/' || path === '/index.html')){
      a.classList.add('active');
    }
  });
})();

})();

// GitHub Pages preview: rewrite root-relative links when served from /kayla/
(function () {
  var base = '/kayla';
  if (!location.pathname.startsWith(base + '/') && location.pathname !== base) return;
  document.querySelectorAll('a[href^="/"]').forEach(function (a) {
    var href = a.getAttribute('href');
    if (!href.startsWith(base)) {
      a.setAttribute('href', base + href);
    }
  });
})();
