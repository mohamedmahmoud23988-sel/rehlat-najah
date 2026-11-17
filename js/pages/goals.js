// الجانب الشخصي: الهدف العام = الخطط السنوية + الحلم الكبير

// ================== الخطط السنوية ==================
// { "2026": { motto: "", goals: [{ id, text, aspect, doneOn }] } }
const YEAR_PLANS_KEY = "rehlatNajah.yearPlans";
let yearPlans = (() => { try { return JSON.parse(localStorage.getItem(YEAR_PLANS_KEY)) || {}; } catch { return {}; } })();
const saveYearPlans = () => { try { localStorage.setItem(YEAR_PLANS_KEY, JSON.stringify(yearPlans)); } catch {} };
const curYear = () => Number(todayStr().slice(0, 4));
const yearOf = y => (yearPlans[y] ??= { motto: "", goals: [] });
const peekYear = y => yearPlans[y] || { motto: "", goals: [] };
let ypYear = null;

// تصنيف الهدف حسب جوانب البرنامج الخمسة
const GOAL_ASPECTS = [...ASPECTS.map(a => ({ id: a.id, name: a.name, icon: a.icon })), { id: "general", name: "عام", icon: "⭐" }];
const goalAspect = id => GOAL_ASPECTS.find(a => a.id === id) || GOAL_ASPECTS[GOAL_ASPECTS.length - 1];

function yearStats(y = curYear()) {
  const g = peekYear(y).goals;
  return { total: g.length, done: g.filter(x => x.doneOn).length };
}

$("yearPlansPage").innerHTML = `
  <section class="card aspect-hero">
    <button class="back-btn" id="ypBack">→ رجوع</button>
    <div class="ah-icon">📅</div>
    <h2 class="ah-name">الخطط السنوية</h2>
    <p class="ah-stage">الهدف العام · أهداف كل سنة، وفي آخرها نعلّم على اللي اتحقق</p>
    <div class="bd-monthnav">
      <button class="ap-btn" id="ypPrev" title="السنة اللي فاتت" aria-label="السنة اللي فاتت">→</button>
      <b id="ypYearLbl"></b>
      <button class="ap-btn" id="ypNext" title="السنة الجاية" aria-label="السنة الجاية">←</button>
    </div>
  </section>

  <section class="card ip-card" id="ypOverview"></section>

  <section class="card ip-card">
    <h3 class="ip-title" id="ypAddTitle">➕ إضافة هدف</h3>
    <form id="ypForm" class="yp-form" novalidate>
      <div class="f">
        <label for="ypText">الهدف *</label>
        <input id="ypText" type="text" placeholder="مثلاً: أختم القرآن مرتين / أنزل 10 كيلو / أشتري عربية" />
      </div>
      <div class="f">
        <label for="ypAspect">الجانب</label>
        <select id="ypAspect"></select>
      </div>
      <button type="submit" class="btn btn-primary">➕ إضافة</button>
    </form>
    <p id="ypError" class="error"></p>
  </section>

  <section class="card ip-card">
    <h3 class="ip-title" id="ypListTitle"></h3>
    <div id="ypList"></div>
  </section>`;

