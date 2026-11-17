// صفحة مواعيد الدكاترة والعيادات

const APPT_TYPES = [
  { id: "doctor",    name: "ميعاد دكتور",        icon: "🩺", specLabel: "التخصص",
    suggestions: ["باطنة", "قلب وأوعية دموية", "سكر وغدد صماء", "عيون", "أسنان", "عظام", "جلدية", "أنف وأذن وحنجرة",
                  "مسالك بولية", "مخ وأعصاب", "صدر", "نسا وتوليد", "أطفال", "نفسية", "تغذية علاجية"] },
  { id: "lab",       name: "ميعاد معمل تحاليل",  icon: "🧪", specLabel: "نوع التحليل",
    suggestions: ["صورة دم كاملة CBC", "سكر صائم", "سكر فاطر", "سكر تراكمي HbA1c", "وظائف كلى", "وظائف كبد",
                  "دهون وكوليسترول", "غدة درقية", "فيتامين د", "صورة بول", "حمض يوريك"] },
  { id: "radiology", name: "ميعاد مركز أشعة",    icon: "🩻", specLabel: "نوع الأشعة",
    suggestions: ["أشعة عادية X-Ray", "سونار", "أشعة مقطعية CT", "رنين مغناطيسي MRI", "إيكو على القلب",
                  "رسم قلب ECG", "دوبلر", "ماموجرام", "قياس كثافة العظام"] },
  { id: "other",     name: "أخرى",               icon: "📌", specLabel: "التفاصيل", suggestions: [] },
];
const apptType = id => APPT_TYPES.find(t => t.id === id) || APPT_TYPES[0];

// { id, type, typeOther, spec, doctor, date, time: "HH:MM"|"" , notes, status: "scheduled"|"done"|"cancelled", doneOn }
const APPTS_KEY = "rehlatNajah.appts";
let appts = (() => {
  try { return JSON.parse(localStorage.getItem(APPTS_KEY)) || []; } catch { return []; }
})();
function saveAppts() {
  try { localStorage.setItem(APPTS_KEY, JSON.stringify(appts)); } catch {}
}

let apEditingId = null;

// --- مساعدات ---
function apTitle(a) {
  const t = apptType(a.type);
  const name = a.type === "other" ? (a.typeOther || t.name) : t.name;
  return `${t.icon} ${escapeHtml(name)}${a.spec ? ` · ${escapeHtml(a.spec)}` : ""}`;
}
function apTimeText(a) {
  if (!a.time) return "";
  const [h, m] = a.time.split(":").map(Number);
  return fmtTime(h * 60 + m);
}
function apStatus(a) {
  if (a.status === "cancelled") return "cancelled";
  if (a.status === "done") return "done";
  const today = todayStr();
  if (a.date > today) return "upcoming";
  if (a.date === today) return "today";
  return "missed";
}
function apSortKey(a) { return `${a.date} ${a.time || "99:99"}`; }
function apCountdown(a) {
  const n = daysBetween(todayStr(), a.date);
  if (n === 0) return "النهارده";
  if (n === 1) return "بكرة";
  if (n === 2) return "بعد يومين";
  return `بعد ${n} أيام`;
}

// --- الإحصائيات ---
// كل ميعاد اتحجز تاريخه جوه المرحلة (ومتلغاش) بيتحسب مطلوب.
// اتعمل = حضرته، فاتني = تاريخه عدّى ومتعلّمش عليه، متبقي = لسه تاريخه مجاش أو النهارده
function apptsStats() {
  if (!state.endDate) return null;
  const inStage = appts.filter(a => a.status !== "cancelled" && a.date >= state.startDate && a.date < state.endDate);
  const done = inStage.filter(a => a.status === "done").length;
  const missed = inStage.filter(a => apStatus(a) === "missed").length;
  const required = inStage.length;
  const remaining = required - done - missed;
  const pct = required ? Math.round((done / required) * 100) : 0;
  const rate = done + missed ? Math.round((done / (done + missed)) * 100) : null;
  return { required, done, missed, remaining, pct, rate };
}
function apptsToday() {
  const list = appts.filter(a => a.status !== "cancelled" && a.date === todayStr());
  return { total: list.length, done: list.filter(a => a.status === "done").length };
}
function nextAppt() {
  return appts
    .filter(a => ["today", "upcoming"].includes(apStatus(a)))
    .sort((x, y) => apSortKey(x).localeCompare(apSortKey(y)))[0];
}

