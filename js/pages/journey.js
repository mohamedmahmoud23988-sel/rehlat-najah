// الرحلة: إنشاء/تعديل رحلة بمراحل على مزاج المستخدم + أرشيف المراحل اللي خلصت

// ================== صفحة إنشاء / تعديل الرحلة ==================
$("journeyPage").innerHTML = `
  <section class="card aspect-hero">
    <button class="back-btn" id="jrBack">→ الرئيسية</button>
    <div class="ah-icon">🧭</div>
    <h2 class="ah-name" id="jrTitle"></h2>
    <p class="ah-stage" id="jrSub"></p>
  </section>
  <section class="card ip-card">
    <form id="jrForm" novalidate>
      <div class="f">
        <label for="jrName">اسم الرحلة *</label>
        <input id="jrName" type="text" placeholder="مثلاً: رحلة نجاح 2027 / رحلة التغيير" />
      </div>
      <div id="jrTemplates" class="jr-templates"></div>
      <h3 class="ip-title" style="margin-top:16px">🪜 المراحل</h3>
      <p class="hint">سمّي كل مرحلة وحدد أول يوم وآخر يوم فيها. لما تغيّر نهاية مرحلة، اللي بعدها بتبدأ من اليوم اللي بعده تلقائياً.</p>
      <div class="jr-head"><span>#</span><span>اسم المرحلة</span><span>من</span><span>لحد</span><span>المدة</span><span></span></div>
      <div id="jrStages"></div>
      <button type="button" class="btn btn-outline btn-sm" id="jrAdd" style="flex:none;margin-top:8px">➕ مرحلة جديدة</button>
      <div class="jr-total" id="jrTotal"></div>
      <p class="error" id="jrError"></p>
      <div class="form-actions">
        <button type="button" class="btn btn-outline" id="jrCancel">إلغاء</button>
        <button type="submit" class="btn btn-primary" id="jrSave">💾 حفظ الرحلة</button>
      </div>
    </form>
  </section>`;

let jrIsNew = false;
const JR_TEMPLATES = [
  { name: "3 مراحل × 30 يوم", stages: [["بداية النجاح", 30], ["الصبر والعزيمة", 30], ["النجاح", 30]] },
  { name: "4 مراحل × 3 شهور (سنة)", stages: [["الربع الأول", 90], ["الربع التاني", 91], ["الربع التالت", 92], ["الربع الرابع", 92]] },
  { name: "مرحلة واحدة × 100 يوم", stages: [["تحدي الـ 100 يوم", 100]] },
  { name: "رمضان (30 يوم)", stages: [["رمضان", 30]] },
];

function jrRow(s, i, locked) {
  const days = s.start && s.end && s.end >= s.start ? daysBetween(s.start, s.end) + 1 : "";
  return `
    <div class="jr-row ${locked ? "locked" : ""}" data-id="${s.id || ""}">
      <span class="jr-n">${i + 1}</span>
      <input type="text" class="jr-sname" value="${escapeHtml(s.name || "")}" placeholder="اسم المرحلة" ${locked ? "disabled" : ""} />
      <input type="date" class="jr-start" value="${s.start || ""}" ${locked ? "disabled" : ""} aria-label="أول يوم" />
      <input type="date" class="jr-end" value="${s.end || ""}" ${locked ? "disabled" : ""} aria-label="آخر يوم" />
      <span class="jr-days">${days ? `${days} يوم` : "—"}</span>
      ${locked ? `<span class="jr-lock" title="المرحلة دي في الأرشيف">📦</span>` : `<button type="button" class="ap-btn jr-del" title="حذف المرحلة" aria-label="حذف المرحلة">✕</button>`}
    </div>`;
}

function jrRead() {
  return [...$("jrStages").querySelectorAll(".jr-row")].map(r => ({
    id: r.dataset.id || "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    name: r.querySelector(".jr-sname").value.trim(),
    start: r.querySelector(".jr-start").value,
    end: r.querySelector(".jr-end").value,
    locked: r.classList.contains("locked"),
  }));
}

function jrRefresh() {
  const rows = [...$("jrStages").querySelectorAll(".jr-row")];
  rows.forEach((r, i) => {
    r.querySelector(".jr-n").textContent = i + 1;
    const s = r.querySelector(".jr-start").value, e = r.querySelector(".jr-end").value;
    r.querySelector(".jr-days").textContent = s && e && e >= s ? `${daysBetween(s, e) + 1} يوم` : "—";
  });
  const st = jrRead().filter(s => s.start && s.end);
  if (!st.length) { $("jrTotal").innerHTML = ""; return; }
  const from = st[0].start, to = st[st.length - 1].end;
  $("jrTotal").innerHTML = `
    <div class="jr-sum"><b>${rows.length}</b><small>مرحلة</small></div>
    <div class="jr-sum"><b>${to >= from ? daysBetween(from, to) + 1 : "—"}</b><small>يوم مدة الرحلة كلها</small></div>
    <div class="jr-sum"><b>${formatShort(from)}</b><small>البداية</small></div>
    <div class="jr-sum"><b>${formatShort(to)}</b><small>النهاية</small></div>`;
}

