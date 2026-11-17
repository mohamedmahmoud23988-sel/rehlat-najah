// التخزين: المرحلة، اختيارات On/Off، سجل الإنجاز

// ================== الرحلة والمراحل ==================
// المستخدم بيسمّي رحلته، ويحدد عدد مراحلها وأسماءها وتواريخ كل مرحلة
// journey = { id, name, stages: [{ id, name, start, end }], current, status: "active"|"done", createdOn }
//   end = آخر يوم في المرحلة (داخل فيها)
// archive = [ لقطة لكل مرحلة خلصت: تواريخها ونسبة إنجازها وتفاصيل كل جانب واختيار ]
const JOURNEY_KEY = "rehlatNajah.journey";
const ARCHIVE_KEY = "rehlatNajah.archive";
const TOGGLES_KEY = "rehlatNajah.toggles";
const ACT_KEY = "rehlatNajah.activations";

const readJSON = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } };
let journey = readJSON(JOURNEY_KEY, null);
// الأرشيف = رحلات كاملة (الشكل القديم اللي كان بيحفظ مراحل لوحدها مش بيتعرض)
let archive = readJSON(ARCHIVE_KEY, []).filter(a => Array.isArray(a.stages));
let toggles = readJSON(TOGGLES_KEY, {});
let activations = readJSON(ACT_KEY, {});
const saveJourney = () => { try { localStorage.setItem(JOURNEY_KEY, JSON.stringify(journey)); } catch {} };
const saveArchive = () => { try { localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive)); } catch {} };
function saveToggles() { try { localStorage.setItem(TOGGLES_KEY, JSON.stringify(toggles)); } catch {} }
function saveActivations() { try { localStorage.setItem(ACT_KEY, JSON.stringify(activations)); } catch {} }

// --- تحويل النظام القديم (3 مراحل ثابتة) للنظام الجديد، من غير ما حاجة تضيع ---
(() => {
  const old = readJSON("rehlatNajah.state", null);
  const numericKeys = o => Object.keys(o).filter(k => /^\d+$/.test(k));
  // التحويل بيحصل مرة واحدة بس (عشان لو المستخدم أنهى رحلته، متتعملش رحلة قديمة تاني)
  try { localStorage.removeItem("rehlatNajah.state"); } catch {}
  if (!journey && old?.startDate) {
    const names = ["بداية النجاح", "الصبر والعزيمة", "النجاح"];
    const cur = old?.stageIndex || 0;
    journey = {
      id: "j0", name: "رحلة نجاح", current: cur, status: "active", createdOn: todayStr(),
      stages: names.map((n, i) => ({
        id: "s" + i, name: n,
        start: i === cur && old?.startDate ? old.startDate : "",
        end: i === cur && old?.endDate ? addDays(old.endDate, -1) : "",
      })),
    };
    saveJourney();
  }
  // الاختيارات المفعّلة كانت متخزنة برقم المرحلة ("0") — بقت برقم الرحلة والمرحلة ("j0:0")
  let moved = false;
  for (const store of [toggles, activations]) {
    numericKeys(store).forEach(k => { store[`j0:${k}`] ??= store[k]; delete store[k]; moved = true; });
  }
  if (moved) { saveToggles(); saveActivations(); }
})();

// "state" هو المرحلة الحالية بالشكل اللي كل الشاشات بتستخدمه
// (startDate = أول يوم، endDate = اليوم اللي بعد آخر يوم — مش داخل في المرحلة)
const state = { stageIndex: 0, startDate: null, endDate: null, stageKey: "none" };
// المرحلة الحالية بتتحدد بالتاريخ: آخر مرحلة بدأت قبل النهارده أو فيه
function stageIndexByDate(j) {
  const t = todayStr();
  let idx = 0;
  (j.stages || []).forEach((s, i) => { if (s.start && s.start <= t) idx = i; });
  return idx;
}
function syncState() {
  if (journey && journey.status === "active") {
    const idx = stageIndexByDate(journey);
    if (idx !== journey.current) {
      // دخلنا مرحلة جديدة: الاختيارات المفعّلة بتتنقل معانا
      carryToggles(`${journey.id}:${journey.current}`, `${journey.id}:${idx}`);
      journey.current = idx;
      saveJourney();
    }
  }
  const st = journey?.stages?.[journey.current];
  state.stageIndex = journey ? journey.current : 0;
  state.startDate = st?.start || null;
  state.endDate = st?.end ? addDays(st.end, 1) : null;
  state.stageKey = journey ? `${journey.id}:${journey.current}` : "none";
  STAGES = journey ? journey.stages.map(s => ({ name: s.name })) : [{ name: "—" }];
}
syncState();

