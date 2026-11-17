// صفحة الصوم: الاثنين والخميس

// ================== الصوم (الاثنين والخميس) ==================

const weekday = str => (toDayNumber(str) + 4) % 7; // 0 = الأحد ... 1 = الاثنين ... 4 = الخميس
const isFastDay = str => { const w = weekday(str); return w === 1 || w === 4; };
function nextFastDay(from) {
  let d = addDays(from, 1);
  while (!isFastDay(d)) d = addDays(d, 1);
  return d;
}


function fastDays() {
  if (!state.endDate) return null;
  const start = trackingStart("religious", "siyam");
  const today = todayStr();
  const days = [];
  for (let d = start; d < state.endDate; d = addDays(d, 1)) {
    if (!isFastDay(d)) continue;
    let status;
    if (isDone("religious", "siyam", d)) status = "done";
    else if (d === today) status = "today";
    else if (d < today) status = "missed";
    else status = "upcoming";
    days.push({ date: d, status });
  }
  return days;
}

function renderFastPage() {
  const aspect = ASPECTS.find(a => a.id === "religious");
  const item = aspect.items.find(i => i.id === "siyam");
  currentAspect = aspect;
  currentItem = item;
  const page = $("fastPage");
  page.style.setProperty("--c", aspect.color);
  page.style.setProperty("--cl", aspect.light);
  document.title = "الصوم — رحلة نجاح";
  $("fsStage").innerHTML = `${aspect.name} · المرحلة ${ORDINALS[state.stageIndex]}: <strong>${STAGES[state.stageIndex].name}</strong>`;

  const today = todayStr();

  // كارت النهارده
  if (isFastDay(today) && !inJourney(today) && !isDone("religious", "siyam", today)) {
    $("fsToday").innerHTML = `
      <p class="tt-label">النهارده ${dayName(today)}</p>
      <p class="hint center" style="margin:6px 0 0">${outOfJourneyMsg(today)}</p>`;
  } else if (isFastDay(today)) {
    const done = isDone("religious", "siyam", today);
    $("fsToday").innerHTML = `
      <p class="tt-label">النهارده يوم صيام</p>
      <p class="tt-date">${formatDate(today)}</p>
      <label class="big-check">
        <input type="checkbox" id="fastTodayCheck" ${done ? "checked disabled" : ""} />
        <span class="bc-box">✓</span>
        <span class="bc-text">${done ? "صمت النهارده، ربنا يتقبّل ✓" : "علّم هنا لو صايم النهارده"}</span>
      </label>`;
  } else {
    const next = nextFastDay(today);
    const inDays = daysBetween(today, next);
    $("fsToday").innerHTML = `
      <p class="tt-label">النهارده ${dayName(today)} — مش يوم صيام</p>
      <p class="fs-next-big">الصيام الجاي: <strong>${formatDate(next)}</strong></p>
      <p class="hint center">${inDays === 1 ? "بكرة إن شاء الله، متنساش تتسحّر 🌙" : `بعد ${inDays} أيام`}</p>`;
  }

  // التقدم والقائمة
  const days = fastDays();
  if (!days) {
    $("fsProgress").innerHTML = `<p class="hint center">حدد تاريخ نهاية المرحلة من الصفحة الرئيسية عشان نطلّعلك أيام الصيام 📅</p>`;
    $("fsList").innerHTML = `<p class="hint center">—</p>`;
    return;
  }
  const required = days.length;
  const done = days.filter(d => d.status === "done").length;
  const missed = days.filter(d => d.status === "missed").length;
  const remaining = required - done - missed;
  const pct = required ? Math.round((done / required) * 100) : 0;

  $("fsProgress").innerHTML = `
    <div class="ip-stats">
      <div class="ip-stat"><b>${required}</b><small>يوم صيام في المرحلة</small></div>
      <div class="ip-stat done"><b>${done}</b><small>صمته</small></div>
      <div class="ip-stat late"><b>${missed}</b><small>فاتني</small></div>
      <div class="ip-stat"><b>${remaining}</b><small>متبقي</small></div>
    </div>
    <div class="ip-progress"><div style="width:${pct}%"></div></div>
    <div class="ip-pct"><span>${done} من ${required} يوم</span><strong>${pct}%</strong></div>`;

  if (!required) {
    $("fsList").innerHTML = `<p class="hint center">مفيش أيام اثنين أو خميس في المدة المتبقية من المرحلة.</p>`;
    return;
  }
  const nextUpcoming = days.find(d => d.status === "upcoming");
  const tag = d => ({
    done: "✓ صمته",
    today: "النهارده",
    missed: "فاتني — لا يُعوَّض",
    upcoming: `بعد ${daysBetween(today, d.date)} يوم`,
  })[d.status];

  $("fsList").innerHTML = days.map(d => {
    const [, m, dd] = d.date.split("-").map(Number);
    const monthName = new Intl.DateTimeFormat("ar-EG", { month: "short" }).format(new Date(2000, m - 1, 1));
    const canCheck = d.status === "today";
    return `
    <div class="fs-row ${d.status} ${d === nextUpcoming ? "next" : ""}">
      <span class="fs-day"><b>${dd}</b><small>${monthName}</small></span>
      <span class="fs-info">
        <span class="fs-name">${dayName(d.date)}</span>
        <span class="fs-date">${formatDate(d.date)}</span>
      </span>
      <span class="fs-tag">${tag(d)}</span>
      <label class="pr-check" aria-label="صمت يوم ${formatDate(d.date)}">
        <input type="checkbox" data-date="${d.date}" ${d.status === "done" ? "checked" : ""} ${canCheck ? "" : "disabled"} />
        <span class="bc-box">✓</span>
      </label>
    </div>`;
  }).join("");
}

function markFastToday() {
  const today = todayStr();
  if (!isFastDay(today) || isDone("religious", "siyam", today) || !inJourney(today)) return;
  setDone("religious", "siyam", today, "ontime");
  renderFastPage();
  const msgs = currentItem.messages;
  const m = msgs[Math.floor(Math.random() * msgs.length)];
  celebrate(m.e, m.t);
}
$("fsToday").addEventListener("change", e => { if (e.target.id === "fastTodayCheck" && e.target.checked) markFastToday(); });
$("fsList").addEventListener("change", e => {
  if (e.target.dataset.date === todayStr() && e.target.checked) markFastToday();
  else renderFastPage();
});
$("fastBackBtn").addEventListener("click", () => { location.hash = "#/aspect/religious"; });


