// شاشة "مهامي النهارده": كل اللي المفروض يتعمل النهارده من الجوانب الخمسة في مكان واحد
// + تأجيل / إلغاء / إعادة لأي مهمة

// ================== تخطيط اليوم (التأجيل والإلغاء والإعادة) ==================
// { "2026-11-17": { st: { taskKey: { s: "postponed"|"cancelled", to } },
//                   extra: [{ id, key, kind: "postponed"|"repeat", from, title, icon, aspect, meta, doneOn }] } }
const DAYPLAN_KEY = "rehlatNajah.dayPlan";
let dayPlan = (() => { try { return JSON.parse(localStorage.getItem(DAYPLAN_KEY)) || {}; } catch { return {}; } })();
const saveDayPlan = () => { try { localStorage.setItem(DAYPLAN_KEY, JSON.stringify(dayPlan)); } catch {} };
const planDay = d => (dayPlan[d] ??= { st: {}, extra: [] });
const peekPlanDay = d => dayPlan[d] || { st: {}, extra: [] };

// ================== تجميع مهام اليوم من كل الجوانب ==================
// كل مهمة: { key, aspect, icon, title, meta, time, done, lock, noUndo, toggle(v) }
function collectTasks(d) {
  const t = todayStr();
  const out = [];
  if (!inJourney(d)) return out; // برّه أيام الرحلة مفيش مهام
  const add = (aspect, list) => list.forEach(x => out.push({ aspect, ...x }));
  const on = (a, i) => isOn(a, i);

  // 🕌 الديني
  const rel = ASPECTS.find(a => a.id === "religious");
  rel.items.forEach(it => {
    if (!on("religious", it.id)) return;
    if (it.daily) {
      const day = d === t ? taskDay("religious", it.id) : d;
      add("religious", [{
        key: `daily:${it.id}`, icon: it.icon, title: it.task || it.name, meta: it.untilFajr ? "مفتوحة لحد الفجر" : rel.name,
        time: it.id === "qiyam" ? 23 * 60 : null,
        done: isDone("religious", it.id, day),
        toggle: v => setDone("religious", it.id, day, v ? (d < t ? "late" : "ontime") : null),
      }]);
    } else if (it.prayers) {
      const status = d === t ? todayPrayerStatus() : PRAYERS.map(p => ({ ...p, value: prayerDay(d)[p.id], status: prayerDay(d)[p.id] ? "done" : "missed" }));
      status.forEach(p => add("religious", [{
        key: `salah:${p.id}`, icon: p.icon, title: `صلاة ${p.name}`, meta: p.time != null ? `الساعة ${fmtTime(p.time)}` : "",
        time: p.time ?? null,
        done: p.status === "done",
        lock: p.status === "upcoming" ? "لسه وقتها مجاش" : null,
        noUndo: true, // الصلاة مفيش رجوع في علامتها
        toggle: v => { if (v) setPrayer(d, p.id, p.status === "missed" || d < t ? "late" : "ontime"); },
      }]));
    } else if (it.fasting && isFastDay(d)) {
      add("religious", [{
        key: "siyam", icon: "🌅", title: `صيام ${dayName(d)}`, meta: "الاثنين والخميس", time: 0,
        done: isDone("religious", "siyam", d),
        toggle: v => setDone("religious", "siyam", d, v ? "ontime" : null),
      }]);
    }
  });

  // 💪 الصحي
  if (on("health", "meds")) {
    add("health", medsOn(d).map(m => ({
      key: `med:${m.id}`, icon: "💊", title: m.name, meta: `${medTime(m.time).name}${m.dose ? ` · ${m.dose}` : ""}`,
      time: 6 * 60 + medTimeOrder(m.time) * 120,
      done: medTaken(d, m.id),
      toggle: v => setMedTaken(d, m.id, v),
    })));
  }
  if (on("health", "doctors")) {
    add("health", appts.filter(a => a.date === d && a.status !== "cancelled").map(a => ({
      key: `appt:${a.id}`, icon: apptType(a.type).icon,
      title: `${a.type === "other" ? (a.typeOther || "ميعاد") : apptType(a.type).name}${a.spec ? ` · ${a.spec}` : ""}`,
      meta: `${a.time ? `الساعة ${apTimeText(a)}` : ""}${a.doctor ? ` · ${a.doctor}` : ""}`,
      time: a.time ? Number(a.time.slice(0, 2)) * 60 + Number(a.time.slice(3, 5)) : null,
      done: a.status === "done",
      toggle: v => { a.status = v ? "done" : "scheduled"; a.doneOn = v ? todayStr() : null; saveAppts(); },
    })));
  }
  if (on("health", "exercise")) {
    add("health", workouts.filter(w => w.date === d).map(w => ({
      key: `wo:${w.id}`, icon: exType(w.type).icon, title: `${exType(w.type).name} ${w.minutes} دقيقة`,
      meta: `🔥 حوالي ${woKcal(w)} سعر حراري${w.time ? ` · الساعة ${woTimeText(w)}` : ""}`,
      time: w.time ? Number(w.time.slice(0, 2)) * 60 + Number(w.time.slice(3, 5)) : null,
      done: w.status === "done",
      toggle: v => { w.status = v ? "done" : "scheduled"; w.doneOn = v ? todayStr() : null; saveWorkouts(); },
    })));
  }
  if (on("health", "diet")) {
    if (dietSubOn("forbidden")) {
      add("health", bansOn(d).map(b => ({
        key: `ban:${b.id}`, icon: "🚫", title: `من غير ${b.name}`, meta: "الممنوعات", time: 24 * 60,
        done: banKept(d, b.id),
        toggle: v => setBanKept(d, b.id, v),
      })));
    }
    if (dietSubOn("meals")) {
      const m = mealsOn(d);
      if (m.list) add("health", m.list.map(x => ({
        key: `meal:${x.id}`, icon: x.icon, title: `${x.name}: ${x.text}`, meta: "الوجبات الصحية",
        time: { breakfast: 8 * 60, lunch: 15 * 60, snack: 18 * 60, dinner: 21 * 60 }[x.id],
        done: mealDone(d, x.id),
        toggle: v => setMealDone(d, x.id, v),
      })));
    }
  }

  // 👨‍👩‍👧 العائلي
  if (on("family", "bigFamily")) add("family", BIG_FAMILY.tasksOn(d));
  if (on("family", "smallFamily")) {
    if (SMALL_FAMILY.subOn("home")) add("family", HOME_TASKS.tasksOn(d));
    if (SMALL_FAMILY.subOn("wifeKids")) add("family", WIFE_KIDS.tasksOn(d));
  }
  if (on("family", "projects") && PROJECTS_HUB.subOn("projects")) add("family", FAMILY_PROJECTS.tasksOn(d));

  // 💼 العملي
  if (on("work", "specialty")) add("work", WORK_TASKS.tasksOn(d));
  if (on("work", "business")) add("work", BUSINESS.tasksOn(d));

  // 🌱 الشخصي
  if (on("personal", "skills")) add("personal", SKILLS.tasksOn(d));
  if (on("personal", "growth")) add("personal", GROWTH.tasksOn(d));

  return out;
}

