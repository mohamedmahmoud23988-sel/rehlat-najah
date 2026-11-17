// صفحة الوجبات الصحية: خطة أسبوعية بتبدأ من أي تاريخ تختاره
// الأسبوع = 7 أيام من تاريخ البداية: أول 6 أيام فيهم وجبات، واليوم السابع دايماً يوم حر (Free Day)

const MEALS = [
  { id: "breakfast", name: "فطار", icon: "🍳" },
  { id: "lunch",     name: "غدا",  icon: "🍲" },
  { id: "dinner",    name: "عشا",  icon: "🥘" },
  { id: "snack",     name: "سناك", icon: "🍎" },
];
const PLAN_DAYS = 6;      // أيام الوجبات
const FREE_DAY_INDEX = 6; // اليوم السابع
const MEAL_SUGGESTIONS = [
  "شوفان باللبن والفواكه", "بيض مسلوق وعيش بلدي", "أومليت بالخضار", "فول بزيت زيتون", "جبنة قريش وخيار وطماطم", "زبادي بالفواكه",
  "صدور فراخ مشوية وسلطة", "سمك مشوي وأرز بني", "لحمة مشوية وخضار سوتيه", "تونة بالخضار", "شوربة عدس", "مكرونة سمراء بالفراخ",
  "سلطة خضرا كبيرة", "خضار سوتيه", "بطاطا مشوية", "زبادي يوناني", "فاكهة", "حفنة مكسرات نيئة", "تمر ولبن", "خيار وجزر",
];

// [{ weekStart: "YYYY-MM-DD" (أول يوم في الأسبوع — أي يوم), repeat: bool, days: [{ breakfast, lunch, dinner, snack } × 6] }]
const PLANS_KEY = "rehlatNajah.mealPlans";
const MEALS_LOG = "health.meals"; // logData["health.meals"]["2026-11-16"] = { breakfast: "ok", ... }
let mealPlans = (() => {
  try { return JSON.parse(localStorage.getItem(PLANS_KEY)) || []; } catch { return []; }
})();
function savePlans() {
  mealPlans.sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  try { localStorage.setItem(PLANS_KEY, JSON.stringify(mealPlans)); } catch {}
}
let mlViewStart = null; // أول يوم في الأسبوع المعروض

// الخطة اللي شغالة في يوم معيّن: آخر خطة بدأت قبله أو فيه.
// لو اليوم جوه أسبوعها الأول → منها، لو بعده → منها بس لو متعلّم عليها "كرّر"
function planOn(d) {
  const p = mealPlans.filter(x => x.weekStart <= d).sort((a, b) => b.weekStart.localeCompare(a.weekStart))[0];
  if (!p) return null;
  const offset = daysBetween(p.weekStart, d);
  if (offset >= 7 && !p.repeat) return null;
  return {
    plan: p,
    index: offset % 7,                               // رقم اليوم جوه الأسبوع (0..6)
    cycleStart: addDays(p.weekStart, offset - (offset % 7)),
    repeated: offset >= 7,
  };
}
function mealsOn(d) {
  const p = planOn(d);
  if (!p) return { free: false, list: null }; // مفيش خطة
  if (p.index === FREE_DAY_INDEX) return { free: true, list: [] };
  const day = p.plan.days[p.index] || {};
  return { free: false, list: MEALS.filter(m => (day[m.id] || "").trim()).map(m => ({ ...m, text: day[m.id] })) };
}
// أول يوم في "الأسبوع" اللي فيه التاريخ ده (حسب الخطة الشغالة، أو التاريخ نفسه لو مفيش خطة)
const cycleStartOf = d => planOn(d)?.cycleStart || d;

function mealDone(d, mealId) {
  const day = logData[MEALS_LOG]?.[d];
  return !!(day && typeof day === "object" && day[mealId]);
}
function setMealDone(d, mealId, val) {
  const all = (logData[MEALS_LOG] ??= {});
  const day = (typeof all[d] === "object" && all[d]) || (all[d] = {});
  if (val) day[mealId] = "ok"; else delete day[mealId];
  saveLog();
}

