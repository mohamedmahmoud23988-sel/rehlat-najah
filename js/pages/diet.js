// الحمية الغذائية: صفحة الاختيارات (الممنوعات / الوجبات الصحية) + صفحة الممنوعات

// الاختيارات الفرعية جوه الحمية، وليها On/Off للمرحلة زي باقي الاختيارات
const DIET_SUBS = [
  { id: "forbidden", key: "diet_forbidden", name: "الممنوعات",       icon: "🚫", desc: "أكلات ممنوعة لمدة محددة وتعلّم كل يوم التزمت فيه" },
  { id: "meals",     key: "diet_meals",     name: "الوجبات الصحية",  icon: "🥗", desc: "الوجبات والنظام الغذائي الصحي" },
];
const dietSubOn = id => isOn("health", DIET_SUBS.find(s => s.id === id).key);

// ================== صفحة الاختيارات ==================
function renderDietPage() {
  const aspect = ASPECTS.find(a => a.id === "health");
  currentAspect = aspect;
  const page = $("dietPage");
  page.style.setProperty("--c", aspect.color);
  page.style.setProperty("--cl", aspect.light);
  document.title = "الحمية الغذائية — رحلة نجاح";
  $("dtStage").innerHTML = `${aspect.name} · المرحلة ${ORDINALS[state.stageIndex]}: <strong>${STAGES[state.stageIndex].name}</strong>`;

  $("dietItems").innerHTML = DIET_SUBS.map(s => {
    const on = dietSubOn(s.id);
    let todayLine = "";
    if (on && s.id === "forbidden") {
      const c = bansToday();
      todayLine = c.total
        ? `<span class="item-today ${c.done === c.total ? "done" : "pending"}">${c.done === c.total ? "✓" : "●"} التزمت بـ ${c.done} من ${c.total} ممنوع النهارده</span>`
        : `<span class="item-today">مفيش ممنوعات شغالة النهارده</span>`;
    } else if (on && s.id === "meals") {
      const c = mealsToday();
      todayLine = c.free ? `<span class="item-today done">🎉 النهارده يوم حر</span>`
        : c.noPlan ? `<span class="item-today pending">⚠️ ادخل خطة أكل الأسبوع</span>`
        : c.total ? `<span class="item-today ${c.done === c.total ? "done" : "pending"}">${c.done === c.total ? "✓" : "●"} التزمت بـ ${c.done} من ${c.total} وجبة النهارده</span>`
        : "";
    }
    return `
      <div class="item ${on ? "on" : ""}" data-sub="${s.id}">
        <span class="item-icon">${s.icon}</span>
        <span class="item-body">
          <span class="item-name">${s.name}</span>
          <span class="item-desc">${s.desc}</span>
          <span class="item-status">${on ? "✓ معاك في المرحلة دي" : "مش في المرحلة دي"}</span>
          ${todayLine}
        </span>
        <label class="switch" aria-label="${s.name}">
          <input type="checkbox" data-sub="${s.id}" ${on ? "checked" : ""} />
          <span class="slider"></span>
        </label>
        <span class="item-go">‹</span>
      </div>`;
  }).join("");
}

$("dietItems").addEventListener("change", e => {
  const id = e.target.dataset.sub;
  if (!id) return;
  const s = DIET_SUBS.find(x => x.id === id);
  setOn("health", s.key, e.target.checked);
  renderDietPage();
  toast(e.target.checked ? `تم تفعيل "${s.name}" — دوس عليها عشان تدخل` : `تم إيقاف "${s.name}"`);
});
$("dietItems").addEventListener("click", e => {
  if (e.target.closest(".switch")) return;
  const row = e.target.closest("[data-sub]");
  if (!row) return;
  const s = DIET_SUBS.find(x => x.id === row.dataset.sub);
  if (!dietSubOn(s.id)) { toast(`فعّل "${s.name}" الأول عشان تدخل عليها`); return; }
  location.hash = `#/aspect/health/diet/${s.id}`;
});
$("dietBackBtn").addEventListener("click", () => { location.hash = "#/aspect/health"; });

