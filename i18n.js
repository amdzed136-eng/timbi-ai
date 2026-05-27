'use strict';

/* ══════════════════════════════════════════════════════
   TIMBI AI — i18n Multilingual System
   Languages : FR (défaut) · EN · TR
   Architecture : data-i18n | data-i18n-ph | options
   ══════════════════════════════════════════════════════ */

const translations = {

  /* ─────────────────── FRANÇAIS (défaut) ─────────────── */
  fr: {
    nav_home:'Accueil', nav_why:'Pourquoi nous', nav_services:'Services',
    nav_work:'Portfolio', nav_pricing:'Offres', nav_process:'Processus',
    nav_cta:'Démarrer un projet',

    hero_eyebrow:'SITES WEB IA · BRANDING · AUTOMATISATION',
    hero_h1_main:'Nous créons des marques IA qui',
    hero_h1_accent:' ont l\'air premium.',
    hero_text:'TIMBI AI conçoit des sites web haut de gamme, des identités de marque percutantes et des systèmes d\'automatisation intelligents pour les entreprises prêtes à paraître professionnelles, gagner du temps et croître plus vite.',
    hero_btn_primary:'Démarrer un projet', hero_btn_secondary:'Voir le portfolio',
    trust_1_label:'Aperçu concept', trust_2_label:'Design responsive',
    trust_3_val:'IA', trust_3_label:'Automation-ready',

    logos_1:'Cliniques médicales', logos_2:'Restaurants', logos_3:'Immobilier',
    logos_4:'Marques beauté', logos_5:'Services locaux', logos_6:'E-commerce',

    why_eyebrow:'La différence TIMBI',
    why_h1:'Pourquoi les marques choisissent',
    why_h1_accent:'TIMBI AI.',
    why_text:'Nous combinons une esthétique premium avec des systèmes intelligents pour créer des expériences digitales qui font vraiment croître votre entreprise — pas seulement belles en screenshot.',
    stat_1_label:'Aperçu Concept',   stat_1_desc:'Du brief au premier design',
    stat_2_label:'Mobile-First',      stat_2_desc:'Chaque pixel, chaque écran',
    stat_3_label:'Lift Conversion Moy.', stat_3_desc:'vs sites DIY génériques',
    stat_4_label:'Types de Métiers',  stat_4_desc:'Des cliniques aux restaurants',
    card_1_h3:'Conçu pour les résultats, pas seulement l\'esthétique',
    card_1_p:'Chaque mise en page, titre et appel à l\'action est conçu pour convertir les visiteurs en clients payants. Le design est le medium — la croissance est l\'objectif.',
    card_2_h3:'Natif IA dès le premier jour',
    card_2_p:'L\'automatisation, la capture de leads et les workflows intelligents sont intégrés dès le départ. Votre système digital fonctionne 24h/24 pour que vous n\'ayez pas à le faire.',
    card_3_h3:'Premium, rapide et personnel',
    card_3_p:'Pas d\'agence lente, pas de file d\'attente. Accès direct via WhatsApp, livraison rapide et une expérience sur-mesure qui reflète la qualité de votre marque.',
    badge_1:'⚡ Concept en 48h', badge_2:'🤖 Systèmes IA', badge_3:'📱 Mobile-First',
    badge_4:'💬 Accès WhatsApp Direct', badge_5:'✦ Qualité Premium',
    badge_6:'🌍 Standards Mondiaux', badge_7:'🔒 Propriété Complète Livrée',
    badge_8:'🚀 Code Prêt au Lancement',

    svc_eyebrow:'Ce que nous construisons',
    svc_h2:'Systèmes digitaux premium conçus pour convertir.',
    svc_p:'Pas juste un beau site. Une présence en ligne complète conçue pour donner à votre entreprise une image sérieuse et digne de confiance.',
    svc_1_h3:'Design Web Premium', svc_1_p:'Pages d\'atterrissage et sites d\'entreprise haut de gamme avec des mises en page épurées, des textes forts et une expérience mobile fluide.',
    svc_2_h3:'Automatisation IA',  svc_2_p:'Réponses clients automatisées, capture de leads, suivi et workflows qui économisent du temps et réduisent le travail manuel.',
    svc_3_h3:'Identité de Marque', svc_3_p:'Couleurs, typographie, positionnement et direction visuelle qui font paraître votre entreprise premium dès le premier jour.',
    svc_4_h3:'Croissance Digitale', svc_4_p:'Structure axée sur la conversion, appels à l\'action, bases SEO et sections prêtes pour les réseaux sociaux pour une meilleure visibilité.',

    work_eyebrow:'Concepts portfolio',
    work_h2:'Conçu pour les entreprises qui veulent se démarquer.',
    work_p:'Exemples de directions que TIMBI AI peut construire et adapter pour de vraies marques.',
    proj_1_tag:'Service Luxe',   proj_1_h3:'Site Web Barbershop Premium',
    proj_1_p:'Page d\'accueil axée réservation avec visuels forts, tarifs, avis et capture de leads WhatsApp.',
    proj_2_tag:'Santé',          proj_2_h3:'Page Clinique Médicale',
    proj_2_p:'Design axé confiance avec services, avis et CTA de rendez-vous.',
    proj_3_tag:'Restauration',   proj_3_h3:'Système de Marque Restaurant',
    proj_3_p:'Identité visuelle, page menu, contenus réseaux sociaux et intégration livraison.',
    proj_4_tag:'Immobilier',     proj_4_h3:'Site Agence Immobilière',
    proj_4_p:'Pages de listings épurées, formulaires de contact et positionnement de marque premium.',
    proj_5_tag:'Système IA',     proj_5_h3:'Tableau de Bord Automatisation',
    proj_5_p:'Gestion des leads, réponses intelligentes et vue d\'ensemble des workflows pour petites équipes.',

    price_eyebrow:'Offres',
    price_h2:'Des forfaits simples pour des entreprises sérieuses.',
    price_p:'Points de départ clairs. Chaque projet peut être personnalisé selon l\'objectif métier.',
    plan_1_h3:'Starter', plan_1_price:'Page d\'Atterrissage',
    plan_1_1:'1 page premium', plan_1_2:'Design responsive',
    plan_1_3:'Configuration SEO de base', plan_1_4:'CTA WhatsApp',
    plan_1_btn:'Demander Starter',
    plan_2_popular:'Le plus demandé', plan_2_h3:'Premium', plan_2_price:'Site Web + Marque',
    plan_2_1:'Site multi-sections', plan_2_2:'Identité visuelle premium',
    plan_2_3:'Copywriting conversion', plan_2_4:'Configuration contact & réseaux',
    plan_2_btn:'Demander Premium',
    plan_3_h3:'Elite IA', plan_3_price:'Système Complet',
    plan_3_1:'Site web + système de marque', plan_3_2:'Workflow d\'automatisation IA',
    plan_3_3:'Stratégie de capture de leads', plan_3_4:'Structure prête à la croissance',
    plan_3_btn:'Demander Elite',

    proc_eyebrow:'Processus', proc_h2:'De l\'idée au lancement sans confusion.',
    proc_1_h3:'Stratégie', proc_1_p:'On définit votre offre, audience, direction de marque et objectif de conversion.',
    proc_2_h3:'Design',    proc_2_p:'On crée le look premium : mise en page, visuels, textes et parcours utilisateur.',
    proc_3_h3:'Développement', proc_3_p:'On développe une expérience web rapide, responsive et soignée.',
    proc_4_h3:'Lancement', proc_4_p:'On prépare votre site pour de vrais clients, du trafic et une croissance future.',

    about_eyebrow:'À propos de TIMBI AI',
    about_h2:'Né d\'une vision, conçu pour le futur.',
    about_p:'TIMBI AI est une marque digitale basée à Istanbul, spécialisée dans la création d\'expériences web intelligentes pour les entreprises modernes. La mission est simple : faire paraître les marques premium, fonctionner plus intelligemment et convertir plus de visiteurs en clients.',

    cta_eyebrow:'Prêt à élever votre marque ?',
    cta_h2_main:'Votre système digital premium',
    cta_h2_accent:'commence ici.',
    cta_p:'Rejoignez les entreprises qui ont choisi de paraître professionnelles, d\'automatiser plus intelligemment et de croître plus vite avec TIMBI AI.',
    cta_btn_primary:'Démarrer un projet', cta_btn_wa:'Discuter sur WhatsApp',

    contact_eyebrow:'Démarrez votre projet',
    contact_h2:'Dites-nous ce dont vous avez besoin. On préparera la direction premium.',
    contact_p:'Remplissez ce formulaire de projet et WhatsApp s\'ouvrira avec un message professionnel propre déjà préparé.',
    contact_hl_1:'Décrivez votre entreprise', contact_hl_2:'Choisissez votre service',
    contact_hl_3:'Envoyez directement sur WhatsApp',
    form_name_label:'Votre nom',        form_name_ph:'Exemple : Amadou',
    form_biz_label:'Type d\'entreprise', form_biz_ph:'Restaurant, clinique, barbershop...',
    form_svc_label:'Service souhaité',  form_svc_ph:'Choisissez un service',
    form_svc_1:'Site Web Premium', form_svc_2:'Identité de Marque',
    form_svc_3:'Automatisation IA', form_svc_4:'Système Digital Complet',
    form_budget_label:'Budget estimé',  form_budget_ph:'Choisissez une fourchette',
    form_budget_1:'200$ – 500$', form_budget_2:'500$ – 1 000$',
    form_budget_3:'1 000$+',     form_budget_4:'Pas encore décidé',
    form_details_label:'Détails du projet',
    form_details_ph:'Dites-nous ce que vous voulez construire...',
    form_submit:'Envoyer via WhatsApp',
    form_note:'Votre message s\'ouvrira directement dans WhatsApp. Rapide et professionnel.',

    wa_label:'WhatsApp',
    footer_tagline:'Sites Web IA · Branding · Automatisation',
    footer_home:'Accueil', footer_why:'Pourquoi nous', footer_services:'Services',
    footer_pricing:'Tarifs', footer_contact:'Contact',
    footer_location:'📍 Istanbul, Türkiye',

    wa_message:'Bonjour TIMBI AI,\n\nJe souhaite démarrer un projet.\n\n👤 Nom : {{name}}\n🏢 Type d\'entreprise : {{business}}\n🛠 Service souhaité : {{service}}\n💰 Budget estimé : {{budget}}\n\n📋 Détails du projet :\n{{details}}\n\nEnvoyé depuis timbiai.com',
  },

  /* ─────────────────── ENGLISH ─────────────────── */
  en: {
    nav_home:'Home', nav_why:'Why Us', nav_services:'Services',
    nav_work:'Work', nav_pricing:'Offers', nav_process:'Process',
    nav_cta:'Start a Project',

    hero_eyebrow:'AI WEBSITES · BRANDING · AUTOMATION',
    hero_h1_main:'We build AI-powered brands that',
    hero_h1_accent:' look expensive.',
    hero_text:'TIMBI AI creates premium websites, sharp brand identities and intelligent automation systems for businesses ready to look professional, save time and grow faster.',
    hero_btn_primary:'Start a Project', hero_btn_secondary:'View Work',
    trust_1_label:'Fast concept preview', trust_2_label:'Responsive design',
    trust_3_val:'AI', trust_3_label:'Automation-ready',

    logos_1:'Medical clinics', logos_2:'Restaurants', logos_3:'Real estate',
    logos_4:'Beauty brands', logos_5:'Local services', logos_6:'E-commerce',

    why_eyebrow:'The TIMBI difference',
    why_h1:'Why brands choose',
    why_h1_accent:'TIMBI AI.',
    why_text:'We combine premium aesthetics with intelligent systems to deliver digital experiences that actually grow your business — not just look good in a screenshot.',
    stat_1_label:'Concept Preview',      stat_1_desc:'From brief to first design',
    stat_2_label:'Mobile-First',          stat_2_desc:'Every pixel, every screen',
    stat_3_label:'Avg. Conversion Lift', stat_3_desc:'vs generic DIY websites',
    stat_4_label:'Business Types Served', stat_4_desc:'From clinics to restaurants',
    card_1_h3:'Built for results, not just aesthetics',
    card_1_p:'Every layout, headline and call-to-action is engineered to convert visitors into paying clients. Beautiful design is the medium — growth is the goal.',
    card_2_h3:'AI-native from day one',
    card_2_p:'Automation, lead capture and smart workflows are baked in from the start. Your digital system works 24/7 so you don\'t have to.',
    card_3_h3:'Premium, fast and personal',
    card_3_p:'No slow agencies, no waiting queues. Direct WhatsApp access, fast turnaround and a white-glove experience that reflects the quality of your brand.',
    badge_1:'⚡ 48h Concept Delivery', badge_2:'🤖 AI-Powered Systems',
    badge_3:'📱 Mobile-First Design',  badge_4:'💬 WhatsApp Direct Access',
    badge_5:'✦ Premium Quality',       badge_6:'🌍 Global Standards',
    badge_7:'🔒 Full Ownership Delivered', badge_8:'🚀 Launch-Ready Code',

    svc_eyebrow:'What we build',
    svc_h2:'Premium digital systems made to convert.',
    svc_p:'Not just a pretty website. A complete online presence designed to make your business look serious and trustworthy.',
    svc_1_h3:'Premium Web Design', svc_1_p:'High-end landing pages and business websites with clean layouts, strong copy and smooth mobile experience.',
    svc_2_h3:'AI Automation',      svc_2_p:'Automated client replies, lead capture, follow-ups and workflows that save time and reduce manual work.',
    svc_3_h3:'Brand Identity',     svc_3_p:'Colors, typography, positioning and visual direction that make your company feel premium from day one.',
    svc_4_h3:'Digital Growth',     svc_4_p:'Conversion-focused structure, calls-to-action, SEO foundations and social-ready sections for better visibility.',

    work_eyebrow:'Portfolio concepts',
    work_h2:'Designed for businesses that want to stand out.',
    work_p:'Example directions TIMBI AI can build and adapt for real brands.',
    proj_1_tag:'Luxury Service', proj_1_h3:'Premium Barber Website',
    proj_1_p:'Booking-focused homepage with strong visuals, prices, reviews and WhatsApp lead capture.',
    proj_2_tag:'Healthcare',     proj_2_h3:'Medical Clinic Landing Page',
    proj_2_p:'Trust-first design with services, reviews and appointment CTA.',
    proj_3_tag:'Food & Beverage', proj_3_h3:'Restaurant Brand System',
    proj_3_p:'Visual identity, menu page, social-ready assets and delivery integration.',
    proj_4_tag:'Real Estate',    proj_4_h3:'Property Agency Website',
    proj_4_p:'Clean listing pages, lead forms and premium brand positioning.',
    proj_5_tag:'AI System',      proj_5_h3:'Automation Dashboard',
    proj_5_p:'Lead management, smart responses and workflow overview for small teams.',

    price_eyebrow:'Offers',
    price_h2:'Simple packages for serious businesses.',
    price_p:'Clear starting points. Each project can be customized depending on the business goal.',
    plan_1_h3:'Starter', plan_1_price:'Landing Page',
    plan_1_1:'1 premium page', plan_1_2:'Responsive design',
    plan_1_3:'Basic SEO setup', plan_1_4:'WhatsApp CTA',
    plan_1_btn:'Ask for Starter',
    plan_2_popular:'Most requested', plan_2_h3:'Premium', plan_2_price:'Website + Brand',
    plan_2_1:'Multi-section website', plan_2_2:'Premium visual identity',
    plan_2_3:'Conversion copywriting', plan_2_4:'Contact & social setup',
    plan_2_btn:'Ask for Premium',
    plan_3_h3:'Elite AI', plan_3_price:'Full System',
    plan_3_1:'Website + brand system', plan_3_2:'AI automation workflow',
    plan_3_3:'Lead capture strategy', plan_3_4:'Growth-ready structure',
    plan_3_btn:'Ask for Elite',

    proc_eyebrow:'Process', proc_h2:'From idea to launch without confusion.',
    proc_1_h3:'Strategy', proc_1_p:'We define your offer, audience, brand direction and conversion goal.',
    proc_2_h3:'Design',   proc_2_p:'We create the premium look: layout, visuals, copy and user flow.',
    proc_3_h3:'Build',    proc_3_p:'We develop a fast, responsive and polished website experience.',
    proc_4_h3:'Launch',   proc_4_p:'We prepare your site for real clients, traffic and future growth.',

    about_eyebrow:'About TIMBI AI',
    about_h2:'Built from vision, designed for the future.',
    about_p:'TIMBI AI is a digital brand based in Istanbul, focused on building intelligent web experiences for modern businesses. The mission is simple: make brands look premium, operate smarter and convert more visitors into clients.',

    cta_eyebrow:'Ready to elevate your brand?',
    cta_h2_main:'Your premium digital system',
    cta_h2_accent:'starts here.',
    cta_p:'Join businesses that chose to look professional, automate smarter and grow faster with TIMBI AI.',
    cta_btn_primary:'Start a Project', cta_btn_wa:'Chat on WhatsApp',

    contact_eyebrow:'Start your project',
    contact_h2:'Tell us what you need. We\'ll prepare the premium direction.',
    contact_p:'Fill this quick project form and WhatsApp will open with a clean professional message already prepared.',
    contact_hl_1:'Describe your business', contact_hl_2:'Choose your service',
    contact_hl_3:'Send directly on WhatsApp',
    form_name_label:'Your name',    form_name_ph:'Example: Amadou',
    form_biz_label:'Business type', form_biz_ph:'Restaurant, clinic, barber...',
    form_svc_label:'Service needed', form_svc_ph:'Choose a service',
    form_svc_1:'Premium Website', form_svc_2:'Brand Identity',
    form_svc_3:'AI Automation',   form_svc_4:'Full Digital System',
    form_budget_label:'Estimated budget', form_budget_ph:'Choose budget range',
    form_budget_1:'$200 – $500', form_budget_2:'$500 – $1,000',
    form_budget_3:'$1,000+',     form_budget_4:'Not sure yet',
    form_details_label:'Project details',
    form_details_ph:'Tell us what you want to build...',
    form_submit:'Send via WhatsApp',
    form_note:'Your message will open directly in WhatsApp. Fast & professional.',

    wa_label:'WhatsApp',
    footer_tagline:'AI Websites · Branding · Automation',
    footer_home:'Home', footer_why:'Why Us', footer_services:'Services',
    footer_pricing:'Pricing', footer_contact:'Contact',
    footer_location:'📍 Istanbul, Türkiye',

    wa_message:'Hello TIMBI AI,\n\nI want to start a project.\n\n👤 Name: {{name}}\n🏢 Business type: {{business}}\n🛠 Service needed: {{service}}\n💰 Estimated budget: {{budget}}\n\n📋 Project details:\n{{details}}\n\nSent from timbiai.com',
  },

  /* ─────────────────── TÜRKÇE ─────────────────── */
  tr: {
    nav_home:'Anasayfa', nav_why:'Neden Biz', nav_services:'Hizmetler',
    nav_work:'Portföy', nav_pricing:'Fiyatlar', nav_process:'Süreç',
    nav_cta:'Proje Başlat',

    hero_eyebrow:'YAPAY ZEKA WEB · MARKA · OTOMASYON',
    hero_h1_main:'Yapay zeka destekli markalar inşa ediyoruz,',
    hero_h1_accent:' premium görünümlü.',
    hero_text:'TIMBI AI; profesyonel görünmek, zaman kazanmak ve daha hızlı büyümek isteyen işletmeler için premium web siteleri, güçlü marka kimlikleri ve akıllı otomasyon sistemleri tasarlıyor.',
    hero_btn_primary:'Proje Başlat', hero_btn_secondary:'Çalışmaları Gör',
    trust_1_label:'Hızlı konsept önizleme', trust_2_label:'Responsive tasarım',
    trust_3_val:'YZ', trust_3_label:'Otomasyona hazır',

    logos_1:'Tıp klinikleri', logos_2:'Restoranlar', logos_3:'Gayrimenkul',
    logos_4:'Güzellik markaları', logos_5:'Yerel hizmetler', logos_6:'E-ticaret',

    why_eyebrow:'TIMBI farkı',
    why_h1:'Markalar neden tercih ediyor',
    why_h1_accent:'TIMBI AI.',
    why_text:'Premium estetiği akıllı sistemlerle birleştirerek işinizi gerçekten büyüten dijital deneyimler sunuyoruz — sadece ekran görüntüsünde güzel görünen değil.',
    stat_1_label:'Konsept Önizleme',   stat_1_desc:'Brieften ilk tasarıma',
    stat_2_label:'Mobil-Öncelikli',    stat_2_desc:'Her piksel, her ekran',
    stat_3_label:'Ort. Dönüşüm Artışı', stat_3_desc:'vs genel DIY siteleri',
    stat_4_label:'Hizmet Verilen Sektör', stat_4_desc:'Klinikten restorana',
    card_1_h3:'Sonuçlar için inşa edildi, yalnızca estetik için değil',
    card_1_p:'Her düzen, başlık ve eylem çağrısı, ziyaretçileri müşteriye dönüştürmek için tasarlanmıştır. Güzel tasarım araçtır — büyüme hedeftir.',
    card_2_h3:'Başından itibaren yapay zeka öncelikli',
    card_2_p:'Otomasyon, müşteri adayı yakalama ve akıllı iş akışları baştan entegre edilmiştir. Dijital sisteminiz 7/24 çalışır, böylece siz çalışmak zorunda kalmazsınız.',
    card_3_h3:'Premium, hızlı ve kişisel',
    card_3_p:'Yavaş ajanslar yok, bekleme kuyruğu yok. Doğrudan WhatsApp erişimi, hızlı teslimat ve markanızın kalitesini yansıtan özel bir deneyim.',
    badge_1:'⚡ 48s Konsept Teslimatı', badge_2:'🤖 YZ Destekli Sistemler',
    badge_3:'📱 Mobil-Öncelikli Tasarım', badge_4:'💬 Doğrudan WhatsApp',
    badge_5:'✦ Premium Kalite',          badge_6:'🌍 Global Standartlar',
    badge_7:'🔒 Tam Mülkiyet Teslimi',   badge_8:'🚀 Yayına Hazır Kod',

    svc_eyebrow:'Ne inşa ediyoruz',
    svc_h2:'Dönüşüm için tasarlanmış premium dijital sistemler.',
    svc_p:'Sadece güzel bir web sitesi değil. İşletmenizi ciddi ve güvenilir göstermek için tasarlanmış eksiksiz bir çevrimiçi varlık.',
    svc_1_h3:'Premium Web Tasarımı', svc_1_p:'Temiz düzenler, güçlü içerik ve sorunsuz mobil deneyimle yüksek kaliteli açılış sayfaları ve kurumsal web siteleri.',
    svc_2_h3:'YZ Otomasyonu',        svc_2_p:'Zaman kazandıran ve manuel çalışmayı azaltan otomatik müşteri yanıtları, müşteri adayı yakalama ve iş akışları.',
    svc_3_h3:'Marka Kimliği',        svc_3_p:'İlk günden itibaren şirketinizi premium hissettiren renkler, tipografi, konumlandırma ve görsel yön.',
    svc_4_h3:'Dijital Büyüme',       svc_4_p:'Dönüşüm odaklı yapı, eylem çağrıları, SEO temelleri ve daha iyi görünürlük için sosyal medyaya hazır bölümler.',

    work_eyebrow:'Portföy konseptleri',
    work_h2:'Öne çıkmak isteyen işletmeler için tasarlandı.',
    work_p:'TIMBI AI\'ın gerçek markalar için inşa edip uyarlayabileceği örnek yönler.',
    proj_1_tag:'Lüks Hizmet',   proj_1_h3:'Premium Berber Web Sitesi',
    proj_1_p:'Güçlü görseller, fiyatlar, yorumlar ve WhatsApp müşteri adayı yakalamayla rezervasyona odaklı ana sayfa.',
    proj_2_tag:'Sağlık',        proj_2_h3:'Tıp Kliniği Açılış Sayfası',
    proj_2_p:'Hizmetler, yorumlar ve randevu CTA\'sıyla güvene odaklı tasarım.',
    proj_3_tag:'Yiyecek & İçecek', proj_3_h3:'Restoran Marka Sistemi',
    proj_3_p:'Görsel kimlik, menü sayfası, sosyal medyaya hazır içerikler ve teslimat entegrasyonu.',
    proj_4_tag:'Gayrimenkul',   proj_4_h3:'Emlak Acentesi Web Sitesi',
    proj_4_p:'Temiz ilan sayfaları, iletişim formları ve premium marka konumlandırması.',
    proj_5_tag:'YZ Sistemi',    proj_5_h3:'Otomasyon Panosu',
    proj_5_p:'Küçük ekipler için müşteri adayı yönetimi, akıllı yanıtlar ve iş akışı genel görünümü.',

    price_eyebrow:'Fiyatlar',
    price_h2:'Ciddi işletmeler için basit paketler.',
    price_p:'Net başlangıç noktaları. Her proje iş hedefine göre özelleştirilebilir.',
    plan_1_h3:'Başlangıç', plan_1_price:'Açılış Sayfası',
    plan_1_1:'1 premium sayfa', plan_1_2:'Responsive tasarım',
    plan_1_3:'Temel SEO kurulumu', plan_1_4:'WhatsApp CTA',
    plan_1_btn:'Başlangıç İste',
    plan_2_popular:'En çok tercih edilen', plan_2_h3:'Premium', plan_2_price:'Web Sitesi + Marka',
    plan_2_1:'Çok bölümlü web sitesi', plan_2_2:'Premium görsel kimlik',
    plan_2_3:'Dönüşüm odaklı içerik', plan_2_4:'İletişim ve sosyal medya kurulumu',
    plan_2_btn:'Premium İste',
    plan_3_h3:'Elite YZ', plan_3_price:'Tam Sistem',
    plan_3_1:'Web sitesi + marka sistemi', plan_3_2:'YZ otomasyon iş akışı',
    plan_3_3:'Müşteri adayı yakalama stratejisi', plan_3_4:'Büyümeye hazır yapı',
    plan_3_btn:'Elite İste',

    proc_eyebrow:'Süreç', proc_h2:'Fikirden lansmana, karmaşa olmadan.',
    proc_1_h3:'Strateji',     proc_1_p:'Teklifinizi, hedef kitlenizi, marka yönünüzü ve dönüşüm hedefinizi tanımlıyoruz.',
    proc_2_h3:'Tasarım',      proc_2_p:'Premium görünümü oluşturuyoruz: düzen, görseller, içerik ve kullanıcı akışı.',
    proc_3_h3:'Geliştirme',   proc_3_p:'Hızlı, responsive ve cilalanmış bir web sitesi deneyimi geliştiriyoruz.',
    proc_4_h3:'Lansman',      proc_4_p:'Sitenizi gerçek müşteriler, trafik ve gelecekteki büyüme için hazırlıyoruz.',

    about_eyebrow:'TIMBI AI Hakkında',
    about_h2:'Vizyondan doğdu, geleceğe tasarlandı.',
    about_p:'TIMBI AI, İstanbul merkezli bir dijital marka olup modern işletmeler için akıllı web deneyimleri oluşturmaya odaklanmaktadır. Misyon basit: markaları premium göstermek, daha akıllı çalışmalarını sağlamak ve daha fazla ziyaretçiyi müşteriye dönüştürmek.',

    cta_eyebrow:'Markanızı yükseltmeye hazır mısınız?',
    cta_h2_main:'Premium dijital sisteminiz',
    cta_h2_accent:'burada başlıyor.',
    cta_p:'TIMBI AI ile profesyonel görünmeyi, daha akıllı otomasyonu ve daha hızlı büyümeyi seçen işletmelere katılın.',
    cta_btn_primary:'Proje Başlat', cta_btn_wa:'WhatsApp\'tan Yaz',

    contact_eyebrow:'Projenizi başlatın',
    contact_h2:'Ne ihtiyacınız olduğunu söyleyin. Premium yönü hazırlayacağız.',
    contact_p:'Bu hızlı proje formunu doldurun, WhatsApp hazır profesyonel bir mesajla açılacak.',
    contact_hl_1:'İşletmenizi tanımlayın', contact_hl_2:'Hizmetinizi seçin',
    contact_hl_3:'Doğrudan WhatsApp\'ta gönderin',
    form_name_label:'Adınız',        form_name_ph:'Örnek: Ahmet',
    form_biz_label:'İşletme türü',   form_biz_ph:'Restoran, klinik, berber...',
    form_svc_label:'İstenen hizmet', form_svc_ph:'Bir hizmet seçin',
    form_svc_1:'Premium Web Sitesi', form_svc_2:'Marka Kimliği',
    form_svc_3:'YZ Otomasyonu',      form_svc_4:'Tam Dijital Sistem',
    form_budget_label:'Tahmini bütçe', form_budget_ph:'Bütçe aralığı seçin',
    form_budget_1:'200$ – 500$', form_budget_2:'500$ – 1.000$',
    form_budget_3:'1.000$+',     form_budget_4:'Henüz emin değilim',
    form_details_label:'Proje detayları',
    form_details_ph:'Ne inşa etmek istediğinizi söyleyin...',
    form_submit:'WhatsApp ile Gönder',
    form_note:'Mesajınız doğrudan WhatsApp\'ta açılacak. Hızlı ve profesyonel.',

    wa_label:'WhatsApp',
    footer_tagline:'YZ Web Siteleri · Marka · Otomasyon',
    footer_home:'Anasayfa', footer_why:'Neden Biz', footer_services:'Hizmetler',
    footer_pricing:'Fiyatlar', footer_contact:'İletişim',
    footer_location:'📍 İstanbul, Türkiye',

    wa_message:'Merhaba TIMBI AI,\n\nBir proje başlatmak istiyorum.\n\n👤 İsim: {{name}}\n🏢 İşletme türü: {{business}}\n🛠 İstenen hizmet: {{service}}\n💰 Tahmini bütçe: {{budget}}\n\n📋 Proje detayları:\n{{details}}\n\ntimbiai.com\'dan gönderildi',
  }
};

