'use strict';

/* ══════════════════════════════════════════════════
   TIMBI AI — script.js
   Note: i18n.js must be loaded first (see index.html)
   ══════════════════════════════════════════════════ */

const navLinks   = document.getElementById('navLinks');
const menuToggle = document.getElementById('menuToggle');
const navbar     = document.getElementById('navbar');
const year       = document.getElementById('year');
const loader     = document.getElementById('loader');
const projectForm= document.getElementById('projectForm');
const scrollBar  = document.getElementById('scrollProgress');
const orbOne     = document.getElementById('orbOne');
const orbTwo     = document.getElementById('orbTwo');

const whatsappNumber = '905467653562';

/* ─── Year ─── */
if (year) year.textContent = new Date().getFullYear();

/* ─── Loader ─── */
window.addEventListener('load', () => {
    setTimeout(() => { if (loader) loader.classList.add('hide'); }, 950);
});

/* ─── Mobile Menu ─── */
if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('active');
        menuToggle.classList.toggle('active', isOpen);
        menuToggle.setAttribute('aria-expanded', isOpen);
    });
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            menuToggle.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
        });
    });
    document.addEventListener('click', e => {
        if (!navbar.contains(e.target)) {
            navLinks.classList.remove('active');
            menuToggle.classList.remove('active');
        }
    });
}

/* ─── Navbar Scroll ─── */
if (navbar) {
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
}

/* ─── Scroll Progress Bar ─── */
if (scrollBar) {
    window.addEventListener('scroll', () => {
        const docH = document.documentElement.scrollHeight - window.innerHeight;
        scrollBar.style.width = docH > 0 ? `${(window.scrollY / docH) * 100}%` : '0%';
    }, { passive: true });
}

/* ─── Reveal on Scroll ─── */
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            e.target.classList.add('visible');
            revealObserver.unobserve(e.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i * 50, 280)}ms`;
    revealObserver.observe(el);
});

/* ─── Stat Counters ─── */
function animateCounter(el) {
    const target = parseFloat(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const dur = 1800;
    const t0  = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);
    const tick = now => {
        const p = Math.min((now - t0) / dur, 1);
        const v = target % 1 !== 0 ? (ease(p) * target).toFixed(1) : Math.floor(ease(p) * target);
        el.textContent = v + suffix;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = target + suffix;
    };
    requestAnimationFrame(tick);
}

const counterObs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { animateCounter(e.target); counterObs.unobserve(e.target); } });
}, { threshold: 0.4 });

document.querySelectorAll('.stat-number').forEach(el => counterObs.observe(el));

/* ─── Mouse Parallax on Orbs ─── */
let orbRaf = null;
let mx = 0, my = 0;
document.addEventListener('mousemove', e => {
    mx = (e.clientX / window.innerWidth  - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
    if (!orbRaf) orbRaf = requestAnimationFrame(() => {
        if (orbOne) orbOne.style.transform = `translate(${mx * 28}px,${my * 22}px)`;
        if (orbTwo) orbTwo.style.transform = `translate(${-mx * 22}px,${-my * 18}px)`;
        orbRaf = null;
    });
}, { passive: true });

/* ─── Magnetic Buttons ─── */
const isTouchDevice = window.matchMedia('(hover:none)').matches;
if (!isTouchDevice) {
    document.querySelectorAll('.magnetic').forEach(btn => {
        btn.addEventListener('mousemove', e => {
            const r = btn.getBoundingClientRect();
            const dx = (e.clientX - r.left - r.width  / 2) * 0.22;
            const dy = (e.clientY - r.top  - r.height / 2) * 0.22;
            btn.style.transform = `translate(${dx}px,${dy}px) translateY(-3px)`;
        });
        btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });

    /* Why card 3D tilt */
    document.querySelectorAll('.why-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width  - 0.5;
            const y = (e.clientY - r.top)  / r.height - 0.5;
            card.style.transform = `perspective(900px) rotateX(${-y*5}deg) rotateY(${x*5}deg) translateY(-8px)`;
        });
        card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
}

/* ─── WhatsApp Form ─── */
if (projectForm) {
    projectForm.addEventListener('submit', e => {
        e.preventDefault();
        const name     = document.getElementById('name').value.trim();
        const business = document.getElementById('business').value.trim();
        const service  = document.getElementById('service').value;
        const budget   = document.getElementById('budget').value;
        const details  = document.getElementById('details').value.trim();

        if (!name || !business || !service || !budget || !details) {
            showFeedback('error', '⚠ ' + (window.getTranslation('form_submit') ? 'Veuillez remplir tous les champs.' : 'Please complete all fields.'));
            return;
        }

        /* Get message template from current language */
        const template = window.getTranslation('wa_message') ||
            'Hello TIMBI AI,\n\nName: {{name}}\nBusiness: {{business}}\nService: {{service}}\nBudget: {{budget}}\n\nDetails:\n{{details}}\n\ntimbiai.com';

        const message = template
            .replace('{{name}}',     name)
            .replace('{{business}}', business)
            .replace('{{service}}',  service)
            .replace('{{budget}}',   budget)
            .replace('{{details}}',  details);

        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
        showSuccess();
        setTimeout(() => projectForm.reset(), 400);
    });
}

function showFeedback(type, msg) {
    document.querySelector('.form-feedback')?.remove();
    const el = Object.assign(document.createElement('p'), {
        className: 'form-feedback',
        textContent: msg
    });
    Object.assign(el.style, {
        gridColumn: '1/-1', textAlign: 'center', fontSize: '13px',
        padding: '12px', borderRadius: '12px', animation: 'fadeIn .3s ease',
        border: type === 'error' ? '1px solid rgba(255,107,107,.3)' : '1px solid rgba(37,211,102,.3)',
        background: type === 'error' ? 'rgba(255,107,107,.08)' : 'rgba(37,211,102,.08)',
        color: type === 'error' ? '#ff6b6b' : '#25D366'
    });
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
    setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; btn.disabled = false; }, 3000);
}

/* ─── Cinematic Hero Entrance ─── */
window.addEventListener('DOMContentLoaded', () => {
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        const children = heroContent.querySelectorAll('.eyebrow, h1, .hero-text, .hero-buttons, .trust-row');
        children.forEach((child, i) => {
            child.style.cssText += `;opacity:0;transform:translateY(26px);transition:opacity .8s ease ${950+i*100}ms,transform .8s cubic-bezier(.22,.61,.36,1) ${950+i*100}ms`;
        });
        setTimeout(() => {
            children.forEach(child => { child.style.opacity='1'; child.style.transform='translateY(0)'; });
        }, 50);
    }
});

/* ─── Smooth scroll ─── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const t = document.querySelector(a.getAttribute('href'));
        if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
});