// --- الإحصائيات ---
function mealsToday() {
  const t = todayStr();
  const m = mealsOn(t);
  if (!m.list) return { total: 0, done: 0, free: m.free, noPlan: !m.free };
  return { total: m.list.length, done: m.list.filter(x => mealDone(t, x.id)).length, free: false, noPlan: false };
}
function mealsStageStats() {
  if (!state.endDate) return null;
  const start = trackingStart("health", "diet_meals");
  const today = todayStr();
  let required = 0, done = 0, missed = 0;
  for (let d = start; d < state.endDate; d = addDays(d, 1)) {
    const m = mealsOn(d);
    if (!m.list) continue; // الأيام اللي مالهاش خطة لسه مش بتتحسب
    for (const x of m.list) {
      required++;
      if (mealDone(d, x.id)) done++;
      else if (d < today) missed++;
    }
  }
  return { required, done, missed, remaining: Math.max(required - done - missed, 0), pct: required ? Math.round((done / required) * 100) : 0 };
}
// أيام متواصلة التزمت فيها بكل وجبات اليوم (اليوم الحر مش بيقطع السلسلة)
function mealsStreak() {
  let d = todayStr();
  const full = x => { const m = mealsOn(x); return m.list && m.list.length && m.list.every(y => mealDone(x, y.id)); };
  if (!full(d)) d = addDays(d, -1);
  let n = 0;
  for (let guard = 0; guard < 400; guard++) {
    if (mealsOn(d).free) { d = addDays(d, -1); continue; }
    if (!full(d)) break;
    n++; d = addDays(d, -1);
  }
  return n;
}

// --- العرض ---
function rangeText(start) { return `من ${formatDate(start)} لـ ${formatDate(addDays(start, 6))}`; }
function viewLabel(start) {
  const t = todayStr();
  if (t >= start && t < addDays(start, 7)) return "الأسبوع الحالي";
  return start > t ? "أسبوع جاي" : "أسبوع فات";
}

function renderMealsPage() {
  const aspect = ASPECTS.find(a => a.id === "health");
  currentAspect = aspect;
  const page = $("mealsPage");
  page.style.setProperty("--c", aspect.color);
  page.style.setProperty("--cl", aspect.light);
  document.title = "الوجبات الصحية — رحلة نجاح";
  $("mlStage").innerHTML = `الحمية الغذائية · المرحلة ${ORDINALS[state.stageIndex]}: <strong>${STAGES[state.stageIndex].name}</strong>`;
  const streak = mealsStreak();
  $("mlStreak").textContent = streak >= 2 ? `🔥 ${streak} أيام متواصلة التزمت فيهم بكل الوجبات` : "";
  if (!mlViewStart) mlViewStart = cycleStartOf(todayStr());

  renderMealsToday();
  renderMealsWeek();
  renderMealsProgress();
}

// بداية الأسبوع الجاي بعد الأسبوع الحالي (لو في خطة شغالة)
function nextCycleStart() {
  const p = planOn(todayStr());
  return p ? addDays(p.cycleStart, 7) : null;
}

function renderMealsToday() {
  const t = todayStr();
  const m = mealsOn(t);
  const p = planOn(t);
  const next = nextCycleStart();
  // تذكير بخطة الأسبوع الجاي في آخر يومين من الأسبوع
  const nextAlert = p && p.index >= 5 && next && !planOn(next)
    ? `<div class="ml-alert"><span>📅 الأسبوع الجاي (من ${formatDate(next)}) لسه مالوش خطة أكل</span><button class="btn btn-primary" data-plan="${next}">ادخل أكل الأسبوع الجاي</button></div>`
    : "";

  if (m.free) {
    $("mlToday").innerHTML = `
      ${nextAlert}
      <div class="ml-free">
        <div class="big">🎉</div>
        <b>النهارده آخر يوم في الأسبوع — يوم حر (Free Day)</b>
        <small>استمتع بأكلك باعتدال، وبكرة نرجع للخطة إن شاء الله</small>
      </div>`;
    return;
  }
  if (!m.list) {
    $("mlToday").innerHTML = `
      <div class="ml-alert"><span>⚠️ مفيش خطة أكل شغالة النهارده</span><button class="btn btn-primary" data-plan="${t}">ادخل أكل الأسبوع</button></div>
      <p class="hint center" style="margin:0">اختار تاريخ بداية الأسبوع واكتب وجباته، وكل يوم وجباته هتظهر هنا تعلّم عليها.</p>`;
    return;
  }
  if (!m.list.length) {
    $("mlToday").innerHTML = `${nextAlert}<p class="md-empty">مفيش وجبات متسجّلة للنهارده في الخطة.</p>`;
    return;
  }
  const done = m.list.filter(x => mealDone(t, x.id)).length;
  $("mlToday").innerHTML = `
    ${nextAlert}
    <div class="md-head">
      <div>
        <h3 class="ip-title" style="margin-bottom:0">🍽️ وجبات النهارده</h3>
        <p class="md-date">${formatDate(t)} · اليوم ${p.index + 1} من الأسبوع</p>
      </div>
      <span class="md-count">${done} من ${m.list.length}</span>
    </div>
    <p class="hint">علّم على كل وجبة أكلتها زي الخطة</p>
    ${m.list.map(x => `
      <label class="ml-meal-row">
        <input type="checkbox" data-meal="${x.id}" data-date="${t}" ${mealDone(t, x.id) ? "checked" : ""} />
        <span class="mi">${x.icon}</span>
        <span class="t"><small>${x.name}</small><span>${escapeHtml(x.text)}</span></span>
        <span class="bc-box">✓</span>
      </label>`).join("")}`;
}