// ================== الممنوعات ==================
// { id, name, reason, start, days, baseDays, stoppedOn }
const BANS_KEY = "rehlatNajah.bans";
const BANS_LOG = "health.bans"; // logData["health.bans"]["2026-11-16"] = { banId: "ok" }
const BAN_SUGGESTIONS = ["السكر المباشر", "الحلويات", "المشروبات الغازية", "العصائر المحلاة", "المقليات", "الوجبات السريعة",
  "الخبز الأبيض", "النشويات بالليل", "الملح الزيادة", "المخللات", "اللحوم المصنعة", "الأكل بعد الساعة 9", "الشيبسي والسناكس", "الشاي والقهوة الزيادة"];
const WD_SHORT = ["أحد", "اتنين", "تلات", "أربع", "خميس", "جمعة", "سبت"];

let bans = (() => {
  try { return JSON.parse(localStorage.getItem(BANS_KEY)) || []; } catch { return []; }
})();
function saveBans() {
  try { localStorage.setItem(BANS_KEY, JSON.stringify(bans)); } catch {}
}

function banEnd(b) {
  let end = addDays(b.start, b.days);
  if (b.stoppedOn && b.stoppedOn < end) end = b.stoppedOn;
  return end; // أول يوم برّه المنع
}
const banActiveOn = (b, d) => d >= b.start && d < banEnd(b);
function banKept(d, id) {
  const day = logData[BANS_LOG]?.[d];
  return !!(day && typeof day === "object" && day[id]);
}
function setBanKept(d, id, val) {
  const all = (logData[BANS_LOG] ??= {});
  const day = (typeof all[d] === "object" && all[d]) || (all[d] = {});
  if (val) day[id] = "ok"; else delete day[id];
  saveLog();
}
function banDays(b) {
  const out = [];
  for (let d = b.start; d < banEnd(b); d = addDays(d, 1)) out.push(d);
  return out;
}
function banStats(b) {
  const today = todayStr();
  const days = banDays(b);
  const kept = days.filter(d => banKept(d, b.id)).length;
  const missed = days.filter(d => d < today && !banKept(d, b.id)).length;
  return { total: days.length, kept, missed, pct: days.length ? Math.round((kept / days.length) * 100) : 0 };
}
function banStreak(b) {
  let d = todayStr();
  if (!banKept(d, b.id)) d = addDays(d, -1);
  let n = 0;
  while (d >= b.start && banActiveOn(b, d) && banKept(d, b.id)) { n++; d = addDays(d, -1); }
  return n;
}
const bansOn = d => bans.filter(b => banActiveOn(b, d));
function bansToday() {
  const t = todayStr();
  const list = bansOn(t);
  return { total: list.length, done: list.filter(b => banKept(t, b.id)).length };
}
function bansStageStats() {
  if (!state.endDate) return null;
  const start = trackingStart("health", "diet_forbidden");
  const today = todayStr();
  let required = 0, done = 0, missed = 0;
  for (let d = start; d < state.endDate; d = addDays(d, 1)) {
    for (const b of bansOn(d)) {
      required++;
      if (banKept(d, b.id)) done++;
      else if (d < today) missed++;
    }
  }
  return { required, done, missed, remaining: Math.max(required - done - missed, 0), pct: required ? Math.round((done / required) * 100) : 0 };
}

// --- العرض ---
function renderBansPage() {
  const aspect = ASPECTS.find(a => a.id === "health");
  currentAspect = aspect;
  const page = $("bansPage");
  page.style.setProperty("--c", aspect.color);
  page.style.setProperty("--cl", aspect.light);
  document.title = "الممنوعات — رحلة نجاح";
  $("bnStage").innerHTML = `الحمية الغذائية · المرحلة ${ORDINALS[state.stageIndex]}: <strong>${STAGES[state.stageIndex].name}</strong>`;
  $("bnNameList").innerHTML = [...new Set([...bans.map(b => b.name), ...BAN_SUGGESTIONS])].map(n => `<option value="${escapeHtml(n)}">`).join("");

  renderBansToday();
  renderBansList();
  renderBansProgress();
}

