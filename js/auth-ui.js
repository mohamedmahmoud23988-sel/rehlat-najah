// شاشة الدخول والتسجيل (بتظهر لو مفيش حد داخل)

if (!CURRENT_UID) {
  const gate = document.createElement("div");
  gate.id = "authGate";
  gate.innerHTML = `
    <div class="auth-wrap">
      <div class="auth-brand">
        <span class="auth-logo">🧭</span>
        <h1>رحلة نجاح</h1>
        <p>رحلتك في الجوانب الخمسة: الديني، الصحي، العائلي، العملي، والشخصي</p>
      </div>

      <!-- الدخول -->
      <form class="card auth-card" id="loginForm" novalidate>
        <h2>تسجيل الدخول</h2>
        <div class="f">
          <label for="liEmail">الإيميل</label>
          <input id="liEmail" type="email" dir="ltr" autocomplete="email" />
        </div>
        <div class="f">
          <label for="liPass">الباسورد</label>
          <input id="liPass" type="password" dir="ltr" autocomplete="current-password" />
        </div>
        <p class="error" id="liError"></p>
        <button type="submit" class="btn btn-primary btn-block">دخول</button>
        <p class="auth-switch">مستخدم جديد؟ <button type="button" class="auth-link" id="toRegister">سجّل حساب جديد</button></p>
      </form>

      <!-- التسجيل -->
      <form class="card auth-card auth-register" id="registerForm" novalidate hidden>
        <h2>حساب جديد</h2>
        <p class="hint">البيانات دي هي البروفايل بتاعك، والبرنامج هيستخدمها عشان يتظبط على مقاسك.</p>
        <div class="photo-pick">
          <label for="rgPhoto" class="photo-label">
            <span class="avatar avatar-lg" id="rgAvatar">👤</span>
            <span class="photo-hint">📷 اختار صورة (اختياري)</span>
          </label>
          <input type="file" id="rgPhoto" accept="image/*" hidden />
        </div>
        <h3 class="auth-sec">🔐 بيانات الدخول</h3>
        <div class="form-grid">
          <div class="f full"><label for="rgEmail">الإيميل *</label><input id="rgEmail" type="email" dir="ltr" autocomplete="email" /></div>
          <div class="f"><label for="rgPass">الباسورد * <small class="muted">(6 حروف أو أكتر)</small></label><input id="rgPass" type="password" dir="ltr" autocomplete="new-password" /></div>
          <div class="f"><label for="rgPass2">تأكيد الباسورد *</label><input id="rgPass2" type="password" dir="ltr" autocomplete="new-password" /></div>
        </div>
        <h3 class="auth-sec">👤 بياناتك الشخصية</h3>
        <div class="form-grid">
          <div class="f full"><label for="rgName">الاسم *</label><input id="rgName" type="text" /></div>
          <div class="f"><label for="rgBirth">تاريخ الميلاد *</label><input id="rgBirth" type="date" /></div>
          <div class="f">
            <label for="rgGender">النوع *</label>
            <select id="rgGender"><option value="">اختار…</option><option value="male">ذكر</option><option value="female">أنثى</option></select>
          </div>
          ${extraFieldsHTML("rg")}
        </div>
        <h3 class="auth-sec">💪 بياناتك الصحية</h3>
        <div class="form-grid">
          <div class="f"><label for="rgWeight">الوزن (كجم) *</label><input id="rgWeight" type="number" min="20" max="300" step="0.1" /></div>
          <div class="f"><label for="rgHeight">الطول (سم) *</label><input id="rgHeight" type="number" min="80" max="250" /></div>
          <div class="f full">
            <label for="rgActivity">مستوى النشاط</label>
            <select id="rgActivity">
              <option value="1.2">قليل جداً (شغل مكتبي من غير رياضة)</option>
              <option value="1.375" selected>خفيف (رياضة 1-3 أيام في الأسبوع)</option>
              <option value="1.55">متوسط (رياضة 3-5 أيام في الأسبوع)</option>
              <option value="1.725">عالي (رياضة 6-7 أيام في الأسبوع)</option>
            </select>
          </div>
        </div>
        <p class="error" id="rgError"></p>
        <button type="submit" class="btn btn-primary btn-block" id="rgSubmit">إنشاء الحساب 🚀</button>
        <p class="auth-switch">عندك حساب؟ <button type="button" class="auth-link" id="toLogin">ادخل</button></p>
      </form>

      <p class="auth-note">🔒 الباسورد بيتحفظ متشفّر على الجهاز ده.</p>
      <p class="auth-note auth-copy">© <span class="copy-year">2026</span> <strong>Mohamed Mahmoud</strong> — رحلة نجاح. جميع الحقوق محفوظة.</p>
    </div>`;
  document.body.appendChild(gate);
  bindExtraFields("rg");
  $("rgBirth").max = todayStr();

  const showRegister = on => {
    $("loginForm").hidden = on;
    $("registerForm").hidden = !on;
    (on ? $("rgEmail") : $("liEmail")).focus();
  };
  // أول مرة خالص (مفيش ولا حساب) نفتح التسجيل على طول
  showRegister(!loadUsers().length);
  $("toRegister").addEventListener("click", () => showRegister(true));
  $("toLogin").addEventListener("click", () => showRegister(false));
  gate.addEventListener("input", e => e.target.classList.remove("invalid"));

  // --- الدخول ---
  $("loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    const email = $("liEmail").value.trim(), pass = $("liPass").value;
    if (!email || !pass) { $("liError").textContent = "اكتب الإيميل والباسورد"; return; }
    try {
      const u = await verifyLogin(email, pass);
      startSession(u.id);
      location.hash = "";
      location.reload();
    } catch (err) {
      $("liError").textContent = err.message;
    }
  });

  // --- التسجيل ---
  let rgPhoto = null;
  $("rgPhoto").addEventListener("change", async e => {
    const f = e.target.files[0];
    if (!f) return;
    try { rgPhoto = await resizeImageForAuth(f); $("rgAvatar").style.backgroundImage = `url(${rgPhoto})`; $("rgAvatar").textContent = ""; } catch {}
  });

  $("registerForm").addEventListener("submit", async e => {
    e.preventDefault();
    const req = ["rgEmail", "rgPass", "rgPass2", "rgName", "rgBirth", "rgGender", "rgWeight", "rgHeight"];
    let missing = false;
    req.forEach(id => { const bad = !$(id).value.trim(); $(id).classList.toggle("invalid", bad); if (bad) missing = true; });
    if (missing) { $("rgError").textContent = "من فضلك كمّل الخانات المطلوبة (*)"; return; }
    const email = $("rgEmail").value.trim(), pass = $("rgPass").value;
    const weight = parseFloat($("rgWeight").value), height = parseFloat($("rgHeight").value), birth = $("rgBirth").value;
    let err = "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err = "الإيميل مش مكتوب صح"; $("rgEmail").classList.add("invalid"); }
    else if (pass.length < 6) { err = "الباسورد لازم يكون 6 حروف أو أكتر"; $("rgPass").classList.add("invalid"); }
    else if (pass !== $("rgPass2").value) { err = "الباسورد وتأكيده مش زي بعض"; $("rgPass2").classList.add("invalid"); }
    else if (weight < 20 || weight > 300) { err = "الوزن لازم يكون بين 20 و 300 كجم"; $("rgWeight").classList.add("invalid"); }
    else if (height < 80 || height > 250) { err = "الطول لازم يكون بين 80 و 250 سم"; $("rgHeight").classList.add("invalid"); }
    else if (daysBetween(birth, todayStr()) < 365) { err = "تاريخ الميلاد مش منطقي"; $("rgBirth").classList.add("invalid"); }
    if (err) { $("rgError").textContent = err; return; }

    $("rgSubmit").disabled = true;
    try {
      const firstUser = !loadUsers().length;
      const user = await registerUser(email, pass);
      // أول حساب على الجهاز: لو في بيانات قديمة نسأله ينقلها لحسابه
      let migrated = false;
      if (firstUser && legacyKeys().length &&
          confirm("لقينا بيانات متسجلة قبل كده على الجهاز ده (صلوات، أدوية، مهام…).\nتحب تنقلها لحسابك الجديد؟")) {
        migrateLegacyTo(user.id);
        migrated = true;
      }
      const profileData = {
        name: $("rgName").value.trim(), birthDate: birth, gender: $("rgGender").value, email: user.email,
        weight, height, activity: $("rgActivity").value, photo: rgPhoto,
        ...readExtraFields("rg"),
      };
      rawStore.set(userPrefix(user.id) + "profile", JSON.stringify(profileData));
      startSession(user.id);
      // الحساب الجديد يبدأ بإنشاء رحلته على طول (إلا لو نقل رحلة قديمة)
      location.hash = migrated ? "" : "#/journey/new";
      location.reload();
    } catch (ex) {
      $("rgError").textContent = ex.message;
      $("rgSubmit").disabled = false;
    }
  });
}

