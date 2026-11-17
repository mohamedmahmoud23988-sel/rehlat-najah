// صفحة التمارين والرياضة

// MET = معامل الطاقة لكل نشاط (من جداول Compendium of Physical Activities)
// السعرات = MET × الوزن (كجم) × المدة (ساعات)
const EX_TYPES = [
  { id: "walking",  name: "المشي",          icon: "🚶", met: { light: 2.8, moderate: 3.5, vigorous: 5.0 },
    hints: { light: "مشي هادي", moderate: "مشي سريع (حوالي 5 كم/ساعة)", vigorous: "مشي سريع جداً أو طلوع" } },
  { id: "running",  name: "الركض",          icon: "🏃", met: { light: 7.0, moderate: 9.8, vigorous: 11.5 },
    hints: { light: "جري خفيف (جوجينج)", moderate: "جري متوسط (حوالي 10 كم/ساعة)", vigorous: "جري سريع" } },
  { id: "home",     name: "تمارين منزلية",  icon: "🤸", met: { light: 2.8, moderate: 3.8, vigorous: 8.0 },
    hints: { light: "إطالة ويوجا", moderate: "ضغط وبطن وسكوات", vigorous: "تمارين عالية الشدة (HIIT)" } },
  { id: "football", name: "كرة القدم",      icon: "⚽", met: { light: 5.0, moderate: 7.0, vigorous: 10.0 },
    hints: { light: "تمرير وتسديد", moderate: "ماتش ودي", vigorous: "ماتش تنافسي" } },
  { id: "gym",      name: "تمارين جيم",     icon: "🏋️", met: { light: 3.5, moderate: 5.0, vigorous: 6.0 },
    hints: { light: "أوزان خفيفة", moderate: "أوزان متوسطة", vigorous: "أوزان تقيلة ومجهود عالي" } },
  { id: "swimming", name: "السباحة",        icon: "🏊", met: { light: 6.0, moderate: 8.3, vigorous: 10.0 },
    hints: { light: "سباحة هادية", moderate: "سباحة متواصلة", vigorous: "سباحة سريعة" } },
  { id: "cycling",  name: "ركوب العجل",     icon: "🚴", met: { light: 4.0, moderate: 6.8, vigorous: 10.0 },
    hints: { light: "عجلة هادية (أقل من 16 كم/ساعة)", moderate: "متوسط (16–20 كم/ساعة)", vigorous: "سريع (أكتر من 20 كم/ساعة)" } },
  { id: "padel",    name: "البادل / التنس", icon: "🎾", met: { light: 5.0, moderate: 7.3, vigorous: 8.0 },
    hints: { light: "تمرين خفيف", moderate: "ماتش زوجي", vigorous: "ماتش فردي تنافسي" } },
  { id: "basketball", name: "كرة السلة",    icon: "🏀", met: { light: 4.5, moderate: 6.5, vigorous: 8.0 },
    hints: { light: "تسديد", moderate: "لعب ودي", vigorous: "ماتش تنافسي" } },
  { id: "yoga",     name: "اليوجا",         icon: "🧘", met: { light: 2.5, moderate: 3.0, vigorous: 4.0 },
    hints: { light: "إطالة وتأمل", moderate: "يوجا عادية", vigorous: "باور يوجا" } },
  { id: "other",    name: "أخرى",           icon: "📌", met: { light: 3.0, moderate: 4.5, vigorous: 6.5 },
    hints: { light: "مجهود خفيف", moderate: "مجهود متوسط", vigorous: "مجهود عالي" } },
];
const INTENSITY_NAMES = { light: "خفيفة", moderate: "متوسطة", vigorous: "عالية" };
const exType = id => EX_TYPES.find(t => t.id === id) || EX_TYPES[0];
const WEEKLY_GOAL_MIN = 150; // توصية منظمة الصحة العالمية: 150 دقيقة نشاط متوسط في الأسبوع
const DEFAULT_WEIGHT = 70;

// { id, type, typeOther, intensity, date, time, minutes, notes, status: "scheduled"|"done", doneOn }
const WORKOUTS_KEY = "rehlatNajah.workouts";
let workouts = (() => {
  try { return JSON.parse(localStorage.getItem(WORKOUTS_KEY)) || []; } catch { return []; }
})();
function saveWorkouts() {
  try { localStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts)); } catch {}
}
let exEditingId = null;

