/* =========================================================
   GLOBAL VARIABLES
========================================================= */
const ADMIN_PIN = "2468";

/* =========================================================
   SIGNATURE PAD INITIALIZATION
========================================================= */
function setupSignaturePad() {
    const canvas = document.getElementById("signaturePad");
    const placeholder = document.getElementById("sigPlaceholder");

    // Fix canvas resolution
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    let drawing = false;

    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function getTouchPos(e) {
        const rect = canvas.getBoundingClientRect();
        const t = e.touches[0];
        return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }

    function draw(e) {
        if (!drawing) return;
        const pos = e.touches ? getTouchPos(e) : getMousePos(e);

        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);

        if (e.touches) e.preventDefault();
    }

    // Mouse Controls
    canvas.addEventListener("mousedown", (e) => {
        drawing = true;
        placeholder.style.display = "none";
        const pos = getMousePos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    });

    canvas.addEventListener("mouseup", () => {
        drawing = false;
        ctx.beginPath();
    });

    canvas.addEventListener("mousemove", draw);

    // Touch Controls
    canvas.addEventListener("touchstart", (e) => {
        drawing = true;
        placeholder.style.display = "none";
        const pos = getTouchPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        e.preventDefault();
    });

    canvas.addEventListener("touchend", () => {
        drawing = false;
        ctx.beginPath();
    });

    canvas.addEventListener("touchmove", draw);

    // Clear Button
    document.getElementById("clearSigBtn").addEventListener("click", () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        placeholder.style.display = "block";
    });
}

/* =========================================================
   COMPANY "OTHER" LOGIC
========================================================= */
document.getElementById("companySelect").addEventListener("change", () => {
    const value = document.getElementById("companySelect").value;
    document.getElementById("otherCompanyWrapper").style.display =
        value === "__OTHER__" ? "block" : "none";
});

/* =========================================================
   REASON "OTHER" LOGIC
========================================================= */
document.getElementById("reasonSelect").addEventListener("change", () => {
    const value = document.getElementById("reasonSelect").value;
    document.getElementById("otherReasonWrapper").style.display =
        value === "other" ? "block" : "none";
});

/* =========================================================
   SERVICES "OTHER" LOGIC
========================================================= */
document.querySelector('input[value="Other"]').addEventListener("change", (e) => {
    document.getElementById("otherServiceWrapper").style.display =
        e.target.checked ? "block" : "none";
});

/* =========================================================
   SUBMIT FORM
========================================================= */
document.getElementById("submitBtn").addEventListener("click", () => {
    const first = document.getElementById("firstName").value.trim();
    const last = document.getElementById("lastName").value.trim();
    const company = document.getElementById("companySelect").value;
    const reason = document.getElementById("reasonSelect").value;

    if (!first || !last) {
        alert("Please enter first and last name.");
        return;
    }

    let finalCompany = company === "__OTHER__"
        ? document.getElementById("otherCompany").value.trim()
        : company;

    let finalReason = reason === "other"
        ? document.getElementById("otherReasonInput").value.trim()
        : reason;

    const services = Array.from(
        document.querySelectorAll('input[name="services"]:checked')
    ).map(cb => cb.value);

    if (services.includes("Other")) {
        const custom = document.getElementById("srvOtherText").value.trim();
        if (custom) services.push(custom);
    }

    // Signature
    const canvas = document.getElementById("signaturePad");
    const signature = canvas.toDataURL();

    const now = new Date();
    const record = {
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        first,
        last,
        company: finalCompany,
        reason: finalReason,
        services: services.join(", "),
        signature
    };

    let logs = JSON.parse(localStorage.getItem("ams_logs") || "[]");
    logs.push(record);
    localStorage.setItem("ams_logs", JSON.stringify(logs));

    alert("Check-in submitted!");
    location.reload();
});

/* =========================================================
   RESET FORM
========================================================= */
document.getElementById("resetFormBtn").addEventListener("click", () => {
    location.reload();
});
/* =========================================================
   ADMIN LOGIN
========================================================= */

