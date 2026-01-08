/* ==========================================
   ADMIN TAB NAVIGATION (SAFE + ISOLATED)
========================================== */

console.log("Admin Nav Module Loaded");

document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".sidebar-menu .tab");
  const contents = document.querySelectorAll(".tab-content");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const targetId = tab.dataset.tab;

      // Hide all tab contents
      contents.forEach(c => (c.style.display = "none"));

      // Remove active state from tabs
      tabs.forEach(t => t.classList.remove("active"));

      // Show selected tab
      const target = document.getElementById(targetId);
      if (!target) {
        console.error("Admin tab not found:", targetId);
        return;
      }

      target.style.display = "block";
      tab.classList.add("active");

      // 🔑 SEARCH LOG (AUTO-RUN)
      if (targetId === "tabSearch") {
  if (typeof clearSearchTable === "function") {
    clearSearchTable();
  }
}
      // 🔑 GENERAL REPORT
      if (targetId === "tabGeneral" && typeof initGeneralReport === "function") {
        initGeneralReport();
      }

      // 🔑 RECENT CHECK-INS
      if (targetId === "tabRecent" && typeof renderRecentCheckIns === "function") {
        renderRecentCheckIns();
      }

      // 🔑 MANAGE COMPANIES
      if (targetId === "tabManage" && typeof renderCompanyManager === "function") {
        renderCompanyManager();
      }
    });
  });

  // ✅ DEFAULT ADMIN TAB = RECENT CHECK-INS
  const defaultRecentTab = document.querySelector('.tab[data-tab="tabRecent"]');
  if (defaultRecentTab) {
    defaultRecentTab.click();
  }
});
// ===============================
// REPORTS DROPDOWN TOGGLE
// ===============================
document.addEventListener("click", (e) => {
  const dropdown = document.querySelector(".admin-dropdown");
  const toggle = document.querySelector(".dropdown-toggle");

  if (!dropdown || !toggle) return;

  if (toggle.contains(e.target)) {
    dropdown.classList.toggle("open");
  } else {
    dropdown.classList.remove("open");
  }
});