function renderMealsWeek() {
  const start = mlViewStart;
  const t = todayStr();
  const p = planOn(start);
  // لو أول يوم في العرض مش أول يوم في أسبوع الخطة، نظبطه على بداية أسبوعها
  const aligned = p ? p.cycleStart : start;
  if (aligned !== start) { mlViewStart = aligned; return renderMealsWeek(); }

  $("mlWeekTitle").textContent = `📅 ${viewLabel(start)}`;
  $("mlWeekSub").textContent = `${rangeText(start)}${p?.repeated ? " · 🔁 خطة متكررة" : ""}`;

  if (!p) {
    $("mlWeek").innerHTML = `
      <div class="ml-week-empty">
        <p>مفيش خطة أكل للأيام دي</p>
        ${addDays(start, 6) >= t ? `<button class="btn btn-primary" style="margin-top:8px" data-plan="${start >= t ? start : t}">ادخل أكل الأسبوع</button>` : ""}
      </div>`;
    return;
  }
  const cells = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(start, i);
    const [, , dd] = d.split("-").map(Number);
    const isToday = d === t;
    if (i === FREE_DAY_INDEX) {
      cells.push(`<div class="ml-day free ${isToday ? "today" : ""}"><div class="ml-day-h"><b>${dayName(d)}</b><small>${dd}</small></div><div class="free-txt">🎉 يوم حر<br>Free Day</div></div>`);
      continue;
    }
    const day = p.plan.days[i] || {};
    const items = MEALS.filter(m => (day[m.id] || "").trim()).map(m => {
      const done = mealDone(d, m.id);
      const st = done ? "done" : d > t ? "future" : d < t ? "missed" : "";
      return `
        <label class="ml-item ${st}" title="${d > t ? "تقدر تعلّم لما ييجي اليوم" : ""}">
          <input type="checkbox" data-meal="${m.id}" data-date="${d}" ${done ? "checked" : ""} ${d > t ? "disabled" : ""} />
          <span class="mt"><small>${m.icon} ${m.name}:</small>${escapeHtml(day[m.id])}</span>
        </label>`;
    }).join("");
    cells.push(`
      <div class="ml-day ${isToday ? "today" : ""}">
        <div class="ml-day-h"><b>${dayName(d)}</b><small>${dd}</small></div>
        ${items || `<div class="free-txt" style="color:var(--muted)">مفيش وجبات</div>`}
      </div>`);
  }
  const editable = addDays(start, 6) >= t;
  $("mlWeek").innerHTML = `
    <div class="ml-week">${cells.join("")}</div>
    ${editable ? `<div style="text-align:center;margin-top:12px"><button class="btn btn-outline btn-sm" style="flex:none" data-plan="${start}" data-edit="1">✎ تعديل خطة الأسبوع ده</button></div>` : ""}`;
}

