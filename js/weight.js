// متابعة الوزن: تسجيل أسبوعي، مربوط بالبروفايل والتحليل

const WEIGHTS_KEY = "rehlatNajah.weights";
const WEIGH_EVERY_DAYS = 7;

// [{ date: "YYYY-MM-DD", kg: number }] مترتبة بالتاريخ، تسجيل واحد لكل يوم
let weights = (() => {
  try { return JSON.parse(localStorage.getItem(WEIGHTS_KEY)) || []; } catch { return []; }
})();
function saveWeights() {
  weights.sort((a, b) => a.date.localeCompare(b.date));
  try { localStorage.setItem(WEIGHTS_KEY, JSON.stringify(weights)); } catch {}
}
const latestWeight = () => weights[weights.length - 1] || null;

function upsertWeight(date, kg) {
  const existing = weights.find(w => w.date === date);
  if (existing) existing.kg = kg; else weights.push({ date, kg });
  saveWeights();
}

// أحدث وزن مسجّل هو وزن البروفايل، فالتحليل (BMI والسعرات) يتحدّث لوحده
function syncProfileFromWeights() {
  const last = latestWeight();
  if (!profile || !last || profile.weight === last.kg) return;
  profile.weight = last.kg;
  saveProfile(profile);
  renderHeader();
  if ($("profileView").classList.contains("show")) renderProfileView();
}

// بتتنادى من البروفايل لما الوزن يتعدّل هناك
function onProfileWeightSaved(kg) {
  const last = latestWeight();
  if (last && last.kg === kg) return;
  upsertWeight(todayStr(), kg);
}

// أول مرة: نبدأ السجل بوزن البروفايل
function ensureStartingWeight() {
  if (!weights.length && profile?.weight) upsertWeight(todayStr(), profile.weight);
}

// --- العرض ---
function renderWeightTrack() {
  ensureStartingWeight();
  const last = latestWeight();
  const today = todayStr();
  $("wtDate").value = today;
  $("wtDate").max = today;
  $("wtError").textContent = "";

  // تذكير الوزن الأسبوعي
  if (!last) {
    $("wtDue").textContent = "سجّل وزنك عشان نبدأ المتابعة";
    $("wtDue").className = "wt-due due";
  } else {
    const ago = daysBetween(last.date, today);
    const due = ago >= WEIGH_EVERY_DAYS;
    $("wtDue").textContent = due
      ? `⏰ آخر وزن من ${ago} يوم — وقت وزن الأسبوع`
      : ago === 0 ? "✓ اتسجّل النهارده" : `الوزن الجاي بعد ${WEIGH_EVERY_DAYS - ago} يوم`;
    $("wtDue").className = `wt-due ${due ? "due" : ""}`;
  }

  renderWeightStats();
  renderWeightChart();
  renderWeightHistory();
}

function renderWeightStats() {
  if (!weights.length) { $("wtStats").innerHTML = ""; return; }
  const first = weights[0], last = latestWeight();
  const change = +(last.kg - first.kg).toFixed(1);
  let target = "", targetLabel = "الوزن الطبيعي";
  if (profile?.height) {
    const h = profile.height / 100;
    const maxW = 24.9 * h * h, minW = 18.5 * h * h;
    if (last.kg > maxW) { target = `↓ ${(last.kg - maxW).toFixed(1)}`; targetLabel = "كجم فاضلين للوزن الطبيعي"; }
    else if (last.kg < minW) { target = `↑ ${(minW - last.kg).toFixed(1)}`; targetLabel = "كجم فاضلين للوزن الطبيعي"; }
    else { target = "✓"; targetLabel = "وزنك في النطاق الطبيعي"; }
  }
  // النزول كويس لو الوزن فوق الطبيعي، والعكس
  const bmi = profile?.height ? last.kg / ((profile.height / 100) ** 2) : null;
  const goodDir = bmi !== null && bmi < 18.5 ? 1 : -1;
  const cls = change === 0 ? "" : Math.sign(change) === goodDir ? "good" : "bad";
  const arrow = change > 0 ? "↑" : change < 0 ? "↓" : "";
  $("wtStats").innerHTML = `
    <div class="wt-tiles">
      <div class="wt-tile"><b>${last.kg}</b><small>الوزن الحالي (كجم)</small></div>
      <div class="wt-tile"><b>${first.kg}</b><small>وزن البداية (${formatShort(first.date)})</small></div>
      <div class="wt-tile"><b class="${cls}">${arrow} ${Math.abs(change)}</b><small>التغيير من البداية (كجم)</small></div>
      <div class="wt-tile"><b>${target || "—"}</b><small>${targetLabel}</small></div>
    </div>`;
}

