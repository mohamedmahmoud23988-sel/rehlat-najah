// الداشبورد التفصيلية: صورة كاملة لتقدّمك في المرحلة وفي كل الجوانب

$("fullDashPage").innerHTML = `
  <section class="card aspect-hero fd-hero">
    <button class="back-btn" id="fdBack">→ الرئيسية</button>
    <div class="ah-icon">📊</div>
    <h2 class="ah-name">الداشبورد التفصيلية</h2>
    <p class="ah-stage" id="fdStage"></p>
    <div id="fdTop"></div>
  </section>

  <div class="fd-grid">
    <section class="card ip-card" id="fdBalance"></section>
    <section class="card ip-card" id="fdAttention"></section>
  </div>
  <section class="card ip-card" id="fdTrend"></section>
  <section class="card ip-card" id="fdHeat"></section>
  <section class="card ip-card" id="fdNumbers"></section>
  <div id="fdAspects"></div>`;

// --- حسابات ---
function aspectStats(a) {
  if (!a.items) return null;
  const rows = a.items.filter(it => isOn(a.id, it.id) && hasPage(it)).map(it => ({ it, s: itemSummary(a, it) }));
  const sum = k => rows.reduce((n, r) => n + (r.s[k] || 0), 0);
  const required = sum("required"), done = sum("done");
  return { rows, required, done, late: sum("late"), pct: required ? Math.round((done / required) * 100) : null };
}

// نسبة إنجاز مهام يوم معيّن (من شاشة مهامي النهارده)
function dayPct(d) {
  const p = todayProgress(d);
  return p.total ? p.pct : null;
}

// --- العرض ---
function renderFullDash() {
  document.title = "الداشبورد التفصيلية — رحلة نجاح";
  const page = $("fullDashPage");
  page.style.setProperty("--c", "#0f5c4d");
  page.style.setProperty("--cl", "#e3f1ed");
  const hasStage = !!state.endDate;
  const stage = STAGES[state.stageIndex];
  $("fdStage").innerHTML = hasStage
    ? `المرحلة ${ORDINALS[state.stageIndex]}: <strong>${stage.name}</strong> · من ${formatDate(state.startDate)} لـ ${formatDate(addDays(state.endDate, -1))}`
    : `المرحلة ${ORDINALS[state.stageIndex]}: <strong>${stage.name}</strong> · حدد تاريخ نهاية المرحلة من الرئيسية عشان الأرقام تكمل`;

  const stats = ASPECTS.map(a => ({ a, s: aspectStats(a) })).filter(x => x.s);
  const totReq = stats.reduce((n, x) => n + x.s.required, 0);
  const totDone = stats.reduce((n, x) => n + x.s.done, 0);
  const totLate = stats.reduce((n, x) => n + x.s.late, 0);
  const overall = totReq ? Math.round((totDone / totReq) * 100) : 0;
  const ranked = stats.filter(x => x.s.pct != null).sort((x, y) => y.s.pct - x.s.pct);
  const best = ranked[0], weak = ranked.length > 1 ? ranked[ranked.length - 1] : null;
  const daysTotal = hasStage ? daysBetween(state.startDate, state.endDate) : 0;
  const daysPassed = hasStage ? Math.min(Math.max(daysBetween(state.startDate, todayStr()) + 1, 0), daysTotal) : 0;
  const timePct = daysTotal ? Math.round((daysPassed / daysTotal) * 100) : 0;
  const pace = !hasStage || !totReq ? "" : overall >= timePct
    ? `<p class="fd-pace good">✓ إنجازك (${overall}%) سابق الوقت اللي عدّى من المرحلة (${timePct}%) — ممتاز</p>`
    : `<p class="fd-pace">إنجازك ${overall}% والوقت اللي عدّى من المرحلة ${timePct}% — محتاج تسرّع شوية 💪</p>`;

  $("fdTop").innerHTML = `
    <div class="fd-top">
      ${ringSVG(overall, "إنجاز المرحلة")}
      <div class="fd-tiles">
        <div class="dc-tile"><b>${totDone.toLocaleString("en-US")} من ${totReq.toLocaleString("en-US")}</b><small>مهمة اتعملت في المرحلة</small></div>
        <div class="dc-tile ${totLate ? "warn" : ""}"><b>${totLate ? `⚠ ${totLate}` : "✓ 0"}</b><small>متأخر / فائت</small></div>
        <div class="dc-tile"><b>${best ? `${best.a.icon} ${best.s.pct}%` : "—"}</b><small>${best ? `أقوى جانب: ${best.a.name.replace("الجانب ", "")}` : "أقوى جانب"}</small></div>
        <div class="dc-tile"><b>${weak ? `${weak.a.icon} ${weak.s.pct}%` : "—"}</b><small>${weak ? `محتاج اهتمام: ${weak.a.name.replace("الجانب ", "")}` : "محتاج اهتمام"}</small></div>
        <div class="dc-tile"><b>${hasStage ? `${daysPassed} من ${daysTotal}` : "—"}</b><small>يوم من المرحلة</small></div>
      </div>
    </div>
    ${pace}`;

  renderBalance(stats);
  renderAttention(stats);
  renderTrend();
  renderHeat();
  renderNumbers();
  renderAspectDetails(stats);
}