function renderMealsProgress() {
  const s = mealsStageStats();
  if (!s) { $("mlProgress").innerHTML = `<p class="hint center">حدد تاريخ نهاية المرحلة من الصفحة الرئيسية عشان نحسب التزامك 📅</p>`; return; }
  if (!s.required) { $("mlProgress").innerHTML = `<p class="hint center">لما تدخل خطة أكل، هنحسب التزامك بالوجبات هنا.</p>`; return; }
  $("mlProgress").innerHTML = `
    <div class="ip-stats">
      <div class="ip-stat"><b>${s.required}</b><small>وجبة في الخطط</small></div>
      <div class="ip-stat done"><b>${s.done}</b><small>التزمت بيها</small></div>
      <div class="ip-stat late"><b>${s.missed}</b><small>متعلّمش</small></div>
      <div class="ip-stat"><b>${s.remaining}</b><small>متبقي</small></div>
    </div>
    <div class="ip-progress"><div style="width:${s.pct}%"></div></div>
    <div class="ip-pct"><span>${s.done} من ${s.required} وجبة</span><strong>${s.pct}%</strong></div>
    <p class="ap-rate">الأيام اللي لسه مالهاش خطة مش بتتحسب، وآخر يوم في كل أسبوع يوم حر.</p>`;
}

// --- الاستمارة ---
function mlBuildForm(start, source) {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(start, i);
    if (i === FREE_DAY_INDEX) {
      days.push(`<div class="ml-fday free">🎉 ${dayName(d)} ${formatShort(d)}<br>يوم حر (Free Day)</div>`);
      continue;
    }
    const v = source?.days?.[i] || {};
    days.push(`
      <div class="ml-fday">
        <div class="ml-fday-h">${dayName(d)} <small>${formatShort(d)} · اليوم ${i + 1}</small></div>
        ${MEALS.map(m => `
          <div class="ml-fin">
            <label for="ml-${i}-${m.id}">${m.icon} ${m.name}</label>
            <input id="ml-${i}-${m.id}" data-i="${i}" data-m="${m.id}" list="mlSuggest" value="${escapeHtml(v[m.id] || "")}" />
          </div>`).join("")}
      </div>`);
  }
  $("mlDays").innerHTML = days.join("");
  $("mlRange").textContent = `الأسبوع ${rangeText(start)} — وآخر يوم (${dayName(addDays(start, 6))}) يوم حر`;
}

// لما تختار تاريخ: لو في خطة بتبدأ في اليوم ده بالظبط نفتحها للتعديل
function mlLoadStart(start) {
  const exact = mealPlans.find(p => p.weekStart === start);
  // الأيام اللي كتبتها قبل ما تغيّر التاريخ بتفضل زي ما هي
  const typed = mlReadDays();
  mlBuildForm(start, exact || (typed.filled ? { days: typed.days } : null));
  if (exact) $("mlRepeat").checked = !!exact.repeat;
  $("mlError").textContent = "";
}
function mlReadDays() {
  const days = Array.from({ length: PLAN_DAYS }, () => ({}));
  let filled = 0;
  document.querySelectorAll("#mlDays input[data-i]").forEach(inp => {
    const v = inp.value.trim();
    if (v) { days[+inp.dataset.i][inp.dataset.m] = v; filled++; }
  });
  return { days, filled };
}

function mlOpenForm(start) {
  $("mlStart").value = start;
  const exact = mealPlans.find(p => p.weekStart === start);
  const applied = planOn(start);
  mlBuildForm(start, exact || (applied && applied.cycleStart === start ? applied.plan : null));
  $("mlRepeat").checked = exact ? !!exact.repeat : false;
  $("mlError").textContent = "";
  $("mlFormCard").scrollIntoView({ behavior: "smooth", block: "start" });
}

function mlDefaultStart() {
  const t = todayStr();
  if (!planOn(t)) return t;               // مفيش خطة النهارده → نبدأ من النهارده
  return nextCycleStart();                // وإلا أول يوم في الأسبوع الجاي
}

$("mlSuggest").innerHTML = MEAL_SUGGESTIONS.map(s => `<option value="${s}">`).join("");
$("mlStart").value = mlDefaultStart();
mlBuildForm($("mlStart").value, mealPlans.find(p => p.weekStart === $("mlStart").value));

