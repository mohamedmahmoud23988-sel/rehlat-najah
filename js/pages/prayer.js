// صفحة الصلاة: المواقيت والصلوات الخمس والفائتة

// ================== الصلاة ==================
const PRAYERS = [
  { id: "fajr",    name: "الفجر",  icon: "🌄", msg: "«ركعتا الفجر خيرٌ من الدنيا وما فيها» — بداية مباركة ليومك" },
  { id: "dhuhr",   name: "الظهر",  icon: "☀️", msg: "صلّيت الظهر في وقتها، ربنا يبارك في باقي يومك" },
  { id: "asr",     name: "العصر",  icon: "🌤️", msg: "«من صلّى البردين دخل الجنة» — ما شاء الله حافظت على العصر" },
  { id: "maghrib", name: "المغرب", icon: "🌇", msg: "صلّيت المغرب، ربنا يتقبّل منك ويختم يومك بالخير" },
  { id: "isha",    name: "العشاء", icon: "🌃", msg: "«من صلّى العشاء في جماعة فكأنما قام نصف الليل» — ربنا يتقبّل منك" },
];

// --- حساب المواقيت (فلكياً على الجهاز) ---
const METHODS = {
  egypt: { fajr: 19.5, isha: 17.5 },   // الهيئة المصرية العامة للمساحة
  uq:    { fajr: 18.5, ishaMin: 90 },  // أم القرى
};
const CITIES = [
  { id: "cairo", name: "القاهرة", lat: 30.0444, lng: 31.2357, method: "egypt" },
  { id: "giza", name: "الجيزة", lat: 30.0131, lng: 31.2089, method: "egypt" },
  { id: "alex", name: "الإسكندرية", lat: 31.2001, lng: 29.9187, method: "egypt" },
  { id: "qalyub", name: "بنها", lat: 30.4660, lng: 31.1848, method: "egypt" },
  { id: "mansoura", name: "المنصورة", lat: 31.0409, lng: 31.3785, method: "egypt" },
  { id: "tanta", name: "طنطا", lat: 30.7865, lng: 31.0004, method: "egypt" },
  { id: "zagazig", name: "الزقازيق", lat: 30.5877, lng: 31.5020, method: "egypt" },
  { id: "shebin", name: "شبين الكوم", lat: 30.5590, lng: 31.0100, method: "egypt" },
  { id: "damanhur", name: "دمنهور", lat: 31.0341, lng: 30.4682, method: "egypt" },
  { id: "kafr", name: "كفر الشيخ", lat: 31.1107, lng: 30.9388, method: "egypt" },
  { id: "damietta", name: "دمياط", lat: 31.4175, lng: 31.8144, method: "egypt" },
  { id: "portsaid", name: "بورسعيد", lat: 31.2653, lng: 32.3019, method: "egypt" },
  { id: "ismailia", name: "الإسماعيلية", lat: 30.5965, lng: 32.2715, method: "egypt" },
  { id: "suez", name: "السويس", lat: 29.9668, lng: 32.5498, method: "egypt" },
  { id: "fayoum", name: "الفيوم", lat: 29.3084, lng: 30.8428, method: "egypt" },
  { id: "benisuef", name: "بني سويف", lat: 29.0661, lng: 31.0994, method: "egypt" },
  { id: "minya", name: "المنيا", lat: 28.1099, lng: 30.7503, method: "egypt" },
  { id: "asyut", name: "أسيوط", lat: 27.1783, lng: 31.1859, method: "egypt" },
  { id: "sohag", name: "سوهاج", lat: 26.5591, lng: 31.6957, method: "egypt" },
  { id: "qena", name: "قنا", lat: 26.1551, lng: 32.7160, method: "egypt" },
  { id: "luxor", name: "الأقصر", lat: 25.6872, lng: 32.6396, method: "egypt" },
  { id: "aswan", name: "أسوان", lat: 24.0889, lng: 32.8998, method: "egypt" },
  { id: "hurghada", name: "الغردقة", lat: 27.2579, lng: 33.8116, method: "egypt" },
  { id: "sharm", name: "شرم الشيخ", lat: 27.9158, lng: 34.3300, method: "egypt" },
  { id: "makkah", name: "مكة المكرمة", lat: 21.3891, lng: 39.8579, method: "uq" },
  { id: "madinah", name: "المدينة المنورة", lat: 24.5247, lng: 39.5692, method: "uq" },
  { id: "riyadh", name: "الرياض", lat: 24.7136, lng: 46.6753, method: "uq" },
  { id: "jeddah", name: "جدة", lat: 21.4858, lng: 39.1925, method: "uq" },
  { id: "dammam", name: "الدمام", lat: 26.4207, lng: 50.0888, method: "uq" },
];
const LOC_KEY = "rehlatNajah.location";
let prayerLoc = (() => {
  try { return JSON.parse(localStorage.getItem(LOC_KEY)) || { id: "cairo" }; } catch { return { id: "cairo" }; }
})();
function currentLocation() {
  if (prayerLoc.id === "gps") return { ...prayerLoc, method: "egypt" };
  return CITIES.find(c => c.id === prayerLoc.id) || CITIES[0];
}