function resizeImageForAuth(file, size = 256) {
  return new Promise((resolve, reject) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(img.width, img.height), c = document.createElement("canvas");
      c.width = c.height = size;
      c.getContext("2d").drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(); };
    img.src = url;
  });
}

// ================== جزء الحساب في الشريط الجانبي ==================
if (CURRENT_UID) {
  const u = currentUser();
  $("accEmail").textContent = u ? `داخل بـ: ${u.email}` : "";
  $("passForm").addEventListener("submit", async e => {
    e.preventDefault();
    const o = $("pwOld").value, n = $("pwNew").value, n2 = $("pwNew2").value;
    if (!o || !n) { $("pwError").textContent = "اكتب الباسورد الحالي والجديد"; return; }
    if (n.length < 6) { $("pwError").textContent = "الباسورد الجديد لازم يكون 6 حروف أو أكتر"; return; }
    if (n !== n2) { $("pwError").textContent = "الباسورد الجديد وتأكيده مش زي بعض"; return; }
    try {
      await changePassword(o, n);
      $("pwError").textContent = "";
      e.target.reset();
      e.target.closest("details").open = false;
      toast("تم تغيير الباسورد ✓");
    } catch (ex) { $("pwError").textContent = ex.message; }
  });
  $("logoutBtn").addEventListener("click", () => {
    if (confirm("تسجيل الخروج من الحساب؟\nبياناتك هتفضل محفوظة، ولما تدخل تاني هتلاقيها.")) logout();
  });
}