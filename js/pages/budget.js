// الميزانية العائلية: حاسبة شهرية لمصاريف البيت + تقرير تحليلي

// الشرائح وبنودها (القايمة اللي بتظهر بعد اختيار الشريحة)
const BUDGET_CATS = [
  { id: "fixed",    name: "المصاريف الدورية الثابتة", icon: "🧾",
    subs: ["فاتورة الكهرباء", "فاتورة الغاز", "فاتورة المياه", "الإنترنت", "الموبايل", "صيانة العمارة", "الإيجار", "اشتراكات (تطبيقات/قنوات)", "أخرى"] },
  { id: "medical",  name: "الرعاية الطبية", icon: "💊",
    subs: ["أدوية", "كشوفات", "تحاليل", "أشعة", "أسنان", "نظارات", "أخرى"] },
  { id: "fresh",    name: "الطعام الطازج", icon: "🥬",
    subs: ["خضروات", "فواكه", "أعشاب وتوابل طازة"] },
  { id: "meat",     name: "اللحوم الطازجة", icon: "🥩",
    subs: ["دجاج", "سمك", "لحوم حمراء", "بيض"] },
  { id: "grocery",  name: "السوبر ماركت والبقالة", icon: "🛒",
    subs: ["بقالة جافة (أرز، مكرونة، زيت…)", "ألبان وأجبان", "مصنعات ومجمدات", "منظفات", "مستلزمات شخصية", "مشروبات وسناكس", "أخرى"] },
  { id: "fastfood", name: "الفاست فود والدليفري", icon: "🍔",
    subs: ["مطاعم", "دليفري", "كافيهات", "حلويات"] },
  { id: "outings",  name: "الخروجات والترفيه", icon: "🎡",
    subs: ["خروجة عائلية", "سينما", "ملاهي", "نادي", "سفر ومصايف", "أخرى"] },
  { id: "clothes",  name: "الملابس", icon: "👕",
    subs: ["ملابس الزوجة", "ملابس الأولاد", "ملابسي", "أحذية", "أخرى"] },
  { id: "debts",    name: "الأقساط والمديونيات", icon: "💳",
    subs: ["قسط شهري", "سداد دين", "جمعية", "بطاقة ائتمان", "أخرى"] },
  { id: "car",      name: "السيارة", icon: "🚗",
    subs: ["بنزين", "صيانة", "غسيل", "ترخيص", "تأمين", "جراج / ركنة", "مخالفات", "أخرى"] },
  { id: "other",    name: "مصاريف أخرى", icon: "📦",
    subs: ["تعليم ودروس", "هدايا ومناسبات", "صدقات", "أدوات منزلية", "أخرى"] },
];
const bdCat = id => BUDGET_CATS.find(c => c.id === id) || BUDGET_CATS[BUDGET_CATS.length - 1];

// { "2026-11": { alloc: number|null, plans: { catId: number }, expenses: [{ id, cat, sub, amount, date, note }] } }
const BUDGET_KEY = "rehlatNajah.budgets";
let budgets = (() => { try { return JSON.parse(localStorage.getItem(BUDGET_KEY)) || {}; } catch { return {}; } })();
const saveBudgets = () => { try { localStorage.setItem(BUDGET_KEY, JSON.stringify(budgets)); } catch {} };

