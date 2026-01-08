/* ==========================================
   ADMIN TAB NAVIGATION (SAFE + ISOLATED)
========================================== */

console.log("Admin Nav Module Loaded");

document.addEventListener("DOMContentLoaded", () => {
  const adminNav = document.querySelector(".admin-nav");
  if (!adminNav) {
    console.error("Admin nav container not found");
    return;
  }

  const contents = document.querySelectorAll(".tab-content");

  // ===============================
  // TAB CLICK HANDLER (DELEGATED)
  // ===============================
  adminNav.addEventListener("click", (e) => {
    const tab = e.target.closest(".tab");
    if (!tab) return;

    const targetId = tab.dataset.tab;
    if (!targetId) return;

    // Hide all tab contents
    contents.forEach(c => (c.style.display = "none"));

    // Remove active state from all tabs
    adminNav.querySelectorAll(".tab").forEach(t => {
      t.classList.remove("active");
    });

    // Show selected tab
    const target = document.getElementById(targetId);
    if (!target) {
      console.error("Admin tab not found:", targetId);
      return;
    }

    target.style.display = "block";
    tab.classList.add("active");

    // 🔑 SEARCH LOG
    if (targetId === "tabSearch" && typeof clearSearchTable === "function") {
      clearSearchTable();
    }

    // 🔑 GENERAL REPORT
    if (targetId === "tabGeneral" && typeof initGeneralReport === "function") {
      initGeneralReport();
    }

    // 🔑 RECENT CHECK-INS
    if (targetId === "tabRecent" && typeof renderRecentCheckIns === "function") {
      renderRecentCheckIns();
    }

    // 🔑 MANAGE COMPANIES (FIXED ID)
    if (targetId === "tabCompanies" && typeof renderCompanyManager === "function") {
      renderCompanyManager();
    }
  });

  // ===============================
  // DEFAULT TAB = RECENT CHECK-INS
  // ===============================
  const defaultRecentTab = adminNav.querySelector('.tab[data-tab="tabRecent"]');
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
  } else if (!dropdown.contains(e.target)) {
    dropdown.classList.remove("open");
  }
});