const rad = d => d * Math.PI / 180;
const deg = r => r * 180 / Math.PI;

// بترجع المواقيت بالدقايق من نص الليل
function computePrayerTimes(dateStr, loc) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const tz = -new Date(y, m - 1, d, 12).getTimezoneOffset() / 60;
  let Y = y, M = m;
  if (M <= 2) { Y--; M += 12; }
  const A = Math.floor(Y / 100), B = 2 - A + Math.floor(A / 4);
  const jd = Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + d + B - 1524.5;

  // موقع الشمس
  const D = jd + 0.5 - loc.lng / 360 - 2451545.0;
  const g = rad((357.529 + 0.98560028 * D) % 360);
  const q = (280.459 + 0.98564736 * D) % 360;
  const L = rad((q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) % 360);
  const e = rad(23.439 - 0.00000036 * D);
  let RA = deg(Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L))) / 15;
  RA = ((RA % 24) + 24) % 24;
  let eqt = q / 15 - RA;
  eqt -= 24 * Math.round(eqt / 24);
  const decl = Math.asin(Math.sin(e) * Math.sin(L));
  const phi = rad(loc.lat);

  const dhuhr = 12 + tz - loc.lng / 15 - eqt;
  const hourAngle = alt =>
    deg(Math.acos((Math.sin(rad(alt)) - Math.sin(phi) * Math.sin(decl)) / (Math.cos(phi) * Math.cos(decl)))) / 15;
  const asrAlt = deg(Math.atan(1 / (1 + Math.tan(Math.abs(phi - decl)))));
  const method = METHODS[loc.method] || METHODS.egypt;

  const sunrise = dhuhr - hourAngle(-0.833);
  const maghrib = dhuhr + hourAngle(-0.833);
  const h = {
    fajr: dhuhr - hourAngle(-method.fajr),
    sunrise,
    dhuhr: dhuhr + 2 / 60, // احتياط دقيقتين بعد الزوال
    asr: dhuhr + hourAngle(asrAlt),
    maghrib,
    isha: method.ishaMin ? maghrib + method.ishaMin / 60 : dhuhr + hourAngle(-method.isha),
  };
  const out = {};
  for (const k in h) out[k] = Math.round(h[k] * 60);
  return out;
}

function fmtTime(min) {
  let hh = Math.floor(min / 60) % 24;
  const mm = String(min % 60).padStart(2, "0");
  const suffix = hh < 12 ? "ص" : "م";
  hh = hh % 12 || 12;
  return `${hh}:${mm} ${suffix}`;
}
function fmtDuration(min) {
  const h = Math.floor(min / 60), m = min % 60;
  if (h && m) return `${h} س ${m} د`;
  if (h) return `${h} ساعة`;
  return `${m} دقيقة`;
}
const nowMinutes = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };

// --- سجل الصلوات: logData["religious.salah"]["2026-11-16"] = { fajr: "ontime", ... } ---
const SALAH_KEY = "religious.salah";
function prayerDay(date) {
  const v = logData[SALAH_KEY]?.[date];
  return v && typeof v === "object" ? v : {};
}
function setPrayer(date, prayerId, value) {
  const all = (logData[SALAH_KEY] ??= {});
  const day = (typeof all[date] === "object" && all[date]) || (all[date] = {});
  day[prayerId] = value;
  saveLog();
}
function prayersDoneCount(date) {
  const day = prayerDay(date);
  return PRAYERS.filter(p => day[p.id]).length;
}

// حالة كل صلاة النهارده: done / current / missed / upcoming
function todayPrayerStatus() {
  const today = todayStr();
  const t = computePrayerTimes(today, currentLocation());
  const now = nowMinutes();
  const day = prayerDay(today);
  const ends = { fajr: t.sunrise, dhuhr: t.asr, asr: t.maghrib, maghrib: t.isha, isha: 24 * 60 };
  const open = inJourney(today); // برّه أيام الرحلة: الصلوات مقفولة
  return PRAYERS.map(p => {
    let status;
    if (day[p.id]) status = "done";
    else if (!open) status = "notyet";
    else if (now < t[p.id]) status = "upcoming";
    else if (now >= ends[p.id]) status = "missed";
    else status = "current";
    return { ...p, time: t[p.id], status, value: day[p.id] };
  });
}

