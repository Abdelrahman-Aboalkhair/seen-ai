import { useState, useEffect } from "react";

// Types for translations
export type Language = "ar" | "en";
export type TranslationKey = keyof typeof translations.ar;

// Translation strings
const translations = {
  ar: {
    // Navigation
    "nav.home": "الرئيسية",
    "nav.features": "الميزات",
    "nav.pricing": "الأسعار",
    "nav.contact": "تواصل معنا",
    "nav.about": "من نحن",
    "nav.dashboard": "لوحة التحكم",
    "nav.login": "تسجيل الدخول",
    "nav.signup": "ابدأ مجاناً",
    "nav.logout": "تسجيل الخروج",
    "nav.services": "الخدمات",
    "nav.register": "إنشاء حساب",
    "nav.privacy": "سياسة الخصوصية",
    "nav.terms": "شروط الخدمة",

    // Credit system
    "credit.balance": "كريديت",
    "credit.low_balance": "رصيد منخفض",
    "credit.buy_more": "شراء المزيد من الكريديت",
    "credit.insufficient": "رصيد كريديت غير كافي",
    "credit.loading": "جاري التحميل...",

    // Pricing
    "pricing.title": "اختر الحزمة المناسبة لك",
    "pricing.subtitle":
      "حزم مرنة وفعالة لتلبية جميع احتياجاتك في التوظيف والبحث عن المواهب",
    "pricing.popular": "الأكثر شعبية",
    "pricing.buy_now": "اشتري الآن",
    "pricing.purchasing": "جاري الشراء...",
    "pricing.free_signup_credits": "كريديت مجاني عند التسجيل",
    "pricing.referral_credits": "كريديت عند إحالة صديق",

    // Dashboard
    "dashboard.overview": "نظرة عامة",
    "dashboard.cv_analysis": "تحليل السير الذاتية",
    "dashboard.cv_analysis_history": "سجل تحليل السير الذاتية",
    "dashboard.talent_search": "البحث عن المرشحين",
    "dashboard.talent_search_history": "سجل البحث عن المواهب",
    "dashboard.credit_history": "سجل الكريديت",
    "dashboard.settings": "الإعدادات",
    "dashboard.total_searches": "إجمالي البحث",
    "dashboard.total_analyses": "إجمالي التحليلات",
    "dashboard.credit_usage": "استهلاك الكريديت",

    // Services
    "services.cv_analysis.title": "تحليل السير الذاتية",
    "services.cv_analysis.description":
      "تحليل ذكي للسير الذاتية باستخدام الذكاء الاصطناعي",
    "services.cv_analysis.cost": "كريديت لكل تحليل",
    "services.talent_search.title": "البحث عن المرشحين",
    "services.talent_search.description": "بحث متقدم عن أفضل المواهب",
    "services.talent_search.cost": "كريديت لكل بحث",

    // Forms
    "form.email": "البريد الإلكتروني",
    "form.password": "كلمة المرور",
    "form.full_name": "الاسم الكامل",
    "form.submit": "إرسال",
    "form.loading": "جاري التحميل...",

    // Messages
    "message.success": "تم بنجاح!",
    "message.error": "حدث خطأ",
    "message.welcome": "مرحباً بك",
    "message.goodbye": "مع السلامة",

    // Company info
    "company.name": "SEEN AI HR Solutions",
    "company.tagline": "منصة ذكية لاكتشاف وتحليل المواهب",
    "company.description":
      "حلول الذكاء الاصطناعي المتقدمة لاكتشاف وتحليل المواهب. نهدف إلى تحويل عالم التوظيف باستخدام أحدث تقنيات الذكاء الاصطناعي.",

    // Contact
    "contact.email": "info@seenai.com",
    "contact.phone": "+966 50 123 4567",
    "contact.title": "تواصل معنا",
    "contact.subtitle": "نحن هنا للمساعدة في أي استفسارات",

    // Footer
    "footer.rights": "جميع الحقوق محفوظة",
    "footer.privacy": "سياسة الخصوصية",
    "footer.terms": "شروط الخدمة",

    // Loading states
    "loading.please_wait": "يرجى الانتظار",
    "loading.processing": "جاري المعالجة...",

    // Error messages
    "error.network": "خطأ في الاتصال بالشبكة",
    "error.unauthorized": "غير مصرح بالوصول",
    "error.not_found": "الصفحة غير موجودة",
    "error.generic": "حدث خطأ غير متوقع",
    "error.validation": "يرجى ملء جميع الحقول المطلوبة",

    // Additional service translations
    "services.cv_analysis.analysis_details": "تفاصيل التحليل",
    "services.cv_analysis.skills_required": "المهارات المطلوبة",
    "services.cv_analysis.job_title": "المسمى الوظيفي",
    "services.cv_analysis.job_description": "وصف الوظيفة",
    "services.cv_analysis.start_analysis": "بدء التحليل",
    "services.cv_analysis.analyzing": "جاري التحليل...",
    "services.cv_analysis.analysis_results": "نتائج التحليل",
    "services.cv_analysis.candidates_found": "تم العثور على مرشحين",
    "services.cv_analysis.upload_cv": "رفع السير الذاتية",
    "services.cv_analysis.upload_instruction":
      "اضغط لرفع السير الذاتية أو اسحبها هنا",
    "services.cv_analysis.supported_formats": "يدعم PDF, DOC, DOCX",
    "services.cv_analysis.files_selected": "ملف مختار",

    // Talent search expanded
    "services.talent_search.job_title": "المسمى الوظيفي",
    "services.talent_search.job_description": "وصف الوظيفة",
    "services.talent_search.skills_required": "المهارات المطلوبة",
    "services.talent_search.certifications": "الشهادات",
    "services.talent_search.education_level": "المستوى التعليمي",
    "services.talent_search.languages": "اللغات",
    "services.talent_search.number_of_candidates": "عدد المرشحين",
    "services.talent_search.candidates": "مرشحين",
    "services.talent_search.candidate_requirements": "متطلبات المرشح",
    "services.talent_search.search_settings": "إعدادات البحث",
    "services.talent_search.match_score_type": "نوع درجة التطابق",
    "services.talent_search.quick_search": "بحث سريع",
    "services.talent_search.balanced_search": "بحث متوازن",
    "services.talent_search.detailed_search": "بحث مفصل",
    "services.talent_search.comprehensive_search": "بحث شامل",
    "services.talent_search.quick_description": "بحث سريع وأساسي",
    "services.talent_search.balanced_description": "بحث متوازن مع تفاصيل أكثر",
    "services.talent_search.detailed_description": "بحث مفصل مع تحليل عميق",
    "services.talent_search.comprehensive_description":
      "بحث شامل وكامل مع أعلى دقة",
    "services.talent_search.processing_notice":
      "الدرجات الأعلى تستغرق وقتاً أطول لكن تقدم نتائج أكثر دقة",
    "services.talent_search.per_candidate": "لكل مرشح",
    "services.talent_search.cost_per_candidate": "التكلفة لكل مرشح",
    "services.talent_search.cost_summary": "ملخص التكلفة",
    "services.talent_search.total_cost": "التكلفة الإجمالية",
    "services.talent_search.start_search": "بدء البحث",
    "services.talent_search.searching": "جاري البحث...",
    "services.talent_search.search_results": "نتائج البحث",
    "services.talent_search.candidates_found": "تم العثور على مرشحين",

    // Form additions
    "form.optional": "اختياري",
    "form.required": "مطلوب",
    "form.select_education": "اختر المستوى التعليمي",
    "form.high_school": "ثانوية عامة",
    "form.bachelor": "بكالوريوس",
    "form.master": "ماجستير",
    "form.phd": "دكتوراه",
    "form.placeholder.job_title": "مثال: مهندس برمجيات، مدير مشروع",
    "form.placeholder.job_description": "وصف الدور، المسؤوليات، والتوقعات...",
    "form.placeholder.skills_required":
      "مثال: JavaScript, React, Node.js, Python",
    "form.placeholder.certifications": "مثال: AWS Certified, PMP, Scrum Master",
    "form.placeholder.languages": "مثال: العربية، الإنجليزية، الفرنسية",

    // Additional dashboard and UI
    current_balance: "رصيدك الحالي",
    demo_charge: "شحن تجريبي",
    charging: "جاري الشحن...",
    credit_added_success: "تم إضافة الكريديت بنجاح!",
    new_balance: "رصيدك الجديد",
    demo_charge_error: "حدث خطأ أثناء الشحن التجريبي",

    // Homepage
    "homepage.hero.ai_powered": "مدعوم بالذكاء الاصطناعي",
    "homepage.hero.future_of_hiring": "مستقبل التوظيف",
    "homepage.hero.with_ai": "مع الذكاء الاصطناعي",
    "homepage.hero.description":
      "اكتشف أفضل المواهب وحلل السير الذاتية بتقنية الذكاء الاصطناعي المتقدمة. وفر وقتك واحصل على أفضل النتائج في عملية التوظيف.",
    "homepage.hero.start_now_free": "ابدأ الآن - 200 كريديت مجاني",
    "homepage.hero.learn_more": "اعرف المزيد",
    "homepage.hero.free_days": "14 يوم مجاني",
    "homepage.hero.no_credit_card": "بدون بطاقة ائتمان",
    "homepage.hero.cancel_anytime": "إلغاء في أي وقت",

    "homepage.stats.candidates_analyzed": "مرشح تم تحليله",
    "homepage.stats.companies_trust": "شركة تثق بنا",
    "homepage.stats.matching_accuracy": "دقة المطابقة",
    "homepage.stats.service_available": "خدمة متاحة",

    "homepage.features.title": "ميزات متقدمة للتوظيف الذكي",
    "homepage.features.subtitle":
      "استخدم قوة الذكاء الاصطناعي لتحويل عملية التوظيف إلى تجربة ذكية وفعالة",
    "homepage.features.ai_talent_search.title":
      "البحث عن المواهب بالذكاء الاصطناعي",
    "homepage.features.ai_talent_search.description":
      "اعثر على أفضل المرشحين باستخدام خوارزميات الذكاء الاصطناعي المتقدمة",
    "homepage.features.cv_analysis.title": "تحليل السيرة الذاتية",
    "homepage.features.cv_analysis.description":
      "حلل مئات السير الذاتية فوراً واحصل على أفضل المطابقات",
    "homepage.features.smart_management.title": "إدارة المواهب الذكية",
    "homepage.features.smart_management.description":
      "نظام شامل لإدارة وتتبع المرشحين وعملية التوظيف",
    "homepage.features.instant_results.title": "نتائج فورية",
    "homepage.features.instant_results.description":
      "احصل على نتائج دقيقة وفورية مع تقارير مفصلة وقابلة للتحميل",

    "homepage.pricing_section.title": "حزم مرنة لجميع الاحتياجات",
    "homepage.pricing_section.subtitle":
      "اختر الحزمة التي تناسب احتياجاتك وابدأ في استخدام قوة الذكاء الاصطناعي",
    "homepage.pricing_section.starter.name": "المبتدئ",
    "homepage.pricing_section.starter.features.credits": "كريديت",
    "homepage.pricing_section.starter.features.search_candidates":
      "البحث عن 50 مرشح",
    "homepage.pricing_section.starter.features.analyze_cvs":
      "تحليل 100 سيرة ذاتية",
    "homepage.pricing_section.starter.features.support": "دعم فني 24/7",
    "homepage.pricing_section.professional.name": "المحترف",
    "homepage.pricing_section.professional.features.credits": "كريديت",
    "homepage.pricing_section.professional.features.search_candidates":
      "البحث عن 150 مرشح",
    "homepage.pricing_section.professional.features.analyze_cvs":
      "تحليل 300 سيرة ذاتية",
    "homepage.pricing_section.professional.features.advanced_reports":
      "تقارير متقدمة",
    "homepage.pricing_section.professional.features.priority_support":
      "دعم أولوية",
    "homepage.pricing_section.enterprise.name": "المؤسسي",
    "homepage.pricing_section.enterprise.features.credits": "كريديت",
    "homepage.pricing_section.enterprise.features.unlimited_search":
      "بحث غير محدود",
    "homepage.pricing_section.enterprise.features.unlimited_analysis":
      "تحليل غير محدود",
    "homepage.pricing_section.enterprise.features.custom_api": "API مخصص",
    "homepage.pricing_section.enterprise.features.account_manager":
      "مدير حساب مخصص",
    "homepage.pricing_section.get_started": "ابدأ الآن",
    "homepage.pricing_section.save_percent": "وفر",
    "homepage.pricing_section.sar": "ريال",

    "homepage.cta.title": "جاهز لتحويل عملية التوظيف؟",
    "homepage.cta.subtitle":
      "انضم إلى آلاف الشركات التي تثق في SEEN AI للعثور على أفضل المواهب",
    "homepage.cta.start_free": "ابدأ مجاناً الآن",
    "homepage.cta.talk_expert": "تحدث مع خبير",
  },
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.features": "Features",
    "nav.pricing": "Pricing",
    "nav.contact": "Contact",
    "nav.about": "About",
    "nav.dashboard": "Dashboard",
    "nav.login": "Sign In",
    "nav.signup": "Get Started",
    "nav.logout": "Sign Out",

    // Credit system
    "credit.balance": "Credits",
    "credit.low_balance": "Low Balance",
    "credit.buy_more": "Buy More Credits",
    "credit.insufficient": "Insufficient Credits",
    "credit.loading": "Loading...",

    // Pricing
    "pricing.title": "Choose the Right Plan for You",
    "pricing.subtitle":
      "Flexible and effective packages to meet all your recruitment and talent search needs",
    "pricing.popular": "Most Popular",
    "pricing.buy_now": "Buy Now",
    "pricing.purchasing": "Purchasing...",
    "pricing.free_signup_credits": "Free Credits on Sign Up",
    "pricing.referral_credits": "Credits for Referrals",

    // Dashboard
    "dashboard.overview": "Overview",
    "dashboard.cv_analysis": "CV Analysis",
    "dashboard.cv_analysis_history": "CV Analysis History",
    "dashboard.talent_search": "Talent Search",
    "dashboard.talent_search_history": "Talent Search History",
    "dashboard.credit_history": "Credit History",
    "dashboard.settings": "Settings",
    "dashboard.total_searches": "Total Searches",
    "dashboard.total_analyses": "Total Analyses",
    "dashboard.credit_usage": "Credit Usage",

    // Services
    "services.cv_analysis.title": "CV Analysis",
    "services.cv_analysis.description":
      "Smart CV analysis using artificial intelligence",
    "services.cv_analysis.cost": "Credits per analysis",
    "services.talent_search.title": "Talent Search",
    "services.talent_search.description": "Advanced search for top talent",
    "services.talent_search.cost": "Credits per search",

    // Forms
    "form.email": "Email",
    "form.password": "Password",
    "form.full_name": "Full Name",
    "form.submit": "Submit",
    "form.loading": "Loading...",

    // Messages
    "message.success": "Success!",
    "message.error": "Error occurred",
    "message.welcome": "Welcome",
    "message.goodbye": "Goodbye",

    // Company info
    "company.name": "SEEN AI HR Solutions",
    "company.tagline": "Smart platform for talent discovery and analysis",
    "company.description":
      "Advanced artificial intelligence solutions for talent discovery and analysis. We aim to transform the world of recruitment using the latest AI technologies.",

    // Contact
    "contact.email": "info@seenai.com",
    "contact.phone": "+966 50 123 4567",
    "contact.title": "Contact Us",
    "contact.subtitle": "We're here to help with any inquiries",

    // Footer
    "footer.rights": "All rights reserved",
    "footer.privacy": "Privacy Policy",
    "footer.terms": "Terms of Service",

    // Loading states
    "loading.please_wait": "Please wait",
    "loading.processing": "Processing...",

    // Error messages
    "error.network": "Network connection error",
    "error.unauthorized": "Unauthorized access",
    "error.not_found": "Page not found",
    "error.generic": "An unexpected error occurred",
    "error.validation": "Please fill in all required fields",

    // Additional service translations
    "services.cv_analysis.analysis_details": "Analysis Details",
    "services.cv_analysis.skills_required": "Skills Required",
    "services.cv_analysis.job_title": "Job Title",
    "services.cv_analysis.job_description": "Job Description",
    "services.cv_analysis.start_analysis": "Start Analysis",
    "services.cv_analysis.analyzing": "Analyzing...",
    "services.cv_analysis.analysis_results": "Analysis Results",
    "services.cv_analysis.candidates_found": "candidates found",
    "services.cv_analysis.upload_cv": "Upload CVs",
    "services.cv_analysis.upload_instruction":
      "Click to upload CVs or drag them here",
    "services.cv_analysis.supported_formats": "Supports PDF, DOC, DOCX",
    "services.cv_analysis.files_selected": "files selected",

    // Talent search expanded
    "services.talent_search.job_title": "Job Title",
    "services.talent_search.job_description": "Job Description",
    "services.talent_search.skills_required": "Skills Required",
    "services.talent_search.certifications": "Certifications",
    "services.talent_search.education_level": "Education Level",
    "services.talent_search.languages": "Languages",
    "services.talent_search.number_of_candidates": "Number of Candidates",
    "services.talent_search.candidates": "candidates",
    "services.talent_search.candidate_requirements": "Candidate Requirements",
    "services.talent_search.search_settings": "Search Settings",
    "services.talent_search.match_score_type": "Match Score Type",
    "services.talent_search.quick_search": "Quick Search",
    "services.talent_search.balanced_search": "Balanced Search",
    "services.talent_search.detailed_search": "Detailed Search",
    "services.talent_search.comprehensive_search": "Comprehensive Search",
    "services.talent_search.quick_description": "Fast and basic search",
    "services.talent_search.balanced_description":
      "Balanced search with more details",
    "services.talent_search.detailed_description":
      "Detailed search with deep analysis",
    "services.talent_search.comprehensive_description":
      "Comprehensive and complete search with highest accuracy",
    "services.talent_search.processing_notice":
      "Higher scores take longer but provide more accurate results",
    "services.talent_search.per_candidate": "per candidate",
    "services.talent_search.cost_per_candidate": "Cost per candidate",
    "services.talent_search.cost_summary": "Cost Summary",
    "services.talent_search.total_cost": "Total Cost",
    "services.talent_search.start_search": "Start Search",
    "services.talent_search.searching": "Searching...",
    "services.talent_search.search_results": "Search Results",
    "services.talent_search.candidates_found": "candidates found",

    // Form additions
    "form.optional": "Optional",
    "form.required": "Required",
    "form.select_education": "Select education level",
    "form.high_school": "High School",
    "form.bachelor": "Bachelor's Degree",
    "form.master": "Master's Degree",
    "form.phd": "PhD",
    "form.placeholder.job_title": "e.g., Software Engineer, Project Manager",
    "form.placeholder.job_description":
      "Describe the role, responsibilities, and expectations...",
    "form.placeholder.skills_required":
      "e.g., JavaScript, React, Node.js, Python",
    "form.placeholder.certifications": "e.g., AWS Certified, PMP, Scrum Master",
    "form.placeholder.languages": "e.g., English, Arabic, French",

    // Additional dashboard and UI
    current_balance: "Your Current Balance",
    demo_charge: "Demo Charge",
    charging: "Charging...",
    credit_added_success: "Credits added successfully!",
    new_balance: "Your new balance",
    demo_charge_error: "Error occurred during demo charge",

    // Homepage
    "homepage.hero.ai_powered": "Powered by Artificial Intelligence",
    "homepage.hero.future_of_hiring": "Future of Hiring",
    "homepage.hero.with_ai": "with AI",
    "homepage.hero.description":
      "Discover the best talent and analyze resumes with advanced artificial intelligence technology. Save your time and get the best results in the hiring process.",
    "homepage.hero.start_now_free": "Start Now - 200 Free Credits",
    "homepage.hero.learn_more": "Learn More",
    "homepage.hero.free_days": "14 Days Free",
    "homepage.hero.no_credit_card": "No Credit Card",
    "homepage.hero.cancel_anytime": "Cancel Anytime",

    "homepage.stats.candidates_analyzed": "Candidates Analyzed",
    "homepage.stats.companies_trust": "Companies Trust Us",
    "homepage.stats.matching_accuracy": "Matching Accuracy",
    "homepage.stats.service_available": "Service Available",

    "homepage.features.title": "Advanced Features for Smarter Hiring",
    "homepage.features.subtitle":
      "Use the power of artificial intelligence to transform the hiring process into a smart and efficient experience",
    "homepage.features.ai_talent_search.title": "AI-Powered Talent Search",
    "homepage.features.ai_talent_search.description":
      "Find the best candidates using advanced artificial intelligence algorithms",
    "homepage.features.cv_analysis.title": "CV Analysis",
    "homepage.features.cv_analysis.description":
      "Analyze hundreds of resumes instantly and get the best matches",
    "homepage.features.smart_management.title": "Smart Talent Management",
    "homepage.features.smart_management.description":
      "Comprehensive system for managing and tracking candidates and hiring process",
    "homepage.features.instant_results.title": "Instant Results",
    "homepage.features.instant_results.description":
      "Get accurate and instant results with detailed and downloadable reports",

    "homepage.pricing_section.title": "Flexible Packages for All Needs",
    "homepage.pricing_section.subtitle":
      "Choose the package that suits your needs and start using the power of artificial intelligence",
    "homepage.pricing_section.starter.name": "Starter",
    "homepage.pricing_section.starter.features.credits": "Credits",
    "homepage.pricing_section.starter.features.search_candidates":
      "Search for 50 Candidates",
    "homepage.pricing_section.starter.features.analyze_cvs": "Analyze 100 CVs",
    "homepage.pricing_section.starter.features.support":
      "24/7 Technical Support",
    "homepage.pricing_section.professional.name": "Professional",
    "homepage.pricing_section.professional.features.credits": "Credits",
    "homepage.pricing_section.professional.features.search_candidates":
      "Search for 150 Candidates",
    "homepage.pricing_section.professional.features.analyze_cvs":
      "Analyze 300 CVs",
    "homepage.pricing_section.professional.features.advanced_reports":
      "Advanced Reports",
    "homepage.pricing_section.professional.features.priority_support":
      "Priority Support",
    "homepage.pricing_section.enterprise.name": "Enterprise",
    "homepage.pricing_section.enterprise.features.credits": "Credits",
    "homepage.pricing_section.enterprise.features.unlimited_search":
      "Unlimited Search",
    "homepage.pricing_section.enterprise.features.unlimited_analysis":
      "Unlimited Analysis",
    "homepage.pricing_section.enterprise.features.custom_api": "Custom API",
    "homepage.pricing_section.enterprise.features.account_manager":
      "Dedicated Account Manager",
    "homepage.pricing_section.get_started": "Get Started",
    "homepage.pricing_section.save_percent": "Save",
    "homepage.pricing_section.sar": "SAR",

    "homepage.cta.title": "Ready to Transform Your Hiring Process?",
    "homepage.cta.subtitle":
      "Join thousands of companies that trust SEEN AI to find the best talent",
    "homepage.cta.start_free": "Start Now for Free",
    "homepage.cta.talk_expert": "Talk to Expert",
  },
};

