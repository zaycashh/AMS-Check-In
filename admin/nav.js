/* ==========================================
   ADMIN TAB NAVIGATION (SAFE + ISOLATED)
========================================== */

document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".sidebar-menu .tab");
  const contents = document.querySelectorAll(".tab-content");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const targetId = tab.dataset.tab;

      // Hide all tab contents
      contents.forEach(c => c.style.display = "none");

      // Remove active state
      tabs.forEach(t => t.classList.remove("active"));

      // Show selected tab
      const target = document.getElementById(targetId);
      if (target) {
        target.style.display = "block";
      }

      // ✅ INIT GENERAL
      if (targetId === "tabGeneral") {
        initGeneralReport();
      }

      // ✅ INIT RECENT (THIS WAS MISSING)
      if (targetId === "tabRecent" && typeof renderRecentCheckIns === "function") {
        renderRecentCheckIns();
      } 
       // ✅ INIT MANAGE COMPANIES
if (targetId === "tabManage" && typeof renderCompanyManager === "function") {
  renderCompanyManager();
}

      tab.classList.add("active");
    });
  });
});
// ✅ Default Admin Tab = Recent Check-Ins
const defaultRecentTab = document.querySelector('.tab[data-tab="tabRecent"]');
if (defaultRecentTab) {
  defaultRecentTab.click();
}
