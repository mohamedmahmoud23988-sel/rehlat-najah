// أدوات عامة: التواريخ، العناصر، الرسائل

// ================== التواريخ ==================
// التاريخ بصيغة YYYY-MM-DD حسب توقيت الجهاز
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function toDayNumber(str) {
  const [y, m, d] = str.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}
function daysBetween(a, b) {
  return toDayNumber(b) - toDayNumber(a);
}
function formatDate(str, calendar) {
  const [y, m, d] = str.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const locale = calendar === "hijri" ? "ar-SA-u-ca-islamic-umalqura-nu-latn" : "ar-EG-u-nu-latn";
  const opts = calendar === "hijri"
    ? { day: "numeric", month: "long", year: "numeric" }
    : { weekday: "long", day: "numeric", month: "long", year: "numeric" };
  return new Intl.DateTimeFormat(locale, opts).format(date);
}

// ================== العناصر ==================
const $ = id => document.getElementById(id);

function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove("show"), 2500);
}


function addDays(str, n) {
  return new Date((toDayNumber(str) + n) * 86400000).toISOString().slice(0, 10);
}

const dayName = str => new Intl.DateTimeFormat("ar-EG", { weekday: "long" }).format(new Date(toDayNumber(str) * 86400000 + 12 * 3600000));

function celebrate(emoji, msg) {
  $("celEmoji").textContent = emoji;
  $("celMsg").textContent = msg;
  $("celebrate").classList.add("open");
}
$("celClose").addEventListener("click", () => $("celebrate").classList.remove("open"));
$("celebrate").addEventListener("click", e => { if (e.target.id === "celebrate") $("celebrate").classList.remove("open"); });


// تأمين النصوص اللي المستخدم بيكتبها قبل ما تتعرض في الصفحة
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}