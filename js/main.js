// تشغيل البرنامج (لازم يكون آخر ملف)

// ================== التشغيل ==================
renderHeader();
render();
route();
initSidebar();
renderBackupInfo();
remindBackupIfDue();

// تشغيل البرنامج من غير نت وتثبيته كتطبيق (بيشتغل لما البرنامج يكون مرفوع على النت، مش من ملف على الجهاز)
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