// مهام اليوم بعد تطبيق التأجيل والإلغاء + المهام المؤجلة/المعادة اللي جاية لليوم ده
function dayTasks(d) {
  const plan = peekPlanDay(d);
  const base = collectTasks(d).map(x => ({ ...x, state: plan.st[x.key]?.s || null, to: plan.st[x.key]?.to }));
  const extra = (plan.extra || []).map(e => ({
    key: `extra:${e.id}`, extraId: e.id, kind: e.kind, from: e.from, aspect: e.aspect, icon: e.icon,
    title: e.title, meta: `${e.kind === "repeat" ? "🔄 إعادة" : "📅 مؤجلة"} من ${formatDate(e.from)}${e.meta ? ` · ${e.meta}` : ""}`,
    time: null, done: !!e.doneOn, state: plan.st[`extra:${e.id}`]?.s || null,
    toggle: v => completeExtra(d, e.id, v),
  }));
  return [...base, ...extra];
}

// إتمام مهمة مؤجلة: بنعلّم عليها في مكانها الأصلي كمان (يوم ما كانت مطلوبة)
function completeExtra(d, id, v) {
  const e = planDay(d).extra.find(x => x.id === id);
  if (!e) return;
  e.doneOn = v ? todayStr() : null;
  if (e.kind === "postponed") {
    const orig = collectTasks(e.from).find(x => x.key === e.key);
    if (orig && !orig.lock && (v || !orig.noUndo)) orig.toggle(v);
  }
  saveDayPlan();
}

function todayProgress(d = todayStr()) {
  const list = dayTasks(d);
  const active = list.filter(x => !x.state);
  const done = active.filter(x => x.done).length;
  return {
    total: active.length, done,
    postponed: list.filter(x => x.state === "postponed").length,
    cancelled: list.filter(x => x.state === "cancelled").length,
    pct: active.length ? Math.round((done / active.length) * 100) : 0,
  };
}