// توازن الجوانب: عمود لكل جانب بلونه
function renderBalance(stats) {
  const rows = ASPECTS.map(a => ({ a, s: stats.find(x => x.a.id === a.id)?.s }));
  $("fdBalance").innerHTML = `
    <h3 class="ip-title">⚖️ توازن الجوانب الخمسة</h3>
    <p class="hint">نسبة إنجاز كل جانب في المرحلة (من الاختيارات المفعّلة)</p>
    ${rows.map(({ a, s }) => {
      const pct = s?.pct;
      return `
        <div class="fd-bal" title="${a.name}: ${pct != null ? `${s.done} من ${s.required} (${pct}%)` : "مفيش اختيارات مفعّلة"}${s?.late ? ` · ${s.late} متأخر` : ""}">
          <span class="fd-bal-name">${a.icon} ${a.name.replace("الجانب ", "")}</span>
          <span class="fd-bal-track"><span style="width:${pct ?? 0}%;background:${a.color}"></span></span>
          <span class="fd-bal-val">${pct != null ? `${pct}%` : "—"}</span>
        </div>`;
    }).join("")}`;
}

// محتاج اهتمامك: أكتر الاختيارات اللي عليها متأخرات
function renderAttention(stats) {
  const all = stats.flatMap(({ a, s }) => s.rows.map(r => ({ a, ...r })));
  const late = all.filter(r => r.s.late > 0).sort((x, y) => y.s.late - x.s.late).slice(0, 5);
  const streaks = all.filter(r => r.s.streak >= 2).sort((x, y) => y.s.streak - x.s.streak).slice(0, 3);
  $("fdAttention").innerHTML = `
    <h3 class="ip-title">🎯 محتاج اهتمامك</h3>
    ${late.length ? late.map(r => `
      <a class="fd-att" href="#/aspect/${r.a.id}/${r.it.id}">
        <span class="fd-att-i">${r.it.icon}</span>
        <span class="fd-att-t">${r.it.name}<small>${r.a.name}</small></span>
        <b class="fd-late">⚠ ${r.s.late} ${r.s.lateLabel || "متأخر"}</b>
      </a>`).join("") : `<p class="empty-ok">ما شاء الله، مفيش متأخرات 👏</p>`}
    ${streaks.length ? `
      <h4 class="bd-h4">🔥 أطول سلاسل حالية</h4>
      ${streaks.map(r => `<div class="fd-att"><span class="fd-att-i">${r.it.icon}</span><span class="fd-att-t">${r.it.name}<small>${r.a.name}</small></span><b>🔥 ${r.s.streak} يوم</b></div>`).join("")}` : ""}`;
}

