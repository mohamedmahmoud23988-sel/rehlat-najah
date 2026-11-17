// النسخة الاحتياطية: حفظ كل البيانات في ملف واسترجاعها

const BACKUP_PREFIX = "rehlatNajah.";
const LAST_BACKUP_KEY = "rehlatNajah.lastBackup";
const BACKUP_REMIND_KEY = "rehlatNajah.backupReminded";
const BACKUP_EVERY_DAYS = 7;
// المفاتيح دي خاصة بالجهاز نفسه ومش بتتنقل مع النسخة
const DEVICE_ONLY_KEYS = [LAST_BACKUP_KEY, BACKUP_REMIND_KEY, "rehlatNajah.sidebarHidden"];

// مفاتيح المستخدم اللي داخل بس (كل حساب نسخته لوحده)
function appKeys() {
  return currentUserKeys().filter(k => !DEVICE_ONLY_KEYS.includes(k));
}

function lastBackupDate() {
  try { return localStorage.getItem(LAST_BACKUP_KEY); } catch { return null; }
}

function backupIsDue() {
  if (!appKeys().length) return false; // لسه مفيش بيانات
  const last = lastBackupDate();
  return !last || daysBetween(last, todayStr()) >= BACKUP_EVERY_DAYS;
}

function renderBackupInfo() {
  const el = $("backupInfo");
  const last = lastBackupDate();
  if (!last) {
    el.textContent = "لسه ما عملتش نسخة احتياطية. بياناتك محفوظة على الجهاز ده بس.";
  } else {
    const ago = daysBetween(last, todayStr());
    const when = ago === 0 ? "النهارده" : ago === 1 ? "إمبارح" : `من ${ago} أيام`;
    el.textContent = `آخر نسخة احتياطية: ${when} (${formatDate(last)})`;
  }
  el.classList.toggle("warn", backupIsDue());
}

function exportBackup() {
  const data = {};
  appKeys().forEach(k => { data[k] = localStorage.getItem(k); });
  const payload = {
    app: "rehlat-najah",
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `rehlat-najah-backup-${todayStr()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);

  try { localStorage.setItem(LAST_BACKUP_KEY, todayStr()); } catch {}
  renderBackupInfo();
  toast("تم حفظ النسخة الاحتياطية 💾 احتفظ بالملف في مكان آمن");
}

function importBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    let payload;
    try { payload = JSON.parse(reader.result); } catch { payload = null; }
    if (!payload || payload.app !== "rehlat-najah" || typeof payload.data !== "object") {
      toast("الملف ده مش نسخة احتياطية من رحلة نجاح");
      return;
    }
    const when = payload.exportedAt ? formatDate(payload.exportedAt.slice(0, 10)) : "تاريخ غير معروف";
    if (!confirm(`استرجاع النسخة هيستبدل كل بياناتك الحالية ببيانات النسخة اللي اتعملت يوم ${when}.\n\nمتأكد؟`)) return;

    try {
      appKeys().forEach(k => localStorage.removeItem(k));
      Object.entries(payload.data).forEach(([k, v]) => {
        if (k.startsWith(BACKUP_PREFIX) && typeof v === "string") localStorage.setItem(k, v);
      });
      localStorage.setItem(LAST_BACKUP_KEY, todayStr());
    } catch {
      toast("حصلت مشكلة في الاسترجاع، جرّب تاني");
      return;
    }
    toast("تم استرجاع النسخة ✓ جاري إعادة التحميل…");
    setTimeout(() => location.reload(), 900);
  };
  reader.readAsText(file);
}

// تذكير مرة واحدة في اليوم لو بقالك أسبوع من غير نسخة
function remindBackupIfDue() {
  if (!backupIsDue()) return;
  try {
    if (localStorage.getItem(BACKUP_REMIND_KEY) === todayStr()) return;
    localStorage.setItem(BACKUP_REMIND_KEY, todayStr());
  } catch {}
  setTimeout(() => toast("💾 متنساش تعمل نسخة احتياطية من البروفايل"), 1500);
}

$("exportBtn").addEventListener("click", exportBackup);
$("importInput").addEventListener("change", e => {
  const file = e.target.files[0];
  if (file) importBackup(file);
  e.target.value = "";
});
