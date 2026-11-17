// الحسابات وتسجيل الدخول — الملف ده لازم يتحمّل قبل أي حاجة تانية
//
// كل بيانات البرنامج متخزنة بمفاتيح بتبدأ بـ "rehlatNajah."
// الملف ده بيوجّه أي مفتاح منهم تلقائياً لمساحة المستخدم اللي داخل:  rehlatNajah.u.<id>.<المفتاح>
// فكل الشاشات بتشتغل زي ما هي، وكل مستخدم بياناته منفصلة تماماً.
//
// ⚠️ ده تسجيل دخول محلي على الجهاز (بيفصل المستخدمين على نفس الجهاز، والباسورد متشفّر).
//    لما نرفع البرنامج على Firebase هنبدّل الجزء ده بـ Firebase Authentication.

const RN = "rehlatNajah.";
const AUTH_USERS_KEY = RN + "auth.users";     // [{ id, email, salt, hash, iter, createdOn }]
const AUTH_SESSION_KEY = RN + "auth.session"; // { uid, at }

const rawStore = (() => {
  const p = Storage.prototype;
  const g = p.getItem, s = p.setItem, r = p.removeItem, k = p.key;
  return {
    get: key => { try { return g.call(window.localStorage, key); } catch { return null; } },
    set: (key, v) => s.call(window.localStorage, key, v),
    remove: key => { try { r.call(window.localStorage, key); } catch {} },
    keys: () => { const out = []; try { const ls = window.localStorage; for (let i = 0; i < ls.length; i++) out.push(k.call(ls, i)); } catch {} return out; },
    _g: g, _s: s, _r: r,
  };
})();

var CURRENT_UID = (() => {
  try { return JSON.parse(rawStore.get(AUTH_SESSION_KEY))?.uid || null; } catch { return null; }
})();
// لو الجلسة لمستخدم اتمسح، نعتبره مش داخل
if (CURRENT_UID) {
  try {
    const users = JSON.parse(rawStore.get(AUTH_USERS_KEY)) || [];
    if (!users.some(u => u.id === CURRENT_UID)) CURRENT_UID = null;
  } catch { CURRENT_UID = null; }
}

const userPrefix = uid => `${RN}u.${uid}.`;
// المفتاح المنطقي ← المفتاح الحقيقي في مساحة المستخدم (اللي مش داخل بيروح لمساحة مؤقتة "_guest")
function nsKey(key) {
  if (typeof key !== "string" || !key.startsWith(RN) || key.startsWith(RN + "auth.") || key.startsWith(RN + "u.")) return key;
  return userPrefix(CURRENT_UID || "_guest") + key.slice(RN.length);
}
(() => {
  const p = Storage.prototype;
  const isLS = st => { try { return st === window.localStorage; } catch { return false; } };
  p.getItem = function (key) { return rawStore._g.call(this, isLS(this) ? nsKey(key) : key); };
  p.setItem = function (key, v) { return rawStore._s.call(this, isLS(this) ? nsKey(key) : key, v); };
  p.removeItem = function (key) { return rawStore._r.call(this, isLS(this) ? nsKey(key) : key); };
})();

// مفاتيح المستخدم الحالي (بالشكل المنطقي rehlatNajah.xxx) — للنسخة الاحتياطية
function currentUserKeys() {
  const pre = userPrefix(CURRENT_UID || "_guest");
  return rawStore.keys().filter(k => k && k.startsWith(pre)).map(k => RN + k.slice(pre.length));
}

// البيانات القديمة (قبل نظام الحسابات) — عشان أول مستخدم ينقلها لحسابه
function legacyKeys() {
  return rawStore.keys().filter(k => k && k.startsWith(RN) && !k.startsWith(RN + "auth.") && !k.startsWith(RN + "u."));
}

// --- المستخدمين ---
const loadUsers = () => { try { return JSON.parse(rawStore.get(AUTH_USERS_KEY)) || []; } catch { return []; } };
const saveUsers = users => rawStore.set(AUTH_USERS_KEY, JSON.stringify(users));
const findUserByEmail = email => loadUsers().find(u => u.email === String(email).trim().toLowerCase());
const currentUser = () => loadUsers().find(u => u.id === CURRENT_UID) || null;

// --- تشفير الباسورد (PBKDF2 + salt) ---
const toHex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
function randomSalt() {
  const a = new Uint8Array(16);
  (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => { a[i] = Math.floor(Math.random() * 256); });
  return toHex(a);
}
async function hashPassword(password, salt, iter = 120000) {
  if (window.crypto?.subtle) {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: iter, hash: "SHA-256" }, key, 256);
    return toHex(bits);
  }
  // احتياطي لو المتصفح مش بيدعم التشفير (أضعف)
  let h = 2166136261;
  for (const ch of salt + password) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return "fnv" + (h >>> 0).toString(16);
}

