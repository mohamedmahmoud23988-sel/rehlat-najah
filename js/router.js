// التنقل بين الصفحات
// العناوين: #/  —  #/aspect/<جانب>  —  #/aspect/<جانب>/<اختيار>  —  #/aspect/<جانب>/<اختيار>/<اختيار فرعي>

// نوع كل اختيار ← صفحته ودالة عرضها (أي نوع جديد بيتضاف هنا في سطر واحد)
const ITEM_PAGES = [
  { flag: "prayers",  page: "prayerPage",   render: () => renderPrayerPage() },
  { flag: "fasting",  page: "fastPage",     render: () => renderFastPage() },
  { flag: "meds",     page: "medsPage",     render: () => renderMedsPage() },
  { flag: "appts",    page: "apptsPage",    render: () => renderApptsPage() },
  { flag: "exercise", page: "exercisePage", render: () => renderExercisePage() },
  { flag: "diet",     page: "dietPage",     render: () => renderDietPage() },
  { flag: "challenges", page: "challengesPage", render: () => renderChallengesPage() },
  { flag: "affairs",  page: "affairsPage",  render: () => renderAffairsPage() },
  { flag: "smallFamily", page: "smallFamilyPage", render: () => renderSmallFamilyPage() },
  { flag: "projectsHub", page: "projectsHubPage", render: () => renderProjectsHubPage() },
  { flag: "workTasks", page: "workTasksPage", render: () => WORK_TASKS.render() },
  { flag: "business",  page: "businessPage",  render: () => BUSINESS.render() },
  { flag: "skills",    page: "skillsPage",    render: () => renderSkillsPage() },
  { flag: "growth",    page: "growthPage",    render: () => GROWTH.render() },
  { flag: "goalHub",   page: "goalHubPage",   render: () => renderGoalHubPage() },
  { flag: "daily",    page: "itemPage",     render: (a, it) => renderItemPage(a, it) },
];
// الصفحات الفرعية جوه اختيار (زي الممنوعات جوه الحمية)
const SUB_PAGES = {
  "diet/forbidden": { page: "bansPage",  isOn: () => dietSubOn("forbidden"), render: () => renderBansPage() },
  "diet/meals":     { page: "mealsPage", isOn: () => dietSubOn("meals"),     render: () => renderMealsPage() },
  "smallFamily/home": { page: "homeTasksPage", isOn: () => SMALL_FAMILY.subOn("home"), render: () => HOME_TASKS.render() },
  "smallFamily/wifeKids": { page: "wifeKidsPage", isOn: () => SMALL_FAMILY.subOn("wifeKids"), render: () => WIFE_KIDS.render() },
  "projects/projects":    { page: "familyProjectsPage", isOn: () => PROJECTS_HUB.subOn("projects"), render: () => FAMILY_PROJECTS.render() },
  "projects/budgets":     { page: "budgetPage", isOn: () => PROJECTS_HUB.subOn("budgets"), render: () => renderBudgetPage() },
  "goal/yearly":          { page: "yearPlansPage", isOn: () => GOAL_HUB.subOn("yearly"), render: () => renderYearPlansPage() },
  "goal/dream":           { page: "dreamPage", isOn: () => GOAL_HUB.subOn("dream"), render: () => BIG_DREAM.render() },
};
const ALL_PAGES = ["homePage", "aspectPage", "todayPage", "fullDashPage", "journeyPage", "archivePage", ...new Set([...ITEM_PAGES.map(p => p.page), ...Object.values(SUB_PAGES).map(p => p.page)])];

function showPage(id) {
  ALL_PAGES.forEach(p => $(p).classList.toggle("show", p === id));
}

// البرنامج مش بيشتغل غير لما يكون فيه رحلة شغالة ومرحلتها الحالية ليها تواريخ
function journeyReady() {
  const st = journey?.stages?.[journey.current];
  return !!(journey && journey.status === "active" && st?.start && st?.end);
}

function route() {
  const ready = journeyReady();
  document.body.classList.toggle("no-journey", !ready);
  // من غير رحلة: مسموح بس بصفحة الرحلة والأرشيف والرئيسية (اللي فيها "ابدأ رحلتك")
  if (!ready && location.hash && location.hash !== "#/" && !/^#\/(journey|archive)/.test(location.hash)) {
    toast(journey && journey.status === "active" ? "📅 حدد تواريخ المرحلة الحالية الأول" : "🧭 ابدأ رحلتك الأول عشان تقدر تدخل على المهام");
    location.replace("#/");
    return;
  }

  // شاشة مهامي النهارده
  if (location.hash.startsWith("#/today")) {
    showPage("todayPage");
    tdView = null;
    renderTodayPage();
    window.scrollTo(0, 0);
    return;
  }
  // إنشاء / تعديل الرحلة
  if (location.hash.startsWith("#/journey")) {
    showPage("journeyPage");
    renderJourneyPage(location.hash.startsWith("#/journey/new"));
    window.scrollTo(0, 0);
    return;
  }
  // أرشيف المراحل
  if (location.hash.startsWith("#/archive")) {
    showPage("archivePage");
    renderArchivePage();
    window.scrollTo(0, 0);
    return;
  }
  // الداشبورد التفصيلية
  if (location.hash.startsWith("#/dashboard")) {
    showPage("fullDashPage");
    renderFullDash();
    window.scrollTo(0, 0);
    return;
  }
  const m = location.hash.match(/^#\/aspect\/(\w+)(?:\/(\w+))?(?:\/(\w+))?/);
  const aspect = m && ASPECTS.find(a => a.id === m[1]);
  const item = aspect && m[2] && (aspect.items || []).find(i => i.id === m[2]);

  // ما ينفعش ندخل على اختيار مش مفعّل
  if (item && (!isOn(aspect.id, item.id) || !hasPage(item))) {
    location.replace(`#/aspect/${aspect.id}`);
    return;
  }

  if (item && m[3]) {
    const sub = SUB_PAGES[`${item.id}/${m[3]}`];
    if (!sub || !sub.isOn()) { location.replace(`#/aspect/${aspect.id}/${item.id}`); return; }
    showPage(sub.page);
    sub.render();
  } else if (item) {
    const p = ITEM_PAGES.find(x => item[x.flag]);
    showPage(p.page);
    p.render(aspect, item);
  } else if (aspect) {
    showPage("aspectPage");
    renderAspectPage(aspect);
  } else {
    showPage("homePage");
    document.title = "رحلة نجاح";
    if (ready) {
      renderAspects();
      renderDashboard();
      renderTodayCta();
    }
  }
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);

$("backBtn").addEventListener("click", () => { location.hash = "#/"; });
