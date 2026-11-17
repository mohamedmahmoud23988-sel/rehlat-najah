// صفحة الجانب: الاختيارات وأزرار On/Off

// ================== صفحة الجانب ==================
let currentAspect = null;

function renderAspectPage(aspect) {
  currentAspect = aspect;
  const page = $("aspectPage");
  page.style.setProperty("--c", aspect.color);
  page.style.setProperty("--cl", aspect.light);

  $("ahIcon").textContent = aspect.icon;
  $("ahName").textContent = aspect.name;
  $("ahStage").innerHTML = `المرحلة ${ORDINALS[state.stageIndex]}: <strong>${STAGES[state.stageIndex].name}</strong>`;
  document.title = `${aspect.name} — رحلة نجاح`;

  // متابعة الوزن بتظهر في الجانب الصحي بس
  $("weightTrack").hidden = aspect.id !== "health";
  if (aspect.id === "health") renderWeightTrack();

  const items = aspect.items || [];
  if (!items.length) {
    $("ahCount").style.display = "none";
    $("itemsList").innerHTML = "";
    $("itemsEmpty").textContent = "اختيارات الجانب ده هنضيفها لما تشرحهالي 🙂";
    return;
  }
  $("itemsEmpty").textContent = "";
  $("ahCount").style.display = "";
  updateAspectCount();

  $("itemsList").innerHTML = items.map(it => {
    const on = isOn(aspect.id, it.id);
    let todayLine = "";
    const recurring = it.daily || it.prayers || it.fasting;
    if (on && recurring && !inJourney(it.daily ? taskDay(aspect.id, it.id) : todayStr())) {
      // قبل بداية الرحلة (أو بعد نهايتها): مفيش "لسه ما اتعملتش"
      const r = journeyRange();
      todayLine = `<span class="item-today">${r && todayStr() < r.start ? `⏳ بتبدأ مع رحلتك ${formatShort(r.start)}` : "🏁 الرحلة خلصت"}</span>`;
    } else if (on && it.daily) {
      todayLine = isDone(aspect.id, it.id, taskDay(aspect.id, it.id))
        ? `<span class="item-today done">✓ اتعملت النهارده</span>`
        : `<span class="item-today pending">● لسه ما اتعملتش النهارده</span>`;
    } else if (on && it.prayers) {
      const n = prayersDoneCount(todayStr());
      todayLine = `<span class="item-today ${n === 5 ? "done" : "pending"}">${n === 5 ? "✓" : "●"} صلّيت ${n} من 5 النهارده</span>`;
    } else if (on && it.fasting) {
      const t = todayStr();
      if (isFastDay(t)) {
        todayLine = isDone(aspect.id, it.id, t)
          ? `<span class="item-today done">✓ صايم النهارده</span>`
          : `<span class="item-today pending">● النهارده يوم صيام</span>`;
      } else {
        todayLine = `<span class="item-today">الصيام الجاي: ${formatDate(nextFastDay(t))}</span>`;
      }
    } else if (on && it.meds) {
      const c = medsTodayCounts();
      todayLine = c.total
        ? `<span class="item-today ${c.done === c.total ? "done" : "pending"}">${c.done === c.total ? "✓" : "●"} أخدت ${c.done} من ${c.total} جرعة النهارده</span>`
        : `<span class="item-today">مفيش أدوية في جدول النهارده</span>`;
    } else if (on && it.appts) {
      const n = nextAppt();
      todayLine = !n
        ? `<span class="item-today">مفيش مواعيد جاية</span>`
        : apStatus(n) === "today"
          ? `<span class="item-today pending">● عندك ${apptType(n.type).name} النهارده${n.time ? ` الساعة ${apTimeText(n)}` : ""}</span>`
          : `<span class="item-today">الميعاد الجاي: ${apptType(n.type).name} — ${apCountdown(n)}</span>`;
    } else if (on && it.exercise) {
      const c = exToday();
      const wk = exWeekStats();
      todayLine = c.total
        ? `<span class="item-today ${c.done === c.total ? "done" : "pending"}">${c.done === c.total ? "✓" : "●"} اتمرّنت ${c.done} من ${c.total} النهارده · الأسبوع ده ${wk.minutes} من 150 دقيقة</span>`
        : `<span class="item-today">الأسبوع ده: ${wk.minutes} من 150 دقيقة</span>`;
    } else if (on && it.affairs) {
      const open = afOpen();
      const late = open.filter(afOverdue).length;
      const todayDue = open.filter(a => a.due === todayStr()).length;
      todayLine = `<span class="item-today ${late || todayDue ? "pending" : ""}">${open.length ? `📋 ${open.length} شأن مفتوح` : "مفيش شؤون مفتوحة"}${todayDue ? ` · 📍 ${todayDue} موعده النهارده` : ""}${late ? ` · ⚠ ${late} عدّى موعده` : ""}</span>`;
    } else if (on && it.smallFamily) {
      const parts = [];
      if (SMALL_FAMILY.subOn("home")) {
        const o = HOME_TASKS.open(), late = o.filter(HOME_TASKS.overdue).length;
        parts.push(`🏡 ${o.length} حاجة للمنزل${late ? ` (⚠ ${late} متأخرة)` : ""}`);
      }
      if (SMALL_FAMILY.subOn("wifeKids")) {
        const o = WIFE_KIDS.open(), late = o.filter(WIFE_KIDS.overdue).length;
        parts.push(`👨‍👩‍👧 ${o.length} شأن للزوجة والأولاد${late ? ` (⚠ ${late} متأخر)` : ""}`);
      }
      todayLine = `<span class="item-today">${parts.length ? parts.join(" · ") : "فعّل المنزل أو الزوجة والأولاد من جوه"}</span>`;
    } else if (on && it.skills) {
      todayLine = SKILLS.statusLine();
    } else if (on && it.growth) {
      todayLine = GROWTH.statusLine();
    } else if (on && it.goalHub) {
      const parts = [];
      if (GOAL_HUB.subOn("yearly")) { const s = yearStats(); parts.push(s.total ? `📅 ${curYear()}: ${s.done} من ${s.total} هدف` : `📅 اكتب أهداف ${curYear()}`); }
      if (GOAL_HUB.subOn("dream")) { const n = BIG_DREAM.open().length; parts.push(n ? `🌟 ${n} حلم شغال` : "🌟 اكتب حلمك الكبير"); }
      todayLine = `<span class="item-today">${parts.length ? parts.join(" · ") : "فعّل الخطط السنوية أو الحلم الكبير من جوه"}</span>`;
    } else if (on && it.workTasks) {
      todayLine = WORK_TASKS.statusLine();
    } else if (on && it.business) {
      todayLine = BUSINESS.statusLine();
    } else if (on && it.projectsHub) {
      const parts = [];
      if (PROJECTS_HUB.subOn("budgets")) {
        const b = budgetNow();
        parts.push(b.alloc != null ? `💵 صرفت ${num(b.spent)} من ${num(b.alloc)}${b.spent > b.alloc ? " ⚠" : ""}` : `💵 صرفت ${num(b.spent)} جنيه`);
      }
      if (PROJECTS_HUB.subOn("projects")) {
        const o = FAMILY_PROJECTS.open(), late = o.filter(FAMILY_PROJECTS.overdue).length;
        parts.push(`🏗️ ${o.length} مشروع شغال${late ? ` (⚠ ${late} متأخر)` : ""}`);
      }
      todayLine = `<span class="item-today">${parts.length ? parts.join(" · ") : "فعّل الميزانيات أو المشاريع من جوه"}</span>`;
    } else if (on && it.challenges) {
      const a = chActive().length, w = chWon().length;
      todayLine = `<span class="item-today">${a ? `💪 ${a} تحدي مفتوح` : "مفيش تحديات مفتوحة"}${w ? ` · 🏆 ${w} اتغلبت عليه` : ""}</span>`;
    } else if (on && it.diet) {
      const subs = DIET_SUBS.filter(s => dietSubOn(s.id)).map(s => s.name);
      const parts = [];
      if (dietSubOn("forbidden")) { const c = bansToday(); if (c.total) parts.push(`${c.done} من ${c.total} ممنوع`); }
      if (dietSubOn("meals")) {
        const c = mealsToday();
        if (c.free) parts.push("🎉 يوم حر");
        else if (c.noPlan) parts.push("⚠️ ادخل خطة الأكل");
        else if (c.total) parts.push(`${c.done} من ${c.total} وجبة`);
      }
      todayLine = parts.length
        ? `<span class="item-today pending">● النهارده: ${parts.join(" · ")}</span>`
        : `<span class="item-today">${subs.length ? `مفعّل: ${subs.join(" و")}` : "فعّل الممنوعات أو الوجبات الصحية من جوه"}</span>`;
    }
    return `
    <div class="item ${on ? "on" : ""}" data-item="${it.id}">
      <span class="item-icon">${it.icon}</span>
      <span class="item-body">
        <span class="item-name">${it.name}</span>
        <span class="item-desc">${it.desc}</span>
        <span class="item-status">${on ? "✓ معاك في المرحلة دي" : "مش في المرحلة دي"}</span>
        ${todayLine}
      </span>
      <label class="switch" aria-label="${it.name}">
        <input type="checkbox" data-item="${it.id}" ${on ? "checked" : ""} />
        <span class="slider"></span>
      </label>
      <span class="item-go">‹</span>
    </div>`;
  }).join("");
}

// الدخول على الاختيار المفعّل
$("itemsList").addEventListener("click", e => {
  if (e.target.closest(".switch")) return;
  const row = e.target.closest(".item");
  if (!row) return;
  const it = currentAspect.items.find(i => i.id === row.dataset.item);
  if (!isOn(currentAspect.id, it.id)) { toast(`فعّل "${it.name}" الأول عشان تدخل عليها`); return; }
  if (!hasPage(it)) { toast(`صفحة ${it.name} هنجهزها لما تشرحهالي`); return; }
  location.hash = `#/aspect/${currentAspect.id}/${it.id}`;
});

function updateAspectCount() {
  const a = currentAspect;
  $("ahCount").textContent = `مفعّل ${countOn(a)} من ${a.items.length}`;
}

$("itemsList").addEventListener("change", e => {
  const input = e.target;
  if (!input.matches("input[type=checkbox]")) return;
  const itemId = input.dataset.item;
  const on = input.checked;
  const item = currentAspect.items.find(i => i.id === itemId);
  setOn(currentAspect.id, itemId, on);

  renderAspectPage(currentAspect);
  renderAspects();
  toast(on ? `تم تفعيل "${item.name}" — دوس عليها عشان تدخل` : `تم إيقاف "${item.name}"`);
});


