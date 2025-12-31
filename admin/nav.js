document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".sidebar-menu .tab");
  const contents = document.querySelectorAll(".tab-content");

  function showTab(tabId) {
  console.log("showTab fired →", tabId);

  contents.forEach(c => (c.style.display = "none"));
  tabs.forEach(t => t.classList.remove("active"));

    // show selected tab
    const target = document.getElementById(tabId);
    const activeTab = document.querySelector(`.tab[data-tab="${tabId}"]`);

    if (target) target.style.display = "block";
    if (activeTab) activeTab.classList.add("active");

    // -----------------------------
    // TAB INITIALIZERS (SAFE)
    // -----------------------------

    if (tabId === "tabRecent" && typeof renderRecentCheckIns === "function") {
      renderRecentCheckIns();
    }

    if (tabId === "tabGeneral" && typeof initGeneralReport === "function") {
      initGeneralReport();
    }

    if (tabId === "tabManage" && typeof renderCompanyManager === "function") {
      renderCompanyManager(); // ✅ THIS WAS THE MISSING PIECE
    }
  }

  // bind sidebar clicks
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      showTab(tab.dataset.tab);
    });
  });

  // default tab on admin login
  showTab("tabRecent");
});