// --- الحسابات ---
const userWeight = () => (profile && profile.weight) || DEFAULT_WEIGHT;
function burnKcal(type, intensity, minutes) {
  const met = exType(type).met[intensity] || exType(type).met.moderate;
  return Math.round(met * userWeight() * (minutes / 60));
}
const woKcal = w => burnKcal(w.type, w.intensity, w.minutes);
function exStatus(w) {
  if (w.status === "done") return "done";
  const t = todayStr();
  if (w.date > t) return "upcoming";
  if (w.date === t) return "today";
  return "missed";
}
const woSortKey = w => `${w.date} ${w.time || "99:99"}`;
function woName(w) {
  const t = exType(w.type);
  return `${t.icon} ${escapeHtml(w.type === "other" ? (w.typeOther || t.name) : t.name)}`;
}
function woTimeText(w) {
  if (!w.time) return "";
  const [h, m] = w.time.split(":").map(Number);
  return fmtTime(h * 60 + m);
}
// الأسبوع بيبدأ يوم السبت
function weekStart(d = todayStr()) { return addDays(d, -((weekday(d) + 1) % 7)); }

function exWeekStats() {
  const start = weekStart();
  const end = addDays(start, 7);
  const done = workouts.filter(w => w.status === "done" && w.date >= start && w.date < end);
  return {
    minutes: done.reduce((n, w) => n + w.minutes, 0),
    kcal: done.reduce((n, w) => n + woKcal(w), 0),
    sessions: done.length,
    planned: workouts.filter(w => w.status !== "done" && w.date >= todayStr() && w.date < end).length,
  };
}

function exStats() {
  if (!state.endDate) return null;
  const inStage = workouts.filter(w => w.date >= state.startDate && w.date < state.endDate);
  const doneList = inStage.filter(w => w.status === "done");
  const done = doneList.length;
  const missed = inStage.filter(w => exStatus(w) === "missed").length;
  const required = inStage.length;
  return {
    required, done, missed,
    remaining: required - done - missed,
    pct: required ? Math.round((done / required) * 100) : 0,
    minutes: doneList.reduce((n, w) => n + w.minutes, 0),
    kcal: doneList.reduce((n, w) => n + woKcal(w), 0),
  };
}
function exToday() {
  const list = workouts.filter(w => w.date === todayStr());
  return { total: list.length, done: list.filter(w => w.status === "done").length };
}
function nextWorkout() {
  return workouts.filter(w => ["today", "upcoming"].includes(exStatus(w)))
                 .sort((a, b) => woSortKey(a).localeCompare(woSortKey(b)))[0];
}
// عدد الأيام المتواصلة اللي فيها تمرين اتعمل
function exStreak() {
  const doneDays = new Set(workouts.filter(w => w.status === "done").map(w => w.date));
  let d = todayStr();
  if (!doneDays.has(d)) d = addDays(d, -1);
  let n = 0;
  while (doneDays.has(d)) { n++; d = addDays(d, -1); }
  return n;
}

// --- العرض ---
function renderExercisePage() {
  const aspect = ASPECTS.find(a => a.id === "health");
  currentAspect = aspect;
  const page = $("exercisePage");
  page.style.setProperty("--c", aspect.color);
  page.style.setProperty("--cl", aspect.light);
  document.title = "التمارين والرياضة — رحلة نجاح";
  $("exStage").innerHTML = `${aspect.name} · المرحلة ${ORDINALS[state.stageIndex]}: <strong>${STAGES[state.stageIndex].name}</strong>`;
  const streak = exStreak();
  $("exStreak").textContent = streak >= 2 ? `🔥 ${streak} أيام متواصلة بتتمرّن` : "";

  renderExWeek();
  renderExList();
  renderExProgress();
  renderExBurn();
}