// Language context
export class LanguageManager {
  private static instance: LanguageManager;
  private language: Language = "ar"; // Default to Arabic
  private listeners: Array<(lang: Language) => void> = [];

  private constructor() {
    // Load saved language from localStorage
    const saved = localStorage.getItem("preferred-language") as Language;
    if (saved && (saved === "ar" || saved === "en")) {
      this.language = saved;
    }
  }

  static getInstance(): LanguageManager {
    if (!LanguageManager.instance) {
      LanguageManager.instance = new LanguageManager();
    }
    return LanguageManager.instance;
  }

  getLanguage(): Language {
    return this.language;
  }

  setLanguage(lang: Language): void {
    this.language = lang;
    localStorage.setItem("preferred-language", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    this.listeners.forEach((listener) => listener(lang));
  }

  subscribe(listener: (lang: Language) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  translate(key: TranslationKey): string {
    return translations[this.language][key] || key;
  }

  isRTL(): boolean {
    return this.language === "ar";
  }
}

// Hook for using translations
export function useTranslation() {
  const [language, setLanguage] = useState<Language>(() =>
    LanguageManager.getInstance().getLanguage()
  );

  useEffect(() => {
    const manager = LanguageManager.getInstance();
    const unsubscribe = manager.subscribe(setLanguage);

    // Set initial direction
    document.documentElement.dir = manager.isRTL() ? "rtl" : "ltr";
    document.documentElement.lang = language;

    return unsubscribe;
  }, []);

  const t = (key: TranslationKey): string => {
    return LanguageManager.getInstance().translate(key);
  };

  const changeLanguage = (lang: Language): void => {
    LanguageManager.getInstance().setLanguage(lang);
  };

  const isRTL = (): boolean => {
    return LanguageManager.getInstance().isRTL();
  };

  return {
    language,
    t,
    changeLanguage,
    isRTL,
  };
}

// Utility function for easy translation access
export const t = (key: TranslationKey): string => {
  return LanguageManager.getInstance().translate(key);
};