// ================== الصفحة ==================
$("todayPage").innerHTML = `
  <section class="card aspect-hero td-hero">
    <button class="back-btn" id="tdBack">→ الرئيسية</button>
    <div class="ah-icon">📋</div>
    <h2 class="ah-name">مهامي النهارده</h2>
    <p class="ah-stage" id="tdDate"></p>
    <div id="tdTop"></div>
  </section>
  <div id="tdGroups"></div>
  <section class="card ip-card" id="tdMoved"></section>

  <!-- نافذة التأجيل / الإعادة -->
  <div class="td-modal" id="tdModal" aria-hidden="true">
    <form class="td-modal-card" id="tdModalForm">
      <h3 id="tdModalTitle"></h3>
      <p class="hint" id="tdModalSub"></p>
      <div class="ex-chips" id="tdQuick">
        <button type="button" data-plus="1">بكرة</button>
        <button type="button" data-plus="2">بعد بكرة</button>
        <button type="button" data-plus="7">بعد أسبوع</button>
      </div>
      <div class="f" style="margin-top:10px">
        <label for="tdModalDate">التاريخ</label>
        <input type="date" id="tdModalDate" />
      </div>
      <div class="form-actions" style="margin-top:14px">
        <button type="button" class="btn btn-outline" id="tdModalCancel">رجوع</button>
        <button type="submit" class="btn btn-primary" id="tdModalOk">تأكيد</button>
      </div>
    </form>
  </div>`;

let tdView = null; // اليوم المعروض (النهارده افتراضياً)
let tdPending = null; // { mode: "postpone"|"repeat", key }

function renderTodayPage() {
  const d = tdView || todayStr();
  const isToday = d === todayStr();
  document.title = "مهامي النهارده — رحلة نجاح";
  $("tdDate").innerHTML = `${formatDate(d)} · <span style="color:var(--gold)">${formatDate(d, "hijri")}</span>`;

  const list = dayTasks(d);
  const p = todayProgress(d);
  const remaining = p.total - p.done;
  const msg = !inJourney(d) ? outOfJourneyMsg(d)
    : !p.total ? "مفيش مهام النهارده 🌿 فعّل اختيارات من الجوانب أو ضيف مواعيد ومهام"
    : p.pct === 100 ? "🏆 ما شاء الله! خلّصت كل مهام النهارده"
    : p.pct >= 70 ? `قرّبت تخلّص 💪 فاضل ${remaining} مهمة`
    : p.pct >= 30 ? `ماشي كويس 👍 فاضل ${remaining} مهمة`
    : `يلا نبدأ 🚀 قدامك ${remaining} مهمة`;

  $("tdTop").innerHTML = `
    <div class="td-progress">
      ${ringSVG(p.pct, "اتعمل")}
      <div class="td-tiles">
        <div class="dc-tile"><b>${p.total}</b><small>مهمة النهارده</small></div>
        <div class="dc-tile"><b style="color:#1e7a46">${p.done}</b><small>✓ اتعملت</small></div>
        <div class="dc-tile"><b>${remaining}</b><small>⏳ باقي</small></div>
        <div class="dc-tile"><b>${p.postponed}</b><small>📅 اتأجّلت</small></div>
        <div class="dc-tile"><b>${p.cancelled}</b><small>✕ اتلغت</small></div>
      </div>
    </div>
    <div class="ip-progress td-bar"><div style="width:${p.pct}%"></div></div>
    <p class="td-msg">${msg}</p>
    ${isToday ? "" : `<p class="td-msg" style="color:var(--muted)">بتشوف مهام يوم ${formatDate(d)}</p>`}`;

  // المهام مجمّعة حسب الجانب، ومترتبة بالوقت
  const active = list.filter(x => !x.state);
  $("tdGroups").innerHTML = ASPECTS.map(a => {
    const items = active.filter(x => x.aspect === a.id)
      .sort((x, y) => (x.done - y.done) || ((x.time ?? 9999) - (y.time ?? 9999)));
    if (!items.length) return "";
    const dn = items.filter(x => x.done).length;
    return `
      <section class="card ip-card td-group" style="--c:${a.color};--cl:${a.light}">
        <div class="td-ghead">
          <span class="dc-icon">${a.icon}</span>
          <span class="dc-title">${a.name}</span>
          <span class="td-gcount">${dn} من ${items.length}</span>
        </div>
        <div class="ip-progress td-gbar"><div style="width:${Math.round((dn / items.length) * 100)}%"></div></div>
        ${items.map(taskRow).join("")}
      </section>`;
  }).join("") || `<section class="card ip-card"><p class="md-empty">${!list.length ? "مفيش مهام لليوم ده." : "كل مهام اليوم ده اتأجلت أو اتلغت."}</p></section>`;

  renderMoved(list, d);
}