function renderExWeek() {
  const w = exWeekStats();
  const pct = Math.min(100, Math.round((w.minutes / WEEKLY_GOAL_MIN) * 100));
  const left = Math.max(WEEKLY_GOAL_MIN - w.minutes, 0);
  const next = nextWorkout();
  const today = workouts.filter(x => x.date === todayStr()).sort((a, b) => woSortKey(a).localeCompare(woSortKey(b)));

  $("exWeek").innerHTML = `
    <h3 class="ip-title">📆 الأسبوع ده <small class="muted">(من ${formatDate(weekStart())})</small></h3>
    <div class="ex-week-top">
      ${ringSVG(pct, "هدف الأسبوع")}
      <div class="ex-week-tiles">
        <div class="dc-tile"><b>${w.minutes} د</b><small>من ${WEEKLY_GOAL_MIN} دقيقة هدف</small></div>
        <div class="dc-tile"><b>🔥 ${w.kcal.toLocaleString("en-US")}</b><small>سعر حراري اتحرق</small></div>
        <div class="dc-tile"><b>${w.sessions}</b><small>تمرين اتعمل</small></div>
        <div class="dc-tile"><b>${w.planned}</b><small>تمرين جاي الأسبوع ده</small></div>
      </div>
    </div>
    <p class="ex-week-note">${left
      ? `فاضلك <strong>${left} دقيقة</strong> توصل لهدف منظمة الصحة العالمية (150 دقيقة نشاط متوسط في الأسبوع)`
      : `🏆 ما شاء الله! وصلت لهدف الأسبوع (150 دقيقة)`}</p>
    ${today.length ? `<div class="ap-group" style="margin-top:14px">📍 تمارين النهارده</div>${today.map(exRow).join("")}`
      : next ? `<p class="ex-week-note">التمرين الجاي: <strong>${exType(next.type).name} ${next.minutes} دقيقة</strong> — ${formatDate(next.date)}</p>` : ""}`;
}

function exRow(w) {
  const st = exStatus(w);
  const [, m, d] = w.date.split("-").map(Number);
  const month = new Intl.DateTimeFormat("ar-EG", { month: "short" }).format(new Date(2000, m - 1, 1));
  const n = daysBetween(todayStr(), w.date);
  const tags = {
    upcoming: n === 1 ? "بكرة" : `بعد ${n} أيام`,
    today: "النهارده",
    missed: "فاتني",
    done: "✓ اتعمل",
  };
  const btn = (act, icon, title) => `<button class="ap-btn" data-act="${act}" data-id="${w.id}" title="${title}" aria-label="${title}">${icon}</button>`;
  const actions = {
    upcoming: btn("edit", "✎", "تعديل") + btn("delete", "🗑", "حذف"),
    today: btn("edit", "✎", "تعديل") + btn("delete", "🗑", "حذف"),
    missed: btn("edit", "↻", "تأجيل لميعاد جديد") + btn("delete", "🗑", "حذف"),
    done: btn("edit", "📝", "تعديل") + btn("again", "➕", "كرّر التمرين ده"),
  }[st];
  const canCheck = st !== "upcoming";
  return `
    <div class="ap-row ${st}">
      <span class="ap-day"><b>${d}</b><small>${month}</small></span>
      <span class="ap-info">
        <span class="ap-title">${woName(w)} · ${w.minutes} دقيقة</span>
        <span class="ap-meta">${dayName(w.date)} · شدة ${INTENSITY_NAMES[w.intensity]}${w.time ? ` · الساعة ${woTimeText(w)}` : ""}</span>
        ${w.notes ? `<span class="ap-notes">📝 ${escapeHtml(w.notes)}</span>` : ""}
      </span>
      <span class="ex-kcal-tag">🔥 ${woKcal(w)}</span>
      <span class="ap-tag">${tags[st]}</span>
      <span class="ap-actions">${actions}</span>
      <label class="pr-check" title="${canCheck ? "خلّصت التمرين" : "تقدر تعلّم لما ييجي تاريخه"}" aria-label="خلّصت التمرين">
        <input type="checkbox" data-done="${w.id}" ${st === "done" ? "checked" : ""} ${canCheck ? "" : "disabled"} />
        <span class="bc-box">✓</span>
      </label>
    </div>`;
}