async function registerUser(email, password) {
  const users = loadUsers();
  const e = String(email).trim().toLowerCase();
  if (users.some(u => u.email === e)) throw new Error("الإيميل ده متسجّل قبل كده — جرّب تدخل بيه");
  const salt = randomSalt();
  const user = { id: "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), email: e, salt, iter: 120000, hash: await hashPassword(password, salt), createdOn: new Date().toISOString() };
  users.push(user);
  saveUsers(users);
  return user;
}
async function verifyLogin(email, password) {
  const u = findUserByEmail(email);
  if (!u) throw new Error("مفيش حساب بالإيميل ده — لو أول مرة، سجّل حساب جديد");
  if ((await hashPassword(password, u.salt, u.iter)) !== u.hash) throw new Error("الباسورد غلط");
  return u;
}
async function changePassword(oldPw, newPw) {
  const users = loadUsers();
  const u = users.find(x => x.id === CURRENT_UID);
  if (!u) throw new Error("مش داخل بحساب");
  if ((await hashPassword(oldPw, u.salt, u.iter)) !== u.hash) throw new Error("الباسورد الحالي غلط");
  u.salt = randomSalt();
  u.iter = 120000;
  u.hash = await hashPassword(newPw, u.salt);
  saveUsers(users);
}
function changeEmail(newEmail) {
  const users = loadUsers();
  const e = String(newEmail).trim().toLowerCase();
  if (users.some(u => u.email === e && u.id !== CURRENT_UID)) throw new Error("الإيميل ده مستخدم في حساب تاني");
  const u = users.find(x => x.id === CURRENT_UID);
  if (u) { u.email = e; saveUsers(users); }
}

function startSession(uid) { rawStore.set(AUTH_SESSION_KEY, JSON.stringify({ uid, at: new Date().toISOString() })); }
function logout() { rawStore.remove(AUTH_SESSION_KEY); location.hash = ""; location.reload(); }

// نقل البيانات القديمة لحساب مستخدم
function migrateLegacyTo(uid) {
  const pre = userPrefix(uid);
  legacyKeys().forEach(k => {
    const v = rawStore.get(k);
    if (v != null) rawStore.set(pre + k.slice(RN.length), v);
    rawStore.remove(k);
  });
}

// --- استرجاع البيانات القديمة لحساب موجود (مش مستخدم حالياً في الواجهة) ---
const LEGACY_SKIP = ["state", "profile", "sidebarHidden", "backupReminded", "lastBackup"];
// البيانات القديمة المهمة (من غير الإعدادات)
function legacyDataKeys() {
  return legacyKeys().filter(k => !LEGACY_SKIP.includes(k.slice(RN.length)));
}
// stageKey = المرحلة الحالية في الحساب: الاختيارات المفعّلة القديمة بتتجمع فيها
function recoverLegacy(stageKey) {
  const pre = userPrefix(CURRENT_UID);
  const parse = s => { try { return JSON.parse(s) || {}; } catch { return {}; } };
  legacyKeys().forEach(k => {
    const name = k.slice(RN.length);
    const v = rawStore.get(k);
    const target = pre + name;
    const cur = rawStore.get(target);
    if (v == null) { rawStore.remove(k); return; }
    if (name === "toggles" || name === "activations") {
      const old = parse(v), mine = parse(cur);
      const merged = mine[stageKey] || {};
      Object.values(old).forEach(stageObj => {
        for (const [key, val] of Object.entries(stageObj || {})) {
          if (name === "toggles") {
            merged[key] = { ...(val || {}), ...(merged[key] || {}) };
            for (const [it, on] of Object.entries(val || {})) if (on) merged[key][it] = true;
          } else if (!merged[key] || val < merged[key]) merged[key] = val;
        }
      });
      mine[stageKey] = merged;
      rawStore.set(target, JSON.stringify(mine));
    } else if (LEGACY_SKIP.includes(name)) {
      // إعدادات قديمة مش محتاجينها (البروفايل الجديد هو اللي بيفضل)
      if (name === "profile" && cur == null) rawStore.set(target, v);
    } else if (cur == null) {
      rawStore.set(target, v);
    } else {
      // البيانات موجودة في الحساب كمان: الحساب بيكسب، والقديمة بتتحفظ نسخة احتياطية
      rawStore.set(pre + "legacyBackup." + name, v);
    }
    rawStore.remove(k);
  });
}

// قفل البرنامج لحد ما المستخدم يدخل
if (!CURRENT_UID) document.documentElement.classList.add("auth-locked");