// --- العرض ---
function renderApptsPage() {
  const aspect = ASPECTS.find(a => a.id === "health");
  currentAspect = aspect;
  const page = $("apptsPage");
  page.style.setProperty("--c", aspect.color);
  page.style.setProperty("--cl", aspect.light);
  document.title = "مواعيد الدكاترة — رحلة نجاح";
  $("apStage").innerHTML = `${aspect.name} · المرحلة ${ORDINALS[state.stageIndex]}: <strong>${STAGES[state.stageIndex].name}</strong>`;

  renderApNext();
  renderApList();
  renderApProgress();

  // اقتراحات أسماء الدكاترة والأماكن اللي اتكتبت قبل كده
  const docs = [...new Set(appts.map(a => a.doctor).filter(Boolean))];
  $("apDoctorList").innerHTML = docs.map(d => `<option value="${escapeHtml(d)}">`).join("");
}

function renderApNext() {
  const a = nextAppt();
  if (!a) {
    $("apNext").innerHTML = `
      <p class="tt-label">الميعاد الجاي</p>
      <p class="hint center" style="margin:6px 0 0">مفيش مواعيد جاية. ضيف ميعاد من الاستمارة اللي تحت 👇</p>`;
    return;
  }
  const isToday = apStatus(a) === "today";
  $("apNext").innerHTML = `
    <p class="tt-label">${isToday ? "عندك ميعاد النهارده" : "الميعاد الجاي"}</p>
    <p class="ap-next-title">${apTitle(a)}</p>
    <p class="ap-next-when">${formatDate(a.date)}${a.time ? ` · الساعة ${apTimeText(a)}` : ""}${a.doctor ? ` · ${escapeHtml(a.doctor)}` : ""}</p>
    <span class="ap-cd ${isToday ? "today" : ""}">${apCountdown(a)}</span>
    ${a.notes ? `<p class="ap-next-notes">📝 ${escapeHtml(a.notes)}</p>` : ""}
    ${isToday ? `
      <label class="big-check">
        <input type="checkbox" data-done="${a.id}" />
        <span class="bc-box">✓</span>
        <span class="bc-text">علّم هنا لما تخلّص الميعاد</span>
      </label>` : ""}`;
}

function apRow(a) {
  const st = apStatus(a);
  const [, m, d] = a.date.split("-").map(Number);
  const month = new Intl.DateTimeFormat("ar-EG", { month: "short" }).format(new Date(2000, m - 1, 1));
  const tags = {
    upcoming: apCountdown(a),
    today: "النهارده",
    missed: "فاتني",
    done: "✓ اتعمل",
    cancelled: "اتلغى",
  };
  const canCheck = st === "today" || st === "missed" || (st === "done" && a.doneOn === todayStr());
  const btn = (act, icon, title) => `<button class="ap-btn" data-act="${act}" data-id="${a.id}" title="${title}" aria-label="${title}">${icon}</button>`;
  const actions = {
    upcoming: btn("edit", "✎", "تعديل") + btn("cancel", "✕", "إلغاء الميعاد"),
    today: btn("edit", "✎", "تعديل") + btn("cancel", "✕", "إلغاء الميعاد"),
    missed: btn("edit", "↻", "تأجيل لميعاد جديد") + btn("cancel", "✕", "إلغاء الميعاد"),
    done: btn("edit", "📝", "تعديل الملاحظات") + btn("followup", "➕", "حجز متابعة"),
    cancelled: btn("followup", "↻", "إعادة حجز") + btn("delete", "🗑", "حذف نهائي"),
  }[st];

  return `
    <div class="ap-row ${st}">
      <span class="ap-day"><b>${d}</b><small>${month}</small></span>
      <span class="ap-info">
        <span class="ap-title">${apTitle(a)}</span>
        <span class="ap-meta">${dayName(a.date)} · ${a.time ? `الساعة ${apTimeText(a)}` : `<span class="ap-notime">الساعة مش محددة</span>`}${a.doctor ? ` · ${escapeHtml(a.doctor)}` : ""}</span>
        ${a.notes ? `<span class="ap-notes">📝 ${escapeHtml(a.notes)}</span>` : ""}
      </span>
      <span class="ap-tag">${tags[st]}</span>
      <span class="ap-actions">${actions}</span>
      ${canCheck || st === "upcoming" ? `
        <label class="pr-check" aria-label="خلّصت الميعاد" title="${st === "upcoming" ? "تقدر تعلّم لما ييجي تاريخه" : "خلّصت الميعاد"}">
          <input type="checkbox" data-done="${a.id}" ${st === "done" ? "checked" : ""} ${st === "upcoming" ? "disabled" : ""} />
          <span class="bc-box">✓</span>
        </label>` : ""}
    </div>`;
}

