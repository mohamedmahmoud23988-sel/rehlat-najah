// صفحة التحديات الصحية: تحديات مفتوحة المدة لحد ما تتغلب عليها

const CH_SUGGESTIONS = ["مرض السكر", "ضغط الدم", "الكوليسترول", "السمنة", "مشاكل السنان", "تساقط الشعر", "القولون العصبي",
  "آلام الظهر", "آلام الركبة", "الأنيميا", "الصداع النصفي", "حساسية الصدر", "قلة النوم", "التدخين", "مشاكل البشرة", "النظر"];

const CH_KINDS = {
  chronic: { name: "مرض مزمن", icon: "🔄" },
  acute:   { name: "مرض عارض", icon: "⚡" },
};
const chKind = c => CH_KINDS[c.kind] || CH_KINDS.chronic;

// { id, name, kind: "chronic"|"acute", start, goal, steps, updates: [{ date, text }], wonOn: "YYYY-MM-DD"|null, createdOn }
const CH_KEY = "rehlatNajah.challenges";
let challenges = (() => {
  try { return JSON.parse(localStorage.getItem(CH_KEY)) || []; } catch { return []; }
})();
function saveChallenges() {
  try { localStorage.setItem(CH_KEY, JSON.stringify(challenges)); } catch {}
}
let chEditingId = null;

const chSince = c => c.start || c.createdOn;

// --- الإحصائيات ---
// مفيش مهام يومية هنا؛ بنقيس: كام تحدي كان مفتوح في المرحلة، وكام واحد منهم اتغلبت عليه
function challengesStageStats() {
  if (!state.endDate) return null;
  const inStage = challenges.filter(c => chSince(c) < state.endDate && (!c.wonOn || c.wonOn >= state.startDate));
  const done = inStage.filter(c => c.wonOn && c.wonOn < state.endDate).length;
  return { required: inStage.length, done, missed: 0, remaining: inStage.length - done,
           pct: inStage.length ? Math.round((done / inStage.length) * 100) : 0 };
}
const chActive = () => challenges.filter(c => !c.wonOn);
const chWon = () => challenges.filter(c => c.wonOn);

// --- العرض ---
function renderChallengesPage() {
  const aspect = ASPECTS.find(a => a.id === "health");
  currentAspect = aspect;
  const page = $("challengesPage");
  page.style.setProperty("--c", aspect.color);
  page.style.setProperty("--cl", aspect.light);
  document.title = "التحديات الصحية — رحلة نجاح";
  $("chStage").innerHTML = `${aspect.name} · المرحلة ${ORDINALS[state.stageIndex]}: <strong>${STAGES[state.stageIndex].name}</strong>`;
  $("chNameList").innerHTML = CH_SUGGESTIONS.map(s => `<option value="${s}">`).join("");

  const s = challengesStageStats();
  const act = chActive();
  const nChronic = act.filter(c => (c.kind || "chronic") === "chronic").length;
  $("chSummary").innerHTML = `
    <div class="ch-summary">
      <div class="ip-stat"><b>${act.length}</b><small>تحدي مفتوح${act.length ? ` (${nChronic} مزمن · ${act.length - nChronic} عارض)` : ""}</small></div>
      <div class="ip-stat done"><b>${chWon().length}</b><small>اتغلبت عليه 🏆</small></div>
      <div class="ip-stat"><b>${s ? `${s.done} من ${s.required}` : "—"}</b><small>اتغلبت عليه في المرحلة</small></div>
    </div>`;
  renderChallengesList();
}

