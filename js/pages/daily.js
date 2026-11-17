// صفحة المهمة اليومية (التوبة، القيام، القرآن، الصدقة...)

// ================== صفحة المهمة اليومية ==================
let currentItem = null;

// "يوم المهمة": لمعظم المهام هو النهارده، لكن المهام الليلية (زي القيام)
// بتفضل مفتوحة لحد أذان الفجر، فبعد نص الليل وقبل الفجر بتتحسب على الليلة اللي فاتت
function findItem(aspectId, itemId) {
  return ASPECTS.find(a => a.id === aspectId)?.items?.find(i => i.id === itemId);
}
function taskDay(aspectId, itemId) {
  const t = todayStr();
  if (!findItem(aspectId, itemId)?.untilFajr) return t;
  const fajr = computePrayerTimes(t, currentLocation()).fajr;
  return nowMinutes() < fajr ? addDays(t, -1) : t;
}

function itemStats(aspectId, itemId) {
  if (!state.endDate) return null;
  const start = trackingStart(aspectId, itemId);
  const end = state.endDate;
  const today = taskDay(aspectId, itemId);
  const required = Math.max(daysBetween(start, end), 0);
  let done = 0;
  const late = [];
  for (let d = start; d < end; d = addDays(d, 1)) {
    if (isDone(aspectId, itemId, d)) done++;
    else if (d < today) late.push(d);
  }
  const remaining = required - done - late.length;
  const pct = required ? Math.round((done / required) * 100) : 0;
  return { required, done, late: late.reverse(), remaining, pct };
}

function calcStreak(aspectId, itemId) {
  let d = taskDay(aspectId, itemId);
  if (!isDone(aspectId, itemId, d)) d = addDays(d, -1); // النهارده لسه ما خلصش
  let n = 0;
  while (isDone(aspectId, itemId, d)) { n++; d = addDays(d, -1); }
  return n;
}

function renderItemPage(aspect, item) {
  currentAspect = aspect;
  currentItem = item;
  const page = $("itemPage");
  page.style.setProperty("--c", aspect.color);
  page.style.setProperty("--cl", aspect.light);
  document.title = `${item.name} — رحلة نجاح`;

  $("ipIcon").textContent = item.icon;
  $("ipName").textContent = item.name;
  $("ipStage").innerHTML = `${aspect.name} · المرحلة ${ORDINALS[state.stageIndex]}: <strong>${STAGES[state.stageIndex].name}</strong>`;

  const streak = calcStreak(aspect.id, item.id);
  $("ipStreak").textContent = streak >= 2 ? `🔥 ${streak} أيام متواصلة` : "";

  // النهارده (أو الليلة للمهام الليلية)
  const today = taskDay(aspect.id, item.id);
  const doneToday = isDone(aspect.id, item.id, today);
  const label = document.querySelector("#itemPage .tt-label");
  if (item.untilFajr) {
    const fajr = computePrayerTimes(addDays(today, 1), currentLocation()).fajr;
    label.textContent = `الليلة — مفتوحة لحد أذان الفجر (${fmtTime(fajr)})`;
    $("ttDate").textContent = `ليلة ${formatDate(today)}`;
  } else {
    label.textContent = "النهارده";
    $("ttDate").textContent = formatDate(today);
  }
  // برّه أيام الرحلة: مفيش تعليم
  const open = inJourney(today);
  $("todayCheck").checked = doneToday;
  $("todayCheck").disabled = !open && !doneToday;
  $("todayCheck").closest(".big-check").classList.toggle("locked", !open && !doneToday);
  $("ttText").textContent = doneToday ? item.doneText : open ? `علّم هنا لما تخلّص ${item.task}` : outOfJourneyMsg(today);

  // التقدم
  const s = itemStats(aspect.id, item.id);
  if (!s) {
    $("ipProgress").innerHTML = `<p class="hint center">حدد تاريخ نهاية المرحلة من الصفحة الرئيسية عشان نحسب تقدّمك 📅</p>`;
    $("lateList").innerHTML = `<p class="hint center">—</p>`;
    $("lateCount").textContent = "";
    return;
  }
  $("ipProgress").innerHTML = `
    <div class="ip-stats">
      <div class="ip-stat"><b>${s.required}</b><small>المطلوب في المرحلة</small></div>
      <div class="ip-stat done"><b>${s.done}</b><small>اتعمل</small></div>
      <div class="ip-stat late"><b>${s.late.length}</b><small>متأخر عليه</small></div>
      <div class="ip-stat"><b>${s.remaining}</b><small>متبقي</small></div>
    </div>
    <div class="ip-progress"><div style="width:${s.pct}%"></div></div>
    <div class="ip-pct"><span>${s.done} من ${s.required}</span><strong>${s.pct}%</strong></div>`;

  // الأيام المتأخرة
  $("lateCount").textContent = s.late.length || "";
  $("lateList").innerHTML = s.late.length
    ? s.late.map(d => `
        <div class="late-row">
          <label>
            <input type="checkbox" data-date="${d}" />
            <span class="late-date">${formatDate(d)}</span>
          </label>
          <span class="late-tag">متأخر عليه</span>
        </div>`).join("")
    : `<p class="empty-ok">ما شاء الله، مفيش أيام متأخرة 👏</p>`;
}


$("todayCheck").addEventListener("change", e => {
  const a = currentAspect, it = currentItem;
  if (!inJourney(taskDay(a.id, it.id))) { renderItemPage(a, it); toast(outOfJourneyMsg()); return; }
  setDone(a.id, it.id, taskDay(a.id, it.id), e.target.checked ? "ontime" : null);
  renderItemPage(a, it);
  if (e.target.checked) {
    const m = it.messages[Math.floor(Math.random() * it.messages.length)];
    celebrate(m.e, m.t);
  }
});

$("lateList").addEventListener("change", e => {
  const date = e.target.dataset.date;
  if (!date) return;
  setDone(currentAspect.id, currentItem.id, date, "late");
  toast(`أحسنت إنك ما سيبتهاش 👍 اتسجّل يوم ${formatDate(date)}`);
  renderItemPage(currentAspect, currentItem);
});

$("itemBackBtn").addEventListener("click", () => { location.hash = `#/aspect/${currentAspect.id}`; });

// المهام الليلية: نحدّث الصفحة أول ما الفجر يأذّن عشان الليلة تتقفل
setInterval(() => {
  if ($("itemPage").classList.contains("show") && currentItem?.untilFajr) renderItemPage(currentAspect, currentItem);
}, 60 * 1000);