let bdMonth = null; // "YYYY-MM" المعروض
const monthKey = d => d.slice(0, 7);
const monthOf = k => (budgets[k] ??= { alloc: null, plans: {}, expenses: [] });
const peekMonth = k => budgets[k] || { alloc: null, plans: {}, expenses: [] };
function shiftMonth(k, n) {
  const [y, m] = k.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
const monthDays = k => { const [y, m] = k.split("-").map(Number); return new Date(Date.UTC(y, m, 0)).getUTCDate(); };
const monthLabel = k => { const [y, m] = k.split("-").map(Number); return new Intl.DateTimeFormat("ar-EG-u-nu-latn", { month: "long", year: "numeric" }).format(new Date(y, m - 1, 15)); };
const egp = n => `${Math.round(n).toLocaleString("en-US")} جنيه`;
const num = n => Math.round(n).toLocaleString("en-US");

// --- حسابات ---
function monthTotals(k) {
  const mo = peekMonth(k);
  const byCat = {}, bySub = {};
  let spent = 0;
  for (const e of mo.expenses) {
    spent += e.amount;
    byCat[e.cat] = (byCat[e.cat] || 0) + e.amount;
    const sk = `${e.cat}|${e.sub}`;
    bySub[sk] = (bySub[sk] || 0) + e.amount;
  }
  return { mo, spent, byCat, bySub };
}
function budgetNow() {
  const k = monthKey(todayStr());
  const { mo, spent } = monthTotals(k);
  return { alloc: mo.alloc, spent };
}

// --- بناء الصفحة ---
$("budgetPage").innerHTML = `
  <section class="card aspect-hero">
    <button class="back-btn" id="bdBack">→ رجوع</button>
    <div class="ah-icon">💵</div>
    <h2 class="ah-name">الميزانية العائلية</h2>
    <p class="ah-stage">مشاريع وميزانيات · حاسبة مصاريف البيت الشهرية</p>
    <div class="bd-monthnav">
      <button class="ap-btn" id="bdPrev" title="الشهر اللي فات" aria-label="الشهر اللي فات">→</button>
      <b id="bdMonthLbl"></b>
      <button class="ap-btn" id="bdNext" title="الشهر الجاي" aria-label="الشهر الجاي">←</button>
    </div>
  </section>

  <!-- المخصص والملخص -->
  <section class="card ip-card" id="bdOverview"></section>

  <!-- تسجيل مصروف -->
  <section class="card ip-card" id="bdFormCard">
    <h3 class="ip-title">➕ تسجيل مصروف</h3>
    <form id="bdForm" novalidate>
      <div class="form-grid">
        <div class="f">
          <label for="bdCat">الشريحة *</label>
          <select id="bdCat"></select>
        </div>
        <div class="f">
          <label for="bdSub">البند *</label>
          <select id="bdSub"></select>
        </div>
        <div class="f">
          <label for="bdAmount">المبلغ (جنيه) *</label>
          <input id="bdAmount" type="number" min="1" step="1" placeholder="مثلاً: 450" />
        </div>
        <div class="f">
          <label for="bdDate">التاريخ</label>
          <input id="bdDate" type="date" />
        </div>
        <div class="f full">
          <label for="bdNote">ملاحظة</label>
          <input id="bdNote" type="text" placeholder="مثلاً: فاتورة شهر أكتوبر / من سوق الخميس" />
        </div>
      </div>
      <p id="bdError" class="error"></p>
      <div class="form-actions">
        <button type="button" class="btn btn-outline" id="bdCopyFixed">📋 انسخ المصاريف الثابتة من الشهر اللي فات</button>
        <button type="submit" class="btn btn-primary">➕ تسجيل</button>
      </div>
    </form>
  </section>

  <!-- الشرائح -->
  <section class="card ip-card">
    <h3 class="ip-title">🗂️ المصاريف حسب الشريحة</h3>
    <p class="hint">دوس على أي شريحة عشان تشوف تفاصيلها. وتقدر تحط لكل شريحة مبلغ مخطط عشان تعرف لو عدّيته.</p>
    <div id="bdCats"></div>
  </section>

  <!-- التقرير -->
  <section class="card ip-card" id="bdReport"></section>`;

// --- العرض ---
function renderBudgetPage() {
  const aspect = ASPECTS.find(a => a.id === "family");
  currentAspect = aspect;
  const page = $("budgetPage");
  page.style.setProperty("--c", aspect.color);
  page.style.setProperty("--cl", aspect.light);
  document.title = "الميزانية العائلية — رحلة نجاح";
  if (!bdMonth) bdMonth = monthKey(todayStr());
  $("bdMonthLbl").textContent = monthLabel(bdMonth);

  // التاريخ الافتراضي للمصروف: النهارده لو الشهر الحالي، وإلا أول الشهر
  const first = `${bdMonth}-01`, last = `${bdMonth}-${String(monthDays(bdMonth)).padStart(2, "0")}`;
  $("bdDate").min = first;
  $("bdDate").max = last;
  if (!$("bdDate").value || monthKey($("bdDate").value) !== bdMonth) {
    $("bdDate").value = monthKey(todayStr()) === bdMonth ? todayStr() : first;
  }

  renderBdOverview();
  renderBdCats();
  renderBdReport();
}

function renderBdOverview() {
  const { mo, spent } = monthTotals(bdMonth);
  const alloc = mo.alloc;
  const t = todayStr();
  const isCurrent = monthKey(t) === bdMonth;
  const daysLeft = isCurrent ? monthDays(bdMonth) - Number(t.slice(8, 10)) + 1 : 0;
  const remaining = alloc != null ? alloc - spent : null;
  const pct = alloc ? Math.round((spent / alloc) * 100) : 0;
  const over = remaining != null && remaining < 0;

  $("bdOverview").innerHTML = `
    <form class="bd-alloc" id="bdAllocForm">
      <div class="f">
        <label for="bdAlloc">💰 المبلغ المخصص للمنزل في ${monthLabel(bdMonth)}</label>
        <input id="bdAlloc" type="number" min="0" step="100" placeholder="مثلاً: 15000" value="${alloc ?? ""}" />
      </div>
      <button type="submit" class="btn btn-primary">حفظ</button>
    </form>
    <div class="bd-tiles">
      <div class="bd-tile"><b>${alloc != null ? num(alloc) : "—"}</b><small>المخصص</small></div>
      <div class="bd-tile"><b>${num(spent)}</b><small>اتصرف</small></div>
      <div class="bd-tile ${over ? "bad" : remaining != null ? "good" : ""}"><b>${remaining != null ? (over ? `-${num(-remaining)}` : num(remaining)) : "—"}</b><small>${over ? "عدّيت الميزانية" : "الباقي"}</small></div>
      <div class="bd-tile"><b>${isCurrent && remaining != null && remaining > 0 ? num(remaining / daysLeft) : "—"}</b><small>${isCurrent ? `مسموح في اليوم (باقي ${daysLeft} يوم)` : "مسموح في اليوم"}</small></div>
    </div>
    ${alloc ? `
      <div class="ip-progress bd-bar ${over ? "over" : pct >= 85 ? "warn" : ""}"><div style="width:${Math.min(pct, 100)}%"></div></div>
      <div class="ip-pct"><span>صرفت ${pct}% من الميزانية</span><strong>${over ? "⚠ عدّيت الميزانية" : pct >= 85 ? "⚠ قرّبت تخلّص" : "✓ في الأمان"}</strong></div>`
      : `<p class="hint center" style="margin:6px 0 0">اكتب المبلغ المخصص للشهر عشان نحسبلك الباقي والمسموح في اليوم.</p>`}`;

  $("bdAllocForm").addEventListener("submit", e => {
    e.preventDefault();
    const v = $("bdAlloc").value;
    monthOf(bdMonth).alloc = v === "" ? null : Math.max(0, Number(v));
    saveBudgets();
    renderBudgetPage();
    toast(`تم حفظ ميزانية ${monthLabel(bdMonth)} ✓`);
  });
}

function renderBdCats() {
  const { mo, spent, byCat } = monthTotals(bdMonth);
  const cats = BUDGET_CATS.map(c => ({ ...c, total: byCat[c.id] || 0, plan: mo.plans[c.id] ?? null }))
    .sort((a, b) => b.total - a.total || BUDGET_CATS.indexOf(a) - BUDGET_CATS.indexOf(b));
  const max = Math.max(1, ...cats.map(c => Math.max(c.total, c.plan || 0)));

  $("bdCats").innerHTML = cats.map(c => {
    const share = spent ? Math.round((c.total / spent) * 100) : 0;
    const over = c.plan != null && c.total > c.plan;
    const list = mo.expenses.filter(e => e.cat === c.id).sort((a, b) => b.date.localeCompare(a.date));
    return `
      <details class="bd-cat ${c.total ? "" : "empty"} ${over ? "over" : ""}">
        <summary>
          <span class="bd-ci">${c.icon}</span>
          <span class="bd-cn">${c.name}<small>${list.length ? `${list.length} مصروف` : "مفيش مصاريف"}${c.plan != null ? ` · المخطط ${num(c.plan)}` : ""}</small></span>
          <span class="bd-cbar"><span style="width:${(c.total / max) * 100}%"></span>${c.plan != null ? `<i class="plan" style="inset-inline-start:${(c.plan / max) * 100}%" title="المخطط"></i>` : ""}</span>
          <span class="bd-cv"><b>${num(c.total)}</b><small>${share}%${over ? " · ⚠ عدّى المخطط" : ""}</small></span>
        </summary>
        <div class="bd-cat-body">
          <div class="bd-plan">
            <label>المخطط للشريحة دي في الشهر:</label>
            <input type="number" min="0" step="50" value="${c.plan ?? ""}" data-plan="${c.id}" placeholder="اختياري" />
            <button type="button" class="btn btn-outline btn-sm" data-saveplan="${c.id}">حفظ</button>
          </div>
          ${list.length ? list.map(e => `
            <div class="bd-exp">
              <span class="d">${formatShort(e.date)}</span>
              <span class="s">${escapeHtml(e.sub)}${e.note ? `<small>${escapeHtml(e.note)}</small>` : ""}</span>
              <b>${num(e.amount)}</b>
              <button class="ap-btn" data-delexp="${e.id}" title="حذف" aria-label="حذف المصروف">🗑</button>
            </div>`).join("") : `<p class="hint" style="margin:6px 0 0">مفيش مصاريف متسجلة في الشريحة دي الشهر ده.</p>`}
        </div>
      </details>`;
  }).join("");
}

function renderBdReport() {
  const { mo, spent, byCat, bySub } = monthTotals(bdMonth);
  const prevK = shiftMonth(bdMonth, -1);
  const prev = monthTotals(prevK);
  if (!spent) {
    $("bdReport").innerHTML = `<h3 class="ip-title">📊 تقرير ${monthLabel(bdMonth)}</h3><p class="hint center">لما تسجّل مصاريف، التقرير هيظهر هنا.</p>`;
    return;
  }
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const [topId, topVal] = cats[0];
  const top = bdCat(topId);
  const subs = Object.entries(bySub).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const t = todayStr();
  const isCurrent = monthKey(t) === bdMonth;
  const daysPassed = isCurrent ? Number(t.slice(8, 10)) : monthDays(bdMonth);
  const perDay = spent / daysPassed;
  // التوقع: المصاريف الثابتة والأقساط بتتدفع مرة في الشهر فمش بنضاعفها، والباقي بنحسبه بمعدل الصرف اليومي
  const ONCE = ["fixed", "debts"];
  const onceTotal = ONCE.reduce((n, id) => n + (byCat[id] || 0), 0);
  const variable = spent - onceTotal;
  const projected = isCurrent ? onceTotal + (variable / daysPassed) * monthDays(bdMonth) : null;
  const overPlans = BUDGET_CATS.filter(c => mo.plans[c.id] != null && (byCat[c.id] || 0) > mo.plans[c.id]);
  const diff = prev.spent ? spent - prev.spent : null;

  // مقارنة كل شريحة بالشهر اللي فات
  const cmp = BUDGET_CATS.filter(c => byCat[c.id] || prev.byCat[c.id]).map(c => {
    const a = byCat[c.id] || 0, b = prev.byCat[c.id] || 0;
    return { c, a, b, d: a - b };
  }).sort((x, y) => Math.abs(y.d) - Math.abs(x.d)).slice(0, 5);

  $("bdReport").innerHTML = `
    <h3 class="ip-title">📊 تقرير ${monthLabel(bdMonth)}</h3>
    <div class="bd-burn">
      <span class="fire">🔥</span>
      <span>
        <small>أكتر بند بيحرق فلوس</small>
        <b>${top.icon} ${top.name}</b>
        <span>${egp(topVal)} — يعني ${Math.round((topVal / spent) * 100)}% من مصاريف الشهر</span>
      </span>
    </div>

    <div class="bd-tiles" style="margin-top:12px">
      <div class="bd-tile"><b>${num(spent)}</b><small>إجمالي المصروف</small></div>
      <div class="bd-tile"><b>${num(perDay)}</b><small>متوسط الصرف في اليوم</small></div>
      <div class="bd-tile"><b>${projected ? num(projected) : "—"}</b><small>${isCurrent ? "المتوقع لآخر الشهر" : "متوقع آخر الشهر"}</small></div>
      <div class="bd-tile ${diff == null ? "" : diff > 0 ? "bad" : "good"}"><b>${diff == null ? "—" : `${diff > 0 ? "↑" : "↓"} ${num(Math.abs(diff))}`}</b><small>مقارنة بـ ${monthLabel(prevK)}</small></div>
    </div>
    ${projected && mo.alloc && projected > mo.alloc ? `<p class="bd-alert">⚠ بالمعدل ده هتصرف حوالي ${egp(projected)} — يعني هتعدّي الميزانية بـ ${egp(projected - mo.alloc)}</p>` : ""}
    ${overPlans.length ? `<p class="bd-alert">⚠ شرائح عدّت المخطط: ${overPlans.map(c => `${c.icon} ${c.name} (+${num((byCat[c.id] || 0) - mo.plans[c.id])})`).join(" · ")}</p>` : ""}

    <h4 class="bd-h4">🏷️ أكتر 5 بنود صرفت عليها</h4>
    ${subs.map(([k, v], i) => {
      const [cid, sub] = k.split("|");
      return `<div class="bd-rank"><span class="n">${i + 1}</span><span class="s">${bdCat(cid).icon} ${escapeHtml(sub)}<small>${bdCat(cid).name}</small></span><b>${egp(v)}</b></div>`;
    }).join("")}

    ${prev.spent ? `
      <h4 class="bd-h4">↕️ أكبر تغيير عن ${monthLabel(prevK)}</h4>
      ${cmp.map(x => `
        <div class="bd-rank">
          <span class="n">${x.c.icon}</span>
          <span class="s">${x.c.name}<small>${num(x.b)} ← ${num(x.a)}</small></span>
          <b class="${x.d > 0 ? "up" : x.d < 0 ? "down" : ""}">${x.d > 0 ? "↑" : x.d < 0 ? "↓" : ""} ${num(Math.abs(x.d))}</b>
        </div>`).join("")}` : ""}

    <div style="text-align:center;margin-top:14px">
      <button class="btn btn-outline btn-sm" style="flex:none" id="bdPrint">🖨️ طباعة / حفظ التقرير PDF</button>
    </div>`;
  $("bdPrint").addEventListener("click", () => window.print());
}

// --- الاستمارة ---
function bdFillSubs() {
  const c = bdCat($("bdCat").value);
  $("bdSub").innerHTML = c.subs.map(s => `<option value="${s}">${s}</option>`).join("");
}
$("bdCat").innerHTML = BUDGET_CATS.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join("");
bdFillSubs();
$("bdCat").addEventListener("change", bdFillSubs);
$("bdForm").addEventListener("input", e => e.target.classList.remove("invalid"));

$("bdForm").addEventListener("submit", e => {
  e.preventDefault();
  const amount = Number($("bdAmount").value);
  const date = $("bdDate").value || todayStr();
  if (!(amount > 0)) { $("bdAmount").classList.add("invalid"); $("bdError").textContent = "اكتب المبلغ"; return; }
  if (monthKey(date) !== bdMonth) { $("bdDate").classList.add("invalid"); $("bdError").textContent = `التاريخ لازم يكون جوه ${monthLabel(bdMonth)}`; return; }
  $("bdError").textContent = "";
  const cat = $("bdCat").value, sub = $("bdSub").value;
  monthOf(bdMonth).expenses.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    cat, sub, amount, date, note: $("bdNote").value.trim(),
  });
  saveBudgets();
  $("bdAmount").value = "";
  $("bdNote").value = "";
  renderBudgetPage();
  const { mo, spent } = monthTotals(bdMonth);
  const left = mo.alloc != null ? mo.alloc - spent : null;
  toast(`اتسجّل ${egp(amount)} على "${sub}" ✓${left != null ? ` — ${left >= 0 ? `الباقي ${egp(left)}` : `⚠ عدّيت الميزانية بـ ${egp(-left)}`}` : ""}`);
  $("bdAmount").focus();
});