function chCard(c) {
  const t = todayStr();
  const won = !!c.wonOn;
  const since = chSince(c);
  const days = daysBetween(since, won ? c.wonOn : t);
  const sub = won
    ? `من ${formatDate(since)} · اتغلبت عليه ${formatDate(c.wonOn)}`
    : `${c.start ? `ظهر ${formatDate(c.start)}` : `اتضاف ${formatDate(c.createdOn)}`}`;
  const updates = (c.updates || []).slice().sort((a, b) => b.date.localeCompare(a.date));
  return `
    <div class="ch-card ${won ? "won" : ""}">
      <div class="ch-head">
        <label class="pr-check" title="${won ? "رجّعه تحدي مفتوح" : "علّم لما تتغلب على التحدي"}" aria-label="اتغلبت على ${escapeHtml(c.name)}">
          <input type="checkbox" data-won="${c.id}" ${won ? "checked" : ""} />
          <span class="bc-box">✓</span>
        </label>
        <span class="ch-info">
          <b>${escapeHtml(c.name)} <span class="ch-kind ${c.kind || "chronic"}">${chKind(c).icon} ${chKind(c).name}</span></b>
          <small>${sub}</small>
          ${won ? `<span class="ch-won-badge">🏆 اتغلبت عليه</span>` : c.goal ? `<span class="ch-goal">🎯 ${escapeHtml(c.goal)}</span>` : ""}
        </span>
        <span class="ch-days"><b>${days}</b><small>${won ? "يوم لحد ما اتغلبت" : "يوم في التحدي"}</small></span>
        <span class="ap-actions">
          <button class="ap-btn" data-act="edit" data-id="${c.id}" title="تعديل" aria-label="تعديل">✎</button>
          <button class="ap-btn" data-act="delete" data-id="${c.id}" title="حذف" aria-label="حذف">🗑</button>
        </span>
      </div>
      ${c.steps ? `<div class="ch-steps"><span class="ch-steps-title">📝 الخطوات</span>${escapeHtml(c.steps)}</div>` : ""}
      ${updates.length ? `
        <div class="ch-updates">
          ${updates.map((u, i) => `
            <div class="ch-update">
              <span class="d">${formatShort(u.date)}</span>
              <span class="x">${escapeHtml(u.text)}</span>
              <button class="ap-btn" data-act="delupd" data-id="${c.id}" data-date="${u.date}" data-text="${escapeHtml(u.text)}" title="حذف التحديث" aria-label="حذف التحديث">✕</button>
            </div>`).join("")}
        </div>` : ""}
      ${won ? "" : `
        <div class="ch-add">
          <input type="text" id="chUpd-${c.id}" placeholder="➕ سجّل تحديث أو خطوة جديدة… (مثلاً: التراكمي نزل لـ 7.2)" />
          <button class="btn btn-outline" data-act="addupd" data-id="${c.id}">إضافة</button>
        </div>`}
    </div>`;
}

function renderChallengesList() {
  if (!challenges.length) {
    $("chList").innerHTML = `<p class="md-empty">لسه ما ضفتش تحديات.</p>`;
    return;
  }
  const active = chActive().sort((a, b) => chSince(a).localeCompare(chSince(b)));
  const won = chWon().sort((a, b) => b.wonOn.localeCompare(a.wonOn));
  $("chList").innerHTML =
    (active.length ? `<div class="ap-group">💪 تحديات مفتوحة <span class="n">${active.length}</span></div>${active.map(chCard).join("")}` : "") +
    (won.length ? `<div class="ap-group">🏆 تحديات اتغلبت عليها <span class="n">${won.length}</span></div>${won.map(chCard).join("")}` : "");
}

// --- الاستمارة ---
function chResetForm() {
  chEditingId = null;
  ["chName", "chGoal", "chSteps"].forEach(id => { $(id).value = ""; });
  $("chStart").value = "";
  $("chStart").max = todayStr();
  $("chKind").value = "chronic";
  $("chError").textContent = "";
  $("chFormTitle").textContent = "➕ إضافة تحدي";
  $("chSubmit").textContent = "➕ إضافة التحدي";
  $("chCancelEdit").hidden = true;
  $("chFormCard").classList.remove("editing");
  $("chName").classList.remove("invalid");
}
chResetForm();
$("chClear").addEventListener("click", chResetForm);
$("chCancelEdit").addEventListener("click", chResetForm);
$("chName").addEventListener("input", e => e.target.classList.remove("invalid"));

