// الجانب العائلي: العائلة الكبرى + العائلة الصغرى (المنزل / الزوجة والأولاد)

// ================== العائلة الكبرى ==================
const BIG_FAMILY = createOpenList({
  prefix: "af",
  pageId: "affairsPage",
  storageKey: "rehlatNajah.affairs",
  aspectId: "family",
  backHash: "#/aspect/family",
  icon: "👨‍👩‍👧‍👦",
  title: "العائلة الكبرى",
  subtitle: "شؤون الأهل والأقارب — كل شأن بيفضل مفتوح لحد ما يخلص 🤝",
  word: "شأن",
  editTitle: "الشأن",
  formTitle: "إضافة شأن عائلي",
  submitLabel: "إضافة الشأن",
  listTitle: "📋 شؤون العائلة الكبرى",
  openGroup: "شؤون مفتوحة",
  doneGroup: "شؤون خلصت",
  emptyText: "لسه ما ضفتش شؤون عائلية.",
  titleLabel: "الشأن العائلي",
  titlePlaceholder: "مثلاً: زيارة عمي في المستشفى / جواز ابن خالتي",
  titleSuggestions: ["زيارة الوالدين", "زيارة الجد والجدة", "صلة رحم الأعمام", "صلة رحم الأخوال", "زيارة مريض",
    "تهنئة بمولود", "تهنئة بزواج", "تعزية", "مساعدة مادية", "حل خلاف عائلي", "تجهيزات فرح", "عزومة عائلية", "مكالمة اطمئنان"],
  secondLabel: "يخص مين",
  secondIcon: "👤",
  secondPlaceholder: "مثلاً: الوالدة / عمي محمود",
  secondSuggestions: ["الوالد", "الوالدة", "الإخوة", "الأخوات", "الجد", "الجدة", "الأعمام", "العمات", "الأخوال", "الخالات", "أولاد العم", "أولاد الخال", "الأصهار"],
  purposeLabel: "الغرض",
  purposeIcon: "🎯",
  purposePlaceholder: "مثلاً: صلة رحم والاطمئنان عليه / المساعدة في تجهيزات الفرح",
  updatePlaceholder: "➕ سجّل تحديث… (مثلاً: كلمته واتفقنا نزوره الجمعة)",
  doneEmoji: "🤝",
  doneMessages: [
    "«مَن سرَّه أن يُبسط له في رزقه ويُنسأ له في أثره فليصل رحمه» — ربنا يبارك فيك",
    "ما شاء الله! ربنا يجعله في ميزان حسناتك 🤝",
    "صلة الرحم بركة في العمر والرزق، ربنا يتقبّل منك 💚",
  ],
});
// أسماء بتستخدمها صفحة الجانب ولوحة المتابعة
const afOpen = () => BIG_FAMILY.open();
const afOverdue = a => BIG_FAMILY.overdue(a);
const affairsStageStats = () => BIG_FAMILY.stageStats();
const affairsToday = () => BIG_FAMILY.today();
const renderAffairsPage = () => BIG_FAMILY.render();

