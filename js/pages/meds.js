// صفحة مواعيد الأدوية والعلاج

// المواعيد بالترتيب على مدار اليوم
const MED_TIMES = [
  { id: "morning",      name: "مرة صباحاً",       icon: "🌅" },
  { id: "beforeMeal",   name: "مرة قبل الفطار",    icon: "🍳" },
  { id: "afterMeal",    name: "مرة بعد الفطار",    icon: "🍳" },
  { id: "beforeLunch",  name: "مرة قبل الغداء",    icon: "🥘" },
  { id: "afterLunch",   name: "مرة بعد الغداء",    icon: "🥘" },
  { id: "beforeDinner", name: "مرة قبل العشاء",    icon: "🍲" },
  { id: "afterDinner",  name: "مرة بعد العشاء",    icon: "🍲" },
  { id: "evening",      name: "مرة مساءً",         icon: "🌙" },
];
const medTime = id => MED_TIMES.find(t => t.id === id) || MED_TIMES[0];
const medTimeOrder = id => MED_TIMES.findIndex(t => t.id === id);

// --- التخزين ---
// كل دواء = ميعاد واحد. لو الدواء مرتين في اليوم بيتضاف مرتين
// { id, name, disease, dose, time, start: "YYYY-MM-DD", days: number|null (null = مستمر), stoppedOn: "YYYY-MM-DD"|null }
const MEDS_KEY = "rehlatNajah.meds";
const MEDS_LOG = "health.meds"; // logData["health.meds"]["2026-11-16"] = { medId: "ontime" }

let meds = (() => {
  try { return JSON.parse(localStorage.getItem(MEDS_KEY)) || []; } catch { return []; }
})();
function saveMeds() {
  try { localStorage.setItem(MEDS_KEY, JSON.stringify(meds)); } catch {}
}

function medEnd(m) {
  // أول يوم الدواء مبقاش فيه (مش داخل في المدة)
  let end = m.days ? addDays(m.start, m.days) : null;
  if (m.stoppedOn && (!end || m.stoppedOn < end)) end = m.stoppedOn;
  return end;
}
function medActiveOn(m, d) {
  if (d < m.start) return false;
  const end = medEnd(m);
  return !end || d < end;
}
function medsOn(d) {
  return meds.filter(m => medActiveOn(m, d))
             .sort((a, b) => medTimeOrder(a.time) - medTimeOrder(b.time) || a.name.localeCompare(b.name, "ar"));
}
function medTaken(d, id) {
  const day = logData[MEDS_LOG]?.[d];
  return !!(day && typeof day === "object" && day[id]);
}
function setMedTaken(d, id, val) {
  const all = (logData[MEDS_LOG] ??= {});
  const day = (typeof all[d] === "object" && all[d]) || (all[d] = {});
  if (val) day[id] = "ontime"; else delete day[id];
  saveLog();
}

// --- الإحصائيات ---
function medsTodayCounts(d = todayStr()) {
  const list = medsOn(d);
  return { total: list.length, done: list.filter(m => medTaken(d, m.id)).length };
}

function medsStats() {
  if (!state.endDate) return null;
  const start = trackingStart("health", "meds");
  const today = todayStr();
  let required = 0, done = 0, missed = 0;
  for (let d = start; d < state.endDate; d = addDays(d, 1)) {
    for (const m of medsOn(d)) {
      required++;
      if (medTaken(d, m.id)) done++;
      else if (d < today) missed++;
    }
  }
  const remaining = Math.max(required - done - missed, 0);
  const pct = required ? Math.round((done / required) * 100) : 0;
  return { required, done, missed, remaining, pct };
}

function medsStreak() {
  let d = todayStr();
  const t = medsTodayCounts(d);
  if (!t.total || t.done < t.total) d = addDays(d, -1);
  let n = 0;
  for (;;) {
    const c = medsTodayCounts(d);
    if (!c.total || c.done < c.total) break;
    n++; d = addDays(d, -1);
  }
  return n;
}

// --- العرض ---
function courseLabel(m, d) {
  if (!m.days) return "مستمر";
  const dayNo = daysBetween(m.start, d) + 1;
  return `يوم ${dayNo} من ${m.days}`;
}