$("chForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = $("chName").value.trim();
  const start = $("chStart").value;
  if (!name) { $("chName").classList.add("invalid"); $("chError").textContent = "اكتب التحدي"; return; }
  if (start && start > todayStr()) { $("chError").textContent = "تاريخ الظهور مينفعش يكون في المستقبل"; return; }
  const data = { name, kind: $("chKind").value, start, goal: $("chGoal").value.trim(), steps: $("chSteps").value.trim() };

  if (chEditingId) {
    Object.assign(challenges.find(c => c.id === chEditingId), data);
    toast("تم حفظ التعديل ✓");
  } else {
    challenges.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ...data, updates: [], wonOn: null, createdOn: todayStr() });
    toast(`تمت إضافة "${name}" — ربنا يعينك ويشفيك 💪`);
  }
  saveChallenges();
  chResetForm();
  renderChallengesPage();
});

// --- التغلب على التحدي ---
$("challengesPage").addEventListener("change", e => {
  const id = e.target.dataset.won;
  if (!id) return;
  const c = challenges.find(x => x.id === id);
  if (e.target.checked) {
    c.wonOn = todayStr();
    saveChallenges();
    renderChallengesPage();
    const days = daysBetween(chSince(c), c.wonOn);
    celebrate("🏆", `ألف مبروك! اتغلبت على "${c.name}" بعد ${days} يوم من الصبر والعزيمة 👏 الحمد لله على السلامة`);
  } else {
    if (!confirm(`ترجّع "${c.name}" تحدي مفتوح تاني؟`)) { e.target.checked = true; return; }
    c.wonOn = null;
    saveChallenges();
    renderChallengesPage();
    toast("رجع تحدي مفتوح — وانت قدها إن شاء الله 💪");
  }
});

$("challengesPage").addEventListener("click", e => {
  const btn = e.target.closest("[data-act]");
  if (!btn || !btn.closest("#chList")) return;
  const c = challenges.find(x => x.id === btn.dataset.id);
  if (!c) return;
  switch (btn.dataset.act) {
    case "addupd": {
      const inp = $(`chUpd-${c.id}`);
      const text = inp.value.trim();
      if (!text) { inp.focus(); return; }
      (c.updates ??= []).push({ date: todayStr(), text });
      saveChallenges();
      renderChallengesPage();
      toast("اتسجّل التحديث ✓ كمّل كده");
      break;
    }
    case "delupd":
      if (!confirm("حذف التحديث ده؟")) return;
      c.updates = c.updates.filter(u => !(u.date === btn.dataset.date && u.text === btn.dataset.text));
      saveChallenges();
      renderChallengesPage();
      break;
    case "edit":
      chResetForm();
      chEditingId = c.id;
      $("chName").value = c.name;
      $("chKind").value = c.kind || "chronic";
      $("chStart").value = c.start || "";
      $("chGoal").value = c.goal || "";
      $("chSteps").value = c.steps || "";
      $("chFormTitle").textContent = "✎ تعديل التحدي";
      $("chSubmit").textContent = "💾 حفظ التعديل";
      $("chCancelEdit").hidden = false;
      $("chFormCard").classList.add("editing");
      $("chFormCard").scrollIntoView({ behavior: "smooth", block: "start" });
      break;
    case "delete":
      if (!confirm(`حذف "${c.name}" نهائياً؟`)) return;
      challenges = challenges.filter(x => x.id !== c.id);
      saveChallenges();
      renderChallengesPage();
      break;
  }
});
// Enter في خانة التحديث = إضافة
$("challengesPage").addEventListener("keydown", e => {
  if (e.key === "Enter" && e.target.id?.startsWith("chUpd-")) {
    e.preventDefault();
    e.target.nextElementSibling.click();
  }
});

$("chBackBtn").addEventListener("click", () => { location.hash = "#/aspect/health"; });