function renderExList() {
  if (!workouts.length) {
    $("exList").innerHTML = `<p class="md-empty">لسه ما ضفتش تمارين.</p>`;
    return;
  }
  const groups = [
    { key: "upcoming", title: "⏳ التمارين الجاية" },
    { key: "missed",   title: "⚠️ تمارين فاتتني" },
    { key: "done",     title: "✓ تمارين اتعملت" },
  ];
  const sorted = [...workouts].sort((a, b) => woSortKey(a).localeCompare(woSortKey(b)));
  const html = groups.map(g => {
    let list = sorted.filter(w => exStatus(w) === g.key);
    if (g.key === "done") list = list.reverse();
    if (!list.length) return "";
    return `<div class="ap-group">${g.title} <span class="n">${list.length}</span></div>${list.map(exRow).join("")}`;
  }).join("");
  $("exList").innerHTML = html || `<p class="md-empty">تمارين النهارده ظاهرة فوق في "الأسبوع ده".</p>`;
}

function renderExProgress() {
  const s = exStats();
  if (!s) {
    $("exProgress").innerHTML = `<p class="hint center">حدد تاريخ نهاية المرحلة من الصفحة الرئيسية عشان نحسب التزامك 📅</p>`;
    return;
  }
  if (!s.required) {
    $("exProgress").innerHTML = `<p class="hint center">لما تضيف تمارين تاريخها جوه المرحلة، هنحسب التزامك بيها هنا.</p>`;
    return;
  }
  $("exProgress").innerHTML = `
    <div class="ip-stats">
      <div class="ip-stat"><b>${s.required}</b><small>تمرين في المرحلة</small></div>
      <div class="ip-stat done"><b>${s.done}</b><small>اتعمل</small></div>
      <div class="ip-stat late"><b>${s.missed}</b><small>فاتني</small></div>
      <div class="ip-stat"><b>${s.remaining}</b><small>جاي</small></div>
    </div>
    <div class="ip-progress"><div style="width:${s.pct}%"></div></div>
    <div class="ip-pct"><span>${s.done} من ${s.required} تمرين</span><strong>${s.pct}%</strong></div>
    <p class="ap-rate">إجمالي المرحلة: <strong>${s.minutes} دقيقة</strong> رياضة، وحرقت حوالي <strong>${s.kcal.toLocaleString("en-US")} سعر حراري</strong>
      (≈ ${Math.round(s.kcal / 7.7)} جرام دهون)</p>`;
}

// صندوق السعرات اللي بيتحدّث وانت بتملا الاستمارة
function renderExBurn() {
  const type = $("exType").value;
  const intensity = $("exIntensity").value;
  const minutes = parseInt($("exMinutes").value, 10);
  $("exIntensityHint").textContent = exType(type).hints[intensity];
  document.querySelectorAll("#exChips button").forEach(b => b.classList.toggle("on", Number(b.dataset.min) === minutes));

  if (!(minutes > 0)) {
    $("exBurn").className = "ex-burn muted";
    $("exBurn").innerHTML = `<span class="fire">🔥</span><span><span class="sub">اختار نوع الرياضة والمدة، وهقولك هتحرق حوالي كام سعر حراري</span></span>`;
    return;
  }
  const kcal = burnKcal(type, intensity, minutes);
  const count = $("exRepeat").value === "once" ? 1 : Math.max(parseInt($("exCount").value, 10) || 0, 0);
  const weightNote = profile?.weight ? `محسوبة على وزنك ${profile.weight} كجم` : `محسوبة على وزن ${DEFAULT_WEIGHT} كجم — سجّل وزنك في البروفايل عشان الحساب يبقى أدق`;
  const pctDay = profile ? Math.round((kcal / analyze(profile).tdee) * 100) : null;
  $("exBurn").className = "ex-burn";
  $("exBurn").innerHTML = `
    <span class="fire">🔥</span>
    <span>
      <span class="kcal">حوالي ${kcal} سعر حراري</span>
      <span class="sub" style="display:block">
        ≈ ${Math.round(kcal / 7.7)} جرام دهون${pctDay ? ` · ${pctDay}% من احتياجك اليومي` : ""}
        ${count > 1 ? ` · ولو كررته ${count} مرة: <b>${(kcal * count).toLocaleString("en-US")} سعر حراري</b>` : ""}
      </span>
      <span class="sub" style="display:block;opacity:.8">${weightNote}</span>
    </span>`;
}