function jrFill(stages) {
  $("jrStages").innerHTML = stages.map((s, i) => jrRow(s, i, false)).join("");
  jrRefresh();
}

function jrFromTemplate(t) {
  let start = todayStr();
  return t.stages.map(([name, days], i) => {
    const s = { id: "s" + i + Date.now().toString(36), name, start, end: addDays(start, days - 1) };
    start = addDays(s.end, 1);
    return s;
  });
}

function renderJourneyPage(isNew) {
  jrIsNew = isNew || !journey;
  document.title = "الرحلة — رحلة نجاح";
  $("journeyPage").style.setProperty("--c", "#0f5c4d");
  $("journeyPage").style.setProperty("--cl", "#e3f1ed");
  $("jrTitle").textContent = jrIsNew ? "رحلة جديدة" : "تعديل الرحلة";
  $("jrSub").textContent = jrIsNew
    ? (journey && journey.status === "active" ? `⚠ لما تحفظ، رحلة "${journey.name}" هتتنقل للأرشيف بكل تفاصيلها (وتقدر ترجعلها منه)` : "سمّي رحلتك وقسّمها لمراحل على مزاجك")
    : "عدّل الاسم أو المراحل أو تواريخها";
  $("jrError").textContent = "";
  $("jrTemplates").innerHTML = jrIsNew
    ? `<span class="hint" style="margin:0">قوالب جاهزة:</span>${JR_TEMPLATES.map((t, i) => `<button type="button" data-tpl="${i}">${t.name}</button>`).join("")}`
    : "";
  if (jrIsNew) {
    $("jrName").value = "";
    jrFill(jrFromTemplate(JR_TEMPLATES[0]));
  } else {
    $("jrName").value = journey.name;
    jrFill(journey.stages);
  }
}

$("jrTemplates").addEventListener("click", e => {
  const i = e.target.dataset.tpl;
  if (i == null) return;
  jrFill(jrFromTemplate(JR_TEMPLATES[i]));
  if (!$("jrName").value.trim()) $("jrName").value = JR_TEMPLATES[i].name.includes("رمضان") ? "رحلة رمضان" : "رحلة نجاح";
});
$("jrStages").addEventListener("input", e => {
  // نهاية مرحلة اتغيرت ← اللي بعدها تبدأ من اليوم اللي بعده
  if (e.target.classList.contains("jr-end") && e.target.value) {
    const row = e.target.closest(".jr-row"), next = row.nextElementSibling;
    if (next && !next.classList.contains("locked")) {
      const ns = next.querySelector(".jr-start"), ne = next.querySelector(".jr-end");
      const dur = ns.value && ne.value ? daysBetween(ns.value, ne.value) : 29;
      ns.value = addDays(e.target.value, 1);
      if (!ne.value || ne.value < ns.value) ne.value = addDays(ns.value, Math.max(dur, 0));
    }
  }
  jrRefresh();
});
$("jrStages").addEventListener("click", e => {
  if (!e.target.closest(".jr-del")) return;
  if ($("jrStages").children.length <= 1) { toast("الرحلة لازم يكون فيها مرحلة واحدة على الأقل"); return; }
  e.target.closest(".jr-row").remove();
  jrRefresh();
});
$("jrAdd").addEventListener("click", () => {
  const rows = jrRead();
  const last = rows[rows.length - 1];
  const start = last?.end ? addDays(last.end, 1) : todayStr();
  $("jrStages").insertAdjacentHTML("beforeend", jrRow({ name: `المرحلة ${rows.length + 1}`, start, end: addDays(start, 29) }, rows.length, false));
  jrRefresh();
  $("jrStages").lastElementChild.querySelector(".jr-sname").select();
});