function renderBansToday() {
  const t = todayStr();
  const list = bansOn(t);
  if (!list.length) {
    $("bnToday").innerHTML = `
      <p class="tt-label" style="text-align:center">النهارده</p>
      <p class="md-empty" style="padding-bottom:0">مفيش ممنوعات شغالة النهارده. ضيف ممنوع من الاستمارة اللي تحت 👇</p>`;
    return;
  }
  const done = list.filter(b => banKept(t, b.id)).length;
  $("bnToday").innerHTML = `
    <div class="md-head">
      <div>
        <h3 class="ip-title" style="margin-bottom:0">✋ ممنوعات النهارده</h3>
        <p class="md-date">${formatDate(t)}</p>
      </div>
      <span class="md-count">${done} من ${list.length}</span>
    </div>
    <p class="hint">علّم على كل ممنوع التزمت بيه النهارده ومكلتهوش</p>
    ${list.map(b => `
      <label class="bn-today-row">
        <input type="checkbox" data-ban="${b.id}" data-date="${t}" ${banKept(t, b.id) ? "checked" : ""} />
        <span class="bc-box">✓</span>
        <span class="t">من غير ${escapeHtml(b.name)} النهارده
          <small>يوم ${daysBetween(b.start, t) + 1} من ${banDays(b).length}${banStreak(b) >= 2 ? ` · 🔥 ${banStreak(b)} أيام متواصلة` : ""}</small>
        </span>
      </label>`).join("")}`;
}

function banCard(b) {
  const today = todayStr();
  const s = banStats(b);
  const ended = today >= banEnd(b);
  const upcoming = today < b.start;
  const streak = banStreak(b);
  const dayNo = daysBetween(b.start, today) + 1;
  const sub = upcoming
    ? `يبدأ ${formatDate(b.start)} لمدة ${b.days} يوم`
    : ended
      ? `من ${formatDate(b.start)} لمدة ${s.total} يوم${b.stoppedOn ? " (اتوقف)" : ""}`
      : `من ${formatDate(b.start)} · يوم ${dayNo} من ${s.total}`;

  const cells = banDays(b).map(d => {
    const kept = banKept(d, b.id);
    const st = kept ? "done" : d === today ? "today" : d < today ? "missed" : "future";
    const mk = kept ? "✓" : st === "missed" ? "✗" : "";
    const [, , dd] = d.split("-").map(Number);
    const title = st === "future" ? `${formatDate(d)} — لسه مجاش` : `${formatDate(d)} — ${kept ? "التزمت" : st === "today" ? "علّم لو التزمت" : "متعلّمش"}`;
    return `
      <label class="bn-day ${st}" title="${title}">
        <input type="checkbox" data-ban="${b.id}" data-date="${d}" ${kept ? "checked" : ""} ${st === "future" ? "disabled" : ""} aria-label="${title}" />
        <span class="wd">${WD_SHORT[weekday(d)]}</span>
        <b>${dd}</b>
        <span class="mk">${mk}</span>
      </label>`;
  }).join("");

  const endedMsg = ended
    ? `<div class="bn-ended-msg ${s.pct < 70 ? "meh" : ""}">${s.pct >= 70
        ? `🎉 خلصت فترة المنع! التزمت ${s.kept} من ${s.total} يوم (${s.pct}%)`
        : `خلصت فترة المنع — التزمت ${s.kept} من ${s.total} يوم. تقدر تمدّها وتحاول تاني 💪`}</div>`
    : "";

  const btn = (act, icon, title) => `<button class="ap-btn" data-act="${act}" data-id="${b.id}" title="${title}" aria-label="${title}">${icon}</button>`;
  const actions = (ended ? btn("extend", "↻", `مدّ المنع ${b.baseDays || b.days} يوم كمان`) : btn("stop", "✋", "إيقاف المنع")) + btn("delete", "🗑", "حذف");

  return `
    <div class="bn-card ${ended ? "ended" : ""}">
      <div class="bn-head">
        <span class="bn-icon">🚫</span>
        <span class="bn-info">
          <b>${escapeHtml(b.name)}</b>
          <small>${sub}${b.reason ? ` · ${escapeHtml(b.reason)}` : ""}</small>
        </span>
        ${!ended && streak >= 2 ? `<span class="bn-streak">🔥 ${streak}</span>` : ""}
        ${ended && s.pct >= 70 ? `<span class="bn-done-badge">✓ خلص</span>` : ""}
        <span class="ap-actions">${actions}</span>
      </div>
      ${endedMsg}
      <div class="bn-days">${cells}</div>
      <div class="ip-progress bn-bar"><div style="width:${s.pct}%"></div></div>
      <div class="bn-foot">
        <span>التزمت <strong>${s.kept}</strong> من ${s.total} يوم${s.missed ? ` · <span style="color:#c0392b">${s.missed} يوم متعلّمش</span>` : ""}</span>
        <strong>${s.pct}%</strong>
      </div>
    </div>`;
}