function prayerStats() {
  if (!state.endDate) return null;
  const start = trackingStart("religious", "salah");
  const end = state.endDate;
  const today = todayStr();
  const days = Math.max(daysBetween(start, end), 0);
  const required = days * 5;
  let done = 0;
  const missedDays = [];
  for (let d = start; d < end; d = addDays(d, 1)) {
    const day = prayerDay(d);
    done += PRAYERS.filter(p => day[p.id]).length;
    if (d < today) {
      const miss = PRAYERS.filter(p => !day[p.id]);
      if (miss.length) missedDays.push({ date: d, prayers: miss });
    }
  }
  const todayIn = today >= start && today < end;
  const todayMissed = todayIn ? todayPrayerStatus().filter(p => p.status === "missed").length : 0;
  const missedCount = missedDays.reduce((s, x) => s + x.prayers.length, 0) + todayMissed;
  const remaining = Math.max(required - done - missedCount, 0);
  const pct = required ? Math.round((done / required) * 100) : 0;
  return { required, done, missedCount, remaining, pct, missedDays: missedDays.reverse() };
}

function prayerStreak() {
  let d = todayStr();
  if (prayersDoneCount(d) < 5) d = addDays(d, -1);
  let n = 0;
  while (prayersDoneCount(d) === 5) { n++; d = addDays(d, -1); }
  return n;
}

// --- العرض ---
function renderCityOptions() {
  let opts = "";
  if (prayerLoc.id === "gps") opts += `<option value="gps">موقعي الحالي</option>`;
  opts += CITIES.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
  $("prCity").innerHTML = opts;
  $("prCity").value = prayerLoc.id;
}

function renderPrayerPage() {
  const aspect = ASPECTS.find(a => a.id === "religious");
  currentAspect = aspect;
  const page = $("prayerPage");
  page.style.setProperty("--c", aspect.color);
  page.style.setProperty("--cl", aspect.light);
  document.title = "الصلاة — رحلة نجاح";

  $("prStage").innerHTML = `${aspect.name} · المرحلة ${ORDINALS[state.stageIndex]}: <strong>${STAGES[state.stageIndex].name}</strong>`;
  const streak = prayerStreak();
  $("prStreak").textContent = streak >= 2 ? `🔥 ${streak} أيام متواصلة صلّيت فيهم الخمس صلوات` : "";
  $("prDate").textContent = formatDate(todayStr());
  if ($("prCity").value !== prayerLoc.id) renderCityOptions();

  // الصلاة الجاية
  const list = todayPrayerStatus();
  const now = nowMinutes();
  const next = list.find(p => p.time > now);
  if (next) {
    $("prNext").innerHTML = `<span>الصلاة الجاية: <strong>${next.name}</strong> الساعة ${fmtTime(next.time)}</span><span class="cd">بعد ${fmtDuration(next.time - now)}</span>`;
  } else {
    const tFajr = computePrayerTimes(addDays(todayStr(), 1), currentLocation()).fajr;
    $("prNext").innerHTML = `<span>الصلاة الجاية: <strong>الفجر</strong> بكرة الساعة ${fmtTime(tFajr)}</span>`;
  }

  // الصلوات الخمس
  const tags = {
    done: p => (p.value === "late" ? "✓ اتقضت" : "✓ صلّيتها"),
    current: () => "وقتها دلوقتي",
    missed: () => "صلاة فائتة",
    upcoming: p => `بعد ${fmtDuration(p.time - now)}`,
    notyet: () => "⏳ الرحلة لسه مبدأتش",
  };
  $("prList").innerHTML = list.map(p => `
    <div class="pr-row ${p.status}">
      <span class="pr-icon">${p.icon}</span>
      <span class="pr-info">
        <span class="pr-name">${p.name}</span>
        <span class="pr-time">${fmtTime(p.time)}</span>
      </span>
      <span class="pr-tag">${tags[p.status](p)}</span>
      <label class="pr-check" aria-label="صلّيت ${p.name}">
        <input type="checkbox" data-p="${p.id}" ${p.status === "done" ? "checked disabled" : ""} ${p.status === "upcoming" || p.status === "notyet" ? "disabled" : ""} />
        <span class="bc-box">✓</span>
      </label>
    </div>`).join("");

  const doneCount = list.filter(p => p.status === "done").length;
  $("prAllDone").textContent = doneCount === 5 ? "🏆 أتممت صلواتك الخمس النهارده، ربنا يتقبّل منك"
    : !inJourney() ? outOfJourneyMsg() : "";

  // التقدم
  const s = prayerStats();
  if (!s) {
    $("prProgress").innerHTML = `<p class="hint center">حدد تاريخ نهاية المرحلة من الصفحة الرئيسية عشان نحسب تقدّمك 📅</p>`;
    $("prMissed").innerHTML = `<p class="hint center">—</p>`;
    $("prMissedCount").textContent = "";
    return;
  }
  $("prProgress").innerHTML = `
    <div class="ip-stats">
      <div class="ip-stat"><b>${s.required}</b><small>صلاة مطلوبة</small></div>
      <div class="ip-stat done"><b>${s.done}</b><small>صلّيتها</small></div>
      <div class="ip-stat late"><b>${s.missedCount}</b><small>فائتة</small></div>
      <div class="ip-stat"><b>${s.remaining}</b><small>متبقي</small></div>
    </div>
    <div class="ip-progress"><div style="width:${s.pct}%"></div></div>
    <div class="ip-pct"><span>${s.done} من ${s.required} صلاة (5 × ${s.required / 5} يوم)</span><strong>${s.pct}%</strong></div>`;

  // الفائتة من الأيام اللي فاتت
  const prevCount = s.missedDays.reduce((n, x) => n + x.prayers.length, 0);
  $("prMissedCount").textContent = prevCount || "";
  $("prMissed").innerHTML = s.missedDays.length
    ? s.missedDays.map(day => `
        <div class="mg">
          <div class="mg-date">${formatDate(day.date)}</div>
          <div class="mg-items">
            ${day.prayers.map(p => `
              <label class="mg-item">
                <input type="checkbox" data-date="${day.date}" data-p="${p.id}" />
                ${p.name} · صلاة فائتة
              </label>`).join("")}
          </div>
        </div>`).join("")
    : `<p class="empty-ok">ما شاء الله، مفيش صلوات فائتة من الأيام اللي فاتت 👏</p>`;
}