$("jrForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = $("jrName").value.trim();
  const rows = jrRead();
  let err = "";
  if (!name) err = "اكتب اسم الرحلة";
  else if (!rows.length) err = "ضيف مرحلة واحدة على الأقل";
  else {
    for (let i = 0; i < rows.length; i++) {
      const s = rows[i];
      if (!s.name) { err = `اكتب اسم المرحلة ${i + 1}`; break; }
      if (!s.start || !s.end) { err = `حدد أول وآخر يوم في مرحلة "${s.name}"`; break; }
      if (s.end < s.start) { err = `آخر يوم في "${s.name}" لازم يكون بعد أول يوم`; break; }
      if (i > 0 && s.start <= rows[i - 1].end) { err = `"${s.name}" لازم تبدأ بعد ما "${rows[i - 1].name}" تخلص`; break; }
    }
  }
  if (err) { $("jrError").textContent = err; return; }

  if (jrIsNew) {
    // الرحلة الحالية بتروح الأرشيف بكل تفاصيلها
    let fromKey = null;
    if (journey && journey.status === "active") {
      if (!confirm(`رحلة "${journey.name}" هتتنقل للأرشيف بإنجازها الحالي، وتقدر ترجعلها منه في أي وقت.\nنكمّل؟`)) return;
      fromKey = state.stageKey;
      archiveJourney("replaced");
    }
    journey = {
      id: "j" + Date.now().toString(36), name, current: 0, status: "active", createdOn: todayStr(),
      stages: rows.map(({ locked, ...s }) => s),
    };
    // الاختيارات المفعّلة بتتنقل معاك للرحلة الجديدة
    if (fromKey) carryToggles(fromKey, `${journey.id}:0`);
    toast(`🧭 بدأت "${name}" — ${rows.length} مراحل، بالتوفيق!`);
  } else {
    journey.name = name;
    journey.stages = rows.map(({ locked, ...s }) => s);
    if (journey.current >= journey.stages.length) journey.current = journey.stages.length - 1;
    toast("تم حفظ الرحلة ✓");
  }
  saveJourney();
  syncState();
  location.hash = "#/";
});
$("jrCancel").addEventListener("click", () => { location.hash = "#/"; });
$("jrBack").addEventListener("click", () => { location.hash = "#/"; });

// ================== أرشيف الرحلات ==================
// بيعرض الرحلة الحالية + كل الرحلات اللي اتنقلت للأرشيف، ومن هنا تقدر ترجع لأي رحلة أو تبدأها من جديد
$("archivePage").innerHTML = `
  <section class="card aspect-hero">
    <button class="back-btn" id="arBack">→ الرئيسية</button>
    <div class="ah-icon">🗂️</div>
    <h2 class="ah-name">أرشيف الرحلات</h2>
    <p class="ah-stage">كل رحلاتك: الحالية واللي خلصت — بنسبة إنجازها، ووقفت إمتى، وتفاصيل كل مرحلة</p>
  </section>
  <div id="arList"></div>`;

const AR_REASONS = {
  completed: { t: "✓ خلصت مدتها", c: "ok" },
  ended: { t: "اتنهت قبل ميعادها", c: "warn" },
  restarted: { t: "اتعادت من الأول", c: "warn" },
  replaced: { t: "اتقفلت لبداية رحلة تانية", c: "warn" },
};

function renderArchivePage() {
  document.title = "أرشيف الرحلات — رحلة نجاح";
  $("archivePage").style.setProperty("--c", "#0f5c4d");
  $("archivePage").style.setProperty("--cl", "#e3f1ed");
  let html = "";

  // الرحلة الحالية (محسوبة لحد النهارده)
  if (journey && journey.status === "active") {
    const jd = journeyDays();
    const js = journeyStats(journey);
    html += `<h3 class="ar-sec">🟢 الرحلة الحالية</h3>` + arJourneyCard({
      live: true, name: journey.name, start: jd?.start, end: todayStr() < (jd?.end || "") ? todayStr() : jd?.end, plannedEnd: jd?.end,
      days: jd ? Math.max(jd.passed, 0) : 0, plannedDays: jd?.total || 0, stagesCount: journey.stages.length, reachedStage: journey.current,
      pct: js.pct, done: js.done, required: js.required, late: js.late, stages: js.stages,
    });
  }

  if (archive.length) {
    const avg = Math.round(archive.reduce((n, a) => n + a.pct, 0) / archive.length);
    html += `<h3 class="ar-sec">🗂️ رحلات في الأرشيف <small>${archive.length} ${archive.length === 1 ? "رحلة" : "رحلات"} · متوسط الإنجاز ${avg}%</small></h3>`;
    html += archive.map(a => arJourneyCard(a)).join("");
  } else {
    html += `
      <section class="card ip-card">
        <p class="md-empty" style="padding-bottom:4px">🗂️ لسه مفيش رحلات في الأرشيف</p>
        <p class="hint center">أي رحلة بتنهيها، أو بتعيدها من الأول، أو بتبدأ رحلة جديدة مكانها — بتتنقل هنا بكل تفاصيلها، وتقدر ترجعلها في أي وقت.</p>
      </section>`;
  }
  $("arList").innerHTML = html;
}

