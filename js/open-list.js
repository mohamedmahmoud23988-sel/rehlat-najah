// قالب "قايمة مفتوحة": حاجات بتفضل مفتوحة لحد ما تخلص (العائلة الكبرى، المنزل، ...)
// كل شاشة بتتبني من القالب ده بإعداداتها: الأسماء، الاقتراحات، الألوان، والرسايل

function createOpenList(cfg) {
  const P = cfg.prefix;
  const $p = id => document.getElementById(P + id);
  let items = (() => { try { return JSON.parse(localStorage.getItem(cfg.storageKey)) || []; } catch { return []; } })();
  const save = () => { try { localStorage.setItem(cfg.storageKey, JSON.stringify(items)); } catch {} };
  let editingId = null;
  const W = cfg.word; // مثلاً: "شأن" أو "حاجة"
  const WO = cfg.wordOpen || `${W} مفتوح`; // "شأن مفتوح" / "حاجة مفتوحة"

  // --- بناء الصفحة ---
  $(cfg.pageId).innerHTML = `
    <section class="card aspect-hero">
      <button class="back-btn" id="${P}Back">→ رجوع</button>
      <div class="ah-icon">${cfg.icon}</div>
      <h2 class="ah-name">${cfg.title}</h2>
      <p class="ah-stage" id="${P}Stage"></p>
      <p class="hint center" style="margin:6px 0 0" id="${P}Sub">${typeof cfg.subtitle === "function" ? "" : cfg.subtitle}</p>
    </section>
    <section class="card ip-card" id="${P}Summary"></section>
    <section class="card ip-card" id="${P}FormCard">
      <h3 class="ip-title" id="${P}FormTitle"></h3>
      <form id="${P}Form" novalidate>
        <div class="form-grid">
          <div class="f full">
            <label for="${P}Title">${cfg.titleLabel} *</label>
            <input id="${P}Title" type="text" list="${P}TitleList" autocomplete="off" placeholder="${cfg.titlePlaceholder}" />
            <datalist id="${P}TitleList"></datalist>
          </div>
          <div class="f">
            <label for="${P}Second">${cfg.secondLabel}</label>
            <input id="${P}Second" type="text" list="${P}SecondList" autocomplete="off" placeholder="${cfg.secondPlaceholder}" />
            <datalist id="${P}SecondList"></datalist>
          </div>
          ${cfg.nameField ? `
          <div class="f">
            <label for="${P}Name">${cfg.nameField.label}</label>
            <input id="${P}Name" type="text" list="${P}NameList" autocomplete="off" placeholder="${cfg.nameField.placeholder}" />
            <datalist id="${P}NameList"></datalist>
          </div>` : ""}
          ${cfg.steps ? "" : `
          <div class="f">
            <label for="${P}Due">موعد مستهدف</label>
            <input id="${P}Due" type="date" />
          </div>`}
          ${cfg.cost ? `
          <div class="f">
            <label for="${P}Cost">التكلفة المتوقعة (جنيه)</label>
            <input id="${P}Cost" type="number" min="0" step="50" placeholder="مثلاً: 1500" />
          </div>` : ""}
          ${cfg.steps ? `
          <div class="f full">
            <label>🪜 خطوات ال${W} (${cfg.stepYears ? "كل خطوة وسنتها" : "كل خطوة وتاريخها"})</label>
            <div id="${P}Steps" class="st-editor"></div>
            <button type="button" class="btn btn-outline btn-sm st-addbtn" id="${P}AddStep">➕ خطوة جديدة</button>
          </div>` : ""}
          <div class="f full">
            <label for="${P}Purpose">${cfg.purposeLabel}</label>
            <textarea id="${P}Purpose" rows="3" placeholder="${cfg.purposePlaceholder}"></textarea>
          </div>
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

  // --- البيانات والإحصائيات ---
  const open = () => items.filter(a => !a.doneOn);
  const done = () => items.filter(a => a.doneOn);
  // --- الخطوات بتواريخ (للمشاريع) ---
  const stepsOf = a => (a.steps || []).slice().sort((x, y) => (x.date || "9999").localeCompare(y.date || "9999"));
  const stepLate = s => !s.doneOn && s.date && s.date < todayStr();
  const nextStep = a => stepsOf(a).find(s => !s.doneOn);
  // تاريخ "الموعد" اللي بنرتّب ونحسب بيه: موعد الشأن، أو تاريخ الخطوة الجاية في المشروع
  const dueOf = a => cfg.steps ? (nextStep(a)?.date || "") : (a.due || "");

  const overdue = a => !a.doneOn && (cfg.steps ? (a.steps || []).some(stepLate) : (a.due && a.due < todayStr()));
  function stageStats() {
    if (!state.endDate) return null;
    if (cfg.steps) {
      // كل خطوة تاريخها جوه المرحلة بتتحسب مطلوبة
      const st = items.flatMap(a => a.steps || []).filter(s => s.date && s.date >= state.startDate && s.date < state.endDate);
      const d = st.filter(s => s.doneOn).length;
      const missed = st.filter(stepLate).length;
      return { required: st.length, done: d, missed, remaining: st.length - d - missed, pct: st.length ? Math.round((d / st.length) * 100) : 0 };
    }
    const inStage = items.filter(a => a.createdOn < state.endDate && (!a.doneOn || a.doneOn >= state.startDate));
    const d = inStage.filter(a => a.doneOn && a.doneOn < state.endDate).length;
    const missed = inStage.filter(overdue).length;
    return { required: inStage.length, done: d, missed, remaining: inStage.length - d - missed,
             pct: inStage.length ? Math.round((d / inStage.length) * 100) : 0 };
  }
  function today() {
    const t = todayStr();
    if (cfg.stepYears) return { total: 0, done: 0 }; // خطوات بالسنين مش بتظهر كمهام يومية
    if (cfg.steps) {
      const st = items.flatMap(a => a.steps || []).filter(s => s.date === t);
      return { total: st.length, done: st.filter(s => s.doneOn).length };
    }
    const list = items.filter(a => a.due === t);
    return { total: list.length, done: list.filter(a => a.doneOn).length };
  }
  // للشاشة اليومية بعدين: الخطوات اللي تاريخها يوم معيّن
  function stepsOn(d) {
    if (cfg.stepYears) return [];
    return items.flatMap(a => (a.steps || []).filter(s => s.date === d).map(s => ({ ...s, parent: a })));
  }
  const money = n => `${Number(n).toLocaleString("en-US")} جنيه`;

  // --- العرض ---
  function render() {
    const aspect = ASPECTS.find(a => a.id === cfg.aspectId);
    currentAspect = aspect;
    const page = $(cfg.pageId);
    page.style.setProperty("--c", aspect.color);
    page.style.setProperty("--cl", aspect.light);
    document.title = `${cfg.title} — رحلة نجاح`;
    $p("Stage").innerHTML = `${cfg.parentName || aspect.name} · المرحلة ${ORDINALS[state.stageIndex]}: <strong>${STAGES[state.stageIndex].name}</strong>`;
    $p("TitleList").innerHTML = cfg.titleSuggestions.map(s => `<option value="${s}">`).join("");
    const baseSecond = typeof cfg.secondSuggestions === "function" ? cfg.secondSuggestions() : cfg.secondSuggestions;
    const seconds = [...new Set([...items.map(a => a.person).filter(Boolean), ...baseSecond])];
    if (typeof cfg.subtitle === "function") $p("Sub").textContent = cfg.subtitle();
    $p("SecondList").innerHTML = seconds.map(s => `<option value="${escapeHtml(s)}">`).join("");
    if (cfg.nameField) {
      const names = [...new Set(items.map(a => a.name).filter(Boolean))];
      $p("NameList").innerHTML = names.map(s => `<option value="${escapeHtml(s)}">`).join("");
    }

    const s = stageStats();
    const late = open().filter(overdue).length;
    const openCost = cfg.cost ? open().reduce((n, a) => n + (Number(a.cost) || 0), 0) : 0;
    $p("Summary").innerHTML = `
      <div class="ch-summary">
        <div class="ip-stat"><b>${open().length}</b><small>${WO}${late ? ` · <span style="color:#c0392b">${late} ${cfg.steps ? "فيه خطوات متأخرة" : "عدّى موعده"}</span>` : ""}</small></div>
        <div class="ip-stat done"><b>${done().length}</b><small>خلص ✓</small></div>
        ${cfg.stepYears
          ? (() => { const st = items.flatMap(a => a.steps || []); return `<div class="ip-stat"><b>${st.filter(x => x.doneOn).length} من ${st.length}</b><small>خطوة اتحققت</small></div>`; })()
          : `<div class="ip-stat"><b>${s ? `${s.done} من ${s.required}` : "—"}</b><small>${cfg.steps ? "خطوة خلصت في المرحلة" : "خلص في المرحلة"}</small></div>`}
      </div>
      ${openCost ? `<p class="ap-rate">💰 التكلفة المتوقعة للي لسه مفتوح: <strong>${money(openCost)}</strong></p>` : ""}`;
    renderList();
  }

  function dueText(a) {
    if (cfg.steps) {
      if (a.doneOn) return "";
      const ns = nextStep(a);
      if (!ns) return "";
      if (!ns.date) return `الخطوة الجاية: ${escapeHtml(ns.text)}`;
      if (cfg.stepYears) {
        const dy = ns.year - Number(todayStr().slice(0, 4));
        const when = dy < 0 ? `<span style="color:#c0392b;font-weight:700">⚠ متأخرة</span>`
                   : dy === 0 ? `<span style="color:var(--c);font-weight:700">📍 السنة دي (${ns.year})</span>`
                   : `سنة ${ns.year}`;
        return `الخطوة الجاية: ${escapeHtml(ns.text)} — ${when}`;
      }
      const n = daysBetween(todayStr(), ns.date);
      const when = n < 0 ? `<span style="color:#c0392b;font-weight:700">⚠ متأخرة ${-n} يوم</span>`
                 : n === 0 ? `<span style="color:var(--c);font-weight:700">📍 النهارده</span>`
                 : n === 1 ? "بكرة" : `بعد ${n} يوم`;
      return `الخطوة الجاية: ${escapeHtml(ns.text)} — ${when}`;
    }
    if (!a.due) return "";
    const n = daysBetween(todayStr(), a.due);
    if (a.doneOn) return `الموعد كان ${formatShort(a.due)}`;
    if (n < 0) return `<span style="color:#c0392b;font-weight:700">⚠ الموعد عدّى من ${-n} يوم</span>`;
    if (n === 0) return `<span style="color:var(--c);font-weight:700">📍 موعده النهارده</span>`;
    if (n === 1) return "موعده بكرة";
    return `موعده بعد ${n} يوم (${formatShort(a.due)})`;
  }

  function card(a) {
    const isDone = !!a.doneOn;
    const days = daysBetween(a.createdOn, isDone ? a.doneOn : todayStr());
    const updates = (a.updates || []).slice().sort((x, y) => y.date.localeCompare(x.date));
    const who = a.person && a.name ? `${escapeHtml(a.person)} (${escapeHtml(a.name)})` : escapeHtml(a.person || a.name || "");
    const sub = [
      who ? `${cfg.secondIcon} ${who}` : "",
      cfg.cost && a.cost ? `💰 ${money(a.cost)}` : "",
      isDone ? `خلص ${formatDate(a.doneOn)}` : `اتضاف ${formatDate(a.createdOn)}`,
      dueText(a),
    ].filter(Boolean).join(" · ");
    return `
      <div class="ch-card ${isDone ? "won" : ""}" ${overdue(a) ? 'style="border-color:#f1b0a8"' : ""}>
        <div class="ch-head">
          <label class="pr-check" title="${isDone ? `رجّعه ${WO}` : "علّم لما يخلص"}" aria-label="خلص ${escapeHtml(a.title)}">
            <input type="checkbox" data-done="${a.id}" ${isDone ? "checked" : ""} />
            <span class="bc-box">✓</span>
          </label>
          <span class="ch-info">
            <b>${escapeHtml(a.title)}</b>
            <small>${sub}</small>
            ${isDone ? `<span class="ch-won-badge">✓ خلص</span>` : ""}
          </span>
          <span class="ch-days"><b>${days}</b><small>${isDone ? "يوم لحد ما خلص" : "يوم مفتوح"}</small></span>
          <span class="ap-actions">
            <button class="ap-btn" data-act="edit" data-id="${a.id}" title="تعديل" aria-label="تعديل">✎</button>
            <button class="ap-btn" data-act="delete" data-id="${a.id}" title="حذف" aria-label="حذف">🗑</button>
          </span>
        </div>
        ${cfg.steps ? stepsBlock(a) : ""}
        ${a.purpose ? `<div class="ch-steps"><span class="ch-steps-title">${cfg.purposeIcon} ${cfg.purposeLabel}</span>${escapeHtml(a.purpose)}</div>` : ""}
        ${updates.length ? `
          <div class="ch-updates">
            ${updates.map(u => `
              <div class="ch-update">
                <span class="d">${formatShort(u.date)}</span>
                <span class="x">${escapeHtml(u.text)}</span>
                <button class="ap-btn" data-act="delupd" data-id="${a.id}" data-date="${u.date}" data-text="${escapeHtml(u.text)}" title="حذف التحديث" aria-label="حذف التحديث">✕</button>
              </div>`).join("")}
          </div>` : ""}
        ${isDone ? "" : `
          <div class="ch-add">
            <input type="text" id="${P}Upd-${a.id}" placeholder="${cfg.updatePlaceholder}" />
            <button class="btn btn-outline" data-act="addupd" data-id="${a.id}">إضافة</button>
          </div>`}
      </div>`;
  }

  // قايمة خطوات المشروع بتواريخها ومربع ✓ لكل خطوة
  function stepsBlock(a) {
    const st = stepsOf(a);
    if (!st.length) return "";
    const t = todayStr();
    const doneN = st.filter(s => s.doneOn).length;
    const pct = Math.round((doneN / st.length) * 100);
    const curYear = Number(t.slice(0, 4));
    const rows = st.map((s, i) => {
      if (cfg.stepYears) {
        const dy = (s.year || 0) - curYear;
        const status = s.doneOn ? "done" : !s.year ? "nodate" : dy < 0 ? "late" : dy === 0 ? "today" : "upcoming";
        const tag = status === "done" ? `✓ اتحققت ${formatShort(s.doneOn)}`
          : status === "late" ? "⚠ متأخرة"
          : status === "today" ? "📍 السنة دي"
          : status === "upcoming" ? (dy === 1 ? "السنة الجاية" : `بعد ${dy} سنين`)
          : "من غير سنة";
        return `
          <label class="st-item ${status}">
            <input type="checkbox" data-step="${a.id}|${s.id}" ${s.doneOn ? "checked" : ""} />
            <span class="st-n st-year">${s.year || "—"}</span>
            <span class="st-t">${escapeHtml(s.text)}</span>
            <span class="st-tag">${tag}</span>
          </label>`;
      }
      const status = s.doneOn ? "done" : !s.date ? "nodate" : s.date < t ? "late" : s.date === t ? "today" : "upcoming";
      const n = s.date ? daysBetween(t, s.date) : null;
      const tag =
        status === "done" ? `✓ خلصت ${formatShort(s.doneOn)}`
        : status === "late" ? `⚠ متأخرة ${-n} يوم`
        : status === "today" ? "📍 النهارده"
        : status === "upcoming" ? (n === 1 ? "بكرة" : `بعد ${n} يوم`)
        : "من غير تاريخ";
      return `
        <label class="st-item ${status}">
          <input type="checkbox" data-step="${a.id}|${s.id}" ${s.doneOn ? "checked" : ""} />
          <span class="st-n">${i + 1}</span>
          <span class="st-t">${escapeHtml(s.text)}${s.date ? `<small>${formatDate(s.date)}</small>` : ""}</span>
          <span class="st-tag">${tag}</span>
        </label>`;
    }).join("");
    return `
      <div class="st-list">
        <div class="st-head"><span>🪜 الخطوات</span><span><strong>${doneN} من ${st.length}</strong> · ${pct}%</span></div>
        <div class="ip-progress st-bar"><div style="width:${pct}%"></div></div>
        ${rows}
      </div>`;
  }

  function renderList() {
    if (!items.length) { $p("List").innerHTML = `<p class="md-empty">${cfg.emptyText}</p>`; return; }
    const o = open().sort((x, y) => (dueOf(x) || "9999").localeCompare(dueOf(y) || "9999") || x.createdOn.localeCompare(y.createdOn));
    const d = done().sort((x, y) => y.doneOn.localeCompare(x.doneOn));
    $p("List").innerHTML =
      (o.length ? `<div class="ap-group">⏳ ${cfg.openGroup} <span class="n">${o.length}</span></div>${o.map(card).join("")}` : "") +
      (d.length ? `<div class="ap-group">✓ ${cfg.doneGroup} <span class="n">${d.length}</span></div>${d.map(card).join("")}` : "");
  }

  // --- الاستمارة ---
  const fields = ["Title", "Second", "Purpose", ...(cfg.steps ? [] : ["Due"]), ...(cfg.cost ? ["Cost"] : []), ...(cfg.nameField ? ["Name"] : [])];

  // --- محرر الخطوات ---
  function addStepRow(s = {}) {
    const box = $p("Steps");
    const row = document.createElement("div");
    row.className = "st-row";
    if (s.id) row.dataset.id = s.id;
    if (s.doneOn) row.dataset.doneOn = s.doneOn;
    const when = cfg.stepYears
      ? `<input type="number" class="st-date st-yr" min="2000" max="2100" value="${s.year || ""}" placeholder="السنة" aria-label="سنة الخطوة" />`
      : `<input type="date" class="st-date" value="${s.date || ""}" aria-label="تاريخ الخطوة" />`;
    row.innerHTML = `
      <span class="st-n"></span>
      <input type="text" class="st-text" placeholder="${cfg.stepPlaceholder || "الخطوة… (مثلاً: نحدد الميزانية)"}" value="${escapeHtml(s.text || "")}" />
      ${when}
      <button type="button" class="ap-btn st-del" title="حذف الخطوة" aria-label="حذف الخطوة">✕</button>`;
    box.appendChild(row);
    renumberSteps();
    return row;
  }
  function renumberSteps() {
    $p("Steps").querySelectorAll(".st-row .st-n").forEach((el, i) => { el.textContent = i + 1; });
  }
  function readSteps() {
    return [...$p("Steps").querySelectorAll(".st-row")].map(r => {
      const v = r.querySelector(".st-date").value;
      const step = {
        id: r.dataset.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        text: r.querySelector(".st-text").value.trim(),
        date: v,
        doneOn: r.dataset.doneOn || null,
      };
      // خطوة بالسنة: بنخزّن السنة، وتاريخها آخر يوم في السنة (للترتيب والحساب)
      if (cfg.stepYears) { step.year = v ? Number(v) : null; step.date = v ? `${v}-12-31` : ""; }
      return step;
    }).filter(s => s.text);
  }
  function resetSteps(list) {
    $p("Steps").innerHTML = "";
    if (list && list.length) { list.forEach(s => addStepRow(s)); return; }
    // الحلم الكبير: نبدأ بـ 3 سنين ورا بعض من السنة دي
    if (cfg.stepYears) {
      const y = Number(todayStr().slice(0, 4));
      [0, 1, 2].forEach(k => addStepRow({ year: y + k }));
    } else [{}, {}].forEach(s => addStepRow(s));
  }
  if (cfg.steps) {
    $p("AddStep").addEventListener("click", () => {
      let s = {};
      if (cfg.stepYears) {
        const ys = readSteps().map(x => x.year).filter(Boolean);
        s = { year: ys.length ? Math.max(...ys) + 1 : Number(todayStr().slice(0, 4)) };
      }
      addStepRow(s).querySelector(".st-text").focus();
    });
    $p("Steps").addEventListener("click", e => {
      if (!e.target.closest(".st-del")) return;
      e.target.closest(".st-row").remove();
      if (!$p("Steps").children.length) addStepRow();
      renumberSteps();
    });
  }

  // لو اخترت "البنت الكبيرة" وكان ليها اسم متسجّل قبل كده، نكتبه لوحده
  if (cfg.nameField) {
    $p("Second").addEventListener("change", () => {
      if ($p("Name").value.trim()) return;
      const person = $p("Second").value.trim();
      const prev = [...items].reverse().find(a => a.person === person && a.name);
      if (prev) $p("Name").value = prev.name;
    });
  }
  function resetForm() {
    editingId = null;
    fields.forEach(f => { $p(f).value = ""; });
    $p("Error").textContent = "";
    $p("FormTitle").textContent = `➕ ${cfg.formTitle}`;
    $p("Submit").textContent = `➕ ${cfg.submitLabel}`;
    $p("CancelEdit").hidden = true;
    $p("FormCard").classList.remove("editing");
    $p("Title").classList.remove("invalid");
    if (cfg.steps) resetSteps();
  }
  resetForm();
  $p("Clear").addEventListener("click", resetForm);
  $p("CancelEdit").addEventListener("click", resetForm);
  $p("Title").addEventListener("input", e => e.target.classList.remove("invalid"));

  $p("Form").addEventListener("submit", e => {
    e.preventDefault();
    const title = $p("Title").value.trim();
    if (!title) { $p("Title").classList.add("invalid"); $p("Error").textContent = `اكتب ${cfg.titleLabel}`; return; }
    const data = { title, person: $p("Second").value.trim(), purpose: $p("Purpose").value.trim() };
    if (!cfg.steps) data.due = $p("Due").value;
    if (cfg.cost) data.cost = $p("Cost").value ? Number($p("Cost").value) : null;
    if (cfg.nameField) data.name = $p("Name").value.trim();
    if (cfg.steps) {
      data.steps = readSteps();
      if (!data.steps.length) { $p("Error").textContent = `اكتب خطوة واحدة على الأقل للمشروع`; return; }
    }
    if (editingId) {
      const a = items.find(x => x.id === editingId);
      Object.assign(a, data);
      // لو كل الخطوات خلصت يبقى المشروع خلص، ولو اتضافت خطوة جديدة يرجع مفتوح
      if (cfg.steps) a.doneOn = a.steps.every(s => s.doneOn) ? (a.doneOn || todayStr()) : null;
      toast("تم حفظ التعديل ✓");
    } else {
      items.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ...data, updates: [], doneOn: null, createdOn: todayStr() });
      toast(`تمت إضافة "${title}" ${cfg.icon}`);
    }
    save();
    resetForm();
    render();
  });

  // --- الأحداث ---
  const page = $(cfg.pageId);
  page.addEventListener("change", e => {
    // علامة على خطوة من خطوات المشروع
    if (e.target.dataset.step) {
      const [aid, sid] = e.target.dataset.step.split("|");
      const a = items.find(x => x.id === aid);
      const s = a?.steps?.find(x => x.id === sid);
      if (!s) return;
      s.doneOn = e.target.checked ? todayStr() : null;
      const wasDone = !!a.doneOn;
      const allDone = a.steps.every(x => x.doneOn);
      a.doneOn = allDone ? (a.doneOn || todayStr()) : null;
      save();
      render();
      if (allDone && !wasDone) {
        celebrate(cfg.doneEmoji, `كل خطوات "${a.title}" خلصت — ${cfg.doneMessages[Math.floor(Math.random() * cfg.doneMessages.length)]}`);
      } else if (e.target.checked) {
        const left = a.steps.filter(x => !x.doneOn).length;
        toast(`✓ خلصت خطوة "${s.text}" — فاضل ${left} ${left === 1 ? "خطوة" : "خطوات"} 💪`);
      }
      return;
    }
    const id = e.target.dataset.done;
    if (!id) return;
    const a = items.find(x => x.id === id);
    if (e.target.checked) {
      // المشروع اللي ليه خطوات: لما تعلّم عليه كله، كل خطواته بتخلص معاه
      if (cfg.steps && a.steps?.some(s => !s.doneOn)) {
        if (!confirm(`لسه في خطوات مخلصتش في "${a.title}". تعلّم المشروع كله إنه خلص؟`)) { e.target.checked = false; return; }
        a.steps.forEach(s => { s.doneOn ??= todayStr(); });
      }
      a.doneOn = todayStr();
      save();
      render();
      celebrate(cfg.doneEmoji, `خلّصت "${a.title}" — ${cfg.doneMessages[Math.floor(Math.random() * cfg.doneMessages.length)]}`);
    } else {
      if (cfg.steps && a.steps?.length) {
        // في المشاريع، الرجوع بيبقى من الخطوات نفسها
        e.target.checked = true;
        toast("عشان ترجّع المشروع مفتوح، شيل العلامة من الخطوة اللي لسه مخلصتش");
        return;
      }
      if (!confirm(`ترجّع "${a.title}" ${WO} تاني؟`)) { e.target.checked = true; return; }
      a.doneOn = null;
      save();
      render();
    }
  });

  page.addEventListener("click", e => {
    const btn = e.target.closest("[data-act]");
    if (!btn || !btn.closest(`#${P}List`)) return;
    const a = items.find(x => x.id === btn.dataset.id);
    if (!a) return;
    switch (btn.dataset.act) {
      case "addupd": {
        const inp = $p(`Upd-${a.id}`);
        const text = inp.value.trim();
        if (!text) { inp.focus(); return; }
        (a.updates ??= []).push({ date: todayStr(), text });
        save(); render();
        toast("اتسجّل التحديث ✓");
        break;
      }
      case "delupd":
        if (!confirm("حذف التحديث ده؟")) return;
        a.updates = a.updates.filter(u => !(u.date === btn.dataset.date && u.text === btn.dataset.text));
        save(); render();
        break;
      case "edit":
        resetForm();
        editingId = a.id;
        $p("Title").value = a.title;
        $p("Second").value = a.person || "";
        $p("Purpose").value = a.purpose || "";
        if (cfg.steps) resetSteps(stepsOf(a)); else $p("Due").value = a.due || "";
        if (cfg.cost) $p("Cost").value = a.cost ?? "";
        if (cfg.nameField) $p("Name").value = a.name || "";
        $p("FormTitle").textContent = `✎ تعديل ${cfg.editTitle || W}`;
        $p("Submit").textContent = "💾 حفظ التعديل";
        $p("CancelEdit").hidden = false;
        $p("FormCard").classList.add("editing");
        $p("FormCard").scrollIntoView({ behavior: "smooth", block: "start" });
        break;
      case "delete":
        if (!confirm(`حذف "${a.title}" نهائياً؟`)) return;
        items = items.filter(x => x.id !== a.id);
        save(); render();
        break;
    }
  });
  page.addEventListener("keydown", e => {
    if (e.key === "Enter" && e.target.id?.startsWith(`${P}Upd-`)) {
      e.preventDefault();
      e.target.nextElementSibling.click();
    }
  });
  $p("Back").addEventListener("click", () => { location.hash = cfg.backHash; });

  // ملخص جاهز للوحة المتابعة
  function summary() {
    const s = stageStats(), c = today();
    return { done: s?.done ?? 0, required: s?.required ?? 0, late: s?.missed ?? 0,
             todayDone: c.done, todayTotal: c.total, streak: 0, lateLabel: cfg.steps ? "خطوة متأخرة" : "عدّى موعده" };
  }
  // سطر الحالة اللي بيظهر تحت الاختيار في صفحة الجانب
  function statusLine() {
    const o = open(), late = o.filter(overdue).length;
    const todayN = cfg.steps ? stepsOn(todayStr()).filter(s => !s.doneOn).length : o.filter(a => a.due === todayStr()).length;
    return `<span class="item-today ${late || todayN ? "pending" : ""}">${o.length ? `${cfg.icon} ${o.length} ${WO}` : `مفيش ${cfg.emptyWord || W} مفتوح`}${todayN ? ` · 📍 ${todayN} ${cfg.steps ? "خطوة النهارده" : "موعدها النهارده"}` : ""}${late ? ` · ⚠ ${late} متأخر` : ""}</span>`;
  }

  const allSteps = () => items.flatMap(a => a.steps || []);

  // مهام يوم معيّن لشاشة "مهامي النهارده": الخطوات اللي تاريخها اليوم ده، أو الحاجات اللي موعدها اليوم ده
  function tasksOn(d) {
    if (cfg.stepYears) return [];
    if (cfg.steps) {
      return items.flatMap(a => (a.steps || []).filter(s => s.date === d).map(s => ({
        key: `ol:${P}:${a.id}:${s.id}`,
        icon: cfg.icon,
        title: s.text,
        meta: `${cfg.title} · ${a.title}`,
        done: !!s.doneOn,
        toggle: v => {
          s.doneOn = v ? todayStr() : null;
          a.doneOn = a.steps.every(x => x.doneOn) ? (a.doneOn || todayStr()) : null;
          save();
        },
      })));
    }
    return items.filter(a => a.due === d).map(a => ({
      key: `ol:${P}:${a.id}`,
      icon: cfg.icon,
      title: a.title,
      meta: `${cfg.title}${a.person ? ` · ${a.person}${a.name ? ` (${a.name})` : ""}` : ""}`,
      done: !!a.doneOn,
      toggle: v => { a.doneOn = v ? todayStr() : null; save(); },
    }));
  }

  return { render, open, done, overdue, stageStats, today, stepsOn, summary, statusLine, allSteps, tasksOn };
}

