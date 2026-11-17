// الصفحة الرئيسية: التاريخ، الرحلة ومراحلها، قائمة الجوانب + أرشيف الرحلات

// ================== العرض ==================
function renderToday() {
  const t = todayStr();
  $("todayDate").textContent = formatDate(t);
  $("todayHijri").textContent = formatDate(t, "hijri");
}

function stepperHTML(j = journey) {
  const t = todayStr();
  const cur = j.status === "active" ? j.current : j.stages.length;
  return `<ol class="stepper ${j.stages.length > 4 ? "many" : ""}">${j.stages.map((s, i) => {
    const past = i < cur || (s.end && s.end < t && j.status === "active");
    const cls = past ? "completed" : i === cur ? "current" : "";
    return `<li class="step ${cls}" title="${escapeHtml(s.name)}${s.start && s.end ? ` · ${formatShort(s.start)} – ${formatShort(s.end)}` : ""}">
      <div class="step-circle">${past ? "✓" : i + 1}</div><div class="step-name">${escapeHtml(s.name)}</div></li>`;
  }).join("")}</ol>`;
}

function journeyDays(j = journey) {
  const st = j.stages.filter(s => s.start && s.end);
  if (!st.length) return null;
  const start = st[0].start, end = st[st.length - 1].end;
  const total = daysBetween(start, end) + 1;
  const passed = Math.min(Math.max(daysBetween(start, todayStr()) + 1, 0), total);
  return { start, end, total, passed };
}

// ================== إحصائيات رحلة كاملة (كل مراحلها) ==================
// بنحسب كل مرحلة لوحدها (اختياراتها المفعّلة وتواريخها) لحد "upto"، وبعدين بنجمع
function journeyStats(j, upto = todayStr()) {
  const saved = { ...state };
  const stages = j.stages.map((s, i) => {
    const base = { name: s.name, start: s.start, end: s.end, days: s.start && s.end ? daysBetween(s.start, s.end) + 1 : 0 };
    if (!s.start || !s.end || s.start > upto) return { ...base, pct: 0, done: 0, required: 0, late: 0, aspects: [], notStarted: true };
    const stop = s.end < upto ? s.end : upto;
    Object.assign(state, { stageIndex: i, startDate: s.start, endDate: addDays(stop, 1), stageKey: `${j.id}:${i}` });
    const aspects = ASPECTS.map(a => {
      const st = aspectStats(a);
      if (!st || !st.rows.length) return null;
      return {
        id: a.id, name: a.name, icon: a.icon, color: a.color, pct: st.pct ?? 0, done: st.done, required: st.required, late: st.late,
        items: st.rows.map(({ it, s: r }) => ({ name: it.name, icon: it.icon, done: r.done, required: r.required, late: r.late })),
      };
    }).filter(Boolean);
    const required = aspects.reduce((n, a) => n + a.required, 0), done = aspects.reduce((n, a) => n + a.done, 0);
    return { ...base, actualEnd: stop, pct: required ? Math.round((done / required) * 100) : 0, done, required, late: aspects.reduce((n, a) => n + a.late, 0), aspects };
  });
  Object.assign(state, saved);
  const required = stages.reduce((n, s) => n + s.required, 0), done = stages.reduce((n, s) => n + s.done, 0);
  return { stages, required, done, late: stages.reduce((n, s) => n + s.late, 0), pct: required ? Math.round((done / required) * 100) : 0 };
}

// إنجاز المرحلة الحالية
function stageCompletion() {
  let req = 0, done = 0;
  ASPECTS.forEach(a => { const s = aspectStats(a); if (s) { req += s.required; done += s.done; } });
  return req ? Math.round((done / req) * 100) : 0;
}