function arJourneyCard(a) {
  const r = AR_REASONS[a.reason];
  const complete = a.pct >= 90;
  const startedStages = a.stages.filter(s => !s.notStarted);
  return `
    <section class="card ip-card ar-card ${a.live ? "ar-live" : ""}">
      <div class="ar-head">
        ${ringSVG(a.pct, "إنجاز")}
        <div class="ar-info">
          <h4>🧭 ${escapeHtml(a.name)} <small>${a.stagesCount} ${a.stagesCount === 1 ? "مرحلة" : "مراحل"}</small></h4>
          <p>${a.start ? `${formatDate(a.start)} ← ${formatDate(a.end || a.plannedEnd)}` : "من غير تواريخ"} · <strong>${a.days} يوم</strong>${a.plannedDays && a.days !== a.plannedDays ? ` من ${a.plannedDays}` : ""}</p>
          <div class="ar-badges">
            ${a.live ? `<span class="ar-badge ok">🟢 شغالة دلوقتي — المرحلة ${(a.reachedStage || 0) + 1}</span>`
              : `<span class="ar-badge ${complete ? "ok" : "bad"}">${complete ? "✓ مكتملة" : "غير مكتملة"}</span>
                 ${r ? `<span class="ar-badge ${r.c}">${r.t}</span>` : ""}
                 <span class="ar-badge">⏹ وقفت ${formatDate(a.closedOn)} — في المرحلة ${(a.reachedStage || 0) + 1}</span>`}
          </div>
          <div class="ar-tiles">
            <span><b>${a.done}</b> اتعمل</span>
            <span><b>${Math.max(a.required - a.done, 0)}</b> متعملش</span>
            <span><b>${a.late}</b> متأخر / فائت</span>
          </div>
        </div>
      </div>

      <div class="ar-stages">
        ${a.stages.map((s, i) => `
          <div class="ar-stage ${s.notStarted ? "ns" : ""}">
            <span class="ar-sn">${i + 1}</span>
            <span class="ar-st">${escapeHtml(s.name)}<small>${s.start ? `${formatShort(s.start)} – ${formatShort(s.end)} · ${s.days} يوم` : "من غير تواريخ"}</small></span>
            <span class="fd-bal-track"><span style="width:${s.pct}%;background:var(--primary)"></span></span>
            <b>${s.notStarted ? "مبدأتش" : `${s.pct}%`}</b>
          </div>`).join("")}
      </div>

      ${startedStages.some(s => s.aspects.length) ? `
        <details class="ar-details">
          <summary>📋 تفاصيل كل مرحلة وجانب واختيار</summary>
          ${startedStages.map(s => `
            <h5 class="ar-h5">🪜 ${escapeHtml(s.name)} — ${s.pct}% (${s.done} من ${s.required})</h5>
            ${s.aspects.length ? `
              <table class="fd-table">
                <thead><tr><th>الجانب</th><th>الاختيار</th><th>اتعمل</th><th>متعملش</th><th>متأخر</th></tr></thead>
                <tbody>${s.aspects.flatMap(x => x.items.map(it => `
                  <tr><td>${x.icon}</td><td>${it.icon} ${escapeHtml(it.name)}</td><td>${it.done} / ${it.required}</td><td>${Math.max(it.required - it.done, 0)}</td><td class="${it.late ? "fd-late" : ""}">${it.late || "—"}</td></tr>`)).join("")}
                </tbody>
              </table>` : `<p class="hint">مكانش فيه اختيارات مفعّلة في المرحلة دي.</p>`}`).join("")}
        </details>` : ""}

      <div class="jn-actions" style="justify-content:flex-start">
        ${a.live
          ? `<a class="btn btn-outline" href="#/">🏠 روح للرحلة</a>`
          : `<button class="btn btn-primary" data-resume="${a.id}">↩️ ارجع للرحلة دي</button>
             <button class="btn btn-outline" data-restart="${a.id}">🔁 ابدأها من جديد</button>
             <button class="btn btn-outline jn-danger" data-ardel="${a.id}">🗑 حذف</button>`}
      </div>
    </section>`;
}

$("arList").addEventListener("click", e => {
  const b = e.target.closest("button");
  if (!b) return;
  const id = b.dataset.resume || b.dataset.restart || b.dataset.ardel;
  const a = archive.find(x => x.id === id);
  if (!a) return;
  const cur = journey && journey.status === "active" ? `\n\nرحلتك الحالية "${journey.name}" هتتنقل للأرشيف.` : "";
  if (b.dataset.resume) {
    if (!confirm(`الرجوع لرحلة "${a.name}" زي ما كانت؟${cur}`)) return;
    resumeJourney(a.id);
  } else if (b.dataset.restart) {
    if (!confirm(`تبدأ "${a.name}" من جديد النهارده بنفس المراحل ومددها؟${cur}`)) return;
    restartJourney(a.journeyData);
  } else if (b.dataset.ardel) {
    if (!confirm(`حذف رحلة "${a.name}" من الأرشيف نهائياً؟`)) return;
    archive = archive.filter(x => x.id !== a.id);
    saveArchive();
    renderArchivePage();
  }
});
$("arBack").addEventListener("click", () => { location.hash = "#/"; });