// ================== قالب صفحة الاختيارات الفرعية ==================
// صفحة فيها اختيارات فرعية بـ On/Off (زي العائلة الصغرى: المنزل / الزوجة والأولاد)
function createHub(cfg) {
  const P = cfg.prefix;
  const subOn = id => isOn(cfg.aspectId, cfg.subs.find(s => s.id === id).key);

  $(cfg.pageId).innerHTML = `
    <section class="card aspect-hero">
      <button class="back-btn" id="${P}Back">→ رجوع</button>
      <div class="ah-icon">${cfg.icon}</div>
      <h2 class="ah-name">${cfg.title}</h2>
      <p class="ah-stage" id="${P}Stage"></p>
    </section>
    <section class="aspects">
      <h2 class="section-title">اختار اللي معاك في المرحلة دي</h2>
      <div id="${P}Items" class="items-list"></div>
    </section>`;

  function render() {
    const aspect = ASPECTS.find(a => a.id === cfg.aspectId);
    currentAspect = aspect;
    const page = $(cfg.pageId);
    page.style.setProperty("--c", aspect.color);
    page.style.setProperty("--cl", aspect.light);
    document.title = `${cfg.title} — رحلة نجاح`;
    $(`${P}Stage`).innerHTML = `${aspect.name} · المرحلة ${ORDINALS[state.stageIndex]}: <strong>${STAGES[state.stageIndex].name}</strong>`;
    $(`${P}Items`).innerHTML = cfg.subs.map(s => {
      const on = subOn(s.id);
      const line = on && s.todayLine ? s.todayLine() : "";
      return `
        <div class="item ${on ? "on" : ""}" data-sub="${s.id}">
          <span class="item-icon">${s.icon}</span>
          <span class="item-body">
            <span class="item-name">${s.name}</span>
            <span class="item-desc">${typeof s.desc === "function" ? s.desc() : s.desc}</span>
            <span class="item-status">${on ? "✓ معاك في المرحلة دي" : "مش في المرحلة دي"}</span>
            ${line}
          </span>
          <label class="switch" aria-label="${s.name}">
            <input type="checkbox" data-sub="${s.id}" ${on ? "checked" : ""} />
            <span class="slider"></span>
          </label>
          <span class="item-go">‹</span>
        </div>`;
    }).join("");
  }

  const items = $(`${P}Items`);
  items.addEventListener("change", e => {
    const s = cfg.subs.find(x => x.id === e.target.dataset.sub);
    if (!s) return;
    setOn(cfg.aspectId, s.key, e.target.checked);
    render();
    toast(e.target.checked ? `تم تفعيل "${s.name}" — دوس عليها عشان تدخل` : `تم إيقاف "${s.name}"`);
  });
  items.addEventListener("click", e => {
    if (e.target.closest(".switch")) return;
    const row = e.target.closest("[data-sub]");
    if (!row) return;
    const s = cfg.subs.find(x => x.id === row.dataset.sub);
    if (!subOn(s.id)) { toast(`فعّل "${s.name}" الأول عشان تدخل عليها`); return; }
    if (!s.ready) { toast(`صفحة ${s.name} هنجهزها لما تشرحهالي`); return; }
    location.hash = `#/aspect/${cfg.aspectId}/${cfg.itemId}/${s.id}`;
  });
  $(`${P}Back`).addEventListener("click", () => { location.hash = `#/aspect/${cfg.aspectId}`; });

  return { render, subOn };
}