function renderBansList() {
  if (!bans.length) { $("bnList").innerHTML = `<p class="md-empty">لسه ما ضفتش ممنوعات.</p>`; return; }
  const t = todayStr();
  const current = bans.filter(b => t < banEnd(b)).sort((a, b) => a.start.localeCompare(b.start));
  const ended = bans.filter(b => t >= banEnd(b)).sort((a, b) => banEnd(b).localeCompare(banEnd(a)));
  $("bnList").innerHTML =
    (current.length ? `<div class="ap-group">⏳ ممنوعات شغالة <span class="n">${current.length}</span></div>${current.map(banCard).join("")}` : "") +
    (ended.length ? `<div class="ap-group">✓ ممنوعات خلصت <span class="n">${ended.length}</span></div>${ended.map(banCard).join("")}` : "");
}

function renderBansProgress() {
  const s = bansStageStats();
  if (!s) { $("bnProgress").innerHTML = `<p class="hint center">حدد تاريخ نهاية المرحلة من الصفحة الرئيسية عشان نحسب التزامك 📅</p>`; return; }
  if (!s.required) { $("bnProgress").innerHTML = `<p class="hint center">لما تضيف ممنوعات أيامها جوه المرحلة، هنحسب التزامك هنا.</p>`; return; }
  $("bnProgress").innerHTML = `
    <div class="ip-stats">
      <div class="ip-stat"><b>${s.required}</b><small>يوم التزام مطلوب</small></div>
      <div class="ip-stat done"><b>${s.done}</b><small>التزمت</small></div>
      <div class="ip-stat late"><b>${s.missed}</b><small>متعلّمش</small></div>
      <div class="ip-stat"><b>${s.remaining}</b><small>متبقي</small></div>
    </div>
    <div class="ip-progress"><div style="width:${s.pct}%"></div></div>
    <div class="ip-pct"><span>${s.done} من ${s.required} (كل ممنوع × كل يوم)</span><strong>${s.pct}%</strong></div>`;
}

// --- الاستمارة ---
function bnResetForm() {
  $("bnName").value = "";
  $("bnReason").value = "";
  $("bnDays").value = "";
  $("bnStart").value = todayStr();
  $("bnError").textContent = "";
  document.querySelectorAll("#bnChips button").forEach(b => b.classList.remove("on"));
  document.querySelectorAll("#bnForm .invalid").forEach(el => el.classList.remove("invalid"));
}
bnResetForm();

$("bnChips").addEventListener("click", e => {
  const d = e.target.dataset.days;
  if (!d) return;
  $("bnDays").value = d;
  $("bnDays").classList.remove("invalid");
  document.querySelectorAll("#bnChips button").forEach(b => b.classList.toggle("on", b === e.target));
});
$("bnDays").addEventListener("input", () =>
  document.querySelectorAll("#bnChips button").forEach(b => b.classList.toggle("on", b.dataset.days === $("bnDays").value)));
