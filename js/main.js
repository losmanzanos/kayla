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

/* ── Desktop dropdown (click to toggle, caret rotates) ── */
(function(){
  var dropdowns = document.querySelectorAll('.nav-has-dropdown');
  dropdowns.forEach(function(li){
    var link = li.querySelector(':scope > a');
    if(!link) return;
    link.addEventListener('click', function(e){
      e.preventDefault();
      var wasOpen = li.classList.contains('open');
      dropdowns.forEach(function(d){ d.classList.remove('open'); });
      if(!wasOpen) li.classList.add('open');
    });
  });
  // Close when clicking outside
  document.addEventListener('click', function(e){
    if(!e.target.closest('.nav-has-dropdown')){
      dropdowns.forEach(function(d){ d.classList.remove('open'); });
    }
  });
  // Close on Escape
  document.addEventListener('keydown', function(e){
    if(e.key==='Escape') dropdowns.forEach(function(d){ d.classList.remove('open'); });
  });
})();

/* ── Mobile services accordion ── */
(function(){
  if(!menu) return;
  var subnav = menu.querySelector('.mobile-subnav');
  if(!subnav) return;
  // Find the Services link — match either /services/ or /kayla/services/
  var svcLink = null;
  menu.querySelectorAll('a').forEach(function(a){
    if(a.closest('.mobile-subnav')) return; // skip links inside the subnav itself
    var h = a.getAttribute('href') || '';
    if(h === '/services/' || h.indexOf('/services/') > -1 || h === '/kayla/services/') svcLink = a;
  });
  if(!svcLink) return;

  // Wrap Services link in a flex row with a caret button
  var row = document.createElement('div');
  row.className = 'mobile-svc-row';
  svcLink.parentNode.insertBefore(row, svcLink);
  row.appendChild(svcLink);

  var caret = document.createElement('button');
  caret.className = 'mobile-svc-caret';
  caret.setAttribute('aria-label', 'Toggle services submenu');
  caret.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 5L7 9L11 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  row.appendChild(caret);

  // Prevent Services link from closing the menu; instead toggle subnav
  svcLink.removeEventListener('click', closeMenu);
  // Re-add the listener list from querySelectorAll won't let us remove by reference,
  // so we capture clicks on the link with a capturing interceptor
  svcLink.addEventListener('click', function(e){
    if(!subnav.classList.contains('open')){
      e.preventDefault();
      e.stopPropagation();
      subnav.classList.add('open');
      caret.classList.add('open');
    } else {
      closeMenu();
    }
  }, true);

  caret.addEventListener('click', function(e){
    e.stopPropagation();
    subnav.classList.toggle('open');
    caret.classList.toggle('open');
  });

  // Close subnav when any subnav link is clicked (closeMenu handles the rest)
  subnav.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){
      subnav.classList.remove('open');
      caret.classList.remove('open');
    });
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