// --- الاستمارة ---
function exUpdateFields() {
  $("exOtherWrap").hidden = $("exType").value !== "other";
  const rep = $("exRepeat").value !== "once";
  $("exCount").hidden = !rep;
  $("exTimesLbl").hidden = !rep;
  renderExBurn();
}
function exResetForm() {
  exEditingId = null;
  $("exType").value = favSportIds()[0] || "walking";
  $("exOther").value = "";
  $("exIntensity").value = "moderate";
  $("exDate").value = todayStr();
  $("exDate").min = todayStr();
  $("exMinutes").value = "";
  $("exTime").value = "";
  $("exRepeat").value = "once";
  $("exCount").value = 7;
  $("exNotes").value = "";
  $("exError").textContent = "";
  $("exRepeatWrap").hidden = false;
  $("exFormTitle").textContent = "➕ إضافة تمرين";
  $("exSubmit").textContent = "➕ إضافة التمرين";
  $("exCancelEdit").hidden = true;
  $("exFormCard").classList.remove("editing");
  document.querySelectorAll("#exForm .invalid").forEach(el => el.classList.remove("invalid"));
  exUpdateFields();
}
function exFill(w, { asNew = false } = {}) {
  $("exType").value = w.type;
  $("exOther").value = w.typeOther || "";
  $("exIntensity").value = w.intensity;
  $("exMinutes").value = w.minutes;
  $("exTime").value = w.time || "";
  $("exNotes").value = asNew ? "" : (w.notes || "");
  $("exDate").value = asNew ? todayStr() : w.date;
  exUpdateFields();
  $("exFormCard").scrollIntoView({ behavior: "smooth", block: "start" });
}

// اهتماماتك الرياضية من البروفايل بتظهر الأول في القايمة، وأول واحدة بتبقى الاختيار الافتراضي
const SPORT_TO_TYPE = { "المشي": "walking", "الركض": "running", "كرة القدم": "football", "تمارين جيم": "gym", "تمارين منزلية": "home",
  "السباحة": "swimming", "ركوب العجل": "cycling", "البادل / التنس": "padel", "كرة السلة": "basketball", "اليوجا": "yoga" };
const favSportIds = () => (profile?.sportsInterests || []).map(s => SPORT_TO_TYPE[s]).filter(Boolean);
function exBuildTypeOptions() {
  const fav = favSportIds();
  const opt = t => `<option value="${t.id}">${t.icon} ${t.name}</option>`;
  const favTypes = fav.map(id => EX_TYPES.find(t => t.id === id));
  const rest = EX_TYPES.filter(t => !fav.includes(t.id));
  $("exType").innerHTML = favTypes.length
    ? `<optgroup label="⭐ اهتماماتك">${favTypes.map(opt).join("")}</optgroup><optgroup label="رياضات تانية">${rest.map(opt).join("")}</optgroup>`
    : EX_TYPES.map(opt).join("");
}
exBuildTypeOptions();
exResetForm();
profileListeners.push(() => { exBuildTypeOptions(); exResetForm(); });

["exType", "exIntensity", "exRepeat"].forEach(id => $(id).addEventListener("change", exUpdateFields));
["exMinutes", "exCount"].forEach(id => $(id).addEventListener("input", renderExBurn));
$("exChips").addEventListener("click", e => {
  const m = e.target.dataset.min;
  if (!m) return;
  $("exMinutes").value = m;
  $("exMinutes").classList.remove("invalid");
  renderExBurn();
});
$("exClear").addEventListener("click", exResetForm);
$("exCancelEdit").addEventListener("click", exResetForm);
$("exForm").addEventListener("input", e => e.target.classList.remove("invalid"));

