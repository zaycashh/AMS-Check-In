/* ==========================================
   ADMIN TAB NAVIGATION (SAFE + COMPLETE)
========================================== */

document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".sidebar-menu .tab");
  const contents = document.querySelectorAll(".tab-content");

  function showTab(tabId) {
    // Hide all tab contents
    contents.forEach(c => (c.style.display = "none"));

    // Remove active class from all tabs
    tabs.forEach(t => t.classList.remove("active"));

    // Show selected tab
    const target = document.getElementById(tabId);
    const activeTab = document.querySelector(`.tab[data-tab="${tabId}"]`);

    if (target) target.style.display = "block";
    if (activeTab) activeTab.classList.add("active");

    // ===== INIT MODULES =====

    // Recent Check-Ins
    if (tabId === "tabRecent" && typeof renderRecentCheckIns === "function") {
      renderRecentCheckIns();
    }

    // General Report
    if (tabId === "tabGeneral" && typeof initGeneralReport === "function") {
      initGeneralReport();
    }

    // Manage Companies  ✅ THIS WAS MISSING
    if (tabId === "tabManage" && typeof renderCompanyManager === "function") {
      renderCompanyManager();
    }
  }

  // Bind sidebar clicks
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      showTab(tab.dataset.tab);
    });
  });

  // Default tab on admin open
  showTab("tabRecent");
});