$("mlStart").addEventListener("change", e => { if (e.target.value) mlLoadStart(e.target.value); });
$("mlCopy").addEventListener("click", () => {
  const start = $("mlStart").value;
  const last = mealPlans.filter(p => p.weekStart < start).sort((a, b) => b.weekStart.localeCompare(a.weekStart))[0]
            || mealPlans.filter(p => p.weekStart !== start).slice(-1)[0];
  if (!last) { toast("مفيش خطة قديمة تنسخ منها"); return; }
  mlBuildForm(start, last);
  toast(`اتنسخت الخطة اللي بدأت ${formatDate(last.weekStart)} — عدّل اللي انت عايزه واحفظ`);
});
$("mlClear").addEventListener("click", () => {
  $("mlDays").querySelectorAll("input").forEach(i => { i.value = ""; });
  $("mlRepeat").checked = false;
});

$("mlForm").addEventListener("submit", e => {
  e.preventDefault();
  const start = $("mlStart").value;
  if (!start) { $("mlError").textContent = "اختار تاريخ بداية الأسبوع"; $("mlStart").classList.add("invalid"); return; }
  const { days, filled } = mlReadDays();
  if (!filled) { $("mlError").textContent = "اكتب وجبة واحدة على الأقل"; return; }

  // ما ينفعش أسبوعين يدخلوا في بعض: لو في خطة تانية بتبدأ جوه الـ 7 أيام دول
  const clash = mealPlans.find(p => p.weekStart > start && p.weekStart < addDays(start, 7));
  if (clash) {
    $("mlError").textContent = `في خطة تانية بتبدأ ${formatDate(clash.weekStart)} جوه الأسبوع ده. اختار تاريخ بداية تاني أو عدّل الخطة دي.`;
    return;
  }

  const repeat = $("mlRepeat").checked;
  const existing = mealPlans.find(p => p.weekStart === start);
  if (existing) Object.assign(existing, { days, repeat });
  else mealPlans.push({ weekStart: start, repeat, days });
  savePlans();
  mlViewStart = start;
  renderMealsPage();
  $("mlStart").value = mlDefaultStart();
  mlBuildForm($("mlStart").value, mealPlans.find(p => p.weekStart === $("mlStart").value));
  $("mlRepeat").checked = false;
  toast(`تم حفظ خطة الأسبوع ${rangeText(start)} ✓ (${filled} وجبة)${repeat ? " — وهتتكرر كل 7 أيام 🔁" : ""}`);
  $("mlWeek").scrollIntoView({ behavior: "smooth", block: "center" });
});
$("mlStart").addEventListener("input", e => e.target.classList.remove("invalid"));

// --- التعليم على الوجبات ---
const MEAL_MSGS = [
  "صحة وهنا 💚 وجبة صحية كمان في رصيدك",
  "عاش! التزمت بالخطة 👏",
  "جسمك بيشكرك على الأكل الصحي ده 🌿",
  "خطوة جديدة نحو وزنك المثالي 💪",
];
$("mealsPage").addEventListener("change", e => {
  const { meal, date } = e.target.dataset;
  if (!meal || !date) return;
  if (date > todayStr()) { renderMealsPage(); return; }
  setMealDone(date, meal, e.target.checked);
  renderMealsPage();
  if (!e.target.checked) return;
  if (date === todayStr()) {
    const c = mealsToday();
    if (c.total > 1 && c.done === c.total) celebrate("🥗", "ما شاء الله! التزمت بكل وجبات النهارده زي الخطة بالظبط 👏 صحة وهنا");
    else toast(MEAL_MSGS[Math.floor(Math.random() * MEAL_MSGS.length)]);
  } else {
    toast(`اتسجّل ✓ ${formatDate(date)}`);
  }
});

$("mealsPage").addEventListener("click", e => {
  const start = e.target.closest("[data-plan]")?.dataset.plan;
  if (start) mlOpenForm(start);
});
$("mlPrev").addEventListener("click", () => { mlViewStart = addDays(mlViewStart, -7); renderMealsWeek(); });
$("mlNext").addEventListener("click", () => { mlViewStart = addDays(mlViewStart, 7); renderMealsWeek(); });
$("mealsBackBtn").addEventListener("click", () => { location.hash = "#/aspect/health/diet"; });