// ================== كارت الرحلة ==================
function renderStage() {
  if (journeyReady() && $("homePage").classList.contains("show")) renderDashboard();
  const box = $("journeyBox");

  // مفيش رحلة شغالة
  if (!journey || journey.status !== "active") {
    box.innerHTML = `
      <div class="jn-empty">
        <div class="jn-big">🧭</div>
        <h3>ابدأ رحلتك</h3>
        <p>سمّي رحلتك، وقسّمها لمراحل على مزاجك، وحدد تاريخ كل مرحلة — والبرنامج يتابع معاك.</p>
        <div class="jn-actions">
          <a class="btn btn-primary" href="#/journey/new">✨ ابدأ رحلة جديدة</a>
          ${archive.length ? `<a class="btn btn-outline" href="#/archive">🗂️ ارجع لرحلة من الأرشيف</a>` : ""}
        </div>
      </div>`;
    return;
  }

  const jd = journeyDays();
  const head = `<p class="jn-name">🧭 <strong>${escapeHtml(journey.name)}</strong>${jd ? ` · ${journey.stages.length} ${journey.stages.length === 1 ? "مرحلة" : "مراحل"} · ${jd.total} يوم · الرحلة: يوم ${jd.passed} من ${jd.total}` : ""}</p>`;
  const actions = `
    <div class="jn-actions">
      <a class="btn btn-outline" href="#/journey">⚙️ تعديل الرحلة</a>
      <button class="btn btn-outline" id="restartJourneyBtn">🔁 إعادة الرحلة من الأول</button>
      <a class="btn btn-outline" href="#/journey/new">✨ رحلة جديدة</a>
      <button class="btn btn-outline jn-danger" id="endJourneyBtn">🏁 إنهاء الرحلة</button>
    </div>`;
  const stage = journey.stages[journey.current];

  // المرحلة الحالية من غير تواريخ
  if (!stage.start || !stage.end) {
    box.innerHTML = `${head}${stepperHTML()}
      <p class="now-in">المرحلة ${ORDINALS[journey.current] || journey.current + 1}</p>
      <p class="stage-name-big">${escapeHtml(stage.name)}</p>
      <p class="jn-warn">📅 المرحلة دي لسه مالهاش تواريخ — حدد بدايتها ونهايتها</p>
      <div class="jn-actions"><a class="btn btn-primary" href="#/journey">📅 حدد التواريخ</a></div>`;
    return;
  }

  const today = todayStr();
  const total = daysBetween(stage.start, stage.end) + 1;
  const notStarted = today < stage.start;
  const journeyOver = jd && today > jd.end;
  const passed = notStarted ? 0 : Math.min(daysBetween(stage.start, today) + 1, total);
  const left = Math.max(total - passed, 0);
  const timePct = Math.round((passed / total) * 100);
  const js = journeyStats(journey);
  // الإنجاز محسوب لحد النهارده (الأيام اللي لسه مجتش مش بتتحسب)
  const done = js.stages[journey.current]?.pct ?? 0;

  let banner = "";
  if (notStarted) {
    banner = `<p class="jn-warn">⏳ ${journey.current === 0 ? "الرحلة" : "المرحلة"} بتبدأ ${formatDate(stage.start)} — بعد ${daysBetween(today, stage.start)} يوم</p>`;
  } else if (journeyOver) {
    banner = `
      <div class="jn-ended">
        <b>🏁 مدة الرحلة خلصت — إنجازك في الرحلة كلها ${js.pct}%</b>
        <span>انقلها للأرشيف عشان تحتفظ بتفاصيلها، وابدأ رحلة جديدة</span>
        <button class="btn btn-primary" id="finishJourneyBtn">📦 انقل الرحلة للأرشيف</button>
      </div>`;
  }

  box.innerHTML = `${head}${stepperHTML()}
    <p class="now-in">أنت الآن في المرحلة ${ORDINALS[journey.current] || journey.current + 1}${journey.stages.length > 1 ? ` من ${journey.stages.length}` : ""}</p>
    <p class="stage-name-big">${escapeHtml(stage.name)}</p>
    ${banner}
    <div class="stats">
      <div class="stat"><span class="stat-num">${total}</span><span class="stat-label">مدة المرحلة (يوم)</span></div>
      <div class="stat"><span class="stat-num">${passed}</span><span class="stat-label">يوم عدّى</span></div>
      <div class="stat highlight"><span class="stat-num">${left}</span><span class="stat-label">يوم متبقي</span></div>
    </div>
    <div class="progress"><div class="progress-bar" style="width:${timePct}%"></div></div>
    <p class="progress-text">عدّى ${timePct}% من وقت المرحلة · <strong>إنجازك في المرحلة ${done}%</strong> · في الرحلة كلها <strong>${js.pct}%</strong></p>
    <p class="dates-range">المرحلة من ${formatDate(stage.start)} إلى ${formatDate(stage.end)}</p>
    ${actions}`;

  $("finishJourneyBtn")?.addEventListener("click", () => {
    archiveJourney("completed");
    journey = null; saveJourney(); syncState();
    celebrate("🏁", "مبروك! الرحلة اتنقلت للأرشيف بكل تفاصيلها — تقدر ترجعلها أو تبدأ رحلة جديدة");
    location.hash = "#/";
    render(); route();
  });
  $("endJourneyBtn").addEventListener("click", () => {
    if (!confirm(`إنهاء رحلة "${journey.name}"؟\nهتتنقل للأرشيف بإنجازها الحالي (${js.pct}%)، وتقدر ترجعلها منه في أي وقت.`)) return;
    archiveJourney(journeyOver ? "completed" : "ended");
    journey = null; saveJourney(); syncState();
    toast("🏁 الرحلة اتنهت واتنقلت للأرشيف");
    render(); route();
  });
  $("restartJourneyBtn").addEventListener("click", () => {
    if (!confirm(`إعادة رحلة "${journey.name}" من الأول؟\nالرحلة الحالية هتتنقل للأرشيف، وهتبدأ نسخة جديدة بنفس المراحل ومددها من النهارده.`)) return;
    restartJourney(journey);
  });
}