function renderYearPlansPage() {
  const aspect = ASPECTS.find(a => a.id === "personal");
  currentAspect = aspect;
  const page = $("yearPlansPage");
  page.style.setProperty("--c", aspect.color);
  page.style.setProperty("--cl", aspect.light);
  document.title = "الخطط السنوية — رحلة نجاح";
  if (!ypYear) ypYear = curYear();
  $("ypYearLbl").textContent = `سنة ${ypYear}`;
  $("ypAddTitle").textContent = `➕ إضافة هدف لسنة ${ypYear}`;
  $("ypListTitle").textContent = `🎯 أهداف ${ypYear}`;

  const yp = peekYear(ypYear);
  const s = yearStats(ypYear);
  const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
  const cy = curYear();
  const ended = ypYear < cy;
  const daysLeft = ypYear === cy ? daysBetween(todayStr(), `${cy}-12-31`) + 1 : null;
  const review = ended && s.total
    ? `<div class="yp-review ${pct >= 70 ? "good" : ""}">📜 مراجعة ${ypYear}: حققت <strong>${s.done} من ${s.total}</strong> هدف (${pct}%) ${pct >= 70 ? "— ما شاء الله، سنة ناجحة 🎉" : pct >= 40 ? "— خطوة كويسة، والسنة الجاية أحسن 💪" : "— ولا يهمك، المهم نتعلّم ونكمّل 🌱"}</div>`
    : "";
  $("ypOverview").innerHTML = `
    ${review}
    <div class="ex-week-top">
      ${ringSVG(pct, "اتحقق")}
      <div>
        <div class="ex-week-tiles">
          <div class="dc-tile"><b>${s.total}</b><small>هدف للسنة</small></div>
          <div class="dc-tile"><b>${s.done}</b><small>اتحقق ✓</small></div>
          <div class="dc-tile"><b>${s.total - s.done}</b><small>لسه</small></div>
          <div class="dc-tile"><b>${daysLeft != null ? daysLeft : ended ? "خلصت" : "—"}</b><small>${daysLeft != null ? "يوم فاضل في السنة" : "السنة"}</small></div>
        </div>
      </div>
    </div>
    <form class="yp-motto" id="ypMottoForm">
      <label for="ypMotto">✨ شعار السنة</label>
      <div class="yp-motto-row">
        <input id="ypMotto" type="text" value="${escapeHtml(yp.motto || "")}" placeholder="مثلاً: سنة الانضباط / سنة القرب من ربنا" />
        <button type="submit" class="btn btn-outline btn-sm">حفظ</button>
      </div>
    </form>`;
  $("ypMottoForm").addEventListener("submit", e => {
    e.preventDefault();
    yearOf(ypYear).motto = $("ypMotto").value.trim();
    saveYearPlans();
    toast("تم حفظ شعار السنة ✨");
  });

  // الأهداف مجمّعة حسب الجانب
  if (!yp.goals.length) {
    $("ypList").innerHTML = `<p class="md-empty">لسه ما ضفتش أهداف لسنة ${ypYear}.${ypYear > cy ? " خطط من بدري 👏" : ""}</p>`;
    return;
  }
  $("ypList").innerHTML = GOAL_ASPECTS.map(ga => {
    const list = yp.goals.filter(g => (g.aspect || "general") === ga.id);
    if (!list.length) return "";
    const d = list.filter(g => g.doneOn).length;
    return `
      <div class="ap-group">${ga.icon} ${ga.name} <span class="n">${d} من ${list.length}</span></div>
      ${list.map(g => `
        <label class="yp-goal ${g.doneOn ? "done" : ""}">
          <input type="checkbox" data-ypg="${g.id}" ${g.doneOn ? "checked" : ""} />
          <span class="bc-box">✓</span>
          <span class="t">${escapeHtml(g.text)}${g.doneOn ? `<small>اتحقق ${formatDate(g.doneOn)}</small>` : ""}</span>
          <button type="button" class="ap-btn" data-ypdel="${g.id}" title="حذف" aria-label="حذف الهدف">🗑</button>
        </label>`).join("")}`;
  }).join("");
}

$("ypAspect").innerHTML = GOAL_ASPECTS.map(a => `<option value="${a.id}">${a.icon} ${a.name}</option>`).join("");
$("ypAspect").value = "general";
$("ypForm").addEventListener("submit", e => {
  e.preventDefault();
  const text = $("ypText").value.trim();
  if (!text) { $("ypError").textContent = "اكتب الهدف"; $("ypText").classList.add("invalid"); return; }
  $("ypError").textContent = "";
  yearOf(ypYear).goals.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text, aspect: $("ypAspect").value, doneOn: null });
  saveYearPlans();
  $("ypText").value = "";
  renderYearPlansPage();
  toast(`تمت إضافة الهدف لسنة ${ypYear} 🎯`);
  $("ypText").focus();
});
$("ypText").addEventListener("input", e => e.target.classList.remove("invalid"));

$("yearPlansPage").addEventListener("change", e => {
  const id = e.target.dataset.ypg;
  if (!id) return;
  const g = yearOf(ypYear).goals.find(x => x.id === id);
  g.doneOn = e.target.checked ? todayStr() : null;
  saveYearPlans();
  renderYearPlansPage();
  if (e.target.checked) {
    const s = yearStats(ypYear);
    if (s.done === s.total) celebrate("🏆", `ما شاء الله! حققت كل أهداف سنة ${ypYear} (${s.total} هدف) — سنة استثنائية 🎉`);
    else celebrate("🎯", `مبروك! اتحقق هدف "${g.text}" — فاضل ${s.total - s.done} هدف للسنة`);
  }
});
$("yearPlansPage").addEventListener("click", e => {
  const id = e.target.closest("[data-ypdel]")?.dataset.ypdel;
  if (!id) return;
  e.preventDefault();
  const yp = yearOf(ypYear);
  const g = yp.goals.find(x => x.id === id);
  if (!confirm(`حذف الهدف "${g.text}"؟`)) return;
  yp.goals = yp.goals.filter(x => x.id !== id);
  saveYearPlans();
  renderYearPlansPage();
});
$("ypPrev").addEventListener("click", () => { ypYear--; renderYearPlansPage(); });
$("ypNext").addEventListener("click", () => { ypYear++; renderYearPlansPage(); });
$("ypBack").addEventListener("click", () => { location.hash = "#/aspect/personal/goal"; });

