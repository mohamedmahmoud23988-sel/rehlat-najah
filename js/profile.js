// البروفايل الشخصي والتحليلات والشريط الجانبي

// ================== البروفايل الشخصي ==================
const PROFILE_KEY = "rehlatNajah.profile";

function loadProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY)); } catch { return null; }
}
function saveProfile(p) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); return true; }
  catch { return false; }
}

let profile = loadProfile();
let pendingPhoto = null; // صورة اتختارت في الفورم ولسه ما اتحفظتش

// --- حسابات ---
function calcAge(birth) {
  const [by, bm, bd] = birth.split("-").map(Number);
  const now = new Date();
  let y = now.getFullYear() - by;
  let m = now.getMonth() + 1 - bm;
  let d = now.getDate() - bd;
  if (d < 0) { m--; d += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
  if (m < 0) { y--; m += 12; }
  const totalDays = daysBetween(birth, todayStr());

  // عيد الميلاد الجاي
  let next = new Date(now.getFullYear(), bm - 1, bd);
  const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (next < today0) next = new Date(now.getFullYear() + 1, bm - 1, bd);
  const toBirthday = Math.round((next - today0) / 86400000);

  return { y, m, d, totalDays, toBirthday };
}

function bmiCategory(bmi) {
  if (bmi < 18.5) return { name: "نحافة",              level: "warn" };
  if (bmi < 25)   return { name: "وزن طبيعي 👌",        level: "good" };
  if (bmi < 30)   return { name: "زيادة في الوزن",      level: "warn" };
  if (bmi < 35)   return { name: "سمنة درجة أولى",      level: "bad"  };
  if (bmi < 40)   return { name: "سمنة درجة ثانية",     level: "bad"  };
  return               { name: "سمنة مفرطة",           level: "bad"  };
}

function analyze(p) {
  const age = calcAge(p.birthDate);
  const h = p.height / 100;
  const bmi = p.weight / (h * h);
  const cat = bmiCategory(bmi);
  const minW = 18.5 * h * h;
  const maxW = 24.9 * h * h;
  const idealW = 22 * h * h;

  // السعرات (معادلة Mifflin-St Jeor)
  const bmr = 10 * p.weight + 6.25 * p.height - 5 * age.y + (p.gender === "male" ? 5 : -161);
  const tdee = bmr * Number(p.activity || 1.375);
  const minCal = p.gender === "male" ? 1500 : 1200;

  return { age, bmi, cat, minW, maxW, idealW, bmr, tdee, minCal };
}

const fmt = n => Math.round(n).toLocaleString("en-US");
const fmt1 = n => (Math.round(n * 10) / 10).toString();

// --- العرض ---
function setAvatar(el, photo, name) {
  if (photo) {
    el.style.backgroundImage = `url(${photo})`;
    el.textContent = "";
  } else {
    el.style.backgroundImage = "";
    el.textContent = name ? name.trim().charAt(0) : "👤";
  }
}

function renderHeader() {
  if (profile) {
    const first = profile.name.trim().split(/\s+/)[0];
    $("headerGreet").textContent = "أهلاً";
    $("headerName").textContent = first;
    setAvatar($("headerAvatar"), profile.photo, profile.name);
  } else {
    $("headerGreet").textContent = "أهلاً بيك";
    $("headerName").textContent = "سجّل بياناتك";
    setAvatar($("headerAvatar"), null, null);
  }
}

function renderProfileView() {
  const p = profile;
  const a = analyze(p);

  setAvatar($("pvAvatar"), p.photo, p.name);
  $("pvName").textContent = p.name;
  $("pvEmail").textContent = p.email || currentUser()?.email || "";
  $("pvExtra").innerHTML = extraSummaryHTML(p);
  $("pvAgeYears").textContent = a.age.y;
  $("pvWeight").textContent = fmt1(p.weight);
  $("pvHeight").textContent = p.height;

  // العمر
  $("ageBox").innerHTML = `
    <p>عمرك <strong>${a.age.y}</strong> سنة و <strong>${a.age.m}</strong> شهر و <strong>${a.age.d}</strong> يوم</p>
    <p class="muted">يعني عشت حوالي ${fmt(a.age.totalDays)} يوم 🌿</p>
    <p class="muted">${a.age.toBirthday === 0 ? "🎉 النهارده عيد ميلادك! كل سنة وإنت طيب" : `باقي ${a.age.toBirthday} يوم على عيد ميلادك`}</p>`;

  // BMI
  $("bmiValue").textContent = fmt1(a.bmi);
  const pos = Math.min(Math.max((a.bmi - 15) / 25, 0), 1) * 100;
  $("bmiMarker").style.left = pos + "%";
  $("bmiCat").textContent = a.cat.name;
  $("bmiCat").style.color = { good: "#1e7a46", warn: "#9a5b00", bad: "#a93226" }[a.cat.level];

  let advice;
  const range = `<p class="muted">الوزن الطبيعي لطولك: من <strong>${fmt1(a.minW)}</strong> لـ <strong>${fmt1(a.maxW)}</strong> كجم — والمثالي حوالي <strong>${fmt1(a.idealW)}</strong> كجم</p>`;
  if (a.bmi >= 25) {
    const toNormal = p.weight - a.maxW;
    const toIdeal = p.weight - a.idealW;
    const weeksMin = Math.ceil(toNormal / 1);
    const weeksMax = Math.ceil(toNormal / 0.5);
    advice = `<div class="advice ${a.cat.level}">
      <p><strong>محتاج حمية غذائية.</strong></p>
      <p>محتاج تخس حوالي <strong>${fmt1(toNormal)} كجم</strong> عشان توصل للوزن الطبيعي، و <strong>${fmt1(toIdeal)} كجم</strong> عشان توصل للوزن المثالي.</p>
      <p>بمعدل آمن (نص كيلو لكيلو في الأسبوع) هتوصل للوزن الطبيعي في حوالي <strong>${weeksMin} – ${weeksMax} أسبوع</strong>.</p>
    </div>`;
  } else if (a.bmi < 18.5) {
    advice = `<div class="advice warn">
      <p><strong>محتاج تزوّد وزنك.</strong></p>
      <p>محتاج تزيد حوالي <strong>${fmt1(a.minW - p.weight)} كجم</strong> عشان توصل للوزن الطبيعي.</p>
    </div>`;
  } else {
    advice = `<div class="advice good">
      <p><strong>وزنك ممتاز ومش محتاج حمية.</strong> حافظ عليه بالأكل الصحي والرياضة 💚</p>
    </div>`;
  }
  $("weightAdvice").innerHTML = range + advice;

  // الاحتياجات اليومية
  const water = p.weight * 0.033;
  let needs = `
    <div class="need"><span class="n-icon">💧</span><span class="n-val">${fmt1(water)} لتر</span><span class="n-label">مياه في اليوم (حوالي ${Math.round(water / 0.25)} كوباية)</span></div>
    <div class="need"><span class="n-icon">🔥</span><span class="n-val">${fmt(a.tdee)}</span><span class="n-label">سعر حراري للحفاظ على وزنك</span></div>`;
  if (a.bmi >= 25) {
    const target = Math.max(a.tdee - 500, a.minCal);
    needs += `<div class="need" style="grid-column:1/-1;background:#fdf2e0"><span class="n-icon">🥗</span><span class="n-val">${fmt(target)} سعر حراري</span><span class="n-label">هدفك اليومي عشان تخس حوالي نص كيلو في الأسبوع</span></div>`;
  } else if (a.bmi < 18.5) {
    needs += `<div class="need" style="grid-column:1/-1;background:#e3f0f9"><span class="n-icon">🍗</span><span class="n-val">${fmt(a.tdee + 400)} سعر حراري</span><span class="n-label">هدفك اليومي عشان تزوّد وزنك تدريجياً</span></div>`;
  }
  $("needsBox").innerHTML = needs;
}

// --- الشريط الجانبي ---
const SIDEBAR_PREF = "rehlatNajah.sidebarHidden";
const desktopMQ = window.matchMedia("(min-width: 1024px)");
const isDesktop = () => desktopMQ.matches;

function setDesktopHidden(hidden) {
  document.body.classList.toggle("sidebar-hidden", hidden);
  try { localStorage.setItem(SIDEBAR_PREF, hidden ? "1" : "0"); } catch {}
}
function openDrawer() {
  $("profileSidebar").classList.add("open");
  $("sidebarBackdrop").classList.add("show");
  document.body.style.overflow = "hidden";
}
function closeDrawer() {
  $("profileSidebar").classList.remove("open");
  $("sidebarBackdrop").classList.remove("show");
  document.body.style.overflow = "";
}
function toggleSidebar() {
  if (isDesktop()) setDesktopHidden(!document.body.classList.contains("sidebar-hidden"));
  else openDrawer();
}
function hideSidebar() {
  if (isDesktop()) setDesktopHidden(true);
  else closeDrawer();
}
function showProfileSection(which) {
  $("profileView").classList.toggle("show", which === "view");
  $("profileForm").classList.toggle("show", which === "form");
  $("profileSidebar").scrollTop = 0;
}
function initSidebar() {
  if (!CURRENT_UID) return; // لسه محدش داخل — شاشة الدخول هي اللي ظاهرة
  let hidden = false;
  try { hidden = localStorage.getItem(SIDEBAR_PREF) === "1"; } catch {}
  if (profile) {
    if (hidden) document.body.classList.add("sidebar-hidden");
    renderProfileView();
    showProfileSection("view");
  } else {
    showProfileForm();
    if (!isDesktop()) openDrawer(); // أول مرة على الموبايل
  }
}
// لو الشاشة اتغير حجمها، اقفل الدرج بتاع الموبايل
desktopMQ.addEventListener("change", closeDrawer);

function showProfileForm() {
  const p = profile || {};
  $("pName").value = p.name || "";
  $("pBirth").value = p.birthDate || "";
  $("pGender").value = p.gender || "";
  $("pEmail").value = p.email || "";
  $("pWeight").value = p.weight || "";
  $("pHeight").value = p.height || "";
  $("pActivity").value = p.activity || "1.375";
  if (!p.email && currentUser()) $("pEmail").value = currentUser().email;
  fillExtraFields("p", p);
  $("pBirth").max = todayStr();
  pendingPhoto = p.photo || null;
  setAvatar($("formAvatar"), pendingPhoto, p.name);
  $("profileError").textContent = "";
  document.querySelectorAll("#profileForm .invalid").forEach(el => el.classList.remove("invalid"));
  $("cancelEditBtn").style.display = profile ? "" : "none";
  showProfileSection("form");
}

// تصغير الصورة وقصّها مربع عشان تتحفظ بحجم صغير
function resizeImage(file, size = 256) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      canvas.getContext("2d").drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(); };
    img.src = url;
  });
}