function taskRow(x) {
  const locked = !!x.lock && !x.done;
  const fixed = x.done && x.noUndo;
  return `
    <div class="td-task ${x.done ? "done" : ""} ${locked ? "locked" : ""}">
      <label class="td-check" title="${locked ? x.lock : ""}">
        <input type="checkbox" data-tk="${x.key}" ${x.done ? "checked" : ""} ${locked || fixed ? "disabled" : ""} />
        <span class="bc-box">✓</span>
      </label>
      <span class="td-icon">${x.icon}</span>
      <span class="td-info">
        <span class="td-title">${escapeHtml(x.title)}</span>
        <span class="td-meta">${locked ? `🔒 ${x.lock}` : escapeHtml(x.meta || "")}</span>
      </span>
      <span class="td-actions">
        ${x.done ? "" : `<button class="ap-btn" data-postpone="${x.key}" title="تأجيل" aria-label="تأجيل">📅</button>
        <button class="ap-btn" data-cancel="${x.key}" title="إلغاء النهارده" aria-label="إلغاء">✕</button>`}
        <button class="ap-btn" data-repeat="${x.key}" title="إعادة في يوم تاني" aria-label="إعادة">🔄</button>
      </span>
    </div>`;
}

function renderMoved(list, d) {
  const postponed = list.filter(x => x.state === "postponed");
  const cancelled = list.filter(x => x.state === "cancelled");
  const repeats = Object.entries(dayPlan).flatMap(([day, p]) => (p.extra || []).filter(e => e.kind === "repeat" && e.from === d).map(e => ({ ...e, day })));
  if (!postponed.length && !cancelled.length && !repeats.length) { $("tdMoved").hidden = true; return; }
  $("tdMoved").hidden = false;
  const row = (x, label, undo) => `
    <div class="td-moved-row">
      <span class="td-icon">${x.icon}</span>
      <span class="td-info"><span class="td-title">${escapeHtml(x.title)}</span><span class="td-meta">${label}</span></span>
      ${undo ? `<button class="btn btn-outline btn-sm" style="flex:none" ${undo}>تراجع</button>` : ""}
    </div>`;
  $("tdMoved").innerHTML = `
    ${postponed.length ? `<h3 class="ip-title">📅 اتأجّلت</h3>${postponed.map(x => row(x, `اتأجّلت لـ ${formatDate(x.to)}`, `data-undo="${x.key}"`)).join("")}` : ""}
    ${cancelled.length ? `<h3 class="ip-title" style="margin-top:14px">✕ اتلغت النهارده</h3>${cancelled.map(x => row(x, "مش محسوبة في مهام النهارده", `data-undo="${x.key}"`)).join("")}` : ""}
    ${repeats.length ? `<h3 class="ip-title" style="margin-top:14px">🔄 هتتعاد</h3>${repeats.map(e => row(e, `هتتعاد يوم ${formatDate(e.day)}`, `data-unrepeat="${e.day}|${e.id}"`)).join("")}` : ""}`;
}

// ================== الأحداث ==================
$("todayPage").addEventListener("change", e => {
  const key = e.target.dataset.tk;
  if (!key) return;
  const d = tdView || todayStr();
  const x = dayTasks(d).find(t => t.key === key);
  if (!x || x.lock) { renderTodayPage(); return; }
  x.toggle(e.target.checked);
  renderTodayPage();
  if (e.target.checked) {
    const p = todayProgress(d);
    if (p.total && p.done === p.total) celebrate("🏆", "ما شاء الله! خلّصت كل مهام النهارده — يوم ناجح في رحلة نجاحك 🎉");
    else toast(`✓ ${x.title} — خلّصت ${p.pct}% من مهام النهارده`);
  }
});

function openTdModal(mode, key) {
  const d = tdView || todayStr();
  const x = dayTasks(d).find(t => t.key === key);
  if (!x) return;
  tdPending = { mode, key };
  $("tdModalTitle").textContent = mode === "postpone" ? `📅 تأجيل: ${x.title}` : `🔄 إعادة: ${x.title}`;
  $("tdModalSub").textContent = mode === "postpone"
    ? "المهمة هتتشال من النهارده وتظهر في اليوم اللي هتختاره، ولما تخلّصها هتتسجّل في مكانها."
    : "نسخة من المهمة هتظهر في اليوم اللي هتختاره عشان تعيدها تاني.";
  $("tdModalDate").min = addDays(d, 1);
  $("tdModalDate").value = addDays(d, 1);
  $("tdModal").classList.add("open");
}
function closeTdModal() { $("tdModal").classList.remove("open"); tdPending = null; }

