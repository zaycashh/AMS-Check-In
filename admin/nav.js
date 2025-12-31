document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".sidebar-menu .tab");
  const contents = document.querySelectorAll(".tab-content");

  function showTab(tabId) {
    // hide all
    contents.forEach(c => (c.style.display = "none"));
    tabs.forEach(t => t.classList.remove("active"));

    // show selected
    const target = document.getElementById(tabId);
    const activeTab = document.querySelector(`.tab[data-tab="${tabId}"]`);

    if (target) target.style.display = "block";
    if (activeTab) activeTab.classList.add("active");

    // optional initializers
    if (tabId === "tabRecent" && typeof renderRecentCheckIns === "function") {
      renderRecentCheckIns();
    }
    if (tabId === "tabGeneral" && typeof initGeneralReport === "function") {
      initGeneralReport();
    }
  }

  // bind clicks
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      showTab(tab.dataset.tab);
    });
  });

  // default tab
  showTab("tabRecent");
});