// ================== العائلة الصغرى: المنزل ==================
const HOME_TASKS = createOpenList({
  prefix: "hm",
  pageId: "homeTasksPage",
  storageKey: "rehlatNajah.homeTasks",
  aspectId: "family",
  backHash: "#/aspect/family/smallFamily",
  parentName: "العائلة الصغرى",
  icon: "🏡",
  title: "المنزل",
  subtitle: "الحاجات اللي محتاجة تتصلح أو تتطور في البيت — كل حاجة بتفضل مفتوحة لحد ما تخلص 🔧",
  word: "حاجة",
  wordOpen: "حاجة مفتوحة",
  editTitle: "الحاجة",
  formTitle: "إضافة حاجة للمنزل",
  submitLabel: "إضافة",
  listTitle: "🔧 حاجات المنزل",
  openGroup: "حاجات مفتوحة",
  doneGroup: "حاجات خلصت",
  emptyText: "لسه ما ضفتش حاجات للمنزل.",
  titleLabel: "المطلوب",
  titlePlaceholder: "مثلاً: صيانة السخان / شراء تكييف",
  titleSuggestions: ["صيانة السخان", "شراء تكييف", "صيانة التكييف", "صيانة السباكة", "تصليح الكهرباء", "دهان الشقة",
    "صيانة الغسالة", "صيانة التلاجة", "تركيب فلتر مياه", "تغيير الأثاث", "عزل السطح", "تصليح الباب", "تغيير الستاير", "تنضيف السجاد"],
  secondLabel: "النوع",
  secondIcon: "🏷️",
  secondPlaceholder: "مثلاً: صيانة / شراء / تطوير",
  secondSuggestions: ["صيانة", "تصليح", "شراء", "تطوير", "تنظيف", "تركيب"],
  cost: true,
  purposeLabel: "التفاصيل",
  purposeIcon: "📝",
  purposePlaceholder: "مثلاً: السخان بيفصل كل شوية — اتصل بالفني أبو أحمد",
  updatePlaceholder: "➕ سجّل تحديث… (مثلاً: الفني جاي يوم الخميس)",
  doneEmoji: "🏡",
  doneMessages: [
    "البيت بقى أحسن 🏡 ربنا يبارك فيه",
    "ما شاء الله! حاجة كمان خلصت من قايمة البيت 👏",
    "«اللهم بارك لنا في بيتنا» — ربنا يجعله عامر بالخير 💚",
  ],
});

// ================== العائلة الصغرى: الزوجة والأولاد ==================
const WIFE_KIDS = createOpenList({
  prefix: "wk",
  pageId: "wifeKidsPage",
  storageKey: "rehlatNajah.wifeKids",
  aspectId: "family",
  backHash: "#/aspect/family/smallFamily",
  parentName: "العائلة الصغرى",
  icon: "👨‍👩‍👧",
  title: "الزوجة والأولاد",
  subtitle: "مشاكل وشؤون الزوجة والأولاد — كل شأن بيفضل مفتوح لحد ما يخلص 💚",
  word: "شأن",
  editTitle: "الشأن",
  formTitle: "إضافة شأن",
  submitLabel: "إضافة الشأن",
  listTitle: "📋 شؤون الزوجة والأولاد",
  openGroup: "شؤون مفتوحة",
  doneGroup: "شؤون خلصت",
  emptyText: "لسه ما ضفتش شؤون.",
  titleLabel: "الشأن",
  titlePlaceholder: "مثلاً: متابعة مذاكرة الرياضيات / كشف أسنان لأحمد",
  titleSuggestions: ["متابعة المذاكرة", "دروس خصوصية", "مصاريف المدرسة", "اجتماع أولياء الأمور", "تقديم في مدرسة", "شراء مستلزمات المدرسة",
    "كشف دكتور", "متابعة علاج", "تطعيمات", "كشف أسنان", "اشتراك النادي", "تمرين رياضة", "خروجة عائلية", "هدية عيد ميلاد", "حفظ قرآن"],
  secondLabel: "يخص مين",
  secondIcon: "👤",
  secondPlaceholder: "مثلاً: البنت الكبيرة",
  // الاقتراحات بتتظبط حسب البروفايل: الزوجة لو متزوج، و"الطفل الأول/التاني…" حسب عدد الأولاد
  secondSuggestions: () => {
    const p = profile || {};
    const ORD = ["الأول", "التاني", "التالت", "الرابع", "الخامس", "السادس", "السابع", "التامن"];
    const kids = Array.from({ length: Math.min(p.kidsCount || 0, ORD.length) }, (_, i) => `الطفل ${ORD[i]}`);
    return [
      ...(isMarried(p) ? [p.gender === "female" ? "الزوج" : "الزوجة"] : []),
      ...(p.kidsCount > 1 ? ["الأولاد كلهم"] : []),
      ...kids,
      "الابن الكبير", "الابن الصغير", "البنت الكبيرة", "البنت الصغيرة",
    ];
  },
  nameField: { label: "الاسم", placeholder: "مثلاً: فريدة" },
  cost: true,
  purposeLabel: "التفاصيل",
  purposeIcon: "📝",
  purposePlaceholder: "مثلاً: مستواه نازل في الرياضيات — محتاج يراجع كل يوم نص ساعة",
  updatePlaceholder: "➕ سجّل تحديث… (مثلاً: اتكلمت مع المدرّس واتفقنا على حصتين في الأسبوع)",
  doneEmoji: "💚",
  doneMessages: [
    "«كلكم راعٍ وكلكم مسؤول عن رعيته» — ربنا يبارك لك فيهم",
    "ما شاء الله! ربنا يحفظهم ويقرّ عينك بيهم 💚",
    "«خيركم خيركم لأهله» — ربنا يجعله في ميزان حسناتك",
  ],
});