document.getElementById("toggleAdminBtn").addEventListener("click", () => {
    const pin = prompt("Enter Admin PIN:");

    if (pin === ADMIN_PIN) {
        // Show admin, hide check-in
        document.getElementById("adminArea").style.display = "block";
        document.getElementById("checkInSection").style.display = "none";
       // ALWAYS hide Search Log panel on admin entry
const searchPanel = document.getElementById("searchPanel");
const searchOverlay = document.getElementById("searchPanelOverlay");

       
        // Load Recent Check-Ins ONCE
        if (!window.__recentLoaded && typeof renderRecentCheckIns === "function") {
            renderRecentCheckIns();
            window.__recentLoaded = true;
        }

        // Default to Recent Check-Ins tab
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        document.querySelector('.tab[data-tab="tabRecent"]').classList.add("active");

        document.querySelectorAll(".tab-content").forEach(c => c.style.display = "none");
        document.getElementById("tabRecent").style.display = "block";


    } else {
        alert("Incorrect PIN");
    }
});
/* =========================================================
   ADMIN TAB NAVIGATION (CLICKABLE SIDEBAR)
========================================================= */
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    const targetId = tab.dataset.tab;

    // ✅ ALWAYS close Search panel when switching tabs
    if (searchPanel) searchPanel.classList.remove("open");
    if (searchOverlay) searchOverlay.style.display = "none";

    // 🔍 Search Log = slide-out panel ONLY
    if (targetId === "tabSearch") {
      if (searchPanel) searchPanel.classList.add("open");
      if (searchOverlay) searchOverlay.style.display = "block";
      return; // ⛔ stop normal tab behavior ONLY for Search
    }

    // normal tab switching continues below (your existing logic)
  });
});




/* =========================================================
   EXIT ADMIN MODE
========================================================= */
document.getElementById("exitAdminBtn").addEventListener("click", () => {
    document.getElementById("adminArea").style.display = "none";
    document.getElementById("checkInSection").style.display = "block";
});

/* =========================================================
   PAGE LOAD
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
    setupSignaturePad();
});

/* =========================================================
   ADMIN TAB CLICK LOGIC — FINAL WORKING VERSION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".tab");
    const contents = document.querySelectorAll(".tab-content");

    console.log("Tabs found:", tabs.length);
    console.log("Content areas found:", contents.length);

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {

            // Remove highlight from all tabs
            tabs.forEach(t => t.classList.remove("active"));

            // Highlight clicked tab
            tab.classList.add("active");

            // Hide all content areas
            contents.forEach(c => c.style.display = "none");

            // Show clicked panel
            const target = tab.getAttribute("data-tab");
            const section = document.getElementById(target);

            if (section) {
                section.style.display = "block";
            }
        });
    });
});
/* =========================================================
   CLEAR SEARCH FORM
========================================================= */
const clearBtn = document.getElementById("btnClearSearch");

if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    // Text inputs
    ["filterFirstName", "filterLastName", "filterCompanyManual"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });

    // Company dropdown
    const companySelect = document.getElementById("filterCompany");
    if (companySelect) companySelect.value = "";
  });
}

/* =========================================================
   SEARCH DATE RANGE — CUSTOM RANGE VISIBILITY
========================================================= */
document.addEventListener("change", (e) => {
  if (e.target && e.target.id === "filterDateRange") {
    const customWrapper = document.getElementById("customDateWrapper");

    if (!customWrapper) return;

    if (e.target.value === "custom") {
      customWrapper.style.display = "block";
    } else {
      customWrapper.style.display = "none";
    }
  }
});
/* ================================
   SEARCH PANEL CLOSE (X BUTTON)
================================ */

const closeSearchBtn = document.getElementById("closeSearchPanel");

if (closeSearchBtn) {
    closeSearchBtn.addEventListener("click", () => {
        if (searchPanel) searchPanel.classList.remove("open");
        if (searchOverlay) searchOverlay.style.display = "none";
    });
}
const searchPanel = document.getElementById("searchPanel");
const searchOverlay = document.getElementById("searchPanelOverlay");
const closeSearchBtn = document.getElementById("closeSearchPanel");

/* CLOSE PANEL */
if (closeSearchBtn) {
    closeSearchBtn.addEventListener("click", () => {
        searchPanel.classList.remove("open");
        searchOverlay.style.display = "none";
    });
}

/* CLOSE BY CLICKING OVERLAY */
if (searchOverlay) {
    searchOverlay.addEventListener("click", () => {
        searchPanel.classList.remove("open");
        searchOverlay.style.display = "none";
    });
}