// نسخ المصاريف الثابتة (فواتير واشتراكات) من الشهر اللي فات بنفس المبالغ
$("bdCopyFixed").addEventListener("click", () => {
  const prevK = shiftMonth(bdMonth, -1);
  const fixed = peekMonth(prevK).expenses.filter(e => e.cat === "fixed");
  if (!fixed.length) { toast(`مفيش مصاريف ثابتة متسجلة في ${monthLabel(prevK)}`); return; }
  const total = fixed.reduce((n, e) => n + e.amount, 0);
  if (!confirm(`هننسخ ${fixed.length} مصروف ثابت من ${monthLabel(prevK)} (إجمالي ${egp(total)}) لشهر ${monthLabel(bdMonth)}.\nتقدر تعدّل أو تحذف أي واحد بعدها. نكمّل؟`)) return;
  const days = monthDays(bdMonth);
  const mo = monthOf(bdMonth);
  fixed.forEach(e => {
    const day = Math.min(Number(e.date.slice(8, 10)), days);
    mo.expenses.push({ ...e, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), date: `${bdMonth}-${String(day).padStart(2, "0")}` });
  });
  // ونسخ المبلغ المخصص لو لسه مش متحدد
  if (mo.alloc == null && peekMonth(prevK).alloc != null) mo.alloc = peekMonth(prevK).alloc;
  saveBudgets();
  renderBudgetPage();
  toast(`اتنسخت المصاريف الثابتة ✓ (${egp(total)})`);
});

