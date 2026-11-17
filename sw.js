// تشغيل البرنامج من غير نت + تثبيته كتطبيق
// كل ما نعدّل في البرنامج بنغيّر رقم النسخة، فالموبايل ينزّل الجديد لوحده
const VERSION = "rehlat-najah-20261117-1803";
const FILES = [
  "./",
  "index.html",
  "manifest.json",
  "css/appointments.css",
  "css/aspect.css",
  "css/auth.css",
  "css/base.css",
  "css/budget.css",
  "css/challenges.css",
  "css/daily.css",
  "css/diet.css",
  "css/exercise.css",
  "css/fasting.css",
  "css/fulldash.css",
  "css/home.css",
  "css/journey.css",
  "css/meals.css",
  "css/meds.css",
  "css/prayer.css",
  "css/profile.css",
  "css/responsive.css",
  "css/skills.css",
  "css/today.css",
  "css/weight.css",
  "icons/apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "js/aspect-page.js",
  "js/auth-ui.js",
  "js/backup.js",
  "js/config.js",
  "js/core.js",
  "js/dashboard.js",
  "js/home.js",
  "js/main.js",
  "js/open-list.js",
  "js/pages/affairs.js",
  "js/pages/appointments.js",
  "js/pages/budget.js",
  "js/pages/challenges.js",
  "js/pages/daily.js",
  "js/pages/diet.js",
  "js/pages/exercise.js",
  "js/pages/fasting.js",
  "js/pages/fulldash.js",
  "js/pages/goals.js",
  "js/pages/journey.js",
  "js/pages/meals.js",
  "js/pages/meds.js",
  "js/pages/prayer.js",
  "js/pages/skills.js",
  "js/pages/today.js",
  "js/pages/work.js",
  "js/profile.js",
  "js/profile-extra.js",
  "js/router.js",
  "js/session.js",
  "js/session-tracker.js",
  "js/store.js",
  "js/weight.js",
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// الملفات من الذاكرة الأول (سريع ومن غير نت)، ومع وجود نت بنحدّثها في الخلفية
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.open(VERSION).then(async cache => {
      const cached = await cache.match(e.request, { ignoreSearch: true });
      const net = fetch(e.request).then(res => {
        if (res && (res.ok || res.type === "opaque")) cache.put(e.request, res.clone());
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});