// ================== العائلة الصغرى: صفحة الاختيارات ==================
const SMALL_FAMILY = createHub({
  prefix: "sf",
  pageId: "smallFamilyPage",
  aspectId: "family",
  itemId: "smallFamily",
  icon: "🏠",
  title: "العائلة الصغرى",
  subs: [
    { id: "home", key: "sf_home", name: "المنزل", icon: "🏡", desc: "الحاجات اللي محتاجة تتصلح أو تتطور في البيت", ready: true,
      todayLine: () => {
        const o = HOME_TASKS.open(), late = o.filter(HOME_TASKS.overdue).length;
        return `<span class="item-today ${late ? "pending" : ""}">${o.length ? `🔧 ${o.length} حاجة مفتوحة` : "مفيش حاجات مفتوحة"}${late ? ` · ⚠ ${late} عدّى موعدها` : ""}</span>`;
      } },
    { id: "wifeKids", key: "sf_wifeKids", name: "الزوجة والأولاد", icon: "👨‍👩‍👧", ready: true,
      desc: () => {
        const p = profile || {};
        if (!isMarried(p) && !(p.kidsCount > 0)) return "حسب بروفايلك مش متزوج — تقدر تفعّلها وقت ما تحب";
        const parts = [isMarried(p) ? (p.gender === "female" ? "الزوج" : "الزوجة") : "", p.kidsCount > 0 ? (p.kidsCount === 1 ? "طفل واحد" : p.kidsCount === 2 ? "طفلين" : `${p.kidsCount} أطفال`) : ""].filter(Boolean);
        return `${parts.join(" و")}: المذاكرة والمدارس والدكاترة والعلاج`;
      },
      todayLine: () => {
        const o = WIFE_KIDS.open(), late = o.filter(WIFE_KIDS.overdue).length;
        return `<span class="item-today ${late ? "pending" : ""}">${o.length ? `📋 ${o.length} شأن مفتوح` : "مفيش شؤون مفتوحة"}${late ? ` · ⚠ ${late} عدّى موعده` : ""}</span>`;
      } },
  ],
});
const renderSmallFamilyPage = () => SMALL_FAMILY.render();

// ================== مشاريع وميزانيات: المشاريع العائلية ==================
const FAMILY_PROJECTS = createOpenList({
  prefix: "pj",
  pageId: "familyProjectsPage",
  storageKey: "rehlatNajah.familyProjects",
  aspectId: "family",
  backHash: "#/aspect/family/projects",
  parentName: "مشاريع وميزانيات",
  icon: "🏗️",
  title: "المشاريع العائلية",
  subtitle: "مشاريع العائلة الكبيرة — كل مشروع بيفضل مفتوح لحد ما يتحقق 🌟",
  word: "مشروع",
  editTitle: "المشروع",
  formTitle: "إضافة مشروع",
  submitLabel: "إضافة المشروع",
  listTitle: "🏗️ مشاريع العائلة",
  openGroup: "مشاريع شغالة",
  doneGroup: "مشاريع اتحققت",
  emptyText: "لسه ما ضفتش مشاريع.",
  titleLabel: "اسم المشروع",
  titlePlaceholder: "مثلاً: شراء عربية / تشطيب الشقة / رحلة عمرة",
  titleSuggestions: ["شراء شقة", "تشطيب الشقة", "شراء عربية", "تجهيز جواز", "رحلة عمرة", "رحلة حج", "رحلة صيفية",
    "مشروع تجاري صغير", "استثمار في أرض", "توفير لمصاريف الجامعة", "حساب توفير للأولاد", "تغيير أثاث البيت", "تقديم في مدرسة جديدة"],
  secondLabel: "يخص مين (الصفة)",
  secondIcon: "👤",
  secondPlaceholder: "مثلاً: العائلة كلها / البنت الكبيرة",
  secondSuggestions: ["العائلة كلها", "أنا", "الزوجة", "الأولاد كلهم", "الابن الكبير", "الابن الأوسط", "الابن الصغير", "البنت الكبيرة", "البنت الوسطى", "البنت الصغيرة"],
  nameField: { label: "الاسم", placeholder: "مثلاً: فريدة" },
  cost: true,
  steps: true, // خطوات بتواريخ بدل موعد واحد
  purposeLabel: "ملاحظات",
  purposeIcon: "📝",
  purposePlaceholder: "أي ملاحظات عن المشروع… (اختياري)",
  updatePlaceholder: "➕ سجّل تحديث… (مثلاً: خلّصنا الخطوة الأولى وحددنا الميزانية)",
  doneEmoji: "🌟",
  doneMessages: [
    "ألف مبروك! حلم اتحقق للعائلة، ربنا يبارك فيه 🌟",
    "«وَقُل رَّبِّ زِدْنِي عِلْمًا» — ربنا يزيدكم من فضله ويبارك لكم",
    "ما شاء الله! مشروع كمان اتحقق، الحمد لله على النعمة 👏",
  ],
});