// التزامك اليومي: خط لآخر 30 يوم
function renderTrend() {
  const t = todayStr();
  // آخر 30 يوم، بس من أول المرحلة (الأيام اللي قبلها مش محسوبة)
  let first = addDays(t, -29);
  if (state.startDate && state.startDate > first) first = state.startDate;
  const n = Math.max(daysBetween(first, t) + 1, 1);
  const days = Array.from({ length: n }, (_, i) => addDays(first, i));
  const vals = days.map(d => ({ d, v: dayPct(d) }));
  const known = vals.filter(x => x.v != null);
  const title = `📈 التزامك اليومي (${n >= 30 ? "آخر 30 يوم" : `من أول المرحلة · ${n} يوم`})`;
  if (known.length < 2) {
    $("fdTrend").innerHTML = `<h3 class="ip-title">${title}</h3><p class="hint center">لما يبقى عندك مهام كذا يوم، الرسم هيظهر هنا.</p>`;
    return;
  }
  const W = 640, H = 200, pl = 16, pr = 40, pt = 14, pb = 26;
  // اتجاه عربي: الأقدم يمين والأحدث شمال
  const x = i => W - pr - (i / Math.max(n - 1, 1)) * (W - pl - pr);
  const y = v => pt + (1 - v / 100) * (H - pt - pb);
  let path = "", started = false;
  vals.forEach((p, i) => {
    if (p.v == null) { started = false; return; }
    path += `${started ? "L" : "M"}${x(i).toFixed(1)},${y(p.v).toFixed(1)} `;
    started = true;
  });
  const grid = [0, 25, 50, 75, 100].map(v => `
    <line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" />
    <text x="${W - pr + 8}" y="${y(v) + 4}">${v}%</text>`).join("");
  const dots = vals.map((p, i) => p.v == null ? "" : `
    <g><circle class="dot" cx="${x(i)}" cy="${y(p.v)}" r="${p.d === t ? 5.5 : 4}" />
    <circle class="hit" cx="${x(i)}" cy="${y(p.v)}" r="12"><title>${formatDate(p.d)}: ${p.v}%</title></circle></g>`).join("");
  const avg = Math.round(known.reduce((n, p) => n + p.v, 0) / known.length);
  const full = known.filter(p => p.v === 100).length;
  $("fdTrend").innerHTML = `
    <div class="fd-head"><h3 class="ip-title" style="margin:0">${title}</h3>
      <span class="fd-chips"><span>المتوسط <b>${avg}%</b></span><span>أيام كاملة 💯 <b>${full}</b></span></span></div>
    <div class="wt-chart fd-chart">
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="متوسط الالتزام اليومي ${avg}%">
        <g class="grid">${grid}</g>
        <path class="line" d="${path}" />
        ${dots}
        <text class="axis-d" x="${x(0)}" y="${H - 6}" text-anchor="middle">${formatShort(days[0])}</text>
        <text class="axis-d" x="${x(n - 1)}" y="${H - 6}" text-anchor="middle">النهارده</text>
      </svg>
    </div>`;
}

// خريطة أيام المرحلة: كل يوم بلون حسب نسبة إنجازه
function renderHeat() {
  if (!state.endDate) { $("fdHeat").innerHTML = `<h3 class="ip-title">🗓️ خريطة أيام المرحلة</h3><p class="hint center">حدد تاريخ نهاية المرحلة عشان الخريطة تظهر.</p>`; return; }
  const t = todayStr();
  const days = [];
  for (let d = state.startDate; d < state.endDate; d = addDays(d, 1)) days.push(d);
  const lvl = v => v == null ? "na" : v >= 90 ? 4 : v >= 70 ? 3 : v >= 40 ? 2 : v > 0 ? 1 : 0;
  // نبدأ الأسبوع من السبت
  const pad = (weekday(days[0]) + 1) % 7;
  const cells = [...Array(pad).fill(`<span class="fd-cell empty"></span>`), ...days.map(d => {
    const future = d > t;
    const v = future ? null : dayPct(d);
    const [, , dd] = d.split("-").map(Number);
    return `<span class="fd-cell l${future ? "f" : lvl(v)} ${d === t ? "today" : ""}" title="${formatDate(d)}${future ? " — لسه مجاش" : v == null ? " — مفيش مهام" : `: ${v}%`}">${dd}</span>`;
  })].join("");
  $("fdHeat").innerHTML = `
    <h3 class="ip-title">🗓️ خريطة أيام المرحلة</h3>
    <div class="fd-week">${["سبت", "أحد", "اتنين", "تلات", "أربع", "خميس", "جمعة"].map(n => `<span>${n}</span>`).join("")}</div>
    <div class="fd-heat">${cells}</div>
    <div class="fd-legend"><span>إنجاز اليوم:</span>
      <span class="fd-cell l0"></span>0% <span class="fd-cell l1"></span>أقل من 40 <span class="fd-cell l2"></span>40–70 <span class="fd-cell l3"></span>70–90 <span class="fd-cell l4"></span>90+ <span class="fd-cell lna"></span>مفيش مهام</div>`;
}