// --- أزرار الشرائح ---
$("bdCats").addEventListener("click", e => {
  const del = e.target.closest("[data-delexp]");
  if (del) {
    const mo = monthOf(bdMonth);
    const ex = mo.expenses.find(x => x.id === del.dataset.delexp);
    if (!confirm(`حذف ${egp(ex.amount)} (${ex.sub})؟`)) return;
    mo.expenses = mo.expenses.filter(x => x.id !== ex.id);
    saveBudgets();
    const openCat = ex.cat;
    renderBudgetPage();
    document.querySelector(`#bdCats details:has([data-plan="${openCat}"])`)?.setAttribute("open", "");
    return;
  }
  const sp = e.target.closest("[data-saveplan]");
  if (sp) {
    const id = sp.dataset.saveplan;
    const v = document.querySelector(`[data-plan="${id}"]`).value;
    const mo = monthOf(bdMonth);
    if (v === "") delete mo.plans[id]; else mo.plans[id] = Math.max(0, Number(v));
    saveBudgets();
    renderBudgetPage();
    document.querySelector(`#bdCats details:has([data-plan="${id}"])`)?.setAttribute("open", "");
    toast("تم حفظ المخطط ✓");
  }
});

$("bdPrev").addEventListener("click", () => { bdMonth = shiftMonth(bdMonth, -1); $("bdDate").value = ""; renderBudgetPage(); });
$("bdNext").addEventListener("click", () => { bdMonth = shiftMonth(bdMonth, 1); $("bdDate").value = ""; renderBudgetPage(); });
$("bdBack").addEventListener("click", () => { location.hash = "#/aspect/family/projects"; });
