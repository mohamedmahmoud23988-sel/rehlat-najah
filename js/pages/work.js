// الجانب العملي: التخصص المهني + الحرية المالية (مشروع خاص)

// ================== التخصص المهني ==================
// المهام القديمة اللي كان ليها موعد واحد بتتحول لمهمة بخطوة واحدة بنفس التاريخ
(() => {
  try {
    const list = JSON.parse(localStorage.getItem("rehlatNajah.workTasks")) || [];
    let changed = false;
    list.forEach(a => {
      if (!a.steps) {
        a.steps = [{ id: "s" + a.id, text: a.title, date: a.due || "", doneOn: a.doneOn || null }];
        changed = true;
      }
    });
    if (changed) localStorage.setItem("rehlatNajah.workTasks", JSON.stringify(list));
  } catch {}
})();

const WORK_TASKS = createOpenList({
  prefix: "ws", // (مش "wt" عشان دي مستخدمة في متابعة الوزن)
  pageId: "workTasksPage",
  storageKey: "rehlatNajah.workTasks",
  aspectId: "work",
  backHash: "#/aspect/work",
  icon: "💼",
  title: "التخصص المهني",
  subtitle: () => profile?.job
    ? `💼 وظيفتك: ${profile.job} — مهام شغلك والتطوير في تخصصك`
    : "مهام الشغل الحالي والتطوير في تخصصك — اكتب وظيفتك في البروفايل 💪",
  word: "مهمة",
  wordOpen: "مهمة مفتوحة",
  editTitle: "المهمة",
  emptyWord: "مهام",
  formTitle: "إضافة مهمة",
  submitLabel: "إضافة المهمة",
  listTitle: "💼 مهام التخصص المهني",
  openGroup: "مهام مفتوحة",
  doneGroup: "مهام خلصت",
  emptyText: "لسه ما ضفتش مهام.",
  titleLabel: "المهمة",
  titlePlaceholder: "مثلاً: تسليم تقرير المبيعات / كورس إكسل متقدم",
  titleSuggestions: ["تسليم تقرير", "تحضير عرض تقديمي", "اجتماع مع المدير", "متابعة مع عميل", "تسليم مشروع",
    "كورس تدريبي", "شهادة مهنية", "تعلّم مهارة جديدة", "تحديث السي في", "طلب ترقية", "تقييم الأداء", "قراءة كتاب في التخصص", "حضور مؤتمر"],
  secondLabel: "التصنيف",
  secondIcon: "🏷️",
  secondPlaceholder: "مثلاً: شغل يومي / تطوير مهارات",
  secondSuggestions: ["شغل يومي", "مشروع في الشغل", "اجتماع", "عميل", "تطوير مهارات", "كورس / شهادة", "ترقية ومسار وظيفي", "علاقات مهنية"],
  steps: true, // كل مهمة ليها خطوات بتواريخ
  purposeLabel: "التفاصيل",
  purposeIcon: "📝",
  purposePlaceholder: "مثلاً: التقرير محتاج أرقام الربع التالت ومقارنة بالسنة اللي فاتت",
  updatePlaceholder: "➕ سجّل تحديث… (مثلاً: خلّصت نص التقرير وباقي الجداول)",
  doneEmoji: "💼",
  doneMessages: [
    "عاش يا بطل! مهمة كمان خلصت 💪",
    "«إن الله يحب إذا عمل أحدكم عملاً أن يتقنه» — ربنا يبارك في شغلك",
    "خطوة جديدة في مسارك المهني، كمّل 🚀",
  ],
});

// ================== الحرية المالية / مشروع خاص ==================
const BUSINESS = createOpenList({
  prefix: "bz",
  pageId: "businessPage",
  storageKey: "rehlatNajah.business",
  aspectId: "work",
  backHash: "#/aspect/work",
  icon: "🚀",
  title: "الحرية المالية",
  subtitle: "مشروعك الخاص وكل بياناته وخطواته — خطوة بخطوة نحو الحرية المالية 🌟",
  word: "مشروع",
  wordOpen: "مشروع شغال",
  editTitle: "المشروع",
  emptyWord: "مشاريع",
  formTitle: "إضافة مشروع خاص",
  submitLabel: "إضافة المشروع",
  listTitle: "🚀 مشاريعي الخاصة",
  openGroup: "مشاريع شغالة",
  doneGroup: "مشاريع اتحققت",
  emptyText: "لسه ما ضفتش مشاريع خاصة.",
  titleLabel: "اسم المشروع",
  titlePlaceholder: "مثلاً: متجر أونلاين / مشروع مطعم صغير",
  titleSuggestions: ["متجر أونلاين", "مشروع تجاري صغير", "شغل فري لانس", "استثمار عقاري", "استثمار في البورصة",
    "مشروع مع شريك", "كورس أونلاين أبيعه", "قناة يوتيوب", "مصدر دخل إضافي", "صندوق طوارئ"],
  secondLabel: "المجال",
  secondIcon: "🏷️",
  secondPlaceholder: "مثلاً: تجارة / أونلاين / استثمار",
  secondSuggestions: ["تجارة", "أونلاين", "خدمات", "مطاعم وأكل", "عقارات", "استثمار", "تعليم", "صناعة", "فري لانس"],
  cost: true,
  steps: true,
  purposeLabel: "بيانات ومعلومات المشروع",
  purposeIcon: "📋",
  purposePlaceholder: "فكرة المشروع، الشركاء، الأرقام، الموردين، أي معلومة مهمة…",
  updatePlaceholder: "➕ سجّل تحديث… (مثلاً: اتفقت مع المورد على الأسعار)",
  doneEmoji: "🚀",
  doneMessages: [
    "ألف مبروك! حلم اتحقق — خطوة كبيرة نحو الحرية المالية 🌟",
    "«وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَىٰ» — ربنا يبارك في سعيك",
    "ما شاء الله! ربنا يجعله رزق واسع ومبارك 👏",
  ],
});