$("photoInput").addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    pendingPhoto = await resizeImage(file);
    setAvatar($("formAvatar"), pendingPhoto);
  } catch {
    toast("مش قادر أفتح الصورة دي، جرّب صورة تانية");
  }
  e.target.value = "";
});

$("profileForm").addEventListener("submit", e => {
  e.preventDefault();
  const fields = ["pName", "pBirth", "pGender", "pWeight", "pHeight"];
  let ok = true;
  fields.forEach(id => {
    const el = $(id);
    const bad = !el.value.trim();
    el.classList.toggle("invalid", bad);
    if (bad) ok = false;
  });
  if (!ok) { $("profileError").textContent = "من فضلك كمّل الخانات المطلوبة (*)"; return; }

  const email = $("pEmail").value.trim();
  const weight = parseFloat($("pWeight").value);
  const height = parseFloat($("pHeight").value);
  const birth = $("pBirth").value;

  let err = "";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err = "الإيميل مش مكتوب صح"; $("pEmail").classList.add("invalid"); }
  else if (weight < 20 || weight > 300) { err = "الوزن لازم يكون بين 20 و 300 كجم"; $("pWeight").classList.add("invalid"); }
  else if (height < 80 || height > 250) { err = "الطول لازم يكون بين 80 و 250 سم"; $("pHeight").classList.add("invalid"); }
  else if (daysBetween(birth, todayStr()) < 365) { err = "تاريخ الميلاد مش منطقي"; $("pBirth").classList.add("invalid"); }
  if (err) { $("profileError").textContent = err; return; }

  // الإيميل هو إيميل الدخول كمان
  if (CURRENT_UID && email && email.toLowerCase() !== currentUser()?.email) {
    try { changeEmail(email); } catch (ex) { $("profileError").textContent = ex.message; $("pEmail").classList.add("invalid"); return; }
  }

  const isNew = !profile;
  const updated = {
    name: $("pName").value.trim(),
    birthDate: birth,
    gender: $("pGender").value,
    email: email || currentUser()?.email || "",
    weight,
    height,
    activity: $("pActivity").value,
    photo: pendingPhoto,
    ...readExtraFields("p"),
  };
  if (!saveProfile(updated)) { $("profileError").textContent = "حصلت مشكلة في الحفظ، جرّب صورة أصغر"; return; }
  profile = updated;
  onProfileWeightSaved(updated.weight); // يتسجّل في متابعة الوزن
  renderHeader();
  renderProfileView();
  showProfileSection("view");
  onProfileChanged();
  toast(isNew ? `أهلاً بيك يا ${profile.name.split(/\s+/)[0]} 🌟` : "تم حفظ التعديلات ✓");
});

// الشاشات اللي بتعتمد على بيانات البروفايل (الاهتمامات، الأولاد، الوظيفة) بتتحدّث هنا
const profileListeners = [];
function onProfileChanged() {
  profileListeners.forEach(fn => { try { fn(); } catch {} });
  if (typeof route === "function") route();
}

// حقول البروفايل الإضافية
$("pExtraGrid").innerHTML = extraFieldsHTML("p");
bindExtraFields("p");

// امسح علامة الغلط أول ما يكتب
$("profileForm").addEventListener("input", e => e.target.classList.remove("invalid"));

$("profileBtn").addEventListener("click", toggleSidebar);
$("editProfileBtn").addEventListener("click", showProfileForm);
$("cancelEditBtn").addEventListener("click", () => { renderProfileView(); showProfileSection("view"); });
$("closeProfile").addEventListener("click", hideSidebar);
$("sidebarBackdrop").addEventListener("click", closeDrawer);
document.addEventListener("keydown", e => { if (e.key === "Escape" && !isDesktop()) closeDrawer(); });


