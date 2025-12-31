document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".sidebar-menu .tab");
  const contents = document.querySelectorAll(".tab-content");

  function hideAll() {
    contents.forEach(c => (c.style.display = "none"));
    tabs.forEach(t => t.classList.remove("active"));
  }

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const targetId = tab.dataset.tab;
      const target = document.getElementById(targetId);

      hideAll();

      if (target) {
        target.style.display = "block";
        tab.classList.add("active");
      }

      // Init modules safely
      if (targetId === "tabRecent" && typeof renderRecentCheckIns === "function") {
        renderRecentCheckIns();
      }

      if (targetId === "tabGeneral" && typeof initGeneralReport === "function") {
        initGeneralReport();
      }

      if (targetId === "tabManage" && typeof renderCompanyManager === "function") {
        renderCompanyManager();
      }
    });
  });

  // Default tab → Recent
  const defaultTab = document.querySelector('.tab[data-tab="tabRecent"]');
  if (defaultTab) defaultTab.click();
});