$("exForm").addEventListener("submit", e => {
  e.preventDefault();
  const type = $("exType").value;
  const typeOther = $("exOther").value.trim();
  const date = $("exDate").value;
  const minutes = parseInt($("exMinutes").value, 10);
  const repeat = $("exRepeat").value;
  const count = repeat === "once" ? 1 : parseInt($("exCount").value, 10);

  let err = "";
  if (type === "other" && !typeOther) { $("exOther").classList.add("invalid"); err = "اكتب نوع الرياضة"; }
  else if (!date) { $("exDate").classList.add("invalid"); err = "اختار تاريخ الممارسة"; }
  else if (!exEditingId && date < todayStr()) { $("exDate").classList.add("invalid"); err = "التاريخ لازم يكون النهارده أو بعده"; }
  else if (!(minutes >= 5 && minutes <= 600)) { $("exMinutes").classList.add("invalid"); err = "اكتب مدة الممارسة بالدقايق (من 5 لـ 600)"; }
  else if ($("exTime").validity.badInput) { $("exTime").classList.add("invalid"); err = "كمّل الساعة: الساعة والدقايق وص/م"; }
  else if (!exEditingId && repeat !== "once" && !(count >= 2 && count <= 60)) { $("exCount").classList.add("invalid"); err = "عدد مرات التكرار من 2 لـ 60"; }
  if (err) { $("exError").textContent = err; return; }

  const data = {
    type, typeOther: type === "other" ? typeOther : "",
    intensity: $("exIntensity").value,
    minutes,
    time: $("exTime").value,
    notes: $("exNotes").value.trim(),
  };

  if (exEditingId) {
    const w = workouts.find(x => x.id === exEditingId);
    Object.assign(w, data, { date });
    toast("تم حفظ التعديل ✓");
  } else {
    const step = repeat === "weekly" ? 7 : 1;
    for (let i = 0; i < count; i++) {
      workouts.push({
        id: Date.now().toString(36) + i + Math.random().toString(36).slice(2, 6),
        ...data, date: addDays(date, i * step), status: "scheduled", doneOn: null,
      });
    }
    const kcal = burnKcal(type, data.intensity, minutes);
    toast(count > 1
      ? `تمت إضافة ${count} تمرين ✓ هتحرق حوالي ${(kcal * count).toLocaleString("en-US")} سعر حراري 🔥`
      : `تمت إضافة التمرين ✓ هتحرق حوالي ${kcal} سعر حراري 🔥`);
  }
  saveWorkouts();
  exResetForm();
  renderExercisePage();
});

// --- التعليم والأزرار ---
$("exercisePage").addEventListener("change", e => {
  const id = e.target.dataset.done;
  if (!id) return;
  const w = workouts.find(x => x.id === id);
  if (!w || exStatus(w) === "upcoming") { renderExercisePage(); return; }
  if (e.target.checked) {
    w.status = "done";
    w.doneOn = todayStr();
    saveWorkouts();
    renderExercisePage();
    const wk = exWeekStats();
    const left = Math.max(WEEKLY_GOAL_MIN - wk.minutes, 0);
    celebrate("🔥", `عاش يا بطل! خلّصت ${exType(w.type).name} ${w.minutes} دقيقة وحرقت حوالي ${woKcal(w)} سعر حراري 💪 ` +
      (left ? `فاضلك ${left} دقيقة على هدف الأسبوع` : "وكمان وصلت لهدف الأسبوع 🏆"));
  } else {
    w.status = "scheduled";
    w.doneOn = null;
    saveWorkouts();
    renderExercisePage();
  }
});

$("exercisePage").addEventListener("click", e => {
  const btn = e.target.closest("[data-act]");
  if (!btn || !btn.closest("#exercisePage")) return;
  const w = workouts.find(x => x.id === btn.dataset.id);
  if (!w) return;
  switch (btn.dataset.act) {
    case "edit":
      exResetForm();
      exEditingId = w.id;
      exFill(w);
      $("exDate").min = "";
      $("exRepeatWrap").hidden = true;
      $("exFormTitle").textContent = "✎ تعديل التمرين";
      $("exSubmit").textContent = "💾 حفظ التعديل";
      $("exCancelEdit").hidden = false;
      $("exFormCard").classList.add("editing");
      break;
    case "again":
      exResetForm();
      exFill(w, { asNew: true });
      toast("البيانات اتملت، اختار التاريخ واضغط إضافة");
      break;
    case "delete":
      if (!confirm(`حذف ${exType(w.type).name} يوم ${formatDate(w.date)}؟`)) return;
      workouts = workouts.filter(x => x.id !== w.id);
      saveWorkouts();
      renderExercisePage();
      break;
  }
});

$("exBackBtn").addEventListener("click", () => { location.hash = "#/aspect/health"; });