function renderApList() {
  if (!appts.length) {
    $("apList").innerHTML = `<p class="md-empty">لسه ما ضفتش مواعيد.</p>`;
    return;
  }
  const groups = [
    { key: "today",     title: "📍 النهارده" },
    { key: "upcoming",  title: "⏳ المواعيد الجاية" },
    { key: "missed",    title: "⚠️ مواعيد فاتتني" },
    { key: "done",      title: "✓ مواعيد اتعملت" },
    { key: "cancelled", title: "✕ مواعيد اتلغت" },
  ];
  const sorted = [...appts].sort((x, y) => apSortKey(x).localeCompare(apSortKey(y)));
  $("apList").innerHTML = groups.map(g => {
    let list = sorted.filter(a => apStatus(a) === g.key);
    if (g.key === "done" || g.key === "cancelled") list = list.reverse(); // الأحدث الأول
    if (!list.length) return "";
    return `<div class="ap-group">${g.title} <span class="n">${list.length}</span></div>${list.map(apRow).join("")}`;
  }).join("");
}

function renderApProgress() {
  const s = apptsStats();
  if (!s) {
    $("apProgress").innerHTML = `<p class="hint center">حدد تاريخ نهاية المرحلة من الصفحة الرئيسية عشان نحسب التزامك 📅</p>`;
    return;
  }
  if (!s.required) {
    $("apProgress").innerHTML = `<p class="hint center">لما تضيف مواعيد تاريخها جوه المرحلة، هنحسب التزامك بيها هنا.</p>`;
    return;
  }
  $("apProgress").innerHTML = `
    <div class="ip-stats">
      <div class="ip-stat"><b>${s.required}</b><small>ميعاد في المرحلة</small></div>
      <div class="ip-stat done"><b>${s.done}</b><small>اتعمل</small></div>
      <div class="ip-stat late"><b>${s.missed}</b><small>فاتني</small></div>
      <div class="ip-stat"><b>${s.remaining}</b><small>جاي</small></div>
    </div>
    <div class="ip-progress"><div style="width:${s.pct}%"></div></div>
    <div class="ip-pct"><span>${s.done} من ${s.required} ميعاد</span><strong>${s.pct}%</strong></div>
    ${s.rate !== null ? `<p class="ap-rate">نسبة الالتزام بالمواعيد اللي جه وقتها: <strong>${s.rate}%</strong></p>` : ""}`;
}

// --- الاستمارة ---
function apUpdateTypeFields() {
  const t = apptType($("apType").value);
  $("apOtherWrap").hidden = t.id !== "other";
  $("apSpecLabel").textContent = t.specLabel;
  $("apSpecList").innerHTML = t.suggestions.map(s => `<option value="${s}">`).join("");
}

function apResetForm() {
  apEditingId = null;
  $("apType").value = "doctor";
  $("apOther").value = "";
  $("apSpec").value = "";
  $("apDoctor").value = "";
  $("apDate").value = "";
  $("apTime").value = "";
  $("apNotes").value = "";
  $("apError").textContent = "";
  $("apDate").min = todayStr();
  $("apFormTitle").textContent = "➕ إضافة ميعاد";
  $("apSubmit").textContent = "➕ إضافة الميعاد";
  $("apCancelEdit").hidden = true;
  $("apFormCard").classList.remove("editing");
  document.querySelectorAll("#apForm .invalid").forEach(el => el.classList.remove("invalid"));
  apUpdateTypeFields();
}

function apFillForm(a, { asNew = false } = {}) {
  $("apType").value = a.type;
  $("apOther").value = a.typeOther || "";
  $("apSpec").value = a.spec || "";
  $("apDoctor").value = a.doctor || "";
  $("apDate").value = asNew ? "" : a.date;
  $("apTime").value = asNew ? "" : (a.time || "");
  $("apNotes").value = asNew ? "" : (a.notes || "");
  apUpdateTypeFields();
  $("apFormCard").scrollIntoView({ behavior: "smooth", block: "start" });
}

function apStartEdit(a) {
  apResetForm();
  apEditingId = a.id;
  apFillForm(a);
  $("apDate").min = "";
  $("apFormTitle").textContent = "✎ تعديل الميعاد";
  $("apSubmit").textContent = "💾 حفظ التعديل";
  $("apCancelEdit").hidden = false;
  $("apFormCard").classList.add("editing");
}