$("bnClear").addEventListener("click", bnResetForm);
$("bnForm").addEventListener("input", e => e.target.classList.remove("invalid"));

$("bnForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = $("bnName").value.trim();
  const days = parseInt($("bnDays").value, 10);
  const start = $("bnStart").value;
  let err = "";
  if (!name) { $("bnName").classList.add("invalid"); err = "اكتب اسم الطعام الممنوع"; }
  else if (!(days >= 1 && days <= 365)) { $("bnDays").classList.add("invalid"); err = "اكتب مدة المنع بالأيام (من 1 لـ 365)"; }
  else if (!start) { $("bnStart").classList.add("invalid"); err = "اختار تاريخ بداية المنع"; }
  else if (bans.some(b => b.name === name && todayStr() < banEnd(b))) { $("bnName").classList.add("invalid"); err = `"${name}" موجود بالفعل في الممنوعات الشغالة`; }
  if (err) { $("bnError").textContent = err; return; }

  bans.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name, reason: $("bnReason").value.trim(), start, days, baseDays: days, stoppedOn: null,
  });
  saveBans();
  bnResetForm();
  renderBansPage();
  toast(`تمت إضافة "${name}" للممنوعات لمدة ${days} يوم 💪 ربنا يعينك`);
});

// --- التعليم على الأيام ---
const BAN_MSGS = [
  n => `يوم كمان من غير ${n} 💪 إرادتك أقوى من أي حاجة`,
  n => `ما شاء الله! التزمت النهارده ومكلتش ${n} 👏`,
  n => `كل يوم بتبعد فيه عن ${n} صحتك بتشكرك 💚`,
  n => `عاش! خطوة جديدة في رحلة الصبر والعزيمة — من غير ${n}`,
];
$("bansPage").addEventListener("change", e => {
  const { ban: id, date } = e.target.dataset;
  if (!id || !date) return;
  const b = bans.find(x => x.id === id);
  if (!b || date > todayStr()) { renderBansPage(); return; } // اليوم لسه مجاش
  setBanKept(date, id, e.target.checked);
  renderBansPage();
  if (!e.target.checked) return;

  if (date === todayStr()) {
    const c = bansToday();
    if (c.total > 1 && c.done === c.total) {
      celebrate("🏆", "ما شاء الله! التزمت بكل ممنوعاتك النهارده — إرادة حديد 💪");
    } else {
      const s = banStats(b);
      if (s.kept === s.total) celebrate("🎉", `مبروك! كمّلت فترة منع ${b.name} كلها (${s.total} يوم) من غير ولا يوم كسر 👏`);
      else toast(BAN_MSGS[Math.floor(Math.random() * BAN_MSGS.length)](b.name));
    }
  } else {
    toast(`اتسجّل إنك التزمت يوم ${formatDate(date)} ✓`);
  }
});

$("bnList").addEventListener("click", e => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const b = bans.find(x => x.id === btn.dataset.id);
  if (!b) return;
  if (btn.dataset.act === "extend") {
    const add = b.baseDays || b.days;
    b.days = daysBetween(b.start, banEnd(b)) + add;
    b.stoppedOn = null;
    saveBans();
    renderBansPage();
    toast(`تم مدّ منع "${b.name}" ${add} يوم كمان 💪`);
  } else if (btn.dataset.act === "stop") {
    if (!confirm(`إيقاف منع "${b.name}" من النهارده؟`)) return;
    b.stoppedOn = todayStr() < b.start ? b.start : addDays(todayStr(), 1);
    saveBans();
    renderBansPage();
    toast(`تم إيقاف منع "${b.name}"`);
  } else if (btn.dataset.act === "delete") {
    if (!confirm(`حذف "${b.name}" من الممنوعات نهائياً؟`)) return;
    bans = bans.filter(x => x.id !== b.id);
    saveBans();
    renderBansPage();
  }
});

$("bansBackBtn").addEventListener("click", () => { location.hash = "#/aspect/health/diet"; });
