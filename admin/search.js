/* =========================================================
   SEARCH LOG MODULE (ADMIN ONLY)
   This file is safe & does NOT modify your main system.
========================================================= */

console.log("Admin Search Module Loaded");

// This function will later handle filters and exporting
function initAdminSearch() {
    console.log("Search module ready");
}

// Load automatically when admin enters the Search tab
document.addEventListener("DOMContentLoaded", () => {
    initAdminSearch();
});
