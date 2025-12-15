/* =========================================================
   GLOBAL CONSTANTS
========================================================= */
const ADMIN_PIN = "2468";

/* =========================================================
   ADMIN LOGIN
========================================================= */
document.getElementById("toggleAdminBtn").addEventListener("click", () => {
    const pin = prompt("Enter Admin PIN:");

    if (pin === ADMIN_PIN) {
        // Show admin, hide check-in
        document.getElementById("adminArea").style.display = "block";
        document.getElementById("checkInSection").style.display = "none";

        // Init search button safely
        initRunSearch();

        // Always hide Search Log slide panel
        const searchPanel = document.getElementById("searchPanel");
        const searchOverlay = document.getElementById("searchPanelOverlay");
        if (searchPanel) searchPanel.classList.add("hidden");
        if (searchOverlay) searchOverlay.classList.add("hidden");

        // Load Recent Check-Ins ONCE
        if (!window.__recentLoaded && typeof renderRecentCheckIns === "function") {
            renderRecentCheckIns();
            window.__recentLoaded = true;
        }

        // Default to Recent Check-Ins tab
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        document.querySelector('[data-tab="tabRecent"]')?.classList.add("active");

        document.querySelectorAll(".tab-content").forEach(c => c.style.display = "none");
        document.getElementById("tabRecent").style.display = "block";

    } else {
        alert("Incorrect PIN");
    }
});

/* =========================================================
   STEP 1 — CLEAR FILTERS
========================================================= */
const clearBtn = document.getElementById("clearSearch");
if (clearBtn) {
    clearBtn.addEventListener("click", () => {
        document.getElementById("filterFirstName").value = "";
        document.getElementById("filterLastName").value = "";
        document.getElementById("filterCompany").value = "all";
        document.getElementById("filterDateRange").value = "";

        if (typeof renderRecentCheckIns === "function") {
            renderRecentCheckIns();
        }
    });
}

/* =========================================================
   STEP 2 — RUN SEARCH (SAFE + WORKING)
========================================================= */
function initRunSearch() {
    const runBtn = document.getElementById("runSearch");
    if (!runBtn) return;

    runBtn.onclick = () => {
        const logs = JSON.parse(localStorage.getItem("ams_logs") || "[]");

        const first = document.getElementById("filterFirstName")?.value.toLowerCase() || "";
        const last = document.getElementById("filterLastName")?.value.toLowerCase() || "";
        const company = document.getElementById("filterCompany")?.value || "";

        const filtered = logs.filter(r => (
            (!first || r.first.toLowerCase().includes(first)) &&
            (!last || r.last.toLowerCase().includes(last)) &&
            (!company || company === "all" || r.company === company)
        ));

        // Render results visually
        if (typeof renderRecentCheckIns === "function") {
            renderRecentCheckIns(filtered);
        }

        // Switch to Recent tab automatically
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        document.querySelector('[data-tab="tabRecent"]')?.classList.add("active");

        document.querySelectorAll(".tab-content").forEach(c => c.style.display = "none");
        document.getElementById("tabRecent").style.display = "block";
    };
}

/* =========================================================
   TAB NAVIGATION
========================================================= */
document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
        const targetId = tab.dataset.tab;

        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        document.querySelectorAll(".tab-content").forEach(c => c.style.display = "none");
        document.getElementById(targetId).style.display = "block";
    });
});