$("tdModalForm").addEventListener("submit", e => {
  e.preventDefault();
  if (!tdPending) return;
  const d = tdView || todayStr();
  const to = $("tdModalDate").value;
  if (!to || to <= d) { toast("اختار يوم بعد النهارده"); return; }
  const x = dayTasks(d).find(t => t.key === tdPending.key);
  if (!x) { closeTdModal(); return; }
  const kind = tdPending.mode === "postpone" ? "postponed" : "repeat";
  // لو المهمة نفسها كانت مؤجلة من يوم قبل كده، بنحتفظ بأصلها
  const origKey = x.extraId ? (planDay(d).extra.find(q => q.id === x.extraId)?.key || x.key) : x.key;
  const origFrom = x.extraId ? (x.from || d) : d;
  planDay(to).extra.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    key: origKey, kind, from: origFrom, title: x.title, icon: x.icon, aspect: x.aspect, meta: x.extraId ? "" : x.meta, doneOn: null,
  });
  if (kind === "postponed") planDay(d).st[x.key] = { s: "postponed", to };
  saveDayPlan();
  closeTdModal();
  renderTodayPage();
  toast(kind === "postponed" ? `📅 اتأجّلت لـ ${formatDate(to)}` : `🔄 هتتعاد يوم ${formatDate(to)}`);
});
$("tdModalCancel").addEventListener("click", closeTdModal);
$("tdModal").addEventListener("click", e => { if (e.target.id === "tdModal") closeTdModal(); });
$("tdQuick").addEventListener("click", e => {
  const n = e.target.dataset.plus;
  if (n) $("tdModalDate").value = addDays(tdView || todayStr(), Number(n));
});

$("todayPage").addEventListener("click", e => {
  const d = tdView || todayStr();
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.postpone) openTdModal("postpone", b.dataset.postpone);
  else if (b.dataset.repeat) openTdModal("repeat", b.dataset.repeat);
  else if (b.dataset.cancel) {
    const x = dayTasks(d).find(t => t.key === b.dataset.cancel);
    if (!confirm(`إلغاء "${x.title}" النهارده؟\nمش هتتحسب في مهام النهارده.`)) return;
    planDay(d).st[x.key] = { s: "cancelled" };
    saveDayPlan();
    renderTodayPage();
    toast("✕ اتلغت من مهام النهارده");
  } else if (b.dataset.undo) {
    const key = b.dataset.undo;
    const st = planDay(d).st[key];
    // التراجع عن التأجيل: نشيل النسخة اللي اتحطت في اليوم التاني
    if (st?.s === "postponed" && st.to) {
      const target = planDay(st.to);
      const idx = target.extra.findIndex(q => q.kind === "postponed" && q.from === d && (q.key === key || `extra:${q.id}` === key));
      if (idx >= 0) target.extra.splice(idx, 1);
    }
    delete planDay(d).st[key];
    saveDayPlan();
    renderTodayPage();
    toast("رجعت لمهام النهارده ✓");
  } else if (b.dataset.unrepeat) {
    const [day, id] = b.dataset.unrepeat.split("|");
    planDay(day).extra = planDay(day).extra.filter(q => q.id !== id);
    saveDayPlan();
    renderTodayPage();
    toast("اتشالت الإعادة");
  }
});

$("tdBack").addEventListener("click", () => { location.hash = "#/"; });

// تحديث كل دقيقة (عشان الصلوات بتتفتح في وقتها)
setInterval(() => { if ($("todayPage").classList.contains("show")) renderTodayPage(); }, 60 * 1000);

// ================== كارت "مهامي النهارده" في الصفحة الرئيسية ==================
function renderTodayCta() {
  const p = todayProgress();
  $("todayCta").innerHTML = `
    <span class="tc-icon">📋</span>
    <span class="tc-body">
      <b>مهامي النهارده</b>
      <small>${p.total ? `خلّصت ${p.done} من ${p.total} مهمة${p.postponed ? ` · ${p.postponed} اتأجّلت` : ""}` : "مفيش مهام النهارده"}</small>
      <span class="ip-progress tc-bar"><span style="width:${p.pct}%"></span></span>
    </span>
    <span class="tc-pct">${p.pct}%</span>
    <span class="tc-go">‹</span>`;
}