/* ══════════════════════════════════════════════════════
   i18n Engine
   ══════════════════════════════════════════════════════ */

const STORAGE_KEY  = 'timbi_lang';
const SUPPORTED    = ['fr', 'en', 'tr'];
const DEFAULT_LANG = 'fr';

const FLAGS = { fr: '🇫🇷', en: '🇬🇧', tr: '🇹🇷' };
const CODES = { fr: 'FR',   en: 'EN',   tr: 'TR'  };

/* Detect best language for visitor */
function detectLanguage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && SUPPORTED.includes(saved)) return saved;
  const browser = (navigator.language || '').slice(0, 2).toLowerCase();
  return SUPPORTED.includes(browser) ? browser : DEFAULT_LANG;
}

/* Apply all translations to the DOM */
function applyTranslations(lang) {
  const t = translations[lang];
  if (!t) return;

  /* textContent elements */
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const v = t[el.dataset.i18n];
    if (v !== undefined) el.textContent = v;
  });

  /* placeholder attributes */
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const v = t[el.dataset.i18nPh];
    if (v !== undefined) el.placeholder = v;
  });

  /* select options via data-i18n on each option */
  document.querySelectorAll('select option[data-i18n]').forEach(opt => {
    const v = t[opt.dataset.i18n];
    if (v !== undefined) opt.textContent = v;
  });

  /* html lang attribute */
  document.documentElement.lang = lang;

  /* update switcher UI */
  const flagEl = document.getElementById('currentFlag');
  const codeEl = document.getElementById('currentCode');
  if (flagEl) flagEl.textContent = FLAGS[lang];
  if (codeEl) codeEl.textContent = CODES[lang];

  document.querySelectorAll('.lang-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

/* Switch with smooth fade transition */
function switchLanguage(lang) {
  if (!SUPPORTED.includes(lang)) return;
  const main = document.getElementById('mainContent');
  if (main) {
    main.style.transition = 'opacity .18s ease, transform .18s ease';
    main.style.opacity    = '0';
    main.style.transform  = 'translateY(5px)';
  }
  setTimeout(() => {
    applyTranslations(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    if (main) {
      main.style.opacity   = '1';
      main.style.transform = 'translateY(0)';
    }
  }, 180);
}

/* Get current language (used by script.js for WA message) */
window.getCurrentLang = () => localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
window.getTranslation = (key) => {
  const lang = window.getCurrentLang();
  return (translations[lang] && translations[lang][key]) || '';
};

/* Init */
document.addEventListener('DOMContentLoaded', () => {
  const lang       = detectLanguage();
  const langSwitch = document.getElementById('langSwitch');
  const langToggle = document.getElementById('langToggle');

  applyTranslations(lang);

  /* Toggle dropdown */
  if (langToggle) {
    langToggle.addEventListener('click', e => {
      e.stopPropagation();
      const isOpen = langSwitch.classList.toggle('open');
      langToggle.setAttribute('aria-expanded', isOpen);
    });
  }

  /* Close on outside click */
  document.addEventListener('click', () => {
    langSwitch?.classList.remove('open');
    langToggle?.setAttribute('aria-expanded', 'false');
  });

  /* Option click */
  document.querySelectorAll('.lang-option').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      switchLanguage(btn.dataset.lang);
      langSwitch?.classList.remove('open');
      langToggle?.setAttribute('aria-expanded', 'false');
    });
  });
});