$("apType").innerHTML = APPT_TYPES.map(t => `<option value="${t.id}">${t.icon} ${t.name}</option>`).join("");
apResetForm();

$("apType").addEventListener("change", apUpdateTypeFields);
$("apClear").addEventListener("click", apResetForm);
$("apCancelEdit").addEventListener("click", apResetForm);
$("apForm").addEventListener("input", e => e.target.classList.remove("invalid"));

$("apForm").addEventListener("submit", e => {
  e.preventDefault();
  const type = $("apType").value;
  const typeOther = $("apOther").value.trim();
  const date = $("apDate").value;

  let err = "";
  if (type === "other" && !typeOther) { $("apOther").classList.add("invalid"); err = "اكتب نوع الميعاد"; }
  else if (!date) { $("apDate").classList.add("invalid"); err = "اختار تاريخ الحجز"; }
  else if (!apEditingId && date < todayStr()) { $("apDate").classList.add("invalid"); err = "تاريخ الحجز لازم يكون النهارده أو بعده"; }
  // الساعة مكتوبة نص نص (مثلاً من غير ص/م) — المتصفح بيعتبرها فاضية فلازم ننبّه
  else if ($("apTime").validity.badInput) { $("apTime").classList.add("invalid"); err = "كمّل الساعة: الساعة والدقايق وص/م"; }
  if (err) { $("apError").textContent = err; return; }

  const data = {
    type,
    typeOther: type === "other" ? typeOther : "",
    spec: $("apSpec").value.trim(),
    doctor: $("apDoctor").value.trim(),
    date,
    time: $("apTime").value,
    notes: $("apNotes").value.trim(),
  };

  if (apEditingId) {
    const a = appts.find(x => x.id === apEditingId);
    const dateChanged = a.date !== date;
    Object.assign(a, data);
    // لو ميعاد فاتك واتأجّل لتاريخ جديد، يرجع ميعاد عادي
    if (dateChanged && a.status !== "done") a.status = "scheduled";
    toast("تم حفظ التعديل ✓");
  } else {
    appts.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ...data, status: "scheduled", doneOn: null });
    const n = daysBetween(todayStr(), date);
    toast(`تم حجز الميعاد ✓ ${n === 0 ? "النهارده" : n === 1 ? "بكرة" : `بعد ${n} أيام`}`);
  }
  saveAppts();
  apResetForm();
  renderApptsPage();
});

// --- التعليم على الميعاد والأزرار ---
function apToggleDone(id, checked) {
  const a = appts.find(x => x.id === id);
  if (!a) return;
  const st = apStatus(a);
  if (st === "upcoming") { renderApptsPage(); return; } // لسه تاريخه مجاش
  if (checked) {
    a.status = "done";
    a.doneOn = todayStr();
    saveAppts();
    renderApptsPage();
    celebrate("💙", `ألف سلامة عليك! خلّصت ${apptType(a.type).name}${a.spec ? ` (${a.spec})` : ""}. لو في توصيات — تحاليل أو أشعة أو أدوية — اكتبها في الملاحظات بزرار 📝 أو احجز ميعادها بزرار ➕`);
  } else {
    a.status = "scheduled";
    a.doneOn = null;
    saveAppts();
    renderApptsPage();
  }
}

$("apptsPage").addEventListener("change", e => {
  const id = e.target.dataset.done;
  if (id) apToggleDone(id, e.target.checked);
});

$("apList").addEventListener("click", e => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const a = appts.find(x => x.id === btn.dataset.id);
  if (!a) return;
  switch (btn.dataset.act) {
    case "edit":
      apStartEdit(a);
      break;
    case "followup":
      apResetForm();
      apFillForm(a, { asNew: true });
      $("apNotes").value = a.status === "done" ? `متابعة لميعاد ${formatDate(a.date)}` : "";
      toast("البيانات اتملت، اختار التاريخ الجديد واضغط إضافة");
      break;
    case "cancel":
      if (!confirm(`إلغاء ${apptType(a.type).name}${a.spec ? ` (${a.spec})` : ""} يوم ${formatDate(a.date)}؟`)) return;
      a.status = "cancelled";
      saveAppts();
      renderApptsPage();
      toast("تم إلغاء الميعاد");
      break;
    case "delete":
      if (!confirm("حذف الميعاد ده نهائياً؟")) return;
      appts = appts.filter(x => x.id !== a.id);
      saveAppts();
      renderApptsPage();
      break;
  }
});

$("apBackBtn").addEventListener("click", () => { location.hash = "#/aspect/health"; });