// ================== الأرشيف ==================
// reason: completed (خلصت مدتها) | ended (اتنهت قبل ميعادها) | restarted (اتعادت من الأول) | replaced (رحلة تانية بدأت مكانها)
function archiveJourney(reason, j = journey) {
  if (!j) return;
  const today = todayStr();
  const jd = journeyDays(j);
  const stats = journeyStats(j);
  const startedStages = stats.stages.filter(s => !s.notStarted);
  const actualEnd = jd ? (today < jd.end ? (today < jd.start ? jd.start : today) : jd.end) : today;
  archive.unshift({
    id: "a" + Date.now().toString(36),
    journeyId: j.id, name: j.name,
    start: jd?.start || "", plannedEnd: jd?.end || "", end: actualEnd,
    days: jd ? Math.max(daysBetween(jd.start, actualEnd) + 1, 0) : 0, plannedDays: jd?.total || 0,
    stagesCount: j.stages.length, reachedStage: j.current,
    closedOn: today, reason,
    pct: stats.pct, done: stats.done, required: stats.required, late: stats.late,
    stages: stats.stages, startedStages: startedStages.length,
    journeyData: JSON.parse(JSON.stringify(j)), // عشان نقدر نرجعلها
  });
  saveArchive();
}

// نسخة جديدة من نفس الرحلة (نفس المراحل ومددها) تبدأ من النهارده
function cloneJourneyFromToday(j) {
  let start = todayStr();
  return {
    id: "j" + Date.now().toString(36), name: j.name, current: 0, status: "active", createdOn: todayStr(),
    stages: j.stages.map((s, i) => {
      const len = s.start && s.end ? daysBetween(s.start, s.end) : 29;
      const st = { id: "s" + i + Date.now().toString(36), name: s.name, start, end: addDays(start, len) };
      start = addDays(st.end, 1);
      return st;
    }),
  };
}

function restartJourney(fromJ, archivedEntryId = null) {
  const fromKey = journey?.status === "active" ? state.stageKey : (fromJ ? `${fromJ.id}:0` : null);
  if (journey && journey.status === "active") archiveJourney(journey === fromJ ? "restarted" : "replaced");
  journey = cloneJourneyFromToday(fromJ);
  if (fromKey) carryToggles(fromKey, `${journey.id}:0`);
  saveJourney();
  syncState();
  toast(`🔁 "${journey.name}" بدأت من جديد النهارده`);
  location.hash = "#/";
  render(); route();
}

// الرجوع لرحلة من الأرشيف: بترجع شغالة زي ما كانت، والرحلة الحالية (لو فيه) بتروح الأرشيف
function resumeJourney(entryId) {
  const a = archive.find(x => x.id === entryId);
  if (!a?.journeyData) return;
  if (journey && journey.status === "active") archiveJourney("replaced");
  journey = { ...JSON.parse(JSON.stringify(a.journeyData)), status: "active" };
  archive = archive.filter(x => x.id !== entryId);
  saveArchive();
  saveJourney();
  syncState();
  const jd = journeyDays();
  toast(jd && todayStr() > jd.end ? `↩️ رجعت لـ "${journey.name}" — مدتها خلصت، عدّل التواريخ لو عايز تكمّلها` : `↩️ رجعت لـ "${journey.name}"`);
  location.hash = "#/";
  render(); route();
}

function renderAspects() {
  $("aspectsList").innerHTML = ASPECTS.map(a => {
    const badge = a.items
      ? `<span class="aspect-badge">مفعّل ${countOn(a)} من ${a.items.length}</span>`
      : "";
    return `
    <button class="aspect" data-id="${a.id}" style="--c:${a.color};--cl:${a.light}">
      <span class="aspect-icon">${a.icon}</span>
      <span class="aspect-body">
        <span class="aspect-name" style="display:block">${a.name}</span>
        <span class="aspect-desc">${a.desc}</span>
        ${badge}
      </span>
      <span class="aspect-arrow">‹</span>
    </button>`;
  }).join("");
}

function render() {
  renderToday();
  renderStage();
}

// ================== الأحداث ==================
$("aspectsList").addEventListener("click", e => {
  const btn = e.target.closest(".aspect");
  if (!btn) return;
  location.hash = `#/aspect/${btn.dataset.id}`;
});

// تحديث تلقائي لما اليوم يتغير أو ترجع للبرنامج (والمرحلة بتتغير لوحدها حسب التاريخ)
let lastDay = todayStr();
function checkNewDay() {
  if (todayStr() !== lastDay) { lastDay = todayStr(); syncState(); render(); route(); }
}
setInterval(checkNewDay, 60 * 1000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) checkNewDay(); });
