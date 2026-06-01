'use strict';

/* ══════════════════════════════════════════════════
   TIMBI AI — script.js
   Requires: i18n.js loaded first
   ══════════════════════════════════════════════════ */

const navbar      = document.getElementById('navbar');
const navLinks    = document.getElementById('navLinks');
const menuToggle  = document.getElementById('menuToggle');
const loader      = document.getElementById('loader');
const scrollBar   = document.getElementById('scrollProgress');
const projectForm = document.getElementById('projectForm');
const yearEl      = document.getElementById('year');
const orbOne      = document.getElementById('orbOne');
const orbTwo      = document.getElementById('orbTwo');

const WA_NUMBER = '905467653562';

/* ─── Year ─── */
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ─── Loader ─── */
window.addEventListener('load', () => {
  setTimeout(() => { if (loader) loader.classList.add('hide'); }, 900);
});

/* ─── Navbar scroll ─── */
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

/* ─── Mobile menu ─── */
if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('active');
    menuToggle.classList.toggle('active', open);
    menuToggle.setAttribute('aria-expanded', open);
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      menuToggle.classList.remove('active');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('click', e => {
    if (navbar && !navbar.contains(e.target)) {
      navLinks.classList.remove('active');
      menuToggle.classList.remove('active');
    }
  });
}

/* ─── Scroll progress bar ─── */
if (scrollBar) {
  window.addEventListener('scroll', () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    scrollBar.style.width = total > 0 ? (window.scrollY / total * 100) + '%' : '0%';
  }, { passive: true });
}

/* ─── Reveal on scroll ─── */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -36px 0px' });

document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = Math.min(i * 45, 250) + 'ms';
  revealObs.observe(el);
});

/* ─── Stat counters ─── */
function animateCounter(el) {
  const target = parseFloat(el.dataset.target);
  const suffix = el.dataset.suffix || '';
  const dur    = 1800;
  const start  = performance.now();
  const ease   = t => 1 - Math.pow(1 - t, 3);
  const tick   = now => {
    const p = Math.min((now - start) / dur, 1);
    const v = target % 1 ? (ease(p) * target).toFixed(1) : Math.floor(ease(p) * target);
    el.textContent = v + suffix;
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = target + suffix;
  };
  requestAnimationFrame(tick);
}

const counterObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { animateCounter(e.target); counterObs.unobserve(e.target); }
  });
}, { threshold: 0.4 });

document.querySelectorAll('.stat-number').forEach(el => counterObs.observe(el));

/* ─── Orb parallax (mouse) ─── */
let orbRaf = null;
document.addEventListener('mousemove', e => {
  const mx = (e.clientX / window.innerWidth  - 0.5) * 2;
  const my = (e.clientY / window.innerHeight - 0.5) * 2;
  if (!orbRaf) orbRaf = requestAnimationFrame(() => {
    if (orbOne) orbOne.style.transform = `translate(${mx * 26}px, ${my * 20}px)`;
    if (orbTwo) orbTwo.style.transform = `translate(${-mx * 20}px, ${-my * 16}px)`;
    orbRaf = null;
  });
}, { passive: true });

/* ─── Magnetic buttons ─── */
const isTouch = window.matchMedia('(hover:none)').matches;
if (!isTouch) {
  document.querySelectorAll('.magnetic').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r  = btn.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width  / 2) * 0.2;
      const dy = (e.clientY - r.top  - r.height / 2) * 0.2;
      btn.style.transform = `translate(${dx}px, ${dy}px) translateY(-3px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });
}

/* ─── Smooth scroll ─── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});

/* ─── WhatsApp form ─── */
if (projectForm) {
  projectForm.addEventListener('submit', e => {
    e.preventDefault();

    const name     = document.getElementById('name').value.trim();
    const business = document.getElementById('business').value.trim();
    const service  = document.getElementById('service').value;
    const budget   = document.getElementById('budget').value;
    const details  = document.getElementById('details').value.trim();

    if (!name || !business || !service || !budget || !details) {
      showMsg('error', '⚠ Please fill in all fields before sending.');
      return;
    }

    const template = window.getTranslation('wa_message') ||
      'Hello TIMBI AI,\n\nName: {{name}}\nBusiness: {{business}}\nService: {{service}}\nBudget: {{budget}}\n\nDetails:\n{{details}}\n\ntimbiai.com';

    const msg = template
      .replace('{{name}}',     name)
      .replace('{{business}}', business)
      .replace('{{service}}',  service)
      .replace('{{budget}}',   budget)
      .replace('{{details}}',  details);

    window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg), '_blank');
    showSuccess();
    setTimeout(() => projectForm.reset(), 400);
  });
}

function showMsg(type, text) {
  document.querySelector('.form-feedback')?.remove();
  const el = document.createElement('p');
  el.className = 'form-feedback';
  el.textContent = text;
  el.style.cssText = [
    'grid-column:1/-1', 'text-align:center', 'font-size:13px',
    'padding:12px 16px', 'border-radius:12px',
    type === 'error'
      ? 'color:#ff6b6b;border:1px solid rgba(255,107,107,.3);background:rgba(255,107,107,.08)'
      : 'color:#25D366;border:1px solid rgba(37,211,102,.3);background:rgba(37,211,102,.08)'
  ].join(';');
  projectForm.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

function showSuccess() {
  const btn = projectForm.querySelector('.form-btn');
  if (!btn) return;
  const orig = btn.innerHTML;
  btn.innerHTML = '<span>✓ Opening WhatsApp…</span>';
  btn.style.background = 'linear-gradient(135deg,#25D366,#128C7E)';
  btn.disabled = true;
  setTimeout(() => {
    btn.innerHTML = orig;
    btn.style.background = '';
    btn.disabled = false;
  }, 3000);
}

/* ─── Hero entrance animation ─── */
window.addEventListener('DOMContentLoaded', () => {
  const hero = document.querySelector('.hero-content');
  if (!hero) return;
  const kids = hero.querySelectorAll('.eyebrow, h1, .hero-text, .hero-buttons, .trust-row');
  kids.forEach((el, i) => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = `opacity .75s ease ${900 + i * 100}ms, transform .75s cubic-bezier(.22,.61,.36,1) ${900 + i * 100}ms`;
  });
  setTimeout(() => {
    kids.forEach(el => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
  }, 50);
});
