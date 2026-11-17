// الحقول الإضافية في البروفايل (الوظيفة، الحالة الاجتماعية، الأولاد، الاهتمامات)
// بتتستخدم في استمارة التسجيل وفي تعديل البروفايل، والجوانب بتستفيد منها

const MARITAL_OPTIONS = [
  { id: "single",   name: "أعزب / عزباء" },
  { id: "married",  name: "متزوج / متزوجة" },
  { id: "divorced", name: "مطلق / مطلقة" },
  { id: "widowed",  name: "أرمل / أرملة" },
];
const TECH_INTERESTS = ["تحليل البيانات", "الإكسيل المتقدم", "البرمجة", "الذكاء الاصطناعي", "التصميم الجرافيكي",
  "مونتاج الفيديو", "التسويق الرقمي", "تطوير المواقع", "الأمن السيبراني", "قواعد البيانات"];
const SPORTS_INTERESTS = ["المشي", "الركض", "كرة القدم", "تمارين جيم", "تمارين منزلية", "السباحة", "ركوب العجل", "البادل / التنس", "كرة السلة", "اليوجا"];
const JOB_SUGGESTIONS = ["أخصائي موارد بشرية", "مدير موارد بشرية", "محاسب", "مهندس", "طبيب", "مدرّس", "مبرمج", "محامي", "صيدلي", "مندوب مبيعات", "مدير مشروعات", "رائد أعمال", "طالب", "ربة منزل"];

const maritalName = id => MARITAL_OPTIONS.find(m => m.id === id)?.name || "";
const isMarried = p => p?.marital === "married";

function extraFieldsHTML(px) {
  return `
    <div class="f">
      <label for="${px}Job">الوظيفة</label>
      <input id="${px}Job" type="text" list="${px}JobList" autocomplete="off" placeholder="مثلاً: أخصائي موارد بشرية" />
      <datalist id="${px}JobList">${JOB_SUGGESTIONS.map(j => `<option value="${j}">`).join("")}</datalist>
    </div>
    <div class="f">
      <label for="${px}Marital">الحالة الاجتماعية</label>
      <select id="${px}Marital">
        <option value="">اختار…</option>
        ${MARITAL_OPTIONS.map(m => `<option value="${m.id}">${m.name}</option>`).join("")}
      </select>
    </div>
    <div class="f">
      <label for="${px}HasKids">عندك أولاد؟</label>
      <select id="${px}HasKids">
        <option value="no">لا</option>
        <option value="yes">أيوه</option>
      </select>
    </div>
    <div class="f" id="${px}KidsWrap" hidden>
      <label for="${px}KidsCount">عدد الأولاد</label>
      <input id="${px}KidsCount" type="number" min="1" max="20" value="1" />
    </div>
    <div class="f full">
      <label>💻 اهتماماتك التقنية <small class="muted">(اختار أي عدد)</small></label>
      <div class="chips-pick" id="${px}Tech">${TECH_INTERESTS.map(t => `<label class="chip-pick"><input type="checkbox" value="${t}" /><span>${t}</span></label>`).join("")}</div>
    </div>
    <div class="f full">
      <label>🏃 اهتماماتك الرياضية <small class="muted">(اختار أي عدد)</small></label>
      <div class="chips-pick" id="${px}Sports">${SPORTS_INTERESTS.map(t => `<label class="chip-pick"><input type="checkbox" value="${t}" /><span>${t}</span></label>`).join("")}</div>
    </div>`;
}

function bindExtraFields(px) {
  const toggle = () => { $(`${px}KidsWrap`).hidden = $(`${px}HasKids`).value !== "yes"; };
  $(`${px}HasKids`).addEventListener("change", toggle);
  toggle();
}

function fillExtraFields(px, p = {}) {
  $(`${px}Job`).value = p.job || "";
  $(`${px}Marital`).value = p.marital || "";
  $(`${px}HasKids`).value = p.kidsCount > 0 ? "yes" : "no";
  $(`${px}KidsCount`).value = p.kidsCount > 0 ? p.kidsCount : 1;
  $(`${px}KidsWrap`).hidden = !(p.kidsCount > 0);
  $(`${px}Tech`).querySelectorAll("input").forEach(i => { i.checked = (p.techInterests || []).includes(i.value); });
  $(`${px}Sports`).querySelectorAll("input").forEach(i => { i.checked = (p.sportsInterests || []).includes(i.value); });
}

function readExtraFields(px) {
  const hasKids = $(`${px}HasKids`).value === "yes";
  return {
    job: $(`${px}Job`).value.trim(),
    marital: $(`${px}Marital`).value,
    kidsCount: hasKids ? Math.max(1, parseInt($(`${px}KidsCount`).value, 10) || 1) : 0,
    techInterests: [...$(`${px}Tech`).querySelectorAll("input:checked")].map(i => i.value),
    sportsInterests: [...$(`${px}Sports`).querySelectorAll("input:checked")].map(i => i.value),
  };
}

// ملخص البيانات الشخصية في عرض البروفايل
function extraSummaryHTML(p) {
  const rows = [];
  if (p.job) rows.push(`<p>💼 <strong>${escapeHtml(p.job)}</strong></p>`);
  const fam = [p.marital ? maritalName(p.marital) : "", p.kidsCount > 0 ? (p.kidsCount === 1 ? "طفل واحد" : p.kidsCount === 2 ? "طفلين" : `${p.kidsCount} أطفال`) : (p.marital ? "من غير أولاد" : "")].filter(Boolean).join(" · ");
  if (fam) rows.push(`<p>👨‍👩‍👧 ${fam}</p>`);
  if ((p.techInterests || []).length) rows.push(`<div class="pv-chips"><span>💻</span>${p.techInterests.map(t => `<span class="pv-chip">${escapeHtml(t)}</span>`).join("")}</div>`);
  if ((p.sportsInterests || []).length) rows.push(`<div class="pv-chips"><span>🏃</span>${p.sportsInterests.map(t => `<span class="pv-chip">${escapeHtml(t)}</span>`).join("")}</div>`);
  return rows.join("") || `<p class="muted">كمّل بياناتك من "تعديل البيانات" عشان البرنامج يتظبط على مقاسك</p>`;
}
