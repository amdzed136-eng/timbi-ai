'use strict';

/* ══════════════════════════════════════════════════
   TIMBI AI — script.js
   Requires: i18n.js loaded first
   ══════════════════════════════════════════════════ */

{
  const WA_NUMBER   = '905467653562';
  const navbar      = document.getElementById('navbar');
  const navLinks    = document.getElementById('navLinks');
  const menuToggle  = document.getElementById('menuToggle');
  const scrollBar   = document.getElementById('scrollProgress');
  const projectForm = document.getElementById('projectForm');
  const feedback    = document.getElementById('formFeedback');
  const yearEl      = document.getElementById('year');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ─── Navbar state + progress bar ─── */
  const onScroll = () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 40);
    if (scrollBar) {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      scrollBar.style.transform = `scaleX(${total > 0 ? window.scrollY / total : 0})`;
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ─── Mobile menu ─── */
  const closeMenu = () => {
    navLinks?.classList.remove('active');
    menuToggle?.classList.remove('active');
    menuToggle?.setAttribute('aria-expanded', 'false');
  };
  menuToggle?.addEventListener('click', e => {
    e.stopPropagation();
    const open = navLinks.classList.toggle('active');
    menuToggle.classList.toggle('active', open);
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  navLinks?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('click', e => { if (navbar && !navbar.contains(e.target)) closeMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  /* ─── Reveal on scroll ─── */
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

  /* ─── Hero entrance ─── */
  const heroKids = document.querySelectorAll('.hero-content > *');
  if (!reduceMotion) {
    heroKids.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(22px)';
      el.style.transition = `opacity .8s ease ${120 + i * 90}ms, transform .8s cubic-bezier(.22,.61,.36,1) ${120 + i * 90}ms`;
    });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      heroKids.forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
    }));
  }

  /* ─── Magnetic buttons ─── */
  if (!reduceMotion && !window.matchMedia('(hover:none)').matches) {
    document.querySelectorAll('.magnetic').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.18}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* ─── Smooth anchor scroll ─── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      const target = id.length > 1 && document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });

  /* ─── Package buttons pre-fill the form ─── */
  document.querySelectorAll('[data-plan]').forEach(btn => {
    btn.addEventListener('click', () => {
      const plan = btn.closest('.plan')?.querySelector('h3')?.textContent || '';
      const details = document.getElementById('details');
      const line = (window.getTranslation('plan_prefill') || 'Package: {{plan}}').replace('{{plan}}', plan);
      if (details && !details.value.includes(line)) details.value = line + (details.value ? '\n' + details.value : '');
    });
  });

  /* ─── WhatsApp form ─── */
  const say = (type, text) => {
    if (!feedback) return;
    feedback.textContent = text;
    feedback.dataset.type = type;
  };

  projectForm?.addEventListener('submit', e => {
    e.preventDefault();
    const val = id => (document.getElementById(id)?.value || '').trim();
    const sel = id => {
      const s = document.getElementById(id);
      return s && s.value ? s.options[s.selectedIndex].textContent.trim() : '';
    };
    const name = val('name'), business = val('business'), service = sel('service'), budget = sel('budget');
    const details = val('details') || '—';

    if (!name || !business || !service || !budget) {
      say('error', window.getTranslation('form_error') || 'Please fill in your name, business, service and budget.');
      projectForm.querySelector(':invalid')?.focus();
      return;
    }

    const msg = (window.getTranslation('wa_message') || 'Hello TIMBI AI,\n\nName: {{name}}\nBusiness: {{business}}\nService: {{service}}\nBudget: {{budget}}\n\n{{details}}')
      .replace('{{name}}', name).replace('{{business}}', business)
      .replace('{{service}}', service).replace('{{budget}}', budget)
      .replace('{{details}}', details);

    say('ok', window.getTranslation('form_ok') || 'Opening WhatsApp…');
    window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
  });
}
