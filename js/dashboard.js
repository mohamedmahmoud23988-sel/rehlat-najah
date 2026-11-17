// لوحة المتابعة في الصفحة الرئيسية

// ================== لوحة المتابعة (الصفحة الرئيسية) ==================
// ملخص موحّد لأي اختيار، مهما كان نوعه (يومي / صلوات / صيام)
function itemSummary(a, it) {
  const t = todayStr();
  if (it.prayers) {
    const s = prayerStats();
    return { done: s?.done ?? 0, required: s?.required ?? 0, late: s?.missedCount ?? 0,
             todayDone: prayersDoneCount(t), todayTotal: 5, streak: prayerStreak(), lateLabel: "فائتة" };
  }
  if (it.meds) {
    const s = medsStats();
    const c = medsTodayCounts(t);
    return { done: s?.done ?? 0, required: s?.required ?? 0, late: s?.missed ?? 0,
             todayDone: c.done, todayTotal: c.total, streak: medsStreak(), lateLabel: "فاتت" };
  }
  if (it.appts) {
    const s = apptsStats();
    const c = apptsToday();
    return { done: s?.done ?? 0, required: s?.required ?? 0, late: s?.missed ?? 0,
             todayDone: c.done, todayTotal: c.total, streak: 0, lateLabel: "فاتني" };
  }
  if (it.exercise) {
    const s = exStats();
    const c = exToday();
    return { done: s?.done ?? 0, required: s?.required ?? 0, late: s?.missed ?? 0,
             todayDone: c.done, todayTotal: c.total, streak: exStreak(), lateLabel: "فاتني" };
  }
  if (it.smallFamily) return smallFamilySummary();
  if (it.projectsHub) return projectsSummary();
  if (it.workTasks) return WORK_TASKS.summary();
  if (it.skills) return SKILLS.summary();
  if (it.growth) return GROWTH.summary();
  if (it.goalHub) return goalSummary();
  if (it.business) return BUSINESS.summary();
  if (it.affairs) {
    const s = affairsStageStats();
    const c = affairsToday();
    return { done: s?.done ?? 0, required: s?.required ?? 0, late: s?.missed ?? 0,
             todayDone: c.done, todayTotal: c.total, streak: 0, lateLabel: "عدّى موعده" };
  }
  if (it.challenges) {
    const s = challengesStageStats();
    return { done: s?.done ?? 0, required: s?.required ?? 0, late: 0,
             todayDone: 0, todayTotal: 0, streak: 0, lateLabel: "" };
  }
  if (it.diet) {
    // الحمية = الممنوعات + الوجبات الصحية (اللي مفعّل منهم)
    const parts = [];
    if (dietSubOn("forbidden")) parts.push({ s: bansStageStats(), c: bansToday(), streak: Math.max(0, ...bansOn(t).map(banStreak)) });
    if (dietSubOn("meals")) parts.push({ s: mealsStageStats(), c: mealsToday(), streak: mealsStreak() });
    const sum = f => parts.reduce((n, p) => n + f(p), 0);
    return { done: sum(p => p.s?.done ?? 0), required: sum(p => p.s?.required ?? 0), late: sum(p => p.s?.missed ?? 0),
             todayDone: sum(p => p.c.done), todayTotal: sum(p => p.c.total),
             streak: Math.max(0, ...parts.map(p => p.streak)), lateLabel: "متعلّمش" };
  }
  if (it.fasting) {
    const days = fastDays();
    const fd = isFastDay(t);
    return { done: days ? days.filter(d => d.status === "done").length : 0,
             required: days ? days.length : 0,
             late: days ? days.filter(d => d.status === "missed").length : 0,
             todayDone: fd && isDone(a.id, it.id, t) ? 1 : 0, todayTotal: fd ? 1 : 0, streak: 0, lateLabel: "فاتك" };
  }
  const s = itemStats(a.id, it.id);
  return { done: s?.done ?? 0, required: s?.required ?? 0, late: s ? s.late.length : 0,
           todayDone: isDone(a.id, it.id, taskDay(a.id, it.id)) ? 1 : 0, todayTotal: 1, streak: calcStreak(a.id, it.id), lateLabel: "متأخر" };
}

function ringSVG(pct, label = "إنجاز المرحلة") {
  const r = 46, c = 2 * Math.PI * r;
  return `
    <div class="ring" role="img" aria-label="${label} ${pct}%">
      <svg viewBox="0 0 108 108">
        <circle class="track" cx="54" cy="54" r="${r}" fill="none" stroke-width="10" />
        <circle class="bar" cx="54" cy="54" r="${r}" fill="none" stroke-width="10" stroke-linecap="round"
          stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - pct / 100)).toFixed(1)}" />
      </svg>
      <div class="ring-label"><b>${pct}%</b><small>${label}</small></div>
    </div>`;
}