function renderMedsPage() {
  const aspect = ASPECTS.find(a => a.id === "health");
  currentAspect = aspect;
  const page = $("medsPage");
  page.style.setProperty("--c", aspect.color);
  page.style.setProperty("--cl", aspect.light);
  document.title = "مواعيد الأدوية — رحلة نجاح";
  $("mdStage").innerHTML = `${aspect.name} · المرحلة ${ORDINALS[state.stageIndex]}: <strong>${STAGES[state.stageIndex].name}</strong>`;
  const streak = medsStreak();
  $("mdStreak").textContent = streak >= 2 ? `🔥 ${streak} أيام متواصلة أخدت فيهم كل أدويتك` : "";

  // جدول النهارده
  const today = todayStr();
  const list = medsOn(today);
  const done = list.filter(m => medTaken(today, m.id)).length;
  $("mdDate").textContent = formatDate(today);
  $("mdCount").textContent = list.length ? `${done} من ${list.length}` : "";
  $("mdBar").style.width = list.length ? `${Math.round((done / list.length) * 100)}%` : "0%";

  if (!list.length) {
    $("mdToday").innerHTML = `<p class="md-empty">مفيش أدوية في جدول النهارده. ضيف دواء من الاستمارة اللي تحت 👇</p>`;
  } else {
    let html = "", lastSlot = null;
    for (const m of list) {
      if (m.time !== lastSlot) {
        html += `<div class="md-slot">${medTime(m.time).icon} ${medTime(m.time).name}</div>`;
        lastSlot = m.time;
      }
      const taken = medTaken(today, m.id);
      html += `
        <div class="md-row ${taken ? "done" : ""}">
          <span class="md-pill">💊</span>
          <span class="md-info">
            <span class="md-name">${escapeHtml(m.name)}</span>
            <span class="md-meta">${m.disease ? `لـ <b>${escapeHtml(m.disease)}</b>` : ""}${m.disease && m.dose ? " · " : ""}${m.dose ? escapeHtml(m.dose) : ""}</span>
          </span>
          <span class="md-course">${courseLabel(m, today)}</span>
          <label class="pr-check" aria-label="أخدت ${escapeHtml(m.name)}">
            <input type="checkbox" data-id="${m.id}" ${taken ? "checked" : ""} />
            <span class="bc-box">✓</span>
          </label>
        </div>`;
    }
    if (done === list.length) html += `<p class="md-all-done">✓ أخدت كل أدوية النهارده، ألف سلامة عليك 💙</p>`;
    $("mdToday").innerHTML = html;
  }

  // اقتراحات الأسماء من الأدوية اللي اتضافت قبل كده
  const uniq = arr => [...new Set(arr.filter(Boolean))];
  $("mdNameList").innerHTML = uniq(meds.map(m => m.name)).map(n => `<option value="${escapeHtml(n)}">`).join("");
  $("mdDiseaseList").innerHTML = uniq(meds.map(m => m.disease)).map(n => `<option value="${escapeHtml(n)}">`).join("");

  // الالتزام
  const s = medsStats();
  if (!s) {
    $("mdProgress").innerHTML = `<p class="hint center">حدد تاريخ نهاية المرحلة من الصفحة الرئيسية عشان نحسب التزامك 📅</p>`;
  } else if (!s.required) {
    $("mdProgress").innerHTML = `<p class="hint center">لما تضيف أدوية، هنحسب التزامك بيها في المرحلة هنا.</p>`;
  } else {
    $("mdProgress").innerHTML = `
      <div class="ip-stats">
        <div class="ip-stat"><b>${s.required}</b><small>جرعة في المرحلة</small></div>
        <div class="ip-stat done"><b>${s.done}</b><small>أخدتها</small></div>
        <div class="ip-stat late"><b>${s.missed}</b><small>فاتتني</small></div>
        <div class="ip-stat"><b>${s.remaining}</b><small>متبقي</small></div>
      </div>
      <div class="ip-progress"><div style="width:${s.pct}%"></div></div>
      <div class="ip-pct"><span>${s.done} من ${s.required} جرعة</span><strong>${s.pct}%</strong></div>`;
  }

  // كل الأدوية
  renderAllMeds();
}

function medStatus(m) {
  const today = todayStr();
  if (today < m.start) return { cls: "upcoming", text: `يبدأ ${formatDate(m.start)}` };
  if (medActiveOn(m, today)) return { cls: "active", text: m.days ? "شغال" : "مستمر" };
  return { cls: "ended", text: m.stoppedOn ? "اتوقف" : "خلص" };
}

function renderAllMeds() {
  if (!meds.length) {
    $("mdAll").innerHTML = `<p class="md-empty">لسه ما ضفتش أدوية.</p>`;
    return;
  }
  const sorted = [...meds].sort((a, b) => medTimeOrder(a.time) - medTimeOrder(b.time));
  const groups = { current: [], ended: [] };
  sorted.forEach(m => (medStatus(m).cls === "ended" ? groups.ended : groups.current).push(m));

  const row = m => {
    const st = medStatus(m);
    const end = medEnd(m);
    const period = m.days
      ? `من ${formatDate(m.start)} لمدة ${m.days} يوم`
      : `من ${formatDate(m.start)} — مستمر`;
    const actions = st.cls !== "ended"
      ? `<button class="md-act" data-stop="${m.id}">إيقاف</button>`
      : "";
    return `
      <div class="md-item">
        <span class="md-info">
          <span class="md-name" style="font-size:.95rem">${escapeHtml(m.name)} <small style="color:var(--muted);font-weight:600">· ${medTime(m.time).name}</small></span>
          <span class="md-meta">${m.disease ? `${escapeHtml(m.disease)} · ` : ""}${period}${st.cls === "ended" && end ? ` · آخر يوم ${formatDate(addDays(end, -1))}` : ""}</span>
        </span>
        <span class="md-status ${st.cls}">${st.text}</span>
        ${actions}
        <button class="md-act danger" data-del="${m.id}" aria-label="حذف">🗑</button>
      </div>`;
  };

  $("mdAll").innerHTML =
    (groups.current.length ? `<div class="md-group-title">الأدوية الحالية (${groups.current.length})</div>${groups.current.map(row).join("")}` : "") +
    (groups.ended.length ? `<div class="md-group-title">أدوية خلصت (${groups.ended.length})</div>${groups.ended.map(row).join("")}` : "");
}