// الاختيارات اللي اتفعّلت قبل ما يبدأ رحلة اتحفظت تحت "none" — تتنقل للمرحلة الحالية
if (journey && journey.status === "active") {
  let changed = false;
  for (const store of [toggles, activations]) {
    if (!store.none) continue;
    const cur = (store[state.stageKey] ??= {});
    for (const [k, v] of Object.entries(store.none)) {
      if (v && typeof v === "object") cur[k] = { ...v, ...(cur[k] || {}) };
      else if (cur[k] == null) cur[k] = v;
    }
    delete store.none;
    changed = true;
  }
  if (changed) { saveToggles(); saveActivations(); }
}

// أيام الرحلة: من أول يوم في أول مرحلة لحد آخر يوم في آخر مرحلة
// المهام المتكررة (صلاة، توبة، …) متتعلّمش غير في الأيام دي
function journeyRange() {
  if (!journey || journey.status !== "active") return null;
  const st = journey.stages.filter(s => s.start && s.end);
  return st.length ? { start: st[0].start, end: st[st.length - 1].end } : null;
}
function inJourney(d = todayStr()) {
  const r = journeyRange();
  return !!r && d >= r.start && d <= r.end;
}
// رسالة للأيام اللي برّه الرحلة
function outOfJourneyMsg(d = todayStr()) {
  const r = journeyRange();
  if (!r) return "ابدأ رحلتك الأول";
  if (d < r.start) {
    const n = daysBetween(d, r.start);
    return `⏳ رحلتك بتبدأ ${formatDate(r.start)}${n === 1 ? " (بكرة)" : ` (بعد ${n} يوم)`} — تقدر تعلّم من أول يوم فيها`;
  }
  return "🏁 مدة رحلتك خلصت — مفيش مهام بعد آخر يوم فيها";
}

const ORDINALS = ["الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة", "السادسة", "السابعة", "الثامنة", "التاسعة", "العاشرة",
  "الحادية عشر", "الثانية عشر", "الثالثة عشر", "الرابعة عشر", "الخامسة عشر", "السادسة عشر", "السابعة عشر", "الثامنة عشر", "التاسعة عشر", "العشرون"];

// ================== اختيارات الجوانب (On / Off لكل مرحلة) ==================
// الشكل: { "j0:0": { religious: { tawba: true, ... } }, "j0:1": {...} }
function isOn(aspectId, itemId) {
  return !!toggles[state.stageKey]?.[aspectId]?.[itemId];
}
function setOn(aspectId, itemId, on) {
  const st = (toggles[state.stageKey] ??= {});
  const asp = (st[aspectId] ??= {});
  asp[itemId] = on;
  saveToggles();
  // نسجّل أول يوم اتفعّل فيه الاختيار في المرحلة دي، عشان المتابعة تبدأ منه
  if (on) {
    const acts = (activations[state.stageKey] ??= {});
    const key = `${aspectId}.${itemId}`;
    if (!acts[key]) { acts[key] = todayStr(); saveActivations(); }
  }
}

// ================== سجل الإنجاز اليومي ==================
// الشكل: { "religious.tawba": { "2026-11-16": "ontime" | "late" } }
const LOG_KEY = "rehlatNajah.log";
let logData = (() => {
  try { return JSON.parse(localStorage.getItem(LOG_KEY)) || {}; } catch { return {}; }
})();
function saveLog() {
  try { localStorage.setItem(LOG_KEY, JSON.stringify(logData)); } catch {}
}
function isDone(aspectId, itemId, date) {
  return !!logData[`${aspectId}.${itemId}`]?.[date];
}
function setDone(aspectId, itemId, date, value) {
  const m = (logData[`${aspectId}.${itemId}`] ??= {});
  if (value) m[date] = value; else delete m[date];
  saveLog();
}
function countOn(aspect) {
  return (aspect.items || []).filter(it => isOn(aspect.id, it.id)).length;
}
// لما ننتقل لمرحلة جديدة، ناخد معانا اختيارات المرحلة اللي قبلها كبداية
function carryToggles(fromKey, toKey) {
  if (!toggles[toKey] && toggles[fromKey]) {
    toggles[toKey] = JSON.parse(JSON.stringify(toggles[fromKey]));
    saveToggles();
  }
}

// المتابعة بتبدأ من بداية المرحلة، أو من يوم التفعيل لو اتفعّل بعدها
function trackingStart(aspectId, itemId) {
  const act = activations[state.stageKey]?.[`${aspectId}.${itemId}`];
  return act && act > state.startDate ? act : state.startDate;
}

const hasPage = it => !!(it.daily || it.prayers || it.fasting || it.meds || it.appts || it.exercise || it.diet || it.challenges || it.affairs || it.smallFamily || it.projectsHub || it.workTasks || it.business || it.skills || it.growth || it.goalHub);

