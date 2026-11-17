// تشغيل البرنامج (لازم يكون آخر ملف)

// ================== التشغيل ==================
renderHeader();
render();
route();
initSidebar();
renderBackupInfo();
remindBackupIfDue();

// سنة حقوق الملكية: 2026، ولو عدّت السنة بتبقى "2026–السنة الحالية"
document.querySelectorAll(".copy-year").forEach(el => {
  const y = new Date().getFullYear();
  el.textContent = y > 2026 ? `2026–${y}` : "2026";
});

// تشغيل البرنامج من غير نت وتثبيته كتطبيق (بيشتغل لما البرنامج يكون مرفوع على النت، مش من ملف على الجهاز)
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

