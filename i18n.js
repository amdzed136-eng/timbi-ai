'use strict';

/* ══════════════════════════════════════════════════
   TIMBI AI — i18n.js
   Languages : EN (default) · FR · TR
   ══════════════════════════════════════════════════ */

const translations = {

  /* ─── ENGLISH ─── */
  en: {
    skip:'Skip to content',
    nav_services:'Services', nav_work:'Work', nav_pricing:'Packages', nav_cta:'Start a project',

    hero_eyebrow:'Websites · Branding · AI automation',
    hero_h1a:'Websites people', hero_h1b:'remember.',
    hero_text:'Premium websites, brand identities and WhatsApp automation for ambitious businesses. Based in Istanbul, working in English, French and Turkish.',
    hero_btn_primary:'Get a concept in 48h',
    hero_btn_secondary:'See our work →',
    hero_hint:'Move · Tap the sphere',

    logos_1:'Medical clinics', logos_2:'Restaurants', logos_3:'Real estate', logos_4:'Beauty brands',
    logos_5:'Local services', logos_6:'E-commerce', logos_7:'Money transfer',

    svc_eyebrow:'What we build',
    svc_h2:'One studio for your whole online presence.',
    svc_1_h3:'Premium web design',
    svc_1_p:'Fast, polished websites that make visitors trust your business within seconds.',
    svc_1_t1:'Websites', svc_1_t2:'Landing pages', svc_1_t3:'Mobile-first',
    svc_2_h3:'AI automation',
    svc_2_p:'Automatic replies, lead capture and workflows that keep working for you 24 hours a day.',
    svc_2_t2:'Lead capture', svc_2_t3:'Workflows',
    svc_3_h3:'Brand identity',
    svc_3_p:'Logo, colours, typography and a visual direction that make your brand look established from day one.',
    svc_3_t1:'Logo', svc_3_t2:'Colours', svc_3_t3:'Typography',
    svc_4_h3:'Digital growth',
    svc_4_p:'A structure built to convert, clear calls to action and SEO foundations so people find you.',
    svc_4_t2:'Conversion', svc_4_t3:'Calls to action',

    proc_eyebrow:'How it works',
    proc_h2:'From a message to a live website.',
    proc_1_h3:'You message us', proc_1_p:'One WhatsApp message is enough: your business, your goals, your budget.',
    proc_2_h3:'Concept in 48h', proc_2_p:'We send you a first visual direction for your site within 48 hours.',
    proc_3_h3:'Launch',         proc_3_p:'We refine it together, then put your site online, ready for mobile.',

    work_eyebrow:'Our work',
    work_h2:'Real projects, live online.',
    proj_0_tag:'Client project · Live',
    proj_0_p:'Website for a money transfer agency in Conakry, Guinea: 8 transfer networks, opening hours, map directions and one-tap WhatsApp and call buttons.',
    proj_0_link:'View live site →',
    next_h3:'Your project next?',
    next_p:'Clinic, restaurant, agency or shop: tell us about your business and get a first concept in 48 hours.',
    next_link:'Start a project →',

    price_eyebrow:'Packages',
    price_h2:'Three starting points.',
    price_p:'Every project starts with a conversation. Tell us your budget and we tailor the package.',
    plan_1_h3:'Starter', plan_1_price:'Landing page',
    plan_1_1:'1 premium page', plan_1_2:'Responsive design', plan_1_3:'Basic SEO setup', plan_1_4:'WhatsApp button',
    plan_2_popular:'Most popular', plan_2_h3:'Premium', plan_2_price:'Website + brand',
    plan_2_1:'Full multi-section website', plan_2_2:'Premium visual identity', plan_2_3:'Conversion copywriting', plan_2_4:'Contact & social setup',
    plan_3_h3:'Elite AI', plan_3_price:'Full system',
    plan_3_1:'Website + brand system', plan_3_2:'AI automation workflow', plan_3_3:'Lead capture strategy', plan_3_4:'Growth-ready structure',
    plan_btn:'Choose', plan_prefill:'Package: {{plan}}',

    contact_eyebrow:'Start your project',
    contact_h2:'Tell us what you need.',
    contact_p:'Fill in the form: WhatsApp opens with your message ready to send.',
    contact_direct:'Or write directly:',
    form_name_label:'Your name', form_name_ph:'Example: Amadou',
    form_biz_label:'Business type', form_biz_ph:'Restaurant, clinic, barber...',
    form_svc_label:'Service needed', form_svc_ph:'Choose a service',
    form_svc_1:'Premium website', form_svc_2:'Brand identity', form_svc_3:'AI automation', form_svc_4:'Full digital system',
    form_budget_label:'Estimated budget', form_budget_ph:'Choose a range', form_budget_4:'Not sure yet',
    form_details_label:'Project details (optional)', form_details_ph:'Tell us what you want to build...',
    form_submit:'Send via WhatsApp',
    form_error:'Please fill in your name, business, service and budget.',
    form_ok:'Opening WhatsApp…',

    footer_tagline:'Websites · Branding · AI automation — Istanbul, Türkiye',

    wa_message:'Hello TIMBI AI,\n\nI would like to start a project.\n\n👤 Name: {{name}}\n🏢 Business: {{business}}\n🛠 Service: {{service}}\n💰 Budget: {{budget}}\n\n📋 Details:\n{{details}}\n\nSent from timbiai.com',
  },

  /* ─── FRANÇAIS ─── */
  fr: {
    skip:'Aller au contenu',
    nav_services:'Services', nav_work:'Projets', nav_pricing:'Offres', nav_cta:'Démarrer un projet',

    hero_eyebrow:'Sites web · Branding · Automatisation IA',
    hero_h1a:'Des sites qu\'on', hero_h1b:'n\'oublie pas.',
    hero_text:'Sites premium, identités de marque et automatisation WhatsApp pour les entreprises ambitieuses. Basé à Istanbul, en français, anglais et turc.',
    hero_btn_primary:'Recevoir un concept en 48h',
    hero_btn_secondary:'Voir nos projets →',
    hero_hint:'Bougez · Touchez la sphère',

    logos_1:'Cliniques', logos_2:'Restaurants', logos_3:'Immobilier', logos_4:'Beauté',
    logos_5:'Services locaux', logos_6:'E-commerce', logos_7:'Transfert d\'argent',

    svc_eyebrow:'Ce qu\'on construit',
    svc_h2:'Un seul studio pour toute votre présence en ligne.',
    svc_1_h3:'Web design premium',
    svc_1_p:'Des sites rapides et soignés qui inspirent confiance en quelques secondes.',
    svc_1_t1:'Sites vitrines', svc_1_t2:'Landing pages', svc_1_t3:'Pensé mobile',
    svc_2_h3:'Automatisation IA',
    svc_2_p:'Réponses automatiques, capture de prospects et workflows qui travaillent pour vous 24h/24.',
    svc_2_t2:'Prospects', svc_2_t3:'Workflows',
    svc_3_h3:'Identité de marque',
    svc_3_p:'Logo, couleurs, typographie et direction visuelle pour une marque crédible dès le premier jour.',
    svc_3_t1:'Logo', svc_3_t2:'Couleurs', svc_3_t3:'Typographie',
    svc_4_h3:'Croissance digitale',
    svc_4_p:'Une structure pensée pour convertir, des appels à l\'action clairs et des bases SEO pour être trouvé.',
    svc_4_t2:'Conversion', svc_4_t3:'Appels à l\'action',

    proc_eyebrow:'Comment ça marche',
    proc_h2:'D\'un message à un site en ligne.',
    proc_1_h3:'Vous nous écrivez', proc_1_p:'Un message WhatsApp suffit : votre activité, vos objectifs, votre budget.',
    proc_2_h3:'Concept en 48h',    proc_2_p:'Nous vous envoyons une première direction visuelle de votre site sous 48 heures.',
    proc_3_h3:'Lancement',         proc_3_p:'On ajuste ensemble, puis on met votre site en ligne, prêt pour le mobile.',

    work_eyebrow:'Nos projets',
    work_h2:'Des projets réels, en ligne.',
    proj_0_tag:'Projet client · En ligne',
    proj_0_p:'Site d\'une agence de transfert d\'argent à Conakry (Guinée) : 8 réseaux de transfert, horaires, itinéraire et boutons WhatsApp et appel en un clic.',
    proj_0_link:'Voir le site en ligne →',
    next_h3:'Votre projet, le prochain ?',
    next_p:'Clinique, restaurant, agence ou boutique : parlez-nous de votre activité et recevez un premier concept en 48 heures.',
    next_link:'Démarrer un projet →',

    price_eyebrow:'Offres',
    price_h2:'Trois points de départ.',
    price_p:'Chaque projet commence par une conversation. Donnez-nous votre budget, on adapte l\'offre.',
    plan_1_h3:'Starter', plan_1_price:'Page d\'atterrissage',
    plan_1_1:'1 page premium', plan_1_2:'Design responsive', plan_1_3:'SEO de base', plan_1_4:'Bouton WhatsApp',
    plan_2_popular:'Le plus choisi', plan_2_h3:'Premium', plan_2_price:'Site + marque',
    plan_2_1:'Site multi-sections complet', plan_2_2:'Identité visuelle premium', plan_2_3:'Textes orientés conversion', plan_2_4:'Contact et réseaux sociaux',
    plan_3_h3:'Elite IA', plan_3_price:'Système complet',
    plan_3_1:'Site + système de marque', plan_3_2:'Workflow d\'automatisation IA', plan_3_3:'Stratégie de capture de prospects', plan_3_4:'Structure prête pour la croissance',
    plan_btn:'Choisir', plan_prefill:'Offre : {{plan}}',

    contact_eyebrow:'Démarrer votre projet',
    contact_h2:'Dites-nous ce qu\'il vous faut.',
    contact_p:'Remplissez le formulaire : WhatsApp s\'ouvre avec votre message prêt à envoyer.',
    contact_direct:'Ou écrivez directement :',
    form_name_label:'Votre nom', form_name_ph:'Exemple : Amadou',
    form_biz_label:'Type d\'activité', form_biz_ph:'Restaurant, clinique, barbier...',
    form_svc_label:'Service souhaité', form_svc_ph:'Choisir un service',
    form_svc_1:'Site premium', form_svc_2:'Identité de marque', form_svc_3:'Automatisation IA', form_svc_4:'Système digital complet',
    form_budget_label:'Budget estimé', form_budget_ph:'Choisir une fourchette', form_budget_4:'Je ne sais pas encore',
    form_details_label:'Détails du projet (facultatif)', form_details_ph:'Décrivez ce que vous voulez créer...',
    form_submit:'Envoyer sur WhatsApp',
    form_error:'Merci d\'indiquer votre nom, votre activité, le service et le budget.',
    form_ok:'Ouverture de WhatsApp…',

    footer_tagline:'Sites web · Branding · Automatisation IA — Istanbul, Turquie',

    wa_message:'Bonjour TIMBI AI,\n\nJe souhaite démarrer un projet.\n\n👤 Nom : {{name}}\n🏢 Activité : {{business}}\n🛠 Service : {{service}}\n💰 Budget : {{budget}}\n\n📋 Détails :\n{{details}}\n\nEnvoyé depuis timbiai.com',
  },

  /* ─── TÜRKÇE ─── */
  tr: {
    skip:'İçeriğe geç',
    nav_services:'Hizmetler', nav_work:'Projeler', nav_pricing:'Paketler', nav_cta:'Proje başlat',

    hero_eyebrow:'Web siteleri · Marka · YZ otomasyonu',
    hero_h1a:'Akılda kalan', hero_h1b:'web siteleri.',
    hero_text:'İddialı işletmeler için premium web siteleri, marka kimlikleri ve WhatsApp otomasyonu. İstanbul merkezli; Türkçe, İngilizce ve Fransızca.',
    hero_btn_primary:'48 saatte konsept alın',
    hero_btn_secondary:'Projelerimizi gör →',
    hero_hint:'Hareket ettirin · Küreye dokunun',

    logos_1:'Klinikler', logos_2:'Restoranlar', logos_3:'Gayrimenkul', logos_4:'Güzellik',
    logos_5:'Yerel hizmetler', logos_6:'E-ticaret', logos_7:'Para transferi',

    svc_eyebrow:'Neler yapıyoruz',
    svc_h2:'Tüm çevrimiçi varlığınız için tek stüdyo.',
    svc_1_h3:'Premium web tasarımı',
    svc_1_p:'Ziyaretçilere saniyeler içinde güven veren hızlı ve özenli web siteleri.',
    svc_1_t1:'Web siteleri', svc_1_t2:'Açılış sayfaları', svc_1_t3:'Mobil öncelikli',
    svc_2_h3:'YZ otomasyonu',
    svc_2_p:'Sizin için 7/24 çalışan otomatik yanıtlar, müşteri adayı toplama ve iş akışları.',
    svc_2_t2:'Müşteri adayları', svc_2_t3:'İş akışları',
    svc_3_h3:'Marka kimliği',
    svc_3_p:'Markanızı ilk günden köklü gösteren logo, renkler, tipografi ve görsel yön.',
    svc_3_t1:'Logo', svc_3_t2:'Renkler', svc_3_t3:'Tipografi',
    svc_4_h3:'Dijital büyüme',
    svc_4_p:'Dönüşüm odaklı yapı, net eylem çağrıları ve bulunmanız için SEO temelleri.',
    svc_4_t2:'Dönüşüm', svc_4_t3:'Eylem çağrıları',

    proc_eyebrow:'Nasıl çalışıyoruz',
    proc_h2:'Bir mesajdan yayındaki siteye.',
    proc_1_h3:'Bize yazın',        proc_1_p:'Tek bir WhatsApp mesajı yeter: işiniz, hedefleriniz, bütçeniz.',
    proc_2_h3:'48 saatte konsept', proc_2_p:'48 saat içinde siteniz için ilk görsel yönü gönderiyoruz.',
    proc_3_h3:'Yayın',             proc_3_p:'Birlikte son halini veriyor, sitenizi mobile hazır şekilde yayına alıyoruz.',

    work_eyebrow:'Projelerimiz',
    work_h2:'Gerçek projeler, yayında.',
    proj_0_tag:'Müşteri projesi · Yayında',
    proj_0_p:'Konakri, Gine\'de bir para transferi acentesi için web sitesi: 8 transfer ağı, çalışma saatleri, yol tarifi ve tek dokunuşla WhatsApp ve arama butonları.',
    proj_0_link:'Canlı siteyi gör →',
    next_h3:'Sıradaki proje sizinki mi?',
    next_p:'Klinik, restoran, ajans veya mağaza: işinizi anlatın, 48 saatte ilk konsepti alın.',
    next_link:'Proje başlat →',

    price_eyebrow:'Paketler',
    price_h2:'Üç başlangıç noktası.',
    price_p:'Her proje bir sohbetle başlar. Bütçenizi söyleyin, paketi size göre uyarlayalım.',
    plan_1_h3:'Starter', plan_1_price:'Açılış sayfası',
    plan_1_1:'1 premium sayfa', plan_1_2:'Duyarlı tasarım', plan_1_3:'Temel SEO', plan_1_4:'WhatsApp butonu',
    plan_2_popular:'En çok tercih edilen', plan_2_h3:'Premium', plan_2_price:'Web sitesi + marka',
    plan_2_1:'Çok bölümlü tam web sitesi', plan_2_2:'Premium görsel kimlik', plan_2_3:'Dönüşüm odaklı metinler', plan_2_4:'İletişim ve sosyal medya kurulumu',
    plan_3_h3:'Elite YZ', plan_3_price:'Tam sistem',
    plan_3_1:'Web sitesi + marka sistemi', plan_3_2:'YZ otomasyon iş akışı', plan_3_3:'Müşteri adayı stratejisi', plan_3_4:'Büyümeye hazır yapı',
    plan_btn:'Seç', plan_prefill:'Paket: {{plan}}',

    contact_eyebrow:'Projenizi başlatın',
    contact_h2:'Neye ihtiyacınız olduğunu anlatın.',
    contact_p:'Formu doldurun: WhatsApp, mesajınız hazır şekilde açılır.',
    contact_direct:'Ya da doğrudan yazın:',
    form_name_label:'Adınız', form_name_ph:'Örnek: Ahmet',
    form_biz_label:'İşletme türü', form_biz_ph:'Restoran, klinik, berber...',
    form_svc_label:'İstenen hizmet', form_svc_ph:'Bir hizmet seçin',
    form_svc_1:'Premium web sitesi', form_svc_2:'Marka kimliği', form_svc_3:'YZ otomasyonu', form_svc_4:'Tam dijital sistem',
    form_budget_label:'Tahmini bütçe', form_budget_ph:'Bir aralık seçin', form_budget_4:'Henüz emin değilim',
    form_details_label:'Proje detayları (isteğe bağlı)', form_details_ph:'Ne yapmak istediğinizi anlatın...',
    form_submit:'WhatsApp ile gönder',
    form_error:'Lütfen adınızı, işletmenizi, hizmeti ve bütçeyi girin.',
    form_ok:'WhatsApp açılıyor…',

    footer_tagline:'Web siteleri · Marka · YZ otomasyonu — İstanbul, Türkiye',

    wa_message:'Merhaba TIMBI AI,\n\nBir proje başlatmak istiyorum.\n\n👤 İsim: {{name}}\n🏢 İşletme: {{business}}\n🛠 Hizmet: {{service}}\n💰 Bütçe: {{budget}}\n\n📋 Detaylar:\n{{details}}\n\ntimbiai.com\'dan gönderildi',
  }
};