// ================== الحلم الكبير ==================
const BIG_DREAM = createOpenList({
  prefix: "dr",
  pageId: "dreamPage",
  storageKey: "rehlatNajah.dreams",
  aspectId: "personal",
  backHash: "#/aspect/personal/goal",
  parentName: "الهدف العام",
  icon: "🌟",
  title: "الحلم الكبير",
  subtitle: "الحلم أو الهدف الكبير اللي ماشي ناحيته — خطوة كل سنة، على مدار 3 لـ 5 سنين ✨",
  word: "حلم",
  wordOpen: "حلم شغال",
  editTitle: "الحلم",
  emptyWord: "أحلام",
  formTitle: "إضافة حلم كبير",
  submitLabel: "إضافة الحلم",
  listTitle: "🌟 أحلامي الكبيرة",
  openGroup: "أحلام شغال عليها",
  doneGroup: "أحلام اتحققت",
  emptyText: "لسه ما كتبتش حلمك الكبير.",
  titleLabel: "الحلم / الهدف الكبير",
  titlePlaceholder: "مثلاً: أمتلك بيتي الخاص / أبقى مدير موارد بشرية / أحفظ القرآن كامل",
  titleSuggestions: ["أمتلك بيتي الخاص", "أحفظ القرآن كامل", "أوصل لمنصب مدير", "أعمل مشروعي الخاص", "أحقق الحرية المالية",
    "أحج أنا والعيلة", "أكمّل دراستي العليا", "أتكلم لغة جديدة بطلاقة", "أوصل لوزني المثالي وأحافظ عليه"],
  secondLabel: "المجال",
  secondIcon: "🏷️",
  secondPlaceholder: "مثلاً: ديني / عائلي / عملي",
  secondSuggestions: ["ديني", "صحي", "عائلي", "عملي", "مالي", "شخصي"],
  cost: true,
  steps: true,
  stepYears: true, // كل خطوة قدامها سنة بدل تاريخ
  stepPlaceholder: "الخطوة… (مثلاً: أحوّش مقدّم الشقة)",
  purposeLabel: "ليه الحلم ده مهم لي",
  purposeIcon: "💭",
  purposePlaceholder: "اكتب الدافع… ده اللي هيرجّعك للطريق لما تتعب",
  updatePlaceholder: "➕ سجّل تحديث… (مثلاً: حوّشت أول 100 ألف)",
  doneEmoji: "🌟",
  doneMessages: [
    "ألف مبروك! الحلم الكبير اتحقق — الحمد لله اللي بنعمته تتم الصالحات 🌟",
    "«وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَىٰ» — سنين من الصبر والعزيمة وصلتك 👏",
  ],
});

// ================== الهدف العام: صفحة الاختيارات ==================
const GOAL_HUB = createHub({
  prefix: "gh",
  pageId: "goalHubPage",
  aspectId: "personal",
  itemId: "goal",
  icon: "🎯",
  title: "الهدف العام",
  subs: [
    { id: "yearly", key: "gh_yearly", name: "الخطط السنوية", icon: "📅", desc: "أهداف كل سنة، وفي آخرها نعلّم على اللي اتحقق", ready: true,
      todayLine: () => { const s = yearStats(); return `<span class="item-today">${s.total ? `📅 خطة ${curYear()}: اتحقق ${s.done} من ${s.total}` : `اكتب أهداف سنة ${curYear()}`}</span>`; } },
    { id: "dream", key: "gh_dream", name: "الحلم الكبير", icon: "🌟", desc: "الهدف الكبير بخطوة كل سنة (3–5 سنين)", ready: true,
      todayLine: () => BIG_DREAM.statusLine() },
  ],
});
const renderGoalHubPage = () => GOAL_HUB.render();

function goalSummary() {
  const parts = [];
  if (GOAL_HUB.subOn("yearly")) { const s = yearStats(); parts.push({ done: s.done, required: s.total, late: 0 }); }
  if (GOAL_HUB.subOn("dream")) {
    // الحلم بيتقاس بكل خطواته (مش بس اللي جوه المرحلة) لأنه ممتد على سنين
    const st = BIG_DREAM.allSteps();
    parts.push({ done: st.filter(s => s.doneOn).length, required: st.length, late: st.filter(s => !s.doneOn && s.year && s.year < curYear()).length });
  }
  const sum = k => parts.reduce((n, p) => n + (p[k] || 0), 0);
  return { done: sum("done"), required: sum("required"), late: sum("late"), todayDone: 0, todayTotal: 0, streak: 0, lateLabel: "متأخر" };
}