// --- الاستمارة ---
function resetMedForm(full) {
  if (full) {
    $("mdName").value = "";
    $("mdDisease").value = "";
    $("mdDose").value = "";
    $("mdDays").value = "";
    $("mdOngoing").checked = false;
    $("mdDays").disabled = false;
  }
  $("mdTime").value = "";
  $("mdStart").value = todayStr();
  $("mdError").textContent = "";
  document.querySelectorAll("#medForm .invalid").forEach(el => el.classList.remove("invalid"));
}

$("mdTime").innerHTML = `<option value="">اختار الميعاد…</option>` +
  MED_TIMES.map(t => `<option value="${t.id}">${t.icon} ${t.name}</option>`).join("");
resetMedForm(true);

$("mdOngoing").addEventListener("change", e => {
  $("mdDays").disabled = e.target.checked;
  if (e.target.checked) { $("mdDays").value = ""; $("mdDays").classList.remove("invalid"); }
});
$("mdClear").addEventListener("click", () => resetMedForm(true));
$("medForm").addEventListener("input", e => e.target.classList.remove("invalid"));

$("medForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = $("mdName").value.trim();
  const time = $("mdTime").value;
  const ongoing = $("mdOngoing").checked;
  const days = parseInt($("mdDays").value, 10);
  const start = $("mdStart").value || todayStr();

  let err = "";
  if (!name) { $("mdName").classList.add("invalid"); err = "اكتب اسم الدواء"; }
  else if (!time) { $("mdTime").classList.add("invalid"); err = "اختار ميعاد الدواء"; }
  else if (!ongoing && !(days >= 1)) { $("mdDays").classList.add("invalid"); err = "اكتب مدة الجرعة بالأيام، أو علّم إنه دواء مستمر"; }
  if (err) { $("mdError").textContent = err; return; }

  // منع تكرار نفس الدواء في نفس الميعاد
  const dup = meds.find(m => m.name === name && m.time === time && medActiveOn(m, start));
  if (dup) { $("mdError").textContent = `"${name}" موجود بالفعل في ميعاد "${medTime(time).name}"`; return; }

  meds.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name,
    disease: $("mdDisease").value.trim(),
    dose: $("mdDose").value.trim(),
    time,
    start,
    days: ongoing ? null : days,
    stoppedOn: null,
  });
  saveMeds();
  // بنسيب الاسم والمرض والمدة عشان لو عايز تضيف ميعاد تاني لنفس الدواء
  resetMedForm(false);
  renderMedsPage();
  toast(`تمت إضافة "${name}" — ${medTime(time).name} ✓ تقدر تختار ميعاد تاني لنفس الدواء وتضيفه`);
});

// --- جدول النهارده ---
$("mdToday").addEventListener("change", e => {
  const id = e.target.dataset.id;
  if (!id) return;
  const today = todayStr();
  setMedTaken(today, id, e.target.checked);
  renderMedsPage();
  if (!e.target.checked) return;
  const c = medsTodayCounts(today);
  if (c.done === c.total) {
    celebrate("💙", "ما شاء الله! أخدت كل أدويتك النهارده في مواعيدها، ربنا يتمّ عليك الشفا والعافية");
  } else {
    const m = meds.find(x => x.id === id);
    toast(`ألف سلامة عليك 💙 اتسجّل "${m.name}" — فاضل ${c.total - c.done}`);
  }
});

// --- إيقاف / حذف ---
$("mdAll").addEventListener("click", e => {
  const stopId = e.target.dataset.stop;
  const delId = e.target.dataset.del;
  if (stopId) {
    const m = meds.find(x => x.id === stopId);
    if (!confirm(`إيقاف "${m.name}" (${medTime(m.time).name}) من النهارده؟\nهيختفي من الجدول، وسجلّه القديم هيفضل محفوظ.`)) return;
    const today = todayStr();
    m.stoppedOn = today < m.start ? m.start : today;
    saveMeds();
    renderMedsPage();
    toast(`تم إيقاف "${m.name}"`);
  } else if (delId) {
    const m = meds.find(x => x.id === delId);
    if (!confirm(`حذف "${m.name}" (${medTime(m.time).name}) نهائياً؟\nسجلّ الجرعات بتاعته هيتشال من الإحصائيات.\n\nلو الدواء خلص أو وقفته، الأفضل تستخدم "إيقاف".`)) return;
    meds = meds.filter(x => x.id !== delId);
    saveMeds();
    renderMedsPage();
    toast(`تم حذف "${m.name}"`);
  }
});

$("medsBackBtn").addEventListener("click", () => { location.hash = "#/aspect/health"; });