/* ══════════════════════════════════════════════════
   Engine
   ══════════════════════════════════════════════════ */
const SUPPORTED    = ['en','fr','tr'];
const DEFAULT_LANG = 'en';
const STORAGE_KEY  = 'timbi_lang';
const FLAGS = { en:'🇬🇧', fr:'🇫🇷', tr:'🇹🇷' };
const CODES = { en:'EN',   fr:'FR',   tr:'TR'  };

function store(key, value) {
  try { if (value === undefined) return localStorage.getItem(key); localStorage.setItem(key, value); }
  catch (e) { return null; }
  return null;
}

let currentLang = DEFAULT_LANG;

function detectLang() {
  const saved = store(STORAGE_KEY);
  if (saved && SUPPORTED.includes(saved)) return saved;
  const browser = (navigator.language || '').slice(0,2).toLowerCase();
  return SUPPORTED.includes(browser) ? browser : DEFAULT_LANG;
}

function applyTranslations(lang) {
  const t = translations[lang];
  if (!t) return;
  currentLang = lang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const v = t[el.dataset.i18n];
    if (v !== undefined) el.textContent = v;
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const v = t[el.dataset.i18nPh];
    if (v !== undefined) el.placeholder = v;
  });

  document.documentElement.lang = lang;

  const flagEl = document.getElementById('currentFlag');
  const codeEl = document.getElementById('currentCode');
  if (flagEl) flagEl.textContent = FLAGS[lang];
  if (codeEl) codeEl.textContent = CODES[lang];

  document.querySelectorAll('.lang-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

function switchLang(lang) {
  if (!SUPPORTED.includes(lang)) return;
  const main = document.getElementById('mainContent');
  if (main) { main.style.transition = 'opacity .18s ease'; main.style.opacity = '0'; }
  setTimeout(() => {
    applyTranslations(lang);
    store(STORAGE_KEY, lang);
    if (main) main.style.opacity = '1';
  }, 180);
}

/* Public API used by script.js */
window.getCurrentLang = () => currentLang;
window.getTranslation = key => (translations[currentLang] && translations[currentLang][key]) || '';

document.addEventListener('DOMContentLoaded', () => {
  const switcher = document.getElementById('langSwitch');
  const toggle   = document.getElementById('langToggle');

  applyTranslations(detectLang());

  toggle?.addEventListener('click', e => {
    e.stopPropagation();
    const open = switcher.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });

  document.addEventListener('click', () => {
    switcher?.classList.remove('open');
    toggle?.setAttribute('aria-expanded', 'false');
  });

  document.querySelectorAll('.lang-option').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      switchLang(btn.dataset.lang);
      switcher?.classList.remove('open');
      toggle?.setAttribute('aria-expanded', 'false');
    });
  });
});