function aspectDashCard(a) {
  const style = `--c:${a.color};--cl:${a.light}`;
  const active = a.items.filter(it => isOn(a.id, it.id) && hasPage(it));
  const head = `
    <div class="dc-head">
      <span class="dc-icon">${a.icon}</span>
      <span class="dc-title">${a.name}</span>
      <span class="dc-sub">مفعّل ${countOn(a)} من ${a.items.length}</span>
    </div>`;

  if (!active.length) {
    return `<div class="dash-card" data-id="${a.id}" style="${style}">${head}
      <p class="dc-empty">${countOn(a)
        ? `فعّلت ${countOn(a)} اختيار، والمتابعة هتظهر هنا أول ما نجهّز صفحاتهم`
        : `فعّل اختيارات ${a.name} عشان تبدأ تتابع تقدّمك ‹`}</p></div>`;
  }

  const rows = active.map(it => ({ it, s: itemSummary(a, it) }));
  const sum = k => rows.reduce((n, r) => n + r.s[k], 0);
  const done = sum("done"), required = sum("required"), late = sum("late");
  const todayDone = sum("todayDone"), todayTotal = sum("todayTotal");
  const pct = required ? Math.round((done / required) * 100) : 0;
  const best = Math.max(0, ...rows.map(r => r.s.streak));
  const hasStage = !!state.endDate;

  const tiles = `
    <div class="dc-tiles">
      <div class="dc-tile"><b>${todayDone} من ${todayTotal}</b><small>مهام النهارده</small></div>
      <div class="dc-tile"><b>${hasStage ? `${done} من ${required}` : "—"}</b><small>اتعمل في المرحلة</small></div>
      <div class="dc-tile ${late ? "warn" : ""}"><b>${late ? `⚠ ${late}` : "✓ 0"}</b><small>متأخر / فائت</small></div>
      <div class="dc-tile"><b>${best ? `🔥 ${best}` : "—"}</b><small>أطول سلسلة حالية (يوم)</small></div>
    </div>`;

  const meters = rows.map(({ it, s }) => {
    const p = s.required ? Math.round((s.done / s.required) * 100) : 0;
    const dots = s.todayTotal
      ? `<span class="dc-today-dots" aria-hidden="true">${Array.from({ length: s.todayTotal }, (_, i) => `<i class="${i < s.todayDone ? "on" : ""}"></i>`).join("")}</span>`
      : "";
    const tip = `${it.name}: ${s.done} من ${s.required} (${p}%)` + (s.late ? ` · ${s.late} ${s.lateLabel}` : "") +
                (s.todayTotal ? ` · النهارده ${s.todayDone} من ${s.todayTotal}` : "");
    return `
      <div class="meter" title="${tip}">
        <span class="meter-icon">${it.icon}</span>
        <span class="meter-name">${it.short || it.name}${dots}</span>
        <span class="meter-track"><span class="meter-fill" style="display:block;width:${p}%"></span></span>
        <span class="meter-val"><span class="pct">${p}%</span>${s.late ? ` · <span class="meter-late">${s.late} ${s.lateLabel}</span>` : ""}</span>
      </div>`;
  }).join("");

  return `
    <div class="dash-card" data-id="${a.id}" style="${style}">
      ${head}
      <div class="dc-top">${ringSVG(pct)}${tiles}</div>
      ${hasStage ? "" : `<p class="dc-empty" style="margin-bottom:10px">حدد تاريخ نهاية المرحلة عشان نحسب نسب الإنجاز</p>`}
      <div class="dc-meters">${meters}</div>
    </div>`;
}

function renderDashboard() {
  const ready = ASPECTS.filter(a => a.items);
  const pending = ASPECTS.filter(a => !a.items);
  $("dashList").innerHTML =
    ready.map(aspectDashCard).join("") +
    (pending.length
      ? `<div class="dash-minis">${pending.map(a => `
          <button class="dash-mini" data-id="${a.id}" style="--c:${a.color};--cl:${a.light}">
            <span class="dc-icon">${a.icon}</span>
            <span><b>${a.name}</b><small>المتابعة هتظهر هنا قريباً</small></span>
          </button>`).join("")}</div>`
      : "");
}

$("dashList").addEventListener("click", e => {
  const el = e.target.closest("[data-id]");
  if (el) location.hash = `#/aspect/${el.dataset.id}`;
});
$("fullDashBtn").addEventListener("click", () => { location.hash = "#/dashboard"; });