// ================== مشاريع وميزانيات: صفحة الاختيارات ==================
const PROJECTS_HUB = createHub({
  prefix: "ph",
  pageId: "projectsHubPage",
  aspectId: "family",
  itemId: "projects",
  icon: "💰",
  title: "مشاريع وميزانيات",
  subs: [
    { id: "budgets", key: "ph_budgets", name: "الميزانيات العائلية", icon: "💵", desc: "حاسبة شهرية لمصاريف البيت وتقرير تحليلي", ready: true,
      todayLine: () => {
        const b = budgetNow();
        if (b.alloc == null) return `<span class="item-today">${b.spent ? `💵 صرفت ${num(b.spent)} جنيه الشهر ده` : "حدد ميزانية الشهر"}</span>`;
        const over = b.spent > b.alloc;
        return `<span class="item-today ${over ? "pending" : "done"}">💵 صرفت ${num(b.spent)} من ${num(b.alloc)} جنيه${over ? " · ⚠ عدّيت الميزانية" : ""}</span>`;
      } },
    { id: "projects", key: "ph_projects", name: "المشاريع العائلية", icon: "🏗️", desc: "مشاريع وأحلام العائلة وخطواتها", ready: true,
      todayLine: () => {
        const o = FAMILY_PROJECTS.open(), late = o.filter(FAMILY_PROJECTS.overdue).length;
        return `<span class="item-today ${late ? "pending" : ""}">${o.length ? `🏗️ ${o.length} مشروع شغال` : "مفيش مشاريع شغالة"}${late ? ` · ⚠ ${late} عدّى موعده` : ""}</span>`;
      } },
  ],
});
const renderProjectsHubPage = () => PROJECTS_HUB.render();

function projectsSummary() {
  const parts = [];
  if (PROJECTS_HUB.subOn("projects")) parts.push({ s: FAMILY_PROJECTS.stageStats(), c: FAMILY_PROJECTS.today() });
  const sum = f => parts.reduce((n, p) => n + f(p), 0);
  return { done: sum(p => p.s?.done ?? 0), required: sum(p => p.s?.required ?? 0), late: sum(p => p.s?.missed ?? 0),
           todayDone: sum(p => p.c.done), todayTotal: sum(p => p.c.total), streak: 0, lateLabel: "عدّى موعده" };
}

// ملخص العائلة الصغرى للوحة المتابعة (بيجمع الاختيارات الفرعية المفعّلة)
function smallFamilySummary() {
  const parts = [];
  if (SMALL_FAMILY.subOn("home")) parts.push({ s: HOME_TASKS.stageStats(), c: HOME_TASKS.today() });
  if (SMALL_FAMILY.subOn("wifeKids")) parts.push({ s: WIFE_KIDS.stageStats(), c: WIFE_KIDS.today() });
  const sum = f => parts.reduce((n, p) => n + f(p), 0);
  return { done: sum(p => p.s?.done ?? 0), required: sum(p => p.s?.required ?? 0), late: sum(p => p.s?.missed ?? 0),
           todayDone: sum(p => p.c.done), todayTotal: sum(p => p.c.total), streak: 0, lateLabel: "عدّى موعده" };
}