const formatShort = d => new Intl.DateTimeFormat("ar-EG-u-nu-latn", { day: "numeric", month: "short" })
  .format(new Date(toDayNumber(d) * 86400000 + 12 * 3600000));

function renderWeightChart() {
  if (weights.length < 2) {
    $("wtChart").innerHTML = weights.length
      ? `<p class="wt-one">📈 سجّل وزنك الأسبوع الجاي عشان يظهر الرسم البياني لتطوّرك</p>`
      : "";
    return;
  }
  const W = 600, H = 220, padL = 40, padR = 46, padT = 16, padB = 28;
  const d0 = toDayNumber(weights[0].date);
  const d1 = toDayNumber(latestWeight().date);
  const span = Math.max(d1 - d0, 1);

  let lo = Math.min(...weights.map(w => w.kg));
  let hi = Math.max(...weights.map(w => w.kg));
  let band = null;
  if (profile?.height) {
    const h = profile.height / 100;
    band = { min: 18.5 * h * h, max: 24.9 * h * h };
    lo = Math.min(lo, band.max); // نخلي حد الوزن الطبيعي باين كهدف
  }
  lo = Math.floor(lo - 2); hi = Math.ceil(hi + 2);

  // نخلي الخطوط الأفقية على أرقام صحيحة مريحة
  // (الرسم بيتعكس أفقياً عشان الاتجاه العربي: الأقدم يمين والأحدث شمال)
  const x = d => W - padR - ((toDayNumber(d) - d0) / span) * (W - padL - padR);
  const y = kg => padT + (1 - (kg - lo) / (hi - lo)) * (H - padT - padB);

  const step = Math.max(1, Math.ceil((hi - lo) / 4));
  let grid = "", axis = "";
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) {
    grid += `<line x1="${padL - 6}" x2="${W - padR + 6}" y1="${y(v)}" y2="${y(v)}" />`;
    axis += `<text x="${W - padR + 12}" y="${y(v) + 4}" text-anchor="start">${v}</text>`;
  }
  let bandSvg = "";
  if (band) {
    const top = y(Math.min(band.max, hi)), bot = y(Math.max(band.min, lo));
    if (bot > top) {
      bandSvg = `<rect class="band" x="${padL}" y="${top}" width="${W - padL - padR}" height="${bot - top}" rx="4" />
                 <text class="band-label" x="${W - padR - 6}" y="${bot - top > 18 ? top + 14 : top - 6}" text-anchor="end">نطاق الوزن الطبيعي لطولك (${band.min.toFixed(0)}–${band.max.toFixed(0)} كجم)</text>`;
    }
  }
  const pts = weights.map(w => [x(w.date), y(w.kg)]);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${path} L${pts[pts.length - 1][0].toFixed(1)},${H - padB} L${pts[0][0].toFixed(1)},${H - padB} Z`;
  const last = latestWeight();
  const lp = pts[pts.length - 1];

  // تواريخ أول وآخر قياس على المحور
  const dateAxis = `
    <text x="${pts[0][0]}" y="${H - 8}" text-anchor="middle">${formatShort(weights[0].date)}</text>
    <text x="${lp[0]}" y="${H - 8}" text-anchor="middle">${formatShort(last.date)}</text>`;

  const dots = weights.map((w, i) => `
    <g data-i="${i}">
      <circle class="dot" cx="${pts[i][0]}" cy="${pts[i][1]}" r="${i === weights.length - 1 ? 6 : 4.5}" />
      <circle class="hit" cx="${pts[i][0]}" cy="${pts[i][1]}" r="14" />
    </g>`).join("");

  $("wtChart").innerHTML = `
    <div class="wt-chart">
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="تطور الوزن من ${weights[0].kg} لـ ${last.kg} كجم">
        <g class="grid">${grid}</g>
        ${bandSvg}
        <path class="area" d="${area}" />
        <path class="line" d="${path}" />
        <g class="axis">${axis}${dateAxis}</g>
        ${dots}
        <text class="last-label" x="${lp[0]}" y="${lp[1] - 12}" text-anchor="middle">${last.kg}</text>
      </svg>
      <div class="wt-tip" id="wtTip"></div>
    </div>`;
}

function renderWeightHistory() {
  if (!weights.length) { $("wtHistory").innerHTML = ""; return; }
  const rows = [...weights].reverse().slice(0, 10).map((w, i, arr) => {
    const prev = arr[i + 1];
    let diff = `<span class="diff same">البداية</span>`;
    if (prev) {
      const d = +(w.kg - prev.kg).toFixed(1);
      diff = d === 0 ? `<span class="diff same">ثابت</span>`
           : `<span class="diff ${d < 0 ? "down" : "up"}">${d < 0 ? "↓" : "↑"} ${Math.abs(d)} كجم</span>`;
    }
    return `
      <div class="wt-row">
        <span class="d">${formatDate(w.date)}</span>
        <span class="kg">${w.kg} كجم</span>
        ${diff}
        <button class="ap-btn" data-wdel="${w.date}" title="حذف" aria-label="حذف التسجيل">🗑</button>
      </div>`;
  }).join("");
  $("wtHistory").innerHTML = `<div class="wt-hist-title">📋 آخر التسجيلات</div>${rows}`;
}

// --- الأحداث ---
$("wtForm").addEventListener("submit", e => {
  e.preventDefault();
  const kg = Math.round(parseFloat($("wtKg").value) * 10) / 10;
  const date = $("wtDate").value || todayStr();
  if (!(kg >= 20 && kg <= 300)) { $("wtError").textContent = "اكتب وزن صحيح بين 20 و 300 كجم"; $("wtKg").classList.add("invalid"); return; }
  if (date > todayStr()) { $("wtError").textContent = "التاريخ مينفعش يكون في المستقبل"; return; }

  const prev = latestWeight();
  upsertWeight(date, kg);
  syncProfileFromWeights();
  $("wtKg").value = "";
  renderWeightTrack();

  if (prev && date >= prev.date) {
    const d = +(kg - prev.kg).toFixed(1);
    const bmi = profile?.height ? kg / ((profile.height / 100) ** 2) : 22;
    if (d === 0) toast("تم تسجيل الوزن ✓ ثابت زي المرة اللي فاتت");
    else if ((d < 0 && bmi >= 18.5) || (d > 0 && bmi < 18.5)) celebrate("⚖️", `ما شاء الله! ${d < 0 ? "نزلت" : "زوّدت"} ${Math.abs(d)} كجم من آخر وزن 👏 كمّل كده، والبروفايل والتحليل اتحدّثوا بالوزن الجديد`);
    else toast(`تم تسجيل الوزن ✓ ${d > 0 ? "زاد" : "قل"} ${Math.abs(d)} كجم — ولا يهمك، الأسبوع الجاي أحسن إن شاء الله 💪`);
  } else {
    toast("تم تسجيل الوزن ✓ والبروفايل اتحدّث");
  }
});
$("wtKg").addEventListener("input", e => e.target.classList.remove("invalid"));

$("wtHistory").addEventListener("click", e => {
  const date = e.target.dataset.wdel;
  if (!date) return;
  if (weights.length === 1) { toast("ده التسجيل الوحيد، سجّل وزن جديد الأول"); return; }
  if (!confirm(`حذف تسجيل الوزن بتاع ${formatDate(date)}؟`)) return;
  weights = weights.filter(w => w.date !== date);
  saveWeights();
  syncProfileFromWeights();
  renderWeightTrack();
});

// تفاصيل كل نقطة لما تقف عليها بالماوس أو تلمسها
$("wtChart").addEventListener("pointerover", e => {
  const g = e.target.closest("[data-i]");
  const tip = $("wtTip");
  if (!g || !tip) return;
  const w = weights[+g.dataset.i];
  const dot = g.querySelector(".dot");
  const svg = $("wtChart").querySelector("svg");
  const r = svg.getBoundingClientRect(), scale = r.width / 600;
  tip.textContent = `${formatDate(w.date)} — ${w.kg} كجم`;
  tip.style.left = `${dot.cx.baseVal.value * scale}px`;
  tip.style.top = `${dot.cy.baseVal.value * scale}px`;
  tip.classList.add("show");
});
$("wtChart").addEventListener("pointerout", e => {
  if (e.target.closest("[data-i]")) $("wtTip")?.classList.remove("show");
});