// --- الأحداث ---
$("prList").addEventListener("change", e => {
  const input = e.target;
  if (!input.checked) return;
  const id = input.dataset.p;
  const p = todayPrayerStatus().find(x => x.id === id);
  if (!p || p.status === "upcoming" || p.status === "done" || p.status === "notyet") { renderPrayerPage(); if (p?.status === "notyet") toast(outOfJourneyMsg()); return; }
  setPrayer(todayStr(), id, p.status === "missed" ? "late" : "ontime");
  renderPrayerPage();

  if (prayersDoneCount(todayStr()) === 5) {
    celebrate("🏆", "ما شاء الله! أتممت صلواتك الخمس النهارده 🎉 «إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا» — ربنا يتقبّل منك");
  } else if (p.status === "missed") {
    celebrate("👍", `أحسنت إنك قضيت صلاة ${p.name}، ربنا يتقبّل منك ويعينك تصلّي الجاية في وقتها`);
  } else {
    celebrate(p.icon, p.msg);
  }
});

$("prMissed").addEventListener("change", e => {
  const { date, p } = e.target.dataset;
  if (!date || !e.target.checked) return;
  setPrayer(date, p, "late");
  const name = PRAYERS.find(x => x.id === p).name;
  toast(`أحسنت 👍 اتسجّل قضاء ${name} يوم ${formatDate(date)}`);
  renderPrayerPage();
});

$("prCity").addEventListener("change", e => {
  prayerLoc = e.target.value === "gps" ? prayerLoc : { id: e.target.value };
  try { localStorage.setItem(LOC_KEY, JSON.stringify(prayerLoc)); } catch {}
  renderCityOptions();
  renderPrayerPage();
});

$("prLocate").addEventListener("click", () => {
  if (!navigator.geolocation) { toast("الجهاز ده مش بيدعم تحديد الموقع، اختار مدينتك من القائمة"); return; }
  toast("بحدد موقعك…");
  navigator.geolocation.getCurrentPosition(
    pos => {
      prayerLoc = { id: "gps", lat: pos.coords.latitude, lng: pos.coords.longitude };
      try { localStorage.setItem(LOC_KEY, JSON.stringify(prayerLoc)); } catch {}
      renderCityOptions();
      renderPrayerPage();
      toast("تم تحديد موقعك وظبطت المواقيت عليه 📍");
    },
    () => toast("مقدرتش أحدد موقعك، اختار مدينتك من القائمة"),
    { timeout: 10000 }
  );
});

$("prayerBackBtn").addEventListener("click", () => { location.hash = "#/aspect/religious"; });


// تحديث العدّاد وحالات الصلوات كل 30 ثانية
setInterval(() => { if ($("prayerPage").classList.contains("show")) renderPrayerPage(); }, 30 * 1000);