// أرقام مهمة من الشاشات المختلفة
function renderNumbers() {
  const cards = [];
  if (typeof weights !== "undefined" && weights.length) {
    const ch = +(weights[weights.length - 1].kg - weights[0].kg).toFixed(1);
    cards.push(`<div class="fd-num"><span>⚖️</span><b>${weights[weights.length - 1].kg} كجم</b><small>الوزن الحالي · ${ch < 0 ? `↓ ${-ch}` : ch > 0 ? `↑ ${ch}` : "ثابت"} من البداية</small></div>`);
  }
  const ex = exStats();
  if (ex && ex.kcal) cards.push(`<div class="fd-num"><span>🔥</span><b>${ex.kcal.toLocaleString("en-US")}</b><small>سعر حراري اتحرق في المرحلة (${ex.minutes} دقيقة رياضة)</small></div>`);
  const wk = exWeekStats();
  cards.push(`<div class="fd-num"><span>🏃</span><b>${wk.minutes} / 150</b><small>دقيقة رياضة الأسبوع ده</small></div>`);
  const ps = prayerStats();
  if (ps && ps.required) cards.push(`<div class="fd-num"><span>🕋</span><b>${ps.pct}%</b><small>التزام بالصلاة (${ps.done} من ${ps.required})</small></div>`);
  const b = budgetNow();
  if (b.alloc != null || b.spent) cards.push(`<div class="fd-num"><span>💵</span><b>${num(b.spent)}${b.alloc != null ? ` / ${num(b.alloc)}` : ""}</b><small>جنيه اتصرف الشهر ده${b.alloc != null && b.spent > b.alloc ? " · ⚠ عدّيت الميزانية" : ""}</small></div>`);
  const ys = yearStats();
  if (ys.total) cards.push(`<div class="fd-num"><span>📅</span><b>${ys.done} من ${ys.total}</b><small>أهداف سنة ${curYear()} اتحققت</small></div>`);
  const ms = medsStats();
  if (ms && ms.required) cards.push(`<div class="fd-num"><span>💊</span><b>${ms.pct}%</b><small>التزام بالأدوية</small></div>`);
  const open = [afOpen().length, HOME_TASKS.open().length, WIFE_KIDS.open().length].reduce((n, x) => n + x, 0);
  if (open) cards.push(`<div class="fd-num"><span>📋</span><b>${open}</b><small>شأن عائلي مفتوح</small></div>`);
  $("fdNumbers").innerHTML = `<h3 class="ip-title">🔢 أرقام مهمة</h3><div class="fd-nums">${cards.join("")}</div>`;
}

// تفاصيل كل جانب: كل اختيار بنسبته
function renderAspectDetails(stats) {
  $("fdAspects").innerHTML = stats.map(({ a, s }) => {
    if (!s.rows.length) return `
      <section class="card ip-card fd-asp" style="--c:${a.color};--cl:${a.light}">
        <div class="dc-head"><span class="dc-icon">${a.icon}</span><span class="dc-title">${a.name}</span><span class="dc-sub">مفيش اختيارات مفعّلة</span></div>
      </section>`;
    return `
      <section class="card ip-card fd-asp" style="--c:${a.color};--cl:${a.light}">
        <div class="dc-head">
          <span class="dc-icon">${a.icon}</span>
          <a class="dc-title" href="#/aspect/${a.id}" style="color:inherit;text-decoration:none">${a.name}</a>
          <span class="dc-sub">${s.pct != null ? `${s.pct}% · ${s.done} من ${s.required}` : "—"}</span>
        </div>
        <table class="fd-table">
          <thead><tr><th>الاختيار</th><th>التقدم</th><th>اتعمل</th><th>متأخر</th><th>سلسلة</th></tr></thead>
          <tbody>${s.rows.map(({ it, s: r }) => {
            const p = r.required ? Math.round((r.done / r.required) * 100) : 0;
            return `<tr>
              <td><a href="#/aspect/${a.id}/${it.id}">${it.icon} ${it.short || it.name}</a></td>
              <td><span class="fd-mini"><span style="width:${p}%"></span></span> <b>${p}%</b></td>
              <td>${r.done} / ${r.required}</td>
              <td class="${r.late ? "fd-late" : ""}">${r.late || "—"}</td>
              <td>${r.streak ? `🔥 ${r.streak}` : "—"}</td>
            </tr>`;
          }).join("")}</tbody>
        </table>
      </section>`;
  }).join("");
}

$("fdBack").addEventListener("click", () => { location.hash = "#/"; });
