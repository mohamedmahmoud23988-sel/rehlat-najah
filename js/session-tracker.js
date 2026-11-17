// قالب "متابعة بجلسات": حاجة بتتعلّمها أو بتتابعها بجدول جلسات/حصص (المهارات، التطوير الشخصي، ...)

const WD_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const SKILL_LEVELS = ["مبتدئ تماماً", "مبتدئ", "متوسط", "فوق المتوسط", "متقدم", "محترف"];
const LEARN_METHODS = [
  { id: "offPaid", name: "كورس أوفلاين مدفوع", icon: "🏫", paid: true },
  { id: "onPaid",  name: "كورس أونلاين مدفوع", icon: "💻", paid: true },
  { id: "onFree",  name: "كورس أونلاين مجاني", icon: "🆓" },
  { id: "book",    name: "كتاب", icon: "📖" },
  { id: "other",   name: "أخرى", icon: "✏️" },
];
const learnMethod = id => LEARN_METHODS.find(m => m.id === id) || LEARN_METHODS[0];
const timeText24 = t => { if (!t) return ""; const [h, m] = t.split(":").map(Number); return fmtTime(h * 60 + m); };

function createSessionTracker(cfg) {
  const P = cfg.prefix;
  const $p = id => document.getElementById(P + id);
  const S = cfg.sessionWord;          // "حصة" / "جلسة"
  const SS = cfg.sessionWordPlural;   // "حصص" / "جلسات"
  let items = (() => { try { return JSON.parse(localStorage.getItem(cfg.storageKey)) || []; } catch { return []; } })();
  const save = () => { try { localStorage.setItem(cfg.storageKey, JSON.stringify(items)); } catch {} };
  let editingId = null;
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const typeOf = id => cfg.types.find(t => t.id === id) || cfg.types[0];

  // --- حسابات ---
  const sessionsOf = s => (s.sessions || []).slice().sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  const late = x => !x.doneOn && x.date < todayStr();
  function stageStats() {
    if (!state.endDate) return null;
    const all = items.flatMap(s => s.sessions || []).filter(x => x.date >= state.startDate && x.date < state.endDate);
    const done = all.filter(x => x.doneOn).length;
    const missed = all.filter(late).length;
    return { required: all.length, done, missed, remaining: all.length - done - missed, pct: all.length ? Math.round((done / all.length) * 100) : 0 };
  }
  function today() {
    const t = todayStr();
    const list = items.flatMap(s => s.sessions || []).filter(x => x.date === t);
    return { total: list.length, done: list.filter(x => x.doneOn).length };
  }
  const sessionsOn = d => items.flatMap(s => (s.sessions || []).filter(x => x.date === d).map(x => ({ ...x, parent: s })));
  function summary() {
    const s = stageStats(), c = today();
    return { done: s?.done ?? 0, required: s?.required ?? 0, late: s?.missed ?? 0,
             todayDone: c.done, todayTotal: c.total, streak: 0, lateLabel: `${S} فاتت` };
  }
  function statusLine() {
    const c = today();
    const open = items.filter(s => !s.doneOn).length;
    const lateN = items.flatMap(s => s.sessions || []).filter(late).length;
    return `<span class="item-today ${c.total > c.done || lateN ? "pending" : c.total ? "done" : ""}">${open ? `${cfg.icon} ${open} ${cfg.openWord}` : `مفيش ${cfg.emptyWord}`}${c.total ? ` · 📍 ${c.done} من ${c.total} ${S} النهارده` : ""}${lateN ? ` · ⚠ ${lateN} ${S} فاتت` : ""}</span>`;
  }

  // --- بناء الصفحة ---
  $(cfg.pageId).innerHTML = `
    <section class="card aspect-hero">
      <button class="back-btn" id="${P}Back">→ رجوع</button>
      <div class="ah-icon">${cfg.icon}</div>
      <h2 class="ah-name">${cfg.title}</h2>
      <p class="ah-stage" id="${P}Stage"></p>
      <p class="hint center" style="margin:6px 0 0">${cfg.subtitle}</p>
    </section>

    <section class="card ip-card" id="${P}Summary"></section>

    <section class="card ip-card" id="${P}FormCard">
      <h3 class="ip-title" id="${P}FormTitle"></h3>
      <form id="${P}Form" novalidate>
        <div class="form-grid">
          <div class="f">
            <label for="${P}Type">${cfg.typeLabel} *</label>
            <select id="${P}Type"></select>
          </div>
          <div class="f" id="${P}NameSelWrap">
            <label for="${P}NameSel">${cfg.nameLabel} *</label>
            <select id="${P}NameSel"></select>
          </div>
          <div class="f" id="${P}NameTxtWrap">
            <label for="${P}NameTxt" id="${P}NameTxtLbl">${cfg.nameLabel} *</label>
            <input id="${P}NameTxt" type="text" />
          </div>
          ${cfg.authorField ? `
          <div class="f">
            <label for="${P}Author" id="${P}AuthorLbl"></label>
            <input id="${P}Author" type="text" />
          </div>` : ""}
          ${cfg.levels ? `
          <div class="f">
            <label for="${P}Level">المستوى الحالي</label>
            <select id="${P}Level">${SKILL_LEVELS.map(l => `<option>${l}</option>`).join("")}</select>
          </div>` : ""}
          <div class="f">
            <label for="${P}Goal">${cfg.goalLabel}</label>
            <input id="${P}Goal" type="text" placeholder="${cfg.goalPlaceholder}" />
          </div>
          <div class="f">
            <label for="${P}Start">تاريخ البداية *</label>
            <input id="${P}Start" type="date" />
          </div>
          ${cfg.methods ? `
          <div class="f">
            <label for="${P}Method">طريقة التعلّم</label>
            <select id="${P}Method">${LEARN_METHODS.map(m => `<option value="${m.id}">${m.icon} ${m.name}</option>`).join("")}</select>
          </div>
          <div class="f" id="${P}MethodOtherWrap" hidden>
            <label for="${P}MethodOther">اكتب طريقة التعلّم</label>
            <input id="${P}MethodOther" type="text" placeholder="مثلاً: مدرّس خصوصي / يوتيوب" />
          </div>
          <div class="f" id="${P}CostWrap" hidden>
            <label for="${P}Cost">تكلفة الكورس (جنيه)</label>
            <input id="${P}Cost" type="number" min="0" step="50" placeholder="مثلاً: 3000" />
          </div>` : ""}
        </div>

        <div class="sk-box">
          <h4 class="sk-h4">🗓️ ال${SS}</h4>
          <div class="form-grid">
            <div class="f">
              <label for="${P}PerCount">عدد ال${SS}</label>
              <div class="sk-inline">
                <input id="${P}PerCount" type="number" min="1" max="31" value="${cfg.defaultPerCount || 2}" />
                <select id="${P}PerUnit">
                  <option value="week">في الأسبوع</option>
                  <option value="month">في الشهر</option>
                </select>
              </div>
            </div>
            <div class="f">
              <label for="${P}Duration">مدة ال${S} (بالدقايق)</label>
              <input id="${P}Duration" type="number" min="5" max="600" step="5" value="${cfg.defaultDuration || 60}" />
              <div class="ex-chips" id="${P}DurChips">${[15, 30, 45, 60, 90].map(m => `<button type="button" data-min="${m}">${m}</button>`).join("")}</div>
            </div>
            <div class="f">
              <label for="${P}Time">ميعاد ال${S}</label>
              <input id="${P}Time" type="time" value="${cfg.defaultTime || "19:00"}" />
            </div>
            <div class="f">
              <label for="${P}Periods">لمدة</label>
              <div class="sk-inline">
                <input id="${P}Periods" type="number" min="1" max="52" value="4" />
                <span id="${P}PeriodsLbl">أسابيع</span>
              </div>
            </div>
            <div class="f full" id="${P}DaysWrap">
              <label>أيام ال${SS}</label>
              <div class="sk-days" id="${P}Days">${[6, 0, 1, 2, 3, 4, 5].map(d =>
                `<label class="sk-day"><input type="checkbox" value="${d}" /><span>${WD_NAMES[d]}</span></label>`).join("")}</div>
            </div>
          </div>
          <button type="button" class="btn btn-outline btn-sm sk-gen" id="${P}Gen">⚙️ ولّد جدول ال${SS} تلقائياً</button>
          <div class="sk-sess-head"><span>📋 جدول ال${SS} <small id="${P}SessCount"></small></span><button type="button" class="btn btn-outline btn-sm" id="${P}AddSess">➕ ${S}</button></div>
          <div id="${P}Sessions" class="sk-sessions"></div>
        </div>

        <div class="f full" style="margin-top:12px">
          <label for="${P}Notes">ملاحظات</label>
          <textarea id="${P}Notes" rows="2" placeholder="${cfg.notesPlaceholder}"></textarea>
        </div>
        <p id="${P}Error" class="error"></p>
        <div class="form-actions">
          <button type="button" class="btn btn-outline" id="${P}CancelEdit" hidden>إلغاء التعديل</button>
          <button type="button" class="btn btn-outline" id="${P}Clear">مسح</button>
          <button type="submit" class="btn btn-primary" id="${P}Submit"></button>
        </div>
      </form>
    </section>

    <section class="card ip-card">
      <h3 class="ip-title">${cfg.listTitle}</h3>
      <div id="${P}List"></div>
    </section>`;

  // --- العرض ---
  function render() {
    const aspect = ASPECTS.find(a => a.id === cfg.aspectId);
    currentAspect = aspect;
    const page = $(cfg.pageId);
    page.style.setProperty("--c", aspect.color);
    page.style.setProperty("--cl", aspect.light);
    document.title = `${cfg.title} — رحلة نجاح`;
    $p("Stage").innerHTML = `${aspect.name} · المرحلة ${ORDINALS[state.stageIndex]}: <strong>${STAGES[state.stageIndex].name}</strong>`;

    const open = items.filter(s => !s.doneOn);
    const minutes = items.flatMap(s => (s.sessions || []).filter(x => x.doneOn).map(() => s.duration || 0)).reduce((n, m) => n + m, 0);
    const st = stageStats();
    $p("Summary").innerHTML = `
      <div class="ch-summary">
        <div class="ip-stat"><b>${open.length}</b><small>${cfg.openWord}</small></div>
        <div class="ip-stat done"><b>${Math.round((minutes / 60) * 10) / 10}</b><small>ساعة خلصت ⏱️</small></div>
        <div class="ip-stat"><b>${st ? `${st.done} من ${st.required}` : "—"}</b><small>${S} خلصت في المرحلة</small></div>
      </div>`;
    renderList();
  }

  function card(s) {
    const t = todayStr();
    const ty = typeOf(s.type);
    const sess = sessionsOf(s);
    const doneN = sess.filter(x => x.doneOn).length;
    const pct = sess.length ? Math.round((doneN / sess.length) * 100) : 0;
    const next = sess.find(x => !x.doneOn && x.date >= t);
    const lateN = sess.filter(late).length;
    const isDone = !!s.doneOn;
    const rows = sess.map((x, i) => {
      const status = x.doneOn ? "done" : x.date < t ? "late" : x.date === t ? "today" : "upcoming";
      const n = daysBetween(t, x.date);
      const tag = status === "done" ? "✓ خلصت"
        : status === "late" ? `⚠ فاتت من ${-n} يوم`
        : status === "today" ? "📍 النهارده"
        : n === 1 ? "بكرة" : `بعد ${n} يوم`;
      return `
        <label class="st-item ${status}" title="${status === "upcoming" ? "تقدر تعلّم لما ييجي ميعادها" : ""}">
          <input type="checkbox" data-sess="${s.id}|${x.id}" ${x.doneOn ? "checked" : ""} ${status === "upcoming" ? "disabled" : ""} />
          <span class="st-n">${i + 1}</span>
          <span class="st-t">${formatDate(x.date)}<small>${x.time ? `الساعة ${timeText24(x.time)}` : ""}${s.duration ? ` · ${s.duration} دقيقة` : ""}</small></span>
          <span class="st-tag">${tag}</span>
        </label>`;
    }).join("");
    const m = cfg.methods ? learnMethod(s.method) : null;
    const meta = [
      ty.name,
      s.author ? `${ty.authorIcon || "👤"} ${escapeHtml(s.author)}` : "",
      m ? `${m.icon} ${escapeHtml(s.method === "other" && s.methodOther ? s.methodOther : m.name)}` : "",
      s.cost ? `💰 ${Number(s.cost).toLocaleString("en-US")} جنيه` : "",
      `من ${formatDate(s.start)}`,
    ].filter(Boolean).join(" · ");

    return `
      <div class="ch-card sk-card ${isDone ? "won" : ""}" ${lateN ? 'style="border-color:#f1b0a8"' : ""}>
        <div class="ch-head">
          <span class="sk-icon">${ty.icon}</span>
          <span class="ch-info">
            <b>${escapeHtml(s.name)} ${isDone ? `<span class="ch-won-badge">🏆 خلصت</span>` : ""}</b>
            <small>${meta}</small>
            <small>${s.perCount} ${s.perCount === 1 ? S : SS} ${s.perUnit === "month" ? "في الشهر" : "في الأسبوع"} · ${s.duration} دقيقة لل${S}</small>
          </span>
          <span class="ap-actions">
            <button class="ap-btn" data-act="edit" data-id="${s.id}" title="تعديل" aria-label="تعديل">✎</button>
            <button class="ap-btn" data-act="delete" data-id="${s.id}" title="حذف" aria-label="حذف">🗑</button>
          </span>
        </div>
        ${cfg.levels || s.goal ? `
        <div class="sk-levels">
          ${cfg.levels ? `<span class="sk-lv">📊 المستوى الحالي:
            <select data-level="${s.id}" aria-label="المستوى الحالي">${SKILL_LEVELS.map(l => `<option ${l === s.level ? "selected" : ""}>${l}</option>`).join("")}</select>
          </span>` : ""}
          ${s.goal ? `<span class="sk-goal">🎯 ${escapeHtml(s.goal)}</span>` : ""}
        </div>` : ""}
        ${cfg.levels && (s.levelLog || []).length > 1 ? `<div class="sk-log">📈 ${s.levelLog.map(l => `${l.level} <small>(${formatShort(l.date)})</small>`).join(" ← ")}</div>` : ""}
        ${!isDone && next ? `<p class="sk-next">⏭️ ال${S} الجاية: <strong>${formatDate(next.date)}${next.time ? ` الساعة ${timeText24(next.time)}` : ""}</strong></p>` : ""}
        <div class="st-list">
          <div class="st-head"><span>📋 جدول ال${SS}</span><span><strong>${doneN} من ${sess.length}</strong> · ${pct}%${lateN ? ` · <span style="color:#c0392b">${lateN} فاتت</span>` : ""}</span></div>
          <div class="ip-progress st-bar"><div style="width:${pct}%"></div></div>
          ${rows || `<p class="hint">مفيش ${SS} في الجدول.</p>`}
        </div>
        ${s.notes ? `<div class="ch-steps"><span class="ch-steps-title">📝 ملاحظات</span>${escapeHtml(s.notes)}</div>` : ""}
      </div>`;
  }

  function renderList() {
    if (!items.length) { $p("List").innerHTML = `<p class="md-empty">${cfg.emptyText}</p>`; return; }
    const nextDate = s => sessionsOf(s).find(x => !x.doneOn)?.date || "9999";
    const open = items.filter(s => !s.doneOn).sort((a, b) => nextDate(a).localeCompare(nextDate(b)));
    const done = items.filter(s => s.doneOn).sort((a, b) => b.doneOn.localeCompare(a.doneOn));
    $p("List").innerHTML =
      (open.length ? `<div class="ap-group">${cfg.openGroup} <span class="n">${open.length}</span></div>${open.map(card).join("")}` : "") +
      (done.length ? `<div class="ap-group">${cfg.doneGroup} <span class="n">${done.length}</span></div>${done.map(card).join("")}` : "");
  }

  // --- الاستمارة ---
  function onTypeChange() {
    const ty = typeOf($p("Type").value);
    const useSelect = !!ty.options;
    $p("NameSelWrap").hidden = !useSelect;
    if (useSelect) $p("NameSel").innerHTML = ty.options.map(n => `<option value="${n}">${n}</option>`).join("");
    $p("NameTxtLbl").textContent = useSelect ? `اكتب ${cfg.nameLabel} *` : `${ty.nameLabel || cfg.nameLabel} *`;
    $p("NameTxt").placeholder = ty.namePlaceholder || "";
    if (cfg.authorField) {
      $p("AuthorLbl").textContent = ty.authorLabel || "المصدر";
      $p("Author").placeholder = ty.authorPlaceholder || "";
    }
    toggleFields();
  }
  function toggleFields() {
    const ty = typeOf($p("Type").value);
    $p("NameTxtWrap").hidden = !!ty.options && $p("NameSel").value !== "أخرى";
    if (cfg.methods) {
      const m = learnMethod($p("Method").value);
      $p("MethodOtherWrap").hidden = m.id !== "other";
      $p("CostWrap").hidden = !m.paid;
    }
  }
  function toggleUnit() {
    const weekly = $p("PerUnit").value === "week";
    $p("DaysWrap").hidden = !weekly;
    $p("PeriodsLbl").textContent = weekly ? "أسابيع" : "شهور";
  }
  function markDurChip() {
    const v = Number($p("Duration").value);
    $p("DurChips").querySelectorAll("button").forEach(b => b.classList.toggle("on", Number(b.dataset.min) === v));
  }
  $p("Type").innerHTML = cfg.types.map(t => `<option value="${t.id}">${t.icon} ${t.name}</option>`).join("");

  function addSessRow(x = {}) {
    const row = document.createElement("div");
    row.className = "st-row";
    if (x.id) row.dataset.id = x.id;
    if (x.doneOn) row.dataset.doneOn = x.doneOn;
    row.innerHTML = `
      <span class="st-n"></span>
      <input type="date" class="sk-sdate" value="${x.date || ""}" aria-label="تاريخ ال${S}" />
      <input type="time" class="sk-stime" value="${x.time || $p("Time").value || ""}" aria-label="ميعاد ال${S}" />
      <button type="button" class="ap-btn st-del" title="حذف" aria-label="حذف ال${S}">✕</button>`;
    $p("Sessions").appendChild(row);
    renumber();
  }
  function renumber() {
    const rows = $p("Sessions").querySelectorAll(".st-row");
    rows.forEach((r, i) => { r.querySelector(".st-n").textContent = i + 1; });
    $p("SessCount").textContent = rows.length ? `(${rows.length} ${rows.length === 1 ? S : SS})` : "";
  }
  function readSessions() {
    return [...$p("Sessions").querySelectorAll(".st-row")].map(r => ({
      id: r.dataset.id || newId(),
      date: r.querySelector(".sk-sdate").value,
      time: r.querySelector(".sk-stime").value,
      doneOn: r.dataset.doneOn || null,
    })).filter(x => x.date).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  }
  // توليد تلقائي: أسبوعي على الأيام المختارة، أو شهري موزّع على الشهر
  function generate() {
    const start = $p("Start").value;
    if (!start) { $p("Error").textContent = "اختار تاريخ البداية الأول عشان نولّد الجدول"; $p("Start").classList.add("invalid"); return; }
    const n = Math.max(1, parseInt($p("PerCount").value, 10) || 1);
    const periods = Math.max(1, parseInt($p("Periods").value, 10) || 1);
    const time = $p("Time").value;
    const dates = [];
    if ($p("PerUnit").value === "week") {
      let days = [...$p("Days").querySelectorAll("input:checked")].map(i => Number(i.value));
      if (!days.length) { $p("Error").textContent = `اختار ${n} ${n === 1 ? "يوم" : "أيام"} لل${SS} في الأسبوع`; return; }
      days = days.slice(0, n);
      for (let w = 0; w < periods; w++) {
        for (const wd of days) {
          let d = addDays(start, w * 7);
          while (weekday(d) !== wd) d = addDays(d, 1);
          dates.push(d);
        }
      }
    } else {
      const gap = Math.max(1, Math.floor(30 / n));
      for (let i = 0; i < n * periods; i++) dates.push(addDays(start, i * gap));
    }
    const uniq = [...new Set(dates)].sort();
    $p("Sessions").innerHTML = "";
    uniq.forEach(d => addSessRow({ date: d, time }));
    $p("Error").textContent = "";
    toast(`اتولّد ${uniq.length} ${uniq.length === 1 ? S : SS} ✓ تقدر تعدّل أي واحدة بإيدك`);
  }

  function resetForm() {
    editingId = null;
    $p("Type").value = cfg.types[0].id;
    onTypeChange();
    $p("NameTxt").value = "";
    if (cfg.authorField) $p("Author").value = "";
    if (cfg.levels) $p("Level").value = SKILL_LEVELS[1];
    $p("Goal").value = "";
    $p("Start").value = todayStr();
    if (cfg.methods) { $p("Method").value = "onPaid"; $p("MethodOther").value = ""; $p("Cost").value = ""; }
    $p("PerCount").value = cfg.defaultPerCount || 2;
    $p("PerUnit").value = "week";
    $p("Duration").value = cfg.defaultDuration || 60;
    $p("Time").value = cfg.defaultTime || "19:00";
    $p("Periods").value = 4;
    $p("Days").querySelectorAll("input").forEach(i => { i.checked = false; });
    $p("Sessions").innerHTML = "";
    renumber();
    $p("Notes").value = "";
    $p("Error").textContent = "";
    $p("FormTitle").textContent = `➕ ${cfg.formTitle}`;
    $p("Submit").textContent = `➕ ${cfg.submitLabel}`;
    $p("CancelEdit").hidden = true;
    $p("FormCard").classList.remove("editing");
    $(cfg.pageId).querySelectorAll("form .invalid").forEach(el => el.classList.remove("invalid"));
    toggleFields();
    toggleUnit();
    markDurChip();
  }
  resetForm();

  $p("Type").addEventListener("change", onTypeChange);
  $p("NameSel").addEventListener("change", toggleFields);
  if (cfg.methods) $p("Method").addEventListener("change", toggleFields);
  $p("PerUnit").addEventListener("change", toggleUnit);
  $p("Duration").addEventListener("input", markDurChip);
  $p("DurChips").addEventListener("click", e => { if (e.target.dataset.min) { $p("Duration").value = e.target.dataset.min; markDurChip(); } });
  $p("Gen").addEventListener("click", generate);
  $p("AddSess").addEventListener("click", () => {
    const last = readSessions().slice(-1)[0];
    addSessRow({ date: last ? addDays(last.date, 7) : $p("Start").value });
  });
  $p("Sessions").addEventListener("click", e => {
    if (!e.target.closest(".st-del")) return;
    e.target.closest(".st-row").remove();
    renumber();
  });
  $p("Clear").addEventListener("click", resetForm);
  $p("CancelEdit").addEventListener("click", resetForm);
  $p("Form").addEventListener("input", e => e.target.classList.remove("invalid"));

  $p("Form").addEventListener("submit", e => {
    e.preventDefault();
    const ty = typeOf($p("Type").value);
    const name = ty.options && $p("NameSel").value !== "أخرى" ? $p("NameSel").value : $p("NameTxt").value.trim();
    const start = $p("Start").value;
    const sessions = readSessions();
    let err = "";
    if (!name) { $p("NameTxt").classList.add("invalid"); err = `اكتب ${ty.nameLabel || cfg.nameLabel}`; }
    else if (!start) { $p("Start").classList.add("invalid"); err = "اختار تاريخ البداية"; }
    else if (!sessions.length) err = `ضيف ${S} واحدة على الأقل — أو دوس "ولّد جدول ال${SS} تلقائياً"`;
    if (err) { $p("Error").textContent = err; return; }

    const data = {
      type: ty.id, name,
      author: cfg.authorField ? $p("Author").value.trim() : "",
      goal: $p("Goal").value.trim(), start,
      perCount: Math.max(1, parseInt($p("PerCount").value, 10) || 1),
      perUnit: $p("PerUnit").value,
      duration: Math.max(5, parseInt($p("Duration").value, 10) || 60),
      sessions,
      notes: $p("Notes").value.trim(),
    };
    if (cfg.methods) {
      const m = learnMethod($p("Method").value);
      Object.assign(data, { method: m.id, methodOther: m.id === "other" ? $p("MethodOther").value.trim() : "",
                            cost: m.paid && $p("Cost").value ? Number($p("Cost").value) : null });
    }
    const level = cfg.levels ? $p("Level").value : null;
    if (editingId) {
      const s = items.find(x => x.id === editingId);
      if (cfg.levels && s.level !== level) (s.levelLog ??= []).push({ date: todayStr(), level });
      Object.assign(s, data, cfg.levels ? { level } : {});
      s.doneOn = s.sessions.every(x => x.doneOn) ? (s.doneOn || todayStr()) : null;
      toast("تم حفظ التعديل ✓");
    } else {
      items.push({ id: newId(), ...data, ...(cfg.levels ? { level, levelLog: [{ date: todayStr(), level }] } : {}), doneOn: null, createdOn: todayStr() });
      toast(`تمت إضافة "${name}" بـ ${sessions.length} ${sessions.length === 1 ? S : SS} ${cfg.icon} بالتوفيق!`);
    }
    save();
    resetForm();
    render();
  });

  // --- الأحداث في القايمة ---
  const page = $(cfg.pageId);
  page.addEventListener("change", e => {
    if (e.target.dataset.sess) {
      const [sid, xid] = e.target.dataset.sess.split("|");
      const s = items.find(x => x.id === sid);
      const x = s?.sessions.find(y => y.id === xid);
      if (!x || x.date > todayStr()) { render(); return; }
      x.doneOn = e.target.checked ? todayStr() : null;
      const was = !!s.doneOn;
      const all = s.sessions.every(y => y.doneOn);
      s.doneOn = all ? (s.doneOn || todayStr()) : null;
      save();
      render();
      if (all && !was) celebrate("🏆", cfg.allDoneMessage(s));
      else if (e.target.checked) toast(cfg.sessionMessages[Math.floor(Math.random() * cfg.sessionMessages.length)]);
      return;
    }
    if (e.target.dataset.level) {
      const s = items.find(x => x.id === e.target.dataset.level);
      s.level = e.target.value;
      (s.levelLog ??= []).push({ date: todayStr(), level: s.level });
      save();
      render();
      toast(`📈 مستواك في "${s.name}" بقى: ${s.level}`);
    }
  });

  page.addEventListener("click", e => {
    const btn = e.target.closest("[data-act]");
    if (!btn || !btn.closest(`#${P}List`)) return;
    const s = items.find(x => x.id === btn.dataset.id);
    if (!s) return;
    if (btn.dataset.act === "delete") {
      if (!confirm(`حذف "${s.name}" وكل ${SS}ها نهائياً؟`)) return;
      items = items.filter(x => x.id !== s.id);
      save();
      render();
      return;
    }
    // تعديل
    resetForm();
    editingId = s.id;
    const ty = typeOf(s.type);
    $p("Type").value = ty.id;
    onTypeChange();
    if (ty.options && ty.options.includes(s.name)) $p("NameSel").value = s.name;
    else { if (ty.options) $p("NameSel").value = "أخرى"; $p("NameTxt").value = s.name; }
    if (cfg.authorField) $p("Author").value = s.author || "";
    if (cfg.levels) $p("Level").value = s.level || SKILL_LEVELS[1];
    $p("Goal").value = s.goal || "";
    $p("Start").value = s.start;
    if (cfg.methods) { $p("Method").value = s.method || "onPaid"; $p("MethodOther").value = s.methodOther || ""; $p("Cost").value = s.cost ?? ""; }
    $p("PerCount").value = s.perCount;
    $p("PerUnit").value = s.perUnit;
    $p("Duration").value = s.duration;
    $p("Notes").value = s.notes || "";
    $p("Sessions").innerHTML = "";
    sessionsOf(s).forEach(x => addSessRow(x));
    toggleFields();
    toggleUnit();
    markDurChip();
    $p("FormTitle").textContent = `✎ تعديل ${cfg.editTitle}`;
    $p("Submit").textContent = "💾 حفظ التعديل";
    $p("CancelEdit").hidden = false;
    $p("FormCard").classList.add("editing");
    $p("FormCard").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  $p("Back").addEventListener("click", () => { location.hash = cfg.backHash; });

  // حصص/جلسات يوم معيّن لشاشة "مهامي النهارده"
  function tasksOn(d) {
    return items.flatMap(s => (s.sessions || []).filter(x => x.date === d).map(x => ({
      key: `ss:${P}:${s.id}:${x.id}`,
      icon: typeOf(s.type).icon,
      title: `${S} ${s.name}`,
      meta: `${cfg.title} · ${s.duration} دقيقة${x.time ? ` · الساعة ${timeText24(x.time)}` : ""}`,
      time: x.time ? Number(x.time.slice(0, 2)) * 60 + Number(x.time.slice(3, 5)) : null,
      done: !!x.doneOn,
      toggle: v => {
        x.doneOn = v ? todayStr() : null;
        s.doneOn = s.sessions.every(y => y.doneOn) ? (s.doneOn || todayStr()) : null;
        save();
      },
    })));
  }

  return { render, stageStats, today, sessionsOn, summary, statusLine, tasksOn };
}
